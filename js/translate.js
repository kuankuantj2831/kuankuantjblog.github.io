/**
 * 翻译功能模块
 * 使用百度翻译API提供翻译服务
 */

// 翻译状态
let translateState = {
    inputText: '',
    fromLang: 'zh',
    toLang: 'en',
    translation: '',
    history: [],
    isLoading: false
};

// 翻译API配置
const TRANSLATE_API = {
    baseUrl: 'https://fanyi-api.baidu.com/api/trans/vip/translate',
    appid: 'YOUR_APP_ID_HERE', // 需要替换为有效的百度翻译API ID
    key: 'YOUR_SECRET_KEY_HERE' // 需要替换为有效的百度翻译API密钥
};

// 语言列表
const LANGUAGES = {
    'zh': '中文',
    'en': '英文',
    'ja': '日文',
    'ko': '韩文',
    'fr': '法文',
    'de': '德文',
    'ru': '俄文',
    'es': '西班牙文',
    'it': '意大利文',
    'pt': '葡萄牙文'
};

// 获取翻译结果
async function fetchTranslation(inputText, fromLang, toLang) {
    try {
        translateState.isLoading = true;
        showLoading();
        
        const salt = Date.now();
        const sign = generateSign(inputText, salt);
        
        const params = new URLSearchParams({
            q: inputText,
            from: fromLang,
            to: toLang,
            appid: TRANSLATE_API.appid,
            salt: salt,
            sign: sign
        });
        
        const response = await fetch(`${TRANSLATE_API.baseUrl}?${params}`);
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error_code) {
            throw new Error(`翻译失败: ${data.error_msg}`);
        }
        
        const translation = data.trans_result[0].dst;
        
        translateState.translation = translation;
        translateState.history.unshift({
            inputText: inputText,
            translation: translation,
            fromLang: fromLang,
            toLang: toLang,
            timestamp: Date.now()
        });
        
        // 限制历史记录数量为10条
        if (translateState.history.length > 10) {
            translateState.history = translateState.history.slice(0, 10);
        }
        
        saveHistory();
        hideLoading();
        showTranslation(translation);
    } catch (error) {
        console.error('翻译失败:', error);
        hideLoading();
        showError(`翻译失败: ${error.message}`);
    }
}

// 生成签名
function generateSign(inputText, salt) {
    return md5(`${TRANSLATE_API.appid}${inputText}${salt}${TRANSLATE_API.key}`);
}

// MD5 哈希函数（简化版）
function md5(str) {
    // 这里使用一个简化的MD5实现，实际项目中应该使用更完整的实现
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash).toString(16);
}

// 显示翻译结果
function showTranslation(translation) {
    document.getElementById('translateResultText').textContent = translation;
    document.getElementById('translateResultMeta').textContent = `${LANGUAGES[translateState.fromLang]} → ${LANGUAGES[translateState.toLang]}`;
    document.getElementById('translateResult').classList.add('active');
    document.getElementById('translateError').classList.remove('active');
}

// 显示加载状态
function showLoading() {
    document.getElementById('translateLoading').classList.add('active');
    document.getElementById('translateResult').classList.remove('active');
    document.getElementById('translateError').classList.remove('active');
    document.getElementById('translateSubmitBtn').disabled = true;
}

// 隐藏加载状态
function hideLoading() {
    document.getElementById('translateLoading').classList.remove('active');
    document.getElementById('translateSubmitBtn').disabled = false;
}

// 显示错误信息
function showError(message) {
    document.getElementById('translateError').textContent = message;
    document.getElementById('translateError').classList.add('active');
    document.getElementById('translateResult').classList.remove('active');
}

// 交换语言
function switchLanguages() {
    const temp = translateState.fromLang;
    translateState.fromLang = translateState.toLang;
    translateState.toLang = temp;
    
    document.getElementById('translateLangFrom').value = translateState.fromLang;
    document.getElementById('translateLangTo').value = translateState.toLang;
}

// 复制翻译结果
function copyTranslation() {
    const text = document.getElementById('translateResultText').textContent;
    navigator.clipboard.writeText(text).then(() => {
        alert('翻译结果已复制到剪贴板');
    }).catch(err => {
        console.error('复制失败:', err);
        alert('复制失败');
    });
}

