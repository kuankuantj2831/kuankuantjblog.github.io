/**
 * 功能 25: 鼠标点击烟花效果
 * 点击页面时产生彩色粒子爆炸效果
 */
(function() {
    var colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#01a3a4', '#f368e0'];
    document.addEventListener('click', function(e) {
        for (var i = 0; i < 12; i++) {
            var particle = document.createElement('div');
            var color = colors[Math.floor(Math.random() * colors.length)];
            var size = Math.random() * 8 + 4;
            Object.assign(particle.style, {
                position: 'fixed', left: e.clientX + 'px', top: e.clientY + 'px',
                width: size + 'px', height: size + 'px', borderRadius: '50%',
                background: color, pointerEvents: 'none', zIndex: '999999'
            });
            document.body.appendChild(particle);
            var angle = (Math.PI * 2 / 12) * i;
            var velocity = 60 + Math.random() * 60;
            var dx = Math.cos(angle) * velocity;
            var dy = Math.sin(angle) * velocity;
            particle.animate([
                { transform: 'translate(0,0) scale(1)', opacity: 1 },
                { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(0)', opacity: 0 }
            ], { duration: 600 + Math.random() * 400, easing: 'cubic-bezier(0,0.9,0.57,1)' })
            .onfinish = function() { particle.remove(); };
        }
    });
})();
