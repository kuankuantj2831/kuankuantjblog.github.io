/**
 * 全文搜索系统 - Full Text Search System
 * 支持本地索引、模糊匹配、搜索结果高亮
 */

class FullTextSearchEngine {
    constructor(options = {}) {
        this.options = {
            indexName: options.indexName || 'article_index',
            maxResults: options.maxResults || 20,
            minScore: options.minScore || 0.1,
            fuzzyDistance: options.fuzzyDistance || 2,
            highlightTags: options.highlightTags || ['<mark>', '</mark>'],
            ...options
        };
        
        this.index = null;
        this.documents = new Map();
        this.invertedIndex = new Map();
        this.documentCount = 0;
    }

    /**
     * 构建索引
     */
    async buildIndex(articles) {
        this.index = {
            documents: new Map(),
            terms: new Map(),
            documentCount: articles.length
        };

        articles.forEach(article => {
            const docId = article.id;
            const tokens = this.tokenize(article.title + ' ' + (article.content || '') + ' ' + (article.tags?.join(' ') || ''));
            const termFreq = new Map();

            tokens.forEach(token => {
                termFreq.set(token, (termFreq.get(token) || 0) + 1);
                
                // 构建倒排索引
                if (!this.index.terms.has(token)) {
                    this.index.terms.set(token, new Set());
                }
                this.index.terms.get(token).add(docId);
            });

            this.index.documents.set(docId, {
                ...article,
                tokens: tokens.length,
                termFreq,
                vector: this.calculateTFIDF(termFreq, articles.length)
            });
        });

        // 保存到本地存储
        this.saveIndex();
        
        return this.index;
    }

    /**
     * 分词
     */
    tokenize(text) {
        if (!text) return [];
        
        // 清理文本
        text = text.toLowerCase()
            .replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, ' ')  // 保留中文、英文、数字
            .replace(/\s+/g, ' ')
            .trim();

        const tokens = [];
        
        // 中文分词（简单实现：每个字和连续字）
        const chineseMatches = text.match(/[\u4e00-\u9fa5]+/g) || [];
        chineseMatches.forEach(match => {
            // 单字
            for (let char of match) {
                tokens.push(char);
            }
            // 双字词组
            for (let i = 0; i < match.length - 1; i++) {
                tokens.push(match.slice(i, i + 2));
            }
        });

        // 英文和数字
        const words = text.match(/[a-z0-9]+/g) || [];
        tokens.push(...words);

