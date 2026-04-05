/**
 * 问答悬赏系统前端组件
 * Q&A Bounty System Frontend
 */

import { API_BASE_URL } from './api-config.js';

class QnaSystem {
    constructor() {
        this.currentUser = null;
        this.questions = [];
        this.currentQuestion = null;
        this.currentPage = 1;
        this.totalPages = 1;
        this.filters = {
            status: 'open',
            sort: 'newest',
            tag: null
        };
    }

    init() {
        this.checkAuth();
        this.bindEvents();
        this.loadQuestions();
    }

    checkAuth() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (token && user) {
            this.currentUser = JSON.parse(user);
        }
    }

    getHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }

    bindEvents() {
        // 筛选标签
        document.querySelectorAll('.qna-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                const value = e.target.dataset.value;
                this.filters[filter] = value;
                this.currentPage = 1;
                this.loadQuestions();
                this.updateFilterUI();
            });
        });

        // 搜索
        const searchInput = document.getElementById('qnaSearch');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.filters.search = e.target.value;
                    this.currentPage = 1;
                    this.loadQuestions();
                }, 500);
            });
        }

        // 创建问题按钮
        const createBtn = document.getElementById('createQuestionBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateModal());
        }
    }

    updateFilterUI() {
        document.querySelectorAll('.qna-filter-btn').forEach(btn => {
            const filter = btn.dataset.filter;
            const value = btn.dataset.value;
            btn.classList.toggle('active', this.filters[filter] === value);
        });
    }

    async loadQuestions() {
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: 20,
                ...this.filters
            });

            const response = await fetch(`${API_BASE_URL}/qna/questions?${params}`);
            const data = await response.json();

            if (data.success) {
                this.questions = data.data;
                this.totalPages = data.pagination.totalPages;
                this.renderQuestions();
                this.renderPagination(data.pagination);
            }
        } catch (error) {
            console.error('加载问题列表失败:', error);
            this.showToast('加载失败，请重试', 'error');
        }
    }

    renderQuestions() {
        const container = document.getElementById('qnaList');
        if (!container) return;

        if (this.questions.length === 0) {
            container.innerHTML = `
                <div class="qna-empty">
                    <div class="qna-empty-icon">❓</div>
                    <p>暂无问题，来提出第一个问题吧！</p>
                    ${this.currentUser ? '<button class="btn-primary" onclick="qnaSystem.showCreateModal()">提出问题</button>' : ''}
                </div>
            `;
            return;
        }

        container.innerHTML = this.questions.map(q => this.renderQuestionCard(q)).join('');
    }

    renderQuestionCard(question) {
        const isBounty = question.bounty_amount > 0;
        const isResolved = question.status === 'resolved';
        const timeAgo = this.formatTimeAgo(question.created_at);
        const tagsHtml = question.tags?.map(tag => `<span class="qna-tag">${tag}</span>`).join('') || '';

        return `
            <div class="qna-card ${isResolved ? 'resolved' : ''}" data-id="${question.id}">
                <div class="qna-card-stats">
                    <div class="stat-item">
                        <span class="stat-num">${question.answer_count || 0}</span>
                        <span class="stat-label">回答</span>
                    </div>
                    <div class="stat-item ${isBounty ? 'bounty' : ''}">
                        <span class="stat-num">${isBounty ? question.bounty_amount : question.view_count || 0}</span>
                        <span class="stat-label">${isBounty ? '悬赏' : '浏览'}</span>
                    </div>
                </div>
                <div class="qna-card-content">
                    <h3 class="qna-title">
                        <a href="/qna/question.html?id=${question.id}">${question.title}</a>
                        ${isResolved ? '<span class="resolved-badge">✓ 已解决</span>' : ''}
                        ${isBounty && !isResolved ? '<span class="bounty-badge">💰 悬赏中</span>' : ''}
                    </h3>
                    <p class="qna-excerpt">${this.truncateText(question.content, 100)}</p>
                    <div class="qna-meta">
                        <div class="qna-tags">${tagsHtml}</div>
                        <div class="qna-author">
                            <img src="${question.author?.avatar || '/images/default-avatar.png'}" alt="" class="author-avatar">
                            <span class="author-name">${question.author?.username || '匿名'}</span>
                            <span class="time">${timeAgo}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderPagination(pagination) {
        const container = document.getElementById('qnaPagination');
        if (!container || pagination.totalPages <= 1) return;

        let html = '';
        
        // 上一页
        html += `<button class="page-btn ${pagination.page === 1 ? 'disabled' : ''}" 
                         ${pagination.page === 1 ? '' : `onclick="qnaSystem.goToPage(${pagination.page - 1})`}">上一页</button>`;

        // 页码
        const startPage = Math.max(1, pagination.page - 2);
        const endPage = Math.min(pagination.totalPages, pagination.page + 2);

        if (startPage > 1) {
            html += `<button class="page-btn" onclick="qnaSystem.goToPage(1)">1</button>`;
            if (startPage > 2) html += `<span class="page-ellipsis">...</span>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="page-btn ${i === pagination.page ? 'active' : ''}" 
                             onclick="qnaSystem.goToPage(${i})">${i}</button>`;
        }

        if (endPage < pagination.totalPages) {
            if (endPage < pagination.totalPages - 1) html += `<span class="page-ellipsis">...</span>`;
            html += `<button class="page-btn" onclick="qnaSystem.goToPage(${pagination.totalPages})">${pagination.totalPages}</button>`;
        }

        // 下一页
        html += `<button class="page-btn ${pagination.page === pagination.totalPages ? 'disabled' : ''}" 
                         ${pagination.page === pagination.totalPages ? '' : `onclick="qnaSystem.goToPage(${pagination.page + 1})`}">下一页</button>`;

        container.innerHTML = html;
    }

    goToPage(page) {
        this.currentPage = page;
        this.loadQuestions();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    showCreateModal() {
        if (!this.currentUser) {
            this.showToast('请先登录', 'warning');
            window.dispatchEvent(new CustomEvent('showLogin'));
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'createQuestionModal';
        modal.innerHTML = `
            <div class="modal-content qna-modal">
                <div class="modal-header">
                    <h3>💰 发布悬赏问题</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <form id="createQuestionForm" class="qna-form">
                    <div class="form-group">
                        <label>问题标题 <span class="required">*</span></label>
                        <input type="text" name="title" placeholder="用一句话描述你的问题" required maxlength="100">
                    </div>
                    <div class="form-group">
                        <label>问题详情 <span class="required">*</span></label>
                        <textarea name="content" rows="6" placeholder="详细描述你的问题，包括背景、已尝试的解决方案等..." required minlength="20"></textarea>
                    </div>
                    <div class="form-group">
                        <label>标签（用逗号分隔）</label>
                        <input type="text" name="tags" placeholder="JavaScript, React, 前端">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>悬赏金额 <span class="required">*</span></label>
                            <div class="bounty-input-wrapper">
                                <input type="number" name="bountyAmount" min="10" value="50" required>
                                <span class="coin-icon">🪙</span>
                            </div>
                            <small>最低 10 金币，悬赏越高获得回答越快</small>
                        </div>
                        <div class="form-group">
                            <label>悬赏期限</label>
                            <select name="bountyDuration">
                                <option value="3">3天</option>
                                <option value="7" selected>7天</option>
                                <option value="14">14天</option>
                                <option value="30">30天</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group checkbox-group">
                        <label class="checkbox-label">
                            <input type="checkbox" name="allowMultipleAnswers">
                            <span>允许多人回答（默认只接受一个回答）</span>
                        </label>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">取消</button>
                        <button type="submit" class="btn-primary">发布问题</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // 绑定表单提交
        modal.querySelector('form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createQuestion(new FormData(e.target));
        });

        // 点击遮罩关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    async createQuestion(formData) {
        try {
            const data = {
                title: formData.get('title'),
                content: formData.get('content'),
                tags: formData.get('tags').split(',').map(t => t.trim()).filter(t => t),
                bountyAmount: parseInt(formData.get('bountyAmount')),
                bountyDuration: parseInt(formData.get('bountyDuration')),
                allowMultipleAnswers: formData.get('allowMultipleAnswers') === 'on'
            };

            const response = await fetch(`${API_BASE_URL}/qna/questions`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('问题发布成功！', 'success');
                document.getElementById('createQuestionModal')?.remove();
                this.loadQuestions();
            } else {
                this.showToast(result.error || '发布失败', 'error');
            }
        } catch (error) {
            console.error('创建问题失败:', error);
            this.showToast('发布失败，请重试', 'error');
        }
    }

    async loadQuestionDetail(questionId) {
        try {
            const response = await fetch(`${API_BASE_URL}/qna/questions/${questionId}`);
            const data = await response.json();

            if (data.success) {
                this.currentQuestion = data.data;
                this.renderQuestionDetail();
            }
        } catch (error) {
            console.error('加载问题详情失败:', error);
        }
    }

    renderQuestionDetail() {
        const container = document.getElementById('questionDetail');
        if (!container || !this.currentQuestion) return;

        const q = this.currentQuestion;
        const isAuthor = this.currentUser?.id === q.author_id;
        const isResolved = q.status === 'resolved';

        container.innerHTML = `
            <div class="question-detail">
                <div class="question-header">
                    <h1>${q.title}</h1>
                    <div class="question-meta">
                        <span class="status-badge ${isResolved ? 'resolved' : 'open'}">
                            ${isResolved ? '✓ 已解决' : '进行中'}
                        </span>
                        ${q.bounty_amount > 0 ? `<span class="bounty-amount">💰 ${q.bounty_amount} 金币悬赏</span>` : ''}
                    </div>
                </div>
                
                <div class="question-author">
                    <img src="${q.author?.avatar || '/images/default-avatar.png'}" class="author-avatar">
                    <div class="author-info">
                        <span class="author-name">${q.author?.username}</span>
                        <span class="author-level">Lv.${q.author?.level || 1}</span>
                    </div>
                    <span class="post-time">${this.formatTimeAgo(q.created_at)}</span>
                </div>

                <div class="question-content markdown-body">
                    ${this.renderMarkdown(q.content)}
                </div>

                <div class="question-tags">
                    ${q.tags?.map(tag => `<span class="tag">${tag}</span>`).join('') || ''}
                </div>

                <div class="question-stats">
                    <span>${q.view_count} 次浏览</span>
                    <span>${q.answers?.length || 0} 个回答</span>
                </div>
            </div>

            <div class="answers-section">
                <h2>${q.answers?.length || 0} 个回答</h2>
                ${q.answers?.map(a => this.renderAnswerCard(a, isAuthor)).join('') || '<p class="no-answers">暂无回答，来抢沙发吧！</p>'}
            </div>

            ${!isResolved && !isAuthor ? this.renderAnswerForm() : ''}
        `;

        // 绑定回答表单
        const answerForm = document.getElementById('answerForm');
        if (answerForm) {
            answerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitAnswer(q.id, new FormData(e.target));
            });
        }

        // 绑定投票按钮
        document.querySelectorAll('.vote-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const answerId = e.target.closest('.answer-card').dataset.id;
                const type = e.target.dataset.type;
                this.voteAnswer(answerId, type);
            });
        });

        // 绑定采纳按钮
        document.querySelectorAll('.accept-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const answerId = e.target.closest('.answer-card').dataset.id;
                this.acceptAnswer(answerId);
            });
        });
    }

    renderAnswerCard(answer, isQuestionAuthor) {
        const isAccepted = answer.is_accepted;
        const canAccept = isQuestionAuthor && !this.currentQuestion.accepted_answer_id;

        return `
            <div class="answer-card ${isAccepted ? 'accepted' : ''}" data-id="${answer.id}">
                ${isAccepted ? '<div class="accepted-badge">✓ 最佳回答</div>' : ''}
                
                <div class="answer-votes">
                    <button class="vote-btn up ${answer.userVoted === 'up' ? 'voted' : ''}" data-type="up">▲</button>
                    <span class="vote-count">${answer.vote_count || 0}</span>
                    <button class="vote-btn down ${answer.userVoted === 'down' ? 'voted' : ''}" data-type="down">▼</button>
                </div>

                <div class="answer-content">
                    <div class="answer-author">
                        <img src="${answer.author?.avatar || '/images/default-avatar.png'}" class="author-avatar">
                        <span class="author-name">${answer.author?.username}</span>
                        <span class="author-level">Lv.${answer.author?.level || 1}</span>
                        ${canAccept ? `<button class="accept-btn">采纳回答</button>` : ''}
                    </div>
                    
                    <div class="answer-body markdown-body">
                        ${this.renderMarkdown(answer.content)}
                    </div>
                    
                    <div class="answer-footer">
                        <span class="time">${this.formatTimeAgo(answer.created_at)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderAnswerForm() {
        return `
            <div class="answer-form-section">
                <h3>撰写回答</h3>
                <form id="answerForm">
                    <textarea name="content" rows="8" placeholder="分享你的知识和经验..." required minlength="10"></textarea>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">提交回答</button>
                    </div>
                </form>
            </div>
        `;
    }

    async submitAnswer(questionId, formData) {
        try {
            const content = formData.get('content');

            const response = await fetch(`${API_BASE_URL}/qna/questions/${questionId}/answers`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ content })
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('回答提交成功！', 'success');
                this.loadQuestionDetail(questionId);
            } else {
                this.showToast(result.error || '提交失败', 'error');
            }
        } catch (error) {
            console.error('提交回答失败:', error);
            this.showToast('提交失败，请重试', 'error');
        }
    }

    async voteAnswer(answerId, type) {
        if (!this.currentUser) {
            this.showToast('请先登录', 'warning');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/qna/answers/${answerId}/vote`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ type })
            });

            const result = await response.json();

            if (result.success) {
                // 更新UI
                const card = document.querySelector(`.answer-card[data-id="${answerId}"]`);
                if (card) {
                    const upBtn = card.querySelector('.vote-btn.up');
                    const downBtn = card.querySelector('.vote-btn.down');
                    const countSpan = card.querySelector('.vote-count');

                    upBtn.classList.toggle('voted', result.voted && result.type === 'up');
                    downBtn.classList.toggle('voted', result.voted && result.type === 'down');
                    
                    // 更新计数
                    const currentCount = parseInt(countSpan.textContent);
                    if (result.voted) {
                        countSpan.textContent = type === 'up' ? currentCount + 1 : currentCount - 1;
                    } else {
                        countSpan.textContent = type === 'up' ? currentCount - 1 : currentCount + 1;
                    }
                }
            }
        } catch (error) {
            console.error('投票失败:', error);
        }
    }

    async acceptAnswer(answerId) {
        if (!confirm('确定要采纳这个答案吗？悬赏金币将发放给该用户。')) return;

        try {
            const response = await fetch(
                `${API_BASE_URL}/qna/questions/${this.currentQuestion.id}/accept/${answerId}`,
                {
                    method: 'POST',
                    headers: this.getHeaders()
                }
            );

            const result = await response.json();

            if (result.success) {
                this.showToast(`悬赏 ${result.data.bountyAmount} 金币已发放！`, 'success');
                this.loadQuestionDetail(this.currentQuestion.id);
            } else {
                this.showToast(result.error || '采纳失败', 'error');
            }
        } catch (error) {
            console.error('采纳答案失败:', error);
            this.showToast('操作失败，请重试', 'error');
        }
    }

    // 工具函数
    truncateText(text, length) {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    formatTimeAgo(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = (now - date) / 1000;

        if (diff < 60) return '刚刚';
        if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
        if (diff < 2592000) return `${Math.floor(diff / 86400)} 天前`;
        return date.toLocaleDateString('zh-CN');
    }

    renderMarkdown(text) {
        // 简单的markdown渲染
        return text
            .replace(/#{3} (.*)/g, '<h3>$1</h3>')
            .replace(/#{2} (.*)/g, '<h2>$1</h2>')
            .replace(/#{1} (.*)/g, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/\n/g, '<br>');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }, 100);
    }
}

// 初始化
const qnaSystem = new QnaSystem();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('qnaList') || document.getElementById('questionDetail')) {
        qnaSystem.init();
    }
});

export default QnaSystem;
