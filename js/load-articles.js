
import { API_BASE_URL } from './api-config.js?v=20260223b';
import { escapeHtml, sanitizeUrl } from './utils.js';

async function loadArticles() {
    const container = document.getElementById('articles-container');
    if (!container) return;

    try {
        console.log('Starting to load articles...');

        // Fetch articles from the new backend
        let response;
        try {
            response = await fetch(`${API_BASE_URL}/articles`);
        } catch (networkError) {
            throw new Error('网络连接失败，请检查网络后重试');
        }

        if (!response.ok) {
            throw new Error(`服务器错误 (${response.status})`);
        }

        let result;
        try {
            result = await response.json();
        } catch (parseError) {
            throw new Error('服务器返回了无效的数据格式');
        }

        // Handle different response structures (array directly or { data: [...] })
        const articles = Array.isArray(result) ? result : (result.data || []);

        console.log('Articles loaded:', articles.length);

        if (!articles || articles.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">暂无文章，快去发布第一篇吧！<br><a href="/editor.html" style="color:#667eea;">✍️ 发布文章</a></div>';
            return;
        }

        container.innerHTML = ''; // Clear loading message

        articles.forEach((article) => {
            if (!article || !article.id) return; // 跳过无效文章数据

            const card = document.createElement('div');
            card.className = 'showcase-card';
            card.onclick = () => window.location.href = `/article.html?id=${encodeURIComponent(article.id)}`;

            // Random cover image if none provided
            const randomImg = `/images/ocean/ocean.png`;
            const safeTitle = escapeHtml(article.title || '无标题');
            const safeCategory = escapeHtml(article.category || '未分类');
            const safeAuthor = escapeHtml(article.author_name || '匿名');
            const safeSummary = escapeHtml(article.summary || '');
            const safeCoverImage = sanitizeUrl(article.cover_image || randomImg);

            // 头衔徽章
            let titleBadge = '';
            if (article.author_title === 'MVP') {
                titleBadge = '<span style="display:inline-block;padding:1px 5px;border-radius:3px;font-size:0.75em;font-weight:700;background:#fce4ec;color:#c62828;margin-right:3px;">MVP</span>';
            } else if (article.author_title === 'VIP') {
                titleBadge = '<span style="display:inline-block;padding:1px 5px;border-radius:3px;font-size:0.75em;font-weight:700;background:#fff8e1;color:#f57f17;margin-right:3px;">VIP</span>';
            }

            card.innerHTML = `
                <img loading="lazy" src="${safeCoverImage}" alt="${safeTitle}" class="showcase-image">
                <div class="showcase-info">
                    <div class="showcase-title">${safeTitle}</div>
                    <div class="showcase-meta">
                        <span>📂 ${safeCategory}</span>
                        <span>👤 ${titleBadge}${safeAuthor}</span>
                    </div>
                    <div style="font-size:12px; color:#999; margin-top:5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                        ${safeSummary}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error("加载文章列表失败:", error);
        const safeMsg = escapeHtml(error.message || '未知错误');
        container.innerHTML = `<div style="color:red; text-align:center;">加载失败: ${safeMsg}<br>请检查网络或刷新页面</div>`;
    }
}

loadArticles();
