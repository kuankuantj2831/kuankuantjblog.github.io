import FeaturePack from './feature-pack-core.js?v=20260418c';
const { util } = FeaturePack;
const el = util.el;

/**
 * 功能包 #57: 环保与可持续 (281-285)
 */
FeaturePack.register('fp281_carbon_footprint', {
    name: '碳足迹', desc: '显示阅读博客产生的虚拟碳排放抵消', page: 'index',
    initFn() {
        const carbon = el("div",{padding:"15px",margin:"20px",background:"linear-gradient(135deg,#00b894,#00cec9)",color:"#fff",borderRadius:"12px",display:"flex",alignItems:"center",gap:"15px"}); carbon.innerHTML = '<span style="font-size:32px">🌱</span><div><div style="font-weight:bold">已抵消 0.5kg CO₂</div><div style="font-size:12px;opacity:0.8">通过绿色服务器托管</div></div>'; const container = document.querySelector(".chinese-style-wrapper"); if(container) container.insertBefore(carbon, container.children[2]);
    }
});

FeaturePack.register('fp282_green_tip', {
    name: '环保贴士', desc: '页面角落随机显示环保小知识',
    initFn() {
        const tips = ["💡 关闭不用的标签页可节省电量","💡 使用深色模式可减少屏幕能耗","💡 数字阅读比纸质阅读更环保"]; const tip = el("div",{position:"fixed",bottom:"70px",left:"50%",transform:"translateX(-50%)",padding:"8px 15px",background:"rgba(0,184,148,0.9)",color:"#fff",borderRadius:"20px",fontSize:"12px",zIndex:"9999",display:"none"}); tip.textContent = tips[0]; document.body.appendChild(tip); setInterval(()=>{ tip.style.display = "block"; tip.textContent = tips[Math.floor(Math.random()*tips.length)]; setTimeout(()=>tip.style.display="none", 5000); }, 30000);
    }
});

FeaturePack.register('fp283_tree_plant', {
    name: '种树计划', desc: '模拟每阅读10篇文章种一棵树', page: 'index',
    initFn() {
        const tree = el("div",{padding:"15px",margin:"20px",background:"#e8f5e9",borderRadius:"12px",textAlign:"center"}); const articles = parseInt(localStorage.getItem("articles_read") || "0"); const trees = Math.floor(articles / 10); tree.innerHTML = '<div style="font-size:40px">🌳</div><div style="margin-top:10px">你已贡献 ' + trees + ' 棵虚拟树</div><div style="font-size:12px;color:#666;margin-top:5px">再读 ' + (10 - articles%10) + ' 篇多种一棵</div>'; const container = document.querySelector(".chinese-style-wrapper"); if(container) container.insertBefore(tree, container.children[2]);
    }
});

FeaturePack.register('fp284_dark_mode_eco', {
    name: '节能模式', desc: '深色模式下显示节能百分比',
    initFn() {
        if(document.body.classList.contains("dark") || document.querySelector("[data-theme=dark]")) { const eco = el("div",{position:"fixed",top:"260px",right:"20px",padding:"8px 12px",background:"rgba(0,0,0,0.7)",color:"#4ecdc4",borderRadius:"12px",fontSize:"11px",zIndex:"9999"}); eco.textContent = "⚡ 节能 47%"; document.body.appendChild(eco); }
    }
});

FeaturePack.register('fp285_paper_saved', {
    name: '纸张节省', desc: '统计数字阅读替代纸质阅读节省的纸张', page: 'index',
    initFn() {
        const paper = el("div",{position:"fixed",bottom:"80px",left:"20px",padding:"8px 12px",background:"#fff",borderRadius:"12px",boxShadow:"0 2px 10px rgba(0,0,0,0.1)",fontSize:"11px",zIndex:"9999"}); const saved = (parseInt(localStorage.getItem("articles_read") || "0") * 3).toFixed(1); paper.textContent = "📄 已节省 " + saved + " 张纸"; document.body.appendChild(paper);
    }
});
