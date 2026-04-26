/**
 * 社交功能路由
 * 包含：关注系统、私信系统、@提及功能
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

// ==================== 关注系统 ====================

/**
 * 关注/取消关注用户
 * POST /api/social/follow
 */
router.post('/social/follow', authenticateToken, async (req, res) => {
    const { userId: targetUserId, action } = req.body;
    const currentUserId = req.userId;
    
    if (!targetUserId) {
        return res.status(400).json({ message: '缺少目标用户ID' });
    }
    
    if (targetUserId === currentUserId) {
        return res.status(400).json({ message: '不能关注自己' });
    }
    
    try {
        if (action === 'unfollow') {
            // 取消关注
            await pool.query(
                'DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?',
                [currentUserId, targetUserId]
            );
            res.json({ message: '已取消关注', isFollowing: false });
        } else {
            // 关注
            await pool.query(
                `INSERT INTO user_follows (follower_id, following_id) 
                 VALUES (?, ?) 
                 ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP`,
                [currentUserId, targetUserId]
            );
            res.json({ message: '关注成功', isFollowing: true });
        }
    } catch (error) {
        console.error('关注操作失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 检查是否关注
 * GET /api/social/follow/status/:userId
 */
router.get('/social/follow/status/:userId', authenticateToken, async (req, res) => {
    const targetUserId = req.params.userId;
    const currentUserId = req.userId;
    
    try {
        const [rows] = await pool.query(
            'SELECT id FROM user_follows WHERE follower_id = ? AND following_id = ?',
            [currentUserId, targetUserId]
        );
        
        res.json({ isFollowing: rows.length > 0 });
    } catch (error) {
        console.error('检查关注状态失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 获取关注列表
 * GET /api/social/following/:userId
 */
router.get('/social/following/:userId', async (req, res) => {
    const userId = req.params.userId;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    try {
        const [rows] = await pool.query(
            `SELECT 
                u.id, u.username, u.nickname, u.avatar,
                f.created_at as follow_time
             FROM user_follows f
             JOIN users u ON f.following_id = u.id
             WHERE f.follower_id = ?
             ORDER BY f.created_at DESC
             LIMIT ? OFFSET ?`,
            [userId, parseInt(limit), parseInt(offset)]
        );
        
        const [countRows] = await pool.query(
            'SELECT COUNT(*) as total FROM user_follows WHERE follower_id = ?',
            [userId]
        );
        
        res.json({
            users: rows,
            total: countRows[0].total,
            page: parseInt(page),
            totalPages: Math.ceil(countRows[0].total / limit)
        });
    } catch (error) {
        console.error('获取关注列表失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 获取粉丝列表
 * GET /api/social/followers/:userId
 */
router.get('/social/followers/:userId', async (req, res) => {
    const userId = req.params.userId;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    try {
        const [rows] = await pool.query(
            `SELECT 
                u.id, u.username, u.nickname, u.avatar,
                f.created_at as follow_time
             FROM user_follows f
             JOIN users u ON f.follower_id = u.id
             WHERE f.following_id = ?
             ORDER BY f.created_at DESC
             LIMIT ? OFFSET ?`,
            [userId, parseInt(limit), parseInt(offset)]
        );
        
        const [countRows] = await pool.query(
            'SELECT COUNT(*) as total FROM user_follows WHERE following_id = ?',
            [userId]
        );
        
        res.json({
            users: rows,
            total: countRows[0].total,
            page: parseInt(page),
            totalPages: Math.ceil(countRows[0].total / limit)
        });
    } catch (error) {
        console.error('获取粉丝列表失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// ==================== 私信系统 ====================

/**
 * 发送私信
 * POST /api/social/messages
 */
router.post('/social/messages', authenticateToken, async (req, res) => {
    const { receiverId, content } = req.body;
    const senderId = req.userId;
    
    if (!receiverId || !content) {
        return res.status(400).json({ message: '缺少必要参数' });
    }
    
    if (content.length > 2000) {
        return res.status(400).json({ message: '消息内容过长' });
    }
    
    try {
        const [result] = await pool.query(
            `INSERT INTO private_messages (sender_id, receiver_id, content) 
             VALUES (?, ?, ?)`,
            [senderId, receiverId, content]
        );
        
        // 获取刚发送的消息
        const [messageRows] = await pool.query(
            `SELECT m.*, 
                s.username as sender_name, s.nickname as sender_nickname, s.avatar as sender_avatar
             FROM private_messages m
             JOIN users s ON m.sender_id = s.id
             WHERE m.id = ?`,
            [result.insertId]
        );
        
        res.json({
            message: '发送成功',
            data: messageRows[0]
        });
    } catch (error) {
        console.error('发送私信失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 获取私信列表（对话）
 * GET /api/social/messages/:userId
 */
router.get('/social/messages/:userId', authenticateToken, async (req, res) => {
    const otherUserId = req.params.userId;
    const currentUserId = req.userId;
    const { page = 1, limit = 30 } = req.query;
    const offset = (page - 1) * limit;
    
    try {
        const [rows] = await pool.query(
            `SELECT 
                m.*,
                s.username as sender_name, s.nickname as sender_nickname, s.avatar as sender_avatar,
                r.username as receiver_name, r.nickname as receiver_nickname, r.avatar as receiver_avatar
             FROM private_messages m
             JOIN users s ON m.sender_id = s.id
             JOIN users r ON m.receiver_id = r.id
             WHERE (m.sender_id = ? AND m.receiver_id = ?) 
                OR (m.sender_id = ? AND m.receiver_id = ?)
             ORDER BY m.created_at DESC
             LIMIT ? OFFSET ?`,
            [currentUserId, otherUserId, otherUserId, currentUserId, parseInt(limit), parseInt(offset)]
        );
        
        // 标记消息为已读
        await pool.query(
            `UPDATE private_messages 
             SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
             WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE`,
            [otherUserId, currentUserId]
        );
        
        res.json({
            messages: rows.reverse(), // 按时间正序
            page: parseInt(page)
        });
    } catch (error) {
        console.error('获取私信列表失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 获取对话列表
 * GET /api/social/conversations
 */
router.get('/social/conversations', authenticateToken, async (req, res) => {
    const userId = req.userId;
    
    try {
        const [rows] = await pool.query(
            `SELECT 
                CASE 
                    WHEN m.sender_id = ? THEN m.receiver_id 
                    ELSE m.sender_id 
                END as other_user_id,
                u.username, u.nickname, u.avatar,
                m.content as last_message,
                m.created_at as last_message_time,
                m.is_read,
                (SELECT COUNT(*) FROM private_messages 
                 WHERE sender_id = other_user_id AND receiver_id = ? AND is_read = FALSE) as unread_count
             FROM private_messages m
             JOIN users u ON u.id = CASE 
                 WHEN m.sender_id = ? THEN m.receiver_id 
                 ELSE m.sender_id 
             END
             WHERE m.id IN (
                 SELECT MAX(id) FROM private_messages 
                 WHERE sender_id = ? OR receiver_id = ?
                 GROUP BY LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id)
             )
             ORDER BY m.created_at DESC`,
            [userId, userId, userId, userId, userId]
        );
        
        res.json({ conversations: rows });
    } catch (error) {
        console.error('获取对话列表失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 获取未读消息数
 * GET /api/social/messages/unread/count
 */
router.get('/social/messages/unread/count', authenticateToken, async (req, res) => {
    const userId = req.userId;
    
    try {
        const [rows] = await pool.query(
            'SELECT COUNT(*) as count FROM private_messages WHERE receiver_id = ? AND is_read = FALSE',
            [userId]
        );
        
        res.json({ unreadCount: rows[0].count });
    } catch (error) {
        console.error('获取未读消息数失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// ==================== @提及功能 ====================

/**
 * 创建提及通知
 * 这个函数被评论系统调用
 */
async function createMentionNotification(mentionedUserId, mentionedByUserId, articleId, commentId, content) {
    try {
        await pool.query(
            `INSERT INTO mention_notifications 
             (mentioned_user_id, mentioned_by_user_id, article_id, comment_id, content)
             VALUES (?, ?, ?, ?, ?)`,
            [mentionedUserId, mentionedByUserId, articleId, commentId, content]
        );
    } catch (error) {
        console.error('创建提及通知失败:', error);
    }
}

/**
 * 获取提及通知列表
 * GET /api/social/mentions
 */
router.get('/social/mentions', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const offset = (page - 1) * limit;
    
    try {
        let query = `
            SELECT 
                n.*,
                u.username as mentioned_by_name, u.nickname as mentioned_by_nickname, u.avatar as mentioned_by_avatar,
                a.title as article_title
             FROM mention_notifications n
             JOIN users u ON n.mentioned_by_user_id = u.id
             LEFT JOIN articles a ON n.article_id = a.id
             WHERE n.mentioned_user_id = ?
        `;
        
        if (unreadOnly === 'true') {
            query += ' AND n.is_read = FALSE';
        }
        
        query += ` ORDER BY n.created_at DESC LIMIT ? OFFSET ?`;
        
        const [rows] = await pool.query(query, [userId, parseInt(limit), parseInt(offset)]);
        
        const [countRows] = await pool.query(
            'SELECT COUNT(*) as total FROM mention_notifications WHERE mentioned_user_id = ? AND is_read = FALSE',
            [userId]
        );
        
        res.json({
            mentions: rows,
            unreadCount: countRows[0].total
        });
    } catch (error) {
        console.error('获取提及通知失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 标记提及为已读
 * PUT /api/social/mentions/:id/read
 */
router.put('/social/mentions/:id/read', authenticateToken, async (req, res) => {
    const mentionId = req.params.id;
    const userId = req.userId;
    
    try {
        await pool.query(
            'UPDATE mention_notifications SET is_read = TRUE WHERE id = ? AND mentioned_user_id = ?',
            [mentionId, userId]
        );
        
        res.json({ message: '已标记为已读' });
    } catch (error) {
        console.error('标记提及已读失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 标记所有提及为已读
 * PUT /api/social/mentions/read-all
 */
router.put('/social/mentions/read-all', authenticateToken, async (req, res) => {
    const userId = req.userId;
    
    try {
        await pool.query(
            'UPDATE mention_notifications SET is_read = TRUE WHERE mentioned_user_id = ?',
            [userId]
        );
        
        res.json({ message: '已全部标记为已读' });
    } catch (error) {
        console.error('标记所有提及已读失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

module.exports = { router, createMentionNotification };
