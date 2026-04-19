/**
 * 功能包 #4: 社交分享 (16-20)
 */
import FeaturePack from './feature-pack-core.js?v=20260419a';
const { util } = FeaturePack;
const el = util.el;

// 16. 分享增强
FeaturePack.register('fp16_share_enhance', {
    name: '分享增强', desc: '一键分享到各平台',
    page: 'article',
    initFn() {
        const container = el('div', { marginTop:'20px',display:'flex',gap:'10px',flexWrap:'wrap' });
        const url = encodeURIComponent(location.href);
        const title = encodeURIComponent(document.title);
        const btns = [
            { icon:'📱', name:'微信', url:`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${url}` },
            { icon:'🐦', name:'Twitter', url:`https://twitter.com/intent/tweet?url=${url}&text=${title}` },
            { icon:'💬', name:'微博', url:`https://service.weibo.com/share/share.php?url=${url}&title=${title}` },
            { icon:'🔗', name:'复制链接', action:'copy' },
        ];
        btns.forEach(b => {
            const btn = el('button', {
                padding:'8px 16px',border:'1px solid #e0e0e0',borderRadius:'20px',
                background:'white',fontSize:'13px',cursor:'pointer',display:'flex',
                alignItems:'center',gap:'4px',transition:'all .2s'
            });
            btn.innerHTML = `${b.icon} ${b.name}`;
            btn.addEventListener('mouseenter', () => { btn.style.borderColor='#667eea'; btn.style.color='#667eea'; });
            btn.addEventListener('mouseleave', () => { btn.style.borderColor='#e0e0e0'; btn.style.color='inherit'; });
            btn.addEventListener('click', () => {
                if (b.action === 'copy') { navigator.clipboard.writeText(location.href); btn.innerHTML = '✅ 已复制'; setTimeout(()=>btn.innerHTML=`${b.icon} ${b.name}`,2000); }
                else { window.open(b.url, '_blank', 'width=600,height=400'); }
            });
            container.appendChild(btn);
        });
        const content = document.querySelector('.article-content, .post-content, article');
        if (content) content.insertAdjacentElement('afterend', container);
    }
});

// 17. 表情包输入
FeaturePack.register('fp17_emoji_picker', {
    name: '表情包输入', desc: '评论区添加表情包选择器',
    initFn() {
        document.querySelectorAll('textarea, input[type="text"]').forEach(input => {
            if (!input.closest('form')) return;
            const picker = el('span', { cursor:'pointer',fontSize:'20px',marginLeft:'8px',userSelect:'none' });
            picker.textContent = '😀';
            picker.title = '插入表情';
            input.parentElement.style.position = 'relative';
            input.insertAdjacentElement('afterend', picker);

            const panel = el('div', {
                position:'absolute',bottom:'100%',left:'0',display:'none',
                background:'white',borderRadius:'8px',padding:'8px',
                boxShadow:'0 4px 20px rgba(0,0,0,0.15)',zIndex:'999',
                maxWidth:'240px',gridTemplateColumns:'repeat(8,1fr)',gap:'4px'
            });
            const emojis = ['😀','😂','🤣','😊','😍','🥰','😎','🤔','👍','👎','❤️','🔥','🎉','✨','👏','🙏','💪','🤝','🌟','💯','🎯','🚀','💡','🎨','🎮','🎵','📚','💻','☕','🍺'];
            emojis.forEach(emoji => {
                const s = el('span', { cursor:'pointer',fontSize:'18px',padding:'4px',textAlign:'center',borderRadius:'4px' });
                s.textContent = emoji;
                s.addEventListener('mouseenter', () => s.style.background = '#f0f0f0');
                s.addEventListener('mouseleave', () => s.style.background = 'transparent');
                s.addEventListener('click', () => { input.value += emoji; panel.style.display = 'none'; input.focus(); });
                panel.appendChild(s);
            });
            panel.style.display = 'grid';
            panel.style.visibility = 'hidden';
            input.parentElement.appendChild(panel);

            picker.addEventListener('click', () => {
                if (panel.style.visibility === 'hidden') {
                    panel.style.visibility = 'visible';
                    panel.style.display = 'grid';
                } else {
                    panel.style.visibility = 'hidden';
                    panel.style.display = 'none';
                }
            });
            document.addEventListener('click', (e) => {
                if (!picker.contains(e.target) && !panel.contains(e.target)) {
                    panel.style.visibility = 'hidden';
                }
            });
        });
    }
});

