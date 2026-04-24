/** 功能 184: 简易重试机制 */
(function(){window.retry=function(fn,maxRetries,delay){maxRetries=maxRetries||3;delay=delay||1000;var attempt=0;function tryOnce(){return fn().catch(function(err){attempt++;if(attempt>=maxRetries)throw err;return new Promise(function(resolve){setTimeout(function(){resolve(tryOnce());},delay*attempt);});});}return tryOnce();};})();
