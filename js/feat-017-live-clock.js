/**
 * 功能 17: 当前时间显示
 * 在页面角落显示实时时钟
 */
(function() {
    var clock = document.createElement('div');
    Object.assign(clock.style, {
        position: 'fixed', top: '70px', right: '20px', padding: '6px 14px',
        background: 'rgba(0,0,0,0.5)', color: '#fff', borderRadius: '20px',
        fontSize: '12px', fontFamily: 'monospace', zIndex: '9990', opacity: '0.6',
        backdropFilter: 'blur(8px)', pointerEvents: 'none', transition: 'opacity 0.3s'
    });
    document.body.appendChild(clock);

    function update() {
        var now = new Date();
        var h = String(now.getHours()).padStart(2, '0');
        var m = String(now.getMinutes()).padStart(2, '0');
        var s = String(now.getSeconds()).padStart(2, '0');
        clock.textContent = h + ':' + m + ':' + s;
    }
    update();
    setInterval(update, 1000);
})();
