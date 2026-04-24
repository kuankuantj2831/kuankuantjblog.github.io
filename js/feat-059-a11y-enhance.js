/**
 * 功能 59: 页面可访问性增强
 * 添加 ARIA 标签和焦点管理
 */
(function(){function init(){document.querySelectorAll('button:not([aria-label])').forEach(function(btn){if(btn.textContent.trim())btn.setAttribute('aria-label',btn.textContent.trim());});document.querySelectorAll('img:not([alt])').forEach(function(img){img.alt='图片';});document.querySelectorAll('a:not([aria-label])').forEach(function(a){if(!a.textContent.trim()&&!a.querySelector('img'))a.setAttribute('aria-label','链接');});var main=document.querySelector('main,article,.article-content,.chinese-style-wrapper');if(main&&!main.getAttribute('role'))main.setAttribute('role','main');var nav=document.querySelector('nav,.top-nav');if(nav&&!nav.getAttribute('role'))nav.setAttribute('role','navigation');}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();})();
