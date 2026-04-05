/**
 * 实时弹幕系统 WebSocket 服务
 * Real-time Danmaku System
 */

const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

class DanmakuServer {
    constructor(server) {
        this.wss = new WebSocket.Server({ server, path: '/ws/danmaku' });
        this.rooms = new Map(); // roomId -> Set of clients
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );
        
        this.init();
    }

    init() {
        this.wss.on('connection', (ws, req) => {
            console.log('新的WebSocket连接');
            
            ws.isAlive = true;
            ws.rooms = new Set(); // 客户端加入的房间

            ws.on('pong', () => {
                ws.isAlive = true;
            });

            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data);
                    await this.handleMessage(ws, message);
                } catch (error) {
                    console.error('处理消息失败:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: '消息格式错误'
                    }));
                }
            });

            ws.on('close', () => {
                this.handleDisconnect(ws);
            });

            // 发送连接成功消息
            ws.send(JSON.stringify({
                type: 'connected',
                message: '弹幕服务器连接成功'
            }));
        });

        // 心跳检测
        this.heartbeat = setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (ws.isAlive === false) {
                    return ws.terminate();
                }
                ws.isAlive = false;
                ws.ping();
            });
        }, 30000);
    }

    async handleMessage(ws, message) {
        const { type, roomId, data } = message;

        switch (type) {
            case 'join':
                await this.handleJoin(ws, roomId);
                break;
            case 'leave':
                this.handleLeave(ws, roomId);
                break;
            case 'danmaku':
                await this.handleDanmaku(ws, roomId, data);
                break;
            case 'get_history':
                await this.getHistory(ws, roomId);
                break;
            default:
                ws.send(JSON.stringify({
                    type: 'error',
                    message: '未知的消息类型'
                }));
        }
    }

    async handleJoin(ws, roomId) {
        if (!roomId) return;

        // 将客户端加入房间
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
        }
        this.rooms.get(roomId).add(ws);
        ws.rooms.add(roomId);

        // 通知客户端加入成功
        ws.send(JSON.stringify({
            type: 'joined',
            roomId,
            onlineCount: this.rooms.get(roomId).size
        }));

        // 广播用户加入
        this.broadcastToRoom(roomId, {
            type: 'user_joined',
            roomId,
            onlineCount: this.rooms.get(roomId).size
        }, ws);

        console.log(`客户端加入房间: ${roomId}, 在线人数: ${this.rooms.get(roomId).size}`);
    }

    handleLeave(ws, roomId) {
        if (!roomId || !this.rooms.has(roomId)) return;

        this.rooms.get(roomId).delete(ws);
        ws.rooms.delete(roomId);

        // 如果房间空了，删除房间
        if (this.rooms.get(roomId).size === 0) {
            this.rooms.delete(roomId);
        } else {
            // 广播用户离开
            this.broadcastToRoom(roomId, {
                type: 'user_left',
                roomId,
                onlineCount: this.rooms.get(roomId).size
            });
        }

        ws.send(JSON.stringify({
            type: 'left',
            roomId
        }));
    }

    async handleDanmaku(ws, roomId, data) {
        if (!roomId || !data) return;

        // 验证数据
        if (!data.content || data.content.trim().length === 0) {
            ws.send(JSON.stringify({
                type: 'error',
                message: '弹幕内容不能为空'
            }));
            return;
        }

        if (data.content.length > 100) {
            ws.send(JSON.stringify({
                type: 'error',
                message: '弹幕内容不能超过100字'
            }));
            return;
        }

        // 构建弹幕对象
        const danmaku = {
            id: this.generateId(),
            room_id: roomId,
            content: data.content.trim(),
            author: data.author || '匿名用户',
            author_id: data.authorId || null,
            avatar: data.avatar || null,
            color: data.color || '#ffffff',
            type: data.type || 'scroll', // scroll, top, bottom
            size: data.size || 'normal', // small, normal, large
            timestamp: Date.now(),
            position: this.calculatePosition(roomId, data.type)
        };

        // 保存到数据库（可选）
        try {
            await this.saveDanmaku(danmaku);
        } catch (error) {
            console.error('保存弹幕失败:', error);
        }

        // 广播弹幕给房间内所有客户端
        this.broadcastToRoom(roomId, {
            type: 'danmaku',
            data: danmaku
        });

        // 确认发送成功
        ws.send(JSON.stringify({
            type: 'danmaku_sent',
            id: danmaku.id
        }));
    }

    calculatePosition(roomId, type) {
        // 计算弹幕位置，避免重叠
        const room = this.rooms.get(roomId);
        const trackCount = 12; // 轨道数量
        
        if (type === 'scroll') {
            // 滚动弹幕随机选择轨道
            return Math.floor(Math.random() * trackCount);
        }
        return 0;
    }

    async saveDanmaku(danmaku) {
        // 保存弹幕到数据库
        const { error } = await this.supabase
            .from('danmaku_history')
            .insert({
                id: danmaku.id,
                room_id: danmaku.room_id,
                content: danmaku.content,
                author: danmaku.author,
                author_id: danmaku.author_id,
                color: danmaku.color,
                type: danmaku.type,
                created_at: new Date(danmaku.timestamp).toISOString()
            });

        if (error) throw error;
    }

    async getHistory(ws, roomId) {
        try {
            const { data, error } = await this.supabase
                .from('danmaku_history')
                .select('*')
                .eq('room_id', roomId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            ws.send(JSON.stringify({
                type: 'history',
                roomId,
                data: data.reverse().map(d => ({
                    id: d.id,
                    content: d.content,
                    author: d.author,
                    color: d.color,
                    type: d.type,
                    timestamp: new Date(d.created_at).getTime()
                }))
            }));
        } catch (error) {
            console.error('获取历史弹幕失败:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: '获取历史弹幕失败'
            }));
        }
    }

    broadcastToRoom(roomId, message, excludeWs = null) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        const messageStr = JSON.stringify(message);
        room.forEach((client) => {
            if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        });
    }

    handleDisconnect(ws) {
        // 从所有房间中移除
        ws.rooms.forEach(roomId => {
            if (this.rooms.has(roomId)) {
                this.rooms.get(roomId).delete(ws);
                if (this.rooms.get(roomId).size === 0) {
                    this.rooms.delete(roomId);
                } else {
                    this.broadcastToRoom(roomId, {
                        type: 'user_left',
                        roomId,
                        onlineCount: this.rooms.get(roomId).size
                    });
                }
            }
        });
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    close() {
        clearInterval(this.heartbeat);
        this.wss.close();
    }
}

module.exports = DanmakuServer;
