/**
 * 功能 105: 彩虹文字效果
 */
(function(){window.rainbowText=function(selector){var el=document.querySelector(selector);if(!el)return;var text=el.textContent;el.innerHTML='';text.split('').forEach(function(ch,i){var span=document.createElement('span');span.textContent=ch;span.style.cssText='color:hsl('+(i*360/text.length)+',80%,60%);display:inline-block;transition:color 0.3s;';el.appendChild(span);});};})();
