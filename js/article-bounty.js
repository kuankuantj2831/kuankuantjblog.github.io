/**
 * 文章悬赏系统 - Article Bounty System
 * 允许用户发布悬赏请求和解决悬赏
 */

class ArticleBountySystem {
    constructor(options = {}) {
        this.apiBaseUrl = options.apiBaseUrl || '/api';
        this.bounties = new Map();
        this.userBounties = new Map();
        this.currentUser = options.currentUser || null;
    }

    /**
     * 创建悬赏
     */
    async createBounty(bountyData) {
        try {
            const data = {
                title: bountyData.title,
                description: bountyData.description,
                category: bountyData.category || 'article',
                reward: {
                    coins: bountyData.coins || 0,
                    points: bountyData.points || 0
                },
                difficulty: bountyData.difficulty || 'medium',
                deadline: bountyData.deadline || null,
                tags: bountyData.tags || [],
                requirements: bountyData.requirements || []
            };

            // 验证数据
            const validation = this.validateBounty(data);
            if (!validation.valid) {
                throw new Error(validation.message);
            }

            const response = await fetch(`${this.apiBaseUrl}/bounties`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('创建悬赏失败');

            const result = await response.json();
            
            // 更新本地缓存
            this.bounties.set(result.id, result);
            
            // 触发事件
            this.emit('bountyCreated', result);
            
            return result;
        } catch (error) {
            console.error('创建悬赏失败:', error);
            throw error;
        }
    }

    /**
     * 验证悬赏数据
     */
    validateBounty(data) {
        if (!data.title || data.title.length < 5) {
            return { valid: false, message: '标题至少需要5个字符' };
        }
        if (!data.description || data.description.length < 20) {
            return { valid: false, message: '描述至少需要20个字符' };
        }
        if (data.reward.coins < 10 && data.reward.points < 10) {
            return { valid: false, message: '悬赏奖励至少10硬币或10积分' };
        }
        return { valid: true };
    }

    /**
     * 获取悬赏列表
     */
    async getBounties(filters = {}) {
        try {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.category) params.append('category', filters.category);
            if (filters.difficulty) params.append('difficulty', filters.difficulty);
            if (filters.minReward) params.append('min_reward', filters.minReward);
            if (filters.maxReward) params.append('max_reward', filters.maxReward);
            if (filters.tags) params.append('tags', filters.tags.join(','));
            if (filters.sort) params.append('sort', filters.sort);
            if (filters.page) params.append('page', filters.page);
            if (filters.limit) params.append('limit', filters.limit);

            const response = await fetch(`${this.apiBaseUrl}/bounties?${params}`, {
                headers: { 'Authorization': `Bearer ${this.getToken()}` }
            });

            if (!response.ok) throw new Error('获取悬赏列表失败');

            const result = await response.json();
            
            // 更新缓存
            result.bounties.forEach(bounty => {
                this.bounties.set(bounty.id, bounty);
            });

            return result;
        } catch (error) {
            console.error('获取悬赏列表失败:', error);
            // 返回模拟数据
            return this.getMockBounties();
        }
    }

    /**
     * 获取模拟悬赏数据
     */
    getMockBounties() {
        return {
            bounties: [
                {
                    id: '1',
                    title: '寻找Vue.js性能优化方案',
                    description: '需要一份详细的Vue.js应用性能优化指南，包含代码示例',
                    category: 'article',
                    reward: { coins: 100, points: 50 },
                    difficulty: 'medium',
                    status: 'open',
                    deadline: '2024-12-31',
                    tags: ['vue', '性能优化', '前端'],
                    publisher: { id: 'u1', name: '张三', avatar: '' },
                    submissions: 3,
                    createdAt: '2024-01-15'
                },
                {
                    id: '2',
                    title: '设计一个现代化的博客主题',
                    description: '需要设计一个响应式的博客主题，包含首页、文章页、关于页',
                    category: 'design',
                    reward: { coins: 200, points: 100 },
                    difficulty: 'hard',
                    status: 'open',
                    deadline: '2024-12-25',
                    tags: ['设计', 'UI/UX', '响应式'],
                    publisher: { id: 'u2', name: '李四', avatar: '' },
                    submissions: 0,
                    createdAt: '2024-01-20'
                }
            ],
            total: 2,
            page: 1,
            totalPages: 1
        };
    }

