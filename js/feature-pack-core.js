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
        if (localStorage.getItem(`fp_${id}`) !== 'false') this.enabled.add(id);
    },

    init(id) {
        const f = this.registry[id];
        if (!f || f.loaded) return;
        f.deps.forEach(d => this.init(d));
        try { f.initFn(); f.loaded = true; } catch (e) { console.warn(`[FP] ${id}:`, e); }
    },

    initAll() {
        const page = this.detectPage();
        this.enabled.forEach(id => {
            const f = this.registry[id];
            if (f && (f.page === 'all' || f.page === page || (Array.isArray(f.page) && f.page.includes(page)))) {
                this.init(id);
            }
        });
    },

    detectPage() {
        const p = location.pathname;
        if (p === '/' || p.includes('index')) return 'index';
        if (p.includes('article') || /\d{4}\/\d{2}/.test(p)) return 'article';
        if (p.includes('profile')) return 'profile';
        if (p.includes('coins')) return 'coins';
        if (p.includes('editor')) return 'editor';
        if (p.includes('admin')) return 'admin';
        if (p.includes('games')) return 'games';
        return 'other';
    },

    toggle(id) {
        if (this.enabled.has(id)) { this.enabled.delete(id); localStorage.setItem(`fp_${id}`, 'false'); }
        else { this.enabled.add(id); localStorage.setItem(`fp_${id}`, 'true'); }
    },

    // 工具方法集
    util: {
        el(tag, styles = {}, attrs = {}) {
            const e = document.createElement(tag);
            Object.assign(e.style, styles);
            Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
            return e;
        },
        on(evt, sel, fn) { document.addEventListener(evt, e => { if (e.target.matches(sel)) fn(e); }); },
        throttle(fn, ms) { let t; return (...a) => { if (!t) { fn(...a); t = setTimeout(() => t = null, ms); } }; },
        debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; },
        rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
        uuid() { return Date.now().toString(36) + Math.random().toString(36).substr(2); },
        storage: {
            get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
            set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },
            del(k) { localStorage.removeItem(k); }
        }
    }
};

window.FeaturePack = FeaturePack;
export default FeaturePack;
