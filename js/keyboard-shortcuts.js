/**
 * 键盘快捷键系统 - Keyboard Shortcuts System
 * 为博客添加全站键盘导航和快捷操作
 */

class KeyboardShortcuts {
    constructor(options = {}) {
        this.options = {
            showHelpKey: '?',
            helpDuration: 5000,
            enableDebug: false,
            ...options
        };
        
        this.shortcuts = new Map();
        this.contexts = new Map();
        this.currentContext = 'global';
        this.isHelpVisible = false;
        this.modifiers = {
            ctrl: false,
            alt: false,
            shift: false,
            meta: false
        };
        
        this.init();
    }
    
    init() {
        this.registerDefaultShortcuts();
        this.bindEvents();
        this.createHelpPanel();
        
        console.log('[键盘快捷键] 系统已初始化');
    }
    
    /**
     * 注册默认快捷键
     */
    registerDefaultShortcuts() {
        // 全局快捷键
        this.register({
            key: '?',
            description: '显示/隐藏快捷键帮助',
            context: 'global',
            action: () => this.toggleHelp()
        });
        
        this.register({
            key: '/',
            description: '聚焦搜索框',
            context: 'global',
            action: () => this.focusSearch()
        });
        
        this.register({
            key: 'h',
            description: '返回首页',
            context: 'global',
            action: () => this.navigateTo('/')
        });
        
        this.register({
            key: 'a',
            description: '关于页面',
            context: 'global',
            action: () => this.navigateTo('/about.html')
        });
        
        this.register({
            key: 'l',
            description: '友情链接',
            context: 'global',
            action: () => this.navigateTo('/links.html')
        });
        
        this.register({
            key: 'g',
            description: '游戏中心',
            context: 'global',
            action: () => this.navigateTo('/games.html')
        });
        
        this.register({
            key: 'c',
            description: '金币/签到页面',
            context: 'global',
            action: () => this.navigateTo('/coins.html')
        });
        
        this.register({
            key: 'p',
            description: '个人中心',
            context: 'global',
            action: () => this.navigateTo('/profile.html')
        });
        
        this.register({
            key: 'm',
            description: '消息中心',
            context: 'global',
            action: () => this.navigateTo('/messages.html')
        });
        
        this.register({
            key: 'n',
            description: '新建文章',
            context: 'global',
            action: () => this.navigateTo('/editor.html')
        });
        
        this.register({
            key: 't',
            description: '切换主题',
            context: 'global',
            action: () => this.toggleTheme()
        });
        
        this.register({
            key: 'd',
            description: '切换深色/浅色模式',
            context: 'global',
            action: () => this.toggleDarkMode()
        });
        
        this.register({
            key: 's',
            description: '分享当前页面',
            context: 'global',
            action: () => this.sharePage()
        });
        
        this.register({
            key: 'r',
            description: '刷新页面',
            context: 'global',
            action: () => window.location.reload()
        });
        
        this.register({
            key: 'Escape',
            description: '关闭弹窗/返回',
            context: 'global',
            action: () => this.handleEscape()
        });
        
        // 带修饰符的快捷键
        this.register({
            key: 'k',
            ctrl: true,
            description: '打开命令面板',
            context: 'global',
            action: () => this.openCommandPalette()
        });
        
        // 文章页面快捷键
        this.register({
            key: 'j',
            description: '下一篇文章',
            context: 'article',
            action: () => this.nextArticle()
        });
        
        this.register({
            key: 'k',
            description: '上一篇文章',
            context: 'article',
            action: () => this.prevArticle()
        });
        
        this.register({
            key: 'ArrowUp',
            description: '滚动到顶部',
            context: 'article',
            action: () => this.scrollToTop()
        });
        
        this.register({
            key: 'ArrowDown',
            description: '滚动到底部',
            context: 'article',
            action: () => this.scrollToBottom()
        });
        
        this.register({
            key: 'u',
            description: '返回文章列表',
            context: 'article',
            action: () => this.navigateTo('/')
        });
        
        // 编辑器快捷键
        this.register({
            key: 's',
            ctrl: true,
            description: '保存草稿',
            context: 'editor',
            action: (e) => {
                e.preventDefault();
                this.saveDraft();
            }
        });
        
        this.register({
            key: 'p',
            ctrl: true,
            description: '预览文章',
            context: 'editor',
            action: (e) => {
                e.preventDefault();
                this.previewArticle();
            }
        });
        
        this.register({
            key: 'Enter',
            ctrl: true,
            description: '发布文章',
            context: 'editor',
            action: (e) => {
                e.preventDefault();
                this.publishArticle();
            }
        });
    }
    
