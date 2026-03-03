/**
 * 捐助系统前端逻辑
 * 支持虎皮椒在线支付 + 排行榜 + 进度条
 */

import { API_BASE_URL } from './api-config.js?v=20260223b';
import { escapeHtml } from './utils.js';

class DonateApp {
    constructor() {
        this.selectedAmount = 20;
        this.paymentMethod = 'wechat';
        this.polling = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadGoal();
        this.loadLeaderboard();
        this.loadRecent();
        this.checkReturnStatus();
    }

    bindEvents() {
        // 预设金额按钮
        document.querySelectorAll('.amount-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedAmount = parseFloat(btn.dataset.amount);
                document.getElementById('customAmount').value = '';
            });
        });

        // 自定义金额
        const customInput = document.getElementById('customAmount');
        if (customInput) {
            customInput.addEventListener('input', () => {
                if (customInput.value) {
                    document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
                    this.selectedAmount = parseFloat(customInput.value) || 0;
                }
            });
        }

        // 支付方式
        const btnWechat = document.getElementById('btnWechat');
        const btnAlipay = document.getElementById('btnAlipay');

        if (btnWechat) {
            btnWechat.addEventListener('click', () => {
                this.paymentMethod = 'wechat';
                btnWechat.className = 'payment-btn active-wechat';
                btnAlipay.className = 'payment-btn';
            });
        }

        if (btnAlipay) {
            btnAlipay.addEventListener('click', () => {
                this.paymentMethod = 'alipay';
                btnAlipay.className = 'payment-btn active-alipay';
                btnWechat.className = 'payment-btn';
            });
        }

        // 提交捐助
        const submitBtn = document.getElementById('submitDonate');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitDonate());
        }
    }

    /**
     * 检查从支付页面返回的状态
     */
    checkReturnStatus() {
        const params = new URLSearchParams(window.location.search);
        if (params.get('status') === 'success') {
            document.getElementById('thankModal').classList.add('show');
            // 清除 URL 参数
            window.history.replaceState({}, '', '/donate.html');
            // 刷新数据
            setTimeout(() => {
                this.loadGoal();
                this.loadLeaderboard();
                this.loadRecent();
            }, 1000);
        }
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
                return `
                    <li class="leaderboard-item">
                        <div class="lb-rank${rankClass}">${rankText}</div>
                        <div class="lb-info">
                            <div class="lb-name">${escapeHtml(item.donor_name)}</div>
                            <div class="lb-count">捐助 ${item.donate_count} 次</div>
                        </div>
                        <div class="lb-amount">¥${parseFloat(item.total_amount).toFixed(2)}</div>
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
                const methodIcon = item.payment_method === 'alipay' ? '💙' : '💚';
                return `
                    <div class="recent-item">
                        <div class="recent-top">
                            <span class="recent-name">${methodIcon} ${escapeHtml(item.donor_name)}</span>
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
     * 提交捐助
     */
    async submitDonate() {
        const btn = document.getElementById('submitDonate');
        const amount = this.selectedAmount;

        if (!amount || amount < 0.01) {
            alert('请选择或输入捐助金额');
            return;
        }

        if (amount > 5000) {
            alert('单次捐助金额不能超过 5000 元');
            return;
        }

        btn.disabled = true;
        btn.textContent = '⏳ 正在创建订单...';

        try {
            const donorName = document.getElementById('donorName').value.trim();
            const message = document.getElementById('donorMessage').value.trim();

            // 获取 token（如果已登录）
            const headers = { 'Content-Type': 'application/json' };
            const token = localStorage.getItem('auth_token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await fetch(`${API_BASE_URL}/donate/create`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    amount: amount,
                    donor_name: donorName || undefined,
                    message: message || undefined,
                    payment_method: this.paymentMethod
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || '创建订单失败');
            }

            // 使用虎皮椒支付 — 通过表单提交跳转到支付页面
            this.redirectToPayment(data.pay_url, data.params);

            // 开始轮询订单状态
            this.startPolling(data.order_no);

        } catch (e) {
            alert(e.message || '创建订单失败，请稍后重试');
            console.error('捐助失败:', e);
        } finally {
            btn.disabled = false;
            btn.textContent = '❤️ 立即捐助';
        }
    }

    /**
     * 跳转到虎皮椒支付页面
     */
    redirectToPayment(url, params) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = url;
        form.target = '_blank';

        Object.keys(params).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = params[key];
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    }

    /**
     * 轮询订单状态
     */
    startPolling(orderNo) {
        let attempts = 0;
        const maxAttempts = 60; // 最多轮询 5 分钟

        if (this.polling) clearInterval(this.polling);

        this.polling = setInterval(async () => {
            attempts++;
            if (attempts > maxAttempts) {
                clearInterval(this.polling);
                return;
            }

            try {
                const res = await fetch(`${API_BASE_URL}/donate/status/${orderNo}`);
                if (!res.ok) return;
                const data = await res.json();

                if (data.status === 'paid') {
                    clearInterval(this.polling);
                    document.getElementById('thankModal').classList.add('show');
                    this.loadGoal();
                    this.loadLeaderboard();
                    this.loadRecent();
                }
            } catch (e) {
                // 忽略轮询错误
            }
        }, 5000); // 每 5 秒查一次
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
