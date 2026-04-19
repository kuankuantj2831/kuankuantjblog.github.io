import FeaturePack from './feature-pack-core.js?v=20260419a';
const { util } = FeaturePack;
const el = util.el;

/**
 * 功能包 #60: 元宇宙与虚拟 (296-300)
 */
FeaturePack.register('fp296_virtual_room', {
    name: '虚拟房间', desc: '个人资料页展示3D虚拟房间入口', page: 'profile',
    initFn() {
        const room = el("div",{marginTop:"20px",padding:"20px",background:"linear-gradient(135deg,#6c5ce7,#a29bfe)",color:"#fff",borderRadius:"12px",textAlign:"center",cursor:"pointer"}); room.innerHTML = '<div style="font-size:48px">🏠</div><div style="margin-top:10px;font-size:18px">进入我的虚拟空间</div><div style="margin-top:5px;font-size:12px;opacity:0.8">已装饰 12 件物品</div>'; room.onclick = () => alert("🌐 正在进入虚拟空间..."); const container = document.querySelector(".profile-container"); if(container) container.appendChild(room);
    }
});

FeaturePack.register('fp297_avatar_custom', {
    name: '虚拟形象', desc: '创建和展示可自定义的虚拟形象', page: 'profile',
    initFn() {
        const avatar3d = el("div",{marginTop:"20px",padding:"20px",background:"#f8f9fa",borderRadius:"12px",textAlign:"center"}); avatar3d.innerHTML = '<div style="font-size:60px">🧑‍🚀</div><div style="margin-top:10px">虚拟形象 Lv.3</div><div style="display:flex;justify-content:center;gap:10px;margin-top:10px"><span style="padding:5px 10px;background:#667eea;color:#fff;border-radius:15px;font-size:11px">头盔</span><span style="padding:5px 10px;background:#4ecdc4;color:#fff;border-radius:15px;font-size:11px">宇航服</span></div>'; const container = document.querySelector(".profile-container"); if(container) container.appendChild(avatar3d);
    }
});

FeaturePack.register('fp298_vr_preview', {
    name: 'VR预览', desc: '文章图片添加VR全景预览模式', page: 'article',
    initFn() {
        document.querySelectorAll("img").forEach(img => { if(img.naturalWidth > 400) { const vr = el("div",{position:"absolute",top:"10px",right:"10px",padding:"5px 10px",background:"rgba(108,92,231,0.9)",color:"#fff",borderRadius:"8px",fontSize:"11px",cursor:"pointer",zIndex:"10"}); vr.textContent = "🥽 VR"; img.parentElement.style.position = "relative"; img.parentElement.appendChild(vr); } });
    }
});

FeaturePack.register('fp299_metaverse_portal', {
    name: '元宇宙传送', desc: '页面角落显示元宇宙世界传送门',
    initFn() {
        const portal = el("div",{position:"fixed",bottom:"20px",left:"50%",transform:"translateX(-50%)",width:"60px",height:"60px",borderRadius:"50%",background:"conic-gradient(from 0deg,#6c5ce7,#fd79a8,#feca57,#6c5ce7)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",zIndex:"9999",boxShadow:"0 0 30px rgba(108,92,231,0.5)",animation:"spin 3s linear infinite"}); portal.innerHTML = '<div style="width:50px;height:50px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:24px">🌌</div>'; portal.onclick = () => alert("🌌 正在打开元宇宙传送门..."); document.body.appendChild(portal);
    }
});

FeaturePack.register('fp300_digital_twin', {
    name: '数字孪生', desc: '展示用户在虚拟世界的数字分身状态', page: 'profile',
    initFn() {
        const twin = el("div",{marginTop:"20px",padding:"20px",background:"linear-gradient(135deg,#2d3436,#636e72)",color:"#fff",borderRadius:"12px"}); twin.innerHTML = '<h3>🤖 数字孪生</h3><div style="display:flex;gap:15px;margin-top:15px"><div style="text-align:center"><div style="font-size:32px">⚡</div><div style="font-size:12px">能量 85%</div></div><div style="text-align:center"><div style="font-size:32px">🎯</div><div style="font-size:12px">专注 72%</div></div><div style="text-align:center"><div style="font-size:32px">😊</div><div style="font-size:12px">心情 90%</div></div></div><div style="margin-top:10px;font-size:12px;opacity:0.7">最后更新: 刚刚</div>'; const container = document.querySelector(".profile-container"); if(container) container.appendChild(twin);
    }
});
