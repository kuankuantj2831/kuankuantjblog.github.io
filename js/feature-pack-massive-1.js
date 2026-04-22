/**
 * 功能包 - 海量功能合集 #1 (6-55) - 50个功能
 * UI增强、动画效果、交互优化、工具集
 */
import FeaturePack from './feature-pack-core.js?v=20260419a';
const { util } = FeaturePack;
const el = util.el;

// ============================================================
// 6. 点击波纹效果
FeaturePack.register('fp06_click_ripple', {
    name: '点击波纹效果', desc: '点击页面产生扩散波纹动画',
    initFn() {
        const colors = ['#667eea','#764ba2','#f5af19','#ff6b6b','#4ecdc4','#a8e6cf'];
        document.addEventListener('click', (e) => {
            try {
                const ripple = el('div', {
                    position:'fixed',left:e.clientX+'px',top:e.clientY+'px',
                    width:'0px',height:'0px',borderRadius:'50%',
                    background:colors[util.rand(0,5)],pointerEvents:'none',
                    zIndex:'9998',opacity:'0.6',transform:'translate(-50%,-50%)'
                });
                document.body.appendChild(ripple);
                let size = 0, opacity = 0.6;
                const anim = () => {
                    size += 8; opacity -= 0.02;
                    if (opacity <= 0) { ripple.remove(); return; }
                    ripple.style.width = size + 'px';
                    ripple.style.height = size + 'px';
                    ripple.style.opacity = opacity;
                    requestAnimationFrame(anim);
                };
                requestAnimationFrame(anim);
            } catch(err) { console.warn('[FP06]', err); }
        });
    }
});

// 7. 阅读模式
FeaturePack.register('fp07_read_mode', {
    name: '阅读模式', desc: '净化页面专注阅读',
    initFn() {
        try {
            const btn = el('button', {
                position:'fixed',right:'20px',bottom:'120px',zIndex:'999',
                width:'44px',height:'44px',borderRadius:'50%',border:'none',
                background:'linear-gradient(135deg,#667eea,#764ba2)',color:'white',
                fontSize:'18px',cursor:'pointer',boxShadow:'0 4px 15px rgba(102,126,234,0.4)'
            });
            btn.textContent = '📖';
            btn.title = '阅读模式';
            document.body.appendChild(btn);
            let isReading = false;
            btn.addEventListener('click', () => {
                isReading = !isReading;
                if (isReading) {
                    document.body.style.filter = 'contrast(1.1) brightness(1.05)';
                    document.querySelectorAll('aside, .sidebar, .ad, nav').forEach(el => {
                        if(el) el.style.display = 'none';
                    });
                    btn.textContent = '✕';
                    btn.style.background = 'linear-gradient(135deg,#ff6b6b,#ee5a6f)';
                } else {
                    document.body.style.filter = '';
                    document.querySelectorAll('aside, .sidebar, .ad, nav').forEach(el => {
                        if(el) el.style.display = '';
                    });
                    btn.textContent = '📖';
                    btn.style.background = 'linear-gradient(135deg,#667eea,#764ba2)';
                }
            });
        } catch(err) { console.warn('[FP07]', err); }
    }
});

// 8. 字体大小调整
FeaturePack.register('fp08_font_size', {
    name: '字体大小调整', desc: '可调整页面文字大小',
    initFn() {
        try {
            const ctrl = el('div', {
                position:'fixed',right:'20px',bottom:'170px',zIndex:'999',
                background:'white',borderRadius:'25px',padding:'6px 12px',
                boxShadow:'0 4px 15px rgba(0,0,0,0.1)',display:'flex',gap:'8px',
                alignItems:'center',fontSize:'14px'
            });
            ctrl.innerHTML = `<span style="cursor:pointer;font-weight:bold;user-select:none;padding:2px 8px;" class="font-sm">A-</span><span style="cursor:pointer;font-weight:bold;user-select:none;padding:2px 8px;" class="font-df">A</span><span style="cursor:pointer;font-weight:bold;user-select:none;padding:2px 8px;" class="font-lg">A+</span>`;
            document.body.appendChild(ctrl);
            let sizeLevel = 1;
            const setSize = (level) => {
                sizeLevel = Math.max(0, Math.min(2, level));
                const sizes = ['14px', '16px', '18px'];
                document.body.style.fontSize = sizes[sizeLevel];
            };
            ctrl.querySelector('.font-sm').onclick = () => setSize(sizeLevel - 1);
            ctrl.querySelector('.font-df').onclick = () => setSize(1);
            ctrl.querySelector('.font-lg').onclick = () => setSize(sizeLevel + 1);
        } catch(err) { console.warn('[FP08]', err); }
    }
});

// 9. 页面灰度模式
FeaturePack.register('fp09_grayscale', {
    name: '灰度模式', desc: '页面切换为黑白灰度显示',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = '.grayscale-mode { filter: grayscale(100%); }';
            document.head.appendChild(style);
            const btn = el('button', {
                position:'fixed',right:'70px',bottom:'120px',zIndex:'999',
                width:'44px',height:'44px',borderRadius:'50%',border:'none',
                background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'white',
                fontSize:'18px',cursor:'pointer',boxShadow:'0 4px 15px rgba(99,102,241,0.4)'
            });
            btn.textContent = '◐';
            btn.title = '灰度模式';
            document.body.appendChild(btn);
            btn.addEventListener('click', () => {
                document.body.classList.toggle('grayscale-mode');
                btn.textContent = document.body.classList.contains('grayscale-mode') ? '◉' : '◐';
            });
        } catch(err) { console.warn('[FP09]', err); }
    }
});

