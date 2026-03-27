/**
 * 主题系统 - Theme System
 * 支持多主题切换、自定义主题、深色/浅色模式
 */

class ThemeSystem {
    constructor(options = {}) {
        this.options = {
            storageKey: options.storageKey || 'blog_theme',
            defaultTheme: options.defaultTheme || 'default',
            defaultMode: options.defaultMode || 'light',
            ...options
        };

        this.currentTheme = null;
        this.currentMode = null;
        this.themes = this.initThemes();
        
        this.init();
    }

    /**
     * 初始化主题配置
     */
    initThemes() {
        return {
            default: {
                name: '默认',
                colors: {
                    light: {
                        primary: '#667eea',
                        secondary: '#764ba2',
                        background: '#ffffff',
                        surface: '#f5f5f5',
                        text: '#333333',
                        textSecondary: '#666666',
                        border: '#e0e0e0',
                        accent: '#00bfa5'
                    },
                    dark: {
                        primary: '#818cf8',
                        secondary: '#c084fc',
                        background: '#0f0f0f',
                        surface: '#1a1a1a',
                        text: '#e0e0e0',
                        textSecondary: '#999999',
                        border: '#333333',
                        accent: '#00bfa5'
                    }
                }
            },
            ocean: {
                name: '海洋',
                colors: {
                    light: {
                        primary: '#006994',
                        secondary: '#0099cc',
                        background: '#f0f9ff',
                        surface: '#e0f2fe',
                        text: '#0c4a6e',
                        textSecondary: '#0369a1',
                        border: '#bae6fd',
                        accent: '#f59e0b'
                    },
                    dark: {
                        primary: '#38bdf8',
                        secondary: '#7dd3fc',
                        background: '#0c1929',
                        surface: '#0f172a',
                        text: '#e0f2fe',
                        textSecondary: '#7dd3fc',
                        border: '#1e3a5f',
                        accent: '#fbbf24'
                    }
                }
            },
            forest: {
                name: '森林',
                colors: {
                    light: {
                        primary: '#2d5a27',
                        secondary: '#4a7c44',
                        background: '#f0fdf4',
                        surface: '#dcfce7',
                        text: '#14532d',
                        textSecondary: '#166534',
                        border: '#86efac',
                        accent: '#f97316'
                    },
                    dark: {
                        primary: '#4ade80',
                        secondary: '#86efac',
                        background: '#052e16',
                        surface: '#064e3b',
                        text: '#f0fdf4',
                        textSecondary: '#86efac',
                        border: '#166534',
                        accent: '#fb923c'
                    }
                }
            },
            sunset: {
                name: '日落',
                colors: {
                    light: {
                        primary: '#c2410c',
                        secondary: '#ea580c',
                        background: '#fff7ed',
                        surface: '#ffedd5',
                        text: '#7c2d12',
                        textSecondary: '#9a3412',
                        border: '#fdba74',
                        accent: '#8b5cf6'
                    },
                    dark: {
                        primary: '#fb923c',
                        secondary: '#fdba74',
                        background: '#2a1810',
                        surface: '#431407',
                        text: '#ffedd5',
                        textSecondary: '#fdba74',
                        border: '#9a3412',
                        accent: '#a78bfa'
                    }
                }
            },
            cherry: {
                name: '樱花',
                colors: {
                    light: {
                        primary: '#db2777',
                        secondary: '#ec4899',
                        background: '#fdf2f8',
                        surface: '#fce7f3',
                        text: '#831843',
                        textSecondary: '#be185d',
                        border: '#fbcfe8',
                        accent: '#06b6d4'
                    },
                    dark: {
                        primary: '#f472b6',
                        secondary: '#f9a8d4',
                        background: '#2a1018',
                        surface: '#4a1d2e',
                        text: '#fce7f3',
                        textSecondary: '#f9a8d4',
                        border: '#831843',
                        accent: '#22d3ee'
                    }
                }
            }
        };
    }

    /**
     * 初始化
     */
    init() {
        this.loadSavedTheme();
        this.applyTheme();
        this.listenSystemThemeChange();
    }

