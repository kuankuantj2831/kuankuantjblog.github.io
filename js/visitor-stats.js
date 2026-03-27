/**
 * 访客统计 - Visitor Statistics
 * 显示实时访客信息、访问来源和浏览数据
 */

class VisitorStats {
    constructor(options = {}) {
        this.options = {
            enableRealtime: true,
            showVisitorCount: true,
            showSource: true,
            showLocation: true,
            updateInterval: 30000,
            ...options
        };
        
        this.visitorData = {
            total: 0,
            online: 0,
            today: 0,
            sources: {},
            locations: []
        };
        
        this.init();
    }
    
    init() {
        this.loadStats();
        this.createUI();
        this.startRealtimeUpdate();
        this.injectStyles();
        
        console.log('[访客统计] 系统已初始化');
    }
    
    /**
     * 加载统计数据
     */
    loadStats() {
        // 从本地存储加载
        const saved = localStorage.getItem('visitor_stats');
        if (saved) {
            this.visitorData = JSON.parse(saved);
        }
        
        // 模拟数据（实际应从服务器获取）
        this.visitorData.total = this.visitorData.total || Math.floor(Math.random() * 10000) + 1000;
        this.visitorData.online = Math.floor(Math.random() * 50) + 1;
        this.visitorData.today = this.visitorData.today || Math.floor(Math.random() * 500) + 50;
    }
    
    /**
     * 创建UI
     */
    createUI() {
        const widget = document.createElement('div');
        widget.className = 'visitor-stats-widget';
        widget.innerHTML = `
            <div class="visitor-header">
                <span class="visitor-icon">👥</span>
                <span class="visitor-title">访客统计</span>
                <span class="visitor-status ${this.options.enableRealtime ? 'online' : ''}">
                    ${this.options.enableRealtime ? '● 实时' : ''}
                </span>
            </div>
            <div class="visitor-numbers">
                <div class="stat-item">
                    <span class="stat-value" id="visitor-total">${this.formatNumber(this.visitorData.total)}</span>
                    <span class="stat-label">总访问</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value" id="visitor-today">${this.formatNumber(this.visitorData.today)}</span>
                    <span class="stat-label">今日</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value" id="visitor-online">${this.visitorData.online}</span>
                    <span class="stat-label">在线</span>
                </div>
            </div>
            <div class="visitor-chart" id="visitor-chart"></div>
        `;
        
        // 插入到页脚或侧边栏
        const footer = document.querySelector('footer, .footer');
        if (footer) {
            footer.insertBefore(widget, footer.firstChild);
        } else {
            document.body.appendChild(widget);
        }
    }
    
    /**
     * 格式化数字
     */
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
    
    /**
     * 开始实时更新
     */
    startRealtimeUpdate() {
        if (!this.options.enableRealtime) return;
        
        setInterval(() => {
            this.updateStats();
        }, this.options.updateInterval);
    }
    
    /**
     * 更新统计
     */
    updateStats() {
        // 模拟在线人数变化
        const change = Math.floor(Math.random() * 10) - 5;
        this.visitorData.online = Math.max(1, this.visitorData.online + change);
        
        // 更新显示
        document.getElementById('visitor-online').textContent = this.visitorData.online;
        
        // 保存到本地存储
        localStorage.setItem('visitor_stats', JSON.stringify(this.visitorData));
    }
    
    /**
     * 注入样式
     */
    injectStyles() {
        if (document.getElementById('visitor-stats-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'visitor-stats-styles';
        style.textContent = `
            .visitor-stats-widget {
                background: rgba(255, 255, 255, 0.95);
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 2px 12px rgba(0,0,0,0.08);
            }
            
            .visitor-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 16px;
                font-size: 14px;
            }
            
            .visitor-icon {
                font-size: 1.3em;
            }
            
            .visitor-title {
                font-weight: 600;
                color: #333;
            }
            
            .visitor-status {
                margin-left: auto;
                font-size: 0.85em;
                color: #888;
            }
            
            .visitor-status.online {
                color: #52c41a;
            }
            
            .visitor-numbers {
                display: flex;
                justify-content: space-around;
                gap: 16px;
            }
            
            .stat-item {
                text-align: center;
            }
            
            .stat-value {
                display: block;
                font-size: 1.5em;
                font-weight: 700;
                color: #667eea;
            }
            
            .stat-label {
                font-size: 0.8em;
                color: #888;
            }
            
            @media (prefers-color-scheme: dark) {
                .visitor-stats-widget {
                    background: rgba(40, 40, 40, 0.95);
                }
                
                .visitor-title {
                    color: #fff;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.visitorStats = new VisitorStats();
    });
} else {
    window.visitorStats = new VisitorStats();
}

export default VisitorStats;
