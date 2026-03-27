/**
 * 页面预加载器 - Page Preloader
 * 优雅的页面加载动画
 */

class PagePreloader {
    constructor(options = {}) {
        this.options = {
            minDuration: 800,
            fadeDuration: 500,
            showProgress: true,
            logo: '',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            ...options
        };
        
        this.preloader = null;
        this.startTime = Date.now();
        
        this.init();
    }
    
    init() {
        this.createPreloader();
        this.bindEvents();
        this.injectStyles();
        
        console.log('[页面预加载] 系统已初始化');
    }
    
    createPreloader() {
        this.preloader = document.createElement('div');
        this.preloader.id = 'page-preloader';
        this.preloader.innerHTML = `
            <div class="preloader-content">
                ${this.options.logo ? `<img src="${this.options.logo}" class="preloader-logo" alt="">` : ''}
                <div class="preloader-spinner">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                ${this.options.showProgress ? `
                <div class="preloader-progress">
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <span class="progress-text">0%</span>
                </div>
                ` : ''}
            </div>
        `;
        
        this.preloader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${this.options.background};
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            transition: opacity ${this.options.fadeDuration}ms ease;
        `;
        
        document.body.appendChild(this.preloader);
        
        // 模拟进度
        if (this.options.showProgress) {
            this.simulateProgress();
        }
    }
    
    simulateProgress() {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            this.updateProgress(progress);
            
            if (progress >= 90) clearInterval(interval);
        }, 200);
    }
    
    updateProgress(percentage) {
        const fill = this.preloader.querySelector('.progress-fill');
        const text = this.preloader.querySelector('.progress-text');
        
        if (fill) fill.style.width = percentage + '%';
        if (text) text.textContent = Math.round(percentage) + '%';
    }
    
    bindEvents() {
        window.addEventListener('load', () => {
            const elapsed = Date.now() - this.startTime;
            const remaining = Math.max(0, this.options.minDuration - elapsed);
            
            setTimeout(() => {
                this.hide();
            }, remaining);
        });
    }
    
    hide() {
        this.updateProgress(100);
        
        setTimeout(() => {
            this.preloader.style.opacity = '0';
            
            setTimeout(() => {
                this.preloader.remove();
                document.body.classList.add('page-loaded');
            }, this.options.fadeDuration);
        }, 300);
    }
    
    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #page-preloader {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }
            
            .preloader-content {
                text-align: center;
                color: white;
            }
            
            .preloader-logo {
                width: 80px;
                height: 80px;
                margin-bottom: 20px;
                animation: preloaderPulse 2s infinite;
            }
            
            .preloader-spinner {
                position: relative;
                width: 60px;
                height: 60px;
                margin: 0 auto 20px;
            }
            
            .spinner-ring {
                position: absolute;
                border: 3px solid transparent;
                border-top-color: rgba(255,255,255,0.8);
                border-radius: 50%;
                animation: preloaderSpin 1s linear infinite;
            }
            
            .spinner-ring:nth-child(1) {
                width: 60px;
                height: 60px;
                top: 0;
                left: 0;
            }
            
            .spinner-ring:nth-child(2) {
                width: 45px;
                height: 45px;
                top: 7.5px;
                left: 7.5px;
                animation-duration: 0.8s;
                animation-direction: reverse;
            }
            
            .spinner-ring:nth-child(3) {
                width: 30px;
                height: 30px;
                top: 15px;
                left: 15px;
                animation-duration: 0.6s;
            }
            
            .preloader-progress {
                width: 200px;
            }
            
            .progress-bar {
                height: 4px;
                background: rgba(255,255,255,0.2);
                border-radius: 2px;
                overflow: hidden;
                margin-bottom: 8px;
            }
            
            .progress-fill {
                height: 100%;
                background: white;
                width: 0%;
                transition: width 0.3s ease;
            }
            
            .progress-text {
                font-size: 14px;
                opacity: 0.8;
            }
            
            @keyframes preloaderSpin {
                to { transform: rotate(360deg); }
            }
            
            @keyframes preloaderPulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.05); opacity: 0.8; }
            }
        `;
        document.head.appendChild(style);
    }
}

// 立即初始化
window.pagePreloader = new PagePreloader();

export default PagePreloader;
