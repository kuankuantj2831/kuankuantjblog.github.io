const WechatArticle = {
    state: {
        isFollowed: false,
        isLiked: false,
        isDisliked: false,
        isCollected: false,
        fontSize: 'medium',
        nightMode: false,
        readCount: 0,
        likeCount: 0,
        dislikeCount: 0,
        articleId: null,
        currentUser: null
    },

    getApiBase() {
        const h = location.hostname;
        if (h === 'localhost' || h === '127.0.0.1') {
            return 'http://localhost:9000';
        }
        return 'https://1321178544-65fvlfs2za.ap-beijing.tencentscf.com';
    },

    escapeHtml(str) {
        if (!str || typeof str !== 'string') return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },

    sanitizeUrl(url) {
        if (!url || typeof url !== 'string') return '';
        const s = String(url).trim();
        if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/')) return s;
        return '';
    },

    init() {
        console.log('[WechatArticle] init started');
        try {
            this.initCurrentUser();
            this.bindEvents();
            this.updateUserUI();
            this.loadUserPreferences();
            this.trackReadTime();
            this.initLazyImages();
            this.initReadingProgress();
            this.applyFontClass();
        } catch (e) {
            console.error('[WechatArticle] init error:', e);
        }

        try {
            this.loadArticle();
        } catch (e) {
            console.error('[WechatArticle] loadArticle error:', e);
            this.showError('页面加载出错: ' + (e.message || '未知错误'));
        }

        setTimeout(() => {
            const loading = document.getElementById('loading-state');
            if (loading && loading.style.display !== 'none') {
                console.error('[WechatArticle] timeout - still loading after 12s');
                this.showError('加载超时，请检查网络连接后刷新页面');
            }
        }, 12000);
    },

    initCurrentUser() {
        try {
            const userJson = localStorage.getItem('user');
            if (userJson) {
                const user = JSON.parse(userJson);
                if (user && user.id) this.state.currentUser = user;
            }
        } catch (e) {
            this.state.currentUser = null;
        }
    },

    async loadArticle() {
        const urlParams = new URLSearchParams(window.location.search);
        const articleId = urlParams.get('id');
        const API = this.getApiBase();
        console.log('[WechatArticle] loadArticle, id=', articleId, 'API=', API);

        if (!articleId) {
            this.loadArticleList();
            return;
        }

        this.state.articleId = articleId;

        try {
            let response;
            try {
                const url = `${API}/articles/${encodeURIComponent(articleId)}`;
                console.log('[WechatArticle] fetching:', url);
                response = await fetch(url);
            } catch (networkError) {
                console.error('[WechatArticle] network error:', networkError);
                throw new Error('网络连接失败，请检查网络后重试');
            }

            console.log('[WechatArticle] response status:', response.status);

            if (!response.ok) {
                if (response.status === 404) throw new Error('文章不存在或已被删除');
                throw new Error(`服务器错误 (${response.status})`);
            }

            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                console.error('[WechatArticle] JSON parse error:', parseError);
                throw new Error('服务器返回了无效的数据格式');
            }

            const article = data.data || data;

            if (!article || !article.title) {
                this.showError('文章不存在或已被删除');
                return;
            }

            this.renderArticle(article);
            this.loadInteractions(articleId);
        } catch (error) {
            console.error('[WechatArticle] loadArticle failed:', error);
            this.showError(error.message || '加载失败');
        }
    },

    renderArticle(article) {
        document.getElementById('loading-state').style.display = 'none';
        document.getElementById('article-content').style.display = '';

        const titleEl = document.getElementById('article-title');
        if (titleEl) titleEl.textContent = article.title || '无标题';

        document.title = this.escapeHtml(article.title) + ' - 猫爬架';

        const authorEl = document.getElementById('article-author');
        if (authorEl) authorEl.textContent = article.author_name || '匿名';

        const dateEl = document.getElementById('article-date');
        if (dateEl && article.created_at) {
            try {
                const d = new Date(article.created_at);
                if (!isNaN(d.getTime())) {
                    dateEl.textContent = d.toLocaleDateString('zh-CN');
                }
            } catch (_) {}
        }

        const viewsEl = document.getElementById('article-views');
        if (viewsEl) viewsEl.textContent = (article.view_count || 0) + ' 阅读';

        if (article.author_avatar) {
            const avatarEl = document.getElementById('author-avatar');
            if (avatarEl) {
                avatarEl.style.backgroundImage = `url(${this.sanitizeUrl(article.author_avatar)})`;
                avatarEl.style.backgroundSize = 'cover';
                avatarEl.style.backgroundPosition = 'center';
            }
        }

        if (article.cover_image) {
            const coverDiv = document.getElementById('article-cover');
            const coverImg = document.getElementById('article-cover-img');
            if (coverDiv && coverImg) {
                coverImg.src = this.sanitizeUrl(article.cover_image);
                coverImg.onload = () => coverImg.classList.add('loaded');
                coverDiv.style.display = '';
            }
        }

        const bodyEl = document.getElementById('article-body');
        if (bodyEl) {
            bodyEl.innerHTML = this.renderMarkdown(article.content || '');
        }

        if (article.tags && Array.isArray(article.tags) && article.tags.length > 0) {
            const tagsDiv = document.getElementById('article-tags');
            if (tagsDiv) {
                tagsDiv.style.display = 'flex';
                tagsDiv.innerHTML = article.tags.map(t =>
                    `<span class="tag-item">${this.escapeHtml(t)}</span>`
                ).join('');
            }
        }

        const headerName = document.querySelector('.account-name');
        if (headerName && article.author_name) {
            headerName.textContent = article.author_name;
        }
    },

    renderMarkdown(md) {
        if (!md) return '';

        let html = this.escapeHtml(md);

        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (m, lang, code) => {
            return `<pre><code class="language-${this.escapeHtml(lang)}">${code}</code></pre>`;
        });

        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (m, alt, url) => {
            const safeUrl = this.sanitizeUrl(url);
            return safeUrl ? `<img src="${safeUrl}" alt="${this.escapeHtml(alt)}" loading="lazy">` : '';
        });
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, text, url) => {
            const safeUrl = this.sanitizeUrl(url);
            return safeUrl ? `<a href="${safeUrl}" target="_blank" rel="noopener">${text}</a>` : text;
        });
        html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
        html = html.replace(/^---$/gm, '<hr>');
        html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

        html = html.replace(/\n\n+/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');
        html = '<p>' + html + '</p>';

        html = html.replace(/<p>\s*(<h[1-6]>)/g, '$1');
        html = html.replace(/(<\/h[1-6]>)\s*<\/p>/g, '$1');
        html = html.replace(/<p>\s*(<pre>)/g, '$1');
        html = html.replace(/(<\/pre>)\s*<\/p>/g, '$1');
        html = html.replace(/<p>\s*(<blockquote>)/g, '$1');
        html = html.replace(/(<\/blockquote>)\s*<\/p>/g, '$1');
        html = html.replace(/<p>\s*(<ul>)/g, '$1');
        html = html.replace(/(<\/ul>)\s*<\/p>/g, '$1');
        html = html.replace(/<p>\s*(<hr>)\s*<\/p>/g, '$1');
        html = html.replace(/<p>\s*<\/p>/g, '');

        return html;
    },

    async loadInteractions(articleId) {
        const API = this.getApiBase();
        const currentUser = this.state.currentUser;

        try {
            let url = `${API}/articles/${encodeURIComponent(articleId)}/like`;
            if (currentUser && currentUser.id) {
                url += `?userId=${encodeURIComponent(currentUser.id)}`;
            }
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                this.state.likeCount = data.count || 0;
                this.state.isLiked = !!data.liked;
                this.updateVoteUI('like');
            }
        } catch (e) {
            console.error('加载点赞失败:', e);
        }

        try {
            let url = `${API}/articles/${encodeURIComponent(articleId)}/favorite`;
            if (currentUser && currentUser.id) {
                url += `?userId=${encodeURIComponent(currentUser.id)}`;
            }
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                this.state.isCollected = !!data.favorited;
                if (this.state.isCollected) {
                    const btn = document.getElementById('collect-btn');
                    if (btn) btn.classList.add('active');
                    const navBtn = document.querySelector('.nav-icon-btn[data-action="collect"]');
                    if (navBtn) navBtn.classList.add('active');
                }
            }
        } catch (e) {
            console.error('加载收藏失败:', e);
        }
    },

    showError(message) {
        const loading = document.getElementById('loading-state');
        if (loading) loading.style.display = 'none';
        const errorEl = document.getElementById('error-state');
        if (errorEl) {
            errorEl.style.display = '';
            const msgEl = document.getElementById('error-message');
            if (msgEl) msgEl.textContent = message;
        }
    },

    _listPage: 1,
    _listAllLoaded: false,

    async loadArticleList(keyword) {
        const loading = document.getElementById('loading-state');
        if (loading) loading.style.display = 'none';

        const listEl = document.getElementById('article-list');
        if (!listEl) {
            console.error('[WechatArticle] article-list element not found');
            this.showError('页面结构异常');
            return;
        }
        listEl.style.display = '';

        const nameEl = document.querySelector('.account-name');
        if (nameEl) nameEl.textContent = '文章列表';
        document.title = '文章列表 - 猫爬架';

        this._listPage = 1;
        this._listAllLoaded = false;
        const container = document.getElementById('list-articles');
        if (container) container.innerHTML = '';

        await this._fetchList(1, keyword);

        const loadMoreBtn = document.getElementById('list-load-more-btn');
        const searchBtn = document.getElementById('list-search-btn');
        const searchInput = document.getElementById('list-search-input');

        if (loadMoreBtn && !loadMoreBtn._bound) {
            loadMoreBtn._bound = true;
            loadMoreBtn.addEventListener('click', () => {
                if (!this._listAllLoaded) {
                    this._fetchList(this._listPage + 1, searchInput ? searchInput.value.trim() : '');
                }
            });
        }

        if (searchBtn && !searchBtn._bound) {
            searchBtn._bound = true;
            searchBtn.addEventListener('click', () => {
                this.loadArticleList(searchInput ? searchInput.value.trim() : '');
            });
        }

        if (searchInput && !searchInput._bound) {
            searchInput._bound = true;
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.loadArticleList(searchInput.value.trim());
                }
            });
        }
    },

    async _fetchList(page, keyword) {
        const API = this.getApiBase();
        const container = document.getElementById('list-articles');
        const loadMoreWrap = document.getElementById('list-load-more');
        if (!container) return;

        const btn = document.getElementById('list-load-more-btn');
        if (btn) { btn.textContent = '加载中...'; btn.disabled = true; }

        try {
            let url;
            if (keyword) {
                url = `${API}/articles/search?q=${encodeURIComponent(keyword)}&page=${page}&limit=10`;
            } else {
                url = `${API}/articles?page=${page}&limit=10`;
            }

            console.log('[WechatArticle] fetching list:', url);
            const res = await fetch(url);
            console.log('[WechatArticle] list response:', res.status);

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            const articles = Array.isArray(data) ? data : (data.data || []);

            if (articles.length === 0 && page === 1) {
                container.innerHTML = '<div class="list-empty">暂无文章</div>';
                if (loadMoreWrap) loadMoreWrap.style.display = 'none';
                return;
            }

            articles.forEach(a => {
                if (!a || !a.id) return;
                const card = document.createElement('a');
                card.className = 'list-article-card';
                card.href = `?id=${encodeURIComponent(a.id)}`;
                card.onclick = (e) => {
                    e.preventDefault();
                    window.location.href = `?id=${encodeURIComponent(a.id)}`;
                };

                const safeTitle = this.escapeHtml(a.title || '无标题');
                const safeCategory = this.escapeHtml(a.category || '');
                const safeAuthor = this.escapeHtml(a.author_name || '匿名');
                const safeSummary = this.escapeHtml(a.summary || '');
                const safeCover = this.sanitizeUrl(a.cover_image || '');
                const views = a.view_count || 0;
                let dateStr = '';
                if (a.created_at) {
                    try { dateStr = new Date(a.created_at).toLocaleDateString('zh-CN'); } catch (_) {}
                }

                const coverHtml = safeCover
                    ? `<div class="list-article-cover"><img src="${safeCover}" alt="" loading="lazy"></div>`
                    : '';

                card.innerHTML = `
                    ${coverHtml}
                    <div class="list-article-info">
                        <div class="list-article-title">${safeTitle}</div>
                        <div class="list-article-meta">
                            ${safeCategory ? `<span>${safeCategory}</span>` : ''}
                            <span>${safeAuthor}</span>
                            <span>${views}阅读</span>
                            ${dateStr ? `<span>${dateStr}</span>` : ''}
                        </div>
                        ${safeSummary ? `<div class="list-article-summary">${safeSummary}</div>` : ''}
                    </div>
                `;

                container.appendChild(card);
            });

            this._listPage = page;
            this._listAllLoaded = articles.length < 10;
            if (loadMoreWrap) loadMoreWrap.style.display = this._listAllLoaded ? 'none' : '';

        } catch (e) {
            console.error('[WechatArticle] 加载文章列表失败:', e);
            if (page === 1) {
                container.innerHTML = `<div class="list-empty">加载失败: ${this.escapeHtml(e.message || '未知错误')}<br><button onclick="location.reload()" style="margin-top:12px;padding:8px 20px;border:none;background:#07c160;color:#fff;border-radius:20px;font-size:14px;">重试</button></div>`;
            }
        } finally {
            if (btn) { btn.textContent = '加载更多'; btn.disabled = false; }
        }
    },

    bindEvents() {
        try {
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

            if (backBtn) backBtn.addEventListener('click', () => this.goBack());
            if (moreBtn) moreBtn.addEventListener('click', () => this.showMoreOptions());
            if (followBtn) followBtn.addEventListener('click', () => this.toggleFollow());

            actionBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    if (action === 'like') this.handleVote('like');
                    else if (action === 'dislike') this.handleVote('dislike');
                });
            });

            if (shareBtn) shareBtn.addEventListener('click', () => this.shareArticle());
            if (collectBtn) collectBtn.addEventListener('click', () => this.toggleCollect());

            navIconBtns.forEach(btn => {
                btn.addEventListener('click', () => this.handleNavAction(btn));
            });

            if (navActionBtn) navActionBtn.addEventListener('click', () => this.showCommentBox());
            if (closeBtn) closeBtn.addEventListener('click', () => this.hideModal());
            if (modalOverlay) modalOverlay.addEventListener('click', () => this.hideModal());

            fontBtns.forEach(btn => {
                btn.addEventListener('click', () => this.changeFontSize(btn));
            });

            if (toggleSwitch) toggleSwitch.addEventListener('click', () => this.toggleNightMode());
            if (cancelComment) cancelComment.addEventListener('click', () => this.hideCommentBox());
            if (submitComment) submitComment.addEventListener('click', () => this.submitComment());
            if (sheetOverlay) sheetOverlay.addEventListener('click', () => this.hideSheet());
            if (sheetCancel) sheetCancel.addEventListener('click', () => this.hideSheet());

            var loginCloseBtn = document.getElementById('login-close-btn');
            var loginOverlay = document.getElementById('login-modal-overlay');
            var loginForm = document.getElementById('login-form');

            if (loginCloseBtn) loginCloseBtn.addEventListener('click', () => this.hideLoginModal());
            if (loginOverlay) loginOverlay.addEventListener('click', () => this.hideLoginModal());
            if (loginForm) loginForm.addEventListener('submit', (e) => { e.preventDefault(); this.handleLogin(); });

            var headerUserBtn = document.getElementById('header-user-btn');
            if (headerUserBtn) headerUserBtn.addEventListener('click', () => {
                if (this.state.currentUser) { this.showUserMenu(); }
                else { this.showLoginModal(); }
            });

            var switchToReg = document.getElementById('switch-to-register');
            var switchToLogin = document.getElementById('switch-to-login');
            var regForm = document.getElementById('register-form');

            if (switchToReg) switchToReg.addEventListener('click', (e) => {
                e.preventDefault();
                if (loginForm) loginForm.style.display = 'none';
                if (regForm) regForm.style.display = '';
                var m = document.querySelector('.modal-header h3');
                if (m) m.textContent = '注册';
            });
            if (switchToLogin) switchToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                if (loginForm) loginForm.style.display = '';
                if (regForm) regForm.style.display = 'none';
                var m = document.querySelector('.modal-header h3');
                if (m) m.textContent = '登录';
            });
            if (regForm) regForm.addEventListener('submit', (e) => { e.preventDefault(); this.handleRegister(); });
        } catch (e) {
            console.error('[WechatArticle] bindEvents error:', e);
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

    showUserMenu() {
        var items = [
            { text: '分享文章', action: () => this.shareArticle() },
            { text: '复制链接', action: () => this.copyLink() },
            { text: '收藏文章', action: () => this.toggleCollect() },
            { text: '阅读设置', action: () => this.showSettings() },
            { text: '退出登录', action: () => this.handleLogout() }
        ];
        this.showSheet(items);
    },

    handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.state.currentUser = null;
        this.state.isLiked = false;
        this.state.isCollected = false;
        this.updateUserUI();

        var likeBtn = document.querySelector('.action-btn.like-btn');
        if (likeBtn) likeBtn.classList.remove('active');
        var likeCount = document.getElementById('like-count');
        if (likeCount) likeCount.textContent = '赞';
        var collectBtn = document.getElementById('collect-btn');
        if (collectBtn) collectBtn.classList.remove('active');

        this.showToast('已退出登录');
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

    showLoginModal() {
        var m = document.getElementById('login-modal');
        if (m) m.classList.remove('hidden');
        var loginForm = document.getElementById('login-form');
        var regForm = document.getElementById('register-form');
        if (loginForm) loginForm.style.display = '';
        if (regForm) regForm.style.display = 'none';
        var errEl = document.getElementById('login-error');
        if (errEl) errEl.classList.add('hidden');
        var mTitle = document.querySelector('.login-modal-content .modal-header h3');
        if (mTitle) mTitle.textContent = '登录';
        var u = document.getElementById('login-username');
        if (u) setTimeout(function(){ u.focus(); }, 100);
    },

    hideLoginModal() {
        var m = document.getElementById('login-modal');
        if (m) m.classList.add('hidden');
    },

    async handleLogin() {
        var usernameEl = document.getElementById('login-username');
        var passwordEl = document.getElementById('login-password');
        var errorEl = document.getElementById('login-error');
        var submitBtn = document.getElementById('login-submit-btn');
        if (!usernameEl || !passwordEl) return;

        var username = usernameEl.value.trim();
        var password = passwordEl.value;

        if (!username || !password) {
            if (errorEl) { errorEl.textContent = '请输入用户名和密码'; errorEl.classList.remove('hidden'); }
            return;
        }

        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '登录中...'; }
        if (errorEl) errorEl.classList.add('hidden');

        var API = this.getApiBase();
        try {
            var res = await fetch(API + '/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username, password: password })
            });
            var data = await res.json();

            if (!res.ok) {
                if (errorEl) { errorEl.textContent = data.message || '登录失败'; errorEl.classList.remove('hidden'); }
                return;
            }

            if (data.token) localStorage.setItem('token', data.token);
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
                this.state.currentUser = data.user;
            }

            this.hideLoginModal();
            this.showToast('登录成功');
            this.updateUserUI();
            usernameEl.value = '';
            passwordEl.value = '';

            if (this.state.articleId) this.loadInteractions(this.state.articleId);

        } catch (e) {
            console.error('[WechatArticle] login error:', e);
            if (errorEl) { errorEl.textContent = '网络错误，请重试'; errorEl.classList.remove('hidden'); }
        } finally {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '登录'; }
        }
    },

    async handleRegister() {
        var usernameEl = document.getElementById('reg-username');
        var emailEl = document.getElementById('reg-email');
        var passwordEl = document.getElementById('reg-password');
        var confirmEl = document.getElementById('reg-confirm');
        var errorEl = document.getElementById('login-error');
        var submitBtn = document.getElementById('reg-submit-btn');
        if (!usernameEl || !emailEl || !passwordEl || !confirmEl) return;

        var username = usernameEl.value.trim();
        var email = emailEl.value.trim();
        var password = passwordEl.value;
        var confirm = confirmEl.value;

        if (!username || !email || !password) {
            if (errorEl) { errorEl.textContent = '请填写所有字段'; errorEl.classList.remove('hidden'); }
            return;
        }
        if (username.length < 3) {
            if (errorEl) { errorEl.textContent = '用户名至少3个字符'; errorEl.classList.remove('hidden'); }
            return;
        }
        if (password.length < 6) {
            if (errorEl) { errorEl.textContent = '密码至少6个字符'; errorEl.classList.remove('hidden'); }
            return;
        }
        if (password !== confirm) {
            if (errorEl) { errorEl.textContent = '两次密码不一致'; errorEl.classList.remove('hidden'); }
            return;
        }

        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '注册中...'; }
        if (errorEl) errorEl.classList.add('hidden');

        var API = this.getApiBase();
        try {
            var res = await fetch(API + '/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username, email: email, password: password })
            });
            var data = await res.json();

            if (!res.ok) {
                if (errorEl) { errorEl.textContent = data.message || '注册失败'; errorEl.classList.remove('hidden'); }
                return;
            }

            if (data.token) localStorage.setItem('token', data.token);
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
                this.state.currentUser = data.user;
            }

            this.hideLoginModal();
            this.showToast('注册成功');
            this.updateUserUI();

            if (this.state.articleId) this.loadInteractions(this.state.articleId);

        } catch (e) {
            console.error('[WechatArticle] register error:', e);
            if (errorEl) { errorEl.textContent = '网络错误，请重试'; errorEl.classList.remove('hidden'); }
        } finally {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '注册'; }
        }
    },

    updateUserUI() {
        var user = this.state.currentUser;
        var btn = document.getElementById('header-user-btn');
        var text = document.getElementById('header-user-text');
        if (btn && text) {
            if (user && user.username) {
                text.textContent = user.username;
                btn.classList.add('logged-in');
            } else {
                text.textContent = '登录';
                btn.classList.remove('logged-in');
            }
        }
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

    async handleVote(type) {
        const API = this.getApiBase();
        const articleId = this.state.articleId;
        const currentUser = this.state.currentUser;

        if (type === 'like') {
            if (!currentUser || !currentUser.id) {
                this.showLoginModal();
                return;
            }
            if (!articleId) {
                this.showToast('请先打开一篇文章');
                return;
            }
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API}/articles/${encodeURIComponent(articleId)}/like`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ userId: currentUser.id })
                });
                if (res.ok) {
                    const data = await res.json();
                    this.state.isLiked = !!data.liked;
                    this.state.likeCount = data.count || 0;
                    this.updateVoteUI('like');
                    this.syncNavLike();
                }
            } catch (e) {
                console.error('点赞失败:', e);
                this.showToast('操作失败');
            }
        } else if (type === 'dislike') {
            this.state.isDisliked = !this.state.isDisliked;
            this.state.dislikeCount += this.state.isDisliked ? 1 : -1;
            this.updateVoteUI('dislike');
        }

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
        if (navLikeBtn) navLikeBtn.classList.toggle('active', this.state.isLiked);
    },

    async toggleCollect() {
        const currentUser = this.state.currentUser;
        if (!currentUser || !currentUser.id) {
            this.showLoginModal();
            return;
        }

        const API = this.getApiBase();
        const articleId = this.state.articleId;
        if (!articleId) {
            this.showToast('请先打开一篇文章');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/articles/${encodeURIComponent(articleId)}/favorite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userId: currentUser.id })
            });
            if (res.ok) {
                const data = await res.json();
                this.state.isCollected = !!data.favorited;
                const btn = document.getElementById('collect-btn');
                const navBtn = document.querySelector('.nav-icon-btn[data-action="collect"]');
                if (btn) btn.classList.toggle('active', this.state.isCollected);
                if (navBtn) navBtn.classList.toggle('active', this.state.isCollected);
                this.showToast(this.state.isCollected ? '已收藏' : '已取消收藏');
            }
        } catch (e) {
            console.error('收藏失败:', e);
            this.showToast('操作失败');
        }
    },

    shareArticle() {
        if (navigator.share) {
            navigator.share({
                title: document.getElementById('article-title')?.textContent || '文章',
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
        if (action === 'comment') this.showCommentBox();
        else if (action === 'like') this.handleVote('like');
        else if (action === 'collect') this.toggleCollect();
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
        if (commentBox) commentBox.classList.add('hidden');
    },

    submitComment() {
        if (!this.state.currentUser) {
            this.showLoginModal();
            return;
        }

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
        if (toggleSwitch) toggleSwitch.classList.toggle('active', this.state.nightMode);

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
        try {
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
        } catch (e) {
            console.error('[WechatArticle] initReadingProgress error:', e);
        }
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
        try {
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
        } catch (e) {
            console.error('[WechatArticle] initLazyImages error:', e);
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

try {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => WechatArticle.init());
    } else {
        WechatArticle.init();
    }
    window.WechatArticle = WechatArticle;
} catch (e) {
    console.error('[WechatArticle] fatal error:', e);
    document.getElementById('loading-state') && (document.getElementById('loading-state').style.display = 'none');
    const err = document.getElementById('error-state');
    if (err) {
        err.style.display = '';
        const msg = document.getElementById('error-message');
        if (msg) msg.textContent = '页面初始化失败: ' + (e.message || '');
    }
}
