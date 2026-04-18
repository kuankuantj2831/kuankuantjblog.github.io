/**
 * 功能包 #13: 个性化 (61-65)
 */
import FeaturePack from './feature-pack-core.js?v=20260418c';
const { util } = FeaturePack;
const el = util.el;

// 61. 字体大小调节
FeaturePack.register('fp61_font_size', {
    name: '字体调节', desc: '调节页面字体大小',
    initFn() {
        const panel = el('div', {
            position:'fixed',bottom:'240px',right:'20px',display:'flex',
            flexDirection:'column',gap:'4px',zIndex:'996'
        });
        ['A+','A-'].forEach((label, idx) => {
            const btn = el('button', {
                width:'36px',height:'36px',borderRadius:'8px',border:'1px solid #e0e0e0',
                background:'white',fontSize:idx===0?'14px':'12px',cursor:'pointer',
                fontWeight:'600',color:'#667eea'
            });
            btn.textContent = label;
            btn.addEventListener('click', () => {
                const current = parseFloat(getComputedStyle(document.documentElement).fontSize);
                document.documentElement.style.fontSize = (idx === 0 ? current + 1 : Math.max(12, current - 1)) + 'px';
            });
            panel.appendChild(btn);
        });
        document.body.appendChild(panel);
    }
});

// 62. 主题色切换
FeaturePack.register('fp62_theme_color', {
    name: '主题色切换', desc: '切换网站主题色',
    initFn() {
        const colors = [
            { name:'紫', primary:'#667eea', secondary:'#764ba2' },
            { name:'蓝', primary:'#2196f3', secondary:'#03a9f4' },
            { name:'绿', primary:'#4caf50', secondary:'#8bc34a' },
            { name:'红', primary:'#f44336', secondary:'#ff5722' },
            { name:'粉', primary:'#e91e63', secondary:'#f06292' },
        ];
        const panel = el('div', {
            position:'fixed',bottom:'320px',right:'20px',display:'flex',
            flexDirection:'column',gap:'6px',zIndex:'996',padding:'6px',
            background:'white',borderRadius:'10px',boxShadow:'0 2px 10px rgba(0,0,0,0.1)'
        });
        colors.forEach(c => {
            const btn = el('button', {
                width:'24px',height:'24px',borderRadius:'50%',border:'2px solid transparent',
                background:c.primary,cursor:'pointer'
            });
            btn.title = c.name + '色主题';
            btn.addEventListener('click', () => {
                document.documentElement.style.setProperty('--primary-color', c.primary);
                document.documentElement.style.setProperty('--secondary-color', c.secondary);
                util.storage.set('theme_color', c.primary);
            });
            panel.appendChild(btn);
        });
        document.body.appendChild(panel);
    }
});

// 63. 行高调节
FeaturePack.register('fp63_line_height', {
    name: '行高调节', desc: '调节文章行高',
    page: 'article',
    initFn() {
        const content = document.querySelector('.article-content, .post-content, article');
        if (!content) return;
        const slider = el('input', { width:'100px' }, { type:'range', min:'1', max:'3', step:'0.1', value:'1.8' });
        slider.style.cssText = 'width:100px;margin-left:8px';
        const label = el('span', { fontSize:'12px',color:'#999',display:'flex',alignItems:'center',marginTop:'10px' });
        label.innerHTML = '📏 行高: '; label.appendChild(slider);
        slider.addEventListener('input', (e) => { content.style.lineHeight = e.target.value; });
        content.insertAdjacentElement('afterend', label);
    }
});

// 64. 宽屏模式
FeaturePack.register('fp64_wide_mode', {
    name: '宽屏模式', desc: '切换宽屏/窄屏显示',
    page: 'article',
    initFn() {
        const container = document.querySelector('.article-container, .post-container');
        if (!container) return;
        const btn = el('button', {
            padding:'6px 14px',border:'1px solid #e0e0e0',borderRadius:'6px',
            background:'white',fontSize:'12px',cursor:'pointer',marginLeft:'10px'
        });
        let wide = false;
        btn.innerHTML = '📐 宽屏';
        btn.addEventListener('click', () => {
            wide = !wide;
            container.style.maxWidth = wide ? '100%' : '900px';
            container.style.padding = wide ? '40px 60px' : '40px';
            btn.innerHTML = wide ? '📐 窄屏' : '📐 宽屏';
        });
        const meta = document.querySelector('.article-meta, .post-meta');
        if (meta) meta.appendChild(btn);
    }
});

// 65. 专注模式
FeaturePack.register('fp65_focus_mode', {
    name: '专注模式', desc: '隐藏干扰元素专注阅读',
    page: 'article',
    initFn() {
        const btn = el('button', {
            padding:'6px 14px',border:'1px solid #e0e0e0',borderRadius:'6px',
            background:'white',fontSize:'12px',cursor:'pointer',marginLeft:'10px'
        });
        let focused = false;
        btn.innerHTML = '👁️ 专注';
        btn.addEventListener('click', () => {
            focused = !focused;
            document.querySelectorAll('nav, header, footer, aside, .sidebar, .comments, .related').forEach(el => {
                el.style.display = focused ? 'none' : '';
            });
            const content = document.querySelector('.article-container, .post-container');
            if (content) content.style.maxWidth = focused ? '700px' : '';
            btn.innerHTML = focused ? '👁️ 恢复' : '👁️ 专注';
            document.body.style.background = focused ? '#fafafa' : '';
        });
        const meta = document.querySelector('.article-meta, .post-meta');
        if (meta) meta.appendChild(btn);
    }
});
