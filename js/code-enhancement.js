/**
 * 代码高亮增强系统 - Code Enhancement System
 * 支持语法高亮、代码复制、行号显示、折叠等功能
 */

class CodeEnhancement {
    constructor(options = {}) {
        this.options = {
            showLineNumbers: true,
            showCopyButton: true,
            showLanguage: true,
            enableFolding: true,
            maxHeight: 500,
            theme: 'github-dark',
            ...options
        };
        this.languages = new Map();
        this.init();
    }

    /**
     * 初始化
     */
    init() {
        this.injectStyles();
        this.enhanceCodeBlocks();
        this.setupMutationObserver();
    }

    /**
     * 注入样式
     */
    injectStyles() {
        if (document.getElementById('code-enhancement-styles')) return;

        const styles = `
            <style id="code-enhancement-styles">
                .code-block-wrapper {
                    position: relative;
                    margin: 1.5em 0;
                    border-radius: 8px;
                    overflow: hidden;
                    background: #1e1e1e;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }

                .code-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 16px;
                    background: #2d2d2d;
                    border-bottom: 1px solid #3d3d3d;
                }

                .code-lang {
                    font-size: 12px;
                    color: #858585;
                    text-transform: uppercase;
                    font-family: 'SF Mono', Monaco, monospace;
                }

                .code-actions {
                    display: flex;
                    gap: 8px;
                }

                .code-btn {
                    padding: 4px 8px;
                    font-size: 12px;
                    color: #ccc;
                    background: transparent;
                    border: 1px solid #555;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .code-btn:hover {
                    background: #3d3d3d;
                    color: #fff;
                }

                .code-btn.copied {
                    color: #52c41a;
                    border-color: #52c41a;
                }

                .code-content {
                    position: relative;
                    overflow: auto;
                    max-height: ${this.options.maxHeight}px;
                }

                .code-content.has-more::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 50px;
                    background: linear-gradient(transparent, #1e1e1e);
                    pointer-events: none;
                }

                .code-block-wrapper.expanded .code-content.has-more::after {
                    display: none;
                }

                .code-block-wrapper.expanded .code-content {
                    max-height: none;
                }

                pre.code-block {
                    margin: 0;
                    padding: 16px;
                    background: transparent;
                    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Fira Code', monospace;
                    font-size: 14px;
                    line-height: 1.6;
                    tab-size: 4;
                }

                /* 行号样式 */
                .code-with-lines {
                    display: flex;
                }

                .line-numbers {
                    flex-shrink: 0;
                    padding: 16px 12px;
                    text-align: right;
                    background: #1a1a1a;
                    border-right: 1px solid #3d3d3d;
                    user-select: none;
                }

                .line-number {
                    display: block;
                    color: #4a4a4a;
                    font-size: 14px;
                    line-height: 1.6;
                }

                .line-number:hover {
                    color: #666;
                }

                .code-lines {
                    flex: 1;
                    overflow-x: auto;
                }

                .code-line {
                    display: block;
                    padding: 0 16px;
                    line-height: 1.6;
                }

                .code-line:hover {
                    background: rgba(255,255,255,0.03);
                }

                .code-line.highlight {
                    background: rgba(255,255,0,0.1);
                }

                /* 语法高亮基础样式 */
                .token-keyword { color: #ff7b72; }
                .token-string { color: #a5d6ff; }
                .token-number { color: #79c0ff; }
                .token-comment { color: #8b949e; font-style: italic; }
                .token-function { color: #d2a8ff; }
                .token-class { color: #ffa657; }
                .token-operator { color: #ff7b72; }
                .token-punctuation { color: #c9d1d9; }
                .token-variable { color: #ffa657; }
                .token-property { color: #7ee787; }
                .token-tag { color: #7ee787; }
                .token-attr { color: #79c0ff; }

                /* 折叠按钮 */
                .expand-btn {
                    position: absolute;
                    bottom: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                    padding: 6px 16px;
                    font-size: 12px;
                    color: #fff;
                    background: #3d3d3d;
                    border: none;
                    border-radius: 20px;
                    cursor: pointer;
                    z-index: 10;
                }

                .expand-btn:hover {
                    background: #4d4d4d;
                }

                .code-block-wrapper.expanded .expand-btn {
                    position: static;
                    transform: none;
                    display: block;
                    margin: 10px auto;
                }

                /* 代码运行按钮 */
                .run-btn {
                    background: #238636;
                    border-color: #238636;
                    color: #fff;
                }

                .run-btn:hover {
                    background: #2ea043;
                }

                /* 代码 diff 样式 */
                .code-diff .line-added {
                    background: rgba(46, 160, 67, 0.2);
                }

                .code-diff .line-removed {
                    background: rgba(248, 81, 73, 0.2);
                }

                .code-diff .line-added::before {
                    content: '+';
                    color: #3fb950;
                    margin-right: 8px;
                }

                .code-diff .line-removed::before {
                    content: '-';
                    color: #f85149;
                    margin-right: 8px;
                }

                /* 文件名标签 */
                .code-filename {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    color: #ccc;
                }

                .code-filename::before {
                    content: '📄';
                }

                /* 暗色/亮色主题切换 */
                .code-block-wrapper.light {
                    background: #f6f8fa;
                }

                .code-block-wrapper.light .code-header {
                    background: #eaeef2;
                    border-color: #d0d7de;
                }

                .code-block-wrapper.light pre.code-block {
                    color: #24292f;
                }

                .code-block-wrapper.light .token-keyword { color: #cf222e; }
                .code-block-wrapper.light .token-string { color: #0a3069; }
                .code-block-wrapper.light .token-number { color: #0550ae; }
                .code-block-wrapper.light .token-comment { color: #6e7781; }

                /* 滚动条样式 */
                .code-content::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }

                .code-content::-webkit-scrollbar-track {
                    background: #1a1a1a;
                }

                .code-content::-webkit-scrollbar-thumb {
                    background: #4d4d4d;
                    border-radius: 4px;
                }

                .code-content::-webkit-scrollbar-thumb:hover {
                    background: #5d5d5d;
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * 增强代码块
     */
    enhanceCodeBlocks(container = document) {
        const codeBlocks = container.querySelectorAll('pre code');
        
        codeBlocks.forEach(codeBlock => {
            if (codeBlock.dataset.enhanced) return;
            codeBlock.dataset.enhanced = 'true';

            const pre = codeBlock.parentElement;
            const wrapper = document.createElement('div');
            wrapper.className = 'code-block-wrapper';

            // 获取语言
            const lang = this.detectLanguage(codeBlock);
            
            // 获取文件名（如果有）
            const filename = codeBlock.dataset.filename || '';

            // 构建头部
            let headerHTML = '<div class="code-header">';
            
            if (filename) {
                headerHTML += `<span class="code-filename">${filename}</span>`;
            } else if (this.options.showLanguage && lang) {
                headerHTML += `<span class="code-lang">${lang}</span>`;
            } else {
                headerHTML += '<span></span>';
            }

            headerHTML += '<div class="code-actions">';
            
            // 折叠按钮
            if (this.options.enableFolding) {
                headerHTML += `<button class="code-btn fold-btn" title="折叠/展开">−</button>`;
            }

            // 复制按钮
            if (this.options.showCopyButton) {
                headerHTML += `<button class="code-btn copy-btn" title="复制代码">📋 复制</button>`;
            }

            headerHTML += '</div></div>';

            // 处理代码内容
            const code = codeBlock.textContent;
            const highlightedCode = this.highlightCode(code, lang);
            
            let contentHTML = '<div class="code-content">';
            
            if (this.options.showLineNumbers) {
                const lines = code.split('\n').length;
                const lineNumbers = Array.from({length: lines}, (_, i) => i + 1).join('</span><span class="line-number">');
                
                contentHTML += `
                    <div class="code-with-lines">
                        <div class="line-numbers"><span class="line-number">${lineNumbers}</span></div>
                        <div class="code-lines">
                            <pre class="code-block">${highlightedCode}</pre>
                        </div>
                    </div>
                `;
            } else {
                contentHTML += `<pre class="code-block">${highlightedCode}</pre>`;
            }
            
            contentHTML += '</div>';

            wrapper.innerHTML = headerHTML + contentHTML;

            // 检查是否需要展开按钮
            const content = wrapper.querySelector('.code-content');
            if (content && content.scrollHeight > this.options.maxHeight) {
                content.classList.add('has-more');
                wrapper.insertAdjacentHTML('beforeend', '<button class="expand-btn">展开更多</button>');
            }

            // 替换原代码块
            pre.parentNode.replaceChild(wrapper, pre);

            // 绑定事件
            this.bindEvents(wrapper, code);
        });
    }

    /**
     * 检测代码语言
     */
    detectLanguage(codeBlock) {
        const className = codeBlock.className || '';
        const match = className.match(/language-(\w+)/);
        if (match) return match[1];

        // 根据内容检测
        const code = codeBlock.textContent;
        
        if (code.includes('function') || code.includes('const') || code.includes('let') || code.includes('var')) {
            return 'javascript';
        }
        if (code.includes('<!DOCTYPE html>') || code.includes('<html')) {
            return 'html';
        }
        if (code.includes('{') && code.includes('}') && code.includes(':')) {
            if (code.includes('@media') || code.includes('display:')) {
                return 'css';
            }
        }
        if (code.includes('import') && code.includes('from')) {
            return code.includes('=>') ? 'javascript' : 'python';
        }
        if (code.includes('def ') || code.includes('print(')) {
            return 'python';
        }
        if (code.includes('<?php')) {
            return 'php';
        }
        
        return 'text';
    }

    /**
     * 简单语法高亮
     */
    highlightCode(code, lang) {
        // 转义HTML
        let highlighted = this.escapeHtml(code);

        // 根据语言应用高亮规则
        const patterns = this.getLanguagePatterns(lang);
        
        patterns.forEach(({ regex, className }) => {
            highlighted = highlighted.replace(regex, `<span class="token-${className}">$1</span>`);
        });

        return highlighted;
    }

    /**
     * 获取语言高亮模式
     */
    getLanguagePatterns(lang) {
        const commonPatterns = [
            { regex: /(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm, className: 'comment' },
            { regex: /(".*?"|'.*?'|`[\s\S]*?`)/g, className: 'string' },
            { regex: /\b(\d+\.?\d*)\b/g, className: 'number' },
        ];

        const langPatterns = {
            javascript: [
                { regex: /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|new|this|typeof|instanceof)\b/g, className: 'keyword' },
                { regex: /\b([a-zA-Z_]\w*)(?=\()/g, className: 'function' },
            ],
            python: [
                { regex: /\b(def|class|if|else|elif|for|while|return|import|from|as|try|except|with|lambda|None|True|False)\b/g, className: 'keyword' },
                { regex: /\b([a-zA-Z_]\w*)(?=\()/g, className: 'function' },
            ],
            css: [
                { regex: /([a-zA-Z-]+)(?=:)/g, className: 'property' },
                { regex: /(@media|@import|@keyframes|[a-z-]+)(?=\s*\{)/g, className: 'keyword' },
            ],
            html: [
                { regex: /(&lt;\/?)(\w+)/g, className: 'tag' },
                { regex: /(\w+)(?==)/g, className: 'attr' },
            ]
        };

        return [...commonPatterns, ...(langPatterns[lang] || [])];
    }

    /**
     * 绑定事件
     */
    bindEvents(wrapper, originalCode) {
        // 复制按钮
        const copyBtn = wrapper.querySelector('.copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(originalCode);
                    copyBtn.textContent = '✓ 已复制';
                    copyBtn.classList.add('copied');
                    
                    setTimeout(() => {
                        copyBtn.textContent = '📋 复制';
                        copyBtn.classList.remove('copied');
                    }, 2000);
                } catch (err) {
                    console.error('复制失败:', err);
                }
            });
        }

        // 折叠按钮
        const foldBtn = wrapper.querySelector('.fold-btn');
        if (foldBtn) {
            foldBtn.addEventListener('click', () => {
                const content = wrapper.querySelector('.code-content');
                content.style.display = content.style.display === 'none' ? 'block' : 'none';
                foldBtn.textContent = content.style.display === 'none' ? '+' : '−';
            });
        }

        // 展开按钮
        const expandBtn = wrapper.querySelector('.expand-btn');
        if (expandBtn) {
            expandBtn.addEventListener('click', () => {
                wrapper.classList.toggle('expanded');
                expandBtn.textContent = wrapper.classList.contains('expanded') ? '收起' : '展开更多';
            });
        }
    }

    /**
     * 设置 MutationObserver 监听动态内容
     */
    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.enhanceCodeBlocks(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * 转义HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 创建 Diff 视图
     */
    createDiffView(oldCode, newCode, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const oldLines = oldCode.split('\n');
        const newLines = newCode.split('\n');
        
        let diffHTML = '<div class="code-block-wrapper code-diff">';
        diffHTML += '<div class="code-header"><span class="code-lang">Diff</span></div>';
        diffHTML += '<div class="code-content">';
        
        // 简化的 diff 逻辑
        const maxLines = Math.max(oldLines.length, newLines.length);
        for (let i = 0; i < maxLines; i++) {
            const oldLine = oldLines[i] || '';
            const newLine = newLines[i] || '';
            
            if (oldLine === newLine) {
                diffHTML += `<span class="code-line">${this.escapeHtml(newLine)}</span>`;
            } else if (newLine && !oldLine) {
                diffHTML += `<span class="code-line line-added">${this.escapeHtml(newLine)}</span>`;
            } else if (oldLine && !newLine) {
                diffHTML += `<span class="code-line line-removed">${this.escapeHtml(oldLine)}</span>`;
            } else {
                diffHTML += `<span class="code-line line-removed">${this.escapeHtml(oldLine)}</span>`;
                diffHTML += `<span class="code-line line-added">${this.escapeHtml(newLine)}</span>`;
            }
        }
        
        diffHTML += '</div></div>';
        container.innerHTML = diffHTML;
    }

    /**
     * 切换主题
     */
    toggleTheme() {
        const wrappers = document.querySelectorAll('.code-block-wrapper');
        wrappers.forEach(wrapper => {
            wrapper.classList.toggle('light');
        });
    }
}

/**
 * 自动目录生成
 */
class AutoTOC {
    constructor(options = {}) {
        this.options = {
            container: '#toc-container',
            content: '#article-content',
            minLevel: 2,
            maxLevel: 4,
            offset: 100,
            ...options
        };
        this.headings = [];
        this.activeId = null;
        this.init();
    }

    /**
     * 初始化
     */
    init() {
        this.generateTOC();
        this.setupScrollSpy();
        this.setupSmoothScroll();
    }

    /**
     * 生成目录
     */
    generateTOC() {
        const content = document.querySelector(this.options.content);
        const container = document.querySelector(this.options.container);
        
        if (!content || !container) return;

        // 查找所有标题
        const selector = Array.from(
            { length: this.options.maxLevel - this.options.minLevel + 1 },
            (_, i) => `h${this.options.minLevel + i}`
        ).join(', ');

        const headings = content.querySelectorAll(selector);
        
        if (headings.length === 0) {
            container.style.display = 'none';
            return;
        }

        this.headings = Array.from(headings).map((heading, index) => {
            // 为标题添加 ID
            let id = heading.id;
            if (!id) {
                id = `heading-${index}`;
                heading.id = id;
            }

            return {
                id,
                level: parseInt(heading.tagName.charAt(1)),
                text: heading.textContent.trim(),
                element: heading
            };
        });

        // 构建目录 HTML
        const tocHTML = this.buildTOCHTML();
        container.innerHTML = `
            <div class="toc-wrapper">
                <div class="toc-header">
                    <h4>📑 目录</h4>
                    <button class="toc-toggle" onclick="this.closest('.toc-wrapper').classList.toggle('collapsed')">
                        −
                    </button>
                </div>
                <nav class="toc-nav">${tocHTML}</nav>
            </div>
        `;

        this.injectTOCStyles();
    }

    /**
     * 构建目录 HTML
     */
    buildTOCHTML() {
        let html = '<ul class="toc-list">';
        let currentLevel = this.options.minLevel;
        
        this.headings.forEach((heading, index) => {
            const level = heading.level;
            
            // 处理层级变化
            if (level > currentLevel) {
                html += '<ul class="toc-sublist">'.repeat(level - currentLevel);
            } else if (level < currentLevel) {
                html += '</ul>'.repeat(currentLevel - level);
            }
            
            currentLevel = level;
            
            html += `
                <li class="toc-item toc-level-${level}">
                    <a href="#${heading.id}" class="toc-link" data-id="${heading.id}">
                        <span class="toc-number">${this.getHeadingNumber(index)}</span>
                        <span class="toc-text">${this.escapeHtml(heading.text)}</span>
                    </a>
                </li>
            `;
        });
        
        html += '</ul>'.repeat(currentLevel - this.options.minLevel + 1);
        return html;
    }

    /**
     * 获取标题编号
     */
    getHeadingNumber(index) {
        // 简化的编号逻辑
        const heading = this.headings[index];
        const sameLevelPrev = this.headings.slice(0, index).filter(h => h.level === heading.level).length;
        return sameLevelPrev + 1;
    }

    /**
     * 设置滚动监听
     */
    setupScrollSpy() {
        const observerOptions = {
            root: null,
            rootMargin: `-${this.options.offset}px 0px -80% 0px`,
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.setActiveHeading(entry.target.id);
                }
            });
        }, observerOptions);

        this.headings.forEach(h => observer.observe(h.element));
    }

    /**
     * 设置当前激活的标题
     */
    setActiveHeading(id) {
        if (this.activeId === id) return;
        
        this.activeId = id;
        
        // 更新样式
        document.querySelectorAll('.toc-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.id === id) {
                link.classList.add('active');
            }
        });

        // 滚动目录到可视区域
        const activeLink = document.querySelector(`.toc-link[data-id="${id}"]`);
        if (activeLink) {
            activeLink.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    /**
     * 设置平滑滚动
     */
    setupSmoothScroll() {
        document.querySelectorAll('.toc-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const id = link.dataset.id;
                const element = document.getElementById(id);
                
                if (element) {
                    const offset = this.options.offset;
                    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
                    
                    window.scrollTo({
                        top: elementPosition - offset,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    /**
     * 注入样式
     */
    injectTOCStyles() {
        if (document.getElementById('toc-styles')) return;

        const styles = `
            <style id="toc-styles">
                .toc-wrapper {
                    position: sticky;
                    top: 100px;
                    max-height: calc(100vh - 120px);
                    overflow-y: auto;
                    background: rgba(255,255,255,0.05);
                    border-radius: 12px;
                    padding: 16px;
                    backdrop-filter: blur(10px);
                }

                .toc-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }

