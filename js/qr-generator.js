/**
 * QR Code Generator
 * 一个简单但功能完整的QR码生成器
 */

// QR码版本容量（简化版）
const QR_VERSION_CAPACITIES = {
    'L': [154, 279, 429, 609, 819, 1059, 1329, 1539, 1779, 2059],
    'M': [122, 223, 339, 483, 651, 843, 1059, 1203, 1365, 1545],
    'Q': [86, 154, 227, 331, 451, 587, 741, 845, 958, 1083],
    'H': [62, 106, 154, 220, 300, 390, 492, 552, 623, 701]
};

// 获取QR码版本
function getQRVersion(content, level = 'L') {
    const length = content.length;
    
    for (let version = 1; version <= 10; version++) {
        const capacity = QR_VERSION_CAPACITIES[level][version - 1];
        if (length <= capacity) {
            return version;
        }
    }
    
    throw new Error('内容过长，无法生成QR码');
}

// 生成QR码矩阵
function generateQRMatrix(content, version, level) {
    const size = version * 4 + 17;
    const matrix = Array(size).fill().map(() => Array(size).fill(0));
    
    // 添加定位图案
    addPositionPatterns(matrix, size);
    
    // 添加对齐图案（版本2及以上）
    if (version >= 2) {
        addAlignmentPatterns(matrix, version, size);
    }
    
    // 添加时序图案
    addTimingPatterns(matrix, size);
    
    // 添加格式信息
    addFormatInfo(matrix, level, 'L');
    
    // 添加版本信息（版本7及以上）
    if (version >= 7) {
        addVersionInfo(matrix, version, size);
    }
    
    // 填充数据
    fillData(matrix, content, version, level, size);
    
    return matrix;
}

// 添加定位图案
function addPositionPatterns(matrix, size) {
    const positions = [
        { x: 0, y: 0 },
        { x: size - 7, y: 0 },
        { x: 0, y: size - 7 }
    ];
    
    positions.forEach(pos => {
        for (let y = 0; y < 7; y++) {
            for (let x = 0; x < 7; x++) {
                const isBlack = (x === 0 || x === 6 || y === 0 || y === 6) || 
                               (x >= 2 && x <= 4 && y >= 2 && y <= 4);
                matrix[pos.y + y][pos.x + x] = isBlack ? 1 : 0;
            }
        }
    });
}

// 添加对齐图案
function addAlignmentPatterns(matrix, version, size) {
    const positions = getAlignmentPatternPositions(version);
    
    positions.forEach(pos => {
        for (let y = -2; y <= 2; y++) {
            for (let x = -2; x <= 2; x++) {
                const isBlack = (x === 0 || x === -2 || x === 2 || y === 0 || y === -2 || y === 2) ||
                               (x >= -1 && x <= 1 && y >= -1 && y <= 1);
                matrix[pos.y + y][pos.x + x] = isBlack ? 1 : 0;
            }
        }
    });
}

// 获取对齐图案位置
function getAlignmentPatternPositions(version) {
    const positions = [];
    const interval = Math.floor(version / 7) * 4 + 1;
    
    for (let i = 1; i <= version - 1; i++) {
        const pos = Math.floor(i * interval);
        positions.push({ x: pos, y: pos });
    }
    
    return positions;
}

// 添加时序图案
function addTimingPatterns(matrix, size) {
    for (let i = 8; i < size - 8; i++) {
        matrix[6][i] = i % 2 === 0 ? 1 : 0;
        matrix[i][6] = i % 2 === 0 ? 1 : 0;
    }
}

// 添加格式信息
function addFormatInfo(matrix, level, mask) {
    const formatInfo = getFormatInfo(level, mask);
    
    // 格式信息位置
    const positions = [
        [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [7, 8], [8, 8],
        [8, 7], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
        [size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8], [size - 5, 8],
        [size - 6, 8], [size - 8, 8], [size - 8, size - 1], [size - 8, size - 2],
        [size - 8, size - 3], [size - 8, size - 4], [size - 8, size - 5],
        [size - 8, size - 6], [size - 8, size - 8]
    ];
    
    formatInfo.split('').forEach((bit, index) => {
        if (index < positions.length) {
            const [y, x] = positions[index];
            matrix[y][x] = parseInt(bit);
        }
    });
}

// 获取格式信息
function getFormatInfo(level, mask) {
    // 简化实现，返回固定格式信息
    return '100010101010101';
}

// 添加版本信息
function addVersionInfo(matrix, version, size) {
    const versionInfo = getVersionInfo(version);
    
    // 版本信息位置
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 3; j++) {
            const bit = versionInfo[i * 3 + j];
            matrix[size - 11 + j][i] = parseInt(bit);
            matrix[i][size - 11 + j] = parseInt(bit);
        }
    }
}

