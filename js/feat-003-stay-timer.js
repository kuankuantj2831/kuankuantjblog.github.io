/**
 * 功能 3: 页面停留时间统计
 * 在控制台和页面底部显示用户在当前页面的停留时间
 */
(function() {
    var start = Date.now();
    var el = document.createElement('div');
    Object.assign(el.style, {
        position: 'fixed', bottom: '10px', left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 14px',
        borderRadius: '20px', fontSize: '11px', zIndex: '9990', opacity: '0',
        transition: 'opacity 0.3s', pointerEvents: 'none', backdropFilter: 'blur(6px)'
    });
    document.body.appendChild(el);

    function fmt(s) {
        var m = Math.floor(s / 60), sec = s % 60;
        return m > 0 ? m + '分' + sec + '秒' : sec + '秒';
    }

    setInterval(function() {
        var sec = Math.floor((Date.now() - start) / 1000);
        el.textContent = '已阅读 ' + fmt(sec);
        el.style.opacity = sec > 5 ? '0.7' : '0';
    }, 1000);
})();
