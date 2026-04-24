/**
 * 功能 58: 全屏模式切换
 * 按 F11 或双击标题进入全屏
 */
(function(){window.toggleFullscreen=function(){if(!document.fullscreenElement){document.documentElement.requestFullscreen().catch(function(){});}else{document.exitFullscreen();}};document.addEventListener('keydown',function(e){if(e.key==='F11'){e.preventDefault();window.toggleFullscreen();}});})();
