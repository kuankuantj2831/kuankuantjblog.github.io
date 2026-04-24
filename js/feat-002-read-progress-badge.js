/**
 * 功能 2: 阅读进度百分比显示
 * 在页面右下角显示当前阅读进度百分比
 */
(function() {
    var badge = document.createElement('div');
    badge.id = 'readProgressBadge';
    Object.assign(badge.style, {
        position: 'fixed', bottom: '80px', right: '20px', width: '48px', height: '48px',
        borderRadius: '50%', background: 'rgba(102,126,234,0.9)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', fontWeight: '700', zIndex: '9990', opacity: '0',
        transition: 'opacity 0.3s', pointerEvents: 'none', backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 15px rgba(102,126,234,0.4)'
    });
    document.body.appendChild(badge);

    var ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(function() {
                var h = document.documentElement.scrollHeight - window.innerHeight;
                var pct = h > 0 ? Math.round((window.scrollY / h) * 100) : 0;
                badge.textContent = pct + '%';
                badge.style.opacity = window.scrollY > 100 ? '1' : '0';
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
})();
