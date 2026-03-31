/**
 * 数据预加载模块
 * 智能预加载用户可能访问的数据
 */

import { apiClient } from './api-client.js';

class DataPreloader {
    constructor() {
        this.preloadQueue = new Set();
        this.isPreloading = false;
        this.preloadDelay = 2000; // 2秒后开始预加载
        this.hasInitialized = false; // 防止重复初始化
    }

    /**
     * 初始化预加载
     */
    init() {
        // 防止重复初始化
        if (this.hasInitialized) return;
        this.hasInitialized = true;

        // 页面加载完成后开始预加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.startPreloading());
        } else {
            this.startPreloading();
        }

        // 监听鼠标悬停，预加载可能点击的链接
        this.setupHoverPreload();
        
        // 监听滚动，预加载即将进入视口的内容
        this.setupScrollPreload();
    }

    /**
     * 开始预加载
     */
    startPreloading() {
        setTimeout(() => {
            this.preloadCriticalData();
        }, this.preloadDelay);
    }

    /**
     * 预加载关键数据
     */
    preloadCriticalData() {
        // 根据当前页面决定预加载什么
        const path = window.location.pathname;

        // 首页 - 预加载文章列表
        if (path === '/' || path === '/index.html' || path === '/index-chinese.html') {
            this.queuePreload('/articles?page=1&limit=10', 'articles');
            this.queuePreload('/articles/meta/tags', 'tags');
            this.queuePreload('/articles/meta/categories', 'categories');
        }

        // 文章页 - 预加载评论和相关文章
        else if (path === '/article.html' || path.startsWith('/article')) {
            const urlParams = new URLSearchParams(window.location.search);
            const articleId = urlParams.get('id');
            if (articleId) {
                this.queuePreload(`/articles/${articleId}/comments`, 'comments');
                this.queuePreload('/articles?limit=5', 'related');
            }
        }

        // 硬币页面 - 预加载排行榜和签到状态
        else if (path === '/coins.html') {
            this.queuePreload('/coins/leaderboard', 'leaderboard');
            this.queuePreload('/coins/calendar', 'calendar');
        }

        // 用户资料页 - 预加载收藏和历史
        else if (path === '/profile.html') {
            this.queuePreload('/favorites', 'favorites');
        }

        // 执行预加载
        this.executePreload();
    }

    /**
     * 添加预加载任务到队列
     */
    queuePreload(endpoint, type) {
        this.preloadQueue.add({ endpoint, type });
    }

    /**
     * 执行预加载
     */
    async executePreload() {
        if (this.isPreloading || this.preloadQueue.size === 0) return;

        this.isPreloading = true;
        console.log(`[DataPreloader] 开始预加载 ${this.preloadQueue.size} 个资源`);

        // 使用 requestIdleCallback 在空闲时预加载
        const preloadBatch = async () => {
            const batch = Array.from(this.preloadQueue).slice(0, 3); // 每次最多3个
            
            if (batch.length === 0) {
                this.isPreloading = false;
                return;
            }

            await Promise.all(
                batch.map(async ({ endpoint, type }) => {
                    try {
                        await apiClient.get(endpoint, { cache: true });
                        console.log(`[DataPreloader] 预加载成功: ${type}`);
                    } catch (error) {
                        console.warn(`[DataPreloader] 预加载失败: ${type}`, error.message);
                    }
                    this.preloadQueue.delete({ endpoint, type });
                })
            );

            // 继续下一批
            if (this.preloadQueue.size > 0) {
                if (window.requestIdleCallback) {
                    requestIdleCallback(() => preloadBatch());
                } else {
                    setTimeout(preloadBatch, 100);
                }
            } else {
                this.isPreloading = false;
            }
        };

        preloadBatch();
    }

    /**
     * 设置悬停预加载
     */
    setupHoverPreload() {
        let hoverTimeout;

        document.addEventListener('mouseover', (e) => {
            const link = e.target.closest('a[href*="article.html?id="]');
            if (!link) return;

            clearTimeout(hoverTimeout);
            hoverTimeout = setTimeout(() => {
                const url = new URL(link.href);
                const articleId = url.searchParams.get('id');
                if (articleId) {
                    // 预加载文章详情
                    apiClient.get(`/articles/${articleId}`, { cache: true }).catch(() => {});
                }
            }, 200); // 悬停200ms后预加载
        });
    }

    /**
     * 设置滚动预加载
     */
    setupScrollPreload() {
        let scrollTimeout;
        let lastScrollY = window.scrollY;

        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            
            scrollTimeout = setTimeout(() => {
                const scrollDirection = window.scrollY > lastScrollY ? 'down' : 'up';
                lastScrollY = window.scrollY;

                // 检测即将进入视口的元素
                const lazyElements = document.querySelectorAll('[data-preload]');
                lazyElements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    const isNearViewport = rect.top < window.innerHeight + 500;
                    
                    if (isNearViewport) {
                        const endpoint = el.dataset.preload;
                        if (endpoint) {
                            apiClient.get(endpoint, { cache: true }).catch(() => {});
                        }
                    }
                });
            }, 150);
        }, { passive: true });
    }

    /**
     * 手动触发预加载
     */
    preloadNow(endpoints) {
        endpoints.forEach(endpoint => {
            apiClient.get(endpoint, { cache: true }).catch(() => {});
        });
    }
}

// 创建单例
const dataPreloader = new DataPreloader();

export { dataPreloader, DataPreloader };
export default dataPreloader;
