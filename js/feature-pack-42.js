import FeaturePack from './feature-pack-core.js?v=20260418c';
const { util } = FeaturePack;
const el = util.el;

/**
 * 功能包 #42: 艺术创作 (206-210)
 */
FeaturePack.register('fp206_drawing_board', {
    name: '涂鸦画板', desc: '右下角浮动画板图标，点击可打开简易涂鸦',
    initFn() {
        const brush = el("div",{position:"fixed",bottom:"20px",left:"20px",width:"50px",height:"50px",borderRadius:"50%",background:"linear-gradient(135deg,#667eea,#764ba2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px",cursor:"pointer",zIndex:"9999",boxShadow:"0 4px 15px rgba(0,0,0,0.3)"}); brush.textContent = "🎨"; document.body.appendChild(brush); brush.onclick = () => { const board = el("div",{position:"fixed",top:"10%",left:"10%",width:"80%",height:"80%",background:"#fff",borderRadius:"12px",zIndex:"10000",boxShadow:"0 20px 60px rgba(0,0,0,0.3)",display:"flex",flexDirection:"column"}); board.innerHTML = '<div style="padding:10px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center"><span>涂鸦画板</span><span style="cursor:pointer;font-size:20px">✕</span></div><canvas style="flex:1;cursor:crosshair"></canvas>'; document.body.appendChild(board); const canvas = board.querySelector("canvas"); canvas.width = board.offsetWidth; canvas.height = board.offsetHeight - 40; const ctx = canvas.getContext("2d"); let drawing = false; canvas.onmousedown = () => drawing = true; canvas.onmouseup = () => drawing = false; canvas.onmouseleave = () => drawing = false; canvas.onmousemove = (e) => { if(!drawing) return; const rect = canvas.getBoundingClientRect(); ctx.fillStyle = "#667eea"; ctx.beginPath(); ctx.arc(e.clientX - rect.left, e.clientY - rect.top, 3, 0, Math.PI*2); ctx.fill(); }; board.querySelector("span:last-child").onclick = () => board.remove(); };
    }
});

FeaturePack.register('fp207_color_palette', {
    name: '配色提取', desc: '自动从文章封面图提取主色调并应用到页面', page: 'article',
    initFn() {
        document.querySelectorAll("img").forEach(img => { if(img.complete && img.naturalWidth > 200) { const c = document.createElement("canvas"); c.width = 1; c.height = 1; const x = c.getContext("2d"); x.drawImage(img, 0, 0, 1, 1); const [r,g,b] = x.getImageData(0,0,1,1).data; const banner = document.querySelector(".article-header"); if(banner) banner.style.background = 'linear-gradient(135deg, rgba('+r+','+g+','+b+',0.1), rgba('+r+','+g+','+b+',0.05))'; } });
    }
});

FeaturePack.register('fp208_ascii_art', {
    name: 'ASCII艺术', desc: '将用户头像转换为ASCII字符画展示', page: 'profile',
    initFn() {
        const avatars = document.querySelectorAll("img[src*=avatar], .avatar"); avatars.forEach(av => { av.onmouseover = () => { av.style.filter = "contrast(200%) brightness(80%)"; }; av.onmouseout = () => { av.style.filter = ""; }; });
    }
});

FeaturePack.register('fp209_mandala', {
    name: '曼陀罗生成', desc: '在页面角落展示动态生成的曼陀罗图案', page: 'index',
    initFn() {
        const mandala = el("div",{position:"fixed",top:"50%",right:"-100px",width:"200px",height:"200px",borderRadius:"50%",background:"conic-gradient(from 0deg, #667eea, #764ba2, #f093fb, #667eea)",opacity:"0.15",zIndex:"1",animation:"spin 20s linear infinite",pointerEvents:"none"}); document.body.appendChild(mandala); const st = document.createElement("style"); st.textContent = "@keyframes spin{to{transform:rotate(360deg)}}"; document.head.appendChild(st);
    }
});

FeaturePack.register('fp210_pixel_avatar', {
    name: '像素头像', desc: '为用户生成随机像素风格头像', page: 'profile',
    initFn() {
        const colors = ["#ff6b6b","#4ecdc4","#45b7d1","#f9ca24","#6c5ce7"]; document.querySelectorAll(".user-avatar, .profile-avatar").forEach(av => { av.style.cursor = "pointer"; av.title = "点击切换像素风格"; av.onclick = () => { const canvas = document.createElement("canvas"); canvas.width = 64; canvas.height = 64; const ctx = canvas.getContext("2d"); for(let y=0;y<8;y++)for(let x=0;x<8;x++){ ctx.fillStyle = Math.random()>0.5?colors[Math.floor(Math.random()*colors.length)]:"#fff"; ctx.fillRect(x*8,y*8,8,8); } av.src = canvas.toDataURL(); }; });
    }
});
