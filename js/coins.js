/**
 * 硬币系统前端模块 v2
 * 功能：签到、日历、排行榜、交易记录
 */

import { API_BASE_URL } from './api-config.js?v=20260223b';
import { escapeHtml, formatTime } from './utils.js';

// 头像颜色池
const AVATAR_COLORS = [
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
    'linear-gradient(135deg, #43e97b, #38f9d7)',
    'linear-gradient(135deg, #fa709a, #fee140)',
    'linear-gradient(135deg, #a18cd1, #fbc2eb)',
    'linear-gradient(135deg, #fccb90, #d57eeb)',
    'linear-gradient(135deg, #e0c3fc, #8ec5fc)',
    'linear-gradient(135deg, #f5af19, #f12711)',
    'linear-gradient(135deg, #667eea, #43e97b)',
];

class CoinsApp {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.currentPage = 1;
        this.currentFilter = '';
        this.hasMore = true;
        this.isLoading = false;
        this.calendarYear = new Date().getFullYear();
        this.calendarMonth = new Date().getMonth() + 1;
    }

    init() {
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

        this.updateDateDisplay();
        this.bindEvents();
        this.loadBalance();
        this.loadCalendar();
        this.loadLeaderboard();
        this.loadTransactions();
    }

    /**
     * 更新日期显示
     */
    updateDateDisplay() {
        const now = new Date();
        const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const weekday = weekdays[now.getDay()];
        const isWeekend = (now.getDay() === 0 || now.getDay() === 6);

        document.getElementById('dateStr').textContent = `${month}月${day}日${weekday}`;
        document.getElementById('dateType').textContent = isWeekend ? '周末签到' : '工作日签到';
        document.getElementById('dateIcon').textContent = isWeekend ? '🌙' : '☀️';
    }

    bindEvents() {
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

    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        setTimeout(() => { toast.classList.remove('show'); }, 3000);
    }

    /**
     * 加载余额和签到信息
     */
    async loadBalance() {
        try {
            const response = await fetch(`${API_BASE_URL}/coins/balance`, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    this.showToast('登录已过期，请重新登录', 'error');
                    return;
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            // 更新今日奖励
            const todayReward = data.today_reward || 0.5;
            document.getElementById('todayReward').textContent = `+${todayReward}`;

            // 更新统计
            document.getElementById('statStreak').textContent = data.checkin_streak || 0;
            document.getElementById('statMonthDays').textContent = data.month_checkin_days || 0;
            document.getElementById('statTotalDays').textContent = data.total_checkin_days || 0;
            document.getElementById('statTotalEarned').textContent = data.total_earned || 0;

            // 更新签到状态
            const checkinBtn = document.getElementById('checkinBtn');
            const statusText = document.getElementById('statusText');
            const statusSub = document.getElementById('statusSub');

            if (data.checked_in_today) {
                checkinBtn.disabled = true;
                checkinBtn.classList.add('checked');
                checkinBtn.innerHTML = '✅ 已签到';
                statusText.textContent = '已完成签到';
                statusSub.textContent = `今日已获得 ${todayReward} 硬币`;
            } else {
                statusText.textContent = '未签到';
                statusSub.textContent = '点击右侧按钮签到';
            }

        } catch (error) {
            console.error('加载余额失败:', error);
        }
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
            const response = await fetch(`${API_BASE_URL}/coins/checkin`, {
                method: 'POST',
                headers: this.getHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.already_checked_in) {
                    checkinBtn.classList.add('checked');
                    checkinBtn.innerHTML = '✅ 已签到';
                    return;
                }
                throw new Error(data.message || '签到失败');
            }

            // 签到成功
            checkinBtn.classList.add('checked');
            checkinBtn.innerHTML = '✅ 已签到';

            document.getElementById('statusText').textContent = '已完成签到';
            document.getElementById('statusSub').textContent = `今日已获得 ${data.reward} 硬币`;

            // 显示奖励弹窗
            const rewardPopup = document.getElementById('rewardPopup');
            const rewardAmount = document.getElementById('rewardAmount');
            if (rewardPopup && rewardAmount) {
                rewardAmount.textContent = data.reward;
                rewardPopup.style.display = 'block';
            }

            // 更新统计
            document.getElementById('statStreak').textContent = data.streak;

            // 刷新数据
            this.loadBalance();
            this.loadCalendar();
            this.loadLeaderboard();
            this.currentPage = 1;
            this.loadTransactions(true);

            this.showToast(`签到成功！+${data.reward} 硬币 ⭐`);

        } catch (error) {
            console.error('签到失败:', error);
            checkinBtn.disabled = false;
            checkinBtn.textContent = '✨ 立即签到';
            this.showToast(error.message || '签到失败', 'error');
        }
    }

    /**
     * 加载签到日历
     */
    async loadCalendar() {
        try {
            const response = await fetch(
                `${API_BASE_URL}/coins/calendar?year=${this.calendarYear}&month=${this.calendarMonth}`,
                { headers: this.getHeaders() }
            );

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            this.renderCalendar(data);

        } catch (error) {
            console.error('加载日历失败:', error);
            // 降级：用空数据渲染
            this.renderCalendar({
                year: this.calendarYear,
                month: this.calendarMonth,
                days_in_month: new Date(this.calendarYear, this.calendarMonth, 0).getDate(),
                checkin_dates: {},
                checkin_rate: 0
            });
        }
    }

    /**
     * 渲染完整月历
     */
    renderCalendar(data) {
        const grid = document.getElementById('calendarGrid');
        if (!grid) return;

        const { year, month, days_in_month, checkin_dates, checkin_rate } = data;

        // 更新标题
        document.getElementById('monthLabel').textContent = `${year}年${month}月`;
        document.getElementById('calendarRate').textContent = checkin_rate || 0;

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const isCurrentMonth = (year === today.getFullYear() && month === today.getMonth() + 1);

        // 该月第一天是星期几
        const firstDay = new Date(year, month - 1, 1).getDay();

        let html = '';

        // 填充前面的空白
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="calendar-day empty"></div>';
        }

        // 填充每一天
        for (let day = 1; day <= days_in_month; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayOfWeek = new Date(year, month - 1, day).getDay();
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
            const isToday = dateStr === todayStr;
            const isFuture = new Date(year, month - 1, day) > today;
            const isChecked = checkin_dates && checkin_dates[dateStr] !== undefined;

            let classes = ['calendar-day'];
            if (isToday) classes.push('today');
            if (isFuture) {
                classes.push('future');
            } else if (isChecked) {
                classes.push('checked');
            } else {
                classes.push('not-checked');
            }

            let bonusHtml = '';
            if (isWeekend && !isFuture) {
                bonusHtml = '<div class="day-bonus">x2</div>';
            }

            let checkHtml = '';
            if (isChecked && isToday) {
                checkHtml = '<span class="day-check">✓</span>';
            }

            html += `<div class="${classes.join(' ')}">${day}${bonusHtml}${checkHtml}</div>`;
        }

        grid.innerHTML = html;
    }

    /**
     * 切换月份
     */
    changeMonth(delta) {
        this.calendarMonth += delta;
        if (this.calendarMonth > 12) {
            this.calendarMonth = 1;
            this.calendarYear++;
        } else if (this.calendarMonth < 1) {
            this.calendarMonth = 12;
            this.calendarYear--;
        }
        this.loadCalendar();
    }

    /**
     * 加载排行榜
     */
    async loadLeaderboard() {
        try {
            const response = await fetch(`${API_BASE_URL}/coins/leaderboard`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            this.renderLeaderboard(data.leaderboard || []);

        } catch (error) {
            console.error('加载排行榜失败:', error);
            document.getElementById('leaderboardList').innerHTML = `
                <li class="transaction-empty">
                    <div class="empty-icon">🏆</div>
                    <div>暂无排行数据</div>
                </li>`;
        }
    }

    /**
     * 渲染排行榜
     */
    renderLeaderboard(list) {
        const container = document.getElementById('leaderboardList');
        if (!container) return;

        if (list.length === 0) {
            container.innerHTML = `
                <li class="transaction-empty">
                    <div class="empty-icon">🏆</div>
                    <div>暂无排行数据</div>
                </li>`;
            return;
        }

        let html = '';
        list.forEach((item, index) => {
            const rank = index + 1;
            let rankClass = '';
            let rankContent = '';

            if (rank === 1) {
                rankClass = 'gold';
                rankContent = '<span class="trophy">🥇</span>';
            } else if (rank === 2) {
                rankClass = 'silver';
                rankContent = '<span class="trophy">🥈</span>';
            } else if (rank === 3) {
                rankClass = 'bronze';
                rankContent = '<span class="trophy">🥉</span>';
            } else {
                rankContent = rank;
            }

            const username = escapeHtml(item.username);
            const firstChar = username.charAt(0).toUpperCase();
            const colorIndex = username.charCodeAt(0) % AVATAR_COLORS.length;
            const avatarColor = AVATAR_COLORS[colorIndex];

            html += `
                <li class="leaderboard-item">
                    <div class="lb-rank ${rankClass}">${rankContent}</div>
                    <div class="lb-avatar" style="background: ${avatarColor}">${firstChar}</div>
                    <div class="lb-info">
                        <div class="lb-username">${username}</div>
                        <div class="lb-total">累计 ${item.total_earned} 分</div>
                    </div>
                    <div class="lb-balance">
                        <div class="lb-balance-value">${item.balance}</div>
                        <div class="lb-balance-label">可用</div>
                    </div>
                </li>`;
        });

        container.innerHTML = html;
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

            const response = await fetch(`${API_BASE_URL}/coins/transactions?${params}`, {
                headers: this.getHeaders()
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

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
                const timeStr = formatTime(tx.created_at);
                const desc = escapeHtml(tx.description || this.getTypeLabel(tx.type));

                li.innerHTML = `
                    <div class="transaction-left">
                        <div class="transaction-icon ${iconClass}">${icon}</div>
                        <div>
                            <div class="transaction-desc">${desc}</div>
                            <div class="transaction-time">${timeStr}</div>
                        </div>
                    </div>
                    <div class="transaction-amount ${amountClass}">${amountText} ⭐</div>
                `;
                list.appendChild(li);
            });

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

    loadMore() {
        if (!this.hasMore || this.isLoading) return;
        this.currentPage++;
        this.loadTransactions(false);
    }

    getTypeIcon(type) {
        const icons = {
            checkin: '📅', publish: '📝', liked: '❤️',
            comment: '💬', donate: '🎁', receive: '⭐', admin: '⚙️'
        };
        return icons[type] || '💰';
    }

    getTypeLabel(type) {
        const labels = {
            checkin: '每日签到', publish: '发布文章', liked: '文章被点赞',
            comment: '评论文章', donate: '投币', receive: '收到硬币', admin: '管理员操作'
        };
        return labels[type] || '其他';
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
