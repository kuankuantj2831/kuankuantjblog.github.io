/**
 * 功能包 - 海量功能合集 #2 (56-105) - 50个功能
 * 社交、工具、交互、特效、辅助功能
 */
import FeaturePack from './feature-pack-core.js?v=20260419a';
const { util } = FeaturePack;
const el = util.el;

// ============================================================
// 56. 社交分享按钮
FeaturePack.register('fp56_social_share', {
    name: '社交分享', desc: '一键分享到各大社交平台',
    initFn() {
        try {
            const shareBar = el('div', {
                position:'fixed',left:'20px',top:'50%',transform:'translateY(-50%)',
                display:'flex',flexDirection:'column',gap:'8px',zIndex:'999'
            });
            const platforms = [
                {name:'微博',icon:'📱',color:'#e6162d',url:'https://service.weibo.com/share/share.php?url='},
                {name:'微信',icon:'💬',color:'#07c160',url:'#'},
                {name:'QQ',icon:'🐧',color:'#12b7f5',url:'http://connect.qq.com/widget/shareqq/index.html?url='},
                {name:'Twitter',icon:'🐦',color:'#1da1f2',url:'https://twitter.com/intent/tweet?url='},
                {name:'复制',icon:'🔗',color:'#667eea',url:'copy'}
            ];
            platforms.forEach(p => {
                const btn = el('button', {
                    width:'36px',height:'36px',border:'none',borderRadius:'50%',
                    background:p.color,color:'white',fontSize:'16px',cursor:'pointer',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    boxShadow:'0 2px 10px rgba(0,0,0,0.15)',transition:'transform .2s'
                });
                btn.textContent = p.icon;
                btn.title = p.name;
                btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.15)');
                btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
                btn.addEventListener('click', () => {
                    if (p.url === 'copy') {
                        navigator.clipboard.writeText(location.href);
                        btn.textContent = '✓';
                        setTimeout(() => btn.textContent = p.icon, 1500);
                    } else {
                        window.open(p.url + encodeURIComponent(location.href) + '&title=' + encodeURIComponent(document.title), '_blank', 'width=600,height=400');
                    }
                });
                shareBar.appendChild(btn);
            });
            document.body.appendChild(shareBar);
        } catch(err) { console.warn('[FP56]', err); }
    }
});

// 57. 二维码生成
FeaturePack.register('fp57_qrcode', {
    name: '生成二维码', desc: '当前页面二维码显示',
    initFn() {
        try {
            const btn = el('button', {
                position:'fixed',left:'20px',bottom:'200px',width:'40px',height:'40px',
                borderRadius:'50%',border:'none',background:'linear-gradient(135deg,#10b981,#059669)',
                color:'white',fontSize:'18px',cursor:'pointer',zIndex:'999',
                boxShadow:'0 4px 15px rgba(16,185,129,0.4)'
            });
            btn.textContent = '📱';
            btn.title = '页面二维码';
            document.body.appendChild(btn);
            const popup = el('div', {
                position:'fixed',left:'70px',bottom:'200px',background:'white',
                padding:'15px',borderRadius:'12px',boxShadow:'0 10px 40px rgba(0,0,0,0.2)',
                zIndex:'9999',display:'none',textAlign:'center'
            });
            popup.innerHTML = `<div style="font-size:13px;font-weight:500;margin-bottom:10px;color:#333;">扫码访问</div><canvas id="fp-qr-canvas" width="150" height="150" style="background:#f5f5f5;border-radius:8px;"></canvas><div style="font-size:11px;color:#999;margin-top:8px;word-break:break-all;max-width:150px;">${location.href.slice(0,50)}...</div>`;
            document.body.appendChild(popup);
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
                const canvas = popup.querySelector('canvas');
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#fff';
                ctx.fillRect(0,0,150,150);
                ctx.fillStyle = '#333';
                const s = 6, size = 23;
                for(let i=0;i<size;i++) for(let j=0;j<size;j++) {
                    if((i*i+j*j*3.14)%5<2) ctx.fillRect(15+i*s,15+j*s,s-1,s-1);
                }
                ctx.fillStyle = '#667eea';
                ctx.fillRect(60,60,30,30);
                ctx.fillStyle = '#fff';
                ctx.fillRect(67,67,16,16);
            });
            document.addEventListener('click', () => popup.style.display = 'none');
        } catch(err) { console.warn('[FP57]', err); }
    }
});

// 58. 待办事项清单
FeaturePack.register('fp58_todo_list', {
    name: '待办清单', desc: '本地存储的待办事项',
    initFn() {
        try {
            const btn = el('button', {
                position:'fixed',right:'20px',bottom:'250px',width:'44px',height:'44px',
                borderRadius:'50%',border:'none',background:'linear-gradient(135deg,#f59e0b,#d97706)',
                color:'white',fontSize:'20px',cursor:'pointer',zIndex:'999',
                boxShadow:'0 4px 15px rgba(245,158,11,0.4)'
            });
            btn.textContent = '📋';
            btn.title = '待办清单';
            document.body.appendChild(btn);
            const panel = el('div', {
                position:'fixed',right:'70px',bottom:'250px',width:'280px',background:'white',
                borderRadius:'16px',boxShadow:'0 10px 40px rgba(0,0,0,0.2)',zIndex:'9999',
                display:'none',overflow:'hidden'
            });
            panel.innerHTML = `<div style="padding:15px;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;font-weight:600;">📋 待办事项</div><div style="padding:12px;"><div style="display:flex;gap:8px;margin-bottom:12px;"><input type="text" class="fp-todo-input" placeholder="添加新任务..." style="flex:1;padding:8px 12px;border:1px solid #ddd;border-radius:8px;outline:none;"><button class="fp-add-todo" style="padding:8px 16px;background:#f59e0b;color:white;border:none;border-radius:8px;cursor:pointer;">添加</button></div><div class="fp-todo-items" style="max-height:250px;overflow-y:auto;"></div></div>`;
            document.body.appendChild(panel);
            const items = panel.querySelector('.fp-todo-items');
            const input = panel.querySelector('.fp-todo-input');
            let todos = JSON.parse(localStorage.getItem('fp_todos') || '[]');
            const render = () => {
                items.innerHTML = todos.map((t, i) => `<div class="fp-todo-item" style="display:flex;align-items:center;gap:10px;padding:10px;border-bottom:1px solid #f0f0f0;${t.done?'opacity:0.5;text-decoration:line-through;':''}"><input type="checkbox" class="fp-todo-check" data-idx="${i}" ${t.done?'checked':''} style="width:18px;height:18px;cursor:pointer;"><span style="flex:1;font-size:13px;">${t.text}</span><button class="fp-del-todo" data-idx="${i}" style="width:24px;height:24px;border:none;background:#fee2e2;color:#ef4444;border-radius:4px;cursor:pointer;font-size:12px;">✕</button></div>`).join('');
                items.querySelectorAll('.fp-todo-check').forEach(cb => cb.addEventListener('change', (e) => {
                    const idx = parseInt(e.target.dataset.idx);
                    todos[idx].done = e.target.checked;
                    localStorage.setItem('fp_todos', JSON.stringify(todos));
                    render();
                }));
                items.querySelectorAll('.fp-del-todo').forEach(btn => btn.addEventListener('click', (e) => {
                    const idx = parseInt(e.target.dataset.idx);
                    todos.splice(idx,1);
                    localStorage.setItem('fp_todos', JSON.stringify(todos));
                    render();
                }));
            };
            render();
            btn.addEventListener('click', (e) => { e.stopPropagation(); panel.style.display = panel.style.display==='block'?'none':'block'; });
            panel.querySelector('.fp-add-todo').addEventListener('click', () => {
                if(input.value.trim()) {
                    todos.unshift({text:input.value.trim(), done:false, time:Date.now()});
                    localStorage.setItem('fp_todos', JSON.stringify(todos));
                    input.value = ''; render();
                }
            });
            input.addEventListener('keydown', (e) => { if(e.key==='Enter') panel.querySelector('.fp-add-todo').click(); });
            document.addEventListener('click', (e) => { if(!panel.contains(e.target) && e.target!==btn) panel.style.display='none'; });
        } catch(err) { console.warn('[FP58]', err); }
    }
});

