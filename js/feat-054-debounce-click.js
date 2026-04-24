/**
 * 功能 54: 禁止连续快速点击（防抖按钮）
 * 防止用户连续快速点击提交按钮
 */
(function(){document.addEventListener('click',function(e){var btn=e.target.closest('button[type="submit"],.btn-submit');if(!btn||btn.disabled)return;btn.disabled=true;btn.dataset.origText=btn.textContent;btn.textContent='处理中...';btn.style.opacity='0.6';setTimeout(function(){btn.disabled=false;btn.textContent=btn.dataset.origText;btn.style.opacity='1';},2000);});})();
