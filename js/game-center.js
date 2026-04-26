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
