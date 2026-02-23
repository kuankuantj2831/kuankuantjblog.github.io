/**
 * 硬币系统前端模块
 * 功能：余额查询、每日签到、交易记录
 */

import { API_BASE_URL } from './api-config.js?v=20260223b';

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

class CoinsApp {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.currentPage = 1;
        this.currentFilter = '';
        this.hasMore = true;
        this.isLoading = false;
    }

    init() {
        // 检查登录状态
        try {
            const userData = localStorage.getItem('user');
            const token = localStorage.getItem('token');
            if (userData && token) {
                this.currentUser = JSON.parse(userData);
                this.token = token;
            }
        } catch (e) {
            console.error('解析用户数据失败:', e);
        }

        if (!this.currentUser || !this.token) {
            document.getElementById('loginPrompt').style.display = 'block';
            document.getElementById('mainContent').style.display = 'none';
            return;
        }

        document.getElementById('mainContent').style.display = 'block';
        document.getElementById('loginPrompt').style.display = 'none';

        this.bindEvents();
        this.loadBalance();
        this.loadTransactions();
    }

    bindEvents() {
        // 筛选按钮
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.type || '';
                this.currentPage = 1;
                this.hasMore = true;
                this.loadTransactions(true);
            });
        });
    }

    /**
     * 获取带认证的请求头
     */
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }

    /**
     * 显示消息提示
     */
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    /**
     * 加载余额信息
     */
    async loadBalance() {
        try {
            let response;
            try {
                response = await fetch(`${API_BASE_URL}/coins/balance`, {
                    headers: this.getHeaders()
                });
            } catch (networkError) {
                console.error('网络错误:', networkError);
                return;
            }

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    this.showToast('登录已过期，请重新登录', 'error');
                    return;
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            // 更新余额显示
            document.getElementById('balanceAmount').textContent = data.balance || 0;
            document.getElementById('totalEarned').textContent = data.total_earned || 0;
            document.getElementById('totalSpent').textContent = data.total_spent || 0;
            document.getElementById('checkinStreak').textContent = `${data.checkin_streak || 0}天`;
            document.getElementById('streakDays').textContent = data.checkin_streak || 0;

            // 更新签到按钮状态
            const checkinBtn = document.getElementById('checkinBtn');
            if (data.checked_in_today) {
                checkinBtn.disabled = true;
                checkinBtn.classList.add('checked');
                checkinBtn.textContent = '✅ 今日已签到';
            }

            // 渲染签到日历
            this.renderCalendar(data.checkin_streak || 0, data.checked_in_today);

        } catch (error) {
            console.error('加载余额失败:', error);
        }
    }

    /**
     * 渲染签到日历（最近7天）
     */
    renderCalendar(streak, checkedToday) {
        const calendar = document.getElementById('checkinCalendar');
        if (!calendar) return;

        const days = ['日', '一', '二', '三', '四', '五', '六'];
        const today = new Date();
        let html = '';

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dayName = days[date.getDay()];
            const isToday = i === 0;

            // 判断这天是否已签到
            let isChecked = false;
            if (isToday && checkedToday) {
                isChecked = true;
            } else if (!isToday) {
                // 根据连续签到天数推算
                const daysAgo = i;
                const effectiveStreak = checkedToday ? streak : streak;
                if (daysAgo < effectiveStreak) {
                    isChecked = true;
                }
            }

            const classes = ['calendar-day'];
            if (isChecked) classes.push('checked');
            if (isToday) classes.push('today');

            html += `<div class="${classes.join(' ')}">${dayName}</div>`;
        }

        calendar.innerHTML = html;
    }

    /**
     * 每日签到
     */
    async checkin() {
        const checkinBtn = document.getElementById('checkinBtn');
        if (!checkinBtn || checkinBtn.disabled) return;

        checkinBtn.disabled = true;
        checkinBtn.textContent = '签到中...';

        try {
            let response;
            try {
                response = await fetch(`${API_BASE_URL}/coins/checkin`, {
                    method: 'POST',
                    headers: this.getHeaders()
                });
            } catch (networkError) {
                throw new Error('网络连接失败');
            }

            const data = await response.json();

            if (!response.ok) {
                if (data.already_checked_in) {
                    checkinBtn.classList.add('checked');
                    checkinBtn.textContent = '✅ 今日已签到';
                    return;
                }
                throw new Error(data.message || '签到失败');
            }

            // 签到成功
            checkinBtn.classList.add('checked');
            checkinBtn.textContent = '✅ 今日已签到';

            // 显示奖励弹窗
            const rewardPopup = document.getElementById('rewardPopup');
            const rewardAmount = document.getElementById('rewardAmount');
            if (rewardPopup && rewardAmount) {
                rewardAmount.textContent = data.reward;
                rewardPopup.style.display = 'block';
            }

            // 更新余额
            document.getElementById('balanceAmount').textContent = data.balance;
            document.getElementById('streakDays').textContent = data.streak;
            document.getElementById('checkinStreak').textContent = `${data.streak}天`;

            // 更新日历
            this.renderCalendar(data.streak, true);

            // 刷新交易记录
            this.currentPage = 1;
            this.loadTransactions(true);

            this.showToast(`签到成功！+${data.reward} 硬币 🪙`);

        } catch (error) {
            console.error('签到失败:', error);
            checkinBtn.disabled = false;
            checkinBtn.textContent = '✨ 立即签到';
            this.showToast(error.message || '签到失败', 'error');
        }
    }

    /**
     * 加载交易记录
     */
    async loadTransactions(reset = false) {
        if (this.isLoading) return;
        this.isLoading = true;

        if (reset) {
            this.currentPage = 1;
            this.hasMore = true;
        }

        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: 15
            });
            if (this.currentFilter) {
                params.set('type', this.currentFilter);
            }

            let response;
            try {
                response = await fetch(`${API_BASE_URL}/coins/transactions?${params}`, {
                    headers: this.getHeaders()
                });
            } catch (networkError) {
                throw new Error('网络连接失败');
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            const transactions = result.data || [];
            const pagination = result.pagination || {};

            const list = document.getElementById('transactionList');
            const loadMoreBtn = document.getElementById('loadMoreBtn');

            if (reset || this.currentPage === 1) {
                list.innerHTML = '';
            }

            if (transactions.length === 0 && this.currentPage === 1) {
                list.innerHTML = `
                    <li class="transaction-empty">
                        <div class="empty-icon">📭</div>
                        <div>暂无交易记录</div>
                    </li>`;
                if (loadMoreBtn) loadMoreBtn.style.display = 'none';
                return;
            }

            transactions.forEach(tx => {
                const li = document.createElement('li');
                li.className = 'transaction-item';

                const isPositive = tx.amount > 0;
                const iconClass = isPositive ? 'earn' : 'spend';
                const amountClass = isPositive ? 'positive' : 'negative';
                const amountText = isPositive ? `+${tx.amount}` : `${tx.amount}`;
                const icon = this.getTypeIcon(tx.type);
                const timeStr = this.formatTime(tx.created_at);
                const desc = escapeHtml(tx.description || this.getTypeLabel(tx.type));

                li.innerHTML = `
                    <div class="transaction-left">
                        <div class="transaction-icon ${iconClass}">${icon}</div>
                        <div>
                            <div class="transaction-desc">${desc}</div>
                            <div class="transaction-time">${timeStr}</div>
                        </div>
                    </div>
                    <div class="transaction-amount ${amountClass}">${amountText} 🪙</div>
                `;
                list.appendChild(li);
            });

            // 分页
            this.hasMore = pagination.page < pagination.totalPages;
            if (loadMoreBtn) {
                loadMoreBtn.style.display = this.hasMore ? 'block' : 'none';
            }

        } catch (error) {
            console.error('加载交易记录失败:', error);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 加载更多
     */
    loadMore() {
        if (!this.hasMore || this.isLoading) return;
        this.currentPage++;
        this.loadTransactions(false);
    }

    /**
     * 获取交易类型图标
     */
    getTypeIcon(type) {
        const icons = {
            checkin: '📅',
            publish: '📝',
            liked: '❤️',
            comment: '💬',
            donate: '🎁',
            receive: '🪙',
            admin: '⚙️'
        };
        return icons[type] || '💰';
    }

    /**
     * 获取交易类型标签
     */
    getTypeLabel(type) {
        const labels = {
            checkin: '每日签到',
            publish: '发布文章',
            liked: '文章被点赞',
            comment: '评论文章',
            donate: '投币',
            receive: '收到硬币',
            admin: '管理员操作'
        };
        return labels[type] || '其他';
    }

    /**
     * 格式化时间
     */
    formatTime(dateStr) {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diff = now - date;

            // 1分钟内
            if (diff < 60000) return '刚刚';
            // 1小时内
            if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
            // 24小时内
            if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
            // 7天内
            if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;

            // 超过7天显示日期
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${month}-${day} ${hours}:${minutes}`;
        } catch (e) {
            return dateStr;
        }
    }
}

// 初始化
const coinsApp = new CoinsApp();
window.coinsApp = coinsApp;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => coinsApp.init());
} else {
    coinsApp.init();
}

export default coinsApp;
