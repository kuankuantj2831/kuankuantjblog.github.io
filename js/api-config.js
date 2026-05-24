// API 配置
// 自动检测环境：localhost 使用代理，其他域名直连腾讯云
const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const isProxyMode = isLocalhost;

export const API_BASE_URL = isProxyMode
    ? 'http://localhost:9000'
    : 'https://1321178544-g8m9k3cmc6.ap-beijing.tencentscf.com';

export const API_TOKEN = 'hakimi_blog_2026_sec';

console.log(`[API Config] API地址: ${API_BASE_URL}`);
