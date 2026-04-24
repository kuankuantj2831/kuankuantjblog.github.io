/**
 * 功能 48: 防抖搜索输入
 * 为搜索框添加防抖功能，减少请求频率
 */
(function() {
    window.debounceSearch = function(fn, delay) {
        delay = delay || 300;
        var timer;
        return function() {
            var args = arguments, ctx = this;
            clearTimeout(timer);
            timer = setTimeout(function() { fn.apply(ctx, args); }, delay);
        };
    };
    // 自动应用到搜索框
    function init() {
        var inputs = document.querySelectorAll('[type="search"], .search-input, #searchInput');
        inputs.forEach(function(input) {
            if (input.dataset.debounced) return;
            input.dataset.debounced = 'true';
            var original = input.oninput;
            if (original) {
                input.oninput = window.debounceSearch(original, 300);
            }
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
