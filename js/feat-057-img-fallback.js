/**
 * 功能 57: 图片错误占位
 * 图片加载失败时显示占位图
 */
(function(){document.addEventListener('error',function(e){if(e.target.tagName!=='IMG')return;if(e.target.dataset.fallback)return;e.target.dataset.fallback='true';e.target.style.cssText='background:linear-gradient(135deg,#f0f0f0,#e0e0e0);display:flex;align-items:center;justify-content:center;min-height:100px;border-radius:8px;';e.target.alt=e.target.alt||'图片加载失败';e.target.src='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect fill="%23f0f0f0" width="200" height="150"/><text x="100" y="75" text-anchor="middle" fill="%23999" font-size="14">图片加载失败</text></svg>');},true);})();
