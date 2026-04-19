import FeaturePack from './feature-pack-core.js?v=20260418c';
const { util } = FeaturePack;
const el = util.el;

/**
 * 功能包 #45: 社交互动增强 (221-225)
 */
FeaturePack.register('fp221_reaction_bar', {
    name: '表情反应', desc: '文章底部添加快速表情反应条', page: 'article',
    initFn() {
        const reactions = ["👍","❤️","😂","🤯","👏"]; const bar = el("div",{display:"flex",gap:"10px",justifyContent:"center",marginTop:"20px"}); reactions.forEach(r => { const btn = el("button",{fontSize:"24px",padding:"8px 16px",border:"1px solid #eee",borderRadius:"20px",background:"#fff",cursor:"pointer",transition:"all 0.2s"}); btn.textContent = r + " 0"; btn.onclick = () => { btn.style.transform = "scale(1.2)"; setTimeout(()=>btn.style.transform="",200); const count = parseInt(btn.textContent.split(" ")[1]) + 1; btn.textContent = r + " " + count; }; bar.appendChild(btn); }); const container = document.querySelector(".article-content, article"); if(container) container.appendChild(bar);
    }
});

FeaturePack.register('fp222_visitor_count', {
    name: '实时访客', desc: '显示当前在线阅读人数',
    initFn() {
        const badge = el("div",{position:"fixed",top:"80px",right:"20px",padding:"5px 12px",background:"rgba(78,205,196,0.9)",color:"#fff",borderRadius:"15px",fontSize:"12px",zIndex:"9999"}); const count = Math.floor(Math.random()*20)+5; badge.textContent = "👥 " + count + "人在线"; document.body.appendChild(badge); setInterval(()=>{ badge.textContent = "👥 " + (Math.floor(Math.random()*20)+5) + "人在线"; }, 10000);
    }
});

FeaturePack.register('fp223_reading_together', {
    name: '共读模式', desc: '显示同时阅读本文章的其他用户头像', page: 'article',
    initFn() {
        const readers = el("div",{position:"fixed",bottom:"20px",left:"50%",transform:"translateX(-50%)",display:"flex",gap:"-5px",zIndex:"9999"}); ["🧑","👩","👨","🧒"].forEach((a,i) => { const av = el("div",{width:"32px",height:"32px",borderRadius:"50%",background:"linear-gradient(135deg,#667eea,#764ba2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",marginLeft:i>0?"-8px":"0",border:"2px solid #fff"}); av.textContent = a; readers.appendChild(av); }); const txt = el("span",{marginLeft:"10px",fontSize:"12px",color:"#666",background:"#fff",padding:"4px 10px",borderRadius:"12px"}); txt.textContent = "+3 正在阅读"; readers.appendChild(txt); document.body.appendChild(readers);
    }
});

FeaturePack.register('fp224_mention_user', {
    name: '@用户高亮', desc: '评论中@用户名自动高亮并添加链接', page: 'article',
    initFn() {
        document.querySelectorAll(".comment-text, .comment-content").forEach(c => { c.innerHTML = c.innerHTML.replace(/@(\w+)/g, '<span style="color:#667eea;font-weight:bold;cursor:pointer" onclick="alert(\'用户主页: /profile/$1\')">@$1</span>'); });
    }
});

FeaturePack.register('fp225_follow_topic', {
    name: '关注话题', desc: '文章标签旁添加关注按钮', page: 'article',
    initFn() {
        document.querySelectorAll(".tag, .article-tag").forEach(tag => { const follow = el("span",{marginLeft:"5px",fontSize:"11px",color:"#667eea",cursor:"pointer"}); follow.textContent = "+关注"; follow.onclick = () => { follow.textContent = follow.textContent === "+关注" ? "✓已关注" : "+关注"; follow.style.color = follow.textContent === "✓已关注" ? "#4ecdc4" : "#667eea"; }; tag.appendChild(follow); });
    }
});
