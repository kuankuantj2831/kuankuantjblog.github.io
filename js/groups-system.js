/**
 * 话题圈子系统前端组件
 * Topic Groups System Frontend
 */

import { API_BASE_URL } from './api-config.js';

class GroupsSystem {
    constructor() {
        this.currentUser = null;
        this.groups = [];
        this.currentGroup = null;
        this.posts = [];
        this.filters = {
            category: 'all',
            sort: 'newest'
        };
    }

    init() {
        this.checkAuth();
        this.bindEvents();
        this.loadGroups();
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
        // 筛选
        document.querySelectorAll('.group-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                const value = e.target.dataset.value;
                this.filters[filter] = value;
                this.loadGroups();
                this.updateFilterUI();
            });
        });

        // 搜索
        const searchInput = document.getElementById('groupSearch');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.loadGroups(e.target.value);
                }, 500);
            });
        }

        // 创建圈子按钮
        const createBtn = document.getElementById('createGroupBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateModal());
        }
    }

    updateFilterUI() {
        document.querySelectorAll('.group-filter-btn').forEach(btn => {
            const filter = btn.dataset.filter;
            const value = btn.dataset.value;
            btn.classList.toggle('active', this.filters[filter] === value);
        });
    }

    async loadGroups(search = '') {
        try {
            const params = new URLSearchParams({
                ...this.filters,
                search
            });

            const response = await fetch(`${API_BASE_URL}/groups?${params}`);
            const data = await response.json();

            if (data.success) {
                this.groups = data.data;
                this.renderGroups();
            }
        } catch (error) {
            console.error('加载圈子列表失败:', error);
            this.showToast('加载失败', 'error');
        }
    }

    renderGroups() {
        const container = document.getElementById('groupsList');
        if (!container) return;

        if (this.groups.length === 0) {
            container.innerHTML = `
                <div class="groups-empty">
                    <div class="empty-icon">👥</div>
                    <p>暂无圈子，创建第一个圈子吧！</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.groups.map(g => this.renderGroupCard(g)).join('');

        // 绑定加入按钮
        document.querySelectorAll('.join-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const groupId = e.target.closest('.group-card').dataset.id;
                this.joinGroup(groupId);
            });
        });
    }

    renderGroupCard(group) {
        const categories = {
            '技术': '💻',
            '生活': '🌟',
            '娱乐': '🎮',
            '学习': '📚',
            '其他': '📌'
        };

        return `
            <div class="group-card" data-id="${group.id}">
                <div class="group-avatar">
                    ${group.avatar ? `<img src="${group.avatar}" alt="">` : categories[group.category] || '📌'}
                </div>
                <div class="group-info">
                    <h3 class="group-name">
                        <a href="/groups/detail.html?id=${group.id}">${group.name}</a>
                    </h3>
                    <p class="group-desc">${group.description}</p>
                    <div class="group-meta">
                        <span class="group-category">${categories[group.category] || '📌'} ${group.category}</span>
                        <span class="group-members">👥 ${group.member_count} 成员</span>
                        <span class="group-posts">📝 ${group.post_count} 帖子</span>
                    </div>
                </div>
                ${group.is_member 
                    ? '<span class="joined-badge">✓ 已加入</span>'
                    : `<button class="join-btn">+ 加入</button>`
                }
            </div>
        `;
    }

    async joinGroup(groupId) {
        if (!this.currentUser) {
            this.showToast('请先登录', 'warning');
            window.dispatchEvent(new CustomEvent('showLogin'));
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/groups/${groupId}/join`, {
                method: 'POST',
                headers: this.getHeaders()
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('加入成功！', 'success');
                this.loadGroups();
            } else {
                this.showToast(result.error || '加入失败', 'error');
            }
        } catch (error) {
            console.error('加入圈子失败:', error);
            this.showToast('加入失败', 'error');
        }
    }

    showCreateModal() {
        if (!this.currentUser) {
            this.showToast('请先登录', 'warning');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content group-modal">
                <div class="modal-header">
                    <h3>🏘️ 创建新圈子</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <form id="createGroupForm" class="group-form">
                    <div class="form-group">
                        <label>圈子名称 <span class="required">*</span></label>
                        <input type="text" name="name" placeholder="给你的圈子起个名字" required maxlength="50">
                    </div>
                    <div class="form-group">
                        <label>圈子简介 <span class="required">*</span></label>
                        <textarea name="description" rows="3" placeholder="描述一下这个圈子的主题..." required></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>分类</label>
                            <select name="category">
                                <option value="技术">💻 技术</option>
                                <option value="生活">🌟 生活</option>
                                <option value="娱乐">🎮 娱乐</option>
                                <option value="学习">📚 学习</option>
                                <option value="其他">📌 其他</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>隐私设置</label>
                            <select name="isPrivate">
                                <option value="false">🔓 公开（任何人可见）</option>
                                <option value="true">🔒 私密（仅成员可见）</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>圈子规则</label>
                        <textarea name="rules" rows="3" placeholder="设置圈子的行为规范和发帖规则（可选）..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">取消</button>
                        <button type="submit" class="btn-primary">创建圈子</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createGroup(new FormData(e.target));
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    async createGroup(formData) {
        try {
            const data = {
                name: formData.get('name'),
                description: formData.get('description'),
                category: formData.get('category'),
                rules: formData.get('rules'),
                isPrivate: formData.get('isPrivate') === 'true'
            };

            const response = await fetch(`${API_BASE_URL}/groups`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('圈子创建成功！', 'success');
                document.querySelector('.modal-overlay')?.remove();
                this.loadGroups();
                // 跳转到新圈子
                window.location.href = `/groups/detail.html?id=${result.data.id}`;
            } else {
                this.showToast(result.error || '创建失败', 'error');
            }
        } catch (error) {
            console.error('创建圈子失败:', error);
            this.showToast('创建失败', 'error');
        }
    }

    async loadGroupDetail(groupId) {
        try {
            const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
                headers: this.getHeaders()
            });
            const data = await response.json();

            if (data.success) {
                this.currentGroup = data.data;
                this.renderGroupDetail();
                this.loadGroupPosts(groupId);
            }
        } catch (error) {
            console.error('加载圈子详情失败:', error);
        }
    }

    renderGroupDetail() {
        const container = document.getElementById('groupDetail');
        if (!container || !this.currentGroup) return;

        const g = this.currentGroup;
        const categories = {
            '技术': '💻',
            '生活': '🌟',
            '娱乐': '🎮',
            '学习': '📚',
            '其他': '📌'
        };

        container.innerHTML = `
            <div class="group-header" style="${g.cover_image ? `background-image: url(${g.cover_image})` : 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}">
                <div class="group-header-overlay">
                    <div class="group-header-content">
                        <div class="group-avatar-large">
                            ${g.avatar || categories[g.category] || '📌'}
                        </div>
                        <div class="group-header-info">
                            <h1>${g.name}</h1>
                            <p class="group-category">${categories[g.category] || '📌'} ${g.category}</p>
                            <p class="group-stats">
                                <span>👥 ${g.member_count} 成员</span>
                                <span>📝 ${g.post_count} 帖子</span>
                                <span>👤 创建者: ${g.creator?.username}</span>
                            </p>
                        </div>
                        <div class="group-actions">
                            ${g.is_member 
                                ? `<button class="btn-leave" onclick="groupsSystem.leaveGroup('${g.id}')">退出圈子</button>`
                                : `<button class="btn-join-large" onclick="groupsSystem.joinGroup('${g.id}')">+ 加入圈子</button>`
                            }
                        </div>
                    </div>
                </div>
            </div>

            <div class="group-content">
                <div class="group-sidebar">
                    <div class="sidebar-card">
                        <h4>圈子介绍</h4>
                        <p>${g.description}</p>
                    </div>
                    ${g.rules ? `
                    <div class="sidebar-card">
                        <h4>📋 圈子规则</h4>
                        <p>${g.rules}</p>
                    </div>
                    ` : ''}
                </div>

                <div class="group-main">
                    ${g.is_member ? `
                    <div class="post-creator">
                        <textarea id="postContent" placeholder="分享你的想法..." rows="3"></textarea>
                        <div class="post-creator-actions">
                            <button class="btn-primary" onclick="groupsSystem.createPost()">发布</button>
                        </div>
                    </div>
                    ` : `
                    <div class="join-prompt">
                        <p>加入圈子后可以发帖和评论</p>
                        <button class="btn-primary" onclick="groupsSystem.joinGroup('${g.id}')">加入圈子</button>
                    </div>
                    `}

                    <div class="posts-list" id="postsList">
                        <!-- 帖子列表 -->
                    </div>
                </div>
            </div>
        `;
    }

    async loadGroupPosts(groupId) {
        try {
            const response = await fetch(`${API_BASE_URL}/groups/${groupId}/posts`);
            const data = await response.json();

            if (data.success) {
                this.posts = data.data;
                this.renderPosts();
            }
        } catch (error) {
            console.error('加载帖子失败:', error);
        }
    }

    renderPosts() {
        const container = document.getElementById('postsList');
        if (!container) return;

        if (this.posts.length === 0) {
            container.innerHTML = `
                <div class="posts-empty">
                    <p>还没有帖子，来发布第一个吧！</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.posts.map(p => this.renderPostCard(p)).join('');

        // 绑定点赞和评论
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const postId = e.target.closest('.post-card').dataset.id;
                this.likePost(postId);
            });
        });
    }

    renderPostCard(post) {
        return `
            <div class="post-card" data-id="${post.id}">
                <div class="post-header">
                    <img src="${post.author?.avatar || '/images/default-avatar.png'}" class="post-avatar">
                    <div class="post-author-info">
                        <span class="post-author">${post.author?.username}</span>
                        <span class="post-time">${this.formatTimeAgo(post.created_at)}</span>
                    </div>
                </div>
                <div class="post-content">
                    ${post.title ? `<h4 class="post-title">${post.title}</h4>` : ''}
                    <p>${post.content}</p>
                </div>
                <div class="post-actions">
                    <button class="like-btn ${post.is_liked ? 'liked' : ''}">
                        ❤️ ${post.like_count || 0}
                    </button>
                    <button class="comment-btn">
                        💬 ${post.comment_count || 0}
                    </button>
                </div>
            </div>
        `;
    }

    async createPost() {
        const content = document.getElementById('postContent')?.value;
        if (!content?.trim()) {
            this.showToast('请输入内容', 'warning');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/groups/${this.currentGroup.id}/posts`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ content })
            });

            const result = await response.json();

            if (result.success) {
                document.getElementById('postContent').value = '';
                this.showToast('发布成功！', 'success');
                this.loadGroupPosts(this.currentGroup.id);
            }
        } catch (error) {
            console.error('发布帖子失败:', error);
            this.showToast('发布失败', 'error');
        }
    }

    async likePost(postId) {
        if (!this.currentUser) {
            this.showToast('请先登录', 'warning');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/groups/posts/${postId}/like`, {
                method: 'POST',
                headers: this.getHeaders()
            });

            const result = await response.json();

            if (result.success) {
                this.loadGroupPosts(this.currentGroup.id);
            }
        } catch (error) {
            console.error('点赞失败:', error);
        }
    }

    async leaveGroup(groupId) {
        if (!confirm('确定要退出这个圈子吗？')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/groups/${groupId}/leave`, {
                method: 'POST',
                headers: this.getHeaders()
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('已退出圈子', 'info');
                this.loadGroupDetail(groupId);
            }
        } catch (error) {
            console.error('退出圈子失败:', error);
        }
    }

    formatTimeAgo(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = (now - date) / 1000;

        if (diff < 60) return '刚刚';
        if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
        return `${Math.floor(diff / 86400)} 天前`;
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

const groupsSystem = new GroupsSystem();

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('groupsList') || document.getElementById('groupDetail')) {
        groupsSystem.init();
    }
});

export default GroupsSystem;
