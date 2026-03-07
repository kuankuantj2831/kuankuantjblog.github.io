// 主题切换模块 - 在所有页面引入
(function() {
    const STORAGE_KEY = 'site-theme';

    function getPreferredTheme() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEY, theme);
        updateToggleButton(theme);
    }

    function updateToggleButton(theme) {
        const btn = document.getElementById('themeToggle');
        if (btn) {
            btn.textContent = theme === 'dark' ? '☀️' : '🌙';
            btn.title = theme === 'dark' ? '切换到亮色模式' : '切换到深色模式';
        }
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.classList.add('theme-transition');
        setTheme(next);
        setTimeout(() => document.documentElement.classList.remove('theme-transition'), 400);
    }

    function createToggleButton() {
        if (document.getElementById('themeToggle')) return;
        const btn = document.createElement('button');
        btn.id = 'themeToggle';
        btn.className = 'theme-toggle';
        btn.onclick = toggleTheme;
        document.body.appendChild(btn);
        updateToggleButton(getPreferredTheme());
    }

    // 立即设置主题（防止闪烁）
    setTheme(getPreferredTheme());

    // DOM 加载后创建按钮
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createToggleButton);
    } else {
        createToggleButton();
    }

    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(STORAGE_KEY)) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });

    // 暴露 API
    window.toggleTheme = toggleTheme;
})();
