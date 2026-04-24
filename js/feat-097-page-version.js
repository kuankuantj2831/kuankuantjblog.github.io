/**
 * 功能 97: 页面内容版本号
 */
(function(){var meta=document.querySelector('meta[name="version"]');var version=meta?meta.content:'1.0.0';document.documentElement.dataset.version=version;console.log('[版本] '+version);})();
