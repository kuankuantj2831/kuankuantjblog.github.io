/**
 * 用户个性化系统 - User Personalization System
 * 包含：主页背景、装扮系统、访客统计、主题配色、拖拽布局
 */

const UserPersonalization = {
    // 存储键
    KEYS: {
        PROFILE_BG: 'user_profile_background',
        AVATAR_FRAME: 'user_avatar_frame',
        NICKNAME_COLOR: 'user_nickname_color',
        THEME: 'user_theme',
        HOMEPAGE_LAYOUT: 'user_homepage_layout',
        VISITOR_STATS: 'visitor_stats',
        MY_VISITORS: 'my_visitors',
        DECORATIONS: 'user_decorations'
    },

    // 装扮配置
    DECORATIONS: {
        frames: [
            { id: 'frame_default', name: '默认', type: 'free', color: '#ccc' },
            { id: 'frame_gold', name: '黄金', type: 'coin', price: 500, color: '#FFD700', gradient: 'linear-gradient(135deg, #FFD700, #FFA500)' },
            { id: 'frame_silver', name: '白银', type: 'coin', price: 300, color: '#C0C0C0', gradient: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)' },
            { id: 'frame_bronze', name: '青铜', type: 'coin', price: 200, color: '#CD7F32', gradient: 'linear-gradient(135deg, #CD7F32, #A0522D)' },
            { id: 'frame_rainbow', name: '彩虹', type: 'coin', price: 800, color: 'rainbow', gradient: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)' },
            { id: 'frame_fire', name: '烈焰', type: 'coin', price: 600, color: '#ff4500', gradient: 'linear-gradient(135deg, #ff4500, #ff6347, #ffa500)' },
            { id: 'frame_ice', name: '冰霜', type: 'coin', price: 600, color: '#00ced1', gradient: 'linear-gradient(135deg, #00ced1, #87ceeb, #b0e0e6)' },
            { id: 'frame_dark', name: '暗黑', type: 'coin', price: 400, color: '#2c2c2c', gradient: 'linear-gradient(135deg, #2c2c2c, #4a4a4a, #1a1a1a)' },
            { id: 'frame_vip', name: 'VIP专属', type: 'vip', color: '#e74c3c', gradient: 'linear-gradient(135deg, #e74c3c, #c0392b)', badge: 'VIP' },
            { id: 'frame_creator', name: '创作者', type: 'achievement', condition: '发布10篇文章', color: '#9b59b6', gradient: 'linear-gradient(135deg, #9b59b6, #8e44ad)' }
        ],
        colors: [
            { id: 'color_default', name: '默认黑', type: 'free', color: '#333333' },
            { id: 'color_red', name: '中国红', type: 'free', color: '#e74c3c' },
            { id: 'color_blue', name: '天空蓝', type: 'coin', price: 100, color: '#3498db' },
            { id: 'color_green', name: '草地绿', type: 'coin', price: 100, color: '#27ae60' },
            { id: 'color_purple', name: '神秘紫', type: 'coin', price: 150, color: '#9b59b6' },
            { id: 'color_orange', name: '活力橙', type: 'coin', price: 100, color: '#f39c12' },
            { id: 'color_pink', name: '樱花粉', type: 'coin', price: 150, color: '#e91e63' },
            { id: 'color_cyan', name: '青色', type: 'coin', price: 120, color: '#00bcd4' },
            { id: 'color_gold', name: '金色', type: 'coin', price: 300, color: '#FFD700', shadow: '0 0 10px rgba(255, 215, 0, 0.5)' },
            { id: 'color_gradient1', name: '极光', type: 'coin', price: 500, gradient: 'linear-gradient(90deg, #667eea, #764ba2)', isGradient: true },
            { id: 'color_gradient2', name: '夕阳', type: 'coin', price: 400, gradient: 'linear-gradient(90deg, #f093fb, #f5576c)', isGradient: true },
            { id: 'color_gradient3', name: '海洋', type: 'coin', price: 400, gradient: 'linear-gradient(90deg, #4facfe, #00f2fe)', isGradient: true }
        ],
        backgrounds: [
            { id: 'bg_none', name: '无背景', type: 'free' },
            { id: 'bg_gradient1', name: '紫色渐变', type: 'free', style: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
            { id: 'bg_gradient2', name: '蓝色渐变', type: 'free', style: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
            { id: 'bg_gradient3', name: '日落渐变', type: 'free', style: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
            { id: 'bg_gradient4', name: '森林渐变', type: 'coin', price: 200, style: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
            { id: 'bg_gradient5', name: '午夜渐变', type: 'coin', price: 200, style: 'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)' },
            { id: 'bg_dots', name: '波点图案', type: 'coin', price: 300, pattern: 'dots' },
            { id: 'bg_stripes', name: '条纹图案', type: 'coin', price: 300, pattern: 'stripes' },
            { id: 'bg_grid', name: '网格图案', type: 'coin', price: 250, pattern: 'grid' },
            { id: 'bg_stars', name: '星空', type: 'coin', price: 500, pattern: 'stars' },
            { id: 'bg_custom', name: '自定义图片', type: 'premium', price: 1000 }
        ]
    },

    // 主题配色
    THEMES: {
        default: { name: '默认', primary: '#667eea', secondary: '#764ba2', bg: '#f5f5f5', card: '#ffffff', text: '#333333' },
        dark: { name: '暗黑', primary: '#667eea', secondary: '#764ba2', bg: '#1a1a2e', card: '#16213e', text: '#eaeaea', isDark: true },
        blue: { name: '海洋蓝', primary: '#3498db', secondary: '#2980b9', bg: '#ebf5fb', card: '#ffffff', text: '#2c3e50' },
        green: { name: '森林绿', primary: '#27ae60', secondary: '#229954', bg: '#e8f8f5', card: '#ffffff', text: '#1e8449' },
        orange: { name: '活力橙', primary: '#f39c12', secondary: '#e67e22', bg: '#fef5e7', card: '#ffffff', text: '#d35400' },
        purple: { name: '神秘紫', primary: '#9b59b6', secondary: '#8e44ad', bg: '#f5eef8', card: '#ffffff', text: '#7d3c98' },
        red: { name: '中国红', primary: '#e74c3c', secondary: '#c0392b', bg: '#fdedec', card: '#ffffff', text: '#922b21' },
        pink: { name: '樱花粉', primary: '#e91e63', secondary: '#c2185b', bg: '#fce4ec', card: '#ffffff', text: '#880e4f' },
        teal: { name: '青柠', primary: '#00bcd4', secondary: '#0097a7', bg: '#e0f7fa', card: '#ffffff', text: '#006064' },
        brown: { name: '咖啡', primary: '#795548', secondary: '#5d4037', bg: '#efebe9', card: '#ffffff', text: '#3e2723' }
    },

    // 初始化
    init() {
        this.loadUserDecorations();
        this.applyCurrentTheme();
        this.initHomepageLayout();
        this.initVisitorTracking();
    },

    // ========== 装扮系统 ==========

    // 获取用户拥有的装扮
    getUserDecorations() {
        return JSON.parse(localStorage.getItem(this.KEYS.DECORATIONS) || '{}');
    },

    // 保存用户装扮
    saveUserDecorations(decorations) {
        localStorage.setItem(this.KEYS.DECORATIONS, JSON.stringify(decorations));
    },

    // 购买装扮
    purchaseDecoration(decorationId, type = 'frame') {
        const decorations = this.getUserDecorations();
        const item = this.DECORATIONS[type + 's'].find(d => d.id === decorationId);
        
        if (!item) return { success: false, message: '装扮不存在' };
        if (decorations[type + 's']?.includes(decorationId)) {
            return { success: false, message: '已经拥有此装扮' };
        }
        if (item.type === 'free' || item.type === 'achievement') {
            // 免费或成就装扮直接解锁
        } else if (item.type === 'vip') {
            return { success: false, message: 'VIP专属装扮，请先升级VIP' };
        } else {
            // 检查硬币余额
            const coins = this.getUserCoins();
            if (coins < item.price) {
                return { success: false, message: `硬币不足，需要 ${item.price} 硬币` };
            }
            // 扣除硬币
            this.deductCoins(item.price);
        }

        if (!decorations[type + 's']) decorations[type + 's'] = [];
        decorations[type + 's'].push(decorationId);
        this.saveUserDecorations(decorations);

        // 发送事件
        window.dispatchEvent(new CustomEvent('decorationPurchased', { 
            detail: { decorationId, type, item } 
        }));

        return { success: true, message: '购买成功！' };
    },

    // 获取用户硬币数
    getUserCoins() {
        return parseInt(localStorage.getItem('user_coins') || '0');
    },

    // 扣除硬币
    deductCoins(amount) {
        const current = this.getUserCoins();
        localStorage.setItem('user_coins', Math.max(0, current - amount));
    },

    // 装备装扮
    equipDecoration(decorationId, type) {
        const decorations = this.getUserDecorations();
        const owned = decorations[type + 's'] || [];
        
        // 免费装扮直接可用
        const item = this.DECORATIONS[type + 's'].find(d => d.id === decorationId);
        if (!item) return false;

        if (item.type !== 'free' && !owned.includes(decorationId)) {
            return false;
        }

        if (type === 'frame') {
            localStorage.setItem(this.KEYS.AVATAR_FRAME, decorationId);
        } else if (type === 'color') {
            localStorage.setItem(this.KEYS.NICKNAME_COLOR, decorationId);
        } else if (type === 'background') {
            localStorage.setItem(this.KEYS.PROFILE_BG, decorationId);
        }

        this.applyDecorations();
        return true;
    },

    // 应用装扮
    applyDecorations() {
        const frameId = localStorage.getItem(this.KEYS.AVATAR_FRAME);
        const colorId = localStorage.getItem(this.KEYS.NICKNAME_COLOR);
        const bgId = localStorage.getItem(this.KEYS.PROFILE_BG);

        // 应用头像框
        if (frameId) {
            const frame = this.DECORATIONS.frames.find(f => f.id === frameId);
            if (frame) {
                document.querySelectorAll('.user-avatar, .profile-avatar').forEach(avatar => {
                    avatar.style.border = frame.gradient ? `4px solid transparent` : `4px solid ${frame.color}`;
                    avatar.style.background = frame.gradient || 'none';
                    avatar.style.backgroundClip = frame.gradient ? 'padding-box' : 'initial';
                    if (frame.gradient) {
                        avatar.style.boxShadow = `0 0 0 4px ${frame.color}`;
                    }
                });
            }
        }

        // 应用昵称颜色
        if (colorId) {
            const color = this.DECORATIONS.colors.find(c => c.id === colorId);
            if (color) {
                document.querySelectorAll('.username, .nickname, .user-name').forEach(el => {
                    if (color.isGradient && color.gradient) {
                        el.style.background = color.gradient;
                        el.style.webkitBackgroundClip = 'text';
                        el.style.webkitTextFillColor = 'transparent';
                        el.style.backgroundClip = 'text';
                    } else {
                        el.style.color = color.color;
                        el.style.textShadow = color.shadow || 'none';
                    }
                });
            }
        }

        // 应用背景
        if (bgId) {
            const bg = this.DECORATIONS.backgrounds.find(b => b.id === bgId);
            if (bg) {
                document.querySelectorAll('.profile-header, .user-card-header').forEach(el => {
                    if (bg.style) {
                        el.style.background = bg.style;
                    } else if (bg.pattern) {
                        el.style.background = this.getPatternCSS(bg.pattern);
                    }
                });
            }
        }
    },

    // 获取图案CSS
    getPatternCSS(pattern) {
        const patterns = {
            dots: 'radial-gradient(circle, #ccc 2px, transparent 2px)',
            stripes: 'repeating-linear-gradient(45deg, #f0f0f0, #f0f0f0 10px, #fff 10px, #fff 20px)',
            grid: 'linear-gradient(#e0e0e0 1px, transparent 1px), linear-gradient(90deg, #e0e0e0 1px, transparent 1px)',
            stars: 'radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 3px)'
        };
        return patterns[pattern] || '';
    },

    // 加载用户装扮
    loadUserDecorations() {
        this.applyDecorations();
    },

    // ========== 主题系统 ==========

    // 获取当前主题
    getCurrentTheme() {
        return localStorage.getItem(this.KEYS.THEME) || 'default';
    },

    // 设置主题
    setTheme(themeId) {
        if (!this.THEMES[themeId]) return false;
        
        localStorage.setItem(this.KEYS.THEME, themeId);
        this.applyTheme(themeId);
        
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: themeId } }));
        return true;
    },

    // 应用主题
    applyTheme(themeId) {
        const theme = this.THEMES[themeId];
        if (!theme) return;

        const root = document.documentElement;
        root.style.setProperty('--theme-primary', theme.primary);
        root.style.setProperty('--theme-secondary', theme.secondary);
        root.style.setProperty('--theme-bg', theme.bg);
        root.style.setProperty('--theme-card', theme.card);
        root.style.setProperty('--theme-text', theme.text);

        // 应用暗黑模式
        if (theme.isDark) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    },

    // 应用当前主题
    applyCurrentTheme() {
        const theme = this.getCurrentTheme();
        this.applyTheme(theme);
    },

    // ========== 访客统计 ==========

    // 初始化访客追踪
    initVisitorTracking() {
        // 记录当前页面访问
        this.recordVisit();
        
        // 定期清理过期访客数据
        this.cleanOldVisitors();
    },

    // 记录访问
    recordVisit() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return;

        // 获取当前访问的页面主人
        const pageOwner = this.getPageOwner();
        if (!pageOwner || pageOwner === currentUser.username) return; // 不记录自己访问自己

        const visitorData = {
            username: currentUser.username,
            avatar: currentUser.avatar || '',
            timestamp: Date.now(),
            page: window.location.pathname
        };

        // 保存到被访问者的访客记录
        this.addVisitor(pageOwner, visitorData);
    },

    // 添加访客记录
    addVisitor(ownerUsername, visitorData) {
        const key = `${this.KEYS.MY_VISITORS}_${ownerUsername}`;
        let visitors = JSON.parse(localStorage.getItem(key) || '[]');
        
        // 移除同一用户的旧记录
        visitors = visitors.filter(v => v.username !== visitorData.username);
        
        // 添加到最前
        visitors.unshift(visitorData);
        
        // 保留最近100条
        visitors = visitors.slice(0, 100);
        
        localStorage.setItem(key, JSON.stringify(visitors));
    },

    // 获取访客列表
    getVisitors(username) {
        const key = `${this.KEYS.MY_VISITORS}_${username}`;
        return JSON.parse(localStorage.getItem(key) || '[]');
    },

    // 获取今日访客数
    getTodayVisitorCount(username) {
        const visitors = this.getVisitors(username);
        const today = new Date().setHours(0, 0, 0, 0);
        return visitors.filter(v => v.timestamp >= today).length;
    },

    // 获取总访客数
    getTotalVisitorCount(username) {
        return this.getVisitors(username).length;
    },

    // 清理过期访客（保留30天）
    cleanOldVisitors() {
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.KEYS.MY_VISITORS)) {
                let visitors = JSON.parse(localStorage.getItem(key) || '[]');
                visitors = visitors.filter(v => v.timestamp > thirtyDaysAgo);
                localStorage.setItem(key, JSON.stringify(visitors));
            }
        }
    },

    // 获取页面主人
    getPageOwner() {
        // 从URL或其他方式获取页面主人
        const path = window.location.pathname;
        const match = path.match(/\/user\/([^\/]+)/);
        return match ? match[1] : null;
    },

    // 获取当前用户
    getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem('current_user') || 'null');
        } catch {
            return null;
        }
    },

    // ========== 拖拽布局 ==========

    // 初始化首页布局
    initHomepageLayout() {
        // 只在首页启用
        if (!document.querySelector('.chinese-style-wrapper')) return;

        this.loadHomepageLayout();
        this.initDragAndDrop();
    },

    // 获取默认布局
    getDefaultLayout() {
        return [
            { id: 'hero', name: '欢迎横幅', enabled: true, order: 1 },
            { id: 'search', name: '搜索区', enabled: true, order: 2 },
            { id: 'tabs', name: '分类标签', enabled: true, order: 3 },
            { id: 'articles', name: '文章列表', enabled: true, order: 4 },
            { id: 'sidebar', name: '侧边栏', enabled: true, order: 5 },
            { id: 'footer', name: '页脚', enabled: true, order: 6 }
        ];
    },

    // 获取布局配置
    getHomepageLayout() {
        return JSON.parse(localStorage.getItem(this.KEYS.HOMEPAGE_LAYOUT)) || this.getDefaultLayout();
    },

    // 保存布局配置
    saveHomepageLayout(layout) {
        localStorage.setItem(this.KEYS.HOMEPAGE_LAYOUT, JSON.stringify(layout));
    },

    // 加载布局
    loadHomepageLayout() {
        const layout = this.getHomepageLayout();
        // 实际应用布局调整
        layout.forEach(item => {
            const element = document.getElementById(item.id) || 
                           document.querySelector(`.${item.id}-section`) ||
                           document.querySelector(`[data-layout-id="${item.id}"]`);
            if (element) {
                element.style.display = item.enabled ? '' : 'none';
                element.style.order = item.order;
            }
        });
    },

    // 初始化拖拽
    initDragAndDrop() {
        let draggedItem = null;
        
        // 存储事件监听器以便后续清理
        this._dragListeners = this._dragListeners || [];

        document.querySelectorAll('.layout-draggable').forEach(item => {
            item.draggable = true;

            const dragstartHandler = (e) => {
                draggedItem = item;
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            };

            const dragendHandler = () => {
                item.classList.remove('dragging');
                draggedItem = null;
                this.saveCurrentLayout();
            };

            item.addEventListener('dragstart', dragstartHandler);
            item.addEventListener('dragend', dragendHandler);
            
            this._dragListeners.push({
                element: item,
                event: 'dragstart',
                handler: dragstartHandler
            });
            this._dragListeners.push({
                element: item,
                event: 'dragend',
                handler: dragendHandler
            });
        });

        document.querySelectorAll('.layout-dropzone').forEach(zone => {
            const dragoverHandler = (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                zone.classList.add('drag-over');
            };

            const dragleaveHandler = () => {
                zone.classList.remove('drag-over');
            };

            const dropHandler = (e) => {
                e.preventDefault();
                zone.classList.remove('drag-over');
                if (draggedItem) {
                    zone.appendChild(draggedItem);
                }
            };

            zone.addEventListener('dragover', dragoverHandler);
            zone.addEventListener('dragleave', dragleaveHandler);
            zone.addEventListener('drop', dropHandler);
            
            this._dragListeners.push({
                element: zone,
                event: 'dragover',
                handler: dragoverHandler
            });
            this._dragListeners.push({
                element: zone,
                event: 'dragleave',
                handler: dragleaveHandler
            });
            this._dragListeners.push({
                element: zone,
                event: 'drop',
                handler: dropHandler
            });
        });
    },
    
    // 清理拖拽事件监听器
    cleanupDragListeners() {
        if (this._dragListeners) {
            this._dragListeners.forEach(({ element, event, handler }) => {
                element.removeEventListener(event, handler);
            });
            this._dragListeners = [];
        }
    },

    // 保存当前布局
    saveCurrentLayout() {
        const layout = [];
        document.querySelectorAll('.layout-draggable').forEach((item, index) => {
            layout.push({
                id: item.dataset.layoutId,
                name: item.dataset.layoutName,
                enabled: !item.classList.contains('disabled'),
                order: index + 1
            });
        });
        this.saveHomepageLayout(layout);
    },

    // 切换模块显示
    toggleModule(moduleId, enabled) {
        const layout = this.getHomepageLayout();
        const module = layout.find(m => m.id === moduleId);
        if (module) {
            module.enabled = enabled;
            this.saveHomepageLayout(layout);
            this.loadHomepageLayout();
        }
    },

    // 重置布局
    resetLayout() {
        localStorage.removeItem(this.KEYS.HOMEPAGE_LAYOUT);
        this.loadHomepageLayout();
    },

    // ========== UI 组件 ==========

    // 创建主题选择器
    createThemeSelector(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="theme-selector">
                <h4>主题配色</h4>
                <div class="theme-grid">
                    ${Object.entries(this.THEMES).map(([id, theme]) => `
                        <div class="theme-option ${this.getCurrentTheme() === id ? 'active' : ''}" 
                             data-theme="${id}" title="${theme.name}">
                            <div class="theme-preview" style="background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary})"></div>
                            <span>${theme.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        container.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                const themeId = option.dataset.theme;
                this.setTheme(themeId);
                container.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
            });
        });
    },

    // 创建装扮商店
    createDecorationShop(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const decorations = this.getUserDecorations();
        const currentFrame = localStorage.getItem(this.KEYS.AVATAR_FRAME);
        const currentColor = localStorage.getItem(this.KEYS.NICKNAME_COLOR);

        container.innerHTML = `
            <div class="decoration-shop">
                <div class="shop-tabs">
                    <button class="shop-tab active" data-tab="frames">头像框</button>
                    <button class="shop-tab" data-tab="colors">昵称颜色</button>
                    <button class="shop-tab" data-tab="backgrounds">主页背景</button>
                </div>
                
                <div class="shop-content">
                    <div class="shop-panel active" id="framesPanel">
                        <div class="decoration-grid">
                            ${this.DECORATIONS.frames.map(frame => {
                                const owned = decorations.frames?.includes(frame.id) || frame.type === 'free';
                                const equipped = currentFrame === frame.id;
                                return `
                                    <div class="decoration-item ${owned ? 'owned' : ''} ${equipped ? 'equipped' : ''}" 
                                         data-id="${frame.id}" data-type="frame">
                                        <div class="decoration-preview" style="background: ${frame.gradient || frame.color}"></div>
                                        <div class="decoration-info">
                                            <span class="decoration-name">${this.escapeHtml(frame.name)}</span>
                                            ${frame.badge ? `<span class="decoration-badge">${frame.badge}</span>` : ''}
                                            ${!owned ? `<span class="decoration-price">${frame.price || 0} 币</span>` : ''}
                                        </div>
                                        <button class="decoration-btn" ${!owned && frame.type !== 'free' ? 'disabled' : ''}>
                                            ${equipped ? '已装备' : owned ? '装备' : frame.type === 'free' ? '免费' : '购买'}
                                        </button>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    
                    <div class="shop-panel" id="colorsPanel">
                        <div class="decoration-grid">
                            ${this.DECORATIONS.colors.map(color => {
                                const owned = decorations.colors?.includes(color.id) || color.type === 'free';
                                const equipped = currentColor === color.id;
                                return `
                                    <div class="decoration-item ${owned ? 'owned' : ''} ${equipped ? 'equipped' : ''}" 
                                         data-id="${color.id}" data-type="color">
                                        <div class="decoration-preview" style="background: ${color.gradient || color.color}"></div>
                                        <div class="decoration-info">
                                            <span class="decoration-name" style="color: ${color.color}">${this.escapeHtml(color.name)}</span>
                                            ${!owned ? `<span class="decoration-price">${color.price || 0} 币</span>` : ''}
                                        </div>
                                        <button class="decoration-btn" ${!owned && color.type !== 'free' ? 'disabled' : ''}>
                                            ${equipped ? '已装备' : owned ? '装备' : color.type === 'free' ? '免费' : '购买'}
                                        </button>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    
                    <div class="shop-panel" id="backgroundsPanel">
                        <div class="decoration-grid">
                            ${this.DECORATIONS.backgrounds.map(bg => `
                                <div class="decoration-item" data-id="${bg.id}" data-type="background">
                                    <div class="decoration-preview" style="${bg.style ? `background: ${bg.style}` : bg.pattern ? `background: ${this.getPatternCSS(bg.pattern)}` : 'background: #f0f0f0'}"></div>
                                    <div class="decoration-info">
                                        <span class="decoration-name">${this.escapeHtml(bg.name)}</span>
                                        ${bg.price ? `<span class="decoration-price">${bg.price} 币</span>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 标签切换
        container.querySelectorAll('.shop-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                container.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
                container.querySelectorAll('.shop-panel').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                container.querySelector(`#${tab.dataset.tab}Panel`).classList.add('active');
            });
        });

        // 购买/装备
        container.querySelectorAll('.decoration-item').forEach(item => {
            item.addEventListener('click', async () => {
                const id = item.dataset.id;
                const type = item.dataset.type;
                const decorations = this.getUserDecorations();
                const owned = decorations[`${type}s`]?.includes(id);
                const itemData = this.DECORATIONS[`${type}s`].find(d => d.id === id);

                if (!owned && itemData.type !== 'free') {
                    const result = this.purchaseDecoration(id, type);
                    this.showToast(result.message, result.success ? 'success' : 'error');
                    if (result.success) {
                        this.createDecorationShop(containerId);
                    }
                } else {
                    this.equipDecoration(id, type);
                    this.showToast('装备成功！', 'success');
                    this.createDecorationShop(containerId);
                }
            });
        });
    },

    // 创建访客统计面板
    createVisitorPanel(containerId, username) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const visitors = this.getVisitors(username);
        const todayCount = this.getTodayVisitorCount(username);
        const totalCount = this.getTotalVisitorCount(username);

        container.innerHTML = `
            <div class="visitor-stats-panel">
                <div class="visitor-header">
                    <h4>访客统计</h4>
                    <div class="visitor-counts">
                        <span class="count-item">今日: ${todayCount}</span>
                        <span class="count-item">总计: ${totalCount}</span>
                    </div>
                </div>
                <div class="visitor-list">
                    ${visitors.slice(0, 10).map(v => `
                        <div class="visitor-item">
                            <img src="${v.avatar || '/images/default-avatar.png'}" alt="" class="visitor-avatar">
                            <div class="visitor-info">
                                <span class="visitor-name">${v.username}</span>
                                <span class="visitor-time">${this.formatTime(v.timestamp)}</span>
                            </div>
                        </div>
                    `).join('')}
                    ${visitors.length === 0 ? '<div class="visitor-empty">暂无访客记录</div>' : ''}
                </div>
                ${visitors.length > 10 ? `<div class="visitor-more">还有 ${visitors.length - 10} 位访客</div>` : ''}
            </div>
        `;
    },

    // 创建布局编辑器
    createLayoutEditor(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const layout = this.getHomepageLayout();

        container.innerHTML = `
            <div class="layout-editor">
                <h4>首页布局</h4>
                <p class="layout-hint">拖拽调整顺序，点击开关显示/隐藏</p>
                <div class="layout-list">
                    ${layout.map(item => `
                        <div class="layout-item ${item.enabled ? '' : 'disabled'}" 
                             data-id="${item.id}" draggable="true">
                            <span class="layout-drag-handle">⋮⋮</span>
                            <span class="layout-name">${item.name}</span>
                            <label class="layout-toggle">
                                <input type="checkbox" ${item.enabled ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    `).join('')}
                </div>
                <button class="layout-reset-btn">重置默认布局</button>
            </div>
        `;

        // 开关切换
        container.querySelectorAll('.layout-toggle input').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const item = e.target.closest('.layout-item');
                const id = item.dataset.id;
                const enabled = e.target.checked;
                item.classList.toggle('disabled', !enabled);
                this.toggleModule(id, enabled);
            });
        });

        // 重置按钮
        container.querySelector('.layout-reset-btn').addEventListener('click', () => {
            this.resetLayout();
            this.createLayoutEditor(containerId);
            this.showToast('布局已重置', 'success');
        });

        // 拖拽排序
        this.initLayoutDragSort(container.querySelector('.layout-list'));
    },

    // 初始化布局拖拽排序
    initLayoutDragSort(list) {
        let draggedItem = null;

        list.querySelectorAll('.layout-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                draggedItem = item;
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                draggedItem = null;
                this.saveCurrentLayoutOrder(list);
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (!draggedItem || draggedItem === item) return;

                const rect = item.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                
                if (e.clientY < midY) {
                    list.insertBefore(draggedItem, item);
                } else {
                    list.insertBefore(draggedItem, item.nextSibling);
                }
            });
        });
    },

    // 保存布局顺序
    saveCurrentLayoutOrder(list) {
        const layout = [];
        list.querySelectorAll('.layout-item').forEach((item, index) => {
            layout.push({
                id: item.dataset.id,
                enabled: !item.classList.contains('disabled'),
                order: index + 1
            });
        });
        this.saveHomepageLayout(layout);
        this.loadHomepageLayout();
    },

    // 格式化时间
    formatTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
        
        return new Date(timestamp).toLocaleDateString('zh-CN');
    },

    // 显示提示
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            animation: fadeInUp 0.3s ease;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
};