    /**
     * 获取悬赏详情
     */
    async getBountyDetail(bountyId) {
        try {
            // 先检查缓存
            if (this.bounties.has(bountyId)) {
                return this.bounties.get(bountyId);
            }

            const response = await fetch(`${this.apiBaseUrl}/bounties/${bountyId}`, {
                headers: { 'Authorization': `Bearer ${this.getToken()}` }
            });

            if (!response.ok) throw new Error('获取悬赏详情失败');

            const bounty = await response.json();
            this.bounties.set(bountyId, bounty);
            return bounty;
        } catch (error) {
            console.error('获取悬赏详情失败:', error);
            return null;
        }
    }

    /**
     * 提交悬赏方案
     */
    async submitSolution(bountyId, solution) {
        try {
            const data = {
                bountyId,
                content: solution.content,
                attachments: solution.attachments || [],
                note: solution.note || ''
            };

            const response = await fetch(`${this.apiBaseUrl}/bounties/${bountyId}/solutions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('提交方案失败');

            const result = await response.json();
            this.emit('solutionSubmitted', { bountyId, solution: result });
            
            return result;
        } catch (error) {
            console.error('提交方案失败:', error);
            throw error;
        }
    }

    /**
     * 选择最佳方案
     */
    async selectWinner(bountyId, solutionId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/bounties/${bountyId}/winner`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({ solutionId })
            });

            if (!response.ok) throw new Error('选择获胜者失败');

            const result = await response.json();
            
            // 更新本地状态
            const bounty = this.bounties.get(bountyId);
            if (bounty) {
                bounty.status = 'completed';
                bounty.winner = result.winner;
            }

            this.emit('winnerSelected', { bountyId, winner: result.winner });
            
            return result;
        } catch (error) {
            console.error('选择获胜者失败:', error);
            throw error;
        }
    }

    /**
     * 获取我的悬赏
     */
    async getMyBounties() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/bounties/my`, {
                headers: { 'Authorization': `Bearer ${this.getToken()}` }
            });

            if (!response.ok) throw new Error('获取我的悬赏失败');

            return await response.json();
        } catch (error) {
            console.error('获取我的悬赏失败:', error);
            return { published: [], participated: [] };
        }
    }

    /**
     * 获取赏金猎人排行榜
     */
    async getBountyHunters(page = 1, limit = 20) {
        try {
            const response = await fetch(
                `${this.apiBaseUrl}/bounties/hunters?page=${page}&limit=${limit}`
            );

            if (!response.ok) throw new Error('获取排行榜失败');

            return await response.json();
        } catch (error) {
            console.error('获取排行榜失败:', error);
            return this.getMockHunters();
        }
    }

    /**
     * 模拟赏金猎人数据
     */
    getMockHunters() {
        return {
            hunters: [
                { id: 'u1', name: '代码侠客', avatar: '', completed: 15, earned: 1500, rating: 4.9 },
                { id: 'u2', name: '设计大师', avatar: '', completed: 12, earned: 1200, rating: 4.8 },
                { id: 'u3', name: '全栈达人', avatar: '', completed: 10, earned: 1000, rating: 4.7 }
            ],
            myRank: null
        };
    }

    /**
     * 取消悬赏
     */
    async cancelBounty(bountyId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/bounties/${bountyId}/cancel`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.getToken()}` }
            });

            if (!response.ok) throw new Error('取消悬赏失败');

            const bounty = this.bounties.get(bountyId);
            if (bounty) bounty.status = 'cancelled';

            this.emit('bountyCancelled', { bountyId });
            
            return true;
        } catch (error) {
            console.error('取消悬赏失败:', error);
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
        const event = new CustomEvent(`bounty:${eventName}`, { detail: data });
        document.dispatchEvent(event);
    }

    /**
     * 监听事件
     */
    on(eventName, callback) {
        document.addEventListener(`bounty:${eventName}`, (e) => callback(e.detail));
    }
}

/**
 * 悬赏系统UI
 */
class BountyUI {
    constructor(bountySystem) {
        this.bountySystem = bountySystem;
        this.currentView = 'list';
    }

    /**
     * 渲染悬赏列表
     */
    renderBountyList(containerId, bounties) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = bounties.map(bounty => `
            <div class="bounty-card ${bounty.status}" data-id="${bounty.id}">
                <div class="bounty-header">
                    <span class="bounty-category">${this.getCategoryName(bounty.category)}</span>
                    <span class="bounty-difficulty difficulty-${bounty.difficulty}">
                        ${this.getDifficultyName(bounty.difficulty)}
                    </span>
                </div>
                <h3 class="bounty-title">${this.escapeHtml(bounty.title)}</h3>
                <p class="bounty-desc">${this.escapeHtml(bounty.description.substring(0, 100))}...</p>
                <div class="bounty-tags">
                    ${bounty.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                </div>
                <div class="bounty-footer">
                    <div class="bounty-reward">
                        <span class="reward-coins">🪙 ${bounty.reward.coins}</span>
                        ${bounty.reward.points > 0 ? `<span class="reward-points">⭐ ${bounty.reward.points}</span>` : ''}
                    </div>
                    <div class="bounty-meta">
                        <span class="submissions">👥 ${bounty.submissions} 人参与</span>
                        <span class="deadline">⏰ ${this.formatDeadline(bounty.deadline)}</span>
                    </div>
                </div>
                <div class="bounty-publisher">
                    <img src="${bounty.publisher.avatar || '/images/default-avatar.png'}" alt="" class="publisher-avatar">
                    <span class="publisher-name">${this.escapeHtml(bounty.publisher.name)}</span>
                </div>
            </div>
        `).join('');

        // 绑定点击事件
        container.querySelectorAll('.bounty-card').forEach(card => {
            card.addEventListener('click', () => {
                const bountyId = card.dataset.id;
                this.showBountyDetail(bountyId);
            });
        });
    }

    /**
     * 渲染创建悬赏表单
     */
    renderCreateForm(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="bounty-create-form">
                <h3>发布悬赏</h3>
                <div class="form-group">
                    <label>标题 *</label>
                    <input type="text" id="bountyTitle" placeholder="简明扼要地描述你的需求" maxlength="100">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>分类 *</label>
                        <select id="bountyCategory">
                            <option value="article">文章创作</option>
                            <option value="design">设计制作</option>
                            <option value="code">代码开发</option>
                            <option value="translation">翻译服务</option>
                            <option value="other">其他</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>难度 *</label>
                        <select id="bountyDifficulty">
                            <option value="easy">简单</option>
                            <option value="medium" selected>中等</option>
                            <option value="hard">困难</option>
                            <option value="expert">专家</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>描述 *</label>
                    <textarea id="bountyDescription" rows="5" placeholder="详细描述你的需求，包括具体要求、参考示例等"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>悬赏硬币 *</label>
                        <input type="number" id="bountyCoins" min="10" value="50">
                    </div>
                    <div class="form-group">
                        <label>悬赏积分</label>
                        <input type="number" id="bountyPoints" min="0" value="0">
                    </div>
                </div>
                <div class="form-group">
                    <label>标签</label>
                    <input type="text" id="bountyTags" placeholder="用逗号分隔标签，如：前端, Vue, 教程">
                </div>
                <div class="form-group">
                    <label>截止时间</label>
                    <input type="date" id="bountyDeadline">
                </div>
                <div class="form-group">
                    <label>具体要求</label>
                    <div id="requirementsList">
                        <div class="requirement-item">
                            <input type="text" placeholder="添加一个具体要求">
                            <button type="button" class="btn-remove-req">×</button>
                        </div>
                    </div>
                    <button type="button" class="btn-add-req" onclick="bountyUI.addRequirement()">+ 添加要求</button>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="bountyUI.cancel()">取消</button>
                    <button type="button" class="btn btn-primary" onclick="bountyUI.submit()">发布悬赏</button>
                </div>
            </div>
        `;
    }

    /**
     * 渲染悬赏详情
     */
    async showBountyDetail(bountyId) {
        const bounty = await this.bountySystem.getBountyDetail(bountyId);
        if (!bounty) {
            showToast('悬赏不存在');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'bounty-modal-overlay';
        modal.innerHTML = `
            <div class="bounty-modal">
                <div class="bounty-modal-header">
                    <span class="bounty-status status-${bounty.status}">${this.getStatusName(bounty.status)}</span>
                    <button class="close-btn" onclick="this.closest('.bounty-modal-overlay').remove()">×</button>
                </div>
                <div class="bounty-modal-body">
                    <h2>${this.escapeHtml(bounty.title)}</h2>
                    <div class="bounty-meta-row">
                        <span class="category">${this.getCategoryName(bounty.category)}</span>
                        <span class="difficulty difficulty-${bounty.difficulty}">
                            ${this.getDifficultyName(bounty.difficulty)}
                        </span>
                    </div>
                    <div class="bounty-description">
                        ${this.escapeHtml(bounty.description).replace(/\n/g, '<br>')}
                    </div>
                    ${bounty.requirements?.length ? `
                        <div class="bounty-requirements">
                            <h4>具体要求：</h4>
                            <ul>
                                ${bounty.requirements.map(r => `<li>${this.escapeHtml(r)}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    <div class="bounty-tags">
                        ${bounty.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                    <div class="bounty-reward-section">
                        <div class="reward-box">
                            <span class="label">悬赏奖励</span>
                            <span class="value">
                                🪙 ${bounty.reward.coins}
                                ${bounty.reward.points > 0 ? `+ ⭐ ${bounty.reward.points}` : ''}
                            </span>
                        </div>
                        <div class="deadline-box">
                            <span class="label">截止时间</span>
                            <span class="value">${bounty.deadline || '无限制'}</span>
                        </div>
                        <div class="participants-box">
                            <span class="label">已参与</span>
                            <span class="value">${bounty.submissions} 人</span>
                        </div>
                    </div>
                </div>
                <div class="bounty-modal-footer">
                    ${bounty.status === 'open' ? `
                        <button class="btn btn-primary btn-lg" onclick="bountyUI.showSubmitForm('${bountyId}')">
                            提交方案
                        </button>
                    ` : `
                        <button class="btn btn-secondary btn-lg" disabled>悬赏已结束</button>
                    `}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    /**
     * 提交表单
     */
    async submit() {
        const data = {
            title: document.getElementById('bountyTitle').value,
            category: document.getElementById('bountyCategory').value,
            difficulty: document.getElementById('bountyDifficulty').value,
            description: document.getElementById('bountyDescription').value,
            coins: parseInt(document.getElementById('bountyCoins').value),
            points: parseInt(document.getElementById('bountyPoints').value),
            tags: document.getElementById('bountyTags').value.split(',').map(t => t.trim()).filter(Boolean),
            deadline: document.getElementById('bountyDeadline').value,
            requirements: Array.from(document.querySelectorAll('.requirement-item input')).map(i => i.value).filter(Boolean)
        };

        try {
            const result = await this.bountySystem.createBounty(data);
            showToast('悬赏发布成功！', 'success');
            this.cancel();
            return result;
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    /**
     * 添加要求输入框
     */
    addRequirement() {
        const list = document.getElementById('requirementsList');
        const item = document.createElement('div');
        item.className = 'requirement-item';
        item.innerHTML = `
            <input type="text" placeholder="添加一个具体要求">
            <button type="button" class="btn-remove-req" onclick="this.parentElement.remove()">×</button>
        `;
        list.appendChild(item);
    }

    /**
     * 取消/关闭
     */
    cancel() {
        const modal = document.querySelector('.bounty-modal-overlay');
        if (modal) modal.remove();
    }

    /**
     * 工具方法
     */
    getCategoryName(category) {
        const names = {
            article: '文章创作',
            design: '设计制作',
            code: '代码开发',
            translation: '翻译服务',
            other: '其他'
        };
        return names[category] || category;
    }

    getDifficultyName(difficulty) {
        const names = {
            easy: '简单',
            medium: '中等',
            hard: '困难',
            expert: '专家'
        };
        return names[difficulty] || difficulty;
    }

    getStatusName(status) {
        const names = {
            open: '进行中',
            completed: '已完成',
            cancelled: '已取消',
            expired: '已过期'
        };
        return names[status] || status;
    }

    formatDeadline(deadline) {
        if (!deadline) return '无限制';
        const diff = new Date(deadline) - new Date();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (days < 0) return '已过期';
        if (days === 0) return '今天截止';
        if (days <= 7) return `${days}天后截止`;
        return deadline;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 全局实例
window.ArticleBountySystem = ArticleBountySystem;
window.BountyUI = BountyUI;

// 初始化
let bountySystem, bountyUI;

document.addEventListener('DOMContentLoaded', () => {
    bountySystem = new ArticleBountySystem();
    bountyUI = new BountyUI(bountySystem);
    window.bountySystem = bountySystem;
    window.bountyUI = bountyUI;
});

// 显示提示
function showToast(message, type = 'info') {
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
