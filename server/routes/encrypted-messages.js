/**
 * 端到端加密消息路由
 * End-to-End Encrypted Messages Routes
 */
const express = require('express');
const crypto = require('crypto');
const { pool } = require('../db');
const router = express.Router();

// 认证中间件
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid token' });
    }
};

// 1. 创建加密会话
router.post('/sessions', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { targetUserId, publicKey } = req.body;
        
        if (!targetUserId || !publicKey) {
            return res.status(400).json({ message: 'Target user ID and public key required' });
        }
        
        // 检查目标用户是否存在
        const [targetUsers] = await pool.execute('SELECT id FROM users WHERE id = ?', [targetUserId]);
        if (targetUsers.length === 0) {
            return res.status(404).json({ message: 'Target user not found' });
        }
        
        // 确保 user1_id < user2_id 以避免重复会话
        const user1Id = userId < targetUserId ? userId : targetUserId;
        const user2Id = userId < targetUserId ? targetUserId : userId;
        const user1Key = userId < targetUserId ? publicKey : null;
        const user2Key = userId < targetUserId ? null : publicKey;
        
        // 检查是否已有会话
        const [existing] = await pool.execute(
            'SELECT * FROM encrypted_sessions WHERE user1_id = ? AND user2_id = ?',
            [user1Id, user2Id]
        );
        
        if (existing.length > 0) {
            // 更新公钥
            if (userId < targetUserId) {
                await pool.execute(
                    'UPDATE encrypted_sessions SET user1_public_key = ? WHERE id = ?',
                    [publicKey, existing[0].id]
                );
            } else {
                await pool.execute(
                    'UPDATE encrypted_sessions SET user2_public_key = ? WHERE id = ?',
                    [publicKey, existing[0].id]
                );
            }
            
            return res.json({
                success: true,
                data: { sessionId: existing[0].id }
            });
        }
        
        // 创建新会话
        const [result] = await pool.execute(
            `INSERT INTO encrypted_sessions (user1_id, user2_id, user1_public_key, user2_public_key) 
             VALUES (?, ?, ?, ?)`,
            [user1Id, user2Id, user1Key, user2Key]
        );
        
        res.json({
            success: true,
            data: { sessionId: result.insertId }
        });
    } catch (error) {
        console.error('Create encrypted session error:', error);
        res.status(500).json({ message: 'Failed to create encrypted session' });
    }
});

// 2. 获取会话公钥
router.get('/sessions/:sessionId/public-key', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { sessionId } = req.params;
        
        const [sessions] = await pool.execute(
            'SELECT * FROM encrypted_sessions WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
            [sessionId, userId, userId]
        );
        
        if (sessions.length === 0) {
            return res.status(404).json({ message: 'Session not found' });
        }
        
        const session = sessions[0];
        const otherUserKey = session.user1_id === userId ? session.user2_public_key : session.user1_public_key;
        
        res.json({
            success: true,
            data: { publicKey: otherUserKey }
        });
    } catch (error) {
        console.error('Get public key error:', error);
        res.status(500).json({ message: 'Failed to get public key' });
    }
});

