
import { API_BASE_URL } from './api-config.js?v=20260223b';
import { escapeHtml, sanitizeUrl } from './utils.js';

let currentPage = 1;
const PAGE_SIZE = 10;
let allArticlesLoaded = false;

function createArticleCard(article) {
    if (!article || !article.id) return null;

    const card = document.createElement('div');
    card.className = 'showcase-card';
    card.onclick = () => window.location.href = `/article.html?id=${encodeURIComponent(article.id)}`;

    const randomImg = `/images/ocean/ocean.png`;
    const safeTitle = escapeHtml(article.title || '无标题');
    const safeCategory = escapeHtml(article.category || '未分类');
    const safeAuthor = escapeHtml(article.author_name || '匿名');
    const safeSummary = escapeHtml(article.summary || '');
    const safeCoverImage = sanitizeUrl(article.cover_image || randomImg);

    let titleBadge = '';
    if (article.author_title === '站长') {
        titleBadge = '<span style="display:inline-block;padding:1px 5px;border-radius:3px;font-size:0.75em;font-weight:700;background:#d32f2f;color:#fff;margin-right:3px;">站长</span>';
    } else if (article.author_title === 'MVP') {
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
                <span>👁 ${article.view_count || 0}</span>
            </div>
            <div style="font-size:12px; color:#999; margin-top:5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                ${safeSummary}
            </div>
        </div>
    `;
    return card;
}

async function loadArticles(page = 1) {
    const container = document.getElementById('articles-container');
    if (!container) return;

    try {
        console.log(`Loading articles page ${page}...`);

        let response;
        try {
            response = await fetch(`${API_BASE_URL}/articles?page=${page}&limit=${PAGE_SIZE}`);
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

        const articles = Array.isArray(result) ? result : (result.data || []);

        console.log('Articles loaded:', articles.length);

        // 首次加载清除骨架屏
        if (page === 1) {
            container.innerHTML = '';
        }

        if (!articles || articles.length === 0) {
            if (page === 1) {
                container.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">暂无文章，快去发布第一篇吧！<br><a href="/editor.html" style="color:#667eea;">✍️ 发布文章</a></div>';
            }
            allArticlesLoaded = true;
            updateLoadMoreBtn();
            return;
        }

        articles.forEach((article) => {
            const card = createArticleCard(article);
            if (card) container.appendChild(card);
        });

        if (articles.length < PAGE_SIZE) {
            allArticlesLoaded = true;
        }
        currentPage = page;
        updateLoadMoreBtn();

    } catch (error) {
        console.error("加载文章列表失败:", error);
        const safeMsg = escapeHtml(error.message || '未知错误');
        if (page === 1) {
            container.innerHTML = `<div style="color:red; text-align:center;">加载失败: ${safeMsg}<br>请检查网络或刷新页面</div>`;
        }
    }
}

function updateLoadMoreBtn() {
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    if (!loadMoreContainer) return;
    loadMoreContainer.style.display = allArticlesLoaded ? 'none' : 'block';
}

// 绑定加载更多按钮
const loadMoreBtn = document.getElementById('loadMoreBtn');
if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
        loadMoreBtn.textContent = '加载中...';
        loadMoreBtn.disabled = true;
        loadArticles(currentPage + 1).finally(() => {
            loadMoreBtn.textContent = '加载更多';
            loadMoreBtn.disabled = false;
        });
    });
}

// 导出供搜索模块使用
window._loadArticles = loadArticles;

loadArticles(1);


