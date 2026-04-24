/**
 * 功能 64: 自动隐藏地址栏（移动端）
 * 页面加载后自动滚动隐藏移动端地址栏
 */
(function(){if(/Mobi|Android/i.test(navigator.userAgent)){window.addEventListener('load',function(){setTimeout(function(){window.scrollTo(0,1);},100);});}})();
