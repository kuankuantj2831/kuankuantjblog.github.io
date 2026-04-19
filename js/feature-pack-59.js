import FeaturePack from './feature-pack-core.js?v=20260419a';
const { util } = FeaturePack;
const el = util.el;

/**
 * 功能包 #59: 区块链与Web3 (291-295)
 */
FeaturePack.register('fp291_wallet_connect', {
    name: '钱包连接', desc: '模拟Web3钱包连接按钮', page: 'profile',
    initFn() {
        const wallet = el("div",{marginTop:"15px",padding:"12px",background:"linear-gradient(135deg,#f7931a,#f9a825)",color:"#fff",borderRadius:"8px",textAlign:"center",cursor:"pointer"}); wallet.textContent = "🔗 连接钱包"; wallet.onclick = () => { alert("🔗 钱包已连接\n\n地址: 0x71C...9A3E\n余额: 1.5 ETH"); wallet.textContent = "✓ 已连接"; }; const container = document.querySelector(".profile-container"); if(container) container.appendChild(wallet);
    }
});

FeaturePack.register('fp292_nft_avatar', {
    name: 'NFT头像', desc: '个人资料展示NFT风格头像框', page: 'profile',
    initFn() {
        document.querySelectorAll(".profile-avatar, .user-avatar").forEach(av => { av.style.border = "3px solid transparent"; av.style.borderImage = "linear-gradient(135deg,#f7931a,#e91e63,#9c27b0) 1"; av.style.animation = "rainbow 3s linear infinite"; const rs = document.createElement("style"); rs.textContent = "@keyframes rainbow{0%{filter:hue-rotate(0)}100%{filter:hue-rotate(360deg)}}"; document.head.appendChild(rs); });
    }
});

FeaturePack.register('fp293_token_reward', {
    name: '代币奖励', desc: '阅读文章获得虚拟代币奖励', page: 'article',
    initFn() {
        const reward = el("div",{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",padding:"20px",background:"#fff",borderRadius:"16px",boxShadow:"0 20px 60px rgba(0,0,0,0.2)",zIndex:"10000",textAlign:"center",display:"none"}); reward.innerHTML = '<div style="font-size:48px">🪙</div><div style="margin-top:10px;font-size:18px">+5 阅读代币</div><div style="margin-top:5px;font-size:12px;color:#666">已存入你的钱包</div>'; document.body.appendChild(reward); setTimeout(()=>{ reward.style.display = "block"; setTimeout(()=>reward.remove(), 3000); }, 5000);
    }
});

FeaturePack.register('fp294_blockchain_verify', {
    name: '链上验证', desc: '文章底部显示区块链存证标识', page: 'article',
    initFn() {
        const verify = el("div",{padding:"10px",margin:"15px 0",background:"#f8f9fa",borderRadius:"8px",display:"flex",alignItems:"center",gap:"10px",fontSize:"12px",color:"#666"}); verify.innerHTML = '<span style="font-size:20px">⛓️</span><div><div style="color:#4ecdc4;font-weight:bold">✓ 链上存证</div><div>哈希: 0x7a3f...9e2d</div></div>'; const container = document.querySelector(".article-content, article"); if(container) container.appendChild(verify);
    }
});

FeaturePack.register('fp295_dao_vote', {
    name: 'DAO投票', desc: '社区文章添加去中心化投票功能', page: 'article',
    initFn() {
        const dao = el("div",{padding:"15px",margin:"15px 0",background:"linear-gradient(135deg,#9c27b0,#e91e63)",color:"#fff",borderRadius:"12px"}); dao.innerHTML = '<h4>🗳️ 社区投票</h4><p style="font-size:13px;margin:8px 0">这篇文章是否对你有帮助?</p><div style="display:flex;gap:10px"><button style="flex:1;padding:8px;background:rgba(255,255,255,0.2);border:none;border-radius:8px;color:#fff;cursor:pointer">👍 赞成 (128)</button><button style="flex:1;padding:8px;background:rgba(255,255,255,0.2);border:none;border-radius:8px;color:#fff;cursor:pointer">👎 反对 (5)</button></div>'; const container = document.querySelector(".article-content, article"); if(container) container.appendChild(dao);
    }
});
