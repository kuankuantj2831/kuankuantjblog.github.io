/**
 * 功能 50: Emoji 表情选择器
 * 提供一个全局可调用的 emoji 选择器
 */
(function() {
    var emojis = ['😀','😂','🥰','😎','🤔','👍','👏','🎉','🔥','❤️','⭐','🚀','💡','📝','🎮','🎵','☕','🌈','🌟','💪','🙏','✅','❌','⚡','🎯','💻','📱','🔧','🎨','📚'];
    window.showEmojiPicker = function(callback) {
        var existing = document.getElementById('emojiPickerPopup');
        if (existing) existing.remove();
        var picker = document.createElement('div');
        picker.id = 'emojiPickerPopup';
        Object.assign(picker.style, {
            position: 'fixed', bottom: '80px', right: '20px', background: 'rgba(255,255,255,0.98)',
            borderRadius: '16px', padding: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            zIndex: '999999', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px',
            maxWidth: '240px', backdropFilter: 'blur(10px)', border: '1px solid rgba(0,0,0,0.08)'
        });
        emojis.forEach(function(emoji) {
            var btn = document.createElement('button');
            btn.textContent = emoji;
            btn.style.cssText = 'border:none;background:none;font-size:22px;cursor:pointer;padding:6px;border-radius:8px;transition:background 0.15s;';
            btn.addEventListener('mouseenter', function() { btn.style.background = 'rgba(102,126,234,0.1)'; });
            btn.addEventListener('mouseleave', function() { btn.style.background = 'none'; });
            btn.addEventListener('click', function() {
                if (callback) callback(emoji);
                picker.remove();
            });
            picker.appendChild(btn);
        });
        document.body.appendChild(picker);
        document.addEventListener('click', function handler(e) {
            if (!picker.contains(e.target)) { picker.remove(); document.removeEventListener('click', handler); }
        });
    };
})();
