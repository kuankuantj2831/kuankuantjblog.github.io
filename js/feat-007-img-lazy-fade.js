/**
 * 功能 7: 图片懒加载淡入
 * 图片进入视口时淡入显示
 */
(function() {
    var style = document.createElement('style');
    style.textContent = '.lazy-fade{opacity:0;transition:opacity 0.6s ease,transform 0.6s ease;transform:translateY(10px)}.lazy-fade.loaded{opacity:1;transform:translateY(0)}';
    document.head.appendChild(style);

    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                var img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    }, { rootMargin: '100px' });

    function init() {
        document.querySelectorAll('img:not(.lazy-fade)').forEach(function(img) {
            img.classList.add('lazy-fade');
            if (img.complete && img.naturalHeight > 0) {
                img.classList.add('loaded');
            } else {
                observer.observe(img);
                img.addEventListener('load', function() { img.classList.add('loaded'); });
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
