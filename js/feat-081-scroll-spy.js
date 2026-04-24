/**
 * 功能 81: 滚动锚点高亮
 * 滚动时自动高亮当前可见的目录项
 */
(function(){function init(){var headings=document.querySelectorAll('h2[id],h3[id],h4[id]');if(headings.length<2)return;var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){var id=entry.target.id;document.querySelectorAll('a[href="#'+id+'"]').forEach(function(a){a.style.color='#667eea';a.style.fontWeight='700';});document.querySelectorAll('a[href^="#"]:not([href="#'+id+'"])').forEach(function(a){if(a.closest('.toc,#toc,[data-toc]')){a.style.color='';a.style.fontWeight='';}});}});},{rootMargin:'-20% 0px -60% 0px'});headings.forEach(function(h){observer.observe(h);});}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();})();
