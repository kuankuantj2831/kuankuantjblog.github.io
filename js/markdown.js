/**
 * 安全的 Markdown 渲染器
 * 支持：标题、粗体、斜体、行内代码、代码块、链接、图片、列表、引用、表格、分割线
 * 所有输出均经过 XSS 防护
 */

// HTML 转义
function esc(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// URL 安全检查
function safeUrl(url) {
    const s = String(url).trim();
    if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/') || s.startsWith('#')) {
        return s;
    }
    return '';
}

/**
 * 将 Markdown 文本渲染为安全的 HTML
 * @param {string} md - Markdown 原文
 * @returns {string} 安全的 HTML
 */
export function renderMarkdown(md) {
    if (!md) return '';

    const lines = md.split('\n');
    const result = [];
    let inCodeBlock = false;
    let codeBlockLang = '';
    let codeLines = [];
    let inTable = false;
    let tableRows = [];
    let inList = false;
    let listType = '';  // 'ul' or 'ol'
    let listItems = [];
    let inBlockquote = false;
    let blockquoteLines = [];

    function flushList() {
        if (inList && listItems.length > 0) {
            const tag = listType;
            result.push(`<${tag}>${listItems.map(li => `<li>${renderInline(li)}</li>`).join('')}</${tag}>`);
            listItems = [];
            inList = false;
        }
    }

    function flushBlockquote() {
        if (inBlockquote && blockquoteLines.length > 0) {
            result.push(`<blockquote>${blockquoteLines.map(l => renderInline(l)).join('<br>')}</blockquote>`);
            blockquoteLines = [];
            inBlockquote = false;
        }
    }

    function flushTable() {
        if (inTable && tableRows.length > 0) {
            let html = '<div class="md-table-wrap"><table>';
            tableRows.forEach((row, i) => {
                const cells = row.split('|').map(c => c.trim()).filter(c => c !== '');
                // 跳过分隔行（---）
                if (cells.every(c => /^[-:]+$/.test(c))) return;
                const tag = i === 0 ? 'th' : 'td';
                const rowTag = i === 0 ? 'thead' : (i === 1 ? 'tbody' : '');
                if (i === 0) html += '<thead>';
                if (i === 1) html += '</thead><tbody>';
                html += '<tr>' + cells.map(c => `<${tag}>${renderInline(c)}</${tag}>`).join('') + '</tr>';
            });
            html += '</tbody></table></div>';
            result.push(html);
            tableRows = [];
            inTable = false;
        }
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 代码块 ```
        if (line.trimStart().startsWith('```')) {
            if (inCodeBlock) {
                // 结束代码块
                const langClass = codeBlockLang ? ` class="language-${esc(codeBlockLang)}"` : '';
                result.push(`<pre><code${langClass}>${codeLines.map(l => esc(l)).join('\n')}</code></pre>`);
                codeLines = [];
                codeBlockLang = '';
                inCodeBlock = false;
            } else {
                // 开始代码块前，先 flush 其他状态
                flushList();
                flushBlockquote();
                flushTable();
                inCodeBlock = true;
                codeBlockLang = line.trimStart().slice(3).trim();
            }
            continue;
        }

        if (inCodeBlock) {
            codeLines.push(line);
            continue;
        }

        // 表格行（包含 |）
        if (line.includes('|') && line.trim().startsWith('|')) {
            if (!inTable) {
                flushList();
                flushBlockquote();
                inTable = true;
            }
            tableRows.push(line.trim());
            continue;
        } else if (inTable) {
            flushTable();
        }

        // 引用 >
        if (line.trimStart().startsWith('>')) {
            if (!inBlockquote) {
                flushList();
                flushTable();
                inBlockquote = true;
            }
            blockquoteLines.push(line.replace(/^\s*>\s?/, ''));
            continue;
        } else if (inBlockquote) {
            flushBlockquote();
        }

        // 无序列表 - / * / +
        const ulMatch = line.match(/^(\s*)([-*+])\s+(.+)/);
        if (ulMatch) {
            if (!inList || listType !== 'ul') {
                flushList();
                flushBlockquote();
                flushTable();
                inList = true;
                listType = 'ul';
            }
            listItems.push(ulMatch[3]);
            continue;
        }

        // 有序列表 1. 2. 3.
        const olMatch = line.match(/^(\s*)\d+\.\s+(.+)/);
        if (olMatch) {
            if (!inList || listType !== 'ol') {
                flushList();
                flushBlockquote();
                flushTable();
                inList = true;
                listType = 'ol';
            }
            listItems.push(olMatch[2]);
            continue;
        }

        // 非列表行，flush 列表
        if (inList) flushList();

        const trimmed = line.trim();

        // 空行
        if (trimmed === '') {
            result.push('');
            continue;
        }

        // 分割线 --- / *** / ___
        if (/^([-*_])\1{2,}$/.test(trimmed)) {
            result.push('<hr>');
            continue;
        }

        // 标题 # ~ ######
        const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            result.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
            continue;
        }

        // 普通段落
        result.push(`<p>${renderInline(trimmed)}</p>`);
    }

    // flush 残留状态
    if (inCodeBlock) {
        const langClass = codeBlockLang ? ` class="language-${esc(codeBlockLang)}"` : '';
        result.push(`<pre><code${langClass}>${codeLines.map(l => esc(l)).join('\n')}</code></pre>`);
    }
    flushList();
    flushBlockquote();
    flushTable();

    return result.join('\n');
}

/**
 * 渲染行内 Markdown 元素
 */
function renderInline(text) {
    let s = esc(text);

    // 行内代码 `code`（先处理，避免内部被其他规则干扰）
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 图片 ![alt](url)
    s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
        const safeU = safeUrl(url.replace(/&amp;/g, '&'));
        return safeU ? `<img src="${safeU}" alt="${alt}" loading="lazy" style="max-width:100%;border-radius:4px;">` : `[图片: ${alt}]`;
    });

    // 链接 [text](url)
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
        const safeU = safeUrl(url.replace(/&amp;/g, '&'));
        return safeU ? `<a href="${safeU}" target="_blank" rel="noopener noreferrer">${text}</a>` : text;
    });

    // 粗斜体 ***text*** 或 ___text___
    s = s.replace(/\*{3}(.+?)\*{3}/g, '<strong><em>$1</em></strong>');
    s = s.replace(/_{3}(.+?)_{3}/g, '<strong><em>$1</em></strong>');

    // 粗体 **text** 或 __text__
    s = s.replace(/\*{2}(.+?)\*{2}/g, '<strong>$1</strong>');
    s = s.replace(/_{2}(.+?)_{2}/g, '<strong>$1</strong>');

    // 斜体 *text* 或 _text_
    s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
    s = s.replace(/_(.+?)_/g, '<em>$1</em>');

    // 删除线 ~~text~~
    s = s.replace(/~~(.+?)~~/g, '<del>$1</del>');

    return s;
}