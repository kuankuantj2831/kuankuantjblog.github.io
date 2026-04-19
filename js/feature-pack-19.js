/**
 * 功能包 #19: 辅助工具 (91-95)
 */
import FeaturePack from './feature-pack-core.js?v=20260419a';
const { util } = FeaturePack;
const el = util.el;

// 91. 页面翻译提示
FeaturePack.register('fp91_translate_hint', {
    name: '翻译提示', desc: '非中文用户提示翻译',
    initFn() {
        const lang = navigator.language || navigator.userLanguage;
        if (!lang.startsWith('zh')) {
            const bar = el('div', {
                position:'fixed',top:'0',left:'0',right:'0',background:'#667eea',
                color:'white',padding:'8px',textAlign:'center',fontSize:'13px',zIndex:'99999'
            });
            bar.innerHTML = 'This page is in Chinese. <a href="#" style="color:white;text-decoration:underline">Translate to English</a> | <span id="fp_trans_dismiss" style="cursor:pointer;margin-left:10px">✕</span>';
            document.body.appendChild(bar);
            bar.querySelector('#fp_trans_dismiss').addEventListener('click', () => bar.remove());
        }
    }
});

// 92. 页面朗读
FeaturePack.register('fp92_text_to_speech', {
    name: '页面朗读', desc: '文章页朗读按钮',
    page: 'article',
    initFn() {
        if (!('speechSynthesis' in window)) return;
        const btn = el('button', {
            padding:'6px 14px',border:'1px solid #e0e0e0',borderRadius:'6px',
            background:'white',fontSize:'12px',cursor:'pointer',marginLeft:'10px'
        });
        let speaking = false;
        btn.innerHTML = '🔊 朗读';
        btn.addEventListener('click', () => {
            if (speaking) { speechSynthesis.cancel(); speaking = false; btn.innerHTML = '🔊 朗读'; return; }
            const content = document.querySelector('.article-content, .post-content, article');
            if (!content) return;
            const utter = new SpeechSynthesisUtterance(content.textContent.slice(0, 500));
            utter.lang = 'zh-CN';
            utter.onend = () => { speaking = false; btn.innerHTML = '🔊 朗读'; };
            speechSynthesis.speak(utter);
            speaking = true;
            btn.innerHTML = '⏹️ 停止';
        });
        const meta = document.querySelector('.article-meta, .post-meta');
        if (meta) meta.appendChild(btn);
    }
});

// 93. 页面导出PDF提示
FeaturePack.register('fp93_export_pdf', {
    name: '导出PDF', desc: '文章页导出PDF按钮',
    page: 'article',
    initFn() {
        const btn = el('button', {
            padding:'6px 14px',border:'1px solid #e0e0e0',borderRadius:'6px',
            background:'white',fontSize:'12px',cursor:'pointer',marginLeft:'10px'
        });
        btn.innerHTML = '📄 导出PDF';
        btn.addEventListener('click', () => { window.print(); });
        const meta = document.querySelector('.article-meta, .post-meta');
        if (meta) meta.appendChild(btn);
    }
});

// 94. 页面二维码
FeaturePack.register('fp94_page_qrcode', {
    name: '页面二维码', desc: '显示当前页面二维码',
    initFn() {
        const btn = el('button', {
            position:'fixed',bottom:'330px',right:'20px',width:'44px',height:'44px',
            borderRadius:'50%',border:'none',background:'white',fontSize:'20px',
            cursor:'pointer',zIndex:'996',boxShadow:'0 2px 10px rgba(0,0,0,0.1)'
        });
        btn.innerHTML = '🔳';
        btn.title = '页面二维码';
        btn.addEventListener('click', () => {
            const modal = el('div', {
                position:'fixed',top:'0',left:'0',right:'0',bottom:'0',
                background:'rgba(0,0,0,0.5)',zIndex:'99999',display:'flex',
                alignItems:'center',justifyContent:'center'
            });
            const url = encodeURIComponent(location.href);
            modal.innerHTML = `
                <div style="background:white;border-radius:16px;padding:30px;text-align:center">
                    <h3 style="margin:0 0 15px">📱 扫码访问</h3>
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${url}" style="border-radius:8px" alt="QR">
                    <div style="margin-top:10px;font-size:12px;color:#999">${location.href}</div>
                    <button id="fp_qr_close" style="margin-top:15px;padding:8px 30px;border:none;border-radius:20px;background:#f5f5f5;cursor:pointer">关闭</button>
                </div>
            `;
            document.body.appendChild(modal);
            modal.querySelector('#fp_qr_close').addEventListener('click', () => modal.remove());
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        });
        document.body.appendChild(btn);
    }
});

// 95. 夜间模式护眼提示
FeaturePack.register('fp95_eye_care', {
    name: '护眼提示', desc: '夜间使用提醒休息',
    initFn() {
        const hour = new Date().getHours();
        if (hour < 22 && hour > 6) return;
        const toast = el('div', {
            position:'fixed',top:'20px',right:'20px',
            background:'linear-gradient(135deg,#ff6b6b,#ff4757)',color:'white',
            padding:'12px 20px',borderRadius:'12px',zIndex:'99999',fontSize:'13px',
            boxShadow:'0 4px 15px rgba(255,107,107,0.3)',animation:'slideInRight .3s'
        });
        toast.innerHTML = '🌙 夜深了，注意休息保护眼睛哦！';
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(()=>toast.remove(),300); }, 6000);
    }
});
