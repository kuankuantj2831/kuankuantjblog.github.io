/**
 * 功能 45: 页面元素计数
 * 在控制台输出页面元素统计信息
 */
(function() {
    window.addEventListener('load', function() {
        var stats = {
            '总元素数': document.querySelectorAll('*').length,
            '图片数': document.images.length,
            '链接数': document.links.length,
            '脚本数': document.scripts.length,
            '样式表数': document.styleSheets.length,
            '表单数': document.forms.length,
            'DOM深度': (function() {
                var max = 0;
                document.querySelectorAll('*').forEach(function(el) {
                    var d = 0, n = el;
                    while (n.parentElement) { d++; n = n.parentElement; }
                    if (d > max) max = d;
                });
                return max;
            })()
        };
        console.group('%c📊 页面元素统计', 'color:#764ba2;font-weight:bold;');
        Object.keys(stats).forEach(function(k) {
            console.log(k + ': ' + stats[k]);
        });
        console.groupEnd();
    });
})();
