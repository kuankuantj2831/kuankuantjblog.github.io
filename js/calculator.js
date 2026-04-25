/**
 * 计算器功能模块
 * 提供基础的四则运算、百分比计算、历史记录等功能
 */

// 计算器状态
let calculatorState = {
    currentValue: '0',
    previousValue: null,
    operator: null,
    shouldResetDisplay: false,
    history: []
};

// 显示当前值
function updateDisplay() {
    const display = document.getElementById('display');
    display.textContent = calculatorState.currentValue;
}

// 更新历史记录
function escapeCalculatorText(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function updateHistory() {
    const historyDiv = document.getElementById('history');
    historyDiv.innerHTML = calculatorState.history.map(item => `
        <div class="calculator-history-item">
            <div>${escapeCalculatorText(item.expression)}</div>
            <div style="font-weight: bold; color: #28a745;">=${escapeCalculatorText(item.result)}</div>
        </div>
    `).join('');
}

// 清除显示
function clearDisplay() {
    calculatorState.currentValue = '0';
    calculatorState.previousValue = null;
    calculatorState.operator = null;
    calculatorState.shouldResetDisplay = false;
    updateDisplay();
}

// 退格
function backspace() {
    if (calculatorState.currentValue.length > 1) {
        calculatorState.currentValue = calculatorState.currentValue.slice(0, -1);
    } else {
        calculatorState.currentValue = '0';
    }
    updateDisplay();
}

// 追加数字
function appendNumber(num) {
    if (calculatorState.shouldResetDisplay) {
        calculatorState.currentValue = num;
        calculatorState.shouldResetDisplay = false;
    } else {
        if (calculatorState.currentValue === '0') {
            calculatorState.currentValue = num;
        } else {
            calculatorState.currentValue += num;
        }
    }
    updateDisplay();
}

// 追加小数点
function appendDot() {
    if (calculatorState.shouldResetDisplay) {
        calculatorState.currentValue = '0.';
        calculatorState.shouldResetDisplay = false;
    } else if (!calculatorState.currentValue.includes('.')) {
        calculatorState.currentValue += '.';
    }
    updateDisplay();
}

// 追加百分比
function appendPercent() {
    const value = parseFloat(calculatorState.currentValue);
    calculatorState.currentValue = (value / 100).toString();
    updateDisplay();
}

// 追加运算符
function appendOperator(op) {
    if (calculatorState.operator && !calculatorState.shouldResetDisplay) {
        calculate();
    }
    
    calculatorState.previousValue = calculatorState.currentValue;
    calculatorState.operator = op;
    calculatorState.shouldResetDisplay = true;
}

// 计算结果
function calculate() {
    if (!calculatorState.operator || calculatorState.shouldResetDisplay) {
        return;
    }
    
    const prev = parseFloat(calculatorState.previousValue);
    const current = parseFloat(calculatorState.currentValue);
    let result;
    
    switch (calculatorState.operator) {
        case '+':
            result = prev + current;
            break;
        case '-':
            result = prev - current;
            break;
        case '*':
            result = prev * current;
            break;
        case '/':
            if (current === 0) {
                alert('不能除以零');
                return;
            }
            result = prev / current;
            break;
        default:
            return;
    }
    
    // 格式化结果，避免小数精度问题
    result = formatResult(result);
    
    // 保存到历史记录
    const expression = `${calculatorState.previousValue} ${getOperatorSymbol(calculatorState.operator)} ${calculatorState.currentValue}`;
    calculatorState.history.push({
        expression: expression,
        result: result
    });
    
    // 保留最近10条历史记录
    if (calculatorState.history.length > 10) {
        calculatorState.history.shift();
    }
    
    // 更新状态
    calculatorState.currentValue = result;
    calculatorState.operator = null;
    calculatorState.previousValue = null;
    calculatorState.shouldResetDisplay = true;
    
    updateDisplay();
    updateHistory();
}

// 格式化计算结果
function formatResult(result) {
    // 检查是否是整数
    if (Number.isInteger(result)) {
        return result.toString();
    }
    
    // 格式化小数，保留最多10位小数
    const formatted = parseFloat(result.toFixed(10));
    return formatted.toString();
}

// 获取运算符符号
function getOperatorSymbol(op) {
    switch (op) {
        case '+':
            return '+';
        case '-':
            return '-';
        case '*':
            return '×';
        case '/':
            return '÷';
        default:
            return op;
    }
}

// 键盘支持
document.addEventListener('keydown', function(event) {
    const key = event.key;
    
    // 数字键
    if (/[0-9]/.test(key)) {
        appendNumber(key);
    }
    // 小数点
    else if (key === '.') {
        appendDot();
    }
    // 运算符
    else if (key === '+' || key === '-' || key === '*' || key === '/') {
        appendOperator(key);
    }
    // 等号
    else if (key === 'Enter' || key === '=') {
        calculate();
        event.preventDefault();
    }
    // 清除
    else if (key === 'Escape' || key === 'c' || key === 'C') {
        clearDisplay();
    }
    // 退格
    else if (key === 'Backspace') {
        backspace();
    }
    // 百分比
    else if (key === '%') {
        appendPercent();
    }
});

// 初始化计算器
function initCalculator() {
    console.log('[Calculator] 计算器功能模块已初始化');
    
    // 加载历史记录（如果有存储）
    loadHistory();
    
    // 更新显示
    updateDisplay();
    updateHistory();
}

// 加载历史记录
function loadHistory() {
    try {
        const savedHistory = localStorage.getItem('calculatorHistory');
        if (savedHistory) {
            calculatorState.history = JSON.parse(savedHistory);
        }
    } catch (error) {
        console.error('加载计算历史记录失败:', error);
        calculatorState.history = [];
    }
}

// 保存历史记录
function saveHistory() {
    try {
        localStorage.setItem('calculatorHistory', JSON.stringify(calculatorState.history));
    } catch (error) {
        console.error('保存计算历史记录失败:', error);
    }
}

// 监听窗口关闭事件，保存历史记录
window.addEventListener('beforeunload', saveHistory);

// 页面加载完成后初始化计算器
document.addEventListener('DOMContentLoaded', initCalculator);

// 导出模块（如果需要）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initCalculator,
        clearDisplay,
        appendNumber,
        appendOperator,
        calculate,
        backspace,
        appendPercent,
        appendDot
    };
}