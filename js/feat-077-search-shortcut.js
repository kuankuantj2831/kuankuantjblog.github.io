/**
 * 功能 77: 页面内搜索快捷键
 * Ctrl+K 打开搜索框
 */
(function(){document.addEventListener('keydown',function(e){if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();var input=document.querySelector('#searchInput,.search-input,[type="search"]');if(input){input.focus();input.select();}}});})();
