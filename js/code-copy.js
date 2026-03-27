/**
 * 代码复制增强 - Code Copy Enhancement
 * 为代码块添加一键复制功能，支持多种代码高亮样式
 */

class CodeCopyEnhancement {
    constructor(options = {}) {
        this.options = {
            selector: 'pre code, .highlight pre, .code-block pre, pre[class*="language-"]',
            addLanguageLabel: true,
            showLineNumbers: false,
            copyFeedbackDuration: 2000,
            successText: '已复制!',
            errorText: '复制失败',
            tooltipText: '点击复制',
            ...options
        };
        
        this.copiedCode = null;
        this.processedBlocks = new WeakSet();
        
        this.init();
    }
    
    init() {
        this.processCodeBlocks();
        this.bindEvents();
        this.injectStyles();
        
        // 监听动态添加的代码块
        this.observeMutations();
        
        console.log('[代码复制] 系统已初始化');
    }
    
    /**
     * 处理所有代码块
     */
    processCodeBlocks() {
        const codeBlocks = document.querySelectorAll(this.options.selector);
        
        codeBlocks.forEach(block => {
            if (this.processedBlocks.has(block)) return;
            
            this.enhanceCodeBlock(block);
            this.processedBlocks.add(block);
        });
    }
    
    /**
     * 增强单个代码块
     */
    enhanceCodeBlock(codeElement) {
        const preElement = codeElement.parentElement;
        if (!preElement || preElement.tagName !== 'PRE') return;
        
        // 创建包装容器
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        
        // 替换原始 pre 元素
        preElement.parentNode.insertBefore(wrapper, preElement);
        wrapper.appendChild(preElement);
        
        // 添加头部信息栏
        const header = this.createHeader(codeElement);
        wrapper.insertBefore(header, preElement);
        
        // 添加复制按钮
        const copyBtn = this.createCopyButton();
        wrapper.appendChild(copyBtn);
        
        // 绑定复制事件
        copyBtn.addEventListener('click', () => this.copyCode(codeElement, copyBtn));
        
        // 添加行号（可选）
        if (this.options.showLineNumbers) {
            this.addLineNumbers(codeElement);
        }
        
        // 存储引用
        codeElement._copyBtn = copyBtn;
        codeElement._wrapper = wrapper;
    }
    
    /**
     * 创建头部信息栏
     */
    createHeader(codeElement) {
        const header = document.createElement('div');
        header.className = 'code-block-header';
        
        // 检测语言
        const language = this.detectLanguage(codeElement);
        
        header.innerHTML = `
            <div class="code-header-left">
                <span class="code-language">${language}</span>
                <span class="code-filename"></span>
            </div>
            <div class="code-header-actions">
                <button class="code-action-btn copy-btn-header" title="复制">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    复制
                </button>
                <button class="code-action-btn expand-btn" title="展开/收起">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <polyline points="9 21 3 21 3 15"></polyline>
                        <line x1="21" y1="3" x2="14" y2="10"></line>
                        <line x1="3" y1="21" x2="10" y2="14"></line>
                    </svg>
                </button>
            </div>
        `;
        
        // 绑定头部按钮事件
        const copyBtn = header.querySelector('.copy-btn-header');
        copyBtn.addEventListener('click', () => this.copyCode(codeElement, copyBtn));
        
        const expandBtn = header.querySelector('.expand-btn');
        expandBtn.addEventListener('click', () => this.toggleExpand(codeElement));
        
        return header;
    }
    
