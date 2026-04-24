/**
 * 功能 8: 快捷键导航
 * 支持键盘快捷键：H=首页, G=游戏, E=编辑器, P=个人中心, /=搜索
 */
(function() {
    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        var routes = {
            'h': '/index-chinese.html',
            'g': '/games.html',
            'e': '/editor.html',
            'p': '/profile.html',
            'c': '/coins.html',
            'm': '/messages.html',
            'd': '/drive.html'
        };

        var key = e.key.toLowerCase();
        if (routes[key]) {
            e.preventDefault();
            window.location.href = routes[key];
        } else if (key === '/') {
            e.preventDefault();
            var searchInput = document.querySelector('#searchInput, .search-input, [type="search"]');
            if (searchInput) searchInput.focus();
        }
    });
})();