// 3. 发送加密消息
router.post('/messages', authenticateToken, async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiverId, sessionId, encryptedContent, nonce, ephemeralPublicKey } = req.body;
        
        if (!receiverId || !sessionId || !encryptedContent || !nonce) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        // 验证会话
        const [sessions] = await pool.execute(
            'SELECT * FROM encrypted_sessions WHERE id = ? AND is_active = TRUE',
            [sessionId]
        );
        
        if (sessions.length === 0) {
            return res.status(404).json({ message: 'Session not found or inactive' });
        }
        
        const session = sessions[0];
        if (session.user1_id !== senderId && session.user2_id !== senderId) {
            return res.status(403).json({ message: 'Not authorized for this session' });
        }
        
        // 保存加密消息
        const [result] = await pool.execute(
            `INSERT INTO encrypted_messages 
            (sender_id, receiver_id, session_id, encrypted_content, nonce, ephemeral_public_key) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [senderId, receiverId, sessionId, encryptedContent, nonce, ephemeralPublicKey || null]
        );
        
        res.json({
            success: true,
            data: { messageId: result.insertId }
        });
    } catch (error) {
        console.error('Send encrypted message error:', error);
        res.status(500).json({ message: 'Failed to send encrypted message' });
    }
});

// 4. 获取加密消息
router.get('/messages/:sessionId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { sessionId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;
        
        // 验证会话权限
        const [sessions] = await pool.execute(
            'SELECT * FROM encrypted_sessions WHERE id = ?',
            [sessionId]
        );
        
        if (sessions.length === 0) {
            return res.status(404).json({ message: 'Session not found' });
        }
        
        const session = sessions[0];
        if (session.user1_id !== userId && session.user2_id !== userId) {
            return res.status(403).json({ message: 'Not authorized for this session' });
        }
        
        // 获取消息
        const [messages] = await pool.execute(
            `SELECT em.*, u.username as sender_username 
            FROM encrypted_messages em
            JOIN users u ON em.sender_id = u.id
            WHERE em.session_id = ?
            ORDER BY em.created_at DESC
            LIMIT ? OFFSET ?`,
            [sessionId, parseInt(limit), parseInt(offset)]
        );
        
        // 标记消息为已读
        await pool.execute(
            `UPDATE encrypted_messages 
            SET read_at = NOW() 
            WHERE session_id = ? AND receiver_id = ? AND read_at IS NULL`,
            [sessionId, userId]
        );
        
        res.json({
            success: true,
            data: { messages }
        });
    } catch (error) {
        console.error('Get encrypted messages error:', error);
        res.status(500).json({ message: 'Failed to get encrypted messages' });
    }
});

// 5. 获取用户的所有加密会话
router.get('/sessions', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [sessions] = await pool.execute(
            `SELECT 
                es.id,
                es.user1_id,
                es.user2_id,
                es.created_at,
                es.is_active,
                CASE WHEN es.user1_id = ? THEN u2.username ELSE u1.username END as other_username,
                CASE WHEN es.user1_id = ? THEN u2.id ELSE u1.id END as other_user_id,
                (SELECT COUNT(*) FROM encrypted_messages 
                 WHERE session_id = es.id AND receiver_id = ? AND read_at IS NULL) as unread_count,
                (SELECT encrypted_content FROM encrypted_messages 
                 WHERE session_id = es.id ORDER BY created_at DESC LIMIT 1) as last_message
            FROM encrypted_sessions es
            JOIN users u1 ON es.user1_id = u1.id
            JOIN users u2 ON es.user2_id = u2.id
            WHERE es.user1_id = ? OR es.user2_id = ?
            ORDER BY es.updated_at DESC`,
            [userId, userId, userId, userId, userId]
        );
        
        res.json({
            success: true,
            data: { sessions }
        });
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ message: 'Failed to get sessions' });
    }
});

// 6. 关闭加密会话
router.delete('/sessions/:sessionId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { sessionId } = req.params;
        
        const [sessions] = await pool.execute(
            'SELECT * FROM encrypted_sessions WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
            [sessionId, userId, userId]
        );
        
        if (sessions.length === 0) {
            return res.status(404).json({ message: 'Session not found' });
        }
        
        await pool.execute(
            'UPDATE encrypted_sessions SET is_active = FALSE WHERE id = ?',
            [sessionId]
        );
        
        res.json({
            success: true,
            message: 'Session closed'
        });
    } catch (error) {
        console.error('Close session error:', error);
        res.status(500).json({ message: 'Failed to close session' });
    }
});

// 7. 删除加密消息
router.delete('/messages/:messageId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { messageId } = req.params;
        
        const [messages] = await pool.execute(
            'SELECT * FROM encrypted_messages WHERE id = ? AND sender_id = ?',
            [messageId, userId]
        );
        
        if (messages.length === 0) {
            return res.status(404).json({ message: 'Message not found or not authorized' });
        }
        
        await pool.execute('DELETE FROM encrypted_messages WHERE id = ?', [messageId]);
        
        res.json({
            success: true,
            message: 'Message deleted'
        });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ message: 'Failed to delete message' });
    }
});

module.exports = router;
