/**
 * 功能 62: 页面滚动视差背景
 * 背景图随滚动产生视差效果
 */
(function(){var bg=document.querySelector('.bg-decoration,.hero-section');if(!bg)return;var ticking=false;window.addEventListener('scroll',function(){if(!ticking){requestAnimationFrame(function(){bg.style.backgroundPositionY=-(window.scrollY*0.3)+'px';ticking=false;});ticking=true;}},{passive:true});})();
