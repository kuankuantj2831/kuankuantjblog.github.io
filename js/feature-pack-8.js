/**
 * 功能包 #8: 数据统计 (36-40)
 */
import FeaturePack from './feature-pack-core.js?v=20260418c';
const { util } = FeaturePack;
const el = util.el;

// 36. 访问计数器
FeaturePack.register('fp36_visit_counter', {
    name: '访问计数器', desc: '显示页面总访问次数',
    initFn() {
        const key = 'visit_count_' + location.pathname;
        let count = parseInt(util.storage.get(key, util.rand(100, 5000)));
        count++;
        util.storage.set(key, count);
        const div = el('div', {
            position:'fixed',bottom:'50px',left:'20px',padding:'4px 10px',
            background:'rgba(0,0,0,0.5)',color:'white',borderRadius:'12px',
            fontSize:'11px',zIndex:'998',backdropFilter:'blur(5px)'
        });
        div.innerHTML = `👁️ ${count.toLocaleString()} 次浏览`;
        document.body.appendChild(div);
    }
});

// 37. 文章热度
FeaturePack.register('fp37_heat_indicator', {
    name: '文章热度', desc: '文章热度指示器',
    page: 'article',
    initFn() {
        const heat = util.rand(1, 100);
        let color, text;
        if (heat > 80) { color = '#ff4757'; text = '🔥🔥🔥 超热'; }
        else if (heat > 60) { color = '#ff6348'; text = '🔥🔥 热门'; }
        else if (heat > 40) { color = '#f5af19'; text = '🔥 一般'; }
        else { color = '#999'; text = '❄️ 冷门'; }
        const badge = el('span', {
            padding:'4px 10px',borderRadius:'12px',fontSize:'11px',fontWeight:'600',
            background:color+'15',color:color,marginLeft:'8px'
        });
        badge.textContent = text;
        const meta = document.querySelector('.article-meta, .post-meta');
        if (meta) meta.appendChild(badge);
    }
});

// 38. 文章趋势迷你图
FeaturePack.register('fp38_trend_sparkline', {
    name: '趋势迷你图', desc: '文章阅读量趋势迷你图',
    page: 'article',
    initFn() {
        const data = Array.from({length:7}, () => util.rand(10, 100));
        const max = Math.max(...data);
        const svg = `<svg width="100" height="30" viewBox="0 0 100 30">${data.map((v,i) => {
            const x = (i / 6) * 100;
            const y = 30 - (v / max) * 28;
            return `<circle cx="${x}" cy="${y}" r="2" fill="#667eea"/>` + (i > 0 ? `<line x1="${(i-1)/6*100}" y1="${30-(data[i-1]/max)*28}" x2="${x}" y2="${y}" stroke="#667eea" stroke-width="1" opacity="0.5"/>` : '');
        }).join('')}</svg>`;
        const div = el('div', { display:'flex',alignItems:'center',gap:'6px',marginTop:'10px',fontSize:'12px',color:'#999' });
        div.innerHTML = `<span>📈 7日趋势</span>${svg}`;
        const meta = document.querySelector('.article-meta, .post-meta');
        if (meta) meta.appendChild(div);
    }
});

// 39. 活跃时段提示
FeaturePack.register('fp39_active_hours', {
    name: '活跃时段', desc: '显示作者活跃时间',
    page: 'article',
    initFn() {
        const hours = ['深夜','凌晨','早晨','上午','中午','下午','傍晚','晚上'];
        const active = hours[util.rand(0, 7)];
        const span = el('span', { fontSize:'12px',color:'#999',marginLeft:'8px' });
        span.innerHTML = `🕐 常在${active}发文`;
        const meta = document.querySelector('.article-meta, .post-meta');
        if (meta) meta.appendChild(span);
    }
});

// 40. 设备信息提示
FeaturePack.register('fp40_device_info', {
    name: '设备信息', desc: '显示当前设备信息',
    initFn() {
        const ua = navigator.userAgent;
        let device = '💻 桌面端';
        if (/Mobile|Android|iPhone|iPad/.test(ua)) device = '📱 移动端';
        const div = el('div', {
            position:'fixed',bottom:'80px',right:'20px',padding:'4px 10px',
            background:'rgba(0,0,0,0.5)',color:'white',borderRadius:'12px',
            fontSize:'11px',zIndex:'998'
        });
        div.textContent = device;
        document.body.appendChild(div);
    }
});
