/**
 * 微信网站应用登录组件（内嵌二维码）
 * 使用微信官方 wxLogin.js
 * 文档：https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html
 */

class WechatWebLogin {
    constructor(options = {}) {
        // 微信开放平台网站应用配置
        this.appId = options.appId || '';
        this.scope = options.scope || 'snsapi_login';
        this.redirectUri = options.redirectUri || 'https://mcock.cn/auth/wechat/callback';
        this.state = options.state || this.generateState();
        this.style = options.style || 'black'; // 'black' 或 'white'
        this.href = options.href || '';
        this.selfRedirect = options.selfRedirect !== undefined ? options.selfRedirect : true;
        
        this.onSuccess = options.onSuccess || (() => {});
        this.onError = options.onError || (() => {});
        this.onReady = options.onReady || (() => {});
        this.onQRcodeReady = options.onQRcodeReady || (() => {});
        
        this.modal = null;
        this.checkInterval = null;
    }

    /**
     * 生成随机 state
     */
    generateState() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    /**
     * 打开登录弹窗
     */
    openModal() {
        if (!this.appId) {
            this.onError(new Error('请配置微信开放平台 AppID'));
            return;
        }

        this.createModal();
        this.loadWxLoginScript();
    }

    /**
     * 创建弹窗
     */
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'wechat-web-login-modal';
        modal.innerHTML = `
            <div class="wechat-web-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.6);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <div class="wechat-web-container" style="
                    background: #fff;
                    border-radius: 16px;
                    padding: 32px;
                    text-align: center;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    animation: webSlideIn 0.3s ease;
                ">
                    <div class="wechat-web-header" style="margin-bottom: 20px;">
                        <div style="
                            width: 48px;
                            height: 48px;
                            background: #07C160;
                            border-radius: 12px;
                            margin: 0 auto 12px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">
                            <svg viewBox="0 0 24 24" width="28" height="28">
                                <path fill="#fff" d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
                            </svg>
                        </div>
                        <h3 style="margin: 0; color: #333; font-size: 20px; font-weight: 600;">微信登录</h3>
                        <p style="margin: 8px 0 0; color: #999; font-size: 14px;">请使用微信扫一扫登录</p>
                    </div>
                    
                    <div id="wechat-login-qr-container" style="
                        margin: 20px auto;
                        min-height: 280px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        <div style="color: #999;">正在加载二维码...</div>
                    </div>
                    
                    <div class="wechat-web-footer" style="margin-top: 20px;">
                        <button id="close-web-login-modal" style="
                            padding: 10px 32px;
                            border: 1px solid #ddd;
                            background: #fff;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                            color: #666;
                            transition: all 0.2s;
                        ">取消</button>
                    </div>
                </div>
            </div>
            <style>
                @keyframes webSlideIn {
                    from { opacity: 0; transform: translateY(-20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                #close-web-login-modal:hover {
                    border-color: #999;
                    background: #f5f5f5;
                }
                /* 微信登录二维码容器样式优化 */
                #wechat-login-qr-container iframe {
                    border: none !important;
                    width: 300px !important;
                    height: 280px !important;
                }
            </style>
        `;

        document.body.appendChild(modal);
        this.modal = modal;

        // 绑定关闭事件
        modal.querySelector('#close-web-login-modal').addEventListener('click', () => {
            this.closeModal();
        });

