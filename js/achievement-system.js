/**
 * 用户成就系统
 * 徽章、称号、解锁成就
 */

class AchievementSystem {
    constructor(userId) {
        this.userId = userId;
        this.achievements = [];
        this.userAchievements = [];
        this.points = 0;
        
        // 定义所有成就
        this.achievementDefinitions = {
            // 注册相关
            'first_step': {
                id: 'first_step',
                name: '第一步',
                description: '完成账号注册',
                icon: '🎯',
                points: 10,
                category: 'registration'
            },
            
            // 文章相关
            'first_article': {
                id: 'first_article',
                name: '初出茅庐',
                description: '发布第一篇文章',
                icon: '✍️',
                points: 20,
                category: 'article'
            },
            'article_5': {
                id: 'article_5',
                name: '笔耕不辍',
                description: '发布5篇文章',
                icon: '📚',
                points: 50,
                category: 'article'
            },
            'article_10': {
                id: 'article_10',
                name: '高产作者',
                description: '发布10篇文章',
                icon: '📖',
                points: 100,
                category: 'article'
            },
            'article_50': {
                id: 'article_50',
                name: '写作大师',
                description: '发布50篇文章',
                icon: '📜',
                points: 500,
                category: 'article'
            },
            
            // 互动相关
            'first_like': {
                id: 'first_like',
                name: '点赞之交',
                description: '首次点赞文章',
                icon: '👍',
                points: 5,
                category: 'interaction'
            },
            'like_10': {
                id: 'like_10',
                name: '热心读者',
                description: '点赞10篇文章',
                icon: '❤️',
                points: 30,
                category: 'interaction'
            },
            'first_comment': {
                id: 'first_comment',
                name: '畅所欲言',
                description: '发表第一条评论',
                icon: '💬',
                points: 10,
                category: 'interaction'
            },
            'comment_10': {
                id: 'comment_10',
                name: '活跃讨论者',
                description: '发表10条评论',
                icon: '🗣️',
                points: 50,
                category: 'interaction'
            },
            
            // 签到相关
            'first_checkin': {
                id: 'first_checkin',
                name: '早安打卡',
                description: '首次签到',
                icon: '☀️',
                points: 10,
                category: 'checkin'
            },
            'checkin_7': {
                id: 'checkin_7',
                name: '坚持一周',
                description: '连续签到7天',
                icon: '🔥',
                points: 50,
                category: 'checkin'
            },
            'checkin_30': {
                id: 'checkin_30',
                name: '月度达人',
                description: '连续签到30天',
                icon: '🌟',
                points: 200,
                category: 'checkin'
            },
            
            // 硬币相关
            'first_coin': {
                id: 'first_coin',
                name: '投币支持',
                description: '首次给文章投币',
                icon: '🪙',
                points: 15,
                category: 'coin'
            },
            'coin_100': {
                id: 'coin_100',
                name: '慷慨解囊',
                description: '累计投出100硬币',
                icon: '💰',
                points: 100,
                category: 'coin'
            },
            'rich_man': {
                id: 'rich_man',
                name: '小富翁',
                description: '拥有500硬币',
                icon: '💎',
                points: 50,
                category: 'coin'
            },
            
            // 收藏相关
            'first_favorite': {
                id: 'first_favorite',
                name: '收藏家',
                description: '首次收藏文章',
                icon: '⭐',
                points: 10,
                category: 'favorite'
            },
            'favorite_10': {
                id: 'favorite_10',
                name: '收藏达人',
                description: '收藏10篇文章',
                icon: '🔖',
                points: 50,
                category: 'favorite'
            },
            
            // 特殊成就
            'night_owl': {
                id: 'night_owl',
                name: '夜猫子',
                description: '在凌晨0-5点发布文章',
                icon: '🦉',
                points: 30,
                category: 'special'
            },
            'early_bird': {
                id: 'early_bird',
                name: '早起的鸟儿',
                description: '在早上5-7点签到',
                icon: '🐦',
                points: 30,
                category: 'special'
            },
            'popular_article': {
                id: 'popular_article',
                name: '爆款文章',
                description: '单篇文章获得100阅读量',
                icon: '🔥',
                points: 100,
                category: 'special'
            },

            // 隐藏成就 - 需要特殊条件触发
            'hidden_explorer': {
                id: 'hidden_explorer',
                name: '探索者',
                description: '发现网站彩蛋（在页面输入 konami 秘籍）',
                icon: '🕵️',
                points: 50,
                category: 'hidden',
                hidden: true
            },
            'hidden_speed_reader': {
                id: 'hidden_speed_reader',
                name: '一目十行',
                description: '在1分钟内阅读完任意一篇文章',
                icon: '⚡',
                points: 30,
                category: 'hidden',
                hidden: true
            },
            'hidden_daily_expert': {
                id: 'hidden_daily_expert',
                name: '答题王',
                description: '连续答对每日一题7天',
                icon: '🎓',
                points: 80,
                category: 'hidden',
                hidden: true
            },
            'hidden_wheel_master': {
                id: 'hidden_wheel_master',
                name: '大转盘高手',
                description: '在幸运大转盘中获得最高奖（200经验）',
                icon: '🎯',
                points: 100,
                category: 'hidden',
                hidden: true
            },
            'hidden_perfect_week': {
                id: 'hidden_perfect_week',
                name: '完美一周',
                description: '在一周内完成所有每日任务',
                icon: '🏅',
                points: 60,
                category: 'hidden',
                hidden: true
            },
            'hidden_coin_collector': {
                id: 'hidden_coin_collector',
                name: '硬币收集者',
                description: '累计获得1000硬币',
                icon: '💰',
                points: 40,
                category: 'hidden',
                hidden: true
            },
            'hidden_social_butterfly': {
                id: 'hidden_social_butterfly',
                name: '社交达人',
                description: '在5个不同的文章下发表评论',
                icon: '🦋',
                points: 35,
                category: 'hidden',
                hidden: true
            },
            'hidden_archaeologist': {
                id: 'hidden_archaeologist',
                name: '考古学家',
                description: '阅读一篇发布超过一年的文章',
                icon: '🏺',
                points: 25,
                category: 'hidden',
                hidden: true
            }
        };
        
        // 等级定义
        this.levels = [
            { level: 1, name: '游客', minPoints: 0, icon: '👤' },
            { level: 2, name: '新手', minPoints: 50, icon: '🌱' },
            { level: 3, name: '见习', minPoints: 150, icon: '🌿' },
            { level: 4, name: '正式会员', minPoints: 300, icon: '🍀' },
            { level: 5, name: '资深会员', minPoints: 600, icon: '🌳' },
            { level: 6, name: '核心用户', minPoints: 1000, icon: '🏆' },
            { level: 7, name: '社区达人', minPoints: 2000, icon: '👑' },
            { level: 8, name: '意见领袖', minPoints: 5000, icon: '💎' },
            { level: 9, name: '传奇用户', minPoints: 10000, icon: '🌟' },
            { level: 10, name: '神话', minPoints: 20000, icon: '✨' }
        ];
    }