    /**
     * 注册快捷键
     * @param {Object} config - 快捷键配置
     */
    register(config) {
        const { key, ctrl = false, alt = false, shift = false, meta = false, context = 'global', description, action } = config;
        
        const shortcutKey = this.getShortcutKey(key, ctrl, alt, shift, meta);
        
        if (!this.shortcuts.has(context)) {
            this.shortcuts.set(context, new Map());
        }
        
        this.shortcuts.get(context).set(shortcutKey, {
            key,
            ctrl,
            alt,
            shift,
            meta,
            description,
            action
        });
        
        if (this.options.enableDebug) {
            console.log(`[键盘快捷键] 注册: ${shortcutKey} (${context})`);
        }
    }
    
    /**
     * 获取快捷键标识符
     */
    getShortcutKey(key, ctrl, alt, shift, meta) {
        const parts = [];
        if (ctrl) parts.push('Ctrl');
        if (alt) parts.push('Alt');
        if (shift) parts.push('Shift');
        if (meta) parts.push('Meta');
        parts.push(key);
        return parts.join('+');
    }
    
    /**
     * 绑定键盘事件
     */
    bindEvents() {
        // 键盘按下
        document.addEventListener('keydown', (e) => this.handleKeyDown(e), true);
        
        // 键盘释放
        document.addEventListener('keyup', (e) => this.handleKeyUp(e), true);
        
        // 失去焦点时重置修饰符状态
        window.addEventListener('blur', () => this.resetModifiers());
        
        // 防止在输入框中触发
        document.addEventListener('focusin', (e) => {
            if (this.isInputElement(e.target)) {
                this.currentContext = 'input';
            }
        });
        
        document.addEventListener('focusout', () => {
            if (this.currentContext === 'input') {
                this.currentContext = 'global';
            }
        });
    }
    
    /**
     * 处理键盘按下
     */
    handleKeyDown(e) {
        // 更新修饰符状态
        if (e.key === 'Control') this.modifiers.ctrl = true;
        if (e.key === 'Alt') this.modifiers.alt = true;
        if (e.key === 'Shift') this.modifiers.shift = true;
        if (e.key === 'Meta') this.modifiers.meta = true;
        
        // 在输入框中，只允许特定快捷键
        if (this.isInputElement(e.target)) {
            // 允许 Ctrl+S 等保存操作
            if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
                this.executeShortcut(e, 'editor');
            }
            return;
        }
        
        // 获取当前上下文
        const context = this.detectContext();
        
        // 尝试执行快捷键
        if (this.executeShortcut(e, context)) {
            return;
        }
        
