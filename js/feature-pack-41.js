import FeaturePack from './feature-pack-core.js?v=20260418c';
const { util } = FeaturePack;
const el = util.el;

/**
 * 功能包 #41: 宠物与动物 (201-205)
 */
FeaturePack.register('fp201_virtual_pet', {
    name: '虚拟宠物', desc: '博客角落养一只互动小宠物，会随时间成长',
    initFn() {
        const pet = el("div",{position:"fixed",bottom:"20px",right:"20px",fontSize:"40px",cursor:"pointer",zIndex:"9999",transition:"transform 0.3s"}); pet.textContent = "🐱"; document.body.appendChild(pet); pet.onclick = () => { pet.textContent = ["🐱","🐶","🐰","🦊","🐼"][Math.floor(Math.random()*5)]; pet.style.transform = "scale(1.3) rotate(10deg)"; setTimeout(()=>pet.style.transform="scale(1)",300); }; let happiness = parseInt(localStorage.getItem("pet_happiness") || "50"); setInterval(()=>{ happiness = Math.max(0, happiness-1); localStorage.setItem("pet_happiness", happiness); }, 60000);
    }
});

FeaturePack.register('fp202_pet_mood', {
    name: '宠物心情', desc: '根据博客访问量变化宠物心情和动画', page: 'index',
    initFn() {
        const mood = el("div",{position:"fixed",bottom:"70px",right:"25px",fontSize:"12px",color:"#ff6b6b",zIndex:"9999"}); mood.textContent = "心情: " + (localStorage.getItem("pet_happiness") || "50") + "/100"; document.body.appendChild(mood);
    }
});

FeaturePack.register('fp203_animal_sound', {
    name: '动物音效', desc: '点击页面时随机播放可爱的动物叫声（文字模拟）',
    initFn() {
        document.addEventListener("click",()=>{ const sounds = ["喵~","汪!","啾啾","咩~"]; if(Math.random()<0.1){ const s = el("div",{position:"fixed",left:(Math.random()*80+10)+"%",top:(Math.random()*80+10)+"%",fontSize:"20px",color:"#ff6b6b",pointerEvents:"none",zIndex:"99999",transition:"all 1s",opacity:"1"}); s.textContent = sounds[Math.floor(Math.random()*sounds.length)]; document.body.appendChild(s); setTimeout(()=>s.style.opacity="0",500); setTimeout(()=>s.remove(),1500); } });
    }
});

FeaturePack.register('fp204_pet_feed', {
    name: '投喂宠物', desc: '点击宠物可以投喂，增加亲密度',
    initFn() {
        document.addEventListener("click",(e)=>{ if(e.target.style && e.target.style.fontSize==="40px"){ let h = parseInt(localStorage.getItem("pet_happiness") || "50"); h = Math.min(100, h+5); localStorage.setItem("pet_happiness", h); const food = el("div",{position:"fixed",left:e.clientX+"px",top:e.clientY+"px",fontSize:"24px",pointerEvents:"none",zIndex:"99999"}); food.textContent = "🍖"; document.body.appendChild(food); food.animate([{transform:"translateY(0)",opacity:1},{transform:"translateY(-50px)",opacity:0}],{duration:800}); setTimeout(()=>food.remove(),800); } });
    }
});

FeaturePack.register('fp205_pet_sleep', {
    name: '宠物作息', desc: '夜间宠物会进入睡眠模式，显示月亮动画',
    initFn() {
        const hour = new Date().getHours(); if(hour>=22||hour<6){ const moon = el("div",{position:"fixed",top:"20px",right:"20px",fontSize:"30px",animation:"float 3s ease-in-out infinite"}); moon.textContent = "🌙"; document.body.appendChild(moon); const style = document.createElement("style"); style.textContent = "@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}"; document.head.appendChild(style); }
    }
});
