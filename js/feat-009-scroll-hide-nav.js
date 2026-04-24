/**
 * 功能 9: 滚动方向检测 - 自动隐藏/显示导航栏
 * 向下滚动时隐藏导航栏，向上滚动时显示
 */
(function() {
    var lastScroll = 0;
    var nav = null;
    var ticking = false;

    function getNav() {
        if (!nav) nav = document.querySelector('.top-nav, nav, header');
        return nav;
    }

    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(function() {
                var n = getNav();
                if (!n) { ticking = false; return; }
                var current = window.scrollY;
                if (current > lastScroll && current > 100) {
                    n.style.transform = 'translateY(-100%)';
                    n.style.transition = 'transform 0.35s cubic-bezier(0.4,0,0.2,1)';
                } else {
                    n.style.transform = 'translateY(0)';
                }
                lastScroll = current;
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
})();