    /**
     * 创建复制按钮
     */
    createCopyButton() {
        const btn = document.createElement('button');
        btn.className = 'code-copy-float-btn';
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span class="copy-tooltip">${this.options.tooltipText}</span>
        `;
        btn.title = this.options.tooltipText;
        
        return btn;
    }
    
    /**
     * 检测代码语言
     */
    detectLanguage(codeElement) {
        // 从 class 中检测语言
        const classes = codeElement.className.split(' ');
        
        for (const cls of classes) {
            // 匹配 language-xxx 或 lang-xxx
            const match = cls.match(/(?:language|lang)-(\w+)/);
            if (match) {
                const lang = match[1];
                return this.getLanguageDisplayName(lang);
            }
        }
        
        // 从 data-language 属性获取
        if (codeElement.dataset.language) {
            return this.getLanguageDisplayName(codeElement.dataset.language);
        }
        
        // 从父元素的 class 检测
        const preClass = codeElement.parentElement.className;
        const preMatch = preClass.match(/(?:language|lang)-(\w+)/);
        if (preMatch) {
            return this.getLanguageDisplayName(preMatch[1]);
        }
        
        return 'TEXT';
    }
    
    /**
     * 获取语言显示名称
     */
    getLanguageDisplayName(lang) {
        const languageNames = {
            'javascript': 'JavaScript',
            'js': 'JavaScript',
            'typescript': 'TypeScript',
            'ts': 'TypeScript',
            'python': 'Python',
            'py': 'Python',
            'java': 'Java',
            'cpp': 'C++',
            'c': 'C',
            'csharp': 'C#',
            'cs': 'C#',
            'php': 'PHP',
            'ruby': 'Ruby',
            'go': 'Go',
            'rust': 'Rust',
            'swift': 'Swift',
            'kotlin': 'Kotlin',
            'html': 'HTML',
            'css': 'CSS',
            'scss': 'SCSS',
            'sass': 'Sass',
            'less': 'Less',
            'json': 'JSON',
            'xml': 'XML',
            'yaml': 'YAML',
            'yml': 'YAML',
            'markdown': 'Markdown',
            'md': 'Markdown',
            'sql': 'SQL',
            'bash': 'Bash',
            'shell': 'Shell',
            'sh': 'Shell',
            'powershell': 'PowerShell',
            'ps': 'PowerShell',
            'dockerfile': 'Dockerfile',
            'nginx': 'Nginx',
            'apache': 'Apache',
            'vim': 'Vim',
            'lua': 'Lua',
            'r': 'R',
            'matlab': 'MATLAB',
            'scala': 'Scala',
            'groovy': 'Groovy',
            'perl': 'Perl',
            'haskell': 'Haskell',
            'clojure': 'Clojure',
            'erlang': 'Erlang',
            'elixir': 'Elixir',
            'dart': 'Dart',
            'flutter': 'Flutter',
            'julia': 'Julia',
            'fortran': 'Fortran',
            'cobol': 'COBOL',
            'pascal': 'Pascal',
            'delphi': 'Delphi',
            'objectivec': 'Objective-C',
            'objc': 'Objective-C',
            'vb': 'Visual Basic',
            'vba': 'VBA',
            'assembly': 'Assembly',
            'asm': 'Assembly',
            'graphql': 'GraphQL',
            'regex': 'Regex',
            'diff': 'Diff'
        };
        
        return languageNames[lang.toLowerCase()] || lang.toUpperCase();
    }
    
    /**
     * 复制代码
     */
    async copyCode(codeElement, btn) {
        const code = codeElement.textContent;
        
        try {
            await navigator.clipboard.writeText(code);
            this.showCopySuccess(btn);
            this.copiedCode = code;
            
            // 触发复制成功事件
            window.dispatchEvent(new CustomEvent('code:copied', {
                detail: { code, language: this.detectLanguage(codeElement) }
            }));
            
            // 记录复制统计
            this.recordCopyStat();
        } catch (err) {
            console.error('复制失败:', err);
            this.showCopyError(btn);
            
            // 降级方案
            this.fallbackCopy(code, btn);
        }
    }
    
    /**
     * 降级复制方案
     */
    fallbackCopy(text, btn) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.cssText = 'position:fixed;left:-9999px;';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            this.showCopySuccess(btn);
        } catch (err) {
            this.showCopyError(btn);
        } finally {
            document.body.removeChild(textarea);
        }
    }
    
    /**
     * 显示复制成功
     */
    showCopySuccess(btn) {
        const originalHTML = btn.innerHTML;
        
        btn.classList.add('copy-success');
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>${this.options.successText}</span>
        `;
        
        this.showToast('✓ 代码已复制到剪贴板');
        
        setTimeout(() => {
            btn.classList.remove('copy-success');
            btn.innerHTML = originalHTML;
        }, this.options.copyFeedbackDuration);
    }
    
