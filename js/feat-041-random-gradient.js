/**
 * 功能 41: 随机背景渐变
 * 每次刷新页面时随机生成背景渐变色
 */
(function() {
    var palettes = [
        ['#667eea','#764ba2'],['#f093fb','#f5576c'],['#4facfe','#00f2fe'],
        ['#43e97b','#38f9d7'],['#fa709a','#fee140'],['#a18cd1','#fbc2eb'],
        ['#ffecd2','#fcb69f'],['#89f7fe','#66a6ff'],['#c471f5','#fa71cd']
    ];
    var p = palettes[Math.floor(Math.random() * palettes.length)];
    var bg = document.querySelector('.bg-decoration, .chinese-style-wrapper');
    if (bg) {
        bg.style.setProperty('--random-gradient', 'linear-gradient(135deg, ' + p[0] + ' 0%, ' + p[1] + ' 100%)');
    }
})();
