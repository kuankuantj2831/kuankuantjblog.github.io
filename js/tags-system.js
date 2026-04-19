/**
 * 标签管理系统 - Tags System
 * 提供标签云、热门标签、标签文章聚合等功能
 */

import { API_BASE_URL } from './api-config.js?v=20260419b';

class TagsSystem {
    constructor() {
        this.tags = [];
        this.hotTags = [];
        this.tagColors = [
            '#667eea', '#764ba2', '#f093fb', '#f5576c',
            '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
            '#fa709a', '#fee140', '#30cfd0', '#330867'
        ];
        this.currentTag = null;
    }

    /**
     * 初始化标签系统
     */
    async init() {
        await this.loadHotTags();
        this.injectStyles();
    }

    /**
     * 获取所有标签
     */
    async getAllTags() {
        try {
            const response = await fetch(`${API_BASE_URL}/articles/tags`);
            if (!response.ok) throw new Error('Failed to fetch tags');
            
            const data = await response.json();
            this.tags = data.tags || [];
            return this.tags;
        } catch (error) {
            console.error('Error fetching tags:', error);
            return [];
        }
    }

    /**
     * 加载热门标签
     */
    async loadHotTags() {
        try {
            // 从文章数据中提取热门标签
            const response = await fetch(`${API_BASE_URL}/articles?limit=100`);
            if (!response.ok) throw new Error('Failed to fetch articles');
            
            const data = await response.json();
            const articles = data.articles || [];
            
            // 统计标签使用频率
            const tagCount = {};
            articles.forEach(article => {
                if (article.tags) {
                    const tags = typeof article.tags === 'string' 
                        ? article.tags.split(',').map(t => t.trim()) 
                        : article.tags;
                    
                    tags.forEach(tag => {
                        if (tag) {
                            tagCount[tag] = (tagCount[tag] || 0) + 1;
                        }
                    });
                }
            });
            
            // 转换为数组并排序
            this.hotTags = Object.entries(tagCount)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 20); // 取前20个热门标签
            
            return this.hotTags;
        } catch (error) {
            console.error('Error loading hot tags:', error);
            return [];
        }
    }

    /**
     * 搜索标签
     */
    async searchTags(query) {
        if (!query || query.length < 1) return [];
        
        try {
            const response = await fetch(`${API_BASE_URL}/articles/tags?search=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Failed to search tags');
            
            const data = await response.json();
            return data.tags || [];
        } catch (error) {
            console.error('Error searching tags:', error);
            // 本地搜索
            return this.tags.filter(tag => 
                tag.toLowerCase().includes(query.toLowerCase())
            );
        }
    }

    /**
     * 按标签搜索文章
     */
    async searchArticlesByTag(tag, page = 1, limit = 10) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/articles?tag=${encodeURIComponent(tag)}&page=${page}&limit=${limit}`
            );
            if (!response.ok) throw new Error('Failed to search articles');
            
            return await response.json();
        } catch (error) {
            console.error('Error searching articles by tag:', error);
            return { articles: [], total: 0 };
        }
    }

    /**
     * 创建标签云
     */
    createTagCloud(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const {
            maxTags = 20,
            minFontSize = 12,
            maxFontSize = 32,
            showCount = true
        } = options;

        const tags = this.hotTags.slice(0, maxTags);
        if (tags.length === 0) {
            container.innerHTML = '<p class="no-tags">暂无标签</p>';
            return;
        }

        const maxCount = Math.max(...tags.map(t => t.count));
        const minCount = Math.min(...tags.map(t => t.count));

        const cloud = document.createElement('div');
        cloud.className = 'tag-cloud';

        tags.forEach((tag, index) => {
            const size = minCount === maxCount 
                ? minFontSize + (maxFontSize - minFontSize) / 2
                : minFontSize + (tag.count - minCount) / (maxCount - minCount) * (maxFontSize - minFontSize);
            
            const tagEl = document.createElement('a');
            tagEl.className = 'tag-item';
            tagEl.href = `/?tag=${encodeURIComponent(tag.name)}`;
            tagEl.style.fontSize = `${size}px`;
            tagEl.style.color = this.tagColors[index % this.tagColors.length];
            tagEl.innerHTML = `${tag.name}${showCount ? `<span class="tag-count">${tag.count}</span>` : ''}`;
            tagEl.addEventListener('click', (e) => {
                e.preventDefault();
                this.onTagClick(tag.name);
            });
            
            cloud.appendChild(tagEl);
        });

        container.innerHTML = '';
        container.appendChild(cloud);
    }

    /**
     * 创建热门标签列表
     */
    createHotTagsList(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const { maxTags = 10, showRank = true } = options;

        const tags = this.hotTags.slice(0, maxTags);
        if (tags.length === 0) {
            container.innerHTML = '<p class="no-tags">暂无热门标签</p>';
            return;
        }

        const list = document.createElement('div');
        list.className = 'hot-tags-list';

        tags.forEach((tag, index) => {
            const item = document.createElement('div');
            item.className = 'hot-tag-item';
            item.innerHTML = `
                ${showRank ? `<span class="tag-rank rank-${index < 3 ? index + 1 : ''}">${index + 1}</span>` : ''}
                <a href="/?tag=${encodeURIComponent(tag.name)}" class="tag-name">${tag.name}</a>
                <span class="tag-count">${tag.count} 篇文章</span>
            `;
            
            item.querySelector('.tag-name').addEventListener('click', (e) => {
                e.preventDefault();
                this.onTagClick(tag.name);
            });
            
            list.appendChild(item);
        });

        container.innerHTML = '';
        container.appendChild(list);
    }

    /**
     * 创建标签选择器（用于编辑器）
     */
    createTagSelector(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const { selected = [], onChange, maxTags = 5 } = options;
        let currentTags = [...selected];

        const wrapper = document.createElement('div');
        wrapper.className = 'tag-selector';

        // 标签输入区域
        const inputArea = document.createElement('div');
        inputArea.className = 'tag-input-area';

        // 已选标签展示
        const selectedTags = document.createElement('div');
        selectedTags.className = 'selected-tags';

        // 输入框
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'tag-input';
        input.placeholder = '输入标签，按回车添加';

        // 自动补全下拉
        const autocomplete = document.createElement('div');
        autocomplete.className = 'tag-autocomplete';
        autocomplete.style.display = 'none';

        // 热门标签建议
        const suggestions = document.createElement('div');
        suggestions.className = 'tag-suggestions';
        if (this.hotTags.length > 0) {
            suggestions.innerHTML = '<span class="suggestions-label">热门标签：</span>';
            this.hotTags.slice(0, 10).forEach(tag => {
                const span = document.createElement('span');
                span.className = 'suggestion-tag';
                span.textContent = tag.name;
                span.addEventListener('click', () => addTag(tag.name));
                suggestions.appendChild(span);
            });
        }

        function updateSelectedTags() {
            selectedTags.innerHTML = currentTags.map(tag => `
                <span class="selected-tag">
                    ${tag}
                    <span class="remove-tag" data-tag="${tag}">×</span>
                </span>
            `).join('');

            // 绑定删除事件
            selectedTags.querySelectorAll('.remove-tag').forEach(btn => {
                btn.addEventListener('click', () => {
                    const tag = btn.dataset.tag;
                    currentTags = currentTags.filter(t => t !== tag);
                    updateSelectedTags();
                    if (onChange) onChange(currentTags);
                });
            });
        }

        function addTag(tagName) {
            const trimmed = tagName.trim();
            if (!trimmed || currentTags.includes(trimmed)) return;
            if (currentTags.length >= maxTags) {
                showToast(`最多只能添加 ${maxTags} 个标签`);
                return;
            }
            currentTags.push(trimmed);
            updateSelectedTags();
            input.value = '';
            autocomplete.style.display = 'none';
            if (onChange) onChange(currentTags);
        }

        // 输入事件处理
        let debounceTimer;
        input.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
                if (value) {
                    const matches = await this.searchTags(value);
                    if (matches.length > 0) {
                        autocomplete.innerHTML = matches.map(tag => 
                            `<div class="autocomplete-item" data-tag="${tag}">${tag}</div>`
                        ).join('');
                        autocomplete.style.display = 'block';
                        
                        autocomplete.querySelectorAll('.autocomplete-item').forEach(item => {
                            item.addEventListener('click', () => {
                                addTag(item.dataset.tag);
                            });
                        });
                    } else {
                        autocomplete.style.display = 'none';
                    }
                } else {
                    autocomplete.style.display = 'none';
                }
            }, 300);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTag(input.value);
            } else if (e.key === 'Backspace' && !input.value && currentTags.length > 0) {
                currentTags.pop();
                updateSelectedTags();
                if (onChange) onChange(currentTags);
            }
        });

        // 点击外部关闭自动补全
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                autocomplete.style.display = 'none';
            }
        });

        inputArea.appendChild(selectedTags);
        inputArea.appendChild(input);
        inputArea.appendChild(autocomplete);
        
        wrapper.appendChild(inputArea);
        wrapper.appendChild(suggestions);

        container.innerHTML = '';
        container.appendChild(wrapper);

        updateSelectedTags();

        // 返回当前标签的getter
        return {
            getTags: () => currentTags,
            setTags: (tags) => {
                currentTags = [...tags];
                updateSelectedTags();
            }
        };
    }

    /**
     * 标签点击处理
     */
    onTagClick(tagName) {
        this.currentTag = tagName;
        // 触发标签筛选事件
        window.dispatchEvent(new CustomEvent('tagSelected', { detail: { tag: tagName } }));
        
        // 跳转到标签页面或显示标签文章
        const url = new URL(window.location.href);
        url.searchParams.set('tag', tagName);
        window.history.pushState({}, '', url);
        
        // 如果在首页，触发文章筛选
        if (typeof window.filterArticlesByTag === 'function') {
            window.filterArticlesByTag(tagName);
        }
    }

    /**
     * 创建标签文章列表页面
     */
    async createTagArticlesPage(containerId, tagName, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const { page = 1, limit = 10 } = options;

        container.innerHTML = `
            <div class="tag-page-header">
                <h1><span class="tag-icon">#</span>${tagName}</h1>
                <p>标签文章列表</p>
            </div>
            <div class="tag-articles-loading">加载中...</div>
        `;

        try {
            const data = await this.searchArticlesByTag(tagName, page, limit);
            const articles = data.articles || [];

            if (articles.length === 0) {
                container.innerHTML = `
                    <div class="tag-page-header">
                        <h1><span class="tag-icon">#</span>${tagName}</h1>
                        <p>暂无相关文章</p>
                    </div>
                    <div class="no-tag-articles">
                        <p>该标签下还没有文章</p>
                        <a href="/editor.html" class="btn-primary">写文章</a>
                    </div>
                `;
                return;
            }

            let html = `
                <div class="tag-page-header">
                    <h1><span class="tag-icon">#</span>${tagName}</h1>
                    <p>共 ${data.total || articles.length} 篇文章</p>
                </div>
                <div class="tag-articles-list">
            `;

            html += articles.map(article => `
                <article class="tag-article-item">
                    <h3><a href="/article.html?id=${article.id}">${article.title}</a></h3>
                    <p class="article-excerpt">${this.extractExcerpt(article.content, 150)}</p>
                    <div class="article-meta">
                        <span class="author">${article.author_name || article.author || '匿名'}</span>
                        <span class="date">${this.formatDate(article.created_at)}</span>
                        <span class="views">${article.view_count || 0} 阅读</span>
                    </div>
                </article>
            `).join('');

            html += '</div>';

            // 分页
            if (data.total > limit) {
                const totalPages = Math.ceil(data.total / limit);
                html += this.createPagination(page, totalPages, tagName);
            }

            container.innerHTML = html;

            // 绑定分页事件
            container.querySelectorAll('.pagination-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const newPage = parseInt(btn.dataset.page);
                    this.createTagArticlesPage(containerId, tagName, { page: newPage, limit });
                });
            });

        } catch (error) {
            container.innerHTML = `
                <div class="tag-page-header">
                    <h1><span class="tag-icon">#</span>${tagName}</h1>
                </div>
                <div class="error-message">加载失败，请稍后重试</div>
            `;
        }
    }

    /**
     * 创建分页
     */
    createPagination(currentPage, totalPages, tagName) {
        let html = '<div class="pagination">';
        
        if (currentPage > 1) {
            html += `<button class="pagination-btn" data-page="${currentPage - 1}">上一页</button>`;
        }
        
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
            } else if (i === currentPage - 3 || i === currentPage + 3) {
                html += '<span class="pagination-ellipsis">...</span>';
            }
        }
        
        if (currentPage < totalPages) {
            html += `<button class="pagination-btn" data-page="${currentPage + 1}">下一页</button>`;
        }
        
        html += '</div>';
        return html;
    }

    /**
     * 提取文章摘要
     */
    extractExcerpt(content, maxLength = 150) {
        if (!content) return '';
        // 移除Markdown标记
        const plainText = content
            .replace(/#{1,6}\s/g, '')
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/`/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
            .replace(/\n/g, ' ')
            .trim();
        
        return plainText.length > maxLength 
            ? plainText.substring(0, maxLength) + '...'
            : plainText;
    }

    /**
     * 格式化日期
     */
    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * 注入样式
     */
    injectStyles() {
        if (document.getElementById('tags-system-styles')) return;

        const style = document.createElement('style');
        style.id = 'tags-system-styles';
        style.textContent = `
            /* 标签云样式 */
            .tag-cloud {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                padding: 20px;
                justify-content: center;
            }

            .tag-item {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                padding: 6px 16px;
                border-radius: 20px;
                text-decoration: none;
                transition: all 0.3s ease;
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.2);
            }

            .tag-item:hover {
                transform: translateY(-3px) scale(1.1);
                box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            }

            .tag-count {
                font-size: 0.7em;
                padding: 2px 6px;
                background: rgba(255,255,255,0.3);
                border-radius: 10px;
                color: #fff;
            }

            /* 热门标签列表 */
            .hot-tags-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .hot-tag-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 15px;
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 10px;
                transition: all 0.3s ease;
            }

            .hot-tag-item:hover {
                background: rgba(255,255,255,0.2);
                transform: translateX(5px);
            }

            .tag-rank {
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255,255,255,0.2);
                border-radius: 50%;
                font-size: 0.85em;
                font-weight: bold;
                color: #fff;
            }

            .tag-rank.rank-1 {
                background: linear-gradient(135deg, #ffd700, #ffaa00);
            }

            .tag-rank.rank-2 {
                background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
            }

            .tag-rank.rank-3 {
                background: linear-gradient(135deg, #cd7f32, #b87333);
            }

            .hot-tag-item .tag-name {
                flex: 1;
                color: #fff;
                text-decoration: none;
                font-weight: 500;
            }

            .hot-tag-item .tag-count {
                font-size: 0.85em;
                color: rgba(255,255,255,0.7);
            }

            /* 标签选择器 */
            .tag-selector {
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 12px;
                padding: 15px;
            }

            .tag-input-area {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                align-items: center;
                min-height: 44px;
                padding: 8px 12px;
                background: rgba(255,255,255,0.1);
                border-radius: 8px;
                border: 1px solid rgba(255,255,255,0.2);
            }

            .selected-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }

            .selected-tag {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 4px 10px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: #fff;
                border-radius: 15px;
                font-size: 0.9em;
            }

            .remove-tag {
                cursor: pointer;
                font-size: 1.2em;
                line-height: 1;
                opacity: 0.8;
                transition: opacity 0.2s;
            }

            .remove-tag:hover {
                opacity: 1;
            }

            .tag-input {
                flex: 1;
                min-width: 120px;
                background: transparent;
                border: none;
                color: #fff;
                font-size: 14px;
                outline: none;
            }

            .tag-input::placeholder {
                color: rgba(255,255,255,0.5);
            }

            .tag-autocomplete {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                margin-top: 5px;
                background: rgba(30,30,40,0.95);
                backdrop-filter: blur(10px);
                border-radius: 8px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                z-index: 100;
                max-height: 200px;
                overflow-y: auto;
            }

            .autocomplete-item {
                padding: 10px 15px;
                cursor: pointer;
                color: #fff;
                transition: background 0.2s;
            }

            .autocomplete-item:hover {
                background: rgba(102, 126, 234, 0.3);
            }

            .tag-suggestions {
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid rgba(255,255,255,0.1);
            }

            .suggestions-label {
                font-size: 0.85em;
                color: rgba(255,255,255,0.6);
                margin-right: 10px;
            }

            .suggestion-tag {
                display: inline-block;
                padding: 4px 10px;
                margin: 4px;
                background: rgba(255,255,255,0.1);
                border-radius: 12px;
                font-size: 0.85em;
                color: rgba(255,255,255,0.8);
                cursor: pointer;
                transition: all 0.2s;
            }

            .suggestion-tag:hover {
                background: rgba(102, 126, 234, 0.5);
                color: #fff;
            }

            /* 标签页面 */
            .tag-page-header {
                text-align: center;
                padding: 40px 20px;
                margin-bottom: 30px;
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2));
                border-radius: 16px;
            }

            .tag-page-header h1 {
                font-size: 2.5em;
                margin-bottom: 10px;
                color: #fff;
            }

            .tag-icon {
                color: #667eea;
                margin-right: 10px;
            }

            .tag-page-header p {
                color: rgba(255,255,255,0.7);
            }

            .tag-article-item {
                padding: 25px;
                margin-bottom: 20px;
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 12px;
                transition: all 0.3s ease;
            }

            .tag-article-item:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }

            .tag-article-item h3 {
                margin-bottom: 10px;
            }

            .tag-article-item h3 a {
                color: #fff;
                text-decoration: none;
                font-size: 1.3em;
            }

            .tag-article-item h3 a:hover {
                color: #667eea;
            }

            .article-excerpt {
                color: rgba(255,255,255,0.7);
                line-height: 1.7;
                margin-bottom: 15px;
            }

            .article-meta {
                display: flex;
                gap: 20px;
                font-size: 0.9em;
                color: rgba(255,255,255,0.5);
            }

            /* 分页 */
            .pagination {
                display: flex;
                justify-content: center;
                gap: 8px;
                margin-top: 40px;
            }

            .pagination-btn {
                padding: 8px 16px;
                background: rgba(255,255,255,0.1);
                border: none;
                border-radius: 8px;
                color: #fff;
                cursor: pointer;
                transition: all 0.2s;
            }

            .pagination-btn:hover {
                background: rgba(102, 126, 234, 0.5);
            }

            .pagination-btn.active {
                background: linear-gradient(135deg, #667eea, #764ba2);
            }

            .pagination-ellipsis {
                color: rgba(255,255,255,0.5);
                padding: 8px;
            }
        `;
        document.head.appendChild(style);
    }
}

// 初始化
const tagsSystem = new TagsSystem();

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => tagsSystem.init());
} else {
    tagsSystem.init();
}

// 导出全局变量
window.TagsSystem = tagsSystem;

export default tagsSystem;
