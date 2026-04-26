/**
 * 社交功能深化路由
 * 包含：私信系统、兴趣群组、活动聚会、@提及系统
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../db');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: '未提供认证令牌' });
    try {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        return res.status(403).json({ message: '令牌无效' });
    }
};

// ========== 私信系统 ==========

// 获取会话列表
router.get('/conversations', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT c.*, 
                u1.username as participant1_name, u1.avatar as participant1_avatar,
                u2.username as participant2_name, u2.avatar as participant2_avatar,
                CASE WHEN c.participant1_id = ? THEN c.unread_count_1 ELSE c.unread_count_2 END as my_unread,
                pm.content as last_message_content,
                pm.created_at as last_message_time
            FROM conversations c
            JOIN users u1 ON c.participant1_id = u1.id
            JOIN users u2 ON c.participant2_id = u2.id
            LEFT JOIN private_messages pm ON c.last_message_id = pm.id
            WHERE c.participant1_id = ? OR c.participant2_id = ?
            ORDER BY c.last_message_at DESC`,
            [req.user.id, req.user.id, req.user.id]
        );

        const conversations = rows.map(c => ({
            id: c.id,
            other_user: c.participant1_id === req.user.id 
                ? { id: c.participant2_id, name: c.participant2_name, avatar: c.participant2_avatar }
                : { id: c.participant1_id, name: c.participant1_name, avatar: c.participant1_avatar },
            unread_count: c.my_unread,
            last_message: c.last_message_content,
            last_message_at: c.last_message_time,
            is_blocked: c.is_blocked
        }));

        res.json({ conversations });
    } catch (error) {
        console.error('获取会话列表错误:', error);
        res.status(500).json({ message: '获取失败' });
    }
});

// 获取或创建会话
router.post('/conversations', authenticateToken, async (req, res) => {
    try {
        const { user_id } = req.body;
        
        if (user_id === req.user.id) {
            return res.status(400).json({ message: '不能给自己发私信' });
        }

        // 检查是否已存在会话
        const [existing] = await pool.query(
            `SELECT * FROM conversations 
             WHERE (participant1_id = ? AND participant2_id = ?) 
             OR (participant1_id = ? AND participant2_id = ?)`,
            [req.user.id, user_id, user_id, req.user.id]
        );

        if (existing.length > 0) {
            return res.json({ conversation_id: existing[0].id });
        }

        // 创建新会话
        const [result] = await pool.query(
            'INSERT INTO conversations (participant1_id, participant2_id) VALUES (?, ?)',
            [Math.min(req.user.id, user_id), Math.max(req.user.id, user_id)]
        );

        res.json({ conversation_id: result.insertId });
    } catch (error) {
        console.error('创建会话错误:', error);
        res.status(500).json({ message: '创建失败' });
    }
});

// 获取消息列表
router.get('/conversations/:id/messages', authenticateToken, async (req, res) => {
    try {
        const conversationId = req.params.id;
        const { before_id, limit = 20 } = req.query;

        // 验证用户属于该会话
        const [conversation] = await pool.query(
            'SELECT * FROM conversations WHERE id = ? AND (participant1_id = ? OR participant2_id = ?)',
            [conversationId, req.user.id, req.user.id]
        );

        if (conversation.length === 0) {
            return res.status(403).json({ message: '无权访问该会话' });
        }

        let query = `SELECT pm.*, u.username as sender_name, u.avatar as sender_avatar
                     FROM private_messages pm
                     JOIN users u ON pm.sender_id = u.id
                     WHERE pm.conversation_id = ? AND (pm.is_deleted_by_sender = FALSE OR pm.sender_id != ?)
                     AND (pm.is_deleted_by_receiver = FALSE OR pm.receiver_id != ?)`;
        const params = [conversationId, req.user.id, req.user.id];

        if (before_id) {
            query += ' AND pm.id < ?';
            params.push(before_id);
        }

        query += ' ORDER BY pm.created_at DESC LIMIT ?';
        params.push(parseInt(limit));

        const [messages] = await pool.query(query, params);

        // 标记消息为已读
        await pool.query(
            `UPDATE private_messages SET is_read = TRUE, read_at = NOW()
             WHERE conversation_id = ? AND receiver_id = ? AND is_read = FALSE`,
            [conversationId, req.user.id]
        );

        // 重置未读计数
        await pool.query(
            `UPDATE conversations 
             SET unread_count_1 = CASE WHEN participant1_id = ? THEN 0 ELSE unread_count_1 END,
                 unread_count_2 = CASE WHEN participant2_id = ? THEN 0 ELSE unread_count_2 END
             WHERE id = ?`,
            [req.user.id, req.user.id, conversationId]
        );

        res.json({ messages: messages.reverse() });
    } catch (error) {
        console.error('获取消息错误:', error);
        res.status(500).json({ message: '获取失败' });
    }
});

// 发送消息
router.post('/conversations/:id/messages', authenticateToken, async (req, res) => {
    try {
        const conversationId = req.params.id;
        const { content, content_type = 'text', file_url } = req.body;

        const [conversation] = await pool.query(
            'SELECT * FROM conversations WHERE id = ? AND (participant1_id = ? OR participant2_id = ?)',
            [conversationId, req.user.id, req.user.id]
        );

        if (conversation.length === 0) {
            return res.status(403).json({ message: '无权访问' });
        }

        if (conversation[0].is_blocked) {
            return res.status(403).json({ message: '会话已被屏蔽' });
        }

        const receiverId = conversation[0].participant1_id === req.user.id 
            ? conversation[0].participant2_id 
            : conversation[0].participant1_id;

        const [result] = await pool.query(
            `INSERT INTO private_messages (conversation_id, sender_id, receiver_id, content, content_type, file_url)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [conversationId, req.user.id, receiverId, content, content_type, file_url]
        );

        // 更新会话最后消息
        await pool.query(
            `UPDATE conversations 
             SET last_message_id = ?, last_message_at = NOW(),
                 unread_count_1 = CASE WHEN participant1_id = ? THEN unread_count_1 + 1 ELSE unread_count_1 END,
                 unread_count_2 = CASE WHEN participant2_id = ? THEN unread_count_2 + 1 ELSE unread_count_2 END
             WHERE id = ?`,
            [result.insertId, receiverId, receiverId, conversationId]
        );

        res.json({ message_id: result.insertId, message: '发送成功' });
    } catch (error) {
        console.error('发送消息错误:', error);
        res.status(500).json({ message: '发送失败' });
    }
});

// ========== 兴趣群组 ==========

// 创建群组
router.post('/groups', authenticateToken, async (req, res) => {
    try {
        const { name, description, category, tags, is_public, join_type } = req.body;

        const [result] = await pool.query(
            `INSERT INTO groups (name, description, category, tags, creator_id, is_public, join_type)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, description, category, JSON.stringify(tags || []), req.user.id, is_public, join_type]
        );

        // 创建者自动成为群主
        await pool.query(
            'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
            [result.insertId, req.user.id, 'owner']
        );

        res.json({ group_id: result.insertId, message: '群组创建成功' });
    } catch (error) {
        console.error('创建群组错误:', error);
        res.status(500).json({ message: '创建失败' });
    }
});

// 获取群组列表
router.get('/groups', async (req, res) => {
    try {
        const { category, search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT g.*, u.username as creator_name FROM groups g JOIN users u ON g.creator_id = u.id WHERE g.is_public = TRUE';
        const params = [];

        if (category) {
            query += ' AND g.category = ?';
            params.push(category);
        }
        if (search) {
            query += ' AND (g.name LIKE ? OR g.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY g.member_count DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [rows] = await pool.query(query, params);
        res.json({ groups: rows });
    } catch (error) {
        res.status(500).json({ message: '获取失败' });
    }
});

// 获取群组详情
router.get('/groups/:id', async (req, res) => {
    try {
        const [groups] = await pool.query(
            `SELECT g.*, u.username as creator_name,
                (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as actual_member_count
             FROM groups g
             JOIN users u ON g.creator_id = u.id
             WHERE g.id = ?`,
            [req.params.id]
        );

        if (groups.length === 0) return res.status(404).json({ message: '群组不存在' });

        res.json(groups[0]);
    } catch (error) {
        res.status(500).json({ message: '获取失败' });
    }
});

// 加入群组
router.post('/groups/:id/join', authenticateToken, async (req, res) => {
    try {
        const groupId = req.params.id;
        const [group] = await pool.query('SELECT join_type FROM groups WHERE id = ?', [groupId]);

        if (group.length === 0) return res.status(404).json({ message: '群组不存在' });

        if (group[0].join_type === 'open') {
            await pool.query(
                'INSERT INTO group_members (group_id, user_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE joined_at = NOW()',
                [groupId, req.user.id]
            );
            res.json({ message: '加入成功' });
        } else {
            res.json({ message: '申请已发送，等待审核' });
        }
    } catch (error) {
        res.status(500).json({ message: '加入失败' });
    }
});

// 发布群组帖子
router.post('/groups/:id/posts', authenticateToken, async (req, res) => {
    try {
        const { title, content, content_type, attachments } = req.body;

        // 检查是否为成员
        const [member] = await pool.query(
            'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (member.length === 0) return res.status(403).json({ message: '非群组成员' });

        const [result] = await pool.query(
            `INSERT INTO group_posts (group_id, author_id, title, content, content_type, attachments)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.params.id, req.user.id, title, content, content_type, JSON.stringify(attachments || [])]
        );

        // 更新群组帖子数
        await pool.query('UPDATE groups SET post_count = post_count + 1 WHERE id = ?', [req.params.id]);

        res.json({ post_id: result.insertId, message: '发布成功' });
    } catch (error) {
        console.error('发布帖子错误:', error);
        res.status(500).json({ message: '发布失败' });
    }
});

// ========== 活动聚会 ==========

// 创建活动
router.post('/events', authenticateToken, async (req, res) => {
    try {
        const { title, description, event_type, start_time, end_time, location, 
                location_lat, location_lng, max_participants, requirements, fee, group_id } = req.body;

        const [result] = await pool.query(
            `INSERT INTO events (title, description, event_type, start_time, end_time, location,
             location_lat, location_lng, max_participants, organizer_id, group_id, requirements, fee)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description, event_type, start_time, end_time, location,
             location_lat, location_lng, max_participants, req.user.id, group_id, requirements, fee]
        );

        // 组织者自动报名
        await pool.query(
            'INSERT INTO event_participants (event_id, user_id, status) VALUES (?, ?, ?)',
            [result.insertId, req.user.id, 'registered']
        );

        res.json({ event_id: result.insertId, message: '活动创建成功' });
    } catch (error) {
        console.error('创建活动错误:', error);
        res.status(500).json({ message: '创建失败' });
    }
});

// 获取活动列表
router.get('/events', async (req, res) => {
    try {
        const { status = 'upcoming', type, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = `SELECT e.*, u.username as organizer_name,
                     (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id AND status = 'registered') as participant_count
                     FROM events e
                     JOIN users u ON e.organizer_id = u.id
                     WHERE e.status = ?`;
        const params = [status];

        if (type) {
            query += ' AND e.event_type = ?';
            params.push(type);
        }

        query += ' ORDER BY e.start_time ASC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [rows] = await pool.query(query, params);
        res.json({ events: rows });
    } catch (error) {
        res.status(500).json({ message: '获取失败' });
    }
});

// 报名活动
router.post('/events/:id/register', authenticateToken, async (req, res) => {
    try {
        const eventId = req.params.id;
        const [event] = await pool.query(
            'SELECT max_participants, current_participants FROM events WHERE id = ?',
            [eventId]
        );

        if (event.length === 0) return res.status(404).json({ message: '活动不存在' });
        if (event[0].current_participants >= event[0].max_participants && event[0].max_participants > 0) {
            return res.status(400).json({ message: '活动已满员' });
        }

        await pool.query(
            'INSERT INTO event_participants (event_id, user_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE status = "registered"',
            [eventId, req.user.id]
        );

        await pool.query('UPDATE events SET current_participants = current_participants + 1 WHERE id = ?', [eventId]);

        res.json({ message: '报名成功' });
    } catch (error) {
        res.status(500).json({ message: '报名失败' });
    }
});

// ========== @提及系统 ==========

// 处理@提及（在发布内容时调用）
router.post('/mentions/process', authenticateToken, async (req, res) => {
    try {
        const { content, content_type, content_id } = req.body;
        
        // 提取@用户名
        const mentions = content.match(/@(\w+)/g) || [];
        const usernames = mentions.map(m => m.slice(1));

        if (usernames.length === 0) return res.json({ mentions: [] });

        // 查找用户ID
        const [users] = await pool.query(
            'SELECT id, username FROM users WHERE username IN (?)',
            [usernames]
        );

        // 创建提及记录
        for (const user of users) {
            await pool.query(
                'INSERT INTO mentions (mentioned_user_id, mentioning_user_id, content_type, content_id) VALUES (?, ?, ?, ?)',
                [user.id, req.user.id, content_type, content_id]
            );

            // 发送通知
            await pool.query(
                'INSERT INTO notifications (user_id, type, title, content, related_id) VALUES (?, ?, ?, ?, ?)',
                [user.id, 'mention', '有人提到了你', `${req.user.username} 在${content_type === 'article' ? '文章' : '评论'}中提到了你`, content_id]
            );
        }

        res.json({ mentions: users.map(u => u.username) });
    } catch (error) {
        console.error('处理提及错误:', error);
        res.status(500).json({ message: '处理失败' });
    }
});

// 获取用户的@提及列表
router.get('/mentions', authenticateToken, async (req, res) => {
    try {
        const { is_read, limit = 20 } = req.query;
        
        let query = `SELECT m.*, u.username as mentioning_user_name, u.avatar as mentioning_user_avatar
                     FROM mentions m
                     JOIN users u ON m.mentioning_user_id = u.id
                     WHERE m.mentioned_user_id = ?`;
        const params = [req.user.id];

        if (is_read !== undefined) {
            query += ' AND m.is_read = ?';
            params.push(is_read === 'true');
        }

        query += ' ORDER BY m.created_at DESC LIMIT ?';
        params.push(parseInt(limit));

        const [rows] = await pool.query(query, params);
        res.json({ mentions: rows });
    } catch (error) {
        res.status(500).json({ message: '获取失败' });
    }
});

// 标记提及为已读
router.post('/mentions/:id/read', authenticateToken, async (req, res) => {
    try {
        await pool.query(
            'UPDATE mentions SET is_read = TRUE WHERE id = ? AND mentioned_user_id = ?',
            [req.params.id, req.user.id]
        );
        res.json({ message: '已标记为已读' });
    } catch (error) {
        res.status(500).json({ message: '标记失败' });
    }
});

module.exports = router;
