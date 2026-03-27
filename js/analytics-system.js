/**
 * 网站数据分析系统 - Website Analytics System
 * 流量统计、热力图、阅读分析和实时在线人数
 */

class AnalyticsSystem {
    constructor(options = {}) {
        this.options = {
            trackingId: options.trackingId || 'default',
            apiEndpoint: options.apiEndpoint || '/api/analytics',
            sampleRate: options.sampleRate || 1.0,
            enableHeatmap: options.enableHeatmap !== false,
            enableSessionRecord: options.enableSessionRecord || false,
            debug: options.debug || false,
            ...options
        };
        
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.pageViews = [];
        this.events = [];
        this.heatMapData = [];
        this.isRecording = false;
        
        this.init();
    }

    /**
     * 初始化
     */
    init() {
        if (this.shouldSample()) {
            this.trackPageView();
            this.setupEventTracking();
            this.setupPerformanceTracking();
            this.setupScrollTracking();
            
            if (this.options.enableHeatmap) {
                this.initHeatmap();
            }
            
            this.startHeartbeat();
        }
        
        // 页面卸载时发送数据
        window.addEventListener('beforeunload', () => {
            this.sendBeacon();
        });
    }

    /**
     * 采样判断
     */
    shouldSample() {
        return Math.random() < this.options.sampleRate;
    }

    /**
     * 生成会话ID
     */
    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 生成访客ID
     */
    getVisitorId() {
        let visitorId = localStorage.getItem('analytics_visitor_id');
        if (!visitorId) {
            visitorId = 'vis_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('analytics_visitor_id', visitorId);
        }
        return visitorId;
    }

    /**
     * 追踪页面浏览
     */
    trackPageView() {
        const pageView = {
            type: 'pageview',
            timestamp: Date.now(),
            sessionId: this.sessionId,
            visitorId: this.getVisitorId(),
            url: window.location.href,
            path: window.location.pathname,
            title: document.title,
            referrer: document.referrer,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            language: navigator.language,
            userAgent: navigator.userAgent,
            utm: this.getUTMParams()
        };

        this.pageViews.push(pageView);
        this.sendData(pageView);
        
        if (this.options.debug) {
            console.log('[Analytics] PageView:', pageView);
        }
    }

