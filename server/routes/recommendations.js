/**
 * 内容发现与推荐路由
 * 包含：智能推荐、相关文章、热门趋势、专题合集
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// 验证JWT中间件
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: '未提供认证令牌' });
    }
    
    try {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: '令牌无效' });
    }
};

// 获取个性化推荐
router.get('/personalized', authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const userId = req.user.id;
        
        // 获取用户阅读历史中的标签
        const [readingHistory] = await pool.query(
            `SELECT a.tags, a.category_id, COUNT(*) as read_count
            FROM user_reading_history urh
            JOIN articles a ON urh.article_id = a.id
            WHERE urh.user_id = ? AND urh.read_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY a.category_id, a.tags
            ORDER BY read_count DESC
            LIMIT 20`,
            [userId]
        );
        
        // 提取感兴趣的标签
        const interestedTags = new Set();
        const interestedCategories = new Set();
        
        readingHistory.forEach(item => {
            if (item.category_id) interestedCategories.add(item.category_id);
            if (item.tags) {
                item.tags.split(',').forEach(tag => interestedTags.add(tag.trim()));
            }
        });
        
        // 构建推荐查询
        let recommendations = [];
        
        if (interestedCategories.size > 0 || interestedTags.size > 0) {
            // 基于兴趣的推荐
            const [rows] = await pool.query(
                `SELECT a.*, u.username as author_name,
                    CASE 
                        WHEN a.category_id IN (?) THEN 3
                        ELSE 0
                    END +
                    CASE 
                        WHEN a.tags REGEXP ? THEN 2
                        ELSE 0
                    END as relevance_score
                FROM articles a
                JOIN users u ON a.author_id = u.id
                WHERE a.id NOT IN (
                    SELECT article_id FROM user_reading_history WHERE user_id = ?
                )
                AND a.is_published = TRUE
                ORDER BY relevance_score DESC, a.view_count DESC
                LIMIT ?`,
                [
                    Array.from(interestedCategories),
                    Array.from(interestedTags).join('|'),
                    userId,
                    limit
                ]
            );
            
            recommendations = rows;
        }
        
        // 如果推荐不足，补充热门文章
        if (recommendations.length < limit) {
            const needMore = limit - recommendations.length;
            const excludeIds = recommendations.map(r => r.id);
            
            const [popular] = await pool.query(
                `SELECT a.*, u.username as author_name, 0 as relevance_score
                FROM articles a
                JOIN users u ON a.author_id = u.id
                WHERE a.id NOT IN (?)
                AND a.id NOT IN (SELECT article_id FROM user_reading_history WHERE user_id = ?)
                AND a.is_published = TRUE
                ORDER BY a.view_count DESC, a.created_at DESC
                LIMIT ?`,
                [excludeIds.length > 0 ? excludeIds : [0], userId, needMore]
            );
            
            recommendations = [...recommendations, ...popular];
        }
        
        res.json({ articles: recommendations });
    } catch (error) {
        console.error('Error getting recommendations:', error);
        res.status(500).json({ message: '获取推荐失败' });
    }
});

// 获取相关文章
router.get('/related/:articleId', async (req, res) => {
    try {
        const articleId = parseInt(req.params.articleId);
        const limit = parseInt(req.query.limit) || 5;
        
        // 获取当前文章信息
        const [articles] = await pool.query(
            'SELECT category_id, tags, author_id FROM articles WHERE id = ?',
            [articleId]
        );
        
        if (articles.length === 0) {
            return res.status(404).json({ message: '文章不存在' });
        }
        
        const article = articles[0];
        const tags = article.tags ? article.tags.split(',').map(t => t.trim()) : [];
        
        // 查询相关文章（同分类、同标签、同作者）
        let query = `
            SELECT a.*, u.username as author_name,
                (
                    CASE WHEN a.category_id = ? THEN 3 ELSE 0 END +
                    CASE WHEN a.author_id = ? THEN 2 ELSE 0 END +
                    CASE WHEN a.tags REGEXP ? THEN 1 ELSE 0 END
                ) as relevance_score
            FROM articles a
            JOIN users u ON a.author_id = u.id
            WHERE a.id != ?
            AND a.is_published = TRUE
            ORDER BY relevance_score DESC, a.view_count DESC
            LIMIT ?
        `;
        
        const [rows] = await pool.query(query, [
            article.category_id,
            article.author_id,
            tags.length > 0 ? tags.join('|') : 'NOMATCH',
            articleId,
            limit
        ]);
        
        res.json({ articles: rows });
    } catch (error) {
        console.error('Error getting related articles:', error);
        res.status(500).json({ message: '获取相关文章失败' });
    }
});

// 获取热门趋势
router.get('/trending', async (req, res) => {
    try {
        const period = req.query.period || '24h'; // 24h, 7d, 30d
        const limit = parseInt(req.query.limit) || 10;
        
        let timeFilter;
        switch (period) {
            case '7d':
                timeFilter = 'INTERVAL 7 DAY';
                break;
            case '30d':
                timeFilter = 'INTERVAL 30 DAY';
                break;
            case '24h':
            default:
                timeFilter = 'INTERVAL 1 DAY';
        }
        
        // 计算趋势分数
        const [rows] = await pool.query(
            `SELECT a.*, u.username as author_name,
                (
                    a.view_count * 1 +
                    COUNT(DISTINCT l.id) * 5 +
                    COUNT(DISTINCT c.id) * 10
                ) / 
                GREATEST(TIMESTAMPDIFF(HOUR, a.created_at, NOW()), 1) as trending_score
            FROM articles a
            JOIN users u ON a.author_id = u.id
            LEFT JOIN likes l ON a.id = l.article_id AND l.created_at >= DATE_SUB(NOW(), ${timeFilter})
            LEFT JOIN comments c ON a.id = c.article_id AND c.created_at >= DATE_SUB(NOW(), ${timeFilter})
            WHERE a.is_published = TRUE
            AND a.created_at >= DATE_SUB(NOW(), ${timeFilter})
            GROUP BY a.id
            ORDER BY trending_score DESC
            LIMIT ?`,
            [limit]
        );
        
        res.json({ 
            articles: rows,
            period,
            updated_at: new Date()
        });
    } catch (error) {
        console.error('Error getting trending:', error);
        res.status(500).json({ message: '获取热门趋势失败' });
    }
});

// 获取专题合集列表
router.get('/series', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const offset = (page - 1) * limit;
        
        const [rows] = await pool.query(
            `SELECT s.*, u.username as author_name,
                COUNT(sa.id) as article_count,
                SUM(a.view_count) as total_views
            FROM collections_series s
            LEFT JOIN users u ON s.author_id = u.id
            LEFT JOIN series_articles sa ON s.id = sa.series_id
            LEFT JOIN articles a ON sa.article_id = a.id
            WHERE s.is_published = TRUE
            GROUP BY s.id
            ORDER BY s.created_at DESC
            LIMIT ? OFFSET ?`,
            [limit, offset]
        );
        
        const [count] = await pool.query(
            'SELECT COUNT(*) as total FROM collections_series WHERE is_published = TRUE'
        );
        
        res.json({
            series: rows,
            total: count[0].total,
            page,
            totalPages: Math.ceil(count[0].total / limit)
        });
    } catch (error) {
        console.error('Error getting series:', error);
        res.status(500).json({ message: '获取专题合集失败' });
    }
});

// 获取单个专题详情
router.get('/series/:id', async (req, res) => {
    try {
        const seriesId = parseInt(req.params.id);
        
        // 获取专题信息
        const [series] = await pool.query(
            `SELECT s.*, u.username as author_name
            FROM collections_series s
            LEFT JOIN users u ON s.author_id = u.id
            WHERE s.id = ? AND s.is_published = TRUE`,
            [seriesId]
        );
        
        if (series.length === 0) {
            return res.status(404).json({ message: '专题不存在' });
        }
        
        // 获取专题文章
        const [articles] = await pool.query(
            `SELECT a.*, u.username as author_name
            FROM series_articles sa
            JOIN articles a ON sa.article_id = a.id
            JOIN users u ON a.author_id = u.id
            WHERE sa.series_id = ?
            ORDER BY sa.article_order ASC, sa.added_at ASC`,
            [seriesId]
        );
        
        res.json({
            series: series[0],
            articles
        });
    } catch (error) {
        console.error('Error getting series detail:', error);
        res.status(500).json({ message: '获取专题详情失败' });
    }
});

// 创建专题（需要认证）
router.post('/series', authenticateToken, async (req, res) => {
    try {
        const { title, description, cover_image, category_id, article_ids } = req.body;
        
        // 创建专题
        const [result] = await pool.query(
            'INSERT INTO collections_series (title, description, cover_image, author_id, category_id) VALUES (?, ?, ?, ?, ?)',
            [title, description, cover_image, req.user.id, category_id]
        );
        
        const seriesId = result.insertId;
        
        // 添加文章到专题
        if (article_ids && article_ids.length > 0) {
            const values = article_ids.map((articleId, index) => [seriesId, articleId, index]);
            await pool.query(
                'INSERT INTO series_articles (series_id, article_id, article_order) VALUES ?',
                [values]
            );
        }
        
        res.json({ 
            message: '专题创建成功',
            series_id: seriesId
        });
    } catch (error) {
        console.error('Error creating series:', error);
        res.status(500).json({ message: '创建专题失败' });
    }
});

// 更新专题
router.put('/series/:id', authenticateToken, async (req, res) => {
    try {
        const seriesId = parseInt(req.params.id);
        const { title, description, cover_image, is_published, article_ids } = req.body;
        
        // 检查权限
        const [existing] = await pool.query(
            'SELECT author_id FROM collections_series WHERE id = ?',
            [seriesId]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ message: '专题不存在' });
        }
        
        if (existing[0].author_id !== req.user.id) {
            return res.status(403).json({ message: '无权修改此专题' });
        }
        
        // 更新专题信息
        await pool.query(
            'UPDATE collections_series SET title = ?, description = ?, cover_image = ?, is_published = ? WHERE id = ?',
            [title, description, cover_image, is_published, seriesId]
        );
        
        // 更新文章列表
        if (article_ids) {
            // 删除旧关联
            await pool.query('DELETE FROM series_articles WHERE series_id = ?', [seriesId]);
            
            // 添加新关联
            if (article_ids.length > 0) {
                const values = article_ids.map((articleId, index) => [seriesId, articleId, index]);
                await pool.query(
                    'INSERT INTO series_articles (series_id, article_id, article_order) VALUES ?',
                    [values]
                );
            }
        }
        
        res.json({ message: '专题更新成功' });
    } catch (error) {
        console.error('Error updating series:', error);
        res.status(500).json({ message: '更新专题失败' });
    }
});

// 删除专题
router.delete('/series/:id', authenticateToken, async (req, res) => {
    try {
        const seriesId = parseInt(req.params.id);
        
        // 检查权限
        const [existing] = await pool.query(
            'SELECT author_id FROM collections_series WHERE id = ?',
            [seriesId]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ message: '专题不存在' });
        }
        
        if (existing[0].author_id !== req.user.id) {
            return res.status(403).json({ message: '无权删除此专题' });
        }
        
        // 删除关联
        await pool.query('DELETE FROM series_articles WHERE series_id = ?', [seriesId]);
        
        // 删除专题
        await pool.query('DELETE FROM collections_series WHERE id = ?', [seriesId]);
        
        res.json({ message: '专题删除成功' });
    } catch (error) {
        console.error('Error deleting series:', error);
        res.status(500).json({ message: '删除专题失败' });
    }
});

// 记录阅读历史
router.post('/reading-history', authenticateToken, async (req, res) => {
    try {
        const { article_id, read_duration, read_percentage } = req.body;
        const userId = req.user.id;
        
        // 检查是否已有记录
        const [existing] = await pool.query(
            'SELECT id FROM user_reading_history WHERE user_id = ? AND article_id = ?',
            [userId, article_id]
        );
        
        if (existing.length > 0) {
            // 更新记录
            await pool.query(
                `UPDATE user_reading_history 
                SET read_duration = read_duration + ?,
                    read_percentage = GREATEST(read_percentage, ?),
                    read_at = NOW()
                WHERE id = ?`,
                [read_duration, read_percentage, existing[0].id]
            );
        } else {
            // 创建新记录
            await pool.query(
                `INSERT INTO user_reading_history 
                (user_id, article_id, read_duration, read_percentage, is_liked, is_favorited)
                VALUES (?, ?, ?, ?, 
                    (SELECT EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND article_id = ?)),
                    (SELECT EXISTS(SELECT 1 FROM favorites WHERE user_id = ? AND article_id = ?))
                )`,
                [userId, article_id, read_duration, read_percentage, userId, article_id, userId, article_id]
            );
        }
        
        res.json({ message: '记录成功' });
    } catch (error) {
        console.error('Error recording reading history:', error);
        res.status(500).json({ message: '记录失败' });
    }
});

module.exports = router;