    /**
     * 显示复制失败
     */
    showCopyError(btn) {
        const originalHTML = btn.innerHTML;
        
        btn.classList.add('copy-error');
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            <span>${this.options.errorText}</span>
        `;
        
        this.showToast('✗ 复制失败，请手动复制', 'error');
        
        setTimeout(() => {
            btn.classList.remove('copy-error');
            btn.innerHTML = originalHTML;
        }, this.options.copyFeedbackDuration);
    }
    
    /**
     * 切换展开/收起
     */
    toggleExpand(codeElement) {
        const wrapper = codeElement.closest('.code-block-wrapper');
        if (!wrapper) return;
        
        wrapper.classList.toggle('expanded');
        
        const isExpanded = wrapper.classList.contains('expanded');
        const btn = wrapper.querySelector('.expand-btn');
        
        if (btn) {
            btn.innerHTML = isExpanded ? `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="4 14 10 14 10 20"></polyline>
                    <polyline points="20 10 14 10 14 4"></polyline>
                    <line x1="14" y1="10" x2="21" y2="3"></line>
                    <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
            ` : `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <polyline points="9 21 3 21 3 15"></polyline>
                    <line x1="21" y1="3" x2="14" y2="10"></line>
                    <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
            `;
            btn.title = isExpanded ? '收起' : '展开';
        }
    }
    
    /**
     * 添加行号
     */
    addLineNumbers(codeElement) {
        const lines = codeElement.innerHTML.split('\n');
        if (lines.length <= 1) return;
        
        // 保留最后一行空行
        if (lines[lines.length - 1] === '') {
            lines.pop();
        }
        
        const lineNumbers = lines.map((_, i) => `<span class="line-number">${i + 1}</span>`).join('');
        
        const preElement = codeElement.parentElement;
        preElement.classList.add('has-line-numbers');
        
        const lineNumbersWrapper = document.createElement('div');
        lineNumbersWrapper.className = 'line-numbers-wrapper';
        lineNumbersWrapper.innerHTML = lineNumbers;
        
        preElement.insertBefore(lineNumbersWrapper, codeElement);
    }
    
    /**
     * 显示提示
     */
    showToast(message, type = 'success') {
        const existingToast = document.querySelector('.code-copy-toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = 'code-copy-toast';
        toast.textContent = message;
        
        const colors = {
            success: '#52c41a',
            error: '#ff4d4f',
            info: '#1890ff'
        };
        
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${colors[type] || colors.success};
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            animation: codeCopyToastIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'codeCopyToastOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
    
    /**
     * 记录复制统计
     */
    recordCopyStat() {
        try {
            const stats = JSON.parse(localStorage.getItem('code_copy_stats') || '{}');
            stats.totalCopies = (stats.totalCopies || 0) + 1;
            stats.lastCopyTime = Date.now();
            localStorage.setItem('code_copy_stats', JSON.stringify(stats));
        } catch (e) {
            // 忽略存储错误
        }
    }
    
    /**
     * 监听DOM变化
     */
    observeMutations() {
        const observer = new MutationObserver((mutations) => {
            let shouldProcess = false;
            
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.matches && node.matches(this.options.selector)) {
                            shouldProcess = true;
                        }
                        if (node.querySelectorAll) {
                            const codeBlocks = node.querySelectorAll(this.options.selector);
                            if (codeBlocks.length > 0) {
                                shouldProcess = true;
                            }
                        }
                    }
                });
            });
            
            if (shouldProcess) {
                this.processCodeBlocks();
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 键盘快捷键：Ctrl+C 复制选中代码时显示提示
        document.addEventListener('copy', (e) => {
            const selection = window.getSelection();
            const selectedText = selection.toString();
            
            if (selectedText && this.isInCodeBlock(selection.anchorNode)) {
                this.showToast('✓ 代码已复制');
            }
        });
        
        // 双击代码块全选
        document.addEventListener('dblclick', (e) => {
            const codeBlock = e.target.closest('pre code');
            if (codeBlock) {
                const range = document.createRange();
                range.selectNode(codeBlock);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }
        });
    }
    
    /**
     * 检查是否在代码块内
     */
    isInCodeBlock(node) {
        return node && node.closest && node.closest('pre code, .code-block-wrapper') !== null;
    }
    
    /**
     * 注入样式
     */
    injectStyles() {
        if (document.getElementById('code-copy-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'code-copy-styles';
        style.textContent = `
            .code-block-wrapper {
                position: relative;
                margin: 1.5em 0;
                border-radius: 12px;
                overflow: hidden;
                background: #f8f9fa;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                transition: all 0.3s ease;
            }
            
            .code-block-wrapper:hover {
                box-shadow: 0 4px 16px rgba(0,0,0,0.12);
            }
            
            .code-block-wrapper pre {
                margin: 0;
                padding: 16px;
                overflow-x: auto;
                background: transparent;
            }
            
            .code-block-wrapper pre code {
                font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
                font-size: 0.9em;
                line-height: 1.6;
            }
            
            .code-block-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 16px;
                background: #e9ecef;
                border-bottom: 1px solid #dee2e6;
            }
            
