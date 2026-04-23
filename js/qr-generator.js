// QR Code Generator (Simple Implementation)
function generateQRCode(content, options = {}) {
    const {
        size = 256,
        level = 'L',
        foreground = '#000000',
        background = '#FFFFFF'
    } = options;
    
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, size, size);
    
    ctx.fillStyle = foreground;
    const moduleSize = Math.floor(size / 25);
    
    // Draw position patterns
    drawPositionPattern(ctx, moduleSize * 3, moduleSize * 3, moduleSize * 7);
    drawPositionPattern(ctx, size - moduleSize * 10, moduleSize * 3, moduleSize * 7);
    drawPositionPattern(ctx, moduleSize * 3, size - moduleSize * 10, moduleSize * 7);
    
    // Draw simple pattern
    for (let y = moduleSize * 8; y < size - moduleSize * 8; y += moduleSize * 2) {
        for (let x = moduleSize * 8; x < size - moduleSize * 8; x += moduleSize * 3) {
            ctx.fillRect(x, y, moduleSize, moduleSize);
        }
    }
    
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

function drawPositionPattern(ctx, x, y, size) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y, size, size);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + size / 5, y + size / 5, size * 3 / 5, size * 3 / 5);
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + size * 2 / 5, y + size * 2 / 5, size * 1 / 5, size * 1 / 5);
}

function encodeData(content) {
    let binary = '';
    for (let i = 0; i < content.length; i++) {
        const charCode = content.charCodeAt(i);
        binary += charCode.toString(2).padStart(8, '0');
    }
    
    binary += '0000';
    while (binary.length % 8 !== 0) {
        binary += '0';
    }
    
    return binary.split('').map(bit => parseInt(bit));
}

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
    
    qrForeColor.addEventListener('input', () => {
        foreColorValue.textContent = qrForeColor.value;
    });
    
    qrBackColor.addEventListener('input', () => {
        backColorValue.textContent = qrBackColor.value;
    });
    
    const sizeValue = document.getElementById('sizeValue');
    const sizeValue2 = document.getElementById('sizeValue2');
    
    qrSize.addEventListener('input', () => {
        const value = qrSize.value;
        sizeValue.textContent = value;
        sizeValue2.textContent = value;
    });
    
    generateBtn.addEventListener('click', () => {
        const content = qrContent.value.trim();
        
        if (!content) {
            alert('Please enter content to generate QR code');
            return;
        }
        
        try {
            const options = {
                size: parseInt(qrSize.value),
                level: qrLevel.value,
                foreground: qrForeColor.value,
                background: qrBackColor.value
            };
            
            const canvas = generateQRCode(content, options);
            
            qrResult.classList.remove('hidden');
            qrCodeCanvas.width = canvas.width;
            qrCodeCanvas.height = canvas.height;
            qrCodeCanvas.getContext('2d').drawImage(canvas, 0, 0);
            
            addToHistory(content);
            
        } catch (error) {
            alert(`QR Code generation failed: ${error.message}`);
            console.error(error);
        }
    });
    
    downloadBtn.addEventListener('click', () => {
        const canvas = qrCodeCanvas;
        const dataURL = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = dataURL;
        downloadLink.download = 'qr-code.png';
        downloadLink.click();
    });
    
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
                        alert('QR Code copied to clipboard');
                    })
                    .catch(err => {
                        console.error('Copy failed:', err);
                        alert('Copy failed');
                    });
                })
                .catch(err => {
                    console.error('Clear clipboard failed:', err);
                    alert('Copy failed');
                });
        });
    });
    
    function addToHistory(content) {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'history-item-content';
        contentDiv.textContent = content;
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'history-item-actions';
        
        const regenerateBtn = document.createElement('button');
        regenerateBtn.textContent = 'Regenerate';
        regenerateBtn.addEventListener('click', () => {
            qrContent.value = content;
            generateBtn.click();
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
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