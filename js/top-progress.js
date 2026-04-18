/**
 * 顶部加载进度条
 * 页面加载时在顶部显示进度条
 */
class TopProgressBar {
    constructor(options = {}) {
        this.color = options.color || 'linear-gradient(90deg, #667eea, #764ba2)';
        this.height = options.height || 3;
        this.zIndex = options.zIndex || 99999;
    }

    init() {
        this.createBar();
        this.startProgress();
    }

    createBar() {
        this.bar = document.createElement('div');
        this.bar.id = 'topProgressBar';
        this.bar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            height: ${this.height}px;
            width: 0%;
            background: ${this.color};
            z-index: ${this.zIndex};
            transition: width 0.3s ease;
            box-shadow: 0 0 10px rgba(102,126,234,0.5);
        `;
        document.body.appendChild(this.bar);
    }

    startProgress() {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15 + 5;
            if (progress > 90) progress = 90;
            this.setProgress(progress);
        }, 200);

        window.addEventListener('load', () => {
            clearInterval(interval);
            this.setProgress(100);
            setTimeout(() => this.destroy(), 500);
        });

        setTimeout(() => {
            clearInterval(interval);
            this.setProgress(100);
            setTimeout(() => this.destroy(), 500);
        }, 5000);
    }

    setProgress(pct) {
        if (this.bar) this.bar.style.width = `${Math.min(pct, 100)}%`;
    }

    destroy() {
        if (this.bar) {
            this.bar.style.opacity = '0';
            setTimeout(() => this.bar.remove(), 300);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const pb = new TopProgressBar();
    pb.init();
});
export default TopProgressBar;
