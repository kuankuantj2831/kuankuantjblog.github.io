/**
 * 秒表功能模块
 * 提供秒表的基本功能，包括开始、停止、重置和计次功能
 */

// 秒表状态
let stopwatchState = {
    time: 0,
    milliseconds: 0,
    isRunning: false,
    isPaused: false,
    interval: null,
    laps: []
};

// 初始化秒表
function initStopwatch() {
    console.log('[Stopwatch] 秒表功能模块已初始化');
    
    // 设置事件监听器
    setupEventListeners();
    
    // 加载历史记录
    loadHistory();
}

// 设置事件监听器
function setupEventListeners() {
    // 开始按钮
    document.getElementById('startBtn').addEventListener('click', startStopwatch);
    
    // 停止按钮
    document.getElementById('stopBtn').addEventListener('click', stopStopwatch);
    
    // 重置按钮
    document.getElementById('resetBtn').addEventListener('click', resetStopwatch);
    
    // 计次按钮
    document.getElementById('lapBtn').addEventListener('click', addLap);
}

// 开始秒表
function startStopwatch() {
    if (stopwatchState.isRunning) {
        return;
    }
    
    stopwatchState.isRunning = true;
    stopwatchState.isPaused = false;
    
    // 启用/禁用按钮
    document.getElementById('startBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;
    document.getElementById('resetBtn').disabled = false;
    document.getElementById('lapBtn').disabled = false;
    
    // 开始计时
    stopwatchState.interval = setInterval(updateStopwatch, 10);
    
    console.log('[Stopwatch] 秒表已开始');
}

// 停止秒表
function stopStopwatch() {
    if (!stopwatchState.isRunning) {
        return;
    }
    
    stopwatchState.isRunning = false;
    stopwatchState.isPaused = true;
    
    // 启用/禁用按钮
    document.getElementById('startBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
    document.getElementById('resetBtn').disabled = false;
    document.getElementById('lapBtn').disabled = true;
    
    // 停止计时
    clearInterval(stopwatchState.interval);
    
    console.log('[Stopwatch] 秒表已停止');
}

// 重置秒表
function resetStopwatch() {
    stopwatchState.isRunning = false;
    stopwatchState.isPaused = false;
    stopwatchState.time = 0;
    stopwatchState.milliseconds = 0;
    stopwatchState.laps = [];
    
    // 启用/禁用按钮
    document.getElementById('startBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
    document.getElementById('resetBtn').disabled = true;
    document.getElementById('lapBtn').disabled = true;
    
    // 停止计时
    if (stopwatchState.interval) {
        clearInterval(stopwatchState.interval);
    }
    
    // 更新显示
    updateDisplay();
    
    console.log('[Stopwatch] 秒表已重置');
}

// 添加计次
function addLap() {
    const lapTime = formatTime(stopwatchState.time, stopwatchState.milliseconds);
    stopwatchState.laps.push(lapTime);
    
    // 更新计次列表
    updateLapsList();
    
    console.log('[Stopwatch] 已添加计次:', lapTime);
}

// 更新秒表
function updateStopwatch() {
    stopwatchState.milliseconds += 10;
    
    if (stopwatchState.milliseconds >= 1000) {
        stopwatchState.time += 1;
        stopwatchState.milliseconds = 0;
    }
    
    // 更新显示
    updateDisplay();
}

// 更新显示
function updateDisplay() {
    const timeString = formatTime(stopwatchState.time, stopwatchState.milliseconds);
    document.getElementById('stopwatchTime').textContent = timeString;
    document.getElementById('stopwatchMilliseconds').textContent = formatMilliseconds(stopwatchState.milliseconds);
}

// 格式化时间
function formatTime(seconds, milliseconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(secs).padStart(2, '0');
    
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

// 格式化毫秒
function formatMilliseconds(milliseconds) {
    return String(Math.floor(milliseconds / 10)).padStart(2, '0');
}

// 更新计次列表
function updateLapsList() {
    const lapsList = document.getElementById('lapsList');
    lapsList.innerHTML = '';
    
    stopwatchState.laps.forEach((lap, index) => {
        const lapItem = document.createElement('li');
        lapItem.className = 'lap-item';
        lapItem.innerHTML = `
            <span class="lap-number">计次 ${index + 1}</span>
            <span class="lap-time">${lap}</span>
        `;
        lapsList.appendChild(lapItem);
    });
}

// 加载历史记录
function loadHistory() {
    try {
        const savedLaps = localStorage.getItem('stopwatchLaps');
        if (savedLaps) {
            stopwatchState.laps = JSON.parse(savedLaps);
            updateLapsList();
        }
    } catch (error) {
        console.error('加载秒表历史记录失败:', error);
        stopwatchState.laps = [];
    }
}

// 保存历史记录
function saveHistory() {
    try {
        localStorage.setItem('stopwatchLaps', JSON.stringify(stopwatchState.laps));
    } catch (error) {
        console.error('保存秒表历史记录失败:', error);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initStopwatch);

// 导出模块（如果需要）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initStopwatch,
        startStopwatch,
        stopStopwatch,
        resetStopwatch,
        addLap
    };
}