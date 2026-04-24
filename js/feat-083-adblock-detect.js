/**
 * 功能 83: 自动检测广告拦截器
 */
(function(){window.addEventListener('load',function(){var test=document.createElement('div');test.className='ad ads adsbox ad-banner';test.style.cssText='height:1px;width:1px;position:absolute;left:-9999px;';document.body.appendChild(test);setTimeout(function(){if(test.offsetHeight===0||getComputedStyle(test).display==='none'){console.log('[提示] 检测到广告拦截器');}test.remove();},100);});})();