    /**
     * 初始化成就系统
     */
    async init() {
        await this.loadUserAchievements();
        return this;
    }

    /**
     * 加载用户成就
     */
    async loadUserAchievements() {
        try {
            // 从 localStorage 读取
            const saved = localStorage.getItem(`achievements_${this.userId}`);
            if (saved) {
                const data = JSON.parse(saved);
                this.userAchievements = data.achievements || [];
                this.points = data.points || 0;
            }
            
            // 从服务器同步
            const token = localStorage.getItem('token');
            if (token) {
                const { API_BASE_URL } = await import('./api-config.js?v=20260419b');
                const response = await fetch(`${API_BASE_URL}/users/${this.userId}/achievements`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.userAchievements = data.achievements || [];
                    this.points = data.points || 0;
                    this.saveToLocal();
                }
            }
        } catch (error) {
            console.error('[Achievement] 加载成就失败:', error);
        }
    }

    /**
     * 检查并解锁成就
     */
    async checkAndUnlock(action, data = {}) {
        const unlocks = [];
        
        switch (action) {
            case 'register':
                if (await this.unlock('first_step')) unlocks.push('first_step');
                break;
                
            case 'publish_article':
                const articleCount = data.count || (await this.getArticleCount());
                if (articleCount >= 1 && await this.unlock('first_article')) unlocks.push('first_article');
                if (articleCount >= 5 && await this.unlock('article_5')) unlocks.push('article_5');
                if (articleCount >= 10 && await this.unlock('article_10')) unlocks.push('article_10');
                if (articleCount >= 50 && await this.unlock('article_50')) unlocks.push('article_50');
                
                // 检查是否夜猫子
                const hour = new Date().getHours();
                if (hour >= 0 && hour < 5 && await this.unlock('night_owl')) unlocks.push('night_owl');
                break;
                
            case 'like':
                const likeCount = data.count || (await this.getLikeCount());
                if (likeCount >= 1 && await this.unlock('first_like')) unlocks.push('first_like');
                if (likeCount >= 10 && await this.unlock('like_10')) unlocks.push('like_10');
                break;
                
            case 'comment':
                const commentCount = data.count || (await this.getCommentCount());
                if (commentCount >= 1 && await this.unlock('first_comment')) unlocks.push('first_comment');
                if (commentCount >= 10 && await this.unlock('comment_10')) unlocks.push('comment_10');
                // 隐藏成就：在5个不同文章下评论
                if (data.uniqueArticles >= 5 && await this.unlock('hidden_social_butterfly')) unlocks.push('hidden_social_butterfly');
                break;
                
            case 'checkin':
                const checkinDays = data.consecutiveDays || 1;
                if (checkinDays >= 1 && await this.unlock('first_checkin')) unlocks.push('first_checkin');
                if (checkinDays >= 7 && await this.unlock('checkin_7')) unlocks.push('checkin_7');
                if (checkinDays >= 30 && await this.unlock('checkin_30')) unlocks.push('checkin_30');
                
                // 检查是否早起的鸟儿
                const checkinHour = new Date().getHours();
                if (checkinHour >= 5 && checkinHour < 7 && await this.unlock('early_bird')) unlocks.push('early_bird');
                break;
                
            case 'donate_coin':
                const totalCoins = data.total || (await this.getTotalCoinsDonated());
                if (totalCoins >= 1 && await this.unlock('first_coin')) unlocks.push('first_coin');
                if (totalCoins >= 100 && await this.unlock('coin_100')) unlocks.push('coin_100');
                if (totalCoins >= 1000 && await this.unlock('hidden_coin_collector')) unlocks.push('hidden_coin_collector');
                break;
                
            case 'favorite':
                const favCount = data.count || (await this.getFavoriteCount());
                if (favCount >= 1 && await this.unlock('first_favorite')) unlocks.push('first_favorite');
                if (favCount >= 10 && await this.unlock('favorite_10')) unlocks.push('favorite_10');
                break;
                
            case 'article_view':
                if (data.views >= 100 && await this.unlock('popular_article')) unlocks.push('popular_article');
                if (data.isOldArticle && await this.unlock('hidden_archaeologist')) unlocks.push('hidden_archaeologist');
                break;

            // 隐藏成就触发器
            case 'quiz_streak':
                if (data.streak >= 7 && await this.unlock('hidden_daily_expert')) unlocks.push('hidden_daily_expert');
                break;
                
            case 'wheel_jackpot':
                if (await this.unlock('hidden_wheel_master')) unlocks.push('hidden_wheel_master');
                break;
                
            case 'konami_code':
                if (await this.unlock('hidden_explorer')) unlocks.push('hidden_explorer');
                break;
                
            case 'speed_read':
                if (await this.unlock('hidden_speed_reader')) unlocks.push('hidden_speed_reader');
                break;
        }
        
        // 显示解锁动画
        unlocks.forEach(id => this.showUnlockAnimation(id));
        
        return unlocks;
    }

