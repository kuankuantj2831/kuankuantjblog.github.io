/**
 * 密码生成器功能模块
 * 提供安全的密码生成功能，包括各种密码选项和强度检测
 */

// 密码生成器状态
let passwordGeneratorState = {
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: false,
    includeSpaces: false,
    excludeSimilarChars: false,
    excludeAmbiguousChars: false,
    history: []
};

// 字符集定义
const CHARACTER_SETS = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+[]{}|;:,.<>?',
    spaces: ' '
};

// 相似字符集（用于排除选项）
const SIMILAR_CHARS = '0Ol1I';

// 模糊字符集（用于排除选项）
const AMBIGUOUS_CHARS = '{}[]()/\\\'"`~,;:.<>';

// 初始化密码生成器
function initPasswordGenerator() {
    console.log('[PasswordGenerator] 密码生成器功能模块已初始化');
    
    // 加载历史记录
    loadHistory();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 更新UI
    updatePasswordOptions();
}

// 加载历史记录
function loadHistory() {
    try {
        const savedHistory = localStorage.getItem('passwordHistory');
        if (savedHistory) {
            passwordGeneratorState.history = JSON.parse(savedHistory);
            updateHistoryList();
        }
    } catch (error) {
        console.error('加载密码历史记录失败:', error);
        passwordGeneratorState.history = [];
    }
}

// 保存历史记录
function saveHistory() {
    try {
        localStorage.setItem('passwordHistory', JSON.stringify(passwordGeneratorState.history));
    } catch (error) {
        console.error('保存密码历史记录失败:', error);
    }
}

// 更新历史记录列表
function updateHistoryList() {
    const historyList = document.getElementById('historyList');
    
    if (passwordGeneratorState.history.length === 0) {
        historyList.innerHTML = '<div style="text-align: center; color: #666; padding: 10px;">暂无密码历史记录</div>';
        return;
    }
    
    historyList.innerHTML = passwordGeneratorState.history.map((password, index) => `
        <div class="history-item">
            <span>${password}</span>
            <button class="history-copy-btn" data-index="${index}">复制</button>
        </div>
    `).join('');
    
    // 为历史记录中的复制按钮添加事件监听器
    document.querySelectorAll('.history-copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            const password = passwordGeneratorState.history[index];
            copyToClipboard(password, this);
        });
    });
}

// 设置事件监听器
function setupEventListeners() {
    // 生成密码按钮
    document.getElementById('generateBtn').addEventListener('click', generatePassword);
    
    // 复制按钮
    document.getElementById('copyBtn').addEventListener('click', function() {
        const password = document.getElementById('passwordResult').textContent;
        copyToClipboard(password, this);
    });
    
    // 密码长度滑块
    document.getElementById('passwordLength').addEventListener('input', function() {
        passwordGeneratorState.length = parseInt(this.value);
        document.getElementById('lengthValue').textContent = passwordGeneratorState.length;
        updatePasswordOptions();
    });
    
    // 包含选项复选框
    document.getElementById('includeUppercase').addEventListener('change', function() {
        passwordGeneratorState.includeUppercase = this.checked;
        updatePasswordOptions();
    });
    
    document.getElementById('includeLowercase').addEventListener('change', function() {
        passwordGeneratorState.includeLowercase = this.checked;
        updatePasswordOptions();
    });
    
    document.getElementById('includeNumbers').addEventListener('change', function() {
        passwordGeneratorState.includeNumbers = this.checked;
        updatePasswordOptions();
    });
    
    document.getElementById('includeSymbols').addEventListener('change', function() {
        passwordGeneratorState.includeSymbols = this.checked;
        updatePasswordOptions();
    });
    
    document.getElementById('includeSpaces').addEventListener('change', function() {
        passwordGeneratorState.includeSpaces = this.checked;
        updatePasswordOptions();
    });
    
    // 排除选项复选框
    document.getElementById('excludeSimilarChars').addEventListener('change', function() {
        passwordGeneratorState.excludeSimilarChars = this.checked;
        updatePasswordOptions();
    });
    
    document.getElementById('excludeAmbiguousChars').addEventListener('change', function() {
        passwordGeneratorState.excludeAmbiguousChars = this.checked;
        updatePasswordOptions();
    });
}

