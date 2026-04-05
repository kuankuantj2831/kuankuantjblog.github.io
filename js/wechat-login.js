/**
 * 微信登录组件
 * 支持：
 * - 微信扫码登录
 * - 公众号授权登录
 * - 账号绑定/解绑
 */

class WechatLogin {
    constructor(options = {}) {
        this.apiBaseUrl = options.apiBaseUrl || window.API_BASE_URL || '';
        this.redirectUrl = options.redirectUrl || window.location.pathname;
        this.onSuccess = options.onSuccess || (() => {});
        this.onError = options.onError || (() => {});
        
        // 检查是否从微信回调
        this.checkCallback();
    }

    /**
     * 获取微信登录二维码URL
     */
    async getLoginUrl() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/wechat/login-url?redirectUrl=${encodeURIComponent(this.redirectUrl)}`);
            const data = await response.json();
            
            if (data.success) {
                return data.data;
            }
            throw new Error(data.error || '获取登录链接失败');
        } catch (error) {
            console.error('Get WeChat Login URL Error:', error);
            this.onError(error);
            return null;
        }
    }

    /**
     * 打开微信登录弹窗
     */
    async openLoginPopup() {
        const loginData = await this.getLoginUrl();
        if (!loginData) return;

        // 创建弹窗
        const modal = document.createElement('div');
        modal.className = 'wechat-login-modal';
        modal.innerHTML = `
            <div class="wechat-login-overlay">
                <div class="wechat-login-container">
                    <div class="wechat-login-header">
                        <h3>微信登录</h3>
                        <button class="wechat-login-close">&times;</button>
                    </div>
                    <div class="wechat-login-body">
                        <div class="wechat-qrcode-wrapper">
                            <div class="wechat-qrcode" id="wechatQrCode"></div>
                            <p class="wechat-login-tip">请使用微信扫一扫登录</p>
                        </div>
                        <div class="wechat-login-options">
                            <button class="wechat-refresh-btn" style="display:none;">
                                <span>🔄</span> 刷新二维码
                            </button>
                        </div>
                    </div>
                    <div class="wechat-login-footer">
                        <p>登录即表示同意 <a href="/privacy.html" target="_blank">隐私政策</a></p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 添加样式
        this.injectStyles();

        // 生成二维码
        this.generateQRCode(loginData.loginUrl);

        // 绑定事件
        modal.querySelector('.wechat-login-close').addEventListener('click', () => {
            this.closeModal(modal);
        });

