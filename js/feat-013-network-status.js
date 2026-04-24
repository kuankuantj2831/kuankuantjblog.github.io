/**
 * 功能 13: 网络状态检测
 * 检测网络断开/恢复并显示提示
 */
(function() {
    function showNetworkToast(msg, type) {
        var toast = document.createElement('div');
        Object.assign(toast.style, {
            position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%) translateY(-100px)',
            padding: '12px 24px', borderRadius: '12px', color: '#fff', fontSize: '14px',
            fontWeight: '500', zIndex: '999999', transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)',
            background: type === 'offline' ? 'rgba(239,68,68,0.9)' : 'rgba(16,185,129,0.9)'
        });
        toast.textContent = msg;
        document.body.appendChild(toast);
        requestAnimationFrame(function() { toast.style.transform = 'translateX(-50%) translateY(0)'; });
        setTimeout(function() {
            toast.style.transform = 'translateX(-50%) translateY(-100px)';
            setTimeout(function() { toast.remove(); }, 500);
        }, 3000);
    }

    window.addEventListener('offline', function() {
        showNetworkToast('⚠️ 网络已断开，部分功能可能不可用', 'offline');
    });
    window.addEventListener('online', function() {
        showNetworkToast('✅ 网络已恢复', 'online');
    });
})();
