/**
 * 安全与管理系统 - Security Management System
 * 包含：密保问题、邮箱找回、设备管理、异常通知、关键词过滤
 */

const SecurityManagement = {
    // 存储键
    KEYS: {
        SECURITY_QUESTIONS: 'security_questions',
        VERIFIED_EMAIL: 'verified_email',
        TRUSTED_DEVICES: 'trusted_devices',
        LOGIN_ALERTS: 'login_alerts',
        SECURITY_SETTINGS: 'security_settings',
        BLOCKED_KEYWORDS: 'blocked_keywords',
        LOGIN_HISTORY: 'login_history',
        SECURITY_LOG: 'security_log'
    },

    // 默认安全问题列表
    DEFAULT_QUESTIONS: [
        { id: 'q1', text: '你母亲的姓名是什么？' },
        { id: 'q2', text: '你第一只宠物的名字是什么？' },
        { id: 'q3', text: '你就读的第一所学校叫什么名字？' },
        { id: 'q4', text: '你最喜欢的电影是什么？' },
        { id: 'q5', text: '你父亲的出生年份是？' },
        { id: 'q6', text: '你最喜欢的食物是什么？' },
        { id: 'q7', text: '你出生地是哪里？' },
        { id: 'q8', text: '你最好的朋友叫什么名字？' }
    ],

    // 敏感关键词列表
    SENSITIVE_KEYWORDS: [
        '赌博', '色情', '暴力', '毒品', '枪支', '黑客', '诈骗', '洗钱',
        '反动', '邪教', '恐怖主义', '假币', '窃听', '跟踪', '骚扰'
    ],

    // 初始化
    init() {
        this.initSecuritySettings();
        this.checkLoginSecurity();
        this.startSecurityMonitor();
    },

    // ========== 密保问题 ==========

    // 设置密保问题
    setSecurityQuestions(questions) {
        // 加密存储答案
        const encrypted = questions.map(q => ({
            questionId: q.questionId,
            answerHash: this.hashAnswer(q.answer)
        }));
        
        localStorage.setItem(this.KEYS.SECURITY_QUESTIONS, JSON.stringify(encrypted));
        this.logSecurityEvent('SECURITY_QUESTIONS_SET', '密保问题已设置');
        return true;
    },

    // 验证密保答案
    verifySecurityAnswers(answers) {
        try {
            const stored = JSON.parse(localStorage.getItem(this.KEYS.SECURITY_QUESTIONS) || '[]');
            
            if (stored.length === 0) return { success: false, message: '未设置密保问题' };
            if (!Array.isArray(answers) || answers.length < 2) return { success: false, message: '请至少回答2个问题' };

            let correctCount = 0;
            for (const answer of answers) {
                if (!answer || typeof answer !== 'object') continue;
                const storedQuestion = stored.find(q => q.questionId === answer.questionId);
                if (storedQuestion && answer.answer && this.hashAnswer(answer.answer) === storedQuestion.answerHash) {
                    correctCount++;
                }
            }

            if (correctCount >= 2) {
                this.logSecurityEvent('SECURITY_QUESTIONS_VERIFIED', '密保问题验证通过');
                return { success: true, message: '验证通过' };
            }

            this.logSecurityEvent('SECURITY_QUESTIONS_FAILED', '密保问题验证失败', { correctCount });
            return { success: false, message: '答案不正确，请重试' };
        } catch (e) {
            console.error('验证密保答案失败:', e);
            return { success: false, message: '验证失败，请重试' };
        }
    },

    // 检查是否已设置密保
    hasSecurityQuestions() {
        const questions = JSON.parse(localStorage.getItem(this.KEYS.SECURITY_QUESTIONS) || '[]');
        return questions.length >= 2;
    },

    // 获取已设置的问题ID（不返回答案）
    getSecurityQuestionIds() {
        const stored = JSON.parse(localStorage.getItem(this.KEYS.SECURITY_QUESTIONS) || '[]');
        return stored.map(q => q.questionId);
    },

    // 获取问题文本
    getQuestionText(questionId) {
        const question = this.DEFAULT_QUESTIONS.find(q => q.id === questionId);
        return question ? question.text : '';
    },

    // 哈希答案（简单哈希，实际应使用更安全的算法）
    hashAnswer(answer) {
        // 简化处理：转小写并去除空格后做基础编码
        const normalized = answer.toLowerCase().replace(/\s/g, '');
        let hash = 0;
        for (let i = 0; i < normalized.length; i++) {
            const char = normalized.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    },

    // ========== 邮箱找回 ==========

    // 设置验证邮箱
    setVerifiedEmail(email) {
        const code = this.generateVerificationCode();
        
        // 存储待验证邮箱和验证码
        sessionStorage.setItem('pending_email', email);
        sessionStorage.setItem('email_verify_code', code);
        sessionStorage.setItem('email_verify_time', Date.now().toString());
        
        // 模拟发送邮件（实际应调用邮件API）
        console.log(`[模拟邮件] 验证码 ${code} 已发送到 ${email}`);
        
        return { success: true, message: '验证码已发送', expiresIn: 600 };
    },

    // 验证邮箱验证码
    verifyEmailCode(code) {
        const pendingEmail = sessionStorage.getItem('pending_email');
        const storedCode = sessionStorage.getItem('email_verify_code');
        const verifyTime = parseInt(sessionStorage.getItem('email_verify_time') || '0');
        
        if (!pendingEmail || !storedCode) {
            return { success: false, message: '请先请求验证码' };
        }
        
        if (Date.now() - verifyTime > 600000) { // 10分钟过期
            return { success: false, message: '验证码已过期，请重新获取' };
        }
        
        if (code !== storedCode) {
            return { success: false, message: '验证码不正确' };
        }
        
        // 验证成功，保存邮箱
        const user = this.getCurrentUser();
        if (user) {
            user.verifiedEmail = pendingEmail;
            user.emailVerifiedAt = Date.now();
            localStorage.setItem('current_user', JSON.stringify(user));
        }
        
        localStorage.setItem(this.KEYS.VERIFIED_EMAIL, JSON.stringify({
            email: pendingEmail,
            verifiedAt: Date.now()
        }));
        
        // 清理临时数据
        sessionStorage.removeItem('pending_email');
        sessionStorage.removeItem('email_verify_code');
        sessionStorage.removeItem('email_verify_time');
        
        this.logSecurityEvent('EMAIL_VERIFIED', `邮箱 ${pendingEmail} 已验证`);
        return { success: true, message: '邮箱验证成功' };
    },

    // 生成6位验证码
    generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    },

    // 获取已验证邮箱
    getVerifiedEmail() {
        const data = JSON.parse(localStorage.getItem(this.KEYS.VERIFIED_EMAIL) || 'null');
        return data ? data.email : null;
    },

    // 发送密码重置邮件
    sendPasswordResetEmail(email) {
        const verifiedEmail = this.getVerifiedEmail();
        
        if (email !== verifiedEmail) {
            return { success: false, message: '邮箱未验证或不匹配' };
        }
        
        const resetToken = this.generateResetToken();
        const resetLink = `${window.location.origin}/reset-password.html?token=${resetToken}`;
        
        // 存储重置令牌
        sessionStorage.setItem('password_reset_token', resetToken);
        sessionStorage.setItem('password_reset_expires', (Date.now() + 3600000).toString()); // 1小时过期
        
        console.log(`[模拟邮件] 密码重置链接: ${resetLink}`);
        
        this.logSecurityEvent('PASSWORD_RESET_REQUESTED', '密码重置邮件已发送');
        return { success: true, message: '密码重置链接已发送到您的邮箱' };
    },

    // 生成重置令牌
    generateResetToken() {
        return btoa(Date.now().toString() + Math.random().toString(36)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
    },

    // 验证重置令牌
    verifyResetToken(token) {
        const storedToken = sessionStorage.getItem('password_reset_token');
        const expires = parseInt(sessionStorage.getItem('password_reset_expires') || '0');
        
        if (!storedToken || token !== storedToken) {
            return { success: false, message: '无效的令牌' };
        }
        
        if (Date.now() > expires) {
            return { success: false, message: '令牌已过期' };
        }
        
        return { success: true, message: '验证成功' };
    },

    // ========== 设备管理 ==========

    // 获取当前设备信息
    getCurrentDevice() {
        return {
            id: this.generateDeviceId(),
            name: this.getDeviceName(),
            type: this.getDeviceType(),
            browser: this.getBrowserInfo(),
            os: this.getOSInfo(),
            ip: 'unknown', // 需要后端支持
            firstSeen: Date.now(),
            lastSeen: Date.now()
        };
    },

    // 生成设备ID
    generateDeviceId() {
        const userAgent = navigator.userAgent;
        const screenInfo = `${screen.width}x${screen.height}x${screen.colorDepth}`;
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const data = userAgent + screenInfo + timezone;
        
        // 简化哈希
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'dev_' + Math.abs(hash).toString(16).slice(0, 12);
    },

    // 获取设备名称
    getDeviceName() {
        const ua = navigator.userAgent;
        if (ua.includes('iPhone')) return 'iPhone';
        if (ua.includes('iPad')) return 'iPad';
        if (ua.includes('Android')) {
            const match = ua.match(/Android[^;]*/);
            return match ? match[0] : 'Android设备';
        }
        if (ua.includes('Mac')) return 'Mac';
        if (ua.includes('Windows')) return 'Windows PC';
        if (ua.includes('Linux')) return 'Linux';
        return '未知设备';
    },

    // 获取设备类型
    getDeviceType() {
        const ua = navigator.userAgent;
        if (/Mobile|Android|iPhone|iPad|iPod/.test(ua)) {
            return /iPad|Tablet/.test(ua) ? 'tablet' : 'mobile';
        }
        return 'desktop';
    },

    // 获取浏览器信息
    getBrowserInfo() {
        const ua = navigator.userAgent;
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        if (ua.includes('Opera')) return 'Opera';
        return '未知浏览器';
    },

    // 获取操作系统信息
    getOSInfo() {
        const ua = navigator.userAgent;
        if (ua.includes('Windows')) return 'Windows';
        if (ua.includes('Mac')) return 'macOS';
        if (ua.includes('Linux')) return 'Linux';
        if (ua.includes('Android')) return 'Android';
        if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
        return '未知系统';
    },

    // 获取信任设备列表
    getTrustedDevices() {
        return JSON.parse(localStorage.getItem(this.KEYS.TRUSTED_DEVICES) || '[]');
    },

    // 添加信任设备
    addTrustedDevice(device) {
        const devices = this.getTrustedDevices();
        const existingIndex = devices.findIndex(d => d.id === device.id);
        
        if (existingIndex >= 0) {
            devices[existingIndex].lastSeen = Date.now();
        } else {
            device.isTrusted = true;
            device.trustedAt = Date.now();
            devices.push(device);
        }
        
        localStorage.setItem(this.KEYS.TRUSTED_DEVICES, JSON.stringify(devices));
        return true;
    },

    // 移除信任设备
    removeTrustedDevice(deviceId) {
        let devices = this.getTrustedDevices();
        devices = devices.filter(d => d.id !== deviceId);
        localStorage.setItem(this.KEYS.TRUSTED_DEVICES, JSON.stringify(devices));
        
        this.logSecurityEvent('DEVICE_REMOVED', `设备 ${deviceId} 已从信任列表移除`);
        return true;
    },

    // 检查当前设备是否受信任
    isCurrentDeviceTrusted() {
        const currentDevice = this.getCurrentDevice();
        const devices = this.getTrustedDevices();
        return devices.some(d => d.id === currentDevice.id && d.isTrusted);
    },

    // 信任当前设备
    trustCurrentDevice() {
        const device = this.getCurrentDevice();
        this.addTrustedDevice(device);
        this.logSecurityEvent('DEVICE_TRUSTED', `设备 ${device.name} 已添加信任`);
        
        // 显示提示
        this.showNotification('设备已添加信任', '此设备下次登录时将不需要二次验证');
    },

    // ========== 异常登录通知 ==========

    // 检查登录安全性
    checkLoginSecurity() {
        const currentDevice = this.getCurrentDevice();
        const devices = this.getTrustedDevices();
        const isTrusted = devices.some(d => d.id === currentDevice.id);
        
        if (!isTrusted) {
            // 新设备登录
            this.handleNewDeviceLogin(currentDevice);
        }
        
        // 检查登录地点（简化版）
        this.checkLoginLocation();
        
        // 记录登录历史
        this.recordLogin(currentDevice);
    },

    // 处理新设备登录
    handleNewDeviceLogin(device) {
        const settings = this.getSecuritySettings();
        
        if (settings.newDeviceAlert) {
            // 显示警告
            this.showSecurityAlert({
                title: '新设备登录提醒',
                message: `检测到在新设备上登录：${device.name} (${device.browser})`,
                actions: [
                    { text: '是我本人', action: () => this.trustCurrentDevice(), type: 'primary' },
                    { text: '不是我的设备', action: () => this.handleSuspiciousLogin(), type: 'danger' }
                ]
            });
        }
        
        this.logSecurityEvent('NEW_DEVICE_LOGIN', `新设备登录: ${device.name}`);
    },

    // 检查登录地点
    checkLoginLocation() {
        // 简化的地点检查，实际应使用IP地理定位
        const lastLocation = localStorage.getItem('last_login_location');
        const currentLocation = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        if (lastLocation && lastLocation !== currentLocation) {
            const settings = this.getSecuritySettings();
            if (settings.locationChangeAlert) {
                this.showNotification('异地登录提醒', `检测到您的账号在 ${currentLocation} 登录`);
            }
        }
        
        localStorage.setItem('last_login_location', currentLocation);
    },

    // 处理可疑登录
    handleSuspiciousLogin() {
        // 强制登出
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
        
        this.showNotification('安全警报', '已强制登出，请立即修改密码');
        
        setTimeout(() => {
            window.location.href = '/login.html?reason=suspicious';
        }, 3000);
        
        this.logSecurityEvent('SUSPICIOUS_LOGIN', '标记为可疑登录并强制登出', { action: 'logout' });
    },

    // 记录登录历史
    recordLogin(device) {
        const history = this.getLoginHistory();
        history.unshift({
            device: device,
            timestamp: Date.now(),
            location: Intl.DateTimeFormat().resolvedOptions().timeZone,
            ip: '127.0.0.1' // 示例
        });
        
        // 只保留最近50条
        const trimmed = history.slice(0, 50);
        localStorage.setItem(this.KEYS.LOGIN_HISTORY, JSON.stringify(trimmed));
    },

    // 获取登录历史
    getLoginHistory() {
        return JSON.parse(localStorage.getItem(this.KEYS.LOGIN_HISTORY) || '[]');
    },

    // ========== 安全设置 ==========

    // 获取安全设置
    getSecuritySettings() {
        const defaults = {
            newDeviceAlert: true,
            locationChangeAlert: true,
            passwordChangeAlert: true,
            twoFactorAuth: false,
            loginNotification: true,
            autoLogoutMinutes: 0 // 0 = 永不
        };
        
        return { ...defaults, ...JSON.parse(localStorage.getItem(this.KEYS.SECURITY_SETTINGS) || '{}') };
    },

    // 保存安全设置
    saveSecuritySettings(settings) {
        localStorage.setItem(this.KEYS.SECURITY_SETTINGS, JSON.stringify(settings));
        this.logSecurityEvent('SETTINGS_CHANGED', '安全设置已更新');
        return true;
    },

    // ========== 关键词过滤 ==========

    // 添加屏蔽关键词
    addBlockedKeyword(keyword) {
        const keywords = this.getBlockedKeywords();
        if (!keywords.includes(keyword)) {
            keywords.push(keyword);
            localStorage.setItem(this.KEYS.BLOCKED_KEYWORDS, JSON.stringify(keywords));
        }
        return true;
    },

    // 移除屏蔽关键词
    removeBlockedKeyword(keyword) {
        let keywords = this.getBlockedKeywords();
        keywords = keywords.filter(k => k !== keyword);
        localStorage.setItem(this.KEYS.BLOCKED_KEYWORDS, JSON.stringify(keywords));
        return true;
    },

    // 获取屏蔽关键词列表
    getBlockedKeywords() {
        return JSON.parse(localStorage.getItem(this.KEYS.BLOCKED_KEYWORDS) || '[]');
    },

    // 过滤内容
    filterContent(content) {
        const blocked = this.getBlockedKeywords();
        const allKeywords = [...blocked, ...this.SENSITIVE_KEYWORDS];
        
        let filtered = content;
        let hasSensitive = false;
        
        allKeywords.forEach(keyword => {
            if (content.includes(keyword)) {
                hasSensitive = true;
                const regex = new RegExp(keyword, 'g');
                filtered = filtered.replace(regex, '*'.repeat(keyword.length));
            }
        });
        
        return { filtered, hasSensitive, keywords: allKeywords.filter(k => content.includes(k)) };
    },

    // 检查内容是否包含敏感词
    containsSensitiveContent(content) {
        return this.filterContent(content).hasSensitive;
    },

    // ========== 安全日志 ==========

    // 记录安全事件
    logSecurityEvent(type, description, details = {}) {
        const logs = this.getSecurityLogs();
        logs.unshift({
            type,
            description,
            details,
            timestamp: Date.now(),
            device: this.getCurrentDevice(),
            ip: '127.0.0.1'
        });
        
        // 只保留最近100条
        const trimmed = logs.slice(0, 100);
        localStorage.setItem(this.KEYS.SECURITY_LOG, JSON.stringify(trimmed));
        
        // 触发事件
        window.dispatchEvent(new CustomEvent('securityEvent', { detail: { type, description } }));
    },

    // 获取安全日志
    getSecurityLogs(limit = 50) {
        const logs = JSON.parse(localStorage.getItem(this.KEYS.SECURITY_LOG) || '[]');
        return logs.slice(0, limit);
    },

    // ========== 安全监控 ==========

    // 启动安全监控
    startSecurityMonitor() {
        // 检查自动登出
        const settings = this.getSecuritySettings();
        if (settings.autoLogoutMinutes > 0) {
            this.startAutoLogout(settings.autoLogoutMinutes);
        }
        
        // 监听密码更改
        this.monitorPasswordChanges();
    },

    // 自动登出计时器
    startAutoLogout(minutes) {
        let lastActivity = Date.now();
        
        const resetTimer = () => { lastActivity = Date.now(); };
        
        ['mousedown', 'keydown', 'touchstart', 'scroll'].forEach(event => {
            document.addEventListener(event, resetTimer);
        });
        
        setInterval(() => {
            if (Date.now() - lastActivity > minutes * 60000) {
                this.performAutoLogout();
            }
        }, 60000);
    },

    // 执行自动登出
    performAutoLogout() {
        this.showNotification('自动登出', '由于长时间未操作，已自动登出');
        
        setTimeout(() => {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('current_user');
            window.location.href = '/login.html?reason=timeout';
        }, 3000);
        
        this.logSecurityEvent('AUTO_LOGOUT', '因超时自动登出');
    },

    // 监控密码更改
    monitorPasswordChanges() {
        // 监听密码修改事件
        window.addEventListener('passwordChanged', () => {
            const settings = this.getSecuritySettings();
            if (settings.passwordChangeAlert) {
                this.showSecurityAlert({
                    title: '密码已更改',
                    message: '您的账号密码已被修改。如果这不是您本人操作，请立即联系管理员。',
                    actions: [
                        { text: '我知道了', action: () => {}, type: 'primary' }
                    ]
                });
            }
            this.logSecurityEvent('PASSWORD_CHANGED', '密码已更改');
        });
    },

    // 修改密码
    changePassword(oldPassword, newPassword) {
        // 验证旧密码（简化处理）
        const user = this.getCurrentUser();
        if (!user) return { success: false, message: '未登录' };
        
        // 密码强度检查
        const strength = this.checkPasswordStrength(newPassword);
        if (strength.score < 3) {
            return { success: false, message: '密码强度不足：' + strength.feedback };
        }
        
        // 更新密码（实际应调用API）
        user.passwordChangedAt = Date.now();
        localStorage.setItem('current_user', JSON.stringify(user));
        
        // 触发事件
        window.dispatchEvent(new CustomEvent('passwordChanged'));
        
        return { success: true, message: '密码修改成功' };
    },

    // 检查密码强度
    checkPasswordStrength(password) {
        let score = 0;
        const feedback = [];
        
        if (password.length >= 8) score++;
        else feedback.push('至少8个字符');
        
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        else feedback.push('包含大小写字母');
        
        if (/\d/.test(password)) score++;
        else feedback.push('包含数字');
        
        if (/[^a-zA-Z0-9]/.test(password)) score++;
        else feedback.push('包含特殊符号');
        
        return { score, feedback: feedback.join('、') };
    },

    // ========== UI 组件 ==========

    // 显示安全警告
    showSecurityAlert({ title, message, actions }) {
        // 移除已存在的警告
        const existing = document.querySelector('.security-alert-overlay');
        if (existing) existing.remove();
        
        const overlay = document.createElement('div');
        overlay.className = 'security-alert-overlay';
        overlay.innerHTML = `
            <div class="security-alert">
                <div class="security-alert-icon">⚠️</div>
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="security-alert-actions">
                    ${actions.map(a => `
                        <button class="security-btn ${a.type}" onclick="this.closest('.security-alert-overlay').remove(); (${a.action.toString()})()">
                            ${a.text}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
    },

    // 显示通知
    showNotification(title, message) {
        const notification = document.createElement('div');
        notification.className = 'security-notification';
        notification.innerHTML = `
            <div class="notification-icon">🔔</div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 5000);
    },

    // 创建设置面板
    createSettingsPanel(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const settings = this.getSecuritySettings();
        
        container.innerHTML = `
            <div class="security-settings-panel">
                <h4>安全设置</h4>
                
                <div class="setting-group">
                    <h5>登录保护</h5>
                    <label class="setting-item">
                        <span>新设备登录提醒</span>
                        <input type="checkbox" id="newDeviceAlert" ${settings.newDeviceAlert ? 'checked' : ''}>
                    </label>
                    <label class="setting-item">
                        <span>异地登录提醒</span>
                        <input type="checkbox" id="locationChangeAlert" ${settings.locationChangeAlert ? 'checked' : ''}>
                    </label>
                    <label class="setting-item">
                        <span>登录成功通知</span>
                        <input type="checkbox" id="loginNotification" ${settings.loginNotification ? 'checked' : ''}>
                    </label>
                </div>
                
                <div class="setting-group">
                    <h5>账号安全</h5>
                    <label class="setting-item">
                        <span>密码更改提醒</span>
                        <input type="checkbox" id="passwordChangeAlert" ${settings.passwordChangeAlert ? 'checked' : ''}>
                    </label>
                    <label class="setting-item">
                        <span>自动登出时间（分钟，0为不限制）</span>
                        <input type="number" id="autoLogout" value="${settings.autoLogoutMinutes}" min="0" max="120">
                    </label>
                </div>
                
                <button class="save-settings-btn" onclick="SecurityManagement.saveSettingsFromUI()">保存设置</button>
            </div>
        `;
    },

    // 从UI保存设置
    saveSettingsFromUI() {
        const settings = {
            newDeviceAlert: document.getElementById('newDeviceAlert')?.checked ?? true,
            locationChangeAlert: document.getElementById('locationChangeAlert')?.checked ?? true,
            loginNotification: document.getElementById('loginNotification')?.checked ?? true,
            passwordChangeAlert: document.getElementById('passwordChangeAlert')?.checked ?? true,
            autoLogoutMinutes: parseInt(document.getElementById('autoLogout')?.value || '0')
        };
        
        this.saveSecuritySettings(settings);
        this.showNotification('设置已保存', '您的安全设置已更新');
    },

    // 创建设备管理面板
    createDevicePanel(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const devices = this.getTrustedDevices();
        const currentDevice = this.getCurrentDevice();
        
        container.innerHTML = `
            <div class="device-management-panel">
                <h4>信任设备</h4>
                <div class="device-list">
                    ${devices.map(device => `
                        <div class="device-item ${device.id === currentDevice.id ? 'current' : ''}">
                            <div class="device-icon">${this.getDeviceIcon(device.type)}</div>
                            <div class="device-info">
                                <div class="device-name">${device.name} ${device.id === currentDevice.id ? '(当前设备)' : ''}</div>
                                <div class="device-details">${device.browser} · ${device.os}</div>
                                <div class="device-time">最后登录: ${this.formatTime(device.lastSeen)}</div>
                            </div>
                            <button class="device-remove-btn" onclick="SecurityManagement.removeTrustedDevice('${device.id}'); SecurityManagement.createDevicePanel('${containerId}')">
                                移除
                            </button>
                        </div>
                    `).join('')}
                    ${devices.length === 0 ? '<div class="device-empty">暂无信任设备</div>' : ''}
                </div>
            </div>
        `;
    },

    // 获取设备图标
    getDeviceIcon(type) {
        const icons = { desktop: '💻', mobile: '📱', tablet: '📱' };
        return icons[type] || '💻';
    },

    // 创建密保问题设置
    createSecurityQuestionsPanel(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (this.hasSecurityQuestions()) {
            container.innerHTML = `
                <div class="security-questions-panel">
                    <h4>密保问题</h4>
                    <p class="security-status success">✅ 已设置密保问题</p>
                    <button class="security-btn" onclick="SecurityManagement.showResetQuestions()">修改密保问题</button>
                </div>
            `;
        } else {
            this.showSecurityQuestionsForm(container);
        }
    },

    // 显示密保问题表单
    showSecurityQuestionsForm(container) {
        const questions = this.DEFAULT_QUESTIONS;
        
        container.innerHTML = `
            <div class="security-questions-panel">
                <h4>设置密保问题</h4>
                <p class="security-hint">请选择3个密保问题并设置答案，用于找回密码</p>
                <form id="securityQuestionsForm">
                    ${[0, 1, 2].map(i => `
                        <div class="question-group">
                            <select name="question${i}" required>
                                <option value="">选择问题 ${i + 1}</option>
                                ${questions.map(q => `<option value="${q.id}">${q.text}</option>`).join('')}
                            </select>
                            <input type="text" name="answer${i}" placeholder="请输入答案" required>
                        </div>
                    `).join('')}
                    <button type="submit" class="security-btn primary">保存密保问题</button>
                </form>
            </div>
        `;
        
        document.getElementById('securityQuestionsForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = [0, 1, 2].map(i => ({
                questionId: formData.get(`question${i}`),
                answer: formData.get(`answer${i}`)
            }));
            
            // 检查是否有重复问题
            const questionIds = data.map(d => d.questionId);
            if (new Set(questionIds).size !== questionIds.length) {
                alert('不能选择相同的问题');
                return;
            }
            
            this.setSecurityQuestions(data);
            this.showNotification('设置成功', '密保问题已设置');
            this.createSecurityQuestionsPanel(container.id);
        });
    },

    // 显示重置密保问题
    showResetQuestions() {
        // 验证身份后才能重置
        const container = document.getElementById('securityQuestionsContainer');
        if (container) {
            this.showSecurityQuestionsForm(container);
        }
    },

    // 获取当前用户
    getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem('current_user') || 'null');
        } catch {
            return null;
        }
    },

    // 格式化时间
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('zh-CN');
    }
};

// 添加CSS样式
const securityStyles = `
<style>
/* 安全警告弹窗 */
.security-alert-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
}

.security-alert {
    background: white;
    padding: 30px;
    border-radius: 16px;
    max-width: 400px;
    text-align: center;
    animation: alertSlideIn 0.3s ease;
}

.security-alert-icon {
    font-size: 48px;
    margin-bottom: 15px;
}

.security-alert h3 {
    margin-bottom: 10px;
    color: #333;
}

.security-alert p {
    color: #666;
    margin-bottom: 20px;
    line-height: 1.5;
}

.security-alert-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
}

.security-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s;
}

