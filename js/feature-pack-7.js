/**
 * 功能包 #7: 用户交互 (31-35)
 */
import FeaturePack from './feature-pack-core.js?v=20260419a';
const { util } = FeaturePack;
const el = util.el;

// 31. 用户名片悬浮
FeaturePack.register('fp31_user_card', {
    name: '用户名片悬浮', desc: '悬停用户名显示卡片',
    initFn() {
        const card = el('div', {
            position:'fixed',display:'none',background:'white',borderRadius:'12px',
            padding:'16px',boxShadow:'0 8px 30px rgba(0,0,0,0.15)',zIndex:'99999',
            width:'220px',fontSize:'13px'
        });
        document.body.appendChild(card);
        document.addEventListener('mouseover', (e) => {
            const user = e.target.closest('[data-user], .username, .author-name');
            if (!user) { card.style.display = 'none'; return; }
            const name = user.dataset.user || user.textContent.trim();
            card.innerHTML = `
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
                    <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;color:white;font-size:16px">${name[0]}</div>
                    <div><div style="font-weight:600">${name}</div><div style="font-size:11px;color:#999">Lv.${util.rand(1,10)} 用户</div></div>
                </div>
                <div style="display:flex;justify-content:space-around;color:#666;font-size:11px">
                    <div style="text-align:center"><div style="font-weight:600;font-size:14px">${util.rand(1,50)}</div><div>文章</div></div>
                    <div style="text-align:center"><div style="font-weight:600;font-size:14px">${util.rand(10,500)}</div><div>粉丝</div></div>
                    <div style="text-align:center"><div style="font-weight:600;font-size:14px">${util.rand(100,5000)}</div><div>获赞</div></div>
                </div>
            `;
            card.style.display = 'block';
        });
        document.addEventListener('mousemove', (e) => {
            if (card.style.display === 'block') {
                card.style.left = (e.clientX + 15) + 'px';
                card.style.top = (e.clientY + 15) + 'px';
            }
        });
        document.addEventListener('mouseout', (e) => {
            if (e.target.closest('[data-user], .username, .author-name')) card.style.display = 'none';
        });
    }
});

// 32. 关注作者按钮
FeaturePack.register('fp32_follow_author', {
    name: '关注作者', desc: '一键关注文章作者',
    page: 'article',
    initFn() {
        const meta = document.querySelector('.article-meta, .post-meta');
        if (!meta) return;
        const authorEl = meta.querySelector('.author, [data-author]');
        if (!authorEl) return;
        const author = authorEl.dataset.author || authorEl.textContent.trim();
        const btn = el('button', {
            padding:'4px 12px',border:'1px solid #667eea',borderRadius:'15px',
            background:'white',color:'#667eea',fontSize:'12px',cursor:'pointer',marginLeft:'8px'
        });
        const following = util.storage.get('following_users', []).includes(author);
        btn.textContent = following ? '✓ 已关注' : '+ 关注';
        btn.addEventListener('click', () => {
            let list = util.storage.get('following_users', []);
            if (list.includes(author)) { list = list.filter(u => u !== author); btn.textContent = '+ 关注'; btn.style.background = 'white'; btn.style.color = '#667eea'; }
            else { list.push(author); btn.textContent = '✓ 已关注'; btn.style.background = '#667eea'; btn.style.color = 'white'; }
            util.storage.set('following_users', list);
        });
        authorEl.appendChild(btn);
    }
});

// 33. 快速私信
FeaturePack.register('fp33_quick_message', {
    name: '快速私信', desc: '向作者发送私信',
    page: 'article',
    initFn() {
        const meta = document.querySelector('.article-meta, .post-meta');
        if (!meta) return;
        const btn = el('button', {
            padding:'4px 12px',border:'1px solid #e0e0e0',borderRadius:'15px',
            background:'white',fontSize:'12px',cursor:'pointer',marginLeft:'8px'
        });
        btn.textContent = '💬 私信';
        btn.addEventListener('click', () => {
            const modal = el('div', {
                position:'fixed',top:'0',left:'0',right:'0',bottom:'0',
                background:'rgba(0,0,0,0.5)',zIndex:'99999',display:'flex',
                alignItems:'center',justifyContent:'center'
            });
            modal.innerHTML = `
                <div style="background:white;border-radius:16px;padding:25px;width:320px">
                    <h3 style="margin:0 0 15px">💬 发送私信</h3>
                    <textarea id="fp_msg_content" placeholder="说点什么..." style="width:100%;height:100px;padding:10px;border:1px solid #e0e0e0;border-radius:8px;resize:none;font-size:13px;box-sizing:border-box"></textarea>
                    <div style="margin-top:15px;display:flex;gap:10px;justify-content:flex-end">
                        <button id="fp_msg_cancel" style="padding:8px 20px;border:none;border-radius:8px;background:#f5f5f5;cursor:pointer">取消</button>
                        <button id="fp_msg_send" style="padding:8px 20px;border:none;border-radius:8px;background:#667eea;color:white;cursor:pointer">发送</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.querySelector('#fp_msg_cancel').addEventListener('click', () => modal.remove());
            modal.querySelector('#fp_msg_send').addEventListener('click', () => {
                alert('私信已发送！（演示模式）'); modal.remove();
            });
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        });
        meta.appendChild(btn);
    }
});

// 34. @提及高亮
FeaturePack.register('fp34_mention_highlight', {
    name: '@提及高亮', desc: '评论中@用户名高亮',
    page: 'article',
    initFn() {
        document.querySelectorAll('.comment-body, .comment-content, .comment-text').forEach(c => {
            c.innerHTML = c.innerHTML.replace(/@([\w\u4e00-\u9fa5]+)/g, '<span style="color:#667eea;font-weight:600;background:rgba(102,126,234,0.1);padding:0 4px;border-radius:4px">@$1</span>');
        });
    }
});

// 35. 用户等级徽章
FeaturePack.register('fp35_user_badge', {
    name: '用户等级徽章', desc: '显示用户等级徽章',
    initFn() {
        const badges = { 1:'🥉', 2:'🥈', 3:'🥇', 4:'💎', 5:'👑' };
        document.querySelectorAll('[data-user], .username, .author-name, .comment-author').forEach(el => {
            const level = util.rand(1, 5);
            const badge = document.createElement('span');
            badge.textContent = ' ' + badges[level];
            badge.title = 'Lv.' + level;
            badge.style.fontSize = '14px';
            el.appendChild(badge);
        });
    }
});
