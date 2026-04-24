/**
 * 功能 91: 页面分享到社交平台
 */
(function(){window.shareTo=function(platform){var url=encodeURIComponent(location.href);var title=encodeURIComponent(document.title);var map={weibo:'https://service.weibo.com/share/share.php?url='+url+'&title='+title,qq:'https://connect.qq.com/widget/shareqq/index.html?url='+url+'&title='+title,twitter:'https://twitter.com/intent/tweet?url='+url+'&text='+title,facebook:'https://www.facebook.com/sharer/sharer.php?u='+url};if(map[platform])window.open(map[platform],'_blank','width=600,height=400');};})();
