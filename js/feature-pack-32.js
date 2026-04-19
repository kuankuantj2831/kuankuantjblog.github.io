/**
 * 功能包 #32: 任务与待办 (156-160)
 */
import FeaturePack from './feature-pack-core.js?v=20260419a';
const { util } = FeaturePack;
const el = util.el;

// 156. 待办事项
FeaturePack.register('fp156_todo_list', {
    name: '待办事项', desc: '迷你待办清单',
    initFn() {
        const div = el('div', {
            position:'fixed',bottom:'200px',right:'20px',width:'250px',
            background:'white',borderRadius:'12px',boxShadow:'0 8px 30px rgba(0,0,0,0.15)',
            zIndex:'997',fontSize:'13px',display:'none',padding:'15px'
        });
        div.id = 'fp_todo_panel';
        div.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                <span style="font-weight:600">📝 待办事项</span>
                <span id="fp_todo_close" style="cursor:pointer;color:#999">✕</span>
            </div>
            <div id="fp_todo_items" style="display:flex;flex-direction:column;gap:6px;max-height:200px;overflow:auto"></div>
            <div style="display:flex;gap:6px;margin-top:10px">
                <input id="fp_todo_input" style="flex:1;padding:6px;border:1px solid #e0e0e0;border-radius:6px;font-size:12px" placeholder="添加任务...">
                <button id="fp_todo_add" style="padding:6px 12px;border:none;border-radius:6px;background:#667eea;color:white;cursor:pointer;font-size:12px">+</button>
            </div>
        `;
        document.body.appendChild(div);
        
        const btn = el('button', {
            position:'fixed',bottom:'980px',right:'20px',width:'44px',height:'44px',
            borderRadius:'50%',border:'none',background:'#e74c3c',color:'white',
            fontSize:'20px',cursor:'pointer',zIndex:'994',display:'flex',
            alignItems:'center',justifyContent:'center'
        });
        btn.innerHTML = '📝';
        btn.title = '待办事项';
        btn.addEventListener('click', () => {
            div.style.display = div.style.display === 'none' ? 'block' : 'none';
        });
        document.body.appendChild(btn);
        
        div.querySelector('#fp_todo_close').addEventListener('click', () => div.style.display = 'none');
        div.querySelector('#fp_todo_add').addEventListener('click', () => {
            const input = div.querySelector('#fp_todo_input');
            if (!input.value.trim()) return;
            const item = el('div', { display:'flex',alignItems:'center',gap:'6px',padding:'6px',background:'#f8f9ff',borderRadius:'6px' });
            item.innerHTML = `<input type="checkbox" style="cursor:pointer"> <span style="flex:1;font-size:12px">${input.value}</span> <span class="fp-todo-del" style="cursor:pointer;color:#999;font-size:11px">删除</span>`;
            item.querySelector('.fp-todo-del').addEventListener('click', () => item.remove());
            div.querySelector('#fp_todo_items').appendChild(item);
            input.value = '';
        });
    }
});

// 157. 番茄工作法统计
FeaturePack.register('fp157_pomodoro_stats', {
    name: '番茄统计', desc: '番茄钟完成统计',
    initFn() {
        const count = util.storage.get('fp_pomo_count', 0);
        if (count === 0) return;
        const div = el('div', {
            position:'fixed',bottom:'180px',right:'20px',padding:'4px 10px',
            background:'rgba(255,107,107,0.9)',color:'white',borderRadius:'12px',
            fontSize:'11px',zIndex:'998'
        });
        div.textContent = `🍅 已完成 ${count} 个番茄`;
        document.body.appendChild(div);
    }
});

// 158. 习惯追踪
FeaturePack.register('fp158_habit_tracker', {
    name: '习惯追踪', desc: '每日习惯打卡',
    initFn() {
        const habits = ['阅读','运动','学习','早睡'];
        const today = new Date().toDateString();
        const key = 'fp_habits_' + today;
        const done = util.storage.get(key, []);
        const div = el('div', {
            padding:'15px',background:'white',borderRadius:'12px',
            boxShadow:'0 2px 10px rgba(0,0,0,0.05)',margin:'15px auto',maxWidth:'400px'
        });
        div.innerHTML = '<div style="font-weight:600;margin-bottom:10px">📅 今日习惯</div>' +
            habits.map(h => `<div style="display:flex;align-items:center;gap:8px;padding:6px"><input type="checkbox" ${done.includes(h)?'checked':''} style="cursor:pointer"> <span>${h}</span></div>`).join('');
        div.querySelectorAll('input').forEach((cb, i) => {
            cb.addEventListener('change', () => {
                const checked = Array.from(div.querySelectorAll('input')).filter(c => c.checked).map((_,i) => habits[i]);
                util.storage.set(key, checked);
            });
        });
        const footer = document.querySelector('footer');
        if (footer) footer.insertAdjacentElement('beforebegin', div);
    }
});

// 159. 目标进度
FeaturePack.register('fp159_goal_progress', {
    name: '目标进度', desc: '显示年度目标进度',
    page: 'index',
    initFn() {
        const now = new Date();
        const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
        const pct = Math.round(dayOfYear / 365 * 100);
        const div = el('div', {
            textAlign:'center',padding:'15px',margin:'15px auto',
            background:'#f8f9ff',borderRadius:'12px',maxWidth:'400px'
        });
        div.innerHTML = `<div style="font-size:13px;color:#666;margin-bottom:8px">📅 ${now.getFullYear()}年已过去 ${pct}%</div>` +
            `<div style="height:8px;background:#eee;border-radius:4px;overflow:hidden"><div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#667eea,#764ba2);border-radius:4px;transition:width 1s"></div></div>` +
            `<div style="font-size:11px;color:#999;margin-top:4px">第 ${dayOfYear} 天 / 365 天</div>`;
        const showcase = document.querySelector('.resource-showcase');
        if (showcase) showcase.insertAdjacentElement('beforebegin', div);
    }
});

// 160. 倒计时提醒
FeaturePack.register('fp160_event_countdown', {
    name: '事件倒计时', desc: '重要事件倒计时',
    initFn() {
        const events = [
            { name:'春节', date:'2027-02-06' },
            { name:'五一', date:'2026-05-01' },
        ];
        const event = events[0];
        const target = new Date(event.date);
        const div = el('div', {
            textAlign:'center',padding:'12px',margin:'10px auto',
            background:'linear-gradient(135deg,#f5af19,#f12711)',color:'white',
            borderRadius:'12px',maxWidth:'300px',fontSize:'13px'
        });
        const update = () => {
            const diff = target - Date.now();
            const days = Math.floor(diff / 86400000);
            div.innerHTML = `🎊 距离${event.name}还有 <span style="font-size:20px;font-weight:700">${days}</span> 天`;
        };
        update();
        const showcase = document.querySelector('.resource-showcase');
        if (showcase) showcase.insertAdjacentElement('beforebegin', div);
    }
});