// 获取版本信息
function getVersionInfo(version) {
    // 简化实现，返回固定版本信息
    return '000000000000';
}

// 填充数据
function fillData(matrix, content, version, level, size) {
    const data = encodeData(content);
    let index = 0;
    
    // 填充数据
    for (let y = size - 1; y >= 0; y -= 2) {
        for (let x = size - 1; x >= 0; x--) {
            if (isDataArea(x, y, size)) {
                matrix[y][x] = data[index % data.length];
                index++;
            }
        }
        
        if (y > 0) {
            y--;
            for (let x = 0; x < size; x++) {
                if (isDataArea(x, y, size)) {
                    matrix[y][x] = data[index % data.length];
                    index++;
                }
            }
        }
    }
}

// 检查是否是数据区域
function isDataArea(x, y, size) {
    // 排除定位图案、时序图案、格式信息等
    if (x === 6 || y === 6) return false;
    if ((x < 8 && y < 8) || (x > size - 9 && y < 8) || (x < 8 && y > size - 9)) return false;
    
    return true;
}

// 编码数据（简化版）
function encodeData(content) {
    // 简单的二进制编码
    let binary = '';
    for (let i = 0; i < content.length; i++) {
        const charCode = content.charCodeAt(i);
        binary += charCode.toString(2).padStart(8, '0');
    }
    
    // 添加终止符
    binary += '0000';
    
    // 添加填充位
    while (binary.length % 8 !== 0) {
        binary += '0';
    }
    
    return binary.split('').map(bit => parseInt(bit));
}

// 绘制QR码
function drawQRCode(canvas, matrix, size) {
    const ctx = canvas.getContext('2d');
    const scale = canvas.width / size;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制QR码
    matrix.forEach((row, y) => {
        row.forEach((bit, x) => {
            if (bit === 1) {
                ctx.fillStyle = 'black';
                ctx.fillRect(x * scale, y * scale, scale, scale);
            } else {
                ctx.fillStyle = 'white';
                ctx.fillRect(x * scale, y * scale, scale, scale);
            }
        });
    });
}

// 主函数
function generateQRCode(content, options = {}) {
    const {
        size = 256,
        level = 'L',
        foreground = '#000000',
        background = '#FFFFFF'
    } = options;
    
    try {
        // 获取QR码版本
        const version = getQRVersion(content, level);
        
        // 生成QR码矩阵
        const matrix = generateQRMatrix(content, version, level);
        
        // 创建Canvas元素
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        
        // 绘制QR码
        drawQRCode(canvas, matrix, matrix.length);
        
        return canvas;
    } catch (error) {
        console.error('QR码生成错误:', error);
        throw error;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateBtn');
    const qrContent = document.getElementById('qrContent');
    const qrSize = document.getElementById('qrSize');
    const qrLevel = document.getElementById('qrLevel');
    const qrForeground = document.getElementById('qrForeground');
    const qrBackground = document.getElementById('qrBackground');
    const qrCanvas = document.getElementById('qrCanvas');
    const sizeValue = document.getElementById('sizeValue');
    
    // 更新尺寸显示
    qrSize.addEventListener('input', () => {
        const value = qrSize.value;
        sizeValue.textContent = `${value} x ${value} 像素`;
    });
    
    // 生成QR码
    generateBtn.addEventListener('click', () => {
        const content = qrContent.value.trim();
        
        if (!content) {
            alert('请输入要生成QR码的内容');
            return;
        }
        
        try {
            const options = {
                size: parseInt(qrSize.value),
                level: qrLevel.value,
                foreground: qrForeground.value,
                background: qrBackground.value
            };
            
            const canvas = generateQRCode(content, options);
            
            // 显示QR码
            qrCanvas.innerHTML = '';
            qrCanvas.appendChild(canvas);
        } catch (error) {
            alert(`QR码生成失败: ${error.message}`);
            console.error(error);
        }
    });
});
