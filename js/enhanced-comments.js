/**
 * 增强评论系统 - Enhanced Comments System
 * 支持Markdown、表情包、@用户、评论投票、楼中楼等
 */

class EnhancedCommentSystem {
    constructor(options = {}) {
        this.options = {
            apiBaseUrl: options.apiBaseUrl || '/api',
            articleId: options.articleId || null,
            currentUser: options.currentUser || null,
            enableMarkdown: true,
            enableEmoji: true,
            enableMention: true,
            enableVote: true,
            maxDepth: 3,
            pageSize: 20,
            ...options
        };
        
        this.comments = [];
        this.users = new Map();
        this.emojiList = this.initEmojiList();
        this.init();
    }

    /**
     * 初始化表情包
     */
    initEmojiList() {
        return {
            smile: { char: '😊', name: '微笑' },
            laugh: { char: '😂', name: '笑哭' },
            wink: { char: '😉', name: '眨眼' },
            heart: { char: '❤️', name: '爱心' },
            thumbsup: { char: '👍', name: '赞' },
            thumbsdown: { char: '👎', name: '踩' },
            fire: { char: '🔥', name: '火' },
            rocket: { char: '🚀', name: '火箭' },
            clap: { char: '👏', name: '鼓掌' },
            think: { char: '🤔', name: '思考' },
            party: { char: '🎉', name: '庆祝' },
            sad: { char: '😢', name: '悲伤' },
            angry: { char: '😠', name: '生气' },
            surprise: { char: '😮', name: '惊讶' },
            cool: { char: '😎', name: '酷' }
        };
    }

    init() {
        this.injectStyles();
        this.bindGlobalEvents();
    }

    /**
     * 加载评论
     */
    async loadComments(page = 1) {
        try {
            const response = await fetch(
                `${this.options.apiBaseUrl}/articles/${this.options.articleId}/comments?page=${page}&limit=${this.options.pageSize}`
            );

            if (!response.ok) throw new Error('加载评论失败');

            const data = await response.json();
            this.comments = this.buildCommentTree(data.comments);
            
            return {
                comments: this.comments,
                total: data.total,
                page: data.page,
                totalPages: data.totalPages
            };
        } catch (error) {
            console.error('加载评论失败:', error);
            return this.getMockComments();
        }
    }

    /**
     * 构建评论树
     */
    buildCommentTree(comments) {
        const map = new Map();
        const roots = [];

        // 首先创建映射
        comments.forEach(comment => {
            comment.children = [];
            map.set(comment.id, comment);
        });

        // 构建树形结构
        comments.forEach(comment => {
            if (comment.parentId && map.has(comment.parentId)) {
                const parent = map.get(comment.parentId);
                if (parent.children.length < this.options.maxDepth) {
                    parent.children.push(comment);
                }
            } else {
                roots.push(comment);
            }
        });

        return roots;
    }

