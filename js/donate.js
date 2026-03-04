/**
 * 捐助系统前端逻辑（简化版）
 * 静态收款码 + 排行榜 + 进度条
 * 
 * 用户扫码付款 → 站长后台确认 → 累计赞助金额 → 获得头衔
 */

import { API_BASE_URL } from './api-config.js?v=20260223b';
import { escapeHtml } from './utils.js';

class DonateApp {
    constructor() {
        this.init();
    }

    init() {
        this.loadGoal();
        this.loadLeaderboard();
        this.loadRecent();
    }

    /**
     * 加载捐助目标和进度
     */
    async loadGoal() {
        try {
            const res = await fetch(`${API_BASE_URL}/donate/goal`);
            if (!res.ok) throw new Error('加载失败');
            const data = await res.json();

            if (data.goal) {
                document.getElementById('goalTitle').textContent = data.goal.title;
                document.getElementById('goalDesc').textContent = data.goal.description || '';

                const current = parseFloat(data.goal.current_amount) || 0;
                const target = parseFloat(data.goal.target_amount) || 1;
                const percent = Math.min((current / target) * 100, 100);

                document.getElementById('goalCurrent').textContent = current.toFixed(2);
                document.getElementById('goalTarget').textContent = target.toFixed(2);
                document.getElementById('progressBar').style.width = percent.toFixed(1) + '%';
                document.getElementById('progressText').textContent = percent.toFixed(1) + '%';
            }

            if (data.stats) {
                document.getElementById('statDonors').textContent = data.stats.total_donors || 0;
                document.getElementById('statTotal').textContent = '¥' + (parseFloat(data.stats.total_amount) || 0).toFixed(2);
            }
        } catch (e) {
            console.error('加载捐助目标失败:', e);
        }
    }

    /**
     * 加载排行榜
     */
    async loadLeaderboard() {
        try {
            const res = await fetch(`${API_BASE_URL}/donate/leaderboard?limit=10`);
            if (!res.ok) throw new Error('加载失败');
            const list = await res.json();

            const container = document.getElementById('leaderboardList');
            if (!list || list.length === 0) {
                container.innerHTML = '<li class="empty-tip">暂无捐助记录，成为第一位支持者吧！</li>';
                return;
            }

            container.innerHTML = list.map((item, i) => {
                const rankClass = i < 3 ? ` top${i + 1}` : '';
                const rankText = i < 3 ? ['🥇', '🥈', '🥉'][i] : (i + 1);
                const amount = parseFloat(item.total_amount) || 0;

                // 计算头衔
                let titleHtml = '';
                if (amount >= 10) {
                    titleHtml = '<span class="lb-title mvp">MVP</span>';
                } else if (amount >= 5) {
                    titleHtml = '<span class="lb-title vip">VIP</span>';
                }

                return `
                    <li class="leaderboard-item">
                        <div class="lb-rank${rankClass}">${rankText}</div>
                        <div class="lb-info">
                            <div class="lb-name">${escapeHtml(item.donor_name)}${titleHtml}</div>
                        </div>
                        <div class="lb-amount">¥${amount.toFixed(2)}</div>
                    </li>
                `;
            }).join('');
        } catch (e) {
            console.error('加载排行榜失败:', e);
        }
    }

    /**
     * 加载最近捐助
     */
    async loadRecent() {
        try {
            const res = await fetch(`${API_BASE_URL}/donate/recent?limit=10`);
            if (!res.ok) throw new Error('加载失败');
            const list = await res.json();

            const container = document.getElementById('recentList');
            if (!list || list.length === 0) {
                container.innerHTML = '<div class="empty-tip">暂无捐助记录</div>';
                return;
            }

            container.innerHTML = list.map(item => {
                const time = this.formatTime(item.paid_at);
                return `
                    <div class="recent-item">
                        <div class="recent-top">
                            <span class="recent-name">💚 ${escapeHtml(item.donor_name)}</span>
                            <span class="recent-amount">¥${parseFloat(item.amount).toFixed(2)}</span>
                        </div>
                        ${item.message ? `<div class="recent-msg">"${escapeHtml(item.message)}"</div>` : ''}
                        <div class="recent-time">${time}</div>
                    </div>
                `;
            }).join('');
        } catch (e) {
            console.error('加载最近捐助失败:', e);
        }
    }

    /**
     * 格式化时间
     */
    formatTime(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now - d;

        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前';
        if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前';
        if (diff < 604800000) return Math.floor(diff / 86400000) + ' 天前';

        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
}

// 初始化
new DonateApp();
