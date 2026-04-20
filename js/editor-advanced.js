/**
 * 高级编辑功能模块
 * 包含：数学公式、流程图、代码运行、导入导出
 */
import { API_BASE_URL } from './api-config.js?v=20260419b';

class AdvancedEditor {
    constructor() {
        this.katexLoaded = false;
        this.mermaidLoaded = false;
        this.init();
    }
    
    init() {
        this.injectStyles();
    }
    
    // ==================== KaTeX 数学公式 ====================
    
    async loadKaTeX() {
        if (this.katexLoaded) return;
        
        return new Promise((resolve) => {
            // 加载CSS
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/katex@0.16.9/dist/katex.min.css';
            document.head.appendChild(link);
            
            // 加载JS
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/katex@0.16.9/dist/katex.min.js';
            script.onload = () => {
                // 加载auto-render
                const autoRender = document.createElement('script');
                autoRender.src = 'https://unpkg.com/katex@0.16.9/dist/contrib/auto-render.min.js';
                autoRender.onload = () => {
                    this.katexLoaded = true;
                    resolve();
                };
                document.head.appendChild(autoRender);
            };
            document.head.appendChild(script);
        });
    }
    
    renderMath(element) {
        if (!this.katexLoaded || !window.katex) return;
        
        window.renderMathInElement(element, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false },
                { left: '\\[', right: '\\]', display: true },
                { left: '\\(', right: '\\)', display: false }
            ],
            throwOnError: false
        });
    }
    
    // ==================== Mermaid 流程图 ====================
    
    async loadMermaid() {
        if (this.mermaidLoaded) return;
        
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/mermaid@10/dist/mermaid.min.js';
            script.onload = () => {
                window.mermaid.initialize({
                    startOnLoad: false,
                    theme: 'default',
                    securityLevel: 'loose'
                });
                this.mermaidLoaded = true;
                resolve();
            };
            document.head.appendChild(script);
        });
    }
    
    async renderMermaid(element) {
        if (!this.mermaidLoaded) {
            await this.loadMermaid();
        }
        
        const mermaidBlocks = element.querySelectorAll('code.language-mermaid');
        
        for (const block of mermaidBlocks) {
            const container = document.createElement('div');
            container.className = 'mermaid';
            container.textContent = block.textContent;
            
            const pre = block.closest('pre');
            if (pre) {
                pre.replaceWith(container);
            }
        }
        
        if (window.mermaid) {
            await window.mermaid.run({
                querySelector: '.mermaid'
            });
        }
    }
    
    // ==================== 代码运行功能 ====================
    
    async runCode(code, language) {
        // 支持的编程语言
        const supportedLanguages = ['javascript', 'python', 'java', 'cpp', 'c', 'go', 'rust'];
        
        if (!supportedLanguages.includes(language)) {
            return { error: '该语言暂不支持在线运行' };
        }
        
        try {
            // 对于JavaScript，在沙箱中直接运行
            if (language === 'javascript') {
                return this.runJavaScript(code);
            }
            
            // 其他语言通过API运行（需要后端支持）
            const response = await fetch(`${API_BASE_URL}/code/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, language })
            });
            
            return await response.json();
        } catch (error) {
            return { error: error.message };
        }
    }
    
    runJavaScript(code) {
        return new Promise((resolve) => {
            const sandbox = {
                console: {
                    logs: [],
                    log: (...args) => {
                        sandbox.console.logs.push(args.map(a => String(a)).join(' '));
                    },
                    error: (...args) => {
                        sandbox.console.logs.push('[Error] ' + args.map(a => String(a)).join(' '));
                    }
                },
                setTimeout: () => {},
                setInterval: () => {},
                fetch: () => Promise.resolve(),
                XMLHttpRequest: () => {},
                WebSocket: () => {},
                document: undefined,
                window: undefined
            };
            
            try {
                // 创建安全的函数
                const fn = new Function('console', `
                    "use strict";
                    ${code}
                `);
                
                fn(sandbox.console);
                
                resolve({
                    success: true,
                    output: sandbox.console.logs.join('\n')
                });
            } catch (error) {
                resolve({
                    success: false,
                    error: error.message
                });
            }
        });
    }
    
    // 添加代码运行按钮到代码块
    addRunButtons(element) {
        const codeBlocks = element.querySelectorAll('pre code');
        
        codeBlocks.forEach(block => {
            const language = block.className.match(/language-(\w+)/)?.[1];
            if (!language || !['javascript', 'python', 'java'].includes(language)) {
                return;
            }
            
            const pre = block.closest('pre');
            if (pre.querySelector('.code-run-btn')) return;
            
            const btn = document.createElement('button');
            btn.className = 'code-run-btn';
            btn.innerHTML = '▶ 运行';
            
            btn.addEventListener('click', async () => {
                const code = block.textContent;
                btn.disabled = true;
                btn.textContent = '运行中...';
                
                const result = await this.runCode(code, language);
                
                // 显示结果
                let outputEl = pre.querySelector('.code-output');
                if (!outputEl) {
                    outputEl = document.createElement('div');
                    outputEl.className = 'code-output';
                    pre.appendChild(outputEl);
                }
                
                if (result.error) {
                    outputEl.innerHTML = `<div class="code-error">${result.error}</div>`;
                } else {
                    outputEl.innerHTML = `<pre>${result.output || '(无输出)'}</pre>`;
                }
                
                btn.disabled = false;
                btn.innerHTML = '▶ 运行';
            });
            
            pre.style.position = 'relative';
            pre.appendChild(btn);
        });
    }
    
    // ==================== 导入导出功能 ====================
    
    // 导出为Markdown文件
    exportToMarkdown(title, content) {
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title || 'article'}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // 导出为HTML
    exportToHTML(title, content) {
        const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { max-width: 800px; margin: 0 auto; padding: 40px 20px; font-family: -apple-system, sans-serif; line-height: 1.8; }
        pre { background: #f5f5f5; padding: 16px; overflow-x: auto; border-radius: 4px; }
        code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
        blockquote { border-left: 4px solid #667eea; margin: 0; padding-left: 16px; color: #666; }
        img { max-width: 100%; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        th { background: #f5f5f5; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <div class="content">${this.markdownToHTML(content)}</div>
</body>
</html>`;
        
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title || 'article'}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // 简单的Markdown转HTML
    markdownToHTML(markdown) {
        return markdown
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/^###### (.*$)/gim, '<h6>$1</h6>')
            .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
            .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
            .replace(/^&gt; (.*$)/gim, '<blockquote>$1</blockquote>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
    }
    
    // 导入Markdown文件
    importMarkdown(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
    
    // 创建导入导出菜单
    createExportMenu(getTitle, getContent) {
        const menu = document.createElement('div');
        menu.className = 'export-menu';
        menu.innerHTML = `
            <button class="export-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                导出
            </button>
            <div class="export-dropdown">
                <div class="export-option" data-format="markdown">📄 Markdown</div>
                <div class="export-option" data-format="html">🌐 HTML</div>
            </div>
        `;
        
        const btn = menu.querySelector('.export-btn');
        const dropdown = menu.querySelector('.export-dropdown');
        
        btn.addEventListener('click', () => {
            dropdown.classList.toggle('show');
        });
        
        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
        
        menu.querySelectorAll('.export-option').forEach(option => {
            option.addEventListener('click', () => {
                const format = option.dataset.format;
                const title = getTitle();
                const content = getContent();
                
                if (format === 'markdown') {
                    this.exportToMarkdown(title, content);
                } else if (format === 'html') {
                    this.exportToHTML(title, content);
                }
                
                dropdown.classList.remove('show');
            });
        });
        
        return menu;
    }
    
    createImportButton(onImport) {
        const btn = document.createElement('button');
        btn.className = 'import-btn';
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            导入
        `;
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.markdown,.txt';
        input.style.display = 'none';
        
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const content = await this.importMarkdown(file);
                onImport(content);
            } catch (error) {
                alert('导入失败: ' + error.message);
            }
            
            input.value = '';
        });
        
        btn.addEventListener('click', () => input.click());
        
        const wrapper = document.createElement('div');
        wrapper.appendChild(btn);
        wrapper.appendChild(input);
        
        return wrapper;
    }
    
    // ==================== 样式 ====================
    
    injectStyles() {
        if (document.getElementById('advanced-editor-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'advanced-editor-styles';
        styles.textContent = `
            /* 代码运行按钮 */
            .code-run-btn {
                position: absolute;
                top: 8px;
                right: 8px;
                padding: 4px 12px;
                background: #28a745;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                opacity: 0;
                transition: opacity 0.2s;
            }
            
            pre:hover .code-run-btn {
                opacity: 1;
            }
            
            .code-run-btn:hover {
                background: #218838;
            }
            
            .code-run-btn:disabled {
                background: #6c757d;
                cursor: not-allowed;
            }
            
            /* 代码输出 */
            .code-output {
                margin-top: 8px;
                padding: 12px;
                background: #1e1e1e;
                color: #d4d4d4;
                border-radius: 4px;
                font-family: 'Consolas', monospace;
                font-size: 13px;
                max-height: 200px;
                overflow-y: auto;
            }
            
            .code-output pre {
                margin: 0;
                white-space: pre-wrap;
                word-break: break-all;
            }
            
            .code-error {
                color: #f48771;
            }
            
            /* 导出菜单 */
            .export-menu {
                position: relative;
                display: inline-block;
            }
            
            .export-btn {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 6px 12px;
                background: white;
                border: 1px solid #ddd;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
            }
            
            .export-btn:hover {
                background: #f5f5f5;
            }
            
            .export-dropdown {
                position: absolute;
                top: 100%;
                right: 0;
                margin-top: 4px;
                background: white;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                display: none;
                min-width: 140px;
                z-index: 100;
            }
            
            .export-dropdown.show {
                display: block;
            }
            
            .export-option {
                padding: 10px 16px;
                cursor: pointer;
                font-size: 13px;
            }
            
            .export-option:hover {
                background: #f5f5f5;
            }
            
            .export-option:first-child {
                border-radius: 4px 4px 0 0;
            }
            
            .export-option:last-child {
                border-radius: 0 0 4px 4px;
            }
            
            /* 导入按钮 */
            .import-btn {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 6px 12px;
                background: white;
                border: 1px solid #ddd;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
            }
            
            .import-btn:hover {
                background: #f5f5f5;
            }
            
            /* Mermaid图表 */
            .mermaid {
                text-align: center;
                padding: 20px;
            }
            
            /* KaTeX数学公式 */
            .katex-display {
                margin: 1em 0;
                overflow-x: auto;
                overflow-y: hidden;
            }
        `;
        
        document.head.appendChild(styles);
    }
}

// 导出单例
const advancedEditor = new AdvancedEditor();
export default advancedEditor;

window.AdvancedEditor = advancedEditor;
