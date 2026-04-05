/**
 * 话题圈子系统 API 路由
 * Topic Groups System - 类似豆瓣小组的垂直社区
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const router = express.Router();
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// JWT 验证中间件
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: '未提供访问令牌' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.username = decoded.username;
        next();
    } catch (error) {
        return res.status(403).json({ error: '令牌无效或已过期' });
    }
};

// ========== 圈子相关 API ==========

/**
 * 创建圈子
 * POST /groups
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, description, category, avatar, coverImage, rules, isPrivate } = req.body;

        if (!name || !description) {
            return res.status(400).json({ error: '圈子名称和描述为必填项' });
        }

        // 检查圈子名是否已存在
        const { data: existing } = await supabase
            .from('groups')
            .select('id')
            .eq('name', name)
            .single();

        if (existing) {
            return res.status(400).json({ error: '圈子名称已存在' });
        }

        const { data: group, error } = await supabase
            .from('groups')
            .insert({
                name,
                slug: name.toLowerCase().replace(/[^\w\u4e00-\u9fa5]/g, '-'),
                description,
                category: category || '其他',
                avatar: avatar || null,
                cover_image: coverImage || null,
                rules: rules || '',
                is_private: isPrivate || false,
                creator_id: req.userId,
                member_count: 1,
                post_count: 0,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        // 创建者自动成为管理员
        await supabase.from('group_members').insert({
            group_id: group.id,
            user_id: req.userId,
            role: 'admin',
            joined_at: new Date().toISOString()
        });

        res.status(201).json({
            success: true,
            data: group,
            message: '圈子创建成功'
        });
    } catch (error) {
        console.error('创建圈子失败:', error);
        res.status(500).json({ error: '创建圈子失败' });
    }
});

/**
 * 获取圈子列表
 * GET /groups
 */
router.get('/', async (req, res) => {
    try {
        const { category, sort = 'newest', page = 1, limit = 20, search } = req.query;

        let query = supabase
            .from('groups')
            .select(`
                *,
                creator:users(id, username, avatar),
                is_member:group_members!inner(user_id)
            `, { count: 'exact' })
            .eq('is_private', false);

        if (category && category !== 'all') {
            query = query.eq('category', category);
        }

        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        // 排序
        switch (sort) {
            case 'members':
                query = query.order('member_count', { ascending: false });
                break;
            case 'activity':
                query = query.order('last_activity_at', { ascending: false });
                break;
            case 'newest':
            default:
                query = query.order('created_at', { ascending: false });
        }

        const from = (page - 1) * limit;
        const to = from + parseInt(limit) - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data: data.map(g => ({
                ...g,
                is_member: g.is_member?.length > 0
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('获取圈子列表失败:', error);
        res.status(500).json({ error: '获取圈子列表失败' });
    }
});

/**
 * 获取圈子详情
 * GET /groups/:id
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        let userId = null;

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.userId;
            } catch (e) {}
        }

        const { data: group, error } = await supabase
            .from('groups')
            .select(`
                *,
                creator:users(id, username, avatar),
                members:group_members(
                    role,
                    joined_at,
                    user:users(id, username, avatar, level)
                )
            `)
            .eq('id', id)
            .single();

        if (error || !group) {
            return res.status(404).json({ error: '圈子不存在' });
        }

        // 检查用户是否已加入
        let isMember = false;
        let userRole = null;
        if (userId) {
            const { data: membership } = await supabase
                .from('group_members')
                .select('role')
                .eq('group_id', id)
                .eq('user_id', userId)
                .single();
            
            if (membership) {
                isMember = true;
                userRole = membership.role;
            }
        }

        res.json({
            success: true,
            data: {
                ...group,
                is_member: isMember,
                user_role: userRole
            }
        });
    } catch (error) {
        console.error('获取圈子详情失败:', error);
        res.status(500).json({ error: '获取圈子详情失败' });
    }
});

/**
 * 加入圈子
 * POST /groups/:id/join
 */
router.post('/:id/join', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // 检查圈子是否存在
        const { data: group, error: groupError } = await supabase
            .from('groups')
            .select('id, is_private, member_count')
            .eq('id', id)
            .single();

        if (groupError || !group) {
            return res.status(404).json({ error: '圈子不存在' });
        }

        // 检查是否已加入
        const { data: existing } = await supabase
            .from('group_members')
            .select('id')
            .eq('group_id', id)
            .eq('user_id', req.userId)
            .single();

        if (existing) {
            return res.status(400).json({ error: '您已经是该圈子成员' });
        }

        // 加入圈子
        await supabase.from('group_members').insert({
            group_id: id,
            user_id: req.userId,
            role: 'member',
            joined_at: new Date().toISOString()
        });

        // 更新成员数
        await supabase
            .from('groups')
            .update({ member_count: group.member_count + 1 })
            .eq('id', id);

        res.json({
            success: true,
            message: '加入圈子成功'
        });
    } catch (error) {
        console.error('加入圈子失败:', error);
        res.status(500).json({ error: '加入圈子失败' });
    }
});

/**
 * 退出圈子
 * POST /groups/:id/leave
 */
router.post('/:id/leave', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const { data: group } = await supabase
            .from('groups')
            .select('creator_id, member_count')
            .eq('id', id)
            .single();

        if (!group) {
            return res.status(404).json({ error: '圈子不存在' });
        }

        // 创建者不能退出
        if (group.creator_id === req.userId) {
            return res.status(400).json({ error: '创建者不能退出圈子，请转让或解散' });
        }

        // 删除成员记录
        await supabase
            .from('group_members')
            .delete()
            .eq('group_id', id)
            .eq('user_id', req.userId);

        // 更新成员数
        await supabase
            .from('groups')
            .update({ member_count: Math.max(0, group.member_count - 1) })
            .eq('id', id);

        res.json({
            success: true,
            message: '已退出圈子'
        });
    } catch (error) {
        console.error('退出圈子失败:', error);
        res.status(500).json({ error: '退出圈子失败' });
    }
});