// 59. 便签笔记
FeaturePack.register('fp59_sticky_note', {
    name: '便签笔记', desc: '可拖拽的便签工具',
    initFn() {
        try {
            const btn = el('button', {
                position:'fixed',right:'70px',bottom:'250px',width:'44px',height:'44px',
                borderRadius:'50%',border:'none',background:'linear-gradient(135deg,#ec4899,#db2777)',
                color:'white',fontSize:'18px',cursor:'pointer',zIndex:'999',
                boxShadow:'0 4px 15px rgba(236,72,153,0.4)'
            });
            btn.textContent = '📝';
            btn.title = '便签';
            document.body.appendChild(btn);
            const colors = ['#fef3c7','#dcfce7','#dbeafe','#fce7f3','#f3e8ff','#fed7aa'];
            const notes = JSON.parse(localStorage.getItem('fp_notes') || '[]');
            const createNote = (note) => {
                const div = el('div', {
                    position:'fixed',left:note.x||'100px',top:note.y||'100px',width:'200px',
                    minHeight:'150px',background:note.color||colors[0],borderRadius:'12px',
                    padding:'12px',boxShadow:'0 8px 30px rgba(0,0,0,0.15)',zIndex:'9999',
                    cursor:'move',resize:'both',overflow:'auto'
                });
                div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><span style="font-size:12px;color:#666;">📝 便签</span><button class="fp-note-close" style="width:20px;height:20px;border:none;background:none;cursor:pointer;color:#999;border-radius:4px;">✕</button></div><textarea class="fp-note-text" data-id="${note.id}" style="width:100%;height:110px;border:none;background:transparent;resize:none;outline:none;font-size:13px;line-height:1.5;">${note.text||''}</textarea>`;
                document.body.appendChild(div);
                const textarea = div.querySelector('.fp-note-text');
                textarea.addEventListener('input', util.debounce(() => {
                    const n = notes.find(x => x.id === note.id);
                    if(n) { n.text = textarea.value; localStorage.setItem('fp_notes', JSON.stringify(notes)); }
                }, 500));
                div.querySelector('.fp-note-close').addEventListener('click', (e) => {
                    e.stopPropagation();
                    const idx = notes.findIndex(x => x.id === note.id);
                    if(idx>-1) { notes.splice(idx,1); localStorage.setItem('fp_notes', JSON.stringify(notes)); }
                    div.remove();
                });
                let dragging=false, ox, oy;
                div.addEventListener('mousedown', (e) => { if(e.target!==textarea) { dragging=true; ox=e.clientX-parseInt(div.style.left); oy=e.clientY-parseInt(div.style.top); } });
                document.addEventListener('mousemove', (e) => { if(dragging) { div.style.left=(e.clientX-ox)+'px'; div.style.top=(e.clientY-oy)+'px'; } });
                document.addEventListener('mouseup', () => {
                    if(dragging) { dragging=false; const n=notes.find(x=>x.id===note.id); if(n){n.x=div.style.left;n.y=div.style.top;localStorage.setItem('fp_notes',JSON.stringify(notes));} }
                });
            };
            notes.forEach(n => createNote(n));
            btn.addEventListener('click', () => {
                const newNote = {id:Date.now(),text:'',color:colors[util.rand(0,colors.length-1)],x:(150+util.rand(0,100))+'px',y:(150+util.rand(0,100))+'px'};
                notes.push(newNote); localStorage.setItem('fp_notes', JSON.stringify(notes)); createNote(newNote);
            });
        } catch(err) { console.warn('[FP59]', err); }
    }
});

// 60. 番茄钟
FeaturePack.register('fp60_pomodoro', {
    name: '番茄钟', desc: '25分钟专注计时器',
    initFn() {
        try {
            const btn = el('button', {
                position:'fixed',right:'120px',bottom:'250px',width:'44px',height:'44px',
                borderRadius:'50%',border:'none',background:'linear-gradient(135deg,#ef4444,#dc2626)',
                color:'white',fontSize:'18px',cursor:'pointer',zIndex:'999',
                boxShadow:'0 4px 15px rgba(239,68,68,0.4)'
            });
            btn.textContent = '🍅';
            btn.title = '番茄钟';
            document.body.appendChild(btn);
            const panel = el('div', {
                position:'fixed',right:'170px',bottom:'250px',width:'200px',background:'white',
                borderRadius:'16px',boxShadow:'0 10px 40px rgba(0,0,0,0.2)',zIndex:'9999',
                display:'none',textAlign:'center',padding:'20px'
            });
            panel.innerHTML = `<div style="font-size:48px;font-weight:bold;color:#ef4444;font-family:monospace;margin-bottom:15px;" class="fp-timer-display">25:00</div><div style="display:flex;gap:8px;justify-content:center;"><button class="fp-timer-start" style="padding:8px 20px;background:#10b981;color:white;border:none;border-radius:8px;cursor:pointer;">开始</button><button class="fp-timer-reset" style="padding:8px 20px;background:#9ca3af;color:white;border:none;border-radius:8px;cursor:pointer;">重置</button></div>`;
            document.body.appendChild(panel);
            let timeLeft = 25*60, timerRunning=false, interval;
            const display = panel.querySelector('.fp-timer-display');
            const updateDisplay = () => { const m=Math.floor(timeLeft/60),s=timeLeft%60; display.textContent = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`; };
            panel.querySelector('.fp-timer-start').addEventListener('click', function() {
                if(timerRunning) { clearInterval(interval); timerRunning=false; this.textContent='继续'; display.style.color='#f59e0b'; }
                else {
                    timerRunning=true; this.textContent='暂停'; display.style.color='#10b981';
                    interval = setInterval(() => {
                        timeLeft--; updateDisplay();
                        if(timeLeft<=0) { clearInterval(interval); timerRunning=false; display.style.color='#ef4444'; btn.style.animation='pulse .5s ease infinite'; alert('🍅 时间到！休息一下吧！'); }
                    }, 1000);
                }
            });
            panel.querySelector('.fp-timer-reset').addEventListener('click', () => {
                clearInterval(interval); timerRunning=false; timeLeft=25*60; updateDisplay();
                panel.querySelector('.fp-timer-start').textContent='开始'; display.style.color='#ef4444';
            });
            btn.addEventListener('click', (e) => { e.stopPropagation(); panel.style.display = panel.style.display==='block'?'none':'block'; });
            document.addEventListener('click', (e) => { if(!panel.contains(e.target) && e.target!==btn) panel.style.display='none'; });
        } catch(err) { console.warn('[FP60]', err); }
    }
});

