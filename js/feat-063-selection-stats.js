/**
 * 功能 63: 文本选中统计
 * 选中文字时显示字数统计
 */
(function(){document.addEventListener('mouseup',function(){var sel=window.getSelection().toString().trim();if(sel.length>5){var cn=(sel.match(/[\u4e00-\u9fff]/g)||[]).length;var en=(sel.match(/[a-zA-Z]+/g)||[]).length;console.log('[选中统计] '+sel.length+'字符, '+cn+'中文, '+en+'英文单词');}});})();
