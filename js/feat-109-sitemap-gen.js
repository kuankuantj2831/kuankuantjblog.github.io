/**
 * 功能 109: 自动生成站点地图
 */
(function(){window.generateSitemap=function(){var links=new Set();document.querySelectorAll('a[href]').forEach(function(a){var h=a.href;if(h.includes(location.hostname)&&!h.includes('#'))links.add(h);});var xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';links.forEach(function(url){xml+='  <url><loc>'+url+'</loc></url>\n';});xml+='</urlset>';console.log(xml);return xml;};})();