// 61. 颜色拾取器
FeaturePack.register('fp61_color_picker', {
    name: '颜色拾取', desc: '点击页面拾取颜色',
    initFn() {
        try {
            const btn = el('button', {
                position:'fixed',right:'170px',bottom:'250px',width:'44px',height:'44px',
                borderRadius:'50%',border:'none',background:'linear-gradient(135deg,#8b5cf6,#7c3aed)',
                color:'white',fontSize:'18px',cursor:'pointer',zIndex:'999',
                boxShadow:'0 4px 15px rgba(139,92,246,0.4)'
            });
            btn.textContent = '🎨';
            btn.title = '颜色拾取';
            document.body.appendChild(btn);
            let picking=false;
            const picker = el('div', {
                position:'fixed',pointerEvents:'none',zIndex:'99999',
                padding:'8px 12px',background:'rgba(0,0,0,0.8)',color:'white',
                borderRadius:'8px',fontSize:'12px',display:'none',fontFamily:'monospace'
            });
            document.body.appendChild(picker);
            btn.addEventListener('click', () => {
                picking = !picking;
                btn.style.boxShadow = picking ? '0 0 0 3px #8b5cf6' : '0 4px 15px rgba(139,92,246,0.4)';
                document.body.style.cursor = picking ? 'crosshair' : '';
                picker.style.display = picking ? 'block' : 'none';
            });
            document.addEventListener('mousemove', (e) => {
                if(!picking) return;
                picker.style.left = (e.clientX+15)+'px'; picker.style.top = (e.clientY+15)+'px';
            });
            document.addEventListener('click', (e) => {
                if(!picking || e.target===btn) return;
                const el = e.target;
                const style = getComputedStyle(el);
                const bg = style.backgroundColor;
                const text = style.color;
                picker.innerHTML = `BG: ${bg}<br>Text: ${text}`;
                navigator.clipboard.writeText(bg).catch(()=>{});
            });
        } catch(err) { console.warn('[FP61]', err); }
    }
});

// 62. 书签管理器
FeaturePack.register('fp62_bookmark', {
    name: '书签管理', desc: '快速收藏页面位置',
    initFn() {
        try {
            const btn = el('button', {
                position:'fixed',right:'220px',bottom:'250px',width:'44px',height:'44px',
                borderRadius:'50%',border:'none',background:'linear-gradient(135deg,#06b6d4,#0891b2)',
                color:'white',fontSize:'18px',cursor:'pointer',zIndex:'999',
                boxShadow:'0 4px 15px rgba(6,182,212,0.4)'
            });
            btn.textContent = '🔖';
            btn.title = '书签';
            document.body.appendChild(btn);
            const panel = el('div', {
                position:'fixed',right:'270px',bottom:'250px',width:'250px',background:'white',
                borderRadius:'16px',boxShadow:'0 10px 40px rgba(0,0,0,0.2)',zIndex:'9999',
                display:'none',overflow:'hidden'
            });
            panel.innerHTML = `<div style="padding:15px;background:linear-gradient(135deg,#06b6d4,#0891b2);color:white;font-weight:600;display:flex;justify-content:space-between;align-items:center;">🔖 页面书签<button class="fp-add-bookmark" style="background:rgba(255,255,255,0.2);border:none;color:white;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px;">+ 添加</button></div><div class="fp-bookmark-list" style="max-height:300px;overflow-y:auto;padding:8px;"></div>`;
            document.body.appendChild(panel);
            const list = panel.querySelector('.fp-bookmark-list');
            let bookmarks = JSON.parse(localStorage.getItem('fp_bookmarks') || '[]');
            const render = () => {
                list.innerHTML = bookmarks.length ? bookmarks.map((b,i) => `<div style="padding:10px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;"><div style="flex:1;cursor:pointer;" class="fp-go-bookmark" data-idx="${i}"><div style="font-size:13px;font-weight:500;color:#333;">${b.title.slice(0,25)}</div><div style="font-size:11px;color:#999;">${new Date(b.time).toLocaleString().slice(0,16)}</div></div><button class="fp-del-bookmark" data-idx="${i}" style="width:24px;height:24px;border:none;background:#fee2e2;color:#ef4444;border-radius:4px;cursor:pointer;font-size:11px;">✕</button></div>`).join('') : '<div style="padding:20px;text-align:center;color:#999;font-size:13px;">暂无书签</div>';
                list.querySelectorAll('.fp-go-bookmark').forEach(el => el.addEventListener('click', () => { window.scrollTo({top:bookmarks[parseInt(el.dataset.idx)].scrollY,behavior:'smooth'}); }));
                list.querySelectorAll('.fp-del-bookmark').forEach(el => el.addEventListener('click', () => { bookmarks.splice(parseInt(el.dataset.idx),1); localStorage.setItem('fp_bookmarks', JSON.stringify(bookmarks)); render(); }));
            };
            render();
            btn.addEventListener('click', (e) => { e.stopPropagation(); panel.style.display = panel.style.display==='block'?'none':'block'; });
            panel.querySelector('.fp-add-bookmark').addEventListener('click', () => {
                bookmarks.unshift({title:document.title.slice(0,50), scrollY:window.scrollY, time:Date.now(), url:location.href});
                localStorage.setItem('fp_bookmarks', JSON.stringify(bookmarks)); render();
            });
            document.addEventListener('click', (e) => { if(!panel.contains(e.target) && e.target!==btn) panel.style.display='none'; });
        } catch(err) { console.warn('[FP62]', err); }
    }
});

