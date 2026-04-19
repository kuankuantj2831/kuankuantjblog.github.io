/**
 * 管理后台仪表板前端模块
 * 数据可视化、内容审核、用户分析、系统日志
 */

import { API_BASE_URL } from './api-config.js?v=20260419b';
import { escapeHtml } from './utils.js';

class AdminDashboard {
    constructor() {
        this.overviewData = null;
        this.moderationQueue = [];
        this.charts = {};
        this.token = localStorage.getItem('token');
        this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    }

    async init() {
        // 检查管理员权限
        if (!await this.checkAdminAccess()) {
            this.showAccessDenied();
            return;
        }

        this.loadOverview();
        this.initCharts();
        this.loadModerationQueue();
        this.bindEvents();
    }

    async checkAdminAccess() {
        if (!this.token || !this.currentUser) return false;
        return this.currentUser.role === 'admin' || this.currentUser.is_admin;
    }

    showAccessDenied() {
        document.body.innerHTML = `
            <div class="access-denied">
                <h1>⛔ 访问被拒绝</h1>
                <p>您没有权限访问管理后台</p>
                <a href="/">返回首页</a>
            </div>
        `;
    }

    // ========== 数据概览 ==========
    async loadOverview() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin-dashboard/overview`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!response.ok) throw new Error('加载概览数据失败');
            this.overviewData = await response.json();
            this.renderOverview();
        } catch (error) {
            console.error('加载概览数据失败:', error);
        }
    }

    renderOverview() {
        const container = document.getElementById('overviewCards');
        if (!container || !this.overviewData) return;

        const { stats, trends } = this.overviewData;

        container.innerHTML = `
            <div class="overview-grid">
                <div class="stat-card users">
                    <div class="stat-icon">👥</div>
                    <div class="stat-info">
                        <h3>${this.formatNumber(stats.total_users)}</h3>
                        <p>总用户</p>
                        <span class="trend ${trends.users >= 0 ? 'up' : 'down'}">
                            ${trends.users >= 0 ? '↑' : '↓'} ${Math.abs(trends.users)}%
                        </span>
                    </div>
                </div>
                <div class="stat-card articles">
                    <div class="stat-icon">📝</div>
                    <div class="stat-info">
                        <h3>${this.formatNumber(stats.total_articles)}</h3>
                        <p>总文章</p>
                        <span class="trend ${trends.articles >= 0 ? 'up' : 'down'}">
                            ${trends.articles >= 0 ? '↑' : '↓'} ${Math.abs(trends.articles)}%
                        </span>
                    </div>
                </div>
                <div class="stat-card comments">
                    <div class="stat-icon">💬</div>
                    <div class="stat-info">
                        <h3>${this.formatNumber(stats.total_comments)}</h3>
                        <p>总评论</p>
                        <span class="trend ${trends.comments >= 0 ? 'up' : 'down'}">
                            ${trends.comments >= 0 ? '↑' : '↓'} ${Math.abs(trends.comments)}%
                        </span>
                    </div>
                </div>
                <div class="stat-card today">
                    <div class="stat-icon">📊</div>
                    <div class="stat-info">
                        <h3>${this.formatNumber(stats.new_users_today)}</h3>
                        <p>今日新增</p>
                        <span class="sub">${stats.new_articles_today} 篇文章</span>
                    </div>
                </div>
            </div>
            <div class="online-stats">
                <span class="online-indicator"></span>
                当前在线: ${stats.online_users} 人
            </div>
        `;
    }

    // ========== 图表初始化 ==========
    initCharts() {
        this.loadUserGrowthChart();
        this.loadActivityTrendChart();
        this.loadContentDistributionChart();
    }

    async loadUserGrowthChart() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin-dashboard/user-growth`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!response.ok) throw new Error('加载用户增长数据失败');
            const data = await response.json();
            this.renderLineChart('userGrowthChart', data.labels, data.values, '用户增长趋势');
        } catch (error) {
            console.error('加载用户增长数据失败:', error);
        }
    }

    async loadActivityTrendChart() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin-dashboard/activity-trend`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!response.ok) throw new Error('加载活动趋势失败');
            const data = await response.json();
            this.renderMultiLineChart('activityTrendChart', data);
        } catch (error) {
            console.error('加载活动趋势失败:', error);
        }
    }

    async loadContentDistributionChart() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin-dashboard/analytics/content-distribution`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!response.ok) throw new Error('加载内容分布失败');
            const data = await response.json();
            this.renderPieChart('contentDistributionChart', data.categories);
        } catch (error) {
            console.error('加载内容分布失败:', error);
        }
    }

    // ========== 内容审核 ==========
    async loadModerationQueue(type = 'all') {
        try {
            const response = await fetch(`${API_BASE_URL}/admin-dashboard/moderation/queue?type=${type}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!response.ok) throw new Error('加载审核队列失败');
            const data = await response.json();
            this.moderationQueue = data.items || [];
            this.renderModerationQueue();
        } catch (error) {
            console.error('加载审核队列失败:', error);
        }
    }

    renderModerationQueue() {
        const container = document.getElementById('moderationQueue');
        if (!container) return;

        if (this.moderationQueue.length === 0) {
            container.innerHTML = '<p class="empty-state">🎉 审核队列已清空</p>';
            return;
        }

        container.innerHTML = `
            <div class="moderation-list">
                ${this.moderationQueue.map(item => `
                    <div class="moderation-item ${item.ai_flagged ? 'ai-flagged' : ''}">
                        <div class="item-type">${this.getTypeIcon(item.content_type)}</div>
                        <div class="item-content">
                            <h4>${escapeHtml(item.title || '无标题')}</h4>
                            <p>${escapeHtml(item.content_preview || '').substring(0, 100)}...</p>
                            <div class="item-meta">
                                <span>作者: ${escapeHtml(item.author_name)}</span>
                                <span>举报: ${item.report_count} 次</span>
                                <span>${this.formatTimeAgo(item.created_at)}</span>
                            </div>
                            ${item.ai_flagged ? `
                                <div class="ai-reason">
                                    🤖 AI标记: ${escapeHtml(item.ai_reason || '')}
                                </div>
                            ` : ''}
                        </div>
                        <div class="item-actions">
                            <button class="btn-approve" data-id="${item.id}" data-type="${item.content_type}">
                                ✓ 通过
                            </button>
                            <button class="btn-reject" data-id="${item.id}" data-type="${item.content_type}">
                                ✗ 拒绝
                            </button>
                            <button class="btn-detail" data-id="${item.id}" data-type="${item.content_type}">
                                详情
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // 绑定按钮事件
        container.querySelectorAll('.btn-approve').forEach(btn => {
            btn.addEventListener('click', () => this.moderateItem(btn.dataset.id, btn.dataset.type, 'approved'));
        });
        container.querySelectorAll('.btn-reject').forEach(btn => {
            btn.addEventListener('click', () => this.moderateItem(btn.dataset.id, btn.dataset.type, 'rejected'));
        });
        container.querySelectorAll('.btn-detail').forEach(btn => {
            btn.addEventListener('click', () => this.showItemDetail(btn.dataset.id, btn.dataset.type));
        });
    }

    async moderateItem(itemId, contentType, action) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin-dashboard/moderation/review`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content_id: itemId,
                    content_type: contentType,
                    action: action,
                    reason: action === 'rejected' ? '违反社区规范' : ''
                })
            });

            if (!response.ok) throw new Error('审核操作失败');
            
            this.showToast(action === 'approved' ? '已通过' : '已拒绝', 'success');
            this.loadModerationQueue();
        } catch (error) {
            console.error('审核失败:', error);
            this.showToast('操作失败', 'error');
        }
    }

    // ========== 用户分析 ==========
    async loadUserAnalytics() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin-dashboard/analytics/user-activity`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!response.ok) throw new Error('加载用户分析失败');
            const data = await response.json();
            this.renderUserAnalytics(data);
        } catch (error) {
            console.error('加载用户分析失败:', error);
        }
    }

    renderUserAnalytics(data) {
        const container = document.getElementById('userAnalytics');
        if (!container) return;

        container.innerHTML = `
            <div class="analytics-grid">
                <div class="analytics-card">
                    <h4>用户活跃度分布</h4>
                    <div class="activity-bars">
                        <div class="bar-item">
                            <span class="label">高活跃</span>
                            <div class="bar" style="width: ${data.high_active_percent}%"></div>
                            <span class="value">${data.high_active_percent}%</span>
                        </div>
                        <div class="bar-item">
                            <span class="label">中活跃</span>
                            <div class="bar" style="width: ${data.medium_active_percent}%"></div>
                            <span class="value">${data.medium_active_percent}%</span>
                        </div>
                        <div class="bar-item">
                            <span class="label">低活跃</span>
                            <div class="bar" style="width: ${data.low_active_percent}%"></div>
                            <span class="value">${data.low_active_percent}%</span>
                        </div>
                        <div class="bar-item">
                            <span class="label">沉睡</span>
                            <div class="bar" style="width: ${data.inactive_percent}%"></div>
                            <span class="value">${data.inactive_percent}%</span>
                        </div>
                    </div>
                </div>
                <div class="analytics-card">
                    <h4>TOP 10 活跃用户</h4>
                    <ul class="top-users">
                        ${(data.top_users || []).map((user, i) => `
                            <li>
                                <span class="rank">${i + 1}</span>
                                <img src="${user.avatar || '/images/default-avatar.png'}" alt="" class="avatar">
                                <span class="name">${escapeHtml(user.username)}</span>
                                <span class="score">${user.activity_score}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    // ========== 系统日志 ==========
    async loadSystemLogs(type = 'all', limit = 50) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin-dashboard/logs?type=${type}&limit=${limit}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!response.ok) throw new Error('加载日志失败');
            const data = await response.json();
            this.renderSystemLogs(data.logs);
        } catch (error) {
            console.error('加载日志失败:', error);
        }
    }

    renderSystemLogs(logs) {
        const container = document.getElementById('systemLogs');
        if (!container) return;

        container.innerHTML = `
            <div class="logs-container">
                <table class="logs-table">
                    <thead>
                        <tr>
                            <th>时间</th>
                            <th>级别</th>
                            <th>类型</th>
                            <th>消息</th>
                            <th>用户</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logs.map(log => `
                            <tr class="log-${log.level}">
                                <td>${new Date(log.created_at).toLocaleString('zh-CN')}</td>
                                <td><span class="level-badge ${log.level}">${log.level}</span></td>
                                <td>${log.log_type}</td>
                                <td>${escapeHtml(log.message)}</td>
                                <td>${log.user_id || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // ========== 图表渲染（简化版） ==========
    renderLineChart(containerId, labels, values, title) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const max = Math.max(...values);
        const points = values.map((v, i) => {
            const x = (i / (values.length - 1)) * 100;
            const y = 100 - (v / max) * 100;
            return `${x},${y}`;
        }).join(' ');

        container.innerHTML = `
            <div class="chart-title">${title}</div>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="line-chart">
                <polyline fill="none" stroke="#667eea" stroke-width="0.5" points="${points}"/>
                ${values.map((v, i) => {
                    const x = (i / (values.length - 1)) * 100;
                    const y = 100 - (v / max) * 100;
                    return `<circle cx="${x}" cy="${y}" r="1" fill="#667eea"/>`;
                }).join('')}
            </svg>
            <div class="chart-labels">
                ${labels.map(l => `<span>${l}</span>`).join('')}
            </div>
        `;
    }

    renderMultiLineChart(containerId, data) {
        // 简化的多线图实现
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '<div class="chart-placeholder">活动趋势图表</div>';
    }

    renderPieChart(containerId, categories) {
        const container = document.getElementById(containerId);
        if (!container || !categories) return;

        const total = categories.reduce((sum, c) => sum + c.count, 0);
        let currentAngle = 0;
        const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'];

        const slices = categories.map((cat, i) => {
            const angle = (cat.count / total) * 360;
            const startAngle = currentAngle;
            currentAngle += angle;
            
            return `
                <div class="pie-slice" style="
                    --start-angle: ${startAngle}deg;
                    --end-angle: ${currentAngle}deg;
                    --color: ${colors[i % colors.length]}
                " title="${cat.name}: ${cat.count}"></div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="pie-chart">${slices}</div>
            <div class="pie-legend">
                ${categories.map((cat, i) => `
                    <div class="legend-item">
                        <span class="color" style="background: ${colors[i % colors.length]}"></span>
                        <span>${cat.name}: ${cat.count}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // ========== 辅助方法 ==========
    getTypeIcon(type) {
        const icons = {
            article: '📝',
            comment: '💬',
            user: '👤',
            default: '📄'
        };
        return icons[type] || icons.default;
    }

    formatNumber(num) {
        if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num;
    }

    formatTimeAgo(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return '刚刚';
        if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
        return date.toLocaleDateString('zh-CN');
    }

    bindEvents() {
        // Tab切换
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
                
                tab.classList.add('active');
                const panelId = tab.dataset.panel;
                document.getElementById(panelId)?.classList.add('active');

                // 加载对应面板数据
                if (panelId === 'analyticsPanel') this.loadUserAnalytics();
                if (panelId === 'logsPanel') this.loadSystemLogs();
            });
        });

        // 刷新按钮
        document.querySelectorAll('.btn-refresh').forEach(btn => {
            btn.addEventListener('click', () => this.loadOverview());
        });
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `admin-toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ========== 全局初始化 ==========
    static init() {
        window.adminDashboard = new AdminDashboard();
        window.adminDashboard.init();
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('adminDashboard')) {
        AdminDashboard.init();
    }
});

export default AdminDashboard;
