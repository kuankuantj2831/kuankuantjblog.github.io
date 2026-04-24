/**
 * 功能 86: 链接有效性检测
 */
(function(){window.checkBrokenLinks=function(){var links=document.querySelectorAll('a[href]');var broken=[];var checked=0;links.forEach(function(a){var h=a.getAttribute('href');if(!h||h.startsWith('#')||h.startsWith('javascript'))return;fetch(h,{method:'HEAD',mode:'no-cors'}).then(function(r){checked++;if(!r.ok)broken.push(h);}).catch(function(){checked++;broken.push(h);}).finally(function(){if(checked>=links.length-5)console.log('[链接检测] 完成，'+broken.length+'个可能失效');});});};})();
