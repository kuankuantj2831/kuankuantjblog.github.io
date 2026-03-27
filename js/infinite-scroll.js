/**
 * 无限滚动加载 - Infinite Scroll
 * 自动加载更多内容，无需翻页
 */

class InfiniteScroll {
    constructor(options = {}) {
        this.options = {
            container: '#articles-container, .article-list, .post-list',
            itemSelector: '.article-item, .post-item',
            loadingText: '加载中...',
            noMoreText: '没有更多了',
            errorText: '加载失败，点击重试',
            threshold: 100,
            debounceTime: 200,
            ...options
        };
        
        this.container = null;
        this.isLoading = false;
        this.hasMore = true;
        this.currentPage = 1;
        this.scrollHandler = null;
        this.loadingElement = null;
        
        this.init();
    }
    
    init() {
        this.container = document.querySelector(this.options.container);
        if (!this.container) {
            console.log('[无限滚动] 未找到容器元素');
            return;
        }
        
        this.createLoadingElement();
        this.bindScrollEvent();
        
        console.log('[无限滚动] 系统已初始化');
    }
    
    /**
     * 创建加载指示器
     */
    createLoadingElement() {
        this.loadingElement = document.createElement('div');
        this.loadingElement.className = 'infinite-loading';
        this.loadingElement.innerHTML = `
            <div class="loading-spinner"></div>
            <span class="loading-text">${this.options.loadingText}</span>
        `;
        this.loadingElement.style.cssText = `
            display: none;
            text-align: center;
            padding: 30px;
            color: #888;
        `;
        
        // 插入到容器后面
        this.container.parentNode.insertBefore(
            this.loadingElement, 
            this.container.nextSibling
        );
    }
    
    /**
     * 绑定滚动事件
     */
    bindScrollEvent() {
        let ticking = false;
        
        this.scrollHandler = () => {
            if (ticking) return;
            
            ticking = true;
            requestAnimationFrame(() => {
                this.checkScrollPosition();
                ticking = false;
            });
        };
        
        window.addEventListener('scroll', this.scrollHandler, { passive: true });
    }
    
    /**
     * 检查滚动位置
     */
    checkScrollPosition() {
        if (this.isLoading || !this.hasMore) return;
        
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        // 接近底部时触发加载
        if (scrollTop + windowHeight >= documentHeight - this.options.threshold) {
            this.loadMore();
        }
    }
    
    /**
     * 加载更多内容
     */
    async loadMore() {
        if (this.isLoading || !this.hasMore) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            // 触发加载事件，由外部处理具体加载逻辑
            const event = new CustomEvent('infinite:load', {
                detail: { page: this.currentPage + 1 }
            });
            window.dispatchEvent(event);
            
            // 模拟异步加载（实际使用时由事件处理器完成）
            await this.simulateLoad();
            
            this.currentPage++;
            this.isLoading = false;
            this.hideLoading();
            
        } catch (error) {
            console.error('[无限滚动] 加载失败:', error);
            this.showError();
            this.isLoading = false;
        }
    }
    
    /**
     * 模拟加载（示例）
     */
    simulateLoad() {
        return new Promise((resolve) => {
            setTimeout(() => {
                // 随机决定是否有更多数据
                if (this.currentPage >= 5) {
                    this.hasMore = false;
                    this.showNoMore();
                }
                resolve();
            }, 1000);
        });
    }
    
    /**
     * 添加新内容
     */
    appendContent(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        const items = tempDiv.querySelectorAll(this.options.itemSelector);
        items.forEach(item => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            this.container.appendChild(item);
            
            // 渐入动画
            requestAnimationFrame(() => {
                item.style.transition = 'all 0.3s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            });
        });
        
        return items.length;
    }
    
    /**
     * 显示加载中
     */
    showLoading() {
        this.loadingElement.style.display = 'block';
        this.loadingElement.innerHTML = `
            <div class="loading-spinner"></div>
            <span class="loading-text">${this.options.loadingText}</span>
        `;
    }
    
    /**
     * 隐藏加载中
     */
    hideLoading() {
        this.loadingElement.style.display = 'none';
    }
    
    /**
     * 显示没有更多
     */
    showNoMore() {
        this.loadingElement.style.display = 'block';
        this.loadingElement.innerHTML = `
            <span class="no-more-text">${this.options.noMoreText}</span>
        `;
        this.loadingElement.style.color = '#999';
    }
    
    /**
     * 显示错误
     */
    showError() {
        this.loadingElement.style.display = 'block';
        this.loadingElement.innerHTML = `
            <span class="error-text" style="cursor: pointer; color: #ff4d4f;">
                ${this.options.errorText}
            </span>
        `;
        this.loadingElement.querySelector('.error-text').addEventListener('click', () => {
            this.loadMore();
        });
    }
    
    /**
     * 重置
     */
    reset() {
        this.currentPage = 1;
        this.hasMore = true;
        this.isLoading = false;
        this.hideLoading();
    }
    
    /**
     * 销毁
     */
    destroy() {
        window.removeEventListener('scroll', this.scrollHandler);
        if (this.loadingElement) {
            this.loadingElement.remove();
        }
    }
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.infiniteScroll = new InfiniteScroll();
    });
} else {
    window.infiniteScroll = new InfiniteScroll();
}

export default InfiniteScroll;
