import FeaturePack from './feature-pack-core.js?v=20260418c';
const { util } = FeaturePack;
const el = util.el;

/**
 * 功能包 #56: 运动与健身 (276-280)
 */
FeaturePack.register('fp276_step_counter', {
    name: '步数模拟', desc: '显示今日虚拟步数和目标进度环', page: 'index',
    initFn() {
        const steps = el("div",{position:"fixed",bottom:"150px",right:"20px",width:"60px",height:"60px",borderRadius:"50%",background:"conic-gradient(#4ecdc4 75%, #eee 0)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:"9999",boxShadow:"0 2px 10px rgba(0,0,0,0.1)"}); steps.innerHTML = '<div style="width:50px;height:50px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;text-align:center"><div>👟<br>7500</div></div>'; document.body.appendChild(steps);
    }
});

FeaturePack.register('fp277_workout_timer', {
    name: '运动计时', desc: '简单的高强度间歇训练计时器',
    initFn() {
        const workout = el("div",{position:"fixed",bottom:"20px",right:"150px",padding:"10px",background:"#ff6b6b",color:"#fff",borderRadius:"50%",cursor:"pointer",zIndex:"9999",fontSize:"20px",boxShadow:"0 4px 15px rgba(255,107,107,0.4)"}); workout.textContent = "🏃"; workout.onclick = () => { alert("🏃 运动计时器\n\n准备: 10秒\n运动: 30秒\n休息: 10秒\n重复: 8组"); }; document.body.appendChild(workout);
    }
});

FeaturePack.register('fp278_water_reminder', {
    name: '喝水提醒', desc: '定时提醒用户喝水的小组件',
    initFn() {
        const water = el("div",{position:"fixed",top:"220px",right:"20px",padding:"10px",background:"rgba(116,185,255,0.9)",color:"#fff",borderRadius:"12px",fontSize:"12px",zIndex:"9999",cursor:"pointer"}); let cups = parseInt(localStorage.getItem("water_cups") || "0"); water.textContent = "💧 " + cups + "/8杯"; water.onclick = () => { cups = Math.min(8, cups+1); localStorage.setItem("water_cups", cups); water.textContent = "💧 " + cups + "/8杯"; if(cups===8) water.textContent = "🎉 完成!"; }; document.body.appendChild(water);
    }
});

FeaturePack.register('fp279_stretch_guide', {
    name: '拉伸引导', desc: '久坐提醒并展示简单拉伸动作',
    initFn() {
        setTimeout(()=>{ const stretch = el("div",{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",padding:"30px",background:"#fff",borderRadius:"16px",boxShadow:"0 20px 60px rgba(0,0,0,0.2)",zIndex:"10000",textAlign:"center"}); stretch.innerHTML = '<div style="font-size:48px">🧘</div><h3>起来活动一下!</h3><p style="color:#666;margin:10px 0">你已经坐了30分钟了</p><div style="font-size:36px;margin:15px">🤸</div><button style="padding:10px 30px;background:#4ecdc4;color:#fff;border:none;border-radius:20px;cursor:pointer">我知道了</button>'; document.body.appendChild(stretch); stretch.querySelector("button").onclick = () => stretch.remove(); }, 30*60*1000);
    }
});

FeaturePack.register('fp280_fitness_level', {
    name: '健身等级', desc: '根据活跃天数显示健身等级徽章', page: 'profile',
    initFn() {
        const fitness = el("div",{marginTop:"20px",padding:"20px",background:"linear-gradient(135deg,#4ecdc4,#44a3aa)",color:"#fff",borderRadius:"12px",textAlign:"center"}); fitness.innerHTML = '<div style="font-size:48px">🏅</div><div style="font-size:20px;margin-top:10px">运动达人 Lv.5</div><div style="font-size:12px;opacity:0.8;margin-top:5px">连续运动 15 天</div>'; const container = document.querySelector(".profile-container"); if(container) container.appendChild(fitness);
    }
});
