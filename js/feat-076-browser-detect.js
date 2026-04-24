/**
 * 功能 76: 自动检测浏览器版本
 */
(function(){var ua=navigator.userAgent;var browser='Unknown';if(ua.includes('Chrome')&&!ua.includes('Edg'))browser='Chrome';else if(ua.includes('Firefox'))browser='Firefox';else if(ua.includes('Safari')&&!ua.includes('Chrome'))browser='Safari';else if(ua.includes('Edg'))browser='Edge';document.documentElement.dataset.browser=browser.toLowerCase();console.log('[浏览器] '+browser);})();
