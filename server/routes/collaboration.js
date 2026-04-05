/**
 * 实时协作系统路由
 * 第六轮创新性功能 - Real-time Collaboration System
 * 
 * 功能模块：
 * 3.1 多人实时编辑
 * 3.2 在线白板
 * 3.3 视频会议集成
 * 3.4 屏幕共享
 */

const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Supabase客户端
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 内存存储（生产环境应使用Redis）
const rooms = new Map();
const activeUsers = new Map();
const whiteboards = new Map();

// 中间件：验证请求
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// ==================== 3.1 多人实时编辑 ====================

/**
 * 创建协作房间
 * POST /api/collaboration/rooms
 */
router.post('/rooms', async (req, res) => {
    try {
        const { articleId, name, maxUsers = 10 } = req.body;
        const user = req.user;

        const roomId = uuidv4();
        const room = {
            id: roomId,
            articleId,
            name: name || `协作房间 ${roomId.slice(0, 8)}`,
            hostId: user.id,
            maxUsers,
            users: new Map(),
            content: '', // 当前协作内容
            version: 0,  // 版本号
            operations: [], // 操作历史
            createdAt: new Date(),
            settings: {
                allowEdit: true,
                allowChat: true,
                saveToArticle: true
            }
        };

        rooms.set(roomId, room);

        // 保存到数据库
        await supabase.from('collaboration_rooms').insert({
            id: roomId,
            article_id: articleId,
            name: room.name,
            host_id: user.id,
            max_users: maxUsers,
            settings: room.settings
        });

        res.json({
            success: true,
            data: {
                roomId,
                name: room.name,
                inviteLink: `${process.env.FRONTEND_URL}/collab/${roomId}`,
                wsUrl: `/ws/collab/${roomId}`
            }
        });
    } catch (error) {
        console.error('Create Room Error:', error);
        res.status(500).json({ error: '创建房间失败' });
    }
});

/**
 * 获取房间信息
 * GET /api/collaboration/rooms/:roomId
 */
