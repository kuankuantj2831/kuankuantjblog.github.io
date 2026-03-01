/**
 * 博客搜索模块
 * 支持关键词搜索、分类筛选、标签筛选
 * 与 index-chinese.html 的搜索 UI 绑定
 */

import { API_BASE_URL } from './api-config.js?v=20260223b';
import { escapeHtml, sanitizeUrl } from './utils.js';

class BlogSearch {
    constructor() {
        this.searchInput = null;
        this.searchBtn = null;
        this.searchSelect = null;
        this.categoryTags = null;
        this.articlesContainer = null;
        this.currentCategory = '';
        this.currentTag = '';
        this.currentKeyword = '';
        this.isSearching = false;
        this.debounceTimer = null;
    }

    init() {
        // 获取 DOM 元素
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.searchSelect = document.getElementById('searchSelect');
        this.categoryTags = document.querySelectorAll('.category-tag');
        this.articlesContainer = document.getElementById('articles-container');
        this.searchResultInfo = document.getElementById('searchResultInfo');

        if (!this.searchInput || !this.searchBtn || !this.articlesContainer) {
            console.warn('搜索模块: 缺少必要的 DOM 元素，跳过初始化');
            return;
        }

        this.bindEvents();
        console.log('搜索模块初始化完成');
    }