        return tokens;
    }

    /**
     * 计算 TF-IDF 向量
     */
    calculateTFIDF(termFreq, totalDocs) {
        const vector = new Map();
        
        termFreq.forEach((freq, term) => {
            const tf = freq / termFreq.size;
            const docFreq = this.index.terms.get(term)?.size || 1;
            const idf = Math.log(totalDocs / docFreq);
            vector.set(term, tf * idf);
        });

        return vector;
    }

    /**
     * 搜索
     */
    search(query, options = {}) {
        if (!this.index) {
            return { results: [], total: 0, time: 0 };
        }

        const startTime = performance.now();
        const tokens = this.tokenize(query);
        
        if (tokens.length === 0) {
            return { results: [], total: 0, time: 0 };
        }

        const scores = new Map();

        // 计算每个文档的得分
        tokens.forEach(token => {
            // 精确匹配
            const exactMatches = this.index.terms.get(token);
            if (exactMatches) {
                exactMatches.forEach(docId => {
                    const doc = this.index.documents.get(docId);
                    const tfidf = doc.vector.get(token) || 0;
                    const boost = this.calculateBoost(doc, token, query);
                    scores.set(docId, (scores.get(docId) || 0) + tfidf * boost + 1);
                });
            }

            // 模糊匹配
            if (options.fuzzy !== false) {
                this.index.terms.forEach((docIds, term) => {
                    if (term !== token && this.levenshteinDistance(term, token) <= this.options.fuzzyDistance) {
                        docIds.forEach(docId => {
                            scores.set(docId, (scores.get(docId) || 0) + 0.5);
                        });
                    }
                });
            }
        });

        // 排序并返回结果
        const results = Array.from(scores.entries())
            .filter(([_, score]) => score >= this.options.minScore)
            .sort((a, b) => b[1] - a[1])
            .slice(0, options.limit || this.options.maxResults)
            .map(([docId, score]) => {
                const doc = this.index.documents.get(docId);
                return {
                    ...doc,
                    score,
                    highlights: this.generateHighlights(doc, query)
                };
            });

        const searchTime = performance.now() - startTime;

        return {
            results,
            total: scores.size,
            time: Math.round(searchTime),
            query: tokens
        };
    }

    /**
     * 计算相关性加成
     */
    calculateBoost(doc, token, query) {
        let boost = 1;
        
        // 标题匹配加成
        if (doc.title?.toLowerCase().includes(token)) {
            boost *= 3;
        }
        
        // 标签匹配加成
        if (doc.tags?.some(tag => tag.toLowerCase().includes(token))) {
            boost *= 2;
        }
        
        // 完整查询匹配加成
        if (doc.title?.toLowerCase().includes(query.toLowerCase())) {
            boost *= 5;
        }

        return boost;
    }

    /**
     * 生成高亮片段
     */
    generateHighlights(doc, query) {
        const highlights = [];
        const content = doc.content || '';
        const queryLower = query.toLowerCase();
        const maxLength = 150;

        // 查找匹配位置
        let index = content.toLowerCase().indexOf(queryLower);
        if (index === -1) {
            // 如果没有完整匹配，尝试匹配单个词
            const tokens = this.tokenize(query);
            for (let token of tokens) {
                index = content.toLowerCase().indexOf(token);
                if (index !== -1) break;
            }
        }

        if (index !== -1) {
            // 提取上下文
            const start = Math.max(0, index - 50);
            const end = Math.min(content.length, index + query.length + 100);
            let snippet = content.slice(start, end);

            // 高亮
            const tokens = this.tokenize(query);
            tokens.forEach(token => {
                const regex = new RegExp(`(${this.escapeRegex(token)})`, 'gi');
                snippet = snippet.replace(regex, `${this.options.highlightTags[0]}$1${this.options.highlightTags[1]}`);
            });

            if (start > 0) snippet = '...' + snippet;
            if (end < content.length) snippet = snippet + '...';

            highlights.push(snippet);
        } else {
            // 返回开头
            highlights.push(content.slice(0, maxLength) + '...');
        }

        return highlights;
    }

    /**
     * 计算编辑距离（用于模糊匹配）
     */
    levenshteinDistance(a, b) {
        const matrix = [];

        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }

    /**
     * 自动补全建议
     */
    getSuggestions(prefix, limit = 5) {
        if (!this.index || !prefix) return [];

        const prefixLower = prefix.toLowerCase();
        const suggestions = [];

        this.index.terms.forEach((_, term) => {
            if (term.startsWith(prefixLower) && suggestions.length < limit) {
                suggestions.push(term);
            }
        });

        return suggestions;
    }

    /**
     * 热门搜索
     */
    getTrendingSearches(limit = 10) {
        const saved = localStorage.getItem('trending_searches');
        if (saved) {
            return JSON.parse(saved).slice(0, limit);
        }
        return ['Vue', 'React', 'JavaScript', 'CSS', 'Node.js'];
    }

    /**
     * 保存搜索历史
     */
    saveSearchHistory(query) {
        if (!query) return;

        let history = this.getSearchHistory();
        history = history.filter(h => h !== query);
        history.unshift(query);
        history = history.slice(0, 20);

        localStorage.setItem('search_history', JSON.stringify(history));
    }

    /**
     * 获取搜索历史
     */
    getSearchHistory() {
        const saved = localStorage.getItem('search_history');
        return saved ? JSON.parse(saved) : [];
    }

    /**
     * 清除搜索历史
     */
    clearSearchHistory() {
        localStorage.removeItem('search_history');
    }

    /**
     * 保存索引
     */
    saveIndex() {
        if (!this.index) return;

        const data = {
            terms: Array.from(this.index.terms.entries()).map(([k, v]) => [k, Array.from(v)]),
            documents: Array.from(this.index.documents.entries()),
            documentCount: this.index.documentCount,
            timestamp: Date.now()
        };

        try {
            localStorage.setItem(this.options.indexName, JSON.stringify(data));
        } catch (e) {
            console.warn('索引太大，无法保存到本地存储');
        }
    }

    /**
     * 加载索引
     */
    loadIndex() {
        const saved = localStorage.getItem(this.options.indexName);
        if (!saved) return false;

        try {
            const data = JSON.parse(saved);
            
            this.index = {
                terms: new Map(data.terms.map(([k, v]) => [k, new Set(v)])),
                documents: new Map(data.documents),
                documentCount: data.documentCount
            };

            return true;
        } catch (e) {
            console.error('加载索引失败:', e);
            return false;
        }
    }

    /**
     * 转义正则表达式
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * 增量更新索引
     */
    async updateIndex(article, operation = 'add') {
        if (!this.index) return;

        if (operation === 'delete') {
            this.index.documents.delete(article.id);
            this.index.terms.forEach((docIds, term) => {
                docIds.delete(article.id);
                if (docIds.size === 0) {
                    this.index.terms.delete(term);
                }
            });
        } else {
            // 删除旧的再添加新的
            if (this.index.documents.has(article.id)) {
                await this.updateIndex(article, 'delete');
            }

            const tokens = this.tokenize(article.title + ' ' + (article.content || ''));
            const termFreq = new Map();

            tokens.forEach(token => {
                termFreq.set(token, (termFreq.get(token) || 0) + 1);
                
                if (!this.index.terms.has(token)) {
                    this.index.terms.set(token, new Set());
                }
                this.index.terms.get(token).add(article.id);
            });

            this.index.documents.set(article.id, {
                ...article,
                tokens: tokens.length,
                termFreq,
                vector: this.calculateTFIDF(termFreq, this.index.documentCount + 1)
            });

            this.index.documentCount = this.index.documents.size;
        }

        this.saveIndex();
    }
}