router.get('/rooms/:roomId', async (req, res) => {
    try {
        const { roomId } = req.params;
        const room = rooms.get(roomId);

        if (!room) {
            // 从数据库查询
            const { data } = await supabase
                .from('collaboration_rooms')
                .select('*')
                .eq('id', roomId)
                .single();
            
            if (!data) {
                return res.status(404).json({ error: '房间不存在' });
            }
            
            return res.json({
                success: true,
                data: {
                    id: data.id,
                    name: data.name,
                    articleId: data.article_id,
                    hostId: data.host_id,
                    maxUsers: data.max_users,
                    userCount: 0,
                    isActive: false
                }
            });
        }

        res.json({
            success: true,
            data: {
                id: room.id,
                name: room.name,
                articleId: room.articleId,
                hostId: room.hostId,
                maxUsers: room.maxUsers,
                userCount: room.users.size,
                users: Array.from(room.users.values()).map(u => ({
                    id: u.id,
                    name: u.name,
                    avatar: u.avatar,
                    cursor: u.cursor,
                    color: u.color
                })),
                isActive: true,
                version: room.version
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取房间信息失败' });
    }
});

/**
 * 加入房间
 * POST /api/collaboration/rooms/:roomId/join
 */
router.post('/rooms/:roomId/join', async (req, res) => {
    try {
        const { roomId } = req.params;
        const { token } = req.body;
        const user = req.user;

        const room = rooms.get(roomId);
        if (!room) {
            return res.status(404).json({ error: '房间不存在或已关闭' });
        }

        if (room.users.size >= room.maxUsers) {
            return res.status(403).json({ error: '房间已满' });
        }

        // 分配用户颜色
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
        const userColor = colors[room.users.size % colors.length];

        const participant = {
            id: user.id,
            name: user.username,
            avatar: user.avatar,
            color: userColor,
            cursor: { line: 1, ch: 0 },
            selection: null,
            joinedAt: new Date(),
            canEdit: room.hostId === user.id || room.settings.allowEdit
        };

        room.users.set(user.id, participant);
        activeUsers.set(user.id, { roomId, joinedAt: new Date() });

        // 广播用户加入
        broadcastToRoom(roomId, {
            type: 'user_joined',
            data: {
                user: {
                    id: participant.id,
                    name: participant.name,
                    avatar: participant.avatar,
                    color: participant.color
                },
                userCount: room.users.size
            }
        });

        res.json({
            success: true,
            data: {
                participant,
                content: room.content,
                version: room.version,
                users: Array.from(room.users.values())
            }
        });
    } catch (error) {
        res.status(500).json({ error: '加入房间失败' });
    }
});

/**
 * 离开房间
 * POST /api/collaboration/rooms/:roomId/leave
 */
router.post('/rooms/:roomId/leave', async (req, res) => {
    try {
        const { roomId } = req.params;
        const user = req.user;
        const room = rooms.get(roomId);

        if (room) {
            room.users.delete(user.id);
            activeUsers.delete(user.id);

            // 广播用户离开
            broadcastToRoom(roomId, {
                type: 'user_left',
                data: {
                    userId: user.id,
                    userCount: room.users.size
                }
            });

            // 如果房间空了，保存内容并清理
            if (room.users.size === 0) {
                await saveRoomContent(room);
                rooms.delete(roomId);
            }
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: '离开房间失败' });
    }
});

/**
 * 同步编辑操作
 * POST /api/collaboration/rooms/:roomId/operations
 */
router.post('/rooms/:roomId/operations', async (req, res) => {
    try {
        const { roomId } = req.params;
        const { operation, baseVersion } = req.body;
        const user = req.user;

        const room = rooms.get(roomId);
        if (!room) {
            return res.status(404).json({ error: '房间不存在' });
        }

        const participant = room.users.get(user.id);
        if (!participant || !participant.canEdit) {
            return res.status(403).json({ error: '没有编辑权限' });
        }

        // 操作转换 (OT) 处理冲突
        let transformedOp = operation;
        if (baseVersion < room.version) {
            // 需要转换操作
            for (let i = baseVersion; i < room.operations.length; i++) {
                transformedOp = transformOperation(transformedOp, room.operations[i]);
            }
        }

        // 应用操作
        room.content = applyOperation(room.content, transformedOp);
        room.version++;
        room.operations.push({
            ...transformedOp,
            userId: user.id,
            timestamp: new Date(),
            version: room.version
        });

        // 广播给其他人
        broadcastToRoom(roomId, {
            type: 'operation',
            data: {
                operation: transformedOp,
                version: room.version,
                userId: user.id
            }
        }, user.id);

        res.json({
            success: true,
            data: { version: room.version }
        });
    } catch (error) {
        res.status(500).json({ error: '同步失败' });
    }
});

/**
 * 更新光标位置
 * POST /api/collaboration/rooms/:roomId/cursor
 */
router.post('/rooms/:roomId/cursor', async (req, res) => {
    try {
        const { roomId } = req.params;
        const { cursor, selection } = req.body;
        const user = req.user;

        const room = rooms.get(roomId);
        if (!room) return res.json({ success: true });

        const participant = room.users.get(user.id);
        if (participant) {
            participant.cursor = cursor;
            participant.selection = selection;

            // 广播光标位置
            broadcastToRoom(roomId, {
                type: 'cursor_update',
                data: {
                    userId: user.id,
                    cursor,
                    selection,
                    color: participant.color
                }
            }, user.id);
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: '更新光标失败' });
    }
});

/**
 * 发送聊天消息
 * POST /api/collaboration/rooms/:roomId/chat
 */
router.post('/rooms/:roomId/chat', async (req, res) => {
    try {
        const { roomId } = req.params;
        const { message, type = 'text' } = req.body;
        const user = req.user;

        const room = rooms.get(roomId);
        if (!room) {
            return res.status(404).json({ error: '房间不存在' });
        }

        const chatMessage = {
            id: uuidv4(),
            userId: user.id,
            userName: user.username,
            userAvatar: user.avatar,
            type,
            content: message,
            timestamp: new Date()
        };

        // 保存到数据库
        await supabase.from('collaboration_messages').insert({
            room_id: roomId,
            user_id: user.id,
            type,
            content: message
        });

        // 广播消息
        broadcastToRoom(roomId, {
            type: 'chat_message',
            data: chatMessage
        });

        res.json({ success: true, data: chatMessage });
    } catch (error) {
        res.status(500).json({ error: '发送消息失败' });
    }
});

/**
 * 获取聊天历史
 * GET /api/collaboration/rooms/:roomId/messages
 */
router.get('/rooms/:roomId/messages', async (req, res) => {
    try {
        const { roomId } = req.params;
        const { limit = 50, before } = req.query;

        let query = supabase
            .from('collaboration_messages')
            .select(`
                id,
                type,
                content,
                created_at,
                users:user_id (id, username, avatar_url)
            `)
            .eq('room_id', roomId)
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));

        if (before) {
            query = query.lt('created_at', before);
        }

        const { data, error } = await query;
        if (error) throw error;

        res.json({
            success: true,
            data: data.map(msg => ({
                id: msg.id,
                type: msg.type,
                content: msg.content,
                timestamp: msg.created_at,
                user: msg.users
            }))
        });
    } catch (error) {
        res.status(500).json({ error: '获取消息失败' });
    }
});

