/**
 * 单位转换器功能模块
 * 提供长度、重量、温度、面积、体积等多种单位的转换功能
 */

// 长度单位转换率（相对于米）
const LENGTH_CONVERSIONS = {
    'm': 1,
    'km': 1000,
    'cm': 0.01,
    'mm': 0.001,
    'mile': 1609.34,
    'yard': 0.9144,
    'foot': 0.3048,
    'inch': 0.0254
};

// 重量单位转换率（相对于千克）
const WEIGHT_CONVERSIONS = {
    'kg': 1,
    'g': 0.001,
    'mg': 0.000001,
    'ton': 1000,
    'pound': 0.453592,
    'ounce': 0.0283495
};

// 面积单位转换率（相对于平方米）
const AREA_CONVERSIONS = {
    'm2': 1,
    'km2': 1000000,
    'cm2': 0.0001,
    'mm2': 0.000001,
    'acre': 4046.86,
    'hectare': 10000
};

// 体积单位转换率（相对于立方米）
const VOLUME_CONVERSIONS = {
    'm3': 1,
    'liter': 0.001,
    'milliliter': 0.000001,
    'gallon': 0.00378541,
    'quart': 0.000946353,
    'pint': 0.000473176,
    'cup': 0.000236588
};

// 初始化单位转换器
function initUnitConverter() {
    console.log('[UnitConverter] 单位转换器功能模块已初始化');
    
    // 设置事件监听器
    setupEventListeners();
    
    // 初始化所有转换器
    updateLengthConversion();
    updateWeightConversion();
    updateTemperatureConversion();
    updateAreaConversion();
    updateVolumeConversion();
}

// 设置事件监听器
function setupEventListeners() {
    // 长度转换事件
    document.getElementById('lengthInput').addEventListener('input', updateLengthConversion);
    document.getElementById('lengthFrom').addEventListener('change', updateLengthConversion);
    document.getElementById('lengthTo').addEventListener('change', updateLengthConversion);
    document.getElementById('lengthSwapBtn').addEventListener('click', swapLengthUnits);
    
    // 重量转换事件
    document.getElementById('weightInput').addEventListener('input', updateWeightConversion);
    document.getElementById('weightFrom').addEventListener('change', updateWeightConversion);
    document.getElementById('weightTo').addEventListener('change', updateWeightConversion);
    document.getElementById('weightSwapBtn').addEventListener('click', swapWeightUnits);
    
    // 温度转换事件
    document.getElementById('temperatureInput').addEventListener('input', updateTemperatureConversion);
    document.getElementById('temperatureFrom').addEventListener('change', updateTemperatureConversion);
    document.getElementById('temperatureTo').addEventListener('change', updateTemperatureConversion);
    document.getElementById('temperatureSwapBtn').addEventListener('click', swapTemperatureUnits);
    
    // 面积转换事件
    document.getElementById('areaInput').addEventListener('input', updateAreaConversion);
    document.getElementById('areaFrom').addEventListener('change', updateAreaConversion);
    document.getElementById('areaTo').addEventListener('change', updateAreaConversion);
    document.getElementById('areaSwapBtn').addEventListener('click', swapAreaUnits);
    
    // 体积转换事件
    document.getElementById('volumeInput').addEventListener('input', updateVolumeConversion);
    document.getElementById('volumeFrom').addEventListener('change', updateVolumeConversion);
    document.getElementById('volumeTo').addEventListener('change', updateVolumeConversion);
    document.getElementById('volumeSwapBtn').addEventListener('click', swapVolumeUnits);
}

// 更新长度转换
function updateLengthConversion() {
    const value = parseFloat(document.getElementById('lengthInput').value) || 0;
    const fromUnit = document.getElementById('lengthFrom').value;
    const toUnit = document.getElementById('lengthTo').value;
    
    const result = convertLength(value, fromUnit, toUnit);
    document.getElementById('lengthResult').textContent = formatNumber(result);
    document.getElementById('lengthResultLabel').textContent = getUnitName(toUnit);
}

// 转换长度
function convertLength(value, fromUnit, toUnit) {
    const meters = value * LENGTH_CONVERSIONS[fromUnit];
    return meters / LENGTH_CONVERSIONS[toUnit];
}

// 交换长度单位
function swapLengthUnits() {
    const fromSelect = document.getElementById('lengthFrom');
    const toSelect = document.getElementById('lengthTo');
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
    updateLengthConversion();
}

// 更新重量转换
function updateWeightConversion() {
    const value = parseFloat(document.getElementById('weightInput').value) || 0;
    const fromUnit = document.getElementById('weightFrom').value;
    const toUnit = document.getElementById('weightTo').value;
    
    const result = convertWeight(value, fromUnit, toUnit);
    document.getElementById('weightResult').textContent = formatNumber(result);
    document.getElementById('weightResultLabel').textContent = getUnitName(toUnit);
}

// 转换重量
function convertWeight(value, fromUnit, toUnit) {
    const kilograms = value * WEIGHT_CONVERSIONS[fromUnit];
    return kilograms / WEIGHT_CONVERSIONS[toUnit];
}

