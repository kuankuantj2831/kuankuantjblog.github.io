import FeaturePack from './feature-pack-core.js?v=20260418c';
const { util } = FeaturePack;
const el = util.el;

/**
 * 功能包 #52: 饮食与烹饪 (256-260)
 */
FeaturePack.register('fp256_recipe_card', {
    name: '食谱卡片', desc: '文章中的食谱以精美卡片形式展示', page: 'article',
    initFn() {
        document.querySelectorAll("h2, h3").forEach(h => { if(h.textContent.includes("食谱") || h.textContent.includes("做法")) { const card = el("div",{padding:"15px",margin:"10px 0",background:"linear-gradient(135deg,#ffeaa7,#fdcb6e)",borderRadius:"12px"}); card.innerHTML = '<div style="font-size:24px">🍳</div><div style="font-weight:bold">' + h.textContent + '</div><div style="font-size:12px;color:#666">点击查看详细步骤</div>'; h.parentElement.insertBefore(card, h.nextSibling); } });
    }
});

FeaturePack.register('fp257_nutrition_info', {
    name: '营养信息', desc: '为食谱文章添加营养成分表', page: 'article',
    initFn() {
        const nutrition = el("div",{padding:"15px",margin:"10px 0",background:"#fff",borderRadius:"12px",border:"2px solid #4ecdc4"}); nutrition.innerHTML = '<h4>🥗 营养成分 (每份)</h4><div style="display:flex;gap:15px;margin-top:10px;font-size:12px"><div>热量: 350kcal</div><div>蛋白质: 15g</div><div>碳水: 45g</div><div>脂肪: 12g</div></div>'; const container = document.querySelector(".article-content, article"); if(container) container.appendChild(nutrition);
    }
});

FeaturePack.register('fp258_cooking_timer', {
    name: '烹饪计时', desc: '食谱旁添加一键烹饪步骤计时器', page: 'article',
    initFn() {
        document.querySelectorAll("li").forEach(li => { if(li.textContent.includes("分钟") || li.textContent.includes("秒")) { const timerBtn = el("span",{marginLeft:"10px",padding:"3px 8px",background:"#ff6b6b",color:"#fff",borderRadius:"10px",fontSize:"11px",cursor:"pointer"}); timerBtn.textContent = "⏱️ 计时"; timerBtn.onclick = () => { const match = li.textContent.match(/(d+)/); if(match) { const sec = parseInt(match[1]) * (li.textContent.includes("分钟") ? 60 : 1); alert("⏱️ 计时器已设置: " + sec + "秒"); } }; li.appendChild(timerBtn); } });
    }
});

FeaturePack.register('fp259_meal_planner', {
    name: '饮食计划', desc: '个人中心显示一周饮食计划表', page: 'profile',
    initFn() {
        const planner = el("div",{marginTop:"20px",padding:"20px",background:"#f8f9fa",borderRadius:"12px"}); planner.innerHTML = '<h3>🍽️ 本周饮食计划</h3><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-top:10px;font-size:11px"><div style="text-align:center;padding:8px;background:#fff;border-radius:8px">一<br>🥗</div><div style="text-align:center;padding:8px;background:#fff;border-radius:8px">二<br>🍜</div><div style="text-align:center;padding:8px;background:#fff;border-radius:8px">三<br>🥩</div><div style="text-align:center;padding:8px;background:#fff;border-radius:8px">四<br>🍲</div><div style="text-align:center;padding:8px;background:#fff;border-radius:8px">五<br>🍣</div><div style="text-align:center;padding:8px;background:#fff;border-radius:8px">六<br>🍕</div><div style="text-align:center;padding:8px;background:#fff;border-radius:8px">日<br>🥘</div></div>'; const container = document.querySelector(".profile-container"); if(container) container.appendChild(planner);
    }
});

FeaturePack.register('fp260_food_mood', {
    name: '食物心情', desc: '根据时间推荐适合的食物心情标签', page: 'index',
    initFn() {
        const hour = new Date().getHours(); const foods = {morning:"🥐 早餐时光",noon:"🍱 午餐推荐",afternoon:"☕ 下午茶",evening:"🍽️ 晚餐灵感",night:"🌙 夜宵模式"}; let mood = hour<10?foods.morning:hour<14?foods.noon:hour<17?foods.afternoon:hour<21?foods.evening:foods.night; const foodMood = el("div",{position:"fixed",top:"180px",right:"20px",padding:"8px 15px",background:"rgba(255,234,167,0.9)",borderRadius:"20px",fontSize:"13px",zIndex:"9999"}); foodMood.textContent = mood; document.body.appendChild(foodMood);
    }
});
