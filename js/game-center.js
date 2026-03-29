/**
 * 游戏中心系统
 * 包含：游戏成就、云存档、排行榜、道具兑换
 */

const GameCenter = {
    STORAGE_KEY: 'game_center_data',
    ACHIEVEMENT_KEY: 'game_achievements',
    LEADERBOARD_KEY: 'game_leaderboard',
    INVENTORY_KEY: 'game_inventory',

    // 游戏成就定义
    ACHIEVEMENTS: {
        // 2048 成就
        '2048_first_win': {
            id: '2048_first_win',
            name: '初窥门径',
            description: '在2048中合成2048',
            icon: '🎯',
            game: '2048',
            reward: 50
        },
        '2048_4096': {
            id: '2048_4096',
            name: '数字大师',
            description: '在2048中合成4096',
            icon: '🔢',
            game: '2048',
            reward: 100
        },
        '2048_8192': {
            id: '2048_8192',
            name: '数字之神',
            description: '在2048中合成8192',
            icon: '👑',
            game: '2048',
            reward: 200
        },
        
        // 贪吃蛇成就
        'snake_50': {
            id: 'snake_50',
            name: '小蛇成长',
            description: '贪吃蛇达到50分',
            icon: '🐍',
            game: 'snake',
            reward: 30
        },
        'snake_100': {
            id: 'snake_100',
            name: '巨蟒传说',
            description: '贪吃蛇达到100分',
            icon: '🐉',
            game: 'snake',
            reward: 80
        },
        'snake_200': {
            id: 'snake_200',
            name: '蛇王',
            description: '贪吃蛇达到200分',
            icon: '🐲',
            game: 'snake',
            reward: 150
        },
        
        // 华容道成就
        'huarongdao_solve': {
            id: 'huarongdao_solve',
            name: '智者',
            description: '完成一次华容道',
            icon: '🧩',
            game: 'huarongdao',
            reward: 40
        },
        'huarongdao_fast': {
            id: 'huarongdao_fast',
            name: '速解高手',
            description: '100步内完成华容道',
            icon: '⚡',
            game: 'huarongdao',
            reward: 100
        },
        
        // 综合成就
        'play_all_games': {
            id: 'play_all_games',
            name: '游戏达人',
            description: '玩过所有游戏',
            icon: '🎮',
            game: 'all',
            reward: 100
        },
        'total_score_10000': {
            id: 'total_score_10000',
            name: '万分大神',
            description: '累计游戏分数10000分',
            icon: '💯',
            game: 'all',
            reward: 200
        }
    },

    // 游戏道具商店
    SHOP_ITEMS: {
        'avatar_frame_gold': {
            id: 'avatar_frame_gold',
            name: '黄金头像框',
            description: '尊贵的金色头像框',
            icon: '🖼️',
            price: 500,
            type: 'avatar_frame',
            color: '#FFD700'
        },
        'avatar_frame_silver': {
            id: 'avatar_frame_silver',
            name: '白银头像框',
            description: '优雅的银色头像框',
            icon: '🖼️',
            price: 300,
            type: 'avatar_frame',
            color: '#C0C0C0'
        },
        'nickname_rainbow': {
            id: 'nickname_rainbow',
            name: '彩虹昵称',
            description: '炫彩渐变昵称颜色',
            icon: '🌈',
            price: 800,
            type: 'nickname_color'
        },
        'title_gamer': {
            id: 'title_gamer',
            name: '玩家称号',
            description: '资深玩家专属称号',
            icon: '🎖️',
            price: 200,
            type: 'title'
        },
        'title_master': {
            id: 'title_master',
            name: '大师称号',
            description: '游戏大师专属称号',
            icon: '👑',
            price: 1000,
            type: 'title'
        },
        'undo_power': {
            id: 'undo_power',
            name: '悔棋卡',
            description: '2048中可以撤销一步',
            icon: '↩️',
            price: 50,
            type: 'consumable',
            count: 5
        },
        'slow_motion': {
            id: 'slow_motion',
            name: '慢动作',
            description: '贪吃蛇速度降低50%',
            icon: '⏱️',
            price: 80,
            type: 'consumable',
            count: 3
        }
    },

    /**
     * ==================== 成就系统 ====================
     */
    
    // 获取用户成就
    getAchievements(userId = 'default') {
        try {
            const key = `${this.ACHIEVEMENT_KEY}_${userId}`;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    },

    // 保存成就
    saveAchievements(userId, achievements) {
        const key = `${this.ACHIEVEMENT_KEY}_${userId}`;
        localStorage.setItem(key, JSON.stringify(achievements));
    },

    // 解锁成就
    unlockAchievement(achievementId, userId = 'default') {
        const achievements = this.getAchievements(userId);
        
        if (achievements[achievementId]) {
            return null; // 已解锁
        }

        const achievement = this.ACHIEVEMENTS[achievementId];
        if (!achievement) return null;

        achievements[achievementId] = {
            ...achievement,
            unlockedAt: new Date().toISOString()
        };

        this.saveAchievements(userId, achievements);

        // 发放奖励
        if (achievement.reward) {
            this.addCoins(achievement.reward, `解锁成就：${achievement.name}`);
        }

        // 显示通知
        this.showAchievementNotification(achievement);

        return achievements[achievementId];
    },

    // 检查并解锁成就
    checkAchievements(stats, userId = 'default') {
        const newlyUnlocked = [];

        // 2048 成就
        if (stats.game2048?.maxTile >= 2048) {
            if (this.unlockAchievement('2048_first_win', userId)) {
                newlyUnlocked.push('2048_first_win');
            }
        }
        if (stats.game2048?.maxTile >= 4096) {
            if (this.unlockAchievement('2048_4096', userId)) {
                newlyUnlocked.push('2048_4096');
            }
        }
        if (stats.game2048?.maxTile >= 8192) {
            if (this.unlockAchievement('2048_8192', userId)) {
                newlyUnlocked.push('2048_8192');
            }
        }

        // 贪吃蛇成就
        if (stats.snake?.bestScore >= 50) {
            if (this.unlockAchievement('snake_50', userId)) {
                newlyUnlocked.push('snake_50');
            }
        }
        if (stats.snake?.bestScore >= 100) {
            if (this.unlockAchievement('snake_100', userId)) {
                newlyUnlocked.push('snake_100');
            }
        }
        if (stats.snake?.bestScore >= 200) {
            if (this.unlockAchievement('snake_200', userId)) {
                newlyUnlocked.push('snake_200');
            }
        }

        // 华容道成就
        if (stats.huarongdao?.completed) {
            if (this.unlockAchievement('huarongdao_solve', userId)) {
                newlyUnlocked.push('huarongdao_solve');
            }
            if (stats.huarongdao?.moves <= 100) {
                if (this.unlockAchievement('huarongdao_fast', userId)) {
                    newlyUnlocked.push('huarongdao_fast');
                }
            }
        }

        // 综合成就
        const gamesPlayed = Object.keys(stats).length;
        if (gamesPlayed >= 3) {
            if (this.unlockAchievement('play_all_games', userId)) {
                newlyUnlocked.push('play_all_games');
            }
        }

        const totalScore = Object.values(stats).reduce((sum, game) => {
            return sum + (game.bestScore || 0) + (game.totalScore || 0);
        }, 0);
        if (totalScore >= 10000) {
            if (this.unlockAchievement('total_score_10000', userId)) {
                newlyUnlocked.push('total_score_10000');
            }
        }

        return newlyUnlocked;
    },

    // 显示成就通知
    showAchievementNotification(achievement) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.6);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;

        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 20px;
                padding: 40px;
                text-align: center;
                color: white;
                max-width: 320px;
                animation: bounceIn 0.5s ease;
            ">
                <div style="font-size: 64px; margin-bottom: 15px; animation: float 2s ease infinite;">
                    ${achievement.icon}
                </div>
                <h2 style="margin: 0 0 10px 0; font-size: 24px;">成就解锁！</h2>
                <div style="
                    background: rgba(255,255,255,0.2);
                    border-radius: 12px;
                    padding: 15px;
                    margin: 15px 0;
                ">
                    <div style="font-size: 20px; font-weight: bold; margin-bottom: 5px;">
                        ${achievement.name}
                    </div>
                    <div style="font-size: 14px; opacity: 0.9;">
                        ${achievement.description}
                    </div>
                </div>
                <div style="font-size: 18px; margin: 15px 0;">
                    🪙 +${achievement.reward} 硬币
                </div>
                <button onclick="this.closest('.achievement-modal').remove()" style="
                    background: white;
                    color: #667eea;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                ">太棒了！</button>
            </div>
        `;

        modal.className = 'achievement-modal';
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

        document.body.appendChild(modal);

        setTimeout(() => {
            if (modal.parentNode) modal.remove();
        }, 5000);
    },

    /**
     * ==================== 云存档 ====================
     */
    
    // 保存游戏进度
    saveGameProgress(gameId, data, userId = 'default') {
        const key = `game_save_${userId}_${gameId}`;
        const saveData = {
            data: data,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem(key, JSON.stringify(saveData));
        return saveData;
    },

    // 加载游戏进度
    loadGameProgress(gameId, userId = 'default') {
        const key = `game_save_${userId}_${gameId}`;
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    },

    // 删除存档
    deleteGameProgress(gameId, userId = 'default') {
        const key = `game_save_${userId}_${gameId}`;
        localStorage.removeItem(key);
    },

    // 获取所有存档
    getAllSaves(userId = 'default') {
        const saves = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`game_save_${userId}_`)) {
                const gameId = key.replace(`game_save_${userId}_`, '');
                const data = this.loadGameProgress(gameId, userId);
                if (data) {
                    saves.push({ gameId, ...data });
                }
            }
        }
        return saves.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    },

    /**
     * ==================== 排行榜 ====================
     */
    
    // 提交分数到排行榜
    submitScore(gameId, score, userId = 'default', username = '匿名玩家') {
        const key = `${this.LEADERBOARD_KEY}_${gameId}`;
        let leaderboard = JSON.parse(localStorage.getItem(key) || '[]');

        const entry = {
            userId,
            username,
            score,
            submittedAt: new Date().toISOString()
        };

        // 检查是否已有该用户的记录
        const existingIndex = leaderboard.findIndex(e => e.userId === userId);
        if (existingIndex >= 0) {
            // 只保留最高分
            if (leaderboard[existingIndex].score < score) {
                leaderboard[existingIndex] = entry;
            }
        } else {
            leaderboard.push(entry);
        }

        // 按分数排序，只保留前100名
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 100);

        localStorage.setItem(key, JSON.stringify(leaderboard));

        // 返回排名
        return leaderboard.findIndex(e => e.userId === userId) + 1;
    },

    // 获取排行榜
    getLeaderboard(gameId, limit = 10) {
        const key = `${this.LEADERBOARD_KEY}_${gameId}`;
        const leaderboard = JSON.parse(localStorage.getItem(key) || '[]');
        return leaderboard.slice(0, limit);
    },

    // 渲染排行榜
    renderLeaderboard(containerId, gameId, limit = 10) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const leaderboard = this.getLeaderboard(gameId, limit);

        if (leaderboard.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #999;">
                    <div style="font-size: 48px; margin-bottom: 10px;">🏆</div>
                    <p>暂无数据</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="background: white; border-radius: 12px; overflow: hidden;">
                ${leaderboard.map((entry, index) => {
                    const rank = index + 1;
                    const rankStyle = rank <= 3 ? `
                        background: ${['#FFD700', '#C0C0C0', '#CD7F32'][index]};
                        color: white;
                    ` : `
                        background: #f0f0f0;
                        color: #666;
                    `;
                    
                    return `
                        <div style="
                            display: flex;
                            align-items: center;
                            padding: 12px 20px;
                            border-bottom: 1px solid #f0f0f0;
                            ${index < 3 ? 'background: linear-gradient(90deg, transparent, ' + ['#FFD70015', '#C0C0C015', '#CD7F3215'][index] + ', transparent);' : ''}
                        ">
                            <div style="
                                width: 32px;
                                height: 32px;
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-weight: bold;
                                font-size: 14px;
                                margin-right: 15px;
                                ${rankStyle}
                            ">${rank}</div>
                            <div style="flex: 1;">
                                <div style="font-weight: 500; color: #333;">${entry.username}</div>
                                <div style="font-size: 12px; color: #999;">
                                    ${new Date(entry.submittedAt).toLocaleDateString('zh-CN')}
                                </div>
                            </div>
                            <div style="font-size: 18px; font-weight: bold; color: #667eea;">
                                ${entry.score.toLocaleString()}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    /**
     * ==================== 道具商店 ====================
     */
    
    // 获取用户背包
    getInventory(userId = 'default') {
        try {
            const key = `${this.INVENTORY_KEY}_${userId}`;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    },

    // 保存背包
    saveInventory(userId, inventory) {
        const key = `${this.INVENTORY_KEY}_${userId}`;
        localStorage.setItem(key, JSON.stringify(inventory));
    },

    // 购买道具
    buyItem(itemId, userId = 'default') {
        const item = this.SHOP_ITEMS[itemId];
        if (!item) return { success: false, message: '商品不存在' };

        // 检查硬币
        const coins = this.getCoins();
        if (coins < item.price) {
            return { success: false, message: '硬币不足' };
        }

        // 扣除硬币
        this.addCoins(-item.price, `购买道具：${item.name}`);

        // 添加到背包
        const inventory = this.getInventory(userId);
        if (item.type === 'consumable') {
            inventory[itemId] = (inventory[itemId] || 0) + (item.count || 1);
        } else {
            inventory[itemId] = true;
        }
        this.saveInventory(userId, inventory);

        this.showToast(`成功购买 ${item.name}！`);
        return { success: true, item };
    },

    // 使用道具
    useItem(itemId, userId = 'default') {
        const inventory = this.getInventory(userId);
        const item = this.SHOP_ITEMS[itemId];

        if (!item || !inventory[itemId]) {
            return { success: false, message: '道具不存在' };
        }

        if (item.type === 'consumable') {
            if (inventory[itemId] <= 0) {
                return { success: false, message: '道具数量不足' };
            }
            inventory[itemId]--;
            if (inventory[itemId] === 0) {
                delete inventory[itemId];
            }
            this.saveInventory(userId, inventory);
        }

        return { success: true, item };
    },

    // 检查是否拥有道具
    hasItem(itemId, userId = 'default') {
        const inventory = this.getInventory(userId);
        const item = this.SHOP_ITEMS[itemId];
        
        if (!item) return false;
        
        if (item.type === 'consumable') {
            return (inventory[itemId] || 0) > 0;
        }
        return !!inventory[itemId];
    },

    // 获取硬币
    getCoins() {
        try {
            const data = JSON.parse(localStorage.getItem('user_coins') || '{}');
            return data.balance || 0;
        } catch (e) {
            return 0;
        }
    },

    // 添加硬币
    addCoins(amount, reason = '') {
        let data = JSON.parse(localStorage.getItem('user_coins') || '{}');
        data.balance = (data.balance || 0) + amount;
        localStorage.setItem('user_coins', JSON.stringify(data));

        // 记录交易
        if (amount !== 0) {
            const transactions = JSON.parse(localStorage.getItem('coin_transactions') || '[]');
            transactions.unshift({
                amount,
                reason,
                time: new Date().toISOString()
            });
            localStorage.setItem('coin_transactions', JSON.stringify(transactions.slice(0, 100)));
        }

        return data.balance;
    },

    // 渲染商店
    renderShop(containerId, userId = 'default') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const coins = this.getCoins();
        const inventory = this.getInventory(userId);

        container.innerHTML = `
            <div style="background: white; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 10px;">🪙</div>
                    <div style="font-size: 32px; font-weight: bold;">${coins.toLocaleString()}</div>
                    <div style="opacity: 0.9;">我的硬币</div>
                </div>
                <div style="padding: 20px;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px;">
                        ${Object.values(this.SHOP_ITEMS).map(item => {
                            const owned = item.type === 'consumable' 
                                ? (inventory[item.id] || 0) + '个'
                                : (inventory[item.id] ? '已拥有' : '');
                            const canAfford = coins >= item.price;
                            
                            return `
                                <div style="
                                    border: 2px solid ${owned ? '#27ae60' : '#e0e0e0'};
                                    border-radius: 12px;
                                    padding: 15px;
                                    text-align: center;
                                    transition: all 0.2s;
                                    ${canAfford ? 'cursor: pointer;' : 'opacity: 0.6;'}
                                " ${canAfford ? `onclick="GameCenter.buyItemConfirm('${item.id}')"` : ''}
                                   onmouseover="if(${canAfford}) this.style.transform='scale(1.02)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'"
                                   onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'">
                                    <div style="font-size: 36px; margin-bottom: 8px;">${item.icon}</div>
                                    <div style="font-weight: 500; color: #333; margin-bottom: 4px;">${item.name}</div>
                                    <div style="font-size: 12px; color: #999; margin-bottom: 8px; line-height: 1.4;">${item.description}</div>
                                    <div style="font-size: 16px; font-weight: bold; color: ${canAfford ? '#f39c12' : '#ccc'};">
                                        🪙 ${item.price}
                                    </div>
                                    ${owned ? `<div style="margin-top: 8px; font-size: 12px; color: #27ae60;">${owned}</div>` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    // 购买确认
    buyItemConfirm(itemId) {
        const item = this.SHOP_ITEMS[itemId];
        if (!item) return;

        if (confirm(`确定花费 ${item.price} 硬币购买 ${item.name} 吗？`)) {
            const result = this.buyItem(itemId);
            if (!result.success) {
                alert(result.message);
            }
        }
    },

    // 显示提示
    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: #fff;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 14px;
            z-index: 99999;
            animation: fadeInUp 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    },

    // 初始化
    init() {
        // 添加样式
        if (!document.getElementById('gamecenter-styles')) {
            const style = document.createElement('style');
            style.id = 'gamecenter-styles';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes bounceIn {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { transform: scale(1.05); }
                    70% { transform: scale(0.9); }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
            `;
            document.head.appendChild(style);
        }
    }
};

// 导出到全局
window.GameCenter = GameCenter;

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    GameCenter.init();
});
