/**
 * 阅读进度条与统计 - Reading Progress & Statistics
 * 显示文章阅读进度、阅读时间和统计信息
 */

class ReadingProgress {
    constructor(options = {}) {
        this.options = {
            showProgressBar: true,
            showTimeEstimate: true,
            showReadingStats: true,
            wordsPerMinute: 300,
            updateInterval: 100,
            position: 'top',
            height: 4,
            color: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            ...options
        };
        
        this.progress = 0;
        this.articleElement = null;
        this.readingTime = 0;
        this.startTime = Date.now();
        this.wordCount = 0;
        this.isActive = false;
        this.readingStats = {
            totalWords: 0,
            readWords: 0,
            estimatedTime: 0,
            actualTime: 0,
            scrollProgress: 0,
            paragraphsRead: 0,
            totalParagraphs: 0
        };
        
        this.init();
    }
    
    init() {
        // 检测是否在文章页面
        this.articleElement = document.querySelector('article, .article-content, #articleContent, .post-content');
        
        if (!this.articleElement) {
            console.log('[阅读进度] 未检测到文章元素');
            return;
        }
        
        this.calculateStats();
        this.createUI();
        this.bindEvents();
        this.startTracking();
        
        console.log('[阅读进度] 系统已初始化');
    }
    
    /**
     * 计算文章统计信息
     */
    calculateStats() {
        const text = this.articleElement.textContent || '';
        
        // 统计字数（中文字符 + 英文单词）
        const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
        this.wordCount = chineseChars + englishWords;
        
        // 统计段落
        const paragraphs = this.articleElement.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li');
        this.readingStats.totalParagraphs = paragraphs.length;
        this.readingStats.totalWords = this.wordCount;
        
        // 估算阅读时间
        this.readingStats.estimatedTime = Math.ceil(this.wordCount / this.options.wordsPerMinute);
        
        // 存储文章信息
        this.articleInfo = {
            title: document.title,
            wordCount: this.wordCount,
            url: window.location.href
        };
    }
    
    /**
     * 创建UI组件
     */
    createUI() {
        if (this.options.showProgressBar) {
            this.createProgressBar();
        }
        
        if (this.options.showTimeEstimate) {
            this.createTimeIndicator();
        }
        
        if (this.options.showReadingStats) {
            this.createStatsPanel();
        }
        
        this.injectStyles();
    }
    
    /**
     * 创建进度条
     */
    createProgressBar() {
        const progressBar = document.createElement('div');
        progressBar.id = 'reading-progress-bar';
        progressBar.style.cssText = `
            position: fixed;
            ${this.options.position === 'top' ? 'top: 0;' : 'bottom: 0;'}
            left: 0;
            width: 100%;
            height: ${this.options.height}px;
            background: ${this.options.color};
            transform-origin: left;
            transform: scaleX(0);
            z-index: 9999;
            transition: transform 0.1s ease-out;
        `;
        
        document.body.appendChild(progressBar);
        this.progressBar = progressBar;
    }
    
    /**
     * 创建阅读时间指示器
     */
    createTimeIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'reading-time-indicator';
        indicator.className = 'reading-time-indicator';
        indicator.innerHTML = `
            <div class="time-content">
                <span class="time-icon">⏱️</span>
                <span class="time-text">${this.readingStats.estimatedTime} 分钟阅读</span>
            </div>
            <div class="progress-ring">
                <svg width="40" height="40" viewBox="0 0 40 40">
                    <circle class="progress-ring-bg" cx="20" cy="20" r="16" fill="none" stroke="#e0e0e0" stroke-width="3"/>
                    <circle class="progress-ring-fill" cx="20" cy="20" r="16" fill="none" stroke="#667eea" stroke-width="3"
                        stroke-dasharray="100.53" stroke-dashoffset="100.53" stroke-linecap="round"
                        transform="rotate(-90 20 20)"/>
                </svg>
                <span class="progress-text">0%</span>
            </div>
        `;
        
        indicator.style.cssText = `
            position: fixed;
            right: 20px;
            bottom: 100px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 12px 16px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 100;
            transition: all 0.3s ease;
            cursor: pointer;
        `;
        
