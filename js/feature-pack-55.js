import FeaturePack from './feature-pack-core.js?v=20260418c';
const { util } = FeaturePack;
const el = util.el;

/**
 * 功能包 #55: 阅读与文学 (271-275)
 */
FeaturePack.register('fp271_quote_highlight', {
    name: '名言高亮', desc: '自动识别并精美展示文章中的名言警句', page: 'article',
    initFn() {
        document.querySelectorAll("blockquote").forEach(bq => { bq.style.borderLeft = "4px solid #667eea"; bq.style.paddingLeft = "20px"; bq.style.margin = "20px 0"; bq.style.fontStyle = "italic"; bq.style.color = "#555"; bq.style.background = "linear-gradient(90deg,rgba(102,126,234,0.1),transparent)"; bq.style.padding = "15px 15px 15px 20px"; bq.style.borderRadius = "0 8px 8px 0"; });
    }
});

FeaturePack.register('fp272_bookmark_ribbon', {
    name: '书签丝带', desc: '文章阅读位置添加丝带书签标记', page: 'article',
    initFn() {
        const ribbon = el("div",{position:"fixed",top:"80px",right:"0",width:"30px",height:"60px",background:"linear-gradient(180deg,#ff6b6b,#ee5a5a)",borderRadius:"0 0 0 8px",cursor:"pointer",zIndex:"9999",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px"}); ribbon.textContent = "🔖"; ribbon.onclick = () => { localStorage.setItem("bookmark_"+location.pathname, window.scrollY); ribbon.textContent = "✓"; setTimeout(()=>ribbon.textContent="🔖",1000); }; document.body.appendChild(ribbon); const saved = localStorage.getItem("bookmark_"+location.pathname); if(saved) window.scrollTo(0, parseInt(saved));
    }
});

FeaturePack.register('fp273_reading_stats', {
    name: '阅读统计', desc: '显示用户阅读过的书籍/文章类型分布', page: 'profile',
    initFn() {
        const stats = el("div",{marginTop:"20px",padding:"20px",background:"#f8f9fa",borderRadius:"12px"}); stats.innerHTML = '<h3>📊 阅读偏好</h3><div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap"><div style="padding:8px 15px;background:#667eea;color:#fff;border-radius:20px;font-size:12px">技术 45%</div><div style="padding:8px 15px;background:#4ecdc4;color:#fff;border-radius:20px;font-size:12px">生活 25%</div><div style="padding:8px 15px;background:#f9ca24;color:#fff;border-radius:20px;font-size:12px">旅行 15%</div><div style="padding:8px 15px;background:#ff6b6b;color:#fff;border-radius:20px;font-size:12px">其他 15%</div></div>'; const container = document.querySelector(".profile-container"); if(container) container.appendChild(stats);
    }
});

FeaturePack.register('fp274_chapter_nav', {
    name: '章节导航', desc: '长文章侧边显示章节快速导航', page: 'article',
    initFn() {
        const headings = document.querySelectorAll("h2, h3"); if(headings.length > 3) { const nav = el("div",{position:"fixed",left:"10px",top:"30%",padding:"10px",background:"#fff",borderRadius:"8px",boxShadow:"0 2px 10px rgba(0,0,0,0.1)",zIndex:"9999",maxWidth:"150px",fontSize:"11px"}); nav.innerHTML = '<div style="font-weight:bold;margin-bottom:5px">📑 目录</div>'; headings.forEach((h,i) => { if(i<6) { const link = el("div",{padding:"3px 0",color:"#667eea",cursor:"pointer",borderBottom:"1px dotted #eee"}); link.textContent = h.textContent.substring(0,15); link.onclick = () => h.scrollIntoView({behavior:"smooth"}); nav.appendChild(link); } }); document.body.appendChild(nav); }
    }
});

FeaturePack.register('fp275_reading_challenge', {
    name: '阅读挑战', desc: '发起月度阅读挑战并显示进度', page: 'index',
    initFn() {
        const challenge = el("div",{padding:"20px",margin:"20px",background:"linear-gradient(135deg,#fd79a8,#e84393)",color:"#fff",borderRadius:"12px"}); challenge.innerHTML = '<h3>📚 4月阅读挑战</h3><div style="margin-top:10px"><div style="font-size:36px;text-align:center">18/20</div><div style="text-align:center;font-size:12px;opacity:0.8">篇</div><div style="margin-top:10px;height:10px;background:rgba(255,255,255,0.3);border-radius:5px"><div style="width:90%;height:100%;background:#fff;border-radius:5px"></div></div><div style="text-align:center;margin-top:5px;font-size:12px">还差2篇完成挑战!</div></div>'; const container = document.querySelector(".chinese-style-wrapper"); if(container) container.insertBefore(challenge, container.children[2]);
    }
});
