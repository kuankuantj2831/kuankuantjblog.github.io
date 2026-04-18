/**
 * 功能包 #12: 安全与隐私 (56-60)
 */
import FeaturePack from './feature-pack-core.js?v=20260418c';
const { util } = FeaturePack;
const el = util.el;

// 56. 防复制警告
FeaturePack.register('fp56_anti_copy', {
    name: '防复制警告', desc: '大量复制时弹出警告',
    initFn() {
        document.addEventListener('copy', (e) => {
            const t = window.getSelection().toString();
            if (t.length > 200 && !e.defaultPrevented) {
                if (!confirm(`您正在复制 ${t.length} 个字符的内容。确定要复制吗？`)) {
                    e.preventDefault();
                }
            }
        });
    }
});

// 57. 开发者工具检测
FeaturePack.register('fp57_devtools_detect', {
    name: '开发者检测', desc: '检测开发者工具打开',
    initFn() {
        const detect = () => {
            const start = performance.now();
            console.clear();
            const end = performance.now();
            if (end - start > 100) {
                console.log('%c🛑 嘿，欢迎查看源码！', 'font-size:24px;color:#667eea;font-weight:bold');
                console.log('%c我们的代码是开源的，欢迎交流学习！', 'font-size:14px;color:#666');
            }
        };
        setInterval(detect, 3000);
    }
});

// 58. 隐私模式检测
FeaturePack.register('fp58_privacy_mode', {
    name: '隐私模式提示', desc: '检测无痕模式',
    initFn() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
        } catch (e) {
            const toast = el('div', {
                position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%)',
                background:'#ff6b6b',color:'white',padding:'10px 24px',
                borderRadius:'25px',fontSize:'13px',zIndex:'99999'
            });
            toast.textContent = '⚠️ 检测到隐私模式，部分功能可能受限';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 5000);
        }
    }
});

// 59. 登录安全提醒
FeaturePack.register('fp59_login_security', {
    name: '登录安全', desc: '登录页安全提示',
    page: 'index',
    initFn() {
        const form = document.querySelector('#loginForm, .login-form');
        if (!form) return;
        const hint = el('div', {
            fontSize:'12px',color:'#999',marginTop:'10px',padding:'8px',
            background:'#f8f9ff',borderRadius:'6px'
        });
        hint.innerHTML = '🔒 请确保您在正确的网站上登录，不要向任何人透露密码';
        form.appendChild(hint);
    }
});

// 60. Cookie同意弹窗
FeaturePack.register('fp60_cookie_consent', {
    name: 'Cookie同意', desc: 'Cookie使用同意弹窗',
    initFn() {
        if (util.storage.get('cookie_consent')) return;
        const banner = el('div', {
            position:'fixed',bottom:'0',left:'0',right:'0',background:'rgba(0,0,0,0.9)',
            color:'white',padding:'16px 24px',zIndex:'99999',display:'flex',
            justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'10px'
        });
        banner.innerHTML = `
            <span style="font-size:13px">🍪 我们使用 Cookie 来提升您的浏览体验。</span>
            <div style="display:flex;gap:10px">
                <button id="fp_cookie_accept" style="padding:8px 20px;border:none;border-radius:20px;background:#667eea;color:white;cursor:pointer;font-size:13px">同意</button>
                <button id="fp_cookie_reject" style="padding:8px 20px;border:1px solid rgba(255,255,255,0.3);border-radius:20px;background:transparent;color:white;cursor:pointer;font-size:13px">拒绝</button>
            </div>
        `;
        document.body.appendChild(banner);
        banner.querySelector('#fp_cookie_accept').addEventListener('click', () => { util.storage.set('cookie_consent', 'accepted'); banner.remove(); });
        banner.querySelector('#fp_cookie_reject').addEventListener('click', () => { util.storage.set('cookie_consent', 'rejected'); banner.remove(); });
    }
});
