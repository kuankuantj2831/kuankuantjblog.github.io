import FeaturePack from './feature-pack-core.js?v=20260418c';
const { util } = FeaturePack;
const el = util.el;

/**
 * 功能包 #49: 冥想与放松 (241-245)
 */
FeaturePack.register('fp241_breath_guide', {
    name: '呼吸引导', desc: '浮动呼吸球引导用户进行深呼吸放松',
    initFn() {
        const breath = el("div",{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"100px",height:"100px",borderRadius:"50%",background:"rgba(102,126,234,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",color:"#667eea",zIndex:"9998",pointerEvents:"none",opacity:0,transition:"opacity 0.5s"}); breath.textContent = "吸气"; document.body.appendChild(breath); let phase = 0; setInterval(()=>{ breath.style.opacity = 0.1; const sizes = ["100px","150px","150px","100px"]; const texts = ["吸气","保持","呼气","保持"]; breath.style.width = sizes[phase]; breath.style.height = sizes[phase]; breath.textContent = texts[phase]; breath.style.opacity = 0.3; phase = (phase+1)%4; }, 4000);
    }
});

FeaturePack.register('fp242_rain_sound', {
    name: '雨声模拟', desc: '页面顶部显示雨滴动画营造氛围',
    initFn() {
        const rain = el("div",{position:"fixed",top:0,left:0,right:0,height:"100%",pointerEvents:"none",zIndex:0,overflow:"hidden"}); for(let i=0;i<50;i++){ const drop = el("div",{position:"absolute",width:"1px",height:(Math.random()*15+5)+"px",background:"rgba(150,150,200,0.3)",left:Math.random()*100+"%",animation:"rain "+(Math.random()*0.5+0.5)+"s linear infinite"}); rain.appendChild(drop); } document.body.appendChild(rain); const rs = document.createElement("style"); rs.textContent = "@keyframes rain{to{transform:translateY(100vh)}}"; document.head.appendChild(rs);
    }
});

FeaturePack.register('fp243_focus_mode', {
    name: '专注模式', desc: '一键隐藏所有干扰元素只保留文章内容', page: 'article',
    initFn() {
        const btn = el("div",{position:"fixed",top:"20px",right:"80px",padding:"8px 15px",background:"#667eea",color:"#fff",borderRadius:"20px",cursor:"pointer",zIndex:"9999",fontSize:"13px"}); btn.textContent = "🧘 专注"; let focused = false; btn.onclick = () => { focused = !focused; document.querySelectorAll("nav, .sidebar, footer, .comment-section").forEach(el => el.style.display = focused?"none":""); document.querySelector("article").style.maxWidth = focused?"800px":""; document.querySelector("article").style.margin = focused?"0 auto":""; btn.textContent = focused?"🧘 退出":"🧘 专注"; }; document.body.appendChild(btn);
    }
});

FeaturePack.register('fp244_nature_sounds', {
    name: '自然音效', desc: '在页面角落显示自然场景切换按钮',
    initFn() {
        const nature = el("div",{position:"fixed",bottom:"20px",right:"80px",padding:"10px",background:"#fff",borderRadius:"50%",cursor:"pointer",zIndex:"9999",fontSize:"24px",boxShadow:"0 2px 10px rgba(0,0,0,0.1)"}); const scenes = ["🌊","🌲","🔥","💨"]; let sIdx = 0; nature.textContent = scenes[0]; nature.onclick = () => { sIdx = (sIdx+1)%scenes.length; nature.textContent = scenes[sIdx]; const msg = el("div",{position:"fixed",bottom:"70px",right:"80px",padding:"8px 12px",background:"#333",color:"#fff",borderRadius:"8px",fontSize:"12px",zIndex:"9999"}); msg.textContent = "切换到: " + scenes[sIdx]; document.body.appendChild(msg); setTimeout(()=>msg.remove(),1500); }; document.body.appendChild(nature);
    }
});

FeaturePack.register('fp245_calm_timer', {
    name: '静心计时', desc: '简单的5分钟静心倒计时器',
    initFn() {
        const ct = el("div",{position:"fixed",top:"50%",right:"20px",transform:"translateY(-50%)",padding:"15px",background:"#fff",borderRadius:"12px",boxShadow:"0 2px 10px rgba(0,0,0,0.1)",zIndex:"9999",textAlign:"center",display:"none"}); ct.innerHTML = '<div style="font-size:32px">🧘</div><div id="calmTime" style="font-size:24px;font-family:monospace;margin:10px">05:00</div><button style="padding:5px 15px;background:#4ecdc4;color:#fff;border:none;border-radius:15px;cursor:pointer">开始</button>'; document.body.appendChild(ct); const toggle = el("div",{position:"fixed",top:"50%",right:0,transform:"translateY(-50%)",padding:"10px 5px",background:"#4ecdc4",color:"#fff",borderRadius:"8px 0 0 8px",cursor:"pointer",zIndex:"9999",writingMode:"vertical-rl"}); toggle.textContent = "🧘静心"; toggle.onclick = () => ct.style.display = ct.style.display==="none"?"block":"none"; document.body.appendChild(toggle); let calmSec = 300, calmRunning = false; ct.querySelector("button").onclick = () => { calmRunning = !calmRunning; ct.querySelector("button").textContent = calmRunning?"暂停":"继续"; }; setInterval(()=>{ if(calmRunning && calmSec>0){ calmSec--; const m = Math.floor(calmSec/60).toString().padStart(2,"0"); const s = (calmSec%60).toString().padStart(2,"0"); document.getElementById("calmTime").textContent = m+":"+s; if(calmSec===0){ ct.querySelector("button").textContent = "完成"; calmRunning=false; calmSec=300; } } },1000);
    }
});
