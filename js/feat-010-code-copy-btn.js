/**
 * 功能 10: 复制代码块按钮
 * 为所有 <pre><code> 块添加一键复制按钮
 */
(function() {
    var style = document.createElement('style');
    style.textContent = '.code-copy-btn{position:absolute;top:8px;right:8px;padding:4px 10px;background:rgba(255,255,255,0.15);color:#ccc;border:1px solid rgba(255,255,255,0.2);border-radius:6px;font-size:11px;cursor:pointer;opacity:0;transition:opacity 0.2s}pre:hover .code-copy-btn{opacity:1}.code-copy-btn:hover{background:rgba(255,255,255,0.25);color:#fff}.code-copy-btn.copied{background:#10b981;color:#fff;border-color:#10b981}';
    document.head.appendChild(style);

    function init() {
        document.querySelectorAll('pre').forEach(function(pre) {
            if (pre.querySelector('.code-copy-btn')) return;
            pre.style.position = 'relative';
            var btn = document.createElement('button');
            btn.className = 'code-copy-btn';
            btn.textContent = '复制';
            btn.addEventListener('click', function() {
                var code = pre.querySelector('code');
                var text = code ? code.textContent : pre.textContent;
                navigator.clipboard.writeText(text).then(function() {
                    btn.textContent = '已复制 ✓';
                    btn.classList.add('copied');
                    setTimeout(function() {
                        btn.textContent = '复制';
                        btn.classList.remove('copied');
                    }, 2000);
                });
            });
            pre.appendChild(btn);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