/**
 * 搜索UI组件
 */
class SearchUI {
    constructor(searchEngine) {
        this.engine = searchEngine;
        this.debounceTimer = null;
        this.currentQuery = '';
    }

    /**
     * 渲染搜索框
     */
    renderSearchBox(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="search-box-container">
                <div class="search-input-wrapper">
                    <input 
                        type="text" 
                        id="searchInput" 
                        class="search-input" 
                        placeholder="搜索文章..."
                        autocomplete="off"
                    >
                    <button class="search-clear" id="searchClear" style="display:none">×</button>
                    <button class="search-submit">🔍</button>
                </div>
                <div class="search-suggestions" id="searchSuggestions" style="display:none"></div>
                <div class="search-results" id="searchResults"></div>
            </div>
        `;

        this.bindEvents();
        this.injectStyles();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        const input = document.getElementById('searchInput');
        const clearBtn = document.getElementById('searchClear');
        const suggestions = document.getElementById('searchSuggestions');

        // 输入处理
        input.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            clearBtn.style.display = query ? 'block' : 'none';
            
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                if (query.length >= 2) {
                    this.showSuggestions(query);
                } else {
                    suggestions.style.display = 'none';
                }
            }, 300);
        });

        // 回车搜索
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = input.value.trim();
                if (query) {
                    this.performSearch(query);
                    suggestions.style.display = 'none';
                }
            }
        });

        // 清除按钮
        clearBtn.addEventListener('click', () => {
            input.value = '';
            clearBtn.style.display = 'none';
            suggestions.style.display = 'none';
            document.getElementById('searchResults').innerHTML = '';
            input.focus();
        });

        // 点击外部关闭建议
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-box-container')) {
                suggestions.style.display = 'none';
            }
        });
    }

    /**
     * 显示搜索建议
     */
    showSuggestions(query) {
        const suggestions = document.getElementById('searchSuggestions');
        const history = this.engine.getSearchHistory();
        const trending = this.engine.getTrendingSearches(5);
        
        // 获取自动补全
        const completions = this.engine.getSuggestions(query, 5);

        let html = '';

        // 历史记录
        const relatedHistory = history.filter(h => h.includes(query));
        if (relatedHistory.length > 0) {
            html += `
                <div class="suggestion-group">
                    <div class="suggestion-title">历史搜索</div>
                    ${relatedHistory.slice(0, 3).map(h => `
                        <div class="suggestion-item" data-type="history" data-query="${h}">
                            <span class="suggestion-icon">🕐</span>
                            <span>${this.highlightMatch(h, query)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // 自动补全
        if (completions.length > 0) {
            html += `
                <div class="suggestion-group">
                    <div class="suggestion-title">搜索建议</div>
                    ${completions.map(c => `
                        <div class="suggestion-item" data-type="suggestion" data-query="${c}">
                            <span class="suggestion-icon">🔍</span>
                            <span>${this.highlightMatch(c, query)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        suggestions.innerHTML = html;
        suggestions.style.display = html ? 'block' : 'none';

        // 绑定点击
        suggestions.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const query = item.dataset.query;
                document.getElementById('searchInput').value = query;
                this.performSearch(query);
                suggestions.style.display = 'none';
            });
        });
    }

    /**
     * 高亮匹配
     */
    highlightMatch(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    }

    /**
     * 执行搜索
     */
    performSearch(query) {
        this.currentQuery = query;
        this.engine.saveSearchHistory(query);

        const resultsContainer = document.getElementById('searchResults');
        resultsContainer.innerHTML = '<div class="search-loading">搜索中...</div>';

        const result = this.engine.search(query);

        if (result.results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="search-empty">
                    <p>未找到与 "${query}" 相关的内容</p>
                    <p class="search-tips">
                        建议：<br>
                        • 检查拼写是否正确<br>
                        • 尝试使用更简单的关键词<br>
                        • 使用相关同义词
                    </p>
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = `
            <div class="search-stats">
                找到 ${result.total} 个结果 (${result.time}ms)
            </div>
            <div class="search-results-list">
                ${result.results.map(item => `
                    <article class="search-result-item" data-id="${item.id}">
                        <h4 class="result-title">
                            <a href="/article.html?id=${item.id}">${item.title}</a>
                        </h4>
                        <p class="result-excerpt">${item.highlights[0]}</p>
                        <div class="result-meta">
                            <span class="result-author">${item.author || '匿名'}</span>
                            <span class="result-date">${this.formatDate(item.createdAt)}</span>
                            ${item.tags?.map(tag => `<span class="result-tag">${tag}</span>`).join('') || ''}
                            <span class="result-score">匹配度: ${(item.score * 100).toFixed(0)}%</span>
                        </div>
                    </article>
                `).join('')}
            </div>
        `;

        // 绑定结果点击
        resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                window.location.href = `/article.html?id=${item.dataset.id}`;
            });
        });
    }

    /**
     * 渲染高级搜索
     */
    renderAdvancedSearch(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="advanced-search">
                <h4>高级搜索</h4>
                <div class="search-filters">
                    <div class="filter-group">
                        <label>分类</label>
                        <select id="filterCategory">
                            <option value="">全部分类</option>
                            <option value="tech">技术</option>
                            <option value="life">生活</option>
                            <option value="tutorial">教程</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>时间范围</label>
                        <select id="filterTime">
                            <option value="">全部时间</option>
                            <option value="day">最近一天</option>
                            <option value="week">最近一周</option>
                            <option value="month">最近一月</option>
                            <option value="year">最近一年</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>排序</label>
                        <select id="filterSort">
                            <option value="relevance">相关度</option>
                            <option value="date">发布时间</option>
                            <option value="views">浏览量</option>
                        </select>
                    </div>
                </div>
                <button class="btn-advanced-search" onclick="searchUI.performAdvancedSearch()">
                    搜索
                </button>
            </div>
        `;
    }

    /**
     * 执行高级搜索
     */
    performAdvancedSearch() {
        const query = document.getElementById('searchInput').value.trim();
        const category = document.getElementById('filterCategory').value;
        const timeRange = document.getElementById('filterTime').value;
        const sortBy = document.getElementById('filterSort').value;

        // 这里可以实现更复杂的过滤逻辑
        this.performSearch(query);
    }

    /**
     * 格式化日期
     */
    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;

        if (diff < 86400000) return '今天';
        if (diff < 172800000) return '昨天';
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
        
        return date.toLocaleDateString('zh-CN');
    }

    /**
     * 注入样式
     */
    injectStyles() {
        if (document.getElementById('search-ui-styles')) return;

        const styles = `
            <style id="search-ui-styles">
                .search-box-container {
                    position: relative;
                    max-width: 600px;
                    margin: 0 auto;
                }

                .search-input-wrapper {
                    display: flex;
                    align-items: center;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 25px;
                    padding: 4px;
                }

                .search-input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    padding: 10px 15px;
                    color: #fff;
                    font-size: 15px;
                    outline: none;
                }

                .search-input::placeholder {
                    color: #999;
                }

                .search-clear {
                    background: none;
                    border: none;
                    color: #999;
                    cursor: pointer;
                    font-size: 18px;
                    padding: 5px 10px;
                }

                .search-submit {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    border: none;
                    border-radius: 50%;
                    width: 36px;
                    height: 36px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .search-suggestions {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    margin-top: 8px;
                    background: #2d2d2d;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    z-index: 1000;
                    overflow: hidden;
                }

                .suggestion-group {
                    padding: 8px 0;
                }

                .suggestion-group + .suggestion-group {
                    border-top: 1px solid rgba(255,255,255,0.1);
                }

                .suggestion-title {
                    padding: 4px 16px;
                    font-size: 12px;
                    color: #999;
                    text-transform: uppercase;
                }

                .suggestion-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 16px;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .suggestion-item:hover {
                    background: rgba(255,255,255,0.05);
                }

                .suggestion-icon {
                    opacity: 0.5;
                }

                .search-results {
                    margin-top: 20px;
                }

                .search-stats {
                    color: #999;
                    font-size: 14px;
                    margin-bottom: 16px;
                }

                .search-result-item {
                    background: rgba(255,255,255,0.05);
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 16px;
                    cursor: pointer;
                    transition: transform 0.2s;
                }

                .search-result-item:hover {
                    transform: translateX(4px);
                }

                .result-title {
                    margin: 0 0 8px 0;
                }

                .result-title a {
                    color: #fff;
                    text-decoration: none;
                    font-size: 18px;
                }

                .result-title a:hover {
                    color: #667eea;
                }

                .result-excerpt {
                    color: #ccc;
                    font-size: 14px;
                    line-height: 1.6;
                    margin: 0 0 12px 0;
                }

                .result-excerpt mark {
                    background: rgba(102, 126, 234, 0.3);
                    color: #fff;
                    padding: 2px 4px;
                    border-radius: 3px;
                }

                .result-meta {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    font-size: 12px;
                    color: #999;
                }

                .result-tag {
                    background: rgba(102, 126, 234, 0.2);
                    color: #667eea;
                    padding: 2px 8px;
                    border-radius: 4px;
                }

                .search-empty {
                    text-align: center;
                    padding: 40px;
                    color: #999;
                }

                .search-tips {
                    font-size: 14px;
                    margin-top: 20px;
                    text-align: left;
                    display: inline-block;
                }

                .advanced-search {
                    background: rgba(255,255,255,0.05);
                    border-radius: 12px;
                    padding: 20px;
                    margin-top: 20px;
                }

                .search-filters {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 16px;
                    margin: 16px 0;
                }

                .filter-group label {
                    display: block;
                    color: #999;
                    font-size: 12px;
                    margin-bottom: 6px;
                }

                .filter-group select {
                    width: 100%;
                    padding: 8px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 6px;
                    color: #fff;
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// 导出
window.FullTextSearchEngine = FullTextSearchEngine;
window.SearchUI = SearchUI;

// 初始化
let searchEngine, searchUI;

document.addEventListener('DOMContentLoaded', () => {
    searchEngine = new FullTextSearchEngine();
    searchUI = new SearchUI(searchEngine);
    
    window.searchEngine = searchEngine;
    window.searchUI = searchUI;

    // 尝试加载已有索引
    searchEngine.loadIndex();
});
