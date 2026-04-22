/**
 * 功能包 - 海量功能合集 #3 (81-130) - 50个功能
 * 滚动动画、视觉效果、交互增强等
 */
import FeaturePack from './feature-pack-core.js?v=20260419a';
const { util } = FeaturePack;
const el = util.el;

// 81. 滚动出现动画
FeaturePack.register('fp81_animate_on_scroll', {
    name: '滚动动画', desc: '元素滚动出现',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = '.anim-up{opacity:0;transform:translateY(30px);transition:all .6s ease;}.anim-up.show{opacity:1;transform:translateY(0);}';
            document.head.appendChild(style);
            document.querySelectorAll('section, article, .card, p').forEach(el => el.classList.add('anim-up'));
            const observer = new IntersectionObserver((entries) => { entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('show'); }); }, {threshold:0.1});
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
            if(nav) { nav.style.background='rgba(255,255,255,0.8)'; nav.style.backdropFilter='blur(10px)'; nav.style.webkitBackdropFilter='blur(10px)'; }
        } catch(err) { console.warn('[FP82]', err); }
    }
});

// 83. 渐变文字
FeaturePack.register('fp83_gradient_text', {
    name: '渐变文字', desc: '标题渐变文字',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = 'h1, h2, .title{background:linear-gradient(135deg,#667eea 0%,#764ba2 50%,#f5af19 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}';
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
            style.textContent = 'a:hover, h1:hover{text-shadow:0 0 10px rgba(102,126,234,0.5), 0 0 20px rgba(102,126,234,0.3), 0 0 30px rgba(102,126,234,0.2);}';
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
            style.textContent = 'a{position:relative;text-decoration:none;}a::after{content:\'\';position:absolute;bottom:-2px;left:50%;width:0;height:2px;background:linear-gradient(90deg,#667eea,#764ba2);transition:all .3s ease;transform:translateX(-50%);}a:hover::after{width:100%;}';
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
            style.textContent = '@keyframes pulse-anim{0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(239,68,68,0.7);}50%{transform:scale(1.05);box-shadow:0 0 20px 5px rgba(239,68,68,0.3);}}[type="submit"], .btn-primary{animation:pulse-anim 2s infinite;}';
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP86]', err); }
    }
});

// 87. 翻转卡片
FeaturePack.register('fp87_flip_card', {
    name: '翻转卡片', desc: '卡片hover翻转',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = '.card:hover{transform:rotateY(180deg);transition:transform .6s;transform-style:preserve-3d;}';
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP87]', err); }
    }
});

// 88. 缩放hover
FeaturePack.register('fp88_zoom_hover', {
    name: '缩放hover', desc: 'hover缩放效果',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = 'img, .card, button{transition:transform .3s ease;}img:hover, .card:hover, button:hover{transform:scale(1.05);}';
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP88]', err); }
    }
});

// 89. 幻灯片效果
FeaturePack.register('fp89_slide_up', {
    name: '滑入效果', desc: '元素滑入动画',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = '@keyframes slideUp{from{opacity:0;transform:translateY(50px);}to{opacity:1;transform:translateY(0);}}.slide-up{animation:slideUp .6s ease forwards;}';
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP89]', err); }
    }
});

// 90. 波纹按钮
FeaturePack.register('fp90_ripple_btn', {
    name: '波纹按钮', desc: '点击波纹效果',
    initFn() {
        try {
            document.addEventListener('click', (e) => {
                const btn = e.target.closest('button, .btn');
                if(!btn) return;
                const rect = btn.getBoundingClientRect();
                const ripple = el('span', {
                    position:'absolute', borderRadius:'50%',
                    background:'rgba(255,255,255,0.5)', pointerEvents:'none',
                    left:(e.clientX - rect.left)+'px', top:(e.clientY - rect.top)+'px',
                    width:'0px', height:'0px', animation:'ripple .6s ease-out'
                });
                btn.style.position = 'relative'; btn.style.overflow = 'hidden';
                btn.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
            });
            const s = document.createElement('style'); s.textContent='@keyframes ripple{to{width:200px;height:200px;opacity:0;margin:-100px;}}'; document.head.appendChild(s);
        } catch(err) { console.warn('[FP90]', err); }
    }
});

