/**
 * 功能 99: 页面资源加载监控
 */
(function(){window.addEventListener('load',function(){setTimeout(function(){var resources=performance.getEntriesByType('resource');var stats={js:0,css:0,img:0,font:0,other:0,totalSize:0};resources.forEach(function(r){var size=r.transferSize||0;stats.totalSize+=size;if(r.name.match(/\.js/))stats.js++;else if(r.name.match(/\.css/))stats.css++;else if(r.name.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)/))stats.img++;else if(r.name.match(/\.(woff|woff2|ttf|eot)/))stats.font++;else stats.other++;});console.log('[资源统计] JS:'+stats.js+' CSS:'+stats.css+' 图片:'+stats.img+' 字体:'+stats.font+' 其他:'+stats.other+' 总大小:'+(stats.totalSize/1024/1024).toFixed(2)+'MB');},200);});})();
