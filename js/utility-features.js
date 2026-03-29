/**
 * 实用小功能 - Utility Features
 * 包含：在线人数、用户状态、动画效果、自动夜间模式、公告栏
 */

const UtilityFeatures = {
    // 配置
    config: {
        onlineCheckInterval: 30000, // 30秒检查一次在线状态
        announcementCheckInterval: 60000, // 1分钟检查公告
        autoDarkMode: true,
        animationsEnabled: true
    },

    // 存储键
    KEYS: {
        ONLINE_USERS: 'online_users_data',
        USER_STATUS: 'user_status',
        ANNOUNCEMENTS: 'announcements',
        ANNOUNCEMENT_READ: 'announcement_read',
        DARK_MODE_SCHEDULE: 'dark_mode_schedule',
        UTILITY_SETTINGS: 'utility_settings'
    },

    // 状态
    state: {
        heartbeatInterval: null,
        isOnline: true,
        currentAnnouncement: null
    },

    // 初始化
    init() {
        this.initOnlineUsers();
        this.initUserStatus();
        this.initAnimations();
        this.initAutoDarkMode();
        this.initAnnouncementBar();
        this.initOnlineCounter();
        this.loadSettings();
    },

    // ========== 在线人数统计 ==========

    // 初始化在线用户系统
    initOnlineUsers() {
        // 启动心跳
        this.startHeartbeat();
        
        // 页面可见性变化时更新状态
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.setUserAway();
            } else {
                this.setUserOnline();
            }
        });
        
        // 页面关闭时清理
        window.addEventListener('beforeunload', () => {
            this.removeOnlineUser();
        });
    },

    // 启动心跳
    startHeartbeat() {
        // 首次上线
        this.setUserOnline();
        
        // 清理可能存在的旧定时器
        if (this.state.heartbeatInterval) {
            clearInterval(this.state.heartbeatInterval);
        }
        
        // 定期更新在线状态
        this.state.heartbeatInterval = setInterval(() => {
            this.updateOnlineStatus();
        }, this.config.onlineCheckInterval);
    },
    
    // 停止心跳（清理资源）
    stopHeartbeat() {
        if (this.state.heartbeatInterval) {
            clearInterval(this.state.heartbeatInterval);
            this.state.heartbeatInterval = null;
        }
    },

    // 设置用户在线
    setUserOnline() {
        const user = this.getCurrentUser();
        const onlineData = this.getOnlineUsers();
        
        const userData = {
            id: user?.id || this.getAnonymousId(),
            username: user?.username || '游客',
            avatar: user?.avatar || '',
            lastSeen: Date.now(),
            isAnonymous: !user,
            page: window.location.pathname
        };
        
        // 更新在线列表
        const existingIndex = onlineData.users.findIndex(u => u.id === userData.id);
        if (existingIndex >= 0) {
            onlineData.users[existingIndex] = userData;
        } else {
            onlineData.users.push(userData);
        }
        
        // 清理过期用户（5分钟未活动）
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        onlineData.users = onlineData.users.filter(u => u.lastSeen > fiveMinutesAgo);
        
        onlineData.totalCount = onlineData.users.length;
        onlineData.memberCount = onlineData.users.filter(u => !u.isAnonymous).length;
        onlineData.lastUpdate = Date.now();
        
        localStorage.setItem(this.KEYS.ONLINE_USERS, JSON.stringify(onlineData));
        
        // 广播更新
        this.broadcastOnlineUpdate(onlineData);
    },

    // 设置用户离开
    setUserAway() {
        // 降低心跳频率或标记为离开状态
        this.state.isOnline = false;
    },

    // 移除在线用户
    removeOnlineUser() {
        const user = this.getCurrentUser();
        const userId = user?.id || this.getAnonymousId();
        
        const onlineData = this.getOnlineUsers();
        onlineData.users = onlineData.users.filter(u => u.id !== userId);
        onlineData.totalCount = onlineData.users.length;
        onlineData.memberCount = onlineData.users.filter(u => !u.isAnonymous).length;
        
        localStorage.setItem(this.KEYS.ONLINE_USERS, JSON.stringify(onlineData));
    },

    // 更新在线状态
    updateOnlineStatus() {
        if (!document.hidden) {
            this.setUserOnline();
        }
    },

    // 获取在线用户数据
    getOnlineUsers() {
        const defaultData = {
            users: [],
            totalCount: 0,
            memberCount: 0,
            lastUpdate: Date.now()
        };
        return { ...defaultData, ...JSON.parse(localStorage.getItem(this.KEYS.ONLINE_USERS) || '{}') };
    },

    // 获取匿名ID
    getAnonymousId() {
        let id = sessionStorage.getItem('anonymous_id');
        if (!id) {
            id = 'anon_' + Math.random().toString(36).slice(2, 10);
            sessionStorage.setItem('anonymous_id', id);
        }
        return id;
    },

    // 广播在线更新
    broadcastOnlineUpdate(data) {
        // 使用 BroadcastChannel 或自定义事件
        if (window.BroadcastChannel) {
            const channel = new BroadcastChannel('online_users');
            channel.postMessage(data);
        }
        
        window.dispatchEvent(new CustomEvent('onlineUsersUpdate', { detail: data }));
    },

    // 初始化在线人数显示
    initOnlineCounter() {
        // 查找页面上是否有在线人数显示元素
        const counters = document.querySelectorAll('.online-counter, [data-online-counter]');
        
        counters.forEach(counter => {
            this.updateOnlineCounter(counter);
        });
        
        // 监听更新
        window.addEventListener('onlineUsersUpdate', (e) => {
            const counters = document.querySelectorAll('.online-counter, [data-online-counter]');
            counters.forEach(counter => {
                this.updateOnlineCounter(counter, e.detail);
            });
        });
    },

    // 更新在线人数显示
    updateOnlineCounter(element, data) {
        const onlineData = data || this.getOnlineUsers();
        const type = element.dataset.counterType || 'total';
        
        let count = onlineData.totalCount;
        if (type === 'members') count = onlineData.memberCount;
        if (type === 'guests') count = onlineData.totalCount - onlineData.memberCount;
        
        // 添加动画效果
        const oldCount = parseInt(element.textContent) || 0;
        if (oldCount !== count) {
            element.classList.add('updating');
            setTimeout(() => element.classList.remove('updating'), 300);
        }
        
        element.textContent = count.toLocaleString();
        
        // 更新详细提示
        if (element.title) {
            element.title = `在线会员: ${onlineData.memberCount} | 游客: ${onlineData.totalCount - onlineData.memberCount}`;
        }
    },

    // ========== 用户状态显示 ==========

    // 初始化用户状态
    initUserStatus() {
        // 为页面上的用户头像/名称添加状态指示
        this.updateUserStatusIndicators();
        
        // 定期更新
        setInterval(() => this.updateUserStatusIndicators(), 30000);
    },

    // 更新用户状态指示器
    updateUserStatusIndicators() {
        const onlineData = this.getOnlineUsers();
        const onlineIds = new Set(onlineData.users.map(u => u.id));
        
        document.querySelectorAll('[data-user-id]').forEach(element => {
            const userId = element.dataset.userId;
            const isOnline = onlineIds.has(userId);
            
            let indicator = element.querySelector('.user-status-indicator');
            if (!indicator) {
                indicator = document.createElement('span');
                indicator.className = 'user-status-indicator';
                element.appendChild(indicator);
            }
            
            indicator.className = `user-status-indicator ${isOnline ? 'online' : 'offline'}`;
            indicator.title = isOnline ? '在线' : '离线';
        });
    },

    // 获取用户状态
    getUserStatus(userId) {
        const onlineData = this.getOnlineUsers();
        const user = onlineData.users.find(u => u.id === userId);
        
        if (!user) return 'offline';
        
        const lastSeenMinutes = (Date.now() - user.lastSeen) / 60000;
        if (lastSeenMinutes < 1) return 'online';
        if (lastSeenMinutes < 5) return 'away';
        return 'offline';
    },

    // ========== 动画效果 ==========

    // 初始化动画
    initAnimations() {
        if (!this.config.animationsEnabled) return;
        
        // 点赞动画
        this.initLikeAnimation();
        
        // 评论动画
        this.initCommentAnimation();
        
        // 其他交互动画
        this.initInteractionAnimations();
    },

    // 点赞动画
    initLikeAnimation() {
        document.querySelectorAll('.like-btn, [data-action="like"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.showLikeAnimation(e.target);
            });
        });
        
        // 监听动态添加的点赞按钮
        document.addEventListener('click', (e) => {
            if (e.target.matches('.like-btn, [data-action="like"]') || 
                e.target.closest('.like-btn, [data-action="like"]')) {
                this.showLikeAnimation(e.target);
            }
        });
    },

    // 显示点赞动画
    showLikeAnimation(element) {
        const rect = element.getBoundingClientRect();
        const heart = document.createElement('div');
        heart.className = 'like-animation-heart';
        heart.innerHTML = '❤️';
        heart.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top}px;
            font-size: 24px;
            pointer-events: none;
            z-index: 10000;
            animation: likeFloat 1s ease-out forwards;
        `;
        
        document.body.appendChild(heart);
        
        // 粒子效果
        for (let i = 0; i < 6; i++) {
            setTimeout(() => {
                this.createParticle(rect.left + rect.width / 2, rect.top);
            }, i * 50);
        }
        
        setTimeout(() => heart.remove(), 1000);
    },

    // 创建粒子
    createParticle(x, y) {
        const particle = document.createElement('div');
        particle.className = 'like-particle';
        const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = 50 + Math.random() * 50;
        
        particle.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 8px;
            height: 8px;
            background: ${color};
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
        `;
        
        document.body.appendChild(particle);
        
        // 动画
        const animation = particle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${Math.cos(angle) * velocity}px, ${Math.sin(angle) * velocity - 50}px) scale(0)`, opacity: 0 }
        ], {
            duration: 800,
            easing: 'ease-out'
        });
        
        animation.onfinish = () => particle.remove();
    },

    // 评论动画
    initCommentAnimation() {
        // 监听新评论添加
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.classList.contains('comment-item')) {
                        this.animateNewComment(node);
                    }
                });
            });
        });
        
        document.querySelectorAll('.comments-list').forEach(list => {
            observer.observe(list, { childList: true });
        });
    },

    // 新评论动画
    animateNewComment(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(-20px)';
        
        requestAnimationFrame(() => {
            element.style.transition = 'all 0.3s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
    },

    // 交互动画
    initInteractionAnimations() {
        // 按钮点击波纹效果
        document.querySelectorAll('.btn, button').forEach(btn => {
            btn.addEventListener('click', (e) => this.createRipple(e, btn));
        });
        
        // 卡片悬停效果
        document.querySelectorAll('.card, .article-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-4px)';
                card.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
                card.style.boxShadow = '';
            });
        });
    },

    // 创建波纹效果
    createRipple(event, element) {
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255,255,255,0.4);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    },

    // ========== 自动夜间模式 ==========

    // 初始化自动夜间模式
    initAutoDarkMode() {
        if (!this.config.autoDarkMode) return;
        
        const settings = this.getDarkModeSettings();
        
        // 检查是否应该启用夜间模式
        this.checkDarkMode(settings);
        
        // 每分钟检查一次
        setInterval(() => this.checkDarkMode(settings), 60000);
        
        // 监听系统主题变化
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addListener((e) => {
                if (settings.followSystem) {
                    this.setDarkMode(e.matches);
                }
            });
        }
    },

    // 检查是否应该启用夜间模式
    checkDarkMode(settings) {
        if (settings.manual) {
            this.setDarkMode(settings.enabled);
            return;
        }
        
        if (settings.followSystem && window.matchMedia) {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.setDarkMode(isDark);
            return;
        }
        
        // 根据时间判断
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const startTime = this.timeToMinutes(settings.startTime);
        const endTime = this.timeToMinutes(settings.endTime);
        
        let shouldBeDark = false;
        if (startTime < endTime) {
            shouldBeDark = currentTime >= startTime && currentTime < endTime;
        } else {
            // 跨午夜的情况
            shouldBeDark = currentTime >= startTime || currentTime < endTime;
        }
        
        this.setDarkMode(shouldBeDark);
    },

    // 时间转分钟
    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    },

    // 设置夜间模式
    setDarkMode(enabled) {
        const wasDark = document.body.classList.contains('dark-mode');
        
        if (enabled) {
            document.body.classList.add('dark-mode');
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            document.documentElement.removeAttribute('data-theme');
        }
        
        // 触发事件
        if (wasDark !== enabled) {
            window.dispatchEvent(new CustomEvent('darkModeChange', { detail: { enabled } }));
        }
    },

    // 获取夜间模式设置
    getDarkModeSettings() {
        const defaults = {
            manual: false,
            enabled: false,
            followSystem: true,
            autoSchedule: false,
            startTime: '20:00',
            endTime: '06:00'
        };
        
        return { ...defaults, ...JSON.parse(localStorage.getItem(this.KEYS.DARK_MODE_SCHEDULE) || '{}') };
    },

    // 保存夜间模式设置
    saveDarkModeSettings(settings) {
        localStorage.setItem(this.KEYS.DARK_MODE_SCHEDULE, JSON.stringify(settings));
        this.checkDarkMode(settings);
    },

    // 切换夜间模式（手动）
    toggleDarkMode() {
        const isDark = document.body.classList.contains('dark-mode');
        this.setDarkMode(!isDark);
        
        // 保存手动设置
        const settings = this.getDarkModeSettings();
        settings.manual = true;
        settings.enabled = !isDark;
        this.saveDarkModeSettings(settings);
        
        return !isDark;
    },

    // ========== 公告栏 ==========

    // 初始化公告栏
    initAnnouncementBar() {
        this.renderAnnouncementBar();
        this.loadAnnouncements();
        
        // 定期检查新公告
        setInterval(() => this.loadAnnouncements(), this.config.announcementCheckInterval);
    },

    // 渲染公告栏容器
    renderAnnouncementBar() {
        // 检查是否已存在
        if (document.getElementById('announcementBar')) return;
        
        const bar = document.createElement('div');
        bar.id = 'announcementBar';
        bar.className = 'announcement-bar';
        bar.style.display = 'none';
        bar.innerHTML = `
            <div class="announcement-content">
                <span class="announcement-icon">📢</span>
                <span class="announcement-text"></span>
                <a class="announcement-link" style="display:none;"></a>
            </div>
            <button class="announcement-close" title="关闭">×</button>
        `;
        
        // 插入到页面顶部
        const header = document.querySelector('header, .top-nav, .navbar');
        if (header) {
            header.insertAdjacentElement('beforebegin', bar);
        } else {
            document.body.insertAdjacentElement('afterbegin', bar);
        }
        
        // 关闭按钮
        bar.querySelector('.announcement-close').addEventListener('click', () => {
            this.closeAnnouncement();
        });
    },

    // 加载公告
    loadAnnouncements() {
        // 从localStorage获取（实际应从API获取）
        const announcements = JSON.parse(localStorage.getItem(this.KEYS.ANNOUNCEMENTS) || '[]');
        
        // 过滤有效的公告
        const now = Date.now();
        const valid = announcements.filter(a => {
            if (a.endTime && now > a.endTime) return false;
            if (a.startTime && now < a.startTime) return false;
            return true;
        });
        
        // 按优先级排序
        valid.sort((a, b) => (b.priority || 0) - (a.priority || 0));
        
        if (valid.length > 0) {
            this.showAnnouncement(valid[0]);
        }
    },

    // 显示公告
    showAnnouncement(announcement) {
        // 检查用户是否已关闭
        const readAnnouncements = JSON.parse(localStorage.getItem(this.KEYS.ANNOUNCEMENT_READ) || '[]');
        if (readAnnouncements.includes(announcement.id)) return;
        
        const bar = document.getElementById('announcementBar');
        if (!bar) return;
        
        this.state.currentAnnouncement = announcement;
        
        const textEl = bar.querySelector('.announcement-text');
        const linkEl = bar.querySelector('.announcement-link');
        
        textEl.textContent = announcement.text;
        
        if (announcement.link) {
            linkEl.href = announcement.link;
            linkEl.textContent = announcement.linkText || '查看详情';
            linkEl.style.display = 'inline';
        } else {
            linkEl.style.display = 'none';
        }
        
        // 设置样式
        bar.className = `announcement-bar ${announcement.type || 'info'}`;
        bar.style.display = 'flex';
        
        // 动画
        requestAnimationFrame(() => {
            bar.style.transform = 'translateY(0)';
            bar.style.opacity = '1';
        });
    },

    // 关闭公告
    closeAnnouncement() {
        const bar = document.getElementById('announcementBar');
        if (!bar) return;
        
        bar.style.transform = 'translateY(-100%)';
        bar.style.opacity = '0';
        
        setTimeout(() => {
            bar.style.display = 'none';
        }, 300);
        
        // 记录已关闭
        if (this.state.currentAnnouncement) {
            const read = JSON.parse(localStorage.getItem(this.KEYS.ANNOUNCEMENT_READ) || '[]');
            if (!read.includes(this.state.currentAnnouncement.id)) {
                read.push(this.state.currentAnnouncement.id);
                localStorage.setItem(this.KEYS.ANNOUNCEMENT_READ, JSON.stringify(read));
            }
        }
    },

    // 创建公告（管理员功能）
    createAnnouncement(data) {
        const announcement = {
            id: 'ann_' + Date.now(),
            text: data.text,
            type: data.type || 'info', // info, warning, success, error
            link: data.link || null,
            linkText: data.linkText || null,
            priority: data.priority || 0,
            startTime: data.startTime || null,
            endTime: data.endTime || null,
            createdAt: Date.now()
        };
        
        const announcements = JSON.parse(localStorage.getItem(this.KEYS.ANNOUNCEMENTS) || '[]');
        announcements.push(announcement);
        
        localStorage.setItem(this.KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
        
        // 广播新公告
        this.broadcastNewAnnouncement(announcement);
        
        return announcement;
    },

    // 删除公告
    deleteAnnouncement(id) {
        let announcements = JSON.parse(localStorage.getItem(this.KEYS.ANNOUNCEMENTS) || '[]');
        announcements = announcements.filter(a => a.id !== id);
        localStorage.setItem(this.KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
        
        // 从已读列表中移除
        let read = JSON.parse(localStorage.getItem(this.KEYS.ANNOUNCEMENT_READ) || '[]');
        read = read.filter(rid => rid !== id);
        localStorage.setItem(this.KEYS.ANNOUNCEMENT_READ, JSON.stringify(read));
        
        return true;
    },

    // 广播新公告
    broadcastNewAnnouncement(announcement) {
        if (window.BroadcastChannel) {
            const channel = new BroadcastChannel('announcements');
            channel.postMessage({ type: 'new', announcement });
        }
    },

    // ========== 设置 ==========

    // 加载设置
    loadSettings() {
        const settings = JSON.parse(localStorage.getItem(this.KEYS.UTILITY_SETTINGS) || '{}');
        this.config = { ...this.config, ...settings };
    },

    // 保存设置
    saveSettings(settings) {
        this.config = { ...this.config, ...settings };
        localStorage.setItem(this.KEYS.UTILITY_SETTINGS, JSON.stringify(this.config));
    },

    // 创建设置面板
    createSettingsPanel(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const darkModeSettings = this.getDarkModeSettings();
        
        container.innerHTML = `
            <div class="utility-settings-panel">
                <h4>实用功能设置</h4>
                
                <div class="setting-section">
                    <h5>动画效果</h5>
                    <label class="setting-item">
                        <span>启用交互动画</span>
                        <input type="checkbox" id="enableAnimations" ${this.config.animationsEnabled ? 'checked' : ''}>
                    </label>
                </div>
                
                <div class="setting-section">
                    <h5>夜间模式</h5>
                    <label class="setting-item">
                        <span>跟随系统主题</span>
                        <input type="checkbox" id="followSystemTheme" ${darkModeSettings.followSystem ? 'checked' : ''}>
                    </label>
                    <label class="setting-item">
                        <span>自动切换时间</span>
                        <input type="checkbox" id="autoSchedule" ${darkModeSettings.autoSchedule ? 'checked' : ''}>
                    </label>
                    <div class="time-range ${darkModeSettings.autoSchedule ? '' : 'disabled'}">
                        <input type="time" id="darkStartTime" value="${darkModeSettings.startTime}">
                        <span>至</span>
                        <input type="time" id="darkEndTime" value="${darkModeSettings.endTime}">
                    </div>
                </div>
                
                <div class="setting-section">
                    <h5>公告栏</h5>
                    <button class="clear-announcements-btn" onclick="UtilityFeatures.clearAllAnnouncements()">
                        清除所有已关闭的公告
                    </button>
                </div>
                
                <button class="save-utility-settings" onclick="UtilityFeatures.saveSettingsFromUI()">保存设置</button>
            </div>
        `;
        
        // 绑定自动切换时间的显示/隐藏
        const autoScheduleCheckbox = document.getElementById('autoSchedule');
        const timeRange = container.querySelector('.time-range');
        
        autoScheduleCheckbox?.addEventListener('change', (e) => {
            timeRange.classList.toggle('disabled', !e.target.checked);
        });
    },

    // 从UI保存设置
    saveSettingsFromUI() {
        const settings = {
            animationsEnabled: document.getElementById('enableAnimations')?.checked ?? true
        };
        this.saveSettings(settings);
        
        const darkModeSettings = {
            manual: false,
            followSystem: document.getElementById('followSystemTheme')?.checked ?? true,
            autoSchedule: document.getElementById('autoSchedule')?.checked ?? false,
            startTime: document.getElementById('darkStartTime')?.value || '20:00',
            endTime: document.getElementById('darkEndTime')?.value || '06:00'
        };
        this.saveDarkModeSettings(darkModeSettings);
        
        this.showToast('设置已保存');
    },

    // 清除所有公告
    clearAllAnnouncements() {
        localStorage.removeItem(this.KEYS.ANNOUNCEMENT_READ);
        this.showToast('已重置所有公告');
    },

    // 获取当前用户
    getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem('current_user') || 'null');
        } catch {
            return null;
        }
    },

    // 显示提示
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'utility-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
};

// 添加CSS样式
const utilityStyles = `
<style>
/* 点赞动画 */
@keyframes likeFloat {
    0% { transform: translate(-50%, 0) scale(1); opacity: 1; }
    100% { transform: translate(-50%, -100px) scale(1.5); opacity: 0; }
}