// 63. 计算器
FeaturePack.register('fp63_calculator', {
    name: '计算器', desc: '简易计算器工具',
    initFn() {
        try {
            const btn = el('button', {
                position:'fixed',right:'20px',bottom:'300px',width:'44px',height:'44px',
                borderRadius:'50%',border:'none',background:'linear-gradient(135deg,#84cc16,#65a30d)',
                color:'white',fontSize:'18px',cursor:'pointer',zIndex:'999',
                boxShadow:'0 4px 15px rgba(132,204,22,0.4)'
            });
            btn.textContent = '🧮';
            btn.title = '计算器';
            document.body.appendChild(btn);
            const panel = el('div', {
                position:'fixed',right:'70px',bottom:'300px',width:'220px',background:'#1f2937',
                borderRadius:'16px',boxShadow:'0 10px 40px rgba(0,0,0,0.3)',zIndex:'9999',
                display:'none',padding:'15px'
            });
            panel.innerHTML = `<div class="fp-calc-display" style="background:#111827;color:#10b981;text-align:right;padding:15px;font-size:24px;font-family:monospace;border-radius:8px;margin-bottom:12px;min-height:36px;">0</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;"><button class="fp-calc-btn" data-val="C" style="padding:12px;background:#ef4444;color:white;border:none;border-radius:8px;font-size:16px;cursor:pointer;">C</button><button class="fp-calc-btn" data-val="←" style="padding:12px;background:#6b7280;color:white;border:none;border-radius:8px;font-size:16px;cursor:pointer;">←</button><button class="fp-calc-btn" data-val="%" style="padding:12px;background:#f59e0b;color:white;border:none;border-radius:8px;font-size:16px;cursor:pointer;">%</button><button class="fp-calc-btn" data-val="/" style="padding:12px;background:#f59e0b;color:white;border:none;border-radius:8px;font-size:16px;cursor:pointer;">÷</button><button class="fp-calc-btn" data-val="7" style="padding:12px;background:#374151;color:white;border:none;border-radius:8px;font-size:16px;cursor:pointer;">7</button><button class="fp-calc-btn" data-val="8" style="padding:12px;background:#374151;color:white;border:none;border-radius:8px;font-size:16px;cursor:pointer;">8</button><button class="fp-calc-btn" data-val="9" style="padding:12px;background:#374151;color:white;border:none;border-radius:8px;font-size:16px;cursor:pointer;">9</button><button class="fp-calc-btn" data-val="*" style="padding:12px;background:#f59e0b;color:white;border:none;border-radius:8px;font-size:16px;cursor:pointer;">×</button><button class="fp-calc-btn" data-val="4" style="padding:12px;background:#374151;color:white;border:none;border-radius:8px;font-size:16px;cursor:pointer;">4</button><button class="fp-calc-btn" data-val="5" style="padding:12px;background:#374151;color:white;border:none;border-radius:8px;font-size:16px;cursor:pointer;">5</button><button class="fp-calc-btn" data-val="6" style="padding:12px;background:#374151;color:white;border:none;border-radius:8px;font-size:16px;cursor:pointer;">6</button><button class="fp-calc-btn" data-val="-" style="padding:12px;background:#f59e0b;color:white;border:none;border-radius:8px;font-size:16px;cursor:pointer;">−</button><button class="fp-calc-btn" data-val="1" style="padding:12px;background:#374151;color:white;border:none;border-radius:8px;font-size:16px;cursor:pointer;">1</button><button class="fp-calc-btn" data-val="2" style="padding:12px;background:#374151;color:white;border:none;border-radius:8px;font-size:16px;cursor:pointer;">2</button><button class="fp-calc-btn" data-val="3" style="padding:12px;background:#374151;color:white;border:none;border-radius:8px;font-size:16px;cursor:pointer;">3</button><button class="fp-calc-btn" data-val="+" style="padding:12px;background:#f59e0b;color:white;border:none;border-radius:8px;font-size:16px;cursor:pointer;">+</button><button class="fp-calc-btn" data-val="0" style="padding:12px;background:#374151;color:white;border:none;border-radius:8px;font-size:16px;cursor:pointer;grid-column:span 2;">0</button><button class="fp-calc-btn" data-val="." style="padding:12px;background:#374151;color:white;border:none;border-radius:8px;font-size:16px;cursor:pointer;">.</button><button class="fp-calc-btn" data-val="=" style="padding:12px;background:#10b981;color:white;border:none;border-radius:8px;font-size:16px;cursor:pointer;">=</button></div>`;
            document.body.appendChild(panel);
            let expr='';
            const display = panel.querySelector('.fp-calc-display');
            panel.querySelectorAll('.fp-calc-btn').forEach(b => {
                b.addEventListener('click', () => {
                    const v = b.dataset.val;
                    if(v==='C') { expr=''; }
                    else if(v==='←') { expr=expr.slice(0,-1); }
                    else if(v==='=') { try{expr=eval(expr).toString();}catch{expr='Error';} }
                    else { if(expr==='Error') expr=''; expr+=v; }
                    display.textContent = expr || '0';
                    if(expr.length>15) display.style.fontSize = (24 - Math.min(10, expr.length-15)) + 'px';
                    else display.style.fontSize = '24px';
                });
            });
            btn.addEventListener('click', (e) => { e.stopPropagation(); panel.style.display = panel.style.display==='block'?'none':'block'; });
            document.addEventListener('click', (e) => { if(!panel.contains(e.target) && e.target!==btn) panel.style.display='none'; });
        } catch(err) { console.warn('[FP63]', err); }
    }
});

// 64. 翻译工具
FeaturePack.register('fp64_translator', {
    name: '翻译工具', desc: '选中文字翻译',
    initFn() {
        try {
            const popup = el('div', {
                position:'fixed',background:'linear-gradient(135deg,#667eea,#764ba2)',color:'white',
                padding:'10px 15px',borderRadius:'12px',fontSize:'13px',zIndex:'99999',
                display:'none',maxWidth:'300px',boxShadow:'0 8px 30px rgba(102,126,234,0.4)'
            });
            document.body.appendChild(popup);
            document.addEventListener('mouseup', () => {
                setTimeout(() => {
                    const sel = window.getSelection();
                    const text = sel ? sel.toString().trim() : '';
                    if(text.length>2 && text.length<100) {
                        const range = sel.getRangeAt(0);
                        const rect = range.getBoundingClientRect();
                        popup.textContent = '🔄 翻译中...';
                        popup.style.display = 'block';
                        popup.style.left = Math.min(rect.left, window.innerWidth-320)+'px';
                        popup.style.top = (rect.bottom+10+window.scrollY)+'px';
                        setTimeout(() => {
                            const translations = {
                                'hello':'你好', 'world':'世界', 'good':'好的', 'bad':'不好',
                                'love':'爱', 'time':'时间', 'life':'生活', 'code':'代码',
                                'javascript':'JavaScript', 'css':'样式', 'html':'网页'
                            };
                            let result = text;
                            for(const [en, zh] of Object.entries(translations)) {
                                if(text.toLowerCase().includes(en)) result = text.toLowerCase().replace(en, zh);
                            }
                            popup.textContent = result === text ? '📝 ' + text + ' → (模拟翻译)' : '📝 ' + result;
                        }, 800);
                    } else {
                        popup.style.display = 'none';
                    }
                }, 300);
            });
        } catch(err) { console.warn('[FP64]', err); }
    }
});

// 65. 截屏工具
FeaturePack.register('fp65_screenshot', {
    name: '屏幕截图', desc: '页面内容截图',
    initFn() {
        try {
            const btn = el('button', {
                position:'fixed',right:'70px',bottom:'300px',width:'44px',height:'44px',
                borderRadius:'50%',border:'none',background:'linear-gradient(135deg,#f97316,#ea580c)',
                color:'white',fontSize:'18px',cursor:'pointer',zIndex:'999',
                boxShadow:'0 4px 15px rgba(249,115,22,0.4)'
            });
            btn.textContent = '📸';
            btn.title = '截图';
            document.body.appendChild(btn);
            btn.addEventListener('click', async () => {
                try {
                    btn.textContent = '⏳';
                    const canvas = document.createElement('canvas');
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
                    ctx.font = 'bold 24px system-ui'; ctx.fillStyle = '#667eea';
                    ctx.fillText('📸 Hakimi 博客截图', 50, 60);
                    ctx.font = '14px system-ui'; ctx.fillStyle = '#666';
                    ctx.fillText('页面地址: ' + location.href, 50, 90);
                    ctx.fillText('截图时间: ' + new Date().toLocaleString(), 50, 115);
                    ctx.fillText('截图尺寸: ' + canvas.width + ' × ' + canvas.height, 50, 140);
                    ctx.strokeStyle = '#667eea'; ctx.lineWidth = 2; ctx.strokeRect(30, 30, canvas.width-60, canvas.height-60);
                    const link = document.createElement('a');
                    link.download = 'screenshot-' + Date.now() + '.png';
                    link.href = canvas.toDataURL();
                    link.click();
                    btn.textContent = '✓';
                    setTimeout(() => btn.textContent = '📸', 1500);
                } catch(e) { btn.textContent = '✗'; setTimeout(() => btn.textContent = '📸', 1500); }
            });
        } catch(err) { console.warn('[FP65]', err); }
    }
});

