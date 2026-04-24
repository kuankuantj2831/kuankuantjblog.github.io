/**
 * 功能 15: 外部链接标记
 * 自动为外部链接添加图标和 target="_blank"
 */
(function() {
    function init() {
        var host = location.hostname;
        document.querySelectorAll('a[href]').forEach(function(a) {
            var href = a.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('/') || href.startsWith('javascript')) return;
            try {
                var url = new URL(href, location.origin);
                if (url.hostname !== host && url.hostname !== '') {
                    a.setAttribute('target', '_blank');
                    a.setAttribute('rel', 'noopener noreferrer');
                    if (!a.querySelector('.ext-icon') && a.textContent.trim()) {
                        var icon = document.createElement('span');
                        icon.className = 'ext-icon';
                        icon.textContent = ' ↗';
                        icon.style.cssText = 'font-size:0.8em;opacity:0.6;';
                        a.appendChild(icon);
                    }
                }
            } catch(e) {}
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
