const WechatArticle = {
    state: {
        isFollowed: false,
        isLiked: false,
        isDisliked: false,
        isCollected: false,
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
        this.initReadingProgress();
        this.applyFontClass();
    },

    bindEvents() {
        const $ = (sel) => document.querySelector(sel);
        const $$ = (sel) => document.querySelectorAll(sel);

        const backBtn = $('.back-btn');
        const moreBtn = $('.more-btn');
        const followBtn = $('#follow-btn');
        const actionBtns = $$('.action-btn');
        const shareBtn = $('#share-btn');
        const collectBtn = $('#collect-btn');
        const navIconBtns = $$('.nav-icon-btn');
        const navActionBtn = $('.nav-action-btn');
        const closeBtn = $('.close-btn');
        const fontBtns = $$('.font-btn');
        const toggleSwitch = $('.toggle-switch');
        const cancelComment = $('.cancel-comment');
        const submitComment = $('.submit-comment');
        const modalOverlay = $('.modal-overlay');
        const sheetOverlay = $('.sheet-overlay');
        const sheetCancel = $('.sheet-cancel');

        if (backBtn) {
            backBtn.addEventListener('click', () => this.goBack());
        }

        if (moreBtn) {
            moreBtn.addEventListener('click', () => this.showMoreOptions());
        }

        if (followBtn) {
            followBtn.addEventListener('click', () => this.toggleFollow());
        }

        actionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                if (action === 'like') this.handleVote('like');
                else if (action === 'dislike') this.handleVote('dislike');
            });
        });

        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareArticle());
        }

        if (collectBtn) {
            collectBtn.addEventListener('click', () => this.toggleCollect());
        }

        navIconBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleNavAction(btn));
        });

        if (navActionBtn) {
            navActionBtn.addEventListener('click', () => this.showCommentBox());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideModal());
        }

        if (modalOverlay) {
            modalOverlay.addEventListener('click', () => this.hideModal());
        }

        fontBtns.forEach(btn => {
            btn.addEventListener('click', () => this.changeFontSize(btn));
        });

        if (toggleSwitch) {
            toggleSwitch.addEventListener('click', () => this.toggleNightMode());
        }

        if (cancelComment) {
            cancelComment.addEventListener('click', () => this.hideCommentBox());
        }

        if (submitComment) {
            submitComment.addEventListener('click', () => this.submitComment());
        }

        if (sheetOverlay) {
            sheetOverlay.addEventListener('click', () => this.hideSheet());
        }

        if (sheetCancel) {
            sheetCancel.addEventListener('click', () => this.hideSheet());
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
        this.showSheet([
            { text: '分享文章', action: () => this.shareArticle() },
            { text: '复制链接', action: () => this.copyLink() },
            { text: '收藏文章', action: () => this.toggleCollect() },
            { text: '阅读设置', action: () => this.showSettings() }
        ]);
    },

    showSheet(options) {
        const sheet = document.getElementById('more-options-sheet');
        const container = document.getElementById('sheet-options');
        if (!sheet || !container) return;

        container.innerHTML = '';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'sheet-option';
            btn.textContent = opt.text;
            btn.addEventListener('click', () => {
                this.hideSheet();
                setTimeout(() => opt.action(), 200);
            });
            container.appendChild(btn);
        });

        sheet.classList.remove('hidden');
    },

    hideSheet() {
        const sheet = document.getElementById('more-options-sheet');
        if (sheet) sheet.classList.add('hidden');
    },

    showSettings() {
        const modal = document.getElementById('settings-modal');
        if (modal) modal.classList.remove('hidden');
    },

    hideModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) modal.classList.add('hidden');
    },

    toggleFollow() {
        this.state.isFollowed = !this.state.isFollowed;
        const btn = document.getElementById('follow-btn');
        if (btn) {
            btn.textContent = this.state.isFollowed ? '已关注' : '关注';
            btn.classList.toggle('followed', this.state.isFollowed);
        }
        this.showToast(this.state.isFollowed ? '关注成功' : '已取消关注');
        this.saveUserPreferences();
    },

    handleVote(type) {
        if (type === 'like') {
            this.state.isLiked = !this.state.isLiked;
            if (this.state.isDisliked) {
                this.state.isDisliked = false;
                this.state.dislikeCount--;
                this.updateVoteUI('dislike');
            }
            this.state.likeCount += this.state.isLiked ? 1 : -1;
            this.updateVoteUI('like');
        } else if (type === 'dislike') {
            this.state.isDisliked = !this.state.isDisliked;
            if (this.state.isLiked) {
                this.state.isLiked = false;
                this.state.likeCount--;
                this.updateVoteUI('like');
            }
            this.state.dislikeCount += this.state.isDisliked ? 1 : -1;
            this.updateVoteUI('dislike');
        }

        this.syncNavLike();
        this.saveUserPreferences();
    },

    updateVoteUI(type) {
        const isActive = type === 'like' ? this.state.isLiked : this.state.isDisliked;
        const count = type === 'like' ? this.state.likeCount : this.state.dislikeCount;
        const btn = document.querySelector(`.action-btn.${type}-btn`);
        if (btn) {
            btn.classList.toggle('active', isActive);
            const countEl = btn.querySelector('.action-count');
            if (countEl) {
                countEl.textContent = count > 0 ? count : (type === 'like' ? '赞' : '踩');
            }
        }
    },

    syncNavLike() {
        const navLikeBtn = document.querySelector('.nav-icon-btn[data-action="like"]');
        if (navLikeBtn) {
            navLikeBtn.classList.toggle('active', this.state.isLiked);
        }
    },

    toggleCollect() {
        this.state.isCollected = !this.state.isCollected;
        const btn = document.getElementById('collect-btn');
        const navCollect = document.querySelector('.nav-icon-btn[data-action="collect"]');
        if (btn) {
            btn.classList.toggle('active', this.state.isCollected);
        }
        if (navCollect) {
            navCollect.classList.toggle('active', this.state.isCollected);
        }
        this.showToast(this.state.isCollected ? '已收藏' : '已取消收藏');
    },

    shareArticle() {
        if (navigator.share) {
            navigator.share({
                title: document.getElementById('article-title')?.textContent || '文章',
                text: document.querySelector('meta[name="description"]')?.content || '',
                url: window.location.href
            }).catch(() => this.copyLink());
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

    handleNavAction(btn) {
        const action = btn.dataset.action;
        if (action === 'comment') {
            this.showCommentBox();
        } else if (action === 'like') {
            this.handleVote('like');
        } else if (action === 'collect') {
            this.toggleCollect();
        }
    },

    showCommentBox() {
        const commentBox = document.querySelector('.comment-input-box');
        if (commentBox) {
            commentBox.classList.remove('hidden');
            const textarea = commentBox.querySelector('.comment-textarea');
            if (textarea) textarea.focus();
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
        if (size !== 'medium') {
            document.body.classList.add(`font-${size}`);
        }

        document.querySelectorAll('.font-btn').forEach(fontBtn => {
            fontBtn.classList.toggle('active', fontBtn.dataset.size === size);
        });

        this.saveUserPreferences();
    },

    applyFontClass() {
        document.body.classList.remove('font-small', 'font-medium', 'font-large');
        if (this.state.fontSize !== 'medium') {
            document.body.classList.add(`font-${this.state.fontSize}`);
        }
    },

    toggleNightMode() {
        this.state.nightMode = !this.state.nightMode;
        document.body.classList.toggle('night-mode', this.state.nightMode);

        const toggleSwitch = document.querySelector('.toggle-switch');
        if (toggleSwitch) {
            toggleSwitch.classList.toggle('active', this.state.nightMode);
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
                    this.applyFontClass();
                    document.querySelectorAll('.font-btn').forEach(btn => {
                        btn.classList.toggle('active', btn.dataset.size === prefs.fontSize);
                    });
                }

                if (prefs.nightMode) {
                    this.state.nightMode = prefs.nightMode;
                    document.body.classList.add('night-mode');
                    const toggleSwitch = document.querySelector('.toggle-switch');
                    if (toggleSwitch) toggleSwitch.classList.add('active');
                }

                if (prefs.isFollowed) {
                    this.state.isFollowed = prefs.isFollowed;
                    const btn = document.getElementById('follow-btn');
                    if (btn) {
                        btn.textContent = '已关注';
                        btn.classList.add('followed');
                    }
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

    initReadingProgress() {
        const bar = document.getElementById('reading-progress');
        if (!bar) return;

        const update = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            bar.style.width = Math.min(progress, 100) + '%';
        };

        window.addEventListener('scroll', update, { passive: true });
        update();
    },

    trackReadTime() {
        let isReading = true;
        let readTime = 0;

        setInterval(() => {
            if (isReading) readTime += 1;
        }, 1000);

        document.addEventListener('visibilitychange', () => {
            isReading = !document.hidden;
        });

        window.addEventListener('beforeunload', () => {
            if (readTime > 0) this.sendReadingStats(readTime);
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
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
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
