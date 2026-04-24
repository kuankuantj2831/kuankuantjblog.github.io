/**
 * 功能 42: 滚动进度存储
 * 记住用户上次阅读位置，下次打开自动滚动到该位置
 */
(function() {
    var key = 'scrollPos_' + location.pathname;
    var saved = parseInt(localStorage.getItem(key) || '0');
    if (saved > 200) {
        setTimeout(function() {
            window.scrollTo({ top: saved, behavior: 'smooth' });
        }, 500);
    }
    var ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(function() {
                localStorage.setItem(key, window.scrollY);
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
})();