    bindEvents() {
        // 搜索按钮点击
        this.searchBtn.addEventListener('click', () => {
            this.performSearch();
        });

        // 回车搜索
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.performSearch();
            }
        });

        // 输入防抖搜索（300ms 延迟）
        this.searchInput.addEventListener('input', () => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                // 只在输入框为空时自动恢复全部文章
                if (!this.searchInput.value.trim() && !this.currentCategory && !this.currentTag) {
                    this.resetSearch();
                }
            }, 300);
        });

        // 分类下拉选择
        if (this.searchSelect) {
            this.searchSelect.addEventListener('change', () => {
                const value = this.searchSelect.value;
                // 第一个 option 是 "选择标签 ⬇"，视为清除筛选
                if (this.searchSelect.selectedIndex === 0) {
                    this.currentCategory = '';
                } else {
                    this.currentCategory = value;
                }
                this.performSearch();
            });
        }

        // 分类标签点击
        if (this.categoryTags && this.categoryTags.length > 0) {
            this.categoryTags.forEach(tag => {
                tag.addEventListener('click', (e) => {
                    e.preventDefault();
                    const tagText = tag.textContent.trim();

                    // 切换选中状态
                    if (this.currentTag === tagText) {
                        // 再次点击取消选中
                        this.currentTag = '';
                        tag.classList.remove('active');
                    } else {
                        // 移除其他标签的 active
                        this.categoryTags.forEach(t => t.classList.remove('active'));
                        this.currentTag = tagText;
                        tag.classList.add('active');
                    }

                    this.performSearch();
                });
            });
        }
    }

    async performSearch() {
        if (this.isSearching) return;

        const keyword = this.searchInput ? this.searchInput.value.trim() : '';
        this.currentKeyword = keyword;

        // 如果所有条件都为空，恢复加载全部文章
        if (!keyword && !this.currentCategory && !this.currentTag) {
            this.resetSearch();
            return;
        }

        this.isSearching = true;

        try {
            // 显示搜索中状态
            this.articlesContainer.innerHTML = '<div class="loading-spinner">🔍 搜索中...</div>';

            // 构建查询参数
            const params = new URLSearchParams();
            if (keyword) params.set('q', keyword);
            if (this.currentCategory) params.set('category', this.currentCategory);
            if (this.currentTag) params.set('tag', this.currentTag);

            const url = `${API_BASE_URL}/articles/search?${params.toString()}`;
            console.log('搜索请求:', url);

            let response;
            try {
                response = await fetch(url);
            } catch (networkError) {
                throw new Error('网络连接失败，请检查网络后重试');
            }

            if (!response.ok) {
                throw new Error(`搜索失败 (${response.status})`);
            }

            let result;
            try {
                result = await response.json();
            } catch (parseError) {
                throw new Error('服务器返回了无效的数据格式');
            }

            const articles = result.data || [];
            const pagination = result.pagination || {};

            this.renderResults(articles, pagination);

        } catch (error) {
            console.error('搜索失败:', error);
            const safeMsg = escapeHtml(error.message || '未知错误');
            this.articlesContainer.innerHTML = `
                <div style="text-align:center; padding:30px; color:#e74c3c;">
                    <div style="font-size:24px; margin-bottom:10px;">😥</div>
                    <div>搜索失败: ${safeMsg}</div>
                    <button onclick="document.getElementById('searchInput').value=''; window.blogSearch.resetSearch();" 
                            style="margin-top:15px; padding:8px 20px; background:#667eea; color:white; border:none; border-radius:5px; cursor:pointer;">
                        返回全部文章
                    </button>
                </div>`;
        } finally {
            this.isSearching = false;
        }
    }

    renderResults(articles, pagination) {
        // 更新搜索信息栏（独立容器，不在横向滚动区域内）
        this.updateSearchInfo(articles, pagination);

        if (!articles || articles.length === 0) {
            const searchTerms = [];
            if (this.currentKeyword) searchTerms.push(`"${escapeHtml(this.currentKeyword)}"`);
            if (this.currentCategory) searchTerms.push(`分类: ${escapeHtml(this.currentCategory)}`);
            if (this.currentTag) searchTerms.push(`标签: ${escapeHtml(this.currentTag)}`);

            this.articlesContainer.innerHTML = `
                <div style="text-align:center; padding:40px; color:#999; min-width:100%;">
                    <div style="font-size:48px; margin-bottom:15px;">🔍</div>
                    <div style="font-size:16px; margin-bottom:8px;">没有找到相关文章</div>
                    <div style="font-size:13px; color:#bbb; margin-bottom:20px;">
                        搜索条件: ${searchTerms.join(' + ') || '无'}
                    </div>
                    <button onclick="document.getElementById('searchInput').value=''; window.blogSearch.resetSearch();"
                            style="padding:8px 20px; background:#667eea; color:white; border:none; border-radius:5px; cursor:pointer;">
                        查看全部文章
                    </button>
                </div>`;
            return;
        }

        this.articlesContainer.innerHTML = '';

        // 渲染文章卡片
        articles.forEach((article) => {
            if (!article || !article.id) return;

            const card = document.createElement('div');
            card.className = 'showcase-card';
            card.onclick = () => window.location.href = `/article.html?id=${encodeURIComponent(article.id)}`;

            const randomImg = `/images/ocean/ocean.png`;
            const safeTitle = escapeHtml(article.title || '无标题');
            const safeCategory = escapeHtml(article.category || '未分类');
            const safeAuthor = escapeHtml(article.author_name || '匿名');
            const safeSummary = escapeHtml(article.summary || '');
            const safeCoverImage = sanitizeUrl(article.cover_image || randomImg);

            // 高亮搜索关键词
            let displayTitle = safeTitle;
            let displaySummary = safeSummary;
            if (this.currentKeyword) {
                const keywordRegex = new RegExp(`(${this.escapeRegex(escapeHtml(this.currentKeyword))})`, 'gi');
                displayTitle = safeTitle.replace(keywordRegex, '<mark style="background:#fff3cd; padding:0 2px; border-radius:2px;">$1</mark>');
                displaySummary = safeSummary.replace(keywordRegex, '<mark style="background:#fff3cd; padding:0 2px; border-radius:2px;">$1</mark>');
            }

            card.innerHTML = `
                <img src="${safeCoverImage}" alt="${safeTitle}" class="showcase-image">
                <div class="showcase-info">
                    <div class="showcase-title">${displayTitle}</div>
                    <div class="showcase-meta">
                        <span>📂 ${safeCategory}</span>
                        <span>👤 ${safeAuthor}</span>
                    </div>
                    <div style="font-size:12px; color:#999; margin-top:5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                        ${displaySummary}
                    </div>
                </div>
            `;
            this.articlesContainer.appendChild(card);
        });
    }

    /**
     * 重置搜索，恢复加载全部文章
     */
    /**
     * 更新搜索信息栏（渲染到独立容器，不影响横向滚动布局）
     */
    updateSearchInfo(articles, pagination) {
        if (!this.searchResultInfo) return;

        if (pagination && pagination.total !== undefined) {
            const searchTerms = [];
            if (this.currentKeyword) searchTerms.push(`"${escapeHtml(this.currentKeyword)}"`);
            if (this.currentCategory) searchTerms.push(escapeHtml(this.currentCategory));
            if (this.currentTag) searchTerms.push(escapeHtml(this.currentTag));

            this.searchResultInfo.style.display = 'flex';
            this.searchResultInfo.style.cssText = 'display:flex; padding:8px 15px; font-size:13px; color:#888; justify-content:space-between; align-items:center;';
            this.searchResultInfo.innerHTML = `
                <span>找到 <strong style="color:#667eea;">${pagination.total}</strong> 篇相关文章 ${searchTerms.length ? '(' + searchTerms.join(' + ') + ')' : ''}</span>
                <a href="#" onclick="event.preventDefault(); document.getElementById('searchInput').value=''; window.blogSearch.resetSearch();"
                   style="color:#667eea; text-decoration:none; font-size:12px;">✕ 清除搜索</a>
            `;
        } else {
            this.searchResultInfo.style.display = 'none';
            this.searchResultInfo.innerHTML = '';
        }
    }

    async resetSearch() {
        this.currentKeyword = '';
        this.currentCategory = '';
        this.currentTag = '';

        // 清除 UI 状态
        if (this.searchInput) this.searchInput.value = '';
        if (this.searchSelect) this.searchSelect.selectedIndex = 0;
        if (this.categoryTags) {
            this.categoryTags.forEach(t => t.classList.remove('active'));
        }

        // 隐藏搜索信息栏
        if (this.searchResultInfo) {
            this.searchResultInfo.style.display = 'none';
            this.searchResultInfo.innerHTML = '';
        }

        // 重新加载全部文章
        try {
            this.articlesContainer.innerHTML = '<div class="loading-spinner">加载文章中...</div>';

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

            const articles = Array.isArray(result) ? result : (result.data || []);

            if (!articles || articles.length === 0) {
                this.articlesContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">暂无文章，快去发布第一篇吧！<br><a href="/editor.html" style="color:#667eea;">✍️ 发布文章</a></div>';
                return;
            }

            this.articlesContainer.innerHTML = '';
            articles.forEach((article) => {
                if (!article || !article.id) return;

                const card = document.createElement('div');
                card.className = 'showcase-card';
                card.onclick = () => window.location.href = `/article.html?id=${encodeURIComponent(article.id)}`;

                const randomImg = `/images/ocean/ocean.png`;
                const safeTitle = escapeHtml(article.title || '无标题');
                const safeCategory = escapeHtml(article.category || '未分类');
                const safeAuthor = escapeHtml(article.author_name || '匿名');
                const safeSummary = escapeHtml(article.summary || '');
                const safeCoverImage = sanitizeUrl(article.cover_image || randomImg);

                card.innerHTML = `
                    <img src="${safeCoverImage}" alt="${safeTitle}" class="showcase-image">
                    <div class="showcase-info">
                        <div class="showcase-title">${safeTitle}</div>
                        <div class="showcase-meta">
                            <span>📂 ${safeCategory}</span>
                            <span>👤 ${safeAuthor}</span>
                        </div>
                        <div style="font-size:12px; color:#999; margin-top:5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                            ${safeSummary}
                        </div>
                    </div>
                `;
                this.articlesContainer.appendChild(card);
            });

        } catch (error) {
            console.error('加载文章列表失败:', error);
            const safeMsg = escapeHtml(error.message || '未知错误');
            this.articlesContainer.innerHTML = `<div style="color:red; text-align:center;">加载失败: ${safeMsg}<br>请检查网络或刷新页面</div>`;
        }
    }

    /**
     * 转义正则特殊字符
     */
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

// 初始化搜索模块
const blogSearch = new BlogSearch();

// 暴露到全局，供 HTML 内联事件使用
window.blogSearch = blogSearch;

// DOM 加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => blogSearch.init());
} else {
    blogSearch.init();
}

export default blogSearch;
