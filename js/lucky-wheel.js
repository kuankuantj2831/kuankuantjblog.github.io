/**
 * 幸运大转盘组件
 * 消耗硬币抽奖，奖品包括积分、徽章、虚拟道具
 */

import { API_BASE_URL } from './api-config.js?v=20260419b';

class LuckyWheel {
    constructor(options = {}) {
        this.containerId = options.containerId || 'luckyWheelContainer';
        this.cost = options.cost || 10; // 每次抽奖消耗硬币
        this.prizes = options.prizes || this.getDefaultPrizes();
        this.onWin = options.onWin || (() => {});
        this.token = localStorage.getItem('token');
        this.isSpinning = false;
    }

    getDefaultPrizes() {
        return [
            { id: 'coin_100', name: '100 硬币', icon: '🪙', value: 100, type: 'coin', color: '#FFD700', probability: 0.15 },
            { id: 'coin_50', name: '50 硬币', icon: '🪙', value: 50, type: 'coin', color: '#FFA500', probability: 0.20 },
            { id: 'coin_20', name: '20 硬币', icon: '🪙', value: 20, type: 'coin', color: '#FF8C00', probability: 0.25 },
            { id: 'coin_10', name: '10 硬币', icon: '🪙', value: 10, type: 'coin', color: '#FF6347', probability: 0.20 },
            { id: 'exp_50', name: '50 经验', icon: '⭐', value: 50, type: 'exp', color: '#667eea', probability: 0.12 },
            { id: 'badge_lucky', name: '幸运徽章', icon: '🍀', value: 1, type: 'badge', color: '#32CD32', probability: 0.05 },
            { id: 'exp_200', name: '200 经验', icon: '🚀', value: 200, type: 'exp', color: '#764ba2', probability: 0.02 },
            { id: 'joke', name: '谢谢参与', icon: '😅', value: 0, type: 'none', color: '#ccc', probability: 0.01 }
        ];
    }

    init() {
        this.render();
        this.bindEvents();
    }

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const canvasSize = Math.min(320, window.innerWidth - 40);
        const segmentAngle = 360 / this.prizes.length;

