// API 配置
// 自动检测环境：localhost 使用代理，GitHub Pages 直连腾讯云
// 如需强制直连腾讯云，将下方 isProxyMode 改为 false
const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const isProxyMode = false; // 临时改为 false 直连腾讯云（备案期间代理未运行）

export const API_BASE_URL = isProxyMode
    ? 'http://localhost:9000'
    : 'https://1321178544-65fvlfs2za.ap-beijing.tencentscf.com';

console.log(`[API Config] API地址: ${API_BASE_URL}`);
