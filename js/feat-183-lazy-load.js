/** 功能 183: 简易延迟加载 */
(function(){window.lazyLoad=function(sel,loadFn){var els=document.querySelectorAll(sel);var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){loadFn(entry.target);observer.unobserve(entry.target);}});},{rootMargin:'200px'});els.forEach(function(el){observer.observe(el);});};})();
