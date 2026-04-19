import FeaturePack from './feature-pack-core.js?v=20260419a';
const { util } = FeaturePack;
const el = util.el;

/**
 * 功能包 #54: 职业与发展 (266-270)
 */
FeaturePack.register('fp266_skill_tree', {
    name: '技能树', desc: '个人资料页展示技能成长树状图', page: 'profile',
    initFn() {
        const tree = el("div",{marginTop:"20px",padding:"20px",background:"#f8f9fa",borderRadius:"12px"}); tree.innerHTML = '<h3>🌳 技能树</h3><div style="margin-top:15px"><div style="display:flex;align-items:center;margin-bottom:10px"><span style="width:80px;font-size:12px">前端</span><div style="flex:1;height:20px;background:#eee;border-radius:10px;overflow:hidden"><div style="width:85%;height:100%;background:linear-gradient(90deg,#667eea,#764ba2);border-radius:10px"></div></div><span style="margin-left:10px;font-size:12px">85%</span></div><div style="display:flex;align-items:center;margin-bottom:10px"><span style="width:80px;font-size:12px">后端</span><div style="flex:1;height:20px;background:#eee;border-radius:10px;overflow:hidden"><div style="width:70%;height:100%;background:linear-gradient(90deg,#4ecdc4,#44a3aa);border-radius:10px"></div></div><span style="margin-left:10px;font-size:12px">70%</span></div><div style="display:flex;align-items:center"><span style="width:80px;font-size:12px">设计</span><div style="flex:1;height:20px;background:#eee;border-radius:10px;overflow:hidden"><div style="width:60%;height:100%;background:linear-gradient(90deg,#f9ca24,#f0932b);border-radius:10px"></div></div><span style="margin-left:10px;font-size:12px">60%</span></div></div>'; const container = document.querySelector(".profile-container"); if(container) container.appendChild(tree);
    }
});

FeaturePack.register('fp267_project_showcase', {
    name: '项目展示', desc: '以卡片轮播形式展示个人项目', page: 'profile',
    initFn() {
        const showcase = el("div",{marginTop:"20px",padding:"20px",background:"#f8f9fa",borderRadius:"12px"}); showcase.innerHTML = '<h3>📂 项目展示</h3><div style="display:flex;gap:10px;margin-top:10px;overflow-x:auto;padding:10px"><div style="min-width:150px;padding:15px;background:#fff;border-radius:8px;text-align:center"><div style="font-size:32px">🚀</div><div style="font-size:14px;margin-top:5px">个人博客</div><div style="font-size:11px;color:#666">Vue + Node.js</div></div><div style="min-width:150px;padding:15px;background:#fff;border-radius:8px;text-align:center"><div style="font-size:32px">📱</div><div style="font-size:14px;margin-top:5px">小程序</div><div style="font-size:11px;color:#666">微信小程序</div></div></div>'; const container = document.querySelector(".profile-container"); if(container) container.appendChild(showcase);
    }
});

FeaturePack.register('fp268_resume_builder', {
    name: '简历生成', desc: '一键将个人资料生成简历预览', page: 'profile',
    initFn() {
        const resumeBtn = el("div",{marginTop:"15px",padding:"12px",background:"#667eea",color:"#fff",borderRadius:"8px",textAlign:"center",cursor:"pointer"}); resumeBtn.textContent = "📄 生成简历预览"; resumeBtn.onclick = () => { alert("📄 简历预览模式已开启\n\n姓名: 博主\n技能: 前端/后端/设计\n项目: 3个\n经验: 5年"); }; const container = document.querySelector(".profile-container"); if(container) container.appendChild(resumeBtn);
    }
});

FeaturePack.register('fp269_interview_prep', {
    name: '面试准备', desc: '技术文章旁显示相关面试题提示', page: 'article',
    initFn() {
        const interview = el("div",{padding:"15px",margin:"15px 0",background:"#fff3cd",borderRadius:"12px",borderLeft:"4px solid #ffc107"}); interview.innerHTML = '<h4>💡 面试考点</h4><p style="font-size:13px;margin-top:5px">这篇文章涉及的核心概念常出现在面试中，建议重点掌握。</p>'; const container = document.querySelector(".article-content, article"); if(container) container.insertBefore(interview, container.firstChild);
    }
});

FeaturePack.register('fp270_goal_tracker', {
    name: '目标追踪', desc: '个人中心显示年度职业目标进度', page: 'profile',
    initFn() {
        const goals = el("div",{marginTop:"20px",padding:"20px",background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",borderRadius:"12px"}); goals.innerHTML = '<h3>🎯 2026年度目标</h3><div style="margin-top:15px"><div style="margin-bottom:15px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px"><span>发布50篇文章</span><span>32/50</span></div><div style="height:8px;background:rgba(255,255,255,0.3);border-radius:4px"><div style="width:64%;height:100%;background:#fff;border-radius:4px"></div></div></div><div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px"><span>获得1000个赞</span><span>856/1000</span></div><div style="height:8px;background:rgba(255,255,255,0.3);border-radius:4px"><div style="width:86%;height:100%;background:#fff;border-radius:4px"></div></div></div></div>'; const container = document.querySelector(".profile-container"); if(container) container.appendChild(goals);
    }
});