// 添加CSS样式
const personalizationStyles = `
<style>
/* 主题选择器 */
.theme-selector { padding: 15px; }
.theme-selector h4 { margin-bottom: 15px; color: #333; }
.theme-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.theme-option { 
    text-align: center; 
    cursor: pointer; 
    padding: 8px; 
    border-radius: 8px; 
    transition: all 0.3s;
}
.theme-option:hover { background: #f0f0f0; }
.theme-option.active { background: #e3f2fd; box-shadow: 0 0 0 2px #2196f3; }
.theme-preview { 
    width: 40px; 
    height: 40px; 
    border-radius: 50%; 
    margin: 0 auto 5px;
}
.theme-option span { font-size: 12px; color: #666; }

/* 装扮商店 */
.decoration-shop { padding: 15px; }
.shop-tabs { display: flex; gap: 10px; margin-bottom: 15px; border-bottom: 2px solid #eee; }
.shop-tab { 
    padding: 10px 20px; 
    border: none; 
    background: none; 
    cursor: pointer; 
    font-size: 14px;
    color: #666;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
}
.shop-tab.active { color: #2196f3; border-bottom-color: #2196f3; }
.shop-panel { display: none; }
.shop-panel.active { display: block; }
.decoration-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
.decoration-item { 
    border: 2px solid #eee; 
    border-radius: 12px; 
    padding: 15px; 
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
    position: relative;
}
.decoration-item:hover { border-color: #2196f3; transform: translateY(-2px); }
.decoration-item.owned { border-color: #27ae60; }
.decoration-item.equipped { 
    border-color: #2196f3; 
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.2);
}
.decoration-preview { 
    width: 60px; 
    height: 60px; 
    border-radius: 50%; 
    margin: 0 auto 10px;
}
.decoration-info { margin-bottom: 10px; }
.decoration-name { display: block; font-size: 14px; color: #333; margin-bottom: 5px; }
.decoration-price { 
    display: inline-block; 
    background: #fff3e0; 
    color: #f57c00; 
    padding: 2px 8px; 
    border-radius: 10px; 
    font-size: 12px;
}
.decoration-badge { 
    display: inline-block; 
    background: #e3f2fd; 
    color: #1976d2; 
    padding: 2px 8px; 
    border-radius: 10px; 
    font-size: 11px;
    margin-left: 5px;
}
.decoration-btn { 
    width: 100%; 
    padding: 8px; 
    border: none; 
    border-radius: 6px; 
    background: #2196f3; 
    color: white;
    cursor: pointer;
    font-size: 13px;
}
.decoration-btn:disabled { background: #ccc; cursor: not-allowed; }
.decoration-item.equipped .decoration-btn { background: #27ae60; }

/* 访客统计 */
.visitor-stats-panel { padding: 15px; }
.visitor-header { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
}
.visitor-header h4 { margin: 0; color: #333; }
.visitor-counts { display: flex; gap: 15px; }
.count-item { font-size: 13px; color: #666; }
.visitor-list { max-height: 300px; overflow-y: auto; }
.visitor-item { 
    display: flex; 
    align-items: center; 
    gap: 12px; 
    padding: 10px;
    border-radius: 8px;
    transition: background 0.2s;
}
.visitor-item:hover { background: #f5f5f5; }
.visitor-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
.visitor-info { flex: 1; }
.visitor-name { display: block; font-size: 14px; color: #333; }
.visitor-time { font-size: 12px; color: #999; }
.visitor-empty { text-align: center; padding: 30px; color: #999; }
.visitor-more { text-align: center; padding: 10px; color: #2196f3; font-size: 13px; }

/* 布局编辑器 */
.layout-editor { padding: 15px; }
.layout-editor h4 { margin-bottom: 5px; color: #333; }
.layout-hint { font-size: 12px; color: #999; margin-bottom: 15px; }
.layout-list { display: flex; flex-direction: column; gap: 8px; }
.layout-item { 
    display: flex; 
    align-items: center; 
    gap: 10px; 
    padding: 12px 15px;
    background: #f8f9fa;
    border-radius: 8px;
    cursor: move;
    transition: all 0.2s;
}
.layout-item:hover { background: #e9ecef; }
.layout-item.disabled { opacity: 0.5; }
.layout-item.dragging { opacity: 0.5; }
.layout-drag-handle { color: #ccc; font-size: 14px; }
.layout-name { flex: 1; font-size: 14px; color: #333; }
.layout-toggle { position: relative; width: 44px; height: 24px; }
.layout-toggle input { opacity: 0; width: 0; height: 0; }
.toggle-slider { 
    position: absolute;
    cursor: pointer;
    top: 0; left: 0; right: 0; bottom: 0;
    background: #ccc;
    border-radius: 24px;
    transition: 0.3s;
}
.toggle-slider:before {
    content: "";
    position: absolute;
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background: white;
    border-radius: 50%;
    transition: 0.3s;
}
.layout-toggle input:checked + .toggle-slider { background: #2196f3; }
.layout-toggle input:checked + .toggle-slider:before { transform: translateX(20px); }
.layout-reset-btn { 
    width: 100%; 
    margin-top: 15px; 
    padding: 10px;
    border: 1px dashed #ccc;
    background: none;
    border-radius: 6px;
    color: #666;
    cursor: pointer;
    font-size: 13px;
}
.layout-reset-btn:hover { border-color: #2196f3; color: #2196f3; }

/* 动画 */
@keyframes fadeInUp {
    from { opacity: 0; transform: translate(-50%, 20px); }
    to { opacity: 1; transform: translate(-50%, 0); }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', personalizationStyles);

// 初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => UserPersonalization.init());
} else {
    UserPersonalization.init();
}

// 暴露到全局
window.UserPersonalization = UserPersonalization;