// 10. 页面缩放控制
FeaturePack.register('fp10_zoom_control', {
    name: '页面缩放', desc: '控制页面整体缩放比例',
    initFn() {
        try {
            let zoom = 100;
            const ctrl = el('div', {
                position:'fixed',right:'120px',bottom:'120px',zIndex:'999',
                background:'white',borderRadius:'25px',padding:'8px 16px',
                boxShadow:'0 4px 15px rgba(0,0,0,0.1)',display:'flex',gap:'10px',
                alignItems:'center',fontSize:'13px',fontWeight:'500'
            });
            ctrl.innerHTML = `<button class="zoom-out" style="width:28px;height:28px;border:none;border-radius:50%;background:#f0f0f0;cursor:pointer;">-</button><span class="zoom-val">100%</span><button class="zoom-in" style="width:28px;height:28px;border:none;border-radius:50%;background:#f0f0f0;cursor:pointer;">+</button>`;
            document.body.appendChild(ctrl);
            const setZoom = (z) => {
                zoom = Math.max(75, Math.min(150, z));
                document.body.style.zoom = zoom + '%';
                ctrl.querySelector('.zoom-val').textContent = zoom + '%';
            };
            ctrl.querySelector('.zoom-out').onclick = () => setZoom(zoom - 10);
            ctrl.querySelector('.zoom-in').onclick = () => setZoom(zoom + 10);
        } catch(err) { console.warn('[FP10]', err); }
    }
});

// 11. 护眼模式
FeaturePack.register('fp11_eye_care', {
    name: '护眼模式', desc: '添加暖色滤镜保护眼睛',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = '.eye-care-mode::before { content:""; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,240,200,0.15); pointer-events:none; z-index:999999; mix-blend-mode:multiply; }';
            document.head.appendChild(style);
            const btn = el('button', {
                position:'fixed',right:'170px',bottom:'120px',zIndex:'999',
                width:'44px',height:'44px',borderRadius:'50%',border:'none',
                background:'linear-gradient(135deg,#f59e0b,#f97316)',color:'white',
                fontSize:'18px',cursor:'pointer',boxShadow:'0 4px 15px rgba(245,158,11,0.4)'
            });
            btn.textContent = '👁';
            btn.title = '护眼模式';
            document.body.appendChild(btn);
            btn.addEventListener('click', () => {
                document.body.classList.toggle('eye-care-mode');
                btn.textContent = document.body.classList.contains('eye-care-mode') ? '☀' : '👁';
            });
        } catch(err) { console.warn('[FP11]', err); }
    }
});

// 12. 全屏模式
FeaturePack.register('fp12_fullscreen', {
    name: '全屏模式', desc: '一键进入全屏浏览',
    initFn() {
        try {
            const btn = el('button', {
                position:'fixed',right:'220px',bottom:'120px',zIndex:'999',
                width:'44px',height:'44px',borderRadius:'50%',border:'none',
                background:'linear-gradient(135deg,#10b981,#059669)',color:'white',
                fontSize:'18px',cursor:'pointer',boxShadow:'0 4px 15px rgba(16,185,129,0.4)'
            });
            btn.textContent = '⛶';
            btn.title = '全屏模式';
            document.body.appendChild(btn);
            btn.addEventListener('click', () => {
                try {
                    if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen();
                        btn.textContent = '⛶';
                    } else {
                        document.exitFullscreen();
                        btn.textContent = '⛶';
                    }
                } catch(e) { console.warn('[FP12] Fullscreen:', e); }
            });
        } catch(err) { console.warn('[FP12]', err); }
    }
});

// 13. 图片放大预览
FeaturePack.register('fp13_image_zoom', {
    name: '图片放大预览', desc: '点击图片全屏查看',
    initFn() {
        try {
            const overlay = el('div', {
                position:'fixed',top:'0',left:'0',width:'100%',height:'100%',
                background:'rgba(0,0,0,0.9)',zIndex:'99999',display:'none',
                justifyContent:'center',alignItems:'center'
            });
            const img = el('img', { maxWidth:'90%', maxHeight:'90%', borderRadius:'8px' });
            const closeBtn = el('button', {
                position:'absolute',top:'20px',right:'20px',
                width:'50px',height:'50px',borderRadius:'50%',border:'none',
                background:'rgba(255,255,255,0.2)',color:'white',fontSize:'24px',
                cursor:'pointer'
            });
            closeBtn.textContent = '✕';
            overlay.appendChild(img);
            overlay.appendChild(closeBtn);
            document.body.appendChild(overlay);
            closeBtn.onclick = () => overlay.style.display = 'none';
            overlay.onclick = (e) => { if(e.target === overlay) overlay.style.display = 'none'; };
            document.addEventListener('click', (e) => {
                if (e.target.tagName === 'IMG' && !e.target.closest('[data-no-zoom]')) {
                    img.src = e.target.src;
                    overlay.style.display = 'flex';
                }
            }, true);
        } catch(err) { console.warn('[FP13]', err); }
    }
});

// 14. 代码一键复制
FeaturePack.register('fp14_code_copy', {
    name: '代码一键复制', desc: '代码块添加复制按钮',
    initFn() {
        try {
            const addCopyButtons = () => {
                document.querySelectorAll('pre, code').forEach(block => {
                    if (block.dataset.copyAdded) return;
                    block.dataset.copyAdded = 'true';
                    block.style.position = 'relative';
                    const btn = el('button', {
                        position:'absolute',top:'8px',right:'8px',
                        padding:'4px 10px',fontSize:'12px',border:'none',
                        borderRadius:'4px',background:'rgba(102,126,234,0.9)',
                        color:'white',cursor:'pointer',opacity:'0',transition:'opacity .2s'
                    });
                    btn.textContent = '复制';
                    block.style.paddingRight = '60px';
                    block.appendChild(btn);
                    block.addEventListener('mouseenter', () => btn.style.opacity = '1');
                    block.addEventListener('mouseleave', () => btn.style.opacity = '0');
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const text = block.textContent || block.innerText;
                        navigator.clipboard.writeText(text).then(() => {
                            btn.textContent = '已复制!';
                            setTimeout(() => btn.textContent = '复制', 1500);
                        }).catch(() => {
                            btn.textContent = '失败';
                            setTimeout(() => btn.textContent = '复制', 1500);
                        });
                    });
                });
            };
            addCopyButtons();
            new MutationObserver(util.debounce(addCopyButtons, 1000)).observe(document.body, {childList:true, subtree:true});
        } catch(err) { console.warn('[FP14]', err); }
    }
});

