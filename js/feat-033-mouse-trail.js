/**
 * 功能 33: 鼠标轨迹拖尾
 * 鼠标移动时留下渐隐的彩色轨迹
 */
(function() {
    if(window.matchMedia('(hover:none)').matches)return;
    var hue=0;
    document.addEventListener('mousemove',function(e){
        hue=(hue+2)%360;
        var dot=document.createElement('div');
        Object.assign(dot.style,{
            position:'fixed',left:e.clientX+'px',top:e.clientY+'px',
            width:'6px',height:'6px',borderRadius:'50%',pointerEvents:'none',
            background:'hsl('+hue+',100%,70%)',zIndex:'999998',
            transition:'all 0.8s ease-out',opacity:'1'
        });
        document.body.appendChild(dot);
        requestAnimationFrame(function(){
            dot.style.opacity='0';
            dot.style.transform='scale(0)';
        });
        setTimeout(function(){dot.remove();},800);
    });
})();
