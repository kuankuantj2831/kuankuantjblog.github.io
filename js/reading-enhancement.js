/**
 * 阅读体验增强模块
 * 包含：阅读进度同步、目录导航、阅读偏好
 */
import { API_BASE_URL } from './api-config.js?v=20260223b';

class ReadingEnhancement {
    constructor() {
        this.currentArticleId = null;
        this.preferences = {
            fontSize: 16,
            lineHeight: 1.8,
            theme: 'light',
            fontFamily: 'system',
            contentWidth: 'medium'
        };
        this.toc = [];
        this.progressSaveInterval = null;
        this.init();
    }
    
    init() {
        this.loadPreferences();
        this.initArticlePage();
        this.injectStyles();
    }
    
    // ==================== 阅读偏好 ====================
    
    async loadPreferences() {
        const token = this.getToken();
        if (!token) {
            // 从本地存储加载
            const saved = localStorage.getItem('reading_preferences');
            if (saved) {
                this.preferences = { ...this.preferences, ...JSON.parse(saved) };
            }
            this.applyPreferences();
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/reading/preferences`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.preferences = { ...this.preferences, ...data.preferences };
                localStorage.setItem('reading_preferences', JSON.stringify(this.preferences));
            }
        } catch (error) {
            console.error('加载阅读偏好失败:', error);
        }
        
        this.applyPreferences();
    }
    
    async savePreferences() {
        const token = this.getToken();
        localStorage.setItem('reading_preferences', JSON.stringify(this.preferences));
        
        if (!token) return;
        
        try {
            await fetch(`${API_BASE_URL}/reading/preferences`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fontSize: this.preferences.fontSize,
                    lineHeight: this.preferences.lineHeight,
                    theme: this.preferences.theme,
                    fontFamily: this.preferences.fontFamily,
                    contentWidth: this.preferences.contentWidth,
                    autoNightMode: this.preferences.autoNightMode
                })
            });
        } catch (error) {
            console.error('保存阅读偏好失败:', error);
        }
    }
    
    applyPreferences() {
        const articleContent = document.querySelector('.article-content, #articleContent, .md-preview');
        if (!articleContent) return;
        
        // 应用字体大小
        articleContent.style.fontSize = `${this.preferences.fontSize}px`;
        articleContent.style.lineHeight = this.preferences.lineHeight;
        
        // 应用主题
        document.body.classList.remove('theme-light', 'theme-dark', 'theme-sepia');
        document.body.classList.add(`theme-${this.preferences.theme}`);
        
        // 应用字体
        const fontMap = {
            'system': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
            'serif': 'Georgia, "Times New Roman", serif',
            'mono': '"Consolas", "Monaco", monospace'
        };
        articleContent.style.fontFamily = fontMap[this.preferences.fontFamily] || fontMap.system;
        
        // 应用内容宽度
        const widthMap = {
            'narrow': '680px',
            'medium': '800px',
            'wide': '1000px'
        };
        const container = articleContent.closest('.article-container, .editor-layout');
        if (container) {
            container.style.maxWidth = widthMap[this.preferences.contentWidth] || widthMap.medium;
        }
    }
    
    // 创建设置面板
    createSettingsPanel() {
        const panel = document.createElement('div');
        panel.className = 'reading-settings-panel';
        panel.innerHTML = `
            <div class="settings-overlay">
                <div class="settings-content">
                    <div class="settings-header">
                        <h3>阅读设置</h3>
                        <button class="settings-close">&times;</button>
                    </div>
                    <div class="settings-body">
                        <!-- 字体大小 -->
                        <div class="setting-item">
                            <label>字体大小</label>
                            <div class="font-size-control">
                                <button data-action="decrease-font">A-</button>
                                <span>${this.preferences.fontSize}px</span>
                                <button data-action="increase-font">A+</button>
                            </div>
                        </div>
                        
                        <!-- 行间距 -->
                        <div class="setting-item">
                            <label>行间距</label>
                            <div class="line-height-options">
                                <button data-value="1.6" class="${this.preferences.lineHeight === 1.6 ? 'active' : ''}">紧凑</button>
                                <button data-value="1.8" class="${this.preferences.lineHeight === 1.8 ? 'active' : ''}">适中</button>
                                <button data-value="2.0" class="${this.preferences.lineHeight === 2.0 ? 'active' : ''}">宽松</button>
                            </div>
                        </div>
                        
                        <!-- 主题 -->
                        <div class="setting-item">
                            <label>主题</label>
                            <div class="theme-options">
                                <button data-value="light" class="${this.preferences.theme === 'light' ? 'active' : ''}">☀️ 日间</button>
                                <button data-value="dark" class="${this.preferences.theme === 'dark' ? 'active' : ''}">🌙 夜间</button>
                                <button data-value="sepia" class="${this.preferences.theme === 'sepia' ? 'active' : ''}">📜 护眼</button>
                            </div>
                        </div>
                        
                        <!-- 字体 -->
                        <div class="setting-item">
                            <label>字体</label>
                            <select class="font-select">
                                <option value="system" ${this.preferences.fontFamily === 'system' ? 'selected' : ''}>系统默认</option>
                                <option value="serif" ${this.preferences.fontFamily === 'serif' ? 'selected' : ''}>衬线字体</option>
                                <option value="mono" ${this.preferences.fontFamily === 'mono' ? 'selected' : ''}>等宽字体</option>
                            </select>
                        </div>
                        
                        <!-- 内容宽度 -->
                        <div class="setting-item">
                            <label>内容宽度</label>
                            <div class="width-options">
                                <button data-value="narrow" class="${this.preferences.contentWidth === 'narrow' ? 'active' : ''}">窄</button>
                                <button data-value="medium" class="${this.preferences.contentWidth === 'medium' ? 'active' : ''}">中</button>
                                <button data-value="wide" class="${this.preferences.contentWidth === 'wide' ? 'active' : ''}">宽</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        this.bindSettingsEvents(panel);
        
        return panel;
    }
    
    bindSettingsEvents(panel) {
        // 关闭
        panel.querySelector('.settings-close').addEventListener('click', () => {
            panel.remove();
        });
        
        panel.querySelector('.settings-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) panel.remove();
        });
        
        // 字体大小
        panel.querySelector('[data-action="decrease-font"]').addEventListener('click', () => {
            if (this.preferences.fontSize > 12) {
                this.preferences.fontSize -= 2;
                this.updateSettingsPanel(panel);
                this.applyPreferences();
                this.savePreferences();
            }
        });
        
        panel.querySelector('[data-action="increase-font"]').addEventListener('click', () => {
            if (this.preferences.fontSize < 32) {
                this.preferences.fontSize += 2;
                this.updateSettingsPanel(panel);
                this.applyPreferences();
                this.savePreferences();
            }
        });
        
        // 行间距
        panel.querySelectorAll('.line-height-options button').forEach(btn => {
            btn.addEventListener('click', () => {
                this.preferences.lineHeight = parseFloat(btn.dataset.value);
                this.updateSettingsPanel(panel);
                this.applyPreferences();
                this.savePreferences();
            });
        });
        
        // 主题
        panel.querySelectorAll('.theme-options button').forEach(btn => {
            btn.addEventListener('click', () => {
                this.preferences.theme = btn.dataset.value;
                this.updateSettingsPanel(panel);
                this.applyPreferences();
                this.savePreferences();
            });
        });
        
        // 字体
        panel.querySelector('.font-select').addEventListener('change', (e) => {
            this.preferences.fontFamily = e.target.value;
            this.applyPreferences();
            this.savePreferences();
        });
        
        // 宽度
        panel.querySelectorAll('.width-options button').forEach(btn => {
            btn.addEventListener('click', () => {
                this.preferences.contentWidth = btn.dataset.value;
                this.updateSettingsPanel(panel);
                this.applyPreferences();
                this.savePreferences();
            });
        });
    }
    
