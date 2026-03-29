/**
 * 文章浏览历史 / 阅读记录系统
 * 记录用户浏览过的文章，支持本地存储和云端同步
 */

const ReadingHistory = {
    STORAGE_KEY: 'reading_history',
    MAX_ITEMS: 100, // 最多保存100条记录

    /**
     * 获取浏览历史
     */
    getHistory() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('读取浏览历史失败:', e);
            return [];
        }
    },

    /**
     * 保存浏览历史
     */
    saveHistory(history) {
        try {
            // 限制数量
            if (history.length > this.MAX_ITEMS) {
                history = history.slice(0, this.MAX_ITEMS);
            }
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
        } catch (e) {
            console.error('保存浏览历史失败:', e);
        }
    },

    /**
     * 添加文章到浏览历史
     * @param {Object} article - 文章信息
     * @param {string} article.id - 文章ID
     * @param {string} article.title - 文章标题
     * @param {string} article.author - 作者名
     * @param {string} article.cover - 封面图
     */
    addRecord(article) {
        if (!article || !article.id) return;

        const history = this.getHistory();
        
        // 移除已存在的相同记录
        const filtered = history.filter(item => item.id !== article.id);
        
        // 添加到最前面
        const record = {
            id: article.id,
            title: article.title || '无标题',
            author: article.author || '匿名',
            cover: article.cover || '',
            readAt: new Date().toISOString(),
            readTime: Date.now()
        };
        
        filtered.unshift(record);
        this.saveHistory(filtered);
        
        // 触发事件
        window.dispatchEvent(new CustomEvent('readingHistoryUpdated', {
            detail: { record, history: filtered }
        }));
    },

    /**
     * 从当前页面添加浏览记录
     */
    addCurrentPage() {
        const articleTitle = document.querySelector('h1')?.textContent?.trim() || 
                            document.querySelector('.article-title')?.textContent?.trim() ||
                            document.title;
        
        const articleId = window.location.pathname.match(/\/([^\/]+)\/?$/)?.[1] || 
                         new URLSearchParams(window.location.search).get('id');
        
        if (articleId && articleTitle) {
            this.addRecord({
                id: articleId,
                title: articleTitle,
                author: document.querySelector('.author-name')?.textContent?.trim() || '未知作者',
                cover: document.querySelector('.article-cover')?.src || ''
            });
        }
    },

    /**
     * 删除单条记录
     */
    removeRecord(id) {
        const history = this.getHistory().filter(item => item.id !== id);
        this.saveHistory(history);
        return history;
    },

    /**
     * 清空浏览历史
     */
    clearHistory() {
        localStorage.removeItem(this.STORAGE_KEY);
        window.dispatchEvent(new CustomEvent('readingHistoryUpdated', {
            detail: { history: [] }
        }));
    },

    /**
     * 格式化时间
     */
    formatTime(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diff = now - date;
        
        // 小于1小时
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return minutes < 1 ? '刚刚' : `${minutes}分钟前`;
        }
        // 小于24小时
        if (diff < 86400000) {
            return `${Math.floor(diff / 3600000)}小时前`;
        }
        // 小于7天
        if (diff < 604800000) {
            return `${Math.floor(diff / 86400000)}天前`;
        }
        
        return date.toLocaleDateString('zh-CN');
    },

    /**
     * 渲染浏览历史列表
     * @param {string} containerId - 容器元素ID
     * @param {number} limit - 显示数量限制
     */
    renderHistory(containerId, limit = 10) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const history = this.getHistory().slice(0, limit);
        
        if (history.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:30px;color:#999;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:10px;opacity:0.5;">
                        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                    <p>暂无浏览记录</p>
                </div>
            `;
            return;
        }

        const html = history.map(item => `
            <div class="history-item" style="display:flex;align-items:center;padding:12px;border-bottom:1px solid #f0f0f0;transition:background 0.2s;cursor:pointer;" 
                 onmouseover="this.style.background='#f5f5f5'" 
                 onmouseout="this.style.background='transparent'"
                 onclick="window.location.href='/article.html?id=${item.id}'">
                ${item.cover ? `
                    <img src="${item.cover}" alt="" style="width:60px;height:45px;object-fit:cover;border-radius:4px;margin-right:12px;">
                ` : `
                    <div style="width:60px;height:45px;background:#e8e8e8;border-radius:4px;margin-right:12px;display:flex;align-items:center;justify-content:center;color:#999;font-size:12px;">
                        无图
                    </div>
                `}
                <div style="flex:1;min-width:0;">
                    <div style="font-size:14px;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:4px;">
                        ${this.escapeHtml(item.title)}
                    </div>
                    <div style="font-size:12px;color:#999;display:flex;justify-content:space-between;">
                        <span>${this.escapeHtml(item.author)}</span>
                        <span>${this.formatTime(item.readAt)}</span>
                    </div>
                </div>
                <button onclick="event.stopPropagation();ReadingHistory.removeRecord('${item.id}');ReadingHistory.renderHistory('${containerId}', ${limit});" 
                        style="background:none;border:none;color:#ccc;cursor:pointer;padding:5px;margin-left:8px;"
                        title="删除记录">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        `).join('');

        container.innerHTML = html;
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
     * 初始化 - 在文章页面自动记录
     */
    init() {
        // 延迟记录，确保页面内容已加载
        setTimeout(() => {
            this.addCurrentPage();
        }, 1000);

        // 监听历史更新事件
        window.addEventListener('readingHistoryUpdated', (e) => {
            console.log('浏览历史已更新:', e.detail);
        });
    }
};

// 导出到全局
window.ReadingHistory = ReadingHistory;

// 自动初始化（在文章页面）
if (document.querySelector('.article-container') || document.querySelector('article')) {
    document.addEventListener('DOMContentLoaded', () => {
        ReadingHistory.init();
    });
}
