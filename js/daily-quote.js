/**
 * 每日名言 - Daily Quote
 * 显示每日励志名言，支持多种分类
 */

class DailyQuote {
    constructor(options = {}) {
        this.options = {
            categories: ['inspirational', 'wisdom', 'technology', 'life'],
            changeInterval: 24 * 60 * 60 * 1000, // 24小时
            showAuthor: true,
            showCategory: true,
            enableShare: true,
            enableCopy: true,
            position: 'sidebar', // sidebar, floating, header
            ...options
        };
        
        this.currentQuote = null;
        this.quotes = this.getQuotes();
        
        this.init();
    }
    
    init() {
        this.loadDailyQuote();
        this.createUI();
        this.injectStyles();
        
        console.log('[每日名言] 系统已初始化');
    }
    
    /**
     * 名言数据库
     */
    getQuotes() {
        return [
            // 励志
            { text: '千里之行，始于足下。', author: '老子', category: 'inspirational' },
            { text: '不积跬步，无以至千里。', author: '荀子', category: 'inspirational' },
            { text: '天行健，君子以自强不息。', author: '周易', category: 'inspirational' },
            { text: '路漫漫其修远兮，吾将上下而求索。', author: '屈原', category: 'inspirational' },
            { text: '宝剑锋从磨砺出，梅花香自苦寒来。', author: '古诗', category: 'inspirational' },
            
            // 智慧
            { text: '知之为知之，不知为不知，是知也。', author: '孔子', category: 'wisdom' },
            { text: '学而不思则罔，思而不学则殆。', author: '孔子', category: 'wisdom' },
            { text: '博学之，审问之，慎思之，明辨之，笃行之。', author: '礼记', category: 'wisdom' },
            { text: '工欲善其事，必先利其器。', author: '论语', category: 'wisdom' },
            { text: '欲速则不达，见小利则大事不成。', author: '论语', category: 'wisdom' },
            
            // 科技
            { text: 'Talk is cheap. Show me the code.', author: 'Linus Torvalds', category: 'technology' },
            { text: 'Stay hungry, stay foolish.', author: 'Steve Jobs', category: 'technology' },
            { text: '任何足够先进的技术都与魔法无异。', author: 'Arthur C. Clarke', category: 'technology' },
            { text: '软件就像性，免费的比付费的好。', author: 'Linus Torvalds', category: 'technology' },
            { text: '编程不是为了告诉计算机做什么，而是告诉人类你想要计算机做什么。', author: 'Donald Knuth', category: 'technology' },
            
            // 人生
            { text: '生活就像一盒巧克力，你永远不知道下一颗是什么味道。', author: '阿甘正传', category: 'life' },
            { text: '人生苦短，我用Python。', author: 'Bruce Eckel', category: 'life' },
            { text: '简单是终极的复杂。', author: '达芬奇', category: 'life' },
            { text: '世界上只有一种真正的英雄主义，就是认清了生活的真相后还依然热爱它。', author: '罗曼·罗兰', category: 'life' },
            { text: '种一棵树最好的时间是十年前，其次是现在。', author: 'Dambisa Moyo', category: 'life' }
        ];
    }
    
    /**
     * 加载今日名言
     */
    loadDailyQuote() {
        const today = new Date().toDateString();
        const saved = localStorage.getItem('daily_quote');
        
        if (saved) {
            const data = JSON.parse(saved);
            if (data.date === today) {
                this.currentQuote = data.quote;
                return;
            }
        }
        
        // 生成新的名言
        this.currentQuote = this.getRandomQuote();
        this.saveDailyQuote(today);
    }
    
    /**
     * 获取随机名言
     */
    getRandomQuote() {
        const category = this.options.categories[Math.floor(Math.random() * this.options.categories.length)];
        const quotes = this.quotes.filter(q => q.category === category);
        return quotes[Math.floor(Math.random() * quotes.length)];
    }
    
    /**
     * 保存今日名言
     */
    saveDailyQuote(date) {
        localStorage.setItem('daily_quote', JSON.stringify({
            date: date,
            quote: this.currentQuote
        }));
    }
    
    /**
     * 创建UI
     */
    createUI() {
        const widget = document.createElement('div');
        widget.className = `daily-quote-widget ${this.options.position}`;
        widget.innerHTML = `
            <div class="quote-header">
                <span class="quote-icon">💬</span>
                <span class="quote-title">每日一言</span>
                ${this.options.showCategory ? `<span class="quote-category">${this.getCategoryName(this.currentQuote.category)}</span>` : ''}
            </div>
            <div class="quote-content">
                <blockquote class="quote-text">${this.currentQuote.text}</blockquote>
                ${this.options.showAuthor ? `<cite class="quote-author">— ${this.currentQuote.author}</cite>` : ''}
            </div>
            <div class="quote-actions">
                <button class="quote-btn refresh-btn" title="换一句">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                    </svg>
                </button>
                ${this.options.enableCopy ? `
                <button class="quote-btn copy-btn" title="复制">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                </button>
                ` : ''}
                ${this.options.enableShare ? `
                <button class="quote-btn share-btn" title="分享">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="18" cy="5" r="3"></circle>
                        <circle cx="6" cy="12" r="3"></circle>
                        <circle cx="18" cy="19" r="3"></circle>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                </button>
                ` : ''}
            </div>
        `;
        
        // 绑定事件
        widget.querySelector('.refresh-btn').addEventListener('click', () => this.refreshQuote());
        
        if (this.options.enableCopy) {
            widget.querySelector('.copy-btn').addEventListener('click', () => this.copyQuote());
        }
        
        if (this.options.enableShare) {
            widget.querySelector('.share-btn').addEventListener('click', () => this.shareQuote());
        }
        
        // 插入到页面
        this.insertWidget(widget);
    }
    
