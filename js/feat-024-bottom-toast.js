/**
 * 功能 24: 滚动到底部提示
 * 滚动到页面底部时显示"已到底部"提示
 */
(function() {
    var shown = false;
    window.addEventListener('scroll', function() {
        var atBottom = (window.innerHeight + window.scrollY) >= (document.body.scrollHeight - 100);
        if (atBottom && !shown) {
            shown = true;
            var toast = document.createElement('div');
            Object.assign(toast.style, {
                position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%) translateY(20px)',
                background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '10px 24px',
                borderRadius: '25px', fontSize: '13px', zIndex: '99999', opacity: '0',
                transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)', backdropFilter: 'blur(8px)'
            });
            toast.textContent = '—— 已经到底啦 ——';
            document.body.appendChild(toast);
            requestAnimationFrame(function() {
                toast.style.opacity = '1';
                toast.style.transform = 'translateX(-50%) translateY(0)';
            });
            setTimeout(function() {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(-50%) translateY(20px)';
                setTimeout(function() { toast.remove(); shown = false; }, 400);
            }, 2000);
        } else if (!atBottom) {
            shown = false;
        }
    }, { passive: true });
})();
