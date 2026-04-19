/**
 * 功能包 #36: 随机与抽奖 (176-180)
 */
import FeaturePack from './feature-pack-core.js?v=20260419a';
const { util } = FeaturePack;
const el = util.el;

// 176. 随机名言
FeaturePack.register('fp176_random_quote', {
    name: '随机名言', desc: '随机显示名言',
    initFn() {
        const quotes = [
            { text:'Stay hungry, stay foolish.', author:'Steve Jobs' },
            { text:'Talk is cheap. Show me the code.', author:'Linus Torvalds' },
            { text:'Code is like humor. When you have to explain it, it’s bad.', author:'Cory House' },
        ];
        const q = quotes[util.rand(0, quotes.length - 1)];
        const div = el('div', {
            textAlign:'center',padding:'10px',fontSize:'12px',color:'#999',fontStyle:'italic'
        });
        div.innerHTML = `"${q.text}" — ${q.author}`;
        const footer = document.querySelector('footer');
        if (footer) footer.insertAdjacentElement('beforebegin', div);
    }
});

// 177. 随机背景
FeaturePack.register('fp177_random_bg', {
    name: '随机背景', desc: '随机切换页面背景',
    initFn() {
        const gradients = [
            'linear-gradient(135deg,#667eea,#764ba2)',
            'linear-gradient(135deg,#11998e,#38ef7d)',
            'linear-gradient(135deg,#fc466b,#3f5efb)',
            'linear-gradient(135deg,#f5af19,#f12711)',
        ];
        const hero = document.querySelector('.hero-section');
        if (hero) hero.style.background = gradients[util.rand(0, 3)];
    }
});

// 178. 每日挑战
FeaturePack.register('fp178_daily_challenge', {
    name: '每日挑战', desc: '每日编程挑战',
    page: 'index',
    initFn() {
        const challenges = ['写一段递归函数','优化一个算法','学习一个新API','重构一段代码'];
        const c = challenges[util.rand(0, challenges.length - 1)];
        const div = el('div', {
            padding:'15px',background:'linear-gradient(135deg,#f5af19,#f12711)',color:'white',
            borderRadius:'12px',margin:'15px auto',maxWidth:'400px',textAlign:'center'
        });
        div.innerHTML = `<div style="font-size:12px;opacity:0.9">🏆 今日挑战</div><div style="font-size:16px;font-weight:600;margin-top:4px">${c}</div>`;
        const showcase = document.querySelector('.resource-showcase');
        if (showcase) showcase.insertAdjacentElement('beforebegin', div);
    }
});

// 179. 抽奖转盘（简化）
FeaturePack.register('fp179_mini_wheel', {
    name: '迷你抽奖', desc: '简单抽奖功能',
    initFn() {
        const btn = el('button', {
            position:'fixed',bottom:'1630px',right:'20px',width:'44px',height:'44px',
            borderRadius:'50%',border:'none',background:'#e67e22',color:'white',
            fontSize:'18px',cursor:'pointer',zIndex:'994',display:'flex',
            alignItems:'center',justifyContent:'center'
        });
        btn.innerHTML = '🎯';
        btn.title = '抽奖';
        const prizes = ['🪙 10硬币','⭐ 50经验','🎁 神秘礼包','😅 谢谢参与','🪙 20硬币'];
        btn.addEventListener('click', () => {
            btn.style.animation = 'spin 1s';
            const s = document.createElement('style');
            s.textContent = '@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}';
            document.head.appendChild(s);
            setTimeout(() => {
                btn.style.animation = '';
                alert(`🎯 抽奖结果：${prizes[util.rand(0, prizes.length - 1)]}`);
            }, 1000);
        });
        document.body.appendChild(btn);
    }
});

// 180. 随机壁纸
FeaturePack.register('fp180_random_wallpaper', {
    name: '随机壁纸', desc: '随机切换背景壁纸',
    initFn() {
        const btn = el('button', {
            position:'fixed',bottom:'1680px',right:'20px',width:'44px',height:'44px',
            borderRadius:'50%',border:'none',background:'#1abc9c',color:'white',
            fontSize:'18px',cursor:'pointer',zIndex:'994',display:'flex',
            alignItems:'center',justifyContent:'center'
        });
        btn.innerHTML = '🖼️';
        btn.title = '随机壁纸';
        btn.addEventListener('click', () => {
            document.body.style.backgroundImage = `url(https://picsum.photos/1920/1080?random=${Date.now()})`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundAttachment = 'fixed';
        });
        document.body.appendChild(btn);
    }
});
