/**
 * 通知中心系统 - Notification Center
 * 支持多种通知类型、实时推送、通知管理
 */

class NotificationCenter {
    constructor(options = {}) {
        this.options = {
            apiBaseUrl: options.apiBaseUrl || '/api',
            userId: options.userId || null,
            enablePush: options.enablePush !== false,
            enableSound: options.enableSound || false,
            maxNotifications: options.maxNotifications || 100,
            ...options
        };

        this.notifications = [];
        this.unreadCount = 0;
        this.wsConnection = null;
        this.soundEnabled = this.options.enableSound;
        
        this.init();
    }

    /**
     * 初始化
     */
    init() {
        this.loadNotifications();
        this.setupWebSocket();
        this.requestNotificationPermission();
    }

    /**
     * 通知类型定义
     */
    static TYPES = {
        ARTICLE_LIKE: { icon: '👍', color: '#52c41a', priority: 'normal' },
        ARTICLE_COMMENT: { icon: '💬', color: '#1890ff', priority: 'high' },
        COMMENT_REPLY: { icon: '↩️', color: '#722ed1', priority: 'high' },
        FOLLOW: { icon: '➕', color: '#eb2f96', priority: 'normal' },
        MENTION: { icon: '@', color: '#fa8c16', priority: 'high' },
        BOUNTY_SOLVED: { icon: '💰', color: '#faad14', priority: 'high' },
        ACHIEVEMENT_UNLOCKED: { icon: '🏆', color: '#ffd700', priority: 'high' },
        SYSTEM: { icon: '🔔', color: '#8c8c8c', priority: 'low' },
        LEVEL_UP: { icon: '⬆️', color: '#13c2c2', priority: 'normal' },
        COIN_RECEIVED: { icon: '🪙', color: '#ffa500', priority: 'normal' }
    };

    /**
     * 加载通知
     */
    async loadNotifications() {
        try {
            const response = await fetch(
                `${this.options.apiBaseUrl}/notifications?userId=${this.options.userId}`,
                { headers: { 'Authorization': `Bearer ${this.getToken()}` } }
            );

            if (!response.ok) throw new Error('加载通知失败');

            const data = await response.json();
            this.notifications = data.notifications || [];
            this.unreadCount = data.unreadCount || 0;
            
            return this.notifications;
        } catch (error) {
            console.error('加载通知失败:', error);
            return this.getMockNotifications();
        }
    }

    /**
     * 设置WebSocket连接
     */
    setupWebSocket() {
        if (!this.options.userId) return;

        try {
            const wsUrl = `${this.options.apiBaseUrl.replace('http', 'ws')}/ws/notifications?userId=${this.options.userId}`;
            this.wsConnection = new WebSocket(wsUrl);

            this.wsConnection.onmessage = (event) => {
                const notification = JSON.parse(event.data);
                this.handleNewNotification(notification);
            };

            this.wsConnection.onclose = () => {
                // 5秒后重连
                setTimeout(() => this.setupWebSocket(), 5000);
            };
        } catch (error) {
            console.error('WebSocket连接失败:', error);
        }
    }

    /**
     * 处理新通知
     */
    handleNewNotification(notification) {
        this.notifications.unshift(notification);
        
        if (!notification.read) {
            this.unreadCount++;
            this.showToast(notification);
            this.playSound();
            
            // 浏览器桌面通知
            if (this.options.enablePush) {
                this.showDesktopNotification(notification);
            }
        }

        // 限制数量
        if (this.notifications.length > this.options.maxNotifications) {
            this.notifications = this.notifications.slice(0, this.options.maxNotifications);
        }

        // 保存到本地
        this.saveToLocal();

        // 触发事件
        window.dispatchEvent(new CustomEvent('newnotification', { detail: notification }));
    }

    /**
     * 发送通知
     */
    async sendNotification(userId, type, data) {
        try {
            const notification = {
                userId,
                type,
                title: data.title,
                message: data.message,
                link: data.link,
                metadata: data.metadata,
                createdAt: new Date().toISOString()
            };

            const response = await fetch(`${this.options.apiBaseUrl}/notifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify(notification)
            });

            return response.ok;
        } catch (error) {
            console.error('发送通知失败:', error);
            return false;
        }
    }

    /**
     * 标记为已读
     */
    async markAsRead(notificationId) {
        try {
            const response = await fetch(
                `${this.options.apiBaseUrl}/notifications/${notificationId}/read`,
                {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${this.getToken()}` }
                }
            );