// 91. 回车键搜索
FeaturePack.register('fp91_enter_search', {
    name: '回车搜索', desc: '回车快速搜索',
    initFn() {
        try {
            document.addEventListener('keydown', (e) => {
                if(e.key==='Enter' && !e.ctrlKey && !document.activeElement.matches('input,textarea')) {
                    const input = document.querySelector('input[type="search"], .search-input');
                    if(input) { input.focus(); e.preventDefault(); }
                }
            });
        } catch(err) { console.warn('[FP91]', err); }
    }
});

// 92. 历史导航
FeaturePack.register('fp92_history_nav', {
    name: '历史导航', desc: 'Alt+左右键前进后退',
    initFn() {
        try {
            document.addEventListener('keydown', (e) => {
                if(e.altKey && e.key==='ArrowLeft') history.back();
                if(e.altKey && e.key==='ArrowRight') history.forward();
            });
        } catch(err) { console.warn('[FP92]', err); }
    }
});

// 93. 关闭弹窗
FeaturePack.register('fp93_esc_close', {
    name: 'ESC关闭', desc: 'ESC键关闭弹窗',
    initFn() {
        try {
            document.addEventListener('keydown', (e) => {
                if(e.key==='Escape') {
                    document.querySelectorAll('.modal, .popup, [class*="modal"]').forEach(m => m.style.display='none');
                }
            });
        } catch(err) { console.warn('[FP93]', err); }
    }
});

// 94. 焦点循环
FeaturePack.register('fp94_focus_trap', {
    name: '焦点循环', desc: 'Tab键循环焦点',
    initFn() {
        try {
            document.addEventListener('keydown', (e) => {
                if(e.key==='Tab') {
                    const focusable = document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                    if(focusable.length===0) return;
                    const first = focusable[0], last = focusable[focusable.length-1];
                    if(e.shiftKey && document.activeElement===first) { e.preventDefault(); last.focus(); }
                    else if(!e.shiftKey && document.activeElement===last) { e.preventDefault(); first.focus(); }
                }
            });
        } catch(err) { console.warn('[FP94]', err); }
    }
});

// 95. 自动聚焦
FeaturePack.register('fp95_auto_focus', {
    name: '自动聚焦', desc: '页面加载自动聚焦搜索',
    initFn() {
        try { setTimeout(() => { const i = document.querySelector('input[type="search"], .search-input, input:first-child'); if(i) i.focus(); }, 500); } catch(err) { console.warn('[FP95]', err); }
    }
});

