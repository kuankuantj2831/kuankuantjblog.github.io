/**
 * 资源预加载器
 * 智能预加载用户可能需要的资源
 */

const ResourcePrefetcher = {
    prefetchQueue: [],
    prefetchCache: new Map(),
    isIdle: true,
    observer: null,

    init() {
        this.initIntersectionObserver();
        this.initHoverPrefetch();
        this.initViewportPrefetch();
        this.startPrefetchScheduler();
    },

    initIntersectionObserver() {
        if (!('IntersectionObserver' in window)) return;

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.prefetchLink(entry.target);
                }
            });
        }, {
            rootMargin: '100px'
        });
    },

    initHoverPrefetch() {
        let hoverTimer = null;
        let lastPrefetch = null;

        document.addEventListener('mouseover', (e) => {
            const link = e.target.closest('a[href], button[href]');
            if (!link) return;

            const url = link.getAttribute('href');
            if (!url || url.startsWith('#') || url.startsWith('javascript:')) return;

            if (lastPrefetch === url) return;

            if (hoverTimer) {
                clearTimeout(hoverTimer);
            }

            hoverTimer = setTimeout(() => {
                this.prefetchUrl(url);
                lastPrefetch = url;
            }, 100);
        });
    },

    initViewportPrefetch() {
        document.addEventListener('DOMContentLoaded', () => {
            this.prefetchCriticalResources();
        });
    },

    prefetchCriticalResources() {
        const criticalLinks = document.querySelectorAll('a[href^="/"]');
        criticalLinks.forEach((link, index) => {
            if (index < 3 && this.observer) {
                this.observer.observe(link);
            }
        });
    },

    prefetchUrl(url) {
        if (this.prefetchCache.has(url)) return;

        const prefetchType = this.determinePrefetchType(url);
        this.createPrefetchLink(url, prefetchType);
        this.prefetchCache.set(url, true);
    },

    prefetchLink(element) {
        const url = element.getAttribute('href');
        if (!url) return;

        this.prefetchUrl(url);

        if (this.observer) {
            this.observer.unobserve(element);
        }
    },

    determinePrefetchType(url) {
        if (url.match(/\.(css|js)$/i)) {
            return 'preload';
        }

        if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
            return 'preload';
        }

        if (url.match(/\.(woff|woff2|ttf|otf)$/i)) {
            return 'preload';
        }

        return 'prefetch';
    },

    createPrefetchLink(url, prefetchType) {
        const link = document.createElement('link');
        link.rel = prefetchType;
        link.href = url;

        if (prefetchType === 'preload') {
            const as = this.determineAsAttribute(url);
            if (as) {
                link.setAttribute('as', as);
            }
        }

        document.head.appendChild(link);
    },

    determineAsAttribute(url) {
        if (url.match(/\.(css)$/i)) {
            return 'style';
        }

        if (url.match(/\.(js)$/i)) {
            return 'script';
        }

        if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
            return 'image';
        }

        if (url.match(/\.(woff|woff2|ttf|otf)$/i)) {
            return 'font';
        }

        if (url.match(/\.(mp4|webm|ogg)$/i)) {
            return 'video';
        }

        if (url.match(/\.(mp3|wav|flac)$/i)) {
            return 'audio';
        }

        return null;
    },

    startPrefetchScheduler() {
        const schedulePrefetch = () => {
            if (!this.isIdle && this.prefetchQueue.length > 0) {
                const item = this.prefetchQueue.shift();
                this.executePrefetch(item);
            }
        };

        document.addEventListener('visibilitychange', () => {
            this.isIdle = document.hidden;
            if (!this.isIdle) {
                schedulePrefetch();
            }
        });

        window.addEventListener('requestIdle', () => {
            this.isIdle = true;
            schedulePrefetch();
        });
    },

    executePrefetch(item) {
        try {
            if (item.type === 'fetch') {
                fetch(item.url, { mode: 'no-cors' });
            } else {
                this.createPrefetchLink(item.url, item.type);
            }
        } catch (e) {
            console.warn('Prefetch failed:', item.url, e);
        }
    },

    prefetchPage(url) {
        if (this.prefetchCache.has(url)) return;

        this.prefetchQueue.push({
            url: url,
            type: 'fetch'
        });

        this.prefetchCache.set(url, true);
    },

    prefetchScript(url) {
        if (this.prefetchCache.has(url)) return;

        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        link.as = 'script';
        document.head.appendChild(link);

        this.prefetchCache.set(url, true);
    },

    prefetchStyle(url) {
        if (this.prefetchCache.has(url)) return;

        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        link.as = 'style';
        document.head.appendChild(link);

        this.prefetchCache.set(url, true);
    },

    prefetchImage(url) {
        if (this.prefetchCache.has(url)) return;

        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        link.as = 'image';
        document.head.appendChild(link);

        this.prefetchCache.set(url, true);
    },

    clearCache() {
        this.prefetchCache.clear();
        this.prefetchQueue = [];
    },

    getCacheSize() {
        return this.prefetchCache.size;
    },

    getQueueLength() {
        return this.prefetchQueue.length;
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ResourcePrefetcher.init());
} else {
    ResourcePrefetcher.init();
}

window.ResourcePrefetcher = ResourcePrefetcher;
