/**
 * 功能 27: 页面截图功能
 * 提供一键截图当前页面的功能（使用 html2canvas 或简单方案）
 */
(function() {
    window.takeScreenshot = function() {
        var toast = document.createElement('div');
        Object.assign(toast.style, {
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '20px 30px',
            borderRadius: '16px', fontSize: '14px', zIndex: '999999', textAlign: 'center'
        });
        toast.innerHTML = '📸 截图提示<br><br>请使用以下方式截图：<br>• Windows: Win+Shift+S<br>• Mac: Cmd+Shift+4<br>• 手机: 电源+音量下';
        document.body.appendChild(toast);
        setTimeout(function() { toast.remove(); }, 4000);
    };
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            window.takeScreenshot();
        }
    });
})();
