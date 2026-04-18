// API 配置
// 备案期间通过本地代理访问腾讯云API，解决CORS问题
// 代理服务器: node proxy.js (启动后访问 localhost:9000)
const isProxyMode = true; // 设为 false 则直连腾讯云

export const API_BASE_URL = isProxyMode
    ? 'http://localhost:9000'
    : 'https://1321178544-65fvlfs2za.ap-beijing.tencentscf.com';

console.log(`[API Config] API地址: ${API_BASE_URL}`);
