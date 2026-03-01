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