        // 点击展开/收起详细统计
        indicator.addEventListener('click', () => this.toggleStatsPanel());
        
        document.body.appendChild(indicator);
        this.timeIndicator = indicator;
    }
    
    /**
     * 创建统计面板
     */
    createStatsPanel() {
        const panel = document.createElement('div');
        panel.id = 'reading-stats-panel';
        panel.className = 'reading-stats-panel';
        panel.innerHTML = `
            <div class="stats-header">
                <h4>📊 阅读统计</h4>
                <button class="close-btn">×</button>
            </div>
            <div class="stats-content">
                <div class="stat-grid">
                    <div class="stat-item">
                        <span class="stat-value" id="stat-progress">0%</span>
                        <span class="stat-label">阅读进度</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" id="stat-time">0:00</span>
                        <span class="stat-label">已用时间</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" id="stat-words">0</span>
                        <span class="stat-label">已读字数</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" id="stat-speed">0</span>
                        <span class="stat-label">字/分钟</span>
                    </div>
                </div>
                <div class="progress-detail">
                    <div class="detail-bar">
                        <div class="detail-fill" id="detail-fill" style="width: 0%"></div>
                    </div>
                    <div class="detail-text">
                        <span id="detail-paragraphs">0/${this.readingStats.totalParagraphs} 段落</span>
                        <span id="detail-remaining">剩余约 ${this.readingStats.estimatedTime} 分钟</span>
                    </div>
                </div>
            </div>
        `;
        
        panel.style.cssText = `
            position: fixed;
            right: 20px;
            bottom: 170px;
            width: 280px;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
            z-index: 99;
            opacity: 0;
            transform: translateY(10px) scale(0.95);
            pointer-events: none;
            transition: all 0.3s ease;
        `;
        
        // 关闭按钮
        panel.querySelector('.close-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.hideStatsPanel();
        });
        
        document.body.appendChild(panel);
        this.statsPanel = panel;
    }
    
    /**
     * 显示统计面板
     */
    showStatsPanel() {
        if (!this.statsPanel) return;
        
        this.statsPanel.style.opacity = '1';
        this.statsPanel.style.transform = 'translateY(0) scale(1)';
        this.statsPanel.style.pointerEvents = 'auto';
        this.statsPanelVisible = true;
    }
    
    /**
     * 隐藏统计面板
     */
    hideStatsPanel() {
        if (!this.statsPanel) return;
        
        this.statsPanel.style.opacity = '0';
        this.statsPanel.style.transform = 'translateY(10px) scale(0.95)';
        this.statsPanel.style.pointerEvents = 'none';
        this.statsPanelVisible = false;
    }
    
    /**
     * 切换统计面板
     */
    toggleStatsPanel() {
        if (this.statsPanelVisible) {
            this.hideStatsPanel();
        } else {
            this.showStatsPanel();
        }
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 滚动事件（节流）
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.updateProgress();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
        
        // 页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseTracking();
            } else {
                this.resumeTracking();
            }
        });
        
        // 页面离开前保存进度
        window.addEventListener('beforeunload', () => {
            this.saveProgress();
        });
    }
    
    /**
     * 开始追踪
     */
    startTracking() {
        this.isActive = true;
        this.startTime = Date.now();
        
        // 加载之前的进度
        this.loadProgress();
        
        // 定时更新
        this.trackingInterval = setInterval(() => {
            if (this.isActive) {
                this.updateTime();
                this.trackVisibleParagraphs();
            }
        }, this.options.updateInterval);
        
        // 初始更新
        this.updateProgress();
    }
    
    /**
     * 暂停追踪
     */
    pauseTracking() {
        this.isActive = false;
    }
    
    /**
     * 恢复追踪
     */
    resumeTracking() {
        this.isActive = true;
    }
    
    /**
     * 更新进度
     */
    updateProgress() {
        if (!this.articleElement) return;
        
        const rect = this.articleElement.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        // 计算阅读进度
        let progress = 0;
        
        if (rect.top <= 0) {
            // 文章顶部已经进入视口
            const scrolled = Math.abs(rect.top);
            const articleHeight = rect.height;
            progress = Math.min(100, Math.max(0, (scrolled / (articleHeight - windowHeight)) * 100));
        }
        
        this.progress = progress;
        this.readingStats.scrollProgress = progress;
        
        // 更新进度条
        if (this.progressBar) {
            this.progressBar.style.transform = `scaleX(${progress / 100})`;
        }
        
        // 更新时间指示器
        this.updateTimeIndicator(progress);
        
        // 更新统计面板
        this.updateStatsPanel();
        
        // 触发进度事件
        window.dispatchEvent(new CustomEvent('reading:progress', {
            detail: { progress, stats: this.readingStats }
        }));
        
        // 阅读完成
        if (progress >= 90 && !this.readingStats.completed) {
            this.readingStats.completed = true;
            this.onReadingComplete();
        }
    }
    
    /**
     * 更新时间指示器
     */
    updateTimeIndicator(progress) {
        if (!this.timeIndicator) return;
        
        // 更新圆形进度
        const circle = this.timeIndicator.querySelector('.progress-ring-fill');
        const text = this.timeIndicator.querySelector('.progress-text');
        
        if (circle) {
            const circumference = 2 * Math.PI * 16;
            const offset = circumference - (progress / 100) * circumference;
            circle.style.strokeDashoffset = offset;
        }
        
        if (text) {
            text.textContent = `${Math.round(progress)}%`;
        }
        
        // 更新剩余时间
        const remainingTime = Math.max(0, Math.ceil(
            (this.readingStats.estimatedTime * (100 - progress) / 100)
        ));
        
        const timeText = this.timeIndicator.querySelector('.time-text');
        if (timeText && remainingTime > 0) {
            timeText.textContent = `剩余 ${remainingTime} 分钟`;
        }
    }
    
    /**
     * 更新时间统计
     */
    updateTime() {
        const now = Date.now();
        this.readingStats.actualTime = Math.floor((now - this.startTime) / 1000);
        
        // 计算阅读速度
        if (this.readingStats.actualTime > 0) {
            const minutes = this.readingStats.actualTime / 60;
            const readWords = Math.floor((this.progress / 100) * this.wordCount);
            this.readingStats.readWords = readWords;
            this.readingStats.readingSpeed = Math.round(readWords / Math.max(minutes, 0.1));
        }
    }
    
    /**
     * 追踪可见段落
     */
    trackVisibleParagraphs() {
        const paragraphs = this.articleElement.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li');
        let visibleCount = 0;
        
        paragraphs.forEach((p, index) => {
            const rect = p.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.8 && rect.bottom > 0) {
                visibleCount++;
                p.dataset.read = 'true';
            }
        });
        
        // 计算已读段落数
        const readParagraphs = Array.from(paragraphs).filter(p => p.dataset.read === 'true').length;
        this.readingStats.paragraphsRead = readParagraphs;
    }
    
    /**
     * 更新统计面板
     */
    updateStatsPanel() {
        if (!this.statsPanel) return;
        
        // 更新各项统计
        document.getElementById('stat-progress').textContent = `${Math.round(this.progress)}%`;
        document.getElementById('stat-time').textContent = this.formatTime(this.readingStats.actualTime);
        document.getElementById('stat-words').textContent = this.readingStats.readWords.toLocaleString();
        document.getElementById('stat-speed').textContent = this.readingStats.readingSpeed;
        
        // 更新进度条
        const detailFill = document.getElementById('detail-fill');
        if (detailFill) {
            detailFill.style.width = `${this.progress}%`;
        }
        
        // 更新段落信息
        document.getElementById('detail-paragraphs').textContent = 
            `${this.readingStats.paragraphsRead}/${this.readingStats.totalParagraphs} 段落`;
        
        // 更新剩余时间
        const remainingMinutes = Math.max(0, Math.ceil(
            (this.readingStats.estimatedTime * (100 - this.progress) / 100)
        ));
        document.getElementById('detail-remaining').textContent = `剩余约 ${remainingMinutes} 分钟`;
    }
    
    /**
     * 阅读完成回调
     */
    onReadingComplete() {
        console.log('[阅读进度] 阅读完成！');
        
        // 保存到阅读历史
        this.saveToHistory();
        
        // 显示完成提示
        this.showCompletionToast();
        
        // 触发完成事件
        window.dispatchEvent(new CustomEvent('reading:complete', {
            detail: { stats: this.readingStats, article: this.articleInfo }
        }));
    }
    
    /**
     * 显示完成提示
     */
    showCompletionToast() {
        const toast = document.createElement('div');
        toast.className = 'reading-complete-toast';
        toast.innerHTML = `
            <div class="toast-icon">🎉</div>
            <div class="toast-content">
                <h4>阅读完成！</h4>
                <p>共 ${this.wordCount.toLocaleString()} 字，用时 ${this.formatTime(this.readingStats.actualTime)}</p>
            </div>
        `;
        
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 16px;
            box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
            z-index: 10000;
            animation: readingCompleteIn 0.5s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'readingCompleteOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
    
    /**
     * 保存进度
     */
    saveProgress() {
        const key = `reading_progress_${window.location.pathname}`;
        const data = {
            progress: this.progress,
            timestamp: Date.now(),
            stats: this.readingStats
        };
        
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.warn('无法保存阅读进度:', e);
        }
    }
    
    /**
     * 加载进度
     */
    loadProgress() {
        const key = `reading_progress_${window.location.pathname}`;
        
        try {
            const data = JSON.parse(localStorage.getItem(key));
            if (data && Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000) {
                // 7天内的进度
                this.readingStats = { ...this.readingStats, ...data.stats };
                
                // 如果有之前的进度，询问是否跳转
                if (data.progress > 10 && data.progress < 95) {
                    this.showResumePrompt(data.progress);
                }
            }
        } catch (e) {
            console.warn('无法加载阅读进度:', e);
        }
    }
    
    /**
     * 显示恢复阅读提示
     */
    showResumePrompt(progress) {
        const prompt = document.createElement('div');
        prompt.className = 'reading-resume-prompt';
        prompt.innerHTML = `
            <div class="prompt-content">
                <span>📖 上次阅读到 ${Math.round(progress)}%</span>
                <button class="resume-btn">继续阅读</button>
            </div>
        `;
        
        prompt.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            animation: resumePromptIn 0.3s ease;
        `;
        
        const btn = prompt.querySelector('.resume-btn');
        btn.style.cssText = `
            background: #667eea;
            border: none;
            color: white;
            padding: 6px 12px;
            border-radius: 4px;
            margin-left: 12px;
            cursor: pointer;
        `;
        
        btn.addEventListener('click', () => {
            this.scrollToProgress(progress);
            prompt.remove();
        });
        
        document.body.appendChild(prompt);
        
        setTimeout(() => {
            if (prompt.parentNode) {
                prompt.style.animation = 'resumePromptOut 0.3s ease forwards';
                setTimeout(() => prompt.remove(), 300);
            }
        }, 5000);
    }
    
    /**
     * 滚动到指定进度
     */
    scrollToProgress(progress) {
        if (!this.articleElement) return;
        
        const rect = this.articleElement.getBoundingClientRect();
        const scrollTarget = rect.top + window.scrollY + (rect.height * progress / 100);
        
        window.scrollTo({
            top: scrollTarget,
            behavior: 'smooth'
        });
    }
    
    /**
     * 保存到阅读历史
     */
    saveToHistory() {
        const key = 'reading_history';
        const entry = {
            title: this.articleInfo.title,
            url: this.articleInfo.url,
            wordCount: this.wordCount,
            readAt: Date.now(),
            readingTime: this.readingStats.actualTime,
            completed: true
        };
        
        try {
            let history = JSON.parse(localStorage.getItem(key) || '[]');
            
            // 去重并添加到开头
            history = history.filter(item => item.url !== entry.url);
            history.unshift(entry);
            
            // 只保留最近50条
            history = history.slice(0, 50);
            
            localStorage.setItem(key, JSON.stringify(history));
        } catch (e) {
            console.warn('无法保存阅读历史:', e);
        }
    }
    
    /**
     * 格式化时间
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        
        if (mins >= 60) {
            const hours = Math.floor(mins / 60);
            const remainingMins = mins % 60;
            return `${hours}:${remainingMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    /**
     * 注入样式
     */
    injectStyles() {
        if (document.getElementById('reading-progress-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'reading-progress-styles';
        style.textContent = `
            @keyframes readingCompleteIn {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
            
            @keyframes readingCompleteOut {
                to {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-10px);
                }
            }
            
            @keyframes resumePromptIn {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
            
            @keyframes resumePromptOut {
                to {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-10px);
                }
            }
            
            .reading-time-indicator .time-content {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 14px;
                color: #333;
                font-weight: 500;
            }
            
            .reading-time-indicator .progress-ring {
                position: relative;
            }
            
            .reading-time-indicator .progress-text {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 11px;
                font-weight: 600;
                color: #667eea;
            }
            
            .reading-stats-panel .stats-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid rgba(0,0,0,0.08);
            }
            
            .reading-stats-panel .stats-header h4 {
                margin: 0;
                font-size: 1em;
                color: #333;
            }
            
            .reading-stats-panel .close-btn {
                background: none;
                border: none;
                font-size: 1.5em;
                color: #999;
                cursor: pointer;
                padding: 0;
                width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: all 0.2s;
            }
            
            .reading-stats-panel .close-btn:hover {
                background: rgba(0,0,0,0.05);
                color: #333;
            }
            
            .reading-stats-panel .stats-content {
                padding: 16px 20px;
            }
            
            .reading-stats-panel .stat-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
                margin-bottom: 20px;
            }
            
            .reading-stats-panel .stat-item {
                text-align: center;
            }
            
            .reading-stats-panel .stat-value {
                display: block;
                font-size: 1.4em;
                font-weight: 700;
                color: #667eea;
                margin-bottom: 4px;
            }
            
            .reading-stats-panel .stat-label {
                font-size: 0.8em;
                color: #888;
            }
            
            .reading-stats-panel .progress-detail {
                padding-top: 16px;
                border-top: 1px solid rgba(0,0,0,0.08);
            }
            
            .reading-stats-panel .detail-bar {
                height: 6px;
                background: #e0e0e0;
                border-radius: 3px;
                overflow: hidden;
                margin-bottom: 8px;
            }
            
            .reading-stats-panel .detail-fill {
                height: 100%;
                background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                border-radius: 3px;
                transition: width 0.3s ease;
            }
            
            .reading-stats-panel .detail-text {
                display: flex;
                justify-content: space-between;
                font-size: 0.8em;
                color: #888;
            }
            
            .reading-complete-toast .toast-icon {
                font-size: 2em;
            }
            
            .reading-complete-toast .toast-content h4 {
                margin: 0 0 4px 0;
                font-size: 1.1em;
            }
            
            .reading-complete-toast .toast-content p {
                margin: 0;
                font-size: 0.9em;
                opacity: 0.9;
            }
            
            @media (prefers-color-scheme: dark) {
                .reading-time-indicator {
                    background: rgba(40, 40, 40, 0.95) !important;
                }
                .reading-time-indicator .time-content {
                    color: #fff;
                }
                .reading-stats-panel {
                    background: rgba(40, 40, 40, 0.98) !important;
                }
                .reading-stats-panel .stats-header h4,
                .reading-stats-panel .stat-value {
                    color: #fff;
                }
                .reading-stats-panel .stat-label,
                .reading-stats-panel .detail-text {
                    color: #aaa;
                }
            }
            
            @media (max-width: 768px) {
                .reading-time-indicator {
                    right: 10px;
                    bottom: 80px;
                    padding: 8px 12px;
                }
                .reading-stats-panel {
                    right: 10px;
                    left: 10px;
                    width: auto;
                    bottom: 150px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * 销毁
     */
    destroy() {
        this.isActive = false;
        
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
        }
        
        if (this.progressBar) {
            this.progressBar.remove();
        }
        
        if (this.timeIndicator) {
            this.timeIndicator.remove();
        }
        
        if (this.statsPanel) {
            this.statsPanel.remove();
        }
    }
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.readingProgress = new ReadingProgress();
    });
} else {
    window.readingProgress = new ReadingProgress();
}

export default ReadingProgress;
