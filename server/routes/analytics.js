/**
 * 文章数据分析路由
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../utils/jwt');

// 验证JWT中间件
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: '未提供认证令牌' });
    }
    
    try {
        const decoded = jwt.verify(token, getJwtSecret());
        req.userId = decoded.userId || decoded.sub;
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: '令牌无效或已过期' });
    }
};

/**
 * 获取文章统计数据
 * GET /api/analytics/articles/:articleId
 */
router.get('/analytics/articles/:articleId', authenticateToken, async (req, res) => {
    const { articleId } = req.params;
    
    try {
        // 检查权限
        const [articleRows] = await pool.query(
            'SELECT author_id FROM articles WHERE id = ?',
            [articleId]
        );
        
        if (articleRows.length === 0) {
            return res.status(404).json({ message: '文章不存在' });
        }
        
        if (articleRows[0].author_id !== req.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: '无权查看此文章数据' });
        }
        
        // 获取统计数据
        const [statsRows] = await pool.query(
            'SELECT * FROM article_stats WHERE article_id = ?',
            [articleId]
        );
        
        // 获取最近7天趋势
        const [trendRows] = await pool.query(
            `SELECT 
                stat_date,
                view_count,
                like_count,
                comment_count
             FROM daily_article_stats 
             WHERE article_id = ? AND stat_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
             ORDER BY stat_date ASC`,
            [articleId]
        );
        
        res.json({
            stats: statsRows[0] || {
                view_count: 0,
                like_count: 0,
                comment_count: 0,
                favorite_count: 0,
                share_count: 0,
                coin_count: 0
            },
            trends: trendRows
        });
        
    } catch (error) {
        console.error('获取文章统计失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 获取作者整体数据
 * GET /api/analytics/author
 */
router.get('/analytics/author', authenticateToken, async (req, res) => {
    const userId = req.userId;
    
    try {
        // 获取作者统计数据
        const [authorRows] = await pool.query(
            'SELECT * FROM author_stats WHERE author_id = ?',
            [userId]
        );
        
        // 获取文章列表及数据
        const [articlesRows] = await pool.query(
            `SELECT 
                a.id, a.title, a.created_at,
                COALESCE(s.view_count, 0) as views,
                COALESCE(s.like_count, 0) as likes,
                COALESCE(s.comment_count, 0) as comments,
                COALESCE(s.favorite_count, 0) as favorites
             FROM articles a
             LEFT JOIN article_stats s ON a.id = s.article_id
             WHERE a.author_id = ?
             ORDER BY a.created_at DESC`,
            [userId]
        );
        
        // 获取最近30天的数据趋势
        const [dailyRows] = await pool.query(
            `SELECT 
                stat_date,
                SUM(view_count) as total_views,
                SUM(like_count) as total_likes,
                SUM(comment_count) as total_comments
             FROM daily_article_stats 
             WHERE article_id IN (SELECT id FROM articles WHERE author_id = ?)
             AND stat_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
             GROUP BY stat_date
             ORDER BY stat_date ASC`,
            [userId]
        );
        
        // 计算总阅读量（如果没有统计表数据，从文章表计算）
        let totalViews = authorRows[0]?.total_views || 0;
        let totalLikes = authorRows[0]?.total_likes || 0;
        
        if (totalViews === 0) {
            const [sumRows] = await pool.query(
                `SELECT 
                    SUM(view_count) as total_views,
                    SUM(like_count) as total_likes
                 FROM article_stats 
                 WHERE article_id IN (SELECT id FROM articles WHERE author_id = ?)`,
                [userId]
            );
            totalViews = sumRows[0]?.total_views || 0;
            totalLikes = sumRows[0]?.total_likes || 0;
        }
        
        res.json({
            summary: {
                totalArticles: articlesRows.length,
                totalViews: totalViews,
                totalLikes: totalLikes,
                totalComments: authorRows[0]?.total_comments || 0,
                totalFavorites: authorRows[0]?.total_favorites || 0,
                followers: authorRows[0]?.followers_count || 0
            },
            articles: articlesRows,
            dailyTrends: dailyRows
        });
        
    } catch (error) {
        console.error('获取作者统计失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 获取热门文章排行
 * GET /api/analytics/popular
 */
router.get('/analytics/popular', async (req, res) => {
    const { limit = 10, period = 'all' } = req.query;
    
    try {
        let query = `
            SELECT 
                a.id, a.title, a.author_name, a.created_at,
                COALESCE(s.view_count, 0) as views,
                COALESCE(s.like_count, 0) as likes
             FROM articles a
             LEFT JOIN article_stats s ON a.id = s.article_id
        `;
        
        if (period === 'week') {
            query += ` WHERE a.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`;
        } else if (period === 'month') {
            query += ` WHERE a.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`;
        }
        
        query += ` ORDER BY views DESC LIMIT ?`;
        
        const [rows] = await pool.query(query, [parseInt(limit)]);
        
        res.json({
            articles: rows,
            period: period
        });
        
    } catch (error) {
        console.error('获取热门文章失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 记录文章阅读
 * POST /api/analytics/view
 */
router.post('/analytics/view', async (req, res) => {
    const { articleId, readTime = 0 } = req.body;
    
    if (!articleId) {
        return res.status(400).json({ message: '缺少文章ID' });
    }
    
    try {
        // 更新文章总浏览量
        await pool.query(
            `INSERT INTO article_stats (article_id, view_count)
             VALUES (?, 1)
             ON DUPLICATE KEY UPDATE 
             view_count = view_count + 1,
             avg_read_time = (avg_read_time * view_count + ?) / (view_count + 1)`,
            [articleId, readTime]
        );
        
        // 更新每日统计
        const today = new Date().toISOString().split('T')[0];
        await pool.query(
            `INSERT INTO daily_article_stats (article_id, stat_date, view_count)
             VALUES (?, ?, 1)
             ON DUPLICATE KEY UPDATE view_count = view_count + 1`,
            [articleId, today]
        );
        
        res.json({ message: '记录成功' });
        
    } catch (error) {
        console.error('记录阅读失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 获取作者趋势数据（用于Chart.js图表）
 * GET /api/analytics/author/trends
 */
router.get('/analytics/author/trends', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const { start_date, end_date } = req.query;
    
    try {
        // 生成日期范围
        const startDate = start_date || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = end_date || new Date().toISOString().split('T')[0];
        
        // 获取趋势数据
        const [dailyRows] = await pool.query(
            `SELECT
                stat_date,
                SUM(view_count) as total_views,
                SUM(like_count) as total_likes,
                SUM(comment_count) as total_comments,
                SUM(favorite_count) as total_favorites
             FROM daily_article_stats
             WHERE article_id IN (SELECT id FROM articles WHERE author_id = ?)
             AND stat_date BETWEEN ? AND ?
             GROUP BY stat_date
             ORDER BY stat_date ASC`,
            [userId, startDate, endDate]
        );
        
        // 填充缺失的日期
        const dateMap = new Map();
        dailyRows.forEach(row => {
            dateMap.set(row.stat_date.toISOString().split('T')[0], row);
        });
        
        const dates = [];
        const views = [];
        const likes = [];
        const comments = [];
        const favorites = [];
        
        let currentDate = new Date(startDate);
        const end = new Date(endDate);
        
        while (currentDate <= end) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const data = dateMap.get(dateStr);
            
            dates.push(dateStr);
            views.push(data ? data.total_views : 0);
            likes.push(data ? data.total_likes : 0);
            comments.push(data ? data.total_comments : 0);
            favorites.push(data ? data.total_favorites : 0);
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        res.json({
            dates,
            views,
            likes,
            comments,
            favorites,
            start_date: startDate,
            end_date: endDate
        });
        
    } catch (error) {
        console.error('获取趋势数据失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

module.exports = router;
