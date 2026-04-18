/**
 * 自动暗黑模式
 * 根据系统时间/偏好自动切换主题
 */
class AutoDarkMode {
    constructor(options = {}) {
        this.startHour = options.startHour || 19;
        this.endHour = options.endHour || 7;
        this.autoSwitch = localStorage.getItem('auto_darkmode') !== 'false';
        this.manualOverride = localStorage.getItem('theme_manual');
    }

    init() {
        if (this.manualOverride) {
            this.applyTheme(this.manualOverride);
            return;
        }
        if (this.autoSwitch) {
            this.checkAndSwitch();
            setInterval(() => this.checkAndSwitch(), 60000);
        }
        this.createToggle();
    }

    checkAndSwitch() {
        const hour = new Date().getHours();
        const isNight = hour >= this.startHour || hour < this.endHour;
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldDark = isNight || prefersDark;
        this.applyTheme(shouldDark ? 'dark' : 'light');
    }

    applyTheme(theme) {
        const body = document.body;
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            document.documentElement.style.setProperty('--bg-primary', '#1a1a2e');
            document.documentElement.style.setProperty('--text-primary', '#e0e0e0');
        } else {
            body.classList.remove('dark-mode');
            document.documentElement.style.setProperty('--bg-primary', '#ffffff');
            document.documentElement.style.setProperty('--text-primary', '#333333');
        }
        this.currentTheme = theme;
    }

    createToggle() {
        const btn = document.createElement('button');
        btn.id = 'themeToggleBtn';
        btn.innerHTML = '🌙';
        btn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 80px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: none;
            background: rgba(0,0,0,0.7);
            color: white;
            font-size: 18px;
            cursor: pointer;
            z-index: 999;
            backdrop-filter: blur(10px);
            transition: all 0.3s;
        `;
        btn.onclick = () => this.toggle();
        document.body.appendChild(btn);
        this.updateIcon();
    }

    toggle() {
        const next = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(next);
        localStorage.setItem('theme_manual', next);
        this.manualOverride = next;
        this.updateIcon();
    }

    updateIcon() {
        const btn = document.getElementById('themeToggleBtn');
        if (btn) btn.innerHTML = this.currentTheme === 'dark' ? '☀️' : '🌙';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const adm = new AutoDarkMode();
    adm.init();
});
export default AutoDarkMode;
