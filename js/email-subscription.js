/**
 * 邮件订阅系统 - Email Subscription System
 * 支持文章订阅、周报、通知管理
 */

class EmailSubscriptionSystem {
    constructor(options = {}) {
        this.apiBaseUrl = options.apiBaseUrl || '/api';
        this.subscriptions = new Map();
        this.templates = this.initTemplates();
        this.init();
    }

    init() {
        this.loadSubscriptions();
        this.setupUnsubscribeHandler();
    }

    /**
     * 初始化邮件模板
     */
    initTemplates() {
        return {
            welcome: {
                subject: '欢迎订阅 Hakimi 的猫爬架',
                body: `
                    <h2>🎉 欢迎订阅！</h2>
                    <p>感谢您订阅我的博客！您将收到以下内容的更新：</p>
                    <ul>
                        <li>最新文章推送</li>
                        <li>精选内容周报</li>
                        <li>特别活动通知</li>
                    </ul>
                    <p>如有任何问题，欢迎随时回复此邮件。</p>
                `
            },
            weekly: {
                subject: '每周精选 - 第{week}期',
                body: `
                    <h2>📰 本周精选</h2>
                    <p>以下是本周最受欢迎的内容：</p>
                    {articles}
                    <hr>
                    <p><small>您收到此邮件是因为订阅了周报。要取消订阅，<a href="{unsubscribeUrl}">点击这里</a>。</small></p>
                `
            },
            newArticle: {
                subject: '新文章：{title}',
                body: `
                    <h2>{title}</h2>
                    <p>{excerpt}</p>
                    <p><a href="{url}" style="padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 6px;">阅读全文</a></p>
                    <hr>
                    <p><small>要取消订阅，<a href="{unsubscribeUrl}">点击这里</a>。</small></p>
                `
            }
        };
    }