// 96. 键盘快捷键
FeaturePack.register('fp96_keyboard_shortcuts', {
    name: '快捷键', desc: '常用快捷键',
    initFn() {
        try {
            document.addEventListener('keydown', (e) => {
                if(e.ctrlKey && e.key==='b') { e.preventDefault(); document.body.classList.toggle('dark-mode'); }
                if(e.ctrlKey && e.key==='k') { e.preventDefault(); window.scrollTo({top:0,behavior:'smooth'}); }
                if(e.ctrlKey && e.key==='m') { e.preventDefault(); window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'}); }
                if(e.ctrlKey && e.key==='r') { e.preventDefault(); location.reload(); }
            });
        } catch(err) { console.warn('[FP96]', err); }
    }
});

// 97. 跳转顶部
FeaturePack.register('fp97_gg_top', {
    name: 'GG到顶', desc: '双击Ctrl',
    initFn() {
        try {
            let lastG = 0;
            document.addEventListener('keydown', (e) => {
                const now = Date.now();
                if(e.key.toLowerCase()==='g' && now - lastG < 300) window.scrollTo({top:0,behavior:'smooth'});
                lastG = now;
            });
        } catch(err) { console.warn('[FP97]', err); }
    }
});

// 98. 打印友好
FeaturePack.register('fp98_print_friendly', {
    name: '打印友好', desc: '打印页面优化',
    initFn() {
        try {
            const s = document.createElement('style');
            s.setAttribute('media', 'print');
            s.textContent = '@media print{nav, header, footer, aside, .no-print, button, .ad{display:none !important;}body{font-size:12pt;line-height:1.5;color:#000;background:white;}a{text-decoration:none;color:#000;}a::after{content:" (" attr(href) ") ";font-size:10pt;color:#666;}pre, code{page-break-inside:avoid;}}';
            document.head.appendChild(s);
        } catch(err) { console.warn('[FP98]', err); }
    }
});

// 99. 图片懒加载
FeaturePack.register('fp99_lazy_load', {
    name: '懒加载', desc: '图片延迟加载',
    initFn() {
        try {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(e => { if(e.isIntersecting) { const img = e.target; img.src = img.dataset.src || img.src; img.classList.add('loaded'); observer.unobserve(img); } });
            });
            document.querySelectorAll('img').forEach(img => observer.observe(img));
        } catch(err) { console.warn('[FP99]', err); }
    }
});

// 100. 图片错误处理
FeaturePack.register('fp100_img_error', {
    name: '图片错误处理', desc: '图片加载失败显示占位',
    initFn() {
        try {
            document.querySelectorAll('img').forEach(img => {
                img.onerror = function() {
                    this.style.background = 'linear-gradient(135deg,#667eea,#764ba2)';
                    this.style.minHeight = '200px';
                    this.alt = '图片加载失败';
                };
            });
        } catch(err) { console.warn('[FP100]', err); }
    }
});

// 101. 自动保存
FeaturePack.register('fp101_auto_save', {
    name: '自动保存', desc: '表单自动保存',
    initFn() {
        try {
            document.querySelectorAll('input, textarea').forEach(el => {
                const key = 'auto_save_' + location.pathname + '_' + (el.name || el.id);
                const saved = localStorage.getItem(key);
                if(saved) el.value = saved;
                el.addEventListener('input', util.debounce(() => {
                    localStorage.setItem(key, el.value);
                }, 1000));
            });
        } catch(err) { console.warn('[FP101]', err); }
    }
});

// 102. 表单确认
FeaturePack.register('fp102_form_confirm', {
    name: '表单确认', desc: '离开页面确认保存',
    initFn() {
        try {
            let formChanged = false;
            document.querySelectorAll('input, textarea, select').forEach(el => {
                el.addEventListener('input', () => formChanged = true);
            });
            window.addEventListener('beforeunload', (e) => {
                if(formChanged) { e.preventDefault(); e.returnValue = '您有未保存的更改，确定要离开吗？'; }
            });
        } catch(err) { console.warn('[FP102]', err); }
    }
});

// 103. 输入验证
FeaturePack.register('fp103_input_validate', {
    name: '输入验证', desc: '实时表单验证',
    initFn() {
        try {
            document.querySelectorAll('input[required], textarea[required]').forEach(el => {
                el.addEventListener('blur', () => {
                    if(!el.value.trim()) { el.style.borderColor='#ef4444'; el.style.boxShadow='0 0 0 3px rgba(239,68,68,0.2)'; }
                    else { el.style.borderColor=''; el.style.boxShadow=''; }
                });
            });
        } catch(err) { console.warn('[FP103]', err); }
    }
});

