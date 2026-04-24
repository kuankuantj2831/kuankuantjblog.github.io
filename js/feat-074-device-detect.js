/**
 * 功能 74: 自动检测设备类型
 */
(function(){var ua=navigator.userAgent;var device='desktop';if(/Mobi|Android/i.test(ua))device='mobile';else if(/Tablet|iPad/i.test(ua))device='tablet';document.documentElement.dataset.device=device;console.log('[设备] '+device);})();
