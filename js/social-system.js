/**
 * 社交系统前端模块
 * 包含：关注、私信、@提及
 */
import { API_BASE_URL } from './api-config.js?v=20260223b';

class SocialSystem {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.init();
    }
    
    init() {
        this.loadUserInfo();
        this.initGlobalComponents();
    }
    
    loadUserInfo() {
        const userJson = localStorage.getItem('current_user') || sessionStorage.getItem('current_user');
        this.currentUser = userJson ? JSON.parse(userJson) : null;
        this.token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    }
    
    // ==================== 关注功能 ====================
    
    async followUser(userId) {
        if (!this.token) {
            this.showLoginModal();
            return false;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/social/follow`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ userId, action: 'follow' })
            });
            
            if (!response.ok) throw new Error('关注失败');
            
            const data = await response.json();
            this.showToast('关注成功');
            return true;
        } catch (error) {
            console.error('关注失败:', error);
            this.showToast('关注失败');
            return false;
        }
    }
    
    async unfollowUser(userId) {
        if (!this.token) return false;
        
        try {
            const response = await fetch(`${API_BASE_URL}/social/follow`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ userId, action: 'unfollow' })
            });
            
            if (!response.ok) throw new Error('取消关注失败');
            
            this.showToast('已取消关注');
            return true;
        } catch (error) {
            console.error('取消关注失败:', error);
            return false;
        }
    }
    
    async checkFollowStatus(userId) {
        if (!this.token) return false;
        
        try {
            const response = await fetch(`${API_BASE_URL}/social/follow/status/${userId}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            const data = await response.json();
            return data.isFollowing;
        } catch (error) {
            return false;
        }
    }
    
    // 创建关注按钮
    createFollowButton(userId, options = {}) {
        const btn = document.createElement('button');
        btn.className = 'follow-btn';
        btn.dataset.userId = userId;
        
        const updateBtn = (isFollowing) => {
            btn.classList.toggle('following', isFollowing);
            btn.innerHTML = isFollowing 
                ? '<span>✓</span> 已关注'
                : '<span>+</span> 关注';
        };
        
        // 检查初始状态
        this.checkFollowStatus(userId).then(updateBtn);
        
        btn.addEventListener('click', async () => {
            const isFollowing = btn.classList.contains('following');
            btn.disabled = true;
            
            if (isFollowing) {
                if (await this.unfollowUser(userId)) {
                    updateBtn(false);
                }
            } else {
                if (await this.followUser(userId)) {
                    updateBtn(true);
                }
            }
            
            btn.disabled = false;
        });
        
        return btn;
    }
    
    // ==================== 私信功能 ====================
    
    async sendMessage(receiverId, content) {
        if (!this.token) {
            this.showLoginModal();
            return null;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/social/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ receiverId, content })
            });
            
            if (!response.ok) throw new Error('发送失败');
            
            return await response.json();
        } catch (error) {
            console.error('发送私信失败:', error);
            this.showToast('发送失败');
            return null;
        }
    }
    
    // 打开私信弹窗
    openMessageModal(userId, userName) {
        if (!this.token) {
            this.showLoginModal();
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'message-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>发送私信给 ${userName}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <textarea class="message-input" placeholder="写点什么..." maxlength="2000"></textarea>
                        <div class="message-actions">
                            <span class="char-count">0/2000</span>
                            <button class="btn-send">发送</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const textarea = modal.querySelector('.message-input');
        const charCount = modal.querySelector('.char-count');
        
        textarea.addEventListener('input', () => {
            charCount.textContent = `${textarea.value.length}/2000`;
        });
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) modal.remove();
        });
        
        modal.querySelector('.btn-send').addEventListener('click', async () => {
            const content = textarea.value.trim();
            if (!content) return;
            
            const result = await this.sendMessage(userId, content);
            if (result) {
                this.showToast('发送成功');
                modal.remove();
            }
        });
    }
    
    // ==================== 提及功能 ====================
    
    // 解析文本中的@提及
    parseMentions(text) {
        const mentionRegex = /@(\w+)/g;
        const mentions = [];
        let match;
        
        while ((match = mentionRegex.exec(text)) !== null) {
            mentions.push({
                username: match[1],
                index: match.index,
                length: match[0].length
            });
        }
        
        return mentions;
    }
    
    // 高亮提及
    highlightMentions(text) {
        return text.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
    }
    
    // 搜索用户（用于@提及自动完成）
    async searchUsers(query) {
        if (!query || query.length < 2) return [];
        
        try {
            const response = await fetch(`${API_BASE_URL}/search/users?q=${encodeURIComponent(query)}`);
            return await response.json();
        } catch (error) {
            return [];
        }
    }
    
    // ==================== 全局组件 ====================
    
    initGlobalComponents() {
        this.injectStyles();
    }
    
    injectStyles() {
        if (document.getElementById('social-system-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'social-system-styles';
        styles.textContent = `
            /* 关注按钮 */
            .follow-btn {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 6px 16px;
                border: 1px solid #667eea;
                background: white;
                color: #667eea;
                border-radius: 20px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s;
            }
            
            .follow-btn:hover {
                background: #f5f5ff;
            }
            
            .follow-btn.following {
                background: #667eea;
                color: white;
            }
            
            .follow-btn.following:hover {
                background: #5a6fd6;
            }
            
            .follow-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
            
            /* 用户卡片 */
            .user-card {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                border-radius: 8px;
                transition: background 0.2s;
            }
            
            .user-card:hover {
                background: #f8f9fa;
            }
            
            .user-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 500;
            }
            
            .user-info {
                flex: 1;
            }
            
            .user-name {
                font-weight: 500;
                color: #333;
            }
            
            .user-meta {
                font-size: 12px;
                color: #999;
            }
            
            /* 私信弹窗 */
            .message-modal .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 3000;
            }
            
            .message-modal .modal-content {
                background: white;
                border-radius: 12px;
                width: 90%;
                max-width: 480px;
                animation: modal-in 0.3s ease;
            }
            
            @keyframes modal-in {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
            
            .message-modal .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid #eee;
            }
            
            .message-modal .modal-header h3 {
                margin: 0;
                font-size: 16px;
            }
            
            .message-modal .modal-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #999;
            }
            
            .message-modal .modal-body {
                padding: 20px;
            }
            
            .message-modal .message-input {
                width: 100%;
                min-height: 120px;
                padding: 12px;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                resize: vertical;
                font-size: 14px;
                line-height: 1.6;
            }
            
            .message-modal .message-actions {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 12px;
            }
            
            .message-modal .char-count {
                font-size: 12px;
                color: #999;
            }
            
            .message-modal .btn-send {
                padding: 8px 24px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
            }
            
            /* 提及高亮 */
            .mention {
                color: #667eea;
                font-weight: 500;
                cursor: pointer;
            }
            
            .mention:hover {
                text-decoration: underline;
            }
            
            /* Toast提示 */
            .social-toast {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #333;
                color: white;
                padding: 10px 20px;
                border-radius: 20px;
                z-index: 4000;
                animation: toast-in 0.3s ease;
            }
            
            @keyframes toast-in {
                from { opacity: 0; transform: translateX(-50%) translateY(20px); }
                to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'social-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }
    
    showLoginModal() {
        // 触发登录弹窗
        if (window.SupabaseAuth) {
            window.SupabaseAuth.showLoginModal();
        } else {
            alert('请先登录');
        }
    }
}

// 导出单例
const socialSystem = new SocialSystem();
export default socialSystem;

// 全局可用
window.SocialSystem = socialSystem;
