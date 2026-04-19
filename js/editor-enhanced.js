/**
 * 增强版文章编辑器
 * 整合Markdown编辑器、自动保存、版本历史、协作功能
 */
import MarkdownEditor from './markdown-editor.js?v=20260403';
import { API_BASE_URL } from './api-config.js?v=20260419b';

// 安全解析 localStorage 中的用户数据
function getSafeUser() {
    try {
        const userJson = localStorage.getItem('user');
        if (!userJson) return null;
        const user = JSON.parse(userJson);
        if (!user || !user.id) return null;
        return user;
    } catch (e) {
        console.error('解析用户数据失败:', e);
        localStorage.removeItem('user');
        return null;
    }
}

// 检查登录状态
function checkAuth() {
    const user = getSafeUser();
    if (!user) {
        alert('请先登录后再发布文章！');
        window.location.href = '/index-chinese.html';
        return null;
    }
    console.log('当前用户:', user.username || user.email || user.id);
    return user;
}

// 从URL获取文章ID（编辑模式）
function getArticleIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// 主类
class EnhancedArticleEditor {
    constructor() {
        this.currentUser = checkAuth();
        if (!this.currentUser) return;
        
        this.token = localStorage.getItem('token');
        this.articleId = getArticleIdFromUrl();
        this.isEditMode = !!this.articleId;
        this.mdEditor = null;
        this.collaborators = [];
        this.editLockInterval = null;
        
        this.init();
    }
    
    async init() {
        // 初始化Markdown编辑器
        this.initMarkdownEditor();
        
        // 绑定表单提交
        this.bindFormSubmit();
        
        // 如果是编辑模式，加载文章数据
        if (this.isEditMode) {
            await this.loadArticle();
            await this.acquireEditLock();
            this.startEditLockRenewal();
            this.showCollaborationPanel();
        }
        
        // 绑定侧边栏事件
        this.bindSidebarEvents();
    }
    
    initMarkdownEditor() {
        const container = document.getElementById('md-editor-container');
        const hiddenTextarea = document.getElementById('articleContent');
        
        this.mdEditor = new MarkdownEditor({
            container: container,
            content: hiddenTextarea.value,
            articleId: this.articleId,
            userId: this.currentUser.id,
            token: this.token,
            onChange: (content) => {
                hiddenTextarea.value = content;
            }
        });
    }
    
