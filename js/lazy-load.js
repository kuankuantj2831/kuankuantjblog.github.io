/**
 * 图片懒加载
 * 图片进入视口才加载
 */
class LazyLoader {
    constructor(options = {}) {
        this.selector = options.selector || 'img[data-src], img[data-original]';
        this.placeholder = options.placeholder || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"%3E%3C/svg%3E';
        this.threshold = options.threshold || 0.1;
    }

    init() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        this.observer.unobserve(entry.target);
                    }
                });
            }, { rootMargin: '50px', threshold: this.threshold });
        }

        const images = document.querySelectorAll(this.selector);
        images.forEach(img => {
            if (this.observer) {
                this.observer.observe(img);
            } else {
                this.loadImage(img);
            }
        });

        // 处理没有 data-src 的普通 img
        document.querySelectorAll('img:not([data-src]):not([data-original])').forEach(img => {
            if (img.complete) return;
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.3s';
            img.onload = () => img.style.opacity = '1';
            img.onerror = () => img.style.opacity = '1';
        });
    }

    loadImage(img) {
        const src = img.getAttribute('data-src') || img.getAttribute('data-original');
        if (!src) return;

        img.style.opacity = '0';
        img.style.transition = 'opacity 0.4s ease';

        const newImg = new Image();
        newImg.onload = () => {
            img.src = src;
            img.removeAttribute('data-src');
            img.removeAttribute('data-original');
            requestAnimationFrame(() => {
                img.style.opacity = '1';
            });
        };
        newImg.onerror = () => {
            img.style.opacity = '1';
        };
        newImg.src = src;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const ll = new LazyLoader();
    ll.init();
});
export default LazyLoader;
