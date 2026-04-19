/**
 * 功能包核心管理器 v1.0
 * 统一管理100个功能的注册、启用、配置
 */
const FeaturePack = {
    registry: {},
    enabled: new Set(),
    configs: {},

    register(id, { name, desc, initFn, deps = [], page = 'all' }) {
        this.registry[id] = { id, name, desc, initFn, deps, page, loaded: false };
        try {
            if (localStorage.getItem(`fp_${id}`) !== 'false') this.enabled.add(id);
        } catch (e) {
            this.enabled.add(id);
        }
    },

    init(id) {
        const f = this.registry[id];
        if (!f || f.loaded) return;
        try {
            f.deps.forEach(d => this.init(d));
        } catch (e) {
            console.warn(`[FP] ${id} deps error:`, e);
        }
        try {
            f.initFn();
            f.loaded = true;
        } catch (e) {
            console.warn(`[FP] ${id} init error:`, e);
            f.loaded = true; // Mark as loaded to prevent repeated errors
        }
    },

    initAll() {
        try {
            const page = this.detectPage();
            this.enabled.forEach(id => {
                try {
                    const f = this.registry[id];
                    if (f && (f.page === 'all' || f.page === page || (Array.isArray(f.page) && f.page.includes(page)))) {
                        this.init(id);
                    }
                } catch (e) {
                    console.warn(`[FP] initAll error for ${id}:`, e);
                }
            });
        } catch (e) {
            console.error('[FP] initAll fatal error:', e);
        }
    },

    detectPage() {
        try {
            const p = location.pathname;
            if (p === '/' || p.includes('index')) return 'index';
            if (p.includes('article') || /\d{4}\/\d{2}/.test(p)) return 'article';
            if (p.includes('profile')) return 'profile';
            if (p.includes('coins')) return 'coins';
            if (p.includes('editor')) return 'editor';
            if (p.includes('admin')) return 'admin';
            if (p.includes('games')) return 'games';
            return 'other';
        } catch (e) {
            return 'other';
        }
    },

    toggle(id) {
        try {
            if (this.enabled.has(id)) {
                this.enabled.delete(id);
                localStorage.setItem(`fp_${id}`, 'false');
            } else {
                this.enabled.add(id);
                localStorage.setItem(`fp_${id}`, 'true');
            }
        } catch (e) {
            console.warn('[FP] toggle error:', e);
        }
    },

    // 工具方法集（增强异常处理版）
    util: {
        el(tag, styles = {}, attrs = {}) {
            try {
                const e = document.createElement(tag);
                if (styles && typeof styles === 'object') Object.assign(e.style, styles);
                if (attrs && typeof attrs === 'object') {
                    Object.entries(attrs).forEach(([k, v]) => {
                        try { e.setAttribute(k, v); } catch (err) { /* skip invalid attrs */ }
                    });
                }
                return e;
            } catch (e) {
                console.warn('[FP] el() error:', e);
                return document.createElement('div'); // fallback
            }
        },
        on(evt, sel, fn) {
            if (!evt || !sel || typeof fn !== 'function') return;
            document.addEventListener(evt, e => {
                try {
                    if (e.target && e.target.matches && e.target.matches(sel)) fn(e);
                } catch (err) { /* ignore */ }
            });
        },
        throttle(fn, ms) {
            if (typeof fn !== 'function') return () => {};
            let t;
            return (...a) => { if (!t) { try { fn(...a); } catch (e) {} t = setTimeout(() => t = null, ms); } };
        },
        debounce(fn, ms) {
            if (typeof fn !== 'function') return () => {};
            let t;
            return (...a) => { clearTimeout(t); t = setTimeout(() => { try { fn(...a); } catch (e) {} }, ms); };
        },
        rand(min, max) {
            try { return Math.floor(Math.random() * (max - min + 1)) + min; } catch (e) { return min; }
        },
        uuid() {
            try { return Date.now().toString(36) + Math.random().toString(36).substr(2); } catch (e) { return 'id_' + Date.now(); }
        },
        storage: {
            get(k, d) {
                try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : d; }
                catch (e) { return d; }
            },
            set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
            del(k) { try { localStorage.removeItem(k); } catch (e) {} }
        }
    }
};

window.FeaturePack = FeaturePack;
export default FeaturePack;
