/**
 * 用户信誉系统 - User Reputation System
 * 基于用户行为的信誉评分和等级系统
 */

class ReputationSystem {
    constructor(options = {}) {
        this.apiBaseUrl = options.apiBaseUrl || '/api';
        this.userId = options.userId || null;
        this.reputationData = null;
        this.cacheTime = 5 * 60 * 1000; // 5分钟缓存
        this.lastFetch = 0;
    }

    /**
     * 信誉行为权重配置
     */
    static REPUTATION_WEIGHTS = {
        // 正向行为
        PUBLISH_ARTICLE: { points: 10, dailyLimit: 50, desc: '发布文章' },
        RECEIVE_LIKE: { points: 2, dailyLimit: 100, desc: '收到点赞' },
        RECEIVE_COMMENT: { points: 1, dailyLimit: 50, desc: '收到评论' },
        QUALITY_COMMENT: { points: 3, dailyLimit: 30, desc: '优质评论' },
        SOLVE_BOUNTY: { points: 20, dailyLimit: 100, desc: '解决悬赏' },
        DAILY_SIGNIN: { points: 5, dailyLimit: 5, desc: '每日签到' },
        SHARE_CONTENT: { points: 3, dailyLimit: 15, desc: '分享内容' },
        COMPLETE_PROFILE: { points: 50, oneTime: true, desc: '完善资料' },
        VERIFY_EMAIL: { points: 30, oneTime: true, desc: '验证邮箱' },
        VERIFY_PHONE: { points: 30, oneTime: true, desc: '验证手机' },
        INVITE_USER: { points: 15, dailyLimit: 75, desc: '邀请用户' },
        REPORT_SPAM: { points: 5, dailyLimit: 25, desc: '举报违规' },
        
        // 负向行为
        DELETE_ARTICLE: { points: -5, desc: '删除文章' },
        SPAM_COMMENT: { points: -10, desc: '垃圾评论' },
        RECEIVE_REPORT: { points: -20, desc: '被举报' },
        PLAGIARISM: { points: -50, desc: '抄袭行为' },
        ABUSIVE_BEHAVIOR: { points: -30, desc: '辱骂行为' },
        CANCEL_BOUNTY: { points: -15, desc: '取消悬赏' }
    };

    /**
     * 信誉等级配置
     */
    static REPUTATION_LEVELS = [
        { level: 1, name: '新手上路', minRep: 0, maxRep: 99, color: '#999', badge: '👶' },
        { level: 2, name: '初来乍到', minRep: 100, maxRep: 299, color: '#87d068', badge: '🌱' },
        { level: 3, name: '小有名气', minRep: 300, maxRep: 599, color: '#2db7f5', badge: '🌿' },
        { level: 4, name: '社区达人', minRep: 600, maxRep: 999, color: '#108ee9', badge: '🌲' },
        { level: 5, name: '资深用户', minRep: 1000, maxRep: 1999, color: '#722ed1', badge: '⭐' },
        { level: 6, name: '意见领袖', minRep: 2000, maxRep: 3999, color: '#eb2f96', badge: '🌟' },
        { level: 7, name: '社区精英', minRep: 4000, maxRep: 6999, color: '#f5222d', badge: '💎' },
        { level: 8, name: '传奇人物', minRep: 7000, maxRep: 9999, color: '#fa8c16', badge: '👑' },
        { level: 9, name: '社区传说', minRep: 10000, maxRep: 19999, color: '#fa541c', badge: '🏆' },
        { level: 10, name: '不朽神话', minRep: 20000, maxRep: Infinity, color: '#ffd700', badge: '👑' }
    ];

