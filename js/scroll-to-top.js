/**
 * 回到顶部 - Scroll to Top
 * 平滑滚动回页面顶部，带进度指示
 */

class ScrollToTop {
    constructor(options = {}) {
        this.options = {
            threshold: 300,
            position: 'right',
            offset: 30,
            showProgress: true,
            animation: 'smooth',
            ...options
        };
        
        this.button = null;
        this.progressRing = null;
        this.isVisible = false;
        
        this.init();
    }
    
    init() {
        this.createButton();
        this.bindEvents();
        this.injectStyles();
        
        console.log('[回到顶部] 系统已初始化');
    }
    
    createButton() {
        this.button = document.createElement('button');
        this.button.className = 'scroll-to-top';
        this.button.setAttribute('aria-label', '回到顶部');
        this.button.innerHTML = `
            ${this.options.showProgress ? `
            <svg class="progress-ring" viewBox="0 0 48 48">
                <circle class="progress-bg" cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
                <circle class="progress-fill" cx="24" cy="24" r="20" fill="none" stroke="white" stroke-width="2"
                    stroke-dasharray="125.66" stroke-dashoffset="125.66" stroke-linecap="round"
                    transform="rotate(-90 24 24)"/>
            </svg>
            ` : ''}
            <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
        `;
        
        this.button.style.cssText = `
            position: fixed;
            ${this.options.position === 'right' ? 'right: 20px;' : 'left: 20px;'}
            bottom: ${this.options.offset}px;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            opacity: 0;
            transform: translateY(20px) scale(0.8);
            transition: all 0.3s ease;
            z-index: 999;
        `;
        
        if (this.options.showProgress) {
            this.progressRing = this.button.querySelector('.progress-ring');
            this.progressRing.style.cssText = `
                position: absolute;
                width: 100%;
                height: 100%;
                transform: rotate(-90deg);
            `;
        }
        
        document.body.appendChild(this.button);
    }
    
    bindEvents() {
        // 滚动监听
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
        
        // 点击事件
        this.button.addEventListener('click', () => {
            this.scrollToTop();
        });
    }
    
    handleScroll() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? scrollTop / docHeight : 0;
        
        // 显示/隐藏按钮
        if (scrollTop > this.options.threshold) {
            if (!this.isVisible) {
                this.showButton();
            }
        } else {
            if (this.isVisible) {
                this.hideButton();
            }
        }
        
        // 更新进度环
        if (this.options.showProgress && this.progressRing) {
            const fill = this.progressRing.querySelector('.progress-fill');
            const circumference = 2 * Math.PI * 20;
            const offset = circumference - (progress * circumference);
            fill.style.strokeDashoffset = offset;
        }
    }
    
    showButton() {
        this.isVisible = true;
        this.button.style.opacity = '1';
        this.button.style.transform = 'translateY(0) scale(1)';
    }
    
    hideButton() {
        this.isVisible = false;
        this.button.style.opacity = '0';
        this.button.style.transform = 'translateY(20px) scale(0.8)';
    }
    
    scrollToTop() {
        if (this.options.animation === 'smooth') {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        } else {
            window.scrollTo(0, 0);
        }
        
        // 添加点击动画
        this.button.style.transform = 'scale(0.9)';
        setTimeout(() => {
            this.button.style.transform = 'scale(1)';
        }, 150);
    }
    
    injectStyles() {
        if (document.getElementById('scroll-to-top-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'scroll-to-top-styles';
        style.textContent = `
            .scroll-to-top:hover {
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5) !important;
                transform: translateY(-2px) !important;
            }
            
            .scroll-to-top .arrow-icon {
                width: 24px;
                height: 24px;
                stroke: currentColor;
            }
            
            @keyframes scrollTopPulse {
                0%, 100% { box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); }
                50% { box-shadow: 0 4px 25px rgba(102, 126, 234, 0.6); }
            }
            
            .scroll-to-top.visible {
                animation: scrollTopPulse 2s infinite;
            }
        `;
        document.head.appendChild(style);
    }
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.scrollToTop = new ScrollToTop();
    });
} else {
    window.scrollToTop = new ScrollToTop();
}

export default ScrollToTop;
