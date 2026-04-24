/**
 * 功能 65: 触摸滑动返回
 * 移动端从左边缘右滑返回上一页
 */
(function(){var startX=0,startY=0;document.addEventListener('touchstart',function(e){startX=e.touches[0].clientX;startY=e.touches[0].clientY;},{passive:true});document.addEventListener('touchend',function(e){var dx=e.changedTouches[0].clientX-startX;var dy=Math.abs(e.changedTouches[0].clientY-startY);if(startX<30&&dx>100&&dy<80){history.back();}},{passive:true});})();
