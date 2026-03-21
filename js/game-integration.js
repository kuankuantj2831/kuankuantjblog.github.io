/**
 * 小游戏集成模块
 * 在网站中嵌入简单游戏，玩完赚硬币
 */

import { API_BASE_URL } from './api-config.js?v=20260223b';

class GameIntegration {
    constructor() {
        this.currentGame = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadGameList();
    }

    bindEvents() {
        // 游戏选择
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('game-select-btn')) {
                const gameId = e.target.dataset.gameId;
                this.loadGame(gameId);
            }
        });

        // 游戏结束提交分数
        window.addEventListener('gameOver', (e) => {
            this.submitScore(e.detail);
        });
    }

    async loadGameList() {
        const games = [
            { id: 'snake', name: '贪吃蛇', description: '经典贪吃蛇游戏' },
            { id: 'tetris', name: '俄罗斯方块', description: '经典方块游戏' },
            // 可以添加更多游戏
        ];

        const container = document.getElementById('gameListContainer');
        if (!container) return;

        container.innerHTML = games.map(game => `
            <div class="game-item">
                <h3>${game.name}</h3>
                <p>${game.description}</p>
                <button class="game-select-btn" data-game-id="${game.id}">开始游戏</button>
            </div>
        `).join('');
    }

    loadGame(gameId) {
        const gameContainer = document.getElementById('gameContainer');
        if (!gameContainer) return;

        // 动态加载游戏脚本
        const script = document.createElement('script');
        script.src = `/games/${gameId}/script.js`;
        script.onload = () => {
            this.currentGame = gameId;
            // 假设游戏会触发 'gameOver' 事件
        };
        document.head.appendChild(script);

        // 加载游戏HTML
        fetch(`/games/${gameId}/index.html`)
            .then(response => response.text())
            .then(html => {
                gameContainer.innerHTML = html;
            })
            .catch(error => {
                console.error('加载游戏失败:', error);
                gameContainer.innerHTML = '<p>游戏加载失败</p>';
            });
    }

    async submitScore(scoreData) {
        if (!this.currentGame) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/games/scores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    gameName: this.currentGame,
                    score: scoreData.score,
                    playTime: scoreData.playTime || 0
                })
            });

            if (!response.ok) throw new Error('提交分数失败');

            alert(`分数提交成功！获得 ${scoreData.reward || 10} 硬币`);
        } catch (error) {
            console.error('提交分数失败:', error);
            alert('提交分数失败');
        }
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.gameIntegration = new GameIntegration();
});</content>
<parameter name="filePath">c:\Users\asus\Desktop\my-blog\js\game-integration.js