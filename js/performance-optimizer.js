/**
 * 性能优化核心模块
 * 提供加载优化、资源管理、性能监控功能
 */

const PerformanceOptimizer = {
    config: {
        enableConsole: true,
        enableMetrics: true,
        lazyLoadImages: true,
        prefetchLinks: true,
        memoryLimit: 50 * 1024 * 1024
    },

    metrics: {
        fcp: null,
        lcp: null,
        cls: null,
        ttfb: null,
        loadTime: null
    },

    init() {

this.initResourceHints();
        this.initLazyLoading();
        this.initPerformanceObserver();
        this.initMemoryMonitor();
        this.logPerformance();
    },

    initResourceHints() {
        if (!this.config.prefetchLinks) return;

        const dnsDomains = [
            'fonts.googleapis.com',
            'fonts.gstatic.com',
            'cdnjs.cloudflare.com',
            'cdn.bootcdn.net'
        ];

        dnsDomains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'dns-prefetch';
            link.href = `//${domain}`;
            document.head.appendChild(link);
        });

        const preconnectDomains = [
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://cdnjs.cloudflare.com'
        ];

        preconnectDomains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = domain;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
    },

    initLazyLoading() {
        if (!this.config.lazyLoadImages) return;

        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px',
                threshold: 0.01
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });

            window.LazyImageObserver = imageObserver;
        } else {
            this.fallbackLazyLoad();
        }
    },

    loadImage(img) {
        const src = img.getAttribute('data-src');
        const srcset = img.getAttribute('data-srcset');
        
        if (src) {
            img.src = src;
            img.removeAttribute('data-src');
        }
        
        if (srcset) {
            img.srcset = srcset;
            img.removeAttribute('data-srcset');
        }
    },

    fallbackLazyLoad() {
        document.querySelectorAll('img[data-src]').forEach(img => {
            this.loadImage(img);
        });
    },

    initPerformanceObserver() {
        if (!window.PerformanceObserver) return;

        try {
            const fcpObserver = = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.name === 'first-contentful-paint') {
                        this.metrics.fcp = entry.startTime;
                        this.logMetric('FCP', entry.startTime);
                    }
                }
            });
            fcpObserver.observe({ entryTypes: ['paint'] });
        } catch (e) {}

        try {
            const lcpObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.metrics.lcp = entry.startTime;
                    this.logMetric('LCP', entry.startTime);
                }
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {}

        try {
            const clsObserver = new PerformanceObserver((list) => {
                let clsScore = 0;
                for (const entry of list.getEntries()) {
                    clsScore += entry.value;
                }
                this.metrics.cls = clsScore;
                this.logMetric('CLS', clsScore);
            });
            clsObserver.observe({ entryTypes: ['layout-shift'], buffered: true });
        } catch (e) {}

        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
            this.metrics.ttfb = perfData.responseStart - perfData.requestStart;
            this.logMetric('TTFB', this.metrics.ttfb);
        }
    },

    initMemoryMonitor() {
        if (!('memory' in performance)) return;

        setInterval(() => {
            const mem = performance.memory;
            if (mem && mem.usedJSHeapSize > this.config.memoryLimit) {
                this.triggerMemoryCleanup();
            }
        }, 5000);
    },

    triggerMemoryCleanup() {
        if (window.gc && typeof window.gc === 'function') {
            window.gc();
        }
        
        if (window.ModuleLoader && window.ModuleLoader.clearCache) {
            window.ModuleLoader.clearCache();
        }
    },

    logMetric(name, value) {
        if (!this.config.enableMetrics) return;

        if (this.config.enableConsole) {
            const colors = {
                FCP: '\x1b[32m',
                LCP: '\x1b[36m',
                CLS: '\x1b[33m',
                TTFB: '\x1b[35m',
                LoadTime: '\x1b[34m'
            };

            const color = colors[name] || '';
            console.log(`${color}[Perf] ${name}: ${Math.round(value)}ms\x1b[0m`);
        }
    },

    logPerformance() {
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            if (perfData) {
                const loadTime = perfData.loadEventEnd - perfData.startTime;
                this.metrics.loadTime = loadTime;
                this.logMetric('LoadTime', loadTime);
            }

            this.generatePerformanceReport();
        });
    },

    generatePerformanceReport() {
        if (!this.config.enableConsole) return;

        setTimeout(() => {
            console.group('%c性能报告', 'color: #667eea; font-size: 16px; font-weight: bold');
            
            if (this.metrics.fcp !== null) {
                const fcpStatus = this.metrics.fcp < 1800 ? '✅' : '⚠️';
                console.log(`${fcpStatus} FCP (首次内容绘制): ${Math.round(this.metrics.fcp)}ms`);
            }
            
            if (this.metrics.lcp !== null) {
                const lcpStatus = this.metrics.lcp < 2500 ? '✅' : '⚠️';
                console.log(`${lcpStatus} LCP (最大内容绘制): ${Math.round(this.metrics.lcp)}ms`);
            }
            
            if (this.metrics.cls !== null) {
                const clsStatus = this.metrics.cls < 0.1 ? '✅' : '⚠️';
                console.log(`${clsStatus} CLS (累积布局偏移): ${this.metrics.cls.toFixed(3)}`);
            }
            
            if (this.metrics.ttfb !== null) {
                const ttfbStatus = this.metrics.ttfb < 600 ? '✅' : '⚠️';
                console.log(`${ttfbStatus} TTFB (首字节时间): ${Math.round(this.metrics.ttfb)}ms`);
            }
            
            if (this.metrics.loadTime !== null) {
                const loadStatus = this.metrics.loadTime < 3000 ? '✅' : '⚠️';
                console.log(`${loadStatus} 页面加载时间: ${Math.round(this.metrics.loadTime)}ms`);
            }

            console.groupEnd();

            this.sendMetricsToAnalytics();
        }, 1000);
    },

    sendMetricsToAnalytics() {
        try {
            const metrics = {
                fcp: this.metrics.fcp,
                lcp: this.metrics.lcp,
                cls: this.metrics.cls,
                ttfb: this.metrics.ttfb,
                loadTime: this.metrics.loadTime,
                timestamp: Date.now(),
                url: window.location.href
            };

            localStorage.setItem('perf_metrics_' + Date.now(), JSON.stringify(metrics));
        } catch (e) {
            console.warn('无法保存性能指标:', e);
        }
    },

    optimizeCriticalResources() {
        const criticalCSS = document.querySelectorAll('link[rel="stylesheet"]');
        criticalCSS.forEach(link => {
            if (!link.getAttribute('data-critical')) {
                link.setAttribute('data-defer', 'true');
            }
        });
    },

    createScriptLoader() {
        return {
            load(src, options = {}) {
                return new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = src;
                    
                    if (options.defer) script.defer = true;
                    if (options.async) script.async = true;
                    if (options.crossOrigin) script.crossOrigin = options.crossOrigin;
                    
                    script.onload = () => resolve(script);
                    script.onerror = () => reject(new Error(`Failed to load ${src}`));
                    
                    if (options.position === 'head') {
                        document.head.appendChild(script);
                    } else {
                        document.body.appendChild(script);
                    }
                });
            }
        };
    },

    getPerformanceScore() {
        let score = 100;
        
        if (this.metrics.fcp > 1800) score -= 10;
        if (this.metrics.lcp > 2500) score -= 15;
        if (this.metrics.cls > 0.1) score -= 15;
        if (this.metrics.ttfb > 600) score -= 10;
        if (this.metrics.loadTime > 3000) score -= 15;
        if (this.metrics.loadTime > 5000) score -= 15;

        return Math.max(0, score);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PerformanceOptimizer.init());
} else {
    PerformanceOptimizer.init();
}

window.PerformanceOptimizer = PerformanceOptimizer;
