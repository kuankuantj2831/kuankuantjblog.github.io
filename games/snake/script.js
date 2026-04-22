// --- DOM Elements ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const timeElement = document.getElementById('time');
const highScoreElement = document.getElementById('highScore');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');
const achievementContainer = document.getElementById('achievement-container');
const saveButton = document.getElementById('saveButton');
const loadButton = document.getElementById('loadButton');
const saveCodeInput = document.getElementById('saveCodeInput');
const newGameButton = document.getElementById('newGameButton');
const mobileControls = document.getElementById('mobile-controls');
const achievementsButton = document.getElementById('achievementsButton');
const achievementsModal = document.getElementById('achievements-modal');
const achievementsList = document.getElementById('achievements-list');
const closeAchievementsButton = document.getElementById('close-achievements');

// --- Game Settings ---
const GRID_SIZE = 20;
const CANVAS_GRID_WIDTH = canvas.width / GRID_SIZE;
const CANVAS_GRID_HEIGHT = canvas.height / GRID_SIZE;
const GAME_SPEED = 150; // ms

// --- Game State ---
let snake, food, direction, score, time, gameOver, gameInterval, timeInterval, highestScore = 0;
let isPaused = false;
let directionChangedThisFrame = false;
let playerStats = {}; // New tracker for achievements

// --- Achievements ---
const achievements = {
    HELLO_WORLD: { title: '首次驾驶', description: '第一次开始游戏', unlocked: false },
    FIRST_MOVE_UP: { title: '向上', description: '第一次向上移动', unlocked: false },
    FIRST_MOVE_DOWN: { title: '向下', description: '第一次向下移动', unlocked: false },
    FIRST_MOVE_LEFT: { title: '向左', description: '第一次向左移动', unlocked: false },
    FIRST_MOVE_RIGHT: { title: '向右', description: '第一次向右移动', unlocked: false },
    WALL_TELEPORT: { title: '“我在这儿！”', description: '第一次穿过边界', unlocked: false },
    FIRST_BLOOD: { title: '初次连接', description: '第一次吃到食物', unlocked: false },
    SCORE_2: { title: '再来一个', description: '分数达到2分', unlocked: false },
    SCORE_5: { title: '崭露头角', description: '分数达到5分', unlocked: false },
    SCORE_10: { title: '技术娴熟', description: '分数达到10分', unlocked: false },
    LENGTH_10: { title: '初具规模', description: '蛇的长度达到10', unlocked: false },
    TIME_15: { title: '反应迅速', description: '存活超过15秒', unlocked: false },
    TIME_30: { title: '渐入佳境', description: '存活超过30秒', unlocked: false },
    FIRST_DEATH: { title: '信号中断', description: '第一次游戏结束', unlocked: false },
    SO_CLOSE: { title: '就差一点！', description: '在离最高分不到5分时失败', unlocked: false }
};

let gameStartedOnce = false;

function updateHighScoreDisplay() { highScoreElement.textContent = highestScore; }

function loadAchievements() {
    const unlocked = JSON.parse(localStorage.getItem('unlockedAchievements')) || [];
    unlocked.forEach(id => { if (achievements[id]) achievements[id].unlocked = true; });
    highestScore = parseInt(localStorage.getItem('highestScore')) || 0;
    updateHighScoreDisplay();
    gameStartedOnce = localStorage.getItem('gameStartedOnce') === 'true';
}

function unlockAchievement(id) {
    if (!achievements[id] || achievements[id].unlocked) return;
    achievements[id].unlocked = true;
    const unlocked = JSON.parse(localStorage.getItem('unlockedAchievements')) || [];
    if (!unlocked.includes(id)) {
        unlocked.push(id);
        localStorage.setItem('unlockedAchievements', JSON.stringify(unlocked));
    }
    showAchievementToast(achievements[id]);
}