// 104. 密码强度
FeaturePack.register('fp104_password_strength', {
    name: '密码强度', desc: '密码强度指示器',
    initFn() {
        try {
            document.querySelectorAll('input[type="password"]').forEach(input => {
                const indicator = el('div', {height:'4px', borderRadius:'2px', background:'#e5e7eb', marginTop:'4px', overflow:'hidden'});
                const bar = el('div', {height:'100%', width:'0%', transition:'all .3s ease', borderRadius:'2px'});
                indicator.appendChild(bar);
                input.parentNode.insertBefore(indicator, input.nextSibling);
                input.addEventListener('input', () => {
                    const v = input.value;
                    let score = 0;
                    if(v.length>=6) score += 25; if(v.length>=10) score += 15;
                    if(/[a-z]/.test(v) && /[A-Z]/.test(v)) score += 20;
                    if(/\d/.test(v)) score += 20; if(/[^\w]/.test(v)) score += 20;
                    bar.style.width = Math.min(100, score) + '%';
                    bar.style.background = score<40?'#ef4444':(score<70?'#f59e0b':'#22c55e';
                });
            });
        } catch(err) { console.warn('[FP104]', err); }
    }
});

// 105. 密码显示切换
FeaturePack.register('fp105_password_toggle', {
    name: '密码显示', desc: '密码显示/隐藏切换',
    initFn() {
        try {
            document.querySelectorAll('input[type="password"]').forEach(input => {
                const toggle = el('button', {position:'absolute', right:'8px', top:'50%', transform:'translateY(-50%)',
                background:'none', border:'none', cursor:'pointer', fontSize:'16px', padding:'4px 8px'});
                toggle.textContent = '👁';
                input.parentNode.style.position = 'relative';
                input.parentNode.appendChild(toggle);
                toggle.addEventListener('click', () => {
                    input.type = input.type==='password'?'text':'password';
                    toggle.textContent = input.type==='password'?'👁':'👁‍🗨';
                });
            });
        } catch(err) { console.warn('[FP105]', err); }
    }
});

// 106. 字数统计
FeaturePack.register('fp106_char_count', {
    name: '字数统计', desc: '输入框字数统计',
    initFn() {
        try {
            document.querySelectorAll('textarea, input[type="text"]').forEach(input => {
                const counter = el('div', {fontSize:'11px', color:'#9ca3af', textAlign:'right', marginTop:'4px'});
                input.parentNode.insertBefore(counter, input.nextSibling);
                input.addEventListener('input', () => {
                    counter.textContent = input.value.length + ' 字符';
                });
            });
        } catch(err) { console.warn('[FP106]', err); }
    }
});

// 107. 自动调整高度
FeaturePack.register('fp107_autosize', {
    name: '自动高度', desc: '文本框自动调整高度',
    initFn() {
        try {
            document.querySelectorAll('textarea').forEach(textarea => {
                textarea.addEventListener('input', function() {
                    this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 400) + 'px';
                });
            });
        } catch(err) { console.warn('[FP107]', err); }
    }
});

// 108. Tab键缩进
FeaturePack.register('fp108_tab_indent', {
    name: 'Tab缩进', desc: '文本框Tab键缩进',
    initFn() {
        try {
            document.querySelectorAll('textarea').forEach(textarea => {
                textarea.addEventListener('keydown', (e) => {
                    if(e.key==='Tab') {
                        e.preventDefault();
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        textarea.value = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
                        textarea.selectionStart = textarea.selectionEnd = start + 4;
                    }
                });
            });
        } catch(err) { console.warn('[FP108]', err); }
    }
});

// 109. 拖拽上传
FeaturePack.register('fp109_drag_drop', {
    name: '拖拽上传', desc: '拖拽文件上传',
    initFn() {
        try {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => document.addEventListener(e, e => e.preventDefault()));
            document.addEventListener('drop', (e) => {
                if(e.dataTransfer.files.length > 0) {
                    const files = Array.from(e.dataTransfer.files).map(f => f.name).join(', ');
                    alert('📁 拖入文件: ' + files);
                }
            });
        } catch(err) { console.warn('[FP109]', err); }
    }
});

