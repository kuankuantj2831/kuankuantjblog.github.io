/**
 * 功能包 #24: 日历与时间 (116-120)
 */
import FeaturePack from './feature-pack-core.js?v=20260418c';
const { util } = FeaturePack;
const el = util.el;

// 116. 迷你日历
FeaturePack.register('fp116_mini_calendar', {
    name: '迷你日历', desc: '显示当前月迷你日历',
    page: 'index',
    initFn() {
        const div = el('div', {
            width:'220px',background:'white',borderRadius:'12px',
            padding:'15px',boxShadow:'0 2px 10px rgba(0,0,0,0.08)',fontSize:'12px'
        });
        const now = new Date();
        const year = now.getFullYear(), month = now.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = now.getDate();
        let html = `<div style="text-align:center;font-weight:600;margin-bottom:10px">${year}年${month+1}月</div>`;
        html += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center;margin-bottom:4px"><div style="color:#999">日</div><div style="color:#999">一</div><div style="color:#999">二</div><div style="color:#999">三</div><div style="color:#999">四</div><div style="color:#999">五</div><div style="color:#999">六</div></div>';
        html += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center">';
        for (let i = 0; i < firstDay; i++) html += '<div></div>';
        for (let d = 1; d <= daysInMonth; d++) {
            const isToday = d === today;
            html += `<div style="padding:4px;border-radius:50%;${isToday?'background:#667eea;color:white':''}">${d}</div>`;
        }
        html += '</div>';
        div.innerHTML = html;
        const footer = document.querySelector('footer');
        if (footer) footer.insertAdjacentElement('beforebegin', div);
    }
});

// 117. 世界时钟
FeaturePack.register('fp117_world_clock', {
    name: '世界时钟', desc: '显示多个城市时间',
    initFn() {
        const div = el('div', {
            position:'fixed',top:'60px',right:'20px',background:'rgba(0,0,0,0.8)',
            color:'white',padding:'12px 16px',borderRadius:'10px',zIndex:'996',
            fontSize:'12px',backdropFilter:'blur(10px)'
        });
        const cities = [
            { name:'北京', offset:8 },
            { name:'东京', offset:9 },
            { name:'伦敦', offset:0 },
            { name:'纽约', offset:-5 },
        ];
        const update = () => {
            const now = new Date();
            div.innerHTML = cities.map(c => {
                const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
                const cityTime = new Date(utc + (3600000 * c.offset));
                return `<div style="display:flex;justify-content:space-between;gap:15px;margin:2px 0"><span>${c.name}</span><span style="font-family:monospace">${cityTime.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}</span></div>`;
            }).join('');
        };
        update();
        setInterval(update, 60000);
        document.body.appendChild(div);
    }
});

// 118. 倒计时器
FeaturePack.register('fp118_countdown', {
    name: '倒计时', desc: '显示重要事件倒计时',
    page: 'index',
    initFn() {
        const div = el('div', {
            textAlign:'center',padding:'20px',margin:'15px auto',
            background:'linear-gradient(135deg,#667eea,#764ba2)',color:'white',
            borderRadius:'16px',maxWidth:'600px'
        });
        const target = new Date(); target.setDate(target.getDate() + 7);
        const update = () => {
            const diff = target - Date.now();
            const days = Math.floor(diff / 86400000);
            const hours = Math.floor((diff % 86400000) / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            div.innerHTML = `<div style="font-size:14px;opacity:0.9;margin-bottom:8px">⏰ 距离下次更新还有</div><div style="font-size:32px;font-weight:700;font-family:monospace">${days}天 ${hours}时 ${mins}分</div>`;
        };
        update();
        setInterval(update, 60000);
        const showcase = document.querySelector('.resource-showcase');
        if (showcase) showcase.insertAdjacentElement('beforebegin', div);
    }
});

// 119. 计时器
FeaturePack.register('fp119_stopwatch', {
    name: '计时器', desc: '页面停留计时器',
    initFn() {
        const div = el('div', {
            position:'fixed',top:'60px',left:'20px',background:'rgba(0,0,0,0.7)',
            color:'#4ade80',padding:'6px 14px',borderRadius:'20px',
            fontSize:'12px',zIndex:'996',fontFamily:'monospace',backdropFilter:'blur(5px)'
        });
        let seconds = 0;
        const update = () => {
            seconds++;
            const m = Math.floor(seconds / 60).toString().padStart(2, '0');
            const s = (seconds % 60).toString().padStart(2, '0');
            div.textContent = `⏱️ ${m}:${s}`;
        };
        setInterval(update, 1000);
        document.body.appendChild(div);
    }
});

// 120. 番茄钟
FeaturePack.register('fp120_pomodoro', {
    name: '番茄钟', desc: '专注25分钟计时',
    initFn() {
        const div = el('div', {
            position:'fixed',bottom:'420px',right:'20px',width:'50px',height:'50px',
            borderRadius:'50%',background:'#ff6b6b',color:'white',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:'20px',cursor:'pointer',zIndex:'995',boxShadow:'0 4px 15px rgba(255,107,107,0.3)'
        });
        div.innerHTML = '🍅';
        div.title = '番茄钟';
        let running = false, time = 25 * 60, timer;
        div.addEventListener('click', () => {
            if (!running) {
                running = true;
                timer = setInterval(() => {
                    time--;
                    const m = Math.floor(time/60).toString().padStart(2,'0');
                    const s = (time%60).toString().padStart(2,'0');
                    div.innerHTML = `<span style="font-size:11px;font-family:monospace">${m}:${s}</span>`;
                    if (time <= 0) { clearInterval(timer); running = false; time = 25*60; div.innerHTML = '🍅'; alert('🎉 番茄钟结束！休息一下吧'); }
                }, 1000);
            } else {
                clearInterval(timer); running = false; time = 25*60; div.innerHTML = '🍅';
            }
        });
        document.body.appendChild(div);
    }
});
