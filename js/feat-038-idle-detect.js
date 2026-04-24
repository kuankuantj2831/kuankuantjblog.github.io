/**
 * 功能 38: 空闲检测
 * 用户长时间不操作时显示提示
 */
(function() {
    var timeout = 5 * 60 * 1000; // 5分钟
    var timer = null;
    var shown = false;
    function reset() {
        clearTimeout(timer);
        if (shown) return;
        timer = setTimeout(function() {
            shown = true;
            var overlay = document.createElement('div');
            Object.assign(overlay.style, {
                position:'fixed',inset:'0',background:'rgba(0,0,0,0.6)',zIndex:'999999',
                display:'flex',alignItems:'center',justifyContent:'center',
                backdropFilter:'blur(5px)',cursor:'pointer'
            });
            overlay.innerHTML = '<div style="text-align:center;color:#fff;"><div style="font-size:60px;margin-bottom:20px;">😴</div><h2>你还在吗？</h2><p style="color:#ccc;margin-top:10px;">点击任意处继续浏览</p></div>';
            overlay.addEventListener('click', function() {
                overlay.remove();
                shown = false;
                reset();
            });
            document.body.appendChild(overlay);
        }, timeout);
    }
    ['mousemove','keydown','scroll','touchstart','click'].forEach(function(evt) {
        document.addEventListener(evt, reset, { passive: true });
    });
    reset();
})();