// 110. 剪贴板图片
FeaturePack.register('fp110_clipboard_img', {
    name: '剪贴板图片', desc: '粘贴图片上传',
    initFn() {
        try {
            document.addEventListener('paste', (e) => {
                const items = e.clipboardData?.items;
                if(items) {
                    Array.from(items).forEach(item => {
                        if(item.type.indexOf('image') !== -1) {
                            alert('🖼 检测到剪贴板图片');
                        }
                    });
                }
            });
        } catch(err) { console.warn('[FP110]', err); }
    }
});

// 111. 复制提示
FeaturePack.register('fp111_copy_toast', {
    name: '复制提示', desc: '复制成功提示',
    initFn() {
        try {
            document.addEventListener('copy', () => {
                const toast = el('div', {
                    position:'fixed', bottom:'20px', left:'50%', transform:'translateX(-50%)',
                    background:'rgba(34,197,94)', color:'white', padding:'10px 24px',
                    borderRadius:'25px', fontSize:'14px', zIndex:'99999',
                    animation:'slideUp .3s ease'
                });
                toast.textContent = '✅ 已复制到剪贴板';
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 2000);
            });
        } catch(err) { console.warn('[FP111]', err); }
    }
});

// 112. 禁用右键
FeaturePack.register('fp112_disable_rightclick', {
    name: '禁用右键', desc: '禁用右键菜单',
    initFn() {
        try {
            document.addEventListener('contextmenu', (e) => {
                if(e.target.tagName === 'IMG') {
                    e.preventDefault();
                }
            });
        } catch(err) { console.warn('[FP112]', err); }
    }
});

// 113. 选中分享
FeaturePack.register('fp113_selection_share', {
    name: '选中分享', desc: '选中文字显示分享按钮',
    initFn() {
        try {
            document.addEventListener('mouseup', () => {
                setTimeout(() => {
                    const sel = window.getSelection();
                    const text = sel ? sel.toString().trim() : '';
                    if(text.length > 10) {
                        const range = sel.getRangeAt(0);
                        const rect = range.getBoundingClientRect();
                        const btn = el('button', {
                            position:'fixed', left:(rect.left + rect.width/2 - 40)+'px', top:(rect.top - 40)+'px',
                            padding:'6px 12px', background:'#1DA1F2', color:'white', border:'none',
                            borderRadius:'20px', cursor:'pointer', fontSize:'12px', zIndex:'9999'
                        });
                        btn.textContent = '🐦 分享';
                        document.body.appendChild(btn);
                        btn.addEventListener('click', () => {
                            window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text));
                            btn.remove();
                        });
                        setTimeout(() => btn.remove(), 5000);
                    }
                }, 10);
            });
        } catch(err) { console.warn('[FP113]', err); }
    }
});

// 114. 暗色模式
FeaturePack.register('fp114_dark_mode', {
    name: '暗色模式', desc: '切换深色主题',
    initFn() {
        try {
            const btn = el('button', {
                position:'fixed', right:'20px', bottom:'350px', width:'44px', height:'44px',
                borderRadius:'50%', border:'none', background:'linear-gradient(135deg,#1f2937,#374151)',
                color:'white', fontSize:'18px', cursor:'pointer', zIndex:'999',
                boxShadow:'0 4px 15px rgba(31,41,55,0.4)'
            });
            btn.textContent = '🌙';
            document.body.appendChild(btn);
            let isDark = localStorage.getItem('dark_mode') === 'true';
            if(isDark) document.body.classList.add('dark-mode');
            btn.addEventListener('click', () => {
                isDark = !isDark;
                document.body.classList.toggle('dark-mode');
                localStorage.setItem('dark_mode', String(isDark));
                btn.textContent = isDark ? '☀️' : '🌙';
            });
            const style = document.createElement('style');
            style.textContent = '.dark-mode{filter:invert(1) hue-rotate(180deg);}.dark-mode img{filter:invert(1) hue-rotate(180deg);}';
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP114]', err); }
    }
});

