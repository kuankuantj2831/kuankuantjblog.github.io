/**
 * 实时弹幕系统前端组件
 * Real-time Danmaku Component
 */

class DanmakuSystem {
    constructor(containerId, roomId, options = {}) {
        this.container = document.getElementById(containerId);
        this.roomId = roomId;
        this.ws = null;
        this.isConnected = false;
        this.danmakuList = [];
        this.trackStatus = new Array(12).fill(0); // 12条轨道
        this.userSettings = {
            showDanmaku: true,
            opacity: 0.8,
            speed: 5,
            density: 'normal'
        };
        
        this.options = {
            maxDanmaku: 100,
            trackHeight: 30,
            ...options
        };

        this.init();
    }

    init() {
        if (!this.container) return;
        
        this.createUI();
        this.connectWebSocket();
        this.loadUserSettings();
    }

    createUI() {
        // 弹幕容器
        this.danmakuContainer = document.createElement('div');
        this.danmakuContainer.className = 'danmaku-container';
        this.danmakuContainer.innerHTML = `
            <div class="danmaku-layer" id="danmakuLayer"></div>
            <div class="danmaku-controls">
                <button class="danmaku-toggle" title="显示/隐藏弹幕">
                    <span class="icon">💬</span>
                </button>
                <button class="danmaku-settings" title="弹幕设置">
                    <span class="icon">⚙️</span>
                </button>
                <span class="online-count">在线: <span id="onlineCount">0</span></span>
            </div>
            <div class="danmaku-input-wrapper">
                <input type="text" id="danmakuInput" placeholder="发送弹幕..." maxlength="100">
                <button id="sendDanmakuBtn">发送</button>
                <button id="colorPickerBtn" title="选择颜色">🎨</button>
            </div>
        `;

        this.container.appendChild(this.danmakuContainer);

        // 绑定事件
        this.bindEvents();
        
        // 添加样式
        this.injectStyles();
    }