.like-animation-heart {
    transform: translateX(-50%);
}

@keyframes ripple {
    to { transform: scale(4); opacity: 0; }
}

.ripple-effect {
    position: absolute;
    border-radius: 50%;
}

/* 用户状态指示器 */
.user-status-indicator {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-left: 5px;
    border: 2px solid white;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
}

.user-status-indicator.online {
    background: #27ae60;
    animation: pulse 2s infinite;
}

.user-status-indicator.away {
    background: #f39c12;
}

.user-status-indicator.offline {
    background: #95a5a6;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
}

/* 在线人数计数器 */
.online-counter {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    background: rgba(39, 174, 96, 0.1);
    border-radius: 20px;
    font-size: 13px;
    color: #27ae60;
    transition: all 0.3s;
}

.online-counter::before {
    content: '';
    width: 8px;
    height: 8px;
    background: #27ae60;
    border-radius: 50%;
    animation: pulse 2s infinite;
}

.online-counter.updating {
    transform: scale(1.1);
    background: rgba(39, 174, 96, 0.2);
}

/* 公告栏 */
.announcement-bar {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 40px 12px 20px;
    transform: translateY(-100%);
    opacity: 0;
    transition: all 0.3s ease;
}

.announcement-bar.info {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.announcement-bar.warning {
    background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
    color: white;
}

.announcement-bar.success {
    background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
    color: white;
}

.announcement-bar.error {
    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    color: white;
}

.announcement-content {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
}

.announcement-icon {
    font-size: 18px;
}

.announcement-text {
    font-size: 14px;
}

.announcement-link {
    color: white;
    text-decoration: underline;
    font-size: 13px;
    font-weight: 500;
}

.announcement-link:hover {
    opacity: 0.9;
}

.announcement-close {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    opacity: 0.8;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s;
}

.announcement-close:hover {
    opacity: 1;
    background: rgba(255,255,255,0.2);
}

/* 夜间模式样式 */
body.dark-mode {
    background: #1a1a2e;
    color: #eaeaea;
}

body.dark-mode .card,
body.dark-mode .article-card {
    background: #16213e;
    border-color: #0f3460;
}

/* 设置面板 */
.utility-settings-panel {
    padding: 20px;
}

.utility-settings-panel h4 {
    margin-bottom: 20px;
    color: #333;
}

.setting-section {
    margin-bottom: 25px;
    padding-bottom: 20px;
    border-bottom: 1px solid #eee;
}

.setting-section h5 {
    margin-bottom: 15px;
    color: #555;
    font-size: 14px;
}

.setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    cursor: pointer;
}