// 15. 平滑滚动
FeaturePack.register('fp15_smooth_scroll', {
    name: '平滑滚动', desc: '所有锚点跳转平滑过渡',
    initFn() {
        try {
            document.documentElement.style.scrollBehavior = 'smooth';
            document.addEventListener('click', (e) => {
                const link = e.target.closest('a[href^="#"]');
                if (link) {
                    const target = document.querySelector(link.getAttribute('href'));
                    if (target) {
                        e.preventDefault();
                        target.scrollIntoView({ behavior:'smooth', block:'start' });
                    }
                }
            });
        } catch(err) { console.warn('[FP15]', err); }
    }
});

// 16. 滚动显示动画
FeaturePack.register('fp16_scroll_reveal', {
    name: '滚动显示动画', desc: '元素进入视口时淡入',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                .reveal-item { opacity:0; transform:translateY(30px); transition:all .6s ease; }
                .reveal-item.visible { opacity:1; transform:translateY(0); }
            `;
            document.head.appendChild(style);
            const observe = () => {
                document.querySelectorAll('h1,h2,h3,h4,p,img,section,article,.card').forEach(el => {
                    if (el.classList.contains('reveal-item')) return;
                    el.classList.add('reveal-item');
                });
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) entry.target.classList.add('visible');
                    });
                }, { threshold:0.1 });
                document.querySelectorAll('.reveal-item').forEach(el => observer.observe(el));
            };
            setTimeout(observe, 500);
        } catch(err) { console.warn('[FP16]', err); }
    }
});

// 17. 导航栏滚动隐藏
FeaturePack.register('fp17_nav_hide', {
    name: '导航滚动隐藏', desc: '向下滚动隐藏导航栏',
    initFn() {
        try {
            let lastY = window.scrollY;
            const nav = document.querySelector('nav, header, .header');
            if (!nav) return;
            nav.style.transition = 'transform .3s ease, top .3s ease';
            window.addEventListener('scroll', util.throttle(() => {
                const y = window.scrollY;
                if (y > lastY && y > 100) {
                    nav.style.transform = 'translateY(-100%)';
                } else {
                    nav.style.transform = 'translateY(0)';
                }
                lastY = y;
            }, 100));
        } catch(err) { console.warn('[FP17]', err); }
    }
});

// 18. 回到顶部按钮
FeaturePack.register('fp18_back_to_top', {
    name: '回到顶部', desc: '滚动时显示回到顶部按钮',
    initFn() {
        try {
            const btn = el('button', {
                position:'fixed',bottom:'30px',right:'30px',width:'50px',height:'50px',
                borderRadius:'50%',border:'none',background:'linear-gradient(135deg,#667eea,#764ba2)',
                color:'white',fontSize:'20px',cursor:'pointer',zIndex:'999',
                boxShadow:'0 4px 15px rgba(102,126,234,0.4)',opacity:'0',
                transform:'translateY(20px)',transition:'all .3s ease',pointerEvents:'none'
            });
            btn.textContent = '↑';
            document.body.appendChild(btn);
            btn.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
            window.addEventListener('scroll', util.throttle(() => {
                if (window.scrollY > 300) {
                    btn.style.opacity = '1';
                    btn.style.transform = 'translateY(0)';
                    btn.style.pointerEvents = 'auto';
                } else {
                    btn.style.opacity = '0';
                    btn.style.transform = 'translateY(20px)';
                    btn.style.pointerEvents = 'none';
                }
            }, 100));
        } catch(err) { console.warn('[FP18]', err); }
    }
});

// 19. 页面宽度指示器
FeaturePack.register('fp19_width_indicator', {
    name: '宽度指示器', desc: '开发者工具-显示当前宽度',
    initFn() {
        try {
            const indicator = el('div', {
                position:'fixed',bottom:'10px',left:'50%',transform:'translateX(-50%)',
                padding:'4px 12px',background:'rgba(0,0,0,0.7)',color:'#4ade80',
                fontSize:'11px',borderRadius:'12px',zIndex:'9999',fontFamily:'monospace',
                opacity:'0.7',pointerEvents:'none'
            });
            document.body.appendChild(indicator);
            const update = () => {
                indicator.textContent = `${window.innerWidth}px × ${window.innerHeight}px`;
            };
            update();
            window.addEventListener('resize', util.debounce(update, 100));
        } catch(err) { console.warn('[FP19]', err); }
    }
});

// 20. 快速搜索
FeaturePack.register('fp20_quick_search', {
    name: '快速搜索', desc: 'Ctrl+K 打开快速搜索框',
    initFn() {
        try {
            const searchBox = el('div', {
                position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%) scale(0.9)',
                width:'90%',maxWidth:'500px',background:'white',borderRadius:'16px',
                boxShadow:'0 20px 60px rgba(0,0,0,0.3)',zIndex:'99999',padding:'20px',
                display:'none',opacity:'0',transition:'all .2s ease'
            });
            searchBox.innerHTML = `
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:15px;">
                    <span style="font-size:20px;">🔍</span>
                    <input type="text" class="fp-search-input" placeholder="搜索页面内容..." style="flex:1;border:none;outline:none;font-size:16px;padding:8px 0;">
                    <kbd style="background:#f0f0f0;padding:4px 8px;border-radius:4px;font-size:12px;">ESC</kbd>
                </div>
                <div class="fp-search-results" style="max-height:300px;overflow-y:auto;"></div>
            `;
            document.body.appendChild(searchBox);
            const overlay = el('div', {
                position:'fixed',top:'0',left:'0',width:'100%',height:'100%',
                background:'rgba(0,0,0,0.5)',zIndex:'99998',display:'none'
            });
            document.body.appendChild(overlay);
            const input = searchBox.querySelector('.fp-search-input');
            const results = searchBox.querySelector('.fp-search-results');
            const open = () => {
                searchBox.style.display = 'block';
                overlay.style.display = 'block';
                setTimeout(() => {
                    searchBox.style.opacity = '1';
                    searchBox.style.transform = 'translate(-50%,-50%) scale(1)';
                    input.focus();
                }, 10);
            };
            const close = () => {
                searchBox.style.opacity = '0';
                searchBox.style.transform = 'translate(-50%,-50%) scale(0.9)';
                setTimeout(() => {
                    searchBox.style.display = 'none';
                    overlay.style.display = 'none';
                }, 200);
            };
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); open(); }
                if (e.key === 'Escape') close();
            });
            overlay.addEventListener('click', close);
            input.addEventListener('input', util.debounce(() => {
                const query = input.value.toLowerCase().trim();
                if (!query) { results.innerHTML = ''; return; }
                const words = document.body.innerText.toLowerCase().split(/\s+/);
                const count = words.filter(w => w.includes(query)).length;
                results.innerHTML = `<div style="padding:12px;color:#666;">找到约 <strong>${count}</strong> 处匹配</div>`;
            }, 300));
        } catch(err) { console.warn('[FP20]', err); }
    }
});

// 21. 文字高亮工具
FeaturePack.register('fp21_text_highlighter', {
    name: '文字高亮', desc: '选中文字后可高亮标记',
    initFn() {
        try {
            const colors = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff', '#fed7aa'];
            let colorIndex = 0;
            const toolbar = el('div', {
                position:'fixed',display:'none',background:'white',borderRadius:'8px',
                padding:'6px',boxShadow:'0 4px 20px rgba(0,0,0,0.15)',zIndex:'9999',
                gap:'4px',fontSize:'14px'
            });
            toolbar.innerHTML = `<button class="hl-btn" data-color="0" style="width:24px;height:24px;border:none;border-radius:4px;background:#fef08a;cursor:pointer;"></button><button class="hl-btn" data-color="1" style="width:24px;height:24px;border:none;border-radius:4px;background:#bbf7d0;cursor:pointer;"></button><button class="hl-btn" data-color="2" style="width:24px;height:24px;border:none;border-radius:4px;background:#bfdbfe;cursor:pointer;"></button><button class="hl-clear" style="width:24px;height:24px;border:none;border-radius:4px;background:#fecaca;cursor:pointer;font-size:12px;">✕</button>`;
            document.body.appendChild(toolbar);
            document.addEventListener('mouseup', () => {
                setTimeout(() => {
                    const sel = window.getSelection();
                    if (sel && sel.toString().trim().length > 0) {
                        const range = sel.getRangeAt(0);
                        const rect = range.getBoundingClientRect();
                        toolbar.style.display = 'flex';
                        toolbar.style.left = Math.min(rect.left, window.innerWidth - 150) + 'px';
                        toolbar.style.top = (rect.top - 40 + window.scrollY) + 'px';
                    } else {
                        toolbar.style.display = 'none';
                    }
                }, 10);
            });
            toolbar.querySelectorAll('.hl-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.dataset.color);
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0) {
                        const range = sel.getRangeAt(0);
                        const span = document.createElement('span');
                        span.style.backgroundColor = colors[idx];
                        span.style.borderRadius = '3px';
                        span.style.padding = '1px 3px';
                        try {
                            range.surroundContents(span);
                        } catch(e) { }
                    }
                    toolbar.style.display = 'none';
                });
            });
            toolbar.querySelector('.hl-clear').addEventListener('click', () => toolbar.style.display = 'none');
        } catch(err) { console.warn('[FP21]', err); }
    }
});

// 22. 打字机效果标题
FeaturePack.register('fp22_typewriter_title', {
    name: '打字机标题', desc: '页面标题打字机效果显示',
    initFn() {
        try {
            const titles = document.querySelectorAll('h1, .page-title, .article-title');
            titles.forEach(title => {
                if (title.dataset.typewriter) return;
                title.dataset.typewriter = 'true';
                const text = title.textContent;
                title.textContent = '';
                let i = 0;
                const type = () => {
                    if (i < text.length) {
                        title.textContent += text.charAt(i);
                        i++;
                        setTimeout(type, util.rand(40, 80));
                    }
                };
                setTimeout(type, util.rand(300, 800));
            });
        } catch(err) { console.warn('[FP22]', err); }
    }
});

// 23. 动态渐变背景
FeaturePack.register('fp23_gradient_bg', {
    name: '动态渐变背景', desc: '页面背景缓慢渐变动画',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                @keyframes gradientFlow {
                    0%,100% { background-position:0% 50%; }
                    50% { background-position:100% 50%; }
                }
                .gradient-bg {
                    background:linear-gradient(-45deg,#667eea,#764ba2,#f5af19,#f093fb,#4ecdc4);
                    background-size:400% 400%;
                    animation:gradientFlow 15s ease infinite;
                }
            `;
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP23]', err); }
    }
});

