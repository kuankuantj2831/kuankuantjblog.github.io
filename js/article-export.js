/**
 * 文章导出功能
 * 支持导出为 HTML、纯文本、Markdown 格式
 */

const ArticleExport = {
    /**
     * 获取文章内容
     */
    getArticleContent() {
        // 尝试多种选择器获取文章内容
        const selectors = [
            '.article-content',
            '.post-content',
            'article .content',
            '#article-content',
            '.entry-content',
            'article'
        ];
        
        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el) return el;
        }
        
        return null;
    },

    /**
     * 获取文章标题
     */
    getArticleTitle() {
        return document.querySelector('h1')?.textContent?.trim() ||
               document.querySelector('.article-title')?.textContent?.trim() ||
               document.title?.replace(/ - .*$/, '') ||
               '未命名文章';
    },

    /**
     * 获取文章作者
     */
    getArticleAuthor() {
        return document.querySelector('.author-name')?.textContent?.trim() ||
               document.querySelector('.post-author')?.textContent?.trim() ||
               '未知作者';
    },

    /**
     * 获取发布时间
     */
    getPublishDate() {
        const dateEl = document.querySelector('.publish-date, .post-date, time');
        return dateEl?.textContent?.trim() || dateEl?.getAttribute('datetime') || '';
    },

    /**
     * HTML 转纯文本
     */
    htmlToText(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        // 替换常见标签为文本格式
        let text = temp.innerHTML
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<\/h[1-6]>/gi, '\n\n')
            .replace(/<li>/gi, '\n- ')
            .replace(/<\/li>/gi, '')
            .replace(/<[^>]+>/g, '');
        
        // 解码 HTML 实体
        temp.innerHTML = text;
        text = temp.textContent;
        
        // 清理多余空行
        return text.replace(/\n{3,}/g, '\n\n').trim();
    },

    /**
     * HTML 转 Markdown（简化版）
     */
    htmlToMarkdown(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        let markdown = temp.innerHTML;
        
        // 标题
        markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
        markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
        markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
        markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
        markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
        markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');
        
        // 粗体和斜体
        markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
        markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
        markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
        markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
        
        // 链接
        markdown = markdown.replace(/<a[^>]+href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
        
        // 图片
        markdown = markdown.replace(/<img[^>]+src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)');
        markdown = markdown.replace(/<img[^>]+alt="([^"]*)"[^>]*src="([^"]*)"[^>]*>/gi, '![$1]($2)');
        markdown = markdown.replace(/<img[^>]+src="([^"]*)"[^>]*>/gi, '![]($1)');
        
        // 代码块
        markdown = markdown.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```\n\n');
        markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
        
        // 列表
        markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, function(match, content) {
            return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n') + '\n';
        });
        markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gis, function(match, content) {
            let index = 1;
            return content.replace(/<li[^>]*>(.*?)<\/li>/gi, function() {
                return (index++) + '. ' + arguments[1] + '\n';
            }) + '\n';
        });
        
        // 段落和换行
        markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
        markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
        
        // 移除剩余标签
        markdown = markdown.replace(/<[^>]+>/g, '');
        
        // 解码 HTML 实体
        const textarea = document.createElement('textarea');
        textarea.innerHTML = markdown;
        markdown = textarea.value;
        
        // 清理多余空行
        return markdown.replace(/\n{4,}/g, '\n\n\n').trim();
    },

    /**
     * 导出为 HTML 文件
     */
    exportHTML() {
        const title = this.getArticleTitle();
        const author = this.getArticleAuthor();
        const date = this.getPublishDate();
        const contentEl = this.getArticleContent();
        
        if (!contentEl) {
            alert('无法获取文章内容');
            return;
        }
        
        const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.8;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            color: #333;
            background: #fff;
        }
        h1 { font-size: 28px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        h2 { font-size: 24px; margin-top: 30px; }
        h3 { font-size: 20px; }
        p { margin: 15px 0; }
        img { max-width: 100%; height: auto; }
        pre {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        code {
            background: #f5f5f5;
            padding: 2px 5px;
            border-radius: 3px;
            font-family: Consolas, Monaco, monospace;
        }
        blockquote {
            border-left: 4px solid #ddd;
            margin: 0;
            padding-left: 20px;
            color: #666;
        }
        .meta {
            color: #999;
            font-size: 14px;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
        }
        .source {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #999;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <div class="meta">
        作者：${author}${date ? ' | 发布时间：' + date : ''}
    </div>
    <div class="content">
        ${contentEl.innerHTML}
    </div>
    <div class="source">
        原文链接：${window.location.href}<br>
        导出时间：${new Date().toLocaleString('zh-CN')}
    </div>
</body>
</html>`;
        
        this.downloadFile(htmlContent, `${title}.html`, 'text/html');
        this.showToast('文章已导出为 HTML');
    },

    /**
     * 导出为纯文本
     */
    exportText() {
        const title = this.getArticleTitle();
        const author = this.getArticleAuthor();
        const date = this.getPublishDate();
        const contentEl = this.getArticleContent();
        
        if (!contentEl) {
            alert('无法获取文章内容');
            return;
        }
        
        let textContent = `${title}\n`;
        textContent += `${'='.repeat(title.length)}\n\n`;
        textContent += `作者：${author}\n`;
        if (date) textContent += `发布时间：${date}\n`;
        textContent += `原文链接：${window.location.href}\n`;
        textContent += `${'-'.repeat(40)}\n\n`;
        textContent += this.htmlToText(contentEl.innerHTML);
        textContent += `\n\n${'-'.repeat(40)}\n`;
        textContent += `导出时间：${new Date().toLocaleString('zh-CN')}\n`;
        
        this.downloadFile(textContent, `${title}.txt`, 'text/plain');
        this.showToast('文章已导出为文本');
    },

    /**
     * 导出为 Markdown
     */
    exportMarkdown() {
        const title = this.getArticleTitle();
        const author = this.getArticleAuthor();
        const date = this.getPublishDate();
        const contentEl = this.getArticleContent();
        
        if (!contentEl) {
            alert('无法获取文章内容');
            return;
        }
        
        let mdContent = '# ' + title + '\n\n';
        mdContent += '> 作者：' + author + '  \n';
        if (date) mdContent += '> 发布时间：' + date + '  \n';
        mdContent += '> 原文链接：[' + window.location.href + '](' + window.location.href + ')\n\n';
        mdContent += `---\n\n`;
        mdContent += this.htmlToMarkdown(contentEl.innerHTML);
        mdContent += `\n\n---\n\n`;
        mdContent += `*导出时间：${new Date().toLocaleString('zh-CN')}*`;
        
        this.downloadFile(mdContent, `${title}.md`, 'text/markdown');
        this.showToast('文章已导出为 Markdown');
    },

    /**
     * 下载文件
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * 显示提示
     */
    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: #fff;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 14px;
            z-index: 9999;
            animation: fadeInUp 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    },

    /**
     * 创建导出按钮
     */
    createExportButton() {
        const btn = document.createElement('button');
        btn.className = 'article-export-btn';
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:5px;">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            导出文章
        `;
        btn.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 13px;
            transition: transform 0.2s, box-shadow 0.2s;
        `;
        btn.onmouseover = () => {
            btn.style.transform = 'translateY(-2px)';
            btn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
        };
        btn.onmouseout = () => {
            btn.style.transform = 'translateY(0)';
            btn.style.boxShadow = 'none';
        };
        btn.onclick = () => this.showExportMenu(btn);
        
        return btn;
    },

    /**
     * 显示导出菜单
     */
    showExportMenu(targetBtn) {
        // 移除已存在的菜单
        const existing = document.querySelector('.export-menu-overlay');
        if (existing) existing.remove();
        
        const overlay = document.createElement('div');
        overlay.className = 'export-menu-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.3);
            z-index: 9998;
        `;
        overlay.onclick = () => overlay.remove();
        
        const menu = document.createElement('div');
        menu.className = 'export-menu';
        menu.style.cssText = `
            position: absolute;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            padding: 8px 0;
            min-width: 160px;
            z-index: 9999;
        `;
        
        const rect = targetBtn.getBoundingClientRect();
        menu.style.top = (rect.bottom + 10) + 'px';
        menu.style.left = rect.left + 'px';
        
        const options = [
            { label: '导出为 HTML', icon: '📄', action: () => this.exportHTML() },
            { label: '导出为 Markdown', icon: '📝', action: () => this.exportMarkdown() },
            { label: '导出为纯文本', icon: '📃', action: () => this.exportText() }
        ];
        
        options.forEach(opt => {
            const item = document.createElement('div');
            item.style.cssText = `
                padding: 12px 20px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 10px;
                transition: background 0.2s;
            `;
            item.innerHTML = `<span>${opt.icon}</span><span>${opt.label}</span>`;
            item.onmouseover = () => item.style.background = '#f5f5f5';
            item.onmouseout = () => item.style.background = 'transparent';
            item.onclick = () => {
                opt.action();
                overlay.remove();
            };
            menu.appendChild(item);
        });
        
        overlay.appendChild(menu);
        document.body.appendChild(overlay);
    },

    /**
     * 自动插入导出按钮到文章页面
     */
    autoInsert() {
        // 只在文章页面执行
        if (!document.querySelector('.article-container') && 
            !document.querySelector('article') &&
            !document.querySelector('.post-content')) {
            return;
        }
        
        // 查找插入位置
        const insertSelectors = [
            '.article-actions',
            '.post-actions',
            '.article-meta',
            '.post-meta',
            '.article-header'
        ];
        
        for (const selector of insertSelectors) {
            const container = document.querySelector(selector);
            if (container) {
                const btn = this.createExportButton();
                container.appendChild(btn);
                break;
            }
        }
    },

    /**
     * 初始化
     */
    init() {
        // 添加动画样式
        if (!document.getElementById('article-export-styles')) {
            const style = document.createElement('style');
            style.id = 'article-export-styles';
            style.textContent = `
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translate(-50%, 20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // 自动插入按钮
        this.autoInsert();
    }
};

// 导出到全局
window.ArticleExport = ArticleExport;

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    ArticleExport.init();
});
