/**
 * 国际化 (i18n) 模块
 * 支持多语言切换、自动翻译、RTL布局
 */

class I18nSystem {
    constructor() {
        this.currentLang = localStorage.getItem('preferred_language') || 'zh-CN';
        this.fallbackLang = 'zh-CN';
        this.translations = {};
        this.pluralRules = new Intl.PluralRules(this.currentLang);
        this.rtlLanguages = ['ar', 'he', 'fa', 'ur'];
        
        this.supportedLanguages = [
            { code: 'zh-CN', name: '简体中文', flag: 'CN', dir: 'ltr' },
            { code: 'zh-TW', name: '繁體中文', flag: 'TW', dir: 'ltr' },
            { code: 'en', name: 'English', flag: 'US', dir: 'ltr' },
            { code: 'ja', name: '日本語', flag: 'JP', dir: 'ltr' },
            { code: 'ko', name: '한국어', flag: 'KR', dir: 'ltr' },
            { code: 'fr', name: 'Français', flag: 'FR', dir: 'ltr' },
            { code: 'de', name: 'Deutsch', flag: 'DE', dir: 'ltr' },
            { code: 'es', name: 'Español', flag: 'ES', dir: 'ltr' },
            { code: 'ru', name: 'Русский', flag: 'RU', dir: 'ltr' },
            { code: 'ar', name: 'العربية', flag: 'SA', dir: 'rtl' }
        ];
        
        this.init();
    }
    
    async init() {
        await this.loadTranslations(this.currentLang);
        this.applyRTL();
        this.bindEvents();
    }
    
    // 加载翻译文件
    async loadTranslations(lang) {
        try {
            const response = await fetch(`/locales/${lang}.json`);
            if (response.ok) {
                this.translations[lang] = await response.json();
            } else {
                // 使用默认翻译
                this.translations[lang] = this.getDefaultTranslations(lang);
            }
        } catch (error) {
            console.warn(`Failed to load translations for ${lang}`, error);
            this.translations[lang] = this.getDefaultTranslations(lang);
        }
    }
    
    // 获取默认翻译
    getDefaultTranslations(lang) {
        const defaults = {
            'zh-CN': {
                'nav.home': '首页',
                'nav.articles': '文章',
                'nav.groups': '群组',
                'nav.events': '活动',
                'nav.messages': '消息',
                'nav.profile': '个人中心',
                'nav.settings': '设置',
                'btn.submit': '提交',
                'btn.cancel': '取消',
                'btn.save': '保存',
                'btn.delete': '删除',
                'btn.edit': '编辑',
                'btn.login': '登录',
                'btn.register': '注册',
                'btn.logout': '退出登录',
                'common.loading': '加载中...',
                'common.success': '操作成功',
                'common.error': '操作失败',
                'common.confirm': '确认',
                'common.cancel': '取消',
                'article.readMore': '阅读全文',
                'article.comments': '评论',
                'article.likes': '点赞',
                'article.share': '分享',
                'article.author': '作者',
                'article.publishTime': '发布时间',
                'search.placeholder': '搜索文章、作者...',
                'user.follow': '关注',
                'user.following': '已关注',
                'user.followers': '粉丝',
                'user.articles': '文章',
                'notification.newMessage': '您有新消息',
                'notification.newComment': '有人评论了您的文章',
                'notification.newFollower': '有人关注了您'
            },
            'en': {
                'nav.home': 'Home',
                'nav.articles': 'Articles',
                'nav.groups': 'Groups',
                'nav.events': 'Events',
                'nav.messages': 'Messages',
                'nav.profile': 'Profile',
                'nav.settings': 'Settings',
                'btn.submit': 'Submit',
                'btn.cancel': 'Cancel',
                'btn.save': 'Save',
                'btn.delete': 'Delete',
                'btn.edit': 'Edit',
                'btn.login': 'Login',
                'btn.register': 'Register',
                'btn.logout': 'Logout',
                'common.loading': 'Loading...',
                'common.success': 'Success',
                'common.error': 'Error',
                'common.confirm': 'Confirm',
                'common.cancel': 'Cancel',
                'article.readMore': 'Read More',
                'article.comments': 'Comments',
                'article.likes': 'Likes',
                'article.share': 'Share',
                'article.author': 'Author',
                'article.publishTime': 'Published',
                'search.placeholder': 'Search articles, authors...',
                'user.follow': 'Follow',
                'user.following': 'Following',
                'user.followers': 'Followers',
                'user.articles': 'Articles',
                'notification.newMessage': 'You have a new message',
                'notification.newComment': 'Someone commented on your article',
                'notification.newFollower': 'Someone followed you'
            }
        };
        return defaults[lang] || defaults['en'];
    }
    
