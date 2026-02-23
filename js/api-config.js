// 环境配置 - 根据当前域名自动切换开发/生产环境
const ENV_CONFIG = {
    // 开发环境：本地访问时使用
    development: 'http://localhost:9000',
    // 生产环境：腾讯云 SCF 云函数地址
    production: 'https://1321178544-65fvlfs2za.ap-beijing.tencentscf.com'
};

// 自动检测当前环境
// localhost / 127.0.0.1 / 空host(file协议) → 开发环境，其他 → 生产环境
const isDev = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);

export const API_BASE_URL = isDev ? ENV_CONFIG.development : ENV_CONFIG.production;

// 输出当前环境信息，方便调试
console.log(`[API Config] 环境: ${isDev ? '开发' : '生产'}, API地址: ${API_BASE_URL}`);