// 115. 护眼模式
FeaturePack.register('fp115_eye_care', {
    name: '护眼模式', desc: '暖色护眼',
    initFn() {
        try {
            const btn = el('button', {
                position:'fixed', right:'70px', bottom:'350px', width:'44px', height:'44px',
                borderRadius:'50%', border:'none', background:'linear-gradient(135deg,#fef3c7,#fcd34d)',
                color:'#92400e', fontSize:'18px', cursor:'pointer', zIndex:'999',
                boxShadow:'0 4px 15px rgba(251,191,36,0.4)'
            });
            btn.textContent = '👁️';
            document.body.appendChild(btn);
            let on = false;
            const overlay = el('div', {
                position:'fixed', top:'0', left:'0', width:'100%', height:'100%',
                background:'rgba(255,240,200,0.3)', pointerEvents:'none', zIndex:'9998', display:'none'
            });
            document.body.appendChild(overlay);
            btn.addEventListener('click', () => {
                on = !on;
                overlay.style.display = on ? 'block' : 'none';
                btn.textContent = on ? '☀️' : '👁️';
            });
        } catch(err) { console.warn('[FP115]', err); }
    }
});

// 116. 色盲模式
FeaturePack.register('fp116_color_blind', {
    name: '色盲模式', desc: '高对比度模式',
    initFn() {
        try {
            const btn = el('button', {
                position:'fixed', right:'120px', bottom:'350px', width:'44px', height:'44px',
                borderRadius:'50%', border:'none', background:'linear-gradient(135deg,#8b5cf6,#6366f1)',
                color:'white', fontSize:'16px', cursor:'pointer', zIndex:'999',
                boxShadow:'0 4px 15px rgba(139,92,246,0.4)'
            });
            btn.textContent = '🎨';
            document.body.appendChild(btn);
            let mode = 0;
            const modes = ['none', 'grayscale(100%)', 'contrast(1.5)', 'saturate(0.5)'];
            btn.addEventListener('click', () => {
                mode = (mode + 1) % modes.length;
                document.body.style.filter = modes[mode];
            });
        } catch(err) { console.warn('[FP116]', err); }
    }
});

// 117. 字体大小
FeaturePack.register('fp117_font_size', {
    name: '字体调整', desc: '整体字体大小',
    initFn() {
        try {
            const ctrl = el('div', {
                position:'fixed', right:'170px', bottom:'350px', background:'white',
                padding:'8px 12px', borderRadius:'20px', boxShadow:'0 4px 15px rgba(0,0,0,0.1)',
                display:'flex', gap:'8px', alignItems:'center', fontSize:'14px'
            });
            ctrl.innerHTML = '<button class="font-sm" style="width:28px;height:28px;border:none;border-radius:50%;background:#f3f4f6;cursor:pointer;font-weight:bold;">A-</button><button class="font-df" style="width:28px;height:28px;border:none;border-radius:50%;background:#f3f4f6;cursor:pointer;font-weight:bold;">A</button><button class="font-lg" style="width:28px;height:28px;border:none;border-radius:50%;background:#f3f4f6;cursor:pointer;font-weight:bold;">A+</button>';
            document.body.appendChild(ctrl);
            let size = 16;
            const setSize = (s) => { size = Math.max(12, Math.min(24, s)); document.documentElement.style.fontSize = size + 'px'; };
            ctrl.querySelector('.font-sm').onclick = () => setSize(size - 2);
            ctrl.querySelector('.font-df').onclick = () => setSize(16);
            ctrl.querySelector('.font-lg').onclick = () => setSize(size + 2);
        } catch(err) { console.warn('[FP117]', err); }
    }
});

