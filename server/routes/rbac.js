/**
 * RBAC 权限管理系统 API
 * 功能：角色管理、权限管理、组织架构、操作审计
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// JWT认证中间件
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: '未提供访问令牌' });
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return res.status(403).json({ message: '令牌无效或已过期' });
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ message: '认证失败', error: error.message });
    }
};

// 权限检查中间件
const checkPermission = (resource, action) => {
    return async (req, res, next) => {
        try {
            const hasPermission = await checkUserPermission(req.user.id, resource, action);
            if (!hasPermission) {
                return res.status(403).json({ 
                    message: '权限不足',
                    required: `${resource}:${action}`
                });
            }
            next();
        } catch (error) {
            res.status(500).json({ message: '权限检查失败', error: error.message });
        }
    };
};

// ==================== 角色管理 ====================

// 获取角色列表
router.get('/roles', authenticateToken, checkPermission('rbac', 'read'), async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const { data, error, count } = await supabase
            .from('rbac_roles')
            .select('*, permissions:rbac_role_permissions(permission:rbac_permissions(*))', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.json({
            roles: data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: '获取角色列表失败', error: error.message });
    }
});

// 创建角色
router.post('/roles', authenticateToken, checkPermission('rbac', 'create'), async (req, res) => {
    const { name, code, description, permission_ids = [], data_scope = 'all' } = req.body;

    try {
        // 检查角色编码是否已存在
        const { data: existing } = await supabase
            .from('rbac_roles')
            .select('id')
            .eq('code', code)
            .single();

        if (existing) {
            return res.status(400).json({ message: '角色编码已存在' });
        }

        // 创建角色
        const { data: role, error: roleError } = await supabase
            .from('rbac_roles')
            .insert({
                name,
                code,
                description,
                data_scope,
                created_by: req.user.id
            })
            .select()
            .single();

        if (roleError) throw roleError;

        // 关联权限
        if (permission_ids.length > 0) {
            const rolePermissions = permission_ids.map(pid => ({
                role_id: role.id,
                permission_id: pid
            }));

            await supabase.from('rbac_role_permissions').insert(rolePermissions);
        }

        // 记录审计日志
        await logAudit(req.user.id, 'create_role', 'rbac_roles', role.id, { name, code, permission_ids });

        res.status(201).json({ message: '角色创建成功', data: role });
    } catch (error) {
        res.status(500).json({ message: '创建角色失败', error: error.message });
    }
});

// 更新角色
router.put('/roles/:id', authenticateToken, checkPermission('rbac', 'update'), async (req, res) => {
    const { id } = req.params;
    const { name, description, permission_ids, data_scope, is_active } = req.body;

    try {
        // 更新角色信息
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (data_scope !== undefined) updates.data_scope = data_scope;
        if (is_active !== undefined) updates.is_active = is_active;

        const { data: role, error } = await supabase
            .from('rbac_roles')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // 更新权限关联
        if (permission_ids !== undefined) {
            // 删除旧权限
            await supabase.from('rbac_role_permissions').delete().eq('role_id', id);

            // 添加新权限
            if (permission_ids.length > 0) {
                const rolePermissions = permission_ids.map(pid => ({
                    role_id: id,
                    permission_id: pid
                }));
                await supabase.from('rbac_role_permissions').insert(rolePermissions);
            }
        }

        await logAudit(req.user.id, 'update_role', 'rbac_roles', id, updates);

        res.json({ message: '角色更新成功', data: role });
    } catch (error) {
        res.status(500).json({ message: '更新角色失败', error: error.message });
    }
});

// 删除角色
router.delete('/roles/:id', authenticateToken, checkPermission('rbac', 'delete'), async (req, res) => {
    const { id } = req.params;

    try {
        // 检查是否有用户使用该角色
        const { data: users } = await supabase
            .from('rbac_user_roles')
            .select('id')
            .eq('role_id', id)
            .limit(1);

        if (users && users.length > 0) {
            return res.status(400).json({ message: '该角色已被用户关联，无法删除' });
        }

        await supabase.from('rbac_role_permissions').delete().eq('role_id', id);
        await supabase.from('rbac_roles').delete().eq('id', id);

        await logAudit(req.user.id, 'delete_role', 'rbac_roles', id, {});

        res.json({ message: '角色删除成功' });
    } catch (error) {
        res.status(500).json({ message: '删除角色失败', error: error.message });
    }
});

// ==================== 权限管理 ====================

// 获取权限列表
router.get('/permissions', authenticateToken, checkPermission('rbac', 'read'), async (req, res) => {
    const { module } = req.query;

    try {
        let query = supabase.from('rbac_permissions').select('*');
        
        if (module) {
            query = query.eq('module', module);
        }

        const { data, error } = await query.order('module').order('name');

        if (error) throw error;

        // 按模块分组
        const grouped = data.reduce((acc, perm) => {
            if (!acc[perm.module]) {
                acc[perm.module] = [];
            }
            acc[perm.module].push(perm);
            return acc;
        }, {});

        res.json({ permissions: data, grouped });
    } catch (error) {
        res.status(500).json({ message: '获取权限列表失败', error: error.message });
    }
});

// 创建权限
router.post('/permissions', authenticateToken, checkPermission('rbac', 'create'), async (req, res) => {
    const { name, code, module, description, resource, action } = req.body;

    try {
        const { data, error } = await supabase
            .from('rbac_permissions')
            .insert({ name, code, module, description, resource, action })
            .select()
            .single();

        if (error) throw error;

        await logAudit(req.user.id, 'create_permission', 'rbac_permissions', data.id, { name, code });

        res.status(201).json({ message: '权限创建成功', data });
    } catch (error) {
        res.status(500).json({ message: '创建权限失败', error: error.message });
    }
});

// ==================== 组织架构 ====================

// 获取部门列表
router.get('/departments', authenticateToken, checkPermission('department', 'read'), async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('departments')
            .select('*, parent:parent_id(id, name), manager:manager_id(id, username, nickname)')
            .order('sort_order');

        if (error) throw error;

        // 构建树形结构
        const tree = buildDepartmentTree(data);

        res.json({ departments: data, tree });
    } catch (error) {
        res.status(500).json({ message: '获取部门列表失败', error: error.message });
    }
});

// 创建部门
router.post('/departments', authenticateToken, checkPermission('department', 'create'), async (req, res) => {
    const { name, code, parent_id, manager_id, description, sort_order = 0 } = req.body;

    try {
        const { data, error } = await supabase
            .from('departments')
            .insert({
                name,
                code,
                parent_id,
                manager_id,
                description,
                sort_order
            })
            .select()
            .single();

        if (error) throw error;

        await logAudit(req.user.id, 'create_department', 'departments', data.id, { name, code });

        res.status(201).json({ message: '部门创建成功', data });
    } catch (error) {
        res.status(500).json({ message: '创建部门失败', error: error.message });
    }
});

// 更新部门
router.put('/departments/:id', authenticateToken, checkPermission('department', 'update'), async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        const { data, error } = await supabase
            .from('departments')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        await logAudit(req.user.id, 'update_department', 'departments', id, updates);

        res.json({ message: '部门更新成功', data });
    } catch (error) {
        res.status(500).json({ message: '更新部门失败', error: error.message });
    }
});

// 删除部门
router.delete('/departments/:id', authenticateToken, checkPermission('department', 'delete'), async (req, res) => {
    const { id } = req.params;

    try {
        // 检查是否有子部门
        const { data: children } = await supabase
            .from('departments')
            .select('id')
            .eq('parent_id', id)
            .limit(1);

        if (children && children.length > 0) {
            return res.status(400).json({ message: '该部门下有子部门，无法删除' });
        }

        await supabase.from('departments').delete().eq('id', id);

        await logAudit(req.user.id, 'delete_department', 'departments', id, {});

        res.json({ message: '部门删除成功' });
    } catch (error) {
        res.status(500).json({ message: '删除部门失败', error: error.message });
    }
});

// ==================== 用户角色管理 ====================

// 获取用户角色
router.get('/users/:userId/roles', authenticateToken, checkPermission('rbac', 'read'), async (req, res) => {
    const { userId } = req.params;

    try {
        const { data, error } = await supabase
            .from('rbac_user_roles')
            .select('*, role:rbac_roles(*)')
            .eq('user_id', userId);

        if (error) throw error;

        res.json({ roles: data.map(r => r.role) });
    } catch (error) {
        res.status(500).json({ message: '获取用户角色失败', error: error.message });
    }
});

// 分配用户角色
router.post('/users/:userId/roles', authenticateToken, checkPermission('rbac', 'update'), async (req, res) => {
    const { userId } = req.params;
    const { role_ids } = req.body;

    try {
        // 删除现有角色
        await supabase.from('rbac_user_roles').delete().eq('user_id', userId);

        // 添加新角色
        if (role_ids && role_ids.length > 0) {
            const userRoles = role_ids.map(roleId => ({
                user_id: userId,
                role_id: roleId
            }));

            await supabase.from('rbac_user_roles').insert(userRoles);
        }

        await logAudit(req.user.id, 'assign_roles', 'rbac_user_roles', userId, { role_ids });

        res.json({ message: '角色分配成功' });
    } catch (error) {
        res.status(500).json({ message: '分配角色失败', error: error.message });
    }
});

// ==================== 审计日志 ====================

// 获取审计日志
router.get('/audit-logs', authenticateToken, checkPermission('audit', 'read'), async (req, res) => {
    const { 
        user_id, 
        action, 
        resource, 
        start_date, 
        end_date, 
        page = 1, 
        limit = 20 
    } = req.query;
    
    const offset = (page - 1) * limit;

    try {
        let query = supabase
            .from('audit_logs')
            .select('*, user:user_profiles(id, username, nickname)', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (user_id) query = query.eq('user_id', user_id);
        if (action) query = query.eq('action', action);
        if (resource) query = query.eq('resource', resource);
        if (start_date) query = query.gte('created_at', start_date);
        if (end_date) query = query.lte('created_at', end_date);

        const { data, error, count } = await query.range(offset, offset + limit - 1);

        if (error) throw error;

        res.json({
            logs: data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: '获取审计日志失败', error: error.message });
    }
});

// 获取审计统计
router.get('/audit-stats', authenticateToken, checkPermission('audit', 'read'), async (req, res) => {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    try {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('action, created_at')
            .gte('created_at', startDate.toISOString());

        if (error) throw error;

        // 按操作类型统计
        const actionStats = data.reduce((acc, log) => {
            acc[log.action] = (acc[log.action] || 0) + 1;
            return acc;
        }, {});

        // 按日期统计
        const dateStats = data.reduce((acc, log) => {
            const date = log.created_at.split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});

        res.json({
            total: data.length,
            action_stats: actionStats,
            date_stats: dateStats
        });
    } catch (error) {
        res.status(500).json({ message: '获取审计统计失败', error: error.message });
    }
});

// ==================== 辅助函数 ====================

async function checkUserPermission(userId, resource, action) {
    // 获取用户所有角色的权限
    const { data: permissions } = await supabase
        .from('rbac_user_roles')
        .select('role:rbac_roles(permissions:rbac_role_permissions(permission:rbac_permissions(*)))')
        .eq('user_id', userId)
        .eq('role.is_active', true);

    if (!permissions) return false;

    // 检查是否有匹配的权限
    for (const userRole of permissions) {
        for (const rp of userRole.role.permissions || []) {
            const perm = rp.permission;
            if (perm.resource === resource && perm.action === action) {
                return true;
            }
            // 通配符权限
            if (perm.resource === '*' && perm.action === '*') {
                return true;
            }
            if (perm.resource === resource && perm.action === '*') {
                return true;
            }
        }
    }

    return false;
}

function buildDepartmentTree(departments, parentId = null) {
    return departments
        .filter(dept => dept.parent_id === parentId)
        .map(dept => ({
            ...dept,
            children: buildDepartmentTree(departments, dept.id)
        }));
}

async function logAudit(userId, action, resource, resourceId, details) {
    try {
        await supabase.from('audit_logs').insert({
            user_id: userId,
            action,
            resource,
            resource_id: resourceId,
            details,
            ip_address: null, // 从请求中获取
            user_agent: null  // 从请求中获取
        });
    } catch (error) {
        console.error('审计日志记录失败:', error);
    }
}

module.exports = { router, checkPermission };