    /**
     * 获取UTM参数
     */
    getUTMParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            source: params.get('utm_source'),
            medium: params.get('utm_medium'),
            campaign: params.get('utm_campaign'),
            content: params.get('utm_content'),
            term: params.get('utm_term')
        };
    }

    /**
     * 追踪事件
     */
    trackEvent(category, action, label = null, value = null) {
        const event = {
            type: 'event',
            timestamp: Date.now(),
            sessionId: this.sessionId,
            visitorId: this.getVisitorId(),
            category,
            action,
            label,
            value,
            url: window.location.href
        };

        this.events.push(event);
        this.sendData(event);

        if (this.options.debug) {
            console.log('[Analytics] Event:', event);
        }
    }

    /**
     * 设置事件追踪
     */
    setupEventTracking() {
        // 追踪点击事件
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-track]');
            if (target) {
                const category = target.dataset.trackCategory || 'interaction';
                const action = target.dataset.track || 'click';
                const label = target.dataset.trackLabel || target.textContent.trim().substring(0, 50);
                this.trackEvent(category, action, label);
            }
        });

        // 追踪外链点击
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="http"]');
            if (link && !link.href.includes(window.location.hostname)) {
                this.trackEvent('outbound', 'click', link.href);
            }
        });

        // 追踪下载
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href$=".pdf"], a[href$=".zip"], a[href$=".doc"]');
            if (link) {
                this.trackEvent('download', 'click', link.href);
            }
        });
    }

    /**
     * 性能追踪
     */
    setupPerformanceTracking() {
        if (!window.performance) return;

        window.addEventListener('load', () => {
            setTimeout(() => {
                const timing = performance.timing;
                const metrics = {
                    type: 'performance',
                    timestamp: Date.now(),
                    sessionId: this.sessionId,
                    dns: timing.domainLookupEnd - timing.domainLookupStart,
                    tcp: timing.connectEnd - timing.connectStart,
                    ttfb: timing.responseStart - timing.requestStart,
                    download: timing.responseEnd - timing.responseStart,
                    domProcessing: timing.domComplete - timing.domLoading,
                    loadTime: timing.loadEventEnd - timing.navigationStart
                };

                this.sendData(metrics);

                if (this.options.debug) {
                    console.log('[Analytics] Performance:', metrics);
                }
            }, 0);
        });

        // Core Web Vitals
        if ('web-vitals' in window) {
            this.trackWebVitals();
        }
    }

    /**
     * 追踪 Core Web Vitals
     */
    trackWebVitals() {
        // Largest Contentful Paint
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.trackEvent('web-vitals', 'LCP', null, Math.round(lastEntry.startTime));
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                const delay = entry.processingStart - entry.startTime;
                this.trackEvent('web-vitals', 'FID', null, Math.round(delay));
            });
        }).observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift
        let clsValue = 0;
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            });
            this.trackEvent('web-vitals', 'CLS', null, Math.round(clsValue * 1000) / 1000);
        }).observe({ entryTypes: ['layout-shift'] });
    }

    /**
     * 滚动深度追踪
     */
    setupScrollTracking() {
        let maxScroll = 0;
        let reported25 = false;
        let reported50 = false;
        let reported75 = false;
        let reported90 = false;

        const checkScrollDepth = () => {
            const scrollTop = window.pageYOffset;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = Math.round((scrollTop / docHeight) * 100);

            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
            }

            if (!reported25 && maxScroll >= 25) {
                this.trackEvent('scroll', 'depth', '25%', 25);
                reported25 = true;
            }
            if (!reported50 && maxScroll >= 50) {
                this.trackEvent('scroll', 'depth', '50%', 50);
                reported50 = true;
            }
            if (!reported75 && maxScroll >= 75) {
                this.trackEvent('scroll', 'depth', '75%', 75);
                reported75 = true;
            }
            if (!reported90 && maxScroll >= 90) {
                this.trackEvent('scroll', 'depth', '90%', 90);
                reported90 = true;
            }
        };

        window.addEventListener('scroll', this.throttle(checkScrollDepth, 500));
    }

    /**
     * 初始化热力图
     */
    initHeatmap() {
        // 收集点击坐标
        document.addEventListener('click', (e) => {
            const point = {
                x: e.pageX,
                y: e.pageY,
                timestamp: Date.now(),
                element: e.target.tagName,
                viewport: { width: window.innerWidth, height: window.innerHeight }
            };
            this.heatMapData.push(point);
        });

        // 收集鼠标移动（采样）
        let moveBuffer = [];
        document.addEventListener('mousemove', this.throttle((e) => {
            moveBuffer.push({
                x: e.pageX,
                y: e.pageY,
                timestamp: Date.now()
            });
            
            if (moveBuffer.length >= 50) {
                this.heatMapData.push(...moveBuffer);
                moveBuffer = [];
            }
        }, 100));
    }

    /**
     * 心跳检测（在线状态）
     */
    startHeartbeat() {
        setInterval(() => {
            this.sendData({
                type: 'heartbeat',
                timestamp: Date.now(),
                sessionId: this.sessionId,
                visitorId: this.getVisitorId(),
                duration: Date.now() - this.startTime
            });
        }, 30000); // 每30秒
    }

    /**
     * 发送数据
     */
    sendData(data) {
        if (navigator.sendBeacon) {
            navigator.sendBeacon(this.options.apiEndpoint, JSON.stringify(data));
        } else {
            fetch(this.options.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                keepalive: true
            }).catch(() => {});
        }
    }

    /**
     * 发送所有缓冲数据
     */
    sendBeacon() {
        const data = {
            type: 'session_end',
            sessionId: this.sessionId,
            visitorId: this.getVisitorId(),
            duration: Date.now() - this.startTime,
            pageViews: this.pageViews.length,
            events: this.events.length,
            heatMap: this.heatMapData
        };

        this.sendData(data);
    }

    /**
     * 节流函数
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // ========== 数据查询方法 ==========

    /**
     * 获取流量统计
     */
    async getTrafficStats(period = '7d') {
        try {
            const response = await fetch(`${this.options.apiEndpoint}/traffic?period=${period}`);
            if (!response.ok) throw new Error('获取流量数据失败');
            return await response.json();
        } catch (error) {
            return this.getMockTrafficStats(period);
        }
    }

    /**
     * 获取实时在线人数
     */
    async getRealtimeOnline() {
        try {
            const response = await fetch(`${this.options.apiEndpoint}/realtime`);
            if (!response.ok) throw new Error('获取在线数据失败');
            return await response.json();
        } catch (error) {
            return { online: 42, peakToday: 156, avg7d: 89 };
        }
    }

    /**
     * 获取热力图数据
     */
    async getHeatmapData(url, period = '7d') {
        try {
            const response = await fetch(
                `${this.options.apiEndpoint}/heatmap?url=${encodeURIComponent(url)}&period=${period}`
            );
            if (!response.ok) throw new Error('获取热力图数据失败');
            return await response.json();
        } catch (error) {
            return this.generateMockHeatmapData();
        }
    }

    /**
     * 获取阅读分析
     */
    async getReadingAnalytics(articleId = null, period = '30d') {
        try {
            const url = articleId 
                ? `${this.options.apiEndpoint}/reading?article=${articleId}&period=${period}`
                : `${this.options.apiEndpoint}/reading?period=${period}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('获取阅读分析失败');
            return await response.json();
        } catch (error) {
            return this.getMockReadingAnalytics();
        }
    }

    // ========== 模拟数据 ==========

    getMockTrafficStats(period) {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        const data = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            data.push({
                date: date.toISOString().split('T')[0],
                pv: Math.floor(Math.random() * 500) + 500,
                uv: Math.floor(Math.random() * 200) + 200,
                bounceRate: 0.3 + Math.random() * 0.2,
                avgDuration: 120 + Math.random() * 180
            });
        }

        return {
            daily: data,
            summary: {
                totalPV: data.reduce((sum, d) => sum + d.pv, 0),
                totalUV: data.reduce((sum, d) => sum + d.uv, 0),
                avgBounceRate: data.reduce((sum, d) => sum + d.bounceRate, 0) / data.length,
                avgDuration: data.reduce((sum, d) => sum + d.avgDuration, 0) / data.length
            },
            sources: [
                { name: '直接访问', value: 35, percent: 35 },
                { name: '搜索引擎', value: 28, percent: 28 },
                { name: '社交媒体', value: 20, percent: 20 },
                { name: '外部链接', value: 12, percent: 12 },
                { name: '其他', value: 5, percent: 5 }
            ],
            devices: [
                { name: '桌面', value: 58, percent: 58 },
                { name: '移动', value: 35, percent: 35 },
                { name: '平板', value: 7, percent: 7 }
            ]
        };
    }

    generateMockHeatmapData() {
        const points = [];
        const width = window.innerWidth;
        const height = document.documentElement.scrollHeight;

        // 生成随机热点
        for (let i = 0; i < 500; i++) {
            points.push({
                x: Math.random() * width,
                y: Math.random() * height,
                value: Math.random()
            });
        }

        // 添加一些热点区域
        for (let i = 0; i < 100; i++) {
            points.push({
                x: width / 2 + (Math.random() - 0.5) * 200,
                y: 200 + (Math.random() - 0.5) * 100,
                value: 0.8 + Math.random() * 0.2
            });
        }

        return { points, viewport: { width, height } };
    }

    getMockReadingAnalytics() {
        return {
            totalArticles: 156,
            totalReads: 12580,
            avgReadTime: 245,
            completionRate: 0.62,
            popularArticles: [
                { id: '1', title: 'Vue 3 性能优化指南', reads: 1256, avgTime: 320 },
                { id: '2', title: 'React Hooks 最佳实践', reads: 987, avgTime: 280 },
                { id: '3', title: 'JavaScript 闭包详解', reads: 856, avgTime: 350 }
            ],
            readingTimeDistribution: [
                { range: '0-30秒', count: 450, percent: 15 },
                { range: '30秒-2分钟', count: 900, percent: 30 },
                { range: '2-5分钟', count: 1200, percent: 40 },
                { range: '5-10分钟', count: 375, percent: 12.5 },
                { range: '10分钟以上', count: 75, percent: 2.5 }
            ],
            scrollDepth: {
                '25%': 85,
                '50%': 65,
                '75%': 45,
                '90%': 30
            }
        };
    }
}

/**
 * 数据分析仪表板 UI
 */
class AnalyticsDashboard {
    constructor(analytics, containerId) {
        this.analytics = analytics;
        this.container = document.getElementById(containerId);
        this.charts = {};
    }

    /**
     * 渲染仪表板
     */
    async render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="analytics-dashboard">
                <div class="analytics-header">
                    <h2>📊 数据分析中心</h2>
                    <div class="period-selector">
                        <button data-period="7d" class="active">7天</button>
                        <button data-period="30d">30天</button>
                        <button data-period="90d">90天</button>
                    </div>
                </div>
                
                <div class="analytics-grid">
                    <div class="stat-card online-now">
                        <div class="stat-icon">👥</div>
                        <div class="stat-value" id="onlineCount">-</div>
                        <div class="stat-label">当前在线</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">👁</div>
                        <div class="stat-value" id="totalPV">-</div>
                        <div class="stat-label">总浏览量</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">🎯</div>
                        <div class="stat-value" id="totalUV">-</div>
                        <div class="stat-label">独立访客</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">⏱</div>
                        <div class="stat-value" id="avgDuration">-</div>
                        <div class="stat-label">平均停留</div>
                    </div>
                </div>

                <div class="analytics-charts">
                    <div class="chart-container">
                        <h4>流量趋势</h4>
                        <div id="trafficChart" class="chart"></div>
                    </div>
                    
                    <div class="chart-row">
                        <div class="chart-container half">
                            <h4>访问来源</h4>
                            <div id="sourceChart" class="chart"></div>
                        </div>
                        <div class="chart-container half">
                            <h4>设备分布</h4>
                            <div id="deviceChart" class="chart"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.injectStyles();
        await this.loadData('7d');
        this.bindEvents();
        this.startRealtimeUpdate();
    }

    /**
     * 加载数据
     */
    async loadData(period) {
        const stats = await this.analytics.getTrafficStats(period);
        
        // 更新统计卡片
        document.getElementById('totalPV').textContent = this.formatNumber(stats.summary.totalPV);
        document.getElementById('totalUV').textContent = this.formatNumber(stats.summary.totalUV);
        document.getElementById('avgDuration').textContent = this.formatDuration(stats.summary.avgDuration);

        // 渲染图表
        this.renderTrafficChart(stats.daily);
        this.renderPieChart('sourceChart', stats.sources);
        this.renderPieChart('deviceChart', stats.devices);
    }

    /**
     * 渲染流量趋势图
     */
    renderTrafficChart(data) {
        const container = document.getElementById('trafficChart');
        if (!container) return;

        // 简化的 SVG 折线图
        const width = container.clientWidth || 600;
        const height = 200;
        const padding = 40;

        const maxPV = Math.max(...data.map(d => d.pv));
        const maxUV = Math.max(...data.map(d => d.uv));
        const maxValue = Math.max(maxPV, maxUV);

        const pointsPV = data.map((d, i) => {
            const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
            const y = height - padding - (d.pv / maxValue) * (height - 2 * padding);
            return `${x},${y}`;
        }).join(' ');

        const pointsUV = data.map((d, i) => {
            const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
            const y = height - padding - (d.uv / maxValue) * (height - 2 * padding);
            return `${x},${y}`;
        }).join(' ');

        container.innerHTML = `
            <svg viewBox="0 0 ${width} ${height}" style="width:100%;height:${height}px">
                <!-- 网格线 -->
                ${[0, 1, 2, 3, 4].map(i => {
                    const y = padding + (i / 4) * (height - 2 * padding);
                    return `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#333" stroke-dasharray="2"/>`;
                }).join('')}
                
                <!-- PV 折线 -->
                <polyline fill="none" stroke="#667eea" stroke-width="2" points="${pointsPV}"/>
                
                <!-- UV 折线 -->
                <polyline fill="none" stroke="#764ba2" stroke-width="2" points="${pointsUV}"/>
                
                <!-- X轴标签 -->
                ${data.filter((_, i) => i % Math.ceil(data.length / 7) === 0).map((d, i) => {
                    const x = padding + ((i * Math.ceil(data.length / 7)) / (data.length - 1)) * (width - 2 * padding);
                    return `<text x="${x}" y="${height - 10}" font-size="10" fill="#999" text-anchor="middle">${d.date.slice(5)}</text>`;
                }).join('')}
                
                <!-- 图例 -->
                <g transform="translate(${width - 120}, 20)">
                    <line x1="0" y1="0" x2="20" y2="0" stroke="#667eea" stroke-width="2"/>
                    <text x="25" y="4" font-size="12" fill="#999">浏览量</text>
                    <line x1="0" y1="20" x2="20" y2="20" stroke="#764ba2" stroke-width="2"/>
                    <text x="25" y="24" font-size="12" fill="#999">访客</text>
                </g>
            </svg>
        `;
    }

    /**
     * 渲染饼图
     */
    renderPieChart(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const size = 150;
        const radius = size / 2 - 10;
        const center = size / 2;

        let currentAngle = -Math.PI / 2;
        const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'];

        let svg = `<svg viewBox="0 0 ${size} ${size + data.length * 20}" style="width:100%">`;
        
        // 饼图扇形
        data.forEach((item, i) => {
            const angle = (item.value / 100) * 2 * Math.PI;
            const endAngle = currentAngle + angle;
            
            const x1 = center + radius * Math.cos(currentAngle);
            const y1 = center + radius * Math.sin(currentAngle);
            const x2 = center + radius * Math.cos(endAngle);
            const y2 = center + radius * Math.sin(endAngle);
            
            const largeArc = angle > Math.PI ? 1 : 0;
            
            svg += `<path d="M${center},${center} L${x1},${y1} A${radius},${radius} 0 ${largeArc},1 ${x2},${y2} Z" 
                          fill="${colors[i % colors.length]}"/>`;
            
            currentAngle = endAngle;
        });

        // 图例
        data.forEach((item, i) => {
            const y = size + 15 + i * 18;
            svg += `
                <rect x="10" y="${y - 8}" width="10" height="10" fill="${colors[i % colors.length]}"/>
                <text x="25" y="${y}" font-size="11" fill="#999">${item.name} ${item.percent}%</text>
            `;
        });

        svg += '</svg>';
        container.innerHTML = svg;
    }

    /**
     * 更新实时在线人数
     */
    async updateRealtimeOnline() {
        const data = await this.analytics.getRealtimeOnline();
        const el = document.getElementById('onlineCount');
        if (el) {
            el.textContent = data.online;
            el.classList.add('pulse');
            setTimeout(() => el.classList.remove('pulse'), 1000);
        }
    }

    /**
     * 开始实时更新
     */
    startRealtimeUpdate() {
        this.updateRealtimeOnline();
        setInterval(() => this.updateRealtimeOnline(), 30000);
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        this.container.querySelectorAll('[data-period]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.container.querySelectorAll('[data-period]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.loadData(btn.dataset.period);
            });
        });
    }

    /**
     * 注入样式
     */
    injectStyles() {
        if (document.getElementById('analytics-dashboard-styles')) return;

        const styles = `
            <style id="analytics-dashboard-styles">
                .analytics-dashboard {
                    padding: 20px;
                    color: #fff;
                }

                .analytics-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                }

                .analytics-header h2 {
                    margin: 0;
                    font-size: 24px;
                }

                .period-selector {
                    display: flex;
                    gap: 8px;
                }

                .period-selector button {
                    padding: 8px 16px;
                    background: rgba(255,255,255,0.1);
                    border: none;
                    border-radius: 6px;
                    color: #999;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .period-selector button.active,
                .period-selector button:hover {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: #fff;
                }

                .analytics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .stat-card {
                    background: rgba(255,255,255,0.05);
                    border-radius: 12px;
                    padding: 20px;
                    text-align: center;
                    transition: transform 0.2s;
                }

                .stat-card:hover {
                    transform: translateY(-4px);
                }

                .stat-icon {
                    font-size: 32px;
                    margin-bottom: 8px;
                }

                .stat-value {
                    font-size: 32px;
                    font-weight: bold;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .stat-value.pulse {
                    animation: pulse 1s ease;
                }

                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }

                .stat-label {
                    color: #999;
                    font-size: 14px;
                    margin-top: 4px;
                }

                .online-now {
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2));
                    border: 1px solid rgba(102, 126, 234, 0.3);
                }

                .analytics-charts {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .chart-container {
                    background: rgba(255,255,255,0.05);
                    border-radius: 12px;
                    padding: 20px;
                }

                .chart-container.half {
                    flex: 1;
                }

                .chart-row {
                    display: flex;
                    gap: 20px;
                }

                .chart-container h4 {
                    margin: 0 0 16px 0;
                    color: #999;
                    font-size: 14px;
                }

                .chart {
                    min-height: 200px;
                }

                @media (max-width: 768px) {
                    .chart-row {
                        flex-direction: column;
                    }
                    
                    .analytics-header {
                        flex-direction: column;
                        gap: 16px;
                    }
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    formatNumber(num) {
        if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toString();
    }

    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}分${secs}秒`;
    }
}

/**
 * 热力图可视化
 */
class HeatmapVisualizer {
    constructor(containerId, data) {
        this.container = document.getElementById(containerId);
        this.data = data;
        this.init();
    }

    init() {
        if (!this.container) return;
        
        const canvas = document.createElement('canvas');
        canvas.width = this.data.viewport.width;
        canvas.height = this.data.viewport.height;
        canvas.style.width = '100%';
        canvas.style.maxWidth = '100%';
        
        this.container.innerHTML = '';
        this.container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        
        // 绘制热力点
        this.data.points.forEach(point => {
            const gradient = ctx.createRadialGradient(
                point.x, point.y, 0,
                point.x, point.y, 30
            );
            gradient.addColorStop(0, `rgba(255, 0, 0, ${point.value * 0.3})`);
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 30, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

// 导出
window.AnalyticsSystem = AnalyticsSystem;
window.AnalyticsDashboard = AnalyticsDashboard;
window.HeatmapVisualizer = HeatmapVisualizer;

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    window.analytics = new AnalyticsSystem({
        trackingId: 'mcock-blog',
        enableHeatmap: true,
        debug: false
    });
});
