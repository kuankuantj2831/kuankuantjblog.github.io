/**
 * 功能 71: localStorage 容量检测
 */
(function(){try{var used=0;for(var k in localStorage)if(localStorage.hasOwnProperty(k))used+=localStorage[k].length;console.log('[存储] localStorage 已用: '+(used/1024).toFixed(1)+'KB');}catch(e){}})();
