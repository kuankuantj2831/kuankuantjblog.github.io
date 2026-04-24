/**
 * 功能 37: 页面打印优化
 * 打印时自动隐藏导航、侧边栏等非内容元素
 */
(function() {
    var style = document.createElement('style');
    style.textContent = '@media print{nav,.top-nav,.sidebar,.footer,footer,.scroll-progress,.cursor-glow,.music-player-container,#darkModeQuickToggle,#readProgressBadge,.back-to-top,[id*="modal"]{display:none!important}.article-content,.post-content,article{width:100%!important;max-width:100%!important;margin:0!important;padding:20px!important}body{background:#fff!important;color:#000!important;font-size:12pt!important}a{color:#000!important;text-decoration:underline!important}a::after{content:" ("attr(href)")";font-size:9pt;color:#666}}';
    document.head.appendChild(style);
})();
