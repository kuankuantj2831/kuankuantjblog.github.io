/**
 * 功能 69: 剪贴板监听
 * 复制内容时自动追加版权信息
 */
(function(){document.addEventListener('copy',function(e){var sel=window.getSelection().toString();if(sel.length>30){e.preventDefault();var extra='\n\n—— 来自 Hakimi 的猫爬架 ('+location.href+')';e.clipboardData.setData('text/plain',sel+extra);}});})();
