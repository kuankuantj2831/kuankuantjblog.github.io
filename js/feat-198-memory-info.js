/** 功能 198: 简易内存信息 */
(function(){window.getMemoryInfo=function(){if(!performance.memory)return null;var m=performance.memory;return{used:Math.round(m.usedJSHeapSize/1048576)+'MB',total:Math.round(m.totalJSHeapSize/1048576)+'MB',limit:Math.round(m.jsHeapSizeLimit/1048576)+'MB',percent:Math.round(m.usedJSHeapSize/m.jsHeapSizeLimit*100)+'%'};};})();
