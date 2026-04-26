/**
 * 阅读体验路由
 * 包含：阅读进度同步、阅读偏好设置
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

// ==================== 阅读进度 ====================

/**
 * 获取文章阅读进度
 * GET /api/reading/progress/:articleId
 */
router.get('/reading/progress/:articleId', authenticateToken, async (req, res) => {
    const articleId = req.params.articleId;
    const userId = req.userId;
    
    try {
        const [rows] = await pool.query(
            `SELECT 
                progress_percent, scroll_position, 
                is_finished, last_read_at
             FROM reading_progress
             WHERE user_id = ? AND article_id = ?`,
            [userId, articleId]
        );
        
        if (rows.length === 0) {
            return res.json({
                hasProgress: false,
                progress: null
            });
        }
        
        res.json({
            hasProgress: true,
            progress: rows[0]
        });
    } catch (error) {
        console.error('获取阅读进度失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 保存阅读进度
 * POST /api/reading/progress
 */
router.post('/reading/progress', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const { articleId, progressPercent, scrollPosition, isFinished } = req.body;
    
    if (!articleId) {
        return res.status(400).json({ message: '缺少文章ID' });
    }
    
    try {
        const finishedAt = isFinished ? new Date() : null;
        
        await pool.query(
            `INSERT INTO reading_progress 
             (user_id, article_id, progress_percent, scroll_position, is_finished, finished_at)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             progress_percent = VALUES(progress_percent),
             scroll_position = VALUES(scroll_position),
             is_finished = VALUES(is_finished),
             finished_at = COALESCE(VALUES(finished_at), finished_at),
             last_read_at = CURRENT_TIMESTAMP`,
            [userId, articleId, progressPercent || 0, scrollPosition || 0, isFinished || false, finishedAt]
        );
        
        res.json({ message: '保存成功' });
    } catch (error) {
        console.error('保存阅读进度失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 获取用户阅读历史
 * GET /api/reading/history
 */
router.get('/reading/history', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const { page = 1, limit = 20, unfinishedOnly = false } = req.query;
    const offset = (page - 1) * limit;
    
    try {
        let query = `
            SELECT 
                rp.*,
                a.title, a.author_name, a.summary,
                COALESCE(s.view_count, 0) as views
             FROM reading_progress rp
             JOIN articles a ON rp.article_id = a.id
             LEFT JOIN article_stats s ON a.id = s.article_id
             WHERE rp.user_id = ?
        `;
        
        if (unfinishedOnly === 'true') {
            query += ' AND rp.is_finished = FALSE';
        }
        
        query += ` ORDER BY rp.last_read_at DESC LIMIT ? OFFSET ?`;
        
        const [rows] = await pool.query(query, [userId, parseInt(limit), parseInt(offset)]);
        
        const [countRows] = await pool.query(
            'SELECT COUNT(*) as total FROM reading_progress WHERE user_id = ?',
            [userId]
        );
        
        res.json({
            history: rows,
            total: countRows[0].total,
            page: parseInt(page),
            totalPages: Math.ceil(countRows[0].total / limit)
        });
    } catch (error) {
        console.error('获取阅读历史失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 删除阅读记录
 * DELETE /api/reading/progress/:articleId
 */
router.delete('/reading/progress/:articleId', authenticateToken, async (req, res) => {
    const articleId = req.params.articleId;
    const userId = req.userId;
    
    try {
        await pool.query(
            'DELETE FROM reading_progress WHERE user_id = ? AND article_id = ?',
            [userId, articleId]
        );
        
        res.json({ message: '删除成功' });
    } catch (error) {
        console.error('删除阅读记录失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// ==================== 阅读偏好 ====================

/**
 * 获取阅读偏好
 * GET /api/reading/preferences
 */
router.get('/reading/preferences', authenticateToken, async (req, res) => {
    const userId = req.userId;
    
    try {
        const [rows] = await pool.query(
            'SELECT * FROM reading_preferences WHERE user_id = ?',
            [userId]
        );
        
        if (rows.length === 0) {
            // 返回默认设置
            return res.json({
                preferences: {
                    font_size: 16,
                    line_height: 1.8,
                    theme: 'light',
                    font_family: 'system',
                    content_width: 'medium',
                    auto_night_mode: false
                }
            });
        }
        
        res.json({ preferences: rows[0] });
    } catch (error) {
        console.error('获取阅读偏好失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 保存阅读偏好
 * POST /api/reading/preferences
 */
router.post('/reading/preferences', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const { fontSize, lineHeight, theme, fontFamily, contentWidth, autoNightMode } = req.body;
    
    try {
        await pool.query(
            `INSERT INTO reading_preferences 
             (user_id, font_size, line_height, theme, font_family, content_width, auto_night_mode)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             font_size = VALUES(font_size),
             line_height = VALUES(line_height),
             theme = VALUES(theme),
             font_family = VALUES(font_family),
             content_width = VALUES(content_width),
             auto_night_mode = VALUES(auto_night_mode)`,
            [userId, fontSize, lineHeight, theme, fontFamily, contentWidth, autoNightMode]
        );
        
        res.json({ message: '保存成功' });
    } catch (error) {
        console.error('保存阅读偏好失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// ==================== 文章目录 ====================

/**
 * 获取文章目录
 * GET /api/reading/toc/:articleId
 */
router.get('/reading/toc/:articleId', async (req, res) => {
    const articleId = req.params.articleId;
    
    try {
        const [rows] = await pool.query(
            'SELECT content FROM articles WHERE id = ?',
            [articleId]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ message: '文章不存在' });
        }
        
        const content = rows[0].content;
        
        // 提取标题
        const toc = [];
        const headingRegex = /^(#{1,6})\s+(.+)$/gm;
        let match;
        
        while ((match = headingRegex.exec(content)) !== null) {
            const level = match[1].length;
            const text = match[2].trim();
            const id = 'heading-' + toc.length;
            
            toc.push({
                level,
                text,
                id
            });
        }
        
        res.json({ toc });
    } catch (error) {
        console.error('获取文章目录失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

module.exports = router;
