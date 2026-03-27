/**
 * 文章分享增强 - Article Share Enhancement
 * 多平台分享功能，支持复制链接、二维码等
 */

class ArticleShare {
    constructor(options = {}) {
        this.options = {
            platforms: ['weixin', 'weibo', 'twitter', 'facebook', 'linkedin', 'copy'],
            showQRCode: true,
            showStats: true,
            position: 'floating',
            ...options
        };
        
        this.shareCount = 0;
        this.init();
    }
    
    init() {
        this.createShareUI();
        this.bindEvents();
        this.injectStyles();
        console.log('[文章分享] 系统已初始化');
    }
    
    createShareUI() {
        const container = document.createElement('div');
        container.className = 'article-share-container';
        container.innerHTML = `
            <div class="share-trigger">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
                <span>分享</span>
            </div>
            <div class="share-panel">
                <div class="share-header">
                    <span>分享到</span>
                    <button class="share-close">×</button>
                </div>
                <div class="share-platforms">
                    ${this.options.platforms.includes('weixin') ? `
                    <button class="share-btn weixin" data-platform="weixin" title="微信">
                        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.007-.27-.022-.407-.032zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/></svg>
                        <span>微信</span>
                    </button>
                    ` : ''}
                    ${this.options.platforms.includes('weibo') ? `
                    <button class="share-btn weibo" data-platform="weibo" title="微博">
                        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.737 5.439l-.002.004zM9.05 17.219c-.384.616-1.208.884-1.829.602-.612-.279-.793-.991-.406-1.593.379-.595 1.176-.861 1.793-.601.622.263.82.972.442 1.592zm1.27-1.627c-.141.237-.449.353-.689.253-.236-.09-.313-.361-.177-.586.138-.227.436-.346.672-.24.239.09.315.36.18.573h.014zm.176-2.719c-1.893-.493-4.033.45-4.857 2.118-.836 1.704-.026 3.591 1.886 4.21 1.983.64 4.318-.341 5.132-2.179.8-1.793-.201-3.642-2.161-4.149zm7.563-1.224c-.346-.105-.578-.172-.4-.621.386-.998.428-1.86.003-2.474-.793-1.158-2.96-1.097-5.454-.031 0 0-.781.343-.581-.277.381-1.236.324-2.272-.27-2.87-1.348-1.354-4.929.049-7.998 3.138C1.552 10.678 0 13.025 0 15.05c0 3.874 4.98 6.229 9.854 6.229 6.395 0 10.646-3.709 10.646-6.655 0-1.783-1.506-2.793-2.441-3.025zm-.684-5.737c-.597-.649-1.485-.935-2.357-.843l.021-.001c-.309.033-.518.318-.484.629.033.309.317.518.629.484h-.001c.524-.055 1.057.13 1.421.521.362.391.488.924.353 1.429l-.001-.001c-.088.301.087.616.389.706.302.089.616-.086.706-.388.233-.812.033-1.678-.476-2.332v-.204zm2.339-2.052c-1.244-1.349-3.082-1.946-4.889-1.754-.312.035-.536.322-.5.634.035.312.321.535.633.5 1.422-.156 2.904.31 3.91 1.401 1.007 1.092 1.311 2.617.893 4.026l.001-.001c-.091.301.08.617.381.708.302.09.617-.079.708-.381.549-1.793.155-3.764-1.137-5.133z"/></svg>
                        <span>微博</span>
                    </button>
                    ` : ''}
                    ${this.options.platforms.includes('twitter') ? `
                    <button class="share-btn twitter" data-platform="twitter" title="Twitter">
                        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                        <span>Twitter</span>
                    </button>
                    ` : ''}
                    <button class="share-btn copy" data-platform="copy" title="复制链接">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        <span>复制链接</span>
                    </button>
                </div>
                ${this.options.showQRCode ? `
                <div class="share-qrcode">
                    <div class="qrcode-container" id="share-qrcode"></div>
                    <p>微信扫一扫分享</p>
                </div>
                ` : ''}
            </div>
        `;
        
        document.body.appendChild(container);
        
        // 绑定事件
        const trigger = container.querySelector('.share-trigger');
        const panel = container.querySelector('.share-panel');
        const closeBtn = container.querySelector('.share-close');
        
        trigger.addEventListener('click', () => {
            panel.classList.toggle('active');
            if (panel.classList.contains('active') && this.options.showQRCode) {
                this.generateQRCode();
            }
        });
        
        closeBtn.addEventListener('click', () => {
            panel.classList.remove('active');
        });
        
        // 平台分享按钮
        container.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const platform = btn.dataset.platform;
                this.share(platform);
            });
        });
    }
    
    share(platform) {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(document.title);
        
        const shareUrls = {
            weibo: `https://service.weibo.com/share/share.php?url=${url}&title=${title}`,
            twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
        };
        
        if (platform === 'copy') {
            navigator.clipboard.writeText(window.location.href).then(() => {
                this.showToast('链接已复制到剪贴板');
            });
        } else if (platform === 'weixin') {
            this.showToast('请使用微信扫一扫分享');
        } else if (shareUrls[platform]) {
            window.open(shareUrls[platform], '_blank', 'width=600,height=400');
        }
        
        this.recordShare();
    }
    
    generateQRCode() {
        const container = document.getElementById('share-qrcode');
        if (!container || typeof QRCode === 'undefined') return;
        
        container.innerHTML = '';
        new QRCode(container, {
            text: window.location.href,
            width: 128,
            height: 128,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });
    }
    
    recordShare() {
        this.shareCount++;
        localStorage.setItem('article_share_count', this.shareCount);
    }
    
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'share-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: #333;
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            z-index: 10000;
            animation: shareToastIn 0.3s ease;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }
    
    injectStyles() {
        if (document.getElementById('article-share-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'article-share-styles';
        style.textContent = `
            .article-share-container {
                position: fixed;
                right: 20px;
                bottom: 220px;
                z-index: 100;
            }
            
            .share-trigger {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 12px 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 25px;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                transition: all 0.3s;
                font-size: 14px;
                font-weight: 500;
            }
            
            .share-trigger:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
            }
            
            .share-panel {
                position: absolute;
                bottom: 60px;
                right: 0;
                width: 280px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.15);
                padding: 20px;
                opacity: 0;
                visibility: hidden;
                transform: translateY(10px);
                transition: all 0.3s ease;
            }
            
            .share-panel.active {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            
            .share-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
                font-weight: 600;
            }
            
            .share-close {
                background: none;
                border: none;
                font-size: 1.5em;
                cursor: pointer;
                color: #999;
            }
            
            .share-platforms {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 12px;
                margin-bottom: 16px;
            }
            
            .share-btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 6px;
                padding: 12px 8px;
                border: none;
                background: #f5f5f5;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 12px;
            }
            
            .share-btn:hover {
                transform: translateY(-2px);
            }
            
            .share-btn svg {
                width: 24px;
                height: 24px;
            }
            
            .share-btn.weixin {
                color: #07C160;
            }
            
            .share-btn.weibo {
                color: #E6162D;
            }
            
            .share-btn.twitter {
                color: #1DA1F2;
            }
            
            .share-qrcode {
                text-align: center;
                padding-top: 16px;
                border-top: 1px solid #eee;
            }
            
            .share-qrcode p {
                margin: 8px 0 0 0;
                font-size: 12px;
                color: #888;
            }
            
            @keyframes shareToastIn {
                from { opacity: 0; transform: translateX(-50%) translateY(20px); }
                to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.articleShare = new ArticleShare();
    });
} else {
    window.articleShare = new ArticleShare();
}

export default ArticleShare;
