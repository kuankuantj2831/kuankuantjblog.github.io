/**
 * 功能 72: 自动检测慢网络
 */
(function(){if(navigator.connection){var c=navigator.connection;if(c.effectiveType==='2g'||c.effectiveType==='slow-2g'){console.warn('[网络] 检测到慢速网络('+c.effectiveType+')，建议切换到WiFi');}}})();