// 24. 鼠标跟随文字
FeaturePack.register('fp24_mouse_text', {
    name: '鼠标跟随文字', desc: '鼠标移动显示跟随文字',
    initFn() {
        try {
            const texts = ['✨', '🌟', '💫', '⭐', '✨', '💖', '🌸', '🍀'];
            let lastX = 0, lastY = 0;
            document.addEventListener('mousemove', util.throttle((e) => {
                if (Math.abs(e.clientX - lastX) < 50 && Math.abs(e.clientY - lastY) < 50) return;
                lastX = e.clientX; lastY = e.clientY;
                const text = el('span', {
                    position:'fixed',left:e.clientX+'px',top:e.clientY+'px',
                    fontSize:util.rand(14,20)+'px',pointerEvents:'none',zIndex:'9999',
                    userSelect:'none',transition:'all 1s ease'
                });
                text.textContent = texts[util.rand(0, texts.length-1)];
                document.body.appendChild(text);
                setTimeout(() => {
                    text.style.opacity = '0';
                    text.style.transform = `translateY(-${util.rand(30,60)}px)`;
                }, 50);
                setTimeout(() => text.remove(), 1100);
            }, 150));
        } catch(err) { console.warn('[FP24]', err); }
    }
});

// 25. 页面访问计数器
FeaturePack.register('fp25_visit_counter', {
    name: '访问计数器', desc: '显示页面访问次数',
    initFn() {
        try {
            const key = 'page_visit_count_' + location.pathname;
            let count = parseInt(localStorage.getItem(key) || '0') + 1;
            localStorage.setItem(key, count.toString());
            const counter = el('div', {
                position:'fixed',bottom:'60px',left:'20px',fontSize:'11px',
                color:'#999',zIndex:'99',opacity:'0.6'
            });
            counter.textContent = `👁 本页访问 ${count} 次`;
            document.body.appendChild(counter);
        } catch(err) { console.warn('[FP25]', err); }
    }
});

