/**
 * 收藏夹系统路由
 * 包含：收藏夹CRUD、文章收藏、收藏管理
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

// ==================== 收藏夹管理 ====================

/**
 * 获取用户的收藏夹列表
 * GET /api/collections
 */
router.get('/collections', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const { includeArticles = false } = req.query;
    
    try {
        let query = `
            SELECT 
                c.*,
                COUNT(ca.id) as article_count
             FROM user_collections c
             LEFT JOIN collection_articles ca ON c.id = ca.collection_id
             WHERE c.user_id = ?
             GROUP BY c.id
             ORDER BY c.sort_order ASC, c.created_at DESC
        `;
        
        const [rows] = await pool.query(query, [userId]);
        
        // 如果需要包含文章
        if (includeArticles === 'true') {
            for (let collection of rows) {
                const [articles] = await pool.query(
                    `SELECT 
                        ca.id as collection_article_id,
                        ca.note,
                        ca.created_at as collected_at,
                        a.id, a.title, a.author_name, a.created_at,
                        COALESCE(s.view_count, 0) as views,
                        COALESCE(s.like_count, 0) as likes
                     FROM collection_articles ca
                     JOIN articles a ON ca.article_id = a.id
                     LEFT JOIN article_stats s ON a.id = s.article_id
                     WHERE ca.collection_id = ?
                     ORDER BY ca.created_at DESC
                     LIMIT 5`,
                    [collection.id]
                );
                collection.recent_articles = articles;
            }
        }
        
        res.json({ collections: rows });
    } catch (error) {
        console.error('获取收藏夹列表失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 获取单个收藏夹详情
 * GET /api/collections/:id
 */
router.get('/collections/:id', async (req, res) => {
    const collectionId = req.params.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    try {
        // 获取收藏夹信息
        const [collectionRows] = await pool.query(
            `SELECT c.*, u.username, u.nickname, u.avatar
             FROM user_collections c
             JOIN users u ON c.user_id = u.id
             WHERE c.id = ? AND (c.is_public = TRUE OR c.user_id = ?)`,
            [collectionId, req.userId || 0]
        );
        
        if (collectionRows.length === 0) {
            return res.status(404).json({ message: '收藏夹不存在或不可见' });
        }
        
        const collection = collectionRows[0];
        
        // 获取收藏的文章
        const [articleRows] = await pool.query(
            `SELECT 
                ca.id as collection_article_id,
                ca.note,
                ca.created_at as collected_at,
                a.id, a.title, a.summary, a.author_name, a.created_at as article_created_at,
                COALESCE(s.view_count, 0) as views,
                COALESCE(s.like_count, 0) as likes,
                COALESCE(s.comment_count, 0) as comments
             FROM collection_articles ca
             JOIN articles a ON ca.article_id = a.id
             LEFT JOIN article_stats s ON a.id = s.article_id
             WHERE ca.collection_id = ?
             ORDER BY ca.created_at DESC
             LIMIT ? OFFSET ?`,
            [collectionId, parseInt(limit), parseInt(offset)]
        );
        
        // 获取总数
        const [countRows] = await pool.query(
            'SELECT COUNT(*) as total FROM collection_articles WHERE collection_id = ?',
            [collectionId]
        );
        
        res.json({
            collection,
            articles: articleRows,
            total: countRows[0].total,
            page: parseInt(page),
            totalPages: Math.ceil(countRows[0].total / limit)
        });
    } catch (error) {
        console.error('获取收藏夹详情失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 创建收藏夹
 * POST /api/collections
 */
router.post('/collections', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const { name, description, isPublic = true, icon, color } = req.body;
    
    if (!name || name.trim().length === 0) {
        return res.status(400).json({ message: '收藏夹名称不能为空' });
    }
    
    if (name.length > 100) {
        return res.status(400).json({ message: '收藏夹名称过长' });
    }
    
    try {
        // 检查收藏夹数量限制
        const [countRows] = await pool.query(
            'SELECT COUNT(*) as count FROM user_collections WHERE user_id = ?',
            [userId]
        );
        
        if (countRows[0].count >= 50) {
            return res.status(400).json({ message: '收藏夹数量已达上限' });
        }
        
        const [result] = await pool.query(
            `INSERT INTO user_collections (user_id, name, description, is_public, icon, color)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, name.trim(), description || null, isPublic, icon || '⭐', color || '#667eea']
        );
        
        res.json({
            message: '创建成功',
            collectionId: result.insertId
        });
    } catch (error) {
        console.error('创建收藏夹失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 更新收藏夹
 * PUT /api/collections/:id
 */
router.put('/collections/:id', authenticateToken, async (req, res) => {
    const collectionId = req.params.id;
    const userId = req.userId;
    const { name, description, isPublic, icon, color, sortOrder } = req.body;
    
    try {
        // 检查权限
        const [rows] = await pool.query(
            'SELECT user_id FROM user_collections WHERE id = ?',
            [collectionId]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ message: '收藏夹不存在' });
        }
        
        if (rows[0].user_id !== userId) {
            return res.status(403).json({ message: '无权修改此收藏夹' });
        }
        
        const updates = [];
        const values = [];
        
        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name.trim());
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (isPublic !== undefined) {
            updates.push('is_public = ?');
            values.push(isPublic);
        }
        if (icon !== undefined) {
            updates.push('icon = ?');
            values.push(icon);
        }
        if (color !== undefined) {
            updates.push('color = ?');
            values.push(color);
        }
        if (sortOrder !== undefined) {
            updates.push('sort_order = ?');
            values.push(sortOrder);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ message: '没有要更新的内容' });
        }
        
        values.push(collectionId);
        
        await pool.query(
            `UPDATE user_collections SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        
        res.json({ message: '更新成功' });
    } catch (error) {
        console.error('更新收藏夹失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 删除收藏夹
 * DELETE /api/collections/:id
 */
router.delete('/collections/:id', authenticateToken, async (req, res) => {
    const collectionId = req.params.id;
    const userId = req.userId;
    
    try {
        // 检查权限
        const [rows] = await pool.query(
            'SELECT user_id FROM user_collections WHERE id = ?',
            [collectionId]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ message: '收藏夹不存在' });
        }
        
        if (rows[0].user_id !== userId) {
            return res.status(403).json({ message: '无权删除此收藏夹' });
        }
        
        await pool.query('DELETE FROM user_collections WHERE id = ?', [collectionId]);
        
        res.json({ message: '删除成功' });
    } catch (error) {
        console.error('删除收藏夹失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// ==================== 文章收藏 ====================

/**
 * 收藏文章
 * POST /api/collections/:collectionId/articles
 */
router.post('/collections/:collectionId/articles', authenticateToken, async (req, res) => {
    const collectionId = req.params.collectionId;
    const userId = req.userId;
    const { articleId, note } = req.body;
    
    if (!articleId) {
        return res.status(400).json({ message: '缺少文章ID' });
    }
    
    try {
        // 检查收藏夹权限
        const [collectionRows] = await pool.query(
            'SELECT user_id FROM user_collections WHERE id = ?',
            [collectionId]
        );
        
        if (collectionRows.length === 0) {
            return res.status(404).json({ message: '收藏夹不存在' });
        }
        
        if (collectionRows[0].user_id !== userId) {
            return res.status(403).json({ message: '无权向此收藏夹添加文章' });
        }
        
        // 检查文章是否存在
        const [articleRows] = await pool.query(
            'SELECT id FROM articles WHERE id = ?',
            [articleId]
        );
        
        if (articleRows.length === 0) {
            return res.status(404).json({ message: '文章不存在' });
        }
        
        // 添加到收藏
        await pool.query(
            `INSERT INTO collection_articles (collection_id, article_id, note)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE note = VALUES(note), created_at = CURRENT_TIMESTAMP`,
            [collectionId, articleId, note || null]
        );
        
        res.json({ message: '收藏成功' });
    } catch (error) {
        console.error('收藏文章失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 从收藏夹移除文章
 * DELETE /api/collections/:collectionId/articles/:articleId
 */
router.delete('/collections/:collectionId/articles/:articleId', authenticateToken, async (req, res) => {
    const { collectionId, articleId } = req.params;
    const userId = req.userId;
    
    try {
        // 检查收藏夹权限
        const [collectionRows] = await pool.query(
            'SELECT user_id FROM user_collections WHERE id = ?',
            [collectionId]
        );
        
        if (collectionRows.length === 0) {
            return res.status(404).json({ message: '收藏夹不存在' });
        }
        
        if (collectionRows[0].user_id !== userId) {
            return res.status(403).json({ message: '无权操作此收藏夹' });
        }
        
        await pool.query(
            'DELETE FROM collection_articles WHERE collection_id = ? AND article_id = ?',
            [collectionId, articleId]
        );
        
        res.json({ message: '移除成功' });
    } catch (error) {
        console.error('移除文章失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 检查文章是否已收藏
 * GET /api/collections/check/:articleId
 */
router.get('/collections/check/:articleId', authenticateToken, async (req, res) => {
    const articleId = req.params.articleId;
    const userId = req.userId;
    
    try {
        const [rows] = await pool.query(
            `SELECT c.id, c.name, c.icon, c.color
             FROM collection_articles ca
             JOIN user_collections c ON ca.collection_id = c.id
             WHERE ca.article_id = ? AND c.user_id = ?`,
            [articleId, userId]
        );
        
        res.json({
            isCollected: rows.length > 0,
            collections: rows
        });
    } catch (error) {
        console.error('检查收藏状态失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 移动文章到其他收藏夹
 * PUT /api/collections/:collectionId/articles/:articleId/move
 */
router.put('/collections/:collectionId/articles/:articleId/move', authenticateToken, async (req, res) => {
    const { collectionId, articleId } = req.params;
    const userId = req.userId;
    const { targetCollectionId } = req.body;
    
    if (!targetCollectionId) {
        return res.status(400).json({ message: '缺少目标收藏夹ID' });
    }
    
    try {
        // 检查两个收藏夹的权限
        const [collectionRows] = await pool.query(
            'SELECT id, user_id FROM user_collections WHERE id IN (?, ?)',
            [collectionId, targetCollectionId]
        );
        
        if (collectionRows.length !== 2) {
            return res.status(404).json({ message: '收藏夹不存在' });
        }
        
        for (const col of collectionRows) {
            if (col.user_id !== userId) {
                return res.status(403).json({ message: '无权操作此收藏夹' });
            }
        }
        
        // 获取收藏信息
        const [articleRows] = await pool.query(
            'SELECT note FROM collection_articles WHERE collection_id = ? AND article_id = ?',
            [collectionId, articleId]
        );
        
        const note = articleRows.length > 0 ? articleRows[0].note : null;
        
        // 从新收藏夹中删除（如果存在）
        await pool.query(
            'DELETE FROM collection_articles WHERE collection_id = ? AND article_id = ?',
            [collectionId, articleId]
        );
        
        // 添加到新收藏夹
        await pool.query(
            `INSERT INTO collection_articles (collection_id, article_id, note)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE note = VALUES(note)`,
            [targetCollectionId, articleId, note]
        );
        
        res.json({ message: '移动成功' });
    } catch (error) {
        console.error('移动文章失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

module.exports = router;
