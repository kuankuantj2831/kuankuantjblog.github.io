/**
 * 功能 30: 页面加载进度条
 * 在页面顶部显示彩色加载进度条
 */
(function() {
    var bar = document.createElement('div');
    Object.assign(bar.style, {
        position: 'fixed', top: '0', left: '0', height: '3px', zIndex: '9999999',
        background: 'linear-gradient(90deg, #667eea, #764ba2, #f093fb)',
        transition: 'width 0.3s ease', width: '0%', borderRadius: '0 2px 2px 0'
    });
    document.body.appendChild(bar);

    var progress = 0;
    var timer = setInterval(function() {
        if (progress < 90) {
            progress += Math.random() * 15;
            bar.style.width = Math.min(progress, 90) + '%';
        }
    }, 200);

    window.addEventListener('load', function() {
        clearInterval(timer);
        bar.style.width = '100%';
        setTimeout(function() {
            bar.style.opacity = '0';
            bar.style.transition = 'width 0.3s, opacity 0.3s';
            setTimeout(function() { bar.remove(); }, 300);
        }, 300);
    });
})();