    /**
     * 订阅
     */
    async subscribe(email, options = {}) {
        try {
            const data = {
                email,
                type: options.type || 'all', // all, weekly, important
                categories: options.categories || [],
                frequency: options.frequency || 'immediate', // immediate, daily, weekly
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: navigator.language,
                subscribedAt: new Date().toISOString()
            };

            const response = await fetch(`${this.apiBaseUrl}/subscriptions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || '订阅失败');
            }

            const result = await response.json();
            
            // 保存到本地
            localStorage.setItem('email_subscription', JSON.stringify({
                email,
                ...data,
                token: result.token
            }));

            this.subscriptions.set(email, data);
            
            // 发送欢迎邮件
            await this.sendWelcomeEmail(email);

            return { success: true, message: '订阅成功！请检查您的邮箱确认订阅。' };
        } catch (error) {
            console.error('订阅失败:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * 取消订阅
     */
    async unsubscribe(email, token) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/subscriptions/unsubscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token })
            });

            if (!response.ok) throw new Error('取消订阅失败');

            localStorage.removeItem('email_subscription');
            this.subscriptions.delete(email);

            return { success: true, message: '已成功取消订阅' };
        } catch (error) {
            console.error('取消订阅失败:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * 更新订阅设置
     */
    async updateSettings(email, token, settings) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/subscriptions/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token, settings })
            });

            if (!response.ok) throw new Error('更新设置失败');

            // 更新本地缓存
            const saved = localStorage.getItem('email_subscription');
            if (saved) {
                const data = JSON.parse(saved);
                localStorage.setItem('email_subscription', JSON.stringify({
                    ...data,
                    ...settings
                }));
            }

            return { success: true };
        } catch (error) {
            console.error('更新设置失败:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * 发送欢迎邮件
     */
    async sendWelcomeEmail(email) {
        // 实际项目中这里调用后端API
        console.log('发送欢迎邮件到:', email);
    }

    /**
     * 发送确认邮件
     */
    async sendConfirmationEmail(email) {
        // 生成确认链接
        const confirmUrl = `${window.location.origin}/confirm-subscription?email=${encodeURIComponent(email)}`;
        
        const template = {
            subject: '请确认您的订阅',
            body: `
                <h2>👋 再确认一步</h2>
                <p>请点击下方链接确认您的订阅：</p>
                <p><a href="${confirmUrl}" style="padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px;">确认订阅</a></p>
                <p>或者复制此链接到浏览器：${confirmUrl}</p>
                <p><small>如果您没有请求此订阅，请忽略此邮件。</small></p>
            `
        };

        // 调用API发送邮件
        return this.sendEmail(email, template);
    }

    /**
     * 发送邮件
     */
    async sendEmail(email, template) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/email/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: email, ...template })
            });

            return response.ok;
        } catch (error) {
            console.error('发送邮件失败:', error);
            return false;
        }
    }

    /**
     * 加载订阅信息
     */
    loadSubscriptions() {
        const saved = localStorage.getItem('email_subscription');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.subscriptions.set(data.email, data);
            } catch (e) {
                console.error('加载订阅信息失败:', e);
            }
        }
    }

    /**
     * 获取当前订阅
     */
    getCurrentSubscription() {
        const saved = localStorage.getItem('email_subscription');
        return saved ? JSON.parse(saved) : null;
    }

    /**
     * 验证邮箱格式
     */
    validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    /**
     * 设置退订处理器
     */
    setupUnsubscribeHandler() {
        // 从URL参数处理退订
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');
        const email = params.get('email');
        const token = params.get('token');

        if (action === 'unsubscribe' && email && token) {
            this.unsubscribe(email, token).then(result => {
                alert(result.message);
                window.history.replaceState({}, '', window.location.pathname);
            });
        }
    }
}

/**
 * 订阅表单UI
 */
class SubscriptionUI {
    constructor(subscriptionSystem) {
        this.system = subscriptionSystem;
    }

    /**
     * 渲染订阅表单
     */
    renderForm(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const existing = this.system.getCurrentSubscription();

        if (existing) {
            // 已订阅，显示管理界面
            this.renderManageForm(container, existing);
        } else {
            // 未订阅，显示订阅表单
            this.renderSubscribeForm(container);
        }
    }

    /**
     * 渲染订阅表单
     */
    renderSubscribeForm(container) {
        container.innerHTML = `
            <div class="subscription-form">
                <h3>📧 订阅更新</h3>
                <p>订阅获取最新文章推送</p>
                
                <div class="form-group">
                    <input type="email" id="subEmail" placeholder="输入您的邮箱" required>
                </div>
                
                <div class="subscription-options">
                    <label class="option-label">
                        <input type="radio" name="frequency" value="immediate" checked>
                        <span>实时通知</span>
                    </label>
                    <label class="option-label">
                        <input type="radio" name="frequency" value="daily">
                        <span>每日摘要</span>
                    </label>
                    <label class="option-label">
                        <input type="radio" name="frequency" value="weekly">
                        <span>每周精选</span>
                    </label>
                </div>

                <div class="category-select">
                    <p>感兴趣的主题：</p>
                    <label><input type="checkbox" value="tech" checked> 技术</label>
                    <label><input type="checkbox" value="life"> 生活</label>
                    <label><input type="checkbox" value="tutorial"> 教程</label>
                </div>
                
                <button type="button" class="btn-subscribe" onclick="subscriptionUI.handleSubscribe()">
                    立即订阅
                </button>
                
                <p class="privacy-note">我们尊重您的隐私，不会分享您的邮箱</p>
            </div>
        `;

        this.injectStyles();
    }

    /**
     * 渲染管理表单
     */
    renderManageForm(container, subscription) {
        container.innerHTML = `
            <div class="subscription-form">
                <h3>✅ 已订阅</h3>
                <p>${subscription.email}</p>
                
                <div class="subscription-options">
                    <label class="option-label">
                        <input type="radio" name="frequency" value="immediate" 
                            ${subscription.frequency === 'immediate' ? 'checked' : ''}>
                        <span>实时通知</span>
                    </label>
                    <label class="option-label">
                        <input type="radio" name="frequency" value="daily"
                            ${subscription.frequency === 'daily' ? 'checked' : ''}>
                        <span>每日摘要</span>
                    </label>
                    <label class="option-label">
                        <input type="radio" name="frequency" value="weekly"
                            ${subscription.frequency === 'weekly' ? 'checked' : ''}>
                        <span>每周精选</span>
                    </label>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn-save" onclick="subscriptionUI.handleUpdate()">
                        保存设置
                    </button>
                    <button type="button" class="btn-unsubscribe" onclick="subscriptionUI.handleUnsubscribe()">
                        取消订阅
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 处理订阅
     */
    async handleSubscribe() {
        const email = document.getElementById('subEmail').value.trim();
        
        if (!email) {
            this.showMessage('请输入邮箱地址', 'error');
            return;
        }

        if (!this.system.validateEmail(email)) {
            this.showMessage('请输入有效的邮箱地址', 'error');
            return;
        }

        const frequency = document.querySelector('input[name="frequency"]:checked').value;
        const categories = Array.from(document.querySelectorAll('.category-select input:checked'))
            .map(cb => cb.value);

        const result = await this.system.subscribe(email, { frequency, categories });
        
        this.showMessage(result.message, result.success ? 'success' : 'error');

        if (result.success) {
            setTimeout(() => this.renderForm('subscriptionContainer'), 2000);
        }
    }

    /**
     * 处理更新
     */
    async handleUpdate() {
        const subscription = this.system.getCurrentSubscription();
        if (!subscription) return;

        const frequency = document.querySelector('input[name="frequency"]:checked').value;
        
        const result = await this.system.updateSettings(
            subscription.email,
            subscription.token,
            { frequency }
        );

        this.showMessage(result.success ? '设置已更新' : result.message, 
                        result.success ? 'success' : 'error');
    }

    /**
     * 处理退订
     */
    async handleUnsubscribe() {
        if (!confirm('确定要取消订阅吗？')) return;

        const subscription = this.system.getCurrentSubscription();
        if (!subscription) return;

        const result = await this.system.unsubscribe(subscription.email, subscription.token);
        
        this.showMessage(result.message, result.success ? 'success' : 'error');

        if (result.success) {
            setTimeout(() => this.renderForm('subscriptionContainer'), 2000);
        }
    }

    /**
     * 显示消息
     */
    showMessage(message, type) {
        const container = document.querySelector('.subscription-form');
        if (!container) return;

        const existing = container.querySelector('.message');
        if (existing) existing.remove();

        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        container.insertBefore(messageEl, container.firstChild);

        setTimeout(() => messageEl.remove(), 5000);
    }

    /**
     * 注入样式
     */
    injectStyles() {
        if (document.getElementById('subscription-styles')) return;

        const styles = `
            <style id="subscription-styles">
                .subscription-form {
                    background: rgba(255,255,255,0.05);
                    border-radius: 12px;
                    padding: 24px;
                    max-width: 400px;
                }

                .subscription-form h3 {
                    margin: 0 0 8px 0;
                    font-size: 18px;
                    color: #fff;
                }

                .subscription-form p {
                    color: #999;
                    margin: 0 0 16px 0;
                }

                .form-group input {
                    width: 100%;
                    padding: 12px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 8px;
                    color: #fff;
                    font-size: 14px;
                    box-sizing: border-box;
                }

                .form-group input::placeholder {
                    color: #666;
                }

                .subscription-options {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin: 16px 0;
                }

                .option-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #ccc;
                    cursor: pointer;
                }

                .category-select {
                    margin: 16px 0;
                }

                .category-select p {
                    margin: 0 0 8px 0;
                    color: #999;
                    font-size: 14px;
                }

                .category-select label {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    margin-right: 12px;
                    color: #ccc;
                    cursor: pointer;
                }

                .btn-subscribe, .btn-save {
                    width: 100%;
                    padding: 12px;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    border: none;
                    border-radius: 8px;
                    color: #fff;
                    font-size: 16px;
                    cursor: pointer;
                    transition: opacity 0.2s;
                }

                .btn-subscribe:hover, .btn-save:hover {
                    opacity: 0.9;
                }

                .btn-unsubscribe {
                    padding: 8px 16px;
                    background: transparent;
                    border: 1px solid #ff4d4f;
                    border-radius: 6px;
                    color: #ff4d4f;
                    cursor: pointer;
                }

                .form-actions {
                    display: flex;
                    gap: 12px;
                }

                .privacy-note {
                    font-size: 12px;
                    color: #666;
                    text-align: center;
                    margin-top: 12px;
                }

                .message {
                    padding: 12px;
                    border-radius: 6px;
                    margin-bottom: 16px;
                    font-size: 14px;
                }

                .message-success {
                    background: rgba(82, 196, 26, 0.2);
                    color: #52c41a;
                }

                .message-error {
                    background: rgba(255, 77, 79, 0.2);
                    color: #ff4d4f;
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

/**
 * RSS 订阅增强
 */
class RSSEnhancement {
    constructor(options = {}) {
        this.feedUrl = options.feedUrl || '/feed.xml';
        this.apiBaseUrl = options.apiBaseUrl || '/api';
    }

    /**
     * 获取 RSS 内容
     */
    async fetchFeed() {
        try {
            const response = await fetch(this.feedUrl);
            if (!response.ok) throw new Error('获取RSS失败');
            
            const xml = await response.text();
            return this.parseRSS(xml);
        } catch (error) {
            console.error('获取RSS失败:', error);
            return this.getMockFeed();
        }
    }

    /**
     * 解析 RSS
     */
    parseRSS(xml) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'text/xml');
        
        const items = doc.querySelectorAll('item');
        return Array.from(items).map(item => ({
            title: item.querySelector('title')?.textContent || '',
            link: item.querySelector('link')?.textContent || '',
            description: item.querySelector('description')?.textContent || '',
            pubDate: item.querySelector('pubDate')?.textContent || '',
            category: item.querySelector('category')?.textContent || '',
            author: item.querySelector('author')?.textContent || ''
        }));
    }

    /**
     * 渲染 RSS 阅读器
     */
    async renderReader(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '<div class="rss-loading">加载中...</div>';

        const items = await this.fetchFeed();

        container.innerHTML = `
            <div class="rss-reader">
                <div class="rss-header">
                    <h3>📡 RSS 订阅</h3>
                    <a href="${this.feedUrl}" target="_blank" class="rss-link">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.17 7.02 20.5 5.36 20.5s-3-1.33-3-2.68a2.18 2.18 0 0 1 2.18-2.18M1.5 10.5c5.8 0 10.5 4.7 10.5 10.5h-3c0-4.14-3.36-7.5-7.5-7.5v-3M1.5 4.5c9.12 0 16.5 7.38 16.5 16.5h-3c0-7.46-6.04-13.5-13.5-13.5v-3"/>
                        </svg>
                        订阅源
                    </a>
                </div>
                <div class="rss-items">
                    ${items.slice(0, 10).map(item => `
                        <article class="rss-item">
                            <h4><a href="${item.link}" target="_blank">${this.escapeHtml(item.title)}</a></h4>
                            <p>${this.escapeHtml(item.description?.substring(0, 150) || '')}...</p>
                            <div class="rss-meta">
                                <span class="rss-date">${this.formatDate(item.pubDate)}</span>
                                ${item.category ? `<span class="rss-category">${item.category}</span>` : ''}
                            </div>
                        </article>
                    `).join('')}
                </div>
            </div>
        `;
    }

    getMockFeed() {
        return [
            { title: 'Vue 3 性能优化指南', link: '/article/1', description: '详细介绍 Vue 3 的性能优化技巧', pubDate: new Date().toISOString(), category: '技术' },
            { title: 'React Hooks 最佳实践', link: '/article/2', description: '分享 React Hooks 的使用经验', pubDate: new Date(Date.now() - 86400000).toISOString(), category: '技术' }
        ];
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 导出
window.EmailSubscriptionSystem = EmailSubscriptionSystem;
window.SubscriptionUI = SubscriptionUI;
window.RSSEnhancement = RSSEnhancement;

// 初始化
let subscriptionSystem, subscriptionUI, rssEnhancement;

document.addEventListener('DOMContentLoaded', () => {
    subscriptionSystem = new EmailSubscriptionSystem();
    subscriptionUI = new SubscriptionUI(subscriptionSystem);
    rssEnhancement = new RSSEnhancement();
    
    window.subscriptionSystem = subscriptionSystem;
    window.subscriptionUI = subscriptionUI;
    window.rssEnhancement = rssEnhancement;
});
