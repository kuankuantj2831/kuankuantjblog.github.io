/**
 * 功能 21: 字体大小调节器
 * 允许用户通过按钮调整页面字体大小
 */
(function() {
    var size = parseInt(localStorage.getItem('fontSize') || '16');
    function apply() { document.body.style.fontSize = size + 'px'; localStorage.setItem('fontSize', size); }
    if (localStorage.getItem('fontSize')) apply();

    var wrap = document.createElement('div');
    Object.assign(wrap.style, {
        position: 'fixed', bottom: '200px', right: '20px', display: 'flex', flexDirection: 'column',
        gap: '4px', zIndex: '9990'
    });
    ['A+', 'A', 'A-'].forEach(function(label, i) {
        var b = document.createElement('button');
        b.textContent = label;
        Object.assign(b.style, {
            width: '36px', height: '36px', borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: 'rgba(255,255,255,0.9)', fontSize: '12px', fontWeight: '700',
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)', backdropFilter: 'blur(8px)'
        });
        b.addEventListener('click', function() {
            if (i === 0) size = Math.min(size + 2, 24);
            else if (i === 1) size = 16;
            else size = Math.max(size - 2, 12);
            apply();
        });
        wrap.appendChild(b);
    });
    document.body.appendChild(wrap);
})();
