/**
 * 功能包 #22: 音频与视频 (106-110)
 */
import FeaturePack from './feature-pack-core.js';
const { util } = FeaturePack;
const el = util.el;

// 106. 背景音乐播放器
FeaturePack.register('fp106_bg_music', {
    name: '背景音乐', desc: '页面背景音乐控制',
    initFn() {
        const btn = el('button', {
            position:'fixed',bottom:'380px',right:'20px',width:'40px',height:'40px',
            borderRadius:'50%',border:'none',background:'#764ba2',color:'white',
            fontSize:'16px',cursor:'pointer',zIndex:'995',display:'flex',
            alignItems:'center',justifyContent:'center'
        });
        btn.innerHTML = '🎵';
        btn.title = '背景音乐';
        let playing = false;
        const audio = new Audio();
        audio.loop = true;
        audio.volume = 0.3;
        btn.addEventListener('click', () => {
            playing = !playing;
            btn.innerHTML = playing ? '🔇' : '🎵';
            if (playing) { audio.src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'; audio.play().catch(()=>{}); }
            else { audio.pause(); }
        });
        document.body.appendChild(btn);
    }
});

// 107. 视频弹窗播放
FeaturePack.register('fp107_video_popup', {
    name: '视频弹窗', desc: '点击视频链接弹窗播放',
    initFn() {
        document.querySelectorAll('a[href*="youtube"], a[href*="bilibili"]').forEach(a => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                const modal = el('div', {
                    position:'fixed',top:'0',left:'0',right:'0',bottom:'0',
                    background:'rgba(0,0,0,0.8)',zIndex:'99999',display:'flex',
                    alignItems:'center',justifyContent:'center'
                });
                modal.innerHTML = `
                    <div style="position:relative;width:80%;max-width:800px">
                        <div id="fp_vid_close" style="position:absolute;top:-30px;right:0;color:white;font-size:24px;cursor:pointer">✕</div>
                        <div style="background:#000;padding:20px;border-radius:8px;text-align:center;color:#666">🎬 视频播放器（演示）</div>
                    </div>
                `;
                document.body.appendChild(modal);
                modal.querySelector('#fp_vid_close').addEventListener('click', () => modal.remove());
                modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
            });
        });
    }
});

// 108. 语音搜索
FeaturePack.register('fp108_voice_search', {
    name: '语音搜索', desc: '支持语音输入搜索',
    page: 'index',
    initFn() {
        const input = document.getElementById('searchInput');
        if (!input || !('webkitSpeechRecognition' in window)) return;
        const btn = el('button', {
            position:'absolute',right:'45px',top:'50%',transform:'translateY(-50%)',
            background:'none',border:'none',fontSize:'18px',cursor:'pointer'
        });
        btn.innerHTML = '🎤';
        btn.title = '语音搜索';
        input.parentElement.style.position = 'relative';
        input.parentElement.appendChild(btn);
        btn.addEventListener('click', () => {
            const rec = new webkitSpeechRecognition();
            rec.lang = 'zh-CN';
            rec.onresult = (e) => { input.value = e.results[0][0].transcript; };
            rec.start();
            btn.innerHTML = '🔴';
            rec.onend = () => { btn.innerHTML = '🎤'; };
        });
    }
});

// 109. 音频波形可视化
FeaturePack.register('fp109_audio_visualizer', {
    name: '音频可视化', desc: '音频波形可视化效果',
    initFn() {
        const canvas = el('canvas', { position:'fixed',bottom:'0',left:'0',width:'100%',height:'60px',pointerEvents:'none',zIndex:'-1',opacity:'0.3' });
        canvas.width = window.innerWidth; canvas.height = 60;
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        const bars = 50;
        const draw = () => {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            const w = canvas.width / bars;
            for (let i = 0; i < bars; i++) {
                const h = Math.random() * 40 + 5;
                ctx.fillStyle = `rgba(102,126,234,${0.2 + Math.random()*0.3})`;
                ctx.fillRect(i*w, canvas.height - h, w-2, h);
            }
            requestAnimationFrame(draw);
        };
        setInterval(draw, 100);
    }
});

// 110.  podcast播放器
FeaturePack.register('fp110_podcast_player', {
    name: '播客播放器', desc: '迷你播客播放器',
    initFn() {
        const div = el('div', {
            position:'fixed',bottom:'0',left:'0',right:'0',height:'50px',
            background:'rgba(0,0,0,0.9)',color:'white',display:'flex',
            alignItems:'center',padding:'0 20px',gap:'15px',zIndex:'994',fontSize:'13px'
        });
        div.innerHTML = `
            <span style="font-size:20px">🎧</span>
            <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">播客：技术weekly #42</span>
            <button id="fp_pod_play" style="background:none;border:none;color:white;font-size:18px;cursor:pointer">▶️</button>
            <input type="range" style="width:100px" value="50">
            <span id="fp_pod_close" style="cursor:pointer">✕</span>
        `;
        document.body.appendChild(div);
        let expanded = false;
        div.querySelector('#fp_pod_play').addEventListener('click', () => {
            expanded = !expanded;
            div.style.height = expanded ? '80px' : '50px';
        });
        div.querySelector('#fp_pod_close').addEventListener('click', () => div.remove());
    }
});
