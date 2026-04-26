const express = require('express');
const { pool } = require('../db');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// --- 私信 (Private Messages) ---

// 获取会话列表（最近联系人）
router.get('/conversations', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;

        // 获取所有与当前用户有消息往来的用户，按最新消息排序
        const [rows] = await pool.query(`
            SELECT 
                u.id as user_id,
                u.username,
                u.avatar_url,
                m.content as last_message,
                m.created_at as last_time,
                m.sender_id as last_sender_id,
                (SELECT COUNT(*) FROM messages 
                 WHERE sender_id = u.id AND receiver_id = ? AND is_read = FALSE
                ) as unread_count
            FROM (
                SELECT 
                    CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as other_id,
                    MAX(id) as last_msg_id
                FROM messages
                WHERE sender_id = ? OR receiver_id = ?
                GROUP BY other_id
            ) conv
            JOIN messages m ON m.id = conv.last_msg_id
            JOIN users u ON u.id = conv.other_id
            ORDER BY m.created_at DESC
        `, [userId, userId, userId, userId]);

        res.json(rows);
    } catch (error) {
        console.error('获取会话列表失败:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 获取与某用户的聊天记录
router.get('/conversation/:userId', verifyToken, async (req, res) => {
    try {
        const myId = req.userId;
        const otherId = parseInt(req.params.userId);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 30;
        const offset = (page - 1) * limit;

        if (!otherId || isNaN(otherId)) {
            return res.status(400).json({ message: '无效的用户ID' });
        }

        const [messages] = await pool.query(`
            SELECT m.*, u.username as sender_name, u.avatar_url as sender_avatar
            FROM messages m
            JOIN users u ON u.id = m.sender_id
            WHERE (m.sender_id = ? AND m.receiver_id = ?)
               OR (m.sender_id = ? AND m.receiver_id = ?)
            ORDER BY m.created_at DESC
            LIMIT ? OFFSET ?
        `, [myId, otherId, otherId, myId, limit, offset]);

        // 标记对方发给我的消息为已读
        await pool.query(
            'UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE',
            [otherId, myId]
        );

        res.json(messages.reverse()); // 返回正序（旧→新）
    } catch (error) {
        console.error('获取聊天记录失败:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 发送私信
router.post('/send', verifyToken, async (req, res) => {
    try {
        const senderId = req.userId;
        const { receiverId, content } = req.body;

        if (!receiverId || !content || !content.trim()) {
            return res.status(400).json({ message: '缺少必要参数' });
        }

        if (content.length > 2000) {
            return res.status(400).json({ message: '消息内容不能超过2000字' });
        }

        if (parseInt(receiverId) === senderId) {
            return res.status(400).json({ message: '不能给自己发消息' });
        }

        // 检查接收者是否存在
        const [receiver] = await pool.query('SELECT id, username FROM users WHERE id = ?', [receiverId]);
        if (receiver.length === 0) {
            return res.status(404).json({ message: '用户不存在' });
        }

        await pool.query(
            'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
            [senderId, receiverId, content.trim()]
        );

        // 同时创建一条通知
        const [sender] = await pool.query('SELECT username FROM users WHERE id = ?', [senderId]);
        const senderName = sender.length > 0 ? sender[0].username : '某用户';
        await pool.query(
            'INSERT INTO notifications (user_id, type, title, content, related_id) VALUES (?, ?, ?, ?, ?)',
            [receiverId, 'system', '新私信', `${senderName} 给你发了一条私信`, senderId]
        );

        res.status(201).json({ message: '发送成功' });
    } catch (error) {
        console.error('发送私信失败:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 搜索用户（用于发起新对话）
router.get('/users/search', verifyToken, async (req, res) => {
    try {
        const keyword = req.query.q;
        const myId = req.userId;

        if (!keyword || keyword.trim().length < 1) {
            return res.json([]);
        }

        const [users] = await pool.query(
            'SELECT id, username, avatar_url FROM users WHERE username LIKE ? AND id != ? LIMIT 10',
            [`%${keyword.trim()}%`, myId]
        );

        res.json(users);
    } catch (error) {
        console.error('搜索用户失败:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- 系统通知 (Notifications) ---

// 获取通知列表
router.get('/notifications', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const [notifications] = await pool.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [userId, limit, offset]
        );

        const [countResult] = await pool.query(
            'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?',
            [userId]
        );

        res.json({
            notifications,
            pagination: {
                page,
                limit,
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('获取通知失败:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 标记通知为已读
router.put('/notifications/:id/read', verifyToken, async (req, res) => {
    try {
        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [req.params.id, req.userId]
        );
        res.json({ message: '已标记为已读' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 全部标记为已读
router.put('/notifications/read-all', verifyToken, async (req, res) => {
    try {
        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
            [req.userId]
        );
        res.json({ message: '全部已读' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 获取未读数量（私信 + 通知）
router.get('/unread-count', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;

        const [msgCount] = await pool.query(
            'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = FALSE',
            [userId]
        );

        const [notifCount] = await pool.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );

        res.json({
            messages: msgCount[0].count,
            notifications: notifCount[0].count,
            total: msgCount[0].count + notifCount[0].count
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 删除通知
router.delete('/notifications/:id', verifyToken, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [req.params.id, req.userId]
        );
        res.json({ message: '已删除' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