.setting-item span {
    color: #333;
    font-size: 14px;
}

.setting-item input[type="checkbox"] {
    width: 44px;
    height: 24px;
    appearance: none;
    background: #ccc;
    border-radius: 24px;
    position: relative;
    cursor: pointer;
    transition: 0.3s;
}

.setting-item input[type="checkbox"]:checked {
    background: #2196f3;
}

.setting-item input[type="checkbox"]::before {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    top: 2px;
    left: 2px;
    transition: 0.3s;
}

.setting-item input[type="checkbox"]:checked::before {
    left: 22px;
}

.time-range {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 10px;
    padding-left: 10px;
}

.time-range.disabled {
    opacity: 0.5;
    pointer-events: none;
}

.time-range input[type="time"] {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 6px;
}

.clear-announcements-btn {
    padding: 10px 16px;
    background: #f0f0f0;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    color: #666;
}

.clear-announcements-btn:hover {
    background: #e0e0e0;
}

.save-utility-settings {
    width: 100%;
    padding: 12px;
    background: #2196f3;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    margin-top: 10px;
}

/* 提示 */
.utility-toast {
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 10000;
    animation: fadeInUp 0.3s ease;
}

@keyframes fadeInUp {
    from { opacity: 0; transform: translate(-50%, 20px); }
    to { opacity: 1; transform: translate(-50%, 0); }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', utilityStyles);

// 初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => UtilityFeatures.init());
} else {
    UtilityFeatures.init();
}

// 暴露到全局
window.UtilityFeatures = UtilityFeatures;
