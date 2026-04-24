/**
 * 功能 40: 页面滚动方向指示器
 * 在页面边缘显示滚动方向箭头
 */
(function() {
    var lastY = 0;
    var arrow = document.createElement('div');
    Object.assign(arrow.style, {
        position:'fixed',right:'10px',top:'50%',transform:'translateY(-50%)',
        fontSize:'20px',opacity:'0',transition:'opacity 0.3s,transform 0.3s',
        pointerEvents:'none',zIndex:'9990',color:'rgba(102,126,234,0.5)'
    });
    document.body.appendChild(arrow);
    var hideTimer;
    window.addEventListener('scroll',function(){
        var y=window.scrollY;
        arrow.textContent=y>lastY?'▼':'▲';
        arrow.style.opacity='1';
        clearTimeout(hideTimer);
        hideTimer=setTimeout(function(){arrow.style.opacity='0';},800);
        lastY=y;
    },{passive:true});
})();
