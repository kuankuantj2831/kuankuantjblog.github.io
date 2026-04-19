/**
 * 功能包 #6: 文章增强 (26-30)
 */
import FeaturePack from './feature-pack-core.js?v=20260419a';
const { util } = FeaturePack;
const el = util.el;

// 26. 文章收藏按钮
FeaturePack.register('fp26_article_bookmark', {
    name: '文章收藏', desc: '快速收藏文章',
    page: 'article',
    initFn() {
        const btn = el('button', {
            padding:'6px 14px',border:'1px solid #e0e0e0',borderRadius:'6px',
            background:'white',fontSize:'12px',cursor:'pointer',marginLeft:'10px'
        });
        const saved = util.storage.get('bookmarked_articles', []).includes(location.pathname);
        btn.innerHTML = saved ? '⭐ 已收藏' : '☆ 收藏';
        btn.addEventListener('click', () => {
            let list = util.storage.get('bookmarked_articles', []);
            if (list.includes(location.pathname)) {
                list = list.filter(p => p !== location.pathname);
                btn.innerHTML = '☆ 收藏';
            } else {
                list.push(location.pathname);
                btn.innerHTML = '⭐ 已收藏';
            }
            util.storage.set('bookmarked_articles', list);
        });
        const meta = document.querySelector('.article-meta, .post-meta');
        if (meta) meta.appendChild(btn);
    }
});

// 27. 文章评分
FeaturePack.register('fp27_article_rating', {
    name: '文章评分', desc: '五星评分系统',
    page: 'article',
    initFn() {
        const div = el('div', { marginTop:'15px',display:'flex',alignItems:'center',gap:'8px' });
        div.innerHTML = '<span style="font-size:13px;color:#666">评分：</span>';
        let rated = util.storage.get('article_rating_' + location.pathname, 0);
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            const s = el('span', { cursor:'pointer',fontSize:'20px',transition:'transform .2s',userSelect:'none' });
            s.textContent = i <= rated ? '★' : '☆';
            s.style.color = i <= rated ? '#f5af19' : '#ddd';
            s.addEventListener('mouseenter', () => stars.forEach((st, idx) => { st.textContent = idx < i ? '★' : '☆'; st.style.color = idx < i ? '#f5af19' : '#ddd'; }));
            s.addEventListener('mouseleave', () => stars.forEach((st, idx) => { st.textContent = idx < rated ? '★' : '☆'; st.style.color = idx < rated ? '#f5af19' : '#ddd'; }));
            s.addEventListener('click', () => { rated = i; util.storage.set('article_rating_' + location.pathname, i); stars.forEach((st, idx) => { st.textContent = idx < i ? '★' : '☆'; st.style.color = idx < i ? '#f5af19' : '#ddd'; }); });
            stars.push(s);
            div.appendChild(s);
        }
        const content = document.querySelector('.article-content, .post-content, article');
        if (content) content.insertAdjacentElement('afterend', div);
    }
});

// 28. 目录折叠
FeaturePack.register('fp28_toc_collapse', {
    name: '目录折叠', desc: '文章目录可折叠展开',
    page: 'article',
    initFn() {
        document.querySelectorAll('.toc-container, .table-of-contents').forEach(toc => {
            const header = toc.querySelector('h2, .toc-title') || toc;
            header.style.cursor = 'pointer';
            header.innerHTML = '▶ ' + (header.textContent || '目录');
            const list = toc.querySelector('ul, ol') || toc;
            let expanded = true;
            header.addEventListener('click', () => {
                expanded = !expanded;
                list.style.display = expanded ? 'block' : 'none';
                header.innerHTML = (expanded ? '▼ ' : '▶ ') + (header.textContent.replace(/^[▼▶]\s*/, '') || '目录');
            });
        });
    }
});

// 29. 图片灯箱
FeaturePack.register('fp29_image_lightbox', {
    name: '图片灯箱', desc: '点击图片放大查看',
    page: 'article',
    initFn() {
        document.querySelectorAll('.article-content img, .post-content img, article img').forEach(img => {
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', () => {
                const overlay = el('div', {
                    position:'fixed',top:'0',left:'0',right:'0',bottom:'0',
                    background:'rgba(0,0,0,0.9)',zIndex:'99999',display:'flex',
                    alignItems:'center',justifyContent:'center',cursor:'zoom-out',
                    animation:'fadeIn .3s'
                });
                const big = el('img', { maxWidth:'90%',maxHeight:'90%',borderRadius:'8px',boxShadow:'0 20px 60px rgba(0,0,0,0.5)' });
                big.src = img.src;
                overlay.appendChild(big);
                overlay.addEventListener('click', () => overlay.remove());
                document.body.appendChild(overlay);
            });
        });
    }
});

// 30. 文章字数进度
FeaturePack.register('fp30_reading_progress', {
    name: '阅读进度百分比', desc: '显示已读百分比',
    page: 'article',
    initFn() {
        const badge = el('div', {
            position:'fixed',top:'60px',right:'20px',padding:'6px 14px',
            background:'rgba(102,126,234,0.9)',color:'white',borderRadius:'20px',
            fontSize:'12px',zIndex:'998',fontWeight:'600',boxShadow:'0 2px 10px rgba(102,126,234,0.3)'
        });
        badge.textContent = '0%';
        document.body.appendChild(badge);
        window.addEventListener('scroll', util.throttle(() => {
            const h = document.documentElement;
            const pct = Math.round((window.scrollY / (h.scrollHeight - h.clientHeight)) * 100);
            badge.textContent = pct + '%';
            if (pct >= 100) badge.textContent = '✓ 读完';
        }, 200));
    }
});