function showAchievementToast(achievement) {
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `<h3>${achievement.title}</h3><p>${achievement.description}</p>`;
    achievementContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

function checkAchievements() {
    if (gameOver) return;
    // Score based
    if (score >= 1) unlockAchievement('FIRST_BLOOD');
    if (score >= 2) unlockAchievement('SCORE_2');
    if (score >= 5) unlockAchievement('SCORE_5');
    if (score >= 10) unlockAchievement('SCORE_10');
    // Length based
    if (snake.length >= 10) unlockAchievement('LENGTH_10');
    // Time based
    if (time >= 15) unlockAchievement('TIME_15');
    if (time >= 30) unlockAchievement('TIME_30');
    // Stat based
    if (playerStats.teleported) unlockAchievement('WALL_TELEPORT');
    if (playerStats.movedUp) unlockAchievement('FIRST_MOVE_UP');
    if (playerStats.movedDown) unlockAchievement('FIRST_MOVE_DOWN');
    if (playerStats.movedLeft) unlockAchievement('FIRST_MOVE_LEFT');
    if (playerStats.movedRight) unlockAchievement('FIRST_MOVE_RIGHT');
}

// --- Save/Load Functions ---
function saveGame() {
    try {
        if (gameOver) { alert("游戏已结束，无法存档！"); return; }
        pauseGame();
        const saveData = { 
            snake: JSON.parse(JSON.stringify(snake)), // 深拷贝避免引用问题
            food: JSON.parse(JSON.stringify(food)), 
            direction: direction, 
            score: score, 
            time: time, 
            highestScore: highestScore, 
            gameStartedOnce: gameStartedOnce, 
            playerStats: JSON.parse(JSON.stringify(playerStats)),
            unlockedAchievements: Object.keys(achievements).filter(id => achievements[id].unlocked) 
        };
        const saveCode = btoa(unescape(encodeURIComponent(JSON.stringify(saveData))));
        saveCodeInput.value = saveCode;
        navigator.clipboard.writeText(saveCode).then(() => { 
            alert('游戏已暂停，存档码已复制到剪贴板！'); 
        }).catch(err => { 
            console.error('无法复制存档码: ', err); 
            alert('游戏已暂停，存档码已生成，请手动复制。'); 
        });
    } catch (error) {
        console.error('存档失败:', error);
        alert('存档失败: ' + error.message);
        if (!isPaused) resumeGame();
    }
}

function loadGame() {
    try {
        const saveCode = saveCodeInput.value.trim();
        if (!saveCode) { alert('请输入存档码！'); return; }
        
        const decodedString = decodeURIComponent(escape(atob(saveCode)));
        const saveData = JSON.parse(decodedString);
        
        if (!saveData.snake || !saveData.food || !saveData.direction || saveData.score === undefined || saveData.time === undefined) { 
            throw new Error('存档数据无效或不完整'); 
        }
        
        // 验证数据类型
        if (!Array.isArray(saveData.snake) || typeof saveData.direction !== 'string' || 
            typeof saveData.score !== 'number' || typeof saveData.time !== 'number') {
            throw new Error('存档数据类型无效');
        }
        
        snake = JSON.parse(JSON.stringify(saveData.snake));
        food = JSON.parse(JSON.stringify(saveData.food)); 
        direction = saveData.direction; 
        score = saveData.score; 
        time = saveData.time;
        highestScore = saveData.highestScore || highestScore;
        gameStartedOnce = saveData.gameStartedOnce || gameStartedOnce;
        playerStats = saveData.playerStats || createNewPlayerStats();

        localStorage.setItem('highestScore', highestScore);
        localStorage.setItem('gameStartedOnce', gameStartedOnce);

        updateHighScoreDisplay();
        Object.keys(achievements).forEach(id => achievements[id].unlocked = false);
        saveData.unlockedAchievements.forEach(id => { if(achievements[id]) achievements[id].unlocked = true; });
        localStorage.setItem('unlockedAchievements', JSON.stringify(saveData.unlockedAchievements));
        
        isPaused = false; 
        gameOver = false;
        scoreElement.textContent = score; 
        timeElement.textContent = time;
        gameOverScreen.classList.add('hidden');
        resumeGame(); 
        draw();
        alert('存档读取成功！游戏已恢复。');
        saveCodeInput.value = "";
    } catch (error) {
        console.error('读取存档失败:', error);
        alert('读取存档失败！存档码可能已损坏或无效。');
        if(isPaused) resumeGame();
    }
}

function pauseGame() { if(gameOver) return; isPaused = true; clearInterval(gameInterval); clearInterval(timeInterval); }
function resumeGame() {
    if (!isPaused || gameOver) return;
    isPaused = false;
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, GAME_SPEED);
    if (timeInterval) clearInterval(timeInterval);
    timeInterval = setInterval(() => { if (!isPaused) { time++; timeElement.textContent = time; checkAchievements(); } }, 1000);
}

function createNewPlayerStats() {
    return { movedUp: false, movedDown: false, movedLeft: false, movedRight: false, teleported: false };
}

// --- Game Functions ---
function startGame() {
    if (!gameStartedOnce) { unlockAchievement('HELLO_WORLD'); gameStartedOnce = true; localStorage.setItem('gameStartedOnce', 'true'); }
    snake = [{ x: 10, y: 10 }];
    direction = 'right'; score = 0; time = 0;
    gameOver = false; isPaused = false;
    playerStats = createNewPlayerStats();
    scoreElement.textContent = score; timeElement.textContent = time;
    updateHighScoreDisplay();
    gameOverScreen.classList.add('hidden');
    generateFood();
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, GAME_SPEED);
    if (timeInterval) clearInterval(timeInterval);
    timeInterval = setInterval(() => { if (!isPaused) { time++; timeElement.textContent = time; checkAchievements(); } }, 1000);
}

