/**
 * 智能文章推荐系统 - Article Recommendation System
 * 基于用户行为、内容相似度和热门度的推荐算法
 */

class ArticleRecommendationEngine {
    constructor(options = {}) {
        this.apiBaseUrl = options.apiBaseUrl || '/api';
        this.userId = options.userId || null;
        this.cache = new Map();
        this.cacheExpiry = 10 * 60 * 1000; // 10分钟缓存
        this.userBehavior = this.loadUserBehavior();
    }

    /**
     * 加载用户行为数据
     */
    loadUserBehavior() {
        const saved = localStorage.getItem('user_reading_behavior');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            readArticles: [],
            likedArticles: [],
            categories: {},
            tags: {},
            authors: {},
            readTime: {},
            lastUpdate: Date.now()
        };
    }

    /**
     * 保存用户行为
     */
    saveUserBehavior() {
        this.userBehavior.lastUpdate = Date.now();
        localStorage.setItem('user_reading_behavior', JSON.stringify(this.userBehavior));
    }

    /**
     * 记录阅读行为
     */
    recordRead(articleId, metadata = {}) {
        if (!this.userBehavior.readArticles.includes(articleId)) {
            this.userBehavior.readArticles.push(articleId);
        }

        // 更新分类权重
        if (metadata.category) {
            this.userBehavior.categories[metadata.category] = 
                (this.userBehavior.categories[metadata.category] || 0) + 1;
        }

        // 更新标签权重
        if (metadata.tags) {
            metadata.tags.forEach(tag => {
                this.userBehavior.tags[tag] = (this.userBehavior.tags[tag] || 0) + 1;
            });
        }

        // 更新作者权重
        if (metadata.author) {
            this.userBehavior.authors[metadata.author] = 
                (this.userBehavior.authors[metadata.author] || 0) + 1;
        }

        // 记录阅读时长
        const startTime = Date.now();
        this.userBehavior.readTime[articleId] = { start: startTime };

        this.saveUserBehavior();
    }

    /**
     * 记录阅读完成
     */
    recordReadComplete(articleId) {
        if (this.userBehavior.readTime[articleId]) {
            const duration = Date.now() - this.userBehavior.readTime[articleId].start;
            this.userBehavior.readTime[articleId].duration = duration;
            this.userBehavior.readTime[articleId].completed = true;
            this.saveUserBehavior();
        }
    }

    /**
     * 记录点赞
     */
    recordLike(articleId) {
        if (!this.userBehavior.likedArticles.includes(articleId)) {
            this.userBehavior.likedArticles.push(articleId);
            this.saveUserBehavior();
        }
    }

    /**
     * 获取个性化推荐
     */
    async getPersonalizedRecommendations(options = {}) {
        const limit = options.limit || 6;
        const excludeIds = options.excludeIds || [];

        try {
            // 构建用户画像
            const userProfile = this.buildUserProfile();

            const response = await fetch(`${this.apiBaseUrl}/articles/recommendations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({
                    userProfile,
                    excludeIds: [...excludeIds, ...this.userBehavior.readArticles],
                    limit
                })
            });

            if (!response.ok) throw new Error('获取推荐失败');

            return await response.json();
        } catch (error) {
            console.error('获取推荐失败:', error);
            return this.getFallbackRecommendations(limit, excludeIds);
        }
    }

    /**
     * 构建用户画像
     */
    buildUserProfile() {
        const profile = {
            preferredCategories: this.getTopItems(this.userBehavior.categories, 3),
            preferredTags: this.getTopItems(this.userBehavior.tags, 5),
            preferredAuthors: this.getTopItems(this.userBehavior.authors, 3),
            readingHistory: this.userBehavior.readArticles.slice(-20),
            engagementLevel: this.calculateEngagementLevel()
        };

        return profile;
    }

    /**
     * 获取权重最高的项
     */
    getTopItems(obj, count) {
        return Object.entries(obj)
            .sort((a, b) => b[1] - a[1])
            .slice(0, count)
            .map(([key]) => key);
    }

    /**
     * 计算用户参与度
     */
    calculateEngagementLevel() {
        const readCount = this.userBehavior.readArticles.length;
        const likeCount = this.userBehavior.likedArticles.length;
        
        if (readCount === 0) return 'new';
        if (likeCount / readCount > 0.5 && readCount > 20) return 'high';
        if (readCount > 10) return 'medium';
        return 'low';
    }

    /**
     * 备用推荐（基于热门度）
     */
    async getFallbackRecommendations(limit = 6, excludeIds = []) {
        try {
            const response = await fetch(
                `${this.apiBaseUrl}/articles/popular?limit=${limit * 2}&exclude=${excludeIds.join(',')}`
            );

            if (!response.ok) throw new Error('获取热门文章失败');

            const articles = await response.json();
            return this.diversifyRecommendations(articles, limit);
        } catch (error) {
            return this.getMockRecommendations(limit);
        }
    }

    /**
     * 多样化推荐结果
     */
    diversifyRecommendations(articles, limit) {
        // 按分类分组
        const byCategory = {};
        articles.forEach(article => {
            const cat = article.category || '其他';
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push(article);
        });

        // 从每个分类中选取，确保多样性
        const result = [];
        const categories = Object.keys(byCategory);
        let index = 0;

        while (result.length < limit && categories.some(cat => byCategory[cat].length > 0)) {
            const cat = categories[index % categories.length];
            if (byCategory[cat].length > 0) {
                result.push(byCategory[cat].shift());
            }
            index++;
        }

        // 如果还有空位，用剩余的填充
        if (result.length < limit) {
            const remaining = Object.values(byCategory).flat();
            result.push(...remaining.slice(0, limit - result.length));
        }

        return result;
    }

    /**
     * 获取相关文章
     */
    async getRelatedArticles(articleId, limit = 4) {
        const cacheKey = `related_${articleId}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const response = await fetch(
                `${this.apiBaseUrl}/articles/${articleId}/related?limit=${limit}`
            );

            if (!response.ok) throw new Error('获取相关文章失败');

            const articles = await response.json();
            this.setCache(cacheKey, articles);
            return articles;
        } catch (error) {
            console.error('获取相关文章失败:', error);
            return this.getMockRelatedArticles(limit);
        }
    }

    /**
     * 基于内容相似度计算相关文章
     */
    calculateContentSimilarity(article1, article2) {
        let score = 0;

        // 分类相同
        if (article1.category === article2.category) {
            score += 0.3;
        }

        // 标签相似度
        if (article1.tags && article2.tags) {
            const commonTags = article1.tags.filter(tag => article2.tags.includes(tag));
            score += (commonTags.length / Math.max(article1.tags.length, article2.tags.length)) * 0.4;
        }

        // 作者相同
        if (article1.author === article2.author) {
            score += 0.1;
        }

        // 标题关键词相似
        const title1 = article1.title.toLowerCase().split(' ');
        const title2 = article2.title.toLowerCase().split(' ');
        const commonWords = title1.filter(w => title2.includes(w));
        score += (commonWords.length / Math.max(title1.length, title2.length)) * 0.2;

        return score;
    }

    /**
     * 获取热门文章
     */
    async getTrendingArticles(period = 'day', limit = 10) {
        const cacheKey = `trending_${period}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const response = await fetch(
                `${this.apiBaseUrl}/articles/trending?period=${period}&limit=${limit}`
            );

            if (!response.ok) throw new Error('获取热门文章失败');

            const articles = await response.json();
            this.setCache(cacheKey, articles);
            return articles;
        } catch (error) {
            return this.getMockRecommendations(limit);
        }
    }

    /**
     * 获取最新文章
     */
    async getLatestArticles(limit = 10, offset = 0) {
        try {
            const response = await fetch(
                `${this.apiBaseUrl}/articles/latest?limit=${limit}&offset=${offset}`
            );

            if (!response.ok) throw new Error('获取最新文章失败');

            return await response.json();
        } catch (error) {
            return this.getMockRecommendations(limit);
        }
    }

    /**
     * 获取"猜你喜欢"
     */
    async getYouMayLike(limit = 6) {
        // 如果有阅读历史，基于协同过滤
        if (this.userBehavior.readArticles.length > 0) {
            return this.getPersonalizedRecommendations({ limit });
        }
        // 否则返回热门
        return this.getTrendingArticles('week', limit);
    }

    /**
     * 获取继续阅读
     */
    async getContinueReading(limit = 3) {
        const unfinished = Object.entries(this.userBehavior.readTime)
            .filter(([_, data]) => !data.completed)
            .sort((a, b) => b[1].start - a[1].start)
            .slice(0, limit)
            .map(([id]) => id);

        if (unfinished.length === 0) return [];

        try {
            const response = await fetch(`${this.apiBaseUrl}/articles/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: unfinished })
            });

            if (!response.ok) throw new Error('获取文章失败');

            return await response.json();
        } catch (error) {
            return [];
        }
    }

    /**
     * 获取发现新内容
     */
    async getDiscoveryFeed(options = {}) {
        const limit = options.limit || 10;
        const strategy = options.strategy || 'mixed'; // mixed, trending, latest, random

        let articles = [];

        switch (strategy) {
            case 'trending':
                articles = await this.getTrendingArticles('week', limit);
                break;
            case 'latest':
                articles = await this.getLatestArticles(limit);
                break;
            case 'random':
                articles = await this.getRandomArticles(limit);
                break;
            case 'mixed':
            default:
                const [trending, latest] = await Promise.all([
                    this.getTrendingArticles('week', Math.ceil(limit / 2)),
                    this.getLatestArticles(Math.ceil(limit / 2))
                ]);
                articles = this.shuffleArray([...trending, ...latest]).slice(0, limit);
                break;
        }

        return articles;
    }

    /**
     * 获取随机文章
     */
    async getRandomArticles(limit = 10) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/articles/random?limit=${limit}`);
            if (!response.ok) throw new Error('获取随机文章失败');
            return await response.json();
        } catch (error) {
            return this.getMockRecommendations(limit);
        }
    }

    /**
     * 搜索推荐
     */
    async getSearchSuggestions(query, limit = 5) {
        if (!query || query.length < 2) return [];

        try {
            const response = await fetch(
                `${this.apiBaseUrl}/articles/suggest?q=${encodeURIComponent(query)}&limit=${limit}`
            );

            if (!response.ok) throw new Error('获取搜索建议失败');

            return await response.json();
        } catch (error) {
            return this.getMockSearchSuggestions(query);
        }
    }

    /**
     * 缓存操作
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.time < this.cacheExpiry) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, { data, time: Date.now() });
    }

    /**
     * 工具方法
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    getToken() {
        return localStorage.getItem('auth_token') || '';
    }

    /**
     * 模拟数据
     */
    getMockRecommendations(limit) {
        const articles = [
            { id: '1', title: 'Vue 3 性能优化实战指南', category: '前端', tags: ['vue', '性能'], author: '张三', views: 1200 },
            { id: '2', title: '深入理解 JavaScript 闭包', category: '前端', tags: ['javascript', '基础'], author: '李四', views: 980 },
            { id: '3', title: 'React Hooks 最佳实践', category: '前端', tags: ['react', 'hooks'], author: '王五', views: 850 },
            { id: '4', title: 'Node.js 微服务架构设计', category: '后端', tags: ['nodejs', '微服务'], author: '赵六', views: 720 },
            { id: '5', title: 'CSS Grid 布局完全指南', category: '前端', tags: ['css', '布局'], author: '张三', views: 1500 },
            { id: '6', title: 'TypeScript 高级类型技巧', category: '前端', tags: ['typescript', '类型'], author: '李四', views: 1100 }
        ];
        return articles.slice(0, limit);
    }

    getMockRelatedArticles(limit) {
        return this.getMockRecommendations(limit);
    }

    getMockSearchSuggestions(query) {
        return [
            { title: `${query} 教程`, type: 'article' },
            { title: `${query} 最佳实践`, type: 'article' },
            { title: `如何学习 ${query}`, type: 'article' },
            { title: `${query} 常见问题`, type: 'tag' },
            { title: `${query} 进阶`, type: 'category' }
        ];
    }
}

/**
 * 推荐UI组件
 */
class RecommendationUI {
    constructor(engine) {
        this.engine = engine;
    }

    /**
     * 渲染推荐卡片
     */
    renderRecommendationCard(article, type = 'normal') {
        const isRead = this.engine.userBehavior.readArticles.includes(article.id);
        
        return `
            <article class="recommendation-card ${type} ${isRead ? 'read' : ''}" data-id="${article.id}">
                <div class="card-image" ${article.cover ? `style="background-image: url('${article.cover}')"` : ''}>
                    ${!article.cover ? '<span class="placeholder-icon">📝</span>' : ''}
                </div>
                <div class="card-content">
                    <div class="card-meta">
                        <span class="category">${article.category || '其他'}</span>
                        ${isRead ? '<span class="read-badge">已读</span>' : ''}
                    </div>
                    <h4 class="card-title">${this.escapeHtml(article.title)}</h4>
                    <p class="card-excerpt">${this.escapeHtml(article.excerpt || article.description || '').substring(0, 80)}...</p>
                    <div class="card-footer">
                        <span class="author">
                            <img src="${article.authorAvatar || '/images/default-avatar.png'}" alt="">
                            ${this.escapeHtml(article.author || '匿名')}
                        </span>
                        <span class="views">👁 ${this.formatNumber(article.views || 0)}</span>
                    </div>
                </div>
            </article>
        `;
    }

    /**
     * 渲染推荐区块
     */
    async renderRecommendationSection(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const type = options.type || 'personalized';
        const limit = options.limit || 6;

        container.innerHTML = '<div class="recommendation-loading">加载中...</div>';

        let articles = [];
        let title = '';

        switch (type) {
            case 'personalized':
                articles = await this.engine.getPersonalizedRecommendations({ limit });
                title = '为你推荐';
                break;
            case 'related':
                if (!options.articleId) return;
                articles = await this.engine.getRelatedArticles(options.articleId, limit);
                title = '相关文章';
                break;
            case 'trending':
                articles = await this.engine.getTrendingArticles('week', limit);
                title = '热门文章';
                break;
            case 'latest':
                articles = await this.engine.getLatestArticles(limit);
                title = '最新文章';
                break;
            case 'continue':
                articles = await this.engine.getContinueReading(limit);
                title = '继续阅读';
                break;
        }

        if (articles.length === 0) {
            container.innerHTML = '<div class="recommendation-empty">暂无推荐</div>';
            return;
        }

        container.innerHTML = `
            <div class="recommendation-section">
                <div class="section-header">
                    <h3>${title}</h3>
                    ${type === 'personalized' ? '<span class="refresh-btn" onclick="recommendationUI.refresh(\'' + containerId + '\')">🔄 换一批</span>' : ''}
                </div>
                <div class="recommendation-grid">
                    ${articles.map(a => this.renderRecommendationCard(a, type)).join('')}
                </div>
            </div>
        `;

        // 绑定点击事件
        container.querySelectorAll('.recommendation-card').forEach(card => {
            card.addEventListener('click', () => {
                const articleId = card.dataset.id;
                this.onArticleClick(articleId);
            });
        });
    }

    /**
     * 刷新推荐
     */
    async refresh(containerId) {
        // 清除缓存
        this.engine.cache.clear();
        this.renderRecommendationSection(containerId, { type: 'personalized' });
    }

    /**
     * 文章点击处理
     */
    onArticleClick(articleId) {
        // 记录点击
        this.engine.recordRead(articleId);
        // 跳转
        window.location.href = `/article.html?id=${articleId}`;
    }

    /**
     * 渲染搜索建议
     */
    async renderSearchSuggestions(containerId, query) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!query) {
            container.innerHTML = '';
            return;
        }

        const suggestions = await this.engine.getSearchSuggestions(query);

        if (suggestions.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = `
            <div class="search-suggestions">
                ${suggestions.map(s => `
                    <div class="suggestion-item" data-type="${s.type}">
                        <span class="suggestion-icon">${s.type === 'article' ? '📝' : s.type === 'tag' ? '🏷️' : '📁'}</span>
                        <span class="suggestion-text">${this.escapeHtml(s.title)}</span>
                    </div>
                `).join('')}
            </div>
        `;

        // 绑定点击
        container.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const type = item.dataset.type;
                const text = item.querySelector('.suggestion-text').textContent;
                this.onSuggestionClick(type, text);
            });
        });
    }

    onSuggestionClick(type, text) {
        if (type === 'article') {
            // 搜索文章
            window.location.href = `/search.html?q=${encodeURIComponent(text)}`;
        } else if (type === 'tag') {
            window.location.href = `/tags.html?tag=${encodeURIComponent(text)}`;
        } else {
            window.location.href = `/category.html?cat=${encodeURIComponent(text)}`;
        }
    }

    /**
     * 工具方法
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatNumber(num) {
        if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toString();
    }
}

// 初始化
let recommendationEngine, recommendationUI;

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.currentUser || null;
    recommendationEngine = new ArticleRecommendationEngine({ userId: currentUser?.id });
    recommendationUI = new RecommendationUI(recommendationEngine);
    window.recommendationEngine = recommendationEngine;
    window.recommendationUI = recommendationUI;

    // 页面滚动监听，记录阅读完成
    setupScrollTracking();
});

/**
     * 设置滚动追踪
     */
function setupScrollTracking() {
    let trackedArticles = new Set();

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const articleId = entry.target.dataset.articleId;
                if (articleId && !trackedArticles.has(articleId)) {
                    trackedArticles.add(articleId);
                    
                    // 记录阅读开始
                    if (window.recommendationEngine) {
                        window.recommendationEngine.recordRead(articleId, {
                            category: entry.target.dataset.category,
                            tags: entry.target.dataset.tags?.split(','),
                            author: entry.target.dataset.author
                        });
                    }
                }
            }
        });
    }, { threshold: 0.5 });

    // 观察文章元素
    document.querySelectorAll('[data-article-id]').forEach(el => observer.observe(el));
}

// 导出
window.ArticleRecommendationEngine = ArticleRecommendationEngine;
window.RecommendationUI = RecommendationUI;
