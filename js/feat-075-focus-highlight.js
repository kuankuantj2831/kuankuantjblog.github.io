/**
 * 功能 75: 页面焦点高亮
 * Tab 键导航时显示焦点轮廓
 */
(function(){var style=document.createElement('style');style.textContent='body.keyboard-nav *:focus{outline:2px solid #667eea!important;outline-offset:2px;border-radius:4px;}';document.head.appendChild(style);document.addEventListener('keydown',function(e){if(e.key==='Tab')document.body.classList.add('keyboard-nav');});document.addEventListener('mousedown',function(){document.body.classList.remove('keyboard-nav');});})();
