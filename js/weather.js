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
        
        // 使用Open-Meteo API获取真实天气数据（无需API密钥，完全免费）
        // 首先需要通过城市名称获取经纬度坐标
        const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`;
        
        const geocodingResponse = await fetch(geocodingUrl);
        
        if (!geocodingResponse.ok) {
            throw new Error(`获取坐标失败: ${geocodingResponse.status}`);
        }
        
        const geocodingData = await geocodingResponse.json();
        
        if (!geocodingData.results || geocodingData.results.length === 0) {
            throw new Error(`未找到城市: ${city}`);
        }
        
        const { latitude, longitude, name } = geocodingData.results[0];
        
        // 使用获取到的经纬度请求天气数据
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,precipitation_probability`;
        
        const weatherResponse = await fetch(weatherUrl);
        
        if (!weatherResponse.ok) {
            throw new Error(`获取天气数据失败: ${weatherResponse.status}`);
        }
        
        const weatherData = await weatherResponse.json();
        
        // 处理Open-Meteo API返回的数据结构
        if (weatherData.current_weather) {
            const processedData = {
                name: name,
                main: {
                    temp: Math.round(weatherData.current_weather.temperature),
                    humidity: 0, // Open-Meteo需要单独请求湿度数据
                    pressure: 0 // Open-Meteo需要单独请求气压数据
                },
                wind: {
                    speed: weatherData.current_weather.windspeed
                },
                weather: [
                    {
                        description: getWeatherDescription(weatherData.current_weather.weathercode),
                        icon: getWeatherIcon(weatherData.current_weather.weathercode)
                    }
                ],
                visibility: 0 // Open-Meteo需要单独请求可见度数据
            };
            
            weatherState.currentWeatherData = processedData;
            weatherState.currentCity = city;
            
            // 添加到搜索历史
            addToSearchHistory(city);
            
            hideLoading();
            showWeather(processedData);
        } else {
            throw new Error('未获取到天气数据');
        }
    } catch (error) {
        console.error('获取天气数据失败:', error);
        hideLoading();
        showError(`获取天气数据失败: ${error.message}`);
    }
}

// 根据天气代码获取天气描述
function getWeatherDescription(weatherCode) {
    const weatherDescriptions = {
        0: '晴',
        1: '多云',
        2: '多云',
        3: '阴天',
        45: '雾',
        48: '雾',
        51: '小雨',
        53: '中雨',
        55: '大雨',
        61: '小雨',
        63: '中雨',
        65: '大雨',
        71: '小雪',
        73: '中雪',
        75: '大雪',
        95: '雷暴'
    };
    
    return weatherDescriptions[weatherCode] || '未知天气';
}

// 根据天气代码获取天气图标
function getWeatherIcon(weatherCode) {
    // 简单的天气图标映射，根据实际情况可以扩展
    const weatherIcons = {
        0: '01d',
        1: '02d',
        2: '03d',
        3: '04d',
        45: '50d',
        48: '50d',
        51: '09d',
        53: '09d',
        55: '09d',
        61: '10d',
        63: '10d',
        65: '10d',
        71: '13d',
        73: '13d',
        75: '13d',
        95: '11d'
    };
    
    return weatherIcons[weatherCode] || '01d';
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