// ==================== 3.2 在线白板 ====================

/**
 * 创建白板
 * POST /api/collaboration/whiteboards
 */
router.post('/whiteboards', async (req, res) => {
    try {
        const { name, width = 1920, height = 1080, template = 'blank' } = req.body;
        const user = req.user;

        const boardId = uuidv4();
        const board = {
            id: boardId,
            name: name || '未命名白板',
            width,
            height,
            ownerId: user.id,
            elements: [], // 白板元素
            users: new Map(),
            createdAt: new Date(),
            template
        };

        whiteboards.set(boardId, board);

        // 如果是模板，初始化元素
        if (template !== 'blank') {
            board.elements = getTemplateElements(template);
        }

        await supabase.from('whiteboards').insert({
            id: boardId,
            name: board.name,
            width,
            height,
            owner_id: user.id,
            template
        });

        res.json({
            success: true,
            data: {
                boardId,
                name: board.name,
                width,
                height,
                inviteLink: `${process.env.FRONTEND_URL}/whiteboard/${boardId}`
            }
        });
    } catch (error) {
        res.status(500).json({ error: '创建白板失败' });
    }
});

/**
 * 获取白板
 * GET /api/collaboration/whiteboards/:boardId
 */
router.get('/whiteboards/:boardId', async (req, res) => {
    try {
        const { boardId } = req.params;
        const board = whiteboards.get(boardId);

        if (!board) {
            const { data } = await supabase
                .from('whiteboards')
                .select('*')
                .eq('id', boardId)
                .single();
            
            if (!data) {
                return res.status(404).json({ error: '白板不存在' });
            }

            return res.json({
                success: true,
                data: {
                    id: data.id,
                    name: data.name,
                    width: data.width,
                    height: data.height,
                    elements: data.elements || []
                }
            });
        }

        res.json({
            success: true,
            data: {
                id: board.id,
                name: board.name,
                width: board.width,
                height: board.height,
                elements: board.elements,
                userCount: board.users.size
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取白板失败' });
    }
});

/**
 * 更新白板元素
 * POST /api/collaboration/whiteboards/:boardId/elements
 */
router.post('/whiteboards/:boardId/elements', async (req, res) => {
    try {
        const { boardId } = req.params;
        const { elements, action } = req.body;
        const user = req.user;

        const board = whiteboards.get(boardId);
        if (!board) {
            return res.status(404).json({ error: '白板不存在' });
        }

        switch (action) {
            case 'add':
                elements.forEach(el => {
                    el.id = el.id || uuidv4();
                    el.createdBy = user.id;
                    el.createdAt = new Date();
                    board.elements.push(el);
                });
                break;
            case 'update':
                elements.forEach(el => {
                    const index = board.elements.findIndex(e => e.id === el.id);
                    if (index !== -1) {
                        board.elements[index] = { ...board.elements[index], ...el };
                    }
                });
                break;
            case 'delete':
                board.elements = board.elements.filter(e => 
                    !elements.some(del => del.id === e.id)
                );
                break;
            case 'clear':
                board.elements = [];
                break;
        }

        // 广播更新
        broadcastToBoard(boardId, {
            type: 'elements_update',
            data: { elements, action, userId: user.id }
        });

        res.json({ success: true, data: { elements: board.elements } });
    } catch (error) {
        res.status(500).json({ error: '更新失败' });
    }
});

/**
 * 白板实时绘图数据
 * POST /api/collaboration/whiteboards/:boardId/draw
 */
router.post('/whiteboards/:boardId/draw', async (req, res) => {
    try {
        const { boardId } = req.params;
        const { strokes } = req.body;
        const user = req.user;

        // 广播绘图数据给其他用户
        broadcastToBoard(boardId, {
            type: 'draw_strokes',
            data: {
                strokes,
                userId: user.id,
                timestamp: new Date()
            }
        }, user.id);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: '绘图失败' });
    }
});

/**
 * 保存白板
 * POST /api/collaboration/whiteboards/:boardId/save
 */
router.post('/whiteboards/:boardId/save', async (req, res) => {
    try {
        const { boardId } = req.params;
        const { name } = req.body;
        const board = whiteboards.get(boardId);

        if (!board) {
            return res.status(404).json({ error: '白板不存在' });
        }

        await supabase.from('whiteboards').update({
            name: name || board.name,
            elements: board.elements,
            updated_at: new Date()
        }).eq('id', boardId);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: '保存失败' });
    }
});

