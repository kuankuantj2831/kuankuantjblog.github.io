/**
 * 功能 4: 文字选中分享
 * 选中文字后弹出分享/复制按钮
 */
(function() {
    var popup = document.createElement('div');
    popup.id = 'textSelectPopup';
    Object.assign(popup.style, {
        position: 'absolute', display: 'none', background: '#333', color: '#fff',
        borderRadius: '8px', padding: '6px 12px', fontSize: '12px', zIndex: '99999',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)', cursor: 'pointer', userSelect: 'none',
        transition: 'opacity 0.2s, transform 0.2s', opacity: '0', transform: 'translateY(5px)'
    });
    popup.innerHTML = '📋 复制 &nbsp; 🔗 分享';
    document.body.appendChild(popup);

    document.addEventListener('mouseup', function(e) {
        var sel = window.getSelection();
        var text = sel.toString().trim();
        if (text.length > 2 && text.length < 500) {
            var range = sel.getRangeAt(0);
            var rect = range.getBoundingClientRect();
            popup.style.left = (rect.left + window.scrollX + rect.width / 2 - 60) + 'px';
            popup.style.top = (rect.top + window.scrollY - 40) + 'px';
            popup.style.display = 'block';
            requestAnimationFrame(function() {
                popup.style.opacity = '1';
                popup.style.transform = 'translateY(0)';
            });
        } else {
            popup.style.opacity = '0';
            popup.style.transform = 'translateY(5px)';
            setTimeout(function() { popup.style.display = 'none'; }, 200);
        }
    });

    popup.addEventListener('click', function() {
        var text = window.getSelection().toString().trim();
        if (text) {
            navigator.clipboard.writeText(text).then(function() {
                popup.textContent = '✅ 已复制';
                setTimeout(function() {
                    popup.innerHTML = '📋 复制 &nbsp; 🔗 分享';
                    popup.style.opacity = '0';
                    setTimeout(function() { popup.style.display = 'none'; }, 200);
                }, 1000);
            });
        }
    });

    document.addEventListener('mousedown', function(e) {
        if (e.target !== popup && !popup.contains(e.target)) {
            popup.style.opacity = '0';
            setTimeout(function() { popup.style.display = 'none'; }, 200);
        }
    });
})();
