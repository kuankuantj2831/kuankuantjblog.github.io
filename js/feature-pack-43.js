import FeaturePack from './feature-pack-core.js?v=20260418c';
const { util } = FeaturePack;
const el = util.el;

/**
 * 功能包 #43: 3D与视觉效果 (211-215)
 */
FeaturePack.register('fp211_parallax_bg', {
    name: '视差背景', desc: '鼠标移动时背景产生视差滚动效果', page: 'index',
    initFn() {
        document.querySelectorAll(".hero-section, .banner").forEach(bg => { bg.style.transition = "transform 0.1s"; document.addEventListener("mousemove", (e) => { const x = (e.clientX / window.innerWidth - 0.5) * 10; const y = (e.clientY / window.innerHeight - 0.5) * 10; bg.style.transform = 'translate(' + x + 'px, ' + y + 'px)'; }); });
    }
});

FeaturePack.register('fp212_glassmorphism', {
    name: '毛玻璃效果', desc: '为卡片添加动态毛玻璃背景效果',
    initFn() {
        document.querySelectorAll(".card, .profile-card, .article-card").forEach(card => { card.style.backdropFilter = "blur(10px)"; card.style.background = "rgba(255,255,255,0.1)"; card.style.border = "1px solid rgba(255,255,255,0.2)"; });
    }
});

FeaturePack.register('fp213_neon_glow', {
    name: '霓虹光效', desc: '标题和按钮添加动态霓虹发光效果',
    initFn() {
        const neon = document.createElement("style"); neon.textContent = ".neon-glow{text-shadow:0 0 5px #667eea,0 0 10px #667eea,0 0 20px #667eea;animation:pulse 2s ease-in-out infinite}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}"; document.head.appendChild(neon); document.querySelectorAll("h1, h2").forEach(h => h.classList.add("neon-glow"));
    }
});

FeaturePack.register('fp214_3d_card', {
    name: '3D卡片翻转', desc: '鼠标悬停时卡片产生3D倾斜效果',
    initFn() {
        document.querySelectorAll(".card").forEach(card => { card.style.transition = "transform 0.3s"; card.style.transformStyle = "preserve-3d"; card.onmousemove = (e) => { const rect = card.getBoundingClientRect(); const x = (e.clientX - rect.left) / rect.width - 0.5; const y = (e.clientY - rect.top) / rect.height - 0.5; card.style.transform = 'perspective(1000px) rotateY(' + (x*20) + 'deg) rotateX(' + (-y*20) + 'deg)'; }; card.onmouseleave = () => card.style.transform = ""; });
    }
});

FeaturePack.register('fp215_particles_connect', {
    name: '粒子连线', desc: '鼠标移动时在光标周围产生粒子连线效果',
    initFn() {
        const canvas = el("canvas",{position:"fixed",top:0,left:0,zIndex:0,pointerEvents:"none"}); document.body.insertBefore(canvas, document.body.firstChild); const ctx = canvas.getContext("2d"); canvas.width = window.innerWidth; canvas.height = window.innerHeight; const particles = []; for(let i=0;i<30;i++) particles.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,vx:(Math.random()-0.5)*0.5,vy:(Math.random()-0.5)*0.5}); function draw(){ ctx.clearRect(0,0,canvas.width,canvas.height); particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>canvas.width)p.vx*=-1;if(p.y<0||p.y>canvas.height)p.vy*=-1;ctx.fillStyle="rgba(102,126,234,0.3)";ctx.beginPath();ctx.arc(p.x,p.y,2,0,Math.PI*2);ctx.fill();}); requestAnimationFrame(draw);} draw();
    }
});