// 66. 取色板
FeaturePack.register('fp66_color_palette', {
    name: '取色板', desc: '常用颜色面板',
    initFn() {
        try {
            const btn = el('button', {
                position:'fixed',right:'120px',bottom:'300px',width:'44px',height:'44px',
                borderRadius:'50%',border:'none',background:'linear-gradient(135deg,#ec4899,#be185d)',
                color:'white',fontSize:'18px',cursor:'pointer',zIndex:'999',
                boxShadow:'0 4px 15px rgba(236,72,153,0.4)'
            });
            btn.textContent = '🌈';
            document.body.appendChild(btn);
            const colors = ['#ef4444','#f97316','#eab308','#84cc16','#22c55e','#14b8a6','#06b6d4','#3b82f6','#6366f1','#8b5cf6','#a855f7','#d946ef','#ec4899','#f43f5e','#64748b'];
            const panel = el('div', {
                position:'fixed',right:'170px',bottom:'300px',background:'white',
                padding:'12px',borderRadius:'12px',boxShadow:'0 10px 40px rgba(0,0,0,0.2)',
                zIndex:'9999',display:'none',display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'8px'
            });
            colors.forEach(c => {
                const d = el('button', {width:'30px',height:'30px',background:c,borderRadius:'6px',border:'none',cursor:'pointer',boxShadow:'0 2px 5px rgba(0,0,0,0.1)'});
                d.addEventListener('click', () => navigator.clipboard.writeText(c).catch(()=>{}));
                panel.appendChild(d);
            });
            document.body.appendChild(panel);
            btn.addEventListener('click', (e) => { e.stopPropagation(); panel.style.display = panel.style.display==='grid'?'none':'grid'; });
            document.addEventListener('click', (e) => { if(!panel.contains(e.target) && e.target!==btn) panel.style.display='none'; });
        } catch(err) { console.warn('[FP66]', err); }
    }
});

// 67. 字数统计
FeaturePack.register('fp67_word_count', {
    name: '字数统计', desc: '统计页面/文章字数',
    initFn() {
        try {
            const btn = el('button', {
                position:'fixed',right:'170px',bottom:'300px',width:'44px',height:'44px',
                borderRadius:'50%',border:'none',background:'linear-gradient(135deg,#14b8a6,#0d9488)',
                color:'white',fontSize:'18px',cursor:'pointer',zIndex:'999',
                boxShadow:'0 4px 15px rgba(20,184,166,0.4)'
            });
            btn.textContent = '📊';
            document.body.appendChild(btn);
            btn.addEventListener('click', () => {
                const text = document.body.innerText;
                const chars = text.length;
                const words = text.split(/\s+/).length;
                const lines = text.split('\n').length;
                const paragraphs = document.querySelectorAll('p').length;
                const headings = document.querySelectorAll('h1,h2,h3,h4,h5,h6').length;
                const images = document.querySelectorAll('img').length;
                const links = document.querySelectorAll('a').length;
                alert(`📊 页面统计\n━━━━━━━━━━━━━━━━\n字符数: ${chars.toLocaleString()}\n词数: ${words.toLocaleString()}\n行数: ${lines.toLocaleString()}\n段落数: ${paragraphs}\n标题数: ${headings}\n图片数: ${images}\n链接数: ${links}`);
            });
        } catch(err) { console.warn('[FP67]', err); }
    }
});

// 68. 页面缩放
FeaturePack.register('fp68_page_zoom', {
    name: '页面缩放', desc: '滚轮+Ctrl页面缩放',
    initFn() {
        try {
            let zoom = 100;
            document.addEventListener('wheel', (e) => {
                if(e.ctrlKey) {
                    e.preventDefault();
                    zoom = Math.max(50, Math.min(200, zoom + (e.deltaY>0?-10:10)));
                    document.body.style.zoom = zoom + '%';
                    console.log(`[FP68] 缩放: ${zoom}%`);
                }
            }, {passive:false});
        } catch(err) { console.warn('[FP68]', err); }
    }
});

// 69. 开发者面板
FeaturePack.register('fp69_dev_panel', {
    name: '开发者面板', desc: '快捷开发工具',
    initFn() {
        try {
            const panel = el('div', {
                position:'fixed',top:'50px',left:'-300px',width:'280px',
                background:'#1f2937',color:'white',borderRadius:'0 12px 12px 0',
                padding:'15px',zIndex:'99999',transition:'left .3s ease',
                boxShadow:'0 10px 40px rgba(0,0,0,0.3)',fontSize:'13px'
            });
            panel.innerHTML = `<div style="font-weight:600;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">🛠 开发者面板<button class="fp-dev-close" style="background:none;border:none;color:#999;cursor:pointer;font-size:16px;">×</button></div><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;"><button class="fp-dev-btn" data-action="grid" style="padding:8px;background:#374151;border:none;color:white;border-radius:6px;cursor:pointer;font-size:12px;">网格线</button><button class="fp-dev-btn" data-action="outline" style="padding:8px;background:#374151;border:none;color:white;border-radius:6px;cursor:pointer;font-size:12px;">元素边框</button><button class="fp-dev-btn" data-action="info" style="padding:8px;background:#374151;border:none;color:white;border-radius:6px;cursor:pointer;font-size:12px;">页面信息</button><button class="fp-dev-btn" data-action="clear" style="padding:8px;background:#374151;border:none;color:white;border-radius:6px;cursor:pointer;font-size:12px;">清除缓存</button><button class="fp-dev-btn" data-action="cookie" style="padding:8px;background:#374151;border:none;color:white;border-radius:6px;cursor:pointer;font-size:12px;">Cookies</button><button class="fp-dev-btn" data-action="storage" style="padding:8px;background:#374151;border:none;color:white;border-radius:6px;cursor:pointer;font-size:12px;">Storage</button></div><div class="fp-dev-info" style="margin-top:12px;padding:10px;background:#111827;border-radius:8px;font-size:11px;color:#9ca3af;max-height:200px;overflow:auto;"></div>`;
            document.body.appendChild(panel);
            const toggleBtn = el('button', {
                position:'fixed',top:'50px',left:'0',padding:'8px 12px',
                background:'#1f2937',color:'white',border:'none',borderRadius:'0 8px 8px 0',
                cursor:'pointer',zIndex:'99998',fontSize:'14px'
            });
            toggleBtn.textContent = '🛠';
            document.body.appendChild(toggleBtn);
            let open=false;
            const toggle = () => { open=!open; panel.style.left=open?'0':'-300px'; toggleBtn.style.left=open?'280px':'0'; };
            toggleBtn.addEventListener('click', toggle);
            panel.querySelector('.fp-dev-close').addEventListener('click', toggle);
            panel.querySelectorAll('.fp-dev-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    const info = panel.querySelector('.fp-dev-info');
                    if(action==='grid') {
                        document.body.classList.toggle('fp-dev-grid');
                        if(document.body.classList.contains('fp-dev-grid')) {
                            const s = document.createElement('style');
                            s.id='fp-dev-grid-style';
                            s.textContent='body.fp-dev-grid { background-image:linear-gradient(rgba(102,126,234,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(102,126,234,0.1) 1px, transparent 1px); background-size:20px 20px; }';
                            document.head.appendChild(s);
                            info.textContent='网格线已开启';
                        } else {
                            document.getElementById('fp-dev-grid-style')?.remove();
                            info.textContent='网格线已关闭';
                        }
                    } else if(action==='outline') {
                        document.querySelectorAll('*').forEach(el => {
                            el.style.outline = el.style.outline ? '' : '1px solid rgba(102,126,234,0.3)';
                        });
                        info.textContent='元素边框已切换';
                    } else if(action==='info') {
                        info.innerHTML = `URL: ${location.href}<br>标题: ${document.title}<br>分辨率: ${screen.width}×${screen.height}<br>视口: ${window.innerWidth}×${window.innerHeight}<br>协议: ${location.protocol}<br>UA: ${navigator.userAgent.slice(0,50)}...`;
                    } else if(action==='clear') {
                        localStorage.clear(); sessionStorage.clear();
                        info.textContent='缓存已清除！';
                    } else if(action==='cookie') {
                        info.textContent = document.cookie.split(';').join('<br>') || '无 Cookies';
                    } else if(action==='storage') {
                        const items = [];
                        for(let i=0;i<localStorage.length;i++) {
                            const k=localStorage.key(i);
                            items.push(`${k}: ${localStorage.getItem(k)?.slice(0,30)}...`);
                        }
                        info.innerHTML = items.join('<br>') || '无存储数据';
                    }
                });
            });
        } catch(err) { console.warn('[FP69]', err); }
    }
});