    /**
     * 获取用户信誉数据
     */
    async getReputation(userId = null) {
        const targetId = userId || this.userId;
        if (!targetId) return null;

        // 检查缓存
        if (this.reputationData && Date.now() - this.lastFetch < this.cacheTime) {
            return this.reputationData;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/reputation/${targetId}`, {
                headers: { 'Authorization': `Bearer ${this.getToken()}` }
            });

            if (!response.ok) throw new Error('获取信誉数据失败');

            this.reputationData = await response.json();
            this.lastFetch = Date.now();
            
            return this.reputationData;
        } catch (error) {
            console.error('获取信誉数据失败:', error);
            return this.getMockReputation(targetId);
        }
    }

    /**
     * 获取模拟信誉数据
     */
    getMockReputation(userId) {
        return {
            userId,
            reputation: 1250,
            level: 5,
            levelName: '资深用户',
            nextLevelRep: 2000,
            progress: 25, // 到下一级的进度百分比
            history: {
                today: 45,
                week: 280,
                month: 950,
                total: 1250
            },
            stats: {
                articlesPublished: 25,
                likesReceived: 156,
                commentsReceived: 89,
                bountiesSolved: 5,
                bountiesPublished: 3,
                signinStreak: 15
            },
            recentActions: [
                { action: 'PUBLISH_ARTICLE', points: 10, time: '2024-01-20T10:30:00Z' },
                { action: 'RECEIVE_LIKE', points: 2, time: '2024-01-20T09:15:00Z' },
                { action: 'QUALITY_COMMENT', points: 3, time: '2024-01-19T16:45:00Z' }
            ],
            privileges: this.getPrivileges(1250)
        };
    }

    /**
     * 记录信誉行为
     */
    async recordAction(actionType, data = {}) {
        const weight = ReputationSystem.REPUTATION_WEIGHTS[actionType];
        if (!weight) {
            console.warn(`未知的信誉行为: ${actionType}`);
            return null;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/reputation/action`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({
                    action: actionType,
                    points: weight.points,
                    data,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) throw new Error('记录行为失败');

            const result = await response.json();
            
            // 触发事件
            this.emit('reputationChanged', {
                action: actionType,
                points: weight.points,
                newReputation: result.reputation,
                levelUp: result.levelUp
            });

            // 如果升级了，触发升级事件
            if (result.levelUp) {
                this.emit('levelUp', result.levelUp);
            }

            return result;
        } catch (error) {
            console.error('记录信誉行为失败:', error);
            return null;
        }
    }

    /**
     * 批量记录行为（离线同步）
     */
    async syncOfflineActions(actions) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/reputation/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({ actions })
            });

            if (!response.ok) throw new Error('同步失败');

            // 清除本地存储的离线行为
            localStorage.removeItem('offline_reputation_actions');
            
            return await response.json();
        } catch (error) {
            console.error('同步离线行为失败:', error);
            // 保留在本地，下次再试
            return null;
        }
    }

    /**
     * 获取信誉排行榜
     */
    async getLeaderboard(period = 'month', page = 1, limit = 20) {
        try {
            const response = await fetch(
                `${this.apiBaseUrl}/reputation/leaderboard?period=${period}&page=${page}&limit=${limit}`
            );

            if (!response.ok) throw new Error('获取排行榜失败');

            return await response.json();
        } catch (error) {
            console.error('获取排行榜失败:', error);
            return this.getMockLeaderboard();
        }
    }

    /**
     * 模拟排行榜数据
     */
    getMockLeaderboard() {
        return {
            users: [
                { id: 'u1', name: '社区守护者', avatar: '', reputation: 15890, level: 9, change: 120 },
                { id: 'u2', name: '代码艺术家', avatar: '', reputation: 12350, level: 8, change: 85 },
                { id: 'u3', name: '知识分享者', avatar: '', reputation: 11200, level: 8, change: 200 },
                { id: 'u4', name: '热心市民', avatar: '', reputation: 9800, level: 7, change: 45 },
                { id: 'u5', name: '新人小白', avatar: '', reputation: 8500, level: 7, change: 300 }
            ],
            myRank: 42,
            totalUsers: 1234
        };
    }

    /**
     * 根据信誉值获取等级信息
     */
    static getLevelByReputation(reputation) {
        for (let i = ReputationSystem.REPUTATION_LEVELS.length - 1; i >= 0; i--) {
            const level = ReputationSystem.REPUTATION_LEVELS[i];
            if (reputation >= level.minRep) {
                return level;
            }
        }
        return ReputationSystem.REPUTATION_LEVELS[0];
    }

    /**
     * 获取下一个等级信息
     */
    static getNextLevel(reputation) {
        const currentLevel = this.getLevelByReputation(reputation);
        const nextLevel = ReputationSystem.REPUTATION_LEVELS[currentLevel.level];
        if (!nextLevel) return null;
        
        return {
            ...nextLevel,
            needed: nextLevel.minRep - reputation
        };
    }

    /**
     * 计算到下一级的进度百分比
     */
    static getProgressToNext(reputation) {
        const currentLevel = this.getLevelByReputation(reputation);
        const nextLevel = ReputationSystem.REPUTATION_LEVELS[currentLevel.level];
        
        if (!nextLevel) return 100;
        
        const range = nextLevel.minRep - currentLevel.minRep;
        const earned = reputation - currentLevel.minRep;
        return Math.min(100, Math.round((earned / range) * 100));
    }

    /**
     * 根据信誉值获取特权
     */
    getPrivileges(reputation) {
        const privileges = [];
        
        // 基础特权（所有用户）
        privileges.push(
            { id: 'comment', name: '发表评论', enabled: true },
            { id: 'like', name: '点赞', enabled: true }
        );

        // 信誉100+
        if (reputation >= 100) {
            privileges.push({ id: 'article', name: '发布文章', enabled: true });
        }

        // 信誉300+
        if (reputation >= 300) {
            privileges.push({ id: 'image_upload', name: '图片上传', enabled: true });
            privileges.push({ id: 'custom_avatar', name: '自定义头像', enabled: true });
        }

        // 信誉600+
        if (reputation >= 600) {
            privileges.push({ id: 'bounty', name: '发布悬赏', enabled: true });
            privileges.push({ id: 'signature', name: '个性签名', enabled: true });
        }

        // 信誉1000+
        if (reputation >= 1000) {
            privileges.push({ id: 'file_upload', name: '文件上传', enabled: true });
            privileges.push({ id: 'vote', name: '参与投票', enabled: true });
        }

        // 信誉2000+
        if (reputation >= 2000) {
            privileges.push({ id: 'moderator', name: '内容审核', enabled: true });
            privileges.push({ id: 'highlight', name: '内容高亮', enabled: true });
        }

        // 信誉4000+
        if (reputation >= 4000) {
            privileges.push({ id: 'bounty_no_limit', name: '无限悬赏', enabled: true });
            privileges.push({ id: 'priority_support', name: '优先支持', enabled: true });
        }

        // 信誉7000+
        if (reputation >= 7000) {
            privileges.push({ id: 'beta_access', name: '内测资格', enabled: true });
            privileges.push({ id: 'custom_badge', name: '定制徽章', enabled: true });
        }

        return privileges;
    }

    /**
     * 检查用户是否有特定权限
     */
    async hasPrivilege(privilegeId) {
        const reputation = await this.getReputation();
        if (!reputation) return false;
        
        const privileges = this.getPrivileges(reputation.reputation);
        const privilege = privileges.find(p => p.id === privilegeId);
        return privilege ? privilege.enabled : false;
    }

    /**
     * 获取信誉趋势
     */
    async getReputationTrend(userId = null, days = 30) {
        const targetId = userId || this.userId;
        
        try {
            const response = await fetch(
                `${this.apiBaseUrl}/reputation/${targetId}/trend?days=${days}`,
                { headers: { 'Authorization': `Bearer ${this.getToken()}` } }
            );

            if (!response.ok) throw new Error('获取趋势失败');

            return await response.json();
        } catch (error) {
            console.error('获取信誉趋势失败:', error);
            return this.generateMockTrend(days);
        }
    }

    /**
     * 生成模拟趋势数据
     */
    generateMockTrend(days) {
        const data = [];
        let reputation = 1000;
        
        for (let i = days; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            // 随机增长
            const change = Math.random() > 0.3 ? Math.floor(Math.random() * 20) : 0;
            reputation += change;
            
            data.push({
                date: date.toISOString().split('T')[0],
                reputation,
                change
            });
        }
        
        return data;
    }

    /**
     * 举报用户
     */
    async reportUser(targetUserId, reason, evidence = null) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/reputation/report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({
                    targetUserId,
                    reason,
                    evidence,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) throw new Error('举报失败');

            return await response.json();
        } catch (error) {
            console.error('举报失败:', error);
            throw error;
        }
    }

    /**
     * 获取Token
     */
    getToken() {
        return localStorage.getItem('auth_token') || '';
    }

    /**
     * 事件发射
     */
    emit(eventName, data) {
        const event = new CustomEvent(`reputation:${eventName}`, { detail: data });
        document.dispatchEvent(event);
    }

    /**
     * 监听事件
     */
    on(eventName, callback) {
        document.addEventListener(`reputation:${eventName}`, (e) => callback(e.detail));
    }
}

