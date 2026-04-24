/**
 * 功能 96: 自动检测并修复断裂的锚点
 */
(function(){function init(){document.querySelectorAll('a[href^="#"]').forEach(function(a){var id=a.getAttribute('href').slice(1);if(id&&!document.getElementById(id)){a.style.opacity='0.5';a.title='目标不存在: #'+id;console.warn('[断裂锚点] #'+id);}});}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();})();