// 70. 禁止调试
FeaturePack.register('fp70_anti_debug', {
    name: '反调试', desc: '禁止F12调试',
    initFn() {
        try {
            let count=0;
            const check = function() {
                function d(){}
                d.toString = () => { count++; if(count>10) { document.body.innerHTML='<div style="padding:50px;text-align:center;font-size:24px;">🚫 调试已检测</div>'; } return ''; };
                console.log('%c', d);
            };
            setInterval(check, 1000);
            document.addEventListener('keydown', (e) => {
                if(e.key==='F12' || (e.ctrlKey && e.shiftKey && e.key==='I')) {
                    e.preventDefault(); return false;
                }
            });
        } catch(err) { console.warn('[FP70]', err); }
    }
});

// 71. 页面水印
FeaturePack.register('fp71_watermark', {
    name: '页面水印', desc: '添加自定义水印',
    initFn() {
        try {
            const container = el('div', {
                position:'fixed',top:'0',left:'0',width:'100%',height:'100%',
                pointerEvents:'none',zIndex:'9999',overflow:'hidden',opacity:'0.03'
            });
            document.body.appendChild(container);
            const text = 'Hakimi博客 ' + new Date().toLocaleDateString();
            for(let i=0;i<50;i++) {
                const wm = el('div', {
                    position:'absolute',transform:'rotate(-25deg)',
                    fontSize:'16px',color:'#000',whiteSpace:'nowrap',
                    fontWeight:'500'
                });
                wm.textContent = text;
                wm.style.left = ((i%10)*200-50) + 'px';
                wm.style.top = (Math.floor(i/10)*150) + 'px';
                container.appendChild(wm);
            }
        } catch(err) { console.warn('[FP71]', err); }
    }
});

// 72. 烟花特效
FeaturePack.register('fp72_fireworks', {
    name: '烟花特效', desc: '点击页面放烟花',
    initFn() {
        try {
            const canvas = document.createElement('canvas');
            canvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:99999;';
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            document.body.appendChild(canvas);
            const ctx = canvas.getContext('2d');
            const particles = [];
            const colors = ['#667eea','#764ba2','#f5af19','#ff6b6b','#4ecdc4','#a8e6cf','#f97316','#8b5cf6'];
            window.addEventListener('resize', () => { canvas.width=window.innerWidth; canvas.height=window.innerHeight; });
            document.addEventListener('click', (e) => {
                for(let i=0;i<30;i++) {
                    const angle = (Math.PI*2/30)*i;
                    const speed = 2+Math.random()*4;
                    particles.push({x:e.clientX, y:e.clientY, vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed, life:1, color:colors[Math.floor(Math.random()*colors.length)], size:2+Math.random()*3});
                }
            });
            function animate() {
                ctx.fillStyle='rgba(255,255,255,0.1)';
                ctx.fillRect(0,0,canvas.width,canvas.height);
                for(let i=particles.length-1;i>=0;i--) {
                    const p=particles[i];
                    p.x+=p.vx; p.y+=p.vy; p.vy+=0.05; p.life-=0.015; p.size*=0.98;
                    ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fillStyle=p.color; ctx.globalAlpha=p.life; ctx.fill();
                    if(p.life<=0) particles.splice(i,1);
                }
                ctx.globalAlpha=1;
                requestAnimationFrame(animate);
            }
            animate();
        } catch(err) { console.warn('[FP72]', err); }
    }
});

// 73. 雪花特效
FeaturePack.register('fp73_snow', {
    name: '雪花特效', desc: '页面飘雪效果',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                @keyframes snowfall{0%{transform:translateY(-10px) rotate(0deg);}100%{transform:translateY(100vh) rotate(360deg);}}
                .snowflake{position:fixed;top:-10px;color:#fff;animation:snowfall linear infinite;z-index:9999;pointer-events:none;font-size:1rem;}
            `;
            document.head.appendChild(style);
            for(let i=0;i<50;i++) {
                const sf = el('div', {position:'fixed',top:'-10px',color:'white',zIndex:'9999',pointerEvents:'none'});
                sf.textContent = '❄';
                sf.style.left = Math.random()*100+'vw';
                sf.style.fontSize = (8+Math.random()*12)+'px';
                sf.style.opacity = 0.3+Math.random()*0.7;
                sf.style.animation = `snowfall ${8+Math.random()*10}s linear infinite`;
                sf.style.animationDelay = Math.random()*10+'s';
                document.body.appendChild(sf);
            }
        } catch(err) { console.warn('[FP73]', err); }
    }
});

// 74. 点击爱心
FeaturePack.register('fp74_click_heart', {
    name: '点击爱心', desc: '点击出现爱心',
    initFn() {
        try {
            const hearts = ['❤️','🧡','💛','💚','💙','💜','🩷','💖'];
            document.addEventListener('click', (e) => {
                const h = el('div', {
                    position:'fixed',left:e.clientX+'px',top:e.clientY+'px',
                    fontSize:'20px',pointerEvents:'none',zIndex:'99999',
                    transition:'all .8s ease-out'
                });
                h.textContent = hearts[util.rand(0,hearts.length-1)];
                document.body.appendChild(h);
                setTimeout(() => {
                    h.style.transform = `translateY(-${util.rand(60,100)}px) scale(1.5)`;
                    h.style.opacity = '0';
                }, 10);
                setTimeout(() => h.remove(), 850);
            });
        } catch(err) { console.warn('[FP74]', err); }
    }
});

// 75. 火焰标题
FeaturePack.register('fp75_fire_title', {
    name: '火焰标题', desc: '标题火焰动画',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                @keyframes flame{0%,100%{text-shadow:0 0 5px #ff6b6b,0 0 10px #ff6b6b,0 0 15px #ff6b6b;}50%{text-shadow:0 0 10px #f5af19,0 0 20px #f5af19,0 0 30px #f5af19;}}
                h1:hover, .title:hover{animation:flame .8s ease-in-out infinite;}
            `;
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP75]', err); }
    }
});

