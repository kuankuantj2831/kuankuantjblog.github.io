import FeaturePack from './feature-pack-core.js?v=20260418c';
const { util } = FeaturePack;
const el = util.el;

/**
 * 功能包 #48: 音乐与节奏 (236-240)
 */
FeaturePack.register('fp236_visual_beat', {
    name: '视觉节拍', desc: '页面元素随背景音乐节拍轻微跳动', page: 'index',
    initFn() {
        const style = document.createElement("style"); style.textContent = "@keyframes beat{0%,100%{transform:scale(1)}50%{transform:scale(1.02)}}.beat{animation:beat 1s ease-in-out infinite}"; document.head.appendChild(style); document.querySelectorAll("h1, .hero-title").forEach(el => el.classList.add("beat"));
    }
});

FeaturePack.register('fp237_rhythm_game', {
    name: '节奏游戏', desc: '简单的键盘节奏小游戏', page: 'games',
    initFn() {
        const game = el("div",{textAlign:"center",padding:"40px"}); game.innerHTML = '<h2>🎵 节奏点击</h2><p>按空格键跟上节奏!</p><div id="score" style="font-size:48px;margin:20px">0</div><div id="target" style="font-size:60px;transition:transform 0.1s">🎯</div>'; document.body.appendChild(game); let score = 0; document.addEventListener("keydown", (e) => { if(e.code === "Space"){ score++; document.getElementById("score").textContent = score; const t = document.getElementById("target"); t.style.transform = "scale(1.3)"; setTimeout(()=>t.style.transform="scale(1)", 100); } });
    }
});

FeaturePack.register('fp238_music_visualizer', {
    name: '音频可视化', desc: '模拟音频波形动画效果',
    initFn() {
        const viz = el("div",{position:"fixed",bottom:0,left:0,right:0,height:"60px",display:"flex",alignItems:"flex-end",justifyContent:"center",gap:"3px",zIndex:"1",opacity:0.3,pointerEvents:"none"}); for(let i=0;i<30;i++){ const bar = el("div",{width:"6px",background:"linear-gradient(to top,#667eea,#764ba2)",borderRadius:"3px 3px 0 0",transition:"height 0.2s"}); bar.style.height = Math.random()*40 + "px"; viz.appendChild(bar); } document.body.appendChild(viz); setInterval(()=>{ viz.querySelectorAll("div").forEach(bar => { bar.style.height = Math.random()*50 + "px"; }); }, 200);
    }
});

FeaturePack.register('fp239_song_lyrics', {
    name: '歌词展示', desc: '模拟歌词逐行高亮效果',
    initFn() {
        const lyrics = el("div",{position:"fixed",bottom:"70px",left:"50%",transform:"translateX(-50%)",padding:"10px 20px",background:"rgba(0,0,0,0.7)",color:"#fff",borderRadius:"20px",fontSize:"14px",zIndex:"9999",display:"none"}); const lines = ["🎵 音乐播放中...","这是一段优美的旋律","让心灵在音符中徜徉"]; let idx = 0; lyrics.textContent = lines[0]; document.body.appendChild(lyrics); setInterval(()=>{ lyrics.style.display = "block"; idx = (idx+1)%lines.length; lyrics.textContent = lines[idx]; }, 3000);
    }
});

FeaturePack.register('fp240_equalizer', {
    name: '均衡器', desc: '底部显示模拟音频均衡器条',
    initFn() {
        const eq = el("div",{position:"fixed",bottom:"0",left:"50%",transform:"translateX(-50%)",display:"flex",gap:"2px",zIndex:"9999",padding:"5px",background:"rgba(0,0,0,0.5)",borderRadius:"8px 8px 0 0"}); for(let i=0;i<10;i++){ const b = el("div",{width:"8px",background:"#4ecdc4",borderRadius:"2px",transition:"height 0.15s"}); b.style.height = "10px"; eq.appendChild(b); } document.body.appendChild(eq); setInterval(()=>{ eq.querySelectorAll("div").forEach(b => { b.style.height = (Math.random()*40+5) + "px"; b.style.background = "hsl(" + (Math.random()*60+160) + ",70%,60%)"; }); }, 150);
    }
});