    /**
     * 解锁成就
     */
    async unlock(achievementId) {
        if (this.hasAchievement(achievementId)) return false;
        
        const def = this.achievementDefinitions[achievementId];
        if (!def) return false;
        
        this.userAchievements.push({
            id: achievementId,
            unlockedAt: Date.now()
        });
        
        this.points += def.points;
        
        await this.saveToServer();
        this.saveToLocal();
        
        return true;
    }

    /**
     * 检查是否已解锁
     */
    hasAchievement(achievementId) {
        return this.userAchievements.some(a => a.id === achievementId);
    }

    /**
     * 获取当前等级
     */
    getCurrentLevel() {
        for (let i = this.levels.length - 1; i >= 0; i--) {
            if (this.points >= this.levels[i].minPoints) {
                return this.levels[i];
            }
        }
        return this.levels[0];
    }

    /**
     * 获取下一等级
     */
    getNextLevel() {
        const current = this.getCurrentLevel();
        const nextIndex = this.levels.findIndex(l => l.level === current.level) + 1;
        return this.levels[nextIndex] || null;
    }

    /**
     * 获取升级进度
     */
    getProgress() {
        const current = this.getCurrentLevel();
        const next = this.getNextLevel();
        
        if (!next) return { current, next: null, percent: 100 };
        
        const range = next.minPoints - current.minPoints;
        const progress = this.points - current.minPoints;
        const percent = Math.round((progress / range) * 100);
        
        return { current, next, percent, needed: next.minPoints - this.points };
    }

    /**
     * 获取所有成就
     */
    getAllAchievements() {
        return Object.values(this.achievementDefinitions).map(def => ({
            ...def,
            unlocked: this.hasAchievement(def.id),
            unlockedAt: this.userAchievements.find(a => a.id === def.id)?.unlockedAt
        }));
    }

    /**
     * 获取已解锁成就
     */
    getUnlockedAchievements() {
        return this.userAchievements.map(a => ({
            ...this.achievementDefinitions[a.id],
            unlockedAt: a.unlockedAt
        })).filter(Boolean);
    }