function generateFood() {
    food = { x: Math.floor(Math.random() * CANVAS_GRID_WIDTH), y: Math.floor(Math.random() * CANVAS_GRID_HEIGHT) };
    for (let part of snake) { if (part.x === food.x && part.y === food.y) { generateFood(); return; } }
}

function gameLoop() { if (gameOver || isPaused) return; update(); draw(); }

function update() {
    directionChangedThisFrame = false;
    const head = { x: snake[0].x, y: snake[0].y };
    switch (direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }
    if (head.x < 0) { head.x = CANVAS_GRID_WIDTH - 1; playerStats.teleported = true; }
    if (head.x >= CANVAS_GRID_WIDTH) { head.x = 0; playerStats.teleported = true; }
    if (head.y < 0) { head.y = CANVAS_GRID_HEIGHT - 1; playerStats.teleported = true; }
    if (head.y >= CANVAS_GRID_HEIGHT) { head.y = 0; playerStats.teleported = true; }

    if (checkCollision(head)) { endGame(); return; }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) { score++; scoreElement.textContent = score; generateFood(); } 
    else { snake.pop(); }
    checkAchievements();
}

function checkCollision(head) {
    for (let i = 1; i < snake.length; i++) { if (head.x === snake[i].x && head.y === snake[i].y) { return true; } }
    return false;
}

function draw() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(92, 206, 238, 0.1)';
    for (let x = 0; x <= canvas.width; x += GRID_SIZE) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
    for (let y = 0; y <= canvas.height; y += GRID_SIZE) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
    snake.forEach((part, index) => {
        const partX = part.x * GRID_SIZE; const partY = part.y * GRID_SIZE;
        if (index === 0) { ctx.fillStyle = '#8ef'; } 
        else { const intensity = 1 - (index / snake.length) * 0.5; ctx.fillStyle = `rgba(92, 206, 238, ${intensity})`;}
        ctx.fillRect(partX, partY, GRID_SIZE, GRID_SIZE);
        ctx.strokeStyle = '#1a1a2e';
        ctx.strokeRect(partX, partY, GRID_SIZE, GRID_SIZE);
    });
    ctx.fillStyle = '#ff8a80'; ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    ctx.strokeStyle = '#c55'; ctx.strokeRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
}

function endGame() {
    gameOver = true; clearInterval(gameInterval); clearInterval(timeInterval);
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
    unlockAchievement('FIRST_DEATH');
    if (highestScore > 0 && score < highestScore && highestScore - score <= 5) { unlockAchievement('SO_CLOSE'); }
    if (score > highestScore) { highestScore = score; localStorage.setItem('highestScore', highestScore); updateHighScoreDisplay(); }
    submitScore(score, time);
}

function handleDirectionChange(newDirection) {
    if (directionChangedThisFrame || isPaused) return;
    const oppositeDirections = { 'up': 'down', 'down': 'up', 'left': 'right', 'right': 'left' };
    if (direction !== oppositeDirections[newDirection]) {
        switch(newDirection){
            case 'up': playerStats.movedUp = true; break;
            case 'down': playerStats.movedDown = true; break;
            case 'left': playerStats.movedLeft = true; break;
            case 'right': playerStats.movedRight = true; break;
        }
        direction = newDirection;
        directionChangedThisFrame = true;
    }
}

function renderAchievements() {
    achievementsList.innerHTML = '';
    for (const id in achievements) {
        const achievement = achievements[id];
        const item = document.createElement('div');
        item.className = 'achievement-item';
        if (achievement.unlocked) { item.classList.add('unlocked'); }
        item.innerHTML = `<h3>${achievement.title}</h3><p>${achievement.description}</p>`;
        achievementsList.appendChild(item);
    }
}

// --- Event Listeners ---
document.addEventListener('keydown', e => {
    if (e.key === 'p' || e.key === ' ') { e.preventDefault(); if (isPaused) resumeGame(); else pauseGame(); return; }
    switch (e.key) {
        case 'ArrowUp': case 'w': handleDirectionChange('up'); break;
        case 'ArrowDown': case 's': handleDirectionChange('down'); break;
        case 'ArrowLeft': case 'a': handleDirectionChange('left'); break;
        case 'ArrowRight': case 'd': handleDirectionChange('right'); break;
    }
});
restartButton.addEventListener('click', startGame);
saveButton.addEventListener('click', saveGame);
loadButton.addEventListener('click', loadGame);
newGameButton.addEventListener('click', startGame);
achievementsButton.addEventListener('click', () => { renderAchievements(); achievementsModal.classList.remove('hidden'); pauseGame(); });
closeAchievementsButton.addEventListener('click', () => { achievementsModal.classList.add('hidden'); resumeGame(); });

