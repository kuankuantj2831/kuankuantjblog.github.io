/**
 * 背景图多源竞速加载器
 * 从多个 CDN 同时请求背景图，最快返回的生效
 */
(function () {
    var SOURCES = [
        // jsdelivr GitHub 加速
        'https://cdn.jsdelivr.net/gh/kuankuantj2831/kuankuantjblog.github.io@main/images/chinese-bg.webp',
        // 本站直连
        '/images/chinese-bg.webp',
        // npmmirror 静态资源（jsdelivr 国内镜像）
        'https://registry.npmmirror.com/gh/kuankuantj2831/kuankuantjblog.github.io@main/images/chinese-bg.webp',
        // Statically CDN
        'https://cdn.statically.io/gh/kuankuantj2831/kuankuantjblog.github.io@main/images/chinese-bg.webp'
    ];

    var done = false;
    var target = document.querySelector('.chinese-style-wrapper') || document.querySelector('.profile-wrapper');
    if (!target) return;

    SOURCES.forEach(function (url) {
        var img = new Image();
        img.onload = function () {
            if (done) return;
            done = true;
            target.style.backgroundImage = 'url(' + url + ')';
        };
        img.onerror = function () {
            // 静默失败，其他源会补上
        };
        img.src = url;
    });
})();
