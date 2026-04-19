import FeaturePack from './feature-pack-core.js?v=20260418c';
const { util } = FeaturePack;
const el = util.el;

/**
 * 功能包 #44: 学习与教育 (216-220)
 */
FeaturePack.register('fp216_flashcard', {
    name: '闪卡学习', desc: '文章中的知识点可以制作成闪卡复习', page: 'article',
    initFn() {
        document.querySelectorAll("strong, b").forEach(el => { el.style.cursor = "pointer"; el.title = "点击制作闪卡"; el.onclick = () => { const cards = JSON.parse(localStorage.getItem("flashcards") || "[]"); cards.push({q:el.textContent, a:el.nextElementSibling?.textContent?.substring(0,100)||"点击查看详情"}); localStorage.setItem("flashcards", JSON.stringify(cards)); el.style.background = "#ffd93d"; setTimeout(()=>el.style.background="",500); }; });
    }
});

FeaturePack.register('fp217_pomodoro', {
    name: '番茄钟', desc: '页面角落显示番茄钟计时器帮助专注阅读',
    initFn() {
        const timer = el("div",{position:"fixed",bottom:"80px",right:"20px",padding:"10px 15px",background:"#ff6b6b",color:"#fff",borderRadius:"25px",fontSize:"14px",cursor:"pointer",zIndex:"9999",fontFamily:"monospace"}); let time = 25*60, running = false; function fmt(t){return Math.floor(t/60)+":"+(t%60).toString().padStart(2,"0")} timer.textContent = "🍅 " + fmt(time); timer.onclick = ()=>{ running=!running; timer.style.background = running?"#4ecdc4":"#ff6b6b"; }; setInterval(()=>{ if(running&&time>0){ time--; timer.textContent = "🍅 " + fmt(time); if(time===0){ timer.textContent = "🎉 完成!"; time=25*60; running=false; } } },1000); document.body.appendChild(timer);
    }
});

FeaturePack.register('fp218_vocab_highlight', {
    name: '词汇高亮', desc: '自动高亮文章中的学术词汇并显示释义', page: 'article',
    initFn() {
        const vocab = {"算法":"解决问题的步骤和方法","数据结构":"组织和存储数据的方式"}; document.querySelectorAll("p").forEach(p => { Object.keys(vocab).forEach(word => { p.innerHTML = p.innerHTML.replace(new RegExp(word, "g"), '<span style="background:#ffeaa7;cursor:pointer" title="'+vocab[word]+'">'+word+'</span>'); }); });
    }
});

FeaturePack.register('fp219_progress_bar', {
    name: '学习进度条', desc: '显示今日阅读文章数量和目标进度', page: 'index',
    initFn() {
        const bar = el("div",{position:"fixed",top:"60px",left:"20px",padding:"8px 15px",background:"rgba(102,126,234,0.9)",color:"#fff",borderRadius:"20px",fontSize:"12px",zIndex:"9999"}); const read = parseInt(localStorage.getItem("articles_read_today") || "0"); bar.textContent = "📚 今日阅读: " + read + "/5篇"; document.body.appendChild(bar);
    }
});

FeaturePack.register('fp220_note_take', {
    name: '侧边笔记', desc: '阅读文章时可以打开侧边栏做笔记', page: 'article',
    initFn() {
        const noteBtn = el("div",{position:"fixed",right:0,top:"50%",transform:"translateY(-50%)",padding:"10px 5px",background:"#667eea",color:"#fff",borderRadius:"8px 0 0 8px",cursor:"pointer",zIndex:"9999",writingMode:"vertical-rl",fontSize:"14px"}); noteBtn.textContent = "📝笔记"; document.body.appendChild(noteBtn); noteBtn.onclick = () => { let panel = document.getElementById("notePanel"); if(panel){ panel.remove(); return; } panel = el("div",{position:"fixed",right:0,top:0,width:"300px",height:"100%",background:"#fff",boxShadow:"-5px 0 20px rgba(0,0,0,0.1)",zIndex:"10000",padding:"20px",display:"flex",flexDirection:"column"}); panel.id = "notePanel"; panel.innerHTML = '<h3 style="margin-bottom:10px">📝 阅读笔记</h3><textarea style="flex:1;width:100%;padding:10px;border:1px solid #eee;border-radius:8px;resize:none" placeholder="写下你的想法..."></textarea><button style="margin-top:10px;padding:10px;background:#667eea;color:#fff;border:none;border-radius:8px;cursor:pointer">保存</button>'; document.body.appendChild(panel); const ta = panel.querySelector("textarea"); ta.value = localStorage.getItem("note_"+location.pathname) || ""; panel.querySelector("button").onclick = () => { localStorage.setItem("note_"+location.pathname, ta.value); panel.querySelector("button").textContent = "✓ 已保存"; setTimeout(()=>panel.querySelector("button").textContent="保存",1500); }; };
    }
});