        // 如果在特定上下文没有匹配，尝试全局
        if (context !== 'global' && this.executeShortcut(e, 'global')) {
            return;
        }
    }
    
    /**
     * 执行快捷键
     */
    executeShortcut(e, context) {
        const shortcutKey = this.getShortcutKey(
            e.key,
            e.ctrlKey,
            e.altKey,
            e.shiftKey,
            e.metaKey
        );
        
        const contextShortcuts = this.shortcuts.get(context);
        if (contextShortcuts && contextShortcuts.has(shortcutKey)) {
            const shortcut = contextShortcuts.get(shortcutKey);
            shortcut.action(e);
            
            if (this.options.enableDebug) {
                console.log(`[键盘快捷键] 执行: ${shortcutKey} (${context})`);
            }
            
            e.preventDefault();
            return true;
        }
        
        return false;
    }
    
    /**
     * 处理键盘释放
     */
    handleKeyUp(e) {
        if (e.key === 'Control') this.modifiers.ctrl = false;
        if (e.key === 'Alt') this.modifiers.alt = false;
        if (e.key === 'Shift') this.modifiers.shift = false;
        if (e.key === 'Meta') this.modifiers.meta = false;
    }
    
    /**
     * 重置修饰符状态
     */
    resetModifiers() {
        this.modifiers.ctrl = false;
        this.modifiers.alt = false;
        this.modifiers.shift = false;
        this.modifiers.meta = false;
    }
    
    /**
     * 检测当前上下文
     */
    detectContext() {
        const path = window.location.pathname;
        
        if (path.includes('article.html')) return 'article';
        if (path.includes('editor.html')) return 'editor';
        if (path.includes('games.html') || path.includes('/games/')) return 'games';
        if (path.includes('messages.html')) return 'messages';
        if (path.includes('profile.html')) return 'profile';
        
        return 'global';
    }
    
    /**
     * 判断是否为输入元素
     */
    isInputElement(element) {
        const tagName = element.tagName.toLowerCase();
        const inputTypes = ['input', 'textarea', 'select'];
        const editable = element.isContentEditable;
        
        return inputTypes.includes(tagName) || editable;
    }
    
    // ========== 快捷键动作 ==========
    
    toggleHelp() {
        const helpPanel = document.getElementById('keyboard-help-panel');
        if (!helpPanel) return;
        
        if (this.isHelpVisible) {
            helpPanel.style.opacity = '0';
            helpPanel.style.transform = 'translate(-50%, -48%) scale(0.95)';
            setTimeout(() => {
                helpPanel.style.display = 'none';
            }, 200);
        } else {
            this.updateHelpPanel();
            helpPanel.style.display = 'block';
            // Force reflow
            helpPanel.offsetHeight;
            helpPanel.style.opacity = '1';
            helpPanel.style.transform = 'translate(-50%, -50%) scale(1)';
        }
        
        this.isHelpVisible = !this.isHelpVisible;
    }
    
    focusSearch() {
        const searchInput = document.querySelector('#searchInput, #searchKeyword, input[type="search"]');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
            this.showToast('🔍 搜索已激活', 'info');
        }
    }
    
    navigateTo(url) {
        window.location.href = url;
    }
    
    toggleTheme() {
        // 触发主题切换事件
        window.dispatchEvent(new CustomEvent('theme:toggle'));
        this.showToast('🎨 主题切换中...', 'info');
    }
    
    toggleDarkMode() {
        window.dispatchEvent(new CustomEvent('theme:toggleDarkMode'));
        this.showToast('🌓 模式切换中...', 'info');
    }
    
    sharePage() {
        if (navigator.share) {
            navigator.share({
                title: document.title,
                url: window.location.href
            });
        } else {
            // 复制链接到剪贴板
            navigator.clipboard.writeText(window.location.href).then(() => {
                this.showToast('🔗 链接已复制到剪贴板', 'success');
            });
        }
    }
    
    handleEscape() {
        // 关闭弹窗
        const modals = document.querySelectorAll('.modal-overlay, .auth-modal-overlay');
        let closed = false;
        
        modals.forEach(modal => {
            if (modal.style.display !== 'none' && getComputedStyle(modal).display !== 'none') {
                modal.style.display = 'none';
                closed = true;
            }
        });
        
        // 关闭帮助面板
        if (this.isHelpVisible) {
            this.toggleHelp();
            closed = true;
        }
        
        if (closed) {
            this.showToast('✓ 已关闭', 'info');
        }
    }
    
    openCommandPalette() {
        this.showToast('⌘ 命令面板即将上线', 'info');
        // 这里可以集成 CommandPalette 组件
    }
    
    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    scrollToBottom() {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
    
    nextArticle() {
        // 获取下一篇文章链接
        const nextLink = document.querySelector('.article-nav-next a, #nextArticle');
        if (nextLink) {
            nextLink.click();
        } else {
            this.showToast('已经是最后一篇了', 'info');
        }
    }
    
    prevArticle() {
        // 获取上一篇文章链接
        const prevLink = document.querySelector('.article-nav-prev a, #prevArticle');
        if (prevLink) {
            prevLink.click();
        } else {
            this.showToast('已经是第一篇了', 'info');
        }
    }
    
    saveDraft() {
        const saveBtn = document.querySelector('#saveDraftBtn, [data-action="save-draft"]');
        if (saveBtn) {
            saveBtn.click();
        } else {
            window.dispatchEvent(new CustomEvent('editor:saveDraft'));
        }
    }
    
    previewArticle() {
        window.dispatchEvent(new CustomEvent('editor:preview'));
    }
    
    publishArticle() {
        const publishBtn = document.querySelector('#publishBtn, [type="submit"]');
        if (publishBtn) {
            publishBtn.click();
        }
    }
    
    // ========== UI 组件 ==========
    
    createHelpPanel() {
        if (document.getElementById('keyboard-help-panel')) return;
        
        const panel = document.createElement('div');
        panel.id = 'keyboard-help-panel';
        panel.className = 'keyboard-help-panel';
        panel.style.cssText = `
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -48%) scale(0.95);
            width: 90%;
            max-width: 700px;
            max-height: 80vh;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 20px;
            box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            overflow: hidden;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            opacity: 0;
        `;
        
        panel.innerHTML = `
            <div class="help-panel-header" style="
                padding: 20px 24px;
                border-bottom: 1px solid rgba(0,0,0,0.08);
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            ">
                <h3 style="
                    margin: 0;
                    font-size: 1.3em;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <span>⌨️</span>
                    键盘快捷键
                </h3>
                <button id="closeHelpPanel" style="
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1.2em;
                    transition: all 0.2s;
                ">×</button>
            </div>
            <div class="help-panel-content" id="helpPanelContent" style="
                padding: 20px 24px;
                overflow-y: auto;
                max-height: calc(80vh - 70px);
            ">
                <!-- 动态生成内容 -->
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // 绑定关闭按钮
        document.getElementById('closeHelpPanel').addEventListener('click', () => this.toggleHelp());
        
        // 点击外部关闭
        panel.addEventListener('click', (e) => {
            if (e.target === panel) this.toggleHelp();
        });
        
        // 添加样式
        this.injectStyles();
    }
    
    updateHelpPanel() {
        const content = document.getElementById('helpPanelContent');
        if (!content) return;
        
        const context = this.detectContext();
        let html = '';
        
        // 当前上下文快捷键
        if (context !== 'global' && this.shortcuts.has(context)) {
            html += this.renderShortcutGroup('当前页面', this.shortcuts.get(context));
        }
        
        // 全局快捷键
        if (this.shortcuts.has('global')) {
            html += this.renderShortcutGroup('全局快捷键', this.shortcuts.get('global'));
        }
        
        // 编辑器快捷键（在编辑器页面时）
        if (context === 'editor' && this.shortcuts.has('editor')) {
            html += this.renderShortcutGroup('编辑器', this.shortcuts.get('editor'));
        }
        
        content.innerHTML = html;
    }
    
    renderShortcutGroup(title, shortcuts) {
        let html = `
            <div class="shortcut-group" style="margin-bottom: 24px;">
                <h4 style="
                    font-size: 0.85em;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: #888;
                    margin: 0 0 12px 0;
                    font-weight: 600;
                ">${title}</h4>
                <div class="shortcut-list">
        `;
        
        shortcuts.forEach((shortcut, key) => {
            const keyDisplay = this.renderKeyDisplay(shortcut);
            html += `
                <div class="shortcut-item" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 0;
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                ">
                    <span style="color: #333; font-size: 0.95em;">${shortcut.description}</span>
                    <span class="shortcut-keys" style="
                        display: flex;
                        gap: 4px;
                    ">${keyDisplay}</span>
                </div>
            `;
        });
        
        html += '</div></div>';
        return html;
    }
    
    renderKeyDisplay(shortcut) {
        const keys = [];
        if (shortcut.ctrl) keys.push(this.renderKey('Ctrl'));
        if (shortcut.alt) keys.push(this.renderKey('Alt'));
        if (shortcut.shift) keys.push(this.renderKey('Shift'));
        if (shortcut.meta) keys.push(this.renderKey('⌘'));
        keys.push(this.renderKey(shortcut.key));
        
        return keys.join('');
    }
    
    renderKey(key) {
        return `<kbd style="
            background: linear-gradient(145deg, #f0f0f0, #e0e0e0);
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 0.8em;
            font-family: 'SF Mono', Monaco, monospace;
            color: #333;
            box-shadow: 0 1px 0 rgba(0,0,0,0.1);
            min-width: 24px;
            text-align: center;
            display: inline-block;
        ">${key}</kbd>`;
    }
    
    injectStyles() {
        if (document.getElementById('keyboard-shortcuts-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'keyboard-shortcuts-styles';
        style.textContent = `
            @media (prefers-color-scheme: dark) {
                .keyboard-help-panel {
                    background: rgba(40, 40, 40, 0.95) !important;
                }
                .keyboard-help-panel .help-panel-content {
                    color: #fff;
                }
                .keyboard-help-panel .shortcut-item {
                    border-bottom-color: rgba(255,255,255,0.05) !important;
                }
                .keyboard-help-panel .shortcut-item span:first-child {
                    color: #ddd !important;
                }
                .keyboard-help-panel kbd {
                    background: linear-gradient(145deg, #444, #333) !important;
                    border-color: #555 !important;
                    color: #fff !important;
                }
                .keyboard-help-panel .shortcut-group h4 {
                    color: #aaa !important;
                }
            }
            
            /* Toast 提示 */
            .keyboard-shortcut-toast {
                animation: shortcutToastIn 0.3s ease;
            }
            
            @keyframes shortcutToastIn {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
            
            /* 快捷键提示动画 */
            .shortcut-hint {
                animation: shortcutHintPulse 2s infinite;
            }
            
            @keyframes shortcutHintPulse {
                0%, 100% {
                    opacity: 0.6;
                }
                50% {
                    opacity: 1;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'keyboard-shortcut-toast';
        
        const colors = {
            success: '#52c41a',
            error: '#ff4d4f',
            warning: '#faad14',
            info: '#1890ff'
        };
        
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: ${colors[type] || colors.info};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 10001;
            pointer-events: none;
        `;
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}

// 初始化
window.keyboardShortcuts = new KeyboardShortcuts();

export default KeyboardShortcuts;
