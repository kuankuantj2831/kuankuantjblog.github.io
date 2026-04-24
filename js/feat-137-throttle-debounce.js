/** 功能 137: 节流函数工具 */
(function(){window.throttle=function(fn,delay){var last=0;return function(){var now=Date.now();if(now-last>=delay){last=now;fn.apply(this,arguments);}};};window.debounce=function(fn,delay){var timer;return function(){var ctx=this,args=arguments;clearTimeout(timer);timer=setTimeout(function(){fn.apply(ctx,args);},delay);};};})();
