/**
 * 功能包 #25: 游戏与娱乐 (121-125)
 */
import FeaturePack from './feature-pack-core.js?v=20260418c';
const { util } = FeaturePack;
const el = util.el;

// 121. 猜数字小游戏
FeaturePack.register('fp121_guess_number', {
    name: '猜数字游戏', desc: '迷你猜数字游戏',
    initFn() {
        const div = el('div', {
            position:'fixed',bottom:'480px',right:'20px',width:'44px',height:'44px',
            borderRadius:'50%',border:'none',background:'#f5af19',color:'white',
            fontSize:'20px',cursor:'pointer',zIndex:'994',display:'flex',
            alignItems:'center',justifyContent:'center',boxShadow:'0 4px 15px rgba(245,175,25,0.3)'
        });
        div.innerHTML = '🎮';
        div.title = '猜数字';
        let target = util.rand(1, 100), tries = 0;
        div.addEventListener('click', () => {
            const guess = prompt('🎮 猜数字游戏\n我想了一个 1-100 的数字，你来猜！');
            if (!guess) return;
            const n = parseInt(guess);
            tries++;
            if (n === target) { alert(`🎉 恭喜你猜对了！答案是 ${target}，你用了 ${tries} 次`); target = util.rand(1,100); tries = 0; }
            else if (n < target) alert('📈 太小了！再试试');
            else alert('📉 太大了！再试试');
        });
        document.body.appendChild(div);
    }
});

// 122. 石头剪刀布
FeaturePack.register('fp122_rock_paper', {
    name: '石头剪刀布', desc: '迷你猜拳游戏',
    initFn() {
        const div = el('div', {
            position:'fixed',bottom:'530px',right:'20px',width:'44px',height:'44px',
            borderRadius:'50%',border:'none',background:'#667eea',color:'white',
            fontSize:'20px',cursor:'pointer',zIndex:'994',display:'flex',
            alignItems:'center',justifyContent:'center'
        });
        div.innerHTML = '✊';
        div.title = '石头剪刀布';
        div.addEventListener('click', () => {
            const choices = ['✊ 石头','✋ 布','✌️ 剪刀'];
            const user = prompt('✊✋✌️ 石头剪刀布\n输入 1-石头, 2-布, 3-剪刀');
            if (!user) return;
            const u = parseInt(user) - 1;
            if (u < 0 || u > 2) return;
            const c = util.rand(0, 2);
            let result;
            if (u === c) result = '平局！';
            else if ((u+1)%3 === c) result = '你输了！';
            else result = '你赢了！🎉';
            alert(`你: ${choices[u]}\n电脑: ${choices[c]}\n\n${result}`);
        });
        document.body.appendChild(div);
    }
});

// 123. 每日运势
FeaturePack.register('fp123_daily_fortune', {
    name: '每日运势', desc: '显示今日运势',
    page: 'index',
    initFn() {
        const fortunes = ['大吉⭐⭐⭐⭐⭐','吉⭐⭐⭐⭐','中吉⭐⭐⭐','小吉⭐⭐','平⭐'];
        const aspects = ['事业','财运','爱情','健康'];
        const f = fortunes[util.rand(0, 4)];
        const div = el('div', {
            textAlign:'center',padding:'15px',margin:'15px auto',
            background:'linear-gradient(135deg,#ffd70020,#ff6b6b20)',borderRadius:'12px',
            maxWidth:'400px',border:'1px solid #ffd70030'
        });
        div.innerHTML = `<div style="font-size:20px;margin-bottom:8px">🔮 今日运势</div><div style="font-size:24px;font-weight:700;color:#f5af19">${f}</div><div style="font-size:12px;color:#999;margin-top:8px">${aspects.map(a => `${a}: ${fortunes[util.rand(0,4)].replace(/⭐/g,'')}`).join(' | ')}</div>`;
        const hero = document.querySelector('.hero-section');
        if (hero) hero.insertAdjacentElement('afterend', div);
    }
});

// 124. 摇骰子
FeaturePack.register('fp124_dice_roll', {
    name: '摇骰子', desc: '随机摇骰子',
    initFn() {
        const div = el('div', {
            position:'fixed',bottom:'580px',right:'20px',width:'44px',height:'44px',
            borderRadius:'50%',border:'none',background:'#ff4757',color:'white',
            fontSize:'20px',cursor:'pointer',zIndex:'994',display:'flex',
            alignItems:'center',justifyContent:'center'
        });
        div.innerHTML = '🎲';
        div.title = '摇骰子';
        div.addEventListener('click', () => {
            const dice = ['⚀','⚁','⚂','⚃','⚄','⚅'];
            const result = dice[util.rand(0, 5)];
            div.innerHTML = result;
            setTimeout(() => div.innerHTML = '🎲', 1500);
        });
        document.body.appendChild(div);
    }
});

// 125. 幸运抽签
FeaturePack.register('fp125_fortune_draw', {
    name: '幸运抽签', desc: '抽取今日签文',
    initFn() {
        const div = el('div', {
            position:'fixed',bottom:'630px',right:'20px',width:'44px',height:'44px',
            borderRadius:'50%',border:'none',background:'#2ed573',color:'white',
            fontSize:'20px',cursor:'pointer',zIndex:'994',display:'flex',
            alignItems:'center',justifyContent:'center'
        });
        div.innerHTML = '🎋';
        div.title = '幸运签';
        const sticks = ['一帆风顺','万事如意','心想事成','步步高升','平安喜乐','财源广进'];
        div.addEventListener('click', () => {
            const s = sticks[util.rand(0, sticks.length - 1)];
            alert(`🎋 今日签文：${s}\n\n✨ 祝您好运！`);
        });
        document.body.appendChild(div);
    }
});