// ==================== 3.3 视频会议集成 ====================

/**
 * 创建视频会议房间
 * POST /api/collaboration/video/rooms
 */
router.post('/video/rooms', async (req, res) => {
    try {
        const { name, maxParticipants = 20 } = req.body;
        const user = req.user;

        const roomId = uuidv4();
        
        // 生成100ms/LiveKit等视频服务token
        const videoToken = await generateVideoToken(roomId, user.id);

        await supabase.from('video_rooms').insert({
            id: roomId,
            name: name || `会议 ${roomId.slice(0, 8)}`,
            host_id: user.id,
            max_participants: maxParticipants,
            status: 'active'
        });

        res.json({
            success: true,
            data: {
                roomId,
                name: name || `会议 ${roomId.slice(0, 8)}`,
                token: videoToken,
                wsUrl: process.env.VIDEO_WS_URL,
                inviteLink: `${process.env.FRONTEND_URL}/video/${roomId}`
            }
        });
    } catch (error) {
        res.status(500).json({ error: '创建会议失败' });
    }
});

/**
 * 加入视频会议
 * POST /api/collaboration/video/rooms/:roomId/join
 */
router.post('/video/rooms/:roomId/join', async (req, res) => {
    try {
        const { roomId } = req.params;
        const user = req.user;

        const { data: room } = await supabase
            .from('video_rooms')
            .select('*')
            .eq('id', roomId)
            .single();

        if (!room || room.status !== 'active') {
            return res.status(404).json({ error: '会议不存在或已结束' });
        }

        // 生成用户token
        const token = await generateVideoToken(roomId, user.id, {
            username: user.username,
            avatar: user.avatar
        });

        // 记录参与者
        await supabase.from('video_participants').upsert({
            room_id: roomId,
            user_id: user.id,
            joined_at: new Date()
        });

        res.json({
            success: true,
            data: {
                token,
                roomName: room.name,
                wsUrl: process.env.VIDEO_WS_URL
            }
        });
    } catch (error) {
        res.status(500).json({ error: '加入会议失败' });
    }
});

/**
 * 获取会议参与者
 * GET /api/collaboration/video/rooms/:roomId/participants
 */
router.get('/video/rooms/:roomId/participants', async (req, res) => {
    try {
        const { roomId } = req.params;

        const { data } = await supabase
            .from('video_participants')
            .select(`
                user_id,
                joined_at,
                is_screen_sharing,
                is_muted,
                is_video_off,
                users:user_id (username, avatar_url)
            `)
            .eq('room_id', roomId)
            .is('left_at', null);

        res.json({
            success: true,
            data: data.map(p => ({
                userId: p.user_id,
                username: p.users?.username,
                avatar: p.users?.avatar_url,
                joinedAt: p.joined_at,
                isScreenSharing: p.is_screen_sharing,
                isMuted: p.is_muted,
                isVideoOff: p.is_video_off
            }))
        });
    } catch (error) {
        res.status(500).json({ error: '获取参与者失败' });
    }
});

// ==================== 3.4 屏幕共享 ====================

/**
 * 开始屏幕共享
 * POST /api/collaboration/screen/start
 */
router.post('/screen/start', async (req, res) => {
    try {
        const { roomId, roomType = 'video' } = req.body;
        const user = req.user;

        // 更新用户的屏幕共享状态
        if (roomType === 'video') {
            await supabase.from('video_participants').update({
                is_screen_sharing: true
            }).eq('room_id', roomId).eq('user_id', user.id);
        }

        // 广播屏幕共享开始
        const broadcastTarget = roomType === 'collab' ? roomId : `video_${roomId}`;
        broadcast(broadcastTarget, {
            type: 'screen_share_started',
            data: {
                userId: user.id,
                username: user.username
            }
        });

        res.json({
            success: true,
            data: {
                shareId: `${user.id}_${Date.now()}`,
                quality: '1080p',
                fps: 30
            }
        });
    } catch (error) {
        res.status(500).json({ error: '开始屏幕共享失败' });
    }
});

/**
 * 停止屏幕共享
 * POST /api/collaboration/screen/stop
 */
