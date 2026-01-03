
import { API_BASE_URL } from './api-config.js';

async function loadArticles() {
    const container = document.getElementById('articles-container');
    if (!container) return;

    try {
        console.log('Starting to load articles...');

        // Fetch articles from the new backend
        const response = await fetch(`${API_BASE_URL}/articles`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        // Handle different response structures (array directly or { data: [...] })
        const articles = Array.isArray(result) ? result : (result.data || []);

        console.log('Articles loaded:', articles);

        if (!articles || articles.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">暂无文章，快去发布第一篇吧！<br><a href="/editor.html" style="color:#667eea;">✍️ 发布文章</a></div>';
            return;
        }

        container.innerHTML = ''; // Clear loading message

        articles.forEach((article) => {
            const card = document.createElement('div');
            card.className = 'showcase-card';
            card.onclick = () => window.location.href = `/article.html?id=${article.id}`;

            // Random cover image if none provided
            const randomImg = `/images/ocean/ocean.png`;

            card.innerHTML = `
                <img src="${article.cover_image || randomImg}" alt="${article.title}" class="showcase-image">
                <div class="showcase-info">
                    <div class="showcase-title">${article.title}</div>
                    <div class="showcase-meta">
                        <span>📂 ${article.category || '未分类'}</span>
                        <span>👤 ${article.author_name || '匿名'}</span>
                    </div>
                    <div style="font-size:12px; color:#999; margin-top:5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                        ${article.summary || ''}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error("加载文章列表失败:", error);
        container.innerHTML = `<div style="color:red; text-align:center;">加载失败: ${error.message || error}<br>请检查网络或刷新页面</div>`;
    }
}

loadArticles();
