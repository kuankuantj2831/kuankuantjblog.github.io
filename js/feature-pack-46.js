import FeaturePack from './feature-pack-core.js?v=20260418c';
const { util } = FeaturePack;
const el = util.el;

/**
 * 功能包 #46: 内容创作 (226-230)
 */
FeaturePack.register('fp226_templates', {
    name: '文章模板', desc: '编辑器中添加常用文章模板选择', page: 'editor',
    initFn() {
        const sel = document.querySelector("textarea, .editor"); if(sel){ const tpl = el("div",{position:"absolute",top:"10px",right:"10px",padding:"8px",background:"#667eea",color:"#fff",borderRadius:"8px",cursor:"pointer",zIndex:"100"}); tpl.textContent = "📄 模板"; sel.parentElement.style.position = "relative"; sel.parentElement.appendChild(tpl); tpl.onclick = () => { const templates = {"教程":"# 教程标题

## 步骤一

详细说明...

## 步骤二

详细说明...","笔记":"# 笔记

## 要点
- 要点1
- 要点2"}; const choice = prompt("选择模板: 教程/笔记"); if(templates[choice]) sel.value = templates[choice]; }; }
    }
});

FeaturePack.register('fp227_word_count', {
    name: '实时字数', desc: '编辑器实时显示字数统计和目标进度', page: 'editor',
    initFn() {
        const editor = document.querySelector("textarea"); if(editor){ const wc = el("div",{position:"fixed",bottom:"20px",left:"50%",transform:"translateX(-50%)",padding:"8px 20px",background:"rgba(0,0,0,0.7)",color:"#fff",borderRadius:"20px",fontSize:"14px",zIndex:"9999"}); wc.textContent = "0 字"; document.body.appendChild(wc); editor.addEventListener("input", () => { const count = editor.value.length; wc.textContent = count + " 字 " + (count>=500?"✓":"(目标500)") ; wc.style.background = count>=500?"rgba(78,205,196,0.9)":"rgba(0,0,0,0.7)"; }); }
    }
});

FeaturePack.register('fp228_readability', {
    name: '可读性分析', desc: '分析文章可读性并给出评分', page: 'editor',
    initFn() {
        const editor = document.querySelector("textarea"); if(editor){ const score = el("div",{position:"fixed",top:"80px",right:"20px",padding:"10px",background:"#fff",borderRadius:"8px",boxShadow:"0 2px 10px rgba(0,0,0,0.1)",fontSize:"12px",zIndex:"9999",display:"none"}); score.textContent = "可读性: 优秀"; document.body.appendChild(score); editor.addEventListener("input", () => { const text = editor.value; const sentences = text.split(/[。！？.!?]/).filter(s=>s.trim()); const words = text.length; if(words>20){ score.style.display = "block"; const avgLen = words / (sentences.length||1); score.textContent = avgLen<30?"✓ 可读性: 优秀":avgLen<50?"⚠ 可读性: 良好":"❌ 可读性: 需简化"; score.style.color = avgLen<30?"#4ecdc4":avgLen<50?"#f9ca24":"#ff6b6b"; } }); }
    }
});

FeaturePack.register('fp229_auto_save', {
    name: '自动保存', desc: '编辑器内容每30秒自动保存到本地', page: 'editor',
    initFn() {
        const editor = document.querySelector("textarea"); if(editor){ const indicator = el("div",{position:"fixed",top:"20px",right:"20px",padding:"5px 10px",background:"#4ecdc4",color:"#fff",borderRadius:"4px",fontSize:"12px",zIndex:"9999",opacity:0,transition:"opacity 0.3s"}); indicator.textContent = "✓ 已自动保存"; document.body.appendChild(indicator); setInterval(()=>{ if(editor.value){ localStorage.setItem("draft_"+location.pathname, editor.value); indicator.style.opacity = 1; setTimeout(()=>indicator.style.opacity=0, 2000); } }, 30000); const saved = localStorage.getItem("draft_"+location.pathname); if(saved && !editor.value){ editor.value = saved; } }
    }
});

FeaturePack.register('fp230_markdown_preview', {
    name: 'MD预览', desc: '编辑器旁实时预览Markdown渲染效果', page: 'editor',
    initFn() {
        const editor = document.querySelector("textarea"); if(editor && editor.parentElement){ const preview = el("div",{position:"absolute",top:0,right:"-50%",width:"48%",height:"100%",background:"#fff",border:"1px solid #eee",borderRadius:"8px",padding:"15px",overflow:"auto",fontSize:"14px",lineHeight:"1.6"}); editor.parentElement.style.position = "relative"; editor.parentElement.appendChild(preview); editor.addEventListener("input", () => { let html = editor.value.replace(/# (.*)/g, "<h1>$1</h1>").replace(/## (.*)/g, "<h2>$1</h2>").replace(/**(.*?)**/g, "<strong>$1</strong>").replace(/*(.*?)*/g, "<em>$1</em>").replace(/- (.*)/g, "<li>$1</li>").replace(/
/g, "<br>"); preview.innerHTML = html; }); }
    }
});
