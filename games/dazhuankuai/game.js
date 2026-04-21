// 打砖块游戏 - 主逻辑
// 游戏常量
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 15;
const BALL_RADIUS = 10;
const BALL_INITIAL_SPEED = 3;  // 降低初始速度
const BRICK_ROWS = 6;
const BRICK_COLUMNS = 10;
const BRICK_WIDTH = 70;
const BRICK_HEIGHT = 25;
const BRICK_GAP = 5;
const BRICK_PADDING_TOP = 60;
const BRICK_PADDING_SIDE = 30;
const COLORS = [
    '#FF3366', '#FF9933', '#FFCC00', '#33CC33', '#3399FF', '#9966FF'
];

// 游戏状态
let canvas, ctx;
let gameRunning = false;
let gamePaused = false;
let gameOver = false;
let waitingLaunch = false;  // 是否等待发射
let level = 1;
let score = 0;
let lives = 3;
let ballSpeed = BALL_INITIAL_SPEED;
let ballSpeedMultiplier = 1.0;

// 游戏对象
let paddle = {
    x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
    y: CANVAS_HEIGHT - 40,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    color: '#00CCFF',
    dx: 0
};

let ball = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 60,
    radius: BALL_RADIUS,
    color: '#FFCC00',
    speed: ballSpeed,
    dx: 0,
    dy: 0,
    launched: false
};

let bricks = [];
let particles = [];

// DOM元素
const livesElement = document.getElementById('lives');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const speedElement = document.getElementById('speed');
const overlay = document.getElementById('gameOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const restartButton = document.getElementById('restartButton');
const volumeSlider = document.getElementById('volumeSlider');
const difficultySlider = document.getElementById('difficultySlider');
const muteButton = document.getElementById('muteButton');
const bounceSound = document.getElementById('bounceSound');
const breakSound = document.getElementById('breakSound');
const gameOverSound = document.getElementById('gameOverSound');
const levelUpSound = document.getElementById('levelUpSound');

// 初始化游戏
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    generateBricks();

    // 事件监听
    document.addEventListener('keydown', keyDown);
    canvas.addEventListener('mousemove', mouseMove);
    // 点击canvas发射小球或开始游戏
    canvas.addEventListener('click', handleCanvasClick);
    // 覆盖层上的按钮
    startButton.addEventListener('click', startGame);
    pauseButton.addEventListener('click', togglePause);
    restartButton.addEventListener('click', resetGame);
    volumeSlider.addEventListener('input', updateVolume);
    difficultySlider.addEventListener('input', updateDifficulty);
    muteButton.addEventListener('click', toggleMute);

    updateUI();
    showOverlay('打砖块', '点击开始游戏按钮或点击下方区域开始！');
    requestAnimationFrame(gameLoop);
}

// 生成砖块
function generateBricks() {
    bricks = [];
    for (let r = 0; r < BRICK_ROWS; r++) {
        for (let c = 0; c < BRICK_COLUMNS; c++) {
            let special = Math.random() < 0.1;
            bricks.push({
                x: BRICK_PADDING_SIDE + c * (BRICK_WIDTH + BRICK_GAP),
                y: BRICK_PADDING_TOP + r * (BRICK_HEIGHT + BRICK_GAP),
                width: BRICK_WIDTH,
                height: BRICK_HEIGHT,
                color: COLORS[r % COLORS.length],
                visible: true,
                special: special,
                specialType: special ? Math.floor(Math.random() * 3) : 0
            });
        }
    }
}

// 游戏循环
function gameLoop() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawBackground();

    if (gameRunning && !gamePaused) {
        update();
    }

    drawPaddle();
    drawBall();
    drawBricks();
    drawParticles();
    drawHUD();

    requestAnimationFrame(gameLoop);
}

// 绘制背景
function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(1, '#1a1a3a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
    }
}

// 绘制挡板
function drawPaddle() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(paddle.x, paddle.y + 5, paddle.width, paddle.height);

    ctx.fillStyle = paddle.color;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);

    const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 204, 255, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(paddle.x + 2, paddle.y + 2, paddle.width - 4, paddle.height - 4);
}

