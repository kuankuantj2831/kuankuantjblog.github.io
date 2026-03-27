/**
 * 性能监控模块
 * 监控 API 请求性能、页面加载时间、缓存命中率等
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            apiRequests: [],
            cacheHits: 0,
            cacheMisses: 0,
            errors: [],
            pageLoadTime: 0
        };
        this.maxRecords = 100;
        this.enabled = true;
    }

    /**
     * 记录 API 请求
     */
    recordApiRequest(endpoint, duration, success, cached = false) {
        if (!this.enabled) return;

        const record = {
            endpoint,
            duration,
            success,
            cached,
            timestamp: Date.now()
        };

        this.metrics.apiRequests.unshift(record);
        
        // 限制记录数量
        if (this.metrics.apiRequests.length > this.maxRecords) {
            this.metrics.apiRequests.pop();
        }

        // 更新缓存统计
        if (cached) {
            this.metrics.cacheHits++;
        } else if (success) {
            this.metrics.cacheMisses++;
        }

        // 慢请求警告
        if (duration > 1000) {
            console.warn(`[PerformanceMonitor] 慢请求: ${endpoint} 耗时 ${duration}ms`);
        }
    }

    /**
     * 记录错误
     */
    recordError(error, context = '') {
        if (!this.enabled) return;

        this.metrics.errors.unshift({
            message: error.message,
            stack: error.stack,
            context,
            timestamp: Date.now()
        });

        // 限制错误记录数量
        if (this.metrics.errors.length > 50) {
            this.metrics.errors.pop();
        }
    }

    /**
     * 测量函数执行时间
     */
    async measure(fn, name) {
        const start = performance.now();
        try {
            const result = await fn();
            const duration = Math.round(performance.now() - start);
            this.recordApiRequest(name, duration, true);
            return result;
        } catch (error) {
            const duration = Math.round(performance.now() - start);
            this.recordApiRequest(name, duration, false);
            this.recordError(error, name);
            throw error;
        }
    }

    /**
     * 获取统计信息
     */
    getStats() {
        const requests = this.metrics.apiRequests;
        const total = requests.length;
        
        if (total === 0) {
            return {
                totalRequests: 0,
                avgResponseTime: 0,
                successRate: 0,
                cacheHitRate: 0,
                slowRequests: 0
            };
        }

        const successful = requests.filter(r => r.success).length;
        const cached = requests.filter(r => r.cached).length;
        const avgTime = requests.reduce((sum, r) => sum + r.duration, 0) / total;
        const slowRequests = requests.filter(r => r.duration > 1000).length;

        return {
            totalRequests: total,
            avgResponseTime: Math.round(avgTime),
            successRate: Math.round((successful / total) * 100),
            cacheHitRate: Math.round((cached / total) * 100),
            slowRequests,
            recentErrors: this.metrics.errors.slice(0, 5)
        };
    }

    /**
     * 打印性能报告
     */
    printReport() {
        const stats = this.getStats();
        console.log('=== API 性能报告 ===');
        console.log(`总请求数: ${stats.totalRequests}`);
        console.log(`平均响应时间: ${stats.avgResponseTime}ms`);
        console.log(`成功率: ${stats.successRate}%`);
        console.log(`缓存命中率: ${stats.cacheHitRate}%`);
        console.log(`慢请求数: ${stats.slowRequests}`);
        
        if (stats.recentErrors.length > 0) {
            console.log('近期错误:');
            stats.recentErrors.forEach(e => console.log(`  - ${e.context}: ${e.message}`));
        }
    }

    /**
     * 导出性能数据
     */
    export() {
        return JSON.stringify(this.metrics, null, 2);
    }

    /**
     * 清除数据
     */
    clear() {
        this.metrics = {
            apiRequests: [],
            cacheHits: 0,
            cacheMisses: 0,
            errors: [],
            pageLoadTime: 0
        };
    }
}

// 创建单例
const perfMonitor = new PerformanceMonitor();

// 页面加载完成后自动记录
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const timing = performance.timing;
            const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
            perfMonitor.metrics.pageLoadTime = pageLoadTime;
            console.log(`[PerformanceMonitor] 页面加载时间: ${pageLoadTime}ms`);
        }, 0);
    });
}

export { perfMonitor, PerformanceMonitor };
export default perfMonitor;
