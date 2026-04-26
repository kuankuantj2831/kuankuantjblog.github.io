/**
 * 管理后台路由
 * 包含：数据可视化、内容审核、用户分析、系统监控
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// 验证管理员权限
const requireAdmin = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: '未提供认证令牌' });
    }
    
    try {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // 检查是否为管理员
        const [users] = await pool.query(
            'SELECT role FROM users WHERE id = ?',
            [decoded.id]
        );
        
        if (users.length === 0 || users[0].role !== 'admin') {
            return res.status(403).json({ message: '需要管理员权限' });
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: '令牌无效' });
    }
};

// ============================================
// 数据可视化仪表板
// ============================================

// 获取概览统计
router.get('/overview', requireAdmin, async (req, res) => {
    try {
        // 用户统计
        const [userStats] = await pool.query(
            `SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_users_7d,
                COUNT(CASE WHEN last_active >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 END) as active_users_1d
            FROM users`
        );
        
        // 内容统计
        const [contentStats] = await pool.query(
            `SELECT 
                (SELECT COUNT(*) FROM articles WHERE is_published = TRUE) as total_articles,
                (SELECT COUNT(*) FROM articles WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as new_articles_7d,
                (SELECT COUNT(*) FROM comments) as total_comments,
                (SELECT COUNT(*) FROM questions) as total_questions`
        );
        
        // 今日数据
        const [todayStats] = await pool.query(
            `SELECT 
                (SELECT COUNT(*) FROM articles WHERE DATE(created_at) = CURDATE()) as articles_today,
                (SELECT COUNT(*) FROM comments WHERE DATE(created_at) = CURDATE()) as comments_today,
                (SELECT COUNT(*) FROM user_reading_history WHERE DATE(read_at) = CURDATE()) as reads_today`
        );
        
        // 金币统计
        const [coinStats] = await pool.query(
            `SELECT 
                SUM(coins) as total_coins_in_circulation,
                AVG(coins) as avg_coins_per_user
            FROM users`
        );
        
        res.json({
            users: userStats[0],
            content: contentStats[0],
            today: todayStats[0],
            coins: coinStats[0]
        });
    } catch (error) {
        console.error('Error getting overview:', error);
        res.status(500).json({ message: '获取概览失败' });
    }
});

// 获取用户增长趋势
router.get('/user-growth', requireAdmin, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        
        const [rows] = await pool.query(
            `SELECT 
                DATE(created_at) as date,
                COUNT(*) as new_users,
                (SELECT COUNT(*) FROM users WHERE DATE(created_at) <= date) as cumulative_users
            FROM users
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC`,
            [days]
        );
        
        res.json({ data: rows });
    } catch (error) {
        console.error('Error getting user growth:', error);
        res.status(500).json({ message: '获取用户增长趋势失败' });
    }
});

// 获取活跃度趋势
router.get('/activity-trend', requireAdmin, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        
        const [rows] = await pool.query(
            `SELECT 
                DATE(created_at) as date,
                COUNT(DISTINCT author_id) as active_authors,
                COUNT(*) as article_count,
                SUM(view_count) as total_views
            FROM articles
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC`,
            [days]
        );
        
        res.json({ data: rows });
    } catch (error) {
        console.error('Error getting activity trend:', error);
        res.status(500).json({ message: '获取活跃度趋势失败' });
    }
});

// 获取热门文章排行
router.get('/top-articles', requireAdmin, async (req, res) => {
    try {
        const period = req.query.period || '7d';
        const limit = parseInt(req.query.limit) || 10;
        
        let timeFilter;
        switch (period) {
            case '24h': timeFilter = 'INTERVAL 1 DAY'; break;
            case '30d': timeFilter = 'INTERVAL 30 DAY'; break;
            case '7d':
            default: timeFilter = 'INTERVAL 7 DAY';
        }
        
        const [rows] = await pool.query(
            `SELECT a.*, u.username as author_name,
                COUNT(DISTINCT l.id) as likes_count,
                COUNT(DISTINCT c.id) as comments_count
            FROM articles a
            JOIN users u ON a.author_id = u.id
            LEFT JOIN likes l ON a.id = l.article_id
            LEFT JOIN comments c ON a.id = c.article_id
            WHERE a.created_at >= DATE_SUB(NOW(), ${timeFilter})
            GROUP BY a.id
            ORDER BY (a.view_count + COUNT(DISTINCT l.id) * 10 + COUNT(DISTINCT c.id) * 20) DESC
            LIMIT ?`,
            [limit]
        );
        
        res.json({ articles: rows });
    } catch (error) {
        console.error('Error getting top articles:', error);
        res.status(500).json({ message: '获取热门文章失败' });
    }
});

// ============================================
// 内容审核系统
// ============================================

// 获取审核队列
router.get('/moderation/queue', requireAdmin, async (req, res) => {
    try {
        const status = req.query.status || 'pending';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        
        const [rows] = await pool.query(
            `SELECT cm.*, u.username as author_name,
                CASE 
                    WHEN cm.content_type = 'article' THEN (SELECT title FROM articles WHERE id = cm.content_id)
                    WHEN cm.content_type = 'comment' THEN (SELECT LEFT(content, 100) FROM comments WHERE id = cm.content_id)
                    ELSE '未知内容'
                END as content_preview
            FROM content_moderation cm
            JOIN users u ON cm.author_id = u.id
            WHERE cm.status = ?
            ORDER BY cm.submitted_at DESC
            LIMIT ? OFFSET ?`,
            [status, limit, offset]
        );
        
        const [count] = await pool.query(
            'SELECT COUNT(*) as total FROM content_moderation WHERE status = ?',
            [status]
        );
        
        res.json({
            items: rows,
            total: count[0].total,
            page,
            totalPages: Math.ceil(count[0].total / limit)
        });
    } catch (error) {
        console.error('Error getting moderation queue:', error);
        res.status(500).json({ message: '获取审核队列失败' });
    }
});

// 审核内容
router.post('/moderation/review', requireAdmin, async (req, res) => {
    try {
        const { moderation_id, action, review_note } = req.body;
        const adminId = req.user.id;
        
        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        
        await pool.query(
            `UPDATE content_moderation 
            SET status = ?, reviewed_by = ?, review_note = ?, reviewed_at = NOW()
            WHERE id = ?`,
            [newStatus, adminId, review_note, moderation_id]
        );
        
        // 获取内容信息以执行相应操作
        const [items] = await pool.query(
            'SELECT content_type, content_id FROM content_moderation WHERE id = ?',
            [moderation_id]
        );
        
        if (items.length > 0 && action === 'reject') {
            // 如果拒绝，可以删除或隐藏内容
            const item = items[0];
            if (item.content_type === 'article') {
                await pool.query(
                    'UPDATE articles SET is_published = FALSE WHERE id = ?',
                    [item.content_id]
                );
            }
        }
        
        res.json({ message: '审核完成' });
    } catch (error) {
        console.error('Error reviewing content:', error);
        res.status(500).json({ message: '审核失败' });
    }
});

// 提交内容审核（由系统自动调用）
router.post('/moderation/submit', async (req, res) => {
    try {
        const { content_type, content_id, author_id, ai_score, ai_reason, flagged_keywords } = req.body;
        
        const status = ai_score > 0.8 ? 'pending' : 'auto_approved';
        
        await pool.query(
            `INSERT INTO content_moderation 
            (content_type, content_id, author_id, status, ai_score, ai_reason, flagged_keywords)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [content_type, content_id, author_id, status, ai_score, ai_reason, JSON.stringify(flagged_keywords)]
        );
        
        res.json({ message: '已提交审核', status });
    } catch (error) {
        console.error('Error submitting moderation:', error);
        res.status(500).json({ message: '提交审核失败' });
    }
});

// ============================================
// 用户行为分析
// ============================================

// 获取用户活跃度分析
router.get('/analytics/user-activity', requireAdmin, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        
        // DAU/MAU统计
        const [dauStats] = await pool.query(
            `SELECT 
                DATE(stat_date) as date,
                SUM(login_count) as total_logins,
                COUNT(DISTINCT user_id) as active_users,
                SUM(active_minutes) as total_active_minutes
            FROM user_activity_stats
            WHERE stat_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY DATE(stat_date)
            ORDER BY date ASC`,
            [days]
        );
        
        // 留存率统计（简化版）
        const [retention] = await pool.query(
            `SELECT 
                DATE(created_at) as register_date,
                COUNT(*) as new_users,
                COUNT(CASE WHEN last_active >= DATE_ADD(DATE(created_at), INTERVAL 1 DAY) THEN 1 END) as d1_retained,
                COUNT(CASE WHEN last_active >= DATE_ADD(DATE(created_at), INTERVAL 7 DAY) THEN 1 END) as d7_retained
            FROM users
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY DATE(created_at)
            ORDER BY register_date DESC
            LIMIT 30`,
            [days]
        );
        
        res.json({
            daily_activity: dauStats,
            retention: retention
        });
    } catch (error) {
        console.error('Error getting user analytics:', error);
        res.status(500).json({ message: '获取用户分析失败' });
    }
});

// 获取内容分布统计
router.get('/analytics/content-distribution', requireAdmin, async (req, res) => {
    try {
        // 分类分布
        const [categoryDist] = await pool.query(
            `SELECT c.name, COUNT(a.id) as article_count, SUM(a.view_count) as total_views
            FROM categories c
            LEFT JOIN articles a ON c.id = a.category_id AND a.is_published = TRUE
            GROUP BY c.id
            ORDER BY article_count DESC`
        );
        
        // 标签分布（前20）
        const [tagDist] = await pool.query(
            `SELECT tags, COUNT(*) as count
            FROM articles
            WHERE tags IS NOT NULL AND tags != ''
            ORDER BY created_at DESC
            LIMIT 100`
        );
        
        // 统计标签频率
        const tagCounts = {};
        tagDist.forEach(article => {
            article.tags.split(',').forEach(tag => {
                const trimmed = tag.trim();
                if (trimmed) {
                    tagCounts[trimmed] = (tagCounts[trimmed] || 0) + 1;
                }
            });
        });
        
        const topTags = Object.entries(tagCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20);
        
        res.json({
            categories: categoryDist,
            tags: topTags
        });
    } catch (error) {
        console.error('Error getting content distribution:', error);
        res.status(500).json({ message: '获取内容分布失败' });
    }
});

// ============================================
// 系统日志监控
// ============================================

// 获取系统日志
router.get('/logs', requireAdmin, async (req, res) => {
    try {
        const level = req.query.level || 'all';
        const category = req.query.category;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        
        let whereClause = 'WHERE 1=1';
        const params = [];
        
        if (level !== 'all') {
            whereClause += ' AND level = ?';
            params.push(level);
        }
        
        if (category) {
            whereClause += ' AND category = ?';
            params.push(category);
        }
        
        const [rows] = await pool.query(
            `SELECT * FROM system_logs
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );
        
        const [count] = await pool.query(
            `SELECT COUNT(*) as total FROM system_logs ${whereClause}`,
            params
        );
        
        res.json({
            logs: rows,
            total: count[0].total,
            page,
            totalPages: Math.ceil(count[0].total / limit)
        });
    } catch (error) {
        console.error('Error getting logs:', error);
        res.status(500).json({ message: '获取日志失败' });
    }
});

// 获取错误统计
router.get('/logs/errors/stats', requireAdmin, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        
        // 按天的错误趋势
        const [errorTrend] = await pool.query(
            `SELECT 
                DATE(created_at) as date,
                COUNT(*) as error_count,
                category,
                COUNT(DISTINCT category) as category_count
            FROM system_logs
            WHERE level = 'error'
            AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY DATE(created_at), category
            ORDER BY date ASC`,
            [days]
        );
        
        // 最常见的错误
        const [topErrors] = await pool.query(
            `SELECT message, category, COUNT(*) as count
            FROM system_logs
            WHERE level = 'error'
            AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY message, category
            ORDER BY count DESC
            LIMIT 10`,
            [days]
        );
        
        res.json({
            trend: errorTrend,
            top_errors: topErrors
        });
    } catch (error) {
        console.error('Error getting error stats:', error);
        res.status(500).json({ message: '获取错误统计失败' });
    }
});

// 写入系统日志（供内部使用）
async function writeLog(level, category, message, metadata = {}, req = null) {
    try {
        const ip = req ? req.ip : null;
        const userAgent = req ? req.headers['user-agent'] : null;
        const userId = req && req.user ? req.user.id : null;
        
        await pool.query(
            `INSERT INTO system_logs (level, category, message, metadata, ip_address, user_agent, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [level, category, message, JSON.stringify(metadata), ip, userAgent, userId]
        );
    } catch (error) {
        console.error('Error writing log:', error);
    }
}

// 获取管理员操作日志
router.get('/admin-logs', requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        
        const [rows] = await pool.query(
            `SELECT al.*, u.username as admin_name
            FROM admin_logs al
            JOIN users u ON al.admin_id = u.id
            ORDER BY al.created_at DESC
            LIMIT ? OFFSET ?`,
            [limit, offset]
        );
        
        const [count] = await pool.query('SELECT COUNT(*) as total FROM admin_logs');
        
        res.json({
            logs: rows,
            total: count[0].total,
            page,
            totalPages: Math.ceil(count[0].total / limit)
        });
    } catch (error) {
        console.error('Error getting admin logs:', error);
        res.status(500).json({ message: '获取管理员日志失败' });
    }
});

// 记录管理员操作（供内部使用）
async function logAdminAction(adminId, action, targetType, targetId, oldData, newData, req) {
    try {
        await pool.query(
            `INSERT INTO admin_logs (admin_id, action, target_type, target_id, old_data, new_data, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [adminId, action, targetType, targetId, JSON.stringify(oldData), JSON.stringify(newData), req.ip]
        );
    } catch (error) {
        console.error('Error logging admin action:', error);
    }
}

module.exports = {
    router,
    writeLog,
    logAdminAction
};
