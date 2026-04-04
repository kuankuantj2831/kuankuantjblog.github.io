/**
 * Jest 单元测试示例
 */

const { sum, multiply, divide, formatDate, validateEmail } = require('./utils');

describe('数学运算', () => {
    test('加法运算', () => {
        expect(sum(1, 2)).toBe(3);
        expect(sum(-1, 1)).toBe(0);
        expect(sum(0, 0)).toBe(0);
    });

    test('乘法运算', () => {
        expect(multiply(2, 3)).toBe(6);
        expect(multiply(-2, 3)).toBe(-6);
        expect(multiply(0, 100)).toBe(0);
    });

    test('除法运算', () => {
        expect(divide(6, 2)).toBe(3);
        expect(divide(5, 2)).toBe(2.5);
        expect(() => divide(1, 0)).toThrow('Cannot divide by zero');
    });
});

describe('字符串处理', () => {
    test('日期格式化', () => {
        const date = new Date('2024-01-15');
        expect(formatDate(date)).toBe('2024-01-15');
    });

    test('邮箱验证', () => {
        expect(validateEmail('test@example.com')).toBe(true);
        expect(validateEmail('user.name@domain.co.uk')).toBe(true);
        expect(validateEmail('invalid-email')).toBe(false);
        expect(validateEmail('@example.com')).toBe(false);
        expect(validateEmail('')).toBe(false);
    });
});

describe('异步函数', () => {
    test('异步数据获取', async () => {
        const data = await fetchData();
        expect(data).toHaveProperty('id');
        expect(data).toHaveProperty('name');
    });

    test('API错误处理', async () => {
        await expect(fetchDataWithError()).rejects.toThrow('API Error');
    });
});

// Mock 函数示例
describe('Mock测试', () => {
    test('函数被调用', () => {
        const mockFn = jest.fn();
        mockFn('arg1', 'arg2');
        expect(mockFn).toHaveBeenCalled();
        expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
        expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('Mock返回值', () => {
        const mockFn = jest.fn().mockReturnValue('mocked');
        expect(mockFn()).toBe('mocked');
    });

    test('Mock异步函数', async () => {
        const mockAsync = jest.fn().mockResolvedValue({ data: [] });
        const result = await mockAsync();
        expect(result).toEqual({ data: [] });
    });
});

// 辅助函数
function sum(a, b) {
    return a + b;
}

function multiply(a, b) {
    return a * b;
}

function divide(a, b) {
    if (b === 0) throw new Error('Cannot divide by zero');
    return a / b;
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function fetchData() {
    return Promise.resolve({ id: 1, name: 'Test' });
}

function fetchDataWithError() {
    return Promise.reject(new Error('API Error'));
}
