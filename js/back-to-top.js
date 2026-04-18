/**
 * 增强版返回顶部
 * 滚动超过阈值显示，带动画
 */
class BackToTop {
    constructor(options = {}) {
        this.threshold = options.threshold || 300;
        this.position = options.position || 'right';
        this.offset = options.offset || 150;
    }

    init() {
        this.createButton();
        this.bindScroll();
    }

    createButton() {
        const btn = document.createElement('button');
        btn.id = 'backToTopBtn';
        const side = this.position === 'right' ? 'right:20px' : 'left:20px';
        btn.style.cssText = `
            position: fixed;
            bottom: ${this.offset}px;
            ${side};
            width: 44px;
            height: 44px;
            border-radius: 50%;
            border: none;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            font-size: 20px;
            cursor: pointer;
            z-index: 999;
            box-shadow: 0 4px 15px rgba(102,126,234,0.3);
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        btn.innerHTML = '↑';
        btn.onclick = () => this.scrollToTop();
        btn.onmouseenter = () => btn.style.transform = 'translateY(0) scale(1.1)';
        btn.onmouseleave = () => btn.style.transform = this.visible ? 'translateY(0)' : 'translateY(20px)';
        document.body.appendChild(btn);
        this.btn = btn;
    }

    bindScroll() {
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.toggle(window.pageYOffset > this.threshold);
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    toggle(show) {
        this.visible = show;
        if (show) {
            this.btn.style.opacity = '1';
            this.btn.style.transform = 'translateY(0)';
        } else {
            this.btn.style.opacity = '0';
            this.btn.style.transform = 'translateY(20px)';
        }
    }

    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btt = new BackToTop();
    btt.init();
});
export default BackToTop;