// --- Mobile Support ---
function isMobile() { return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent); }
function setupMobileControls() {
    if (isMobile()) {
        mobileControls.classList.remove('hidden');
        document.getElementById('up-button').addEventListener('touchstart', (e) => { e.preventDefault(); handleDirectionChange('up'); });
        document.getElementById('down-button').addEventListener('touchstart', (e) => { e.preventDefault(); handleDirectionChange('down'); });
        document.getElementById('left-button').addEventListener('touchstart', (e) => { e.preventDefault(); handleDirectionChange('left'); });
        document.getElementById('right-button').addEventListener('touchstart', (e) => { e.preventDefault(); handleDirectionChange('right'); });
    }
}

// --- Initial Start ---
loadAchievements();
setupMobileControls();
startGame();

// --- Leaderboard ---
const GAME_NAME = 'snake';

function getApiBase() {
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        return 'http://localhost:9000';
    }
    return 'https://1321178544-65fvlfs2za.ap-beijing.tencentscf.com';
}

async function submitScore(finalScore, playTime) {
    try {
        const token = localStorage.getItem('token');
        if (!token) return; // 未登录不提交
        await fetch(`${getApiBase()}/games/scores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ gameName: GAME_NAME, score: finalScore, playTime: playTime })
        });
    } catch (e) { console.log('分数提交失败:', e.message); }
}

async function loadLeaderboard() {
    const listEl = document.getElementById('leaderboardList');
    const myBestEl = document.getElementById('myBestScore');
    try {
        const res = await fetch(`${getApiBase()}/games/leaderboard/${GAME_NAME}?limit=20`);
        if (!res.ok) throw new Error('加载失败');
        const rows = await res.json();

        if (!rows.length) {
            listEl.innerHTML = '<p style="text-align:center;color:#999;">暂无记录，成为第一个上榜的人吧！</p>';
        } else {
            const medals = ['🥇', '🥈', '🥉'];
            listEl.innerHTML = '<table style="width:100%;border-collapse:collapse;">' +
                '<tr style="color:#faad14;border-bottom:1px solid #333;"><th style="text-align:left;padding:6px;">#</th><th style="text-align:left;padding:6px;">玩家</th><th style="text-align:right;padding:6px;">分数</th><th style="text-align:right;padding:6px;">时间</th></tr>' +
                rows.map((r, i) => {
                    const rank = i < 3 ? medals[i] : (i + 1);
                    const name = r.username || '匿名';
                    return `<tr style="border-bottom:1px solid #222;"><td style="padding:6px;">${rank}</td><td style="padding:6px;">${escapeText(name)}</td><td style="text-align:right;padding:6px;color:#faad14;font-weight:bold;">${r.score}</td><td style="text-align:right;padding:6px;color:#888;">${r.play_time}s</td></tr>`;
                }).join('') + '</table>';
        }

        // 个人最高分
        const token = localStorage.getItem('token');
        if (token) {
            const myRes = await fetch(`${getApiBase()}/games/my-best/${GAME_NAME}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (myRes.ok) {
                const my = await myRes.json();
                myBestEl.innerHTML = `🎮 我的最高分: <strong style="color:#faad14;">${my.best_score || 0}</strong> | 游玩次数: ${my.play_count || 0}`;
            } else {
                myBestEl.innerHTML = '🎮 登录后可查看个人记录';
            }
        } else {
            myBestEl.innerHTML = '🎮 <a href="/index-chinese.html" style="color:#faad14;">登录</a>后可提交分数和查看个人记录';
        }
    } catch (e) {
        console.error('排行榜加载失败:', e);
        listEl.innerHTML = '<p style="text-align:center;color:#ff6b6b;">加载失败，请重试</p>';
    }
}

function escapeText(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

// 排行榜按钮事件
document.getElementById('viewLeaderboard').addEventListener('click', () => {
    document.getElementById('leaderboardList').innerHTML = '加载中...';
    document.getElementById('myBestScore').innerHTML = '';
    document.getElementById('leaderboardPanel').classList.remove('hidden');
    document.getElementById('leaderboardPanel').style.display = 'flex';
    loadLeaderboard();
});
document.getElementById('closeLeaderboard').addEventListener('click', () => {
    document.getElementById('leaderboardPanel').classList.add('hidden');
    document.getElementById('leaderboardPanel').style.display = 'none';
});
