import { API_BASE_URL } from './api-config.js?v=20260419b';

function escapeHtml(s) { if (!s||typeof s!=='string') return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function esc(s) { return escapeHtml(s); }

class GameCenter {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = null;
        try { const u = localStorage.getItem('user'); if (u) this.user = JSON.parse(u); } catch(_) {}
        this.overview = null;
        this.currentTab = 'overview';
    }

    async init() {
        if (!this.token || !this.user) {
            this.showLoginPrompt();
            return;
        }
        this.renderShell();
        this.bindShellEvents();
        await this.loadOverview();
        this.switchTab('overview');
    }

    showLoginPrompt() {
        const app = document.getElementById('app');
        if (!app) return;
        app.innerHTML = `<div class="gc-login-prompt"><div class="gc-login-box"><h2>🎮 游戏中心</h2><p>请先登录后开始游戏</p><a href="/index-chinese.html" class="gc-btn gc-btn-primary">返回首页登录</a></div></div>`;
    }

    renderShell() {
        const app = document.getElementById('app');
        if (!app) return;
        const tabs = [
            { id: 'overview', icon: '🏠', label: '总览' },
            { id: 'pet', icon: '🐾', label: '宠物' },
            { id: 'lottery', icon: '🎰', label: '抽奖' },
            { id: 'achievements', icon: '🏆', label: '成就' },
            { id: 'tasks', icon: '📋', label: '任务' },
            { id: 'riddle', icon: '🧠', label: '猜谜' },
            { id: 'pk', icon: '⚔️', label: 'PK' },
            { id: 'gifts', icon: '🎁', label: '礼物' },
            { id: 'leaderboard', icon: '📊', label: '排行' },
            { id: 'redeem', icon: '🥚', label: '兑换码' },
            { id: 'chat', icon: '💬', label: '聊天室' },
            { id: 'clan', icon: '🛡️', label: '部落' },
            { id: 'forum', icon: '📰', label: '论坛' },
            { id: 'cosmetics', icon: '👗', label: '装扮' },
            { id: 'events', icon: '🎪', label: '活动' },
            { id: 'stocks', icon: '📈', label: '股市' },
            { id: 'minigames', icon: '🕹️', label: '小游戏' },
            { id: 'fishing', icon: '🎣', label: '钓鱼' },
            { id: 'farm', icon: '🌾', label: '农场' },
            { id: 'adventure', icon: '🗺️', label: '冒险' },
            { id: 'petbattle', icon: '⚔️', label: '宠物战' },
            { id: 'marriage', icon: '💍', label: '婚姻' },
            { id: 'mentorship', icon: '📜', label: '师徒' },
            { id: 'scratch', icon: '🃏', label: '刮刮乐' },
            { id: 'dice', icon: '🎲', label: '骰子' },
            { id: 'luckynum', icon: '🍀', label: '幸运数' },
            { id: 'fortune', icon: '🔮', label: '运势' },
        ];
        app.innerHTML = `
            <div class="gc-wrapper">
                <a href="/index-chinese.html" class="gc-back">← 返回</a>
                <h1 class="gc-title">🎮 游戏中心</h1>
                <div class="gc-balance-bar" id="gcBalanceBar">💰 加载中...</div>
                <div class="gc-tabs" id="gcTabs">${tabs.map(t => `<button class="gc-tab${t.id==='overview'?' active':''}" data-tab="${t.id}">${t.icon} ${t.label}</button>`).join('')}</div>
                <div class="gc-content" id="gcContent"></div>
            </div>`;
    }

    bindShellEvents() {
        document.getElementById('gcTabs')?.addEventListener('click', e => {
            const btn = e.target.closest('.gc-tab');
            if (!btn) return;
            this.switchTab(btn.dataset.tab);
        });
    }

    switchTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('.gc-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
        const content = document.getElementById('gcContent');
        if (!content) return;
        content.innerHTML = '<div class="gc-loading">加载中...</div>';
        const loaders = {
            overview: () => this.renderOverview(),
            pet: () => this.renderPet(),
            lottery: () => this.renderLottery(),
            achievements: () => this.renderAchievements(),
            tasks: () => this.renderTasks(),
            riddle: () => this.renderRiddle(),
            pk: () => this.renderPK(),
            gifts: () => this.renderGifts(),
            leaderboard: () => this.renderLeaderboard(),
            redeem: () => this.renderRedeem(),
            chat: () => this.renderChat(),
            clan: () => this.renderClan(),
            forum: () => this.renderForum(),
            cosmetics: () => this.renderCosmetics(),
            events: () => this.renderEvents(),
            stocks: () => this.renderStocks(),
            minigames: () => this.renderMinigames(),
            fishing: () => this.renderFishing(),
            farm: () => this.renderFarm(),
            adventure: () => this.renderAdventure(),
            petbattle: () => this.renderPetBattle(),
            marriage: () => this.renderMarriage(),
            mentorship: () => this.renderMentorship(),
            scratch: () => this.renderScratch(),
            dice: () => this.renderDice(),
            luckynum: () => this.renderLuckyNum(),
            fortune: () => this.renderFortune(),
        };
        (loaders[tab] || loaders.overview)();
    }

    updateBalanceBar() {
        const bar = document.getElementById('gcBalanceBar');
        if (!bar || !this.overview) return;
        const o = this.overview;
        bar.innerHTML = `💰 ${o.balance} 硬币 &nbsp;|&nbsp; ⭐ Lv.${o.level.level} &nbsp;|&nbsp; 🏆 ${o.achievementsCount} 成就 &nbsp;|&nbsp; 🐾 ${o.pet ? esc(o.pet.name) + ' Lv.' + o.pet.level : '未领养'}`;
    }

    async api(path, opts = {}) {
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` };
        const res = await fetch(`${API_BASE_URL}/game-center${path}`, { ...opts, headers: { ...headers, ...opts.headers } });
        return res.json();
    }

    async loadOverview() {
        try { this.overview = await this.api('/overview'); this.updateBalanceBar(); } catch(e) { console.error(e); }
    }

    async renderOverview() {
        const c = document.getElementById('gcContent');
        if (!c) return;
        await this.loadOverview();
        const o = this.overview || {};
        c.innerHTML = `
        <div class="gc-overview">
            <div class="gc-stats-grid">
                <div class="gc-stat-card"><div class="gc-stat-icon">💰</div><div class="gc-stat-value">${o.balance||0}</div><div class="gc-stat-label">硬币</div></div>
                <div class="gc-stat-card"><div class="gc-stat-icon">⭐</div><div class="gc-stat-value">Lv.${o.level?.level||1}</div><div class="gc-stat-label">等级</div></div>
                <div class="gc-stat-card"><div class="gc-stat-icon">🔥</div><div class="gc-stat-value">${o.checkinStreak||0}</div><div class="gc-stat-label">连续签到</div></div>
                <div class="gc-stat-card"><div class="gc-stat-icon">🏆</div><div class="gc-stat-value">${o.achievementsCount||0}</div><div class="gc-stat-label">成就</div></div>
            </div>
            <div class="gc-quick-actions">
                <h3>🎮 快速开始</h3>
                <div class="gc-quick-grid">
                    <button class="gc-quick-btn" onclick="window.gameCenter.switchTab('pet')">🐾 宠物乐园</button>
                    <button class="gc-quick-btn" onclick="window.gameCenter.switchTab('lottery')">🎰 幸运转盘</button>
                    <button class="gc-quick-btn" onclick="window.gameCenter.switchTab('riddle')">🧠 猜谜赢币</button>
                    <button class="gc-quick-btn" onclick="window.gameCenter.switchTab('pk')">⚔️ PK对战</button>
                    <button class="gc-quick-btn" onclick="window.gameCenter.switchTab('gifts')">🎁 送礼物</button>
                    <button class="gc-quick-btn" onclick="window.gameCenter.switchTab('redeem')">🥚 兑换码</button>
                </div>
            </div>
            ${o.pet ? `<div class="gc-pet-preview"><h3>🐾 我的宠物</h3><div class="gc-pet-display"><span class="gc-pet-emoji">${this.getSpeciesEmoji(o.pet.species)}</span><span>${esc(o.pet.name)} Lv.${o.pet.level}</span></div></div>` : '<div class="gc-adopt-hint"><p>还没有宠物？去 <button class="gc-link-btn" onclick="window.gameCenter.switchTab(\'pet\')">领养一只</button> 吧！</p></div>'}
            <div class="gc-daily-progress"><h3>📋 今日任务</h3><div class="gc-progress-bar"><div class="gc-progress-fill" style="width:${o.dailyTasks?.total?((o.dailyTasks.done||0)/(o.dailyTasks.total)*100):0}%"></div></div><span>${o.dailyTasks?.done||0}/${o.dailyTasks?.total||0}</span></div>
            ${o.equippedTitle ? `<div class="gc-equipped-title">当前头衔：<span class="gc-title-badge">${esc(o.equippedTitle)}</span></div>` : ''}
        </div>`;
    }

    getSpeciesEmoji(s) { return {cat:'🐱',dog:'🐕',dragon:'🐉',phoenix:'🦅',rabbit:'🐰',fox:'🦊'}[s]||'🐱'; }

    // === 宠物 ===
    async renderPet() {
        const c = document.getElementById('gcContent');
        try {
            const data = await this.api('/pet');
            if (!data.pet) {
                c.innerHTML = `<div class="gc-adopt"><h2>🐾 领养宠物</h2><p>选择你的伙伴，开始冒险吧！</p>
                    <div class="gc-species-grid">
                        ${[{s:'cat',e:'🐱',n:'猫咪'},{s:'dog',e:'🐕',n:'狗狗'},{s:'dragon',e:'🐉',n:'小龙'},{s:'phoenix',e:'🦅',n:'凤凰'},{s:'rabbit',e:'🐰',n:'兔兔'},{s:'fox',e:'🦊',n:'狐狸'}]
                        .map(x=>`<button class="gc-species-btn" data-species="${x.s}">${x.e}<br>${x.n}</button>`).join('')}
                    </div>
                    <div class="gc-adopt-form"><label>起个名字：<input id="gcPetName" maxlength="20" placeholder="小猫咪" class="gc-input"></label><button id="gcAdoptBtn" class="gc-btn gc-btn-primary">领养！</button></div>
                </div>`;
                c.querySelectorAll('.gc-species-btn').forEach(b => b.addEventListener('click', () => { c.querySelectorAll('.gc-species-btn').forEach(x=>x.classList.remove('selected')); b.classList.add('selected'); this._selectedSpecies = b.dataset.species; }));
                document.getElementById('gcAdoptBtn')?.addEventListener('click', async () => {
                    const name = document.getElementById('gcPetName')?.value || '';
                    const res = await this.api('/pet/adopt', { method:'POST', body: JSON.stringify({ name, species: this._selectedSpecies || 'cat' }) });
                    if (res.message) { this.toast(res.message); this.switchTab('pet'); }
                });
                return;
            }
            const pet = data.pet;
            const items = data.items || [];
            c.innerHTML = `<div class="gc-pet-page">
                <div class="gc-pet-main">
                    <div class="gc-pet-avatar">${this.getSpeciesEmoji(pet.species)}<div class="gc-pet-accessory">${esc(pet.accessory||'')}</div></div>
                    <h2>${esc(pet.name)} <small>Lv.${pet.level}</small></h2>
                    <div class="gc-pet-exp"><div class="gc-progress-bar"><div class="gc-progress-fill" style="width:${pet.level>=15?100:(pet.exp%100)}%"></div></div><small>EXP ${pet.exp}</small></div>
                    <div class="gc-pet-stats">
                        <div class="gc-pet-stat">😊 心情<div class="gc-bar"><div class="gc-bar-fill" style="width:${pet.mood}%;background:#ff6b6b"></div></div>${pet.mood}%</div>
                        <div class="gc-pet-stat">🍖 饱腹<div class="gc-bar"><div class="gc-bar-fill" style="width:${pet.hunger}%;background:#ffa502"></div></div>${pet.hunger}%</div>
                        <div class="gc-pet-stat">🧼 清洁<div class="gc-bar"><div class="gc-bar-fill" style="width:${pet.cleanliness}%;background:#2ed573"></div></div>${pet.cleanliness}%</div>
                    </div>
                    <div class="gc-pet-actions">
                        <button class="gc-btn" id="gcFeedBtn">🍖 喂食</button>
                        <button class="gc-btn" id="gcPlayBtn">🧶 玩耍</button>
                        <button class="gc-btn" id="gcCleanBtn">🧼 清洗</button>
                        <button class="gc-btn" id="gcShopBtn">🛒 商店</button>
                    </div>
                </div>
                <div class="gc-pet-items" id="gcPetItems">
                    <h3>🎒 背包</h3>
                    ${items.length ? items.map(i=>`<div class="gc-item-slot">${i.emoji||''} ${esc(i.name)} x${i.quantity} <button class="gc-btn-sm" data-use="${i.id}" data-type="${i.type}">使用</button></div>`).join('') : '<p class="gc-empty">背包空空，去商店看看吧</p>'}
                </div>
                <div class="gc-shop-panel" id="gcShopPanel" style="display:none"></div>
            </div>`;
            document.getElementById('gcFeedBtn')?.addEventListener('click', () => this.showItemPicker('food', 'feed'));
            document.getElementById('gcPlayBtn')?.addEventListener('click', () => this.petAction('/pet/play'));
            document.getElementById('gcCleanBtn')?.addEventListener('click', () => this.petAction('/pet/clean'));
            document.getElementById('gcShopBtn')?.addEventListener('click', () => this.toggleShop());
            c.querySelectorAll('[data-use]').forEach(b => b.addEventListener('click', () => {
                const type = b.dataset.type;
                const path = type==='food' ? '/pet/feed' : type==='toy' ? '/pet/play' : type==='clean' ? '/pet/clean' : null;
                if (path) this.petAction(path, parseInt(b.dataset.use));
            }));
        } catch(e) { c.innerHTML = '<p class="gc-error">加载失败</p>'; console.error(e); }
    }

    async petAction(path, itemId) {
        const body = itemId ? { itemId } : {};
        const res = await this.api(path, { method:'POST', body: JSON.stringify(body) });
        this.toast(res.message || '操作完成');
        if (res.leveledUp) this.toast('🎉 宠物升级了！');
        this.switchTab('pet');
    }

    showItemPicker(type, action) {
        this.petAction(action === 'feed' ? '/pet/feed' : '/pet/clean');
    }

    async toggleShop() {
        const panel = document.getElementById('gcShopPanel');
        if (!panel) return;
        if (panel.style.display !== 'none') { panel.style.display = 'none'; return; }
        panel.style.display = 'block';
        panel.innerHTML = '<p>加载商品...</p>';
        const data = await this.api('/shop');
        const items = (data.items || []).filter(i => i.type !== 'accessory');
        panel.innerHTML = `<h3>🛒 宠物商店</h3><div class="gc-shop-grid">${items.map(i=>`<div class="gc-shop-item"><span class="gc-shop-emoji">${i.emoji||''}</span><span>${esc(i.name)}</span><small>${i.type==='food'?'饱腹+'+i.effect_hunger:i.type==='toy'?'心情+'+i.effect_mood:'清洁+'+i.effect_clean}</small><button class="gc-btn-sm gc-buy-btn" data-id="${i.id}">${i.price}🪙</button></div>`).join('')}</div>`;
        panel.querySelectorAll('.gc-buy-btn').forEach(b => b.addEventListener('click', async () => {
            const res = await this.api('/shop/buy', { method:'POST', body: JSON.stringify({ itemId: parseInt(b.dataset.id), quantity: 1 }) });
            this.toast(res.message || '购买失败');
            this.switchTab('pet');
        }));
    }

    // === 抽奖 ===
    async renderLottery() {
        const c = document.getElementById('gcContent');
        try {
            const data = await this.api('/lottery/info');
            c.innerHTML = `<div class="gc-lottery">
                <div class="gc-lottery-wheel" id="gcWheel">
                    <div class="gc-wheel-inner">🎰</div>
                    <div class="gc-wheel-prizes">${(data.prizes||[]).map(p=>`<div class="gc-prize-slot">${p.emoji} ${esc(p.name)}</div>`).join('')}</div>
                </div>
                <div class="gc-lottery-info">
                    <p>每次消耗 <strong>${data.cost||5}</strong> 🪙 | 余额: <strong>${data.balance||0}</strong> 🪙 | 已抽: ${data.totalDraws||0}次</p>
                    <button id="gcDrawBtn" class="gc-btn gc-btn-primary gc-btn-lg">🎲 抽一次！</button>
                </div>
                <div id="gcLotteryResult"></div>
                <div class="gc-lottery-records" id="gcLotteryRecords"></div>
            </div>`;
            document.getElementById('gcDrawBtn')?.addEventListener('click', async () => {
                const btn = document.getElementById('gcDrawBtn');
                if (btn.disabled) return;
                btn.disabled = true;
                btn.textContent = '抽奖中...';
                const res = await this.api('/lottery/draw', { method:'POST' });
                btn.disabled = false;
                btn.textContent = '🎲 抽一次！';
                if (res.prize) {
                    document.getElementById('gcLotteryResult').innerHTML = `<div class="gc-prize-result gc-animate-pop">${res.prize.emoji} <strong>${esc(res.prize.name)}</strong></div>`;
                    this.toast(`🎉 恭喜获得 ${res.prize.emoji} ${res.prize.name}！`);
                    await this.loadOverview();
                    this.updateBalanceBar();
                } else {
                    this.toast(res.message || '抽奖失败');
                }
            });
        } catch(e) { c.innerHTML = '<p class="gc-error">加载失败</p>'; }
    }

    // === 成就 ===
    async renderAchievements() {
        const c = document.getElementById('gcContent');
        try {
            const data = await this.api('/achievements');
            const achs = data.achievements || [];
            const stats = data.stats || {};
            c.innerHTML = `<div class="gc-achievements">
                <div class="gc-ach-stats">🏆 ${stats.unlocked||0}/${stats.total||0} 已解锁</div>
                <div class="gc-ach-grid">${achs.map(a=>`<div class="gc-ach-card${a.unlocked?' unlocked':' locked'}">
                    <div class="gc-ach-icon">${a.icon}</div>
                    <div class="gc-ach-info"><div class="gc-ach-name">${esc(a.name)}</div><div class="gc-ach-desc">${esc(a.description||'')}</div>
                    ${a.unlocked ? `<button class="gc-btn-sm gc-claim-btn" data-id="${a.id}">领取奖励</button>` : `<small class="gc-ach-locked-text">🔒 未解锁</small>`}
                    </div></div>`).join('')}</div>
            </div>`;
            c.querySelectorAll('.gc-claim-btn').forEach(b => b.addEventListener('click', async () => {
                const res = await this.api('/achievements/claim', { method:'POST', body: JSON.stringify({ achievementId: parseInt(b.dataset.id) }) });
                this.toast(res.message || '领取失败');
                this.renderAchievements();
            }));
        } catch(e) { c.innerHTML = '<p class="gc-error">加载失败</p>'; }
    }

    // === 任务 ===
    async renderTasks() {
        const c = document.getElementById('gcContent');
        try {
            const [taskData, challengeData] = await Promise.all([this.api('/daily-tasks'), this.api('/challenges')]);
            c.innerHTML = `<div class="gc-tasks">
                <h3>📋 每日任务</h3>
                <div class="gc-task-list">${(taskData.tasks||[]).map(t=>`<div class="gc-task-item${t.completed?' completed':''}">
                    <span>${esc(t.title)}</span><small>${esc(t.description||'')}</small>
                    <span class="gc-task-reward">+${t.reward}🪙</span>
                    ${t.completed && !t.claimed ? `<button class="gc-btn-sm gc-claim-task" data-id="${t.id}">领取</button>` : t.claimed ? '<span class="gc-claimed">✅</span>' : ''}
                </div>`).join('')}</div>
                <h3>🎯 挑战任务</h3>
                <div class="gc-task-list">${(challengeData.challenges||[]).map(ch=>`<div class="gc-task-item${ch.completed?' completed':''}">
                    <span>${esc(ch.title)}</span><small>${esc(ch.description||'')}</small>
                    <span class="gc-task-reward">+${ch.reward_coins}🪙 +${ch.reward_exp}EXP</span>
                    ${ch.completed && !ch.claimed ? `<button class="gc-btn-sm gc-claim-challenge" data-id="${ch.id}">领取</button>` : ch.claimed ? '<span class="gc-claimed">✅</span>' : ''}
                </div>`).join('')}</div>
            </div>`;
            c.querySelectorAll('.gc-claim-task').forEach(b => b.addEventListener('click', async () => {
                const res = await this.api('/daily-tasks/claim', { method:'POST', body: JSON.stringify({ taskId: parseInt(b.dataset.id) }) });
                this.toast(res.message); this.renderTasks();
            }));
            c.querySelectorAll('.gc-claim-challenge').forEach(b => b.addEventListener('click', async () => {
                const res = await this.api('/challenges/claim', { method:'POST', body: JSON.stringify({ challengeId: parseInt(b.dataset.id) }) });
                this.toast(res.message); this.renderTasks();
            }));
        } catch(e) { c.innerHTML = '<p class="gc-error">加载失败</p>'; }
    }

    // === 猜谜 ===
    async renderRiddle() {
        const c = document.getElementById('gcContent');
        try {
            const data = await this.api('/riddle');
            if (!data.riddle) { c.innerHTML = '<div class="gc-riddle"><h2>🧠 猜谜</h2><p class="gc-empty">今日谜题已答完，明天再来！</p></div>'; return; }
            const r = data.riddle;
            c.innerHTML = `<div class="gc-riddle">
                <h2>🧠 猜谜赢币</h2>
                <div class="gc-riddle-card">
                    <div class="gc-riddle-q">${esc(r.question)}</div>
                    <div class="gc-riddle-hint">💡 提示：${esc(r.hint||'无')}</div>
                    <div class="gc-riddle-meta">难度：${'⭐'.repeat(r.difficulty)} | 奖励：${r.reward_coins}🪙</div>
                    <div class="gc-riddle-form">
                        <input id="gcRiddleAnswer" class="gc-input" placeholder="输入答案...">
                        <button id="gcRiddleSubmit" class="gc-btn gc-btn-primary">提交答案</button>
                    </div>
                    <div id="gcRiddleResult"></div>
                </div>
            </div>`;
            document.getElementById('gcRiddleSubmit')?.addEventListener('click', async () => {
                const answer = document.getElementById('gcRiddleAnswer')?.value;
                if (!answer) return;
                const res = await this.api('/riddle/answer', { method:'POST', body: JSON.stringify({ riddleId: r.id, answer }) });
                const el = document.getElementById('gcRiddleResult');
                if (res.correct) {
                    el.innerHTML = `<div class="gc-correct">✅ 正确！答案就是「${esc(res.answer)}」，获得 ${res.reward}🪙</div>`;
                    this.toast('🎉 答对了！');
                } else {
                    el.innerHTML = `<div class="gc-wrong">❌ 不对哦，正确答案是「${esc(res.answer)}」</div>`;
                }
            });
        } catch(e) { c.innerHTML = '<p class="gc-error">加载失败</p>'; }
    }

    // === PK ===
    async renderPK() {
        const c = document.getElementById('gcContent');
        c.innerHTML = `<div class="gc-pk">
            <h2>⚔️ PK 对战</h2>
            <div class="gc-pk-types">
                <button class="gc-btn gc-pk-type" data-type="coin_flip">🪙 抛硬币</button>
                <button class="gc-btn gc-pk-type" data-type="dice">🎲 掷骰子</button>
                <button class="gc-btn gc-pk-type" data-type="rps">✊✋✌️ 石头剪刀布</button>
                <button class="gc-btn gc-pk-type" data-type="number_guess">🔢 猜数字</button>
            </div>
            <div class="gc-pk-form">
                <label>对手用户ID：<input id="gcPkOpponent" class="gc-input" type="number" placeholder="输入对手ID"></label>
                <label>押注硬币：<input id="gcPkBet" class="gc-input" type="number" value="0" min="0" max="100"></label>
                <button id="gcPkBtn" class="gc-btn gc-btn-primary">发起PK！</button>
            </div>
            <div id="gcPkResult"></div>
            <div class="gc-pk-info"><small>PK类型说明：抛硬币-猜正反面 | 掷骰子-比大小 | 石头剪刀布-经典 | 猜数字-比谁更大</small></div>
        </div>`;
        let selectedType = 'coin_flip';
        c.querySelectorAll('.gc-pk-type').forEach(b => {
            b.addEventListener('click', () => {
                c.querySelectorAll('.gc-pk-type').forEach(x=>x.classList.remove('gc-btn-primary'));
                b.classList.add('gc-btn-primary');
                selectedType = b.dataset.type;
            });
        });
        document.getElementById('gcPkBtn')?.addEventListener('click', async () => {
            const opponentId = parseInt(document.getElementById('gcPkOpponent')?.value);
            const bet = parseInt(document.getElementById('gcPkBet')?.value) || 0;
            if (!opponentId) { this.toast('请输入对手ID'); return; }
            const res = await this.api('/pk/invite', { method:'POST', body: JSON.stringify({ opponentId, type: selectedType, betAmount: bet }) });
            const el = document.getElementById('gcPkResult');
            if (res.message) {
                el.innerHTML = `<div class="gc-pk-sent">⚔️ PK邀请已发送！你的选择：${esc(res.choice)} | 类型：${esc(res.type)} | 押注：${res.betAmount}🪙</div>`;
                this.toast(res.message);
            } else { this.toast(res.message || 'PK失败'); }
        });
    }

    // === 礼物 ===
    async renderGifts() {
        const c = document.getElementById('gcContent');
        try {
            const [giftData, receivedData] = await Promise.all([this.api('/gifts'), this.api('/gifts/received')]);
            c.innerHTML = `<div class="gc-gifts">
                <h2>🎁 礼物中心</h2>
                <div class="gc-gift-send">
                    <h3>送礼物</h3>
                    <div class="gc-gift-grid">${(giftData.gifts||[]).map(g=>`<div class="gc-gift-item" data-id="${g.id}" data-price="${g.price}"><span class="gc-gift-emoji">${g.emoji}</span><span>${esc(g.name)}</span><small>${g.price}🪙</small></div>`).join('')}</div>
                    <div class="gc-gift-form">
                        <label>送给(用户ID)：<input id="gcGiftTo" class="gc-input" type="number"></label>
                        <label>留言：<input id="gcGiftMsg" class="gc-input" maxlength="50" placeholder="写点什么..."></label>
                        <button id="gcGiftSendBtn" class="gc-btn gc-btn-primary" disabled>送出</button>
                    </div>
                </div>
                <div class="gc-gift-received">
                    <h3>收到的礼物</h3>
                    ${(receivedData.records||[]).length ? receivedData.records.map(r=>`<div class="gc-gift-record">${r.gift_emoji} ${esc(r.gift_name)} from ${esc(r.sender_name)} <small>${r.message?esc(r.message):''}</small></div>`).join('') : '<p class="gc-empty">还没有收到礼物</p>'}
                </div>
            </div>`;
            let selectedGift = null;
            c.querySelectorAll('.gc-gift-item').forEach(g => g.addEventListener('click', () => {
                c.querySelectorAll('.gc-gift-item').forEach(x=>x.classList.remove('selected'));
                g.classList.add('selected');
                selectedGift = parseInt(g.dataset.id);
                document.getElementById('gcGiftSendBtn').disabled = false;
            }));
            document.getElementById('gcGiftSendBtn')?.addEventListener('click', async () => {
                if (!selectedGift) return;
                const receiverId = parseInt(document.getElementById('gcGiftTo')?.value);
                const message = document.getElementById('gcGiftMsg')?.value || '';
                if (!receiverId) { this.toast('请输入收礼人ID'); return; }
                const res = await this.api('/gifts/send', { method:'POST', body: JSON.stringify({ receiverId, giftId: selectedGift, message }) });
                this.toast(res.message || '发送失败');
                if (res.message?.includes('成功')) this.renderGifts();
            });
        } catch(e) { c.innerHTML = '<p class="gc-error">加载失败</p>'; }
    }

    // === 排行榜 ===
    async renderLeaderboard() {
        const c = document.getElementById('gcContent');
        try {
            const data = await this.api('/leaderboard?type=coins');
            const types = [{t:'coins',l:'💰 硬币榜'},{t:'articles',l:'📝 发文榜'},{t:'checkin',l:'🔥 签到榜'},{t:'likes',l:'❤️ 人气榜'},{t:'pets',l:'🐾 宠物榜'}];
            c.innerHTML = `<div class="gc-leaderboard">
                <h2>📊 排行榜</h2>
                <div class="gc-lb-tabs">${types.map(t=>`<button class="gc-btn${t.t==='coins'?' gc-btn-primary':''}" data-type="${t.t}">${t.l}</button>`).join('')}</div>
                <div class="gc-lb-list" id="gcLbList">
                    ${(data.leaderboard||[]).map((u,i)=>`<div class="gc-lb-item"><span class="gc-lb-rank">${i<3?['🥇','🥈','🥉'][i]:i+1}</span><span class="gc-lb-name">${esc(u.username)}</span><span class="gc-lb-value">${u.total_earned||0}🪙</span></div>`).join('')||'<p class="gc-empty">暂无数据</p>'}
                </div>
            </div>`;
            c.querySelectorAll('.gc-lb-tabs .gc-btn').forEach(b => b.addEventListener('click', async () => {
                c.querySelectorAll('.gc-lb-tabs .gc-btn').forEach(x=>x.classList.remove('gc-btn-primary'));
                b.classList.add('gc-btn-primary');
                const type = b.dataset.type;
                const res = await this.api(`/leaderboard?type=${type}`);
                const list = document.getElementById('gcLbList');
                if (!list) return;
                const lb = res.leaderboard || [];
                const valKey = type==='coins'?'total_earned':type==='articles'?'article_count':type==='checkin'?'checkin_streak':type==='likes'?'like_count':'pet_level';
                const suffix = type==='pets'?' Lv.'+((lb[0]||{}).pet_level||'') : type==='coins'?'🪙':type==='articles'?'篇':type==='checkin'?'天':'❤️';
                list.innerHTML = lb.map((u,i)=>`<div class="gc-lb-item"><span class="gc-lb-rank">${i<3?['🥇','🥈','🥉'][i]:i+1}</span><span class="gc-lb-name">${esc(u.username)}</span><span class="gc-lb-value">${u[valKey]||0} ${suffix}</span></div>`).join('')||'<p class="gc-empty">暂无数据</p>';
            }));
        } catch(e) { c.innerHTML = '<p class="gc-error">加载失败</p>'; }
    }

    // === 兑换码 ===
    renderRedeem() {
        const c = document.getElementById('gcContent');
        c.innerHTML = `<div class="gc-redeem">
            <h2>🥚 兑换码</h2>
            <p class="gc-redeem-hint">输入兑换码领取奖励，彩蛋就藏在网站的各个角落！</p>
            <div class="gc-redeem-form">
                <input id="gcRedeemCode" class="gc-input gc-input-lg" placeholder="输入兑换码..." maxlength="50">
                <button id="gcRedeemBtn" class="gc-btn gc-btn-primary gc-btn-lg">兑换！</button>
            </div>
            <div id="gcRedeemResult"></div>
            <div class="gc-redeem-tips">
                <h3>💡 获取兑换码的途径</h3>
                <ul>
                    <li>🎉 新用户注册欢迎码</li>
                    <li>🏆 达成特殊成就</li>
                    <li>📢 关注站长动态</li>
                    <li>🥚 网站隐藏彩蛋</li>
                </ul>
            </div>
        </div>`;
        document.getElementById('gcRedeemBtn')?.addEventListener('click', async () => {
            const code = document.getElementById('gcRedeemCode')?.value;
            if (!code) { this.toast('请输入兑换码'); return; }
            const res = await this.api('/redeem', { method:'POST', body: JSON.stringify({ code }) });
            const el = document.getElementById('gcRedeemResult');
            if (res.message?.includes('成功')) {
                el.innerHTML = `<div class="gc-redeem-success">🎉 ${esc(res.message)}<br>获得：${esc(res.rewards||'')}</div>`;
                this.toast('🎉 兑换成功！');
                await this.loadOverview();
                this.updateBalanceBar();
            } else {
                el.innerHTML = `<div class="gc-redeem-fail">❌ ${esc(res.message||'兑换失败')}</div>`;
                this.toast(res.message || '兑换失败');
            }
        });
    }

    // === 聊天室 ===
    async renderChat() {
        const c = document.getElementById('gcContent');
        try {
            const data = await this.api('/chat/rooms');
            c.innerHTML = `<div class="gc-chat">
                <h2>💬 聊天室</h2>
                <div class="gc-chat-create" style="margin-bottom:16px;">
                    <input id="gcChatName" class="gc-input" placeholder="房间名..." maxlength="20" style="width:150px">
                    <button id="gcChatCreateBtn" class="gc-btn gc-btn-primary">创建房间</button>
                </div>
                <div class="gc-room-list" id="gcRoomList">
                    ${(data.rooms||[]).map(r=>`<div class="gc-room-card" data-id="${r.id}">
                        <span class="gc-room-name">💬 ${esc(r.name)}</span>
                        <small>${esc(r.description||'')}</small>
                        <span class="gc-room-info">👥 ${r.member_count||0} | 🕐 ${r.recent_count||0}条/时</span>
                        <button class="gc-btn-sm ${r.joined?'gc-btn-joined':'gc-btn-join'}" data-join="${r.id}">${r.joined?'已加入':'加入'}</button>
                    </div>`).join('')||'<p class="gc-empty">暂无聊天室</p>'}
                </div>
                <div id="gcChatArea" style="display:none;"></div>
            </div>`;
            document.getElementById('gcChatCreateBtn')?.addEventListener('click', async () => {
                const name = document.getElementById('gcChatName')?.value;
                if (!name) return;
                const res = await this.api('/chat/rooms', { method:'POST', body: JSON.stringify({ name }) });
                this.toast(res.message||'创建失败');
                if (res.roomId) this.renderChat();
            });
            c.querySelectorAll('[data-join]').forEach(b => b.addEventListener('click', async () => {
                if (b.classList.contains('gc-btn-joined')) { this.openChatRoom(parseInt(b.dataset.join)); return; }
                const res = await this.api(`/chat/rooms/${b.dataset.join}/join`, { method:'POST' });
                this.toast(res.message||'加入失败');
                if (res.message?.includes('成功')) this.renderChat();
            }));
            const joinedRoom = (data.rooms||[]).find(r=>r.joined);
            if (joinedRoom) this.openChatRoom(joinedRoom.id);
        } catch(e) { c.innerHTML = '<p class="gc-error">加载失败</p>'; }
    }

    async openChatRoom(roomId) {
        const area = document.getElementById('gcChatArea');
        if (!area) return;
        area.style.display = 'block';
        const data = await this.api(`/chat/rooms/${roomId}/messages`);
        area.innerHTML = `<div class="gc-chat-window">
            <div class="gc-chat-messages" id="gcChatMsgs">${(data.messages||[]).map(m=>`<div class="gc-chat-msg"><strong>${esc(m.username)}</strong> <small>${new Date(m.created_at).toLocaleTimeString()}</small><br>${esc(m.content)}</div>`).join('')}</div>
            <div class="gc-chat-input"><input id="gcChatInput" class="gc-input" placeholder="说点什么..." maxlength="500" style="flex:1"><button id="gcChatSend" class="gc-btn gc-btn-primary">发送</button></div>
        </div>`;
        const msgs = document.getElementById('gcChatMsgs');
        if (msgs) msgs.scrollTop = msgs.scrollHeight;
        this._chatRoomId = roomId;
        document.getElementById('gcChatSend')?.addEventListener('click', () => this.sendChatMessage());
        document.getElementById('gcChatInput')?.addEventListener('keydown', e => { if(e.key==='Enter') this.sendChatMessage(); });
        if (this._chatPollTimer) clearInterval(this._chatPollTimer);
        const lastId = (data.messages||[]).length ? data.messages[data.messages.length-1].id : 0;
        this._chatPollTimer = setInterval(async () => {
            try {
                const d = await this.api(`/chat/rooms/${this._chatRoomId}/messages?after=${lastId}`);
                if (d.messages?.length) { const el = document.getElementById('gcChatMsgs'); if(el) { el.innerHTML += d.messages.map(m=>`<div class="gc-chat-msg"><strong>${esc(m.username)}</strong> <small>${new Date(m.created_at).toLocaleTimeString()}</small><br>${esc(m.content)}</div>`).join(''); el.scrollTop = el.scrollHeight; } }
            } catch(_) {}
        }, 3000);
    }

    async sendChatMessage() {
        const input = document.getElementById('gcChatInput');
        if (!input || !input.value.trim() || !this._chatRoomId) return;
        const content = input.value.trim();
        input.value = '';
        await this.api(`/chat/rooms/${this._chatRoomId}/messages`, { method:'POST', body: JSON.stringify({ content }) });
    }

    // === 部落/公会 ===
    async renderClan() {
        const c = document.getElementById('gcContent');
        try {
            const [clansData, myData] = await Promise.all([this.api('/clans'), this.api('/clans/my')]);
            const my = myData.clan;
            c.innerHTML = `<div class="gc-clan">
                <h2>🛡️ 部落系统</h2>
                ${my ? `<div class="gc-my-clan"><h3>${my.emblem||'🛡️'} ${esc(my.name)} <small>Lv.${my.level}</small></h3><p>${esc(my.description||'')}</p><p>👥 成员: ${my.member_count}/${my.max_members} | 💰 公会金: ${my.coins||0}🪙 | ⭐ 经验: ${my.exp||0}</p>
                    <div class="gc-clan-actions"><input id="gcClanDonate" class="gc-input" type="number" value="10" min="1" max="1000" style="width:80px"><button id="gcClanDonateBtn" class="gc-btn gc-btn-primary">捐献</button> <button id="gcClanLeaveBtn" class="gc-btn">退出部落</button></div>
                </div>` : `<div class="gc-clan-create"><p>你还没加入部落</p><input id="gcClanName" class="gc-input" placeholder="部落名(2-50字)" maxlength="50"> <input id="gcClanEmblem" class="gc-input" placeholder="🛡️" maxlength="4" style="width:60px"> <button id="gcClanCreateBtn" class="gc-btn gc-btn-primary">创建(50🪙)</button></div>`}
                <h3>部落排行榜</h3>
                <div class="gc-clan-list">${(clansData.clans||[]).map((cl,i)=>`<div class="gc-clan-item"><span class="gc-lb-rank">${i<3?['🥇','🥈','🥉'][i]:i+1}</span><span>${cl.emblem||'🛡️'} ${esc(cl.name)}</span><small>Lv.${cl.level} | 👥${cl.member_count} | ⭐${cl.exp}</small>${!my?`<button class="gc-btn-sm" data-join="${cl.id}">加入</button>`:''}</div>`).join('')}</div>
            </div>`;
            document.getElementById('gcClanCreateBtn')?.addEventListener('click', async () => {
                const name = document.getElementById('gcClanName')?.value;
                const emblem = document.getElementById('gcClanEmblem')?.value;
                const res = await this.api('/clans/create', { method:'POST', body: JSON.stringify({ name, emblem }) });
                this.toast(res.message||'创建失败'); if (res.clanId) this.renderClan();
            });
            c.querySelectorAll('[data-join]').forEach(b => b.addEventListener('click', async () => {
                const res = await this.api(`/clans/${b.dataset.join}/join`, { method:'POST' });
                this.toast(res.message||'加入失败'); if (res.message?.includes('成功')) this.renderClan();
            }));
            document.getElementById('gcClanDonateBtn')?.addEventListener('click', async () => {
                const amount = parseInt(document.getElementById('gcClanDonate')?.value)||10;
                const res = await this.api('/clans/donate', { method:'POST', body: JSON.stringify({ amount }) });
                this.toast(res.message||'捐献失败'); this.renderClan();
            });
            document.getElementById('gcClanLeaveBtn')?.addEventListener('click', async () => {
                if (!confirm('确定退出部落？')) return;
                const res = await this.api('/clans/leave', { method:'POST' });
                this.toast(res.message||'退出失败'); this.renderClan();
            });
        } catch(e) { c.innerHTML = '<p class="gc-error">加载失败</p>'; }
    }

    // === 论坛 ===
    async renderForum() {
        const c = document.getElementById('gcContent');
        try {
            const data = await this.api('/forum/posts');
            c.innerHTML = `<div class="gc-forum">
                <h2>📰 社区论坛</h2>
                <button id="gcForumNewBtn" class="gc-btn gc-btn-primary" style="margin-bottom:12px">✏️ 发帖(+3🪙)</button>
                <div id="gcForumNew" style="display:none;margin-bottom:16px;">
                    <input id="gcForumTitle" class="gc-input" placeholder="标题" maxlength="200" style="width:100%;margin-bottom:8px">
                    <textarea id="gcForumContent" class="gc-input" placeholder="内容..." style="width:100%;height:100px;resize:vertical" maxlength="10000"></textarea>
                    <select id="gcForumCat" class="gc-input" style="margin:8px 0"><option value="general">综合</option><option value="game">游戏</option><option value="tech">技术</option><option value="share">分享</option><option value="help">求助</option></select>
                    <button id="gcForumSubmitBtn" class="gc-btn gc-btn-primary">发布</button>
                </div>
                <div class="gc-forum-list">${(data.posts||[]).map(p=>`<div class="gc-forum-item" data-id="${p.id}">
                    <div class="gc-forum-title">${p.is_pinned?'📌 ':''}${esc(p.title)}</div>
                    <div class="gc-forum-meta">${esc(p.username)} | ${p.category} | ❤️${p.likes} 💬${p.replies} | ${new Date(p.created_at).toLocaleDateString()}</div>
                </div>`).join('')||'<p class="gc-empty">暂无帖子</p>'}</div>
            </div>`;
            document.getElementById('gcForumNewBtn')?.addEventListener('click', () => { document.getElementById('gcForumNew').style.display = document.getElementById('gcForumNew').style.display==='none'?'block':'none'; });
            document.getElementById('gcForumSubmitBtn')?.addEventListener('click', async () => {
                const title = document.getElementById('gcForumTitle')?.value;
                const content = document.getElementById('gcForumContent')?.value;
                const category = document.getElementById('gcForumCat')?.value;
                const res = await this.api('/forum/posts', { method:'POST', body: JSON.stringify({ title, content, category }) });
                this.toast(res.message||'发帖失败'); if (res.postId) this.renderForum();
            });
            c.querySelectorAll('.gc-forum-item').forEach(el => el.addEventListener('click', () => this.viewForumPost(parseInt(el.dataset.id))));
        } catch(e) { c.innerHTML = '<p class="gc-error">加载失败</p>'; }
    }

    async viewForumPost(postId) {
        const c = document.getElementById('gcContent');
        try {
            const data = await this.api(`/forum/posts/${postId}`);
            const p = data.post;
            c.innerHTML = `<div class="gc-forum-post">
                <button class="gc-btn" onclick="window.gameCenter.renderForum()">← 返回</button>
                <h2>${esc(p.title)}</h2>
                <div class="gc-forum-meta">${esc(p.username)} | ${p.category} | ❤️${p.likes} | ${new Date(p.created_at).toLocaleString()}</div>
                <div class="gc-forum-content">${esc(p.content)}</div>
                <h3>💬 回复 (${data.replies?.length||0})</h3>
                <div class="gc-reply-list">${(data.replies||[]).map(r=>`<div class="gc-reply-item"><strong>${esc(r.username)}</strong> <small>${new Date(r.created_at).toLocaleString()}</small><p>${esc(r.content)}</p></div>`).join('')||'<p class="gc-empty">暂无回复</p>'}</div>
                <div class="gc-reply-form"><textarea id="gcReplyContent" class="gc-input" placeholder="写回复..." style="width:100%;height:60px" maxlength="5000"></textarea><button id="gcReplyBtn" class="gc-btn gc-btn-primary">回复(+1🪙)</button></div>
            </div>`;
            document.getElementById('gcReplyBtn')?.addEventListener('click', async () => {
                const content = document.getElementById('gcReplyContent')?.value;
                if (!content) return;
                const res = await this.api(`/forum/posts/${postId}/reply`, { method:'POST', body: JSON.stringify({ content }) });
                this.toast(res.message||'回复失败'); if (res.id) this.viewForumPost(postId);
            });
        } catch(e) { c.innerHTML = '<p class="gc-error">加载失败</p>'; }
    }

    // === 个人装扮 ===
    async renderCosmetics() {
        const c = document.getElementById('gcContent');
        try {
            const [shopData, myData] = await Promise.all([this.api('/cosmetics/shop'), this.api('/cosmetics/my')]);
            const types = {avatar_frame:'🖼️ 头像框',chat_bubble:'💬 气泡',background:'🎨 背景',name_color:'✏️ 昵称色',name_effect:'✨ 昵称效'};
            c.innerHTML = `<div class="gc-cosmetics">
                <h2>👗 个人装扮</h2>
                <div class="gc-cos-tabs">${Object.entries(types).map(([k,v])=>`<button class="gc-btn gc-cos-tab" data-type="${k}">${v}</button>`).join(' ')}</div>
                <h3>🛒 商店</h3>
                <div class="gc-cos-grid" id="gcCosShop">${(shopData.items||[]).map(i=>`<div class="gc-cos-card gc-rarity-${i.rarity}${i.owned?' gc-owned':''}" data-id="${i.id}">
                    <span class="gc-cos-emoji">${i.emoji}</span>
                    <span class="gc-cos-name">${esc(i.name)}</span>
                    <span class="gc-cos-rarity">${{common:'普通',rare:'稀有',epic:'史诗',legendary:'传说'}[i.rarity]||''}</span>
                    <small>${esc(i.description||'')}</small>
                    ${i.owned?'<span class="gc-owned-badge">已拥有</span>':`<button class="gc-btn-sm gc-cos-buy" data-id="${i.id}">${i.price}🪙</button>`}
                </div>`).join('')}</div>
                <h3>🎒 我的装扮</h3>
                <div class="gc-cos-my">${(myData.items||[]).map(i=>`<div class="gc-cos-card gc-rarity-${i.rarity}">
                    <span>${i.emoji}</span><span>${esc(i.name)}</span>
                    <button class="gc-btn-sm gc-cos-equip" data-id="${i.id}">${i.equipped?'✅ 已装备':'装备'}</button>
                </div>`).join('')||'<p class="gc-empty">还没有装扮</p>'}</div>
            </div>`;
            c.querySelectorAll('.gc-cos-buy').forEach(b => b.addEventListener('click', async () => {
                const res = await this.api('/cosmetics/buy', { method:'POST', body: JSON.stringify({ cosmeticId: parseInt(b.dataset.id) }) });
                this.toast(res.message||'购买失败'); this.renderCosmetics();
            }));
            c.querySelectorAll('.gc-cos-equip').forEach(b => b.addEventListener('click', async () => {
                const res = await this.api('/cosmetics/equip', { method:'POST', body: JSON.stringify({ cosmeticId: parseInt(b.dataset.id) }) });
                this.toast(res.message||'装备失败'); this.renderCosmetics();
            }));
        } catch(e) { c.innerHTML = '<p class="gc-error">加载失败</p>'; }
    }

    // === 限时活动 ===
    async renderEvents() {
        const c = document.getElementById('gcContent');
        try {
            const data = await this.api('/events');
            c.innerHTML = `<div class="gc-events">
                <h2>🎪 限时活动</h2>
                ${data.active?.length ? `<h3>🔥 进行中</h3>${data.active.map(ev=>`<div class="gc-event-card gc-event-active">
                    <div class="gc-event-name">${esc(ev.name)}</div>
                    <div class="gc-event-desc">${esc(ev.description||'')}</div>
                    <div class="gc-event-type">${{double_exp:'⭐ 双倍经验',double_coins:'💰 双倍硬币',limited_shop:'🛒 限时商店',festival:'🎉 节日活动',boss_fight:'👾 Boss战'}[ev.type]||ev.type}</div>
                    <div class="gc-event-time">⏰ ${new Date(ev.ends_at).toLocaleString()} 结束</div>
                </div>`).join('')}` : ''}
                ${data.upcoming?.length ? `<h3>📅 即将开始</h3>${data.upcoming.map(ev=>`<div class="gc-event-card">
                    <div class="gc-event-name">${esc(ev.name)}</div>
                    <div class="gc-event-desc">${esc(ev.description||'')}</div>
                    <div class="gc-event-time">🕐 ${new Date(ev.starts_at).toLocaleString()} 开始</div>
                </div>`).join('')}` : ''}
                ${!data.active?.length && !data.upcoming?.length ? '<p class="gc-empty">暂无活动，敬请期待！</p>' : ''}
            </div>`;
        } catch(e) { c.innerHTML = '<p class="gc-error">加载失败</p>'; }
    }

    // === 硬币股市 ===
    async renderStocks() {
        const c = document.getElementById('gcContent');
        try {
            const data = await this.api('/stocks');
            c.innerHTML = `<div class="gc-stocks">
                <h2>📈 硬币股市</h2>
                <p class="gc-stock-tip">💰 余额: <strong>${data.balance||0}</strong>🪙 | 每次访问价格变动 | 低买高卖赚差价</p>
                <h3>📊 行情</h3>
                <div class="gc-stock-grid">${(data.stocks||[]).map(s=>{
                    const price = parseFloat(s.current_price);
                    const prev = parseFloat(s.previous_price);
                    const change = ((price-prev)/prev*100).toFixed(2);
                    const up = price >= prev;
                    return `<div class="gc-stock-card${up?' gc-stock-up':' gc-stock-down'}">
                        <div class="gc-stock-header">${s.emoji} <strong>${esc(s.symbol)}</strong> <small>${esc(s.name)}</small></div>
                        <div class="gc-stock-price">${price.toFixed(2)}🪙 <span class="gc-stock-change">${up?'▲':'▼'}${change}%</span></div>
                        <div class="gc-stock-actions"><input class="gc-input gc-stock-qty" type="number" value="1" min="1" max="10000" style="width:60px"><button class="gc-btn-sm gc-stock-buy" data-id="${s.id}">买入</button><button class="gc-btn-sm gc-stock-sell" data-id="${s.id}">卖出</button></div>
                    </div>`;
                }).join('')}</div>
                <h3>💼 我的持仓</h3>
                <div class="gc-holdings">${(data.holdings||[]).map(h=>`<div class="gc-holding-item">${esc(h.symbol)} ${esc(h.name)} | ${h.shares}股 | 均价${parseFloat(h.avg_cost).toFixed(2)} | 现价${parseFloat(h.current_price).toFixed(2)} | 盈亏${((parseFloat(h.current_price)-parseFloat(h.avg_cost))*h.shares).toFixed(2)}🪙</div>`).join('')||'<p class="gc-empty">暂无持仓</p>'}</div>
            </div>`;
            c.querySelectorAll('.gc-stock-buy').forEach(b => b.addEventListener('click', async () => {
                const qty = parseInt(b.parentElement.querySelector('.gc-stock-qty')?.value)||1;
                const res = await this.api('/stocks/buy', { method:'POST', body: JSON.stringify({ stockId: parseInt(b.dataset.id), shares: qty }) });
                this.toast(res.message||'买入失败'); this.renderStocks();
            }));
            c.querySelectorAll('.gc-stock-sell').forEach(b => b.addEventListener('click', async () => {
                const qty = parseInt(b.parentElement.querySelector('.gc-stock-qty')?.value)||1;
                const res = await this.api('/stocks/sell', { method:'POST', body: JSON.stringify({ stockId: parseInt(b.dataset.id), shares: qty }) });
                this.toast(res.message||'卖出失败'); this.renderStocks();
            }));
        } catch(e) { c.innerHTML = '<p class="gc-error">加载失败</p>'; }
    }

    // === 小游戏合集 ===
    renderMinigames() {
        const c = document.getElementById('gcContent');
        const games = [
            { id:'memory', name:'记忆翻牌', icon:'🃏', desc:'翻开两张相同的牌', color:'#667eea' },
            { id:'click', name:'打地鼠', icon:'🔨', desc:'30秒内点击尽可能多地鼠', color:'#f5576c' },
            { id:'guess', name:'猜数字', icon:'🔢', desc:'猜1-100之间的数字', color:'#2ed573' },
            { id:'twenty48', name:'2048', icon:'🔲', desc:'合并数字到2048', color:'#ffa502' },
            { id:'math', name:'算术挑战', icon:'🧮', desc:'60秒内答对更多算术题', color:'#a29bfe' },
        ];
        c.innerHTML = `<div class="gc-minigames">
            <h2>🕹️ 小游戏合集</h2>
            <div class="gc-game-grid">${games.map(g=>`<div class="gc-game-card" style="border-left:4px solid ${g.color}">
                <div class="gc-game-icon">${g.icon}</div>
                <div class="gc-game-info"><div class="gc-game-name">${esc(g.name)}</div><div class="gc-game-desc">${esc(g.desc)}</div></div>
                <button class="gc-btn gc-btn-primary gc-play-btn" data-game="${g.id}">开始</button>
            </div>`).join('')}</div>
            <div id="gcGameArea"></div>
        </div>`;
        c.querySelectorAll('.gc-play-btn').forEach(b => b.addEventListener('click', () => {
            const game = b.dataset.game;
            if (game==='memory') this.playMemory();
            else if (game==='click') this.playClick();
            else if (game==='guess') this.playGuess();
            else if (game==='twenty48') this.play2048();
            else if (game==='math') this.playMath();
        }));
    }

    async submitMinigameScore(gameType, score, level=1) {
        const res = await this.api('/minigames/submit', { method:'POST', body: JSON.stringify({ gameType, score, level }) });
        this.toast(res.message||'提交完成');
    }

    playMemory() {
        const area = document.getElementById('gcGameArea');
        if (!area) return;
        const emojis = ['🐱','🐕','🐉','🦅','🐰','🦊','🐟','🦋'];
        let cards = [...emojis,...emojis].sort(()=>Math.random()-0.5);
        let flipped=[], matched=0, moves=0, canFlip=true;
        area.innerHTML = `<div class="gc-mini-game"><h3>🃏 记忆翻牌</h3><div class="gc-memory-grid">${cards.map((e,i)=>`<div class="gc-mem-card" data-i="${i}" data-v="${e}">?</div>`).join('')}</div><div class="gc-game-status">翻牌: <span id="gcMemMoves">0</span> | 配对: <span id="gcMemMatched">0</span>/8</div></div>`;
        area.querySelectorAll('.gc-mem-card').forEach(card => card.addEventListener('click', () => {
            if (!canFlip || card.classList.contains('flipped') || card.classList.contains('matched')) return;
            card.textContent = card.dataset.v;
            card.classList.add('flipped');
            flipped.push(card);
            if (flipped.length===2) {
                canFlip=false; moves++;
                document.getElementById('gcMemMoves').textContent = moves;
                if (flipped[0].dataset.v===flipped[1].dataset.v) {
                    flipped.forEach(c=>c.classList.add('matched')); matched++;
                    document.getElementById('gcMemMatched').textContent = matched;
                    flipped=[]; canFlip=true;
                    if (matched===8) { this.toast('🎉 全部配对！'); this.submitMinigameScore('memory', Math.max(1, 100-moves*5)); }
                } else {
                    setTimeout(()=>{ flipped.forEach(c=>{c.textContent='?';c.classList.remove('flipped');}); flipped=[]; canFlip=true; }, 800);
                }
            }
        }));
    }

    playClick() {
        const area = document.getElementById('gcGameArea');
        if (!area) return;
        let score=0, timeLeft=30;
        area.innerHTML = `<div class="gc-mini-game"><h3>🔨 打地鼠 (30秒)</h3><div class="gc-game-timer">⏱ <span id="gcClickTime">30</span>s | 得分: <span id="gcClickScore">0</span></div><div class="gc-click-grid" id="gcClickGrid">${Array(9).fill(0).map((_,i)=>`<div class="gc-hole" data-i="${i}"></div>`).join('')}</div></div>`;
        const timer = setInterval(()=>{
            timeLeft--;
            document.getElementById('gcClickTime').textContent = timeLeft;
            if (timeLeft<=0) { clearInterval(timer); clearInterval(moleTimer); this.toast(`🔨 得分: ${score}`); this.submitMinigameScore('click', score); }
        }, 1000);
        const moleTimer = setInterval(()=>{
            const holes = area.querySelectorAll('.gc-hole');
            holes.forEach(h=>h.classList.remove('mole'));
            const idx = Math.floor(Math.random()*9);
            holes[idx]?.classList.add('mole');
        }, 800);
        area.querySelectorAll('.gc-hole').forEach(h => h.addEventListener('click', () => {
            if (h.classList.contains('mole')) { score++; document.getElementById('gcClickScore').textContent=score; h.classList.remove('mole'); h.textContent='💥'; setTimeout(()=>h.textContent='',200); }
        }));
    }

    playGuess() {
        const area = document.getElementById('gcGameArea');
        if (!area) return;
        const target = Math.floor(Math.random()*100)+1;
        let attempts = 0;
        area.innerHTML = `<div class="gc-mini-game"><h3>🔢 猜数字 (1-100)</h3><div class="gc-guess-form"><input id="gcGuessNum" class="gc-input" type="number" min="1" max="100" placeholder="输入1-100"><button id="gcGuessBtn" class="gc-btn gc-btn-primary">猜！</button></div><div id="gcGuessHint"></div><div>尝试次数: <span id="gcGuessAttempts">0</span></div></div>`;
        document.getElementById('gcGuessBtn')?.addEventListener('click', () => {
            const num = parseInt(document.getElementById('gcGuessNum')?.value);
            if (isNaN(num)||num<1||num>100) return;
            attempts++; document.getElementById('gcGuessAttempts').textContent = attempts;
            const el = document.getElementById('gcGuessHint');
            if (num===target) { el.innerHTML=`<div class="gc-correct">✅ 答对了！就是${target}，用了${attempts}次</div>`; this.submitMinigameScore('guess', Math.max(1, 10-attempts)); }
            else if (num<target) el.innerHTML='<div class="gc-wrong">⬆️ 太小了</div>';
            else el.innerHTML='<div class="gc-wrong">⬇️ 太大了</div>';
        });
    }

    play2048() {
        const area = document.getElementById('gcGameArea');
        if (!area) return;
        let grid = Array(4).fill(null).map(()=>Array(4).fill(0));
        let score = 0;
        function addRandom() { const empty=[]; grid.forEach((r,ri)=>r.forEach((c,ci)=>{if(!c)empty.push([ri,ci]);})); if(!empty.length)return; const [r,c]=empty[Math.floor(Math.random()*empty.length)]; grid[r][c]=Math.random()<0.9?2:4; }
        addRandom(); addRandom();
        function render() { area.querySelectorAll('.gc-2048-cell').forEach((cell,i)=>{ const v=grid[Math.floor(i/4)][i%4]; cell.textContent=v||''; cell.dataset.v=v; }); document.getElementById('gc2048Score').textContent=score; }
        area.innerHTML = `<div class="gc-mini-game"><h3>🔲 2048</h3><div>得分: <span id="gc2048Score">0</span> | 方向键/滑动操作</div><div class="gc-2048-grid">${Array(16).fill(0).map(()=>'<div class="gc-2048-cell"></div>').join('')}</div></div>`;
        render();
        function slide(row) { let a=row.filter(v=>v); for(let i=0;i<a.length-1;i++){if(a[i]===a[i+1]){a[i]*=2;score+=a[i];a.splice(i+1,1);}} while(a.length<4)a.push(0); return a; }
        function move(dir) {
            let moved=false; const old=JSON.stringify(grid);
            if(dir==='left') grid=grid.map(r=>slide(r));
            else if(dir==='right') grid=grid.map(r=>slide([...r].reverse()).reverse());
            else if(dir==='up') { for(let c=0;c<4;c++){let col=grid.map(r=>r[c]);col=slide(col);col.forEach((v,r)=>grid[r][c]=v);} }
            else if(dir==='down') { for(let c=0;c<4;c++){let col=grid.map(r=>r[c]).reverse();col=slide(col).reverse();col.forEach((v,r)=>grid[r][c]=v);} }
            if(JSON.stringify(grid)!==old){addRandom();render();if(score>0)this?.submitMinigameScore?.('twenty48',score);}
        }
        document.addEventListener('keydown', e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();move(e.key.replace('Arrow','').toLowerCase());}},{once:false});
    }

    playMath() {
        const area = document.getElementById('gcGameArea');
        if (!area) return;
        let score=0, timeLeft=60, current=null;
        function genProblem() {
            const ops = ['+','-','×'];
            const op = ops[Math.floor(Math.random()*3)];
            let a,b;
            if(op==='+'){a=Math.floor(Math.random()*50)+1;b=Math.floor(Math.random()*50)+1;}
            else if(op==='-'){a=Math.floor(Math.random()*50)+20;b=Math.floor(Math.random()*a);}
            else{a=Math.floor(Math.random()*12)+1;b=Math.floor(Math.random()*12)+1;}
            const ans = op==='+'?a+b:op==='-'?a-b:a*b;
            return {q:`${a} ${op} ${b}`, a:ans};
        }
        current = genProblem();
        area.innerHTML = `<div class="gc-mini-game"><h3>🧮 算术挑战 (60秒)</h3><div class="gc-game-timer">⏱ <span id="gcMathTime">60</span>s | 得分: <span id="gcMathScore">0</span></div><div class="gc-math-problem" id="gcMathQ">${current.q} = ?</div><div class="gc-math-form"><input id="gcMathAns" class="gc-input" type="number" autofocus><button id="gcMathBtn" class="gc-btn gc-btn-primary">提交</button></div></div>`;
        const timer = setInterval(()=>{ timeLeft--; document.getElementById('gcMathTime').textContent=timeLeft; if(timeLeft<=0){clearInterval(timer);this.toast(`🧮 得分: ${score}`);this.submitMinigameScore('math',score);} },1000);
        const submit = () => {
            const ans = parseInt(document.getElementById('gcMathAns')?.value);
            if (ans===current.a) { score++; document.getElementById('gcMathScore').textContent=score; }
            current = genProblem(); document.getElementById('gcMathQ').textContent=current.q+' = ?';
            document.getElementById('gcMathAns').value='';
        };
        document.getElementById('gcMathBtn')?.addEventListener('click', submit);
        document.getElementById('gcMathAns')?.addEventListener('keydown', e=>{if(e.key==='Enter')submit();});
    }

    // === 🎣 钓鱼 ===
    async renderFishing() {
        const c = document.getElementById('gcContent');
        try {
            const data = await this.api('/fishing/status');
            c.innerHTML = `<div class="gc-fishing">
                <h2>🎣 钓鱼乐园</h2>
                <div class="gc-fish-status">⚡ 体力: ${data.energy||0}/${data.maxEnergy||10} | 🐟 总捕获: ${data.totalCaught||0} | 🏆 最佳: ${esc(data.bestCatch||'无')}</div>
                <div class="gc-fish-pond" id="gcFishPond"><div class="gc-fish-water">🌊<br>点击抛竿</div></div>
                <button id="gcCastBtn" class="gc-btn gc-btn-primary gc-btn-lg" ${data.energy<=0?'disabled':''}>🎣 抛竿！(1体力)</button>
                <div id="gcFishResult"></div>
                <div class="gc-fish-shop"><h3>🪱 鱼饵商店</h3>
                    <button class="gc-btn gc-bait-btn" data-bait="golden">🪙 金色鱼饵 (20🪙 稀有+50%)</button>
                    <button class="gc-btn gc-bait-btn" data-bait="magic">✨ 魔法鱼饵 (50🪙 史诗+100%)</button>
                </div>
                <div class="gc-fish-pool"><h3>🐟 鱼池</h3>${[
                    {r:'common',c:'#aaa',l:'普通'},{r:'rare',c:'#3498db',l:'稀有'},{r:'epic',c:'#9b59b6',l:'史诗'},{r:'legendary',c:'#f39c12',l:'传说'},{r:'junk',c:'#666',l:'垃圾'}
                ].map(t=>`<span style="color:${t.c}">● ${t.l}</span>`).join(' ')}</div>
            </div>`;
            const castBtn = document.getElementById('gcCastBtn');
            castBtn?.addEventListener('click', async () => {
                castBtn.disabled = true; castBtn.textContent = '🎣 钓鱼中...';
                const pond = document.getElementById('gcFishPond');
                if(pond) pond.innerHTML = '<div class="gc-fish-water gc-casting">🌊🎣 抛竿中...</div>';
                await new Promise(r=>setTimeout(r,1500));
                const res = await this.api('/fishing/cast', { method:'POST' });
                if (res.caught) {
                    const el = document.getElementById('gcFishResult');
                    const rarityColors = {common:'#aaa',rare:'#3498db',epic:'#9b59b6',legendary:'#f39c12',junk:'#666'};
                    el.innerHTML = `<div class="gc-fish-catch gc-animate-pop" style="border-left:4px solid ${rarityColors[res.caught.rarity]||'#aaa'}">
                        <span class="gc-fish-emoji">${res.caught.emoji}</span>
                        <strong>${esc(res.caught.name)}</strong>
                        <span style="color:${rarityColors[res.caught.rarity]}">${res.caught.rarity}</span>
                        ${!res.isJunk?`<span>${res.caught.size}cm | ${res.caught.price}🪙</span>`:''}
                    </div>`;
                    this.toast(res.message);
                    await this.loadOverview(); this.updateBalanceBar();
                }
                castBtn.disabled = false; castBtn.textContent = '🎣 抛竿！(1体力)';
                setTimeout(()=>this.renderFishing(), 500);
            });
            c.querySelectorAll('.gc-bait-btn').forEach(b => b.addEventListener('click', async () => {
                const res = await this.api('/fishing/buy-bait', { method:'POST', body: JSON.stringify({ bait: b.dataset.bait }) });
                this.toast(res.message||'购买失败');
            }));
        } catch(e) { c.innerHTML = '<p class="gc-error">加载失败</p>'; }
    }

    // === 🌾 农场 ===
    async renderFarm() {
        const c = document.getElementById('gcContent');
        try {
            const data = await this.api('/farm');
            c.innerHTML = `<div class="gc-farm">
                <h2>🌾 开心农场</h2>
                <div class="gc-farm-grid">${(data.plots||[]).map((p,i) => {
                    if (!p.crop_name) return `<div class="gc-farm-plot gc-plot-empty"><div class="gc-plot-slot">空地</div><select class="gc-plant-select" data-plot="${i}">${(data.crops||[]).map(cr=>`<option value="${cr.id}">${cr.emoji}${cr.name}(${cr.seedCost}🪙/${cr.growMinutes}分)</option>`).join('')}</select><button class="gc-btn-sm gc-plant-btn" data-plot="${i}">种植</button></div>`;
                    const plantedAt = new Date(p.planted_at).getTime();
                    const growMs = (p.grow_minutes||5)*60000;
                    const ready = Date.now() >= plantedAt + growMs;
                    const progress = Math.min(100, ((Date.now()-plantedAt)/growMs)*100);
                    return `<div class="gc-farm-plot"><div class="gc-plot-slot${ready?' gc-ready':''}">${p.crop_emoji||'🌱'}</div><div>${esc(p.crop_name)}</div><div class="gc-progress-bar"><div class="gc-progress-fill" style="width:${progress}%"></div></div>${ready?`<button class="gc-btn-sm gc-harvest-btn" data-plot="${i}">🧺 收获</button>`:`<button class="gc-btn-sm gc-water-btn" data-plot="${i}">💧 浇水</button>`}</div>`;
                }).join('')}</div>
            </div>`;
            c.querySelectorAll('.gc-plant-btn').forEach(b => b.addEventListener('click', async () => {
                const plot = b.dataset.plot;
                const cropId = b.parentElement.querySelector('.gc-plant-select')?.value;
                const res = await this.api('/farm/plant', { method:'POST', body: JSON.stringify({ plotIndex: parseInt(plot), cropId: parseInt(cropId) }) });
                this.toast(res.message||'种植失败'); this.renderFarm();
            }));
            c.querySelectorAll('.gc-harvest-btn').forEach(b => b.addEventListener('click', async () => {
                const res = await this.api('/farm/harvest', { method:'POST', body: JSON.stringify({ plotIndex: parseInt(b.dataset.plot) }) });
                this.toast(res.message||'收获失败'); this.renderFarm();
            }));
            c.querySelectorAll('.gc-water-btn').forEach(b => b.addEventListener('click', async () => {
                const res = await this.api('/farm/water', { method:'POST', body: JSON.stringify({ plotIndex: parseInt(b.dataset.plot) }) });
                this.toast(res.message||'浇水失败'); this.renderFarm();
            }));
        } catch(e) { c.innerHTML = '<p class="gc-error">加载失败</p>'; }
    }

    // === 🗺️ 冒险地图 ===
    async renderAdventure() {
        const c = document.getElementById('gcContent');
        try {
            const data = await this.api('/adventure');
            c.innerHTML = `<div class="gc-adventure">
                <h2>🗺️ 冒险地图</h2>
                <div class="gc-adventure-progress">📍 当前: 第${data.currentStage}关 | 🏆 最高: 第${data.maxStage}关 | 🔥 总探险: ${data.totalRuns||0}次</div>
                <div class="gc-adventure-map">${(data.stages||[]).map(s => {
                    const status = s.id < data.currentStage ? 'completed' : s.id === data.currentStage ? 'current' : 'locked';
                    return `<div class="gc-stage gc-stage-${status}" data-id="${s.id}">
                        <span class="gc-stage-emoji">${status==='locked'?'🔒':s.emoji}</span>
                        <span class="gc-stage-name">${esc(s.name)}</span>
                        <small>难度${'⭐'.repeat(s.difficulty)} | 💰${s.reward} | ⚡${s.energy}</small>
                        ${status==='current'?`<button class="gc-btn gc-btn-primary gc-explore-btn">⚔️ 探险</button>`:''}
                    </div>`;
                }).join('')}</div>
                <div id="gcAdvResult"></div>
            </div>`;
            c.querySelector('.gc-explore-btn')?.addEventListener('click', async () => {
                const btn = c.querySelector('.gc-explore-btn');
                btn.disabled = true; btn.textContent = '探险中...';
                const res = await this.api('/adventure/explore', { method:'POST' });
                const el = document.getElementById('gcAdvResult');
                el.innerHTML = `<div class="gc-adv-result gc-animate-pop ${res.success?'gc-correct':'gc-wrong'}">
                    <div>${res.message}</div>
                    ${res.event?`<div class="gc-adv-event">${esc(res.event.text)}</div>`:''}
                    ${res.bonusCoins>0?`<div>+${res.bonusCoins}🪙</div>`:''}
                    ${res.energyChange>0?`<div>+${res.energyChange}⚡</div>`:''}
                </div>`;
                this.toast(res.message);
                setTimeout(()=>this.renderAdventure(), 2000);
            });
        } catch(e) { c.innerHTML = '<p class="gc-error">加载失败</p>'; }
    }

    // === ⚔️ 宠物对战 ===
    async renderPetBattle() {
        const c = document.getElementById('gcContent');
        try {
            const [petData, history] = await Promise.all([this.api('/pet'), this.api('/pet/battle-history')]);
            if (!petData.pet) { c.innerHTML = '<p class="gc-empty">请先领养宠物</p>'; return; }
            const pet = petData.pet;
            c.innerHTML = `<div class="gc-petbattle">
                <h2>⚔️ 宠物对战</h2>
                <div class="gc-pb-stats">${this.getSpeciesEmoji(pet.species)} ${esc(pet.name)} Lv.${pet.level} | 战力: ${pet.level*10+Math.round(pet.mood*0.5+pet.hunger*0.3)}</div>
                <div class="gc-pb-form">
                    <label>对手用户ID: <input id="gcPbOpp" class="gc-input" type="number"></label>
                    <button id="gcPbFightBtn" class="gc-btn gc-btn-primary">⚔️ 发起对战</button>
                </div>
                <div id="gcPbResult"></div>
                <h3>📜 对战记录</h3>
                <div class="gc-pb-history">${(history.battles||[]).map(b => {
                    const won = b.winner_id === this.user.id;
                    return `<div class="gc-pb-record ${won?'gc-win':'gc-lose'}">${won?'✅胜':'❌负'} vs ${esc(b.defender_name||b.challenger_name)} | ${new Date(b.created_at).toLocaleString()}</div>`;
                }).join('')||'<p class="gc-empty">暂无记录</p>'}</div>
            </div>`;
            document.getElementById('gcPbFightBtn')?.addEventListener('click', async () => {
                const oppId = parseInt(document.getElementById('gcPbOpp')?.value);
                if (!oppId) { this.toast('请输入对手ID'); return; }
                const res = await this.api('/pet/battle', { method:'POST', body: JSON.stringify({ opponentId: oppId }) });
                const el = document.getElementById('gcPbResult');
                el.innerHTML = `<div class="gc-pb-result gc-animate-pop ${res.won?'gc-correct':'gc-wrong'}">
                    ${res.won?'🎉 胜利！':'😔 失败...'}<br>
                    你的战力: ${res.myPower} | 对手战力: ${res.oppPower}<br>
                    ${res.won?`+${res.coinReward}🪙 +${res.expGain}EXP`:``+res.expGain+`EXP`}
                </div>`;
                this.toast(res.won?'🎉 对战胜利！':'😔 对战失败');
            });
        } catch(e) { c.innerHTML = '<p class="gc-error">加载失败</p>'; }
    }

    // === 💍 婚姻 ===
    async renderMarriage() {
        const c = document.getElementById('gcContent');
        try {
            const data = await this.api('/marriage/status');
            c.innerHTML = `<div class="gc-marriage">
                <h2>💍 婚姻系统</h2>
                ${data.marriage ? `<div class="gc-married-card">
                    <h3>💍 已结婚</h3><p>与 ${esc(data.marriage.partner1_name===this.user?.username?data.marriage.partner2_name:data.marriage.partner1_name)} 缔结良缘</p>
                    <small>${data.marriage.married_at ? new Date(data.marriage.married_at).toLocaleDateString() : ''}</small>
                    <button id="gcDivorceBtn" class="gc-btn" style="margin-top:10px">💔 离婚</button>
                </div>` : `<div class="gc-marriage-form">
                    <p>你还没有结婚 💔</p><label>对方用户ID: <input id="gcMarryId" class="gc-input" type="number"></label>
                    <button id="gcProposeBtn" class="gc-btn gc-btn-primary">💍 求婚(50🪙)</button>
                </div>`}
                ${(data.proposals||[]).length > 0 ? `<div class="gc-proposals"><h3>💌 求婚请求</h3>${data.proposals.map(p => `<div class="gc-proposal-card">${esc(p.proposer_name)} 向你求婚！<button class="gc-btn gc-btn-primary gc-accept-prop" data-id="${p.id}">接受</button> <button class="gc-btn gc-reject-prop" data-id="${p.id}">拒绝</button></div>`).join('')}</div>` : ''}
            </div>`;
            document.getElementById('gcProposeBtn')?.addEventListener('click', async () => {
                const id = parseInt(document.getElementById('gcMarryId')?.value);
                if (!id) return;
                const res = await this.api('/marriage/propose', { method:'POST', body: JSON.stringify({ partnerId: id }) });
                this.toast(res.message||'求婚失败');
            });
            document.getElementById('gcDivorceBtn')?.addEventListener('click', async () => {
                if (!confirm('确定离婚？')) return;
                const res = await this.api('/marriage/divorce', { method:'POST' });
                this.toast(res.message||'离婚失败'); this.renderMarriage();
            });
            c.querySelectorAll('.gc-accept-prop').forEach(b => b.addEventListener('click', async () => {
                const res = await this.api('/marriage/respond', { method:'POST', body: JSON.stringify({ marriageId: parseInt(b.dataset.id), accept: true }) });
                this.toast(res.message||'操作失败'); this.renderMarriage();
            }));
            c.querySelectorAll('.gc-reject-prop').forEach(b => b.addEventListener('click', async () => {
                const res = await this.api('/marriage/respond', { method:'POST', body: JSON.stringify({ marriageId: parseInt(b.dataset.id), accept: false }) });
                this.toast(res.message||'操作失败'); this.renderMarriage();
            }));
        } catch(e) { c.innerHTML = '<p class="gc-error">加载失败</p>'; }
    }

    // === 📜 师徒 ===
    async renderMentorship() {
        const c = document.getElementById('gcContent');
        try {
            const data = await this.api('/mentorship/status');
            c.innerHTML = `<div class="gc-mentorship">
                <h2>📜 师徒系统</h2>
                ${data.asApprentice ? `<div class="gc-mentor-card">👨‍🏫 你的导师: <strong>${esc(data.asApprentice.mentor_name)}</strong></div>` : '<p>你还没有导师</p>'}
                ${data.asMentor?.length ? `<div class="gc-apprentice-list"><h3>你的徒弟</h3>${data.asMentor.map(a => `<div class="gc-apprentice-item">🧑‍🎓 ${esc(a.apprentice_name)}</div>`).join('')}</div>` : ''}
                <button id="gcDailyBonusBtn" class="gc-btn gc-btn-primary" style="margin:12px 0">🎁 领取师徒每日奖励(5🪙)</button>
                ${(data.asMentor||[]).length < 3 && !data.asApprentice ? `<div class="gc-mentor-form"><input id="gcMentorId" class="gc-input" type="number" placeholder="导师用户ID"><button id="gcMentorReqBtn" class="gc-btn">📤 拜师</button></div>` : ''}
                ${(data.requests||[]).length ? `<h3>📥 拜师请求</h3>${data.requests.map(r => `<div class="gc-req-item">${esc(r.username)} 想拜你为师 <button class="gc-btn-sm gc-accept-mentor" data-id="${r.id}">接受</button> <button class="gc-btn-sm gc-reject-mentor" data-id="${r.id}">拒绝</button></div>`).join('')}` : ''}
            </div>`;
            document.getElementById('gcDailyBonusBtn')?.addEventListener('click', async () => {
                const res = await this.api('/mentorship/daily-bonus', { method:'POST' });
                this.toast(res.message||'领取失败');
            });
            document.getElementById('gcMentorReqBtn')?.addEventListener('click', async () => {
                const id = parseInt(document.getElementById('gcMentorId')?.value);
                if (!id) return;
                const res = await this.api('/mentorship/request', { method:'POST', body: JSON.stringify({ mentorId: id }) });
                this.toast(res.message||'请求失败');
            });
            c.querySelectorAll('.gc-accept-mentor').forEach(b => b.addEventListener('click', async () => {
                const res = await this.api('/mentorship/respond', { method:'POST', body: JSON.stringify({ requestId: parseInt(b.dataset.id), accept: true }) });
                this.toast(res.message||'操作失败'); this.renderMentorship();
            }));
            c.querySelectorAll('.gc-reject-mentor').forEach(b => b.addEventListener('click', async () => {
                const res = await this.api('/mentorship/respond', { method:'POST', body: JSON.stringify({ requestId: parseInt(b.dataset.id), accept: false }) });
                this.toast(res.message||'操作失败'); this.renderMentorship();
            }));
        } catch(e) { c.innerHTML = '<p class="gc-error">加载失败</p>'; }
    }

    // === 🃏 刮刮乐 ===
    renderScratch() {
        const c = document.getElementById('gcContent');
        c.innerHTML = `<div class="gc-scratch">
            <h2>🃏 刮刮乐</h2><p>10🪙一张，3个相同符号即中奖！</p>
            <button id="gcScratchBuy" class="gc-btn gc-btn-primary gc-btn-lg">🃏 买一张(10🪙)</button>
            <div id="gcScratchGrid"></div>
            <div id="gcScratchResult"></div>
        </div>`;
        document.getElementById('gcScratchBuy')?.addEventListener('click', async () => {
            const btn = document.getElementById('gcScratchBuy');
            btn.disabled = true;
            const res = await this.api('/scratch/buy', { method:'POST' });
            btn.disabled = false;
            if (res.grid) {
                const grid = document.getElementById('gcScratchGrid');
                grid.innerHTML = `<div class="gc-scratch-grid">${res.grid.map((cell,i) => `<div class="gc-scratch-cell" data-revealed="false" data-i="${i}">❓</div>`).join('')}</div>`;
                grid.querySelectorAll('.gc-scratch-cell').forEach(cell => {
                    cell.addEventListener('click', () => {
                        if (cell.dataset.revealed === 'true') return;
                        cell.dataset.revealed = 'true';
                        const i = parseInt(cell.dataset.i);
                        const c = res.grid[i];
                        cell.textContent = c.symbol;
                        cell.classList.add('gc-revealed');
                        const allRevealed = grid.querySelectorAll('.gc-scratch-cell[data-revealed="true"]').length === 9;
                        if (allRevealed) {
                            document.getElementById('gcScratchResult').innerHTML = `<div class="gc-scratch-result gc-animate-pop">${res.message}</div>`;
                            this.toast(res.message);
                            this.loadOverview(); this.updateBalanceBar();
                        }
                    });
                });
            }
        });
    }

    // === 🎲 摇骰子 ===
    renderDice() {
        const c = document.getElementById('gcContent');
        c.innerHTML = `<div class="gc-dice">
            <h2>🎲 掷骰子</h2>
            <div class="gc-dice-form">
                <label>押注: <input id="gcDiceBet" class="gc-input" type="number" value="5" min="1" max="100" style="width:80px">🪙</label>
                <label>猜测:</label>
                <div class="gc-dice-choices">
                    <button class="gc-btn gc-dice-choice" data-guess="big">大 (≥11)</button>
                    <button class="btn gc-dice-choice" data-guess="small">小 (≤10)</button>
                    <button class="gc-btn gc-dice-choice" data-guess="triple">豹子 x24</button>
                    <button class="gc-btn gc-dice-choice" data-guess="1">⚀</button>
                    <button class="gc-btn gc-dice-choice" data-guess="2">⚁</button>
                    <button class="gc-btn gc-dice-choice" data-guess="3">⚂</button>
                    <button class="gc-btn gc-dice-choice" data-guess="4">⚃</button>
                    <button class="gc-btn gc-dice-choice" data-guess="5">⚄</button>
                    <button class="gc-btn gc-dice-choice" data-guess="6">⚅</button>
                </div>
            </div>
            <div id="gcDiceResult"></div>
        </div>`;
        let selectedGuess = 'big';
        c.querySelectorAll('.gc-dice-choice').forEach(b => {
            b.addEventListener('click', () => {
                c.querySelectorAll('.gc-dice-choice').forEach(x => x.classList.remove('gc-btn-primary'));
                b.classList.add('gc-btn-primary');
                selectedGuess = b.dataset.guess;
            });
        });
        // auto-roll on choice
        c.querySelectorAll('.gc-dice-choice').forEach(b => b.addEventListener('click', async () => {
            const bet = parseInt(document.getElementById('gcDiceBet')?.value)||5;
            const res = await this.api('/dice/roll', { method:'POST', body: JSON.stringify({ bet, guess: selectedGuess }) });
            const el = document.getElementById('gcDiceResult');
            el.innerHTML = `<div class="gc-dice-result gc-animate-pop ${res.won?'gc-correct':'gc-wrong'}">
                <div class="gc-dice-display">${res.diceEmoji||''}</div>
                <div>总和: ${res.total} ${res.isTriple?'🔥 豹子！':''}</div>
                <div>${res.message}</div>
            </div>`;
            this.toast(res.message);
            if (res.won) { await this.loadOverview(); this.updateBalanceBar(); }
        }));
    }

    // === 🍀 幸运数字 ===
    renderLuckyNum() {
        const c = document.getElementById('gcContent');
        c.innerHTML = `<div class="gc-luckynum">
            <h2>🍀 幸运数字</h2>
            <p>每天猜一个0-99的数字，越接近奖励越多！</p>
            <div class="gc-luckynum-form">
                <input id="gcLuckyNum" class="gc-input" type="number" min="0" max="99" placeholder="0-99" style="width:120px;font-size:24px;text-align:center">
                <button id="gcLuckyGuess" class="gc-btn gc-btn-primary gc-btn-lg">🍀 猜！</button>
            </div>
            <div id="gcLuckyResult"></div>
            <div class="gc-luckynum-rewards">
                <h3>🎁 奖励表</h3>
                <div>🎯 完全命中: +100🪙</div>
                <div>🔥 差2以内: +30🪙</div>
                <div>😊 差5以内: +10🪙</div>
                <div>👍 差10以内: +3🪙</div>
            </div>
        </div>`;
        document.getElementById('gcLuckyGuess')?.addEventListener('click', async () => {
            const num = parseInt(document.getElementById('gcLuckyNum')?.value);
            if (isNaN(num)||num<0||num>99) { this.toast('请输入0-99'); return; }
            const res = await this.api('/lucky-number/guess', { method:'POST', body: JSON.stringify({ number: num }) });
            const el = document.getElementById('gcLuckyResult');
            el.innerHTML = `<div class="gc-lucky-result gc-animate-pop ${res.reward>0?'gc-correct':'gc-wrong'}">
                <div>今日幸运数字: <strong>${res.luckyNumber}</strong></div>
                <div>你猜的: <strong>${num}</strong> | 差距: ${res.diff}</div>
                <div>${res.message}</div>
            </div>`;
            this.toast(res.message);
        });
    }

    // === 🔮 每日运势 ===
    async renderFortune() {
        const c = document.getElementById('gcContent');
        try {
            const data = await this.api('/fortune');
            const f = data.fortune;
            c.innerHTML = `<div class="gc-fortune">
                <h2>🔮 每日运势</h2>
                ${f ? `<div class="gc-fortune-card gc-animate-pop">
                    <div class="gc-fortune-level">${f.emoji} ${esc(f.level)}</div>
                    <div class="gc-fortune-text">${esc(f.text)}</div>
                    <div class="gc-fortune-details">
                        <div>幸运色: ${f.lucky_color}</div>
                        <div>幸运数字: ${f.lucky_number}</div>
                        <div>运势倍率: x${f.luck}</div>
                    </div>
                </div>` : '<p class="gc-empty">获取运势失败</p>'}
            </div>`;
        } catch(e) { c.innerHTML = '<p class="gc-error">加载失败</p>'; }
    }

    toast(msg) {
        const t = document.createElement('div');
        t.textContent = msg;
        Object.assign(t.style, { position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%)',background:'rgba(0,0,0,0.8)',color:'#fff',padding:'12px 24px',borderRadius:'8px',fontSize:'14px',zIndex:'10000',transition:'opacity 0.3s',maxWidth:'80%',textAlign:'center' });
        document.body.appendChild(t);
        setTimeout(()=>{t.style.opacity='0';setTimeout(()=>t.remove(),300);},2500);
    }
}

window.gameCenter = new GameCenter();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => window.gameCenter.init());
else window.gameCenter.init();

export default GameCenter;
