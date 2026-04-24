/**
 * 功能 23: 右键菜单增强
 * 自定义右键菜单，添加常用操作
 */
(function() {
    var menu = document.createElement('div');
    menu.id = 'customContextMenu';
    Object.assign(menu.style, {
        position: 'fixed', display: 'none', background: 'rgba(255,255,255,0.95)',
        borderRadius: '12px', padding: '8px 0', minWidth: '180px', zIndex: '999999',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden'
    });
    var items = [
        { icon: '🏠', text: '返回首页', action: function() { location.href = '/index-chinese.html'; } },
        { icon: '⬆️', text: '回到顶部', action: function() { window.scrollTo({ top: 0, behavior: 'smooth' }); } },
        { icon: '📋', text: '复制链接', action: function() { navigator.clipboard.writeText(location.href); } },
        { icon: '🔄', text: '刷新页面', action: function() { location.reload(); } },
        { icon: '📖', text: '全部文章', action: function() { location.href = '/articles.html'; } }
    ];
    items.forEach(function(item) {
        var div = document.createElement('div');
        div.textContent = item.icon + ' ' + item.text;
        Object.assign(div.style, {
            padding: '10px 20px', cursor: 'pointer', fontSize: '13px', transition: 'background 0.15s'
        });
        div.addEventListener('mouseenter', function() { div.style.background = 'rgba(102,126,234,0.1)'; });
        div.addEventListener('mouseleave', function() { div.style.background = 'transparent'; });
        div.addEventListener('click', function() { menu.style.display = 'none'; item.action(); });
        menu.appendChild(div);
    });
    document.body.appendChild(menu);

    document.addEventListener('contextmenu', function(e) {
        if (e.target.closest('input,textarea,[contenteditable]')) return;
        e.preventDefault();
        menu.style.left = Math.min(e.clientX, window.innerWidth - 200) + 'px';
        menu.style.top = Math.min(e.clientY, window.innerHeight - 250) + 'px';
        menu.style.display = 'block';
    });
    document.addEventListener('click', function() { menu.style.display = 'none'; });
})();
