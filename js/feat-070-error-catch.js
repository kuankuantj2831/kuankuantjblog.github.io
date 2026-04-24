/**
 * 功能 70: 页面错误捕获
 * 全局捕获 JS 错误并友好提示
 */
(function(){var errorCount=0;window.addEventListener('error',function(e){errorCount++;if(errorCount>5)return;console.warn('[错误捕获]',e.message,'at',e.filename+':'+e.lineno);});window.addEventListener('unhandledrejection',function(e){errorCount++;if(errorCount>5)return;console.warn('[Promise错误]',e.reason);});})();
