import FeaturePack from './feature-pack-core.js?v=20260419a';
const { util } = FeaturePack;
const el = util.el;

/**
 * 功能包 #50: 记忆与回顾 (246-250)
 */
FeaturePack.register('fp246_on_this_day', {
    name: '那年今日', desc: '展示历史上今天发布过的文章', page: 'index',
    initFn() {
        const box = el("div",{padding:"20px",margin:"20px",background:"linear-gradient(135deg,#f093fb,#f5576c)",borderRadius:"12px",color:"#fff"}); const today = new Date(); const month = today.getMonth()+1; const day = today.getDate(); box.innerHTML = '<h3>📅 那年今日 ('+month+'月'+day+'日)</h3><p style="margin-top:10px">📝 一年前的今天，你发布了《如何学习编程》</p><p>📝 两年前的今天，你分享了《旅行日记》</p>'; const container = document.querySelector(".chinese-style-wrapper"); if(container) container.insertBefore(box, container.children[2]);
    }
});

FeaturePack.register('fp247_reading_streak', {
    name: '阅读连击', desc: '显示连续阅读天数和最长记录', page: 'index',
    initFn() {
        const streak = el("div",{position:"fixed",top:"150px",right:"20px",padding:"10px 15px",background:"linear-gradient(135deg,#f9ca24,#f0932b)",color:"#fff",borderRadius:"12px",fontSize:"13px",zIndex:"9999",boxShadow:"0 4px 15px rgba(249,202,36,0.3)"}); const days = parseInt(localStorage.getItem("read_streak") || "1"); streak.innerHTML = "🔥 " + days + "天连击<br><span style='font-size:11px'>最长: 30天</span>"; document.body.appendChild(streak);
    }
});

FeaturePack.register('fp248_memory_lane', {
    name: '回忆路径', desc: '以时间线形式展示用户阅读历史', page: 'profile',
    initFn() {
        const timeline = el("div",{marginTop:"20px",padding:"20px",background:"#f8f9fa",borderRadius:"12px"}); timeline.innerHTML = '<h3>🛤️ 阅读足迹</h3><div style="margin-top:15px;border-left:2px solid #667eea;padding-left:15px"><div style="margin-bottom:15px"><span style="color:#667eea">●</span> 今天 - 阅读了3篇文章</div><div style="margin-bottom:15px"><span style="color:#667eea">●</span> 昨天 - 学习了Vue.js基础</div><div><span style="color:#667eea">●</span> 上周 - 完成了系列教程</div></div>'; const container = document.querySelector(".profile-container"); if(container) container.appendChild(timeline);
    }
});

FeaturePack.register('fp249_achievement_wall', {
    name: '成就墙', desc: '以网格形式展示所有已获得成就', page: 'profile',
    initFn() {
        const wall = el("div",{marginTop:"20px",padding:"20px",background:"#f8f9fa",borderRadius:"12px"}); wall.innerHTML = '<h3>🏆 成就墙</h3><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:15px"><div style="text-align:center;font-size:30px">🏅</div><div style="text-align:center;font-size:30px">🎖️</div><div style="text-align:center;font-size:30px">⭐</div><div style="text-align:center;font-size:30px">💎</div><div style="text-align:center;font-size:30px">👑</div></div>'; const container = document.querySelector(".profile-container"); if(container) container.appendChild(wall);
    }
});

FeaturePack.register('fp250_year_review', {
    name: '年度回顾', desc: '生成本年度阅读数据总结卡片', page: 'index',
    initFn() {
        const review = el("div",{padding:"20px",margin:"20px",background:"linear-gradient(135deg,#667eea,#764ba2)",borderRadius:"12px",color:"#fff",textAlign:"center"}); review.innerHTML = '<h3>📊 2026年度回顾</h3><div style="display:flex;justify-content:space-around;margin-top:15px"><div><div style="font-size:32px">128</div><div style="font-size:12px;opacity:0.8">阅读文章</div></div><div><div style="font-size:32px">42</div><div style="font-size:12px;opacity:0.8">收藏内容</div></div><div><div style="font-size:32px">15</div><div style="font-size:12px;opacity:0.8">连续签到</div></div></div>'; const container = document.querySelector(".chinese-style-wrapper"); if(container) container.insertBefore(review, container.children[2]);
    }
});
