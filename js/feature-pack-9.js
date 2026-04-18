/**
 * 功能包 #9: 视觉效果 (41-45)
 */
import FeaturePack from './feature-pack-core.js';
const { util } = FeaturePack;
const el = util.el;

// 41. 雪花飘落效果
FeaturePack.register('fp41_snow_effect', {
    name: '雪花效果', desc: '页面飘落雪花',
    initFn() {
        if (new Date().getMonth() !== 11 && new Date().getMonth() !== 0) return;
        const canvas = el('canvas', { position:'fixed',top:'0',left:'0',pointerEvents:'none',zIndex:'9998' });
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        const flakes = Array.from({length:50}, () => ({ x:Math.random()*canvas.width, y:Math.random()*canvas.height, r:Math.random()*3+1, s:Math.random()*1+0.5 }));
        const draw = () => {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            flakes.forEach(f => { f.y += f.s; f.x += Math.sin(f.y*0.01)*0.5; if (f.y > canvas.height) { f.y = -5; f.x = Math.random()*canvas.width; } ctx.beginPath(); ctx.arc(f.x,f.y,f.r,0,Math.PI*2); ctx.fill(); });
            requestAnimationFrame(draw);
        }; draw();
        window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });
    }
});

// 42. 雨滴效果
FeaturePack.register('fp42_rain_effect', {
    name: '雨滴效果', desc: '页面下雨效果',
    initFn() {
        const canvas = el('canvas', { position:'fixed',top:'0',left:'0',pointerEvents:'none',zIndex:'9998',opacity:'0.3' });
        canvas.width = window.innerWidth; canvas.height = window.innerHeight;
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        const drops = Array.from({length:100}, () => ({ x:Math.random()*canvas.width, y:Math.random()*canvas.height, l:Math.random()*20+10, s:Math.random()*10+5 }));
        const draw = () => {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            ctx.strokeStyle = 'rgba(174,194,224,0.5)'; ctx.lineWidth = 1;
            drops.forEach(d => { d.y += d.s; if (d.y > canvas.height) { d.y = -d.l; d.x = Math.random()*canvas.width; } ctx.beginPath(); ctx.moveTo(d.x,d.y); ctx.lineTo(d.x,d.y+d.l); ctx.stroke(); });
            requestAnimationFrame(draw);
        }; draw();
    }
});

// 43. 页面震动效果
FeaturePack.register('fp43_page_shake', {
    name: '错误震动', desc: '表单错误时页面震动',
    initFn() {
        window.shakePage = () => {
            document.body.style.animation = 'shake 0.5s';
            const s = document.createElement('style');
            s.textContent = '@keyframes shake{0%,100%{transform:translateX(0)}10%,30%,50%,70%,90%{transform:translateX(-5px)}20%,40%,60%,80%{transform:translateX(5px)}}';
            document.head.appendChild(s);
            setTimeout(() => { document.body.style.animation = ''; s.remove(); }, 500);
        };
        document.querySelectorAll('form').forEach(f => {
            f.addEventListener('submit', (e) => {
                const req = f.querySelectorAll('[required]');
                for (const i of req) { if (!i.value.trim()) { e.preventDefault(); window.shakePage(); i.focus(); break; } }
            });
        });
    }
});

// 44. 波纹点击效果
FeaturePack.register('fp44_ripple_effect', {
    name: '波纹效果', desc: '点击产生Material波纹',
    initFn() {
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('a, button')) {
                const target = e.target.closest('a, button') || e.target;
                const rect = target.getBoundingClientRect();
                const ripple = el('span', {
                    position:'absolute',borderRadius:'50%',background:'rgba(255,255,255,0.4)',
                    transform:'scale(0)',animation:'ripple .6s linear',pointerEvents:'none'
                });
                const size = Math.max(rect.width, rect.height);
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
                ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
                target.style.position = 'relative'; target.style.overflow = 'hidden';
                target.appendChild(ripple);
                const s = document.createElement('style');
                s.textContent = '@keyframes ripple{to{transform:scale(4);opacity:0}}';
                document.head.appendChild(s);
                setTimeout(() => { ripple.remove(); s.remove(); }, 600);
            }
        });
    }
});

// 45. 3D倾斜卡片
FeaturePack.register('fp45_3d_tilt', {
    name: '3D倾斜卡片', desc: '鼠标悬停卡片3D倾斜',
    initFn() {
        document.querySelectorAll('.resource-card, .article-card, .tutorial-card').forEach(card => {
            card.style.transition = 'transform 0.3s, box-shadow 0.3s';
            card.style.transformStyle = 'preserve-3d';
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                card.style.transform = `perspective(1000px) rotateY(${x*10}deg) rotateX(${-y*10}deg) scale(1.02)`;
                card.style.boxShadow = `${-x*20}px ${-y*20}px 30px rgba(0,0,0,0.15)`;
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateY(0) rotateX(0) scale(1)';
                card.style.boxShadow = '';
            });
        });
    }
});