// 交换重量单位
function swapWeightUnits() {
    const fromSelect = document.getElementById('weightFrom');
    const toSelect = document.getElementById('weightTo');
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
    updateWeightConversion();
}

// 更新温度转换
function updateTemperatureConversion() {
    const value = parseFloat(document.getElementById('temperatureInput').value) || 0;
    const fromUnit = document.getElementById('temperatureFrom').value;
    const toUnit = document.getElementById('temperatureTo').value;
    
    const result = convertTemperature(value, fromUnit, toUnit);
    document.getElementById('temperatureResult').textContent = formatNumber(result);
    document.getElementById('temperatureResultLabel').textContent = getUnitName(toUnit);
}

// 转换温度
function convertTemperature(value, fromUnit, toUnit) {
    let celsius = 0;
    
    // 先转换为摄氏度
    switch (fromUnit) {
        case 'celsius':
            celsius = value;
            break;
        case 'fahrenheit':
            celsius = (value - 32) * 5 / 9;
            break;
        case 'kelvin':
            celsius = value - 273.15;
            break;
    }
    
    // 从摄氏度转换到目标单位
    switch (toUnit) {
        case 'celsius':
            return celsius;
        case 'fahrenheit':
            return celsius * 9 / 5 + 32;
        case 'kelvin':
            return celsius + 273.15;
    }
}

// 交换温度单位
function swapTemperatureUnits() {
    const fromSelect = document.getElementById('temperatureFrom');
    const toSelect = document.getElementById('temperatureTo');
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
    updateTemperatureConversion();
}

// 更新面积转换
function updateAreaConversion() {
    const value = parseFloat(document.getElementById('areaInput').value) || 0;
    const fromUnit = document.getElementById('areaFrom').value;
    const toUnit = document.getElementById('areaTo').value;
    
    const result = convertArea(value, fromUnit, toUnit);
    document.getElementById('areaResult').textContent = formatNumber(result);
    document.getElementById('areaResultLabel').textContent = getUnitName(toUnit);
}

// 转换面积
function convertArea(value, fromUnit, toUnit) {
    const squareMeters = value * AREA_CONVERSIONS[fromUnit];
    return squareMeters / AREA_CONVERSIONS[toUnit];
}

// 交换面积单位
function swapAreaUnits() {
    const fromSelect = document.getElementById('areaFrom');
    const toSelect = document.getElementById('areaTo');
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
    updateAreaConversion();
}

// 更新体积转换
function updateVolumeConversion() {
    const value = parseFloat(document.getElementById('volumeInput').value) || 0;
    const fromUnit = document.getElementById('volumeFrom').value;
    const toUnit = document.getElementById('volumeTo').value;
    
    const result = convertVolume(value, fromUnit, toUnit);
    document.getElementById('volumeResult').textContent = formatNumber(result);
    document.getElementById('volumeResultLabel').textContent = getUnitName(toUnit);
}

// 转换体积
function convertVolume(value, fromUnit, toUnit) {
    const cubicMeters = value * VOLUME_CONVERSIONS[fromUnit];
    return cubicMeters / VOLUME_CONVERSIONS[toUnit];
}

// 交换体积单位
function swapVolumeUnits() {
    const fromSelect = document.getElementById('volumeFrom');
    const toSelect = document.getElementById('volumeTo');
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
    updateVolumeConversion();
}

// 格式化数字显示
function formatNumber(num) {
    if (isNaN(num)) return '0';
    
    // 根据数字大小选择合适的格式
    if (Math.abs(num) < 0.0001 || Math.abs(num) > 10000) {
        return num.toExponential(4);
    }
    
    return num.toFixed(4).replace(/\.?0*$/, '');
}

// 获取单位的中文名称
function getUnitName(unit) {
    const unitNames = {
        // 长度
        'm': '米 (m)',
        'km': '千米 (km)',
        'cm': '厘米 (cm)',
        'mm': '毫米 (mm)',
        'mile': '英里 (mile)',
        'yard': '码 (yard)',
        'foot': '英尺 (foot)',
        'inch': '英寸 (inch)',
        // 重量
        'kg': '千克 (kg)',
        'g': '克 (g)',
        'mg': '毫克 (mg)',
        'ton': '吨 (ton)',
        'pound': '磅 (pound)',
        'ounce': '盎司 (ounce)',
        // 温度
        'celsius': '摄氏度 (°C)',
        'fahrenheit': '华氏度 (°F)',
        'kelvin': '开尔文 (K)',
        // 面积
        'm2': '平方米 (m²)',
        'km2': '平方千米 (km²)',
        'cm2': '平方厘米 (cm²)',
        'mm2': '平方毫米 (mm²)',
        'acre': '英亩 (acre)',
        'hectare': '公顷 (hectare)',
        // 体积
        'm3': '立方米 (m³)',
        'liter': '升 (L)',
        'milliliter': '毫升 (mL)',
        'gallon': '加仑 (gallon)',
        'quart': '夸脱 (quart)',
        'pint': '品脱 (pint)',
        'cup': '杯 (cup)'
    };
    
    return unitNames[unit] || unit;
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initUnitConverter);

// 导出模块（如果需要）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initUnitConverter,
        convertLength,
        convertWeight,
        convertTemperature,
        convertArea,
        convertVolume
    };
}