    /**
     * 保存到本地
     */
    saveToLocal() {
        localStorage.setItem(`achievements_${this.userId}`, JSON.stringify({
            achievements: this.userAchievements,
            points: this.points,
            updatedAt: Date.now()
        }));
    }

    /**
     * 保存到服务器
     */
    async saveToServer() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            const { API_BASE_URL } = await import('./api-config.js?v=20260419b');
            await fetch(`${API_BASE_URL}/users/${this.userId}/achievements`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    achievements: this.userAchievements,
                    points: this.points
                })
            });
        } catch (error) {
            console.error('[Achievement] 保存到服务器失败:', error);
        }
    }

    /**
     * 显示解锁动画
     */
    showUnlockAnimation(achievementId) {
        const def = this.achievementDefinitions[achievementId];
        if (!def) return;
        
        const div = document.createElement('div');
        div.className = 'achievement-unlock-popup';
        div.innerHTML = `
            <div class="achievement-popup-content">
                <div class="achievement-icon">${def.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-title">解锁成就</div>
                    <div class="achievement-name">${def.name}</div>
                    <div class="achievement-desc">${def.description}</div>
                    <div class="achievement-points">+${def.points} 积分</div>
                </div>
            </div>
        `;
        div.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 20px;
            border-radius: 16px;
            box-shadow: 0 8px 30px rgba(102,126,234,0.3);
            z-index: 9999;
            animation: slideInRight 0.5s ease;
            max-width: 300px;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .achievement-popup-content {
                display: flex;
                align-items: center;
                gap: 16px;
            }
            .achievement-icon {
                font-size: 48px;
            }
            .achievement-info {
                flex: 1;
            }
            .achievement-title {
                font-size: 12px;
                opacity: 0.8;
                margin-bottom: 4px;
            }
            .achievement-name {
                font-size: 18px;
                font-weight: 700;
                margin-bottom: 4px;
            }
            .achievement-desc {
                font-size: 12px;
                opacity: 0.9;
                margin-bottom: 8px;
            }
            .achievement-points {
                font-size: 14px;
                font-weight: 600;
                color: #ffd700;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(div);
        
        // 播放音效（如果支持）
        this.playUnlockSound();
        
        // 5秒后消失
        setTimeout(() => {
            div.style.animation = 'slideInRight 0.5s ease reverse';
            setTimeout(() => div.remove(), 500);
        }, 5000);
    }

    /**
     * 播放解锁音效
     */
    playUnlockSound() {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVanu8LdnHQUuh9Dz2YU2Bhxqv+zplkcODVGm5O+4ZSAEMYrO89GFNwYdcfDv6phJDQxPp+XysWUeBjiS1/LNfi0GI37R8tOENAcdcO/w6plHDAtQp+XyxGUhBjqT1/PQfS4GI3/R8tSFNwYdcfDv6ppIDAtRp+TwxmUgBDeOzvPVhjYGHG3A7+ihTgwLUqjl8sZmIAU2jc3z1YU1Bhxwv+zplkcNC1Ko5fLFZSAFNo/M89CEMwYccPDv6ppIDAtRqOXyxGUgBDeOz/PShjUGG3Dw7+ihTgwLUqjl8sVmIAU2jM3z0oU1Bhtw8O/plkcNC1Ko5fLFZiAFN43M89CEMwYbcPDv6plHDAtRqOXyxmUgBTeNzPPShjUGG3Dw7+eZSA0LUqjl8sZmIAU3jM3z0YU1Bxtw8O/plkcNC1Ko5fLGZiAFN43M89GFNwYbcPDv6ppIDQtRqOXyxmUgBTeNzPPShjYHG3Dw7+eZSA0LUqjl8sZmIAU3jM3z0YU1Bxtw8O/plkcNC1Ko5fLGZiAFN43M89GFNwYbcPDv6ppIDQtRqOXyxmUgBTeNzPPShjYHG3Dw7+eZSA0LUqjl8sZmIAU3jM3z0YU1Bxtw8O/plkcNC1Ko5fLGZiAFN43M89GFNwYbcPDv6ppIDQtRqOXyxmUgBTeNzPPShjYHG3Dw7+eZSA0LUqjl8sZmIAU3jM3z0YU1Bxtw8O/plkcNC1Ko5fLGZiAFOY/M89GFNwYbcPDv6ppIDQtRqOXyxmUgBTiMzz0YU1Bxtw8O/plkcNC1Ko5fLGZSAF');
            audio.volume = 0.3;
            audio.play();
        } catch (e) {}
    }

    // 模拟数据获取方法
    async getArticleCount() { return 0; }
    async getLikeCount() { return 0; }
    async getCommentCount() { return 0; }
    async getTotalCoinsDonated() { return 0; }
    async getFavoriteCount() { return 0; }
}

export { AchievementSystem };
