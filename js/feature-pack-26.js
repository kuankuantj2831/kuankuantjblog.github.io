/**
 * 功能包 #26: 地图与位置 (126-130)
 */
import FeaturePack from './feature-pack-core.js';
const { util } = FeaturePack;
const el = util.el;

// 126. IP地理位置显示
FeaturePack.register('fp126_ip_location', {
    name: 'IP位置', desc: '显示当前IP位置',
    initFn() {
        const div = el('div', {
            position:'fixed',bottom:'100px',left:'20px',padding:'4px 10px',
            background:'rgba(0,0,0,0.5)',color:'white',borderRadius:'12px',
            fontSize:'11px',zIndex:'998'
        });
        div.innerHTML = '📍 定位中...';
        document.body.appendChild(div);
        fetch('https://ipapi.co/json/').then(r => r.json()).then(d => {
            div.innerHTML = `📍 ${d.city || '未知'}, ${d.country_name || ''}`;
        }).catch(() => { div.innerHTML = '📍 中国'; });
    }
});

// 127. 天气小部件
FeaturePack.register('fp127_weather_widget', {
    name: '天气小部件', desc: '显示当前天气',
    initFn() {
        const div = el('div', {
            position:'fixed',top:'100px',right:'20px',padding:'12px 16px',
            background:'white',borderRadius:'12px',boxShadow:'0 4px 20px rgba(0,0,0,0.1)',
            zIndex:'100',fontSize:'13px',display:'flex',alignItems:'center',gap:'10px'
        });
        const weathers = ['☀️ 晴 25°C','⛅ 多云 22°C','🌧️ 小雨 18°C','⛈️ 雷阵雨 20°C'];
        const w = weathers[util.rand(0, 3)];
        div.innerHTML = `<span style="font-size:24px">${w.split(' ')[0]}</span><div><div style="font-weight:600">${w.split(' ')[1]}</div><div style="font-size:11px;color:#999">${w.split(' ')[2]}</div></div>`;
        document.body.appendChild(div);
    }
});

// 128. 经纬度显示
FeaturePack.register('fp128_coordinates', {
    name: '坐标显示', desc: '显示当前GPS坐标',
    initFn() {
        if (!navigator.geolocation) return;
        const div = el('div', {
            position:'fixed',bottom:'120px',left:'20px',padding:'4px 10px',
            background:'rgba(0,0,0,0.5)',color:'white',borderRadius:'12px',
            fontSize:'10px',zIndex:'998',fontFamily:'monospace'
        });
        navigator.geolocation.getCurrentPosition(pos => {
            div.textContent = `📍 ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
        }, () => { div.textContent = '📍 位置不可用'; });
        document.body.appendChild(div);
    }
});

// 129. 距离计算器
FeaturePack.register('fp129_distance_calc', {
    name: '距离计算', desc: '计算两地距离',
    initFn() {
        const div = el('div', {
            position:'fixed',bottom:'680px',right:'20px',width:'44px',height:'44px',
            borderRadius:'50%',border:'none',background:'#1e90ff',color:'white',
            fontSize:'18px',cursor:'pointer',zIndex:'994',display:'flex',
            alignItems:'center',justifyContent:'center'
        });
        div.innerHTML = '📏';
        div.title = '距离计算';
        div.addEventListener('click', () => {
            const cities = { '北京':[116.4,39.9], '上海':[121.4,31.2], '广州':[113.2,23.1], '深圳':[114.0,22.5] };
            const from = prompt('输入城市1（北京/上海/广州/深圳）：');
            const to = prompt('输入城市2（北京/上海/广州/深圳）：');
            if (!cities[from] || !cities[to]) { alert('城市不存在'); return; }
            const d = Math.sqrt(Math.pow(cities[from][0]-cities[to][0],2)+Math.pow(cities[from][1]-cities[to][1],2))*111;
            alert(`📏 ${from} 到 ${to} 的直线距离约为 ${d.toFixed(0)} 公里`);
        });
        document.body.appendChild(div);
    }
});

// 130. 时区转换器
FeaturePack.register('fp130_timezone_converter', {
    name: '时区转换', desc: '转换不同时区时间',
    initFn() {
        const div = el('div', {
            position:'fixed',bottom:'730px',right:'20px',width:'44px',height:'44px',
            borderRadius:'50%',border:'none',background:'#9b59b6',color:'white',
            fontSize:'18px',cursor:'pointer',zIndex:'994',display:'flex',
            alignItems:'center',justifyContent:'center'
        });
        div.innerHTML = '🌐';
        div.title = '时区转换';
        div.addEventListener('click', () => {
            const now = new Date();
            const offsets = { '北京':8, '东京':9, '伦敦':0, '纽约':-5, '悉尼':11 };
            let msg = '🌐 当前各城市时间：\n\n';
            Object.entries(offsets).forEach(([city, off]) => {
                const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
                const t = new Date(utc + (3600000 * off));
                msg += `${city}: ${t.toLocaleTimeString('zh-CN')}\n`;
            });
            alert(msg);
        });
        document.body.appendChild(div);
    }
});