router.post('/screen/stop', async (req, res) => {
    try {
        const { roomId, roomType = 'video' } = req.body;
        const user = req.user;

        await supabase.from('video_participants').update({
            is_screen_sharing: false
        }).eq('room_id', roomId).eq('user_id', user.id);

        const broadcastTarget = roomType === 'collab' ? roomId : `video_${roomId}`;
        broadcast(broadcastTarget, {
            type: 'screen_share_stopped',
            data: { userId: user.id }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: '停止屏幕共享失败' });
    }
});

/**
 * 获取屏幕共享信号
 * POST /api/collaboration/screen/signal
 */
router.post('/screen/signal', async (req, res) => {
    try {
        const { roomId, signal, targetUserId } = req.body;
        const user = req.user;

        // WebRTC信令转发
        broadcastToUser(targetUserId, {
            type: 'screen_signal',
            data: {
                from: user.id,
                signal
            }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: '信令转发失败' });
    }
});

// ==================== 辅助函数 ====================

/**
 * 广播消息到房间
 */
function broadcastToRoom(roomId, message, excludeUserId = null) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.users.forEach((user, userId) => {
        if (userId !== excludeUserId && user.ws) {
            user.ws.send(JSON.stringify(message));
        }
    });
}

/**
 * 广播消息到白板
 */
function broadcastToBoard(boardId, message, excludeUserId = null) {
    const board = whiteboards.get(boardId);
    if (!board) return;

    board.users.forEach((user, userId) => {
        if (userId !== excludeUserId && user.ws) {
            user.ws.send(JSON.stringify(message));
        }
    });
}

/**
 * 广播消息
 */
function broadcast(target, message) {
    // 实现广播逻辑
}

/**
 * 发送消息给特定用户
 */
function broadcastToUser(userId, message) {
    // 实现点对点消息
}

/**
 * 操作转换 (Operational Transformation)
 */
function transformOperation(op1, op2) {
    // 简化的OT实现
    // 实际应用需要完整的OT算法或CRDT
    return op1;
}

/**
 * 应用操作到文档
 */
function applyOperation(content, operation) {
    switch (operation.type) {
        case 'insert':
            return content.slice(0, operation.position) + 
                   operation.text + 
                   content.slice(operation.position);
        case 'delete':
            return content.slice(0, operation.position) + 
                   content.slice(operation.position + operation.length);
        case 'retain':
            return content;
        default:
            return content;
    }
}

/**
 * 保存房间内容
 */
async function saveRoomContent(room) {
    if (room.settings.saveToArticle && room.articleId) {
        await supabase.from('articles').update({
            content: room.content,
            updated_at: new Date()
        }).eq('id', room.articleId);
    }

    // 保存操作历史
    await supabase.from('collaboration_snapshots').insert({
        room_id: room.id,
        content: room.content,
        version: room.version,
        created_at: new Date()
    });
}

/**
 * 获取白板模板元素
 */
function getTemplateElements(template) {
    const templates = {
        brainstorming: [
            { type: 'text', x: 50, y: 50, text: '中心主题', style: { fontSize: 24, color: '#333' } },
            { type: 'sticky', x: 100, y: 200, text: '想法1', color: '#FFD93D' },
            { type: 'sticky', x: 300, y: 200, text: '想法2', color: '#6BCB77' },
            { type: 'sticky', x: 500, y: 200, text: '想法3', color: '#4D96FF' }
        ],
        flowchart: [
            { type: 'shape', x: 100, y: 100, shape: 'rect', text: '开始' },
            { type: 'shape', x: 100, y: 250, shape: 'diamond', text: '判断' },
            { type: 'shape', x: 100, y: 400, shape: 'rect', text: '结束' },
            { type: 'arrow', x1: 150, y1: 150, x2: 150, y2: 250 }
        ],
        kanban: [
            { type: 'column', x: 50, y: 50, title: '待办', color: '#FFE5E5' },
            { type: 'column', x: 350, y: 50, title: '进行中', color: '#FFF4E5' },
            { type: 'column', x: 650, y: 50, title: '已完成', color: '#E5F5E5' }
        ]
    };
    return templates[template] || [];
}

/**
 * 生成视频服务Token
 */
async function generateVideoToken(roomId, userId, metadata = {}) {
    // 集成100ms、LiveKit或Agora
    // 返回JWT token
    const jwt = require('jsonwebtoken');
    return jwt.sign({
        room_id: roomId,
        user_id: userId,
        metadata
    }, process.env.VIDEO_API_SECRET, { expiresIn: '24h' });
}

module.exports = router;
