/**
 * 文章目录生成器 - Table of Contents Generator
 * 自动生成文章目录，支持锚点导航和滚动高亮
 */

class TableOfContents {
    constructor(options = {}) {
        this.options = {
            selector: 'article, .article-content, #articleContent, .post-content',
            headingSelector: 'h1, h2, h3, h4',
            minHeadings: 2,
            position: 'sidebar',
            sticky: true,
            smoothScroll: true,
            offset: 80,
            collapseDepth: 2,
            showHierarchy: true,
            ...options
        };
        
        this.headings = [];
        this.tocContainer = null;
        this.activeHeading = null;
        this.isExpanded = true;
        
        this.init();
    }
    
    init() {
        this.articleElement = document.querySelector(this.options.selector);
        
        if (!this.articleElement) {
            console.log('[文章目录] 未检测到文章元素');
            return;
        }
        
        this.extractHeadings();
        
        if (this.headings.length < this.options.minHeadings) {
            console.log('[文章目录] 标题数量不足，不生成目录');
            return;
        }
        
        this.createTOC();
        this.bindEvents();
        this.injectStyles();
        
        console.log(`[文章目录] 已生成，共 ${this.headings.length} 个标题`);
    }
    
    /**
     * 提取文章中的标题
     */
    extractHeadings() {
        const headings = this.articleElement.querySelectorAll(this.options.headingSelector);
        
        headings.forEach((heading, index) => {
            // 为标题添加ID（如果没有）
            if (!heading.id) {
                heading.id = this.generateHeadingId(heading, index);
            }
            
            this.headings.push({
                element: heading,
                id: heading.id,
                text: heading.textContent.trim(),
                level: parseInt(heading.tagName.charAt(1)),
                tagName: heading.tagName.toLowerCase()
            });
        });
    }
    
    /**
     * 生成标题ID
     */
    generateHeadingId(heading, index) {
        // 尝试从文本生成
        const text = heading.textContent.trim();
        let id = text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);
        
        // 确保唯一性
        if (!id || document.getElementById(id)) {
            id = `heading-${index}`;
        }
        