// 26. 今日时间显示
FeaturePack.register('fp26_time_display', {
    name: '时间显示', desc: '实时显示当前时间',
    initFn() {
        try {
            const timeEl = el('div', {
                position:'fixed',top:'80px',right:'20px',fontSize:'12px',
                color:'#666',zIndex:'99',background:'rgba(255,255,255,0.8)',
                padding:'6px 12px',borderRadius:'12px',backdropFilter:'blur(10px)',
                boxShadow:'0 2px 8px rgba(0,0,0,0.08)'
            });
            document.body.appendChild(timeEl);
            const update = () => {
                const now = new Date();
                const timeStr = now.toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit',second:'2-digit'});
                const dateStr = now.toLocaleDateString('zh-CN', {month:'2-digit',day:'2-digit',weekday:'short'});
                timeEl.textContent = `🕐 ${timeStr} | ${dateStr}`;
            };
            update();
            setInterval(update, 1000);
        } catch(err) { console.warn('[FP26]', err); }
    }
});

// 27. 快速跳转锚点
FeaturePack.register('fp27_quick_anchors', {
    name: '快速锚点', desc: '侧边显示页面快速跳转点',
    initFn() {
        try {
            const container = el('div', {
                position:'fixed',right:'15px',top:'50%',transform:'translateY(-50%)',
                display:'flex',flexDirection:'column',gap:'10px',zIndex:'99'
            });
            document.body.appendChild(container);
            const headings = document.querySelectorAll('h1, h2');
            if (headings.length < 3) return;
            headings.forEach((h, i) => {
                const dot = el('button', {
                    width:'10px',height:'10px',borderRadius:'50%',border:'none',
                    background:'rgba(102,126,234,0.4)',cursor:'pointer',
                    transition:'all .2s ease',padding:'0'
                });
                dot.title = h.textContent.slice(0, 20);
                dot.addEventListener('click', () => h.scrollIntoView({behavior:'smooth'}));
                dot.addEventListener('mouseenter', () => dot.style.background = 'rgba(102,126,234,0.8)');
                dot.addEventListener('mouseleave', () => dot.style.background = 'rgba(102,126,234,0.4)');
                container.appendChild(dot);
            });
        } catch(err) { console.warn('[FP27]', err); }
    }
});