/**
 * 信誉系统UI
 */
class ReputationUI {
    constructor(reputationSystem) {
        this.reputationSystem = reputationSystem;
    }

    /**
     * 渲染信誉卡片
     */
    async renderReputationCard(containerId, userId = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const data = await this.reputationSystem.getReputation(userId);
        if (!data) {
            container.innerHTML = '<div class="reputation-loading">加载中...</div>';
            return;
        }

        const level = ReputationSystem.getLevelByReputation(data.reputation);
        const progress = ReputationSystem.getProgressToNext(data.reputation);
        const nextLevel = ReputationSystem.getNextLevel(data.reputation);

        container.innerHTML = `
            <div class="reputation-card">
                <div class="reputation-header">
                    <div class="level-badge" style="background: ${level.color}">
                        <span class="badge-icon">${level.badge}</span>
                        <span class="level-num">Lv.${level.level}</span>
                    </div>
                    <div class="level-info">
                        <h3>${level.name}</h3>
                        <p>${data.reputation} 信誉值</p>
                    </div>
                </div>
                
                <div class="reputation-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%; background: ${level.color}"></div>
                    </div>
                    <div class="progress-text">
                        ${nextLevel 
                            ? `还需 ${nextLevel.needed} 点升级至 ${nextLevel.name}` 
                            : '已达最高等级！'}
                    </div>
                </div>

                <div class="reputation-stats">
                    <div class="stat-item">
                        <span class="stat-value">${data.history.today}</span>
                        <span class="stat-label">今日</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${data.history.week}</span>
                        <span class="stat-label">本周</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${data.history.month}</span>
                        <span class="stat-label">本月</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${data.history.total}</span>
                        <span class="stat-label">总计</span>
                    </div>
                </div>

                <div class="reputation-actions">
                    <button class="btn btn-sm" onclick="reputationUI.showHistory()">查看记录</button>
                    <button class="btn btn-sm" onclick="reputationUI.showLeaderboard()">排行榜</button>
                    <button class="btn btn-sm" onclick="reputationUI.showPrivileges()">我的特权</button>
                </div>
            </div>
        `;
    }

