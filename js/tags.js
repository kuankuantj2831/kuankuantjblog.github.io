import { API_BASE_URL } from './api-config.js?v=20260419b';
import { escapeHtml } from './utils.js';

async function loadTagCloud() {
    const container = document.getElementById('tagCloud');
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE_URL}/articles/meta/tags`);
        if (!res.ok) throw new Error('加载失败');
        const tags = await res.json();

        if (!tags.length) {
            container.innerHTML = '<p style="color:#999;text-align:center;">暂无标签</p>';
            return;
        }

        const maxCount = Math.max(...tags.map(t => t.count));
        container.innerHTML = '';
        tags.forEach(tag => {
            const size = Math.max(14, Math.min(36, 14 + (tag.count / maxCount) * 22));
            const opacity = 0.6 + (tag.count / maxCount) * 0.4;
            const a = document.createElement('a');
            a.href = `/index-chinese.html?search=${encodeURIComponent(tag.name)}`;
            a.textContent = tag.name;
            a.className = 'tag-cloud-item';
            a.style.fontSize = size + 'px';
            a.style.opacity = opacity;
            container.appendChild(a);
        });
    } catch (e) {
        console.error('加载标签云失败:', e);
        container.innerHTML = '<p style="color:#999;text-align:center;">加载失败</p>';
    }
}

async function loadCategories() {
    const container = document.getElementById('categoryList');
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE_URL}/articles/meta/categories`);
        if (!res.ok) throw new Error('加载失败');
        const categories = await res.json();

        if (!categories.length) {
            container.innerHTML = '<p style="color:#999;text-align:center;">暂无分类</p>';
            return;
        }

        container.innerHTML = '';
        categories.forEach(cat => {
            const card = document.createElement('a');
            card.href = `/index-chinese.html?search=${encodeURIComponent(cat.category)}`;
            card.className = 'category-card';
            card.innerHTML = `
                <div class="category-name">${escapeHtml(cat.category)}</div>
                <div class="category-count">${cat.count} 篇文章</div>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        console.error('加载分类失败:', e);
        container.innerHTML = '<p style="color:#999;text-align:center;">加载失败</p>';
    }
}

async function loadHotArticles() {
    const container = document.getElementById('hotArticles');
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE_URL}/articles/meta/hot?limit=10`);
        if (!res.ok) throw new Error('加载失败');
        const articles = await res.json();

        if (!articles.length) {
            container.innerHTML = '<p style="color:#999;text-align:center;">暂无热门文章</p>';
            return;
        }

        container.innerHTML = '';
        articles.forEach((a, i) => {
            const item = document.createElement('a');
            item.href = `/article.html?id=${encodeURIComponent(a.id)}`;
            item.className = 'hot-article-item';
            item.innerHTML = `
                <span class="hot-rank ${i < 3 ? 'top3' : ''}">${i + 1}</span>
                <span class="hot-title">${escapeHtml(a.title || '无标题')}</span>
                <span class="hot-views">👁 ${a.view_count || 0}</span>
            `;
            container.appendChild(item);
        });
    } catch (e) {
        console.error('加载热门文章失败:', e);
        container.innerHTML = '<p style="color:#999;text-align:center;">加载失败</p>';
    }
}

// Init
loadTagCloud();
loadCategories();
loadHotArticles();
