/**
 * 文章自动保存模块
 * 每30秒自动保存到本地和云端
 */

class AutoSave {
    constructor(options = {}) {
        this.interval = options.interval || 30000; // 30秒
        this.formId = options.formId || 'articleForm';
        this.storageKey = options.storageKey || 'article_draft';
        this.onSave = options.onSave || (() => {});
        this.timer = null;
        this.lastContent = '';
        this.isSaving = false;
        this.draftId = null;
    }

    /**
     * 初始化自动保存
     */
    init() {
        // 恢复本地草稿
        this.restoreFromLocal();
        
        // 开始定时保存
        this.start();
        
        // 监听输入事件
        this.setupInputListener();
        
        // 页面关闭前保存
        window.addEventListener('beforeunload', () => {
            this.saveImmediately();
        });

        console.log('[AutoSave] 自动保存已启动');
    }

    /**
     * 开始自动保存
     */
    start() {
        if (this.timer) return;
        
        this.timer = setInterval(() => {
            this.save();
        }, this.interval);
    }

    /**
     * 停止自动保存
     */
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    /**
     * 立即保存
     */
    async saveImmediately() {
        this.stop();
        await this.save();
    }

    /**
     * 执行保存
     */
    async save() {
        const draft = this.getDraftData();
        
        // 内容未变化，跳过
        const contentHash = this.hash(JSON.stringify(draft));
        if (contentHash === this.lastContent) {
            return;
        }
        
        if (this.isSaving) return;
        this.isSaving = true;

        try {
            // 1. 保存到本地
            this.saveToLocal(draft);
            
            // 2. 保存到服务器（如果已登录）
            await this.saveToServer(draft);
            
            this.lastContent = contentHash;
            this.showSaveStatus('已保存', 'success');
            this.onSave(draft);
            
        } catch (error) {
            console.error('[AutoSave] 保存失败:', error);
            this.showSaveStatus('保存失败', 'error');
        } finally {
            this.isSaving = false;
        }
    }

    /**
     * 获取草稿数据
     */
    getDraftData() {
        const form = document.getElementById(this.formId);
        if (!form) return null;

        const title = form.querySelector('#articleTitle')?.value || 
                     document.getElementById('articleTitle')?.value || '';
        const content = form.querySelector('#articleContent')?.value || 
                       document.getElementById('articleContent')?.value || '';
        const category = form.querySelector('#articleCategory')?.value || 
                        document.getElementById('articleCategory')?.value || '';

        return {
            id: this.draftId || this.generateId(),
            title,
            content,
            category,
            timestamp: Date.now(),
            autoSaved: true
        };
    }

    /**
     * 保存到本地
     */
    saveToLocal(draft) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(draft));
        } catch (e) {
            console.warn('[AutoSave] 本地存储失败:', e);
        }
    }

    /**
     * 保存到服务器
     */
    async saveToServer(draft) {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const { API_BASE_URL } = await import('./api-config.js?v=20260223b');
            
            const response = await fetch(`${API_BASE_URL}/drafts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(draft)
            });

            if (response.ok) {
                const result = await response.json();
                if (result.id) {
                    this.draftId = result.id;
                }
            }
        } catch (error) {
            // 网络错误，只保存到本地
            console.warn('[AutoSave] 服务器保存失败，已保存到本地');
        }
    }

    /**
     * 从本地恢复
     */
    restoreFromLocal() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const draft = JSON.parse(saved);
                const age = Date.now() - draft.timestamp;
                
                // 只恢复24小时内的草稿
                if (age < 24 * 60 * 60 * 1000) {
                    this.restoreDraft(draft);
                    console.log('[AutoSave] 已恢复草稿');
                } else {
                    localStorage.removeItem(this.storageKey);
                }
            }
        } catch (e) {
            console.error('[AutoSave] 恢复草稿失败:', e);
        }
    }

    /**
     * 恢复草稿到表单
     */
    restoreDraft(draft) {
        const titleEl = document.getElementById('articleTitle');
        const contentEl = document.getElementById('articleContent');
        const categoryEl = document.getElementById('articleCategory');

        if (titleEl && draft.title) titleEl.value = draft.title;
        if (contentEl && draft.content) contentEl.value = draft.content;
        if (categoryEl && draft.category) categoryEl.value = draft.category;

        this.draftId = draft.id;
        
        // 显示恢复提示
        this.showRestoreNotification(draft);
    }

    /**
     * 显示恢复提示
     */
    showRestoreNotification(draft) {
        const time = new Date(draft.timestamp).toLocaleString();
        const div = document.createElement('div');
        div.className = 'auto-save-restore-notification';
        div.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 16px 20px;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(102,126,234,0.3);
                z-index: 9999;
                max-width: 300px;
            ">
                <div style="font-weight: 600; margin-bottom: 8px;">💾 恢复草稿</div>
                <div style="font-size: 13px; opacity: 0.9; margin-bottom: 12px;">
                    发现 ${time} 的自动保存草稿
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="this.closest('.auto-save-restore-notification').remove()" 
                        style="flex: 1; padding: 8px; background: white; color: #667eea; border: none; 
                        border-radius: 6px; cursor: pointer; font-size: 13px;">保留</button>
                    <button onclick="autoSave.clearDraft(); this.closest('.auto-save-restore-notification').remove()" 
                        style="flex: 1; padding: 8px; background: rgba(255,255,255,0.2); color: white; 
                        border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; cursor: pointer; font-size: 13px;">清除</button>
                </div>
            </div>
        `;
        document.body.appendChild(div);

        // 5秒后自动消失
        setTimeout(() => div.remove(), 5000);
    }

    /**
     * 显示保存状态
     */
    showSaveStatus(message, type) {
        const existing = document.querySelector('.auto-save-status');
        if (existing) existing.remove();

        const div = document.createElement('div');
        div.className = 'auto-save-status';
        div.innerHTML = `
            <span style="color: ${type === 'success' ? '#52c41a' : '#ff4d4f'};">${message}</span>
            <span style="color: #999; margin-left: 8px;">${new Date().toLocaleTimeString()}</span>
        `;
        div.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            padding: 10px 16px;
            border-radius: 8px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.1);
            z-index: 9999;
            font-size: 13px;
            animation: fadeInUp 0.3s ease;
        `;

        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3000);
    }

    /**
     * 设置输入监听
     */
    setupInputListener() {
        const form = document.getElementById(this.formId);
        if (!form) return;

        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                // 输入时延迟保存，避免频繁保存
                clearTimeout(this.inputTimer);
                this.inputTimer = setTimeout(() => this.save(), 5000);
            });
        });
    }

    /**
     * 清除草稿
     */
    clearDraft() {
        localStorage.removeItem(this.storageKey);
        this.lastContent = '';
        
        // 清除服务器草稿
        const token = localStorage.getItem('token');
        if (token && this.draftId) {
            import('./api-config.js?v=20260223b').then(({ API_BASE_URL }) => {
                fetch(`${API_BASE_URL}/drafts/${this.draftId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => {});
            });
        }
    }

    /**
     * 生成ID
     */
    generateId() {
        return 'draft_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 哈希函数
     */
    hash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }
}

// 创建全局实例
const autoSave = new AutoSave();

export { AutoSave, autoSave };
export default autoSave;
