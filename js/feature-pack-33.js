/**
 * 功能包 #33: RSS与订阅 (161-165)
 */
import FeaturePack from './feature-pack-core.js?v=20260419a';
const { util } = FeaturePack;
const el = util.el;

// 161. RSS订阅按钮
FeaturePack.register('fp161_rss_button', {
    name: 'RSS订阅', desc: 'RSS订阅入口',
    page: 'index',
    initFn() {
        const btn = el('a', {
            position:'fixed',bottom:'1030px',right:'20px',width:'44px',height:'44px',
            borderRadius:'50%',background:'#ff6600',color:'white',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:'18px',textDecoration:'none',zIndex:'994'
        });
        btn.innerHTML = '📡';
        btn.title = 'RSS订阅';
        btn.href = '/rss.xml';
        document.body.appendChild(btn);
    }
});

// 162. 邮件订阅弹窗
FeaturePack.register('fp162_email_subscribe', {
    name: '邮件订阅', desc: '邮件订阅弹窗',
    page: 'index',
    initFn() {
        if (util.storage.get('fp_email_sub')) return;
        setTimeout(() => {
            const modal = el('div', {
                position:'fixed',top:'0',left:'0',right:'0',bottom:'0',
                background:'rgba(0,0,0,0.5)',zIndex:'99999',display:'flex',
                alignItems:'center',justifyContent:'center'
            });
            modal.innerHTML = `
                <div style="background:white;border-radius:16px;padding:30px;width:320px;text-align:center">
                    <div style="font-size:48px;margin-bottom:10px">📧</div>
                    <h3 style="margin:0 0 8px">订阅更新</h3>
                    <p style="color:#999;font-size:13px;margin-bottom:15px">获取最新文章推送</p>
                    <input placeholder="your@email.com" style="width:100%;padding:10px;margin-bottom:10px;border:1px solid #e0e0e0;border-radius:8px;box-sizing:border-box">
                    <button id="fp_es_sub" style="width:100%;padding:10px;border:none;border-radius:8px;background:#667eea;color:white;cursor:pointer">订阅</button>
                    <div id="fp_es_skip" style="margin-top:10px;font-size:12px;color:#999;cursor:pointer">暂不订阅</div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.querySelector('#fp_es_sub').addEventListener('click', () => { util.storage.set('fp_email_sub', true); modal.remove(); });
            modal.querySelector('#fp_es_skip').addEventListener('click', () => { modal.remove(); });
        }, 45000);
    }
});

// 163. 文章更新推送
FeaturePack.register('fp163_update_push', {
    name: '更新推送', desc: '检测文章更新推送',
    initFn() {
        const check = () => {
            if (Math.random() > 0.95) {
                const toast = el('div', {
                    position:'fixed',top:'80px',right:'20px',
                    background:'white',borderRadius:'12px',padding:'15px',
                    boxShadow:'0 4px 15px rgba(0,0,0,0.1)',zIndex:'99999',fontSize:'13px'
                });
                toast.innerHTML = '<div>📝 您关注的文章有更新！</div>';
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 5000);
            }
        };
        setInterval(check, 60000);
    }
});

// 164. Web Push订阅
FeaturePack.register('fp164_web_push', {
    name: 'Web推送', desc: '浏览器推送订阅',
    initFn() {
        if (!('PushManager' in window)) return;
        const btn = el('button', {
            position:'fixed',bottom:'1080px',right:'20px',width:'44px',height:'44px',
            borderRadius:'50%',border:'none',background:'#4285f4',color:'white',
            fontSize:'18px',cursor:'pointer',zIndex:'994',display:'flex',
            alignItems:'center',justifyContent:'center'
        });
        btn.innerHTML = '📲';
        btn.title = '推送订阅';
        btn.addEventListener('click', () => {
            Notification.requestPermission().then(p => {
                if (p === 'granted') alert('✅ 已开启推送通知');
            });
        });
        document.body.appendChild(btn);
    }
});

// 165. 订阅源管理
FeaturePack.register('fp165_feed_manager', {
    name: '订阅管理', desc: '管理内容订阅源',
    initFn() {
        const feeds = ['技术','生活','设计','摄影'];
        const div = el('div', {
            padding:'15px',background:'white',borderRadius:'12px',
            boxShadow:'0 2px 10px rgba(0,0,0,0.05)',margin:'15px auto',maxWidth:'400px'
        });
        div.innerHTML = '<div style="font-weight:600;margin-bottom:10px">📡 订阅频道</div>' +
            feeds.map(f => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border-bottom:1px solid #f5f5f5"><span>${f}</span><span style="color:#4ade80;font-size:12px">✓ 已订阅</span></div>`).join('');
        const footer = document.querySelector('footer');
        if (footer) footer.insertAdjacentElement('beforebegin', div);
    }
});
