import FeaturePack from './feature-pack-core.js?v=20260419a';
const { util } = FeaturePack;
const el = util.el;

/**
 * 功能包 #53: 旅行与探索 (261-265)
 */
FeaturePack.register('fp261_travel_map', {
    name: '旅行地图', desc: '在个人资料页展示虚拟旅行足迹地图', page: 'profile',
    initFn() {
        const map = el("div",{marginTop:"20px",padding:"20px",background:"#e8f4f8",borderRadius:"12px",textAlign:"center"}); map.innerHTML = '<h3>🗺️ 旅行足迹</h3><div style="font-size:60px;margin:15px">🌍</div><div style="display:flex;justify-content:center;gap:20px;font-size:24px"><span>🇨🇳</span><span>🇯🇵</span><span>🇰🇷</span><span>🇹🇭</span><span>🇸🇬</span></div><p style="margin-top:10px;font-size:12px;color:#666">已探索 5 个国家 / 12 个城市</p>'; const container = document.querySelector(".profile-container"); if(container) container.appendChild(map);
    }
});

FeaturePack.register('fp262_journal_entry', {
    name: '旅行日志', desc: '为旅行类文章添加日记本样式装饰', page: 'article',
    initFn() {
        const journal = document.querySelector("article, .article-content"); if(journal) { journal.style.background = "linear-gradient(to bottom, #fff 95%, #f0f0f0 95%)"; journal.style.backgroundSize = "100% 40px"; journal.style.lineHeight = "40px"; journal.style.padding = "20px"; }
    }
});

FeaturePack.register('fp263_weather_widget', {
    name: '目的地天气', desc: '文章顶部显示目的地的模拟天气信息', page: 'article',
    initFn() {
        const weather = el("div",{padding:"10px 15px",background:"linear-gradient(135deg,#74b9ff,#0984e3)",color:"#fff",borderRadius:"12px",marginBottom:"15px",display:"flex",alignItems:"center",gap:"15px"}); weather.innerHTML = '<span style="font-size:32px">☀️</span><div><div style="font-size:20px">24°C 晴朗</div><div style="font-size:12px;opacity:0.8">适合出行</div></div>'; const container = document.querySelector("article, .article-header"); if(container) container.insertBefore(weather, container.firstChild);
    }
});

FeaturePack.register('fp264_packing_list', {
    name: '行李清单', desc: '旅行文章旁生成互动式行李打包清单', page: 'article',
    initFn() {
        const packing = el("div",{padding:"15px",margin:"15px 0",background:"#f8f9fa",borderRadius:"12px"}); packing.innerHTML = '<h4>🎒 行李清单</h4><div style="margin-top:8px"><label style="display:block;padding:5px"><input type="checkbox"> 护照/身份证</label><label style="display:block;padding:5px"><input type="checkbox"> 充电器</label><label style="display:block;padding:5px"><input type="checkbox"> 换洗衣物</label><label style="display:block;padding:5px"><input type="checkbox"> 相机</label></div>'; const container = document.querySelector(".article-content, article"); if(container) container.appendChild(packing);
    }
});

FeaturePack.register('fp265_budget_tracker', {
    name: '预算追踪', desc: '旅行文章显示预算花费追踪器', page: 'article',
    initFn() {
        const budget = el("div",{padding:"15px",margin:"15px 0",background:"linear-gradient(135deg,#00b894,#00cec9)",color:"#fff",borderRadius:"12px"}); budget.innerHTML = '<h4>💰 预算追踪</h4><div style="margin-top:10px"><div style="display:flex;justify-content:space-between"><span>住宿</span><span>¥800/¥1000</span></div><div style="width:100%;height:8px;background:rgba(255,255,255,0.3);border-radius:4px;margin:5px 0"><div style="width:80%;height:100%;background:#fff;border-radius:4px"></div></div><div style="display:flex;justify-content:space-between"><span>餐饮</span><span>¥300/¥500</span></div><div style="width:100%;height:8px;background:rgba(255,255,255,0.3);border-radius:4px;margin:5px 0"><div style="width:60%;height:100%;background:#fff;border-radius:4px"></div></div></div>'; const container = document.querySelector(".article-content, article"); if(container) container.appendChild(budget);
    }
});
