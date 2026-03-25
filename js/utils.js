/**
 * 公共工具函数模块
 * 避免各 JS 文件重复定义相同函数
 */

// HTML 转义工具函数，防止 XSS
export function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// URL 安全清理函数 — 只允许 http/https/相对路径，防止 javascript: 等注入
export function sanitizeUrl(url) {
    if (!url) return '';
    const s = String(url).trim();
    if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/')) {
        return s;
    }
    return '';
}

/**
 * 渲染用户头衔徽章 HTML（站长/MVP/VIP）
 * @param {string} title - 用户头衔
 * @returns {string} 徽章 HTML 字符串
 */
export function renderTitleBadge(title) {
    if (!title) return '';
    const styles = {
        '站长': 'background:#d32f2f;color:#fff;',
        'MVP':  'background:#fce4ec;color:#c62828;',
        'VIP':  'background:#fff8e1;color:#f57f17;'
    };
    const style = styles[title];
    if (!style) return '';
    return `<span style="display:inline-block;padding:1px 5px;border-radius:3px;font-size:0.75em;font-weight:700;${style}margin-right:3px;">${escapeHtml(title)}</span>`;
}

/**
 * 渲染用户等级徽章 HTML
 * @param {number} level - 用户等级
 * @returns {string} 等级徽章 HTML 字符串
 */
export function renderLevelBadge(level) {
    const lv = level || 1;
    const lvClass = 'level-' + Math.min(lv, 5);
    return `<span class="user-level-badge ${lvClass}">Lv${lv}</span>`;
}

/**
 * 格式化时间为相对时间描述
 * @param {string} dateStr - 日期字符串
 * @returns {string} 格式化后的时间字符串
 */
export function formatTime(dateStr) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
        if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
        if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';

        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${month}-${day} ${hours}:${minutes}`;
    } catch (_) {
        return '';
    }
}

/**
 * 显示Toast提示（替代alert）
 * @param {string} msg - 提示消息
 * @param {string} type - 类型：'info', 'success', 'error' (影响颜色)
 * @param {number} duration - 显示时长（毫秒，默认2000）
 */
export function showToast(msg, type = 'info', duration = 2000) {
    const t = document.createElement('div');
    t.textContent = msg;
    const colors = {
        info: 'rgba(0,0,0,0.75)',
        success: 'rgba(76, 175, 80, 0.9)',
        error: 'rgba(244, 67, 54, 0.9)'
    };
    Object.assign(t.style, {
        position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
        background: colors[type] || colors.info,
        color: '#fff', padding: '10px 24px',
        borderRadius: '8px', fontSize: '14px', zIndex: '9999',
        transition: 'opacity 0.3s', opacity: '1',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        maxWidth: '90vw', wordBreak: 'break-word'
    });
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, duration);
}