    /**
     * 加载保存的主题
     */
    loadSavedTheme() {
        const saved = localStorage.getItem(this.options.storageKey);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.currentTheme = data.theme || this.options.defaultTheme;
                this.currentMode = data.mode || this.options.defaultMode;
            } catch (e) {
                this.resetToDefault();
            }
        } else {
            this.resetToDefault();
        }
    }

    /**
     * 重置为默认
     */
    resetToDefault() {
        this.currentTheme = this.options.defaultTheme;
        this.currentMode = this.options.defaultMode;
        this.saveTheme();
    }

    /**
     * 应用主题
     */
    applyTheme() {
        const theme = this.themes[this.currentTheme];
        if (!theme) return;

        const colors = theme.colors[this.currentMode];
        const root = document.documentElement;

        // 设置CSS变量
        Object.entries(colors).forEach(([key, value]) => {
            root.style.setProperty(`--theme-${key}`, value);
        });

        // 设置data属性
        root.setAttribute('data-theme', this.currentTheme);
        root.setAttribute('data-mode', this.currentMode);

        // 更新meta theme-color
        this.updateMetaThemeColor(colors.primary);

        // 触发事件
        window.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme: this.currentTheme, mode: this.currentMode, colors }
        }));
    }

    /**
     * 更新meta theme-color
     */
    updateMetaThemeColor(color) {
        let meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'theme-color';
            document.head.appendChild(meta);
        }
        meta.content = color;
    }

    /**
     * 设置主题
     */
    setTheme(themeName) {
        if (!this.themes[themeName]) return false;

        this.currentTheme = themeName;
        this.saveTheme();
        this.applyTheme();
        return true;
    }

    /**
     * 设置模式
     */
    setMode(mode) {
        if (mode !== 'light' && mode !== 'dark' && mode !== 'auto') return false;

        if (mode === 'auto') {
            this.currentMode = this.getSystemTheme();
        } else {
            this.currentMode = mode;
        }

        this.saveTheme();
        this.applyTheme();
        return true;
    }

    /**
     * 切换模式
     */
    toggleMode() {
        const newMode = this.currentMode === 'light' ? 'dark' : 'light';
        this.setMode(newMode);
        return newMode;
    }

    /**
     * 获取系统主题
     */
    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    /**
     * 监听系统主题变化
     */
    listenSystemThemeChange() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                if (this.currentMode === 'auto') {
                    this.currentMode = e.matches ? 'dark' : 'light';
                    this.applyTheme();
                }
            });
        }
    }

    /**
     * 保存主题设置
     */
    saveTheme() {
        const data = {
            theme: this.currentTheme,
            mode: this.currentMode,
            timestamp: Date.now()
        };
        localStorage.setItem(this.options.storageKey, JSON.stringify(data));
    }

    /**
     * 获取当前主题信息
     */
    getCurrentTheme() {
        return {
            theme: this.currentTheme,
            mode: this.currentMode,
            colors: this.themes[this.currentTheme]?.colors[this.currentMode],
            allThemes: Object.keys(this.themes).map(key => ({
                key,
                name: this.themes[key].name
            }))
        };
    }

    /**
     * 创建自定义主题
     */
    createCustomTheme(name, colors) {
        const key = `custom_${Date.now()}`;
        this.themes[key] = {
            name,
            colors,
            isCustom: true
        };

        // 保存到本地存储
        const customThemes = JSON.parse(localStorage.getItem('custom_themes') || '{}');
        customThemes[key] = { name, colors };
        localStorage.setItem('custom_themes', JSON.stringify(customThemes));

        return key;
    }

    /**
     * 删除自定义主题
     */
    deleteCustomTheme(key) {
        if (!this.themes[key]?.isCustom) return false;

        delete this.themes[key];

        const customThemes = JSON.parse(localStorage.getItem('custom_themes') || '{}');
        delete customThemes[key];
        localStorage.setItem('custom_themes', JSON.stringify(customThemes));

        if (this.currentTheme === key) {
            this.resetToDefault();
        }

        return true;
    }

    /**
     * 加载自定义主题
     */
    loadCustomThemes() {
        const customThemes = JSON.parse(localStorage.getItem('custom_themes') || '{}');
        Object.entries(customThemes).forEach(([key, theme]) => {
            this.themes[key] = { ...theme, isCustom: true };
        });
    }
}