    bindFormSubmit() {
        const form = document.getElementById('articleForm');
        const publishBtn = document.getElementById('publishBtn');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            publishBtn.disabled = true;
            publishBtn.textContent = this.isEditMode ? '保存中...' : '发布中...';
            
            try {
                const title = document.getElementById('articleTitle').value.trim();
                const category = document.getElementById('articleCategory').value;
                const tagsStr = document.getElementById('articleTags').value.trim();
                const summary = document.getElementById('articleSummary').value.trim();
                const content = this.mdEditor.getContent().trim();
                
                // 验证
                if (!title) throw new Error('请输入文章标题');
                if (!content) throw new Error('请输入文章内容');
                if (title.length > 255) throw new Error('标题不能超过255个字符');
                
                // 处理标签
                const tags = tagsStr.split(/[,，]/).map(t => t.trim()).filter(t => t);
                
                // 获取设置
                const isPublic = document.getElementById('settingPublic').checked;
                const allowComments = document.getElementById('settingComments').checked;
                const allowCoins = document.getElementById('settingCoins').checked;
                
                // 准备数据
                const articleData = {
                    title,
                    category,
                    tags: tags.join(','),
                    summary,
                    content,
                    is_public: isPublic,
                    allow_comments: allowComments,
                    allow_coins: allowCoins
                };
                
                // 添加作者信息（新文章）
                if (!this.isEditMode) {
                    articleData.author_id = this.currentUser.id;
                    articleData.author_name = this.currentUser.username || 
                        this.currentUser.user_metadata?.username || 
                        (this.currentUser.email ? this.currentUser.email.split('@')[0] : '匿名');
                }
                
                // 发送请求
                const url = this.isEditMode 
                    ? `${API_BASE_URL}/articles/${this.articleId}`
                    : `${API_BASE_URL}/articles`;
                const method = this.isEditMode ? 'PUT' : 'POST';
                
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(articleData)
                });
                
                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.message || (this.isEditMode ? '保存失败' : '发布失败'));
                }
                
                const result = await response.json();
                
                // 清理草稿
                this.mdEditor.clearDraft();
                
                // 释放编辑锁
                if (this.isEditMode) {
                    await this.releaseEditLock();
                }
                
                // 提示成功
                alert(this.isEditMode ? '🎉 保存成功！' : '🎉 发布成功！');
                
                // 跳转到文章页或首页
                if (this.isEditMode) {
                    window.location.href = `/article.html?id=${this.articleId}`;
                } else {
                    window.location.href = '/index-chinese.html';
                }
                
            } catch (error) {
                console.error(this.isEditMode ? '保存失败:' : '发布失败:', error);
                alert((this.isEditMode ? '❌ 保存失败: ' : '❌ 发布失败: ') + error.message);
                publishBtn.disabled = false;
                publishBtn.textContent = this.isEditMode ? '💾 保存修改' : '🚀 发布文章';
            }
        });
    }
    
    async loadArticle() {
        try {
            const response = await fetch(`${API_BASE_URL}/articles/${this.articleId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('文章加载失败');
            }
            
            const data = await response.json();
            const article = data.article;
            
            // 检查权限
            if (article.author_id !== this.currentUser.id && this.currentUser.role !== 'admin') {
                alert('无权编辑此文章');
                window.location.href = '/index-chinese.html';
                return;
            }
            
            // 填充表单
            document.getElementById('articleTitle').value = article.title || '';
            document.getElementById('articleCategory').value = article.category || '编程技术';
            document.getElementById('articleTags').value = article.tags || '';
            document.getElementById('articleSummary').value = article.summary || '';
            document.getElementById('settingPublic').checked = article.is_public !== false;
            document.getElementById('settingComments').checked = article.allow_comments !== false;
            document.getElementById('settingCoins').checked = article.allow_coins !== false;
            
            // 设置编辑器内容
            this.mdEditor.setContent(article.content || '');
            
            // 更新页面标题
            document.querySelector('.editor-title').textContent = '✏️ 编辑文章';
            document.getElementById('publishBtn').textContent = '💾 保存修改';
            
            // 加载协作者
            await this.loadCollaborators();
            
        } catch (error) {
            console.error('加载文章失败:', error);
            alert('文章加载失败，请重试');
        }
    }
    
    async acquireEditLock() {
        try {
            const response = await fetch(`${API_BASE_URL}/articles/${this.articleId}/lock`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.status === 423) {
                const data = await response.json();
                if (!confirm(`文章正在被 ${data.locked_by} 编辑，是否强制获取编辑权限？`)) {
                    window.location.href = '/index-chinese.html';
                    return;
                }
                // 强制获取锁
                await this.forceAcquireLock();
            } else if (!response.ok) {
                console.error('获取编辑锁失败');
            }
        } catch (error) {
            console.error('获取编辑锁失败:', error);
        }
    }
    
    async forceAcquireLock() {
        // 先释放可能存在的旧锁
        await this.releaseEditLock();
        // 重新获取
        await this.acquireEditLock();
    }
    
    async releaseEditLock() {
        if (!this.articleId) return;
        
        try {
            await fetch(`${API_BASE_URL}/articles/${this.articleId}/lock`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
        } catch (error) {
            console.error('释放编辑锁失败:', error);
        }
    }
    
    startEditLockRenewal() {
        // 每4分钟续期一次（锁5分钟过期）
        this.editLockInterval = setInterval(() => {
            this.acquireEditLock();
        }, 4 * 60 * 1000);
    }
    
    showCollaborationPanel() {
        document.getElementById('collabCard').style.display = 'block';
    }
    
    async loadCollaborators() {
        try {
            const response = await fetch(`${API_BASE_URL}/articles/${this.articleId}/collaborators`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (!response.ok) return;
            
            const data = await response.json();
            this.collaborators = data.collaborators || [];
            this.renderCollaborators();
            
            // 生成分享链接
            this.updateShareLink();
            
        } catch (error) {
            console.error('加载协作者失败:', error);
        }
    }
    
    renderCollaborators() {
        const container = document.getElementById('collabList');
        
        if (this.collaborators.length === 0) {
            container.innerHTML = '<div style="color: #999; font-size: 13px; text-align: center; padding: 20px;">暂无协作者</div>';
            return;
        }
        
        container.innerHTML = this.collaborators.map(c => `
            <div class="collab-item" data-user-id="${c.user_id}">
                <div class="collab-avatar">${(c.username || 'U').charAt(0).toUpperCase()}</div>
                <div class="collab-info">
                    <div class="collab-name">${c.username || '未知用户'}</div>
                    <div class="collab-permission">${this.getPermissionText(c.permission)}</div>
                </div>
                <button type="button" class="btn-remove-collab" data-user-id="${c.user_id}" 
                        style="background: none; border: none; color: #999; cursor: pointer; font-size: 18px;">&times;</button>
            </div>
        `).join('');
        
        // 绑定移除事件
        container.querySelectorAll('.btn-remove-collab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.dataset.userId;
                this.removeCollaborator(userId);
            });
        });
    }
    
    getPermissionText(permission) {
        const map = {
            'view': '仅查看',
            'comment': '可评论',
            'edit': '可编辑'
        };
        return map[permission] || permission;
    }
    
    updateShareLink() {
        const input = document.getElementById('shareLinkInput');
        const shareUrl = `${window.location.origin}/editor.html?id=${this.articleId}&share=1`;
        input.value = shareUrl;
    }
    
    bindSidebarEvents() {
        // 添加协作者按钮
        document.getElementById('btnAddCollab').addEventListener('click', () => {
            document.getElementById('collabModal').classList.add('show');
        });
        
        // 关闭模态框
        document.getElementById('btnCloseCollab').addEventListener('click', () => {
            document.getElementById('collabModal').classList.remove('show');
        });
        
        document.getElementById('collabModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                document.getElementById('collabModal').classList.remove('show');
            }
        });
        
        // 确认添加协作者
        document.getElementById('btnConfirmCollab').addEventListener('click', () => {
            this.addCollaborator();
        });
        
        // 复制分享链接
        document.getElementById('btnCopyLink').addEventListener('click', () => {
            const input = document.getElementById('shareLinkInput');
            input.select();
            document.execCommand('copy');
            this.showToast('链接已复制');
        });
        
        // 页面关闭时释放锁
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }
    
    async addCollaborator() {
        const userIdInput = document.getElementById('collabUserId');
        const permissionSelect = document.getElementById('collabPermission');
        
        const userId = userIdInput.value.trim();
        const permission = permissionSelect.value;
        
        if (!userId) {
            alert('请输入用户ID');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/articles/${this.articleId}/collaborators`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ user_id: userId, permission })
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || '添加失败');
            }
            
            const data = await response.json();
            this.showToast('协作者添加成功');
            
            // 清空输入
            userIdInput.value = '';
            document.getElementById('collabModal').classList.remove('show');
            
            // 重新加载列表
            await this.loadCollaborators();
            
        } catch (error) {
            console.error('添加协作者失败:', error);
            alert('添加失败: ' + error.message);
        }
    }
    
    async removeCollaborator(userId) {
        if (!confirm('确定要移除这个协作者吗？')) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/articles/${this.articleId}/collaborators/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('移除失败');
            }
            
            this.showToast('协作者已移除');
            await this.loadCollaborators();
            
        } catch (error) {
            console.error('移除协作者失败:', error);
            alert('移除失败');
        }
    }
    
    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #333;
            color: #fff;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 3000;
            font-size: 14px;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 2000);
    }
    
    cleanup() {
        // 停止锁续期
        if (this.editLockInterval) {
            clearInterval(this.editLockInterval);
            this.editLockInterval = null;
        }
        
        // 释放编辑锁
        this.releaseEditLock();
        
        // 销毁编辑器
        if (this.mdEditor) {
            this.mdEditor.destroy();
        }
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new EnhancedArticleEditor();
});

// 导出供其他模块使用
window.EnhancedArticleEditor = EnhancedArticleEditor;