    updateSettingsPanel(panel) {
        panel.querySelector('.font-size-control span').textContent = `${this.preferences.fontSize}px`;
        
        panel.querySelectorAll('.line-height-options button').forEach(btn => {
            btn.classList.toggle('active', parseFloat(btn.dataset.value) === this.preferences.lineHeight);
        });
        
        panel.querySelectorAll('.theme-options button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.value === this.preferences.theme);
        });
        
        panel.querySelectorAll('.width-options button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.value === this.preferences.contentWidth);
        });
    }
    
    // ==================== 目录导航 ====================
    
    generateTOC() {
        const content = document.querySelector('.article-content, #articleContent, .md-preview');
        if (!content) return [];
        
        const headings = content.querySelectorAll('h1, h2, h3, h4, h5, h6');
        this.toc = [];
        
        headings.forEach((heading, index) => {
            const id = `heading-${index}`;
            heading.id = id;
            
            this.toc.push({
                level: parseInt(heading.tagName.charAt(1)),
                text: heading.textContent,
                id: id
            });
        });
        
        return this.toc;
    }
    
    createTOCSidebar() {
        if (this.toc.length === 0) {
            this.generateTOC();
        }
        
        if (this.toc.length < 2) return null; // 标题太少不显示目录
        
        const sidebar = document.createElement('div');
        sidebar.className = 'toc-sidebar';
        sidebar.innerHTML = `
            <div class="toc-header">
                <h4>📑 目录</h4>
                <button class="toc-toggle">−</button>
            </div>
            <nav class="toc-nav">
                ${this.toc.map(item => `
                    <a href="#${item.id}" class="toc-item toc-level-${item.level}" data-id="${item.id}">
                        ${item.text}
                    </a>
                `).join('')}
            </nav>
        `;
        
        // 点击跳转
        sidebar.querySelectorAll('.toc-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.getElementById(item.dataset.id);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                    history.pushState(null, null, `#${item.dataset.id}`);
                }
            });
        });
        
        // 折叠/展开
        const toggleBtn = sidebar.querySelector('.toc-toggle');
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            toggleBtn.textContent = sidebar.classList.contains('collapsed') ? '+' : '−';
        });
        
        // 滚动高亮
        this.highlightTOCOnScroll(sidebar);
        
        return sidebar;
    }
    
    highlightTOCOnScroll(sidebar) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    sidebar.querySelectorAll('.toc-item').forEach(item => {
                        item.classList.toggle('active', item.dataset.id === entry.target.id);
                    });
                }
            });
        }, { rootMargin: '-20% 0px -80% 0px' });
        
        this.toc.forEach(item => {
            const element = document.getElementById(item.id);
            if (element) observer.observe(element);
        });
    }
    
    // ==================== 阅读进度 ====================
    
    initArticlePage() {
        // 从URL获取文章ID
        const urlParams = new URLSearchParams(window.location.search);
        this.currentArticleId = urlParams.get('id');
        
        if (!this.currentArticleId) return;
        
        // 加载阅读进度
        this.loadReadingProgress();
        
        // 开始记录进度
        this.startProgressTracking();
        
        // 页面卸载时保存进度
        window.addEventListener('beforeunload', () => {
            this.saveReadingProgress();
        });
    }
    
    async loadReadingProgress() {
        const token = this.getToken();
        if (!token) {
            // 从本地存储加载
            const saved = localStorage.getItem(`reading_progress_${this.currentArticleId}`);
            if (saved) {
                const data = JSON.parse(saved);
                this.restoreScrollPosition(data.scrollPosition);
            }
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/reading/progress/${this.currentArticleId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.hasProgress && data.progress) {
                    this.restoreScrollPosition(data.progress.scroll_position);
                    
                    // 显示继续阅读提示
                    if (data.progress.progress_percent > 0 && data.progress.progress_percent < 100) {
                        this.showContinueReadingTip(data.progress.progress_percent);
                    }
                }
            }
        } catch (error) {
            console.error('加载阅读进度失败:', error);
        }
    }
    
    restoreScrollPosition(position) {
        if (!position || position <= 0) return;
        
        // 等待内容加载完成
        setTimeout(() => {
            window.scrollTo({
                top: position,
                behavior: 'smooth'
            });
        }, 500);
    }
    
    showContinueReadingTip(percent) {
        const tip = document.createElement('div');
        tip.className = 'continue-reading-tip';
        tip.innerHTML = `
            <span>上次阅读到 ${Math.round(percent)}%</span>
            <button onclick="this.parentElement.remove()">继续阅读</button>
        `;
        
        document.body.appendChild(tip);
        
        // 3秒后自动隐藏
        setTimeout(() => {
            tip.classList.add('hide');
            setTimeout(() => tip.remove(), 300);
        }, 5000);
    }
    
    startProgressTracking() {
        // 每30秒保存一次进度
        this.progressSaveInterval = setInterval(() => {
            this.saveReadingProgress();
        }, 30000);
    }
    
    async saveReadingProgress() {
        if (!this.currentArticleId) return;
        
        const scrollPosition = window.scrollY;
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progressPercent = documentHeight > 0 ? Math.round((scrollPosition / documentHeight) * 100) : 0;
        
        const data = {
            articleId: this.currentArticleId,
            progressPercent: Math.min(progressPercent, 100),
            scrollPosition: scrollPosition,
            isFinished: progressPercent >= 95
        };
        
        // 本地存储
        localStorage.setItem(`reading_progress_${this.currentArticleId}`, JSON.stringify(data));
        
        // 服务器存储
        const token = this.getToken();
        if (!token) return;
        
        try {
            await fetch(`${API_BASE_URL}/reading/progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('保存阅读进度失败:', error);
        }
    }
    
    // ==================== 工具方法 ====================
    
    getToken() {
        return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    }
    
    injectStyles() {
        if (document.getElementById('reading-enhancement-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'reading-enhancement-styles';
        styles.textContent = `
            /* 阅读主题 */
            body.theme-dark {
                background: #1a1a2e;
                color: #eaeaea;
            }
            
            body.theme-dark .article-content,
            body.theme-dark #articleContent,
            body.theme-dark .md-preview {
                color: #d4d4d4;
            }
            
            body.theme-sepia {
                background: #f4ecd8;
                color: #433422;
            }
            
            /* 设置面板 */
            .reading-settings-panel .settings-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 3000;
            }
            
            .reading-settings-panel .settings-content {
                background: white;
                border-radius: 12px;
                width: 90%;
                max-width: 400px;
                animation: modal-in 0.3s ease;
            }
            
            .reading-settings-panel .settings-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid #eee;
            }
            
            .reading-settings-panel .settings-body {
                padding: 20px;
            }
            
            .reading-settings-panel .setting-item {
                margin-bottom: 20px;
            }
            
            .reading-settings-panel .setting-item label {
                display: block;
                font-size: 14px;
                color: #666;
                margin-bottom: 8px;
            }
            
            .reading-settings-panel .font-size-control {
                display: flex;
                align-items: center;
                gap: 16px;
            }
            
            .reading-settings-panel .font-size-control button {
                width: 36px;
                height: 36px;
                border: 1px solid #ddd;
                background: white;
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
            }
            
            .reading-settings-panel .line-height-options,
            .reading-settings-panel .theme-options,
            .reading-settings-panel .width-options {
                display: flex;
                gap: 8px;
            }
            
            .reading-settings-panel button {
                padding: 8px 16px;
                border: 1px solid #ddd;
                background: white;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .reading-settings-panel button.active {
                background: #667eea;
                color: white;
                border-color: #667eea;
            }
            
            /* 目录侧边栏 */
            .toc-sidebar {
                position: fixed;
                right: 20px;
                top: 100px;
                width: 200px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 12px rgba(0,0,0,0.1);
                max-height: calc(100vh - 140px);
                overflow: hidden;
                z-index: 100;
            }
            
            .toc-sidebar.collapsed .toc-nav {
                display: none;
            }
            
            .toc-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                border-bottom: 1px solid #eee;
            }
            
            .toc-header h4 {
                margin: 0;
                font-size: 14px;
            }
            
            .toc-toggle {
                background: none;
                border: none;
                cursor: pointer;
                font-size: 18px;
                color: #666;
            }
            
            .toc-nav {
                padding: 8px 0;
                overflow-y: auto;
                max-height: calc(100vh - 200px);
            }
            
            .toc-item {
                display: block;
                padding: 6px 16px;
                color: #666;
                text-decoration: none;
                font-size: 13px;
                border-left: 2px solid transparent;
                transition: all 0.2s;
            }
            
            .toc-item:hover {
                background: #f5f5f5;
                color: #667eea;
            }
            
            .toc-item.active {
                color: #667eea;
                border-left-color: #667eea;
                background: #f8f9ff;
            }
            
            .toc-level-1 { padding-left: 16px; font-weight: 500; }
            .toc-level-2 { padding-left: 28px; }
            .toc-level-3 { padding-left: 40px; font-size: 12px; }
            .toc-level-4 { padding-left: 52px; font-size: 12px; }
            
            /* 继续阅读提示 */
            .continue-reading-tip {
                position: fixed;
                bottom: 80px;
                left: 50%;
                transform: translateX(-50%);
                background: #333;
                color: white;
                padding: 12px 20px;
                border-radius: 25px;
                display: flex;
                align-items: center;
                gap: 12px;
                z-index: 2000;
                animation: tip-in 0.3s ease;
            }
            
            @keyframes tip-in {
                from { opacity: 0; transform: translateX(-50%) translateY(20px); }
                to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
            
            .continue-reading-tip.hide {
                opacity: 0;
                transform: translateX(-50%) translateY(20px);
                transition: all 0.3s ease;
            }
            
            .continue-reading-tip button {
                background: #667eea;
                color: white;
                border: none;
                padding: 6px 14px;
                border-radius: 15px;
                cursor: pointer;
                font-size: 12px;
            }
            
            @media (max-width: 1200px) {
                .toc-sidebar {
                    display: none;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
}

// 导出单例
const readingEnhancement = new ReadingEnhancement();
export default readingEnhancement;

window.ReadingEnhancement = readingEnhancement;
