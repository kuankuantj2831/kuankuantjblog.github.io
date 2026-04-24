/**
 * 功能 29: 彩蛋 - Konami Code
 * 输入上上下下左右左右BA触发彩蛋
 */
(function() {
    var code = [38,38,40,40,37,39,37,39,66,65];
    var pos = 0;
    document.addEventListener('keydown', function(e) {
        if (e.keyCode === code[pos]) {
            pos++;
            if (pos === code.length) {
                pos = 0;
                var overlay = document.createElement('div');
                Object.assign(overlay.style, {
                    position: 'fixed', inset: '0', zIndex: '999999', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)',
                    animation: 'fadeIn 0.5s ease'
                });
                overlay.innerHTML = '<div style="text-align:center;color:#fff;"><div style="font-size:80px;margin-bottom:20px;">🎮🎉🏆</div><h2 style="font-size:28px;margin-bottom:10px;">恭喜发现彩蛋！</h2><p style="color:#ccc;">你是真正的游戏玩家！</p><p style="margin-top:20px;font-size:12px;color:#888;">点击任意处关闭</p></div>';
                overlay.addEventListener('click', function() { overlay.remove(); });
                document.body.appendChild(overlay);
                for (var i = 0; i < 50; i++) {
                    var confetti = document.createElement('div');
                    var colors = ['#ff6b6b','#feca57','#48dbfb','#ff9ff3','#54a0ff'];
                    Object.assign(confetti.style, {
                        position: 'fixed', width: '10px', height: '10px',
                        background: colors[Math.floor(Math.random()*colors.length)],
                        left: Math.random()*100+'%', top: '-10px', zIndex: '9999999',
                        borderRadius: Math.random()>0.5?'50%':'0', pointerEvents: 'none'
                    });
                    document.body.appendChild(confetti);
                    confetti.animate([
                        {transform:'translateY(0) rotate(0deg)',opacity:1},
                        {transform:'translateY('+window.innerHeight+'px) rotate('+Math.random()*720+'deg)',opacity:0}
                    ],{duration:2000+Math.random()*2000,easing:'cubic-bezier(0.25,0.46,0.45,0.94)'}).onfinish=function(){confetti.remove();};
                }
            }
        } else { pos = 0; }
    });
})();