    /**
     * 获取分类名称
     */
    getCategoryName(category) {
        const names = {
            inspirational: '励志',
            wisdom: '智慧',
            technology: '科技',
            life: '人生'
        };
        return names[category] || category;
    }
    
    /**
     * 插入组件
     */
    insertWidget(widget) {
        switch (this.options.position) {
            case 'sidebar':
                const sidebar = document.querySelector('.sidebar, aside');
                if (sidebar) {
                    sidebar.insertBefore(widget, sidebar.firstChild);
                } else {
                    document.body.appendChild(widget);
                }
                break;
            case 'header':
                const header = document.querySelector('header, .header');
                if (header) {
                    header.appendChild(widget);
                }
                break;
            case 'floating':
                widget.style.cssText = `
                    position: fixed;
                    right: 20px;
                    bottom: 200px;
                    z-index: 100;
                `;
                document.body.appendChild(widget);
                break;
            default:
                document.body.appendChild(widget);
        }
    }
    
    /**
     * 刷新名言
     */
    refreshQuote() {
        this.currentQuote = this.getRandomQuote();
        
        const widget = document.querySelector('.daily-quote-widget');
        const textEl = widget.querySelector('.quote-text');
        const authorEl = widget.querySelector('.quote-author');
        const categoryEl = widget.querySelector('.quote-category');
        
        // 淡出
        textEl.style.opacity = '0';
        if (authorEl) authorEl.style.opacity = '0';
        
        setTimeout(() => {
            textEl.textContent = this.currentQuote.text;
            if (authorEl) authorEl.textContent = `— ${this.currentQuote.author}`;
            if (categoryEl) categoryEl.textContent = this.getCategoryName(this.currentQuote.category);
            
            // 淡入
            textEl.style.opacity = '1';
            if (authorEl) authorEl.style.opacity = '1';
        }, 300);
        
        // 保存
        this.saveDailyQuote(new Date().toDateString());
    }
    
    /**
     * 复制名言
     */
    async copyQuote() {
        const text = `"${this.currentQuote.text}" — ${this.currentQuote.author}`;
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('✓ 已复制');
        } catch (err) {
            this.showToast('✗ 复制失败', 'error');
        }
    }
    
    /**
     * 分享名言
     */
    shareQuote() {
        const text = `"${this.currentQuote.text}" — ${this.currentQuote.author}`;
        
        if (navigator.share) {
            navigator.share({
                title: '每日名言',
                text: text
            });
        } else {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('✓ 已复制到剪贴板');
            });
        }
    }
    
    /**
     * 显示提示
     */
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = 'quote-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#ff4d4f' : '#52c41a'};
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 13px;
            z-index: 10000;
            animation: quoteToastIn 0.3s ease;
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'quoteToastOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
    
    /**
     * 注入样式
     */
    injectStyles() {
        if (document.getElementById('daily-quote-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'daily-quote-styles';
        style.textContent = `
            .daily-quote-widget {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 16px;
                padding: 20px;
                color: white;
                margin-bottom: 20px;
                box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
            }
            
            .quote-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 16px;
                font-size: 14px;
                opacity: 0.9;
            }
            
            .quote-icon {
                font-size: 1.2em;
            }
            
            .quote-title {
                font-weight: 600;
            }
            
            .quote-category {
                margin-left: auto;
                font-size: 0.85em;
                background: rgba(255,255,255,0.2);
                padding: 2px 8px;
                border-radius: 10px;
            }
            
            .quote-content {
                margin-bottom: 16px;
            }
            
            .quote-text {
                margin: 0 0 12px 0;
                font-size: 1.1em;
                line-height: 1.6;
                font-style: italic;
                transition: opacity 0.3s;
            }
            
            .quote-author {
                display: block;
                font-size: 0.9em;
                opacity: 0.8;
                text-align: right;
                transition: opacity 0.3s;
            }
            
            .quote-actions {
                display: flex;
                gap: 8px;
                justify-content: flex-end;
            }
            
            .quote-btn {
                width: 32px;
                height: 32px;
                border: none;
                background: rgba(255,255,255,0.2);
                color: white;
                border-radius: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            
            .quote-btn:hover {
                background: rgba(255,255,255,0.3);
                transform: translateY(-2px);
            }
            
            .quote-btn svg {
                stroke: currentColor;
            }
            
            @keyframes quoteToastIn {
                from { opacity: 0; transform: translateX(-50%) translateY(10px); }
                to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
            
            @keyframes quoteToastOut {
                to { opacity: 0; transform: translateX(-50%) translateY(-10px); }
            }
        `;
        document.head.appendChild(style);
    }
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.dailyQuote = new DailyQuote();
    });
} else {
    window.dailyQuote = new DailyQuote();
}

export default DailyQuote;
