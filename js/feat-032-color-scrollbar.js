/**
 * 功能 32: 滚动百分比彩色进度条
 * 页面顶部显示随滚动变色的进度条
 */
(function() {
    var bar = document.createElement('div');
    Object.assign(bar.style, {
        position:'fixed',top:'0',left:'0',height:'3px',zIndex:'9999999',
        width:'0%',transition:'width 0.1s linear',borderRadius:'0 2px 2px 0'
    });
    document.body.appendChild(bar);
    window.addEventListener('scroll',function(){
        requestAnimationFrame(function(){
            var h=document.documentElement.scrollHeight-window.innerHeight;
            var p=h>0?(window.scrollY/h)*100:0;
            bar.style.width=p+'%';
            var hue=Math.round(p*2.4);
            bar.style.background='hsl('+hue+',80%,60%)';
        });
    },{passive:true});
})();
