/**
 * API 客户端优化模块
 * 提供缓存、去重、重试、批量请求等功能
 */

import { API_BASE_URL } from './api-config.js?v=20260419b';

class ApiClient {
    constructor() {
        // 内存缓存
        this.cache = new Map();
        // 正在进行的请求（用于去重）
        this.pendingRequests = new Map();
        // 默认缓存时间（5分钟）
        this.defaultCacheTime = 5 * 60 * 1000;
        // 重试配置
        this.retryConfig = {
            maxRetries: 3,
            retryDelay: 1000,
            backoffMultiplier: 2
        };
    }

    /**
     * 生成缓存键
     */
    generateCacheKey(url, options = {}) {
        const method = options.method || 'GET';
        const body = options.body ? JSON.stringify(options.body) : '';
        return `${method}:${url}:${body}`;
    }

    /**
     * 获取缓存数据
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        // 检查是否过期
        if (Date.now() > cached.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    /**
     * 设置缓存
     */
    setCache(key, data, ttl = this.defaultCacheTime) {
        this.cache.set(key, {
            data,
            expiry: Date.now() + ttl
        });
    }

    /**
     * 清除缓存
     */
    clearCache(pattern = null) {
        if (!pattern) {
            this.cache.clear();
            return;
        }
        
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * 带重试的请求
     */
    async fetchWithRetry(url, options = {}, retryCount = 0) {
        try {
            const response = await fetch(url, options);
            
            // 如果服务器错误，尝试重试
            if (!response.ok && response.status >= 500 && retryCount < this.retryConfig.maxRetries) {
                const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, retryCount);
                console.log(`[ApiClient] 请求失败，${delay}ms后重试 (${retryCount + 1}/${this.retryConfig.maxRetries})`);
                await this.sleep(delay);
                return this.fetchWithRetry(url, options, retryCount + 1);
            }
            
            return response;
        } catch (error) {
            // 网络错误，尝试重试
            if (retryCount < this.retryConfig.maxRetries) {
                const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, retryCount);
                console.log(`[ApiClient] 网络错误，${delay}ms后重试 (${retryCount + 1}/${this.retryConfig.maxRetries})`);
                await this.sleep(delay);
                return this.fetchWithRetry(url, options, retryCount + 1);
            }
            throw error;
        }
    }

    /**
     * 主请求方法
     */
    async request(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
        const { 
            cache = false, 
            cacheTime = this.defaultCacheTime,
            deduplicate = true,
            ...fetchOptions 
        } = options;

        const cacheKey = this.generateCacheKey(url, fetchOptions);

        // 1. 检查缓存
        if (cache && fetchOptions.method === 'GET') {
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                console.log(`[ApiClient] 缓存命中: ${endpoint}`);
                return cached;
            }
        }

        // 2. 请求去重
        if (deduplicate) {
            const pending = this.pendingRequests.get(cacheKey);
            if (pending) {
                console.log(`[ApiClient] 复用进行中的请求: ${endpoint}`);
                return pending;
            }
        }

        // 3. 创建请求
        const requestPromise = this.fetchWithRetry(url, fetchOptions)
            .then(async response => {
                // 解析响应
                let data;
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    data = await response.text();
                }

                // 如果不是成功响应，抛出错误
                if (!response.ok) {
                    throw new Error(data.message || `HTTP ${response.status}`);
                }

                // 缓存响应
                if (cache && fetchOptions.method === 'GET') {
                    this.setCache(cacheKey, data, cacheTime);
                }

                return data;
            })
            .finally(() => {
                // 清理进行中的请求
                this.pendingRequests.delete(cacheKey);
            });

        // 4. 记录进行中的请求
        if (deduplicate) {
            this.pendingRequests.set(cacheKey, requestPromise);
        }

        return requestPromise;
    }

    /**
     * GET 请求
     */
    get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    /**
     * POST 请求
     */
    post(endpoint, body, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: JSON.stringify(body)
        });
    }

    /**
     * PUT 请求
     */
    put(endpoint, body, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: JSON.stringify(body)
        });
    }

    /**
     * DELETE 请求
     */
    delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }

    /**
     * 批量请求
     */
    async batch(requests) {
        return Promise.all(
            requests.map(req => 
                this.request(req.endpoint, req.options || {})
            )
        );
    }

    /**
     * 预加载数据
     */
    preload(endpoints) {
        console.log('[ApiClient] 预加载数据:', endpoints);
        endpoints.forEach(endpoint => {
            // 使用 requestIdleCallback 在空闲时加载
            if (window.requestIdleCallback) {
                requestIdleCallback(() => {
                    this.get(endpoint, { cache: true }).catch(() => {});
                });
            } else {
                setTimeout(() => {
                    this.get(endpoint, { cache: true }).catch(() => {});
                }, 100);
            }
        });
    }

    /**
     * 工具方法：延时
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 获取缓存统计
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            pendingRequests: this.pendingRequests.size
        };
    }
}

// 创建单例实例
const apiClient = new ApiClient();

// 导出
export { apiClient, ApiClient };
export default apiClient;
