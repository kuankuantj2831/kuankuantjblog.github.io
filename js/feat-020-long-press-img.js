/**
 * 功能 20: 长按图片保存提示
 * 移动端长按图片时显示保存提示
 */
(function() {
    var timer = null;
    document.addEventListener('touchstart', function(e) {
        if (e.target.tagName !== 'IMG') return;
        timer = setTimeout(function() {
            var toast = document.createElement('div');
            Object.assign(toast.style, {
                position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '10px 20px',
                borderRadius: '10px', fontSize: '13px', zIndex: '999999',
                animation: 'fadeInUp 0.3s ease'
            });
            toast.textContent = '💡 长按图片可保存到相册';
            document.body.appendChild(toast);
            setTimeout(function() { toast.remove(); }, 2000);
        }, 800);
    }, { passive: true });

    document.addEventListener('touchend', function() { clearTimeout(timer); }, { passive: true });
    document.addEventListener('touchmove', function() { clearTimeout(timer); }, { passive: true });
})();
