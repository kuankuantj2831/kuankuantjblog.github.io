/**
 * 社区勋章系统
 * 用户通过完成特定任务获得勋章，展示在个人资料中
 */

const BadgeSystem = {
    STORAGE_KEY: 'user_badges',
    BADGE_DEFINITIONS: {
        // 签到相关
        checkin_7: {
            id: 'checkin_7',
            name: '早起鸟',
            description: '连续签到7天',
            icon: '🐦',
            color: '#f39c12',
            category: 'checkin',
            condition: (stats) => stats.checkinStreak >= 7
        },
        checkin_30: {
            id: 'checkin_30',
            name: '签到达人',
            description: '连续签到30天',
            icon: '📅',
            color: '#e74c3c',
            category: 'checkin',
            condition: (stats) => stats.checkinStreak >= 30
        },
        checkin_100: {
            id: 'checkin_100',
            name: '百签王者',
            description: '累计签到100天',
            icon: '👑',
            color: '#9b59b6',
            category: 'checkin',
            condition: (stats) => stats.totalCheckins >= 100
        },

        // 游戏相关
        game_master: {
            id: 'game_master',
            name: '游戏王者',
            description: '累计游戏分数超过10000分',
            icon: '🎮',
            color: '#3498db',
            category: 'game',
            condition: (stats) => stats.gameScore >= 10000
        },
        game_2048: {
            id: 'game_2048',
            name: '2048大师',
            description: '在2048游戏中合成2048',
            icon: '🔢',
            color: '#1abc9c',
            category: 'game',
            condition: (stats) => stats.game2048Win
        },
        game_snake: {
            id: 'game_snake',
            name: '贪吃蛇高手',
            description: '贪吃蛇达到50分',
            icon: '🐍',
            color: '#27ae60',
            category: 'game',
            condition: (stats) => stats.snakeScore >= 50
        },

        // 内容创作相关
        author_1: {
            id: 'author_1',
            name: '初出茅庐',
            description: '发布第一篇文章',
            icon: '📝',
            color: '#95a5a6',
            category: 'content',
            condition: (stats) => stats.articleCount >= 1
        },
        author_10: {
            id: 'author_10',
            name: '创作新星',
            description: '发布10篇文章',
            icon: '✍️',
            color: '#e67e22',
            category: 'content',
            condition: (stats) => stats.articleCount >= 10
        },
        author_50: {
            id: 'author_50',
            name: '高产作家',
            description: '发布50篇文章',
            icon: '📚',
            color: '#e74c3c',
            category: 'content',
            condition: (stats) => stats.articleCount >= 50
        },

        // 互动相关
        comment_10: {
            id: 'comment_10',
            name: '评论达人',
            description: '发表评论10条',
            icon: '💬',
            color: '#3498db',
            category: 'social',
            condition: (stats) => stats.commentCount >= 10
        },
        comment_100: {
            id: 'comment_100',
            name: '话痨',
            description: '发表评论100条',
            icon: '🗣️',
            color: '#9b59b6',
            category: 'social',
            condition: (stats) => stats.commentCount >= 100
        },
        like_50: {
            id: 'like_50',
            name: '点赞狂魔',
            description: '点赞50次',
            icon: '❤️',
            color: '#e91e63',
            category: 'social',
            condition: (stats) => stats.likeCount >= 50
        },

        // 硬币相关
        coin_100: {
            id: 'coin_100',
            name: '小富翁',
            description: '持有100个硬币',
            icon: '🪙',
            color: '#f1c40f',
            category: 'coin',
            condition: (stats) => stats.coinBalance >= 100
        },
        coin_1000: {
            id: 'coin_1000',
            name: '大富翁',
            description: '持有1000个硬币',
            icon: '💰',
            color: '#f39c12',
            category: 'coin',
            condition: (stats) => stats.coinBalance >= 1000
        },
        donor: {
            id: 'donor',
            name: '慷慨解囊',
            description: '投出100个硬币',
            icon: '🎁',
            color: '#e74c3c',
            category: 'coin',
            condition: (stats) => stats.coinsDonated >= 100
        },

        // 等级相关
        level_5: {
            id: 'level_5',
            name: '进阶用户',
            description: '达到等级5',
            icon: '⭐',
            color: '#3498db',
            category: 'level',
            condition: (stats) => stats.level >= 5
        },
        level_10: {
            id: 'level_10',
            name: '资深用户',
            description: '达到等级10',
            icon: '🌟',
            color: '#9b59b6',
            category: 'level',
            condition: (stats) => stats.level >= 10
        },
        level_20: {
            id: 'level_20',
            name: '传说级',
            description: '达到等级20',
            icon: '💎',
            color: '#e74c3c',
            category: 'level',
            condition: (stats) => stats.level >= 20
        },

        // 特殊勋章
        early_adopter: {
            id: 'early_adopter',
            name: '元老',
            description: '早期注册用户',
            icon: '🏆',
            color: '#f39c12',
            category: 'special',
            condition: (stats) => stats.isEarlyAdopter
        },
        night_owl: {
            id: 'night_owl',
            name: '夜猫子',
            description: '凌晨3点后访问网站',
            icon: '🦉',
            color: '#2c3e50',
            category: 'special',
            condition: (stats) => stats.nightOwl
        },
        explorer: {
            id: 'explorer',
            name: '探索者',
            description: '访问所有页面',
            icon: '🧭',
            color: '#1abc9c',
            category: 'special',
            condition: (stats) => stats.pagesVisited >= 10
        }
    },

    /**
     * 获取用户已获得的勋章
     */
    getUserBadges(userId = 'default') {
        try {
            const key = `${this.STORAGE_KEY}_${userId}`;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },

    /**
     * 保存用户勋章
     */
    saveUserBadges(userId, badges) {
        try {
            const key = `${this.STORAGE_KEY}_${userId}`;
            localStorage.setItem(key, JSON.stringify(badges));
        } catch (e) {
            console.error('保存勋章失败:', e);
        }
    },

    /**
     * 检查并授予勋章
     * @param {Object} stats - 用户统计数据
     * @param {string} userId - 用户ID
     * @returns {Array} 新获得的勋章
     */
    checkAndAward(stats, userId = 'default') {
        const userBadges = this.getUserBadges(userId);
        const earnedIds = userBadges.map(b => b.id);
        const newlyEarned = [];

        Object.values(this.BADGE_DEFINITIONS).forEach(badge => {
            // 检查是否已获得
            if (earnedIds.includes(badge.id)) return;

            // 检查条件
            if (badge.condition(stats)) {
                const awarded = {
                    ...badge,
                    earnedAt: new Date().toISOString()
                };
                userBadges.push(awarded);
                newlyEarned.push(awarded);
            }
        });

        if (newlyEarned.length > 0) {
            this.saveUserBadges(userId, userBadges);
            this.showNewBadges(newlyEarned);
        }

        return newlyEarned;
    },

    /**
     * 显示新获得勋章提示
     */
    showNewBadges(newBadges) {
        newBadges.forEach((badge, index) => {
            setTimeout(() => {
                this.showBadgeNotification(badge);
            }, index * 500);
        });
    },

    /**
     * 显示单个勋章通知
     */
    showBadgeNotification(badge) {
        // 转义HTML防止XSS
        const escapeHtml = (text) => {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };
        
        const safeName = escapeHtml(badge.name);
        const safeDescription = escapeHtml(badge.description);
        const safeIcon = escapeHtml(badge.icon);
        const safeColor = escapeHtml(badge.color);
        
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.6);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;

        overlay.innerHTML = `
            <div style="
                background: linear-gradient(135deg, ${safeColor} 0%, ${safeColor}dd 100%);
                border-radius: 20px;
                padding: 40px;
                text-align: center;
                color: #fff;
                max-width: 320px;
                animation: bounceIn 0.5s ease;
                box-shadow: 0 20px 60px ${safeColor}50;
            ">
                <div style="font-size: 80px; margin-bottom: 15px; animation: float 2s ease infinite;">
                    ${safeIcon}
                </div>
                <h2 style="margin: 0 0 10px 0; font-size: 24px;">获得新勋章！</h2>
                <div style="
                    background: rgba(255,255,255,0.2);
                    border-radius: 12px;
                    padding: 15px;
                    margin: 15px 0;
                ">
                    <div style="font-size: 28px; font-weight: bold; margin-bottom: 5px;">
                        ${safeName}
                    </div>
                    <div style="font-size: 14px; opacity: 0.9;">
                        ${safeDescription}
                    </div>
                </div>
                <button onclick="this.closest('.badge-overlay').remove()" style="
                    background: #fff;
                    color: ${badge.color};
                    border: none;
                    padding: 12px 30px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    太棒了！
                </button>
            </div>
        `;

        overlay.className = 'badge-overlay';
        document.body.appendChild(overlay);

        // 点击背景关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });

        // 3秒后自动关闭
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.style.opacity = '0';
                overlay.style.transition = 'opacity 0.5s';
                setTimeout(() => overlay.remove(), 500);
            }
        }, 3000);
    },

    /**
     * 渲染用户勋章墙
     */
    renderBadgeWall(containerId, userId = 'default') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const userBadges = this.getUserBadges(userId);
        const allBadges = Object.values(this.BADGE_DEFINITIONS);

        const html = `
            <div style="background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; color: #333;">
                        <span style="margin-right: 8px;">🏅</span>我的勋章
                    </h3>
                    <span style="color: #999; font-size: 14px;">
                        ${userBadges.length} / ${allBadges.length}
                    </span>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 15px;">
                    ${allBadges.map(badge => {
                        const earned = userBadges.find(b => b.id === badge.id);
                        return `
                            <div style="
                                text-align: center;
                                padding: 15px 10px;
                                border-radius: 12px;
                                background: ${earned ? `${badge.color}15` : '#f5f5f5'};
                                border: 2px solid ${earned ? badge.color : '#e0e0e0'};
                                opacity: ${earned ? 1 : 0.5};
                                transition: all 0.3s;
                                cursor: ${earned ? 'pointer' : 'default'};
                            " ${earned ? `title="${badge.name} - ${badge.description}\n获得时间: ${new Date(earned.earnedAt).toLocaleDateString('zh-CN')}"` : `title="未获得: ${badge.description}"`}>
                                <div style="
                                    font-size: 36px;
                                    margin-bottom: 8px;
                                    filter: ${earned ? 'none' : 'grayscale(100%)'};
                                ">${badge.icon}</div>
                                <div style="
                                    font-size: 12px;
                                    font-weight: ${earned ? 'bold' : 'normal'};
                                    color: ${earned ? badge.color : '#999'};
                                ">${badge.name}</div>
                            </div>
                        `;
                    }).join('')}
                </div>

                ${userBadges.length > 0 ? `
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                        <h4 style="margin: 0 0 10px 0; color: #666; font-size: 14px;">最近获得</h4>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            ${userBadges.slice(-5).reverse().map(badge => `
                                <div style="
                                    display: flex;
                                    align-items: center;
                                    gap: 6px;
                                    padding: 6px 12px;
                                    background: ${badge.color}15;
                                    border-radius: 20px;
                                    font-size: 12px;
                                    color: ${badge.color};
                                ">
                                    <span>${badge.icon}</span>
                                    <span>${badge.name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        container.innerHTML = html;
    },

    /**
     * 获取用户统计数据（用于检查勋章条件）
     */
    getUserStats() {
        // 从各个系统收集数据
        const coins = JSON.parse(localStorage.getItem('user_coins') || '{}');
        const checkin = JSON.parse(localStorage.getItem('checkin_data') || '{}');
        const games = JSON.parse(localStorage.getItem('game_stats') || '{}');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const readingHistory = JSON.parse(localStorage.getItem('reading_history') || '[]');

        // 检查是否是夜猫子（凌晨3点后访问）
        const hour = new Date().getHours();
        const isNightOwl = hour >= 3 && hour < 6;

        // 检查访问的页面数
        const visitedPages = JSON.parse(localStorage.getItem('visited_pages') || '[]');

        return {
            // 签到数据
            checkinStreak: checkin.streak || 0,
            totalCheckins: checkin.total || 0,

            // 游戏数据
            gameScore: games.totalScore || 0,
            game2048Win: games.game2048?.won || false,
            snakeScore: games.snake?.bestScore || 0,

            // 内容数据
            articleCount: user.articleCount || 0,
            commentCount: user.commentCount || 0,
            likeCount: user.likeCount || 0,

            // 硬币数据
            coinBalance: coins.balance || 0,
            coinsDonated: coins.donated || 0,

            // 等级数据
            level: user.level || 1,

            // 特殊数据
            isEarlyAdopter: user.createdAt && new Date(user.createdAt) < new Date('2024-06-01'),
            nightOwl: isNightOwl,
            pagesVisited: visitedPages.length
        };
    },

    /**
     * 记录页面访问
     */
    recordPageVisit(pageName) {
        let visited = JSON.parse(localStorage.getItem('visited_pages') || '[]');
        if (!visited.includes(pageName)) {
            visited.push(pageName);
            localStorage.setItem('visited_pages', JSON.stringify(visited));
        }
    },

    /**
     * 初始化勋章系统
     */
    init() {
        // 添加动画样式
        if (!document.getElementById('badge-system-styles')) {
            const style = document.createElement('style');
            style.id = 'badge-system-styles';
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

        // 页面加载时检查勋章
        setTimeout(() => {
            const stats = this.getUserStats();
            this.checkAndAward(stats);
        }, 2000);
    }
};

// 导出到全局
window.BadgeSystem = BadgeSystem;

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    BadgeSystem.init();
});