// 118. 行高调整
FeaturePack.register('fp118_line_height', {
    name: '行高调整', desc: '阅读行高',
    initFn() {
        try {
            let lh = 1.6;
            document.addEventListener('keydown', (e) => {
                if(e.ctrlKey && e.key === '+') { lh += 0.1; document.body.style.lineHeight = lh.toFixed(1); }
                if(e.ctrlKey && e.key === '-') { lh = Math.max(1.2, lh - 0.1); document.body.style.lineHeight = lh.toFixed(1); }
            });
        } catch(err) { console.warn('[FP118]', err); }
    }
});

// 119. 屏幕亮度
FeaturePack.register('fp119_brightness', {
    name: '亮度调节', desc: '屏幕亮度调整',
    initFn() {
        try {
            let brightness = 100;
            document.addEventListener('keydown', (e) => {
                if(e.altKey && e.key === 'ArrowUp') { brightness = Math.min(150, brightness + 10); document.body.style.filter = `brightness(${brightness}%)`; }
                if(e.altKey && e.key === 'ArrowDown') { brightness = Math.max(50, brightness - 10); document.body.style.filter = `brightness(${brightness}%)`; }
            });
        } catch(err) { console.warn('[FP119]', err); }
    }
});

// 120. 蓝色过滤
FeaturePack.register('fp120_blue_light', {
    name: '蓝光过滤', desc: '减少蓝光',
    initFn() {
        try {
            const overlay = el('div', {
                position:'fixed', top:'0', left:'0', width:'100%', height:'100%',
                background:'rgba(255,150,0,0.1)', pointerEvents:'none', zIndex:'9999'
            });
            document.body.appendChild(overlay);
        } catch(err) { console.warn('[FP120]', err); }
    }
});

// 121. 阅读进度条
FeaturePack.register('fp121_read_progress', {
    name: '阅读进度', desc: '文章阅读进度',
    initFn() {
        try {
            const bar = el('div', {
                position:'fixed', top:'0', left:'0', height:'3px',
                background:'linear-gradient(90deg,#667eea,#764ba2)', zIndex:'99999',
                width:'0%', transition:'width .1s ease'
            });
            document.body.appendChild(bar);
            window.addEventListener('scroll', () => {
                const scrollTop = window.scrollY;
                const height = document.documentElement.scrollHeight - window.innerHeight;
                bar.style.width = Math.min(100, (scrollTop / height) * 100) + '%';
            });
        } catch(err) { console.warn('[FP121]', err); }
    }
});

// 122. 阅读时间
FeaturePack.register('fp122_read_time', {
    name: '阅读时间', desc: '显示预计阅读时间',
    initFn() {
        try {
            const text = document.body.innerText;
            const words = text.split(/\s+/).length;
            const minutes = Math.max(1, Math.ceil(words / 300));
            const indicator = el('div', {
                position:'sticky', top:'10px', marginLeft:'auto',
                    width: 'fit-content',
                background: 'rgba(102, 126, 234, 0.1)',
                padding: '6px 14px', borderRadius: '20px', fontSize: '12px',
                color: '#667eea', fontWeight: '500', zIndex: '99'
            });
            indicator.textContent = `⏱️ 约 ${minutes} 分钟阅读';
            const article = document.querySelector('article');
            if(article) article.parentNode.insertBefore(indicator, article);
            else document.body.appendChild(indicator);
        } catch(err) { console.warn('[FP122]', err); }
    }
});

// 123. 目录生成
FeaturePack.register('fp123_toc', {
    name: '文章目录', desc: '自动生成目录',
    initFn() {
        try {
            const headings = document.querySelectorAll('h1, h2, h3');
            if(headings.length < 3) return;
            const toc = el('div', {
                position: 'fixed', right: '20px', top: '100px',
                maxWidth: '200px', maxHeight: '400px', overflowY: 'auto',
                background: 'white', padding: '12px', borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '13px',
                zIndex: '99'
            });
            toc.innerHTML = '<div style="font-weight:600;margin-bottom:10px;color:#667eea;">📑 目录</div>';
            headings.forEach((h, i) => {
                const item = el('div', {
                    padding: '6px 8px', cursor: 'pointer', borderRadius: '6px',
                    transition: 'background .2s', overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                });
                item.textContent = h.textContent.slice(0, 30);
                item.addEventListener('click', () => h.scrollIntoView({behavior: 'smooth'}));
                item.addEventListener('mouseenter', () => item.style.background = '#f3f4f6');
                item.addEventListener('mouseleave', () => item.style.background = 'transparent');
                toc.appendChild(item);
            });
            document.body.appendChild(toc);
        } catch(err) { console.warn('[FP123]', err); }
    }
});

// 124. 章节编号
FeaturePack.register('fp124_heading_numbers', {
    name: '章节编号', desc: '标题自动编号',
    initFn() {
        try {
            document.querySelectorAll('h2').forEach((h, i) => {
                h.innerHTML = `<span style="color:#667eea;margin-right:8px;">${i + 1}.</span>' + h.innerHTML;
            });
        } catch(err) { console.warn('[FP124]', err); }
    }
});

