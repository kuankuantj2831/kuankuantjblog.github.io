/**
 * 功能 49: 页面加载时间显示
 * 在页面底部显示加载耗时
 */
(function() {
    window.addEventListener('load', function() {
        var loadTime = Math.round(performance.now());
        var el = document.createElement('div');
        Object.assign(el.style, {
            textAlign: 'center', padding: '8px', fontSize: '11px', color: '#999', opacity: '0.6'
        });
        el.textContent = '⚡ 页面加载耗时 ' + loadTime + 'ms';
        var footer = document.querySelector('footer');
        if (footer) footer.appendChild(el);
    });
})();
