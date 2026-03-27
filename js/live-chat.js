/**
 * 实时聊天室模块
 * WebSocket 在线聊天功能
 */

class LiveChat {
    constructor(options = {}) {
        this.wsUrl = options.wsUrl || 'wss://your-api.com/ws';
        this.roomId = options.roomId || 'global';
        this.username = options.username || '匿名用户';
        this.userId = options.userId || this.generateId();
        this.avatar = options.avatar || '';
        
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        
        this.messageHistory = [];
        this.maxHistory = 100;
        
        this.onMessage = options.onMessage || (() => {});
        this.onConnect = options.onConnect || (() => {});
        this.onDisconnect = options.onDisconnect || (() => {});
        this.onUserJoin = options.onUserJoin || (() => {});
        this.onUserLeave = options.onUserLeave || (() => {});
    }

    /**
     * 连接 WebSocket
     */
    connect() {
        try {
            this.ws = new WebSocket(`${this.wsUrl}?room=${this.roomId}&userId=${this.userId}`);
            
            this.ws.onopen = () => {
                console.log('[LiveChat] 已连接');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.onConnect();
                
                // 发送加入房间消息
                this.send({
                    type: 'join',
                    roomId: this.roomId,
                    userId: this.userId,
                    username: this.username,
                    avatar: this.avatar
                });
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (e) {
                    console.error('[LiveChat] 消息解析失败:', e);
                }
            };

            this.ws.onclose = () => {
                console.log('[LiveChat] 连接关闭');
                this.isConnected = false;
                this.onDisconnect();
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('[LiveChat] 连接错误:', error);
            };

        } catch (error) {
            console.error('[LiveChat] 连接失败:', error);
            this.attemptReconnect();
        }
    }

    /**
     * 处理收到的消息
     */
    handleMessage(data) {
        switch (data.type) {
            case 'message':
                this.addToHistory(data);
                this.onMessage(data);
                break;
            case 'user_join':
                this.onUserJoin(data);
                break;
            case 'user_leave':
                this.onUserLeave(data);
                break;
            case 'online_count':
                this.updateOnlineCount(data.count);
                break;
            case 'history':
                this.messageHistory = data.messages || [];
                break;
        }
    }

    /**
     * 发送消息
     */
    send(content, type = 'text') {
        if (!this.isConnected) {
            console.warn('[LiveChat] 未连接，无法发送消息');
            return false;
        }

        const message = {
            type: 'message',
            roomId: this.roomId,
            userId: this.userId,
            username: this.username,
            avatar: this.avatar,
            content: content,
            contentType: type,
            timestamp: Date.now()
        };

        this.ws.send(JSON.stringify(message));
        return true;
    }

    /**
     * 发送文本消息
     */
    sendText(text) {
        return this.send(text, 'text');
    }

    /**
     * 发送图片
     */
    sendImage(url) {
        return this.send(url, 'image');
    }

    /**
     * 发送表情
     */
    sendEmoji(emoji) {
        return this.send(emoji, 'emoji');
    }

    /**
     * 尝试重连
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('[LiveChat] 重连次数已达上限');
            return;
        }

        this.reconnectAttempts++;
        console.log(`[LiveChat] ${this.reconnectDelay}ms后尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            this.connect();
        }, this.reconnectDelay);
    }

    /**
     * 断开连接
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
    }

    /**
     * 添加到历史记录
     */
    addToHistory(message) {
        this.messageHistory.push(message);
        if (this.messageHistory.length > this.maxHistory) {
            this.messageHistory.shift();
        }
    }

    /**
     * 获取历史记录
     */
    getHistory() {
        return this.messageHistory;
    }

    /**
     * 更新在线人数
     */
    updateOnlineCount(count) {
        const el = document.getElementById('onlineCount');
        if (el) el.textContent = count;
    }

    /**
     * 生成唯一ID
     */
    generateId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

/**
 * 聊天室 UI 组件
 */
class ChatRoomUI {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.chat = new LiveChat(options);
        this.currentUser = options.userId;
        
        this.init();
    }

    init() {
        this.createUI();
        this.bindEvents();
        this.chat.connect();
    }

