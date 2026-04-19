/**
 * 内容推荐系统前端模块
 * 智能推荐、相关文章、热门趋势、专题合集
 */

import { API_BASE_URL } from './api-config.js?v=20260419b';
import { escapeHtml } from './utils.js';

class RecommendationUI {
    constructor() {
        this.recommendations = [];
        this.trendingArticles = [];
        this.series = [];
        this.readingHistory = [];
    }

    init() {
        this.initComponents();
    }

    // ========== 初始化各组件 ==========
    initComponents() {
        // 个性化推荐
        if (document.getElementById('personalizedRecommendations')) {
            this.loadPersonalizedRecommendations();
        }

        // 相关文章推荐（文章详情页）
        const articleId = this.getCurrentArticleId();
        if (articleId && document.getElementById('relatedArticles')) {
            this.loadRelatedArticles(articleId);
        }

        // 热门趋势
        if (document.getElementById('trendingSection')) {
            this.loadTrendingArticles();
        }

        // 专题合集
        if (document.getElementById('seriesSection')) {
            this.loadSeries();
        }

        // 阅读历史
        if (document.getElementById('readingHistory')) {
            this.loadReadingHistory();
        }
    }

    // ========== 个性化推荐 ==========
    async loadPersonalizedRecommendations(limit = 6) {
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            const response = await fetch(`${API_BASE_URL}/recommendations/personalized?limit=${limit}`, {
                headers
            });
            
            if (!response.ok) throw new Error('加载推荐失败');
            const data = await response.json();
            this.recommendations = data.recommendations || [];
            this.renderPersonalizedRecommendations();
            return data;
        } catch (error) {
            console.error('加载个性化推荐失败:', error);
            this.renderFallbackRecommendations();
        }
    }

    renderPersonalizedRecommendations() {
        const container = document.getElementById('personalizedRecommendations');
        if (!container) return;

        if (this.recommendations.length === 0) {
            container.innerHTML = '<p class="empty-state">浏览更多文章以获取个性化推荐</p>';
            return;
        }

        container.innerHTML = `
            <div class="recommendations-section">
                <div class="section-header">
                    <h3>🎯 为你推荐</h3>
                    <button class="btn-refresh" onclick="recommendationUI.refreshRecommendations()">
                        <span class="refresh-icon">🔄</span> 换一批
                    </button>
                </div>
                <div class="recommendations-grid">
                    ${this.recommendations.map(article => this.renderArticleCard(article)).join('')}
                </div>
            </div>
        `;
    }

    // ========== 相关文章推荐 ==========
    async loadRelatedArticles(articleId, limit = 5) {
        try {
            const response = await fetch(`${API_BASE_URL}/recommendations/related/${articleId}?limit=${limit}`);
            if (!response.ok) throw new Error('加载相关文章失败');
            const data = await response.json();
            this.renderRelatedArticles(data.articles || []);
            return data;
        } catch (error) {
            console.error('加载相关文章失败:', error);
        }
    }

    renderRelatedArticles(articles) {
        const container = document.getElementById('relatedArticles');
        if (!container) return;

        container.innerHTML = `
            <div class="related-articles-section">
                <h4>📚 相关推荐</h4>
                <div class="related-list">
                    ${articles.map((article, index) => `
                        <a href="/article.html?id=${article.id}" class="related-item">
                            <span class="related-rank">${index + 1}</span>
                            <div class="related-info">
                                <h5>${escapeHtml(article.title)}</h5>
                                <div class="related-meta">
                                    <span>${article.views} 阅读</span>
                                    <span class="similarity">${Math.round(article.similarity * 100)}% 相关</span>
                                </div>
                            </div>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // ========== 热门趋势 ==========
    async loadTrendingArticles(period = 'day', limit = 10) {
        try {
            const response = await fetch(`${API_BASE_URL}/recommendations/trending?period=${period}&limit=${limit}`);
            if (!response.ok) throw new Error('加载热门文章失败');
            const data = await response.json();
            this.trendingArticles = data.articles || [];
            this.renderTrendingArticles(period);
            return data;
        } catch (error) {
            console.error('加载热门文章失败:', error);
        }
    }

    renderTrendingArticles(period) {
        const container = document.getElementById('trendingSection');
        if (!container) return;

        const periodLabels = {
            day: '今日热榜',
            week: '本周热榜',
            month: '本月热榜',
            all: '总榜'
        };

        container.innerHTML = `
            <div class="trending-section">
                <div class="trending-header">
                    <h3>🔥 ${periodLabels[period] || '热门文章'}</h3>
                    <div class="trending-tabs">
                        <button class="tab-btn ${period === 'day' ? 'active' : ''}" data-period="day">今日</button>
                        <button class="tab-btn ${period === 'week' ? 'active' : ''}" data-period="week">本周</button>
                        <button class="tab-btn ${period === 'month' ? 'active' : ''}" data-period="month">本月</button>
                    </div>
                </div>
                <div class="trending-list">
                    ${this.trendingArticles.map((article, index) => `
                        <a href="/article.html?id=${article.id}" class="trending-item rank-${index + 1}">
                            <span class="trending-rank">${index + 1}</span>
                            <div class="trending-info">
                                <h4>${escapeHtml(article.title)}</h4>
                                <div class="trending-meta">
                                    <span class="author">${escapeHtml(article.author)}</span>
                                    <span class="views">${this.formatNumber(article.views)} 阅读</span>
                                    <span class="trending-score">🔥 ${Math.round(article.trending_score)}</span>
                                </div>
                            </div>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;

        // 绑定Tab切换事件
        container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.loadTrendingArticles(btn.dataset.period);
            });
        });
    }

    // ========== 专题合集 ==========
    async loadSeries() {
        try {
            const response = await fetch(`${API_BASE_URL}/recommendations/series`);
            if (!response.ok) throw new Error('加载专题失败');
            const data = await response.json();
            this.series = data.series || [];
            this.renderSeries();
            return data;
        } catch (error) {
            console.error('加载专题失败:', error);
        }
    }

    renderSeries() {
        const container = document.getElementById('seriesSection');
        if (!container) return;

        container.innerHTML = `
            <div class="series-section">
                <div class="section-header">
                    <h3>📚 专题合集</h3>
                    <a href="/collections.html" class="view-all">查看全部 →</a>
                </div>
                <div class="series-grid">
                    ${this.series.map(series => `
                        <a href="/series.html?id=${series.id}" class="series-card" style="background: ${series.cover_color || 'linear-gradient(135deg, #667eea, #764ba2)'}"}>
                            <div class="series-content">
                                <h4>${escapeHtml(series.name)}</h4>
                                <p>${escapeHtml(series.description || '')}</p>
                                <div class="series-meta">
                                    <span>${series.article_count} 篇文章</span>
                                    <span>${series.total_views || 0} 阅读</span>
                                </div>
                            </div>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // ========== 阅读历史 ==========
    async loadReadingHistory(limit = 10) {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/recommendations/reading-history?limit=${limit}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error('加载阅读历史失败');
            const data = await response.json();
            this.readingHistory = data.history || [];
            this.renderReadingHistory();
            return data;
        } catch (error) {
            console.error('加载阅读历史失败:', error);
        }
    }

    renderReadingHistory() {
        const container = document.getElementById('readingHistory');
        if (!container) return;

        if (this.readingHistory.length === 0) {
            container.innerHTML = '<p class="empty-state">还没有阅读记录</p>';
            return;
        }

        container.innerHTML = `
            <div class="reading-history-section">
                <h4>📖 最近阅读</h4>
                <div class="history-list">
                    ${this.readingHistory.map(item => `
                        <a href="/article.html?id=${item.article_id}&progress=${item.progress_percent}" class="history-item">
                            <div class="history-progress" style="--progress: ${item.progress_percent}%"></div>
                            <div class="history-info">
                                <h5>${escapeHtml(item.article_title)}</h5>
                                <div class="history-meta">
                                    <span>读到 ${Math.round(item.progress_percent)}%</span>
                                    <span>${this.formatTimeAgo(item.read_at)}</span>
                                </div>
                            </div>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // ========== 文章卡片渲染 ==========
    renderArticleCard(article) {
        return `
            <a href="/article.html?id=${article.id}" class="article-card">
                <div class="card-image">
                    ${article.cover_image ? `<img src="${article.cover_image}" alt="" loading="lazy">` : '<div class="placeholder">📄</div>'}
                </div>
                <div class="card-content">
                    <h4>${escapeHtml(article.title)}</h4>
                    <p>${escapeHtml(article.summary || '').substring(0, 60)}...</p>
                    <div class="card-meta">
                        <span class="category">${escapeHtml(article.category || '文章')}</span>
                        <span class="views">👁 ${this.formatNumber(article.views)}</span>
                        ${article.similarity ? `<span class="match">${Math.round(article.similarity * 100)}% 匹配</span>` : ''}
                    </div>
                </div>
            </a>
        `;
    }

    // ========== 辅助方法 ==========
    getCurrentArticleId() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    formatNumber(num) {
        if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num;
    }

    formatTimeAgo(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return '刚刚';
        if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}天前`;
        return date.toLocaleDateString('zh-CN');
    }

    refreshRecommendations() {
        const icon = document.querySelector('.refresh-icon');
        if (icon) icon.classList.add('spinning');
        
        this.loadPersonalizedRecommendations().then(() => {
            if (icon) icon.classList.remove('spinning');
        });
    }

    renderFallbackRecommendations() {
        // 当个性化推荐不可用时，显示最新文章
        const container = document.getElementById('personalizedRecommendations');
        if (!container) return;

        container.innerHTML = `
            <div class="recommendations-section">
                <h3>🆕 最新文章</h3>
                <div class="recommendations-grid loading">
                    <div class="skeleton-card"></div>
                    <div class="skeleton-card"></div>
                    <div class="skeleton-card"></div>
                </div>
            </div>
        `;
    }

    // ========== 全局初始化 ==========
    static init() {
        window.recommendationUI = new RecommendationUI();
        window.recommendationUI.init();
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    RecommendationUI.init();
});

export default RecommendationUI;
