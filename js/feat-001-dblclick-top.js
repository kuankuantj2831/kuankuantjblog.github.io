/**
 * 功能 1: 双击返回顶部
 * 双击页面空白区域快速返回顶部
 */
(function() {
    let lastClick = 0;
    document.addEventListener('dblclick', function(e) {
        if (e.target === document.body || e.target === document.documentElement || 
            e.target.classList.contains('chinese-style-wrapper')) {
            const now = Date.now();
            if (now - lastClick < 500) return;
            lastClick = now;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
})();
