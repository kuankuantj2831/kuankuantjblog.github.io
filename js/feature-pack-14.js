/**
 * 功能包 #14: 通知与提醒 (66-70)
 */
import FeaturePack from './feature-pack-core.js?v=20260419a';
const { util } = FeaturePack;
const el = util.el;

// 66. 定时提醒
FeaturePack.register('fp66_reminder', {
    name: '定时提醒', desc: '设置页面停留提醒',
    initFn() {
        const times = [5, 15, 30, 60];
        const msg = [
            '⏰ 您已经浏览了5分钟，记得休息一下眼睛~',
            '⏰ 您已经浏览了15分钟，起来活动一下吧！',
            '⏰ 您已经浏览了30分钟，该休息一下了~',
            '⏰ 您已经浏览了1小时了，建议关闭页面休息！'
        ];
        let idx = 0;
        const interval = setInterval(() => {
            if (idx < times.length) {
                const toast = el('div', {
                    position:'fixed',bottom:'120px',left:'50%',transform:'translateX(-50%)',
                    background:'linear-gradient(135deg,#667eea,#764ba2)',color:'white',
                    padding:'12px 24px',borderRadius:'25px',fontSize:'13px',zIndex:'99999',
                    boxShadow:'0 4px 15px rgba(102,126,234,0.3)',animation:'slideUp .3s'
                });
                toast.textContent = msg[idx];
                document.body.appendChild(toast);
                setTimeout(() => { toast.style.opacity = '0'; setTimeout(()=>toast.remove(),300); }, 5000);
                idx++;
            } else {
                clearInterval(interval);
            }
        }, 300000);
    }
});

// 67. 新文章推送提示
FeaturePack.register('fp67_new_article_push', {
    name: '新文章提示', desc: '模拟新文章推送通知',
    page: 'index',
    initFn() {
        setTimeout(() => {
            const titles = ['🎉 又有新文章发布了！', '📢 来看看最新内容', '🔥 热门新文章推荐'];
            const toast = el('div', {
                position:'fixed',top:'80px',right:'20px',
                background:'white',borderRadius:'12px',padding:'16px',zIndex:'99999',
                boxShadow:'0 8px 30px rgba(0,0,0,0.15)',maxWidth:'280px',fontSize:'13px',
                animation:'slideInRight .4s'
            });
            toast.innerHTML = `
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                    <span style="font-size:20px">🎉</span>
                    <span style="font-weight:600">${titles[util.rand(0,2)]}</span>
                </div>
                <div style="color:#666;margin-bottom:10px">刚刚发布了新文章，快来看看吧！</div>
                <button style="padding:6px 16px;border:none;border-radius:15px;background:#667eea;color:white;font-size:12px;cursor:pointer">查看</button>
            `;
            document.body.appendChild(toast);
            toast.querySelector('button').addEventListener('click', () => toast.remove());
            setTimeout(() => { toast.style.opacity = '0'; setTimeout(()=>toast.remove(),300); }, 8000);
        }, 30000);
    }
});

// 68. 系统通知中心
FeaturePack.register('fp68_notification_center', {
    name: '通知中心', desc: '右下角通知中心按钮',
    initFn() {
        const btn = el('button', {
            position:'fixed',bottom:'280px',right:'20px',width:'44px',height:'44px',
            borderRadius:'50%',border:'none',background:'#667eea',color:'white',
            fontSize:'18px',cursor:'pointer',zIndex:'996',boxShadow:'0 4px 15px rgba(102,126,234,0.3)',
            display:'flex',alignItems:'center',justifyContent:'center'
        });
        btn.innerHTML = '🔔<span style="position:absolute;top:-2px;right:-2px;width:16px;height:16px;background:#ff4757;border-radius:50%;font-size:10px;display:flex;align-items:center;justify-content:center">3</span>';
        btn.addEventListener('click', () => {
            const panel = el('div', {
                position:'fixed',bottom:'340px',right:'20px',width:'300px',
                background:'white',borderRadius:'12px',padding:'16px',
                boxShadow:'0 8px 30px rgba(0,0,0,0.15)',zIndex:'997',fontSize:'13px'
            });
            panel.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                    <span style="font-weight:600">🔔 通知中心</span>
                    <span id="fp_notif_close" style="cursor:pointer;color:#999">✕</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:8px">
                    <div style="padding:10px;background:#f8f9ff;border-radius:8px">📢 欢迎访问 Hakimi 的猫爬架！</div>
                    <div style="padding:10px;background:#f8f9ff;border-radius:8px">🎮 试试我们的新游戏功能！</div>
                    <div style="padding:10px;background:#f8f9ff;border-radius:8px">💡 按 / 键快速搜索</div>
                </div>
            `;
            document.body.appendChild(panel);
            panel.querySelector('#fp_notif_close').addEventListener('click', () => panel.remove());
        });
        document.body.appendChild(btn);
    }
});

// 69. 每日一句名言
FeaturePack.register('fp69_daily_quote', {
    name: '每日名言', desc: '显示每日名言警句',
    page: 'index',
    initFn() {
        const quotes = [
            { text:'千里之行，始于足下', author:'老子' },
            { text:'不积跬步，无以至千里', author:'荀子' },
            { text:'学而时习之，不亦说乎', author:'孔子' },
            { text:'天行健，君子以自强不息', author:'周易' },
            { text:'博观而约取，厚积而薄发', author:'苏轼' },
        ];
        const q = quotes[util.rand(0, quotes.length - 1)];
        const div = el('div', {
            textAlign:'center',padding:'20px',margin:'15px auto',maxWidth:'600px',
            background:'linear-gradient(135deg,#667eea10,#764ba210)',borderRadius:'12px',
            borderLeft:'4px solid #667eea'
        });
        div.innerHTML = `<div style="font-size:16px;color:#333;font-style:italic">"${q.text}"</div><div style="font-size:12px;color:#999;margin-top:8px">—— ${q.author}</div>`;
        const hero = document.querySelector('.hero-section');
        if (hero) hero.insertAdjacentElement('afterend', div);
    }
});

// 70. 欢迎回来提示
FeaturePack.register('fp70_welcome_back', {
    name: '欢迎回来', desc: '根据访问时间显示欢迎语',
    initFn() {
        const last = util.storage.get('last_visit');
        const now = Date.now();
        util.storage.set('last_visit', now);
        if (!last) return;
        const diff = (now - last) / 1000;
        let msg;
        if (diff < 60) msg = '👋 这么快又回来了！';
        else if (diff < 3600) msg = `👋 欢迎回来！您离开了 ${Math.floor(diff/60)} 分钟`;
        else if (diff < 86400) msg = `👋 欢迎回来！您离开了 ${Math.floor(diff/3600)} 小时`;
        else msg = `👋 好久不见！您离开了 ${Math.floor(diff/86400)} 天`;

        const toast = el('div', {
            position:'fixed',top:'80px',right:'20px',
            background:'white',borderRadius:'12px',padding:'12px 20px',
            boxShadow:'0 4px 15px rgba(0,0,0,0.1)',zIndex:'99999',fontSize:'13px',
            animation:'slideInRight .3s'
        });
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(()=>toast.remove(),300); }, 4000);
    }
});
