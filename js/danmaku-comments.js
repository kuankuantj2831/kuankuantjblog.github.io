/**
 * 弹幕评论系统
 * 评论以弹幕形式飘过文章页面
 */

class DanmakuComments {
    constructor(options = {}) {
        this.containerId = options.containerId || 'danmakuContainer';
        this.articleId = options.articleId || this.getArticleId();
        this.enabled = localStorage.getItem('danmaku_enabled') !== 'false';
        this.density = options.density || 'normal'; // low, normal, high
        this.speed = options.speed || 'normal'; // slow, normal, fast
        this.danmakuList = [];
        this.running = false;
        this.trackHeight = 40;
        this.tracks = [];
        this.maxTracks = 8;
    }

    getArticleId() {
        // 从 URL 提取文章 ID
        const path = window.location.pathname;
        const match = path.match(/(\d{4}\/\d{2}\/\d{2}\/[^\/]+)/);
        return match ? match[1] : path;
    }

    init() {
        this.createContainer();
        this.createToggleButton();
        this.loadComments();
        if (this.enabled) {
            this.start();
        }
    }

    createContainer() {
        // 创建弹幕层
        let container = document.getElementById(this.containerId);
        if (!container) {
            container = document.createElement('div');
            container.id = this.containerId;
            container.style.cssText = `
                position: fixed;
                top: 80px;
                left: 0;
                right: 0;
                bottom: 0;
                pointer-events: none;
                z-index: 100;
                overflow: hidden;
            `;
            document.body.appendChild(container);
        }
        this.container = container;
    }

    createToggleButton() {
        // 在文章页面创建开关按钮
        const articleSection = document.querySelector('.article-content, .post-content, article');
        if (!articleSection) return;

        const btn = document.createElement('div');
        btn.id = 'danmakuToggle';
        btn.style.cssText = `
            position: fixed;
            right: 20px;
            bottom: 100px;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: ${this.enabled ? 'linear-gradient(135deg,#667eea,#764ba2)' : '#ccc'};
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 101;
            transition: all 0.3s;
        `;
        btn.innerHTML = '💬';
        btn.title = this.enabled ? '关闭弹幕' : '开启弹幕';
        btn.onclick = () => this.toggle();

        // 悬停效果
        btn.onmouseenter = () => btn.style.transform = 'scale(1.1)';
        btn.onmouseleave = () => btn.style.transform = '';

        document.body.appendChild(btn);
        this.toggleBtn = btn;
    }

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('danmaku_enabled', this.enabled);

        if (this.toggleBtn) {
            this.toggleBtn.style.background = this.enabled
                ? 'linear-gradient(135deg,#667eea,#764ba2)'
                : '#ccc';
            this.toggleBtn.title = this.enabled ? '关闭弹幕' : '开启弹幕';
        }