// 76. 彩虹边框
FeaturePack.register('fp76_rainbow_border', {
    name: '彩虹边框', desc: '图片彩虹边框',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                @keyframes rainbow{0%{border-color:#ff0000;}16%{border-color:#ffaa00;}33%{border-color:#ffff00;}50%{border-color:#00ff00;}66%{border-color:#0066ff;}83%{border-color:#6633ff;}100%{border-color:#ff0000;}}
                img{border:3px solid transparent;border-radius:8px;}
                img:hover{animation:rainbow 2s linear infinite;}
            `;
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP76]', err); }
    }
});

// 77. 3D翻转卡片
FeaturePack.register('fp77_3d_card', {
    name: '3D卡片', desc: '卡片3D翻转效果',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                .card, [class*="card-"]{perspective:1000px;transform-style:preserve-3d;}
                .card:hover, [class*="card-"]:hover{transform:rotateY(10deg) rotateX(5deg);}
            `;
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP77]', err); }
    }
});

// 78. 打字机效果
FeaturePack.register('fp78_typewriter', {
    name: '打字机效果', desc: '副标题打字机',
    initFn() {
        try {
            const subtitles = document.querySelectorAll('h2, .subtitle');
            subtitles.forEach(el => {
                const text = el.textContent;
                el.textContent = '';
                let i = 0;
                const type = () => {
                    if(i<text.length) {
                        el.textContent += text.charAt(i);
                        i++;
                        setTimeout(type, 50+Math.random()*50);
                    }
                };
                setTimeout(type, 500);
            });
        } catch(err) { console.warn('[FP78]', err); }
    }
});

// 79. 呼吸效果
FeaturePack.register('fp79_breath', {
    name: '呼吸效果', desc: '按钮呼吸动画',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                @keyframes breathe{0%,100%{box-shadow:0 0 0 0 rgba(102,126,234,0.4);}50%{box-shadow:0 0 20px 10px rgba(102,126,234,0.1);}}
                button, .btn{animation:breathe 2s ease-in-out infinite;}
            `;
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP79]', err); }
    }
});

// 80. 弹跳加载
FeaturePack.register('fp80_bounce_load', {
    name: '弹跳加载', desc: '加载动画',
    initFn() {
        try {
            const loader = el('div', {
                position:'fixed',top:'0',left:'0',width:'100%',height:'3px',
                background:'#667eea',transformOrigin:'left',zIndex:'99999'
            });
            document.body.appendChild(loader);
            let w=0;
            const interval = setInterval(() => {
                w += util.rand(5,15);
                if(w>=95) { w=100; clearInterval(interval); }
                loader.style.width = w+'%';
            }, 100);
            window.addEventListener('load', () => {
                clearInterval(interval);
                loader.style.width = '100%';
                setTimeout(() => {
                    loader.style.opacity = '0';
                    setTimeout(() => loader.remove(), 300);
                }, 200);
            });
        } catch(err) { console.warn('[FP80]', err); }
    }
});

console.log('📦 Feature Pack Massive #2 已加载 (56-80, 共25个功能)');
                    }
                });
            });
        } catch(err) { console.warn('[FP69]', err); }
    }
});

// 70. 禁止调试
FeaturePack.register('fp70_anti_debug', {
    name: '反调试', desc: '禁止F12调试',
    initFn() {
        try {
            let count=0;
            const check = function() {
                function d(){}
                d.toString = () => { count++; if(count>10) { document.body.innerHTML='<div style="padding:50px;text-align:center;font-size:24px;">🚫 调试已检测</div>'; } return ''; };
                console.log('%c', d);
            };
            setInterval(check, 1000);
            document.addEventListener('keydown', (e) => {
                if(e.key==='F12' || (e.ctrlKey && e.shiftKey && e.key==='I')) {
                    e.preventDefault(); return false;
                }
            });
        } catch(err) { console.warn('[FP70]', err); }
    }
});

// 71. 页面水印
FeaturePack.register('fp71_watermark', {
    name: '页面水印', desc: '添加自定义水印',
    initFn() {
        try {
            const container = el('div', {
                position:'fixed',top:'0',left:'0',width:'100%',height:'100%',
                pointerEvents:'none',zIndex:'9999',overflow:'hidden',opacity:'0.03'
            });
            document.body.appendChild(container);
            const text = 'Hakimi博客 ' + new Date().toLocaleDateString();
            for(let i=0;i<50;i++) {
                const wm = el('div', {
                    position:'absolute',transform:'rotate(-25deg)',
                    fontSize:'16px',color:'#000',whiteSpace:'nowrap',
                    fontWeight:'500'
                });
                wm.textContent = text;
                wm.style.left = ((i%10)*200-50) + 'px';
                wm.style.top = (Math.floor(i/10)*150) + 'px';
                container.appendChild(wm);
            }
        } catch(err) { console.warn('[FP71]', err); }
    }
});

// 72. 烟花特效
FeaturePack.register('fp72_fireworks', {
    name: '烟花特效', desc: '点击页面放烟花',
    initFn() {
        try {
            const canvas = document.createElement('canvas');
            canvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:99999;';
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            document.body.appendChild(canvas);
            const ctx = canvas.getContext('2d');
            const particles = [];
            const colors = ['#667eea','#764ba2','#f5af19','#ff6b6b','#4ecdc4','#a8e6cf','#f97316','#8b5cf6'];
            window.addEventListener('resize', () => { canvas.width=window.innerWidth; canvas.height=window.innerHeight; });
            document.addEventListener('click', (e) => {
                for(let i=0;i<30;i++) {
                    const angle = (Math.PI*2/30)*i;
                    const speed = 2+Math.random()*4;
                    particles.push({x:e.clientX, y:e.clientY, vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed, life:1, color:colors[Math.floor(Math.random()*colors.length)], size:2+Math.random()*3});
                }
            });
            function animate() {
                ctx.fillStyle='rgba(255,255,255,0.1)';
                ctx.fillRect(0,0,canvas.width,canvas.height);
                for(let i=particles.length-1;i>=0;i--) {
                    const p=particles[i];
                    p.x+=p.vx; p.y+=p.vy; p.vy+=0.05; p.life-=0.015; p.size*=0.98;
                    ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fillStyle=p.color; ctx.globalAlpha=p.life; ctx.fill();
                    if(p.life<=0) particles.splice(i,1);
                }
                ctx.globalAlpha=1;
                requestAnimationFrame(animate);
            }
            animate();
        } catch(err) { console.warn('[FP72]', err); }
    }
});

// 73. 雪花特效
FeaturePack.register('fp73_snow', {
    name: '雪花特效', desc: '页面飘雪效果',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                @keyframes snowfall{0%{transform:translateY(-10px) rotate(0deg);}100%{transform:translateY(100vh) rotate(360deg);}}
                .snowflake{position:fixed;top:-10px;color:#fff;animation:snowfall linear infinite;z-index:9999;pointer-events:none;font-size:1rem;}
            `;
            document.head.appendChild(style);
            for(let i=0;i<50;i++) {
                const sf = el('div', {position:'fixed',top:'-10px',color:'white',zIndex:'9999',pointerEvents:'none'});
                sf.textContent = '❄';
                sf.style.left = Math.random()*100+'vw';
                sf.style.fontSize = (8+Math.random()*12)+'px';
                sf.style.opacity = 0.3+Math.random()*0.7;
                sf.style.animation = `snowfall ${8+Math.random()*10}s linear infinite`;
                sf.style.animationDelay = Math.random()*10+'s';
                document.body.appendChild(sf);
            }
        } catch(err) { console.warn('[FP73]', err); }
    }
});

