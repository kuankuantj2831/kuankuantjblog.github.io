/**
 * 社区圈子 / 话题板块系统
 * 类似贴吧/豆瓣小组，用户可以加入圈子，在圈子内发帖讨论
 */

const CommunityCircles = {
    STORAGE_KEY: 'community_circles',
    USER_CIRCLES_KEY: 'user_joined_circles',

    /**
     * 获取所有圈子数据
     */
    getCircles() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) return JSON.parse(data);
        } catch (e) {
            console.error('读取圈子数据失败:', e);
        }
        
        // 默认圈子数据
        const defaultCircles = [
            {
                id: 'programming',
                name: '编程技术',
                icon: '💻',
                description: '分享编程经验、技术文章、开源项目推荐',
                color: '#4a90d9',
                postCount: 0,
                memberCount: 1,
                createdAt: new Date().toISOString()
            },
            {
                id: 'gaming',
                name: '游戏讨论',
                icon: '🎮',
                description: '游戏攻略、心得分享、组队开黑',
                color: '#e74c3c',
                postCount: 0,
                memberCount: 1,
                createdAt: new Date().toISOString()
            },
            {
                id: 'creative',
                name: '创作分享',
                icon: '🎨',
                description: '原创作品、设计灵感、创作技巧交流',
                color: '#9b59b6',
                postCount: 0,
                memberCount: 1,
                createdAt: new Date().toISOString()
            },
            {
                id: 'lifestyle',
                name: '生活杂谈',
                icon: '☕',
                description: '日常分享、美食旅行、生活感悟',
                color: '#27ae60',
                postCount: 0,
                memberCount: 1,
                createdAt: new Date().toISOString()
            },
            {
                id: 'study',
                name: '学习交流',
                icon: '📚',
                description: '学习资源分享、笔记整理、知识讨论',
                color: '#f39c12',
                postCount: 0,
                memberCount: 1,
                createdAt: new Date().toISOString()
            },
            {
                id: 'resources',
                name: '资源分享',
                icon: '📦',
                description: '软件工具、电子书、学习资料共享',
                color: '#1abc9c',
                postCount: 0,
                memberCount: 1,
                createdAt: new Date().toISOString()
            }
        ];
        
        this.saveCircles(defaultCircles);
        return defaultCircles;
    },

    /**
     * 保存圈子数据
     */
    saveCircles(circles) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(circles));
        } catch (e) {
            console.error('保存圈子数据失败:', e);
        }
    },

    /**
     * 获取用户加入的圈子
     */
    getUserCircles() {
        try {
            const data = localStorage.getItem(this.USER_CIRCLES_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },

    /**
     * 加入圈子
     */
    joinCircle(circleId) {
        const userCircles = this.getUserCircles();
        if (!userCircles.includes(circleId)) {
            userCircles.push(circleId);
            localStorage.setItem(this.USER_CIRCLES_KEY, JSON.stringify(userCircles));
            
            // 更新圈子成员数
            const circles = this.getCircles();
            const circle = circles.find(c => c.id === circleId);
            if (circle) {
                circle.memberCount = (circle.memberCount || 0) + 1;
                this.saveCircles(circles);
            }
            
            return true;
        }
        return false;
    },

    /**
     * 退出圈子
     */
    leaveCircle(circleId) {
        let userCircles = this.getUserCircles();
        userCircles = userCircles.filter(id => id !== circleId);
        localStorage.setItem(this.USER_CIRCLES_KEY, JSON.stringify(userCircles));
        
        // 更新圈子成员数
        const circles = this.getCircles();
        const circle = circles.find(c => c.id === circleId);
        if (circle && circle.memberCount > 0) {
            circle.memberCount--;
            this.saveCircles(circles);
        }
        
        return true;
    },

    /**
     * 检查是否已加入圈子
     */
    isJoined(circleId) {
        return this.getUserCircles().includes(circleId);
    },

    /**
     * 获取圈子帖子
     */
    getCirclePosts(circleId) {
        try {
            const key = `circle_posts_${circleId}`;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },

    /**
     * 发布帖子到圈子
     */
    postToCircle(circleId, post) {
        const posts = this.getCirclePosts(circleId);
        const newPost = {
            id: Date.now().toString(),
            title: post.title,
            content: post.content,
            author: post.author || '匿名用户',
            authorId: post.authorId,
            createdAt: new Date().toISOString(),
            likes: 0,
            comments: 0,
            views: 0
        };
        
        posts.unshift(newPost);
        
        // 只保留最近100条
        if (posts.length > 100) {
            posts.splice(100);
        }
        
        localStorage.setItem(`circle_posts_${circleId}`, JSON.stringify(posts));
        
        // 更新圈子帖子数
        const circles = this.getCircles();
        const circle = circles.find(c => c.id === circleId);
        if (circle) {
            circle.postCount = posts.length;
            this.saveCircles(circles);
        }
        
        return newPost;
    },

    /**
     * 渲染圈子列表
     */
    renderCircles(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const circles = this.getCircles();
        const showJoinButton = options.showJoinButton !== false;
        const limit = options.limit || circles.length;
        
        const displayCircles = circles.slice(0, limit);
        
        const html = displayCircles.map(circle => {
            const isJoined = this.isJoined(circle.id);
            return `
                <div class="circle-card" style="
                    background: linear-gradient(135deg, ${circle.color}15 0%, ${circle.color}05 100%);
                    border: 1px solid ${circle.color}30;
                    border-radius: 12px;
                    padding: 20px;
                    transition: all 0.3s ease;
                    cursor: pointer;
                " onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 24px ${circle.color}30'" 
                   onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='none'"
                   onclick="CommunityCircles.openCircle('${circle.id}')">
                    <div style="display:flex;align-items:center;margin-bottom:12px;">
                        <span style="font-size:40px;margin-right:15px;">${circle.icon}</span>
                        <div style="flex:1;">
                            <h3 style="margin:0 0 4px 0;color:${circle.color};font-size:18px;">${circle.name}</h3>
                            <div style="font-size:12px;color:#999;">
                                <span>${circle.memberCount} 成员</span> · 
                                <span>${circle.postCount} 帖子</span>
                            </div>
                        </div>
                    </div>
                    <p style="margin:0 0 15px 0;color:#666;font-size:14px;line-height:1.5;">${circle.description}</p>
                    ${showJoinButton ? `
                        <button onclick="event.stopPropagation();CommunityCircles.toggleJoin('${circle.id}', this)" 
                                style="
                                    width:100%;
                                    padding:8px;
                                    border-radius:6px;
                                    border:none;
                                    cursor:pointer;
                                    font-size:13px;
                                    transition:all 0.2s;
                                    background:${isJoined ? '#f0f0f0' : circle.color};
                                    color:${isJoined ? '#666' : '#fff'};
                                ">
                            ${isJoined ? '已加入' : '+ 加入圈子'}
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');
        
        container.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:20px;">
                ${html}
            </div>
        `;
    },

    /**
     * 切换加入/退出圈子
     */
    toggleJoin(circleId, btn) {
        const isJoined = this.isJoined(circleId);
        const circle = this.getCircles().find(c => c.id === circleId);
        
        if (isJoined) {
            if (confirm('确定要退出这个圈子吗？')) {
                this.leaveCircle(circleId);
                btn.textContent = '+ 加入圈子';
                btn.style.background = circle.color;
                btn.style.color = '#fff';
                this.showToast('已退出圈子');
            }
        } else {
            this.joinCircle(circleId);
            btn.textContent = '已加入';
            btn.style.background = '#f0f0f0';
            btn.style.color = '#666';
            this.showToast('成功加入圈子！');
        }
        
        // 刷新显示
        setTimeout(() => this.renderCircles('circlesContainer'), 100);
    },

    /**
     * 打开圈子详情
     */
    openCircle(circleId) {
        const circle = this.getCircles().find(c => c.id === circleId);
        if (!circle) return;
        
        // 创建模态框
        this.showCircleModal(circle);
    },

    /**
     * 显示圈子详情模态框
     */
    showCircleModal(circle) {
        // 移除已存在的模态框
        const existing = document.getElementById('circleModal');
        if (existing) existing.remove();
        
        const posts = this.getCirclePosts(circle.id);
        const isJoined = this.isJoined(circle.id);
        
        const modal = document.createElement('div');
        modal.id = 'circleModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="
                background: #fff;
                border-radius: 16px;
                width: 100%;
                max-width: 700px;
                max-height: 80vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                animation: fadeIn 0.3s ease;
            ">
                <!-- 头部 -->
                <div style="
                    background: linear-gradient(135deg, ${circle.color} 0%, ${circle.color}dd 100%);
                    color: #fff;
                    padding: 25px;
                    position: relative;
                ">
                    <button onclick="document.getElementById('circleModal').remove()" style="
                        position: absolute;
                        top: 15px;
                        right: 15px;
                        background: rgba(255,255,255,0.2);
                        border: none;
                        color: #fff;
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        cursor: pointer;
                        font-size: 18px;
                    ">×</button>
                    
                    <div style="display:flex;align-items:center;">
                        <span style="font-size:60px;margin-right:20px;">${circle.icon}</span>
                        <div style="flex:1;">
                            <h2 style="margin:0 0 8px 0;font-size:24px;">${circle.name}</h2>
                            <p style="margin:0;opacity:0.9;font-size:14px;">${circle.description}</p>
                            <div style="margin-top:10px;font-size:13px;opacity:0.8;">
                                ${circle.memberCount} 成员 · ${circle.postCount} 帖子
                            </div>
                        </div>
                        <button onclick="CommunityCircles.toggleJoinFromModal('${circle.id}')" id="modalJoinBtn" style="
                            padding: 10px 25px;
                            border-radius: 20px;
                            border: 2px solid #fff;
                            background: ${isJoined ? 'rgba(255,255,255,0.2)' : '#fff'};
                            color: ${isJoined ? '#fff' : circle.color};
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: bold;
                        ">
                            ${isJoined ? '已加入' : '+ 加入'}
                        </button>
                    </div>
                </div>
                
                <!-- 发帖按钮 -->
                ${isJoined ? `
                    <div style="padding: 15px 25px;border-bottom:1px solid #eee;">
                        <button onclick="CommunityCircles.showPostForm('${circle.id}')" style="
                            width: 100%;
                            padding: 12px;
                            background: #f8f9fa;
                            border: 1px dashed #ddd;
                            border-radius: 8px;
                            color: #666;
                            cursor: pointer;
                            text-align: left;
                        ">
                            ✏️ 分享你的想法...
                        </button>
                    </div>
                ` : ''}
                
                <!-- 帖子列表 -->
                <div style="flex:1;overflow-y:auto;padding:0;">
                    ${posts.length === 0 ? `
                        <div style="text-align:center;padding:60px 20px;color:#999;">
                            <div style="font-size:48px;margin-bottom:15px;">📝</div>
                            <p>还没有帖子，快来发表第一条吧！</p>
                        </div>
                    ` : `
                        <div style="padding: 20px;">
                            ${posts.map(post => `
                                <div style="
                                    padding: 20px;
                                    border-bottom: 1px solid #f0f0f0;
                                    transition: background 0.2s;
                                " onmouseover="this.style.background='#f9f9f9'" onmouseout="this.style.background='transparent'">
                                    <h4 style="margin:0 0 10px 0;color:#333;font-size:16px;">${this.escapeHtml(post.title)}</h4>
                                    <p style="margin:0 0 12px 0;color:#666;font-size:14px;line-height:1.6;">
                                        ${this.escapeHtml(post.content.substring(0, 150))}${post.content.length > 150 ? '...' : ''}
                                    </p>
                                    <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#999;">
                                        <span>@${this.escapeHtml(post.author)} · ${this.formatTime(post.createdAt)}</span>
                                        <span>
                                            <span style="margin-right:15px;">👍 ${post.likes}</span>
                                            <span>💬 ${post.comments}</span>
                                        </span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
        
        // 点击背景关闭
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
        
        document.body.appendChild(modal);
    },

    /**
     * 在模态框中切换加入状态
     */
    toggleJoinFromModal(circleId) {
        const isJoined = this.isJoined(circleId);
        const circle = this.getCircles().find(c => c.id === circleId);
        const btn = document.getElementById('modalJoinBtn');
        
        if (isJoined) {
            this.leaveCircle(circleId);
            if (btn) {
                btn.textContent = '+ 加入';
                btn.style.background = '#fff';
                btn.style.color = circle.color;
            }
        } else {
            this.joinCircle(circleId);
            if (btn) {
                btn.textContent = '已加入';
                btn.style.background = 'rgba(255,255,255,0.2)';
                btn.style.color = '#fff';
            }
        }
        
        // 刷新帖子列表显示发帖按钮
        this.showCircleModal(circle);
    },

    /**
     * 显示发帖表单
     */
    showPostForm(circleId) {
        const circle = this.getCircles().find(c => c.id === circleId);
        
        const formHtml = `
            <div id="postFormOverlay" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            ">
                <div style="
                    background: #fff;
                    border-radius: 12px;
                    width: 100%;
                    max-width: 500px;
                    padding: 25px;
                    animation: fadeIn 0.3s ease;
                ">
                    <h3 style="margin:0 0 20px 0;color:${circle.color};">
                        ${circle.icon} 发布到 ${circle.name}
                    </h3>
                    <input type="text" id="postTitle" placeholder="标题（可选）" style="
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        margin-bottom: 15px;
                        font-size: 14px;
                        box-sizing: border-box;
                    ">
                    <textarea id="postContent" placeholder="分享你的想法..." rows="5" style="
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        resize: vertical;
                        font-size: 14px;
                        box-sizing: border-box;
                        margin-bottom: 15px;
                    "></textarea>
                    <div style="display:flex;gap:10px;justify-content:flex-end;">
                        <button onclick="document.getElementById('postFormOverlay').remove()" style="
                            padding: 10px 20px;
                            background: #f0f0f0;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                        ">取消</button>
                        <button onclick="CommunityCircles.submitPost('${circleId}')" style="
                            padding: 10px 20px;
                            background: ${circle.color};
                            color: #fff;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                        ">发布</button>
                    </div>
                </div>
            </div>
        `;
        
        const existing = document.getElementById('postFormOverlay');
        if (existing) existing.remove();
        
        document.body.insertAdjacentHTML('beforeend', formHtml);
    },

    /**
     * 提交帖子
     */
    submitPost(circleId) {
        const titleInput = document.getElementById('postTitle');
        const contentInput = document.getElementById('postContent');
        
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        
        if (!content) {
            alert('请输入内容');
            return;
        }
        
        // 获取当前用户信息
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        this.postToCircle(circleId, {
            title: title || '无标题',
            content: content,
            author: user.username || '匿名用户',
            authorId: user.id
        });
        
        document.getElementById('postFormOverlay').remove();
        this.showToast('发布成功！');
        
        // 刷新圈子详情
        const circle = this.getCircles().find(c => c.id === circleId);
        setTimeout(() => this.showCircleModal(circle), 300);
    },

    /**
     * HTML转义
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * 格式化时间
     */
    formatTime(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
        
        return date.toLocaleDateString('zh-CN');
    },

    /**
     * 显示提示
     */
    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: #fff;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 14px;
            z-index: 99999;
            animation: fadeInUp 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    },

    /**
     * 初始化
     */
    init() {
        // 添加样式
        if (!document.getElementById('community-circles-style')) {
            const style = document.createElement('style');
            style.id = 'community-circles-style';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translate(-50%, 20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                .circle-card:hover {
                    transform: translateY(-4px);
                }
            `;
            document.head.appendChild(style);
        }
    }
};

// 导出到全局
window.CommunityCircles = CommunityCircles;

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    CommunityCircles.init();
});