    createUI() {
        this.container.innerHTML = `
            <div class="chat-room">
                <div class="chat-header">
                    <span class="chat-title">💬 在线聊天室</span>
                    <span class="online-count">在线: <span id="onlineCount">0</span>人</span>
                </div>
                <div class="chat-messages" id="chatMessages"></div>
                <div class="chat-input-area">
                    <div class="chat-toolbar">
                        <button class="chat-btn" id="emojiBtn" title="表情">😊</button>
                        <button class="chat-btn" id="imageBtn" title="图片">📷</button>
                    </div>
                    <div class="chat-input-row">
                        <input type="text" id="chatInput" placeholder="输入消息..." maxlength="200">
                        <button id="sendBtn" class="send-btn">发送</button>
                    </div>
                </div>
            </div>
            <style>
                .chat-room { 
                    width: 100%; 
                    max-width: 400px; 
                    height: 500px; 
                    background: white; 
                    border-radius: 16px; 
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
                    display: flex; 
                    flex-direction: column; 
                    overflow: hidden;
                }
                .chat-header { 
                    padding: 16px; 
                    background: linear-gradient(135deg, #667eea, #764ba2); 
                    color: white; 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center;
                }
                .chat-title { font-weight: 600; }
                .online-count { font-size: 12px; opacity: 0.9; }
                .chat-messages { 
                    flex: 1; 
                    overflow-y: auto; 
                    padding: 16px; 
                    display: flex; 
                    flex-direction: column; 
                    gap: 12px;
                }
                .chat-message { 
                    max-width: 80%; 
                    padding: 10px 14px; 
                    border-radius: 12px; 
                    font-size: 14px; 
                    line-height: 1.5;
                }
                .chat-message.own { 
                    align-self: flex-end; 
                    background: #667eea; 
                    color: white; 
                    border-bottom-right-radius: 4px;
                }
                .chat-message.other { 
                    align-self: flex-start; 
                    background: #f0f2f5; 
                    color: #333; 
                    border-bottom-left-radius: 4px;
                }
                .message-header { 
                    font-size: 11px; 
                    color: #999; 
                    margin-bottom: 4px; 
                }
                .chat-input-area { 
                    padding: 12px; 
                    border-top: 1px solid #eee; 
                }
                .chat-toolbar { 
                    display: flex; 
                    gap: 8px; 
                    margin-bottom: 8px; 
                }
                .chat-btn { 
                    background: none; 
                    border: none; 
                    cursor: pointer; 
                    font-size: 18px; 
                    padding: 4px; 
                }
                .chat-input-row { 
                    display: flex; 
                    gap: 8px; 
                }
                .chat-input-row input { 
                    flex: 1; 
                    padding: 10px 14px; 
                    border: 1px solid #ddd; 
                    border-radius: 20px; 
                    outline: none;
                }
                .send-btn { 
                    padding: 10px 20px; 
                    background: linear-gradient(135deg, #667eea, #764ba2); 
                    color: white; 
                    border: none; 
                    border-radius: 20px; 
                    cursor: pointer; 
                    font-weight: 500;
                }
                .send-btn:hover { opacity: 0.9; }
                .system-message { 
                    text-align: center; 
                    font-size: 12px; 
                    color: #999; 
                    padding: 8px;
                }
            </style>
        `;
    }

    bindEvents() {
        const input = this.container.querySelector('#chatInput');
        const sendBtn = this.container.querySelector('#sendBtn');
        const messages = this.container.querySelector('#chatMessages');

        // 发送消息
        const sendMessage = () => {
            const text = input.value.trim();
            if (!text) return;
            
            if (this.chat.sendText(text)) {
                input.value = '';
                this.addMessage({
                    content: text,
                    username: this.chat.username,
                    userId: this.chat.userId,
                    isOwn: true
                });
            }
        };

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        // 处理收到的消息
        this.chat.onMessage = (data) => {
            if (data.userId !== this.currentUser) {
                this.addMessage({
                    content: data.content,
                    username: data.username,
                    userId: data.userId,
                    isOwn: false
                });
            }
        };

        // 用户加入/离开
        this.chat.onUserJoin = (data) => {
            this.addSystemMessage(`${data.username} 加入了聊天室`);
        };
        this.chat.onUserLeave = (data) => {
            this.addSystemMessage(`${data.username} 离开了聊天室`);
        };
    }

    addMessage(data) {
        const messages = this.container.querySelector('#chatMessages');
        const div = document.createElement('div');
        div.className = `chat-message ${data.isOwn ? 'own' : 'other'}`;
        div.innerHTML = `
            ${!data.isOwn ? `<div class="message-header">${data.username}</div>` : ''}
            <div class="message-content">${this.escapeHtml(data.content)}</div>
        `;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    addSystemMessage(text) {
        const messages = this.container.querySelector('#chatMessages');
        const div = document.createElement('div');
        div.className = 'system-message';
        div.textContent = text;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

export { LiveChat, ChatRoomUI };