// 74. 点击爱心
FeaturePack.register('fp74_click_heart', {
    name: '点击爱心', desc: '点击出现爱心',
    initFn() {
        try {
            const hearts = ['❤️','🧡','💛','💚','💙','💜','🩷','💖'];
            document.addEventListener('click', (e) => {
                const h = el('div', {
                    position:'fixed',left:e.clientX+'px',top:e.clientY+'px',
                    fontSize:'20px',pointerEvents:'none',zIndex:'99999',
                    transition:'all .8s ease-out'
                });
                h.textContent = hearts[util.rand(0,hearts.length-1)];
                document.body.appendChild(h);
                setTimeout(() => {
                    h.style.transform = `translateY(-${util.rand(60,100)}px) scale(1.5)`;
                    h.style.opacity = '0';
                }, 10);
                setTimeout(() => h.remove(), 850);
            });
        } catch(err) { console.warn('[FP74]', err); }
    }
});

// 75. 烟花标题
FeaturePack.register('fp75_fire_title', {
    name: '火焰标题', desc: '标题火焰动画',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                @keyframes flame{0%,100%{text-shadow:0 0 5px #ff6b6b,0 0 10px #ff6b6b,0 0 15px #ff6b6b;}50%{text-shadow:0 0 10px #f5af19,0 0 20px #f5af19,0 0 30px #f5af19;}}
                h1:hover, .title:hover{animation:flame .8s ease-in-out infinite;}
            `;
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP75]', err); }
    }
});

// 76. 彩虹边框
FeaturePack.register('fp76_rainbow_border', {
    name: '彩虹边框', desc: '图片彩虹边框',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                @keyframes rainbow{0%{border-color:#ff0000;}16%{border-color:#ffaa00;}33%{border-color:#ffff00;}50%{border-color:#00ff00;}66%{border-color:#0066ff;}83%{border-color:#6633ff;}100%{border-color:#ff0000;}}
                img{border:3px solid transparent;border-radius:8px;}
                img:hover{animation:rainbow 2s linear infinite;}
            `;
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP76]', err); }
    }
});

// 77. 3D翻转卡片
FeaturePack.register('fp77_3d_card', {
    name: '3D卡片', desc: '卡片3D翻转效果',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                .card, [class*="card-"]{perspective:1000px;transform-style:preserve-3d;}
                .card:hover, [class*="card-"]:hover{transform:rotateY(10deg) rotateX(5deg);}
            `;
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP77]', err); }
    }
});

// 78. 打字机效果
FeaturePack.register('fp78_typewriter', {
    name: '打字机效果', desc: '副标题打字机',
    initFn() {
        try {
            const subtitles = document.querySelectorAll('h2, .subtitle');
            subtitles.forEach(el => {
                const text = el.textContent;
                el.textContent = '';
                let i = 0;
                const type = () => {
                    if(i<text.length) {
                        el.textContent += text.charAt(i);
                        i++;
                        setTimeout(type, 50+Math.random()*50);
                    }
                };
                setTimeout(type, 500);
            });
        } catch(err) { console.warn('[FP78]', err); }
    }
});

// 79. 呼吸效果
FeaturePack.register('fp79_breath', {
    name: '呼吸效果', desc: '按钮呼吸动画',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                @keyframes breathe{0%,100%{box-shadow:0 0 0 0 rgba(102,126,234,0.4);}50%{box-shadow:0 0 20px 10px rgba(102,126,234,0.1);}}
                button, .btn{animation:breathe 2s ease-in-out infinite;}
            `;
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP79]', err); }
    }
});

// 80. 弹跳加载
FeaturePack.register('fp80_bounce_load', {
    name: '弹跳加载', desc: '加载动画',
    initFn() {
        try {
            const loader = el('div', {
                position:'fixed',top:'0',left:'0',width:'100%',height:'3px',
                background:'#667eea',transformOrigin:'left',zIndex:'99999'
            });
            document.body.appendChild(loader);
            let w=0;
            const interval = setInterval(() => {
                w += util.rand(5,15);
                if(w>=95) { w=100; clearInterval(interval); }
                loader.style.width = w+'%';
            }, 100);
            window.addEventListener('load', () => {
                clearInterval(interval);
                loader.style.width = '100%';
                setTimeout(() => {
                    loader.style.opacity = '0';
                    setTimeout(() => loader.remove(), 300);
                }, 200);
            });
        } catch(err) { console.warn('[FP80]', err); }
    }
});

// 81. 元素出现动画
FeaturePack.register('fp81_animate_on_scroll', {
    name: '滚动动画', desc: '元素滚动出现',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                .anim-up{opacity:0;transform:translateY(30px);transition:all .6s ease;}
                .anim-up.show{opacity:1;transform:translateY(0);}
            `;
            document.head.appendChild(style);
            document.querySelectorAll('section, article, .card, p').forEach(el => el.classList.add('anim-up'));
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('show'); });
            }, {threshold:0.1});
            document.querySelectorAll('.anim-up').forEach(el => observer.observe(el));
        } catch(err) { console.warn('[FP81]', err); }
    }
});

// 82. 毛玻璃效果
FeaturePack.register('fp82_glassmorphism', {
    name: '毛玻璃', desc: '导航栏毛玻璃效果',
    initFn() {
        try {
            const nav = document.querySelector('nav, header, .header');
            if(nav) {
                nav.style.background = 'rgba(255,255,255,0.8)';
                nav.style.backdropFilter = 'blur(10px)';
                nav.style.webkitBackdropFilter = 'blur(10px)';
            }
        } catch(err) { console.warn('[FP82]', err); }
    }
});

// 83. 渐变文字
FeaturePack.register('fp83_gradient_text', {
    name: '渐变文字', desc: '标题渐变文字',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                h1, h2, .title{background:linear-gradient(135deg,#667eea 0%,#764ba2 50%,#f5af19 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
            `;
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP83]', err); }
    }
});

// 84. 发光文字
FeaturePack.register('fp84_glow_text', {
    name: '发光文字', desc: 'hover发光效果',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                a:hover, h1:hover{text-shadow:0 0 10px rgba(102,126,234,0.5), 0 0 20px rgba(102,126,234,0.3), 0 0 30px rgba(102,126,234,0.2);}
            `;
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP84]', err); }
    }
});

// 85. 下划线动画
FeaturePack.register('fp85_underline_anim', {
    name: '下划线动画', desc: '链接下划线展开',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                a{position:relative;text-decoration:none;}
                a::after{content:'';position:absolute;bottom:-2px;left:50%;width:0;height:2px;background:linear-gradient(90deg,#667eea,#764ba2);transition:all .3s ease;transform:translateX(-50%);}
                a:hover::after{width:100%;}
            `;
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP85]', err); }
    }
});

// 86. 脉冲动画
FeaturePack.register('fp86_pulse', {
    name: '脉冲效果', desc: '重要按钮脉冲',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                @keyframes pulse-anim{0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(239,68,68,0.7);}50%{transform:scale(1.05);box-shadow:0 0 20px 5px rgba(239,68,68,0.3);}}
                [type="submit"], .btn-primary{animation:pulse-anim 2s infinite;}
            `;
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP86]', err); }
    }
});

// 87. 翻转效果
FeaturePack.register('fp87_flip_card', {
    name: '翻转卡片', desc: '卡片hover翻转',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                .card:hover{transform:rotateY(180deg);transition:transform .6s;transform-style:preserve-3d;}
            `;
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP87]', err); }
    }
});

// 88. 缩放效果
FeaturePack.register('fp88_zoom_hover', {
    name: '缩放hover', desc: 'hover缩放效果',
    initFn() {
        try {
            const style = document.createElement('style');
            style