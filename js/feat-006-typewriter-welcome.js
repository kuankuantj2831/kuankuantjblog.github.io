/**
 * 功能 6: 打字机欢迎语
 * 页面加载时在顶部显示打字机效果的欢迎语
 */
(function() {
    var greetings = [
        '欢迎来到 Hakimi 的猫爬架 🐱',
        '今天也要元气满满哦 ✨',
        '探索新知识，发现新世界 🌍',
        '代码改变世界，分享创造价值 💻',
        '每一天都是新的开始 🌅'
    ];
    var text = greetings[Math.floor(Math.random() * greetings.length)];
    var bar = document.createElement('div');
    Object.assign(bar.style, {
        position: 'fixed', top: '0', left: '0', right: '0', zIndex: '999999',
        background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff',
        textAlign: 'center', padding: '8px 20px', fontSize: '14px', fontWeight: '500',
        transform: 'translateY(-100%)', transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        letterSpacing: '1px'
    });
    var span = document.createElement('span');
    bar.appendChild(span);
    document.body.appendChild(bar);

    setTimeout(function() { bar.style.transform = 'translateY(0)'; }, 500);

    var i = 0;
    var timer = setInterval(function() {
        if (i <= text.length) {
            span.textContent = text.substring(0, i);
            i++;
        } else {
            clearInterval(timer);
            setTimeout(function() {
                bar.style.transform = 'translateY(-100%)';
                setTimeout(function() { bar.remove(); }, 500);
            }, 2500);
        }
    }, 60);
})();