// ========== 帖子相关 API ==========

/**
 * 发布帖子
 * POST /groups/:id/posts
 */
router.post('/:id/posts', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, type = 'discussion' } = req.body;

        if (!content) {
            return res.status(400).json({ error: '帖子内容不能为空' });
        }

        // 检查是否是圈子成员
        const { data: membership } = await supabase
            .from('group_members')
            .select('role')
            .eq('group_id', id)
            .eq('user_id', req.userId)
            .single();

        if (!membership) {
            return res.status(403).json({ error: '请先加入圈子' });
        }

        const { data: post, error } = await supabase
            .from('group_posts')
            .insert({
                group_id: id,
                author_id: req.userId,
                title: title || '',
                content,
                type,
                like_count: 0,
                comment_count: 0,
                is_pinned: false,
                is_approved: true, // 可以设置为需要审核
                created_at: new Date().toISOString()
            })
            .select('*, author:users(id, username, avatar, level)')
            .single();

        if (error) throw error;

        // 更新圈子帖子数和最后活动时间
        await supabase
            .from('groups')
            .update({ 
                post_count: supabase.rpc('increment', { x: 1 }),
                last_activity_at: new Date().toISOString()
            })
            .eq('id', id);

        res.status(201).json({
            success: true,
            data: post,
            message: '帖子发布成功'
        });
    } catch (error) {
        console.error('发布帖子失败:', error);
        res.status(500).json({ error: '发布帖子失败' });
    }
});

/**
 * 获取帖子列表
 * GET /groups/:id/posts
 */
router.get('/:id/posts', async (req, res) => {
    try {
        const { id } = req.params;
        const { sort = 'newest', page = 1, limit = 20 } = req.query;

        let query = supabase
            .from('group_posts')
            .select(`
                *,
                author:users(id, username, avatar, level),
                comments:group_comments(count)
            `, { count: 'exact' })
            .eq('group_id', id)
            .eq('is_approved', true);

        // 排序
        switch (sort) {
            case 'hot':
                query = query.order('like_count', { ascending: false });
                break;
            case 'newest':
            default:
                query = query.order('created_at', { ascending: false });
        }

        const from = (page - 1) * limit;
        const to = from + parseInt(limit) - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data: data.map(p => ({
                ...p,
                comment_count: p.comments?.[0]?.count || 0
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('获取帖子列表失败:', error);
        res.status(500).json({ error: '获取帖子列表失败' });
    }
});

/**
 * 点赞帖子
 * POST /groups/posts/:id/like
 */
router.post('/posts/:id/like', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // 检查是否已点赞
        const { data: existing } = await supabase
            .from('group_post_likes')
            .select('id')
            .eq('post_id', id)
            .eq('user_id', req.userId)
            .single();

        if (existing) {
            // 取消点赞
            await supabase
                .from('group_post_likes')
                .delete()
                .eq('id', existing.id);

            await supabase.rpc('decrement_post_likes', { post_id: id });

            return res.json({ success: true, liked: false });
        }

        // 添加点赞
        await supabase.from('group_post_likes').insert({
            post_id: id,
            user_id: req.userId,
            created_at: new Date().toISOString()
        });

        await supabase.rpc('increment_post_likes', { post_id: id });

        res.json({ success: true, liked: true });
    } catch (error) {
        console.error('点赞失败:', error);
        res.status(500).json({ error: '点赞失败' });
    }
});

/**
 * 评论帖子
 * POST /groups/posts/:id/comments
 */
router.post('/posts/:id/comments', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { content, parentId } = req.body;

        if (!content || content.trim().length < 2) {
            return res.status(400).json({ error: '评论内容至少2个字符' });
        }

        const { data: comment, error } = await supabase
            .from('group_comments')
            .insert({
                post_id: id,
                author_id: req.userId,
                content: content.trim(),
                parent_id: parentId || null,
                created_at: new Date().toISOString()
            })
            .select('*, author:users(id, username, avatar)')
            .single();

        if (error) throw error;

        // 更新帖子评论数
        await supabase.rpc('increment_post_comments', { post_id: id });

        res.status(201).json({
            success: true,
            data: comment
        });
    } catch (error) {
        console.error('评论失败:', error);
        res.status(500).json({ error: '评论失败' });
    }
});

/**
 * 获取我加入的圈子
 * GET /groups/my-groups
 */
router.get('/my/list', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('group_members')
            .select(`
                role,
                joined_at,
                group:groups(*)
            `)
            .eq('user_id', req.userId)
            .order('joined_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: data.map(m => ({
                ...m.group,
                role: m.role,
                joined_at: m.joined_at
            }))
        });
    } catch (error) {
        console.error('获取我的圈子失败:', error);
        res.status(500).json({ error: '获取我的圈子失败' });
    }
});

module.exports = router;