// 18. 通知订阅按钮
FeaturePack.register('fp18_notify_subscribe', {
    name: '通知订阅', desc: '浏览器通知订阅按钮',
    initFn() {
        if (!('Notification' in window)) return;
        const btn = el('button', {
            position:'fixed',bottom:'60px',right:'20px',width:'44px',height:'44px',
            borderRadius:'50%',border:'none',background:'#ff6b6b',color:'white',
            fontSize:'20px',cursor:'pointer',zIndex:'998',display:'flex',
            alignItems:'center',justifyContent:'center',boxShadow:'0 4px 15px rgba(255,107,107,0.3)'
        });
        btn.innerHTML = '🔔';
        btn.title = '订阅通知';
        document.body.appendChild(btn);
        btn.addEventListener('click', async () => {
            const perm = await Notification.requestPermission();
            if (perm === 'granted') {
                btn.style.background = '#4ade80';
                new Notification('订阅成功', { body: '您将收到最新文章推送！', icon: '/favicon.ico' });
            }
        });
    }
});

// 19. 打赏浮窗
FeaturePack.register('fp19_reward_float', {
    name: '打赏浮窗', desc: '右下角打赏按钮',
    page: 'article',
    initFn() {
        const btn = el('button', {
            position:'fixed',bottom:'200px',right:'20px',padding:'10px 16px',
            background:'linear-gradient(135deg,#f5af19,#f12711)',color:'white',
            border:'none',borderRadius:'25px',fontSize:'14px',fontWeight:'600',
            cursor:'pointer',zIndex:'997',boxShadow:'0 4px 15px rgba(241,39,17,0.3)',
            transition:'all .3s'
        });
        btn.innerHTML = '🧧 打赏';
        document.body.appendChild(btn);
        btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.05)');
        btn.addEventListener('mouseleave', () => btn.style.transform = '');
        btn.addEventListener('click', () => {
            const modal = el('div', {
                position:'fixed',top:'0',left:'0',right:'0',bottom:'0',
                background:'rgba(0,0,0,0.5)',zIndex:'99999',display:'flex',
                alignItems:'center',justifyContent:'center'
            });
            modal.innerHTML = `
                <div style="background:white;border-radius:16px;padding:30px;max-width:320px;text-align:center;animation:popIn .3s">
                    <div style="font-size:48px;margin-bottom:10px">🧧</div>
                    <h3 style="margin:0 0 10px">打赏作者</h3>
                    <p style="color:#999;font-size:13px;margin:0 0 20px">如果觉得文章对你有帮助，可以打赏支持~</p>
                    <div style="display:flex;gap:10px;justify-content:center;margin-bottom:15px">
                        <button data-amount="1" style="padding:8px 16px;border:2px solid #e0e0e0;border-radius:8px;background:white;cursor:pointer;font-size:14px">🪙 1</button>
                        <button data-amount="5" style="padding:8px 16px;border:2px solid #f5af19;border-radius:8px;background:#fff9f0;cursor:pointer;font-size:14px">🪙 5</button>
                        <button data-amount="10" style="padding:8px 16px;border:2px solid #e0e0e0;border-radius:8px;background:white;cursor:pointer;font-size:14px">🪙 10</button>
                    </div>
                    <button id="fp_close_reward" style="padding:8px 30px;border:none;border-radius:20px;background:#f5f5f5;color:#666;cursor:pointer">关闭</button>
                </div>
                <style>@keyframes popIn{from{transform:scale(.8);opacity:0}to{transform:scale(1);opacity:1}}</style>
            `;
            document.body.appendChild(modal);
            modal.addEventListener('click', (e) => { if (e.target === modal || e.target.id === 'fp_close_reward') modal.remove(); });
            modal.querySelectorAll('[data-amount]').forEach(b => {
                b.addEventListener('click', () => {
                    alert(`感谢打赏 ${b.dataset.amount} 硬币！（演示模式）`);
                    modal.remove();
                });
            });
        });
    }
});

// 20. 页面打印优化
FeaturePack.register('fp20_print_optimize', {
    name: '打印优化', desc: '文章页添加打印按钮',
    page: 'article',
    initFn() {
        const btn = el('button', {
            padding:'6px 14px',border:'1px solid #e0e0e0',borderRadius:'6px',
            background:'white',fontSize:'12px',cursor:'pointer',marginLeft:'10px'
        });
        btn.innerHTML = '🖨️ 打印';
        btn.addEventListener('click', () => window.print());
        const meta = document.querySelector('.article-meta, .post-meta');
        if (meta) meta.appendChild(btn);
    }
});
