/**
 * 随机漫游器
 * 一键随机跳转到历史文章，发现旧内容
 */

class RandomWalk {
    constructor(options = {}) {
        this.containerId = options.containerId || 'randomWalkContainer';
        this.buttonText = options.buttonText || '🎲 随机漫游';
        this.animating = false;
    }

    init() {
        this.render();
        this.bindEvents();
    }

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="random-walk-widget" style="text-align:center;">
                <button id="randomWalkBtn" style="
                    display:inline-flex;align-items:center;gap:8px;
                    padding:12px 28px;
                    background:linear-gradient(135deg,#667eea,#764ba2);
                    color:white;border:none;border-radius:25px;
                    font-size:15px;font-weight:600;cursor:pointer;
                    box-shadow:0 4px 15px rgba(102,126,234,0.3);
                    transition:all 0.3s;
                " onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 20px rgba(102,126,234,0.4)'"
                   onmouseout="this.style.transform='';this.style.boxShadow='0 4px 15px rgba(102,126,234,0.3)'">
                    <span class="random-walk-icon" style="font-size:18px;display:inline-block;transition:transform 0.5s;">🎲</span>
                    <span>随机漫游</span>
                </button>
                <p style="margin:8px 0 0;font-size:12px;color:#999;">发现一篇你可能错过的文章</p>
                
                <!-- 预览卡片 -->
                <div id="randomWalkPreview" style="
                    display:none;
                    margin-top:15px;
                    padding:15px;
                    background:white;
                    border-radius:12px;
                    border:1px solid #e8e8e8;
                    box-shadow:0 2px 10px rgba(0,0,0,0.05);
                    text-align:left;
                    animation:fadeInUp 0.4s ease;
                ">
                    <div style="font-size:12px;color:#667eea;font-weight:600;margin-bottom:6px;">🎯 为你推荐</div>
                    <a id="randomWalkLink" href="#" style="text-decoration:none;color:inherit;">
                        <div id="randomWalkTitle" style="font-size:16px;font-weight:600;color:#333;margin-bottom:4px;"></div>
                        <div id="randomWalkMeta" style="font-size:12px;color:#999;"></div>
                    </a>
                    <div style="margin-top:10px;display:flex;gap:8px;">
                        <button id="randomWalkGo" style="
                            flex:1;padding:8px 16px;
                            background:#667eea;color:white;border:none;
                            border-radius:8px;font-size:13px;cursor:pointer;
                        ">立即阅读</button>
                        <button id="randomWalkNext" style="
                            padding:8px 16px;
                            background:#f5f5f5;color:#666;border:none;
                            border-radius:8px;font-size:13px;cursor:pointer;
                        ">换一个</button>
                    </div>
                </div>
            </div>
            <style>
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes diceRoll {
                    0% { transform: rotate(0deg); }
                    25% { transform: rotate(90deg); }
                    50% { transform: rotate(180deg); }
                    75% { transform: rotate(270deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
    }

    bindEvents() {
        const btn = document.getElementById('randomWalkBtn');
        if (btn) {
            btn.addEventListener('click', () => this.spin());
        }

        const nextBtn = document.getElementById('randomWalkNext');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.showPreview());
        }

        const goBtn = document.getElementById('randomWalkGo');
        if (goBtn) {
            goBtn.addEventListener('click', () => {
                const link = document.getElementById('randomWalkLink');
                if (link && link.href && link.href !== '#') {
                    window.location.href = link.href;
                }
            });
        }
    }

    async spin() {
        if (this.animating) return;
        this.animating = true;

        const icon = document.querySelector('.random-walk-icon');
        if (icon) {
            icon.style.animation = 'diceRoll 0.6s ease';
            setTimeout(() => icon.style.animation = '', 600);
        }

        // 模拟随机选择过程
        const btn = document.getElementById('randomWalkBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = `<span class="random-walk-icon" style="font-size:18px;">🎲</span><span>挑选中...</span>`;
        btn.disabled = true;
        btn.style.opacity = '0.7';

        await new Promise(r => setTimeout(r, 800));

        btn.innerHTML = originalText;
        btn.disabled = false;
        btn.style.opacity = '1';
        this.animating = false;

        this.showPreview();
    }

    async showPreview() {
        const articles = await this.getArticles();
        if (articles.length === 0) return;

        const random = articles[Math.floor(Math.random() * articles.length)];
        const preview = document.getElementById('randomWalkPreview');
        const title = document.getElementById('randomWalkTitle');
        const meta = document.getElementById('randomWalkMeta');
        const link = document.getElementById('randomWalkLink');

        if (title) title.textContent = random.title || '无标题';
        if (meta) {
            const date = random.date ? new Date(random.date).toLocaleDateString('zh-CN') : '';
            meta.textContent = `${date} · ${random.category || '文章'} · ${random.readCount || Math.floor(Math.random() * 500 + 50)} 次阅读`;
        }
        if (link) link.href = random.url || '#';
        if (preview) {
            preview.style.display = 'block';
            // 重新触发动画
            preview.style.animation = 'none';
            preview.offsetHeight; // reflow
            preview.style.animation = 'fadeInUp 0.4s ease';
        }
    }

    async getArticles() {
        // 优先从页面获取文章列表
        if (window.articlesData && Array.isArray(window.articlesData) && window.articlesData.length > 0) {
            return window.articlesData;
        }

        // 从 DOM 解析
        const cards = document.querySelectorAll('.resource-card, .article-card');
        const articles = [];
        cards.forEach(card => {
            const link = card.querySelector('a');
            const titleEl = card.querySelector('.resource-title, .article-title, h3, h4');
            if (link && titleEl) {
                articles.push({
                    title: titleEl.textContent.trim(),
                    url: link.href,
                    category: card.querySelector('.resource-tag, .article-tag')?.textContent || '文章'
                });
            }
        });

        if (articles.length > 0) return articles;

        // Fallback: 返回一些示例
        return [
            { title: '我的个人介绍', url: '/2024/05/19/我的个人介绍/', date: '2024-05-19', category: '生活随笔', readCount: 128 },
            { title: 'Hello World', url: '/2024/05/19/hello-world/', date: '2024-05-19', category: '编程技术', readCount: 256 },
        ];
    }
}

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('randomWalkContainer');
    if (container) {
        const walker = new RandomWalk({ containerId: 'randomWalkContainer' });
        walker.init();
    }
});

export default RandomWalk;