// 28. 表格样式增强
FeaturePack.register('fp28_table_enhance', {
    name: '表格增强', desc: '表格悬停高亮和斑马纹',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                table { border-collapse:collapse; width:100%; margin:1em 0; }
                th, td { padding:12px; text-align:left; border-bottom:1px solid #eee; }
                th { background:linear-gradient(135deg,#667eea,#764ba2); color:white; font-weight:600; }
                tr:nth-child(even) { background:#f8f9ff; }
                tr:hover { background:#eef2ff; transition:background .2s; }
            `;
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP28]', err); }
    }
});

// 29. 引用块美化
FeaturePack.register('fp29_quote_enhance', {
    name: '引用美化', desc: 'blockquote 样式增强',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                blockquote {
                    border-left:4px solid #667eea; padding:15px 20px;
                    margin:1.5em 0; background:linear-gradient(135deg,#f8f9ff,#fff);
                    border-radius:0 12px 12px 0; font-style:italic; color:#555;
                    position:relative;
                }
                blockquote::before { content:"❝"; position:absolute; top:5px; left:10px; font-size:30px; color:#667eea; opacity:0.3; }
            `;
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP29]', err); }
    }
});

// 30. 链接样式增强
FeaturePack.register('fp30_link_enhance', {
    name: '链接增强', desc: '链接悬停动画效果',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                a:not([class]) {
                    color:#667eea; text-decoration:none; position:relative;
                    transition:color .2s ease;
                }
                a:not([class])::after {
                    content:''; position:absolute; bottom:-2px; left:0; width:0; height:2px;
                    background:linear-gradient(90deg,#667eea,#764ba2); transition:width .3s ease;
                }
                a:not([class]):hover::after { width:100%; }
                a:not([class]):hover { color:#764ba2; }
            `;
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP30]', err); }
    }
});

// 31. 按钮样式增强
FeaturePack.register('fp31_button_enhance', {
    name: '按钮增强', desc: '按钮悬停点击效果',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                button:not([class]), .btn, input[type="submit"], input[type="button"] {
                    background:linear-gradient(135deg,#667eea,#764ba2); color:white;
                    border:none; padding:10px 24px; border-radius:8px; cursor:pointer;
                    font-weight:500; transition:all .3s ease; box-shadow:0 2px 10px rgba(102,126,234,0.3);
                }
                button:not([class]):hover, .btn:hover, input[type="submit"]:hover {
                    transform:translateY(-2px); box-shadow:0 4px 20px rgba(102,126,234,0.4);
                }
                button:not([class]):active, .btn:active { transform:translateY(0); }
            `;
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP31]', err); }
    }
});

// 32. 输入框样式增强
FeaturePack.register('fp32_input_enhance', {
    name: '输入框增强', desc: '输入框聚焦效果',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                input[type="text"], input[type="email"], input[type="password"], textarea, select {
                    border:2px solid #e5e7eb; border-radius:8px; padding:10px 14px;
                    transition:all .3s ease; outline:none; font-size:14px;
                }
                input[type="text"]:focus, input[type="email"]:focus, textarea:focus, select:focus {
                    border-color:#667eea; box-shadow:0 0 0 3px rgba(102,126,234,0.15);
                }
            `;
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP32]', err); }
    }
});

// 33. 卡片悬停效果
FeaturePack.register('fp33_card_hover', {
    name: '卡片悬停', desc: '卡片悬停上浮效果',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                .card, [class*="card-"], [data-card] {
                    transition:all .3s ease; border-radius:12px; overflow:hidden;
                }
                .card:hover, [class*="card-"]:hover, [data-card]:hover {
                    transform:translateY(-5px); box-shadow:0 10px 40px rgba(0,0,0,0.12);
                }
            `;
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP33]', err); }
    }
});

// 34. 图片懒加载占位
FeaturePack.register('fp34_image_placeholder', {
    name: '图片占位', desc: '图片加载时显示模糊占位',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                img { transition:opacity .3s ease, filter .3s ease; }
                img.loading { filter:blur(8px); opacity:0.7; }
                img.loaded { filter:blur(0); opacity:1; }
            `;
            document.head.appendChild(style);
            document.querySelectorAll('img').forEach(img => {
                if (img.complete) return;
                img.classList.add('loading');
                img.onload = () => {
                    img.classList.remove('loading');
                    img.classList.add('loaded');
                };
            });
        } catch(err) { console.warn('[FP34]', err); }
    }
});

// 35. 键盘快捷键提示
FeaturePack.register('fp35_keyboard_hints', {
    name: '快捷键提示', desc: '显示可用键盘快捷键',
    initFn() {
        try {
            const hints = el('div', {
                position:'fixed',bottom:'20px',left:'50%',transform:'translateX(-50%)',
                display:'flex',gap:'15px',background:'rgba(0,0,0,0.7)',color:'white',
                padding:'8px 20px',borderRadius:'20px',fontSize:'11px',zIndex:'999',
                opacity:'0',transition:'opacity .3s ease',pointerEvents:'none'
            });
            hints.innerHTML = `
                <span><kbd style="background:rgba(255,255,255,0.2);padding:2px 6px;border-radius:4px;margin-right:5px;">Ctrl</kbd>+<kbd style="background:rgba(255,255,255,0.2);padding:2px 6px;border-radius:4px;margin-left:3px;">K</kbd> 搜索</span>
                <span><kbd style="background:rgba(255,255,255,0.2);padding:2px 6px;border-radius:4px;margin-right:5px;">Home</kbd> 顶部</span>
                <span><kbd style="background:rgba(255,255,255,0.2);padding:2px 6px;border-radius:4px;margin-right:5px;">End</kbd> 底部</span>
            `;
            document.body.appendChild(hints);
            setTimeout(() => hints.style.opacity = '0.8', 1000);
            setTimeout(() => hints.style.opacity = '0', 6000);
        } catch(err) { console.warn('[FP35]', err); }
    }
});

// 36. 随机名言警句
FeaturePack.register('fp36_random_quote', {
    name: '随机名言', desc: '底部显示随机励志名言',
    initFn() {
        try {
            const quotes = [
                '学而不思则罔，思而不学则殆。',
                '天行健，君子以自强不息。',
                '千里之行，始于足下。',
                '知之为知之，不知为不知，是知也。',
                '三人行，必有我师焉。',
                '路漫漫其修远兮，吾将上下而求索。',
                '不积跬步，无以至千里。',
                '业精于勤，荒于嬉。',
                '宝剑锋从磨砺出，梅花香自苦寒来。',
                '海内存知己，天涯若比邻。'
            ];
            const quoteEl = el('div', {
                position:'fixed',bottom:'20px',left:'50%',transform:'translateX(-50%)',
                fontSize:'12px',color:'#999',textAlign:'center',zIndex:'98',
                maxWidth:'400px',opacity:'0.7',fontStyle:'italic'
            });
            quoteEl.textContent = '💭 ' + quotes[util.rand(0, quotes.length-1)];
            document.body.appendChild(quoteEl);
        } catch(err) { console.warn('[FP36]', err); }
    }
});

// 37. 页面停留时间
FeaturePack.register('fp37_time_on_page', {
    name: '停留时间', desc: '显示在当前页面停留时间',
    initFn() {
        try {
            let seconds = 0;
            const timer = el('div', {
                position:'fixed',top:'110px',right:'20px',fontSize:'11px',
                color:'#999',zIndex:'99',background:'rgba(255,255,255,0.8)',
                padding:'4px 10px',borderRadius:'10px'
            });
            document.body.appendChild(timer);
            setInterval(() => {
                seconds++;
                const m = Math.floor(seconds / 60);
                const s = seconds % 60;
                timer.textContent = `⏱ ${m}:${s.toString().padStart(2,'0')}`;
            }, 1000);
        } catch(err) { console.warn('[FP37]', err); }
    }
});

// 38. 滚动进度条
FeaturePack.register('fp38_scroll_progress', {
    name: '滚动进度', desc: '侧边显示滚动进度条',
    initFn() {
        try {
            const bar = el('div', {
                position:'fixed',right:'0',top:'0',width:'4px',height:'0%',
                background:'linear-gradient(180deg,#667eea,#764ba2)',zIndex:'9999',
                borderRadius:'0 0 0 4px',transition:'height .1s ease'
            });
            document.body.appendChild(bar);
            window.addEventListener('scroll', () => {
                const scroll = window.scrollY;
                const height = document.documentElement.scrollHeight - window.innerHeight;
                const percent = Math.min(100, (scroll / height) * 100);
                bar.style.height = percent + '%';
            });
        } catch(err) { console.warn('[FP38]', err); }
    }
});

// 39. 文字阅读进度
FeaturePack.register('fp39_read_progress', {
    name: '阅读进度', desc: '文章阅读进度百分比',
    initFn() {
        try {
            const article = document.querySelector('article, .article-content, .post-content');
            if (!article) return;
            const indicator = el('div', {
                position:'sticky',top:'10px',marginLeft:'auto',
                width:'fit-content',background:'rgba(102,126,234,0.1)',
                padding:'6px 14px',borderRadius:'20px',fontSize:'12px',
                color:'#667eea',fontWeight:'500',zIndex:'99'
            });
            article.parentNode.insertBefore(indicator, article);
            window.addEventListener('scroll', util.throttle(() => {
                const rect = article.getBoundingClientRect();
                const progress = Math.max(0, Math.min(100, ((-rect.top + 100) / rect.height) * 100));
                indicator.textContent = `📖 已读 ${Math.round(progress)}%`;
            }, 100));
        } catch(err) { console.warn('[FP39]', err); }
    }
});

// 40. 深色模式跟随系统
FeaturePack.register('fp40_system_darkmode', {
    name: '系统深色模式', desc: '自动跟随系统深色/浅色模式',
    initFn() {
        try {
            const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (isDark) {
                document.documentElement.style.setProperty('--bg-color', '#1a1a2e');
                document.documentElement.style.setProperty('--text-color', '#eaeaea');
            }
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if (e.matches) {
                    document.body.style.background = '#1a1a2e';
                    document.body.style.color = '#eaeaea';
                } else {
                    document.body.style.background = '';
                    document.body.style.color = '';
                }
            });
        } catch(err) { console.warn('[FP40]', err); }
    }
});

// 41. 标签页标题滚动
FeaturePack.register('fp41_title_scroll', {
    name: '标题滚动', desc: '页面失活时滚动标题吸引注意',
    initFn() {
        try {
            const originalTitle = document.title;
            const scrollText = '👀 快看这里！ ' + originalTitle + ' ';
            let interval;
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    let i = 0;
                    interval = setInterval(() => {
                        document.title = scrollText.slice(i) + scrollText.slice(0, i);
                        i = (i + 1) % scrollText.length;
                    }, 300);
                } else {
                    clearInterval(interval);
                    document.title = originalTitle;
                }
            });
        } catch(err) { console.warn('[FP41]', err); }
    }
});

// 42. 控制台彩蛋
FeaturePack.register('fp42_console_easter', {
    name: '控制台彩蛋', desc: 'F12控制台显示有趣信息',
    initFn() {
        try {
            console.log('%c🐱 Hakimi 的猫爬架', 'font-size:24px;font-weight:bold;color:#667eea;');
            console.log('%c欢迎来到我的个人博客！', 'font-size:14px;color:#764ba2;');
            console.log('%c✨ 你发现了控制台彩蛋！', 'font-size:12px;color:#f5af19;');
            console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color:#ddd;');
            console.log('%c技术栈: HTML + CSS + JavaScript', 'color:#999;');
            console.log('%c功能包: 1000+ 个功能正在加载中...', 'color:#999;');
            console.log('%c作者: Hakimi', 'color:#999;');
        } catch(err) { console.warn('[FP42]', err); }
    }
});

// 43. 防页面嵌入
FeaturePack.register('fp43_frame_breaker', {
    name: '防嵌入', desc: '防止页面被嵌入iframe',
    initFn() {
        try {
            if (window.top !== window.self) {
                window.top.location = window.self.location;
            }
        } catch(err) { console.warn('[FP43]', err); }
    }
});

// 44. 禁用右键保存
FeaturePack.register('fp44_disable_save', {
    name: '禁用保存', desc: '禁用Ctrl+S保存页面',
    initFn() {
        try {
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    console.log('[FP44] 保存已禁用');
                    return false;
                }
            });
        } catch(err) { console.warn('[FP44]', err); }
    }
});

// 45. 文字选中统计
FeaturePack.register('fp45_selection_stats', {
    name: '选中统计', desc: '显示选中文字的字数统计',
    initFn() {
        try {
            const tip = el('div', {
                position:'fixed',background:'rgba(0,0,0,0.8)',color:'white',
                padding:'6px 12px',borderRadius:'6px',fontSize:'12px',zIndex:'9999',
                display:'none',pointerEvents:'none'
            });
            document.body.appendChild(tip);
            document.addEventListener('mouseup', () => {
                setTimeout(() => {
                    const sel = window.getSelection();
                    const text = sel ? sel.toString().trim() : '';
                    if (text.length > 5) {
                        const range = sel.getRangeAt(0);
                        const rect = range.getBoundingClientRect();
                        tip.textContent = `📝 ${text.length} 字`;
                        tip.style.display = 'block';
                        tip.style.left = rect.left + 'px';
                        tip.style.top = (rect.bottom + 5 + window.scrollY) + 'px';
                        setTimeout(() => tip.style.display = 'none', 2000);
                    } else {
                        tip.style.display = 'none';
                    }
                }, 10);
            });
        } catch(err) { console.warn('[FP45]', err); }
    }
});

// 46. 自动保存滚动位置
FeaturePack.register('fp46_save_scroll', {
    name: '保存滚动位置', desc: '返回页面时恢复滚动位置',
    initFn() {
        try {
            const key = 'scroll_pos_' + location.pathname;
            const saved = sessionStorage.getItem(key);
            if (saved) {
                setTimeout(() => window.scrollTo(0, parseInt(saved)), 100);
            }
            window.addEventListener('beforeunload', () => {
                sessionStorage.setItem(key, window.scrollY.toString());
            });
        } catch(err) { console.warn('[FP46]', err); }
    }
});

// 47. 页面加载时间
FeaturePack.register('fp47_load_time', {
    name: '加载时间', desc: '显示页面加载耗时',
    initFn() {
        try {
            window.addEventListener('load', () => {
                const perf = performance.timing;
                const loadTime = perf.loadEventEnd - perf.navigationStart;
                const domTime = perf.domComplete - perf.domLoading;
                console.log(`%c⚡ 页面加载完成: ${loadTime}ms`, 'color:#10b981;font-weight:bold;');
                console.log(`%c📄 DOM 解析完成: ${domTime}ms`, 'color:#667eea;');
                const tip = el('div', {
                    position:'fixed',bottom:'100px',right:'20px',fontSize:'11px',
                    color:'#10b981',background:'rgba(16,185,129,0.1)',
                    padding:'6px 12px',borderRadius:'12px',zIndex:'99'
                });
                tip.textContent = `⚡ 加载完成 ${loadTime}ms`;
                document.body.appendChild(tip);
                setTimeout(() => tip.remove(), 5000);
            });
        } catch(err) { console.warn('[FP47]', err); }
    }
});

// 48. 禁止文字选择
FeaturePack.register('fp48_no_select', {
    name: '禁止选择', desc: '特定区域禁止文字选择',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                .no-select, nav, header, button, .btn {
                    user-select:none; -webkit-user-select:none;
                    -moz-user-select:none; -ms-user-select:none;
                }
            `;
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP48]', err); }
    }
});

