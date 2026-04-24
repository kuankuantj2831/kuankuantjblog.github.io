/**
 * 功能 36: 复制当前页面链接
 * 提供全局方法复制当前页面URL
 */
(function() {
    window.copyPageLink = function() {
        navigator.clipboard.writeText(location.href).then(function() {
            var t = document.createElement('div');
            Object.assign(t.style, {
                position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%)',
                background:'#10b981',color:'#fff',padding:'10px 24px',borderRadius:'10px',
                fontSize:'14px',zIndex:'999999',opacity:'0',transition:'opacity 0.3s'
            });
            t.textContent = '✅ 链接已复制到剪贴板';
            document.body.appendChild(t);
            requestAnimationFrame(function(){t.style.opacity='1';});
            setTimeout(function(){t.style.opacity='0';setTimeout(function(){t.remove();},300);},2000);
        });
    };
})();
