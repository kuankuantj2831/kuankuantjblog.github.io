/**
 * 功能 100: 开发者工具检测
 */
(function(){var devtools={open:false};var threshold=160;setInterval(function(){var w=window.outerWidth-window.innerWidth>threshold;var h=window.outerHeight-window.innerHeight>threshold;var isOpen=w||h;if(isOpen&&!devtools.open){devtools.open=true;console.log('%c🔧 开发者工具已打开','color:#667eea;font-size:14px;font-weight:bold;');console.log('%c欢迎查看源码！如有问题请联系管理员','color:#999;font-size:12px;');}else if(!isOpen){devtools.open=false;}},500);})();
