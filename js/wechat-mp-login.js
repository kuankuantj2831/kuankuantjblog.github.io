/**
 * 微信公众号登录组件（个人订阅号方案）
 * 流程：扫码关注 → 回复"登录" → 点击链接登录
 */

class WechatMPLogin {
    constructor(options = {}) {
        this.apiBaseUrl = options.apiBaseUrl || 'https://1321178544-65fvlfs2za.ap-beijing.tencentscf.com';
        this.redirectUrl = options.redirectUrl || window.location.pathname;
        this.onSuccess = options.onSuccess || (() => {});
        this.onError = options.onError || (() => {});
        this.pollingInterval = null;
        this.loginToken = null;
    }

    /**
     * 打开登录弹窗
     */
    async openModal() {
        try {
            // 生成登录令牌
            const tokenData = await this.generateLoginToken();
            if (!tokenData || !tokenData.loginToken) {
                throw new Error('生成登录令牌失败');
            }

            this.loginToken = tokenData.loginToken;

            // 创建弹窗
            const modal = document.createElement('div');
            modal.id = 'wechat-mp-login-modal';
            modal.innerHTML = `
                <div class="wechat-mp-overlay" style="
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
                    <div class="wechat-mp-container" style="
                        background: #fff;
                        border-radius: 16px;
                        padding: 32px;
                        text-align: center;
                        max-width: 360px;
                        width: 90%;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                        animation: mpSlideIn 0.3s ease;
                    ">
                        <div class="wechat-mp-header" style="margin-bottom: 24px;">
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
                        </div>
                        
                        <div class="wechat-mp-steps" style="margin: 24px 0; text-align: left;">
                            <div class="step-item" style="display: flex; align-items: flex-start; margin-bottom: 16px;">
                                <div class="step-num" style="
                                    width: 24px;
                                    height: 24px;
                                    background: #07C160;
                                    color: #fff;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 12px;
                                    margin-right: 12px;
                                    flex-shrink: 0;
                                ">1</div>
                                <div class="step-content">
                                    <p style="margin: 0; color: #333; font-size: 14px; font-weight: 500;">扫码关注公众号</p>
                                    <p style="margin: 4px 0 0; color: #999; font-size: 12px;">微信扫一扫下方二维码</p>
                                </div>
                            </div>
                            
                            <div class="step-item" style="display: flex; align-items: flex-start; margin-bottom: 16px;">
                                <div class="step-num" style="
                                    width: 24px;
                                    height: 24px;
                                    background: #07C160;
                                    color: #fff;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 12px;
                                    margin-right: 12px;
                                    flex-shrink: 0;
                                ">2</div>
                                <div class="step-content">
                                    <p style="margin: 0; color: #333; font-size: 14px; font-weight: 500;">回复"登录"</p>
                                    <p style="margin: 4px 0 0; color: #999; font-size: 12px;">在公众号内发送"登录"二字</p>
                                </div>
                            </div>
                            
                            <div class="step-item" style="display: flex; align-items: flex-start;">
                                <div class="step-num" style="
                                    width: 24px;
                                    height: 24px;
                                    background: #07C160;
                                    color: #fff;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 12px;
                                    margin-right: 12px;
                                    flex-shrink: 0;
                                ">3</div>
                                <div class="step-content">
                                    <p style="margin: 0; color: #333; font-size: 14px; font-weight: 500;">点击链接完成登录</p>
                                    <p style="margin: 4px 0 0; color: #999; font-size: 12px;">在回复的消息中点击登录链接</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="wechat-mp-qr" style="
                            margin: 20px 0;
                            padding: 16px;
                            background: #f5f5f5;
                            border-radius: 12px;
                        ">
                            <img 
                                src="https://open.weixin.qq.com/qr/code?username=gh_f5b81dea4475" 
                                alt="公众号二维码"
                                style="
                                    width: 180px;
                                    height: 180px;
                                    display: block;
                                    margin: 0 auto;
                                    border-radius: 8px;
                                "
                                onerror="this.parentElement.innerHTML='<div style=\'padding:60px;color:#999;\'>公众号二维码<br>Hakimi的猫爬架</div>'"
                            >
                            <p style="margin: 12px 0 0; color: #666; font-size: 14px;">Hakimi的猫爬架</p>
                        </div>
                        
                        <div id="mp-login-status" style="
                            margin: 16px 0;
                            padding: 12px 16px;
                            background: #f0f9ff;
                            border-radius: 8px;
                            font-size: 13px;
                            color: #1890ff;
                        ">
                            <span class="status-dot" style="
                                display: inline-block;
                                width: 8px;
                                height: 8px;
                                background: #1890ff;
                                border-radius: 50%;
                                margin-right: 6px;
                                animation: mpPulse 1.5s infinite;
                            "></span>
                            等待登录...（请在公众号内回复"登录"）
                        </div>
                        
                        <div class="wechat-mp-footer" style="margin-top: 20px;">
                            <button id="close-mp-modal" style="
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
                    @keyframes mpSlideIn {
                        from { opacity: 0; transform: translateY(-20px) scale(0.95); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    @keyframes mpPulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.5; }
                    }
                    #close-mp-modal:hover {
                        border-color: #999;
                        background: #f5f5f5;
                    }
                </style>
            `;

            document.body.appendChild(modal);

            // 绑定关闭事件
            modal.querySelector('#close-mp-modal').addEventListener('click', () => {
                this.closeModal();
            });

            modal.querySelector('.wechat-mp-overlay').addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    this.closeModal();
                }
            });

            // 开始轮询检查登录状态
            this.startPolling();

        } catch (error) {
            console.error('打开登录弹窗失败:', error);
            this.onError(error);
        }
    }

    /**
     * 生成登录令牌
     */
    async generateLoginToken() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/wechat-mp/login-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    redirectUrl: this.redirectUrl
                })
            });

            const data = await response.json();
            
            if (data.success && data.data) {
                return data.data;
            }
            
            throw new Error(data.message || '生成登录令牌失败');
        } catch (error) {
            console.error('生成登录令牌失败:', error);
            throw error;
        }
    }

    /**
     * 开始轮询检查登录状态
     */
    startPolling() {
        // 每3秒检查一次
        this.pollingInterval = setInterval(async () => {
            try {
                const status = await this.checkLoginStatus();
                
                if (status.loggedIn) {
                    // 登录成功
                    this.stopPolling();
                    this.closeModal();
                    
                    // 保存登录信息
                    localStorage.setItem('token', status.token);
                    localStorage.setItem('user', JSON.stringify(status.user));
                    
                    this.onSuccess({
                        token: status.token,
                        user: status.user
                    });
                } else {
                    // 更新状态显示
                    this.updateStatus(status.message || '等待登录...');
                }
            } catch (error) {
                console.error('检查登录状态失败:', error);
            }
        }, 3000);

        // 5分钟后自动停止轮询
        setTimeout(() => {
            this.stopPolling();
            this.updateStatus('登录超时，请刷新页面重试');
        }, 5 * 60 * 1000);
    }

    /**
     * 停止轮询
     */
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    /**
     * 检查登录状态
     */
    async checkLoginStatus() {
        const response = await fetch(`${this.apiBaseUrl}/wechat-mp/login-status?token=${this.loginToken}`);
        const data = await response.json();
        
        if (data.success && data.data) {
            return data.data;
        }
        
        throw new Error(data.message || '检查登录状态失败');
    }

    /**
     * 更新状态显示
     */
    updateStatus(message) {
        const statusEl = document.getElementById('mp-login-status');
        if (statusEl) {
            const dot = statusEl.querySelector('.status-dot');
            statusEl.innerHTML = '';
            if (dot) statusEl.appendChild(dot);
            statusEl.appendChild(document.createTextNode(message));
        }
    }

    /**
     * 关闭弹窗
     */
    closeModal() {
        this.stopPolling();
        const modal = document.getElementById('wechat-mp-login-modal');
        if (modal) {
            modal.style.opacity = '0';
            modal.style.transition = 'opacity 0.2s';
            setTimeout(() => modal.remove(), 200);
        }
    }
}

// 导出组件
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WechatMPLogin;
}