// 绘制小球
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y + 3, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(
        ball.x - 3, ball.y - 3, 1,
        ball.x, ball.y, ball.radius
    );
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(0.5, ball.color);
    gradient.addColorStop(1, '#FF6600');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();
}

// 绘制砖块
function drawBricks() {
    bricks.forEach(brick => {
        if (!brick.visible) return;

        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(brick.x + 2, brick.y + 2, brick.width - 4, brick.height - 4);

        if (brick.special) {
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(brick.x + brick.width / 2, brick.y + brick.height / 2, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000000';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            let symbol = '?';
            if (brick.specialType === 0) symbol = '\u2665';
            else if (brick.specialType === 1) symbol = '\u26A1';
            else if (brick.specialType === 2) symbol = '\u2B06';
            ctx.fillText(symbol, brick.x + brick.width / 2, brick.y + brick.height / 2);
        }
    });
}

// 绘制粒子
function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.life--;

        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }

        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
}

// 绘制HUD
function drawHUD() {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Orbitron';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`\u5206\u6570: ${score}`, 20, 20);
    ctx.fillText(`\u751f\u547d: ${lives}`, 20, 50);
    ctx.fillText(`\u5173\u5361: ${level}`, 20, 80);

    // 等待发射提示
    if (waitingLaunch && gameRunning && !gamePaused) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 28px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText('\u70b9\u51fb\u9f20\u6807\u53d1\u5c04\u5c0f\u7403', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100);
    }

    // 暂停提示
    if (gamePaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#FFCC00';
        ctx.font = 'bold 60px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText('\u5df2\u6682\u505c', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
        ctx.font = 'bold 24px Orbitron';
        ctx.fillText('\u6309 Enter \u7ee7\u7eed', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    }

    // 游戏结束提示
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#FF3366';
        ctx.font = 'bold 70px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText('\u6e38\u620f\u7ed3\u675f', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
        ctx.font = 'bold 30px Orbitron';
        ctx.fillText(`\u6700\u7ec8\u5f97\u5206: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
        ctx.font = 'bold 24px Orbitron';
        ctx.fillText('\u70b9\u51fb\u91cd\u65b0\u5f00\u59cb\u6e38\u620f', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
    }
}

// 更新游戏状态
function update() {
    // 保持挡板在画布内
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > CANVAS_WIDTH) paddle.x = CANVAS_WIDTH - paddle.width;

    // 等待发射时小球跟随挡板
    if (!ball.launched) {
        ball.x = paddle.x + paddle.width / 2;
        ball.y = CANVAS_HEIGHT - 60;
        return;  // 不更新小球位置
    }

    // 发射后移动小球
    ball.x += ball.dx * ballSpeedMultiplier;
    ball.y += ball.dy * ballSpeedMultiplier;

    // 小球与墙壁碰撞
    if (ball.x - ball.radius < 0 || ball.x + ball.radius > CANVAS_WIDTH) {
        ball.dx *= -1;
        createParticles(ball.x, ball.y, ball.color, 5);
        playSound(bounceSound);
    }
    if (ball.y - ball.radius < 0) {
        ball.dy *= -1;
        createParticles(ball.x, ball.y, ball.color, 5);
        playSound(bounceSound);
    }

    // 小球与挡板碰撞
    if (ball.y + ball.radius > paddle.y &&
        ball.y - ball.radius < paddle.y + paddle.height &&
        ball.x + ball.radius > paddle.x &&
        ball.x - ball.radius < paddle.x + paddle.width &&
        ball.dy > 0) {

        let hitPos = (ball.x - paddle.x) / paddle.width;
        hitPos = Math.max(0, Math.min(1, hitPos));
        let angle = (hitPos - 0.5) * Math.PI / 3;

        ball.dx = Math.sin(angle) * ball.speed;
        ball.dy = -Math.cos(angle) * ball.speed;

        createParticles(ball.x, ball.y, paddle.color, 8);
        playSound(bounceSound);
    }

    // 小球掉出底部
    if (ball.y > CANVAS_HEIGHT) {
        loseLife();
    }

    // 小球与砖块碰撞
    bricks.forEach(brick => {
        if (!brick.visible) return;

        if (ball.x + ball.radius > brick.x &&
            ball.x - ball.radius < brick.x + brick.width &&
            ball.y + ball.radius > brick.y &&
            ball.y - ball.radius < brick.y + brick.height) {

            let dx1 = Math.abs(ball.x - brick.x);
            let dx2 = Math.abs(ball.x - (brick.x + brick.width));
            let dy1 = Math.abs(ball.y - brick.y);
            let dy2 = Math.abs(ball.y - (brick.y + brick.height));

            let min = Math.min(dx1, dx2, dy1, dy2);

            if (min === dx1 || min === dx2) {
                ball.dx *= -1;
            } else {
                ball.dy *= -1;
            }

            brick.visible = false;
            createParticles(brick.x + brick.width/2, brick.y + brick.height/2, brick.color, 12);
            playSound(breakSound);

            score += 10 * level;
            if (brick.special) {
                score += 50;
                applySpecialEffect(brick.specialType);
            }

            if (bricks.every(b => !b.visible)) {
                levelUp();
            }

            updateUI();
        }
    });
}

// 创建粒子效果
function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            dx: (Math.random() - 0.5) * 8,
            dy: (Math.random() - 0.5) * 8,
            radius: Math.random() * 4 + 2,
            color: color,
            life: Math.random() * 30 + 30,
            maxLife: 60
        });
    }
}

// 应用砖块特殊效果
function applySpecialEffect(type) {
    switch (type) {
        case 0:
            lives++;
            showMessage('\u989d\u5916\u751f\u547d\uff01', '#00FFAA');
            break;
        case 1:
            ballSpeedMultiplier *= 1.2;
            showMessage('\u52a0\u901f\uff01', '#FFCC00');
            setTimeout(() => {
                ballSpeedMultiplier /= 1.2;
            }, 5000);
            break;
        case 2:
            paddle.width *= 1.5;
            showMessage('\u6321\u677f\u53d8\u5927\uff01', '#3399FF');
            setTimeout(() => {
                paddle.width /= 1.5;
            }, 8000);
            break;
    }
    updateUI();
}

// 升级
function levelUp() {
    level++;
    ballSpeed += 0.3;  // 每关增加速度少一点
    ballSpeedMultiplier = 1.0;

    // 重置小球到等待发射状态
    ball.dx = 0;
    ball.dy = 0;
    ball.launched = false;
    waitingLaunch = true;

    generateBricks();

    showMessage(`\u7b2c ${level} \u5173\uff01`, '#FF3366');
    playSound(levelUpSound);

    updateUI();
}

// 失去生命
function loseLife() {
    lives--;
    if (lives <= 0) {
        gameOver = true;
        gameRunning = false;
        waitingLaunch = false;
        showOverlay('\u6e38\u620f\u7ed3\u675f', `\u6700\u7ec8\u5f97\u5206: ${score}`);
        playSound(gameOverSound);
    } else {
        // 重置小球到等待发射状态
        ball.dx = 0;
        ball.dy = 0;
        ball.launched = false;
        waitingLaunch = true;
        ballSpeedMultiplier = 1.0;

        showMessage('\u751f\u547d\u4e22\u5931\uff01\u70b9\u51fb\u53d1\u5c04\u5c0f\u7403', '#FF3366');
    }
    updateUI();
}

// 显示临时消息
function showMessage(text, color) {
    console.log(text);
}

// 更新UI元素
function updateUI() {
    livesElement.textContent = lives;
    scoreElement.textContent = score;
    levelElement.textContent = level;

    if (ballSpeedMultiplier < 1.1) {
        speedElement.textContent = '\u666e\u901a';
    } else if (ballSpeedMultiplier < 1.5) {
        speedElement.textContent = '\u5feb';
    } else {
        speedElement.textContent = '\u975e\u5e38\u5feb';
    }
}

// 显示/隐藏覆盖层
function showOverlay(title, text) {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    overlay.classList.remove('hidden');
    startButton.classList.remove('hidden');
    pauseButton.classList.add('hidden');
}

function hideOverlay() {
    overlay.classList.add('hidden');
}

// 开始游戏
function startGame() {
    if (gameOver) resetGame();

    gameRunning = true;
    gamePaused = false;
    gameOver = false;
    waitingLaunch = true;  // 等待用户点击发射
    ball.launched = false;
    ball.dx = 0;
    ball.dy = 0;
    ball.x = paddle.x + paddle.width / 2;
    ball.y = CANVAS_HEIGHT - 60;

    hideOverlay();
    startButton.classList.add('hidden');
    pauseButton.classList.remove('hidden');
}

// 切换暂停
function togglePause() {
    gamePaused = !gamePaused;
    pauseButton.innerHTML = gamePaused ?
        '<i class="fas fa-play"></i> \u7ee7\u7eed' :
        '<i class="fas fa-pause"></i> \u6682\u505c';
}

// 重置游戏
function resetGame() {
    level = 1;
    score = 0;
    lives = 3;
    ballSpeed = BALL_INITIAL_SPEED;
    ballSpeedMultiplier = 1.0;

    paddle.x = CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2;
    paddle.width = PADDLE_WIDTH;

    ball.x = CANVAS_WIDTH / 2;
    ball.y = CANVAS_HEIGHT - 60;
    ball.speed = ballSpeed;
    ball.dx = 0;
    ball.dy = 0;
    ball.launched = false;
    waitingLaunch = false;

    bricks = [];
    particles = [];
    generateBricks();

    gameRunning = false;
    gamePaused = false;
    gameOver = false;

    updateUI();
    showOverlay('\u6253\u7816\u5757', '\u70b9\u51fb\u5f00\u59cb\u6e38\u620f\u6309\u94ae\u6216\u4e0b\u65b9\u533a\u57df\u5f00\u59cb\uff01');
}

// 点击画布处理
function handleCanvasClick() {
    // 游戏未开始时点击画布开始游戏
    if (!gameRunning && !gameOver) {
        startGame();
        return;
    }

    // 游戏结束时点击画布重新开始
    if (gameOver) {
        resetGame();
        return;
    }

    // 等待发射时点击画布发射小球
    if (waitingLaunch && gameRunning && !gamePaused) {
        ball.launched = true;
        waitingLaunch = false;
        ball.dx = ball.speed * (Math.random() > 0.5 ? 1 : -1);
        ball.dy = -ball.speed;
    }
}

// 键盘控制
function keyDown(e) {
    // 防止方向键和空格导致页面滚动
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }

    // Enter键暂停/继续
    if (e.key === 'Enter') {
        if (gameRunning) {
            togglePause();
        }
    }
}

// 鼠标移动控制挡板
function mouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;

    paddle.x = mouseX - paddle.width / 2;

    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > CANVAS_WIDTH) paddle.x = CANVAS_WIDTH - paddle.width;
}

// 音频函数
function playSound(audioElement) {
    if (audioElement.volume === 0) return;

    audioElement.currentTime = 0;
    audioElement.play().catch(e => console.log('\u97f3\u9891\u64ad\u653e\u5931\u8d25:', e));
}

function updateVolume() {
    const volume = volumeSlider.value / 100;
    bounceSound.volume = volume;
    breakSound.volume = volume;
    gameOverSound.volume = volume;
    levelUpSound.volume = volume;
}

function updateDifficulty() {
    const difficulty = difficultySlider.value;
    ball.speed = BALL_INITIAL_SPEED * (0.8 + difficulty * 0.2);
}

function toggleMute() {
    if (volumeSlider.value === '0') {
        volumeSlider.value = 80;
        muteButton.innerHTML = '<i class="fas fa-volume-mute"></i> \u9759\u97f3';
    } else {
        volumeSlider.value = 0;
        muteButton.innerHTML = '<i class="fas fa-volume-up"></i> \u53d6\u6d88\u9759\u97f3';
    }
    updateVolume();
}

// 页面加载时初始化游戏
window.addEventListener('DOMContentLoaded', init);