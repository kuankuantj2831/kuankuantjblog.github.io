/**
 * 功能包 #2: 阅读体验 (6-10)
 */
import FeaturePack from './feature-pack-core.js';
const { util } = FeaturePack;
const el = util.el;

// 6. 打字机标题
FeaturePack.register('fp06_typewriter', {
    name: '打字机标题', desc: '首页标题逐字打出',
    page: 'index',
    initFn() {
        const title = document.getElementById('heroTitle');
        const sub = document.getElementById('heroSub');
        if (!title) return;
        const txt = title.textContent; title.textContent = '';
        let i = 0; const type = () => {
            if (i <= txt.length) { title.textContent = txt.slice(0, i++); setTimeout(type, 80); }
            else if (sub) { const st = sub.textContent; sub.textContent = ''; let j = 0; const ts = () => { if (j <= st.length) { sub.textContent = st.slice(0, j++); setTimeout(ts, 60); } }; ts(); }
        }; type();
    }
});

// 7. 阅读时间估算
FeaturePack.register('fp07_reading_time', {
    name: '阅读时间估算', desc: '文章页显示预计阅读时间',
    page: 'article',
    initFn() {
        const content = document.querySelector('.article-content, .post-content, article');
        const meta = document.querySelector('.article-meta, .post-meta');
        if (!content || !meta) return;
        const mins = Math.max(1, Math.ceil(content.textContent.length / 300));
        const badge = el('span', { display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'13px', color:'#999', marginLeft:'12px', padding:'2px 10px', background:'#f5f5f5', borderRadius:'12px' });
        badge.innerHTML = `⏱️ ${mins} 分钟`;
        meta.appendChild(badge);
    }
});

// 8. 表格排序
FeaturePack.register('fp08_table_sort', {
    name: '表格排序', desc: '文章中的表格支持点击列标题排序',
    page: 'article',
    initFn() {
        document.querySelectorAll('.article-content table, .post-content table').forEach(table => {
            const ths = table.querySelectorAll('thead th');
            ths.forEach((th, idx) => {
                th.style.cursor = 'pointer'; th.style.userSelect = 'none';
                const arrow = el('span', { marginLeft:'4px', fontSize:'11px', color:'#ccc' });
                arrow.textContent = '⇅'; th.appendChild(arrow);
                th.addEventListener('click', () => {
                    const tbody = table.querySelector('tbody');
                    const rows = Array.from(tbody.querySelectorAll('tr'));
                    const cur = th.dataset.sort;
                    const asc = cur !== 'asc';
                    rows.sort((a, b) => {
                        const av = a.cells[idx]?.textContent.trim() || '';
                        const bv = b.cells[idx]?.textContent.trim() || '';
                        if (!isNaN(av) && !isNaN(bv)) return asc ? parseFloat(av) - parseFloat(bv) : parseFloat(bv) - parseFloat(av);
                        return asc ? av.localeCompare(bv, 'zh') : bv.localeCompare(av, 'zh');
                    });
                    rows.forEach(r => tbody.appendChild(r));
                    ths.forEach(h => { h.dataset.sort = ''; h.querySelector('span').textContent = '⇅'; h.querySelector('span').style.color = '#ccc'; });
                    th.dataset.sort = asc ? 'asc' : 'desc';
                    arrow.textContent = asc ? '↑' : '↓'; arrow.style.color = '#667eea';
                });
            });
        });
    }
});

// 9. 返回顶部
FeaturePack.register('fp09_back_to_top', {
    name: '返回顶部', desc: '滚动超过阈值显示返回顶部按钮',
    initFn() {
        const btn = el('button', {
            position:'fixed',bottom:'150px',right:'20px',width:'44px',height:'44px',
            borderRadius:'50%',border:'none',background:'linear-gradient(135deg,#667eea,#764ba2)',
            color:'white',fontSize:'20px',cursor:'pointer',zIndex:'999',
            boxShadow:'0 4px 15px rgba(102,126,234,0.3)',opacity:'0',transform:'translateY(20px)',
            transition:'all .3s',display:'flex',alignItems:'center',justifyContent:'center'
        });
        btn.innerHTML = '↑';
        btn.onclick = () => window.scrollTo({top:0,behavior:'smooth'});
        document.body.appendChild(btn);
        window.addEventListener('scroll', util.throttle(() => {
            const show = window.pageYOffset > 300;
            btn.style.opacity = show ? '1' : '0';
            btn.style.transform = show ? 'translateY(0)' : 'translateY(20px)';
        }, 100));
    }
});

// 10. 滚动进度条
FeaturePack.register('fp10_scroll_progress', {
    name: '滚动进度条', desc: '页面右侧显示阅读进度',
    initFn() {
        const bar = el('div', {
            position:'fixed',top:'0',right:'0',width:'4px',height:'0%',
            background:'linear-gradient(180deg,#667eea,#764ba2)',zIndex:'9999',
            transition:'height .1s',borderRadius:'2px'
        });
        document.body.appendChild(bar);
        window.addEventListener('scroll', () => {
            const h = document.documentElement;
            const pct = (window.scrollY / (h.scrollHeight - h.clientHeight)) * 100;
            bar.style.height = Math.min(pct, 100) + '%';
        });
    }
});