.security-btn.primary {
    background: #2196f3;
    color: white;
}

.security-btn.danger {
    background: #e74c3c;
    color: white;
}

.security-btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
}

/* 通知 */
.security-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 12px;
    padding: 15px 20px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 10001;
    animation: notificationSlideIn 0.3s ease;
    max-width: 350px;
}

.notification-icon {
    font-size: 24px;
}

.notification-content {
    flex: 1;
}

.notification-title {
    font-weight: bold;
    color: #333;
    margin-bottom: 3px;
}

.notification-message {
    font-size: 13px;
    color: #666;
}

.notification-close {
    background: none;
    border: none;
    font-size: 20px;
    color: #999;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
}

/* 设置面板 */
.security-settings-panel {
    padding: 20px;
}

.security-settings-panel h4 {
    margin-bottom: 20px;
    color: #333;
}

.setting-group {
    margin-bottom: 25px;
    padding-bottom: 20px;
    border-bottom: 1px solid #eee;
}

.setting-group h5 {
    margin-bottom: 15px;
    color: #555;
    font-size: 14px;
}

.setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    cursor: pointer;
}

.setting-item span {
    color: #333;
}

.setting-item input[type="checkbox"] {
    width: 44px;
    height: 24px;
    appearance: none;
    background: #ccc;
    border-radius: 24px;
    position: relative;
    cursor: pointer;
    transition: 0.3s;
}