// 加载翻译历史
function loadHistory() {
    try {
        const savedHistory = localStorage.getItem('translateHistory');
        if (savedHistory) {
            translateState.history = JSON.parse(savedHistory);
            updateHistoryList();
        }
    } catch (error) {
        console.error('加载翻译历史失败:', error);
        translateState.history = [];
    }
}

// 保存翻译历史
function saveHistory() {
    try {
        localStorage.setItem('translateHistory', JSON.stringify(translateState.history));
        updateHistoryList();
    } catch (error) {
        console.error('保存翻译历史失败:', error);
    }
}

// 更新翻译历史列表
function updateHistoryList() {
    const historyList = document.getElementById('translateHistoryList');
    
    if (translateState.history.length === 0) {
        historyList.innerHTML = '<li style="text-align: center; color: #6c757d;">暂无翻译历史</li>';
        return;
    }
    
    historyList.innerHTML = translateState.history.map(item => `
        <li class="translate-history-item" data-index="${item.timestamp}">
            <div class="translate-history-text">${item.inputText}</div>
            <div class="translate-history-lang">${LANGUAGES[item.fromLang]} → ${LANGUAGES[item.toLang]} · ${formatTime(item.timestamp)}</div>
        </li>
    `).join('');
    
    // 添加历史项点击事件
    document.querySelectorAll('.translate-history-item').forEach(item => {
        item.addEventListener('click', function() {
            const index = this.dataset.index;
            const historyItem = translateState.history.find(h => h.timestamp == index);
            
            if (historyItem) {
                document.getElementById('translateInput').value = historyItem.inputText;
                document.getElementById('translateLangFrom').value = historyItem.fromLang;
                document.getElementById('translateLangTo').value = historyItem.toLang;
                document.getElementById('translateResultText').textContent = historyItem.translation;
                document.getElementById('translateResultMeta').textContent = `${LANGUAGES[historyItem.fromLang]} → ${LANGUAGES[historyItem.toLang]}`;
                document.getElementById('translateResult').classList.add('active');
                document.getElementById('translateError').classList.remove('active');
            }
        });
    });
}

// 格式化时间
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) { // 小于1分钟
        return '刚刚';
    } else if (diff < 3600000) { // 小于1小时
        return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) { // 小于1天
        return `${Math.floor(diff / 3600000)}小时前`;
    } else { // 大于1天
        return date.toLocaleDateString();
    }
}

// 事件监听器
function setupEventListeners() {
    // 翻译按钮事件
    document.getElementById('translateSubmitBtn').addEventListener('click', () => {
        const inputText = document.getElementById('translateInput').value;
        if (inputText.trim()) {
            translateState.inputText = inputText;
            translateState.fromLang = document.getElementById('translateLangFrom').value;
            translateState.toLang = document.getElementById('translateLangTo').value;
            fetchTranslation(inputText, translateState.fromLang, translateState.toLang);
        } else {
            showError('请输入要翻译的文本');
        }
    });
    
    // 输入框回车事件
    document.getElementById('translateInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const inputText = document.getElementById('translateInput').value;
            if (inputText.trim()) {
                translateState.inputText = inputText;
                translateState.fromLang = document.getElementById('translateLangFrom').value;
                translateState.toLang = document.getElementById('translateLangTo').value;
                fetchTranslation(inputText, translateState.fromLang, translateState.toLang);
            }
        }
    });
    
    // 交换语言按钮事件
    document.getElementById('translateSwitchBtn').addEventListener('click', switchLanguages);
    
    // 复制按钮事件
    document.getElementById('translateCopyBtn').addEventListener('click', copyTranslation);
    
    // 语言选择事件
    document.getElementById('translateLangFrom').addEventListener('change', (e) => {
        translateState.fromLang = e.target.value;
    });
    
    document.getElementById('translateLangTo').addEventListener('change', (e) => {
        translateState.toLang = e.target.value;
    });
}

// 初始化翻译功能
function initTranslate() {
    console.log('[Translate] 翻译功能模块已初始化');
    
    // 加载翻译历史
    loadHistory();
    
    // 设置事件监听器
    setupEventListeners();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initTranslate);

// 导出模块（如果需要）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initTranslate,
        fetchTranslation,
        switchLanguages,
        copyTranslation
    };
}