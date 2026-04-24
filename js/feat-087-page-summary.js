/**
 * 功能 87: 页面内容摘要生成
 */
(function(){window.getPageSummary=function(){var title=document.title;var desc=(document.querySelector('meta[name="description"]')||{}).content||'';var h1=(document.querySelector('h1')||{}).textContent||'';var text=(document.querySelector('article,.article-content')||document.body).textContent||'';var words=text.replace(/\s+/g,' ').trim().substring(0,200);return{title:title,description:desc,heading:h1,preview:words+'...'};};})();
