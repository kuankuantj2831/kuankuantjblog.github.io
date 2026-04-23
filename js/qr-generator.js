/**
 * 二维码生成器功能模块
 * 提供二维码生成、下载和历史记录功能
 */

// 二维码生成器状态
let qrGeneratorState = {
    content: '',
    size: 256,
    level: 'M',
    foreColor: '#000000',
    backColor: '#FFFFFF',
    history: []
};

// 初始化二维码生成器
function initQRGenerator() {
    console.log('[QRGenerator] 二维码生成器功能模块已初始化');
    
    // 加载历史记录
    loadHistory();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 更新UI
    updateQROptions();
}

// 加载历史记录
function loadHistory() {
    try {
        const savedHistory = localStorage.getItem('qrHistory');
        if (savedHistory) {
            qrGeneratorState.history = JSON.parse(savedHistory);
            updateHistoryList();
        }
    } catch (error) {
        console.error('加载二维码历史记录失败:', error);
        qrGeneratorState.history = [];
    }
}

// 保存历史记录
function saveHistory() {
    try {
        localStorage.setItem('qrHistory', JSON.stringify(qrGeneratorState.history));
    } catch (error) {
        console.error('保存二维码历史记录失败:', error);
    }
}

// 更新历史记录列表
function updateHistoryList() {
    const historyList = document.getElementById('historyList');
    
    if (qrGeneratorState.history.length === 0) {
        historyList.innerHTML = '<div style="text-align: center; color: #666; padding: 10px;">暂无生成历史</div>';
        return;
    }
    
    historyList.innerHTML = qrGeneratorState.history.map((item, index) => `
        <div class="history-item">
            <span class="history-item-content">${item.content}</span>
            <div class="history-item-actions">
                <button class="history-generate-btn" data-index="${index}">重新生成</button>
                <button class="history-copy-btn" data-index="${index}">复制内容</button>
            </div>
        </div>
    `).join('');
    
    // 为历史记录中的按钮添加事件监听器
    document.querySelectorAll('.history-generate-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            const item = qrGeneratorState.history[index];
            regenerateQRCode(item);
        });
    });
    
    document.querySelectorAll('.history-copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            const item = qrGeneratorState.history[index];
            copyToClipboard(item.content, this);
        });
    });
}

// 设置事件监听器
function setupEventListeners() {
    // 生成二维码按钮
    document.getElementById('generateBtn').addEventListener('click', generateQRCode);
    
    // 下载按钮
    document.getElementById('downloadBtn').addEventListener('click', downloadQRCode);
    
    // 复制按钮
    document.getElementById('copyBtn').addEventListener('click', function() {
        const canvas = document.getElementById('qrCodeCanvas');
        copyCanvasToClipboard(canvas);
    });
    
    // 二维码内容输入框
    document.getElementById('qrContent').addEventListener('input', function() {
        qrGeneratorState.content = this.value;
    });
    
    // 二维码尺寸滑块
    document.getElementById('qrSize').addEventListener('input', function() {
        qrGeneratorState.size = parseInt(this.value);
        document.getElementById('sizeValue').textContent = qrGeneratorState.size;
        document.getElementById('sizeValue2').textContent = qrGeneratorState.size;
        updateQROptions();
    });
    
    // 纠错等级下拉框
    document.getElementById('qrLevel').addEventListener('change', function() {
        qrGeneratorState.level = this.value;
        updateQROptions();
    });
    
    // 前景颜色选择器
    document.getElementById('qrForeColor').addEventListener('change', function() {
        qrGeneratorState.foreColor = this.value;
        document.getElementById('foreColorValue').textContent = qrGeneratorState.foreColor;
        updateQROptions();
    });
    
    // 背景颜色选择器
    document.getElementById('qrBackColor').addEventListener('change', function() {
        qrGeneratorState.backColor = this.value;
        document.getElementById('backColorValue').textContent = qrGeneratorState.backColor;
        updateQROptions();
    });
}

// 更新QR选项
function updateQROptions() {
    // 检查是否至少输入了内容
    if (!qrGeneratorState.content) {
        return;
    }
}

// 生成二维码
function generateQRCode() {
    // 检查是否输入了内容
    if (!qrGeneratorState.content) {
        alert('请输入要生成二维码的内容');
        return;
    }
    
    try {
        // 创建QR码数据
        const qrData = createQRCodeData(qrGeneratorState.content, qrGeneratorState.level);
        
        // 渲染QR码
        renderQRCode(qrData);
        
        // 显示结果
        document.getElementById('qrResult').classList.remove('hidden');
        
        // 添加到历史记录
        addToHistory(qrGeneratorState.content);
    } catch (error) {
        console.error('生成二维码失败:', error);
        alert('生成二维码失败: ' + error.message);
    }
}

// 创建QR码数据（简化实现，实际应该使用专业库）
function createQRCodeData(content, level) {
    // 这里使用一个简单的模拟QR码生成器
    // 实际项目中应该使用像qrcodejs这样的专业库
    return {
        content: content,
        level: level,
        modules: generateQRModules(content, level),
        version: calculateQRVersion(content, level)
    };
}

// 生成QR码模块（简化实现）
function generateQRModules(content, level) {
    // 简单的随机模块生成
    const version = calculateQRVersion(content, level);
    const size = version * 4 + 17;
    const modules = [];
    
    for (let y = 0; y < size; y++) {
        modules[y] = [];
        for (let x = 0; x < size; x++) {
            // 简单的模式生成
            const moduleValue = Math.random() > 0.5 ? 1 : 0;
            modules[y][x] = moduleValue;
        }
    }
    
    // 添加定位图案
    addPositionPatterns(modules, size);
    
    return modules;
}

// 计算QR码版本
function calculateQRVersion(content, level) {
    const contentLength = content.length;
    let version = 1;
    
    while (version <= 40) {
        const capacity = getQRVersionCapacity(version, level);
        if (contentLength <= capacity) {
            return version;
        }
        version++;
    }
    
    throw new Error('内容过长，无法生成QR码');
}

// 获取QR码版本容量
function getQRVersionCapacity(version, level) {
    // 简化的容量计算
    const capacities = {
        'L': [154, 279, 429, 609, 819, 1059, 1329, 1539, 1779, 2059, 2379, 2709, 3059, 3439, 3849, 4289, 4749, 5239, 5749, 6279, 6829, 7409, 8009, 8639, 9299, 9979, 10679, 11399, 12139, 12899, 13679, 14479, 15299, 16139, 16999, 17879, 18779, 19699, 20639],
        'M': [122, 223, 339, 483, 651, 843, 1059, 1203, 1365, 1545, 1743, 1959, 2187, 2433, 2697, 2979, 3273, 3579, 3897, 4227, 4575, 4941, 5325, 5727, 6147, 6585, 7041, 7515, 8007, 8517, 9045, 9591, 10155, 10737, 11337, 11955, 12591, 13245, 13917, 14607],
        'Q': [86, 154, 227, 331, 451, 587, 741, 845, 958, 1083, 1221, 1365, 1521, 1689, 1869, 2055, 2259, 2475, 2703, 2949, 3207, 3477, 3759, 4053, 4359, 4677, 5007, 5349, 5703, 6069, 6447, 6837, 7239, 7653, 8079, 8517, 8967, 9429, 9903, 10389],
        'H': [62, 106, 154, 220, 300, 390, 492, 552, 623, 701, 787, 87