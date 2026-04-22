/**
 * 用户成长系统 - 整合等级、经验、徽章、任务、商城
 * 与后端 gamification.js API 对接
 */

import { API_BASE_URL } from './api-config.js?v=20260419b';
import { escapeHtml } from './utils.js';

class GamificationSystem {
    constructor() {
        this.userLevel = null;
        this.badges = [];
        this.userBadges = [];
        this.dailyTasks = [];
        this.shopItems = [];
        this.expHistory = [];
        this.purchases = [];
        this.token = null;
        try {
            this.token = localStorage.getItem('token');
        } catch (e) {
            console.warn('localStorage 访问失败:', e);
        }
    }

    init() {
        if (!this.token) {
            console.log('用户未登录，跳过成长系统初始化');
            return;
        }
        this.loadAllData();
    }

    // ========== 核心数据加载 ==========
    async loadAllData() {
        await Promise.all([
            this.loadLevelInfo(),
            this.loadBadges(),
            this.loadDailyTasks(),
            this.loadShopItems()
        ]);
    }

    // ========== 等级/经验系统 ==========
    async loadLevelInfo() {
        try {
            const response = await fetch(`${API_BASE_URL}/level`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!response.ok) throw new Error('加载等级信息失败');
            this.userLevel = await response.json();
            this.renderLevelWidget();
            return this.userLevel;
        } catch (error) {
            console.error('加载等级信息失败:', error);
        }
    }

    async loadExpHistory(page = 1, limit = 20) {
        try {
            const response = await fetch(`${API_BASE_URL}/exp/history?page=${page}&limit=${limit}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!response.ok) throw new Error('加载经验历史失败');
            const data = await response.json();
            this.expHistory = data.history;
            return data;
        } catch (error) {
            console.error('加载经验历史失败:', error);
        }
    }

    // 经验值计算公式
    calculateNextLevelExp(level) {
        return Math.floor(100 * Math.pow(1.2, level - 1));
    }

    getLevelProgress() {
        if (!this.userLevel) return 0;
        const { current_exp, next_level_exp } = this.userLevel;
        return Math.min(100, Math.floor((current_exp / next_level_exp) * 100));
    }

    // ========== 徽章系统 ==========
    async loadBadges() {
        try {
            // 加载所有徽章定义
            const allResponse = await fetch(`${API_BASE_URL}/badges`);
            if (!allResponse.ok) throw new Error('加载徽章失败');
            this.badges = await allResponse.json();

            // 加载用户已获得徽章
            const userResponse = await fetch(`${API_BASE_URL}/badges/my`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (userResponse.ok) {
                const data = await userResponse.json();
                this.userBadges = data.badges || [];
            }

            this.renderBadges();
            return { all: this.badges, user: this.userBadges };
        } catch (error) {
            console.error('加载徽章失败:', error);
        }
    }

    async equipBadge(badgeId) {
        try {
            const response = await fetch(`${API_BASE_URL}/badges/equip`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ badge_id: badgeId })
            });
            if (!response.ok) throw new Error('装备徽章失败');
            const result = await response.json();
            this.showToast(`徽章「${result.badge_name}」已装备！`);
            await this.loadBadges();
            return result;
        } catch (error) {
            console.error('装备徽章失败:', error);
            this.showToast('装备徽章失败', 'error');
        }
    }

    // ========== 每日任务系统 ==========
    async loadDailyTasks() {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks/daily`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!response.ok) throw new Error('加载任务失败');
            const data = await response.json();
            this.dailyTasks = data.tasks || [];
            this.renderDailyTasks();
            return data;
        } catch (error) {
            console.error('加载每日任务失败:', error);
        }
    }

