/**
 * 功能 68: 拖拽排序列表
 * 为带有 data-sortable 属性的列表启用拖拽排序
 */
(function(){function init(){document.querySelectorAll('[data-sortable]').forEach(function(list){Array.from(list.children).forEach(function(item){item.draggable=true;item.style.cursor='grab';item.addEventListener('dragstart',function(e){e.dataTransfer.setData('text/plain','');item.classList.add('dragging');item.style.opacity='0.5';});item.addEventListener('dragend',function(){item.classList.remove('dragging');item.style.opacity='1';});item.addEventListener('dragover',function(e){e.preventDefault();var dragging=list.querySelector('.dragging');if(dragging&&dragging!==item){var rect=item.getBoundingClientRect();var mid=rect.top+rect.height/2;if(e.clientY<mid)list.insertBefore(dragging,item);else list.insertBefore(dragging,item.nextSibling);}});});});}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();})();
