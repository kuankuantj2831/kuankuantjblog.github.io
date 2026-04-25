/**
 * 模块集成加载器 v2 — 性能优化版
 * - 三级优先级调度: critical → idle → lazy
 * - requestIdleCallback 延迟非关键模块
 * - IntersectionObserver 按需加载
 * - 去重防重复加载
 * - 错误隔离，单模块失败不影响其他
 */

const ModuleLoader = {
    loaded: new Set(),
    _queue: [],

    getPageType() {
        const p = window.location.pathname;
        if (p.endsWith('/article.html') || /\/\d{4}\/\d{2}\//.test(p)) return 'article';
        if (p.endsWith('/profile.html')) return 'profile';
        if (p.endsWith('/index.html') || p.endsWith('/index-chinese.html') || p === '/' || p === '/index.html') return 'home';
        if (p.endsWith('/articles.html')) return 'articles';
        if (p.endsWith('/tags.html')) return 'tags';
        if (p.endsWith('/analytics-dashboard.html')) return 'analytics';
        if (p.endsWith('/following.html')) return 'following';
        if (p.endsWith('/messages.html')) return 'messages';
        if (p.endsWith('/entertainment.html')) return 'entertainment';
        return 'other';
    },

    async loadModuleES(src) {
        if (this.loaded.has(src)) return null;
        this.loaded.add(src);
        try {
            return await import(src);
        } catch (e) {
            console.warn('[ML] 模块加载失败:', src.split('?')[0]);
            return null;
        }
    },

    async loadScript(src) {
        if (this.loaded.has(src)) return;
        this.loaded.add(src);
        return new Promise((resolve) => {
            const s = document.createElement('script');
            s.src = src;
            s.defer = true;
            s.onload = resolve;
            s.onerror = () => { console.warn('[ML] 脚本加载失败:', src.split('?')[0]); resolve(); };
            document.body.appendChild(s);
        });
    },

    scheduleIdle(fn) {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(fn, { timeout: 4000 });
        } else {
            setTimeout(fn, 300);
        }
    },

    async initPerformanceModules() {
        try {
            await this.loadModuleES('./js/performance-optimizer.js?v=20260425');
            await this.loadModuleES('./js/resource-prefetcher.js?v=20260425');
            await this.loadModuleES('./js/resource-optimizer.js?v=20260425');
        } catch (e) {
            console.warn('[ML] 性能优化模块加载失败:', e);
        }
    },

    async initAll() {
        const page = this.getPageType();
        const token = localStorage.getItem('token');
        const loggedIn = !!token;

        // 首先初始化性能优化模块
        await this.initPerformanceModules();

        // ========== Tier 1: 关键模块 — DOMContentLoaded 后立即加载 ==========
        const critical = [];

        // 主题系统 — 影响首屏渲染，必须最先加载
        critical.push(this.loadModuleES('./js/theme-system.js?v=20260425').then(m => {
            if (window.themeSystem) {
                window.themeSystem.loadCustomThemes();
                if (window.ThemeUI) window.themeUI = new window.ThemeUI(window.themeSystem);
            }
        }));

        // i18n — 影响文本显示
        critical.push(this.loadModuleES('./js/i18n.js?v=20260425'));

        // ========== Tier 2: 交互模块 — 空闲时加载 ==========
        this.scheduleIdle(() => {
            const idle = [];

            // 分析系统 — 纯后台采集，低优先
            idle.push(this.loadModuleES('./js/analytics-system.js?v=20260425'));

            // 社交系统
            idle.push(this.loadModuleES('./js/social-system.js?v=20260425'));

            // GitHub 登录
            idle.push(this.loadScript('./js/github-login.js?v=20260425'));

            // 通知中心 — 仅登录用户
            if (loggedIn) {
                idle.push(this.loadModuleES('./js/notification-center.js?v=20260425').then(() => {
                    if (!window.NotificationCenter || !window.NotificationUI) return;
                    const userId = JSON.parse(localStorage.getItem('user') || '{}').id || 'anonymous';
                    const nc = new window.NotificationCenter({ userId });
                    window.notificationCenter = nc;
                    const nui = new window.NotificationUI(nc);
                    window.notificationUI = nui;
                    const bell = document.getElementById('notificationBellContainer');
                    if (bell) { nui.renderBell('notificationBellContainer'); return; }
                    const nav = document.querySelector('nav, .nav, .top-nav, header');
                    if (nav) {
                        const d = document.createElement('div');
                        d.id = 'notificationBellContainer';
                        d.style.cssText = 'display:inline-block;margin-left:12px;';
                        nav.appendChild(d);
                        nui.renderBell('notificationBellContainer');
                    }
                }));

                // 游戏化
                idle.push(this.loadModuleES('./js/gamification.js?v=20260425'));
            }

            // ========== Tier 3: 页面专属模块 — 按需加载 ==========
            if (page === 'article') {
                idle.push(this.loadModuleES('./js/danmaku-comments.js?v=20260425').then(() => {
                    if (!window.DanmakuComments) return;
                    const aid = new URLSearchParams(location.search).get('id') || 'default';
                    const dc = new window.DanmakuComments({ articleId: aid });
                    dc.init();
                    window.danmakuComments = dc;
                }));

                idle.push(this.loadModuleES('./js/reading-enhancement.js?v=20260425').then(() => {
                    if (window.ReadingEnhancement) window.readingEnhancement = new window.ReadingEnhancement();
                }));

                idle.push(this.loadModuleES('./js/offline-reader.js?v=20260425'));

                idle.push(this.loadModuleES('./js/content-export.js?v=20260425').then(() => {
                    if (!window.ContentExportSystem) return;
                    window.contentExport = new window.ContentExportSystem();
                    const ac = document.querySelector('article, .article-content');
                    if (!ac) return;
                    const aid = new URLSearchParams(location.search).get('id');
                    if (!aid) return;
                    const bar = document.createElement('div');
                    bar.id = 'exportBar';
                    bar.style.cssText = 'margin:20px 0;display:flex;gap:8px;flex-wrap:wrap;';
                    bar.innerHTML = `
                        <button onclick="window.contentExport.exportToPDF('${aid}')" style="padding:8px 16px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;">📄 导出PDF</button>
                        <button onclick="window.contentExport.exportToMarkdown('${aid}')" style="padding:8px 16px;background:linear-gradient(135deg,#43e97b,#38f9d7);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;">📝 导出Markdown</button>`;
                    ac.parentElement.insertBefore(bar, ac.nextSibling);
                }));
            }

            if (page === 'home' || page === 'articles') {
                idle.push(this.loadModuleES('./js/content-recommendation.js?v=20260425').then(() => {
                    if (!window.ContentRecommendation) return;
                    window.ContentRecommendation.init();
                    const h = document.getElementById('hotArticlesContainer');
                    if (h) window.ContentRecommendation.renderHotArticles('hotArticlesContainer', { limit: 10, timeRange: 'week' });
                    const r = document.getElementById('rankingBoardContainer');
                    if (r) window.ContentRecommendation.renderRankingBoard('rankingBoardContainer');
                }));

                idle.push(this.loadModuleES('./js/tags-system.js?v=20260425').then(() => {
                    if (!window.TagsSystem) return;
                    const ts = new window.TagsSystem();
                    ts.init();
                    window.tagsSystem = ts;
                    const tc = document.getElementById('tagCloudContainer');
                    if (tc) ts.renderTagCloud('tagCloudContainer');
                }));
            }

            if (page === 'tags') {
                idle.push(this.loadModuleES('./js/tags-system.js?v=20260425').then(() => {
                    if (!window.TagsSystem) return;
                    const ts = new window.TagsSystem();
                    ts.init();
                    window.tagsSystem = ts;
                    const c = document.getElementById('tagsPageContainer') || document.querySelector('.tags-container') || document.querySelector('main');
                    if (c) ts.renderTagCloud(c.id || 'tagsPageContainer');
                }));
            }

            if (page === 'analytics') {
                idle.push(this.loadModuleES('./js/analytics-system.js?v=20260425').then(() => {
                    if (!window.AnalyticsSystem || !window.AnalyticsDashboard) return;
                    const a = new window.AnalyticsSystem({ trackingId: 'dashboard-view' });
                    const d = new window.AnalyticsDashboard(a, 'analyticsDashboardContainer');
                    if (document.getElementById('analyticsDashboardContainer')) d.render();
                }));
            }

            if (page === 'profile' && loggedIn) {
                idle.push(this.loadModuleES('./js/gamification.js?v=20260425'));
                idle.push(this.loadModuleES('./js/content-recommendation.js?v=20260425'));
            }

            Promise.allSettled(idle);
        });

        await Promise.allSettled(critical);
        console.log('[ML] 关键模块就绪, 页面:', page);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ModuleLoader.initAll());
} else {
    ModuleLoader.initAll();
}

window.ModuleLoader = ModuleLoader;
