/**
 * 功能 73: 页面可见时间统计
 */
(function(){var visible=0,hidden=0,last=Date.now(),isVisible=!document.hidden;document.addEventListener('visibilitychange',function(){var now=Date.now();if(isVisible)visible+=now-last;else hidden+=now-last;last=now;isVisible=!document.hidden;});window.getVisibilityStats=function(){var now=Date.now();if(isVisible)visible+=now-last;else hidden+=now-last;last=now;return{visible:Math.round(visible/1000)+'s',hidden:Math.round(hidden/1000)+'s'};};})();