        if (this.enabled) {
            this.start();
        } else {
            this.stop();
        }
    }

    async loadComments() {
        // 加载评论数据
        const demoComments = [
            { text: '写得真好！', color: '#ff6b6b', author: '读者A' },
            { text: '学到了很多', color: '#4ecdc4', author: '读者B' },
            { text: '收藏了', color: '#45b7d1', author: '读者C' },
            { text: '感谢分享', color: '#96ceb4', author: '读者D' },
            { text: '非常有用', color: '#feca57', author: '读者E' },
            { text: '期待更多', color: '#ff9ff3', author: '读者F' },
            { text: '666666', color: '#54a0ff', author: '读者G' },
            { text: 'mark一下', color: '#5f27cd', author: '读者H' },
            { text: '太棒了', color: '#00d2d3', author: '读者I' },
            { text: '转发支持', color: '#ff6348', author: '读者J' },
            { text: '深入浅出', color: '#2ed573', author: '读者K' },
            { text: '受益匪浅', color: '#1e90ff', author: '读者L' },
        ];

        try {
            // 尝试从页面获取真实评论
            const commentEls = document.querySelectorAll('.comment-body, .comment-content, .comment-text');
            const realComments = Array.from(commentEls).slice(0, 20).map(el => ({
                text: el.textContent.trim().substring(0, 50),
                color: this.getRandomColor(),
                author: '读者'
            })).filter(c => c.text.length > 0);

            this.danmakuList = realComments.length > 0 ? realComments : demoComments;
        } catch (e) {
            this.danmakuList = demoComments;
        }
    }

    getRandomColor() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
                        '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff6348',
                        '#2ed573', '#1e90ff', '#ffa502', '#eccc68'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.scheduleNext();
    }

    stop() {
        this.running = false;
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.tracks = [];
    }

    scheduleNext() {
        if (!this.running) return;

        const densityMap = { low: 3000, normal: 1500, high: 800 };
        const delay = densityMap[this.density] || 1500;
        const variance = Math.random() * 1000;

        setTimeout(() => {
            if (this.running) {
                this.shootDanmaku();
                this.scheduleNext();
            }
        }, delay + variance);
    }

    shootDanmaku() {
        if (!this.container || this.danmakuList.length === 0) return;

        const data = this.danmakuList[Math.floor(Math.random() * this.danmakuList.length)];
        const el = document.createElement('div');
        el.textContent = data.text;
        el.style.cssText = `
            position: absolute;
            white-space: nowrap;
            font-size: 15px;
            font-weight: 500;
            color: ${data.color};
            text-shadow: 0 0 4px rgba(255,255,255,0.8), 0 0 8px rgba(255,255,255,0.5);
            pointer-events: none;
            will-change: transform;
        `;

        // 计算轨道
        const containerHeight = this.container.clientHeight || window.innerHeight - 80;
        this.maxTracks = Math.floor(containerHeight / this.trackHeight);
        const track = Math.floor(Math.random() * this.maxTracks);
        const top = 60 + track * this.trackHeight;

        el.style.top = `${top}px`;
        el.style.left = '100%';
        this.container.appendChild(el);

        // 计算速度
        const speedMap = { slow: 12, normal: 8, fast: 5 };
        const duration = (speedMap[this.speed] || 8) * 1000 + Math.random() * 3000;

        // 动画
        const startTime = performance.now();
        const startX = this.container.clientWidth;
        const textWidth = el.offsetWidth;
        const totalDistance = startX + textWidth + 100;

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = elapsed / duration;

            if (progress >= 1) {
                el.remove();
                return;
            }

            const currentX = startX - progress * totalDistance;
            el.style.transform = `translateX(${currentX}px)`;
            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);

        // 安全清理
        setTimeout(() => {
            if (el.parentNode) el.remove();
        }, duration + 1000);
    }

    // 发送弹幕
    send(text, options = {}) {
        const danmaku = {
            text: text.substring(0, 100),
            color: options.color || this.getRandomColor(),
            author: options.author || '我',
            self: true
        };
        this.danmakuList.push(danmaku);
        this.shootDanmakuFromData(danmaku);
    }

    shootDanmakuFromData(data) {
        if (!this.container) return;
        const el = document.createElement('div');
        el.textContent = data.text;
        el.style.cssText = `
            position: absolute;
            white-space: nowrap;
            font-size: 16px;
            font-weight: 700;
            color: ${data.color};
            text-shadow: 0 0 4px rgba(255,255,255,0.9), 0 0 8px rgba(0,0,0,0.1);
            pointer-events: none;
            will-change: transform;
            border: 1px solid ${data.color}40;
            padding: 2px 8px;
            border-radius: 12px;
            background: rgba(255,255,255,0.1);
        `;

        const containerHeight = this.container.clientHeight || window.innerHeight - 80;
        const track = Math.floor(Math.random() * Math.floor(containerHeight / this.trackHeight));
        el.style.top = `${60 + track * this.trackHeight}px`;
        el.style.left = '100%';
        this.container.appendChild(el);

        const duration = 8000;
        const startTime = performance.now();
        const startX = this.container.clientWidth;
        const totalDistance = startX + el.offsetWidth + 100;

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = elapsed / duration;
            if (progress >= 1) {
                el.remove();
                return;
            }
            el.style.transform = `translateX(${startX - progress * totalDistance}px)`;
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }
}

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    // 仅在文章页面启用
    const isArticlePage = document.querySelector('.article-content, .post-content, article');
    if (isArticlePage) {
        const danmaku = new DanmakuComments();
        danmaku.init();
        window.danmakuSystem = danmaku;
    }
});

export default DanmakuComments;
