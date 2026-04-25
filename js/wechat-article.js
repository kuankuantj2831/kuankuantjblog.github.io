/**
 * 微信公众号文章页面交互脚本
 * 支持手机版和iPad版
 */

const WechatArticle = {
    state: {
        isFollowed: false,
        isLiked: false,
        isDisliked: false,
        fontSize: 'medium',
        nightMode: false,
        readCount: 0,
        likeCount: 128,
        dislikeCount: 5
    },

    init() {
        this.bindEvents();
        this.loadUserPreferences();
        this.trackReadTime();
        this.initLazyImages();
    },

    bindEvents() {
        const elements = {
            backBtn: document.querySelector('.back-btn'),
            moreBtn: document.querySelector('.more-btn'),
            followBtn: document.querySelectorAll('.follow-btn, .follow-btn-small'),
            voteBtns: document.querySelectorAll('.vote-btn'),
            shareBtn: document.querySelector('.share-btn'),
            moreFooterBtn: document.querySelector('.more-footer-btn'),
            navIconBtns: document.querySelectorAll('.nav-icon-btn'),
            navActionBtn: document.querySelector('.nav-action-btn'),
            closeBtn: document.querySelector('.close-btn'),
            fontBtns: document.querySelectorAll('.font-btn'),
            toggleBtn: document.querySelector('[data-toggle="night-mode"]'),
            cancelComment: document.querySelector('.cancel-comment'),
            submitComment: document.querySelector('.submit-comment')
        };

        if (elements.backBtn) {
            elements.backBtn.addEventListener('click', () => this.goBack());
        }

        if (elements.moreBtn) {
            elements.moreBtn.addEventListener('click', () => this.showMoreOptions());
        }

        elements.followBtn.forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleFollow(e.target));
        });

        elements.voteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleVote(e.currentTarget));
        });

        if (elements.shareBtn) {
            elements.shareBtn.addEventListener('click', () => this.shareArticle());
        }

        if (elements.moreFooterBtn) {
            elements.moreFooterBtn.addEventListener('click', () => this.showFooterOptions());
        }

        elements.navIconBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleNavAction(e.currentTarget));
        });

        if (elements.navActionBtn) {
            elements.navActionBtn.addEventListener('click', () => this.showCommentBox());
        }

        if (elements.closeBtn) {
            elements.closeBtn.addEventListener('click', () => this.hideModal());
        }

        elements.fontBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.changeFontSize(e.currentTarget));
        });

        if (elements.toggleBtn) {
            elements.toggleBtn.addEventListener('click', () => this.toggleNightMode());
        }

        if (elements.cancelComment) {
            elements.cancelComment.addEventListener('click', () => this.hideCommentBox());
        }

        if (elements.submitComment) {
            elements.submitComment.addEventListener('click', () => this.submitComment());
        }
    },

    goBack() {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = '/';
        }
    },

    showMoreOptions() {
        this.showModal('更多选项', [
            { text: '分享文章', action: () => this.shareArticle() },
            { text: '复制链接', action: () => this.copyLink() },
            { text: '收藏文章', action: () => this.favoriteArticle() },
            { text: '调整字体', action: () => this.showSettings() }
        ]);
    },

    showFooterOptions() {
        this.showModal('更多', [
            { text: '举报内容', action: () => this.reportContent() },
            { text: '不看此作者', action: 
() => this.blockAuthor() },
            { text: '调整字体', action: () => this.showSettings() }
        ]);
    },

    showModal(title, options) {
        const modal = document.querySelector('.reading-settings') || 
            this.createSettingsModal();
        modal.classList.remove('hidden');
    },

    createSettingsModal() {
        const existingModal = document.querySelector('.reading-settings');
        if (existingModal) return existingModal;

        const modal = document.createElement('div');
        modal.className = 'reading-settings modal';
        modal.innerHTML = `
            <div class="modal-header">
                <h3>阅读设置</h3>
                <button class="close-btn">✕</button>
            </div>
            <div class="modal-body">
                <div class="setting-group">
                    <label>字体大小</label>
                    <div class="font-size-controls">
                        <button class="font-btn" data-size="small">小</button>
                        <button class="font-btn active" data-size="medium">中</button>
                        <button class="font-btn" data-size="large">大</button>
                    </div>
                </div>
                <div class="setting-group">
                    <label>夜间模式</label>
                    <button class="toggle-btn" data-toggle="night-mode">
                        <span class="toggle-icon">🌙</span>
                        <span class="toggle-text">关闭</span>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.close-btn').addEventListener('click', () => this.hideModal());
        
        modal.querySelectorAll('.font-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.changeFontSize(e.currentTarget));
        });
        
        const toggleBtn = modal.querySelector('[data-toggle="night-mode"]');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleNightMode());
        }

        return modal;
    },

    hideModal() {
        const modal = document.querySelector('.reading-settings');
        if (modal) {
            modal.classList.add('hidden');
        }
    },

    showSettings() {
        const modal = this.createSettingsModal();
        modal.classList.remove('hidden');
    },

    toggleFollow(btn) {
        this.state.isFollowed = !this.state.isFollowed;
        
        const followBtns = document.querySelectorAll('.follow-btn, .follow-btn-small');
        followBtns.forEach(followBtn => {
            if (this.state.isFollowed) {
                followBtn.textContent = '已关注';
                followBtn.classList.add('followed');
            } else {
                followBtn.textContent = '关注';
                followBtn.classList.remove('followed');
            }
        });

        this.showToast(this.state.isFollowed ? '关注成功' : '已取消关注');
        this.saveUserPreferences();
    },

    handleVote(btn) {
        const action = btn.dataset.action;
        
        if (action === 'like') {
            this.state.isLiked = !this.state.isLiked;
            if (this.state.isDisliked) {
                this.state.isDisliked = false;
                this.state.dislikeCount--;
                this.updateVoteButton('dislike', false);
            }
            if (this.state.isLiked) {
                this.state.likeCount++;
            } else {
                this.state.likeCount--;
            }
            this.updateVoteButton('like', this.state.isLiked);
        } else if (action === 'dislike') {
            this.state.isDisliked = !this.state.isDisliked;
            if (this.state.isLiked) {
                this.state.isLiked = false;
                this.state.likeCount--;
                this.updateVoteButton('like', false);
            }
            if (this.state.isDisliked) {
                this.state.dislikeCount++;
            } else {
                this.state.dislikeCount--;
            }
            this.updateVoteButton('dislike', this.state.isDisliked);
        }

        this.saveUserPreferences();
    },

    updateVoteButton(type, isActive) {
        const btn = document.querySelector(`.vote-btn.${type}`);
        if (btn) {
            if (isActive) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
            
            const countSpan = btn.querySelector('.vote-count');
            if (countSpan) {
                countSpan.textContent = type === 'like' ? 
                    this.state.likeCount : this.state.dislikeCount;
            }
        }
    },

    shareArticle() {
        if (navigator.share) {
            navigator.share({
                title: '文章标题',
                text: '文章描述',
                url: window.location.href
            }).catch(err => {
                console.log('分享失败:', err);
                this.copyLink();
            });
        } else {
            this.copyLink();
        }
    },

    copyLink() {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(window.location.href)
                .then(() => this.showToast('链接已复制'))
                .catch(() => this.fallbackCopy());
        } else {
            this.fallbackCopy();
        }
    },

    fallbackCopy() {
        const textArea = document.createElement('textarea');
        textArea.value = window.location.href;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            this.showToast('链接已复制');
        } catch (err) {
            this.showToast('复制失败');
        }
        document.body.removeChild(textArea);
    },

    favoriteArticle() {
        this.showToast('已收藏文章');
    },

    reportContent() {
        this.showToast('举报功能开发中');
    },

    blockAuthor() {
        this.showToast('屏蔽功能开发中');
    },

    handleNavAction(btn) {
        const action = btn.dataset.action;
        
        document.querySelectorAll('.nav-icon-btn').forEach(b => {
            b.classList.remove('active');
        });
        btn.classList.add('active');

        if (action === 'comment') {
            this.showCommentBox();
        } else if (action === 'like') {
            const likeBtn = document.querySelector('.vote-btn.like');
            if (likeBtn) {
                this.handleVote(likeBtn);
            }
        }
    },

    showCommentBox() {
        const commentBox = document.querySelector('.comment-input-box');
        if (commentBox) {
            commentBox.classList.remove('hidden');
            const textarea = commentBox.querySelector('.comment-textarea');
            if (textarea) {
                textarea.focus();
            }
        }
    },

    hideCommentBox() {
        const commentBox = document.querySelector('.comment-input-box');
        if (commentBox) {
            commentBox.classList.add('hidden');
        }
    },

    submitComment() {
        const textarea = document.querySelector('.comment-textarea');
        if (textarea && textarea.value.trim()) {
            this.showToast('评论提交成功');
            textarea.value = '';
            this.hideCommentBox();
        } else {
            this.showToast('请输入评论内容');
        }
    },

    changeFontSize(btn) {
        const size = btn.dataset.size;
        this.state.fontSize = size;
        
        document.body.classList.remove('font-small', 'font-medium', 'font-large');
        document.body.classList.add(`font-${size}`);

        document.querySelectorAll('.font-btn').forEach(fontBtn => {
            fontBtn.classList.remove('active');
            if (fontBtn.dataset.size === size) {
                fontBtn.classList.add('active');
            }
        });

        this.saveUserPreferences();
    },

    toggleNightMode() {
        this.state.nightMode = !this.state.nightMode;
        
        document.body.classList.toggle('night-mode', this.state.nightMode);
        
        const toggleBtn = document.querySelector('[data-toggle="night-mode"]');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('.toggle-icon');
            const text = toggleBtn.querySelector('.toggle-text');
            if (icon && text) {
                if (this.state.nightMode) {
                    icon.textContent = '☀️';
                    text.textContent = '开启';
                } else {
                    icon.textContent = '🌙';
                    text.textContent = '关闭';
                }
            }
        }

        this.saveUserPreferences();
    },

    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('wechat-article-prefs');
            if (saved) {
                const prefs = JSON.parse(saved);
                
                if (prefs.fontSize) {
                    this.state.fontSize = prefs.fontSize;
                    document.body.classList.add(`font-${prefs.fontSize}`);
                    
                    document.querySelectorAll('.font-btn').forEach(btn => {
                        btn.classList.remove('active');
                        if (btn.dataset.size === prefs.fontSize) {
                            btn.classList.add('active');
                        }
                    });
                }
                
                if (prefs.nightMode) {
                    this.state.nightMode = prefs.nightMode;
                    document.body.classList.add('night-mode');
                    
                    const toggleBtn = document.querySelector('[data-toggle="night-mode"]');
                    if (toggleBtn) {
                        const icon = toggleBtn.querySelector('.toggle-icon');
                        const text = toggleBtn.querySelector('.toggle-text');
                        if (icon && text) {
                            icon.textContent = '☀️';
                            text.textContent = '开启';
                        }
                    }
                }
                
                if (prefs.isFollowed) {
                    this.state.isFollowed = prefs.isFollowed;
                    document.querySelectorAll('.follow-btn, .follow-btn-small').forEach(btn => {
                        btn.textContent = '已关注';
                        btn.classList.add('followed');
                    });
                }
            }
        } catch (e) {
            console.error('加载用户偏好失败:', e);
        }
    },

    saveUserPreferences() {
        try {
            const prefs = {
                fontSize: this.state.fontSize,
                nightMode: this.state.nightMode,
                isFollowed: this.state.isFollowed
            };
            localStorage.setItem('wechat-article-prefs', JSON.stringify(prefs));
        } catch (e) {
            console.error('保存用户偏好失败:', e);
        }
    },

    trackReadTime() {
        let startTime = Date.now();
        let isReading = true;
        let readTime = 0;

        const trackInterval = setInterval(() => {
            if (isReading) {
                readTime += 1;
            }
        }, 1000);

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                isReading = false;
            } else {
                isReading = true;
                startTime = Date.now();
            }
        });

        window.addEventListener('beforeunload', () => {
            if (readTime > 0) {
                this.sendReadingStats(readTime);
            }
        });
    },

    sendReadingStats(duration) {
        console.log('阅读时长:', duration, '秒');
    },

    initLazyImages() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const src = img.getAttribute('data-src');
                        if (src) {
                            img.src = src;
                            img.removeAttribute('data-src');
                        }
                        observer.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    },

    showToast(message) {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 3000;
            animation: fadeIn 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => WechatArticle.init());
} else {
    WechatArticle.init();
}

window.WechatArticle = WechatArticle;