        modal.querySelector('.wechat-web-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeModal();
            }
        });
    }

    /**
     * 加载微信登录脚本
     */
    loadWxLoginScript() {
        // 如果已经加载过，直接初始化
        if (typeof WxLogin !== 'undefined') {
            this.initWxLogin();
            return;
        }

        // 动态加载微信登录脚本
        const script = document.createElement('script');
        script.src = 'https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js';
        script.onload = () => {
            this.initWxLogin();
        };
        script.onerror = () => {
            const container = document.getElementById('wechat-login-qr-container');
            if (container) {
                container.innerHTML = '<div style="color: #f56c6c;">加载失败，请刷新页面重试</div>';
            }
            this.onError(new Error('加载微信登录脚本失败'));
        };
        document.head.appendChild(script);
    }

    /**
     * 初始化微信登录
     */
    initWxLogin() {
        const container = document.getElementById('wechat-login-qr-container');
        if (!container) return;

        // 清空容器
        container.innerHTML = '';

        try {
            // 使用微信官方 WxLogin
            new WxLogin({
                self_redirect: this.selfRedirect,
                id: 'wechat-login-qr-container',
                appid: this.appId,
                scope: this.scope,
                redirect_uri: encodeURIComponent(this.redirectUri),
                state: this.state,
                style: this.style,
                href: this.href,
                onReady: (isReady) => {
                    this.onReady(isReady);
                },
                onQRcodeReady: () => {
                    this.onQRcodeReady();
                }
            });

            // 开始监听登录状态
            this.startLoginCheck();

        } catch (error) {
            console.error('初始化微信登录失败:', error);
            container.innerHTML = '<div style="color: #f56c6c;">初始化失败，请刷新页面重试</div>';
            this.onError(error);
        }
    }

    /**
     * 开始监听登录状态
     * 通过检查 URL 参数变化来判断登录是否成功
     */
    startLoginCheck() {
        // 如果设置了 self_redirect: false，登录成功后会跳转到 redirect_uri
        // 如果设置了 self_redirect: true，登录成功后在 iframe 内跳转
        
        if (this.selfRedirect) {
            // 在 iframe 内跳转的情况，需要轮询检查
            this.checkInterval = setInterval(() => {
                this.checkLoginStatus();
            }, 2000);
        } else {
            // 在父页面跳转的情况，监听当前页面 URL 变化
            this.monitorUrlChange();
        }
    }

    /**
     * 检查登录状态
     */
    checkLoginStatus() {
        // 这里可以通过后端 API 检查登录状态
        // 或者检查 localStorage/cookie 中是否有登录信息
        const token = localStorage.getItem('token');
        if (token) {
            this.closeModal();
            this.onSuccess({ token });
        }
    }

    /**
     * 监听 URL 变化（用于 self_redirect: false）
     */
    monitorUrlChange() {
        // 检查当前 URL 是否有 code 参数（微信登录回调）
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');

        if (code && state) {
            // 有 code，说明是登录回调
            this.handleCallback(code, state);
        }
    }

    /**
     * 处理登录回调
     */
    async handleCallback(code, state) {
        try {
            // 调用后端 API 交换 access_token 和用户信息
            const response = await fetch(`${this.getApiBaseUrl()}/wechat/callback?code=${code}&state=${state}`);
            const data = await response.json();

            if (data.success && data.data) {
                // 保存登录信息
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                
                this.onSuccess(data.data);
                
                // 清理 URL 中的 code 和 state
                const cleanUrl = window.location.pathname + window.location.hash;
                window.history.replaceState({}, document.title, cleanUrl);
            } else {
                throw new Error(data.message || '登录失败');
            }
        } catch (error) {
            console.error('微信登录回调处理失败:', error);
            this.onError(error);
        }
    }

    /**
     * 获取 API 基础 URL
     */
    getApiBaseUrl() {
        return window.API_BASE_URL || 'https://1321178544-65fvlfs2za.ap-beijing.tencentscf.com';
    }

    /**
     * 关闭弹窗
     */
    closeModal() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }

        if (this.modal) {
            this.modal.style.opacity = '0';
            this.modal.style.transition = 'opacity 0.2s';
            setTimeout(() => {
                if (this.modal) {
                    this.modal.remove();
                    this.modal = null;
                }
            }, 200);
        }
    }

    /**
     * 检查是否已登录（页面加载时调用）
     */
    checkCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');

        if (code && state) {
            this.handleCallback(code, state);
            return true;
        }
        return false;
    }
}

// 导出组件
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WechatWebLogin;
}
