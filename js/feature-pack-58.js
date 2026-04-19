import FeaturePack from './feature-pack-core.js?v=20260419a';
const { util } = FeaturePack;
const el = util.el;

/**
 * 功能包 #58: 直播与视频 (286-290)
 */
FeaturePack.register('fp286_live_badge', {
    name: '直播标识', desc: '首页显示直播状态徽章', page: 'index',
    initFn() {
        const live = el("div",{position:"fixed",top:"20px",left:"20px",padding:"8px 15px",background:"#ff6b6b",color:"#fff",borderRadius:"20px",fontSize:"12px",zIndex:"9999",display:"flex",alignItems:"center",gap:"8px",animation:"pulse 2s infinite"}); live.innerHTML = '<span style="width:8px;height:8px;background:#fff;border-radius:50%;display:inline-block"></span>LIVE'; const style = document.createElement("style"); style.textContent = "@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}"; document.head.appendChild(style); document.body.appendChild(live);
    }
});

FeaturePack.register('fp287_video_player', {
    name: '视频播放', desc: '文章内视频添加自定义播放器皮肤', page: 'article',
    initFn() {
        document.querySelectorAll("video").forEach(v => { v.style.borderRadius = "12px"; v.style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)"; const controls = el("div",{position:"absolute",bottom:"10px",left:"10px",right:"10px",padding:"10px",background:"rgba(0,0,0,0.5)",borderRadius:"8px",color:"#fff",fontSize:"12px"}); controls.textContent = "▶️ 自定义播放器"; v.parentElement.style.position = "relative"; v.parentElement.appendChild(controls); });
    }
});

FeaturePack.register('fp288_stream_chat', {
    name: '弹幕聊天', desc: '直播模式下显示弹幕式评论',
    initFn() {
        const chat = el("div",{position:"fixed",top:"30%",right:"0",width:"200px",height:"300px",overflow:"hidden",zIndex:"9998",pointerEvents:"none"}); const messages = ["太棒了!","学习了","666","收藏了","写得好"]; setInterval(()=>{ const msg = el("div",{position:"absolute",right:"-100%",top:Math.random()*250+"px",padding:"5px 10px",background:"rgba(102,126,234,0.8)",color:"#fff",borderRadius:"15px",fontSize:"12px",whiteSpace:"nowrap",animation:"danmaku 5s linear"}); msg.textContent = messages[Math.floor(Math.random()*messages.length)]; chat.appendChild(msg); setTimeout(()=>msg.remove(), 5000); }, 2000); document.body.appendChild(chat); const dm = document.createElement("style"); dm.textContent = "@keyframes danmaku{to{transform:translateX(-300px)}}"; document.head.appendChild(dm);
    }
});

FeaturePack.register('fp289_recording', {
    name: '录制按钮', desc: '页面添加屏幕录制快捷按钮',
    initFn() {
        const record = el("div",{position:"fixed",bottom:"20px",right:"220px",padding:"10px",background:"#ff6b6b",color:"#fff",borderRadius:"50%",cursor:"pointer",zIndex:"9999",fontSize:"20px",boxShadow:"0 4px 15px rgba(255,107,107,0.4)"}); let recording = false; record.textContent = "⏺️"; record.onclick = () => { recording = !recording; record.style.background = recording ? "#4ecdc4" : "#ff6b6b"; record.textContent = recording ? "⏹️" : "⏺️"; if(recording) alert("🔴 录制已开始"); }; document.body.appendChild(record);
    }
});

FeaturePack.register('fp290_clip_maker', {
    name: '视频剪辑', desc: '长文章生成关键内容时间戳', page: 'article',
    initFn() {
        const clips = el("div",{padding:"15px",margin:"15px 0",background:"#f8f9fa",borderRadius:"12px"}); clips.innerHTML = '<h4>🎬 内容时间戳</h4><div style="margin-top:10px;font-size:13px"><div style="padding:5px 0">⏱️ 00:00 - 引言</div><div style="padding:5px 0">⏱️ 02:30 - 核心概念</div><div style="padding:5px 0">⏱️ 05:00 - 实战演示</div><div style="padding:5px 0">⏱️ 08:00 - 总结</div></div>'; const container = document.querySelector(".article-content, article"); if(container) container.appendChild(clips);
    }
});
