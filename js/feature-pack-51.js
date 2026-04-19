import FeaturePack from './feature-pack-core.js?v=20260419a';
const { util } = FeaturePack;
const el = util.el;

/**
 * 功能包 #51: 购物与收藏 (251-255)
 */
FeaturePack.register('fp251_wishlist', {
    name: '愿望清单', desc: '用户可以创建文章收藏愿望清单', page: 'index',
    initFn() {
        const wishBtn = el("div",{position:"fixed",bottom:"20px",left:"80px",padding:"10px",background:"#ff6b6b",color:"#fff",borderRadius:"50%",cursor:"pointer",zIndex:"9999",fontSize:"20px",boxShadow:"0 4px 15px rgba(255,107,107,0.4)"}); wishBtn.textContent = "🛒"; let wishCount = parseInt(localStorage.getItem("wishlist_count") || "0"); wishBtn.title = "愿望清单: " + wishCount + "项"; wishBtn.onclick = () => { const list = JSON.parse(localStorage.getItem("wishlist") || "[]"); alert("🛒 愿望清单\n" + (list.length ? list.join("\n") : "暂无项目")); }; document.body.appendChild(wishBtn);
    }
});

FeaturePack.register('fp252_price_tracker', {
    name: '价格追踪', desc: '模拟追踪收藏内容的价格变化', page: 'index',
    initFn() {
        const tracker = el("div",{position:"fixed",top:"200px",right:"20px",padding:"10px",background:"#fff",borderRadius:"12px",boxShadow:"0 2px 10px rgba(0,0,0,0.1)",fontSize:"12px",zIndex:"9999",display:"none"}); tracker.textContent = "📉 价格变动提醒"; document.body.appendChild(tracker); setTimeout(()=>tracker.style.display="block", 8000);
    }
});

FeaturePack.register('fp253_collection_folder', {
    name: '收藏夹', desc: '创建多个收藏夹分类管理文章',
    initFn() {
        const folder = el("div",{position:"fixed",bottom:"20px",left:"140px",padding:"10px",background:"#f9ca24",color:"#fff",borderRadius:"50%",cursor:"pointer",zIndex:"9999",fontSize:"20px",boxShadow:"0 4px 15px rgba(249,202,36,0.4)"}); folder.textContent = "📁"; folder.onclick = () => { const folders = ["技术","生活","旅行"]; const choice = prompt("选择收藏夹: " + folders.join(", ")); if(choice) alert("✓ 已添加到 [" + choice + "]"); }; document.body.appendChild(folder);
    }
});

FeaturePack.register('fp254_compare_tool', {
    name: '对比工具', desc: '可以对比两篇文章的内容差异', page: 'article',
    initFn() {
        const compare = el("div",{padding:"10px 15px",background:"#667eea",color:"#fff",borderRadius:"8px",cursor:"pointer",display:"inline-block",marginTop:"10px"}); compare.textContent = "📊 对比文章"; compare.onclick = () => { alert("📊 对比模式: 选择另一篇文章进行对比"); }; const container = document.querySelector(".article-actions, .article-meta"); if(container) container.appendChild(compare);
    }
});

FeaturePack.register('fp255_recommendation', {
    name: '智能推荐', desc: '根据阅读历史推荐相似文章', page: 'index',
    initFn() {
        const rec = el("div",{padding:"20px",margin:"20px",background:"#f8f9fa",borderRadius:"12px"}); rec.innerHTML = '<h3>🤖 为你推荐</h3><div style="margin-top:10px"><div style="padding:10px;background:#fff;border-radius:8px;margin-bottom:8px">📄 基于你的阅读: 《Vue.js进阶指南》</div><div style="padding:10px;background:#fff;border-radius:8px">📄 热门相似: 《React最佳实践》</div></div>'; const container = document.querySelector(".chinese-style-wrapper"); if(container) container.appendChild(rec);
    }
});
