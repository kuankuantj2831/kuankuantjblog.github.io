/**
 * 功能 22: 页面水印
 * 为页面添加半透明水印防止截图盗用
 */
(function() {
    function createWatermark(text) {
        var canvas = document.createElement('canvas');
        canvas.width = 300; canvas.height = 200;
        var ctx = canvas.getContext('2d');
        ctx.rotate(-20 * Math.PI / 180);
        ctx.font = '14px Arial';
        ctx.fillStyle = 'rgba(0,0,0,0.03)';
        ctx.fillText(text, 30, 100);
        ctx.fillText(new Date().toLocaleDateString(), 30, 120);
        var div = document.createElement('div');
        Object.assign(div.style, {
            position: 'fixed', inset: '0', zIndex: '999998', pointerEvents: 'none',
            backgroundImage: 'url(' + canvas.toDataURL() + ')', backgroundRepeat: 'repeat'
        });
        document.body.appendChild(div);
    }
    createWatermark('Hakimi Blog');
})();
