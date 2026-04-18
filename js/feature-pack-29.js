/**
 * 功能包 #29: 投票与问卷 (141-145)
 */
import FeaturePack from './feature-pack-core.js?v=20260418c';
const { util } = FeaturePack;
const el = util.el;

// 141. 文章投票
FeaturePack.register('fp141_article_poll', {
    name: '文章投票', desc: '为文章投票',
    page: 'article',
    initFn() {
        const div = el('div', { marginTop:'20px',padding:'15px',background:'#f8f9ff',borderRadius:'10px' });
        div.innerHTML = '<div style="font-weight:600;margin-bottom:10px">📊 这篇文章对你有帮助吗？</div>' +
            '<div style="display:flex;gap:10px">' +
            '<button class="fp-poll-btn" style="flex:1;padding:8px;border:1px solid #e0e0e0;border-radius:8px;background:white;cursor:pointer">👍 有帮助</button>' +
            '<button class="fp-poll-btn" style="flex:1;padding:8px;border:1px solid #e0e0e0;border-radius:8px;background:white;cursor:pointer">👎 一般</button>' +
            '</div>';
        div.querySelectorAll('.fp-poll-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                div.innerHTML = '<div style="text-align:center;color:#4ade80;padding:10px">✅ 感谢您的投票！</div>';
            });
        });
        const content = document.querySelector('.article-content, .post-content, article');
        if (content) content.insertAdjacentElement('afterend', div);
    }
});

// 142. 满意度调查
FeaturePack.register('fp142_satisfaction', {
    name: '满意度', desc: '网站满意度调查',
    initFn() {
        if (util.storage.get('fp_satisfaction_done')) return;
        setTimeout(() => {
            const modal = el('div', {
                position:'fixed',top:'0',left:'0',right:'0',bottom:'0',
                background:'rgba(0,0,0,0.5)',zIndex:'99999',display:'flex',
                alignItems:'center',justifyContent:'center'
            });
            modal.innerHTML = `
                <div style="background:white;border-radius:16px;padding:25px;width:300px;text-align:center">
                    <div style="font-size:40px;margin-bottom:10px">😊</div>
                    <h3 style="margin:0 0 10px">您对我们的网站满意吗？</h3>
                    <div style="display:flex;justify-content:center;gap:10px;margin:15px 0">
                        <button class="fp-sat" style="font-size:30px;background:none;border:none;cursor:pointer">😍</button>
                        <button class="fp-sat" style="font-size:30px;background:none;border:none;cursor:pointer">🙂</button>
                        <button class="fp-sat" style="font-size:30px;background:none;border:none;cursor:pointer">😐</button>
                        <button class="fp-sat" style="font-size:30px;background:none;border:none;cursor:pointer">😞</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.querySelectorAll('.fp-sat').forEach(btn => {
                btn.addEventListener('click', () => { util.storage.set('fp_satisfaction_done', true); modal.remove(); });
            });
        }, 60000);
    }
});

// 143. 多选投票
FeaturePack.register('fp143_multi_poll', {
    name: '多选投票', desc: '多项选择投票',
    page: 'index',
    initFn() {
        const div = el('div', {
            padding:'20px',background:'white',borderRadius:'12px',
            boxShadow:'0 2px 10px rgba(0,0,0,0.05)',margin:'15px auto',maxWidth:'500px'
        });
        div.innerHTML = `<div style="font-weight:600;margin-bottom:12px">📊 本周话题：您最常用的编程语言？</div>` +
            `<div style="display:flex;flex-direction:column;gap:8px">` +
            ['JavaScript','Python','Java','Go','Rust'].map((opt,i) => `<label style="display:flex;align-items:center;gap:8px;padding:8px;background:#f8f9ff;border-radius:8px;cursor:pointer"><input type="radio" name="fp_poll" value="${i}"><span>${opt}</span></label>`).join('') +
            `</div><button id="fp_poll_submit" style="margin-top:12px;width:100%;padding:10px;border:none;border-radius:8px;background:#667eea;color:white;cursor:pointer">投票</button>`;
        document.body.appendChild(div);
        div.querySelector('#fp_poll_submit').addEventListener('click', () => {
            div.innerHTML = '<div style="text-align:center;padding:20px;color:#4ade80">✅ 投票成功！感谢您的参与</div>';
        });
    }
});

// 144. 评分星级
FeaturePack.register('fp144_star_rating', {
    name: '星级评分', desc: '五星评分组件',
    initFn() {
        document.querySelectorAll('[data-rating]').forEach(el => {
            const div = el('div', { display:'flex',gap:'2px' });
            for (let i = 1; i <= 5; i++) {
                const s = el('span', { cursor:'pointer',fontSize:'20px',color:i<=parseInt(el.dataset.rating)?'#f5af19':'#ddd' });
                s.textContent = '★';
                div.appendChild(s);
            }
            el.innerHTML = ''; el.appendChild(div);
        });
    }
});

// 145. 问卷弹窗
FeaturePack.register('fp145_survey_popup', {
    name: '问卷弹窗', desc: '用户调查问卷',
    initFn() {
        if (util.storage.get('fp_survey_done')) return;
        setTimeout(() => {
            const modal = el('div', {
                position:'fixed',top:'0',left:'0',right:'0',bottom:'0',
                background:'rgba(0,0,0,0.5)',zIndex:'99999',display:'flex',
                alignItems:'center',justifyContent:'center'
            });
            modal.innerHTML = `
                <div style="background:white;border-radius:16px;padding:25px;width:350px">
                    <h3 style="margin:0 0 15px">📝 快速问卷</h3>
                    <div style="font-size:13px;color:#666;margin-bottom:8px">您是如何知道我们网站的？</div>
                    <select style="width:100%;padding:8px;margin-bottom:15px;border:1px solid #e0e0e0;border-radius:8px">
                        <option>搜索引擎</option><option>社交媒体</option><option>朋友推荐</option><option>其他</option>
                    </select>
                    <button id="fp_survey_ok" style="width:100%;padding:10px;border:none;border-radius:8px;background:#667eea;color:white;cursor:pointer">提交</button>
                </div>
            `;
            document.body.appendChild(modal);
            modal.querySelector('#fp_survey_ok').addEventListener('click', () => { util.storage.set('fp_survey_done', true); modal.remove(); });
        }, 90000);
    }
});