.setting-item input[type="checkbox"]:checked {
    background: #2196f3;
}

.setting-item input[type="checkbox"]::before {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    top: 2px;
    left: 2px;
    transition: 0.3s;
}

.setting-item input[type="checkbox"]:checked::before {
    left: 22px;
}

.setting-item input[type="number"] {
    width: 80px;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 6px;
    text-align: center;
}

.save-settings-btn {
    width: 100%;
    padding: 12px;
    background: #2196f3;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
}

/* 设备管理 */
.device-management-panel {
    padding: 20px;
}

.device-management-panel h4 {
    margin-bottom: 20px;
    color: #333;
}

.device-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.device-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 12px;
    border: 2px solid transparent;
}

.device-item.current {
    border-color: #2196f3;
    background: #e3f2fd;
}

.device-icon {
    font-size: 32px;
}

.device-info {
    flex: 1;
}

.device-name {
    font-weight: bold;
    color: #333;
}

.device-details {
    font-size: 13px;
    color: #666;
    margin-top: 2px;
}

.device-time {
    font-size: 12px;
    color: #999;
    margin-top: 2px;
}

.device-remove-btn {
    padding: 8px 16px;
    background: #e74c3c;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
}

.device-remove-btn:hover {
    background: #c0392b;
}

.device-empty {
    text-align: center;
    padding: 40px;
    color: #999;
}

/* 密保问题 */
.security-questions-panel {
    padding: 20px;
}

.security-questions-panel h4 {
    margin-bottom: 15px;
    color: #333;
}

.security-status {
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 15px;
}

.security-status.success {
    background: #d4edda;
    color: #155724;
}

.security-hint {
    color: #666;
    font-size: 14px;
    margin-bottom: 20px;
}

.question-group {
    margin-bottom: 15px;
}

.question-group select,
.question-group input {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    margin-bottom: 8px;
}

.question-group select:focus,
.question-group input:focus {
    outline: none;
    border-color: #2196f3;
}

/* 动画 */
@keyframes alertSlideIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
}

@keyframes notificationSlideIn {
    from { opacity: 0; transform: translateX(100%); }
    to { opacity: 1; transform: translateX(0); }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', securityStyles);

// 初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SecurityManagement.init());
} else {
    SecurityManagement.init();
}

// 暴露到全局
window.SecurityManagement = SecurityManagement;
