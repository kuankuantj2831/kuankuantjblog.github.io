/**
 * 功能 82: 图片懒加载计数
 */
(function(){var loaded=0,total=0;function init(){var imgs=document.querySelectorAll('img');total=imgs.length;imgs.forEach(function(img){if(img.complete)loaded++;else img.addEventListener('load',function(){loaded++;});});}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();window.getImageStats=function(){return{loaded:loaded,total:total,percent:total?Math.round(loaded/total*100)+'%':'N/A'};};})();
