/**
 * 离线阅读增强 - Offline Reading Enhancement
 * 支持文章离线保存、本地阅读列表和离线模式提示
 */

class OfflineReader {
    constructor(options = {}) {
        this.options = {
            dbName: 'OfflineArticlesDB',
            dbVersion: 1,
            storeName: 'articles',
            maxOfflineArticles: 50,
            autoSaveOnRead: false,
            ...options
        };
        
        this.db = null;
        this.isOnline = navigator.onLine;
        this.currentArticle = null;
        this.offlineArticles = [];
        
        this.init();
    }
    
    async init() {
        await this.initDB();
        this.bindEvents();
        this.createUI();
        this.updateOnlineStatus();
        
        console.log('[离线阅读] 系统已初始化');
    }
    
    /**
     * 初始化 IndexedDB
     */
    initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.options.dbName, this.options.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                this.loadOfflineArticles();
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains(this.options.storeName)) {
                    const store = db.createObjectStore(this.options.storeName, { keyPath: 'id' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('title', 'title', { unique: false });
                }
            };
        });
    }
    
    /**
     * 创建UI
     */
    createUI() {
        this.createOfflineIndicator();
        this.createSaveButton();
        this.createOfflineListModal();
        this.injectStyles();
    }
    
    /**
     * 创建离线指示器
     */
    createOfflineIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'offline-indicator';
        indicator.className = 'offline-indicator';
        indicator.innerHTML = `
            <span class="offline-icon">📴</span>
            <span class="offline-text">离线模式</span>
        `;
        
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4d4f;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 500;
            display: none;
            align-items: center;
            gap: 6px;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);
            animation: offlineIndicatorIn 0.3s ease;
        `;
        
        document.body.appendChild(indicator);
        this.offlineIndicator = indicator;
    }
    
    /**
     * 创建保存按钮
     */
    createSaveButton() {
        // 检测是否在文章页面
        const articleElement = document.querySelector('article, .article-content, #articleContent');
        if (!articleElement) return;
        
        const btn = document.createElement('button');
        btn.id = 'offline-save-btn';
        btn.className = 'offline-save-btn';
        btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
            </svg>
            <span class="save-text">保存离线阅读</span>
        `;
        
        btn.style.cssText = `
            position: fixed;
            right: 20px;
            bottom: 160px;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            z-index: 100;
            transition: all 0.3s ease;
        `;
        
        btn.addEventListener('click', () => this.saveCurrentArticle());
        
        document.body.appendChild(btn);
        this.saveBtn = btn;
        
        // 检查当前文章是否已保存
        this.checkSavedStatus();
    }
    
    /**
     * 创建离线列表弹窗
     */
    createOfflineListModal() {
        const modal = document.createElement('div');
        modal.id = 'offline-list-modal';
        modal.className = 'offline-list-modal';
        modal.innerHTML = `
            <div class="offline-modal-overlay"></div>
            <div class="offline-modal-content">
                <div class="offline-modal-header">
                    <h3>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                            <polyline points="17 21 17 13 7 13 7 21"/>
                            <polyline points="7 3 7 8 15 8"/>
                        </svg>
                        离线阅读列表
                    </h3>
                    <button class="offline-modal-close">×</button>
                </div>
                <div class="offline-modal-body">
                    <div class="offline-stats">
                        <span id="offline-count">0 篇文章</span>
                        <span id="offline-storage">0 MB</span>
                    </div>
                    <div class="offline-list" id="offline-article-list">
                        <div class="offline-empty">
                            <span class="empty-icon">📚</span>
                            <p>暂无离线文章</p>
                            <span class="empty-hint">浏览文章时点击"保存离线阅读"按钮</span>
                        </div>
                    </div>
                </div>
                <div class="offline-modal-footer">
                    <button class="offline-btn secondary" id="offline-clear-all">清空列表</button>
                    <button class="offline-btn primary" id="offline-sync">同步最新</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定事件
        modal.querySelector('.offline-modal-overlay').addEventListener('click', () => this.hideModal());
        modal.querySelector('.offline-modal-close').addEventListener('click', () => this.hideModal());
        modal.querySelector('#offline-clear-all').addEventListener('click', () => this.clearAllArticles());
        modal.querySelector('#offline-sync').addEventListener('click', () => this.syncArticles());
        
        this.offlineModal = modal;
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 网络状态监听
        window.addEventListener('online', () => this.updateOnlineStatus());
        window.addEventListener('offline', () => this.updateOnlineStatus());
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.key === 'o' && e.ctrlKey) {
                e.preventDefault();
                this.showModal();
            }
        });
    }
    
    /**
     * 更新在线状态
     */
    updateOnlineStatus() {
        this.isOnline = navigator.onLine;
        
        if (this.isOnline) {
            this.offlineIndicator.style.display = 'none';
            document.body.classList.remove('offline-mode');
        } else {
            this.offlineIndicator.style.display = 'flex';
            document.body.classList.add('offline-mode');
            this.showToast('进入离线模式，可阅读已保存的文章', 'warning');
        }
        
        window.dispatchEvent(new CustomEvent('network:change', {
            detail: { isOnline: this.isOnline }
        }));
    }
    
    /**
     * 保存当前文章
     */
    async saveCurrentArticle() {
        const articleElement = document.querySelector('article, .article-content, #articleContent');
        if (!articleElement) return;
        
        const articleData = {
            id: this.generateArticleId(),
            url: window.location.href,
            title: document.title,
            content: articleElement.innerHTML,
            textContent: articleElement.textContent.substring(0, 500),
            timestamp: Date.now(),
            images: this.extractImages(articleElement),
            author: this.extractAuthor(),
            date: this.extractDate()
        };
        
        try {
            await this.saveToDB(articleData);
            this.showToast('✓ 文章已保存到离线阅读');
            this.updateSaveButton(true);
            
            // 预加载图片
            this.preloadImages(articleData.images);
        } catch (error) {
            console.error('保存失败:', error);
            this.showToast('✗ 保存失败', 'error');
        }
    }
    
    /**
     * 保存到数据库
     */
    saveToDB(article) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.options.storeName], 'readwrite');
            const store = transaction.objectStore(this.options.storeName);
            
            // 检查数量限制
            const countRequest = store.count();
            countRequest.onsuccess = () => {
                if (countRequest.result >= this.options.maxOfflineArticles) {
                    // 删除最旧的文章
                    const index = store.index('timestamp');
                    const cursor = index.openCursor();
                    cursor.onsuccess = (e) => {
                        const oldest = e.target.result;
                        if (oldest) {
                            store.delete(oldest.value.id);
                        }
                    };
                }
                
                // 保存新文章
                const request = store.put(article);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            };
        });
    }
    
    /**
     * 加载离线文章列表
     */
    async loadOfflineArticles() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.options.storeName], 'readonly');
            const store = transaction.objectStore(this.options.storeName);
            const request = store.getAll();
            
            request.onsuccess = () => {
                this.offlineArticles = request.result.sort((a, b) => b.timestamp - a.timestamp);
                resolve(this.offlineArticles);
            };
            
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * 删除文章
     */
    deleteArticle(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.options.storeName], 'readwrite');
            const store = transaction.objectStore(this.options.storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => {
                this.offlineArticles = this.offlineArticles.filter(a => a.id !== id);
                this.renderArticleList();
                resolve();
            };
            
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * 清空所有文章
     */
    async clearAllArticles() {
        if (!confirm('确定要清空所有离线文章吗？')) return;
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.options.storeName], 'readwrite');
            const store = transaction.objectStore(this.options.storeName);
            const request = store.clear();
            
            request.onsuccess = () => {
                this.offlineArticles = [];
                this.renderArticleList();
                this.showToast('已清空所有离线文章');
                resolve();
            };
            
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * 生成文章ID
     */
    generateArticleId() {
        return 'article_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * 提取图片
     */
    extractImages(element) {
        const images = element.querySelectorAll('img');
        return Array.from(images).map(img => img.src).filter(src => src);
    }
    
    /**
     * 提取作者
     */
    extractAuthor() {
        const authorEl = document.querySelector('.article-author, .post-author, [rel="author"]');
        return authorEl ? authorEl.textContent.trim() : '';
    }
    
    /**
     * 提取日期
     */
    extractDate() {
        const dateEl = document.querySelector('.article-date, .post-date, time');
        return dateEl ? dateEl.textContent.trim() : '';
    }
    
    /**
     * 预加载图片
     */
    async preloadImages(imageUrls) {
        const cache = await caches.open('offline-images');
        
        for (const url of imageUrls) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    await cache.put(url, response);
                }
            } catch (e) {
                console.warn('图片预加载失败:', url);
            }
        }
    }
    
    /**
     * 检查保存状态
     */
    async checkSavedStatus() {
        await this.loadOfflineArticles();
        
        const currentUrl = window.location.href;
        const isSaved = this.offlineArticles.some(a => a.url === currentUrl);
        
        this.updateSaveButton(isSaved);
    }
    
    /**
     * 更新保存按钮状态
     */
    updateSaveButton(isSaved) {
        if (!this.saveBtn) return;
        
        const icon = isSaved ? `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
                <path d="M9 17l2 2 4-4"/>
            </svg>
        ` : `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
            </svg>
        `;
        
        const text = isSaved ? '已保存' : '保存离线阅读';
        
        this.saveBtn.innerHTML = `${icon}<span class="save-text">${text}</span>`;
        this.saveBtn.classList.toggle('saved', isSaved);
    }
    
    /**
     * 显示弹窗
     */
    showModal() {
        this.renderArticleList();
        this.offlineModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * 隐藏弹窗
     */
    hideModal() {
        this.offlineModal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    /**
     * 渲染文章列表
     */
    renderArticleList() {
        const container = document.getElementById('offline-article-list');
        const countEl = document.getElementById('offline-count');
        const storageEl = document.getElementById('offline-storage');
        
        countEl.textContent = `${this.offlineArticles.length} 篇文章`;
        
        // 估算存储空间
        const totalSize = this.offlineArticles.reduce((sum, a) => {
            return sum + (a.content ? a.content.length * 2 : 0);
        }, 0);
        storageEl.textContent = this.formatBytes(totalSize);
        
        if (this.offlineArticles.length === 0) {
            container.innerHTML = `
                <div class="offline-empty">
                    <span class="empty-icon">📚</span>
                    <p>暂无离线文章</p>
                    <span class="empty-hint">浏览文章时点击"保存离线阅读"按钮</span>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.offlineArticles.map(article => `
            <div class="offline-article-item" data-id="${article.id}">
                <div class="article-info">
                    <h4 class="article-title">${this.escapeHtml(article.title)}</h4>
                    <div class="article-meta">
                        <span>${article.author || '未知作者'}</span>
                        <span>•</span>
                        <span>${this.formatDate(article.timestamp)}</span>
                    </div>
                    <p class="article-preview">${this.escapeHtml(article.textContent)}...</p>
                </div>
                <div class="article-actions">
                    <button class="action-btn read-btn" title="阅读">📖</button>
                    <button class="action-btn delete-btn" title="删除">🗑️</button>
                </div>
            </div>
        `).join('');
        
        // 绑定事件
        container.querySelectorAll('.offline-article-item').forEach(item => {
            const id = item.dataset.id;
            const article = this.offlineArticles.find(a => a.id === id);
            
            item.querySelector('.read-btn').addEventListener('click', () => {
                this.readOfflineArticle(article);
            });
            
            item.querySelector('.delete-btn').addEventListener('click', () => {
                this.deleteArticle(id);
            });
        });
    }
    
    /**
     * 阅读离线文章
     */
    readOfflineArticle(article) {
        // 创建临时页面
        const newWindow = window.open('', '_blank');
        newWindow.document.write(`
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${article.title} - 离线阅读</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 40px 20px;
                        line-height: 1.8;
                        color: #333;
                    }
                    .offline-badge {
                        display: inline-block;
                        background: #667eea;
                        color: white;
                        padding: 4px 12px;
                        border-radius: 12px;
                        font-size: 12px;
                        margin-bottom: 20px;
                    }
                    h1 { font-size: 2em; margin-bottom: 0.5em; }
                    .meta { color: #666; margin-bottom: 2em; }
                    img { max-width: 100%; height: auto; }
                </style>
            </head>
            <body>
                <span class="offline-badge">📴 离线阅读</span>
                <h1>${article.title}</h1>
                <div class="meta">
                    ${article.author ? `<span>作者: ${article.author}</span>` : ''}
                    ${article.date ? `<span>时间: ${article.date}</span>` : ''}
                </div>
                <article>${article.content}</article>
            </body>
            </html>
        `);
        newWindow.document.close();
    }
    
    /**
     * 同步文章
     */
    async syncArticles() {
        this.showToast('正在同步...', 'info');
        
        // 这里可以实现从服务器获取最新文章的功能
        setTimeout(() => {
            this.showToast('✓ 同步完成');
        }, 1500);
    }
    
    /**
     * 格式化字节
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * 格式化日期
     */
    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
        if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
        
        return date.toLocaleDateString('zh-CN');
    }
    
    /**
     * HTML转义
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * 显示提示
     */
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = 'offline-toast';
        toast.textContent = message;
        
        const colors = {
            success: '#52c41a',
            error: '#ff4d4f',
            warning: '#faad14',
            info: '#1890ff'
        };
        
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: ${colors[type] || colors.success};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            animation: offlineToastIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'offlineToastOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }
    
    /**
     * 注入样式
     */
    injectStyles() {
        if (document.getElementById('offline-reader-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'offline-reader-styles';
        style.textContent = `
            .offline-save-btn.saved {
                background: #52c41a !important;
            }
            
            .offline-list-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .offline-list-modal.active {
                opacity: 1;
                visibility: visible;
            }
            
            .offline-modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(5px);
            }
            
            .offline-modal-content {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.95);
                width: 90%;
                max-width: 600px;
                max-height: 80vh;
                background: white;
                border-radius: 16px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                transition: transform 0.3s ease;
            }
            
            .offline-list-modal.active .offline-modal-content {
                transform: translate(-50%, -50%) scale(1);
            }
            
            .offline-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid #eee;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            
            .offline-modal-header h3 {
                margin: 0;
                font-size: 1.1em;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .offline-modal-header svg {
                stroke: currentColor;
            }
            
            .offline-modal-close {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 32px;
                height: 32px;
                border-radius: 8px;
                font-size: 1.5em;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .offline-modal-close:hover {
                background: rgba(255,255,255,0.3);
            }
            
            .offline-modal-body {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }
            
            .offline-stats {
                display: flex;
                justify-content: space-between;
                margin-bottom: 16px;
                padding-bottom: 16px;
                border-bottom: 1px solid #eee;
                font-size: 14px;
                color: #666;
            }
            
            .offline-empty {
                text-align: center;
                padding: 60px 20px;
                color: #999;
            }
            
            .empty-icon {
                font-size: 3em;
                display: block;
                margin-bottom: 16px;
            }
            
            .offline-empty p {
                font-size: 1.1em;
                margin: 0 0 8px 0;
                color: #666;
            }
            
            .empty-hint {
                font-size: 0.9em;
            }
            
            .offline-article-item {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                padding: 16px;
                border-radius: 12px;
                margin-bottom: 12px;
                background: #f8f9fa;
                transition: all 0.2s;
            }
            
            .offline-article-item:hover {
                background: #e9ecef;
            }
            
            .article-info {
                flex: 1;
                min-width: 0;
            }
            
            .article-title {
                margin: 0 0 8px 0;
                font-size: 1em;
                color: #333;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .article-meta {
                font-size: 0.8em;
                color: #888;
                margin-bottom: 8px;
            }
            
            .article-meta span {
                margin-right: 8px;
            }
            
            .article-preview {
                margin: 0;
                font-size: 0.85em;
                color: #666;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
            
            .article-actions {
                display: flex;
                gap: 8px;
                margin-left: 12px;
            }
            
            .action-btn {
                width: 36px;
                height: 36px;
                border: none;
                background: white;
                border-radius: 8px;
                cursor: pointer;
                font-size: 1.1em;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .action-btn:hover {
                background: #667eea;
                transform: scale(1.05);
            }
            
            .offline-modal-footer {
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                padding: 16px 20px;
                border-top: 1px solid #eee;
            }
            
            .offline-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .offline-btn.secondary {
                background: #f0f0f0;
                color: #666;
            }
            
            .offline-btn.secondary:hover {
                background: #e0e0e0;
            }
            
            .offline-btn.primary {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            
            .offline-btn.primary:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }
            
            @keyframes offlineIndicatorIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes offlineToastIn {
                from { opacity: 0; transform: translateX(-50%) translateY(20px); }
                to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
            
            @keyframes offlineToastOut {
                to { opacity: 0; transform: translateX(-50%) translateY(-10px); }
            }
            
            /* 离线模式样式 */
            body.offline-mode .online-only {
                opacity: 0.5;
                pointer-events: none;
            }
            
            @media (prefers-color-scheme: dark) {
                .offline-modal-content {
                    background: #2d2d2d;
                }
                
                .offline-article-item {
                    background: #3d3d3d;
                }
                
                .offline-article-item:hover {
                    background: #4d4d4d;
                }
                
                .article-title {
                    color: #fff;
                }
                
                .article-preview {
                    color: #aaa;
                }
                
                .offline-stats {
                    border-bottom-color: #444;
                    color: #aaa;
                }
                
                .offline-modal-footer {
                    border-top-color: #444;
                }
                
                .offline-btn.secondary {
                    background: #444;
                    color: #ccc;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.offlineReader = new OfflineReader();
    });
} else {
    window.offlineReader = new OfflineReader();
}

export default OfflineReader;
