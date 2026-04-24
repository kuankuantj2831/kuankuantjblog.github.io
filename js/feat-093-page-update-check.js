/**
 * 功能 93: 自动检测页面更新
 */
(function(){var CHECK_INTERVAL=5*60*1000;var lastModified=null;setInterval(function(){fetch(location.href,{method:'HEAD',cache:'no-cache'}).then(function(r){var mod=r.headers.get('last-modified');if(lastModified&&mod&&mod!==lastModified){console.log('[更新] 页面有新版本，建议刷新');}lastModified=mod;}).catch(function(){});},CHECK_INTERVAL);})();