    injectStyles() {
        if (document.getElementById('danmaku-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'danmaku-styles';
        styles.textContent = `
            .danmaku-container {
                position: relative;
                width: 100%;
                height: 300px;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border-radius: 12px;
                overflow: hidden;
            }

            .danmaku-layer {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 50px;
                overflow: hidden;
                pointer-events: none;
            }

            .danmaku-item {
                position: absolute;
                white-space: nowrap;
                font-size: 16px;
                font-weight: 500;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
                pointer-events: auto;
                cursor: pointer;
                transition: transform 0.1s linear;
                z-index: 100;
            }

            .danmaku-item:hover {
                transform: scale(1.1);
                z-index: 101;
            }

            .danmaku-item.top,
            .danmaku-item.bottom {
                left: 50%;
                transform: translateX(-50%);
                animation: fadeInOut 4s ease-in-out forwards;
            }

            @keyframes scrollLeft {
                from { transform: translateX(100vw); }
                to { transform: translateX(-100%); }
            }

            @keyframes fadeInOut {
                0%, 100% { opacity: 0; }
                10%, 90% { opacity: 1; }
            }

            .danmaku-controls {
                position: absolute;
                top: 10px;
                right: 10px;
                display: flex;
                gap: 10px;
                align-items: center;
                z-index: 200;
            }

            .danmaku-controls button {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .danmaku-controls button:hover {
                background: rgba(255,255,255,0.3);
                transform: scale(1.1);
            }

            .online-count {
                color: rgba(255,255,255,0.8);
                font-size: 0.85em;
                background: rgba(0,0,0,0.3);
                padding: 5px 12px;
                border-radius: 15px;
            }

            .danmaku-input-wrapper {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                display: flex;
                padding: 10px;
                background: rgba(0,0,0,0.5);
                gap: 10px;
            }

            .danmaku-input-wrapper input {
                flex: 1;
                padding: 10px 15px;
                border: none;
                border-radius: 20px;
                background: rgba(255,255,255,0.9);
                font-size: 0.95em;
            }

            .danmaku-input-wrapper button {
                padding: 10px 20px;
                border: none;
                border-radius: 20px;
                cursor: pointer;
                transition: all 0.3s;
            }

            #sendDanmakuBtn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            #colorPickerBtn {
                background: rgba(255,255,255,0.2);
                font-size: 1.2em;
            }

            .danmaku-settings-panel {
                position: absolute;
                top: 50px;
                right: 10px;
                background: white;
                border-radius: 12px;
                padding: 20px;
                width: 250px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                z-index: 300;
                display: none;
            }

            .danmaku-settings-panel.show {
                display: block;
            }

            .setting-item {
                margin-bottom: 15px;
            }

            .setting-item label {
                display: block;
                margin-bottom: 5px;
                font-size: 0.9em;
                color: #666;
            }

            .setting-item input[type="range"] {
                width: 100%;
            }
        `;

        document.head.appendChild(styles);
    }

    connectWebSocket() {
        const wsUrl = `wss://${window.location.host}/ws/danmaku`;
        
        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('弹幕WebSocket连接成功');
                this.isConnected = true;
                
                // 加入房间
                this.send({
                    type: 'join',
                    roomId: this.roomId
                });

                // 获取历史弹幕
                this.send({
                    type: 'get_history',
                    roomId: this.roomId
                });
            };

            this.ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            };

            this.ws.onclose = () => {
                console.log('弹幕WebSocket连接关闭');
                this.isConnected = false;
                // 3秒后重连
                setTimeout(() => this.connectWebSocket(), 3000);
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket错误:', error);
            };
        } catch (error) {
            console.error('连接WebSocket失败:', error);
        }
    }

    handleMessage(message) {
        switch (message.type) {
            case 'connected':
                console.log('已连接到弹幕服务器');
                break;
            case 'joined':
                this.updateOnlineCount(message.onlineCount);
                break;
            case 'danmaku':
                this.addDanmaku(message.data);
                break;
            case 'history':
                message.data.forEach(d => this.addDanmaku(d));
                break;
            case 'user_joined':
            case 'user_left':
                this.updateOnlineCount(message.onlineCount);
                break;
            case 'error':
                console.error('弹幕错误:', message.message);
                break;
        }
    }

    bindEvents() {
        // 发送弹幕
        const sendBtn = document.getElementById('sendDanmakuBtn');
        const input = document.getElementById('danmakuInput');

        if (sendBtn && input) {
            sendBtn.addEventListener('click', () => this.sendDanmaku());
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendDanmaku();
            });
        }

        // 显示/隐藏切换
        const toggleBtn = this.danmakuContainer.querySelector('.danmaku-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleDanmaku());
        }

        // 设置面板
        const settingsBtn = this.danmakuContainer.querySelector('.danmaku-settings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.toggleSettings());
        }
    }

    sendDanmaku() {
        const input = document.getElementById('danmakuInput');
        const content = input?.value.trim();

        if (!content) return;
        if (!this.isConnected) {
            alert('弹幕服务器未连接');
            return;
        }

        // 获取用户信息
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        this.send({
            type: 'danmaku',
            roomId: this.roomId,
            data: {
                content,
                author: user.username || '匿名用户',
                authorId: user.id,
                avatar: user.avatar,
                color: this.userSettings.color || '#ffffff',
                type: 'scroll'
            }
        });

        input.value = '';
    }

    addDanmaku(danmaku) {
        if (!this.userSettings.showDanmaku) return;
        if (this.danmakuList.length >= this.options.maxDanmaku) {
            this.removeOldestDanmaku();
        }

        const el = document.createElement('div');
        el.className = 'danmaku-item';
        el.textContent = danmaku.content;
        el.style.color = danmaku.color || '#ffffff';
        el.style.opacity = this.userSettings.opacity;

        // 根据类型设置位置和动画
        if (danmaku.type === 'scroll') {
            const track = this.getAvailableTrack();
            el.style.top = `${track * this.options.trackHeight}px`;
            el.style.left = '100%';
            
            // 计算速度
            const speed = (11 - this.userSettings.speed) * 2 + 3;
            el.style.animation = `scrollLeft ${speed}s linear forwards`;
            
            // 更新轨道状态
            this.trackStatus[track] = Date.now() + speed * 1000;
        } else if (danmaku.type === 'top') {
            el.classList.add('top');
            el.style.top = '20px';
        } else if (danmaku.type === 'bottom') {
            el.classList.add('bottom');
            el.style.bottom = '70px';
        }

        document.getElementById('danmakuLayer')?.appendChild(el);
        
        this.danmakuList.push({
            el,
            data: danmaku,
            createdAt: Date.now()
        });

        // 动画结束后移除
        el.addEventListener('animationend', () => {
            this.removeDanmaku(el);
        });
    }

    getAvailableTrack() {
        const now = Date.now();
        // 找到最早可用的轨道
        let bestTrack = 0;
        let earliestTime = Infinity;

        for (let i = 0; i < this.trackStatus.length; i++) {
            if (this.trackStatus[i] < now) {
                return i;
            }
            if (this.trackStatus[i] < earliestTime) {
                earliestTime = this.trackStatus[i];
                bestTrack = i;
            }
        }

        return bestTrack;
    }

    removeDanmaku(el) {
        el.remove();
        this.danmakuList = this.danmakuList.filter(d => d.el !== el);
    }

    removeOldestDanmaku() {
        if (this.danmakuList.length === 0) return;
        const oldest = this.danmakuList.shift();
        oldest.el.remove();
    }

    toggleDanmaku() {
        this.userSettings.showDanmaku = !this.userSettings.showDanmaku;
        const layer = document.getElementById('danmakuLayer');
        if (layer) {
            layer.style.display = this.userSettings.showDanmaku ? 'block' : 'none';
        }
        this.saveUserSettings();
    }

    toggleSettings() {
        let panel = document.querySelector('.danmaku-settings-panel');
        
        if (!panel) {
            panel = document.createElement('div');
            panel.className = 'danmaku-settings-panel';
            panel.innerHTML = `
                <h4>弹幕设置</h4>
                <div class="setting-item">
                    <label>透明度: <span id="opacityValue">80</span>%</label>
                    <input type="range" id="opacitySlider" min="20" max="100" value="80">
                </div>
                <div class="setting-item">
                    <label>速度: <span id="speedValue">5</span></label>
                    <input type="range" id="speedSlider" min="1" max="10" value="5">
                </div>
            `;
            this.danmakuContainer.appendChild(panel);

            // 绑定设置事件
            panel.querySelector('#opacitySlider').addEventListener('input', (e) => {
                this.userSettings.opacity = e.target.value / 100;
                document.getElementById('opacityValue').textContent = e.target.value;
                this.saveUserSettings();
            });

            panel.querySelector('#speedSlider').addEventListener('input', (e) => {
                this.userSettings.speed = parseInt(e.target.value);
                document.getElementById('speedValue').textContent = e.target.value;
                this.saveUserSettings();
            });
        }

        panel.classList.toggle('show');
    }

    updateOnlineCount(count) {
        const el = document.getElementById('onlineCount');
        if (el) el.textContent = count;
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    saveUserSettings() {
        localStorage.setItem('danmakuSettings', JSON.stringify(this.userSettings));
    }

    loadUserSettings() {
        const saved = localStorage.getItem('danmakuSettings');
        if (saved) {
            this.userSettings = { ...this.userSettings, ...JSON.parse(saved) };
        }
    }

    destroy() {
        if (this.ws) {
            this.ws.close();
        }
        this.danmakuList.forEach(d => d.el.remove());
        this.danmakuList = [];
        this.danmakuContainer?.remove();
    }
}

// 导出
window.DanmakuSystem = DanmakuSystem;
export default DanmakuSystem;
