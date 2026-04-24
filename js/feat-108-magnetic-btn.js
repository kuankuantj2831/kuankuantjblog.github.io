/**
 * 功能 108: 鼠标磁吸按钮效果
 */
(function(){if(window.matchMedia('(hover:none)').matches)return;document.querySelectorAll('.btn,.play-btn,button').forEach(function(btn){btn.addEventListener('mousemove',function(e){var r=btn.getBoundingClientRect();var x=e.clientX-r.left-r.width/2;var y=e.clientY-r.top-r.height/2;btn.style.transform='translate('+x*0.2+'px,'+y*0.2+'px)';btn.style.transition='transform 0.15s ease-out';});btn.addEventListener('mouseleave',function(){btn.style.transform='';});});})();
