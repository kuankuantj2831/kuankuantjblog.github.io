/**
 * 内容投币推荐机制
 * 基于硬币数量、浏览量、点赞数等计算文章热度，推荐热门内容
 */

const ContentRecommendation = {
    STORAGE_KEY: 'article_hot_scores',
    
    // 热度计算权重
    WEIGHTS: {
        COIN: 10,      // 1个硬币 = 10分
        LIKE: 3,       // 1个点赞 = 3分
        VIEW: 0.1,     // 1次浏览 = 0.1分
        COMMENT: 5,    // 1条评论 = 5分
        FAVORITE: 8,   // 1次收藏 = 8分
        TIME_DECAY: 0.95 // 时间衰减因子（每天）
    },

    /**
     * 计算文章热度分数
     * @param {Object} article - 文章数据
     * @param {number} article.coins - 硬币数
     * @param {number} article.likes - 点赞数
     * @param {number} article.views - 浏览量
     * @param {number} article.comments - 评论数
     * @param {number} article.favorites - 收藏数
     * @param {string} article.createdAt - 发布时间
     */
    calculateHotScore(article) {
        const coins = article.coins || 0;
        const likes = article.likes || 0;
        const views = article.views || 0;
        const comments = article.comments || 0;
        const favorites = article.favorites || 0;
        
        // 基础分数
        let score = 0;
        score += coins * this.WEIGHTS.COIN;
        score += likes * this.WEIGHTS.LIKE;
        score += views * this.WEIGHTS.VIEW;
        score += comments * this.WEIGHTS.COMMENT;
        score += favorites * this.WEIGHTS.FAVORITE;
        
        // 时间衰减
        if (article.createdAt) {
            const daysSince = Math.floor((Date.now() - new Date(article.createdAt).getTime()) / 86400000);
            score *= Math.pow(this.WEIGHTS.TIME_DECAY, daysSince);
        }
        
        return Math.round(score);
    },

    /**
     * 获取文章热度数据
     */
    getHotScores() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    },

    /**
     * 保存热度数据
     */
    saveHotScore(articleId, score, articleInfo = {}) {
        const scores = this.getHotScores();
        scores[articleId] = {
            score: score,
            updatedAt: new Date().toISOString(),
            ...articleInfo
        };
        
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(scores));
        } catch (e) {
            console.error('保存热度数据失败:', e);
        }
    },

    /**
     * 获取热门文章排行
     * @param {number} limit - 返回数量
     * @param {string} timeRange - 时间范围：'day' | 'week' | 'month' | 'all'
     */
    getHotArticles(limit = 10, timeRange = 'week') {
        const scores = this.getHotScores();
        const now = new Date();
        
        // 验证并限制limit范围
        const safeLimit = Math.min(Math.max(1, parseInt(limit) || 10), 100);
        
        let filtered = Object.entries(scores).map(([id, data]) => ({
            id,
            ...data
        }));
        
        // 按时间过滤
        if (timeRange !== 'all') {
            const ranges = {
                day: 1,
                week: 7,
                month: 30
            };
            const days = ranges[timeRange] || 7;
            const cutoff = new Date(now.getTime() - days * 86400000);
            
            filtered = filtered.filter(item => {
                const itemDate = item.updatedAt || item.createdAt;
                try {
                    return itemDate && new Date(itemDate) > cutoff;
                } catch (e) {
                    return false;
                }
            });
        }
        
        // 按热度排序
        filtered.sort((a, b) => (b.score || 0) - (a.score || 0));
        
        return filtered.slice(0, safeLimit);
    },

    /**
     * 获取推荐文章（个性化）
     * 基于用户阅读历史推荐相似内容
     */
    getRecommendedArticles(userHistory = [], limit = 5) {
        const scores = this.getHotScores();
        
        // 验证并限制limit范围
        const safeLimit = Math.min(Math.max(1, parseInt(limit) || 5), 100);
        
        const allArticles = Object.entries(scores).map(([id, data]) => ({
            id,
            ...data
        }));
        
        // 排除已阅读的文章
        const readIds = userHistory.map(h => h.id).filter(Boolean);
        const unread = allArticles.filter(a => !readIds.includes(a.id));
        
        // 根据用户阅读历史找相似标签
        const userTags = this.extractUserTags(userHistory);
        
        // 计算每篇文章的推荐分数
        unread.forEach(article => {
            article.recommendScore = article.score || 0;
            
            // 标签匹配加分
            if (article.tags && Array.isArray(article.tags) && userTags.length > 0) {
                const matchCount = article.tags.filter(tag => userTags.includes(tag)).length;
                article.recommendScore += matchCount * 50;
            }
        });
        
        // 按推荐分数排序
        unread.sort((a, b) => b.recommendScore - a.recommendScore);
        
        return unread.slice(0, safeLimit);
    },

    /**
     * 提取用户感兴趣的标签
     */
    extractUserTags(history) {
        const tagCount = {};
        
        history.forEach(item => {
            if (item.tags) {
                item.tags.forEach(tag => {
                    tagCount[tag] = (tagCount[tag] || 0) + 1;
                });
            }
        });
        
        // 返回最常阅读的3个标签
        return Object.entries(tagCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([tag]) => tag);
    },

    /**
     * 获取趋势上升文章（今日 vs 昨日）
     */
    getTrendingArticles(limit = 5) {
        const scores = this.getHotScores();
        const yesterday = new Date(Date.now() - 86400000);
        
        const articles = Object.entries(scores).map(([id, data]) => ({
            id,
            ...data,
            trend: data.score - (data.yesterdayScore || 0)
        }));
        
        // 按趋势排序
        articles.sort((a, b) => b.trend - a.trend);
        
        return articles.slice(0, limit);
    },

    /**
     * 更新昨日分数（每天调用一次）
     */
    updateYesterdayScores() {
        const scores = this.getHotScores();
        
        Object.keys(scores).forEach(id => {
            scores[id].yesterdayScore = scores[id].score;
        });
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(scores));
    },

    /**
     * 渲染热门文章列表
     */
    renderHotArticles(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const limit = options.limit || 10;
        const timeRange = options.timeRange || 'week';
        const hotArticles = this.getHotArticles(limit, timeRange);
        
        if (hotArticles.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:20px;color:#999;">暂无热门文章</div>';
            return;
        }
        
        const html = hotArticles.map((article, index) => {
            const rank = index + 1;
            const rankColor = rank <= 3 ? ['#ff6b6b', '#ffa502', '#2ed573'][index] : '#999';
            
            return `
                <div style="
                    display: flex;
                    align-items: center;
                    padding: 12px;
                    border-bottom: 1px solid #f0f0f0;
                    transition: background 0.2s;
                    cursor: pointer;
                " onmouseover="this.style.background='#f9f9f9'" 
                   onmouseout="this.style.background='transparent'"
                   onclick="window.location.href='/article.html?id=${article.id}'">
                    <div style="
                        width: 28px;
                        height: 28px;
                        border-radius: 50%;
                        background: ${rankColor}15;
                        color: ${rankColor};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 14px;
                        margin-right: 12px;
                    ">${rank}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="
                            font-size: 14px;
                            color: #333;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            margin-bottom: 4px;
                        ">${this.escapeHtml(article.title || '无标题')}</div>
                        <div style="font-size: 12px; color: #999;">
                            <span style="color: #ff6b6b; font-weight: bold;">${Math.round(article.score || 0)}°</span> 热度
                            ${article.coins ? `· <span style="color: #ffa502;">🪙 ${article.coins}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
    },

    /**
     * 渲染推荐文章
     */
    renderRecommended(containerId, userHistory, limit = 5) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const recommended = this.getRecommendedArticles(userHistory, limit);
        
        if (recommended.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:20px;color:#999;">阅读更多文章获取个性化推荐</div>';
            return;
        }
        
        const html = recommended.map(article => `
            <div style="
                display: flex;
                align-items: center;
                padding: 15px;
                background: linear-gradient(135deg, #667eea08 0%, #764ba208 100%);
                border-radius: 10px;
                margin-bottom: 10px;
                cursor: pointer;
                transition: all 0.2s;
            " onmouseover="this.style.transform='translateX(5px)'" 
               onmouseout="this.style.transform='translateX(0)'"
               onclick="window.location.href='/article.html?id=${article.id}'">
                <div style="flex:1;">
                    <div style="font-size: 15px; color: #333; margin-bottom: 6px;">
                        ${this.escapeHtml(article.title || '无标题')}
                    </div>
                    <div style="font-size: 12px; color: #999;">
                        ${article.author ? `@${this.escapeHtml(article.author)} · ` : ''}
                        匹配度 ${Math.min(100, Math.round(article.recommendScore / 10))}%
                    </div>
                </div>
                <div style="margin-left: 15px; color: #667eea;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    },

    /**
     * 渲染排行榜组件（完整版）
     */
    renderRankingBoard(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div style="background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
                <div style="padding: 20px; border-bottom: 1px solid #f0f0f0;">
                    <h3 style="margin: 0; color: #333; display: flex; align-items: center;">
                        <span style="margin-right: 8px;">🔥</span>
                        热门文章榜
                    </h3>
                </div>
                <div style="display: flex; border-bottom: 1px solid #f0f0f0;">
                    <button class="rank-tab active" data-range="day" style="
                        flex: 1;
                        padding: 12px;
                        background: none;
                        border: none;
                        cursor: pointer;
                        font-size: 14px;
                        color: #667eea;
                        border-bottom: 2px solid #667eea;
                    ">今日</button>
                    <button class="rank-tab" data-range="week" style="
                        flex: 1;
                        padding: 12px;
                        background: none;
                        border: none;
                        cursor: pointer;
                        font-size: 14px;
                        color: #666;
                    ">本周</button>
                    <button class="rank-tab" data-range="month" style="
                        flex: 1;
                        padding: 12px;
                        background: none;
                        border: none;
                        cursor: pointer;
                        font-size: 14px;
                        color: #666;
                    ">本月</button>
                </div>
                <div id="rankingList" style="max-height: 400px; overflow-y: auto;"></div>
            </div>
        `;
        
        // 初始渲染
        this.renderHotArticles('rankingList', { limit: 10, timeRange: 'day' });
        
        // 切换标签
        const tabs = container.querySelectorAll('.rank-tab');
        tabs.forEach(tab => {
            tab.onclick = () => {
                tabs.forEach(t => {
                    t.style.color = '#666';
                    t.style.borderBottom = 'none';
                });
                tab.style.color = '#667eea';
                tab.style.borderBottom = '2px solid #667eea';
                
                const range = tab.dataset.range;
                this.renderHotArticles('rankingList', { limit: 10, timeRange: range });
            };
        });
    },

    /**
     * HTML转义
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * 从API加载文章数据并计算热度
     */
    async loadAndCalculateFromAPI() {
        try {
            const response = await fetch(`${window.API_BASE_URL || ''}/articles`);
            if (!response.ok) throw new Error('API Error');
            
            const articles = await response.json();
            
            articles.forEach(article => {
                const score = this.calculateHotScore(article);
                this.saveHotScore(article.id, score, {
                    title: article.title,
                    author: article.author,
                    tags: article.tags,
                    createdAt: article.created_at
                });
            });
            
            console.log('热度计算完成，已更新', articles.length, '篇文章');
        } catch (e) {
            console.error('加载文章数据失败:', e);
        }
    },

    /**
     * 初始化
     */
    init() {
        // 每天更新一次昨日分数
        const lastUpdate = localStorage.getItem('hot_score_last_update');
        const today = new Date().toDateString();
        
        if (lastUpdate !== today) {
            this.updateYesterdayScores();
            localStorage.setItem('hot_score_last_update', today);
        }
        
        // 尝试从API加载数据
        if (window.API_BASE_URL) {
            this.loadAndCalculateFromAPI();
        }
    }
};

// 导出到全局
window.ContentRecommendation = ContentRecommendation;

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    ContentRecommendation.init();
});