// 125. 首字下沉
FeaturePack.register('fp125_drop_cap', {
    name: '首字下沉', desc: '段落首字放大',
    initFn() {
        try {
            document.querySelectorAll('article p:first-of-type, .article-content p:first-of-type').forEach(p => {
                const text = p.textContent;
                if(text.length > 10) {
                    p.innerHTML = `<span style="float:left;font-size:3em;line-height:1;font-weight:bold;margin-right:8px;color:#667eea;">${text.charAt(0)}</span>${text.slice(1)}`;
                }
            });
        } catch(err) { console.warn('[FP125]', err); }
    }
});

// 126. 段落间距
FeaturePack.register('fp126_paragraph_spacing', {
    name: '段落间距', desc: '优化段落间距',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = 'p{margin-bottom:1.5em;line-height:1.8;}';
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP126]', err); }
    }
});

// 127. 引用美化
FeaturePack.register('fp127_quote_style', {
    name: '引用样式', desc: '引用块样式',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = 'blockquote{border-left:4px solid #667eea;padding:1em 1.5em;margin:1.5em 0;background:linear-gradient(135deg,#f8f9ff,#fff);border-radius:0 12px 12px 0;font-style:italic;}';
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP127]', err); }
    }
});

// 128. 代码高亮
FeaturePack.register('fp128_code_highlight', {
    name: '代码高亮', desc: '代码块样式',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = 'pre, code{background:#1f2937;color:#e5e7eb;padding:12px 16px;border-radius:8px;font-family:monospace;overflow-x:auto;}code{padding:2px 6px;}';
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP128]', err); }
    }
});

// 129. 表格样式
FeaturePack.register('fp129_table_style', {
    name: '表格样式', desc: '表格样式优化',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = 'table{width:100%;border-collapse:collapse;margin:1.5em 0;}th,td{padding:12px 16px;text-align:left;border-bottom:1px solid #e5e7eb;}th{background:linear-gradient(135deg,#667eea,#764ba2);color:white;font-weight:600;}tr:hover{background:#f8f9ff;}';
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP129]', err); }
    }
});

// 130. 列表样式
FeaturePack.register('fp130_list_style', {
    name: '列表样式', desc: '列表图标优化',
    initFn() {
        try {
            const style = document.createElement('style');
            style.textContent = 'ul,ol{padding-left:24px;}li{margin:8px 0;}ul li::marker{content:"✨ ";color:#667eea;font-size:14px;}ol{counter-reset:item;list-style:none;}ol li{counter-increment:item;position:relative;padding-left:30px;}ol li::before{content:counter(item);position:absolute;left:0;top:2px;width:20px;height:20px;line-height:20px;text-align:center;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border-radius:50%;font-size:11px;font-weight:bold;}';
            document.head.appendChild(style);
        } catch(err) { console.warn('[FP130]', err); }
    }
});

console.log('📦 Feature Pack Massive #3 已加载 (81-130, 共50个功能)');