    /**
     * 提交评论
     */
    async submitComment(content, parentId = null) {
        if (!this.options.currentUser) {
            return { success: false, message: '请先登录' };
        }

        if (!content.trim()) {
            return { success: false, message: '评论内容不能为空' };
        }

        try {
            // 处理@用户
            const mentions = this.extractMentions(content);
            
            // 处理Markdown
            const processedContent = this.options.enableMarkdown 
                ? this.parseMarkdown(content)
                : this.escapeHtml(content);

            const response = await fetch(`${this.options.apiBaseUrl}/articles/${this.options.articleId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({
                    content: processedContent,
                    rawContent: content,
                    parentId,
                    mentions,
                    createdAt: new Date().toISOString()
                })
            });

            if (!response.ok) throw new Error('提交评论失败');

            const comment = await response.json();
            
            // 发送通知给被@的用户
            if (mentions.length > 0) {
                this.notifyMentions(mentions, comment);
            }

            return { success: true, comment };
        } catch (error) {
            console.error('提交评论失败:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * 提取@用户
     */
    extractMentions(content) {
        const mentions = [];
        const regex = /@(\w+)/g;
        let match;
        
        while ((match = regex.exec(content)) !== null) {
            mentions.push(match[1]);
        }
        
        return mentions;
    }

    /**
     * 解析Markdown
     */
    parseMarkdown(text) {
        // 代码块
        text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // 粗体和斜体
        text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
        
        // 链接
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        
        // 图片
        text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="comment-image">');
        
        // 换行
        text = text.replace(/\n/g, '<br>');
        
        // @用户高亮
        text = text.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
        
        return text;
    }

    /**
     * 投票评论
     */
    async voteComment(commentId, type) {
        if (!this.options.currentUser) {
            return { success: false, message: '请先登录' };
        }

        try {
            const response = await fetch(`${this.options.apiBaseUrl}/comments/${commentId}/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({ type }) // 'up' or 'down'
            });

            if (!response.ok) throw new Error('投票失败');

            const result = await response.json();
            return { success: true, ...result };
        } catch (error) {
            console.error('投票失败:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * 删除评论
     */
    async deleteComment(commentId) {
        try {
            const response = await fetch(`${this.options.apiBaseUrl}/comments/${commentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.getToken()}` }
            });

            if (!response.ok) throw new Error('删除失败');

            return { success: true };
        } catch (error) {
            console.error('删除评论失败:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * 举报评论
     */
    async reportComment(commentId, reason) {
        try {
            const response = await fetch(`${this.options.apiBaseUrl}/comments/${commentId}/report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({ reason })
            });

            if (!response.ok) throw new Error('举报失败');

            return { success: true };
        } catch (error) {
            console.error('举报失败:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * 获取模拟评论
     */
    getMockComments() {
        return {
            comments: [
                {
                    id: '1',
                    author: { id: 'u1', name: '张三', avatar: '' },
                    content: '这篇文章写得真好！👍',
                    rawContent: '这篇文章写得真好！:thumbsup:',
                    createdAt: new Date(Date.now() - 3600000).toISOString(),
                    votes: { up: 12, down: 0 },
                    children: [
                        {
                            id: '2',
                            author: { id: 'u2', name: '李四', avatar: '' },
                            content: '同意，@张三 说得对',
                            rawContent: '同意，@张三 说得对',
                            createdAt: new Date(Date.now() - 1800000).toISOString(),
                            votes: { up: 5, down: 0 },
                            parentId: '1',
                            children: []
                        }
                    ]
                },
                {
                    id: '3',
                    author: { id: 'u3', name: '王五', avatar: '' },
                    content: '有个问题想问一下...',
                    rawContent: '有个问题想问一下...',
                    createdAt: new Date(Date.now() - 7200000).toISOString(),
                    votes: { up: 3, down: 1 },
                    children: []
                }
            ],
            total: 3,
            page: 1,
            totalPages: 1
        };
    }

    /**
     * 通知被@的用户
     */
    async notifyMentions(usernames, comment) {
        // 实现通知逻辑
        console.log('通知用户:', usernames);
    }

    getToken() {
        return localStorage.getItem('auth_token') || '';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    injectStyles() {
        if (document.getElementById('enhanced-comments-styles')) return;

        const styles = `
            <style id="enhanced-comments-styles">
                .comments-section {
                    margin-top: 40px;
                    padding: 20px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 12px;
                }

                .comments-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .comments-count {
                    font-size: 18px;
                    color: #fff;
                }

                .comments-sort {
                    display: flex;
                    gap: 10px;
                }

                .sort-btn {
                    background: transparent;
                    border: none;
                    color: #999;
                    cursor: pointer;
                    padding: 5px 10px;
                }

                .sort-btn.active {
                    color: #667eea;
                }

                .comment-form {
                    margin-bottom: 30px;
                }

                .comment-editor {
                    background: rgba(255,255,255,0.1);
                    border-radius: 8px;
                    padding: 15px;
                }

                .comment-textarea {
                    width: 100%;
                    min-height: 100px;
                    background: transparent;
                    border: none;
                    color: #fff;
                    resize: vertical;
                    font-size: 14px;
                    line-height: 1.6;
                }

                .comment-textarea:focus {
                    outline: none;
                }

                .comment-toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 1px solid rgba(255,255,255,0.1);
                }

                .toolbar-left {
                    display: flex;
                    gap: 10px;
                }

                .toolbar-btn {
                    background: transparent;
                    border: none;
                    color: #999;
                    cursor: pointer;
                    padding: 5px;
                    font-size: 18px;
                }

                .toolbar-btn:hover {
                    color: #fff;
                }

                .submit-btn {
                    padding: 8px 20px;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    border: none;
                    border-radius: 6px;
                    color: #fff;
                    cursor: pointer;
                }

                .comment-list {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .comment-item {
                    display: flex;
                    gap: 15px;
                    padding: 15px;
                    background: rgba(255,255,255,0.03);
                    border-radius: 8px;
                }

                .comment-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    font-weight: bold;
                    flex-shrink: 0;
                }

                .comment-content {
                    flex: 1;
                }

                .comment-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 8px;
                }

                .comment-author {
                    font-weight: 600;
                    color: #667eea;
                }

                .comment-date {
                    font-size: 12px;
                    color: #999;
                }

                .comment-body {
                    color: #ccc;
                    line-height: 1.6;
                    margin-bottom: 10px;
                }

                .comment-body code {
                    background: rgba(255,255,255,0.1);
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-family: monospace;
                }

                .comment-body pre {
                    background: rgba(0,0,0,0.3);
                    padding: 10px;
                    border-radius: 6px;
                    overflow-x: auto;
                }

                .mention {
                    color: #667eea;
                    font-weight: 500;
                }

                .comment-actions {
                    display: flex;
                    gap: 15px;
                }

                .action-btn {
                    background: transparent;
                    border: none;
                    color: #999;
                    cursor: pointer;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .action-btn:hover {
                    color: #fff;
                }

                .action-btn.voted-up {
                    color: #52c41a;
                }

                .action-btn.voted-down {
                    color: #ff4d4f;
                }

                .comment-children {
                    margin-left: 55px;
                    margin-top: 15px;
                    padding-left: 15px;
                    border-left: 2px solid rgba(255,255,255,0.1);
                }

                .emoji-picker {
                    position: absolute;
                    background: #2d2d2d;
                    border-radius: 8px;
                    padding: 10px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 5px;
                    z-index: 1000;
                }

                .emoji-item {
                    background: transparent;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 5px;
                    border-radius: 4px;
                }

                .emoji-item:hover {
                    background: rgba(255,255,255,0.1);
                }

                .reply-form {
                    margin-top: 10px;
                    padding: 10px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 6px;
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    bindGlobalEvents() {
        // 点击外部关闭表情选择器
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.emoji-picker') && !e.target.closest('.emoji-btn')) {
                document.querySelectorAll('.emoji-picker').forEach(el => el.remove());
            }
        });
    }
}

/**
 * 评论UI组件
 */
class CommentUI {
    constructor(commentSystem) {
        this.system = commentSystem;
        this.replyingTo = null;
    }

    /**
     * 渲染评论区域
     */
    async render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="comments-section">
                <div class="comments-header">
                    <span class="comments-count">💬 评论加载中...</span>
                    <div class="comments-sort">
                        <button class="sort-btn active" data-sort="newest">最新</button>
                        <button class="sort-btn" data-sort="hottest">最热</button>
                    </div>
                </div>
                
                ${this.system.options.currentUser ? this.renderCommentForm() : this.renderLoginPrompt()}
                
                <div class="comment-list" id="commentList"></div>
            </div>
        `;

        // 加载评论
        const data = await this.system.loadComments();
        this.updateCommentCount(data.total);
        this.renderCommentList(data.comments);
        this.bindEvents();
    }

    /**
     * 渲染评论表单
     */
    renderCommentForm() {
        return `
            <div class="comment-form">
                <div class="comment-editor">
                    <textarea 
                        class="comment-textarea" 
                        id="commentInput"
                        placeholder="写下你的评论...（支持Markdown语法）"
                    ></textarea>
                    <div class="comment-toolbar">
                        <div class="toolbar-left">
                            <button class="toolbar-btn emoji-btn" title="表情">😊</button>
                            <button class="toolbar-btn" title="图片" onclick="commentUI.insertText('![描述](url)')">🖼</button>
                            <button class="toolbar-btn" title="代码" onclick="commentUI.insertText('\`\`\`\n代码\n\`\`\`')">📄</button>
                            <button class="toolbar-btn" title="链接" onclick="commentUI.insertText('[文本](url)')">🔗</button>
                        </div>
                        <button class="submit-btn" onclick="commentUI.submitComment()">发表评论</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染登录提示
     */
    renderLoginPrompt() {
        return `
            <div class="comment-form" style="text-align: center; padding: 30px;">
                <p style="color: #999; margin-bottom: 15px;">登录后即可参与评论</p>
                <a href="login.html" class="submit-btn" style="text-decoration: none; display: inline-block;">立即登录</a>
            </div>
        `;
    }

    /**
     * 渲染评论列表
     */
    renderCommentList(comments, container = document.getElementById('commentList')) {
        if (!container) return;

        container.innerHTML = comments.map(comment => this.renderCommentItem(comment)).join('');
    }

    /**
     * 渲染单个评论
     */
    renderCommentItem(comment, depth = 0) {
        const isOwner = this.system.options.currentUser?.id === comment.author.id;
        const hasVoted = comment.userVote || null;

        return `
            <div class="comment-item" data-id="${comment.id}" style="margin-left: ${depth * 40}px">
                <div class="comment-avatar">
                    ${comment.author.avatar 
                        ? `<img src="${comment.author.avatar}" alt="">` 
                        : comment.author.name.charAt(0).toUpperCase()}
                </div>
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author">${comment.author.name}</span>
                        <span class="comment-date">${this.formatTime(comment.createdAt)}</span>
                    </div>
                    <div class="comment-body">${comment.content}</div>
                    <div class="comment-actions">
                        <button class="action-btn ${hasVoted === 'up' ? 'voted-up' : ''}" 
                                onclick="commentUI.vote('${comment.id}', 'up')">
                            👍 ${comment.votes?.up || 0}
                        </button>
                        <button class="action-btn ${hasVoted === 'down' ? 'voted-down' : ''}" 
                                onclick="commentUI.vote('${comment.id}', 'down')">
                            👎 ${comment.votes?.down || 0}
                        </button>
                        <button class="action-btn" onclick="commentUI.reply('${comment.id}', '${comment.author.name}')">
                            💬 回复
                        </button>
                        ${isOwner ? `
                            <button class="action-btn" onclick="commentUI.delete('${comment.id}')">
                                🗑 删除
                            </button>
                        ` : `
                            <button class="action-btn" onclick="commentUI.report('${comment.id}')">
                                ⚠️ 举报
                            </button>
                        `}
                    </div>
                    <div class="reply-container" id="reply-${comment.id}"></div>
                    ${comment.children?.length > 0 ? `
                        <div class="comment-children">
                            ${comment.children.map(child => this.renderCommentItem(child, depth + 1)).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * 提交评论
     */
    async submitComment() {
        const input = document.getElementById('commentInput');
        const content = input.value.trim();

        if (!content) {
            alert('请输入评论内容');
            return;
        }

        const result = await this.system.submitComment(content, this.replyingTo);

        if (result.success) {
            input.value = '';
            this.replyingTo = null;
            
            // 重新加载评论
            const data = await this.system.loadComments();
            this.renderCommentList(data.comments);
            this.updateCommentCount(data.total);
        } else {
            alert(result.message);
        }
    }

    /**
     * 回复评论
     */
    reply(commentId, authorName) {
        this.replyingTo = commentId;
        
        const replyContainer = document.getElementById(`reply-${commentId}`);
        replyContainer.innerHTML = `
            <div class="reply-form">
                <textarea 
                    class="comment-textarea" 
                    id="replyInput-${commentId}"
                    placeholder="回复 @${authorName}..."
                    style="min-height: 80px; margin-bottom: 10px;"
                >@${authorName} </textarea>
                <div style="text-align: right;">
                    <button class="submit-btn" onclick="commentUI.submitReply('${commentId}')">回复</button>
                    <button class="action-btn" onclick="commentUI.cancelReply('${commentId}')" style="margin-left: 10px;">取消</button>
                </div>
            </div>
        `;
        
        document.getElementById(`replyInput-${commentId}`).focus();
    }

    /**
     * 提交回复
     */
    async submitReply(commentId) {
        const input = document.getElementById(`replyInput-${commentId}`);
        const content = input.value.trim();

        if (!content) return;

        const result = await this.system.submitComment(content, commentId);

        if (result.success) {
            this.cancelReply(commentId);
            const data = await this.system.loadComments();
            this.renderCommentList(data.comments);
        } else {
            alert(result.message);
        }
    }

    /**
     * 取消回复
     */
    cancelReply(commentId) {
        const replyContainer = document.getElementById(`reply-${commentId}`);
        replyContainer.innerHTML = '';
        this.replyingTo = null;
    }

    /**
     * 投票
     */
    async vote(commentId, type) {
        const result = await this.system.voteComment(commentId, type);
        
        if (result.success) {
            // 更新UI
            const btn = document.querySelector(`[data-id="${commentId}"] .action-btn:nth-child(${type === 'up' ? 1 : 2})`);
            if (btn) {
                btn.classList.add(`voted-${type}`);
                const count = parseInt(btn.textContent.match(/\d+/)[0]) + 1;
                btn.innerHTML = `${type === 'up' ? '👍' : '👎'} ${count}`;
            }
        } else {
            alert(result.message);
        }
    }

    /**
     * 删除评论
     */
    async delete(commentId) {
        if (!confirm('确定要删除这条评论吗？')) return;

        const result = await this.system.deleteComment(commentId);

        if (result.success) {
            const data = await this.system.loadComments();
            this.renderCommentList(data.comments);
            this.updateCommentCount(data.total);
        } else {
            alert(result.message);
        }
    }

    /**
     * 举报评论
     */
    async report(commentId) {
        const reason = prompt('请输入举报原因：');
        if (!reason) return;

        const result = await this.system.reportComment(commentId, reason);

        if (result.success) {
            alert('举报已提交，感谢您的反馈');
        } else {
            alert(result.message);
        }
    }

    /**
     * 插入文本到编辑器
     */
    insertText(text) {
        const input = document.getElementById('commentInput');
        const start = input.selectionStart;
        const end = input.selectionEnd;
        
        input.value = input.value.substring(0, start) + text + input.value.substring(end);
        input.focus();
        input.setSelectionRange(start + text.length, start + text.length);
    }

    /**
     * 显示表情选择器
     */
    showEmojiPicker(btn) {
        // 移除已有的选择器
        document.querySelectorAll('.emoji-picker').forEach(el => el.remove());

        const picker = document.createElement('div');
        picker.className = 'emoji-picker';
        picker.innerHTML = Object.entries(this.system.emojiList)
            .map(([key, emoji]) => `
                <button class="emoji-item" title="${emoji.name}" onclick="commentUI.insertEmoji('${emoji.char}')">
                    ${emoji.char}
                </button>
            `).join('');

        const rect = btn.getBoundingClientRect();
        picker.style.left = `${rect.left}px`;
        picker.style.top = `${rect.bottom + 5}px`;

        document.body.appendChild(picker);
    }

    /**
     * 插入表情
     */
    insertEmoji(emoji) {
        const input = document.getElementById('commentInput');
        input.value += emoji;
        input.focus();
    }

    /**
     * 更新评论数量
     */
    updateCommentCount(count) {
        const el = document.querySelector('.comments-count');
        if (el) {
            el.textContent = `💬 ${count} 条评论`;
        }
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 表情按钮
        document.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.addEventListener('click', () => this.showEmojiPicker(btn));
        });

        // 排序按钮
        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const sort = btn.dataset.sort;
                // 重新加载并排序评论
                const data = await this.system.loadComments();
                this.renderCommentList(data.comments);
            });
        });
    }

    /**
     * 格式化时间
     */
    formatTime(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
        
        return date.toLocaleDateString('zh-CN');
    }
}

// 导出
window.EnhancedCommentSystem = EnhancedCommentSystem;
window.CommentUI = CommentUI;
