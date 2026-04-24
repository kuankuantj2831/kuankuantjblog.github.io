/**
 * 功能 11: 暗色模式快速切换
 * 点击快捷按钮或按 D 键切换暗色/亮色模式
 */
(function() {
    var btn = document.createElement('button');
    btn.id = 'darkModeQuickToggle';
    Object.assign(btn.style, {
        position: 'fixed', bottom: '140px', right: '20px', width: '44px', height: '44px',
        borderRadius: '50%', border: 'none', cursor: 'pointer', zIndex: '9990',
        fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)', transition: 'transform 0.3s, background 0.3s',
        background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)'
    });
    function update() {
        var dark = document.documentElement.getAttribute('data-theme') === 'dark';
        btn.textContent = dark ? '☀️' : '🌙';
    }
    btn.addEventListener('click', function() {
        var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
        update();
    });
    btn.addEventListener('mouseenter', function() { btn.style.transform = 'scale(1.15)'; });
    btn.addEventListener('mouseleave', function() { btn.style.transform = 'scale(1)'; });
    document.body.appendChild(btn);
    update();
    new MutationObserver(update).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();
