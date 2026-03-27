/**
 * 天气小部件 - Weather Widget
 * 显示当前天气信息
 */

class WeatherWidget {
    constructor(options = {}) {
        this.options = {
            apiKey: '',
            city: 'auto',
            units: 'metric',
            updateInterval: 30 * 60 * 1000,
            ...options
        };
        
        this.weatherData = null;
        this.init();
    }
    
    async init() {
        this.createWidget();
        await this.loadWeather();
        this.injectStyles();
        
        // 定时更新
        setInterval(() => this.loadWeather(), this.options.updateInterval);
        
        console.log('[天气小部件] 系统已初始化');
    }
    
    createWidget() {
        const widget = document.createElement('div');
        widget.className = 'weather-widget';
        widget.innerHTML = `
            <div class="weather-loading">
                <div class="weather-spinner"></div>
            </div>
            <div class="weather-content" style="display:none;">
                <div class="weather-main">
                    <span class="weather-icon">🌤️</span>
                    <span class="weather-temp">--°</span>
                </div>
                <div class="weather-info">
                    <span class="weather-desc">加载中...</span>
                    <span class="weather-city">--</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(widget);
        this.widget = widget;
    }
    
    async loadWeather() {
        // 使用模拟数据（实际使用时需要接入天气API）
        const mockData = {
            temp: Math.floor(Math.random() * 15) + 15,
            desc: ['晴天', '多云', '阴天', '小雨'][Math.floor(Math.random() * 4)],
            city: '本地',
            icon: ['☀️', '⛅', '☁️', '🌧️'][Math.floor(Math.random() * 4)]
        };
        
        this.updateDisplay(mockData);
    }
    
    updateDisplay(data) {
        this.widget.querySelector('.weather-loading').style.display = 'none';
        this.widget.querySelector('.weather-content').style.display = 'flex';
        
        this.widget.querySelector('.weather-icon').textContent = data.icon;
        this.widget.querySelector('.weather-temp').textContent = `${data.temp}°`;
        this.widget.querySelector('.weather-desc').textContent = data.desc;
        this.widget.querySelector('.weather-city').textContent = data.city;
    }
    
    injectStyles() {
        if (document.getElementById('weather-widget-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'weather-widget-styles';
        style.textContent = `
            .weather-widget {
                position: fixed;
                left: 20px;
                top: 100px;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 16px;
                padding: 16px 20px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                z-index: 100;
                min-width: 120px;
            }
            
            .weather-loading {
                text-align: center;
                padding: 10px;
            }
            
            .weather-spinner {
                width: 24px;
                height: 24px;
                border: 2px solid #e0e0e0;
                border-top-color: #667eea;
                border-radius: 50%;
                animation: weatherSpin 1s linear infinite;
                margin: 0 auto;
            }
            
            .weather-content {
                flex-direction: column;
                align-items: center;
                gap: 8px;
            }
            
            .weather-main {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .weather-icon {
                font-size: 2em;
            }
            
            .weather-temp {
                font-size: 1.8em;
                font-weight: 600;
                color: #333;
            }
            
            .weather-info {
                text-align: center;
                font-size: 0.85em;
                color: #666;
            }
            
            .weather-desc {
                display: block;
            }
            
            .weather-city {
                display: block;
                font-size: 0.9em;
                opacity: 0.8;
            }
            
            @keyframes weatherSpin {
                to { transform: rotate(360deg); }
            }
            
            @media (max-width: 768px) {
                .weather-widget {
                    display: none;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.weatherWidget = new WeatherWidget();
    });
} else {
    window.weatherWidget = new WeatherWidget();
}

export default WeatherWidget;