    /**
     * 渲染信誉历史
     */
    async renderHistory(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const data = await this.reputationSystem.getReputation();
        if (!data || !data.recentActions) {
            container.innerHTML = '<div class="empty">暂无记录</div>';
            return;
        }

        container.innerHTML = `
            <div class="reputation-history">
                <h4>最近动态</h4>
                <div class="history-list">
                    ${data.recentActions.map(action => {
                        const weight = ReputationSystem.REPUTATION_WEIGHTS[action.action];
                        const isPositive = action.points > 0;
                        return `
                            <div class="history-item ${isPositive ? 'positive' : 'negative'}">
                                <div class="history-icon">${isPositive ? '+' : ''}${action.points}</div>
                                <div class="history-content">
                                    <div class="history-title">${weight ? weight.desc : action.action}</div>
                                    <div class="history-time">${this.formatTime(action.time)}</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * 渲染特权列表
     */
    renderPrivileges(containerId, reputation) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const privileges = this.reputationSystem.getPrivileges(reputation);

        container.innerHTML = `
            <div class="privileges-list">
                <h4>我的特权</h4>
                ${privileges.map(p => `
                    <div class="privilege-item ${p.enabled ? 'enabled' : 'disabled'}">
                        <span class="privilege-status">${p.enabled ? '✓' : '✗'}</span>
                        <span class="privilege-name">${p.name}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * 渲染排行榜
     */
    async renderLeaderboard(containerId, period = 'month') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '<div class="loading">加载中...</div>';

        const data = await this.reputationSystem.getLeaderboard(period);
        
        container.innerHTML = `
            <div class="reputation-leaderboard">
                <div class="leaderboard-tabs">
                    <button class="tab ${period === 'week' ? 'active' : ''}" onclick="reputationUI.renderLeaderboard('${containerId}', 'week')">本周</button>
                    <button class="tab ${period === 'month' ? 'active' : ''}" onclick="reputationUI.renderLeaderboard('${containerId}', 'month')">本月</button>
                    <button class="tab ${period === 'all' ? 'active' : ''}" onclick="reputationUI.renderLeaderboard('${containerId}', 'all')">总榜</button>
                </div>
                <div class="leaderboard-list">
                    ${data.users.map((user, index) => {
                        const level = ReputationSystem.getLevelByReputation(user.reputation);
                        return `
                            <div class="leaderboard-item ${user.id === this.reputationSystem.userId ? 'self' : ''}">
                                <div class="rank ${index < 3 ? 'top-' + (index + 1) : ''}">
                                    ${index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                                </div>
                                <img src="${user.avatar || '/images/default-avatar.png'}" alt="" class="user-avatar">
                                <div class="user-info">
                                    <span class="user-name">${this.escapeHtml(user.name)}</span>
                                    <span class="user-level" style="color: ${level.color}">${level.name}</span>
                                </div>
                                <div class="reputation-info">
                                    <span class="reputation-score">${user.reputation}</span>
                                    ${user.change > 0 ? `<span class="reputation-change">+${user.change}</span>` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                ${data.myRank ? `
                    <div class="my-rank">
                        我的排名: <strong>第 ${data.myRank} 名</strong> / 共 ${data.totalUsers} 人
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * 渲染趋势图表
     */
    async renderTrendChart(containerId, days = 30) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const data = await this.reputationSystem.getReputationTrend(null, days);
        
        // 简化的SVG图表
        const maxRep = Math.max(...data.map(d => d.reputation));
        const minRep = Math.min(...data.map(d => d.reputation));
        const range = maxRep - minRep || 1;
        
        const width = container.clientWidth || 300;
        const height = 150;
        const padding = 20;
        
        const points = data.map((d, i) => {
            const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
            const y = height - padding - ((d.reputation - minRep) / range) * (height - 2 * padding);
            return `${x},${y}`;
        }).join(' ');

        container.innerHTML = `
            <div class="reputation-chart">
                <h4>信誉趋势 (近${days}天)</h4>
                <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: ${height}px;">
                    <polyline
                        fill="none"
                        stroke="#667eea"
                        stroke-width="2"
                        points="${points}"
                    />
                    ${data.filter((_, i) => i % 5 === 0).map((d, i) => {
                        const x = padding + ((i * 5) / (data.length - 1)) * (width - 2 * padding);
                        return `<text x="${x}" y="${height - 5}" font-size="10" text-anchor="middle" fill="#999">${d.date.slice(5)}</text>`;
                    }).join('')}
                </svg>
            </div>
        `;
    }

    /**
     * 显示提示
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#52c41a' : type === 'error' ? '#ff4d4f' : '#1890ff'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideUp 0.3s ease;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    /**
     * 工具方法
     */
    formatTime(timeStr) {
        const date = new Date(timeStr);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
        return `${Math.floor(diff / 86400000)}天前`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 全局实例
window.ReputationSystem = ReputationSystem;
window.ReputationUI = ReputationUI;

// 初始化
let reputationSystem, reputationUI;

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.currentUser || null;
    reputationSystem = new ReputationSystem({ userId: currentUser?.id });
    reputationUI = new ReputationUI(reputationSystem);
    window.reputationSystem = reputationSystem;
    window.reputationUI = reputationUI;
});