// 49. 平滑过渡动画
FeaturePack.register('fp49_smooth_transition', {
    name: '平滑过渡', desc: '全站元素添加过渡动画',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                * { transition:color .2s ease, background-color .2s ease, border-color .2s ease; }
            `;
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP49]', err); }
    }
});

// 50. 打印样式优化
FeaturePack.register('fp50_print_style', {
    name: '打印优化', desc: '优化页面打印效果',
    initFn() {
        try {
            const style = document.createElement('style');
            style.setAttribute('media', 'print');
            style.textContent = `
                @media print {
                    nav, header, footer, aside, .no-print, button, .ad { display:none !important; }
                    body { font-size:12pt; line-height:1.5; color:#000; background:white; }
                    a { text-decoration:none; color:#000; }
                    a::after { content:" (" attr(href) ") "; font-size:10pt; color:#666; }
                    pre, code { page-break-inside:avoid; }
                    article, .article-content { max-width:100% !important; padding:0 !important; }
                }
            `;
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP50]', err); }
    }
});

// 51. 悬停放大图片
FeaturePack.register('fp51_hover_zoom', {
    name: '悬停放大', desc: '图片悬停时轻微放大',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                img:not([no-zoom]) { transition:transform .3s ease; }
                img:not([no-zoom]):hover { transform:scale(1.05); }
            `;
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP51]', err); }
    }
});

// 52. 自定义滚动条
FeaturePack.register('fp52_custom_scrollbar', {
    name: '自定义滚动条', desc: '美化浏览器滚动条',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                ::-webkit-scrollbar { width:8px; height:8px; }
                ::-webkit-scrollbar-track { background:#f1f1f1; border-radius:4px; }
                ::-webkit-scrollbar-thumb { background:linear-gradient(180deg,#667eea,#764ba2); border-radius:4px; }
                ::-webkit-scrollbar-thumb:hover { background:linear-gradient(180deg,#5a67d8,#6b46c1); }
            `;
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP52]', err); }
    }
});

// 53. 选中文字样式
FeaturePack.register('fp53_selection_style', {
    name: '选中样式', desc: '自定义文字选中颜色',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                ::selection { background:#667eea; color:white; }
                ::-moz-selection { background:#667eea; color:white; }
            `;
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP53]', err); }
    }
});

// 54. 首字下沉
FeaturePack.register('fp54_first_letter', {
    name: '首字下沉', desc: '文章首字大号显示',
    initFn() {
        try {
            const articles = document.querySelectorAll('article p, .article-content p, .post-content p');
            if (articles.length > 0) {
                const firstP = articles[0];
                const text = firstP.textContent;
                if (text.length > 5) {
                    const firstChar = text.charAt(0);
                    const rest = text.slice(1);
                    firstP.innerHTML = `<span style="float:left;font-size:3.5em;line-height:1;font-weight:bold;margin-right:8px;margin-top:-4px;color:#667eea;">${firstChar}</span>${rest}`;
                }
            }
        } catch(err) { console.warn('[FP54]', err); }
    }
});

// 55. 项目符号美化
FeaturePack.register('fp55_list_style', {
    name: '列表美化', desc: 'UL/OL列表样式美化',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = `
                ul, ol { padding-left:25px; }
                li { margin:8px 0; padding-left:5px; }
                ul li::marker { content:"✨ "; color:#667eea; font-size:14px; }
                ol { counter-reset:item; list-style:none; }
                ol li { counter-increment:item; position:relative; padding-left:30px; }
                ol li::before {
                    content:counter(item); position:absolute; left:0; top:2px;
                    width:20px; height:20px; line-height:20px; text-align:center;
                    background:linear-gradient(135deg,#667eea,#764ba2);
                    color:white; border-radius:50%; font-size:11px; font-weight:bold;
                }
            `;
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP55]', err); }
    }
});

console.log('📦 Feature Pack Massive #1 已加载 (6-55，共50个功能)');
