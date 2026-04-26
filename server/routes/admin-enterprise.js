/**
 * 企业级后台管理系统 API
 * 功能：可视化数据大屏、内容审核、批量操作、系统配置
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

// 检查管理员权限
const requireAdmin = async (req, res, next) => {
    try {
        const { data: userData, error } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', req.user.id)
            .single();

        if (error || !userData || !['admin', 'super_admin'].includes(userData.role)) {
            return res.status(403).json({ message: '需要管理员权限' });
        }
        req.userRole = userData.role;
        next();
    } catch (error) {
        res.status(500).json({ message: '权限检查失败', error: error.message });
    }
};

// ==================== 可视化数据大屏 ====================

// 获取实时大盘数据
router.get('/dashboard/realtime', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [
            userStats,
            contentStats,
            interactionStats,
            commerceStats,
            systemStats
        ] = await Promise.all([
            // 用户统计
            supabase.rpc('get_realtime_user_stats'),
            // 内容统计
            supabase.rpc('get_realtime_content_stats'),
            // 互动统计
            supabase.rpc('get_realtime_interaction_stats'),
            // 电商统计
            supabase.rpc('get_realtime_commerce_stats'),
            // 系统统计
            getSystemStats()
        ]);

        res.json({
            timestamp: new Date().toISOString(),
            users: userStats.data || {},
            content: contentStats.data || {},
            interactions: interactionStats.data || {},
            commerce: commerceStats.data || {},
            system: systemStats
        });
    } catch (error) {
        res.status(500).json({ message: '获取实时数据失败', error: error.message });
    }
});

// 获取趋势数据
router.get('/dashboard/trends', authenticateToken, requireAdmin, async (req, res) => {
    const { days = 30, metric = 'users' } = req.query;
    
    try {
        let data;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        switch (metric) {
            case 'users':
                data = await getUserTrends(startDate);
                break;
            case 'content':
                data = await getContentTrends(startDate);
                break;
            case 'revenue':
                data = await getRevenueTrends(startDate);
                break;
            case 'traffic':
                data = await getTrafficTrends(startDate);
                break;
            default:
                return res.status(400).json({ message: '未知的指标类型' });
        }

        res.json({
            metric,
            period: `${days}days`,
            data
        });
    } catch (error) {
        res.status(500).json({ message: '获取趋势数据失败', error: error.message });
    }
});

// 获取地域分布数据
router.get('/dashboard/geo', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { data: geoData, error } = await supabase
            .from('user_geo_stats')
            .select('*')
            .order('user_count', { ascending: false })
            .limit(100);

        if (error) throw error;

        // 按省份聚合
        const provinceStats = {};
        geoData.forEach(item => {
            if (!provinceStats[item.province]) {
                provinceStats[item.province] = {
                    province: item.province,
                    user_count: 0,
                    cities: []
                };
            }
            provinceStats[item.province].user_count += item.user_count;
            provinceStats[item.province].cities.push({
                city: item.city,
                user_count: item.user_count
            });
        });

        res.json({
            provinces: Object.values(provinceStats),
            total: geoData.reduce((sum, item) => sum + item.user_count, 0)
        });
    } catch (error) {
        res.status(500).json({ message: '获取地域数据失败', error: error.message });
    }
});

// 获取设备分布数据
router.get('/dashboard/devices', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('device_stats')
            .select('*')
            .order('count', { ascending: false });

        if (error) throw error;

        const deviceTypes = { desktop: 0, mobile: 0, tablet: 0 };
        const browsers = {};
        const os = {};

        data.forEach(item => {
            deviceTypes[item.device_type] = (deviceTypes[item.device_type] || 0) + item.count;
            browsers[item.browser] = (browsers[item.browser] || 0) + item.count;
            os[item.os] = (os[item.os] || 0) + item.count;
        });

        res.json({
            deviceTypes,
            browsers: Object.entries(browsers).map(([name, value]) => ({ name, value })),
            os: Object.entries(os).map(([name, value]) => ({ name, value }))
        });
    } catch (error) {
        res.status(500).json({ message: '获取设备数据失败', error: error.message });
    }
});

// ==================== 内容审核工作流 ====================

// 获取待审核内容列表
router.get('/moderation/pending', authenticateToken, requireAdmin, async (req, res) => {
    const { type = 'all', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    try {
        let query = supabase
            .from('content_moderation')
            .select(`
                *,
                author:user_profiles(id, username, nickname, avatar),
                content_article:articles(id, title, content, created_at),
                content_comment:comments(id, content, article_id, created_at)
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: true });

        if (type !== 'all') {
            query = query.eq('content_type', type);
        }

        const { data, error, count } = await query
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.json({
            items: data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: '获取待审核内容失败', error: error.message });
    }
});

// 审核内容
router.post('/moderation/:id/review', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { action, reason, auto_apply = false } = req.body;

    try {
        // 获取审核记录
        const { data: moderation, error: fetchError } = await supabase
            .from('content_moderation')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !moderation) {
            return res.status(404).json({ message: '审核记录不存在' });
        }

        // 更新审核状态
        const { data: updated, error: updateError } = await supabase
            .from('content_moderation')
            .update({
                status: action === 'approve' ? 'approved' : 'rejected',
                reviewer_id: req.user.id,
                review_reason: reason,
                reviewed_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        // 自动应用到原内容
        if (auto_apply) {
            await applyModerationResult(moderation, action);
        }

        // 记录审核日志
        await supabase.from('moderation_logs').insert({
            moderation_id: id,
            reviewer_id: req.user.id,
            action,
            reason,
            content_type: moderation.content_type,
            content_id: moderation.content_id
        });

        res.json({
            message: action === 'approve' ? '内容已通过审核' : '内容已被拒绝',
            data: updated
        });
    } catch (error) {
        res.status(500).json({ message: '审核操作失败', error: error.message });
    }
});

// 批量审核
router.post('/moderation/batch-review', authenticateToken, requireAdmin, async (req, res) => {
    const { ids, action, reason, auto_apply = false } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: '请提供要审核的内容ID列表' });
    }

    try {
        const results = {
            success: [],
            failed: []
        };

        for (const id of ids) {
            try {
                const { data: moderation } = await supabase
                    .from('content_moderation')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (!moderation) {
                    results.failed.push({ id, reason: '记录不存在' });
                    continue;
                }

                await supabase
                    .from('content_moderation')
                    .update({
                        status: action === 'approve' ? 'approved' : 'rejected',
                        reviewer_id: req.user.id,
                        review_reason: reason,
                        reviewed_at: new Date().toISOString()
                    })
                    .eq('id', id);

                if (auto_apply) {
                    await applyModerationResult(moderation, action);
                }

                results.success.push(id);
            } catch (err) {
                results.failed.push({ id, reason: err.message });
            }
        }

        res.json({
            message: `批量审核完成：成功 ${results.success.length} 条，失败 ${results.failed.length} 条`,
            results
        });
    } catch (error) {
        res.status(500).json({ message: '批量审核失败', error: error.message });
    }
});

// 获取审核规则
router.get('/moderation/rules', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('moderation_rules')
            .select('*')
            .order('priority', { ascending: false });

        if (error) throw error;

        res.json({ rules: data });
    } catch (error) {
        res.status(500).json({ message: '获取审核规则失败', error: error.message });
    }
});

// 更新审核规则
router.put('/moderation/rules/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        const { data, error } = await supabase
            .from('moderation_rules')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ message: '规则更新成功', data });
    } catch (error) {
        res.status(500).json({ message: '更新规则失败', error: error.message });
    }
});

// ==================== 批量操作工具 ====================

// 批量操作接口
router.post('/batch/:action', authenticateToken, requireAdmin, async (req, res) => {
    const { action } = req.params;
    const { target, ids, options = {} } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: '请提供要操作的项目ID列表' });
    }

    try {
        let result;
        switch (action) {
            case 'delete':
                result = await batchDelete(target, ids);
                break;
            case 'update':
                result = await batchUpdate(target, ids, options);
                break;
            case 'export':
                result = await batchExport(target, ids, options);
                break;
            case 'move':
                result = await batchMove(target, ids, options);
                break;
            case 'tag':
                result = await batchTag(target, ids, options);
                break;
            default:
                return res.status(400).json({ message: '未知的批量操作类型' });
        }

        // 记录批量操作日志
        await supabase.from('batch_operation_logs').insert({
            operator_id: req.user.id,
            action,
            target,
            item_count: ids.length,
            options,
            result: {
                success_count: result.success?.length || 0,
                failed_count: result.failed?.length || 0
            }
        });

        res.json({
            message: `批量${getActionName(action)}完成`,
            result
        });
    } catch (error) {
        res.status(500).json({ message: '批量操作失败', error: error.message });
    }
});

// 获取批量任务列表
router.get('/batch/tasks', authenticateToken, requireAdmin, async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const { data, error, count } = await supabase
            .from('batch_operation_logs')
            .select(`
                *,
                operator:user_profiles(id, username, nickname)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.json({
            tasks: data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: '获取任务列表失败', error: error.message });
    }
});

// ==================== 系统配置中心 ====================

// 获取系统配置
router.get('/config', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('system_config')
            .select('*');

        if (error) throw error;

        // 按模块分组
        const config = {};
        data.forEach(item => {
            if (!config[item.module]) {
                config[item.module] = {};
            }
            config[item.module][item.key] = {
                value: item.value,
                description: item.description,
                updated_at: item.updated_at
            };
        });

        res.json({ config });
    } catch (error) {
        res.status(500).json({ message: '获取系统配置失败', error: error.message });
    }
});

// 更新系统配置
router.put('/config/:module/:key', authenticateToken, requireAdmin, async (req, res) => {
    const { module, key } = req.params;
    const { value, description } = req.body;

    try {
        const { data, error } = await supabase
            .from('system_config')
            .upsert({
                module,
                key,
                value,
                description,
                updated_by: req.user.id,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        // 记录配置变更日志
        await supabase.from('config_change_logs').insert({
            module,
            key,
            old_value: null, // 可以从历史记录获取
            new_value: value,
            changed_by: req.user.id
        });

        res.json({ message: '配置更新成功', data });
    } catch (error) {
        res.status(500).json({ message: '更新配置失败', error: error.message });
    }
});

// 获取配置变更历史
router.get('/config/history', authenticateToken, requireAdmin, async (req, res) => {
    const { module, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    try {
        let query = supabase
            .from('config_change_logs')
            .select(`
                *,
                changed_by_user:user_profiles(id, username, nickname)
            `, { count: 'exact' })
            .order('created_at', { ascending: false });

        if (module) {
            query = query.eq('module', module);
        }

        const { data, error, count } = await query.range(offset, offset + limit - 1);

        if (error) throw error;

        res.json({
            history: data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: '获取配置历史失败', error: error.message });
    }
});

// 获取站点信息
router.get('/site-info', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const info = {
            version: process.env.npm_package_version || '1.0.0',
            node_version: process.version,
            platform: process.platform,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            env: process.env.NODE_ENV
        };

        // 获取数据库状态
        const { data: dbStatus, error: dbError } = await supabase.rpc('get_db_stats');
        if (!dbError) info.database = dbStatus;

        // 获取存储状态
        const { data: storageStatus, error: storageError } = await supabase.rpc('get_storage_stats');
        if (!storageError) info.storage = storageStatus;

        res.json({ info });
    } catch (error) {
        res.status(500).json({ message: '获取站点信息失败', error: error.message });
    }
});

// ==================== 辅助函数 ====================

async function getSystemStats() {
    return {
        cpu_usage: process.cpuUsage(),
        memory_usage: process.memoryUsage(),
        uptime: process.uptime(),
        active_connections: 0 // 需要从其他地方获取
    };
}

async function getUserTrends(startDate) {
    const { data, error } = await supabase
        .from('daily_user_stats')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

    if (error) throw error;
    return data;
}

async function getContentTrends(startDate) {
    const { data, error } = await supabase
        .from('daily_content_stats')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

    if (error) throw error;
    return data;
}

async function getRevenueTrends(startDate) {
    const { data, error } = await supabase
        .from('daily_revenue_stats')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

    if (error) throw error;
    return data;
}

async function getTrafficTrends(startDate) {
    const { data, error } = await supabase
        .from('daily_traffic_stats')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

    if (error) throw error;
    return data;
}

async function applyModerationResult(moderation, action) {
    const table = moderation.content_type === 'article' ? 'articles' : 'comments';
    const status = action === 'approve' ? 'published' : 'rejected';

    await supabase
        .from(table)
        .update({ status, moderated_at: new Date().toISOString() })
        .eq('id', moderation.content_id);
}

async function batchDelete(target, ids) {
    const results = { success: [], failed: [] };
    
    for (const id of ids) {
        try {
            const { error } = await supabase.from(target).delete().eq('id', id);
            if (error) throw error;
            results.success.push(id);
        } catch (err) {
            results.failed.push({ id, reason: err.message });
        }
    }
    
    return results;
}

async function batchUpdate(target, ids, options) {
    const results = { success: [], failed: [] };
    
    for (const id of ids) {
        try {
            const { error } = await supabase.from(target).update(options).eq('id', id);
            if (error) throw error;
            results.success.push(id);
        } catch (err) {
            results.failed.push({ id, reason: err.message });
        }
    }
    
    return results;
}

async function batchExport(target, ids, options) {
    const { format = 'json' } = options;
    
    const { data, error } = await supabase
        .from(target)
        .select('*')
        .in('id', ids);

    if (error) throw error;

    let exportData;
    switch (format) {
        case 'csv':
            exportData = convertToCSV(data);
            break;
        case 'xlsx':
            exportData = { message: 'XLSX格式需要额外处理', count: data.length };
            break;
        default:
            exportData = data;
    }

    return { data: exportData, format, count: data.length };
}

async function batchMove(target, ids, options) {
    const { destination } = options;
    // 实现移动到指定分类/文件夹的逻辑
    return batchUpdate(target, ids, { category_id: destination });
}

async function batchTag(target, ids, options) {
    const { tags, action = 'add' } = options;
    // 实现批量添加/移除标签的逻辑
    return { success: ids, message: `批量${action}标签功能待实现` };
}

function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
        headers.map(header => {
            const value = row[header];
            if (typeof value === 'object') return JSON.stringify(value);
            return value;
        }).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
}

function getActionName(action) {
    const names = {
        delete: '删除',
        update: '更新',
        export: '导出',
        move: '移动',
        tag: '标签操作'
    };
    return names[action] || action;
}

module.exports = router;
