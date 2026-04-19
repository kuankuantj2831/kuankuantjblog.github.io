/**
 * 功能包 #5: 搜索增强 (21-25)
 */
import FeaturePack from './feature-pack-core.js?v=20260419a';
const { util } = FeaturePack;
const el = util.el;

// 21. 搜索结果高亮
FeaturePack.register('fp21_search_highlight', {
    name: '搜索高亮', desc: '搜索结果高亮关键词',
    page: 'index',
    initFn() {
        const url = new URL(location.href);
        const q = url.searchParams.get('q') || url.searchParams.get('query');
        if (!q) return;
        const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        document.querySelectorAll('.resource-title, .article-title, p').forEach(el => {
            el.innerHTML = el.innerHTML.replace(re, '<mark style="background:#ffeb3b;padding:0 2px;border-radius:2px">$1</mark>');
        });
    }
});

// 22. 搜索历史
FeaturePack.register('fp22_search_history', {
    name: '搜索历史', desc: '保存最近搜索记录',
    page: 'index',
    initFn() {
        const input = document.getElementById('searchInput');
        if (!input) return;
        const history = util.storage.get('search_history', []);
        const dropdown = el('div', {
            position:'absolute',top:'100%',left:'0',right:'0',display:'none',
            background:'white',borderRadius:'8px',boxShadow:'0 4px 20px rgba(0,0,0,0.15)',
            zIndex:'100',padding:'8px 0',maxHeight:'200px',overflow:'auto'
        });
        input.parentElement.style.position = 'relative';
        input.parentElement.appendChild(dropdown);

        const render = () => {
            if (history.length === 0) return;
            dropdown.innerHTML = history.slice(0, 8).map((h, i) =>
                `<div class="fp-sh-item" data-idx="${i}" style="padding:8px 16px;cursor:pointer;font-size:13px;display:flex;justify-content:space-between;align-items:center">
                    <span>🕐 ${h}</span><span class="fp-sh-del" data-idx="${i}" style="color:#ccc;font-size:11px">删除</span>
                </div>`
            ).join('') + `<div class="fp-sh-clear" style="padding:8px 16px;text-align:center;color:#999;font-size:12px;cursor:pointer;border-top:1px solid #f0f0f0">清空历史</div>`;
            dropdown.style.display = 'block';
        };

        input.addEventListener('focus', render);
        dropdown.addEventListener('click', (e) => {
            const item = e.target.closest('.fp-sh-item');
            if (item) { input.value = history[parseInt(item.dataset.idx)]; input.form?.submit(); }
            if (e.target.classList.contains('fp-sh-del')) { history.splice(parseInt(e.target.dataset.idx), 1); util.storage.set('search_history', history); render(); }
            if (e.target.classList.contains('fp-sh-clear')) { util.storage.set('search_history', []); dropdown.style.display = 'none'; }
        });
        document.addEventListener('click', (e) => { if (!input.contains(e.target) && !dropdown.contains(e.target)) dropdown.style.display = 'none'; });
        input.form?.addEventListener('submit', () => {
            const v = input.value.trim();
            if (v && !history.includes(v)) { history.unshift(v); if (history.length > 20) history.pop(); util.storage.set('search_history', history); }
        });
    }
});

// 23. 搜索建议
FeaturePack.register('fp23_search_suggest', {
    name: '搜索建议', desc: '输入时显示搜索建议',
    page: 'index',
    initFn() {
        const input = document.getElementById('searchInput');
        if (!input) return;
        const suggests = ['JavaScript','React','Vue','Node.js','CSS','Python','Docker','Git','Linux','TypeScript','WebSocket','GraphQL','Kubernetes'];
        const box = el('div', { position:'absolute',top:'100%',left:'0',right:'0',display:'none',background:'white',borderRadius:'8px',boxShadow:'0 4px 20px rgba(0,0,0,0.15)',zIndex:'100',padding:'8px 0' });
        input.parentElement.appendChild(box);

        input.addEventListener('input', util.debounce(() => {
            const v = input.value.trim().toLowerCase();
            if (v.length < 1) { box.style.display = 'none'; return; }
            const matched = suggests.filter(s => s.toLowerCase().includes(v));
            if (matched.length === 0) { box.style.display = 'none'; return; }
            box.innerHTML = matched.slice(0, 6).map(s => `<div class="fp-sg-item" style="padding:8px 16px;cursor:pointer;font-size:13px">🔍 ${s}</div>`).join('');
            box.style.display = 'block';
            box.querySelectorAll('.fp-sg-item').forEach(item => item.addEventListener('click', () => { input.value = item.textContent.replace('🔍 ', ''); input.form?.submit(); }));
        }, 200));
        document.addEventListener('click', (e) => { if (!input.contains(e.target) && !box.contains(e.target)) box.style.display = 'none'; });
    }
});

// 24. 搜索快捷键
FeaturePack.register('fp24_search_hotkey', {
    name: '搜索快捷键', desc: 'Ctrl+K 快速聚焦搜索',
    initFn() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('searchInput')?.focus();
            }
        });
    }
});

// 25. 标签云
FeaturePack.register('fp25_tag_cloud', {
    name: '标签云', desc: '显示热门标签云',
    page: 'index',
    initFn() {
        const tags = ['编程技术','游戏资源','设计素材','学习资料','生活随笔','前端开发','后端开发','DevOps','AI','开源项目'];
        const container = el('div', { marginTop:'15px',display:'flex',flexWrap:'wrap',gap:'8px',justifyContent:'center' });
        tags.forEach(tag => {
            const size = 12 + util.rand(0, 6);
            const opacity = 0.6 + Math.random() * 0.4;
            const t = el('a', {
                fontSize:size+'px',opacity:opacity,padding:'4px 12px',
                background:'rgba(102,126,234,0.1)',borderRadius:'15px',
                color:'#667eea',textDecoration:'none',transition:'all .2s',
                border:'1px solid rgba(102,126,234,0.2)'
            });
            t.textContent = tag;
            t.href = '/search.html?q=' + encodeURIComponent(tag);
            t.addEventListener('mouseenter', () => { t.style.background = '#667eea'; t.style.color = 'white'; t.style.transform = 'scale(1.1)'; });
            t.addEventListener('mouseleave', () => { t.style.background = 'rgba(102,126,234,0.1)'; t.style.color = '#667eea'; t.style.transform = ''; });
            container.appendChild(t);
        });
        const searchSection = document.querySelector('.search-section');
        if (searchSection) searchSection.insertAdjacentElement('afterend', container);
    }
});
