/** 功能 130: 页面反色模式 */
(function(){window.toggleInvert=function(){var current=document.body.style.filter;if(current.includes('invert'))document.body.style.filter='';else document.body.style.filter='invert(100%) hue-rotate(180deg)';};})();
