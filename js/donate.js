/**
 * 捐助系统前端逻辑
 * 二维码收款 + 管理员确认 + 排行榜 + 进度条
 * 
 * 流程：选择金额 → 展示收款码 → 扫码支付 → 点击"我已支付" → 轮询等待确认 → 自动弹出感谢页
 */

import { API_BASE_URL } from './api-config.js?v=20260223b';
import { escapeHtml } from './utils.js';

class DonateApp {
    constructor() {
        this.selectedAmount = 20;
        this.paymentMethod = 'wechat';
        this.polling = null;
        this.currentOrderNo = null;
        this.qrUrls = { wechat_qr: '', alipay_qr: '' };
        this.init();
    }

    init() {
        this.loadQRCodes();
        this.bindEvents();
        this.loadGoal();
        this.loadLeaderboard();
        this.loadRecent();
    }

    async loadQRCodes() {
        try {
            const res = await fetch(`${API_BASE_URL}/donate/qrcode`);
            if (res.ok) {
                this.qrUrls = await res.json();
            }
        } catch (e) {
            console.error('加载收款码失败:', e);
        }
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
                if (btnAlipay) btnAlipay.className = 'payment-btn';
                this.updateQRPreview();
            });
        }

        if (btnAlipay) {
            btnAlipay.addEventListener('click', () => {
                this.paymentMethod = 'alipay';
                if (btnAlipay) btnAlipay.className = 'payment-btn active-alipay';
                if (btnWechat) btnWechat.className = 'payment-btn';
                this.updateQRPreview();
            });
        }

        // 提交捐助（显示二维码弹窗）
        const submitBtn = document.getElementById('submitDonate');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitDonate());
        }

        // "我已支付"按钮
        const confirmPaidBtn = document.getElementById('confirmPaidBtn');
        if (confirmPaidBtn) {
            confirmPaidBtn.addEventListener('click', () => this.confirmPaid());
        }

        // 关闭二维码弹窗
        const closeQrBtn = document.getElementById('closeQrModal');
        if (closeQrBtn) {
            closeQrBtn.addEventListener('click', () => this.closeQRModal());
        }

        // 关闭感谢弹窗
        const closeThankBtn = document.getElementById('closeThankModal');
        if (closeThankBtn) {
            closeThankBtn.addEventListener('click', () => {
                document.getElementById('thankModal').classList.remove('show');
            });
        }
    }

    /**
     * 更新二维码弹窗中的预览
     */
    updateQRPreview() {
        const qrImg = document.getElementById('qrCodeImage');
        const methodLabel = document.getElementById('qrMethodLabel');
        if (!qrImg) return;

        const url = this.paymentMethod === 'alipay' ? this.qrUrls.alipay_qr : this.qrUrls.wechat_qr;
        if (url) {
            qrImg.src = url;
            qrImg.style.display = 'block';
            document.getElementById('qrPlaceholder')?.style && (document.getElementById('qrPlaceholder').style.display = 'none');
        }
        if (methodLabel) {
            methodLabel.textContent = this.paymentMethod === 'alipay' ? '支付宝' : '微信';
            methodLabel.className = 'qr-method-label ' + (this.paymentMethod === 'alipay' ? 'alipay' : 'wechat');
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
     * 提交捐助 → 创建订单 → 弹出二维码
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

            // 保存当前订单号
            this.currentOrderNo = data.order_no;

            // 显示二维码弹窗
            this.showQRModal(data);

        } catch (e) {
            alert(e.message || '创建订单失败，请稍后重试');
            console.error('捐助失败:', e);
        } finally {
            btn.disabled = false;
            btn.textContent = '❤️ 立即捐助';
        }
    }

    /**
     * 显示二维码支付弹窗
     */
    showQRModal(data) {
        const modal = document.getElementById('qrModal');
        const qrImg = document.getElementById('qrCodeImage');
        const amountLabel = document.getElementById('qrAmountLabel');
        const orderLabel = document.getElementById('qrOrderNo');
        const methodLabel = document.getElementById('qrMethodLabel');
        const statusEl = document.getElementById('qrPayStatus');
        const confirmBtn = document.getElementById('confirmPaidBtn');

        // 设置二维码图片
        if (qrImg && data.qr_url) {
            qrImg.src = data.qr_url;
            qrImg.style.display = 'block';
            const placeholder = document.getElementById('qrPlaceholder');
            if (placeholder) placeholder.style.display = 'none';
        }

        // 设置金额和订单号
        if (amountLabel) amountLabel.textContent = '¥' + data.amount;
        if (orderLabel) orderLabel.textContent = data.order_no;
        if (methodLabel) {
            methodLabel.textContent = this.paymentMethod === 'alipay' ? '支付宝' : '微信';
            methodLabel.className = 'qr-method-label ' + (this.paymentMethod === 'alipay' ? 'alipay' : 'wechat');
        }

        // 重置状态
        if (statusEl) {
            statusEl.textContent = '';
            statusEl.className = 'qr-pay-status';
        }
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = '✅ 我已支付完成';
        }

        // 显示弹窗
        modal.classList.add('show');
    }

    /**
     * 关闭二维码弹窗
     */
    closeQRModal() {
        const modal = document.getElementById('qrModal');
        modal.classList.remove('show');
        // 停止轮询
        if (this.polling) {
            clearInterval(this.polling);
            this.polling = null;
        }
        this.currentOrderNo = null;
    }

    /**
     * 用户点击"我已支付"
     */
    async confirmPaid() {
        if (!this.currentOrderNo) return;

        const confirmBtn = document.getElementById('confirmPaidBtn');
        const statusEl = document.getElementById('qrPayStatus');

        confirmBtn.disabled = true;
        confirmBtn.textContent = '⏳ 提交中...';

        try {
            const res = await fetch(`${API_BASE_URL}/donate/confirm-paid`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_no: this.currentOrderNo })
            });

            const data = await res.json();

            if (data.status === 'paid') {
                // 已经被确认了
                this.onPaymentConfirmed();
                return;
            }

            if (!res.ok) {
                throw new Error(data.message || '提交失败');
            }

            // 显示等待确认状态
            confirmBtn.textContent = '⏳ 等待站长确认中...';
            if (statusEl) {
                statusEl.textContent = '已提交！站长确认收款后将自动跳转感谢页面 🎉';
                statusEl.className = 'qr-pay-status waiting';
            }

            // 开始轮询订单状态
            this.startPolling(this.currentOrderNo);

        } catch (e) {
            alert(e.message || '操作失败');
            confirmBtn.disabled = false;
            confirmBtn.textContent = '✅ 我已支付完成';
        }
    }

    /**
     * 轮询订单状态，等待管理员确认
     */
    startPolling(orderNo) {
        let attempts = 0;
        const maxAttempts = 200; // 最多轮询约10分钟（3秒一次）

        if (this.polling) clearInterval(this.polling);

        this.polling = setInterval(async () => {
            attempts++;
            if (attempts > maxAttempts) {
                clearInterval(this.polling);
                this.polling = null;
                const statusEl = document.getElementById('qrPayStatus');
                if (statusEl) {
                    statusEl.textContent = '等待超时，请稍后刷新页面查看状态';
                    statusEl.className = 'qr-pay-status timeout';
                }
                return;
            }

            try {
                const res = await fetch(`${API_BASE_URL}/donate/status/${orderNo}`);
                if (!res.ok) return;
                const data = await res.json();

                if (data.status === 'paid') {
                    clearInterval(this.polling);
                    this.polling = null;
                    this.onPaymentConfirmed();
                } else if (data.status === 'failed') {
                    clearInterval(this.polling);
                    this.polling = null;
                    const statusEl = document.getElementById('qrPayStatus');
                    if (statusEl) {
                        statusEl.textContent = '订单已被标记为未收到款，如有疑问请联系站长';
                        statusEl.className = 'qr-pay-status failed';
                    }
                }
            } catch (e) {
                // 忽略轮询错误
            }
        }, 3000); // 每 3 秒查一次
    }

    /**
     * 支付确认成功后的处理
     */
    onPaymentConfirmed() {
        // 关闭二维码弹窗
        const qrModal = document.getElementById('qrModal');
        qrModal.classList.remove('show');

        // 显示感谢弹窗
        document.getElementById('thankModal').classList.add('show');

        // 刷新数据
        setTimeout(() => {
            this.loadGoal();
            this.loadLeaderboard();
            this.loadRecent();
        }, 500);
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
