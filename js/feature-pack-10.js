/**
 * 功能包 #10: 导航增强 (46-50)
 */
import FeaturePack from './feature-pack-core.js?v=20260419a';
const { util } = FeaturePack;
const el = util.el;

// 46. 面包屑导航
FeaturePack.register('fp46_breadcrumb', {
    name: '面包屑导航', desc: '显示当前页面位置',
    page: 'article',
    initFn() {
        const path = location.pathname.split('/').filter(Boolean);
        if (path.length < 2) return;
        const bc = el('nav', { fontSize:'12px',color:'#999',marginBottom:'15px',padding:'8px 0' });
        let html = '<a href="/" style="color:#667eea;text-decoration:none">首页</a>';
        path.forEach((p, i) => {
            const isLast = i === path.length - 1;
            html += ' <span style="color:#ccc">›</span> ';
            html += isLast ? `<span style="color:#666">${decodeURIComponent(p)}</span>` : `<a href="/${path.slice(0,i+1).join('/')}/" style="color:#667eea;text-decoration:none">${decodeURIComponent(p)}</a>`;
        });
        bc.innerHTML = html;
        const container = document.querySelector('.article-container, .post-container');
        if (container) container.insertBefore(bc, container.firstChild);
    }
});

// 47. 导航快捷键提示
FeaturePack.register('fp47_nav_hints', {
    name: '快捷键提示', desc: '首次访问显示快捷键',
    initFn() {
        if (util.storage.get('fp_hints_shown')) return;
        const modal = el('div', {
            position:'fixed',top:'0',left:'0',right:'0',bottom:'0',
            background:'rgba(0,0,0,0.6)',zIndex:'99999',display:'flex',
            alignItems:'center',justifyContent:'center'
        });
        modal.innerHTML = `
            <div style="background:white;border-radius:16px;padding:30px;max-width:360px;text-align:center;animation:popIn .4s">
                <div style="font-size:48px;margin-bottom:15px">⌨️</div>
                <h3 style="margin:0 0 10px">快捷键指南</h3>
                <div style="text-align:left;font-size:13px;color:#666;line-height:2">
                    <div><kbd style="background:#f0f0f0;padding:2px 8px;border-radius:4px;font-family:monospace">/</kbd> 聚焦搜索</div>
                    <div><kbd style="background:#f0f0f0;padding:2px 8px;border-radius:4px;font-family:monospace">G</kbd> 回到顶部</div>
                    <div><kbd style="background:#f0f0f0;padding:2px 8px;border-radius:4px;font-family:monospace">H</kbd> 返回首页</div>
                    <div><kbd style="background:#f0f0f0;padding:2px 8px;border-radius:4px;font-family:monospace">R</kbd> 刷新页面</div>
                    <div><kbd style="background:#f0f0f0;padding:2px 8px;border-radius:4px;font-family:monospace">ESC</kbd> 关闭弹窗</div>
                </div>
                <button id="fp_hints_ok" style="margin-top:20px;padding:10px 40px;border:none;border-radius:20px;background:#667eea;color:white;cursor:pointer;font-size:14px">知道了</button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('#fp_hints_ok').addEventListener('click', () => { modal.remove(); util.storage.set('fp_hints_shown', true); });
    }
});

// 48. 上一篇/下一篇
FeaturePack.register('fp48_prev_next', {
    name: '上下篇导航', desc: '文章底部上一篇下一篇',
    page: 'article',
    initFn() {
        const container = el('div', {
            display:'grid',gridTemplateColumns:'1fr 1fr',gap:'15px',
            marginTop:'30px',paddingTop:'20px',borderTop:'1px solid #eee'
        });
        container.innerHTML = `
            <a href="#" style="text-decoration:none;padding:15px;background:#f8f9ff;border-radius:10px;transition:all .2s" onmouseenter="this.style.transform='translateX(-5px)'" onmouseleave="this.style.transform=''">
                <div style="font-size:11px;color:#999;margin-bottom:4px">← 上一篇</div>
                <div style="font-size:14px;color:#333;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">暂无上一篇</div>
            </a>
            <a href="#" style="text-decoration:none;padding:15px;background:#f8f9ff;border-radius:10px;text-align:right;transition:all .2s" onmouseenter="this.style.transform='translateX(5px)'" onmouseleave="this.style.transform=''">
                <div style="font-size:11px;color:#999;margin-bottom:4px">下一篇 →</div>
                <div style="font-size:14px;color:#333;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">暂无下一篇</div>
            </a>
        `;
        const content = document.querySelector('.article-content, .post-content, article');
        if (content) content.insertAdjacentElement('afterend', container);
    }
});

// 49. 快速导航面板
FeaturePack.register('fp49_quick_nav', {
    name: '快速导航', desc: '右侧快速导航面板',
    initFn() {
        const panel = el('div', {
            position:'fixed',right:'20px',top:'50%',transform:'translateY(-50%)',
            background:'rgba(255,255,255,0.95)',borderRadius:'12px',
            padding:'8px',boxShadow:'0 4px 20px rgba(0,0,0,0.1)',zIndex:'997',
            display:'flex',flexDirection:'column',gap:'4px'
        });
        const items = [
            { icon:'🏠', title:'首页', action:()=>location.href='/' },
            { icon:'🔍', title:'搜索', action:()=>document.getElementById('searchInput')?.focus() },
            { icon:'⬆️', title:'顶部', action:()=>window.scrollTo({top:0,behavior:'smooth'}) },
            { icon:'⬇️', title:'底部', action:()=>window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'}) },
        ];
        items.forEach(item => {
            const btn = el('button', {
                width:'36px',height:'36px',borderRadius:'8px',border:'none',
                background:'transparent',fontSize:'16px',cursor:'pointer',
                display:'flex',alignItems:'center',justifyContent:'center',
                transition:'all .2s'
            });
            btn.innerHTML = item.icon;
            btn.title = item.title;
            btn.addEventListener('mouseenter', () => btn.style.background = '#f0f0f0');
            btn.addEventListener('mouseleave', () => btn.style.background = 'transparent');
            btn.addEventListener('click', item.action);
            panel.appendChild(btn);
        });
        document.body.appendChild(panel);
    }
});

// 50. 页面滚动锚点
FeaturePack.register('fp50_scroll_spy', {
    name: '滚动监听', desc: '高亮当前阅读区域',
    page: 'article',
    initFn() {
        const headings = document.querySelectorAll('.article-content h2, .article-content h3, .post-content h2, .post-content h3');
        if (headings.length === 0) return;
        const links = document.querySelectorAll('.toc-container a, .table-of-contents a');
        if (links.length === 0) return;
        window.addEventListener('scroll', util.throttle(() => {
            let current = '';
            headings.forEach(h => { if (h.getBoundingClientRect().top < 200) current = h.id; });
            links.forEach(l => {
                l.style.color = l.getAttribute('href') === '#' + current ? '#667eea' : '';
                l.style.fontWeight = l.getAttribute('href') === '#' + current ? '600' : '';
            });
        }, 100));
    }
});
