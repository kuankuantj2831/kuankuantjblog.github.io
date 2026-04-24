/**
 * 功能 26: 自动保存表单数据
 * 自动保存输入框内容，刷新后恢复
 */
(function() {
    var KEY = 'formAutoSave_' + location.pathname;
    function save() {
        var data = {};
        document.querySelectorAll('input[id],textarea[id]').forEach(function(el) {
            if (el.type === 'password' || el.type === 'hidden') return;
            data[el.id] = el.value;
        });
        localStorage.setItem(KEY, JSON.stringify(data));
    }
    function restore() {
        try {
            var data = JSON.parse(localStorage.getItem(KEY));
            if (!data) return;
            Object.keys(data).forEach(function(id) {
                var el = document.getElementById(id);
                if (el && !el.value) el.value = data[id];
            });
        } catch(e) {}
    }
    document.addEventListener('input', function(e) {
        if (e.target.id) save();
    });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', restore);
    else restore();
})();
