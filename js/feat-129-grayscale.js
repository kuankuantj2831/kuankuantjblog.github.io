/** 功能 129: 页面灰度模式 */
(function(){window.toggleGrayscale=function(){var current=document.body.style.filter;if(current.includes('grayscale'))document.body.style.filter='';else document.body.style.filter='grayscale(100%)';};})();