            if (response.ok) {
                const notification = this.notifications.find(n => n.id === notificationId);
                if (notification && !notification.read) {
                    notification.read = true;
                    this.unreadCount = Math.max(0, this.unreadCount - 1);
                    this.saveToLocal();
                }
            }

            return response.ok;
        } catch (error) {
            console.error('标记已读失败:', error);
            return false;
        }
    }

    /**
     * 标记所有为已读
     */
    async markAllAsRead() {
        try {
            const response = await fetch(
                `${this.options.apiBaseUrl}/notifications/read-all`,
                {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${this.getToken()}` }
                }
            );

            if (response.ok) {
                this.notifications.forEach(n => n.read = true);
                this.unreadCount = 0;
                this.saveToLocal();
            }

            return response.ok;
        } catch (error) {
            console.error('标记全部已读失败:', error);
            return false;
        }
    }

    /**
     * 删除通知
     */
    async deleteNotification(notificationId) {
        try {
            const response = await fetch(
                `${this.options.apiBaseUrl}/notifications/${notificationId}`,
                {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${this.getToken()}` }
                }
            );

            if (response.ok) {
                const index = this.notifications.findIndex(n => n.id === notificationId);
                if (index !== -1) {
                    if (!this.notifications[index].read) {
                        this.unreadCount = Math.max(0, this.unreadCount - 1);
                    }
                    this.notifications.splice(index, 1);
                    this.saveToLocal();
                }
            }

            return response.ok;
        } catch (error) {
            console.error('删除通知失败:', error);
            return false;
        }
    }

    /**
     * 请求浏览器通知权限
     */
    async requestNotificationPermission() {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }

    /**
     * 显示桌面通知
     */
    showDesktopNotification(notification) {
        if (Notification.permission !== 'granted') return;

        const type = NotificationCenter.TYPES[notification.type] || NotificationCenter.TYPES.SYSTEM;

        new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: notification.id,
            requireInteraction: type.priority === 'high'
        });
    }

    /**
     * 显示Toast通知
     */
    showToast(notification) {
        const type = NotificationCenter.TYPES[notification.type] || NotificationCenter.TYPES.SYSTEM;

        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.innerHTML = `
            <div class="notification-toast-icon" style="background: ${type.color}">
                ${type.icon}
            </div>
            <div class="notification-toast-content">
                <div class="notification-toast-title">${notification.title}</div>
                <div class="notification-toast-message">${notification.message}</div>
            </div>
            <button class="notification-toast-close" onclick="this.parentElement.remove()">×</button>
        `;

        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--theme-surface, #1a1a1a);
            border-radius: 12px;
            padding: 15px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 350px;
        `;

        document.body.appendChild(toast);

        // 自动消失
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 5000);

        // 点击跳转
        toast.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') {
                window.location.href = notification.link;
                toast.remove();
            }
        });
    }

    /**
     * 播放提示音
     */
    playSound() {
        if (!this.soundEnabled) return;

        // 使用Web Audio API播放提示音
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }

    /**
     * 保存到本地
     */
    saveToLocal() {
        const data = {
            notifications: this.notifications,
            unreadCount: this.unreadCount,
            timestamp: Date.now()
        };
        localStorage.setItem('notifications', JSON.stringify(data));
    }

    /**
     * 获取Token
     */
    getToken() {
        return localStorage.getItem('auth_token') || '';
    }

    /**
     * 获取模拟通知
     */
    getMockNotifications() {
        return [
            {
                id: '1',
                type: 'ARTICLE_LIKE',
                title: '文章获赞',
                message: '张三赞了你的文章《Vue 3 性能优化指南》',
                link: '/article.html?id=1',
                read: false,
                createdAt: new Date(Date.now() - 300000).toISOString()
            },
            {
                id: '2',
                type: 'COMMENT_REPLY',
                title: '评论回复',
                message: '李四回复了你的评论',
                link: '/article.html?id=1#comment-2',
                read: false,
                createdAt: new Date(Date.now() - 600000).toISOString()
            },
            {
                id: '3',
                type: 'ACHIEVEMENT_UNLOCKED',
                title: '成就解锁',
                message: '恭喜你获得「初出茅庐」成就！',
                link: '/profile.html#achievements',
                read: true,
                createdAt: new Date(Date.now() - 86400000).toISOString()
            }
        ];
    }
}

/**
 * 通知中心UI
 */
class NotificationUI {
    constructor(notificationCenter) {
        this.center = notificationCenter;
        this.isOpen = false;
    }

    /**
     * 渲染通知铃铛
     */
    renderBell(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="notification-bell" id="notificationBell">
                <button class="bell-btn" onclick="notificationUI.togglePanel()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    ${this.center.unreadCount > 0 ? `
                        <span class="unread-badge">${this.center.unreadCount > 99 ? '99+' : this.center.unreadCount}</span>
                    ` : ''}
                </button>
            </div>
        `;

        this.injectStyles();
    }

    /**
     * 渲染通知面板
     */
    renderPanel() {
        // 移除已存在的面板
        const existing = document.getElementById('notificationPanel');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.id = 'notificationPanel';
        panel.className = 'notification-panel';
        panel.innerHTML = `
            <div class="notification-panel-header">
                <h4>🔔 通知中心</h4>
                <div class="panel-actions">
                    <button class="action-btn" onclick="notificationUI.toggleSound()">
                        ${this.center.soundEnabled ? '🔔' : '🔕'}
                    </button>
                    <button class="action-btn" onclick="notificationUI.markAllRead()">
                        全部已读
                    </button>
                </div>
            </div>
            <div class="notification-filters">
                <button class="filter-btn active" data-filter="all">全部</button>
                <button class="filter-btn" data-filter="unread">未读</button>
                <button class="filter-btn" data-filter="system">系统</button>
            </div>
            <div class="notification-list">
                ${this.renderNotificationList()}
            </div>
        `;

        document.body.appendChild(panel);

        // 绑定筛选按钮事件
        panel.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                panel.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterNotifications(btn.dataset.filter);
            });
        });
    }

    /**
     * 渲染通知列表
     */
    renderNotificationList(notifications = this.center.notifications) {
        if (notifications.length === 0) {
            return `
                <div class="notification-empty">
                    <span style="font-size: 48px;">📭</span>
                    <p>暂无通知</p>
                </div>
            `;
        }

        return notifications.map(n => {
            const type = NotificationCenter.TYPES[n.type] || NotificationCenter.TYPES.SYSTEM;
            const timeAgo = this.formatTime(n.createdAt);

            return `
                <div class="notification-item ${n.read ? 'read' : 'unread'}" data-id="${n.id}">
                    <div class="notification-icon" style="background: ${type.color}">
                        ${type.icon}
                    </div>
                    <div class="notification-content" onclick="notificationUI.handleClick('${n.id}', '${n.link}')">
                        <div class="notification-title">${n.title}</div>
                        <div class="notification-message">${n.message}</div>
                        <div class="notification-time">${timeAgo}</div>
                    </div>
                    <div class="notification-actions">
                        ${!n.read ? `
                            <button class="action-btn" onclick="event.stopPropagation(); notificationUI.markRead('${n.id}')" title="标记已读">
                                ✓
                            </button>
                        ` : ''}
                        <button class="action-btn" onclick="event.stopPropagation(); notificationUI.delete('${n.id}')" title="删除">
                            🗑
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * 切换面板显示
     */
    togglePanel() {
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            this.renderPanel();
        } else {
            const panel = document.getElementById('notificationPanel');
            if (panel) panel.remove();
        }
    }

    /**
     * 筛选通知
     */
    filterNotifications(filter) {
        let filtered = this.center.notifications;

        switch (filter) {
            case 'unread':
                filtered = filtered.filter(n => !n.read);
                break;
            case 'system':
                filtered = filtered.filter(n => n.type === 'SYSTEM');
                break;
        }

        const list = document.querySelector('.notification-list');
        if (list) {
            list.innerHTML = this.renderNotificationList(filtered);
        }
    }

    /**
     * 处理点击
     */
    async handleClick(id, link) {
        await this.center.markAsRead(id);
        window.location.href = link;
    }

    /**
     * 标记已读
     */
    async markRead(id) {
        await this.center.markAsRead(id);
        this.refreshList();
        this.renderBell('notificationBellContainer');
    }

    /**
     * 全部已读
     */
    async markAllRead() {
        await this.center.markAllAsRead();
        this.refreshList();
        this.renderBell('notificationBellContainer');
    }

    /**
     * 删除通知
     */
    async delete(id) {
        await this.center.deleteNotification(id);
        this.refreshList();
        this.renderBell('notificationBellContainer');
    }

    /**
     * 刷新列表
     */
    refreshList() {
        const list = document.querySelector('.notification-list');
        if (list) {
            list.innerHTML = this.renderNotificationList();
        }
    }

    /**
     * 切换声音
     */
    toggleSound() {
        this.center.soundEnabled = !this.center.soundEnabled;
        this.refreshList();
    }

    /**
     * 格式化时间
     */
    formatTime(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
        
        return date.toLocaleDateString('zh-CN');
    }

    /**
     * 注入样式
     */
    injectStyles() {
        if (document.getElementById('notification-ui-styles')) return;

        const styles = `
            <style id="notification-ui-styles">
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }

                .notification-bell {
                    position: relative;
                }

                .bell-btn {
                    position: relative;
                    background: transparent;
                    border: none;
                    color: var(--theme-text, #e0e0e0);
                    cursor: pointer;
                    padding: 10px;
                    font-size: 20px;
                }

                .bell-btn svg {
                    width: 24px;
                    height: 24px;
                }

                .unread-badge {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: #ff4d4f;
                    color: #fff;
                    font-size: 11px;
                    padding: 2px 6px;
                    border-radius: 10px;
                    min-width: 18px;
                    text-align: center;
                }

                .notification-panel {
                    position: fixed;
                    top: 60px;
                    right: 20px;
                    width: 380px;
                    max-height: 600px;
                    background: var(--theme-surface, #1a1a1a);
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    z-index: 1000;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    animation: slideIn 0.2s ease;
                }

                .notification-panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px 20px;
                    border-bottom: 1px solid var(--theme-border, #333);
                }

                .notification-panel-header h4 {
                    margin: 0;
                    color: var(--theme-text, #e0e0e0);
                }

                .panel-actions {
                    display: flex;
                    gap: 10px;
                }

                .notification-filters {
                    display: flex;
                    padding: 10px 20px;
                    gap: 10px;
                    border-bottom: 1px solid var(--theme-border, #333);
                }

                .filter-btn {
                    background: transparent;
                    border: none;
                    color: var(--theme-textSecondary, #999);
                    cursor: pointer;
                    padding: 5px 12px;
                    border-radius: 15px;
                    font-size: 13px;
                }

                .filter-btn.active {
                    background: var(--theme-primary, #667eea);
                    color: #fff;
                }

                .notification-list {
                    flex: 1;
                    overflow-y: auto;
                    max-height: 400px;
                }

                .notification-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 15px 20px;
                    border-bottom: 1px solid var(--theme-border, #333);
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .notification-item:hover {
                    background: rgba(255,255,255,0.05);
                }

                .notification-item.unread {
                    background: rgba(102, 126, 234, 0.1);
                }

                .notification-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    font-size: 16px;
                    flex-shrink: 0;
                }

                .notification-content {
                    flex: 1;
                    min-width: 0;
                }

                .notification-title {
                    font-weight: 600;
                    color: var(--theme-text, #e0e0e0);
                    margin-bottom: 4px;
                }

                .notification-message {
                    font-size: 13px;
                    color: var(--theme-textSecondary, #999);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .notification-time {
                    font-size: 12px;
                    color: #666;
                    margin-top: 4px;
                }

                .notification-actions {
                    display: flex;
                    gap: 5px;
                    opacity: 0;
                    transition: opacity 0.2s;
                }

                .notification-item:hover .notification-actions {
                    opacity: 1;
                }

                .action-btn {
                    background: transparent;
                    border: none;
                    color: var(--theme-textSecondary, #999);
                    cursor: pointer;
                    padding: 5px;
                }

                .action-btn:hover {
                    color: var(--theme-text, #e0e0e0);
                }

                .notification-empty {
                    padding: 40px;
                    text-align: center;
                    color: var(--theme-textSecondary, #999);
                }

                .notification-toast-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    font-size: 20px;
                    flex-shrink: 0;
                }

                .notification-toast-content {
                    flex: 1;
                    min-width: 0;
                }

                .notification-toast-title {
                    font-weight: 600;
                    color: var(--theme-text, #e0e0e0);
                    margin-bottom: 4px;
                }

                .notification-toast-message {
                    font-size: 13px;
                    color: var(--theme-textSecondary, #999);
                }

                .notification-toast-close {
                    background: transparent;
                    border: none;
                    color: var(--theme-textSecondary, #999);
                    cursor: pointer;
                    font-size: 18px;
                    padding: 5px;
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// 导出
window.NotificationCenter = NotificationCenter;
window.NotificationUI = NotificationUI;
