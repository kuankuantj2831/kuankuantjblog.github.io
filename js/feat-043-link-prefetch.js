/**
 * 功能 43: 链接预加载
 * 鼠标悬停在链接上时预加载目标页面
 */
(function() {
    var preloaded = new Set();
    document.addEventListener('mouseover', function(e) {
        var link = e.target.closest('a[href]');
        if (!link) return;
        var href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('javascript') || href.startsWith('http')) return;
        if (preloaded.has(href)) return;
        preloaded.add(href);
        var prefetch = document.createElement('link');
        prefetch.rel = 'prefetch';
        prefetch.href = href;
        document.head.appendChild(prefetch);
    });
})();