                .toc-header h4 {
                    margin: 0;
                    font-size: 14px;
                    color: #fff;
                }

                .toc-toggle {
                    background: none;
                    border: none;
                    color: #999;
                    cursor: pointer;
                    font-size: 16px;
                    padding: 4px;
                }

                .toc-wrapper.collapsed .toc-nav {
                    display: none;
                }

                .toc-list, .toc-sublist {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                }

                .toc-sublist {
                    padding-left: 16px;
                }

                .toc-item {
                    margin: 4px 0;
                }

                .toc-link {
                    display: flex;
                    align-items: baseline;
                    gap: 8px;
                    padding: 6px 8px;
                    color: rgba(255,255,255,0.7);
                    text-decoration: none;
                    border-radius: 6px;
                    font-size: 13px;
                    line-height: 1.4;
                    transition: all 0.2s;
                }

                .toc-link:hover {
                    background: rgba(255,255,255,0.1);
                    color: #fff;
                }

                .toc-link.active {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: #fff;
                }

                .toc-number {
                    flex-shrink: 0;
                    color: inherit;
                    opacity: 0.7;
                    font-size: 12px;
                }

                .toc-text {
                    flex: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .toc-level-3 { padding-left: 8px; }
                .toc-level-4 { padding-left: 16px; }

                /* 滚动条 */
                .toc-wrapper::-webkit-scrollbar {
                    width: 4px;
                }

                .toc-wrapper::-webkit-scrollbar-track {
                    background: transparent;
                }

                .toc-wrapper::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.2);
                    border-radius: 2px;
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 全局实例
window.CodeEnhancement = CodeEnhancement;
window.AutoTOC = AutoTOC;

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化代码增强
    window.codeEnhancer = new CodeEnhancement();
    
    // 如果在文章页面，初始化目录
    if (document.querySelector('#article-content')) {
        window.autoTOC = new AutoTOC({
            container: '#toc-container',
            content: '#article-content'
        });
    }
});
