/**
 * 阅读时间估算
 * 在文章标题旁显示预计阅读时间
 */
class ReadingTime {
    constructor(options = {}) {
        this.containerSelector = options.containerSelector || '.article-meta, .post-meta';
        this.contentSelector = options.contentSelector || '.article-content, .post-content, article';
        this.wpm = options.wpm || 300;
    }

    init() {
        const content = document.querySelector(this.contentSelector);
        const container = document.querySelector(this.containerSelector);
        if (!content || !container) return;

        const text = content.textContent || '';
        const wordCount = text.trim().length;
        const minutes = Math.ceil(wordCount / this.wpm);

        const badge = document.createElement('span');
        badge.className = 'reading-time-badge';
        badge.innerHTML = `⏱️ ${minutes} 分钟阅读`;
        badge.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
            color: #999;
            margin-left: 12px;
            padding: 2px 10px;
            background: #f5f5f5;
            border-radius: 12px;
        `;

        container.appendChild(badge);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const rt = new ReadingTime();
    rt.init();
});
export default ReadingTime;
