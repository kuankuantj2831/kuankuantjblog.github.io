/**
 * IP安全管理系统
 * 记录登录IP、IP封禁/解封、异常登录检测
 *
 * ⚠️ 安全警告：此模块完全在客户端运行，可被用户通过 DevTools 绕过。
 *   仅作为辅助防护，真正的 IP 封禁和限流必须在服务端实现。
 */

const IPSecurity = {
    // 存储键名
    STORAGE_KEYS: {
        LOGIN_HISTORY: 'site_login_history',      // 登录历史
        BANNED_IPS: 'site_banned_ips',            // 封禁IP列表
        IP_ATTEMPTS: 'site_ip_attempts',          // IP失败尝试次数
        SECURITY_SETTINGS: 'site_security_settings' // 安全设置
    },
    
    // 默认安全设置
    defaultSettings: {
        maxFailedAttempts: 5,      // 最大失败次数
        banDuration: 24 * 60 * 60 * 1000,  // 封禁时长（毫秒）- 默认24小时
        autoBan: true              // 是否自动封禁
    },

    // ============ 初始化 ============
    init() {
        this.cleanupExpiredBans();
        this.cleanupOldRecords();
    },

    // ============ 登录记录 ============
    
    /**
     * 记录登录尝试
     * @param {string} username - 用户名
     * @param {boolean} success - 是否成功
     * @param {string} source - 来源页面（如 'index', 'admin'）
     */
    async recordLogin(username, success, source = 'index') {
        const record = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            username: username || 'anonymous',
            success: success,
            source: source,
            ip: await this.getIP(),
            location: await this.getLocation(),
            userAgent: navigator.userAgent,
            platform: navigator.platform
        };

        // 保存到历史记录
        const history = this.getLoginHistory();
        history.unshift(record);
        // 最多保留200条
        if (history.length > 200) {
            history.length = 200;
        }
        localStorage.setItem(this.STORAGE_KEYS.LOGIN_HISTORY, JSON.stringify(history));

        // 如果失败，记录尝试次数
        if (!success) {
            this.recordFailedAttempt(record.ip);
        }

        return record;
    },

    /**
     * 获取IP地址
     */
    async getIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (e) {
            return 'unknown';
        }
    },

    /**
     * 获取地理位置
     */
    async getLocation() {
        try {
            const ip = await this.getIP();
            if (ip === 'unknown') return null;
            
            const response = await fetch(`https://ipapi.co/${ip}/json/`);
            const data = await response.json();
            return {
                country: data.country_name,
                countryCode: data.country_code,
                region: data.region,
                city: data.city,
                org: data.org,
                timezone: data.timezone
            };
        } catch (e) {
            return null;
        }
    },

    // ============ 失败尝试记录 ============
    
    /**
     * 记录失败尝试
     */
    recordFailedAttempt(ip) {
        const attempts = this.getFailedAttempts();
        const now = Date.now();
        
        if (!attempts[ip]) {
            attempts[ip] = { count: 0, firstAttempt: now, lastAttempt: now };
        }
        
        attempts[ip].count++;
        attempts[ip].lastAttempt = now;
        
        localStorage.setItem(this.STORAGE_KEYS.IP_ATTEMPTS, JSON.stringify(attempts));
        
        // 检查是否需要自动封禁
        const settings = this.getSettings();
        if (settings.autoBan && attempts[ip].count >= settings.maxFailedAttempts) {
            this.banIP(ip, `连续${settings.maxFailedAttempts}次登录失败`);
        }
    },

    /**
     * 获取失败尝试记录
     */
    getFailedAttempts() {
        const data = localStorage.getItem(this.STORAGE_KEYS.IP_ATTEMPTS);
        return data ? JSON.parse(data) : {};
    },

    /**
     * 清除IP的失败尝试记录
     */
    clearFailedAttempts(ip) {
        const attempts = this.getFailedAttempts();
        delete attempts[ip];
        localStorage.setItem(this.STORAGE_KEYS.IP_ATTEMPTS, JSON.stringify(attempts));
    },

    // ============ IP封禁管理 ============
    
    /**
     * 封禁IP
     * @param {string} ip - IP地址
     * @param {string} reason - 封禁原因
     * @param {number} duration - 封禁时长（毫秒），默认使用设置值
     */
    banIP(ip, reason = '', duration = null) {
        const settings = this.getSettings();
        const banDuration = duration || settings.banDuration;
        
        const banned = this.getBannedIPs();
        banned[ip] = {
            bannedAt: Date.now(),
            expiresAt: Date.now() + banDuration,
            reason: reason,
            bannedBy: 'admin'
        };
        
        localStorage.setItem(this.STORAGE_KEYS.BANNED_IPS, JSON.stringify(banned));
        
        // 同时清除该IP的失败尝试记录
        this.clearFailedAttempts(ip);
        
        return banned[ip];
    },

    /**
     * 解封IP
     */
    unbanIP(ip) {
        const banned = this.getBannedIPs();
        const record = banned[ip];
        delete banned[ip];
        localStorage.setItem(this.STORAGE_KEYS.BANNED_IPS, JSON.stringify(banned));
        return record;
    },

    /**
     * 获取封禁列表
     */
    getBannedIPs() {
        const data = localStorage.getItem(this.STORAGE_KEYS.BANNED_IPS);
        return data ? JSON.parse(data) : {};
    },

    /**
     * 检查IP是否被封禁
     */
    async isBanned(ip = null) {
        const checkIP = ip || await this.getIP();
        const banned = this.getBannedIPs();
        const record = banned[checkIP];
        
        if (!record) return false;
        
        // 检查是否过期
        if (Date.now() > record.expiresAt) {
            this.unbanIP(checkIP);
            return false;
        }
        
        return {
            banned: true,
            reason: record.reason,
            expiresAt: record.expiresAt,
            remainingTime: record.expiresAt - Date.now()
        };
    },

    /**
     * 清理过期封禁
     */
    cleanupExpiredBans() {
        const banned = this.getBannedIPs();
        let changed = false;
        
        for (const ip in banned) {
            if (Date.now() > banned[ip].expiresAt) {
                delete banned[ip];
                changed = true;
            }
        }
        
        if (changed) {
            localStorage.setItem(this.STORAGE_KEYS.BANNED_IPS, JSON.stringify(banned));
        }
    },

    // ============ 登录历史 ============
    
    /**
     * 获取登录历史
     */
    getLoginHistory() {
        const data = localStorage.getItem(this.STORAGE_KEYS.LOGIN_HISTORY);
        return data ? JSON.parse(data) : [];
    },

    /**
     * 按IP筛选登录记录
     */
    getHistoryByIP(ip) {
        const history = this.getLoginHistory();
        return history.filter(record => record.ip === ip);
    },

    /**
     * 删除单条记录
     */
    deleteHistoryRecord(id) {
        const history = this.getLoginHistory();
        const filtered = history.filter(record => record.id !== id);
        localStorage.setItem(this.STORAGE_KEYS.LOGIN_HISTORY, JSON.stringify(filtered));
        return filtered.length < history.length;
    },

    /**
     * 清空历史
     */
    clearHistory() {
        localStorage.removeItem(this.STORAGE_KEYS.LOGIN_HISTORY);
    },

    /**
     * 清理旧记录（保留最近30天）
     */
    cleanupOldRecords() {
        const history = this.getLoginHistory();
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        const filtered = history.filter(record => {
            return new Date(record.timestamp).getTime() > thirtyDaysAgo;
        });
        
        if (filtered.length < history.length) {
            localStorage.setItem(this.STORAGE_KEYS.LOGIN_HISTORY, JSON.stringify(filtered));
        }
    },

    // ============ 安全设置 ============
    
    /**
     * 获取设置
     */
    getSettings() {
        const data = localStorage.getItem(this.STORAGE_KEYS.SECURITY_SETTINGS);
        return data ? { ...this.defaultSettings, ...JSON.parse(data) } : this.defaultSettings;
    },

    /**
     * 保存设置
     */
    saveSettings(settings) {
        const current = this.getSettings();
        const updated = { ...current, ...settings };
        localStorage.setItem(this.STORAGE_KEYS.SECURITY_SETTINGS, JSON.stringify(updated));
        return updated;
    },

    // ============ 统计信息 ============
    
    /**
     * 获取统计信息
     */
    getStats() {
        const history = this.getLoginHistory();
        const banned = this.getBannedIPs();
        const attempts = this.getFailedAttempts();
        
        // 今日登录次数
        const today = new Date().toDateString();
        const todayLogins = history.filter(r => 
            new Date(r.timestamp).toDateString() === today
        ).length;
        
        // 失败次数
        const failedLogins = history.filter(r => !r.success).length;
        
        // 独立IP数
        const uniqueIPs = [...new Set(history.map(r => r.ip))];
        
        return {
            totalLogins: history.length,
            todayLogins: todayLogins,
            failedLogins: failedLogins,
            successRate: history.length > 0 ? 
                ((history.length - failedLogins) / history.length * 100).toFixed(1) : 0,
            uniqueIPs: uniqueIPs.length,
            bannedCount: Object.keys(banned).length,
            suspiciousIPs: Object.keys(attempts).filter(ip => attempts[ip].count >= 3).length
        };
    },

    // ============ 导出数据 ============
    
    /**
     * 导出安全数据
     */
    exportData() {
        const data = {
            exportTime: new Date().toISOString(),
            loginHistory: this.getLoginHistory(),
            bannedIPs: this.getBannedIPs(),
            failedAttempts: this.getFailedAttempts(),
            settings: this.getSettings(),
            stats: this.getStats()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `security-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

// 初始化
IPSecurity.init();

// 导出模块
window.IPSecurity = IPSecurity;
