/**
 * 功能 56: 输入框字符计数
 * 为 textarea 添加实时字符计数
 */
(function(){function init(){document.querySelectorAll('textarea').forEach(function(ta){if(ta.dataset.counted)return;ta.dataset.counted='true';var max=parseInt(ta.getAttribute('maxlength'))||0;var counter=document.createElement('div');counter.style.cssText='text-align:right;font-size:11px;color:#999;margin-top:2px;';ta.parentNode.insertBefore(counter,ta.nextSibling);function update(){var len=ta.value.length;counter.textContent=len+(max?' / '+max:'')+'字';if(max&&len>max*0.9)counter.style.color='#ef4444';else counter.style.color='#999';}ta.addEventListener('input',update);update();});}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();})();
