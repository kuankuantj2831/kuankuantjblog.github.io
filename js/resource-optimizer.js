/**
 * 资源优化器
 * 提供图片优化、代码压缩、缓存策略等功能
 */

const ResourceOptimizer = {
    config: {
        enableImageOptimization: true,
        enableCodeMinification: false,
        enableCaching: true,
        imageQuality: 0.85,
        lazyLoadThreshold: 100,
        cachePrefix: 'resource_cache_'
    },

    init() {
        this.initImageOptimization();
        this.initCodeOptimization();
        this.initCacheStrategy();
        this.initServiceWorkerSupport();
    },

    initImageOptimization() {
        if (!this.config.enableImageOptimization) return;

        this.setupLazyImages();
        this.setupResponsiveImages();
        this.setupImageCompression();
    },

    setupLazyImages() {
        if (!('IntersectionObserver' in window)) return;

        const lazyImageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadOptimizedImage(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: `${this.config.lazyLoadThreshold}px`
        });

        const lazyImages = document.querySelectorAll('img[data-src], img[data-lazy]');
        lazyImages.forEach(img => {
            lazyImageObserver.observe(img);
            this.addPlaceholder(img);
        });

        window.LazyImageObserver = lazyImageObserver;
    },

    addPlaceholder(img) {
        if (!img.hasAttribute('src')) {
            const width = img.getAttribute('width') || '100%';
            const height = img.getAttribute('height') || '200px';
            img.style.minHeight = height;
            img.style.backgroundColor = '#f0f0f0';
        }
    },

    loadOptimizedImage(img) {
        const src = img.getAttribute('data-src') || img.getAttribute('src');
        if (!src) return;

        const optimizedSrc = this.getOptimizedImageUrl(src);
        
        if (optimizedSrc !== src) {
            const tempImg = new Image();
            tempImg.onload = () => {
                img.src = optimizedSrc;
                img.classList.add('loaded');
                this.removePlaceholder(img);
            };
            tempImg.onerror = () => {
                img.src = src;
                img.classList.add('loaded');
                this.removePlaceholder(img);
            };
            tempImg.src = optimizedSrc;
        } else {
            img.src = src;
            img.classList.add('loaded');
            this.removePlaceholder(img);
        }
    },

    removePlaceholder(img) {
        img.style.minHeight = '';
        img.style.backgroundColor = '';
    },

    getOptimizedImageUrl(originalUrl) {
        try {
            const url = new URL(originalUrl, window.location.href);
            const searchParams = url.searchParams;

            const devicePixelRatio = window.devicePixelRatio || 1;
            const isHighDPI = devicePixelRatio > 1;

            if (isHighDPI && !searchParams.has('quality')) {
                searchParams.set('quality', 'high');
            }

            const screenWidth = window.screen.width;
            const isMobile = screenWidth < 768;

            if (isMobile && !searchParams.has('width')) {
                searchParams.set('width', '800');
            }

            url.search = searchParams.toString();
            return url.toString();
        } catch (e) {
            return originalUrl;
        }
    },

    setupResponsiveImages() {
        const images = document.querySelectorAll('img[responsive="true"]');
        images.forEach(img => {
            this.setupResponsiveImage(img);
        });
    },

    setupResponsiveImage(img) {
        const srcset = img.getAttribute('data-srcset');
        if (!srcset) return;

        const breakpoints = [
            { width: 320, suffix: '-320w' },
            { width: 480, suffix: '-480w' },
            { width: 640, suffix: '-640w' },
            { width: 800, suffix: '-800w' },
            { width: 1200, suffix: '-1200w' }
        ];

        const baseUrl = srcset.replace(/\.[^.]+$/, '');
        const extension = srcset.match(/\.[^.]+$/)[0];

        const srcsetDescription = breakpoints.map(breakpoint => {
            return `${baseUrl}${breakpoint.suffix}${extension} ${breakpoint.width}w`;
        }).join(', ');

        img.setAttribute('srcset', srcsetDescription);
    },

    setupImageCompression() {
        if (!HTMLCanvasElement.prototype.toBlob) return;

        document.addEventListener('click', (e) => {
            const img = e.target.closest('img[compress="true"]');
            if (img) {
                this.compressImage(img);
            }
        });
    },

    async compressImage(img) {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);

            canvas.toBlob((blob) => {
                const compressedSize = blob.size;
                const originalSize = img.src.length;
                const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);

                console.log(`图片压缩完成: 节省 ${savings}% (${(compressedSize/1024).toFixed(2)}KB)`);
            }, 'image/jpeg', this.config.imageQuality);

        } catch (e) {
            console.warn('图片压缩失败:', e);
        }
    },

    initCodeOptimization() {
        if (!this.config.enableCodeMinification) return;

        this.optimizeInlineScripts();
        this.optimizeInlineStyles();
    },

    optimizeInlineScripts() {
        const scripts = document.querySelectorAll('script[type="text/optimizable"]');
        scripts.forEach(script => {
            try {
                const code = script.textContent;
                const optimizedCode = this.minifyCode(code);
                script.textContent = optimizedCode;
                script.removeAttribute('type');
            } catch (e) {
                console.warn('脚本优化失败:', e);
            }
        });
    },

    optimizeInlineStyles() {
        const styles = document.querySelectorAll('style[type="text/optimizable"]');
        styles.forEach(style => {
            try {
                const css = style.textContent;
                const optimizedCss = this.minifyCss(css);
                style.textContent = optimizedCss;
                style.removeAttribute('type');
            } catch (e) {
                console.warn('样式优化失败:', e);
            }
        });
    },

    minifyCode(code) {
        return code
            .replace(/\s*\/\/.*$/gm, '')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\s+/g, ' ')
            .trim();
    },

    minifyCss(css) {
        return css
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\s+/g, ' ')
            .replace(/\s*([{}:;,])\s*/g, '$1')
            .trim();
    },

    initCacheStrategy() {
        if (!this.config.enableCaching) return;

        this.initLocalStorageCache();
        this.initSessionStorageCache();
        this.initMemoryCache();
    },

    initLocalStorageCache() {
        window.Cache = {
            set: (key, value, ttl = 3600000) => {
                try {
                    const item = {
                        value: value,
                        timestamp: Date.now(),
                        ttl: ttl
                    };
                    localStorage.setItem(
                        ResourceOptimizer.config.cachePrefix + key,
                        JSON.stringify(item)
                    );
                } catch (e) {
                    console.warn('LocalStorage 缓存失败:', e);
                }
            },

            get: (key) => {
                try {
                    const item = JSON.parse(
                        localStorage.getItem(ResourceOptimizer.config.cachePrefix + key)
                    );

                    if (!item) return null;

                    const now = Date.now();
                    const age = now - item.timestamp;

                    if (age > item.ttl) {
                        localStorage.removeItem(ResourceOptimizer.config.cachePrefix + key);
                        return null;
                    }

                    return item.value;
                } catch (e) {
                    console.warn('LocalStorage 读取失败:', e);
                    return null;
                }
            },

            remove: (key) => {
                try {
                    localStorage.removeItem(ResourceOptimizer.config.cachePrefix + key);
                } catch (e) {
                    console.warn('LocalStorage 删除失败:', e);
                }
            },

            clear: () => {
                try {
                    const keys = Object.keys(localStorage)
                        .filter(key => key.startsWith(ResourceOptimizer.config.cachePrefix));

                    keys.forEach(key => {
                        localStorage.removeItem(key);
                    });
                } catch (e) {
                    console.warn('LocalStorage 清除失败:', e);
                }
            },

            size: () => {
                try {
                    const keys = Object.keys(localStorage)
                        .filter(key => key.startsWith(ResourceOptimizer.config.cachePrefix));
                    return keys.length;
                } catch (e) {
                    return 0;
                }
            }
        };
    },

    initSessionStorageCache() {
        window.SessionCache = {
            set: (key, value) => {
                try {
                    sessionStorage.setItem(
                        ResourceOptimizer.config.cachePrefix + key,
                        JSON.stringify(value)
                    );
                } catch (e) {
                    console.warn('SessionStorage 缓存失败:', e);
                }
            },

            get: (key) => {
                try {
                    const value = sessionStorage.getItem(
                        ResourceOptimizer.config.cachePrefix + key
                    );
                    return value ? JSON.parse(value) : null;
                } catch (e) {
                    console.warn('SessionStorage 读取失败:', e);
                    return null;
                }
            },

            remove: (key) => {
                try {
                    sessionStorage.removeItem(ResourceOptimizer.config.cachePrefix + key);
                } catch (e) {
                    console.warn('SessionStorage 删除失败:', e);
                }
            },

            clear: () => {
                try {
                    const keys = Object.keys(sessionStorage)
                        .filter(key => key.startsWith(ResourceOptimizer.config.cachePrefix));

                    keys.forEach(key => {
                        sessionStorage.removeItem(key);
                    });
                } catch (e) {
                    console.warn('SessionStorage 清除失败:', e);
                }
            }
        };
    },

    initMemoryCache() {
        window.MemoryCache = {
            cache: new Map(),
            maxSize: 100,

            set: (key, value) => {
                if (window.MemoryCache.cache.size >= window.MemoryCache.maxSize) {
                    const firstKey = window.MemoryCache.cache.keys().next().value;
                    window.MemoryCache.cache.delete(firstKey);
                }
                window.MemoryCache.cache.set(key, {
                    value: value,
                    timestamp: Date.now()
                });
            },

            get: (key) => {
                const item = window.MemoryCache.cache.get(key);
                return item ? item.value : null;
            },

            has: (key) => {
                return window.MemoryCache.cache.has(key);
            },

            delete: (key) => {
                window.MemoryCache.cache.delete(key);
            },

            clear: () => {
                window.MemoryCache.cache.clear();
            },

            size: () => {
                return window.MemoryCache.cache.size;
            }
        };
    },

    initServiceWorkerSupport() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker 注册成功');
                    
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                this.showUpdateAvailable();
                            }
                        });
                    });
                })
                .catch(error => {
                    console.log('Service Worker 注册失败:', error);
                });
        }
    },

    showUpdateAvailable() {
        const updateNotification = document.createElement('div');
        updateNotification.className = 'update-notification';
        updateNotification.innerHTML = `
            <div class="update-content">
                <span class="update-icon">🔄</span>
                <span class="update-text">有新版本可用</span>
                <button class="update-btn">更新</button>
                <button class="dismiss-btn">稍后</button>
            </div>
        `;

        updateNotification.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #fff;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 9999;
            animation: slideDown 0.3s ease;
        `;

        const updateBtn = updateNotification.querySelector('.update-btn');
        const dismissBtn = updateNotification.querySelector('.dismiss-btn');

        updateBtn.addEventListener('click', () => {
            window.location.reload();
        });

        dismissBtn.addEventListener('click', () => {
            updateNotification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => {
                updateNotification.remove();
            }, 300);
        });

        document.body.appendChild(updateNotification);
    },

    async fetchWithCache(url, options = {}) {
        const cacheKey = 'fetch_' + btoa(url);

        if (options.cache !== false) {
            const cached = window.Cache.get(cacheKey);
            if (cached) {
                console.log('使用缓存数据:', url);
                return cached;
            }
        }

        try {
            const response = await fetch(url, options);
            const data = await response.clone().json();

            if (options.cache !== false && response.ok) {
                window.Cache.set(cacheKey, data, options.ttl || 300000);
            }

            return data;
        } catch (e) {
            const cached = window.Cache.get(cacheKey);
            if (cached) {
                console.warn('请求失败，使用缓存:', url);
                return cached;
            }
            throw e;
        }
    },

    preloadResources(resources) {
        if (!Array.isArray(resources)) {
            resources = [resources];
        }

        resources.forEach(resource => {
            this.preloadResource(resource);
        });
    },

    preloadResource(resource) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource.url;

        if (resource.type) {
            link.setAttribute('as', resource.type);
        }

        if (resource.crossorigin) {
            link.setAttribute('crossorigin', 'anonymous');
        }

        document.head.appendChild(link);
    },

    optimizeDOM() {
        this.removeEmptyElements();
        this.mergeAdjacentTextNodes();
        this.minifyAttributeValues();
    },

    removeEmptyElements() {
        const emptyElements = document.querySelectorAll('p:empty, div:empty, span:empty');
        emptyElements.forEach(el => {
            if (!el.hasAttributes()) {
                el.remove();
            }
        });
    },

    mergeAdjacentTextNodes() {
        const textNodes = document.querySelectorAll('body *:not(script):not(style)');
        textNodes.forEach(el => {
            let child = el.firstChild;
            while (child) {
                if (child.nodeType === Node.TEXT_NODE) {
                    let nextSibling = child.nextSibling;
                    while (nextSibling && nextSibling.nodeType === Node.TEXT_NODE) {
                        child.textContent += nextSibling.textContent;
                        el.removeChild(nextSibling);
                        nextSibling = child.nextSibling;
                    }
                }
                child = child.nextSibling;
            }
        });
    },

    minifyAttributeValues() {
        const elements = document.querySelectorAll('[class*="  "], [style*="  "]');
        elements.forEach(el => {
            const className = el.getAttribute('class');
            if (className) {
                const optimizedClass = className.replace(/\s+/g, ' ').trim();
                el.setAttribute('class', optimizedClass);
            }

            const style = el.getAttribute('style');
            if (style) {
                const optimizedStyle = this.minifyCss(style);
                el.setAttribute('style', optimizedStyle);
            }
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ResourceOptimizer.init());
} else {
    Resource ResourceOptimizer.init();
}

window.ResourceOptimizer = ResourceOptimizer;
