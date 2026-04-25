/**
 * 倒计时功能模块
 * 提供倒计时的创建、启动、暂停、重置等功能
 */

// 倒计时状态
let countdownState = {
    targetTime: null,
    remainingTime: 0,
    isRunning: false,
    isPaused: false,
    timerInterval: null,
    history: [],
    title: ''
};

// 初始化倒计时功能
function initCountdown() {
    console.log('[Countdown] 倒计时功能模块已初始化');
    
    // 加载历史记录
    loadHistory();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 更新历史记录列表
    updateHistoryList();
}

// 设置事件监听器
function setupEventListeners() {
    // 开始按钮
    document.getElementById('countdownStartBtn').addEventListener('click', startCountdown);
    
    // 暂停按钮
    document.getElementById('countdownPauseBtn').addEventListener('click', pauseCountdown);
    
    // 重置按钮
    document.getElementById('countdownResetBtn').addEventListener('click', resetCountdown);
    
    // 清除按钮
    document.getElementById('countdownClearBtn').addEventListener('click', clearCountdown);
    
    // 时间间隔按钮
    document.querySelectorAll('.countdown-duration-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const duration = parseInt(this.dataset.duration);
            setCountdownDuration(duration);
            document.querySelectorAll('.countdown-duration-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // 日期时间输入框
    document.getElementById('countdownDateTimeInput').addEventListener('change', function() {
        const datetime = new Date(this.value).getTime();
        if (!isNaN(datetime)) {
            setCountdownDateTime(datetime);
        }
    });
    
    // 标题输入框
    document.getElementById('countdownTitleInput').addEventListener('change', function() {
        countdownState.title = this.value;
    });
}

// 设置倒计时持续时间
function setCountdownDuration(duration) {
    const now = Date.now();
    countdownState.targetTime = now + duration * 1000;
    countdownState.remainingTime = duration * 1000;
    updateDisplay();
}

// 设置倒计时到指定日期时间
function setCountdownDateTime(datetime) {
    const now = Date.now();
    if (datetime > now) {
        countdownState.targetTime = datetime;
        countdownState.remainingTime = datetime - now;
        updateDisplay();
    } else {
        alert('请选择未来的时间');
    }
}

// 开始倒计时
function startCountdown() {
    if (!countdownState.targetTime) {
        alert('请设置倒计时');
        return;
    }
    
    if (countdownState.isRunning) {
        return;
    }
    
    // 如果是暂停后继续
    if (countdownState.isPaused) {
        countdownState.isPaused = false;
    } else {
        // 如果是第一次开始或重新开始
        const now = Date.now();
        if (countdownState.targetTime < now) {
            alert('倒计时已结束，请重置');
            return;
        }
        countdownState.remainingTime = countdownState.targetTime - now;
    }
    
    countdownState.isRunning = true;
    updateControls();
    
    countdownState.timerInterval = setInterval(updateCountdown, 100);
}

// 暂停倒计时
function pauseCountdown() {
    if (!countdownState.isRunning) {
        return;
    }
    
    countdownState.isRunning = false;
    countdownState.isPaused = true;
    clearInterval(countdownState.timerInterval);
    updateControls();
}

// 重置倒计时
function resetCountdown() {
    clearInterval(countdownState.timerInterval);
    countdownState.isRunning = false;
    countdownState.isPaused = false;
    
    if (countdownState.targetTime) {
        const now = Date.now();
        countdownState.remainingTime = countdownState.targetTime - now;
        if (countdownState.remainingTime < 0) {
            countdownState.remainingTime = 0;
        }
    }
    
    updateControls();
    updateDisplay();
}

// 清除倒计时
function clearCountdown() {
    clearInterval(countdownState.timerInterval);
    countdownState.targetTime = null;
    countdownState.remainingTime = 0;
    countdownState.isRunning = false;
    countdownState.isPaused = false;
    countdownState.title = '';
    
    document.getElementById('countdownTitleInput').value = '';
    document.getElementById('countdownDateTimeInput').value = '';
    document.querySelectorAll('.countdown-duration-btn').forEach(btn => btn.classList.remove('active'));
    
    updateControls();
    updateDisplay();
}

// 更新倒计时
function updateCountdown() {
    if (!countdownState.isRunning || countdownState.isPaused) {
        return;
    }
    
    const now = Date.now();
    const remaining = countdownState.targetTime - now;
    
    if (remaining <= 0) {
        countdownState.remainingTime = 0;
        countdownState.isRunning = false;
        clearInterval(countdownState.timerInterval);
        updateDisplay();
        updateControls();
        alert('倒计时结束');
        addToHistory();
    } else {
        countdownState.remainingTime = remaining;
        updateDisplay();
    }
}

// 更新显示
function updateDisplay() {
    const timerElement = document.getElementById('countdownTimer');
    const statusElement = document.getElementById('countdownStatus');
    
    const timeStr = formatTime(countdownState.remainingTime);
    timerElement.textContent = timeStr;
    
    if (!countdownState.targetTime) {
        statusElement.textContent = '准备中';
    } else if (!countdownState.isRunning) {
        if (countdownState.isPaused) {
            statusElement.textContent = '暂停中';
        } else {
            statusElement.textContent = '准备中';
        }
    } else {
        statusElement.textContent = '倒计时中';
    }
}

// 更新控制按钮
function updateControls() {
    document.getElementById('countdownStartBtn').disabled = countdownState.isRunning;
    document.getElementById('countdownPauseBtn').disabled = !countdownState.isRunning || countdownState.isPaused;
    document.getElementById('countdownResetBtn').disabled = !countdownState.targetTime;
}

// 格式化时间
function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${padZero(hours, 2)}:${padZero(minutes, 2)}:${padZero(seconds, 2)}`;
}

// 补零
function padZero(num, length) {
    return num.toString().padStart(length, '0');
}

// 添加到历史记录
function addToHistory() {
    const title = countdownState.title || '未命名';
    const duration = countdownState.remainingTime;
    const historyItem = {
        id: Date.now(),
        title: title,
        duration: duration,
        timestamp: Date.now()
    };
    
    countdownState.history.unshift(historyItem);
    saveHistory();
    updateHistoryList();
}

// 加载历史记录
function loadHistory() {
    try {
        const savedHistory = localStorage.getItem('countdownHistory');
        if (savedHistory) {
            countdownState.history = JSON.parse(savedHistory);
        }
    } catch (error) {
        console.error('加载倒计时历史记录失败:', error);
        countdownState.history = [];
    }
}

// 保存历史记录
function saveHistory() {
    try {
        localStorage.setItem('countdownHistory', JSON.stringify(countdownState.history));
    } catch (error) {
        console.error('保存倒计时历史记录失败:', error);
    }
}

// 更新历史记录列表
function updateHistoryList() {
    const historyList = document.getElementById('countdownHistoryList');
    
    if (countdownState.history.length === 0) {
        historyList.innerHTML = '<li style="text-align: center; color: #6c757d;">暂无倒计时历史</li>';
        return;
    }
    
    historyList.innerHTML = countdownState.history.map(item => `
        <li class="countdown-history-item" data-id="${item.id}">
            <div class="countdown-history-text">${item.title}</div>
            <div class="countdown-history-time">${formatDuration(item.duration)} · ${formatTimeAgo(item.timestamp)}</div>
        </li>
    `).join('');
    
    // 添加点击事件
    document.querySelectorAll('.countdown-history-item').forEach(item => {
        item.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            const historyItem = countdownState.history.find(h => h.id === id);
            if (historyItem) {
                setCountdownDuration(Math.floor(historyItem.duration / 1000));
                document.getElementById('countdownTitleInput').value = historyItem.title;
            }
        });
    });
}

// 格式化持续时间
function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
        return `${hours}小时${minutes}分`;
    } else if (minutes > 0) {
        return `${minutes}分${seconds}秒`;
    } else {
        return `${seconds}秒`;
    }
}

// 格式化时间前
function formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) {
        return `${minutes}分钟前`;
    } else if (hours < 24) {
        return `${hours}小时前`;
    } else {
        return `${days}天前`;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initCountdown);

// 导出模块（如果需要）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initCountdown,
        startCountdown,
        pauseCountdown,
        resetCountdown,
        clearCountdown
    };
}