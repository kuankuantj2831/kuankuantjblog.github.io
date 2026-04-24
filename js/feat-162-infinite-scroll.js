/** 功能 162: 简易无限滚动 */
(function(){window.createInfiniteScroll=function(opts){var loading=false;var page=1;window.addEventListener('scroll',function(){if(loading)return;if(window.innerHeight+window.scrollY>=document.body.scrollHeight-200){loading=true;page++;if(opts.onLoad)opts.onLoad(page,function(){loading=false;});}},{passive:true});};})();
