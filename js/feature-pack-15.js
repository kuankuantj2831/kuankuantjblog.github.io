/**
 * 功能包 #15: 动效与动画 (71-75)
 */
import FeaturePack from './feature-pack-core.js?v=20260419a';
const { util } = FeaturePack;
const el = util.el;

// 71. 页面进入动画
FeaturePack.register('fp71_page_enter', {
    name: '进入动画', desc: '页面元素依次淡入',
    initFn() {
        const s = document.createElement('style');
        s.textContent = '.fp-fade-in{opacity:0;transform:translateY(20px);animation:fpFadeIn .6s forwards}@keyframes fpFadeIn{to{opacity:1;transform:translateY(0)}}';
        document.head.appendChild(s);
        const els = document.querySelectorAll('.resource-card, .article-card, section, .tutorial-card');
        els.forEach((el, i) => { el.classList.add('fp-fade-in'); el.style.animationDelay = (i * 0.08) + 's'; });
    }
});

// 72. 文字逐字高亮
FeaturePack.register('fp72_text_highlight', {
    name: '文字高亮', desc: '重点文字滚动高亮',
    page: 'index',
    initFn() {
        const keywords = ['编程','技术','学习','分享','成长'];
        const hero = document.querySelector('.hero-section h1, .main-title');
        if (!hero) return;
        const text = hero.textContent;
        keywords.forEach(kw => {
            if (text.includes(kw)) {
                hero.innerHTML = text.replace(kw, `<span class="fp-text-glow" style="color:#667eea;text-shadow:0 0 10px rgba(102,126,234,0.5)">${kw}</span>`);
            }
        });
    }
});

// 73. 数字滚动动画
FeaturePack.register('fp73_number_roll', {
    name: '数字滚动', desc: '数字从0滚动到目标',
    initFn() {
        document.querySelectorAll('[data-count]').forEach(el => {
            const target = parseInt(el.dataset.count);
            const duration = 2000;
            const start = performance.now();
            const animate = (now) => {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                el.textContent = Math.floor(target * progress).toLocaleString();
                if (progress < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
        });
    }
});

// 74. 背景粒子连线
FeaturePack.register('fp74_bg_particles', {
    name: '背景粒子', desc: 'Canvas粒子连线背景',
    initFn() {
        const canvas = el('canvas', { position:'fixed',top:'0',left:'0',zIndex:'-1',pointerEvents:'none' });
        canvas.width = window.innerWidth; canvas.height = window.innerHeight;
        document.body.insertBefore(canvas, document.body.firstChild);
        const ctx = canvas.getContext('2d');
        const particles = Array.from({length:40}, () => ({ x:Math.random()*canvas.width, y:Math.random()*canvas.height, vx:(Math.random()-.5)*.5, vy:(Math.random()-.5)*.5 }));
        const draw = () => {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            particles.forEach((p,i) => {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
                ctx.beginPath(); ctx.arc(p.x,p.y,2,0,Math.PI*2); ctx.fillStyle='rgba(102,126,234,0.3)'; ctx.fill();
                particles.slice(i+1).forEach(p2 => {
                    const d = Math.hypot(p.x-p2.x, p.y-p2.y);
                    if (d < 150) { ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p2.x,p2.y); ctx.strokeStyle=`rgba(102,126,234,${0.15*(1-d/150)})`; ctx.stroke(); }
                });
            });
            requestAnimationFrame(draw);
        }; draw();
        window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });
    }
});

// 75. 滚动视差效果
FeaturePack.register('fp75_parallax', {
    name: '视差滚动', desc: '不同层滚动速度不同',
    initFn() {
        document.querySelectorAll('[data-parallax]').forEach(el => {
            const speed = parseFloat(el.dataset.parallax) || 0.5;
            window.addEventListener('scroll', () => { el.style.transform = `translateY(${window.scrollY * speed}px)`; });
        });
    }
});
