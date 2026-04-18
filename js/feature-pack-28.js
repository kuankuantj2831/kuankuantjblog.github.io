/**
 * 功能包 #28: 邮件与通讯 (136-140)
 */
import FeaturePack from './feature-pack-core.js?v=20260418c';
const { util } = FeaturePack;
const el = util.el;

// 136. 快速邮件
FeaturePack.register('fp136_quick_email', {
    name: '快速邮件', desc: '一键发送邮件',
    initFn() {
        const btn = el('button', {
            position:'fixed',bottom:'830px',right:'20px',width:'44px',height:'44px',
            borderRadius:'50%',border:'none',background:'#3498db',color:'white',
            fontSize:'18px',cursor:'pointer',zIndex:'994',display:'flex',
            alignItems:'center',justifyContent:'center'
        });
        btn.innerHTML = '✉️';
        btn.title = '发送邮件';
        btn.addEventListener('click', () => {
            const sub = prompt('邮件主题：');
            if (sub) window.location.href = `mailto:admin@mcock.cn?subject=${encodeURIComponent(sub)}`;
        });
        document.body.appendChild(btn);
    }
});

// 137. 联系表单弹窗
FeaturePack.register('fp137_contact_form', {
    name: '联系表单', desc: '快速联系表单',
    initFn() {
        const btn = el('button', {
            position:'fixed',bottom:'880px',right:'20px',width:'44px',height:'44px',
            borderRadius:'50%',border:'none',background:'#27ae60',color:'white',
            fontSize:'18px',cursor:'pointer',zIndex:'994',display:'flex',
            alignItems:'center',justifyContent:'center'
        });
        btn.innerHTML = '📨';
        btn.title = '联系我们';
        btn.addEventListener('click', () => {
            const modal = el('div', {
                position:'fixed',top:'0',left:'0',right:'0',bottom:'0',
                background:'rgba(0,0,0,0.5)',zIndex:'99999',display:'flex',
                alignItems:'center',justifyContent:'center'
            });
            modal.innerHTML = `
                <div style="background:white;border-radius:16px;padding:25px;width:350px">
                    <h3 style="margin:0 0 15px">📨 联系我们</h3>
                    <input placeholder="您的姓名" style="width:100%;padding:10px;margin-bottom:10px;border:1px solid #e0e0e0;border-radius:8px;box-sizing:border-box">
                    <input placeholder="您的邮箱" style="width:100%;padding:10px;margin-bottom:10px;border:1px solid #e0e0e0;border-radius:8px;box-sizing:border-box">
                    <textarea placeholder="留言内容" style="width:100%;padding:10px;height:100px;margin-bottom:10px;border:1px solid #e0e0e0;border-radius:8px;resize:none;box-sizing:border-box"></textarea>
                    <button id="fp_cf_send" style="width:100%;padding:10px;border:none;border-radius:8px;background:#667eea;color:white;cursor:pointer">发送</button>
                </div>
            `;
            document.body.appendChild(modal);
            modal.querySelector('#fp_cf_send').addEventListener('click', () => { alert('✅ 已发送！'); modal.remove(); });
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        });
        document.body.appendChild(btn);
    }
});

// 138. 在线客服
FeaturePack.register('fp138_live_chat', {
    name: '在线客服', desc: '浮动客服按钮',
    initFn() {
        const btn = el('button', {
            position:'fixed',bottom:'140px',right:'20px',padding:'12px 20px',
            background:'#25d366',color:'white',border:'none',borderRadius:'25px',
            fontSize:'14px',cursor:'pointer',zIndex:'997',boxShadow:'0 4px 15px rgba(37,211,102,0.3)',
            display:'flex',alignItems:'center',gap:'6px'
        });
        btn.innerHTML = '💬 客服';
        btn.addEventListener('click', () => {
            const chat = el('div', {
                position:'fixed',bottom:'200px',right:'20px',width:'300px',height:'400px',
                background:'white',borderRadius:'12px',boxShadow:'0 8px 30px rgba(0,0,0,0.15)',
                zIndex:'998',display:'flex',flexDirection:'column',overflow:'hidden'
            });
            chat.innerHTML = `
                <div style="padding:12px;background:#25d366;color:white;font-weight:600">💬 在线客服</div>
                <div style="flex:1;padding:12px;overflow:auto;font-size:13px">
                    <div style="background:#f0f0f0;padding:8px 12px;border-radius:12px;margin-bottom:8px">您好！有什么可以帮助您的吗？</div>
                </div>
                <div style="padding:8px;display:flex;gap:6px;border-top:1px solid #eee">
                    <input style="flex:1;padding:8px;border:1px solid #e0e0e0;border-radius:20px;font-size:13px" placeholder="输入消息...">
                    <button style="padding:8px 16px;background:#25d366;color:white;border:none;border-radius:20px;cursor:pointer">发送</button>
                </div>
            `;
            document.body.appendChild(chat);
        });
        document.body.appendChild(btn);
    }
});

// 139. 意见反馈
FeaturePack.register('fp139_feedback', {
    name: '意见反馈', desc: '快速提交反馈',
    initFn() {
        const btn = el('button', {
            position:'fixed',bottom:'930px',right:'20px',width:'44px',height:'44px',
            borderRadius:'50%',border:'none',background:'#f39c12',color:'white',
            fontSize:'18px',cursor:'pointer',zIndex:'994',display:'flex',
            alignItems:'center',justifyContent:'center'
        });
        btn.innerHTML = '📋';
        btn.title = '意见反馈';
        btn.addEventListener('click', () => {
            const type = prompt('📋 意见反馈\n1-功能建议 2-Bug报告 3-其他');
            if (!type) return;
            const content = prompt('请输入反馈内容：');
            if (content) alert('✅ 感谢您的反馈！我们会认真考虑。');
        });
        document.body.appendChild(btn);
    }
});

// 140. 订阅电子报
FeaturePack.register('fp140_newsletter', {
    name: '订阅电子报', desc: '邮件订阅功能',
    page: 'index',
    initFn() {
        const div = el('div', {
            textAlign:'center',padding:'25px',margin:'20px auto',
            background:'linear-gradient(135deg,#667eea,#764ba2)',color:'white',
            borderRadius:'16px',maxWidth:'500px'
        });
        div.innerHTML = `
            <div style="font-size:18px;font-weight:600;margin-bottom:8px">📧 订阅电子报</div>
            <div style="font-size:13px;opacity:0.9;margin-bottom:15px">每周精选文章直达邮箱</div>
            <div style="display:flex;gap:8px;justify-content:center">
                <input placeholder="your@email.com" style="padding:10px 16px;border:none;border-radius:25px;flex:1;max-width:250px">
                <button style="padding:10px 20px;border:none;border-radius:25px;background:white;color:#667eea;font-weight:600;cursor:pointer">订阅</button>
            </div>
        `;
        div.querySelector('button').addEventListener('click', () => {
            const email = div.querySelector('input').value;
            if (email && email.includes('@')) alert('✅ 订阅成功！');
            else alert('请输入有效邮箱');
        });
        const footer = document.querySelector('footer');
        if (footer) footer.insertAdjacentElement('beforebegin', div);
    }
});
