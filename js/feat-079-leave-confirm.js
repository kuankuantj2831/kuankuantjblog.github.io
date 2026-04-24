/**
 * 功能 79: 页面刷新确认
 * 编辑内容时刷新页面弹出确认
 */
(function(){var editing=false;document.addEventListener('input',function(e){if(e.target.closest('textarea,input[type="text"],.editor-content,[contenteditable]'))editing=true;});document.addEventListener('submit',function(){editing=false;});window.addEventListener('beforeunload',function(e){if(editing){e.preventDefault();e.returnValue='';}});})();
