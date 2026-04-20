/**
 * 投诉举报弹窗组件
 * 使用方式：ReportModal.open({ targetType: 'article', targetId: '123', targetTitle: '文章标题' })
 */
(function () {
    'use strict';

    // API 地址自动检测
    const API_BASE_URL = (typeof window !== 'undefined' && window.API_BASE_URL)
        ? window.API_BASE_URL
        : (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
            ? 'http://localhost:9000'
            : 'https://1321178544-65fvlfs2za.ap-beijing.tencentscf.com';

    const REPORT_REASONS = [
        { id: 'spam', label: '垃圾广告' },
        { id: 'illegal', label: '违法违规' },
        { id: 'abuse', label: '人身攻击' },
        { id: 'porn', label: '色情低俗' },
        { id: 'plagiarism', label: '抄袭侵权' },
        { id: 'misinfo', label: '虚假信息' },
        { id: 'other', label: '其他原因' }
    ];

    class ReportModal {
        constructor() {
            this.overlay = null;
            this.modal = null;
            this.currentTarget = null;
        }

        open({ targetType, targetId, targetTitle = '' }) {
            this.currentTarget = { targetType, targetId, targetTitle };
            this.createModal();
            document.body.style.overflow = 'hidden';
            // 触发动画
            requestAnimationFrame(() => {
                if (this.overlay) this.overlay.classList.add('active');
                if (this.modal) this.modal.classList.add('active');
            });
        }

        close() {
            if (this.overlay) this.overlay.classList.remove('active');
            if (this.modal) this.modal.classList.remove('active');
            setTimeout(() => {
                if (this.overlay && this.overlay.parentNode) {
                    this.overlay.parentNode.removeChild(this.overlay);
                }
                document.body.style.overflow = '';
                this.overlay = null;
                this.modal = null;
            }, 300);
        }

        createModal() {
            const existing = document.getElementById('reportModalOverlay');
            if (existing) existing.remove();

            this.overlay = document.createElement('div');
            this.overlay.id = 'reportModalOverlay';
            this.overlay.className = 'report-modal-overlay';

            const reasonsHtml = REPORT_REASONS.map(r =>
                `<label class="report-reason-item">
                    <input type="radio" name="reportReason" value="${r.id}" required>
                    <span class="reason-radio"></span>
                    <span class="reason-label">${r.label}</span>
                </label>`
            ).join('');

            this.overlay.innerHTML = `
                <div class="report-modal">
                    <div class="report-modal-header">
                        <h3>🚨 投诉举报</h3>
                        <button class="report-close-btn" onclick="window.reportModalInstance.close()">&times;</button>
                    </div>
                    <div class="report-modal-body">
                        <div class="report-target-info">
                            <span class="report-target-label">举报对象：</span>
                            <span class="report-target-value">${this.escapeHtml(this.currentTarget.targetTitle) || this.currentTarget.targetType + ' #' + this.currentTarget.targetId}</span>
                        </div>
                        <form id="reportForm">
                            <div class="report-form-group">
                                <label class="report-form-label">举报原因 <span class="required">*</span></label>
                                <div class="report-reasons">
                                    ${reasonsHtml}
                                </div>
                            </div>
                            <div class="report-form-group">
                                <label class="report-form-label">详细说明</label>
                                <textarea class="report-textarea" id="reportDetail" rows="4" placeholder="请描述具体情况，帮助我们更快处理..."></textarea>
                            </div>
                            <div class="report-form-group">
                                <label class="report-form-label">联系邮箱（选填，便于反馈处理结果）</label>
                                <input type="email" class="report-input" id="reportEmail" placeholder="your@email.com">
                            </div>
                            <div class="report-form-group">
                                <label class="report-form-label">其他联系方式（选填）</label>
                                <input type="text" class="report-input" id="reportContact" placeholder="微信/QQ/电话">
                            </div>
                            <button type="submit" class="report-submit-btn">提交举报</button>
                        </form>
                    </div>
                </div>
            `;

            document.body.appendChild(this.overlay);
            this.modal = this.overlay.querySelector('.report-modal');

            // 绑定表单提交
            const form = this.overlay.querySelector('#reportForm');
            form.addEventListener('submit', (e) => this.handleSubmit(e));

            // 点击遮罩关闭
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) this.close();
            });

            // ESC 关闭
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') this.close();
            }, { once: true });
        }

        async handleSubmit(e) {
            e.preventDefault();
            const form = e.target;
            const reason = form.querySelector('input[name="reportReason"]:checked')?.value;
            const detail = document.getElementById('reportDetail').value.trim();
            const email = document.getElementById('reportEmail').value.trim();
            const contact = document.getElementById('reportContact').value.trim();

            if (!reason) {
                this.showToast('请选择举报原因', 'error');
                return;
            }

            const submitBtn = form.querySelector('.report-submit-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = '提交中...';

            try {
                const token = localStorage.getItem('token');
                const headers = {
                    'Content-Type': 'application/json'
                };
                if (token) headers['Authorization'] = 'Bearer ' + token;

                const response = await fetch(`${API_BASE_URL}/reports`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        targetType: this.currentTarget.targetType,
                        targetId: this.currentTarget.targetId,
                        reason,
                        detail,
                        reporterEmail: email,
                        reporterContact: contact
                    })
                });

                const data = await response.json();

                if (data.success) {
                    this.showToast('举报已提交，我们会尽快处理', 'success');
                    setTimeout(() => this.close(), 1500);
                } else {
                    this.showToast(data.message || '提交失败', 'error');
                    submitBtn.disabled = false;
                    submitBtn.textContent = '提交举报';
                }
            } catch (err) {
                console.error('提交举报失败:', err);
                this.showToast('网络错误，请稍后重试', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = '提交举报';
            }
        }

        showToast(message, type = 'info') {
            const toast = document.createElement('div');
            toast.className = `report-toast ${type}`;
            toast.textContent = message;
            document.body.appendChild(toast);
            requestAnimationFrame(() => toast.classList.add('show'));
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        escapeHtml(str) {
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }
    }

    // 全局实例
    window.reportModalInstance = new ReportModal();
    window.ReportModal = ReportModal;
})();
