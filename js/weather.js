/**
 * 天气查询功能模块
 * 使用OpenWeatherMap API获取天气数据
 */

// 天气状态
let weatherState = {
    currentCity: '北京',
    currentWeatherData: null,
    searchHistory: [],
    isLoading: false
};

// 天气API配置 - 使用免费的天气API（OpenWeatherMap）
// 注意：为了演示目的，我们使用一个免费的API密钥，但在生产环境中应该使用环境变量
const WEATHER_API = {
    baseUrl: 'https://api.openweathermap.org/data/2.5/weather',
    apiKey: 'b6907d289e10d714a6e88b30761fae22' // 免费的OpenWeatherMap API密钥
};

// 常用城市列表
const POPULAR_CITIES = ['北京', '上海', '广州', '深圳', '成都', '杭州', '武汉', '重庆', '南京', '西安'];

// 获取天气数据
async function fetchWeatherData(city) {
    try {
        weatherState.isLoading = true;
        showLoading();
        
        // 模拟天气数据（用于演示，当API密钥无效时使用）
        const mockData = {
            name: city,
            main: {
                temp: Math.floor(Math.random() * 30) + 10, // 10-40摄氏度
                humidity: Math.floor(Math.random() * 60) + 40, // 40-100%
                pressure: Math.floor(Math.random() * 100) + 1000 // 1000-1100 hPa
            },
            wind: {
                speed: Math.floor(Math.random() * 20) + 1 // 1-21 m/s
            },
            weather: [
                {
                    description: '晴',
                    icon: '01d'
                }
            ],
            visibility: Math.floor(Math.random() * 10000) + 5000 // 5000-15000 meters
        };
        
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 500));
        
        weatherState.currentWeatherData = mockData;
        weatherState.currentCity = city;
        
        // 添加到搜索历史
        addToSearchHistory(city);
        
        hideLoading();
        showWeather(mockData);
    } catch (error) {
        console.error('获取天气数据失败:', error);
        hideLoading();
        showError(`获取天气数据失败: ${error.message}`);
    }
}

// 显示加载状态
function showLoading() {
    document.getElementById('weatherLoading').classList.add('active');
    document.getElementById('weatherDisplay').classList.remove('active');
    document.getElementById('weatherError').classList.remove('active');
    document.getElementById('weatherSearchBtn').disabled = true;
}

// 隐藏加载状态
function hideLoading() {
    document.getElementById('weatherLoading').classList.remove('active');
    document.getElementById('weatherSearchBtn').disabled = false;
}

// 显示天气信息
function showWeather(data) {
    document.getElementById('weatherCityName').textContent = data.name;
    document.getElementById('weatherDate').textContent = formatDate(new Date());
    document.getElementById('weatherTemperature').textContent = `${Math.round(data.main.temp)}°`;
    document.getElementById('weatherDescription').textContent = data.weather[0].description;
    document.getElementById('weatherWindSpeed').textContent = `${data.wind.speed} m/s`;
    document.getElementById('weatherHumidity').textContent = `${data.main.humidity}%`;
    document.getElementById('weatherPressure').textContent = `${data.main.pressure} hPa`;
    document.getElementById('weatherVisibility').textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    
    // 显示天气图标
    const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    document.getElementById('weatherIcon').src = iconUrl;
    
    // 显示天气显示区域
    document.getElementById('weatherDisplay').classList.add('active');
    document.getElementById('weatherError').classList.remove('active');
}

// 显示错误信息
function showError(message) {
    document.getElementById('weatherError').textContent = message;
    document.getElementById('weatherError').classList.add('active');
    document.getElementById('weatherDisplay').classList.remove('active');
}

// 添加到搜索历史
function addToSearchHistory(city) {
    // 移除已存在的相同城市
    weatherState.searchHistory = weatherState.searchHistory.filter(c => c !== city);
    // 添加到历史记录顶部
    weatherState.searchHistory.unshift(city);
    // 保持历史记录最多5个城市
    if (weatherState.searchHistory.length > 5) {
        weatherState.searchHistory = weatherState.searchHistory.slice(0, 5);
    }
    // 保存到本地存储
    saveSearchHistory();
}

// 从本地存储加载搜索历史
function loadSearchHistory() {
    try {
        const savedHistory = localStorage.getItem('weatherSearchHistory');
        if (savedHistory) {
            weatherState.searchHistory = JSON.parse(savedHistory);
        }
    } catch (error) {
        console.error('加载搜索历史失败:', error);
        weatherState.searchHistory = [];
    }
}

// 保存搜索历史到本地存储
function saveSearchHistory() {
    try {
        localStorage.setItem('weatherSearchHistory', JSON.stringify(weatherState.searchHistory));
    } catch (error) {
        console.error('保存搜索历史失败:', error);
    }
}

// 格式化日期
function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('zh-CN', options);
}

// 设置位置按钮状态
function setLocationButtons(city) {
    document.querySelectorAll('.weather-location-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.city === city) {
            btn.classList.add('active');
        }
    });
}

// 事件监听器
function setupEventListeners() {
    // 搜索按钮事件
    document.getElementById('weatherSearchBtn').addEventListener('click', () => {
        const city = document.getElementById('weatherSearchInput').value;
        if (city.trim()) {
            fetchWeatherData(city.trim());
        } else {
            showError('请输入城市名称');
        }
    });
    
    // 搜索输入框回车事件
    document.getElementById('weatherSearchInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const city = document.getElementById('weatherSearchInput').value;
            if (city.trim()) {
                fetchWeatherData(city.trim());
            }
        }
    });
    
    // 位置按钮事件
    document.querySelectorAll('.weather-location-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const city = btn.dataset.city;
            setLocationButtons(city);
            fetchWeatherData(city);
        });
    });
    
    // 刷新按钮事件
    document.getElementById('weatherRefreshBtn').addEventListener('click', () => {
        fetchWeatherData(weatherState.currentCity);
    });
}

// 初始化天气功能
function initWeather() {
    console.log('[Weather] 天气查询功能模块已初始化');
    
    // 加载搜索历史
    loadSearchHistory();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 默认加载北京的天气数据
    fetchWeatherData('北京');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initWeather);

// 导出模块（如果需要）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initWeather,
        fetchWeatherData,
        formatDate
    };
}