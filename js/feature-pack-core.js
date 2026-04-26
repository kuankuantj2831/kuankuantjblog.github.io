/**
 * 功能包核心管理器 v1.0
 * 统一管理100个功能的注册、启用、配置
 */
const FeaturePack = {
    registry: {},
    enabled: new Set(),
    configs: {},

    register(id, { name, desc, initFn, deps = [], page = 'all' }) {
        try {
            if (!id || typeof id !== 'string') {
                console.warn('[FP] 无效的功能 ID:', id);
                return;
            }
            
            this.registry[id] = { 
                id, 
                name: name || '未命名功能', 
                desc: desc || '', 
                initFn: typeof initFn === 'function' ? initFn : () => {}, 
                deps: Array.isArray(deps) ? deps : [], 
                page: page || 'all', 
                loaded: false 
            };
            
            try {
                if (localStorage.getItem(`fp_${id}`) !== 'false') {
                    this.enabled.add(id);
                }
            } catch (e) {
                console.warn(`[FP] localStorage 读取失败，默认启用 ${id}:`, e);
                this.enabled.add(id);
            }
        } catch (outerError) {
            console.error(`[FP] 注册功能 ${id} 失败:`, outerError);
        }
    },

    init(id) {
        try {
            if (!id || typeof id !== 'string') {
                console.warn('[FP] init: 无效的功能 ID:', id);
                return;
            }
            
            const f = this.registry[id];
            if (!f || f.loaded) return;
            
            try {
                if (Array.isArray(f.deps)) {
                    f.deps.forEach(d => this.init(d));
                }
            } catch (e) {
                console.warn(`[FP] ${id} 依赖加载失败:`, e);
            }
            
            try {
                if (typeof f.initFn === 'function') {
                    f.initFn();
                }
                f.loaded = true;
            } catch (e) {
                console.warn(`[FP] ${id} 初始化失败:`, e);
                f.loaded = false;
            }
        } catch (outerError) {
            console.error(`[FP] init 方法执行失败 ${id}:`, outerError);
        }
    },

    initAll() {
        try {
            const page = this.detectPage();
            this.enabled.forEach(id => {
                try {
                    const f = this.registry[id];
                    if (f && !f.loaded) {
                        const shouldLoad = 
                            f.page === 'all' || 
                            f.page === page || 
                            (Array.isArray(f.page) && f.page.includes(page));
                        
                        if (shouldLoad) {
                            this.init(id);
                        }
                    }
                } catch (e) {
                    console.warn(`[FP] initAll 处理 ${id} 失败:`, e);
                }
            });
        } catch (e) {
            console.error('[FP] initAll 致命错误:', e);
        }
    },

    detectPage() {
        try {
            const p = location.pathname || '';
            if (p === '/' || p.includes('index')) return 'index';
            if (p.includes('article') || /\d{4}\/\d{2}/.test(p)) return 'article';
            if (p.includes('profile')) return 'profile';
            if (p.includes('coins')) return 'coins';
            if (p.includes('editor')) return 'editor';
            if (p.includes('admin')) return 'admin';
            if (p.includes('games')) return 'games';
            return 'other';
        } catch (e) {
            console.warn('[FP] detectPage 失败:', e);
            return 'other';
        }
    },

    toggle(id) {
        try {
            if (!id || typeof id !== 'string') {
                console.warn('[FP] toggle: 无效的功能 ID:', id);
                return;
            }
            
            if (this.enabled.has(id)) {
                this.enabled.delete(id);
                try {
                    localStorage.setItem(`fp_${id}`, 'false');
                } catch (e) {
                    console.warn(`[FP] toggle: localStorage 保存失败:`, e);
                }
            } else {
                this.enabled.add(id);
                try {
                    localStorage.setItem(`fp_${id}`, 'true');
                } catch (e) {
                    console.warn(`[FP] toggle: localStorage 保存失败:`, e);
                }
            }
        } catch (e) {
            console.warn('[FP] toggle 失败:', e);
        }
    },

    // 工具方法集（增强异常处理版）
        util: {
            el(tag, styles = {}, attrs = {}) {
                try {
                    if (!tag || typeof tag !== 'string') {
                        console.warn('[FP] 无效的标签类型:', tag);
                        return document.createElement('div');
                    }
                    const e = document.createElement(tag);
                    if (styles && typeof styles === 'object') {
                        try {
                            Object.assign(e.style, styles);
                        } catch (styleError) {
                            console.warn('[FP] 样式应用失败:', styleError);
                        }
                    }
                    if (attrs && typeof attrs === 'object') {
                        Object.entries(attrs).forEach(([k, v]) => {
                            try { 
                                if (k && typeof k === 'string') {
                                    e.setAttribute(k, v); 
                                }
                            } catch (attrErr) { 
                                console.warn('[FP] 属性设置失败:', k, attrErr); 
                            }
                        });
                    }
                    return e;
                } catch (elErr) {
                    console.warn('[FP] el() error:', elErr);
                    return document.createElement('div'); // fallback
                }
            },
            on(evt, sel, fn) {
                try {
                    if (!evt || typeof evt !== 'string' || !sel || typeof fn !== 'function') {
                        console.warn('[FP] 无效的事件绑定参数:', evt, sel, typeof fn);
                        return;
                    }
                    document.addEventListener(evt, e => {
                        try {
                            if (e.target && typeof e.target.matches === 'function' && e.target.matches(sel)) {
                                fn(e);
                            }
                        } catch (err) { 
                            console.warn('[FP] 事件处理失败:', err); 
                        }
                    });
                } catch (outerError) {
                    console.warn('[FP] 事件绑定失败:', outerError);
                }
            },
            throttle(fn, ms) {
                try {
                    if (typeof fn !== 'function') {
                        console.warn('[FP] throttle 需要函数参数:', typeof fn);
                        return () => {};
                    }
                    let t = null;
                    return (...a) => { 
                        if (!t) { 
                            try { fn(...a); } catch (e) { console.warn('[FP] throttle 回调执行失败:', e); } 
                            t = setTimeout(() => t = null, ms); 
                        } 
                    };
                } catch (e) {
                    console.warn('[FP] throttle 创建失败:', e);
                    return () => {};
                }
            },
            debounce(fn, ms) {
                try {
                    if (typeof fn !== 'function') {
                        console.warn('[FP] debounce 需要函数参数:', typeof fn);
                        return () => {};
                    }
                    let t = null;
                    return (...a) => { 
                        clearTimeout(t); 
                        t = setTimeout(() => { 
                            try { fn(...a); } catch (e) { console.warn('[FP] debounce 回调执行失败:', e); } 
                        }, ms); 
                    };
                } catch (e) {
                    console.warn('[FP] debounce 创建失败:', e);
                    return () => {};
                }
            },
            rand(min, max) {
                try {
                    if (typeof min !== 'number' || typeof max !== 'number') {
                        console.warn('[FP] rand 参数无效:', min, max);
                        return 0;
                    }
                    return Math.floor(Math.random() * (max - min + 1)) + min; 
                } catch (e) { 
                    console.warn('[FP] rand 执行失败:', e);
                    return typeof min === 'number' ? min : 0; 
                }
            },
            uuid() {
                try { 
                    return Date.now().toString(36) + Math.random().toString(36).substr(2); 
                } catch (e) { 
                    console.warn('[FP] uuid 生成失败:', e);
                    return 'id_' + Date.now(); 
                }
            },
            storage: {
                get(k, d = null) {
                    try { 
                        const v = localStorage.getItem(k); 
                        if (v === null) return d;
                        try {
                            return JSON.parse(v);
                        } catch (parseError) {
                            console.warn('[FP] storage.get JSON 解析失败:', k, parseError);
                            return d;
                        }
                    } catch (e) { 
                        console.warn('[FP] storage.get 失败:', k, e);
                        return d; 
                    }
                },
                set(k, v) { 
                    try { 
                        localStorage.setItem(k, JSON.stringify(v)); 
                    } catch (e) {
                        console.warn('[FP] storage.set 失败:', k, e);
                    }
                },
                del(k) { 
                    try { 
                        localStorage.removeItem(k); 
                    } catch (e) {
                        console.warn('[FP] storage.del 失败:', k, e);
                    }
                }
            }
        }
};

window.FeaturePack = FeaturePack;
export default FeaturePack;
