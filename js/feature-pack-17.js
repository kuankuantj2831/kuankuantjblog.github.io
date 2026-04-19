/**
 * 功能包 #17: 内容发现 (81-85)
 */
import FeaturePack from './feature-pack-core.js?v=20260419a';
const { util } = FeaturePack;
const el = util.el;

// 81. 相关文章推荐
FeaturePack.register('fp81_related_articles', {
    name: '相关文章', desc: '文章底部推荐相关内容',
    page: 'article',
    initFn() {
        const titles = ['深入理解React Hooks','CSS Grid布局指南','Node.js性能优化','TypeScript入门教程'];
        const div = el('div', { marginTop:'30px',paddingTop:'20px',borderTop:'1px solid #eee' });
        div.innerHTML = `<h3 style="font-size:16px;margin-bottom:15px">📚 相关推荐</h3><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">` +
            titles.map(t => `<a href="#" style="padding:12px;background:#f8f9ff;border-radius:8px;text-decoration:none;color:#333;font-size:13px;transition:all .2s" onmouseenter="this.style.transform='translateX(4px)'" onmouseleave="this.style.transform=''">${t}</a>`).join('') + '</div>';
        const content = document.querySelector('.article-content, .post-content, article');
        if (content) content.insertAdjacentElement('afterend', div);
    }
});

// 82. 猜你喜欢
FeaturePack.register('fp82_guess_you_like', {
    name: '猜你喜欢', desc: '首页个性化推荐',
    page: 'index',
    initFn() {
        const tags = util.storage.get('user_tags', ['编程技术','学习资料']);
        const div = el('div', {
            padding:'20px',background:'linear-gradient(135deg,#667eea08,#764ba208)',
            borderRadius:'12px',margin:'15px auto',maxWidth:'1200px'
        });
        div.innerHTML = `<div style="font-size:14px;font-weight:600;color:#333;margin-bottom:10px">🎯 猜你喜欢 · ${tags.join('、')}</div><div style="font-size:12px;color:#999">根据您的浏览偏好推荐</div>`;
        const showcase = document.querySelector('.resource-showcase');
        if (showcase) showcase.insertAdjacentElement('beforebegin', div);
    }
});

// 83. 热门排行榜
FeaturePack.register('fp83_hot_ranking', {
    name: '热门排行', desc: '首页显示热门文章排行',
    page: 'index',
    initFn() {
        const items = [
            { title:'我的个人介绍', views:1280 },
            { title:'Hello World', views:856 },
            { title:'网站开发历程', views:723 },
        ];
        const div = el('div', {
            padding:'20px',background:'white',borderRadius:'12px',
            boxShadow:'0 2px 10px rgba(0,0,0,0.05)',margin:'15px auto',maxWidth:'1200px'
        });
        div.innerHTML = '<h3 style="font-size:16px;margin-bottom:12px">🔥 热门排行</h3>' +
            items.map((item, i) => `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f5f5f5">` +
                `<span style="width:24px;height:24px;border-radius:50%;background:${i<3?'linear-gradient(135deg,#f5af19,#f12711)':'#f5f5f5'};color:${i<3?'white':'#999'};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600">${i+1}</span>` +
                `<span style="flex:1;font-size:13px">${item.title}</span>` +
                `<span style="font-size:12px;color:#999">${item.views} 阅读</span></div>`).join('');
        const showcase = document.querySelector('.resource-showcase');
        if (showcase) showcase.insertAdjacentElement('beforebegin', div);
    }
});

// 84. 最近更新
FeaturePack.register('fp84_recent_updates', {
    name: '最近更新', desc: '显示最近更新的文章',
    page: 'index',
    initFn() {
        const div = el('div', {
            position:'fixed',top:'100px',left:'20px',width:'180px',
            background:'white',borderRadius:'12px',padding:'15px',
            boxShadow:'0 4px 20px rgba(0,0,0,0.08)',zIndex:'100',fontSize:'12px'
        });
        div.innerHTML = `<div style="font-weight:600;margin-bottom:10px;color:#333">🕐 最近更新</div>` +
            `<div style="display:flex;flex-direction:column;gap:8px;color:#666">` +
            `<div>· 2分钟前更新</div><div>· 1小时前更新</div><div>· 3小时前更新</div></div>`;
        document.body.appendChild(div);
    }
});

// 85. 标签推荐
FeaturePack.register('fp85_tag_recommend', {
    name: '标签推荐', desc: '根据内容推荐标签',
    page: 'article',
    initFn() {
        const tags = ['JavaScript','前端','教程','入门'];
        const div = el('div', { display:'flex',gap:'8px',flexWrap:'wrap',marginTop:'15px' });
        tags.forEach(tag => {
            const t = el('a', {
                padding:'4px 12px',background:'rgba(102,126,234,0.1)',borderRadius:'15px',
                fontSize:'12px',color:'#667eea',textDecoration:'none'
            });
            t.textContent = '#' + tag;
            t.href = '/search.html?q=' + encodeURIComponent(tag);
            div.appendChild(t);
        });
        const content = document.querySelector('.article-content, .post-content, article');
        if (content) content.insertAdjacentElement('afterend', div);
    }
});
