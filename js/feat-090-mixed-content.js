/**
 * 功能 90: 自动检测混合内容
 */
(function(){if(location.protocol==='https:'){window.addEventListener('load',function(){document.querySelectorAll('img[src^="http:"],script[src^="http:"],link[href^="http:"]').forEach(function(el){console.warn('[混合内容] '+el.tagName+': '+(el.src||el.href));});});};})();
