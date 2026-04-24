/**
 * 功能 107: 页面老化效果
 * 页面打开越久颜色越暖
 */
(function(){var start=Date.now();setInterval(function(){var mins=(Date.now()-start)/60000;var sepia=Math.min(mins*2,20);document.body.style.filter='sepia('+sepia+'%)';},30000);})();
