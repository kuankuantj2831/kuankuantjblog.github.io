/**
 * 功能 14: 平滑锚点滚动
 * 点击页内锚点链接时平滑滚动到目标位置
 */
(function() {
    document.addEventListener('click', function(e) {
        var link = e.target.closest('a[href^="#"]');
        if (!link) return;
        var id = link.getAttribute('href').slice(1);
        if (!id) return;
        var target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        var navHeight = 70;
        var top = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top: top, behavior: 'smooth' });
        history.pushState(null, '', '#' + id);
    });
})();
