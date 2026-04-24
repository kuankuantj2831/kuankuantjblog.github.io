/** 功能 116: 打字机效果工具 */
(function(){window.typeWriter=function(el,text,speed,callback){if(typeof el==='string')el=document.querySelector(el);if(!el)return;speed=speed||50;el.textContent='';var i=0;var timer=setInterval(function(){if(i<text.length){el.textContent+=text[i];i++;}else{clearInterval(timer);if(callback)callback();}},speed);};})();
