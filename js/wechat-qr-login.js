/**
 * 微信公众号扫码登录组件（关注即登录）
 * 使用带参数二维码实现
 */

class WechatQRLogin {
    constructor(options = {}) {
        this.apiBaseUrl = options.apiBaseUrl || 'https://1321178544-65fvlfs2za.ap-beijing.tencentscf.com';
        this.redirectUrl = options.redirectUrl || window.location.pathname;
        this.onSuccess = options.onSuccess || (() => {});
        this.onError = options.onError || (() => {});
        this.pollingInterval = null;
        this.sceneId = null;
    }

    /**
     * 打开扫码登录弹窗
     */
    async openModal() {
        try {
            // 生成二维码
            const qrData = await this.generateQRCode();
            if (!qrData) {
                throw new Error('生成二维码失败');
            }

            this.sceneId = qrData.sceneId;

            // 创建弹窗
            const modal = document.createElement('div');
            modal.id = 'wechat-qr-login-modal';
            modal.innerHTML = `
                <div class="wechat-qr-overlay" style="
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
                    <div class="wechat-qr-container" style="
                        background: #fff;
                        border-radius: 16px;
                        padding: 32px;
                        text-align: center;
                        max-width: 320px;
                        width: 90%;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                        animation: qrSlideIn 0.3s ease;
                    ">
                        <div class="wechat-qr-header" style="margin-bottom: 20px;">
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
                            <h3 style="margin: 0; color: #333; font-size: 20px; font-weight: 600;">微信扫码登录</h3>
                        </div>
                        
                        <div class="wechat-qr-content" style="margin: 24px 0;">
                            <div class="qr-wrapper" style="
                                position: relative;
                                width: 200px;
                                height: 200px;
                                margin: 0 auto;
                                background: #f5f5f5;
                                border-radius: 8px;
                                overflow: hidden;
                            ">
                                <img id="wechat-qr-image" src="${qrData.qrImageUrl}" alt="微信登录二维码" style="
                                    width: 100%;
                                    height: 100%;
                                    object-fit: contain;
                                ">
                                <div id="qr-loading" style="
                                    position: absolute;
                                    top: 0;
                                    left: 0;
                                    right: 0;
                                    bottom: 0;
                                    background: #f5f5f5;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 14px;
                                    color: #999;
                                ">加载中...</div>
                            </div>
                            
                            <p class="qr-tip" style="
                                margin: 16px 0 8px;
                                color: #666;
                                font-size: 14px;
                                line-height: 1.6;
                            ">
                                请使用微信扫一扫<br>关注公众号即可自动登录
                            </p>
                            
                            <div id="qr-status" style="
                                margin-top: 12px;
                                padding: 8px 16px;
                                background: #f0f9ff;
                                border-radius: 20px;
                                font-size: 13px;
                                color: #1890ff;
                                display: inline-block;
                            ">
                                <span class="status-dot" style="
                                    display: inline-block;
                                    width: 8px;
                                    height: 8px;
                                    background: #1890ff;
                                    border-radius: 50%;
                                    margin-right: 6px;
                                    animation: pulse 1.5s infinite;
                                "></span>
                                等待扫码...
                            </div>
                        </div>
                        
                        <div class="wechat-qr-footer" style="
                            margin-top: 20px;
                            padding-top: 20px;
                            border-top: 1px solid #eee;
                        ">
                            <p style="margin: 0 0 12px; color: #999; font-size: 12px;">
                                关注「<strong>Hakimi的猫爬架</strong>」公众号
                            </p>
                            <button id="close-qr-modal" style="
                                padding: 10px 32px;
                                border: 1px solid #ddd;
                                background: #fff;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 14px;
                                color: #666;
                                transition: all 0.2s;
                            ">取消登录</button>
                        </div>
                    </div>
                </div>
                <style>
                    @keyframes qrSlideIn {
                        from { opacity: 0; transform: translateY(-20px) scale(0.95); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.5; }
                    }
                    #close-qr-modal:hover {
                        border-color: #999;
                        background: #f5f5f5;
                    }
                    #wechat-qr-image {
                        opacity: 0;
                        transition: opacity 0.3s;
                    }
                    #wechat-qr-image.loaded {
                        opacity: 1;
                    }
                    #wechat-qr-image.loaded + #qr-loading {
                        display: none;
                    }
                </style>
            `;

            document.body.appendChild(modal);

            // 图片加载完成隐藏loading
            const qrImage = modal.querySelector('#wechat-qr-image');
            qrImage.onload = () => qrImage.classList.add('loaded');
            qrImage.onerror = () => {
                qrImage.parentElement.innerHTML = '<div style="padding: 40px; color: #999;">二维码加载失败<br>请刷新重试</div>';
            };

            // 绑定关闭事件
            modal.querySelector('#close-qr-modal').addEventListener('click', () => {
                this.closeModal();
            });

            modal.querySelector('.wechat-qr-overlay').addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    this.closeModal();
                }
            });

            // 开始轮询登录状态
            this.startPolling();

        } catch (error) {
            console.error('Open QR Modal Error:', error);
            this.onError(error);
            alert('打开微信登录失败: ' + error.message);
        }
    }

    /**
     * 生成二维码
     */
    async generateQRCode() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/wechat-qr/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ redirectUrl: this.redirectUrl })
            });

            const data = await response.json();
            
            if (data.success) {
                return data.data;
            }
            throw new Error(data.error);
        } catch (error) {
            console.error('Generate QR Error:', error);
            return null;
        }
    }

    /**
     * 开始轮询登录状态
     */
    startPolling() {
        let attempts = 0;
        const maxAttempts = 60; // 5分钟 (5秒 * 60)

        this.pollingInterval = setInterval(async () => {
            attempts++;
            
            if (attempts > maxAttempts) {
                this.stopPolling();
                this.updateStatus('expired', '二维码已过期，请刷新重试');
                return;
            }

            try {
                const status = await this.checkLoginStatus();
                
                if (status.success) {
                    this.stopPolling();
                    this.handleLoginSuccess(status.data);
                } else if (status.error) {
                    this.stopPolling();
                    this.updateStatus('error', status.error);
                }
                // 否则继续轮询

            } catch (error) {
                console.error('Polling Error:', error);
            }
        }, 3000); // 每3秒检查一次
    }

    /**
     * 检查登录状态
     */
    async checkLoginStatus() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/wechat-qr/status/${this.sceneId}`);
            return await response.json();
        } catch (error) {
            return { success: false, error: '检查状态失败' };
        }
    }

    /**
     * 处理登录成功
     */
    handleLoginSuccess(data) {
        // 保存用户信息
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // 显示成功提示
        this.updateStatus('success', '登录成功！正在跳转...');

        // 关闭弹窗并回调
        setTimeout(() => {
            this.closeModal();
            this.onSuccess(data);
            
            // 刷新页面
            window.location.reload();
        }, 1000);
    }

    /**
     * 更新状态显示
     */
    updateStatus(type, message) {
        const statusEl = document.getElementById('qr-status');
        if (!statusEl) return;

        const styles = {
            pending: { bg: '#f0f9ff', color: '#1890ff', dot: '#1890ff' },
            scanned: { bg: '#fff7e6', color: '#fa8c16', dot: '#fa8c16' },
            success: { bg: '#f6ffed', color: '#52c41a', dot: '#52c41a' },
            expired: { bg: '#fff1f0', color: '#f5222d', dot: '#f5222d' },
            error: { bg: '#fff1f0', color: '#f5222d', dot: '#f5222d' }
        };

        const style = styles[type] || styles.pending;
        
        statusEl.style.background = style.bg;
        statusEl.style.color = style.color;
        statusEl.innerHTML = `
            <span class="status-dot" style="
                display: inline-block;
                width: 8px;
                height: 8px;
                background: ${style.dot};
                border-radius: 50%;
                margin-right: 6px;
                ${type === 'pending' ? 'animation: pulse 1.5s infinite;' : ''}
            "></span>
            ${message}
        `;
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
     * 关闭弹窗
     */
    closeModal() {
        this.stopPolling();
        const modal = document.getElementById('wechat-qr-login-modal');
        if (modal) {
            modal.remove();
        }
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WechatQRLogin;
}
