import FeaturePack from './feature-pack-core.js?v=20260418c';
const { util } = FeaturePack;
const el = util.el;

/**
 * 功能包 #47: 智能家居 (231-235)
 */
FeaturePack.register('fp231_device_status', {
    name: '设备状态', desc: '模拟展示智能家居设备在线状态面板', page: 'profile',
    initFn() {
        const panel = el("div",{marginTop:"20px",padding:"15px",background:"#f8f9fa",borderRadius:"12px"}); panel.innerHTML = '<h3>🏠 智能设备</h3><div style="display:flex;gap:15px;margin-top:10px"><div style="text-align:center">💡<br><span style="font-size:12px">灯光</span><br><span style="color:#4ecdc4">●</span></div><div style="text-align:center">🌡️<br><span style="font-size:12px">空调</span><br><span style="color:#4ecdc4">●</span></div><div style="text-align:center">📹<br><span style="font-size:12px">监控</span><br><span style="color:#4ecdc4">●</span></div></div>'; const container = document.querySelector(".profile-container"); if(container) container.appendChild(panel);
    }
});

FeaturePack.register('fp232_room_temp', {
    name: '室温显示', desc: '显示当前模拟室温并随时间微调', page: 'index',
    initFn() {
        const temp = el("div",{position:"fixed",top:"120px",right:"20px",padding:"8px 15px",background:"rgba(255,255,255,0.9)",borderRadius:"20px",fontSize:"13px",zIndex:"9999",boxShadow:"0 2px 10px rgba(0,0,0,0.1)"}); const base = 24; const hour = new Date().getHours(); const t = base + Math.sin((hour-6)*Math.PI/12)*3; temp.textContent = "🌡️ " + t.toFixed(1) + "°C"; document.body.appendChild(temp);
    }
});

FeaturePack.register('fp233_energy_usage', {
    name: '能耗图表', desc: '展示今日网站访问能耗趣味统计', page: 'index',
    initFn() {
        const energy = el("div",{position:"fixed",bottom:"120px",right:"20px",padding:"10px",background:"#fff",borderRadius:"12px",boxShadow:"0 2px 10px rgba(0,0,0,0.1)",fontSize:"12px",zIndex:"9999",display:"none"}); energy.textContent = "⚡ 今日节省: 0.02度电"; document.body.appendChild(energy); setTimeout(()=>energy.style.display="block", 5000);
    }
});

FeaturePack.register('fp234_smart_light', {
    name: '智能灯光', desc: '根据时间自动切换页面亮暗色调',
    initFn() {
        const h = new Date().getHours(); if(h>=18||h<6){ document.querySelectorAll(".card, article").forEach(el => { el.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)"; }); }
    }
});

FeaturePack.register('fp235_voice_control', {
    name: '语音控制', desc: '支持语音命令控制页面功能（模拟）',
    initFn() {
        const mic = el("div",{position:"fixed",bottom:"20px",left:"50%",transform:"translateX(-50%)",width:"50px",height:"50px",borderRadius:"50%",background:"#667eea",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px",cursor:"pointer",zIndex:"9999",boxShadow:"0 4px 15px rgba(102,126,234,0.4)"}); mic.textContent = "🎤"; mic.onclick = () => { mic.style.animation = "pulse 0.5s ease 3"; const resp = el("div",{position:"fixed",bottom:"80px",left:"50%",transform:"translateX(-50%)",padding:"10px 20px",background:"#333",color:"#fff",borderRadius:"20px",fontSize:"14px",zIndex:"9999"}); resp.textContent = "🎙️ 请说命令..."; document.body.appendChild(resp); setTimeout(()=>{ resp.textContent = "✓ 已识别: '打开夜间模式'"; setTimeout(()=>resp.remove(), 2000); }, 2000); setTimeout(()=>mic.style.animation="", 2000); }; document.body.appendChild(mic);
    }
});
