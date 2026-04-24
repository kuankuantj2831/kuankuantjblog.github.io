/**
 * 功能 55: 密码强度检测器
 * 为密码输入框添加实时强度指示
 */
(function(){function init(){document.querySelectorAll('input[type="password"]').forEach(function(input){if(input.dataset.strengthBar)return;input.dataset.strengthBar='true';var bar=document.createElement('div');bar.style.cssText='height:3px;border-radius:2px;margin-top:4px;transition:all 0.3s;width:0%;';input.parentNode.insertBefore(bar,input.nextSibling);input.addEventListener('input',function(){var v=input.value,s=0;if(v.length>=6)s++;if(v.length>=10)s++;if(/[A-Z]/.test(v))s++;if(/[0-9]/.test(v))s++;if(/[^A-Za-z0-9]/.test(v))s++;var colors=['#ef4444','#f59e0b','#eab308','#22c55e','#10b981'];var widths=['20%','40%','60%','80%','100%'];bar.style.width=widths[Math.min(s,4)];bar.style.background=colors[Math.min(s,4)];});});}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();})();