        container.innerHTML = `
            <div class="lucky-wheel-wrapper" style="text-align:center;padding:20px;">
                <div class="wheel-header" style="margin-bottom:20px;">
                    <h3 style="font-size:20px;margin:0 0 8px;">🎰 幸运大转盘</h3>
                    <p style="color:#999;font-size:13px;margin:0;">每次消耗 ${this.cost} 硬币，试试手气吧！</p>
                </div>
                <div class="wheel-container" style="position:relative;display:inline-block;">
                    <canvas id="luckyWheelCanvas" width="${canvasSize}" height="${canvasSize}" 
                        style="border-radius:50%;box-shadow:0 8px 30px rgba(0,0,0,0.2);"></canvas>
                    <div class="wheel-pointer" style="
                        position:absolute;
                        top:-15px;left:50%;transform:translateX(-50%);
                        width:0;height:0;
                        border-left:15px solid transparent;
                        border-right:15px solid transparent;
                        border-top:30px solid #ff4757;
                        filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));
                        z-index:10;
                    "></div>
                    <button id="spinBtn" style="
                        position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
                        width:70px;height:70px;border-radius:50%;border:4px solid #fff;
                        background:linear-gradient(135deg,#ff4757,#ff6348);
                        color:#fff;font-size:14px;font-weight:bold;cursor:pointer;
                        box-shadow:0 4px 15px rgba(255,71,87,0.4);
                        z-index:5;transition:all 0.2s;
                    ">开始</button>
                </div>
                <div class="wheel-info" style="margin-top:20px;">
                    <div id="wheelResult" style="min-height:40px;font-size:16px;color:#333;"></div>
                    <div style="margin-top:12px;display:flex;justify-content:center;gap:20px;font-size:13px;color:#999;">
                        <span>剩余硬币: <strong id="wheelCoinBalance" style="color:#f5af19;">--</strong></span>
                        <span>今日剩余: <strong id="wheelDailyLeft" style="color:#667eea;">--</strong></span>
                    </div>
                </div>
                <div class="wheel-prizes" style="margin-top:20px;">
                    <p style="font-size:12px;color:#999;margin:0 0 10px;">奖品一览</p>
                    <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;">
                        ${this.prizes.map(p => `
                            <span style="
                                display:inline-flex;align-items:center;gap:4px;
                                padding:4px 10px;border-radius:12px;
                                background:${p.color}15;color:${p.color};
                                font-size:12px;border:1px solid ${p.color}30;
                            ">${p.icon} ${p.name}</span>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        this.drawWheel(canvasSize);
        this.updateBalanceDisplay();
    }

    drawWheel(size) {
        const canvas = document.getElementById('luckyWheelCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 2 - 5;
        const segmentAngle = (2 * Math.PI) / this.prizes.length;

        ctx.clearRect(0, 0, size, size);

        this.prizes.forEach((prize, i) => {
            const startAngle = i * segmentAngle - Math.PI / 2;
            const endAngle = (i + 1) * segmentAngle - Math.PI / 2;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = i % 2 === 0 ? prize.color : this.lightenColor(prize.color, 20);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 绘制文字
            const textAngle = startAngle + segmentAngle / 2;
            const textX = centerX + Math.cos(textAngle) * (radius * 0.65);
            const textY = centerY + Math.sin(textAngle) * (radius * 0.65);
            ctx.save();
            ctx.translate(textX, textY);
            ctx.rotate(textAngle + Math.PI / 2);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(prize.icon, 0, -5);
            ctx.font = '10px sans-serif';
            ctx.fillText(prize.name, 0, 10);
            ctx.restore();
        });

        // 中心圆
        ctx.beginPath();
        ctx.arc(centerX, centerY, 35, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#eee';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `rgb(${R},${G},${B})`;
    }

    bindEvents() {
        const btn = document.getElementById('spinBtn');
        if (btn) {
            btn.addEventListener('click', () => this.spin());
        }
    }

    async spin() {
        if (this.isSpinning) return;
        if (!this.token) {
            alert('请先登录！');
            return;
        }

        // 检查硬币余额
        const balance = await this.getCoinBalance();
        if (balance < this.cost) {
            alert(`硬币不足！需要 ${this.cost} 硬币，当前 ${balance}`);
            return;
        }

        this.isSpinning = true;
        const btn = document.getElementById('spinBtn');
        btn.style.transform = 'translate(-50%,-50%) scale(0.9)';
        btn.disabled = true;

        // 确定奖品
        const prize = this.selectPrize();
        const prizeIndex = this.prizes.findIndex(p => p.id === prize.id);
        const segmentAngle = 360 / this.prizes.length;

        // 计算最终角度（指针在顶部，所以需要让目标扇区转到顶部）
        // 加随机偏移让结果不那么"正中"
        const randomOffset = Math.random() * (segmentAngle - 10) + 5;
        const targetAngle = 360 - (prizeIndex * segmentAngle + randomOffset);
        const spins = 5 + Math.floor(Math.random() * 3); // 5-7圈
        const finalRotation = spins * 360 + targetAngle;

        const canvas = document.getElementById('luckyWheelCanvas');
        canvas.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
        canvas.style.transform = `rotate(${finalRotation}deg)`;

        // 播放音效（可选）
        this.playSpinSound();

        setTimeout(() => {
            this.showResult(prize);
            this.isSpinning = false;
            btn.style.transform = 'translate(-50%,-50%) scale(1)';
            btn.disabled = false;
            this.updateBalanceDisplay();
            this.onWin(prize);

            // 重置转盘位置（视觉上）
            setTimeout(() => {
                canvas.style.transition = 'none';
                canvas.style.transform = `rotate(${finalRotation % 360}deg)`;
            }, 500);
        }, 4000);
    }

    selectPrize() {
        const rand = Math.random();
        let cumulative = 0;
        for (const prize of this.prizes) {
            cumulative += prize.probability;
            if (rand <= cumulative) return prize;
        }
        return this.prizes[this.prizes.length - 1];
    }

    async getCoinBalance() {
        try {
            const response = await fetch(`${API_BASE_URL}/coins/balance`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (response.ok) {
                const data = await response.json();
                return data.balance || 0;
            }
        } catch (e) {}
        return 0;
    }

    async updateBalanceDisplay() {
        const balance = await this.getCoinBalance();
        const balanceEl = document.getElementById('wheelCoinBalance');
        if (balanceEl) balanceEl.textContent = balance;

        // 今日剩余次数（前端模拟，实际应从后端获取）
        const dailyLeftEl = document.getElementById('wheelDailyLeft');
        if (dailyLeftEl) {
            const todaySpins = parseInt(localStorage.getItem('wheel_daily_spins') || '0');
            const dailyLimit = 10;
            dailyLeftEl.textContent = Math.max(0, dailyLimit - todaySpins);
        }
    }

    showResult(prize) {
        const resultEl = document.getElementById('wheelResult');
        if (!resultEl) return;

        if (prize.type === 'none') {
            resultEl.innerHTML = `<span style="color:#999;">😅 谢谢参与，下次好运！</span>`;
        } else {
            resultEl.innerHTML = `
                <span style="display:inline-block;animation:bounceIn 0.6s;">
                    🎉 恭喜获得 <strong style="color:${prize.color};">${prize.icon} ${prize.name}</strong>！
                </span>
            `;
            this.confettiEffect();
        }

        // 记录今日抽奖次数
        const today = new Date().toDateString();
        const savedDate = localStorage.getItem('wheel_daily_date');
        if (savedDate !== today) {
            localStorage.setItem('wheel_daily_date', today);
            localStorage.setItem('wheel_daily_spins', '1');
        } else {
            const count = parseInt(localStorage.getItem('wheel_daily_spins') || '0');
            localStorage.setItem('wheel_daily_spins', (count + 1).toString());
        }
    }

    confettiEffect() {
        const colors = ['#ff4757', '#ffa502', '#2ed573', '#1e90ff', '#ff6348'];
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position:fixed;left:50%;top:50%;width:8px;height:8px;
                background:${colors[Math.floor(Math.random() * colors.length)]};
                border-radius:50%;pointer-events:none;z-index:9999;
            `;
            document.body.appendChild(particle);

            const angle = Math.random() * Math.PI * 2;
            const velocity = 100 + Math.random() * 200;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;

            particle.animate([
                { transform: 'translate(-50%,-50%)', opacity: 1 },
                { transform: `translate(calc(-50% + ${vx}px), calc(-50% + ${vy}px))`, opacity: 0 }
            ], {
                duration: 800 + Math.random() * 400,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }).onfinish = () => particle.remove();
        }
    }

    playSpinSound() {
        try {
            const audio = new Audio();
            audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleR0NZKrk7rNsGgxJkNTsvXwkDk+L0O+0dSQPUIjN7LRvJQ5MiMzrsnMiDkyGzOuwdyQOTIfM6q12JQ5MhszprnYlDkuGzOmrdiUOTIbM6Kl1JQ5LhszoqHMlDkyGzOijciUOTIfM56FtJQ5Mh8zmm20lDkyHzOaWbCUOTIfM5ZBrJQ5Mh8zkjGglDkyHzOR/ZyUPTIfM4n5iJQ9MhszfeF8lD0uGzNt2WyUPTIbM13BZJQ9LhszUbFglD0uGzNNnViUPTIfMzGBQJQ9MhszFWk4lD0yGzMFQPiUPTIbMvD0+JQ9Mhsy2ODolD0yGzLEsOiUPTIbMrSU3JQ9MhsysHzQlD0yGyqcbMyUPTIbKohcwJQ9MhsmdGC4lD0yGyZgVLCUPTIbJlREoJQ9MhsiQDyMlD0yGx4UNHiUPTIbGgAwcJQ9MhsV9ChglD0yGxHoIFyUPTIbEdgYXJQ9MhsNuBRMlD0yGwGUDECUPTIa+ZAMQJQ9Mhr1f+A8lD0yGvF/3DyUPTIa6XPQOJQ9Mhrda8g0lD0yGtVjuDCUPTIayVOoKJQ9MhrBS5gklD0yGrk7kBiUPTIasTOIFJQ9MhqxL3gMlD0yGqEjeAiUPTIanRtcBJQ9MhqVG1P4kD0yGo0PT+yQPTIagQtD5JA9Mhp8+0PckD0yGmjnO9SQPTIaXN8j0JA9MhpM1x/IkD0yGjzTC8iQPTIaMML/xJA9MhofAve8kD0yGhcC67iQPTIaCv+jsJA9Mhn++5+kkD0yGfL3i5yQPTIZ7vN7lJA9Mhni83OUkD0yGd7vY4yQPTIZ1utrgJA9MhnK62d8kD0yGcLrX3SQPTIZtutXdJA9Mhmq60tskD0yGZbrO2CQPTIZjul7WJA9MhmK6VtIkD0yGXrpU0iQPTIZYulLOJA9MhlK6TMYkD0yGTrpGwCQPTIZKuj6+JA9MhkK46vSQPTIY+uDu8JA9Mhjq44rgkD0yGNLjctyQPTIYyuNu0JA9Mhiq40bAkD0yGJrC5rCQPTIYe';
            audio.volume = 0.3;
            audio.play().catch(() => {});
        } catch (e) {}
    }
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes bounceIn {
        0% { transform: scale(0.3); opacity: 0; }
        50% { transform: scale(1.05); }
        70% { transform: scale(0.9); }
        100% { transform: scale(1); opacity: 1; }
    }
`;
document.head.appendChild(style);

export default LuckyWheel;