    async completeTask(taskId) {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks/complete/${taskId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!response.ok) throw new Error('完成任务失败');
            const result = await response.json();
            
            // 显示奖励动画
            this.showRewardAnimation({
                exp: result.exp_gained || 0,
                coins: result.coins_gained || 0,
                badge: result.badge_earned
            });

            // 刷新数据
            await Promise.all([
                this.loadDailyTasks(),
                this.loadLevelInfo()
            ]);

            return result;
        } catch (error) {
            console.error('完成任务失败:', error);
            this.showToast('任务完成失败', 'error');
        }
    }

    // ========== 积分商城系统 ==========
    async loadShopItems() {
        try {
            const response = await fetch(`${API_BASE_URL}/shop/items`);
            if (!response.ok) throw new Error('加载商品失败');
            const data = await response.json();
            this.shopItems = data.items || [];
            this.renderShopItems();
            return data;
        } catch (error) {
            console.error('加载商城商品失败:', error);
        }
    }

    async loadPurchases() {
        try {
            const response = await fetch(`${API_BASE_URL}/shop/purchases`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!response.ok) throw new Error('加载购买记录失败');
            const data = await response.json();
            this.purchases = data.purchases || [];
            return data;
        } catch (error) {
            console.error('加载购买记录失败:', error);
        }
    }

    async purchaseItem(itemId) {
        try {
            const response = await fetch(`${API_BASE_URL}/shop/buy`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ item_id: itemId })
            });
            if (!response.ok) throw new Error('购买失败');
            const result = await response.json();
            
            this.showToast(`成功购买「${result.item_name}」！`, 'success');
            await Promise.all([
                this.loadShopItems(),
                this.loadLevelInfo()
            ]);
            return result;
        } catch (error) {
            console.error('购买失败:', error);
            this.showToast(error.message || '购买失败，积分不足或库存不足', 'error');
        }
    }

    // ========== 渲染方法 ==========
    renderLevelWidget() {
        const container = document.getElementById('levelWidget');
        if (!container || !this.userLevel) return;

        const progress = this.getLevelProgress();
        const expToNext = this.userLevel.next_level_exp - this.userLevel.current_exp;

        container.innerHTML = `
            <div class="level-widget">
                <div class="level-header">
                    <span class="level-badge">Lv.${this.userLevel.level}</span>
                    <span class="level-title">${this.getLevelTitle(this.userLevel.level)}</span>
                </div>
                <div class="exp-bar-container">
                    <div class="exp-bar" style="width: ${progress}%"></div>
                </div>
                <div class="exp-info">
                    <span>${this.userLevel.current_exp} / ${this.userLevel.next_level_exp} XP</span>
                    <span>还需 ${expToNext} XP 升级</span>
                </div>
                ${this.userLevel.weekly_exp > 0 ? `
                    <div class="weekly-exp">
                        本周获得 +${this.userLevel.weekly_exp} XP
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderBadges() {
        const container = document.getElementById('badgesContainer');
        if (!container) return;

        const userBadgeIds = this.userBadges.map(b => b.badge_id);
        const equippedBadgeId = this.userBadges.find(b => b.is_equipped)?.badge_id;

        container.innerHTML = `
            <div class="badges-section">
                <div class="badges-header">
                    <h3>我的徽章 (${this.userBadges.length}/${this.badges.length})</h3>
                    ${equippedBadgeId ? `
                        <span class="equipped-badge">当前展示: ${this.getBadgeById(equippedBadgeId)?.name || ''}</span>
                    ` : ''}
                </div>
                <div class="badges-grid">
                    ${this.badges.map(badge => {
                        const hasBadge = userBadgeIds.includes(badge.id);
                        const isEquipped = equippedBadgeId === badge.id;
                        return `
                            <div class="badge-item ${hasBadge ? 'owned' : 'locked'} ${isEquipped ? 'equipped' : ''}"
                                 data-badge-id="${badge.id}">
                                <div class="badge-icon" style="background: ${badge.color}">
                                    ${badge.icon}
                                </div>
                                <div class="badge-name">${escapeHtml(badge.name)}</div>
                                <div class="badge-desc">${escapeHtml(badge.description)}</div>
                                ${hasBadge && !isEquipped ? `
                                    <button class="btn-equip" data-badge-id="${badge.id}">展示</button>
                                ` : ''}
                                ${isEquipped ? '<span class="equipped-label">展示中</span>' : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        // 绑定装备按钮事件
        container.querySelectorAll('.btn-equip').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.equipBadge(btn.dataset.badgeId);
            });
        });
    }

    renderDailyTasks() {
        const container = document.getElementById('dailyTasksContainer');
        if (!container) return;

        const completedCount = this.dailyTasks.filter(t => t.completed).length;
        const totalCount = this.dailyTasks.length;

        container.innerHTML = `
            <div class="daily-tasks-section">
                <div class="tasks-header">
                    <h3>今日任务</h3>
                    <span class="task-progress">${completedCount}/${totalCount}</span>
                </div>
                <div class="tasks-list">
                    ${this.dailyTasks.map(task => `
                        <div class="task-item ${task.completed ? 'completed' : ''}">
                            <div class="task-icon">${this.getTaskIcon(task.task_type)}</div>
                            <div class="task-info">
                                <div class="task-name">${escapeHtml(task.task_name)}</div>
                                <div class="task-desc">${escapeHtml(task.description)}</div>
                                <div class="task-rewards">
                                    <span class="reward-exp">+${task.reward_exp} XP</span>
                                    ${task.reward_coins ? `<span class="reward-coins">+${task.reward_coins} 硬币</span>` : ''}
                                </div>
                            </div>
                            <div class="task-action">
                                ${task.completed ? 
                                    '<span class="task-done">✅ 已完成</span>' :
                                    `<button class="btn-do-task" data-task-id="${task.task_id}">去完成</button>`
                                }
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${completedCount === totalCount && totalCount > 0 ? `
                    <div class="all-completed">
                        🎉 今日任务全部完成！明天再来吧~
                    </div>
                ` : ''}
            </div>
        `;

        // 绑定任务按钮事件
        container.querySelectorAll('.btn-do-task').forEach(btn => {
            btn.addEventListener('click', () => this.handleTaskAction(btn.dataset.taskId));
        });
    }

    renderShopItems() {
        const container = document.getElementById('shopContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="shop-section">
                <div class="shop-header">
                    <h3>积分商城</h3>
                    <div class="shop-filters">
                        <button class="filter-btn active" data-type="all">全部</button>
                        <button class="filter-btn" data-type="theme">主题</button>
                        <button class="filter-btn" data-type="badge">徽章框</button>
                        <button class="filter-btn" data-type="feature">功能</button>
                    </div>
                </div>
                <div class="shop-grid">
                    ${this.shopItems.map(item => `
                        <div class="shop-item" data-type="${item.item_type}">
                            <div class="item-image">${item.image_url ? `<img src="${item.image_url}" alt="">` : '🎁'}</div>
                            <div class="item-info">
                                <h4>${escapeHtml(item.name)}</h4>
                                <p>${escapeHtml(item.description)}</p>
                                <div class="item-meta">
                                    <span class="item-price">${item.price} 硬币</span>
                                    ${item.stock > 0 ? `<span class="item-stock">库存 ${item.stock}</span>` : '<span class="out-of-stock">缺货</span>'}
                                </div>
                            </div>
                            <button class="btn-buy ${item.stock <= 0 ? 'disabled' : ''}" 
                                    data-item-id="${item.id}"
                                    ${item.stock <= 0 ? 'disabled' : ''}>
                                ${item.stock > 0 ? '购买' : '缺货'}
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // 绑定购买按钮和筛选
        container.querySelectorAll('.btn-buy').forEach(btn => {
            btn.addEventListener('click', () => this.purchaseItem(btn.dataset.itemId));
        });

        container.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterShopItems(btn.dataset.type);
            });
        });
    }

    filterShopItems(type) {
        const items = document.querySelectorAll('.shop-item');
        items.forEach(item => {
            if (type === 'all' || item.dataset.type === type) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // ========== 辅助方法 ==========
    getLevelTitle(level) {
        const titles = [
            '新手猫奴', '见习铲屎官', '熟练铲屎官', '资深猫奴', '猫咪专家',
            '猫语翻译官', '喵星人导师', '猫爬架守护者', '猫界传奇', '喵神'
        ];
        return titles[Math.min(level - 1, titles.length - 1)] || '喵神';
    }

    getBadgeById(id) {
        return this.badges.find(b => b.id === parseInt(id));
    }

    getTaskIcon(type) {
        const icons = {
            checkin: '📅',
            read: '📖',
            comment: '💬',
            like: '❤️',
            share: '📤',
            write: '✍️',
            default: '✨'
        };
        return icons[type] || icons.default;
    }

    handleTaskAction(taskId) {
        const task = this.dailyTasks.find(t => t.task_id === parseInt(taskId));
        if (!task) return;

        // 根据任务类型导航到对应页面
        const routes = {
            checkin: '/coins.html',
            read: '/',
            comment: '/',
            like: '/',
            share: '/',
            write: '/editor.html'
        };

        if (task.task_type === 'checkin') {
            this.completeTask(taskId);
        } else if (routes[task.task_type]) {
            window.location.href = routes[task.task_type];
        }
    }

    // ========== 视觉反馈 ==========
    showRewardAnimation(rewards) {
        const overlay = document.createElement('div');
        overlay.className = 'reward-overlay';
        
        let content = '<div class="reward-popup">';
        if (rewards.exp) content += `<div class="reward-item exp">+${rewards.exp} XP</div>`;
        if (rewards.coins) content += `<div class="reward-item coins">+${rewards.coins} 硬币</div>`;
        if (rewards.badge) content += `<div class="reward-item badge">🏆 获得徽章「${rewards.badge}」</div>`;
        content += '</div>';
        
        overlay.innerHTML = content;
        document.body.appendChild(overlay);

        // 动画后移除
        setTimeout(() => {
            overlay.classList.add('fade-out');
            setTimeout(() => overlay.remove(), 500);
        }, 2000);
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `gamification-toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ========== 全局初始化 ==========
    static init() {
        window.gamification = new GamificationSystem();
        window.gamification.init();
    }
}

// 页面加载时自动初始化
document.addEventListener('DOMContentLoaded', () => {
    GamificationSystem.init();
});

// 导出供其他模块使用
export default GamificationSystem;
