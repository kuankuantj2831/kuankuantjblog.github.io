/**
 * 功能 19: 页面性能指标显示
 * 在控制台输出页面加载性能数据
 */
(function() {
    window.addEventListener('load', function() {
        setTimeout(function() {
            var perf = performance.getEntriesByType('navigation')[0];
            if (!perf) return;
            var data = {
                'DNS查询': Math.round(perf.domainLookupEnd - perf.domainLookupStart) + 'ms',
                'TCP连接': Math.round(perf.connectEnd - perf.connectStart) + 'ms',
                '首字节(TTFB)': Math.round(perf.responseStart - perf.requestStart) + 'ms',
                'DOM解析': Math.round(perf.domContentLoadedEventEnd - perf.responseEnd) + 'ms',
                '页面完全加载': Math.round(perf.loadEventEnd - perf.startTime) + 'ms',
                '资源数量': performance.getEntriesByType('resource').length
            };
            console.group('%c📊 页面性能指标', 'color:#10b981;font-weight:bold;');
            Object.keys(data).forEach(function(k) {
                console.log('%c' + k + ': %c' + data[k], 'color:#666;', 'color:#667eea;font-weight:bold;');
            });
            console.groupEnd();
        }, 100);
    });
})();
