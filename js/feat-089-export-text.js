/**
 * 功能 89: 页面内容导出为文本
 */
(function(){window.exportPageText=function(){var article=document.querySelector('article,.article-content,.post-content');var text=article?(article.textContent||''):document.body.textContent;var blob=new Blob([text],{type:'text/plain;charset=utf-8'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(document.title||'page')+'.txt';a.click();URL.revokeObjectURL(a.href);};})();
