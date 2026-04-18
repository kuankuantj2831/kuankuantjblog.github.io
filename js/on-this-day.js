/**
 * 那年今日组件
 * 显示历史上同一天（月/日）发布的文章
 */

class OnThisDay {
    constructor(options = {}) {
        this.containerId = options.containerId || 'onThisDayContainer';
        this.maxItems = options.maxItems || 3;
        this.apiBaseUrl = options.apiBaseUrl || '';
    }

    init() {
        this.render();
        this.loadArticles();
    }

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        const dateStr = `${month}月${day}日`;

        container.innerHTML = `
            <div class="on-this-day-widget" style="
                background: linear-gradient(135deg, #667eea15, #764ba215);
                border-radius: 16px;
                padding: 20px;
                border: 1px solid #667eea20;
            ">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:15px;">
                    <span style="font-size:24px;">📅</span>
                    <div>
                        <h3 style="margin:0;font-size:16px;color:#333;">那年今日</h3>
                        <p style="margin:2px 0 0;font-size:12px;color:#999;">历史上的 ${dateStr} 发布了什么</p>
                    </div>
                </div>
                <div id="onThisDayList" style="min-height:60px;">
                    <div style="text-align:center;color:#ccc;padding:20px;">加载中...</div>
                </div>
            </div>
        `;
    }

    async loadArticles() {
        const listEl = document.getElementById('onThisDayList');
        if (!listEl) return;

        try {
            // 尝试从现有文章数据中筛选
            const articles = await this.getArticlesFromPage();
            const today = new Date();
            const month = today.getMonth() + 1;
            const day = today.getDate();

            const historical = articles.filter(article => {
                const d = new Date(article.date);
                return d.getMonth() + 1 === month && d.getDate() === day;
            }).slice(0, this.maxItems);

            if (historical.length === 0) {
                listEl.innerHTML = `
                    <div style="text-align:center;color:#bbb;padding:15px;font-size:13px;">
                        <div style="font-size:32px;margin-bottom:8px;">🌱</div>
                        <div>历史上的今天还没有文章</div>
                        <div style="font-size:11px;margin-top:4px;">去写一篇吧！</div>
                    </div>
                `;
                return;
            }

            listEl.innerHTML = historical.map(article => {
                const d = new Date(article.date);
                const year = d.getFullYear();
                const yearDiff = new Date().getFullYear() - year;
                return `
                    <a href="${article.url}" style="
                        display:flex;align-items:center;gap:12px;
                        padding:12px;
                        background:white;
                        border-radius:10px;
                        margin-bottom:8px;
                        text-decoration:none;
                        transition:all 0.2s;
                        border:1px solid #f0f0f0;
                    " onmouseover="this.style.transform='translateX(4px)';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.06)'" 
                       onmouseout="this.style.transform='';this.style.boxShadow=''">
                        <div style="
                            min-width:50px;height:50px;border-radius:10px;
                            background:linear-gradient(135deg,#667eea,#764ba2);
                            display:flex;align-items:center;justify-content:center;
                            color:white;font-weight:700;font-size:14px;
                        ">
                            ${year}
                        </div>
                        <div style="flex:1;min-width:0;">
                            <div style="font-size:14px;color:#333;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${article.title}</div>
                            <div style="font-size:12px;color:#999;margin-top:2px;">${yearDiff} 年前 · ${article.category || '文章'}</div>
                        </div>
                        <span style="font-size:18px;color:#ccc;">›</span>
                    </a>
                `;
            }).join('');
        } catch (error) {
            listEl.innerHTML = `<div style="text-align:center;color:#ccc;padding:15px;">加载失败</div>`;
        }
    }

    async getArticlesFromPage() {
        // 从页面现有的文章数据或 API 获取
        // 先尝试从 window.articlesData 获取
        if (window.articlesData && Array.isArray(window.articlesData)) {
            return window.articlesData;
        }

        // 尝试从页面解析文章列表
        const cards = document.querySelectorAll('.resource-card, .article-card, [data-article]');
        const articles = [];
        cards.forEach(card => {
            const link = card.querySelector('a');
            const titleEl = card.querySelector('.resource-title, .article-title, h3, h4');
            const dateEl = card.querySelector('.resource-date, .article-date, [data-date]');
            if (link && titleEl) {
                articles.push({
                    title: titleEl.textContent.trim(),
                    url: link.href,
                    date: dateEl ? dateEl.getAttribute('data-date') || dateEl.textContent : new Date().toISOString(),
                    category: card.querySelector('.resource-tag, .article-tag')?.textContent || ''
                });
            }
        });

        if (articles.length > 0) return articles;

        // 尝试从 API 获取
        try {
            const response = await fetch('/api/articles?limit=100');
            if (response.ok) {
                const data = await response.json();
                return data.articles || data || [];
            }
        } catch (e) {}

        // 返回模拟数据作为 fallback
        return this.getDemoData();
    }

    getDemoData() {
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return [
            { title: '我的个人介绍', url: '/2024/05/19/我的个人介绍/', date: `2024-${month}-${day}T00:00:00Z`, category: '生活随笔' },
            { title: 'Hello World', url: '/2024/05/19/hello-world/', date: `2023-${month}-${day}T00:00:00Z`, category: '编程技术' },
        ];
    }
}

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('onThisDayContainer');
    if (container) {
        const widget = new OnThisDay({ containerId: 'onThisDayContainer' });
        widget.init();
    }
});

export default OnThisDay;