/**
 * 主题切换UI
 */
class ThemeUI {
    constructor(themeSystem) {
        this.system = themeSystem;
    }

    /**
     * 渲染主题选择器
     */
    renderThemeSelector(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const current = this.system.getCurrentTheme();

        container.innerHTML = `
            <div class="theme-selector">
                <h4>🎨 主题设置</h4>
                
                <div class="theme-section">
                    <label>颜色主题</label>
                    <div class="theme-grid">
                        ${current.allThemes.map(t => `
                            <button 
                                class="theme-option ${current.theme === t.key ? 'active' : ''}" 
                                data-theme="${t.key}"
                                onclick="themeUI.selectTheme('${t.key}')"
                            >
                                <span class="theme-preview" style="background: ${this.getThemePreviewColor(t.key)}"></span>
                                <span class="theme-name">${t.name}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="theme-section">
                    <label>显示模式</label>
                    <div class="mode-selector">
                        <button 
                            class="mode-option ${current.mode === 'light' ? 'active' : ''}" 
                            onclick="themeUI.selectMode('light')"
                        >
                            ☀️ 浅色
                        </button>
                        <button 
                            class="mode-option ${current.mode === 'dark' ? 'active' : ''}" 
                            onclick="themeUI.selectMode('dark')"
                        >
                            🌙 深色
                        </button>
                        <button 
                            class="mode-option ${current.mode === 'auto' ? 'active' : ''}" 
                            onclick="themeUI.selectMode('auto')"
                        >
                            🔄 自动
                        </button>
                    </div>
                </div>

                <div class="theme-preview-box" style="
                    background: var(--theme-surface);
                    color: var(--theme-text);
                    border: 1px solid var(--theme-border);
                    border-radius: 8px;
                    padding: 15px;
                    margin-top: 15px;
                ">
                    <p style="color: var(--theme-primary); margin: 0 0 10px;">主题预览</p>
                    <p style="color: var(--theme-textSecondary); margin: 0; font-size: 12px;">
                        当前主题: ${this.system.themes[current.theme].name} / 
                        ${current.mode === 'light' ? '浅色' : current.mode === 'dark' ? '深色' : '自动'}
                    </p>
                </div>
            </div>
        `;

        this.injectStyles();
    }

    /**
     * 获取主题预览颜色
     */
    getThemePreviewColor(themeKey) {
        const theme = this.system.themes[themeKey];
        if (!theme) return '#ccc';
        return `linear-gradient(135deg, ${theme.colors.light.primary}, ${theme.colors.light.secondary})`;
    }

    /**
     * 选择主题
     */
    selectTheme(themeKey) {
        this.system.setTheme(themeKey);
        
        // 更新UI
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === themeKey);
        });

        // 更新预览
        this.updatePreview();
    }

    /**
     * 选择模式
     */
    selectMode(mode) {
        this.system.setMode(mode);
        
        // 更新UI
        document.querySelectorAll('.mode-option').forEach((btn, index) => {
            const modes = ['light', 'dark', 'auto'];
            btn.classList.toggle('active', modes[index] === mode);
        });

        // 更新预览
        this.updatePreview();
    }

    /**
     * 更新预览
     */
    updatePreview() {
        const current = this.system.getCurrentTheme();
        const preview = document.querySelector('.theme-preview-box');
        if (preview) {
            preview.innerHTML = `
                <p style="color: var(--theme-primary); margin: 0 0 10px;">主题预览</p>
                <p style="color: var(--theme-textSecondary); margin: 0; font-size: 12px;">
                    当前主题: ${this.system.themes[current.theme].name} / 
                    ${current.mode === 'light' ? '浅色' : current.mode === 'dark' ? '深色' : '自动'}
                </p>
            `;
        }
    }

    /**
     * 渲染浮动主题切换按钮
     */
    renderFloatingToggle(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="theme-floating-toggle">
                <button class="theme-toggle-btn" onclick="themeUI.toggleMode()">
                    <span class="toggle-icon">${this.system.currentMode === 'dark' ? '🌙' : '☀️'}</span>
                </button>
                <div class="theme-dropdown">
                    ${Object.entries(this.system.themes).map(([key, theme]) => `
                        <button onclick="themeUI.selectTheme('${key}')" 
                                class="${this.system.currentTheme === key ? 'active' : ''}">
                            ${theme.name}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        this.injectFloatingStyles();
    }

