/**
 * 社区互动增强模块
 * 文章投票、问答社区、评论置顶
 */

import { API_BASE_URL } from './api-config.js?v=20260419b';
import { escapeHtml } from './utils.js';

class CommunityEnhancement {
    constructor() {
        this.currentVotes = {};
        this.questions = [];
        this.answers = {};
        this.pinnedComments = [];
    }

    init() {
        this.initVoteSystem();
        this.initQACommunity();
        this.initPinnedComments();
    }

    // ========== 文章投票系统 ==========
    initVoteSystem() {
        const voteContainer = document.getElementById('articleVote');
        if (!voteContainer) return;

        const articleId = this.getCurrentArticleId();
        if (!articleId) return;

        this.loadArticleVotes(articleId);
        this.bindVoteEvents(voteContainer, articleId);
    }

    async loadArticleVotes(articleId) {
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            const response = await fetch(`${API_BASE_URL}/votes/${articleId}`, { headers });
            if (!response.ok) throw new Error('加载投票数据失败');
            
            const data = await response.json();
            this.currentVotes[articleId] = data;
            this.renderVoteButtons(articleId, data);
        } catch (error) {
            console.error('加载投票失败:', error);
        }
    }

    renderVoteButtons(articleId, data) {
        const container = document.getElementById('articleVote');
        if (!container) return;

        const { upvotes, downvotes, user_vote } = data;
        const score = upvotes - downvotes;

        container.innerHTML = `
            <div class="vote-container">
                <button class="vote-btn upvote ${user_vote === 'up' ? 'active' : ''}" data-vote="up">
                    ▲
                </button>
                <span class="vote-score ${score > 0 ? 'positive' : score < 0 ? 'negative' : ''}">
                    ${score > 0 ? '+' : ''}${score}
                </span>
                <button class="vote-btn downvote ${user_vote === 'down' ? 'active' : ''}" data-vote="down">
                    ▼
                </button>
            </div>
        `;
    }

    bindVoteEvents(container, articleId) {
        container.addEventListener('click', async (e) => {
            const btn = e.target.closest('.vote-btn');
            if (!btn) return;

            const token = localStorage.getItem('token');
            if (!token) {
                this.showLoginPrompt();
                return;
            }

            const voteType = btn.dataset.vote;
            await this.submitVote(articleId, voteType);
        });
    }

    async submitVote(articleId, voteType) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/votes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ article_id: articleId, vote_type: voteType })
            });

            if (!response.ok) throw new Error('投票失败');
            
            const result = await response.json();
            this.currentVotes[articleId] = result;
            this.renderVoteButtons(articleId, result);
            
            // 显示动画效果
            this.showVoteAnimation(voteType);
        } catch (error) {
            console.error('投票失败:', error);
            this.showToast('投票失败，请重试', 'error');
        }
    }

    showVoteAnimation(type) {
        const toast = document.createElement('div');
        toast.className = `vote-toast ${type}`;
        toast.innerHTML = type === 'up' ? '👍 已赞同' : '👎 已反对';
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 1000);
    }

    // ========== 问答社区 ==========
    initQACommunity() {
        const qaContainer = document.getElementById('qaCommunity');
        if (!qaContainer) return;

        this.loadQuestions();
        this.bindQAEvents(qaContainer);
    }

    async loadQuestions(status = 'open', page = 1) {
        try {
            const response = await fetch(`${API_BASE_URL}/questions?status=${status}&page=${page}`);
            if (!response.ok) throw new Error('加载问题失败');
            
            const data = await response.json();
            this.questions = data.questions || [];
            this.renderQuestions(status);
        } catch (error) {
            console.error('加载问题失败:', error);
        }
    }

    renderQuestions(status) {
        const container = document.getElementById('questionsList');
        if (!container) return;

        if (this.questions.length === 0) {
            container.innerHTML = '<p class="empty-state">暂无问题</p>';
            return;
        }

        container.innerHTML = this.questions.map(q => `
            <div class="question-card ${q.status} ${q.has_best_answer ? 'solved' : ''}">
                <div class="question-stats">
                    <div class="stat votes">
                        <span class="count">${q.votes}</span>
                        <span class="label">投票</span>
                    </div>
                    <div class="stat answers ${q.answer_count > 0 ? 'has-answers' : ''}">
                        <span class="count">${q.answer_count}</span>
                        <span class="label">回答</span>
                    </div>
                    <div class="stat views">
                        <span class="count">${this.formatNumber(q.views)}</span>
                        <span class="label">浏览</span>
                    </div>
                </div>
                <div class="question-content">
                    <h4><a href="/qa.html?id=${q.id}">${escapeHtml(q.title)}</a></h4>
                    <p>${escapeHtml(q.content).substring(0, 150)}...</p>
                    <div class="question-meta">
                        <div class="tags">
                            ${(q.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                        </div>
                        <div class="author-info">
                            <img src="${q.author_avatar || '/images/default-avatar.png'}" alt="" class="avatar">
                            <span>${escapeHtml(q.author_name)}</span>
                            <span class="time">${this.formatTimeAgo(q.created_at)}</span>
                        </div>
                    </div>
                    ${q.bounty_coins > 0 ? `
                        <div class="bounty-badge">
                            💰 ${q.bounty_coins} 硬币悬赏
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    async loadQuestionDetail(questionId) {
        try {
            const response = await fetch(`${API_BASE_URL}/questions/${questionId}`);
            if (!response.ok) throw new Error('加载问题详情失败');
            
            const data = await response.json();
            this.renderQuestionDetail(data.question);
            this.answers[questionId] = data.answers || [];
            this.renderAnswers(questionId);
        } catch (error) {
            console.error('加载问题详情失败:', error);
        }
    }

    renderQuestionDetail(question) {
        const container = document.getElementById('questionDetail');
        if (!container) return;

        container.innerHTML = `
            <div class="question-detail">
                <div class="question-header">
                    <h2>${escapeHtml(question.title)}</h2>
                    <div class="question-status ${question.status}">
                        ${question.status === 'open' ? '🔓 待解决' : '🔒 已解决'}
                    </div>
                </div>
                <div class="question-body">
                    <div class="vote-section">
                        <button class="vote-btn" data-vote="up">▲</button>
                        <span class="vote-count">${question.votes}</span>
                        <button class="vote-btn" data-vote="down">▼</button>
                    </div>
                    <div class="content-section">
                        <div class="content">${this.renderMarkdown(question.content)}</div>
                        <div class="tags">
                            ${(question.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                        </div>
                        <div class="author-box">
                            <img src="${question.author_avatar || '/images/default-avatar.png'}" alt="" class="avatar">
                            <div class="info">
                                <span class="name">${escapeHtml(question.author_name)}</span>
                                <span class="time">提问于 ${this.formatTimeAgo(question.created_at)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                ${question.bounty_coins > 0 ? `
                    <div class="bounty-info">
                        💰 悬赏 ${question.bounty_coins} 硬币给最佳答案
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderAnswers(questionId) {
        const container = document.getElementById('answersList');
        if (!container) return;

        const answers = this.answers[questionId] || [];
        
        if (answers.length === 0) {
            container.innerHTML = '<p class="empty-state">暂无回答，来做第一个回答者吧！</p>';
            return;
        }

        container.innerHTML = `
            <h3>${answers.length} 个回答</h3>
            ${answers.map(answer => `
                <div class="answer-card ${answer.is_accepted ? 'accepted' : ''}">
                    <div class="vote-section">
                        <button class="vote-btn" data-answer-id="${answer.id}" data-vote="up">▲</button>
                        <span class="vote-count">${answer.votes}</span>
                        <button class="vote-btn" data-answer-id="${answer.id}" data-vote="down">▼</button>
                        ${answer.is_accepted ? '<div class="accepted-badge">✓</div>' : ''}
                    </div>
                    <div class="answer-content">
                        <div class="content">${this.renderMarkdown(answer.content)}</div>
                        <div class="author-box">
                            <img src="${answer.author_avatar || '/images/default-avatar.png'}" alt="" class="avatar">
                            <div class="info">
                                <span class="name">${escapeHtml(answer.author_name)}</span>
                                <span class="time">回答于 ${this.formatTimeAgo(answer.created_at)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        `;
    }

    bindQAEvents(container) {
        // 提问按钮
        const askBtn = container.querySelector('.btn-ask-question');
        if (askBtn) {
            askBtn.addEventListener('click', () => this.showAskModal());
        }

        // 筛选Tab
        container.querySelectorAll('.qa-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                container.querySelectorAll('.qa-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.loadQuestions(tab.dataset.status);
            });
        });
    }

    showAskModal() {
        const token = localStorage.getItem('token');
        if (!token) {
            this.showLoginPrompt();
            return;
        }

        // 创建提问弹窗
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content qa-modal">
                <h3>提出问题</h3>
                <div class="form-group">
                    <label>标题</label>
                    <input type="text" id="questionTitle" placeholder="简洁描述你的问题">
                </div>
                <div class="form-group">
                    <label>内容</label>
                    <textarea id="questionContent" rows="6" placeholder="详细描述你的问题..."></textarea>
                </div>
                <div class="form-group">
                    <label>标签（用逗号分隔）</label>
                    <input type="text" id="questionTags" placeholder="JavaScript, React, 前端">
                </div>
                <div class="form-group">
                    <label>悬赏硬币（可选）</label>
                    <input type="number" id="questionBounty" min="0" placeholder="0">
                </div>
                <div class="modal-actions">
                    <button class="btn-cancel">取消</button>
                    <button class="btn-submit">发布问题</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 绑定事件
        modal.querySelector('.btn-cancel').addEventListener('click', () => modal.remove());
        modal.querySelector('.btn-submit').addEventListener('click', () => this.submitQuestion(modal));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    async submitQuestion(modal) {
        const title = modal.querySelector('#questionTitle').value.trim();
        const content = modal.querySelector('#questionContent').value.trim();
        const tags = modal.querySelector('#questionTags').value.split(',').map(t => t.trim()).filter(Boolean);
        const bounty = parseInt(modal.querySelector('#questionBounty').value) || 0;

        if (!title || !content) {
            this.showToast('请填写标题和内容', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/questions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, content, tags, bounty_coins: bounty })
            });

            if (!response.ok) throw new Error('发布失败');
            
            modal.remove();
            this.showToast('问题发布成功！', 'success');
            this.loadQuestions();
        } catch (error) {
            console.error('发布问题失败:', error);
            this.showToast('发布失败，请重试', 'error');
        }
    }

    // ========== 评论置顶 ==========
    initPinnedComments() {
        const articleId = this.getCurrentArticleId();
        if (!articleId) return;

        this.loadPinnedComments(articleId);
    }

    async loadPinnedComments(articleId) {
        try {
            const response = await fetch(`${API_BASE_URL}/pinned-comments/${articleId}`);
            if (!response.ok) throw new Error('加载置顶评论失败');
            
            const data = await response.json();
            this.pinnedComments = data.comments || [];
            this.renderPinnedComments();
        } catch (error) {
            console.error('加载置顶评论失败:', error);
        }
    }

    renderPinnedComments() {
        const container = document.getElementById('pinnedComments');
        if (!container || this.pinnedComments.length === 0) return;

        container.innerHTML = `
            <div class="pinned-comments-section">
                <h4>📌 作者精选</h4>
                ${this.pinnedComments.map(comment => `
                    <div class="pinned-comment">
                        <div class="pin-badge">置顶</div>
                        <div class="comment-content">${escapeHtml(comment.content)}</div>
                        <div class="comment-meta">
                            <img src="${comment.author_avatar || '/images/default-avatar.png'}" alt="" class="avatar">
                            <span class="author">${escapeHtml(comment.author_name)}</span>
                            <span class="time">${this.formatTimeAgo(comment.created_at)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async pinComment(commentId, articleId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/comments/${commentId}/pin`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ article_id: articleId })
            });

            if (!response.ok) throw new Error('置顶失败');
            
            this.showToast('评论已置顶', 'success');
            this.loadPinnedComments(articleId);
        } catch (error) {
            console.error('置顶评论失败:', error);
            this.showToast('置顶失败，只有文章作者可以置顶', 'error');
        }
    }

    // ========== 辅助方法 ==========
    getCurrentArticleId() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
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
        if (diff < 604800) return `${Math.floor(diff / 86400)}天前`;
        return date.toLocaleDateString('zh-CN');
    }

    renderMarkdown(content) {
        // 简化的Markdown渲染
        return escapeHtml(content)
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    showLoginPrompt() {
        if (window.SupabaseAuth) {
            window.SupabaseAuth.showLoginModal();
        } else {
            alert('请先登录');
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `community-toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ========== 全局初始化 ==========
    static init() {
        window.communityEnhancement = new CommunityEnhancement();
        window.communityEnhancement.init();
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    CommunityEnhancement.init();
});

export default CommunityEnhancement;
