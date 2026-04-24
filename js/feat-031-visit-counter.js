/**
 * 功能 31: 页面访问计数器
 * 使用 localStorage 统计页面访问次数
 */
(function() {
    var key = 'visitCount_' + location.pathname;
    var count = parseInt(localStorage.getItem(key) || '0') + 1;
    localStorage.setItem(key, count);
    console.log('[访问统计] 本页第 ' + count + ' 次访问');
})();