    /**
     * 切换模式
     */
    toggleMode() {
        const newMode = this.system.toggleMode();
        const icon = document.querySelector('.toggle-icon');
        if (icon) {
            icon.textContent = newMode === 'dark' ? '🌙' : '☀️';
        }
    }

    /**
     * 注入样式
     */
    injectStyles() {
        if (document.getElementById('theme-ui-styles')) return;

        const styles = `
            <style id="theme-ui-styles">
                .theme-selector {
                    background: rgba(255,255,255,0.05);
                    border-radius: 12px;
                    padding: 20px;
                    color: var(--theme-text, #e0e0e0);
                }

                .theme-selector h4 {
                    margin: 0 0 20px 0;
                    font-size: 16px;
                }

                .theme-section {
                    margin-bottom: 20px;
                }

                .theme-section label {
                    display: block;
                    font-size: 12px;
                    color: var(--theme-textSecondary, #999);
                    margin-bottom: 10px;
                    text-transform: uppercase;
                }

                .theme-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
                    gap: 10px;
                }

                .theme-option {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 5px;
                    padding: 10px;
                    background: rgba(255,255,255,0.05);
                    border: 2px solid transparent;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .theme-option:hover {
                    background: rgba(255,255,255,0.1);
                }

                .theme-option.active {
                    border-color: var(--theme-primary, #667eea);
                }

                .theme-preview {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                }

                .theme-name {
                    font-size: 12px;
                }

                .mode-selector {
                    display: flex;
                    gap: 10px;
                }

                .mode-option {
                    flex: 1;
                    padding: 10px;
                    background: rgba(255,255,255,0.05);
                    border: 2px solid transparent;
                    border-radius: 8px;
                    color: var(--theme-text, #e0e0e0);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .mode-option:hover {
                    background: rgba(255,255,255,0.1);
                }

                .mode-option.active {
                    border-color: var(--theme-primary, #667eea);
                    background: rgba(102, 126, 234, 0.1);
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    injectFloatingStyles() {
        if (document.getElementById('theme-floating-styles')) return;

        const styles = `
            <style id="theme-floating-styles">
                .theme-floating-toggle {
                    position: fixed;
                    bottom: 100px;
                    right: 20px;
                    z-index: 1000;
                }

                .theme-toggle-btn {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    background: var(--theme-primary, #667eea);
                    border: none;
                    color: #fff;
                    font-size: 24px;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    transition: transform 0.2s;
                }

                .theme-toggle-btn:hover {
                    transform: scale(1.1);
                }

                .theme-dropdown {
                    position: absolute;
                    bottom: 60px;
                    right: 0;
                    background: var(--theme-surface, #1a1a1a);
                    border-radius: 8px;
                    padding: 10px;
                    display: none;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    min-width: 120px;
                }

                .theme-floating-toggle:hover .theme-dropdown {
                    display: block;
                }

                .theme-dropdown button {
                    display: block;
                    width: 100%;
                    padding: 8px 12px;
                    background: transparent;
                    border: none;
                    color: var(--theme-text, #e0e0e0);
                    text-align: left;
                    cursor: pointer;
                    border-radius: 4px;
                }

                .theme-dropdown button:hover,
                .theme-dropdown button.active {
                    background: rgba(255,255,255,0.1);
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// 导出
window.ThemeSystem = ThemeSystem;
window.ThemeUI = ThemeUI;

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    // 加载自定义主题
    const themeSystem = new ThemeSystem();
    themeSystem.loadCustomThemes();
    
    window.themeSystem = themeSystem;
    window.themeUI = new ThemeUI(themeSystem);
});
