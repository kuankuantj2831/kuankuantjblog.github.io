/**
 * 内容导出系统 - Content Export System
 * 支持导出文章为多种格式：PDF、Markdown、EPUB、图片
 */

class ContentExportSystem {
    constructor(options = {}) {
        this.options = {
            apiBaseUrl: options.apiBaseUrl || '/api',
            defaultStyle: options.defaultStyle || 'default',
            ...options
        };
    }

    /**
     * 导出文章为 PDF
     */
    async exportToPDF(articleId, options = {}) {
        try {
            const article = await this.fetchArticle(articleId);
            if (!article) throw new Error('文章不存在');

            // 创建打印窗口
            const printWindow = window.open('', '_blank');
            
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>${article.title}</title>
                    <style>
                        @page {
                            size: A4;
                            margin: 2cm;
                        }
                        body {
                            font-family: 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
                            font-size: 12pt;
                            line-height: 1.8;
                            color: #333;
                            max-width: 800px;
                            margin: 0 auto;
                        }
                        h1 {
                            font-size: 24pt;
                            margin-bottom: 0.5em;
                            color: #1a1a1a;
                        }
                        .meta {
                            color: #666;
                            font-size: 10pt;
                            margin-bottom: 2em;
                            padding-bottom: 1em;
                            border-bottom: 1px solid #ddd;
                        }
                        h2 { font-size: 18pt; margin-top: 1.5em; }
                        h3 { font-size: 14pt; margin-top: 1.2em; }
                        p { margin: 1em 0; }
                        code {
                            background: #f5f5f5;
                            padding: 0.2em 0.4em;
                            border-radius: 3px;
                            font-family: 'Consolas', monospace;
                            font-size: 10pt;
                        }
                        pre {
                            background: #f5f5f5;
                            padding: 1em;
                            border-radius: 5px;
                            overflow-x: auto;
                            font-size: 10pt;
                        }
                        blockquote {
                            border-left: 4px solid #667eea;
                            margin: 1em 0;
                            padding: 0.5em 1em;
                            background: #f9f9f9;
                            color: #555;
                        }
                        img {
                            max-width: 100%;
                            height: auto;
                        }
                        .footer {
                            margin-top: 3em;
                            padding-top: 1em;
                            border-top: 1px solid #ddd;
                            font-size: 9pt;
                            color: #999;
                            text-align: center;
                        }
                        @media print {
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <h1>${article.title}</h1>
                    <div class="meta">
                        作者：${article.author || '匿名'} | 
                        发布时间：${this.formatDate(article.createdAt)} |
                        来源：${window.location.origin}
                    </div>
                    <div class="content">
                        ${article.content}
                    </div>
                    <div class="footer">
                        <p>本文档由 ${window.location.origin} 生成</p>
                        <p>原文链接：${window.location.origin}/article.html?id=${articleId}</p>
                    </div>
                    <div class="no-print" style="margin-top: 20px; text-align: center;">
                        <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer;">
                            打印 / 保存为PDF
                        </button>
                    </div>
                </body>
                </html>
            `);

            printWindow.document.close();
            
            // 自动触发打印
            setTimeout(() => {
                printWindow.print();
            }, 500);

            return { success: true, message: 'PDF导出准备就绪' };
        } catch (error) {
            console.error('PDF导出失败:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * 导出为 Markdown
     */
    async exportToMarkdown(articleId) {
        try {
            const article = await this.fetchArticle(articleId);
            if (!article) throw new Error('文章不存在');

            // 将HTML内容转换为Markdown
            let markdown = this.htmlToMarkdown(article.content);
            
            // 添加元数据
            const frontmatter = `---
title: ${article.title}
author: ${article.author || '匿名'}
date: ${article.createdAt}
categories: ${article.category || '未分类'}
tags: ${article.tags ? article.tags.join(', ') : ''}
---

`;

            const fullMarkdown = frontmatter + markdown;

            // 下载文件
            this.downloadFile(
                fullMarkdown,
                `${this.sanitizeFilename(article.title)}.md`,
                'text/markdown'
            );

            return { success: true, message: 'Markdown导出成功' };
        } catch (error) {
            console.error('Markdown导出失败:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * 导出为 EPUB（需要后端支持或使用库）
     */
    async exportToEPUB(articleId) {
        try {
            // 调用后端API生成EPUB
            const response = await fetch(`${this.options.apiBaseUrl}/export/epub`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ articleId })
            });

            if (!response.ok) throw new Error('EPUB生成失败');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `article-${articleId}.epub`;
            a.click();
            
            URL.revokeObjectURL(url);

            return { success: true, message: 'EPUB导出成功' };
        } catch (error) {
            console.error('EPUB导出失败:', error);
            // 降级为提示用户使用其他格式
            alert('EPUB导出暂时不可用，请使用PDF或Markdown格式');
            return { success: false, message: error.message };
        }
    }

    /**
     * 导出为图片（长图）
     */
    async exportToImage(articleId) {
        try {
            // 使用 html2canvas 或类似库
            if (typeof html2canvas === 'undefined') {
                await this.loadScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
            }

            const article = await this.fetchArticle(articleId);
            const container = document.createElement('div');
            container.innerHTML = `
                <div style="padding: 40px; background: white; width: 800px; font-family: 'Microsoft YaHei', sans-serif;">
                    <h1 style="font-size: 28px; margin-bottom: 10px;">${article.title}</h1>
                    <div style="color: #999; font-size: 14px; margin-bottom: 30px;">
                        ${article.author || '匿名'} · ${this.formatDate(article.createdAt)}
                    </div>
                    <div style="font-size: 16px; line-height: 1.8; color: #333;">
                        ${article.content}
                    </div>
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; text-align: center;">
                        来自 ${window.location.origin}
                    </div>
                </div>
            `;
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            document.body.appendChild(container);

            const canvas = await html2canvas(container.firstElementChild, {
                scale: 2,
                useCORS: true,
                logging: false
            });

            document.body.removeChild(container);

            // 下载图片
            const link = document.createElement('a');
            link.download = `${this.sanitizeFilename(article.title)}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            return { success: true, message: '图片导出成功' };
        } catch (error) {
            console.error('图片导出失败:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * 导出为纯文本
     */
    async exportToText(articleId) {
        try {
            const article = await this.fetchArticle(articleId);
            if (!article) throw new Error('文章不存在');

            // 提取纯文本
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = article.content;
            let text = tempDiv.textContent || tempDiv.innerText || '';
            
            // 添加元数据
            text = `${article.title}\n\n` +
                   `作者：${article.author || '匿名'}\n` +
                   `时间：${this.formatDate(article.createdAt)}\n` +
                   `链接：${window.location.origin}/article.html?id=${articleId}\n\n` +
                   `===============================\n\n` +
                   text;

            this.downloadFile(
                text,
                `${this.sanitizeFilename(article.title)}.txt`,
                'text/plain'
            );

            return { success: true, message: '文本导出成功' };
        } catch (error) {
            console.error('文本导出失败:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * 批量导出
     */
    async batchExport(articleIds, format = 'markdown') {
        try {
            const articles = await Promise.all(
                articleIds.map(id => this.fetchArticle(id))
            );

            switch (format) {
                case 'markdown':
                    return this.exportBatchMarkdown(articles);
                case 'json':
                    return this.exportBatchJSON(articles);
                default:
                    throw new Error('不支持的格式');
            }
        } catch (error) {
            console.error('批量导出失败:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * 批量导出为 Markdown
     */
    exportBatchMarkdown(articles) {
        let content = `# 文章合集\n\n`;
        content += `导出时间：${new Date().toLocaleString('zh-CN')}\n\n`;
        content += `===============================\n\n`;

        articles.forEach((article, index) => {
            content += `## ${index + 1}. ${article.title}\n\n`;
            content += `> 作者：${article.author || '匿名'} | 时间：${this.formatDate(article.createdAt)}\n\n`;
            content += this.htmlToMarkdown(article.content);
            content += '\n\n---\n\n';
        });

        this.downloadFile(
            content,
            `articles-${Date.now()}.md`,
            'text/markdown'
        );

        return { success: true, message: `成功导出 ${articles.length} 篇文章` };
    }

    /**
     * 批量导出为 JSON
     */
    exportBatchJSON(articles) {
        const data = {
            exportTime: new Date().toISOString(),
            total: articles.length,
            articles: articles.map(a => ({
                title: a.title,
                author: a.author,
                createdAt: a.createdAt,
                category: a.category,
                tags: a.tags,
                content: this.htmlToMarkdown(a.content)
            }))
        };

        this.downloadFile(
            JSON.stringify(data, null, 2),
            `articles-${Date.now()}.json`,
            'application/json'
        );

        return { success: true, message: `成功导出 ${articles.length} 篇文章` };
    }

    /**
     * 获取文章
     */
    async fetchArticle(articleId) {
        try {
            const response = await fetch(`${this.options.apiBaseUrl}/articles/${articleId}`);
            if (!response.ok) throw new Error('获取文章失败');
            return await response.json();
        } catch (error) {
            // 返回模拟数据
            return {
                id: articleId,
                title: '示例文章标题',
                content: '<p>这是一篇示例文章的内容。</p><h2>第一章</h2><p>详细内容...</p>',
                author: '作者名',
                createdAt: new Date().toISOString(),
                category: '技术',
                tags: ['示例', '测试']
            };
        }
    }

    /**
     * HTML 转 Markdown
     */
    htmlToMarkdown(html) {
        let md = html;

        // 标题
        md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
        md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
        md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
        md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');

        // 段落
        md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');

        // 代码块
        md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '\n```\n$1\n```\n');
        md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

        // 链接
        md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

        // 图片
        md = md.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)');
        md = md.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![]($1)');

        // 列表
        md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
        md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, '$1\n');
        md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, '$1\n');

        // 强调
        md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
        md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');

        // 引用
        md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '> $1\n\n');

        // 换行
        md = md.replace(/<br\s*\/?>/gi, '\n');

        // 移除其他标签
        md = md.replace(/<[^>]+>/g, '');

        // 解码HTML实体
        const div = document.createElement('div');
        div.innerHTML = md;
        md = div.textContent;

        return md.trim();
    }

    /**
     * 下载文件
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    /**
     * 加载外部脚本
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * 格式化日期
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * 清理文件名
     */
    sanitizeFilename(filename) {
        return filename.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100);
    }
}

/**
 * 导出UI组件
 */
class ExportUI {
    constructor(exportSystem) {
        this.exportSystem = exportSystem;
    }

    /**
     * 渲染导出按钮
     */
    renderExportButton(containerId, articleId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="export-dropdown">
                <button class="export-btn" onclick="this.nextElementSibling.classList.toggle('show')">
                    📥 导出
                </button>
                <div class="export-menu">
                    <a href="#" onclick="exportUI.handleExport('${articleId}', 'pdf'); return false;">
                        📄 导出为 PDF
                    </a>
                    <a href="#" onclick="exportUI.handleExport('${articleId}', 'markdown'); return false;">
                        📝 导出为 Markdown
                    </a>
                    <a href="#" onclick="exportUI.handleExport('${articleId}', 'text'); return false;">
                        📃 导出为纯文本
                    </a>
                    <a href="#" onclick="exportUI.handleExport('${articleId}', 'image'); return false;">
                        🖼 导出为图片
                    </a>
                </div>
            </div>
        `;

        this.injectStyles();

        // 点击外部关闭菜单
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                const menu = container.querySelector('.export-menu');
                if (menu) menu.classList.remove('show');
            }
        });
    }

    /**
     * 处理导出
     */
    async handleExport(articleId, format) {
        // 关闭菜单
        document.querySelectorAll('.export-menu').forEach(m => m.classList.remove('show'));

        // 显示加载状态
        this.showLoading();

        let result;
        switch (format) {
            case 'pdf':
                result = await this.exportSystem.exportToPDF(articleId);
                break;
            case 'markdown':
                result = await this.exportSystem.exportToMarkdown(articleId);
                break;
            case 'text':
                result = await this.exportSystem.exportToText(articleId);
                break;
            case 'image':
                result = await this.exportSystem.exportToImage(articleId);
                break;
            default:
                result = { success: false, message: '未知格式' };
        }

        this.hideLoading();

        if (result.success) {
            this.showToast(result.message, 'success');
        } else {
            this.showToast(result.message, 'error');
        }
    }

    /**
     * 显示加载状态
     */
    showLoading() {
        const overlay = document.createElement('div');
        overlay.id = 'export-loading';
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        overlay.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; text-align: center;">
                <div class="loading-spinner" style="
                    width: 40px; height: 40px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 15px;
                "></div>
                <p>正在导出...</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    /**
     * 隐藏加载状态
     */
    hideLoading() {
        const overlay = document.getElementById('export-loading');
        if (overlay) overlay.remove();
    }

    /**
     * 显示提示
     */
    showToast(message, type) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#52c41a' : '#ff4d4f'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10001;
            animation: slideUp 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    /**
     * 注入样式
     */
    injectStyles() {
        if (document.getElementById('export-ui-styles')) return;

        const styles = `
            <style id="export-ui-styles">
                .export-dropdown {
                    position: relative;
                    display: inline-block;
                }

                .export-btn {
                    padding: 8px 16px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 6px;
                    color: #fff;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .export-btn:hover {
                    background: rgba(255,255,255,0.2);
                }

                .export-menu {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    margin-top: 8px;
                    background: #2d2d2d;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    min-width: 180px;
                    display: none;
                    overflow: hidden;
                }

                .export-menu.show {
                    display: block;
                }

                .export-menu a {
                    display: block;
                    padding: 12px 16px;
                    color: #ccc;
                    text-decoration: none;
                    transition: background 0.2s;
                }

                .export-menu a:hover {
                    background: rgba(255,255,255,0.1);
                    color: #fff;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translate(-50%, 20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// 导出
window.ContentExportSystem = ContentExportSystem;
window.ExportUI = ExportUI;

// 初始化
let contentExport, exportUI;

document.addEventListener('DOMContentLoaded', () => {
    contentExport = new ContentExportSystem();
    exportUI = new ExportUI(contentExport);
    window.contentExport = contentExport;
    window.exportUI = exportUI;
});