        return id;
    }
    
    /**
     * 创建目录
     */
    createTOC() {
        this.tocContainer = document.createElement('nav');
        this.tocContainer.className = 'table-of-contents';
        this.tocContainer.setAttribute('aria-label', '文章目录');
        
        this.tocContainer.innerHTML = `
            <div class="toc-header">
                <h4 class="toc-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                    目录
                </h4>
                <button class="toc-toggle" title="展开/收起">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
            </div>
            <div class="toc-content">
                ${this.generateTOCList()}
            </div>
            <div class="toc-progress">
                <div class="toc-progress-bar" style="width: 0%"></div>
            </div>
        `;
        
        // 插入到页面
        this.insertTOC();
        
        // 绑定事件
        this.tocContainer.querySelector('.toc-toggle').addEventListener('click', () => {
            this.toggleTOC();
        });
    }
    
    /**
     * 生成目录列表HTML
     */
    generateTOCList() {
        if (this.headings.length === 0) return '';
        
        let html = '<ul class="toc-list">';
        let currentLevel = this.headings[0].level;
        let openTags = 1;
        
        this.headings.forEach((heading, index) => {
            const level = heading.level;
            
            // 处理层级变化
            if (level > currentLevel) {
                // 子层级
                const diff = level - currentLevel;
                for (let i = 0; i < diff; i++) {
                    html += '<ul class="toc-sublist">';
                    openTags++;
                }
            } else if (level < currentLevel) {
                // 返回上级
                const diff = currentLevel - level;
                for (let i = 0; i < diff; i++) {
                    html += '</li></ul>';
                    openTags--;
                }
            } else if (index > 0) {
                // 同级
                html += '</li>';
            }
            
            // 添加列表项
            const isCollapsible = level >= this.options.collapseDepth;
            html += `
                <li class="toc-item toc-level-${level} ${isCollapsible ? 'toc-collapsible' : ''}" data-level="${level}">
                    <a href="#${heading.id}" class="toc-link" data-heading-id="${heading.id}">
                        <span class="toc-bullet"></span>
                        <span class="toc-text">${this.escapeHtml(heading.text)}</span>
                    </a>
            `;
            
            currentLevel = level;
        });
        
        // 关闭所有标签
        for (let i = 0; i < openTags; i++) {
            html += '</li></ul>';
        }
        
        return html;
    }
    
    /**
     * 插入目录到页面
     */
    insertTOC() {
        switch (this.options.position) {
            case 'sidebar':
                this.insertSidebar();
                break;
            case 'floating':
                this.insertFloating();
                break;
            case 'top':
                this.insertTop();
                break;
            default:
                this.insertSidebar();
        }
    }
    
    /**
     * 插入到侧边栏
     */
    insertSidebar() {
        // 查找侧边栏
        const sidebar = document.querySelector('.article-sidebar, .post-sidebar, aside');
        
        if (sidebar) {
            sidebar.insertBefore(this.tocContainer, sidebar.firstChild);
        } else {
            // 创建浮动侧边栏
            this.tocContainer.classList.add('toc-sidebar');
            this.tocContainer.style.cssText = `
                position: fixed;
                right: 20px;
                top: 100px;
                width: 260px;
                max-height: calc(100vh - 140px);
                overflow-y: auto;
            `;
            document.body.appendChild(this.tocContainer);
        }
    }
    
    /**
     * 浮动目录
     */
    insertFloating() {
        this.tocContainer.classList.add('toc-floating');
        this.tocContainer.style.cssText = `
            position: fixed;
            left: 20px;
            top: 50%;
            transform: translateY(-50%);
            width: 200px;
            max-height: 70vh;
            overflow-y: auto;
        `;
        document.body.appendChild(this.tocContainer);
    }
    
    /**
     * 插入到文章顶部
     */
    insertTop() {
        this.tocContainer.classList.add('toc-top');
        this.articleElement.insertBefore(this.tocContainer, this.articleElement.firstChild);
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 目录链接点击
        this.tocContainer.addEventListener('click', (e) => {
            const link = e.target.closest('.toc-link');
            if (link) {
                e.preventDefault();
                const headingId = link.getAttribute('data-heading-id');
                this.scrollToHeading(headingId);
            }
        });
        
        // 滚动监听（节流）
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.updateActiveHeading();
                    this.updateProgress();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
        
        // 初始更新
        this.updateActiveHeading();
    }
    
    /**
     * 滚动到指定标题
     */
    scrollToHeading(headingId) {
        const heading = document.getElementById(headingId);
        if (!heading) return;
        
        const offsetTop = heading.getBoundingClientRect().top + window.scrollY - this.options.offset;
        
        if (this.options.smoothScroll) {
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        } else {
            window.scrollTo(0, offsetTop);
        }
        
        // 更新活动状态
        this.setActiveLink(headingId);
        
        // 触发事件
        window.dispatchEvent(new CustomEvent('toc:navigate', {
            detail: { headingId, heading }
        }));
    }
    
    /**
     * 更新活动标题
     */
    updateActiveHeading() {
        // 找到当前可见的标题
        let currentHeading = null;
        const scrollPos = window.scrollY + this.options.offset;
        
        for (let i = this.headings.length - 1; i >= 0; i--) {
            const heading = this.headings[i].element;
            if (heading.getBoundingClientRect().top + window.scrollY <= scrollPos) {
                currentHeading = this.headings[i];
                break;
            }
        }
        
        // 如果没有找到，默认第一个
        if (!currentHeading && this.headings.length > 0) {
            currentHeading = this.headings[0];
        }
        
        if (currentHeading && currentHeading.id !== this.activeHeading) {
            this.setActiveLink(currentHeading.id);
            this.activeHeading = currentHeading.id;
        }
    }
    
    /**
     * 设置活动链接
     */
    setActiveLink(headingId) {
        // 移除之前的活动状态
        this.tocContainer.querySelectorAll('.toc-link').forEach(link => {
            link.classList.remove('active');
            link.parentElement.classList.remove('active');
        });
        
        // 添加新的活动状态
        const activeLink = this.tocContainer.querySelector(`[data-heading-id="${headingId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
            activeLink.parentElement.classList.add('active');
            
            // 确保活动项在可视区域
            this.scrollActiveIntoView(activeLink);
        }
    }
    
    /**
     * 滚动活动项到可视区域
     */
    scrollActiveIntoView(element) {
        const container = this.tocContainer.querySelector('.toc-content');
        if (!container) return;
        
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
        if (elementRect.top < containerRect.top) {
            container.scrollTop -= containerRect.top - elementRect.top + 10;
        } else if (elementRect.bottom > containerRect.bottom) {
            container.scrollTop += elementRect.bottom - containerRect.bottom + 10;
        }
    }
    
    /**
     * 更新进度条
     */
    updateProgress() {
        const progressBar = this.tocContainer.querySelector('.toc-progress-bar');
        if (!progressBar) return;
        
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = window.scrollY;
        const progress = Math.min(100, Math.max(0, (scrolled / docHeight) * 100));
        
        progressBar.style.width = `${progress}%`;
    }
    
    /**
     * 展开/收起目录
     */
    toggleTOC() {
        this.isExpanded = !this.isExpanded;
        this.tocContainer.classList.toggle('collapsed', !this.isExpanded);
        
        const toggleBtn = this.tocContainer.querySelector('.toc-toggle');
        toggleBtn.style.transform = this.isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
    }
    
    /**
     * HTML转义
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * 注入样式
     */
    injectStyles() {
        if (document.getElementById('toc-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'toc-styles';
        style.textContent = `
            .table-of-contents {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border-radius: 12px;
                box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
                overflow: hidden;
                font-size: 14px;
                transition: all 0.3s ease;
            }
            
            .toc-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            
            .toc-title {
                margin: 0;
                font-size: 1em;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .toc-title svg {
                stroke: currentColor;
            }
            
            .toc-toggle {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 28px;
                height: 28px;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            
            .toc-toggle:hover {
                background: rgba(255,255,255,0.3);
            }
            
            .toc-toggle svg {
                stroke: currentColor;
                transition: transform 0.3s;
            }
            
            .toc-content {
                max-height: calc(100vh - 200px);
                overflow-y: auto;
                padding: 8px 0;
            }
            
            .table-of-contents.collapsed .toc-content {
                max-height: 0;
                padding: 0;
                overflow: hidden;
            }
            
            .toc-list,
            .toc-sublist {
                list-style: none;
                margin: 0;
                padding: 0;
            }
            
            .toc-sublist {
                padding-left: 16px;
                border-left: 2px solid #e0e0e0;
                margin-left: 12px;
            }
            
            .toc-item {
                margin: 2px 0;
            }
            
            .toc-link {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 16px;
                color: #555;
                text-decoration: none;
                border-left: 3px solid transparent;
                transition: all 0.2s;
                line-height: 1.5;
            }
            
            .toc-link:hover {
                color: #667eea;
                background: rgba(102, 126, 234, 0.05);
            }
            
            .toc-link.active {
                color: #667eea;
                background: rgba(102, 126, 234, 0.1);
                border-left-color: #667eea;
                font-weight: 500;
            }
            
            .toc-bullet {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: #ccc;
                flex-shrink: 0;
                transition: all 0.2s;
            }
            
            .toc-link:hover .toc-bullet,
            .toc-link.active .toc-bullet {
                background: #667eea;
                transform: scale(1.2);
            }
            
            .toc-text {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .toc-progress {
                height: 3px;
                background: #e0e0e0;
            }
            
            .toc-progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                transition: width 0.1s ease;
            }
            
            /* 层级样式 */
            .toc-level-1 > .toc-link { font-weight: 600; }
            .toc-level-2 > .toc-link { padding-left: 20px; }
            .toc-level-3 > .toc-link { padding-left: 28px; font-size: 0.95em; }
            .toc-level-4 > .toc-link { padding-left: 36px; font-size: 0.9em; }
            
            /* 可折叠 */
            .toc-collapsible .toc-link::after {
                content: '';
                margin-left: auto;
                width: 0;
                height: 0;
                border-left: 4px solid transparent;
                border-right: 4px solid transparent;
                border-top: 4px solid #999;
                transition: transform 0.2s;
            }
            
            .toc-collapsible.expanded .toc-link::after {
                transform: rotate(180deg);
            }
            
            /* 固定定位 */
            .toc-sidebar {
                position: fixed;
                right: 20px;
                top: 100px;
                width: 260px;
                max-height: calc(100vh - 140px);
                z-index: 100;
            }
            
            .toc-floating {
                position: fixed;
                left: 20px;
                top: 50%;
                transform: translateY(-50%);
                width: 200px;
                max-height: 70vh;
                z-index: 100;
            }
            
            .toc-top {
                margin-bottom: 2em;
            }
            
            /* 滚动条样式 */
            .toc-content::-webkit-scrollbar {
                width: 4px;
            }
            
            .toc-content::-webkit-scrollbar-track {
                background: transparent;
            }
            
            .toc-content::-webkit-scrollbar-thumb {
                background: rgba(0,0,0,0.2);
                border-radius: 2px;
            }
            
            /* 暗黑模式 */
            @media (prefers-color-scheme: dark) {
                .table-of-contents {
                    background: rgba(40, 40, 40, 0.95);
                }
                
                .toc-link {
                    color: #bbb;
                }
                
                .toc-link:hover {
                    color: #818cf8;
                    background: rgba(129, 140, 248, 0.1);
                }
                
                .toc-link.active {
                    color: #818cf8;
                    background: rgba(129, 140, 248, 0.15);
                    border-left-color: #818cf8;
                }
                
                .toc-bullet {
                    background: #666;
                }
                
                .toc-link:hover .toc-bullet,
                .toc-link.active .toc-bullet {
                    background: #818cf8;
                }
                
                .toc-sublist {
                    border-left-color: #444;
                }
                
                .toc-progress {
                    background: #444;
                }
            }
            
            /* 移动端隐藏 */
            @media (max-width: 1200px) {
                .toc-sidebar,
                .toc-floating {
                    display: none;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.tableOfContents = new TableOfContents();
    });
} else {
    window.tableOfContents = new TableOfContents();
}

export default TableOfContents;
