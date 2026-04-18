/**
 * 功能包 #21: AI与智能 (101-105)
 */
import FeaturePack from './feature-pack-core.js';
const { util } = FeaturePack;
const el = util.el;

// 101. AI摘要生成
FeaturePack.register('fp101_ai_summary', {
    name: 'AI文章摘要', desc: '自动提取文章摘要',
    page: 'article',
    initFn() {
        const content = document.querySelector('.article-content, .post-content, article');
        if (!content) return;
        const paras = content.querySelectorAll('p');
        if (paras.length < 3) return;
        const summary = Array.from(paras).slice(0, 3).map(p => p.textContent.slice(0, 80)).join('... ');
        const box = el('div', {
            padding:'15px',background:'linear-gradient(135deg,#667eea08,#764ba208)',
            borderRadius:'10px',borderLeft:'4px solid #667eea',marginBottom:'20px',fontSize:'14px',color:'#555'
        });
        box.innerHTML = `<div style="font-weight:600;color:#667eea;margin-bottom:6px">🤖 AI 摘要</div><div>${summary}...</div>`;
        content.insertBefore(box, content.firstChild);
    }
});

// 102. 智能标签推荐
FeaturePack.register('fp102_smart_tags', {
    name: '智能标签', desc: '根据内容自动推荐标签',
    page: 'article',
    initFn() {
        const content = document.querySelector('.article-content, .post-content, article');
        if (!content) return;
        const text = content.textContent.toLowerCase();
        const dict = { javascript:'JavaScript', python:'Python', react:'React', vue:'Vue', docker:'Docker', git:'Git', css:'CSS', html:'HTML', node:'Node.js', api:'API' };
        const found = Object.entries(dict).filter(([k]) => text.includes(k)).map(([,v]) => v).slice(0, 5);
        if (found.length === 0) return;
        const div = el('div', { display:'flex',gap:'6px',flexWrap:'wrap',marginTop:'10px' });
        found.forEach(tag => {
            const t = el('span', { padding:'3px 10px',background:'rgba(102,126,234,0.1)',borderRadius:'12px',fontSize:'11px',color:'#667eea' });
            t.textContent = '#' + tag;
            div.appendChild(t);
        });
        const meta = document.querySelector('.article-meta, .post-meta');
        if (meta) meta.appendChild(div);
    }
});

// 103. 阅读难度评估
FeaturePack.register('fp103_reading_difficulty', {
    name: '阅读难度', desc: '评估文章阅读难度',
    page: 'article',
    initFn() {
        const content = document.querySelector('.article-content, .post-content, article');
        if (!content) return;
        const text = content.textContent;
        const sentences = text.split(/[。！？.!?]/).filter(Boolean);
        const words = text.length;
        const avgLen = words / Math.max(sentences.length, 1);
        let level, color;
        if (avgLen < 15) { level = '简单'; color = '#4ade80'; }
        else if (avgLen < 25) { level = '中等'; color = '#f5af19'; }
        else { level = '困难'; color = '#ff4757'; }
        const badge = el('span', {
            padding:'3px 10px',borderRadius:'12px',fontSize:'11px',fontWeight:'600',
            background:color+'15',color:color,marginLeft:'8px'
        });
        badge.textContent = '📊 难度:' + level;
        const meta = document.querySelector('.article-meta, .post-meta');
        if (meta) meta.appendChild(badge);
    }
});

// 104. 关键词云
FeaturePack.register('fp104_keyword_cloud', {
    name: '关键词云', desc: '文章关键词频率云',
    page: 'article',
    initFn() {
        const content = document.querySelector('.article-content, .post-content, article');
        if (!content) return;
        const text = content.textContent;
        const words = text.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
        const freq = {};
        words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
        const top = Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0, 15);
        if (top.length < 3) return;
        const div = el('div', { marginTop:'20px',padding:'15px',background:'#f8f9ff',borderRadius:'10px' });
        div.innerHTML = '<div style="font-size:13px;font-weight:600;margin-bottom:10px;color:#333">🔑 关键词</div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">' +
            top.map(([w,c]) => `<span style="font-size:${Math.max(11, 16 - c)}px;color:#667eea;opacity:${Math.min(1, c/3)}">${w}</span>`).join('') +
            '</div>';
        content.insertAdjacentElement('afterend', div);
    }
});

// 105. 智能推荐相似文章
FeaturePack.register('fp105_similar_articles', {
    name: '相似文章', desc: 'AI推荐相似内容',
    page: 'article',
    initFn() {
        const titles = ['深入理解闭包','Promise异步编程','JavaScript性能优化','ES6新特性详解'];
        const div = el('div', { marginTop:'25px',paddingTop:'20px',borderTop:'1px solid #eee' });
        div.innerHTML = '<h3 style="font-size:15px;margin-bottom:12px">🤖 您可能还想看</h3>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">' +
            titles.map(t => `<div style="padding:12px;background:#f8f9ff;border-radius:8px;font-size:13px;cursor:pointer;transition:all .2s" onmouseenter="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'" onmouseleave="this.style.transform='';this.style.boxShadow=''">${t}</div>`).join('') +
            '</div>';
        const content = document.querySelector('.article-content, .post-content, article');
        if (content) content.insertAdjacentElement('afterend', div);
    }
});
