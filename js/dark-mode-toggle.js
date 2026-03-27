/**
 * 暗黑模式切换 - Dark Mode Toggle
 * 支持手动切换、自动检测系统偏好
 */

class DarkModeToggle {
    constructor(options = {}) {
        this.options = {
            storageKey: 'dark-mode',
            defaultMode: 'auto',
            togglePosition: 'header',
            ...options
        };
        
        this.currentMode = 'light';
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        this.init();
    }
    
    init() {
        this.loadMode();
        this.createToggle();
        this.bindEvents();
        this.applyMode();
        
        console.log('[暗黑模式] 系统已初始化');
    }
    
    loadMode() {
        const saved = localStorage.getItem(this.options.storageKey);
        this.currentMode = saved || this.options.defaultMode;
    }
    
    createToggle() {
        const toggle = document.createElement('button');
        toggle.className = 'dark-mode-toggle';
        toggle.setAttribute('aria-label', '切换暗黑模式');
        toggle.innerHTML = `
            <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
            <svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
        `;
        
        toggle.style.cssText = `
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: none;
            background: transparent;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: inherit;
            transition: all 0.3s;
        `;
        
        // 插入位置
        const header = document.querySelector('header, .header, .top-nav');
        if (header) {
            header.appendChild(toggle);
        } else {
            document.body.appendChild(toggle);
        }
        
        this.toggle = toggle;
        this.injectStyles();
    }
    
    bindEvents() {
        this.toggle.addEventListener('click', () => this.toggleMode());
        
        // 监听系统主题变化
        this.mediaQuery.addEventListener('change', (e) => {
            if (this.currentMode === 'auto') {
                this.applyMode();
            }
        });
    }
    
    toggleMode() {
        const modes = ['light', 'dark', 'auto'];
        const currentIndex = modes.indexOf(this.currentMode);
        this.currentMode = modes[(currentIndex + 1) % modes.length];
        
        localStorage.setItem(this.options.storageKey, this.currentMode);
        this.applyMode();
        
        // 显示提示
        this.showModeNotification();
    }
    
    applyMode() {
        const isDark = this.isDarkMode();
        
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        document.body.classList.toggle('dark-mode', isDark);
        
        // 更新图标
        this.toggle.classList.toggle('dark', isDark);
        
        // 触发事件
        window.dispatchEvent(new CustomEvent('theme:change', {
            detail: { isDark, mode: this.currentMode }
        }));
    }
    
    isDarkMode() {
        if (this.currentMode === 'dark') return true;
        if (this.currentMode === 'light') return false;
        return this.mediaQuery.matches;
    }
    
    showModeNotification() {
        const messages = {
            light: '☀️ 已切换到浅色模式',
            dark: '🌙 已切换到深色模式',
            auto: '⚙️ 已切换到自动模式'
        };
        
        const toast = document.createElement('div');
        toast.textContent = messages[this.currentMode];
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: #333;
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            z-index: 10000;
            animation: fadeInUp 0.3s ease;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }
    
    injectStyles() {
        if (document.getElementById('dark-mode-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'dark-mode-styles';
        style.textContent = `
            .dark-mode-toggle .sun-icon,
            .dark-mode-toggle .moon-icon {
                width: 20px;
                height: 20px;
                position: absolute;
                transition: all 0.3s;
            }
            
            .dark-mode-toggle .sun-icon {
                opacity: 1;
                transform: rotate(0) scale(1);
            }
            
            .dark-mode-toggle .moon-icon {
                opacity: 0;
                transform: rotate(90deg) scale(0);
            }
            
            .dark-mode-toggle.dark .sun-icon {
                opacity: 0;
                transform: rotate(-90deg) scale(0);
            }
            
            .dark-mode-toggle.dark .moon-icon {
                opacity: 1;
                transform: rotate(0) scale(1);
            }
            
            @keyframes fadeInUp {
                from { opacity: 0; transform: translateX(-50%) translateY(20px); }
                to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.darkModeToggle = new DarkModeToggle();
    });
} else {
    window.darkModeToggle = new DarkModeToggle();
}

export default DarkModeToggle;
