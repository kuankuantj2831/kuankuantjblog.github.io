/**
 * 功能包 #1: UI 增强 (1-5)
 */
import FeaturePack from './feature-pack-core.js?v=20260419a';
const { util } = FeaturePack;
const el = util.el;

// 1. 实时在线人数
FeaturePack.register('fp01_online_counter', {
    name: '实时在线人数', desc: '显示当前在线人数',
    initFn() {
        const div = el('div', {
            position:'fixed',bottom:'20px',left:'20px',zIndex:'999',
            background:'rgba(0,0,0,0.75)',color:'#4ade80',padding:'6px 14px',
            borderRadius:'20px',fontSize:'12px',display:'flex',alignItems:'center',gap:'6px',
            backdropFilter:'blur(10px)'
        });
        div.innerHTML = `<span style="width:8px;height:8px;background:#4ade80;border-radius:50%;animation:pulse 2s infinite"></span><span id="fp_online_num">${util.rand(15,80)}</span> 人在线`;
        document.body.appendChild(div);
        const s = document.createElement('style'); s.textContent='@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}'; document.head.appendChild(s);
        setInterval(() => {
            const n = document.getElementById('fp_online_num');
            if (n) n.textContent = util.rand(15, 80);
        }, 30000);
    }
});

// 2. 鼠标粒子轨迹
FeaturePack.register('fp02_mouse_trail', {
    name: '鼠标粒子轨迹', desc: '鼠标移动产生彩色粒子',
    initFn() {
        const colors = ['#667eea','#764ba2','#f5af19','#ff6b6b','#4ecdc4'];
        let particles = [];
        document.addEventListener('mousemove', util.throttle((e) => {
            if (particles.length > 25) { const p = particles.shift(); if (p) p.el.remove(); }
            const d = el('div', {
                position:'fixed',left:e.clientX+'px',top:e.clientY+'px',
                width:util.rand(3,6)+'px',height:util.rand(3,6)+'px',
                background:colors[util.rand(0,4)],borderRadius:'50%',
                pointerEvents:'none',zIndex:'9999',opacity:'0.8'
            });
            document.body.appendChild(d);
            const particle = { el: d, x: e.clientX, y: e.clientY, vx: (Math.random()-.5)*3, vy: (Math.random()-.5)*3, op: .8 };
            particles.push(particle);
            const anim = () => {
                particle.x += particle.vx; particle.y += particle.vy; particle.op -= .02;
                if (particle.op <= 0) { d.remove(); return; }
                d.style.left = particle.x+'px'; d.style.top = particle.y+'px'; d.style.opacity = particle.op;
                requestAnimationFrame(anim);
            }; requestAnimationFrame(anim);
        }, 40));
    }
});

// 3. 页面加载进度条
FeaturePack.register('fp03_top_progress', {
    name: '顶部加载进度条', desc: '页面加载时在顶部显示进度',
    initFn() {
        const bar = el('div', {
            position:'fixed',top:'0',left:'0',height:'3px',width:'0%',
            background:'linear-gradient(90deg,#667eea,#764ba2,#f5af19)',
            zIndex:'99999',transition:'width .3s',boxShadow:'0 0 8px rgba(102,126,234,.5)'
        });
        document.body.appendChild(bar);
        let p = 0; const iv = setInterval(() => { p += util.rand(5,20); if (p > 90) p = 90; bar.style.width = p + '%'; }, 200);
        window.addEventListener('load', () => { clearInterval(iv); bar.style.width = '100%'; setTimeout(() => { bar.style.opacity='0'; setTimeout(()=>bar.remove(),300); }, 400); });
        setTimeout(() => { clearInterval(iv); bar.style.width='100%'; setTimeout(()=>bar.remove(),500); }, 6000);
    }
});

// 4. 复制版权提示
FeaturePack.register('fp04_copy_notice', {
    name: '复制版权提示', desc: '复制超过30字自动加版权',
    initFn() {
        document.addEventListener('copy', (e) => {
            const t = window.getSelection().toString().trim();
            if (t.length < 30) return;
            const out = t + '\n\n---\n转载请注明来源：Hakimi 的猫爬架\n' + location.href;
            e.clipboardData.setData('text/plain', out); e.preventDefault();
            const toast = el('div', {
                position:'fixed',bottom:'80px',left:'50%',transform:'translateX(-50%)',
                background:'rgba(0,0,0,0.8)',color:'white',padding:'10px 24px',
                borderRadius:'25px',fontSize:'13px',zIndex:'99999',transition:'all .3s'
            });
            toast.textContent = '📋 已复制，已自动添加版权信息';
            document.body.appendChild(toast);
            requestAnimationFrame(() => toast.style.bottom = '100px');
            setTimeout(() => { toast.style.opacity = '0'; setTimeout(()=>toast.remove(),300); }, 2500);
        });
    }
});

// 5. 右键菜单增强
FeaturePack.register('fp05_context_menu', {
    name: '右键菜单增强', desc: '自定义右键菜单',
    page: 'all',
    initFn() {
        const menu = el('div', {
            position:'fixed',display:'none',background:'white',borderRadius:'8px',
            boxShadow:'0 4px 20px rgba(0,0,0,0.15)',padding:'6px 0',zIndex:'99999',
            minWidth:'160px',fontSize:'13px'
        });
        menu.innerHTML = `
            <div class="fp-cm-item" data-action="back" style="padding:8px 16px;cursor:pointer;">🔙 返回上一页</div>
            <div class="fp-cm-item" data-action="reload" style="padding:8px 16px;cursor:pointer;">🔄 刷新页面</div>
            <div style="border-top:1px solid #eee;margin:4px 0"></div>
            <div class="fp-cm-item" data-action="top" style="padding:8px 16px;cursor:pointer;">⬆️ 回到顶部</div>
            <div class="fp-cm-item" data-action="home" style="padding:8px 16px;cursor:pointer;">🏠 返回首页</div>
        `;
        document.body.appendChild(menu);
        document.addEventListener('contextmenu', e => {
            e.preventDefault();
            menu.style.display = 'block';
            menu.style.left = Math.min(e.clientX, window.innerWidth - 170) + 'px';
            menu.style.top = Math.min(e.clientY, window.innerHeight - 150) + 'px';
        });
        document.addEventListener('click', () => menu.style.display = 'none');
        menu.addEventListener('click', e => {
            const act = e.target.dataset.action;
            if (act === 'back') history.back();
            if (act === 'reload') location.reload();
            if (act === 'top') window.scrollTo({top:0,behavior:'smooth'});
            if (act === 'home') location.href = '/';
        });
        menu.querySelectorAll('.fp-cm-item').forEach(item => {
            item.addEventListener('mouseenter', () => item.style.background = '#f5f5f5');
            item.addEventListener('mouseleave', () => item.style.background = 'transparent');
        });
    }
});