// 更新密码选项
function updatePasswordOptions() {
    // 确保至少选择一个字符类型
    const hasSelectedType = 
        passwordGeneratorState.includeUppercase ||
        passwordGeneratorState.includeLowercase ||
        passwordGeneratorState.includeNumbers ||
        passwordGeneratorState.includeSymbols ||
        passwordGeneratorState.includeSpaces;
    
    if (!hasSelectedType) {
        document.getElementById('includeUppercase').checked = true;
        document.getElementById('includeLowercase').checked = true;
        document.getElementById('includeNumbers').checked = true;
        passwordGeneratorState.includeUppercase = true;
        passwordGeneratorState.includeLowercase = true;
        passwordGeneratorState.includeNumbers = true;
    }
}

// 生成密码
function generatePassword() {
    // 构建字符集
    let charset = '';
    
    if (passwordGeneratorState.includeUppercase) {
        charset += CHARACTER_SETS.uppercase;
    }
    
    if (passwordGeneratorState.includeLowercase) {
        charset += CHARACTER_SETS.lowercase;
    }
    
    if (passwordGeneratorState.includeNumbers) {
        charset += CHARACTER_SETS.numbers;
    }
    
    if (passwordGeneratorState.includeSymbols) {
        charset += CHARACTER_SETS.symbols;
    }
    
    if (passwordGeneratorState.includeSpaces) {
        charset += CHARACTER_SETS.spaces;
    }
    
    // 应用排除选项
    if (passwordGeneratorState.excludeSimilarChars) {
        charset = charset.replace(new RegExp(`[${SIMILAR_CHARS}]`, 'g'), '');
    }
    
    if (passwordGeneratorState.excludeAmbiguousChars) {
        charset = charset.replace(new RegExp(`[${AMBIGUOUS_CHARS}]`, 'g'), '');
    }
    
    // 生成密码
    let password = '';
    const randomValues = new Uint32Array(passwordGeneratorState.length);
    crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < passwordGeneratorState.length; i++) {
        const randomIndex = randomValues[i] % charset.length;
        password += charset.charAt(randomIndex);
    }
    
    // 更新UI
    document.getElementById('passwordResult').textContent = password;
    document.getElementById('copyBtn').className = 'copy-btn';
    
    // 检测密码强度
    const strength = calculatePasswordStrength(password);
    updatePasswordStrength(strength);
    
    // 添加到历史记录
    if (!passwordGeneratorState.history.includes(password)) {
        passwordGeneratorState.history.unshift(password);
        
        // 限制历史记录数量
        if (passwordGeneratorState.history.length > 10) {
            passwordGeneratorState.history.pop();
        }
        
        saveHistory();
        updateHistoryList();
    }
}

// 计算密码强度
function calculatePasswordStrength(password) {
    let strength = 0;
    
    // 长度加分
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (password.length >= 16) strength += 1;
    
    // 字符类型加分
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
    
    // 额外加分（如果包含多种字符类型）
    if (password.length >= 10 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
        strength += 1;
    }
    
    if (password.length >= 12 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password)) {
        strength += 1;
    }
    
    return strength;
}

// 更新密码强度显示
function updatePasswordStrength(strength) {
    const strengthLevel = document.getElementById('strengthLevel');
    const strengthText = document.getElementById('strengthText');
    
    // 强度等级：0-2 弱，3-4 中等，5-6 强，7+ 极强
    if (strength <= 2) {
        strengthLevel.style.width = '33%';
        strengthLevel.style.backgroundColor = '#dc3545'; // 红色
        strengthText.textContent = '弱';
    } else if (strength <= 4) {
        strengthLevel.style.width = '66%';
        strengthLevel.style.backgroundColor = '#ffc107'; // 黄色
        strengthText.textContent = '中等';
    } else if (strength <= 6) {
        strengthLevel.style.width = '85%';
        strengthLevel.style.backgroundColor = '#28a745'; // 绿色
        strengthText.textContent = '强';
    } else {
        strengthLevel.style.width = '100%';
        strengthLevel.style.backgroundColor = '#007bff'; // 蓝色
        strengthText.textContent = '极强';
    }
}

// 复制到剪贴板
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        // 显示复制成功状态
        const originalText = button.textContent;
        button.textContent = '已复制';
        button.classList.add('copied');
        
        // 3秒后恢复原状
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 3000);
    }).catch(err => {
        console.error('复制到剪贴板失败:', err);
        alert('复制失败，请手动复制');
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initPasswordGenerator);

// 导出模块（如果需要）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initPasswordGenerator,
        generatePassword,
        calculatePasswordStrength,
        copyToClipboard
    };
}