            .code-header-left {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .code-language {
                font-size: 0.75em;
                font-weight: 600;
                color: #495057;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .code-header-actions {
                display: flex;
                gap: 8px;
            }
            
            .code-action-btn {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 6px 10px;
                border: none;
                background: rgba(255,255,255,0.8);
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.8em;
                color: #666;
                transition: all 0.2s;
            }
            
            .code-action-btn:hover {
                background: white;
                color: #333;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .code-action-btn svg {
                stroke: currentColor;
            }
            
            .code-copy-float-btn {
                position: absolute;
                top: 50px;
                right: 12px;
                width: 36px;
                height: 36px;
                border: none;
                background: rgba(255,255,255,0.9);
                border-radius: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transform: translateY(-5px);
                transition: all 0.2s ease;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                z-index: 10;
            }
            
            .code-block-wrapper:hover .code-copy-float-btn {
                opacity: 1;
                transform: translateY(0);
            }
            
            .code-copy-float-btn:hover {
                background: white;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            
            .code-copy-float-btn svg {
                stroke: #666;
            }
            
            .copy-tooltip {
                position: absolute;
                top: -30px;
                right: 0;
                background: #333;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.2s;
            }
            
            .code-copy-float-btn:hover .copy-tooltip {
                opacity: 1;
            }
            
            .code-action-btn.copy-success,
            .code-copy-float-btn.copy-success {
                background: #52c41a !important;
                color: white !important;
            }
            
            .code-action-btn.copy-success svg,
            .code-copy-float-btn.copy-success svg {
                stroke: white;
            }
            
            .code-action-btn.copy-error,
            .code-copy-float-btn.copy-error {
                background: #ff4d4f !important;
                color: white !important;
            }
            
            /* 行号样式 */
            .code-block-wrapper pre.has-line-numbers {
                display: flex;
                padding: 0;
            }
            
            .line-numbers-wrapper {
                padding: 16px 12px;
                background: #e9ecef;
                border-right: 1px solid #dee2e6;
                text-align: right;
                user-select: none;
            }
            
            .line-number {
                display: block;
                font-family: 'SF Mono', Monaco, monospace;
                font-size: 0.9em;
                line-height: 1.6;
                color: #868e96;
            }
            
            .has-line-numbers code {
                padding: 16px;
                flex: 1;
            }
            
            /* 展开状态 */
            .code-block-wrapper.expanded pre {
                max-height: none;
            }
            
            /* 代码高亮优化 */
            .code-block-wrapper pre code .line {
                display: block;
                min-height: 1.6em;
            }
            
            /* 动画 */
            @keyframes codeCopyToastIn {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
            
            @keyframes codeCopyToastOut {
                to {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-10px);
                }
            }
            
            /* 暗黑模式 */
            @media (prefers-color-scheme: dark) {
                .code-block-wrapper {
                    background: #1e1e1e;
                }
                
                .code-block-header {
                    background: #2d2d2d;
                    border-bottom-color: #3d3d3d;
                }
                
                .code-language {
                    color: #a0a0a0;
                }
                
                .code-action-btn {
                    background: rgba(255,255,255,0.1);
                    color: #ccc;
                }
                
                .code-action-btn:hover {
                    background: rgba(255,255,255,0.15);
                    color: #fff;
                }
                
                .code-copy-float-btn {
                    background: rgba(50,50,50,0.9);
                }
                
                .code-copy-float-btn:hover {
                    background: #3d3d3d;
                }
                
                .code-copy-float-btn svg {
                    stroke: #ccc;
                }
                
                .line-numbers-wrapper {
                    background: #252525;
                    border-right-color: #3d3d3d;
                }
                
                .line-number {
                    color: #606060;
                }
            }
            
            /* 移动端优化 */
            @media (max-width: 768px) {
                .code-block-wrapper {
                    margin: 1em -16px;
                    border-radius: 0;
                }
                
                .code-copy-float-btn {
                    opacity: 1;
                    transform: translateY(0);
                    top: auto;
                    bottom: 8px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.codeCopyEnhancement = new CodeCopyEnhancement();
    });
} else {
    window.codeCopyEnhancement = new CodeCopyEnhancement();
}

export default CodeCopyEnhancement;
