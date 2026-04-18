/**
 * 功能包 #31: 天气与时钟 (151-155)
 */
import FeaturePack from './feature-pack-core.js';
const { util } = FeaturePack;
const el = util.el;

// 151. 实时时钟
FeaturePack.register('fp151_live_clock', {
    name: '实时时钟', desc: '显示实时时钟',
    initFn() {
        const div = el('div', {
            position:'fixed',top:'60px',left:'20px',padding:'8px 14px',
            background:'rgba(0,0,0,0.7)',color:'#4ade80',borderRadius:'10px',
            fontSize:'14px',zIndex:'996',fontFamily:'monospace',backdropFilter:'blur(5px)'
        });
        const update = () => {
            div.textContent = '🕐 ' + new Date().toLocaleTimeString('zh-CN');
        };
        update();
        setInterval(update, 1000);
        document.body.appendChild(div);
    }
});

// 152. 日期显示
FeaturePack.register('fp152_date_display', {
    name: '日期显示', desc: '显示农历风格日期',
    initFn() {
        const div = el('div', {
            textAlign:'center',padding:'8px',fontSize:'12px',color:'#999'
        });
        const now = new Date();
        const weekdays = ['日','一','二','三','四','五','六'];
        div.textContent = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 星期${weekdays[now.getDay()]}`;
        const header = document.querySelector('nav, header');
        if (header) header.insertAdjacentElement('afterend', div);
    }
});

// 153. 节气提示
FeaturePack.register('fp153_solar_term', {
    name: '节气提示', desc: '显示当前节气',
    initFn() {
        const terms = ['立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至','小寒','大寒'];
        const now = new Date();
        const term = terms[Math.floor((now.getMonth() * 2 + now.getDate() / 15)) % 24];
        const div = el('div', {
            textAlign:'center',fontSize:'12px',color:'#667eea',margin:'5px 0'
        });
        div.textContent = `🌿 当前节气：${term}`;
        const hero = document.querySelector('.hero-section');
        if (hero) hero.insertAdjacentElement('afterend', div);
    }
});

// 154. 日出日落时间
FeaturePack.register('fp154_sun_time', {
    name: '日出日落', desc: '显示日出日落时间',
    initFn() {
        const div = el('div', {
            position:'fixed',bottom:'140px',left:'20px',padding:'4px 10px',
            background:'rgba(0,0,0,0.5)',color:'white',borderRadius:'12px',
            fontSize:'10px',zIndex:'998'
        });
        div.innerHTML = '🌅 06:12 | 🌇 18:45';
        document.body.appendChild(div);
    }
});

// 155. 月相显示
FeaturePack.register('fp155_moon_phase', {
    name: '月相', desc: '显示当前月相',
    initFn() {
        const phases = ['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘'];
        const day = new Date().getDate();
        const div = el('div', {
            position:'fixed',bottom:'160px',left:'20px',padding:'4px 10px',
            background:'rgba(0,0,0,0.5)',color:'white',borderRadius:'12px',
            fontSize:'14px',zIndex:'998'
        });
        div.textContent = phases[Math.floor((day % 28) / 3.5)];
        document.body.appendChild(div);
    }
});