    // 翻译文本
    t(key, params = {}) {
        const translation = this.translations[this.currentLang]?.[key] 
            || this.translations[this.fallbackLang]?.[key] 
            || key;
        
        // 替换参数
        return translation.replace(/\{\{(\w+)\}\}/g, (match, param) => {
            return params[param] !== undefined ? params[param] : match;
        });
    }
    
    // 切换语言
    async setLanguage(lang) {
        if (!this.supportedLanguages.find(l => l.code === lang)) {
            console.error(`Unsupported language: ${lang}`);
            return false;
        }
        
        this.currentLang = lang;
        localStorage.setItem('preferred_language', lang);
        
        // 加载新语言的翻译
        if (!this.translations[lang]) {
            await this.loadTranslations(lang);
        }
        
        // 更新页面文本
        this.updatePageText();
        
        // 应用RTL
        this.applyRTL();
        
        // 触发语言切换事件
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
        
        return true;
    }
    
    // 更新页面上的所有翻译
    updatePageText() {
        // 更新带有 data-i18n 属性的元素
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const params = {};
            
            // 解析参数
            if (el.hasAttribute('data-i18n-params')) {
                try {
                    Object.assign(params, JSON.parse(el.getAttribute('data-i18n-params')));
                } catch (e) {}
            }
            
            const translation = this.t(key, params);
            
            // 根据元素类型设置文本
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                if (el.type === 'placeholder') {
                    el.placeholder = translation;
                } else {
                    el.value = translation;
                }
            } else {
                el.textContent = translation;
            }
        });
        
        // 更新带有 data-i18n-placeholder 属性的输入框
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.t(key);
        });
        
        // 更新页面标题
        const titleKey = document.querySelector('title')?.getAttribute('data-i18n');
        if (titleKey) {
            document.title = this.t(titleKey);
        }
        
        // 更新 HTML lang 属性
        document.documentElement.lang = this.currentLang;
    }
    
    // 应用RTL布局
    applyRTL() {
        const lang = this.supportedLanguages.find(l => l.code === this.currentLang);
        const isRTL = lang?.dir === 'rtl';
        
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        
        // 添加/移除 RTL 类
        if (isRTL) {
            document.body.classList.add('rtl');
        } else {
            document.body.classList.remove('rtl');
        }
    }
    
    // 自动翻译内容
    async autoTranslate(text, targetLang = this.currentLang) {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/translate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    text,
                    target_language: targetLang
                })
            });
            
            const data = await response.json();
            return data.success ? data.data.translated_text : text;
        } catch (error) {
            console.error('Auto translate error:', error);
            return text;
        }
    }
    
    // 翻译文章内容
    async translateArticle(articleId, targetLang) {
        try {
            const response = await fetch(`${API_BASE_URL}/articles/${articleId}/translate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ target_language: targetLang })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Translate article error:', error);
            return { success: false, error: '翻译失败' };
        }
    }
    
    // 创建语言选择器
    createLanguageSelector(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const selector = document.createElement('div');
        selector.className = 'language-selector';
        selector.innerHTML = `
            <button class="lang-current">
                <span class="lang-flag">${this.getCurrentLang().flag}</span>
                <span class="lang-name">${this.getCurrentLang().name}</span>
                <span class="lang-arrow">▼</span>
            </button>
            <div class="lang-dropdown">
                ${this.supportedLanguages.map(lang => `
                    <div class="lang-option ${lang.code === this.currentLang ? 'active' : ''}" 
                         data-lang="${lang.code}">
                        <span class="lang-flag">${lang.flag}</span>
                        <span class="lang-name">${lang.name}</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        // 绑定事件
        const currentBtn = selector.querySelector('.lang-current');
        const dropdown = selector.querySelector('.lang-dropdown');
        
        currentBtn.addEventListener('click', () => {
            dropdown.classList.toggle('show');
        });
        
        selector.querySelectorAll('.lang-option').forEach(option => {
            option.addEventListener('click', async () => {
                const lang = option.getAttribute('data-lang');
                await this.setLanguage(lang);
                dropdown.classList.remove('show');
                this.updateLanguageSelector(selector);
            });
        });
        
        // 点击外部关闭
        document.addEventListener('click', (e) => {
            if (!selector.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
        
        container.appendChild(selector);
        this.addLanguageSelectorStyles();
    }
    
    // 更新语言选择器显示
    updateLanguageSelector(selector) {
        const current = this.getCurrentLang();
        const flag = selector.querySelector('.lang-flag');
        const name = selector.querySelector('.lang-name');
        
        if (flag) flag.textContent = current.flag;
        if (name) name.textContent = current.name;
        
        selector.querySelectorAll('.lang-option').forEach(option => {
            option.classList.toggle('active', option.getAttribute('data-lang') === this.currentLang);
        });
    }
    
    // 获取当前语言信息
    getCurrentLang() {
        return this.supportedLanguages.find(l => l.code === this.currentLang) || this.supportedLanguages[0];
    }
    
    // 添加样式
    addLanguageSelectorStyles() {
        if (document.getElementById('i18n-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'i18n-styles';
        style.textContent = `
            .language-selector {
                position: relative;
                display: inline-block;
            }
            
            .lang-current {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
            }
            
            .lang-current:hover {
                border-color: #667eea;
            }
            
            .lang-flag {
                font-size: 16px;
            }
            
            .lang-arrow {
                font-size: 10px;
                margin-left: 4px;
            }
            
            .lang-dropdown {
                position: absolute;
                top: 100%;
                right: 0;
                margin-top: 4px;
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                min-width: 150px;
                display: none;
                z-index: 1000;
            }
            
            .lang-dropdown.show {
                display: block;
            }
            
            .lang-option {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 12px;
                cursor: pointer;
                transition: background 0.2s;
            }
            
            .lang-option:hover {
                background: #f5f5f5;
            }
            
            .lang-option.active {
                background: #f0f7ff;
                color: #667eea;
            }
            
            .lang-option:first-child {
                border-radius: 8px 8px 0 0;
            }
            
            .lang-option:last-child {
                border-radius: 0 0 8px 8px;
            }
            
            /* RTL 支持 */
            .rtl {
                direction: rtl;
            }
            
            .rtl .language-selector {
                text-align: right;
            }
            
            .rtl .lang-dropdown {
                right: auto;
                left: 0;
            }
        `;
        document.head.appendChild(style);
    }
    
    // 绑定事件
    bindEvents() {
        // 监听 DOM 变化，自动翻译新增元素
        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.hasAttribute?.('data-i18n') || 
                            node.querySelector?.('[data-i18n]')) {
                            shouldUpdate = true;
                        }
                    }
                });
            });
            
            if (shouldUpdate) {
                this.updatePageText();
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
}

// 创建全局实例
window.i18n = new I18nSystem();

// 简写函数
window.t = (key, params) => window.i18n.t(key, params);