        modal.querySelector('.wechat-login-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeModal(modal);
            }
        });

        // 监听登录成功消息
        window.addEventListener('message', (e) => {
            if (e.data.type === 'WECHAT_LOGIN_SUCCESS') {
                this.closeModal(modal);
                this.handleLoginSuccess(e.data.token);
            }
        });

        // 二维码过期倒计时
        this.startExpiryCountdown(loginData.expiresIn, modal);
    }

    /**
     * 生成二维码
     */
    generateQRCode(url) {
        const container = document.getElementById('wechatQrCode');
        if (!container) return;

        // 使用QRCode.js或类似库
        if (window.QRCode) {
            new QRCode(container, {
                text: url,
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
        } else {
            // 备用：显示链接
            container.innerHTML = `<a href="${url}" target="_blank">点击使用微信登录</a>`;
        }
    }

    /**
     * 开始过期倒计时
     */
    startExpiryCountdown(seconds, modal) {
        let remaining = seconds;
        const refreshBtn = modal.querySelector('.wechat-refresh-btn');
        const tipEl = modal.querySelector('.wechat-login-tip');

        const timer = setInterval(() => {
            remaining--;
            if (remaining <= 0) {
                clearInterval(timer);
                tipEl.textContent = '二维码已过期，请点击刷新';
                tipEl.style.color = '#ff4d4f';
                refreshBtn.style.display = 'inline-flex';
                
                refreshBtn.onclick = () => {
                    this.refreshQRCode(modal);
                };
            } else if (remaining <= 30) {
                tipEl.textContent = `二维码即将过期 (${remaining}秒)`;
                tipEl.style.color = '#faad14';
            }
        }, 1000);

        // 保存timer以便清理
        modal.dataset.timer = timer;
    }

    /**
     * 刷新二维码
     */
    async refreshQRCode(modal) {
        const container = modal.querySelector('.wechat-qrcode');
        container.innerHTML = '';
        
        const loginData = await this.getLoginUrl();
        if (loginData) {
            this.generateQRCode(loginData.loginUrl);
            modal.querySelector('.wechat-login-tip').textContent = '请使用微信扫一扫登录';
            modal.querySelector('.wechat-login-tip').style.color = '';
            modal.querySelector('.wechat-refresh-btn').style.display = 'none';
            
            // 重启倒计时
            clearInterval(modal.dataset.timer);
            this.startExpiryCountdown(loginData.expiresIn, modal);
        }
    }

    /**
     * 关闭弹窗
     */
    closeModal(modal) {
        clearInterval(modal.dataset.timer);
        modal.remove();
    }

    /**
     * 处理登录成功
     */
    handleLoginSuccess(token) {
        // 存储token
        localStorage.setItem('auth_token', token);
        
        // 设置cookie
        document.cookie = `auth_token=${token}; path=/; max-age=${7*24*60*60}`;
        
        this.onSuccess(token);
        
        // 刷新页面或跳转
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || '/';
        window.location.href = redirect;
    }

    /**
     * 检查是否是微信回调
     */
    checkCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const login = urlParams.get('login');
        const token = urlParams.get('token');

        if (login === 'success' && token) {
            // 清理URL参数
            window.history.replaceState({}, document.title, window.location.pathname);
            this.handleLoginSuccess(token);
        }
    }

    /**
     * 微信公众号授权登录（在微信浏览器内）
     */
    async mpAuthLogin() {
        const isWechat = /MicroMessenger/i.test(navigator.userAgent);
        
        if (!isWechat) {
            // 非微信环境，使用扫码登录
            return this.openLoginPopup();
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/wechat/mp-auth-url?redirectUrl=${encodeURIComponent(this.redirectUrl)}`);
            const data = await response.json();
            
            if (data.success) {
                window.location.href = data.data.authUrl;
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('MP Auth Error:', error);
            this.onError(error);
        }
    }

    /**
     * 获取当前绑定的微信信息
     */
    async getBindings() {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${this.apiBaseUrl}/wechat/info`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            return data.success ? data.data.bindings : [];
        } catch (error) {
            console.error('Get Bindings Error:', error);
            return [];
        }
    }

    /**
     * 绑定微信账号
     */
    async bindWechat() {
        const loginData = await this.getLoginUrl();
        if (loginData) {
            // 在新窗口打开授权页面
            const popup = window.open(
                loginData.loginUrl,
                'wechat_bind',
                'width=600,height=600'
            );
            
            // 监听绑定结果
            window.addEventListener('message', (e) => {
                if (e.data.type === 'WECHAT_BIND_SUCCESS') {
                    popup.close();
                    alert('微信绑定成功！');
                    location.reload();
                }
            });
        }
    }

    /**
     * 解绑微信
     */
    async unbindWechat(bindId) {
        if (!confirm('确定要解绑该微信账号吗？')) return;
        
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${this.apiBaseUrl}/wechat/unbind/${bindId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            if (data.success) {
                alert('解绑成功！');
                location.reload();
            } else {
                alert(data.error || '解绑失败');
            }
        } catch (error) {
            console.error('Unbind Error:', error);
            alert('解绑失败，请重试');
        }
    }

    /**
     * 渲染微信登录按钮
     */
    renderButton(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const type = options.type || 'default'; // default, icon-only, bind
        
        let buttonHTML = '';
        if (type === 'icon-only') {
            buttonHTML = `
                <button class="wechat-login-btn-icon" title="微信登录">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path fill="#07C160" d="M8.5,14.5C8.5,14.5 8.5,14.5 8.5,14.5C8.5,14.5 8.5,14.5 8.5,14.5M16.5,14.5C16.5,14.5 16.5,14.5 16.5,14.5C16.5,14.5 16.5,14.5 16.5,14.5M12,2C6.5,2 2,6 2,10.5C2,13 3,15 5,16.5L4,20L8,17.5C9,17.8 10,18 12,18C17.5,18 22,14 22,10C22,6 17.5,2 12,2Z"/>
                    </svg>
                </button>
            `;
        } else if (type === 'bind') {
            buttonHTML = `
                <button class="wechat-bind-btn">
                    <span>🔗</span> 绑定微信
                </button>
            `;
        } else {
            buttonHTML = `
                <button class="wechat-login-btn">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path fill="currentColor" d="M8.5,14.5C8.5,14.5 8.5,14.5 8.5,14.5C8.5,14.5 8.5,14.5 8.5,14.5M16.5,14.5C16.5,14.5 16.5,14.5 16.5,14.5C16.5,14.5 16.5,14.5 16.5,14.5M12,2C6.5,2 2,6 2,10.5C2,13 3,15 5,16.5L4,20L8,17.5C9,17.8 10,18 12,18C17.5,18 22,14 22,10C22,6 17.5,2 12,2Z"/>
                    </svg>
                    微信登录
                </button>
            `;
        }

        container.innerHTML = buttonHTML;
        
        const btn = container.querySelector('button');
        btn.addEventListener('click', () => {
            if (type === 'bind') {
                this.bindWechat();
            } else {
                this.openLoginPopup();
            }
        });
    }

    /**
     * 注入样式
     */
    injectStyles() {
        if (document.getElementById('wechat-login-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'wechat-login-styles';
        styles.textContent = `
            .wechat-login-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
            }
            .wechat-login-overlay {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.6);
                backdrop-filter: blur(4px);
            }
            .wechat-login-container {
                background: #fff;
                border-radius: 16px;
                width: 360px;
                max-width: 90%;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                animation: wechatModalIn 0.3s ease;
            }
            @keyframes wechatModalIn {
                from { opacity: 0; transform: scale(0.9) translateY(20px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }
            .wechat-login-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 20px 24px;
                border-bottom: 1px solid #f0f0f0;
            }
            .wechat-login-header h3 {
                margin: 0;
                font-size: 18px;
                color: #333;
            }
            .wechat-login-close {
                background: none;
                border: none;
                font-size: 24px;
                color: #999;
                cursor: pointer;
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s;
            }
            .wechat-login-close:hover {
                background: #f5f5f5;
                color: #333;
            }
            .wechat-login-body {
                padding: 32px 24px;
                text-align: center;
            }
            .wechat-qrcode-wrapper {
                margin-bottom: 20px;
            }
            .wechat-qrcode {
                width: 200px;
                height: 200px;
                margin: 0 auto 16px;
                padding: 10px;
                border: 1px solid #e8e8e8;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .wechat-qrcode img {
                max-width: 100%;
                max-height: 100%;
            }
            .wechat-login-tip {
                color: #666;
                font-size: 14px;
                margin: 0;
            }
            .wechat-refresh-btn {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 8px 16px;
                background: #07C160;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s;
            }
            .wechat-refresh-btn:hover {
                background: #06a050;
            }
            .wechat-login-footer {
                padding: 16px 24px;
                background: #fafafa;
                border-top: 1px solid #f0f0f0;
                text-align: center;
            }
            .wechat-login-footer p {
                margin: 0;
                font-size: 12px;
                color: #999;
            }
            .wechat-login-footer a {
                color: #07C160;
                text-decoration: none;
            }
            .wechat-login-footer a:hover {
                text-decoration: underline;
            }
            
            /* 登录按钮样式 */
            .wechat-login-btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 12px 24px;
                background: #07C160;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .wechat-login-btn:hover {
                background: #06a050;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(7, 193, 96, 0.3);
            }
            .wechat-login-btn-icon {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background: #fff;
                border: 1px solid #e8e8e8;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            .wechat-login-btn-icon:hover {
                border-color: #07C160;
                background: #f0faf0;
            }
            .wechat-bind-btn {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 8px 16px;
                background: #f0f0f0;
                color: #666;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
            }
            .wechat-bind-btn:hover {
                background: #e8e8e8;
            }
        `;
        document.head.appendChild(styles);
    }
}

// 导出
window.WechatLogin = WechatLogin;
