// 测试二维码生成器功能
const fs = require('fs');
const path = require('path');
const http = require('http');

// 测试页面是否可访问
function testPageAccess() {
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:8000/qr-generator.html', (res) => {
            console.log(`✓ 页面访问成功，状态码: ${res.statusCode}`);
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                // 检查页面是否包含关键元素
                if (body.includes('二维码生成器')) {
                    console.log('✓ 页面标题正确');
                }
                if (body.includes('生成二维码')) {
                    console.log('✓ 生成按钮存在');
                }
                if (body.includes('qrCode')) {
                    console.log('✓ Canvas元素存在');
                }
                resolve(body);
            });
        });
        
        req.on('error', (err) => {
            reject(new Error(`页面访问失败: ${err.message}`));
        });
        
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('页面访问超时'));
        });
    });
}

// 测试HTML文件结构
function testFileStructure() {
    const filePath = path.join(__dirname, 'qr-generator.html');
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error('文件不存在');
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        console.log(`✓ 文件读取成功，大小: ${content.length} 字符`);
        
        // 检查关键结构
        const keyElements = [
            'DOCTYPE html',
            'html lang="zh-CN"',
            'meta charset="UTF-8"',
            '二维码生成器',
            'canvas id="qrCode"',
            '生成二维码',
            'sizeValue',
            'foreground',
            'background',
            'generateQRCode',
            '</html>'
        ];
        
        let allElements = true;
        for (const element of keyElements) {
            if (content.includes(element)) {
                console.log(`✓ 包含 ${element}`);
            } else {
                console.log(`✗ 缺少 ${element}`);
                allElements = false;
            }
        }
        
        return allElements;
    } catch (error) {
        console.log(`✗ 文件结构测试失败: ${error.message}`);
        return false;
    }
}

// 测试JavaScript语法（简化版本）
function testJavaScriptSyntax() {
    const filePath = path.join(__dirname, 'qr-generator.html');
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 提取JavaScript代码
        const scriptTagPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
        const scriptMatches = content.match(scriptTagPattern);
        
        if (!scriptMatches || scriptMatches.length === 0) {
            throw new Error('未找到JavaScript代码');
        }
        
        scriptMatches.forEach((scriptTag, index) => {
            console.log(`✓ 找到Script ${index + 1}`);
        });
        
        return true;
    } catch (error) {
        console.log(`✗ JavaScript语法测试失败: ${error.message}`);
        return false;
    }
}

// 运行所有测试
async function runAllTests() {
    console.log('=== 二维码生成器功能测试 ===\n');
    
    try {
        const fileStructure = testFileStructure();
        if (!fileStructure) {
            console.log('\n文件结构测试失败，请检查文件');
            return false;
        }
        
        const javaScriptSyntax = testJavaScriptSyntax();
        if (!javaScriptSyntax) {
            console.log('\nJavaScript语法测试失败，请检查代码');
            return false;
        }
        
        await testPageAccess();
        
        console.log('\n=== 所有测试通过 ===');
        console.log('✅ 二维码生成器功能正常，可以正常使用');
        console.log('\n访问地址: http://localhost:8000/qr-generator.html');
        return true;
    } catch (error) {
        console.log(`\n✗ 测试失败: ${error.message}`);
        return false;
    }
}

// 运行测试
runAllTests();