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
        try {
            if (!key) return null;
            const cached = this.cache.get(key);
            if (!cached) return null;
            
            // 检查是否过期
            if (Date.now() > cached.expiry) {
                try {
                    this.cache.delete(key);
                } catch (deleteError) {
                    console.warn('[ApiClient] 删除过期缓存失败:', deleteError);
                }
                return null;
            }
            
            return cached.data;
        } catch (error) {
            console.warn('[ApiClient] 读取缓存失败:', error);
            return null;
        }
    }

    /**
     * 设置缓存
     */
    setCache(key, data, ttl = this.defaultCacheTime) {
        try {
            if (!key) return;
            this.cache.set(key, {
                data,
                expiry: Date.now() + ttl
            });
        } catch (error) {
            console.warn('[ApiClient] 设置缓存失败:', error);
        }
    }

    /**
     * 清除缓存
     */
    clearCache(pattern = null) {
        try {
            if (!pattern) {
                this.cache.clear();
                return;
            }
            
            for (const key of this.cache.keys()) {
                try {
                    if (key.includes(pattern)) {
                        this.cache.delete(key);
                    }
                } catch (keyError) {
                    console.warn(`[ApiClient] 删除缓存键失败 [${key}]:`, keyError);
                }
            }
        } catch (error) {
            console.warn('[ApiClient] 清除缓存失败:', error);
        }
    }

    /**
     * 带重试的请求
     */
    async fetchWithRetry(url, options = {}, retryCount = 0) {
        try {
            const response = await fetch(url, options);
            
            // 如果服务器错误，尝试重试（最多重试3次）
            if (!response.ok && response.status >= 500 && retryCount < this.retryConfig.maxRetries) {
                const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, retryCount);
                console.log(`[ApiClient] 请求失败，${delay}ms后重试 (${retryCount + 1}/${this.retryConfig.maxRetries})`);
                await this.sleep(delay);
                return this.fetchWithRetry(url, options, retryCount + 1);
            }
            
            return response;
        } catch (error) {
            // 网络错误，尝试重试（最多重试3次）
            if (retryCount < this.retryConfig.maxRetries) {
                const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, retryCount);
                console.log(`[ApiClient] 网络错误，${delay}ms后重试 (${retryCount + 1}/${this.retryConfig.maxRetries})`);
                await this.sleep(delay);
                return this.fetchWithRetry(url, options, retryCount + 1);
            }
            // 重试次数耗尽，抛出错误
            console.error(`[ApiClient] 请求失败，已重试${this.retryConfig.maxRetries}次`, error);
            throw new Error(`请求失败，已重试${this.retryConfig.maxRetries}次`);
        }
    }

    /**
     * 主请求方法
     */
    async request(endpoint, options = {}) {
        try {
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
                try {
                    const cached = this.getFromCache(cacheKey);
                    if (cached) {
                        console.log(`[ApiClient] 缓存命中: ${endpoint}`);
                        return cached;
                    }
                } catch (cacheError) {
                    console.warn('[ApiClient] 缓存读取失败, 跳过缓存:', cacheError);
                }
            }

            // 2. 请求去重
            if (deduplicate) {
                try {
                    const pending = this.pendingRequests.get(cacheKey);
                    if (pending) {
                        console.log(`[ApiClient] 复用进行中的请求: ${endpoint}`);
                        return pending;
                    }
                } catch (dedupError) {
                    console.warn('[ApiClient] 去重检查失败:', dedupError);
                }
            }

            // 3. 创建请求
            const requestPromise = this.fetchWithRetry(url, fetchOptions)
                .then(async response => {
                    // 解析响应
                    let data;
                    try {
                        const contentType = response.headers.get('content-type');
                        if (contentType && contentType.includes('application/json')) {
                            data = await response.json();
                        } else {
                            data = await response.text();
                        }
                    } catch (parseError) {
                        console.error('[ApiClient] 响应解析失败:', parseError);
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}`);
                        }
                        return {};
                    }

                    // 如果不是成功响应，抛出错误
                    if (!response.ok) {
                        const errorMessage = (data && typeof data === 'object' && data.message) 
                            ? data.message 
                            : `HTTP ${response.status}`;
                        throw new Error(errorMessage);
                    }

                    // 缓存响应
                    if (cache && fetchOptions.method === 'GET') {
                        try {
                            this.setCache(cacheKey, data, cacheTime);
                        } catch (cacheError) {
                            console.warn('[ApiClient] 缓存设置失败:', cacheError);
                        }
                    }

                    return data;
                })
                .finally(() => {
                    // 清理进行中的请求
                    try {
                        this.pendingRequests.delete(cacheKey);
                    } catch (cleanupError) {
                        console.warn('[ApiClient] 清理进行中请求失败:', cleanupError);
                    }
                });

            // 4. 记录进行中的请求
            if (deduplicate) {
                try {
                    this.pendingRequests.set(cacheKey, requestPromise);
                } catch (setError) {
                    console.warn('[ApiClient] 设置进行中请求失败:', setError);
                }
            }

            return requestPromise;
        } catch (error) {
            // 确保在请求执行失败时清理进行中的请求
            if (deduplicate) {
                try {
                    this.pendingRequests.delete(cacheKey);
                } catch (cleanupError) {
                    console.warn('[ApiClient] 清理进行中请求失败:', cleanupError);
                }
            }
            console.error('[ApiClient] 请求执行失败:', error);
            throw error;
        }
    }

    /**
     * GET 请求
     */
    async get(endpoint, options = {}) {
        try {
            return await this.request(endpoint, { ...options, method: 'GET' });
        } catch (error) {
            console.error(`[ApiClient] GET 请求失败 [${endpoint}]:`, error);
            throw error;
        }
    }

    /**
     * POST 请求
     */
    async post(endpoint, body, options = {}) {
        try {
            return await this.request(endpoint, {
                ...options,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(options.headers || {})
                },
                body: JSON.stringify(body)
            });
        } catch (error) {
            console.error(`[ApiClient] POST 请求失败 [${endpoint}]:`, error);
            throw error;
        }
    }

    /**
     * PUT 请求
     */
    async put(endpoint, body, options = {}) {
        try {
            return await this.request(endpoint, {
                ...options,
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(options.headers || {})
                },
                body: JSON.stringify(body)
            });
        } catch (error) {
            console.error(`[ApiClient] PUT 请求失败 [${endpoint}]:`, error);
            throw error;
        }
    }

    /**
     * DELETE 请求
     */
    async delete(endpoint, options = {}) {
        try {
            return await this.request(endpoint, { ...options, method: 'DELETE' });
        } catch (error) {
            console.error(`[ApiClient] DELETE 请求失败 [${endpoint}]:`, error);
            throw error;
        }
    }

    /**
     * 批量请求
     */
    async batch(requests) {
        try {
            return await Promise.all(
                requests.map(req => 
                    this.request(req.endpoint, req.options || {}).catch(error => {
                        console.warn(`[ApiClient] 批量请求单个失败:`, error);
                        return { error: error.message, success: false };
                    })
                )
            );
        } catch (error) {
            console.error('[ApiClient] 批量请求失败:', error);
            throw error;
        }
    }

    /**
     * 预加载数据
     */
    preload(endpoints) {
        try {
            if (!Array.isArray(endpoints) || endpoints.length === 0) {
                return;
            }
            console.log('[ApiClient] 预加载数据:', endpoints);
            endpoints.forEach(endpoint => {
                try {
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
                } catch (e) {
                    console.warn(`[ApiClient] 预加载失败 [${endpoint}]:`, e);
                }
            });
        } catch (e) {
            console.warn('[ApiClient] 预加载初始化失败:', e);
        }
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
