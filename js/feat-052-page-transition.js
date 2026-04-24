/**
 * 功能 52: 页面切换动画
 * 点击链接时添加页面淡出效果
 */
(function(){document.addEventListener('click',function(e){var a=e.target.closest('a[href]');if(!a)return;var h=a.getAttribute('href');if(!h||h.startsWith('#')||h.startsWith('javascript')||a.target==='_blank'||h.startsWith('http'))return;e.preventDefault();document.body.style.transition='opacity 0.3s';document.body.style.opacity='0';setTimeout(function(){location.href=h;},300);});window.addEventListener('pageshow',function(){document.body.style.opacity='1';});})();
