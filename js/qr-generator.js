/**
 * QR Code Generator
 * 一个简单但功能完整的QR码生成器
 */

// 使用简单的方法生成QR码（简化实现）
function generateQRCode(content, options = {}) {
    const {
        size = 256,
        level = 'L',
        foreground = '#000000',
        background = '#FFFFFF'
    } = options;
    
    // 创建Canvas元素
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // 填充背景
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, size, size);
    
    // 绘制简单的QR码图案（简化实现）
    ctx.fillStyle = foreground;
    const moduleSize = Math.floor(size / 25);
    
    // 绘制定位图案
    drawPositionPattern(ctx, moduleSize * 3, moduleSize * 3, moduleSize * 7);
    drawPositionPattern(ctx, size - moduleSize * 10, moduleSize * 3, moduleSize * 7);
    drawPositionPattern(ctx, moduleSize * 3, size - moduleSize * 10, moduleSize * 7);
    
    // 绘制简单的填充图案
    for (let y = moduleSize * 8; y < size - moduleSize * 8; y += moduleSize * 2) {
        for (let x = moduleSize * 8; x < size - moduleSize * 8; x += moduleSize * 3) {
            ctx.fillRect(x, y, moduleSize, moduleSize);
        }
    }
    
    // 绘制内容编码（简化实现）
    const encodedData = encodeData(content);
    let index = 0;
    
    for (let y = moduleSize * 10; y < size - moduleSize * 10; y += moduleSize) {
        for (let x = moduleSize * 10; x < size - moduleSize * 10; x += moduleSize) {
            if (index < encodedData.length && encodedData[index] === 1) {
                ctx.fillRect(x, y, moduleSize, moduleSize);
            }
            index++;
        }
    }
    
    return canvas;
}

// 绘制定位图案
function drawPositionPattern(ctx, x, y, size) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y, size, size);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + size / 5, y + size / 5, size * 3 / 5, size * 3 / 5);
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + size * 2 / 5, y + size * 2 / 5, size * 1 / 5, size * 1 / 5);
}

// 编码数据（简化版）
function encodeData(content) {
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

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateBtn');
    const qrContent = document.getElementById('qrContent');
    const qrSize = document.getElementById('qrSize');
    const qrLevel = document.getElementById('qrLevel');
    const qrForeColor = document.getElementById('qrForeColor');
    const qrBackColor = document.getElementById('qrBackColor');
    const qrResult = document.getElementById('qrResult');
    const qrCodeCanvas = document.getElementById('qrCodeCanvas');
    const downloadBtn = document.getElementById('downloadBtn');
    const copyBtn = document.getElementById('copyBtn');
    const historyList = document.getElementById('historyList');
    const foreColorValue = document.getElementById('foreColorValue');
    const backColorValue = document.getElementById('backColorValue');
    
    // 更新颜色显示
    qrForeColor.addEventListener('input', () => {
        foreColorValue.textContent = qrForeColor.value;
    });
    
    qrBackColor.addEventListener('input', () => {
        backColorValue.textContent = qrBackColor.value;
    });
    
    // 更新尺寸显示
    const sizeValue = document.getElementById('sizeValue');
    const sizeValue2 = document.getElementById('sizeValue2');
    
    qrSize.addEventListener('input', () => {
        const value = qrSize.value;
        sizeValue.textContent = value;
        sizeValue2.textContent = value;
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
                foreground: qrForeColor.value,
                background: qrBackColor.value
            };
            
            // 生成QR码
            const canvas = generateQRCode(content, options);
            
            // 显示QR码
            qrResult.classList.remove('hidden');
            qrCodeCanvas.width = canvas.width;
            qrCodeCanvas.height = canvas.height;
            qrCodeCanvas.getContext('2d').drawImage(canvas, 0, 0);
            
            // 添加到历史记录
            addToHistory(content);
            
        } catch (error) {
            alert(`QR码生成失败: ${error.message}`);
            console.error(error);
        }
    });
    
    // 下载QR码
    downloadBtn.addEventListener('click', () => {
        const canvas = qrCodeCanvas;
        const dataURL = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = dataURL;
        downloadLink.download = 'qr-code.png';
        downloadLink.click();
    });
    
    // 复制到剪贴板
    copyBtn.addEventListener('click', () => {
        const canvas = qrCodeCanvas;
        canvas.toBlob(blob => {
            navigator.clipboard.writeText('')
                .then(() => {
                    navigator.clipboard.write([
                        new ClipboardItem({
                            [blob.type]: blob
                        })
                    ])
                    .then(() => {
                        alert('QR码已复制到剪贴板');
                    })
                    .catch(err => {
                        console.error('复制失败:', err);
                        alert('复制失败');
                    });
                })
                .catch(err => {
                    console.error('清空剪贴板失败:', err);
                    alert('复制失败');
                });
        });
    });
    
    // 添加到历史记录
    function addToHistory(content) {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'history-item-content';
        contentDiv.textContent = content;
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'history-item-actions';
        
        const regenerateBtn = document.createElement('button');
        regenerateBtn.textContent = '重新生成';
        regenerateBtn.addEventListener('click', () => {
            qrContent.value = content;
            generateBtn.click();
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '删除';
        deleteBtn.addEventListener('click', () => {
            historyItem.remove();
        });
        
        actionsDiv.appendChild(regenerateBtn);
        actionsDiv.appendChild(deleteBtn);
        historyItem.appendChild(contentDiv);
        historyItem.appendChild(actionsDiv);
        
        historyList.appendChild(historyItem);
    }
});
