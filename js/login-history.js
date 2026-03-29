/**
 * 登录历史记录管理模块
 * 记录每次登录的IP地址、时间和地理位置
 */

const LoginHistory = {
    // 存储键名
    STORAGE_KEY: 'admin_login_history',
    MAX_RECORDS: 100, // 最多保存100条记录
    
    /**
     * 获取当前登录信息
     */
    async getCurrentLoginInfo() {
        const info = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language
        };
        
        try {
            // 获取IP地址和地理位置
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            info.ip = data.ip;
            
            // 尝试获取地理位置信息
            try {
                const geoResponse = await fetch(`https://ipapi.co/${data.ip}/json/`);
                const geoData = await geoResponse.json();
                info.location = {
                    country: geoData.country_name,
                    region: geoData.region,
                    city: geoData.city,
                    org: geoData.org
                };
            } catch (e) {
                info.location = null;
            }
        } catch (e) {
            info.ip = 'unknown';
            info.location = null;
        }
        
        return info;
    },
    
    /**
     * 记录登录
     */
    async recordLogin(username, success = true) {
        const loginInfo = await this.getCurrentLoginInfo();
        loginInfo.username = username;
        loginInfo.success = success;
        loginInfo.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        
        const history = this.getHistory();
        history.unshift(loginInfo);
        
        // 限制记录数量
        if (history.length > this.MAX_RECORDS) {
            history.pop();
        }
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
        
        return loginInfo;
    },
    
    /**
     * 获取登录历史
     */
    getHistory() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },
    
    /**
     * 清空历史
     */
    clearHistory() {
        localStorage.removeItem(this.STORAGE_KEY);
    },
    
    /**
     * 删除单条记录
     */
    deleteRecord(id) {
        const history = this.getHistory();
        const filtered = history.filter(record => record.id !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    },
    
    /**
     * 格式化时间
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    },
    
    /**
     * 格式化位置信息
     */
    formatLocation(location) {
        if (!location) return '未知位置';
        const parts = [];
        if (location.country) parts.push(location.country);
        if (location.region) parts.push(location.region);
        if (location.city) parts.push(location.city);
        return parts.join(' ') || '未知位置';
    },
    
    /**
     * 渲染登录历史表格
     */
    renderHistoryTable(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const history = this.getHistory();
        
        if (history.length === 0) {
            container.innerHTML = '<div style="text-align:center;color:#999;padding:40px;">暂无登录记录</div>';
            return;
        }
        
        let html = `
            <table class="table login-history-table" style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr style="background:#f5f5f5;">
                        <th style="padding:12px;text-align:left;border-bottom:2px solid #ddd;">时间</th>
                        <th style="padding:12px;text-align:left;border-bottom:2px solid #ddd;">用户名</th>
                        <th style="padding:12px;text-align:left;border-bottom:2px solid #ddd;">IP地址</th>
                        <th style="padding:12px;text-align:left;border-bottom:2px solid #ddd;">地理位置</th>
                        <th style="padding:12px;text-align:left;border-bottom:2px solid #ddd;">设备</th>
                        <th style="padding:12px;text-align:left;border-bottom:2px solid #ddd;">状态</th>
                        <th style="padding:12px;text-align:center;border-bottom:2px solid #ddd;">操作</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        history.forEach(record => {
            const statusClass = record.success ? 'success' : 'failed';
            const statusText = record.success ? '✅ 成功' : '❌ 失败';
            const statusColor = record.success ? '#52c41a' : '#ff4d4f';
            
            html += `
                <tr style="border-bottom:1px solid #eee;" data-id="${record.id}">
                    <td style="padding:12px;">${this.formatTime(record.timestamp)}</td>
                    <td style="padding:12px;font-weight:500;">${record.username || 'unknown'}</td>
                    <td style="padding:12px;font-family:monospace;background:#f5f5f5;border-radius:4px;">${record.ip || 'unknown'}</td>
                    <td style="padding:12px;">${this.formatLocation(record.location)}</td>
                    <td style="padding:12px;color:#666;font-size:12px;">${record.platform || 'unknown'}</td>
                    <td style="padding:12px;color:${statusColor};font-weight:500;">${statusText}</td>
                    <td style="padding:12px;text-align:center;">
                        <button onclick="LoginHistory.deleteRecord('${record.id}'); LoginHistory.renderHistoryTable('${containerId}');" 
                                style="background:#ff4d4f;color:white;border:none;padding:4px 12px;border-radius:4px;cursor:pointer;font-size:12px;">
                            删除
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
            <div style="margin-top:20px;text-align:right;">
                <button onclick="if(confirm('确定要清空所有登录记录吗？')) { LoginHistory.clearHistory(); LoginHistory.renderHistoryTable('${containerId}'); }" 
                        style="background:#ff4d4f;color:white;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;">
                    🗑️ 清空所有记录
                </button>
            </div>
        `;
        
        container.innerHTML = html;
    }
};

// 导出模块
window.LoginHistory = LoginHistory;