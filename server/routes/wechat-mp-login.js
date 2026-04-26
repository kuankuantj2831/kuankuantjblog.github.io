/**
 * 微信公众号登录路由（个人订阅号方案）
 * 流程：用户扫码关注 → 回复"登录" → 后端返回登录链接 → 用户点击链接登录
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// 内存存储登录令牌（生产环境应使用 Redis）
const loginTokens = new Map();

// 微信公众号配置
const WECHAT_MP_CONFIG = {
    appId: process.env.WECHAT_MP_APPID || 'wxc7d39a6a6f8d5fa3',
    appSecret: process.env.WECHAT_MP_SECRET || '0c88e4cdc8768ddddfd953bb84de66d3',
    token: process.env.WECHAT_MP_TOKEN || 'your_webhook_token_here'
};

/**
 * 生成登录令牌
 * POST /wechat-mp/login-token
 */
router.post('/login-token', async (req, res) => {
    try {
        const { redirectUrl } = req.body;
        
        // 生成唯一令牌
        const loginToken = crypto.randomBytes(16).toString('hex');
        
        // 存储令牌信息
        loginTokens.set(loginToken, {
            token: loginToken,
            status: 'pending', // pending, scanned, logged_in
            createdAt: Date.now(),
            redirectUrl: redirectUrl || '/',
            userInfo: null,
            openid: null
        });
        
        // 清理过期令牌（5分钟前创建的）
        const now = Date.now();
        for (const [key, value] of loginTokens.entries()) {
            if (now - value.createdAt > 5 * 60 * 1000) {
                loginTokens.delete(key);
            }
        }
        
        res.json({
            success: true,
            data: {
                loginToken: loginToken,
                expiresIn: 300 // 5分钟有效期
            }
        });
        
    } catch (error) {
        console.error('生成登录令牌失败:', error);
        res.status(500).json({
            success: false,
            message: '生成登录令牌失败: ' + error.message
        });
    }
});

/**
 * 检查登录状态
 * GET /wechat-mp/login-status?token=xxx
 */
router.get('/login-status', async (req, res) => {
    try {
        const { token } = req.query;
        
        if (!token) {
            return res.status(400).json({
                success: false,
                message: '缺少登录令牌'
            });
        }
        
        const tokenData = loginTokens.get(token);
        
        if (!tokenData) {
            return res.json({
                success: true,
                data: {
                    loggedIn: false,
                    message: '令牌无效或已过期'
                }
            });
        }
        
        // 检查是否已登录
        if (tokenData.status === 'logged_in' && tokenData.userInfo) {
            // 生成 JWT
            const jwtToken = generateJWT(tokenData.userInfo);
            
            // 清理令牌
            loginTokens.delete(token);
            
            return res.json({
                success: true,
                data: {
                    loggedIn: true,
                    token: jwtToken,
                    user: tokenData.userInfo
                }
            });
        }
        
        // 返回当前状态
        const messages = {
            'pending': '等待扫码关注...',
            'scanned': '已关注，请在公众号回复"登录"',
            'link_sent': '登录链接已发送，请在微信中点击'
        };
        
        res.json({
            success: true,
            data: {
                loggedIn: false,
                status: tokenData.status,
                message: messages[tokenData.status] || '等待登录...'
            }
        });
        
    } catch (error) {
        console.error('检查登录状态失败:', error);
        res.status(500).json({
            success: false,
            message: '检查登录状态失败: ' + error.message
        });
    }
});

/**
 * 微信服务器验证和消息接收
 * GET /wechat-mp/webhook - 用于微信服务器验证
 * POST /wechat-mp/webhook - 用于接收微信消息
 */
router.get('/webhook', (req, res) => {
    const { signature, timestamp, nonce, echostr } = req.query;
    
    // 验证签名
    if (verifyWechatSignature(signature, timestamp, nonce)) {
        res.send(echostr);
    } else {
        res.status(403).send('Forbidden');
    }
});

router.post('/webhook', express.text({ type: 'text/xml' }), async (req, res) => {
    try {
        const xmlData = req.body;
        const message = parseWechatXml(xmlData);
        
        console.log('收到微信消息:', message);
        
        const { FromUserName, ToUserName, MsgType, Content, Event, EventKey } = message;
        
        let responseText = '';
        
        // 处理关注事件
        if (MsgType === 'event' && Event === 'subscribe') {
            responseText = `欢迎关注 Hakimi的猫爬架！🎉

回复"登录"即可快速登录网站。
回复"帮助"查看所有指令。`;
        }
        
        // 处理文本消息
        if (MsgType === 'text') {
            const text = Content.trim();
            
            if (text === '登录' || text === 'login') {
                // 生成登录链接
                const loginUrl = await createLoginUrl(FromUserName);
                
                responseText = `点击以下链接完成登录：

${loginUrl}

链接5分钟内有效，请尽快点击。`;
            } else if (text === '帮助' || text === 'help') {
                responseText = `可用指令：
• 登录 - 获取网站登录链接
• 帮助 - 查看此帮助信息

网站地址：https://mcock.cn`;
            } else {
                responseText = `你好！回复"登录"可快速登录网站，回复"帮助"查看所有指令。`;
            }
        }
        
        // 返回 XML 响应
        res.set('Content-Type', 'text/xml');
        res.send(generateXmlResponse(message, responseText));
        
    } catch (error) {
        console.error('处理微信消息失败:', error);
        res.status(200).send('success');
    }
});

/**
 * 通过登录链接直接登录
 * GET /wechat-mp/auth?token=xxx&openid=xxx
 */
router.get('/auth', async (req, res) => {
    try {
        const { token, openid } = req.query;
        
        if (!token || !openid) {
            return res.status(400).send('缺少必要参数');
        }
        
        // 验证令牌
        const tokenData = loginTokens.get(token);
        
        if (!tokenData) {
            return res.status(400).send('<h1>登录链接已过期</h1><p>请返回网站重新获取登录二维码</p>');
        }
        
        // 更新令牌状态
        tokenData.status = 'logged_in';
        tokenData.openid = openid;
        
        // 获取或创建用户信息
        const userInfo = await findOrCreateUser(openid);
        tokenData.userInfo = userInfo;
        
        // 返回成功页面（自动跳转）
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>登录成功</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        margin: 0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    }
                    .success-card {
                        background: white;
                        padding: 40px;
                        border-radius: 16px;
                        text-align: center;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    }
                    .success-icon {
                        width: 64px;
                        height: 64px;
                        background: #07C160;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 20px;
                    }
                    .success-icon::after {
                        content: '✓';
                        color: white;
                        font-size: 32px;
                    }
                    h1 { margin: 0 0 10px; color: #333; }
                    p { color: #666; margin: 0 0 20px; }
                    .countdown { color: #1890ff; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="success-card">
                    <div class="success-icon"></div>
                    <h1>登录成功！</h1>
                    <p>您已成功登录 Hakimi的猫爬架</p>
                    <p><span class="countdown" id="countdown">3</span> 秒后自动关闭此页面</p>
                </div>
                <script>
                    let count = 3;
                    const countdownEl = document.getElementById('countdown');
                    const timer = setInterval(() => {
                        count--;
                        countdownEl.textContent = count;
                        if (count <= 0) {
                            clearInterval(timer);
                            window.close();
                        }
                    }, 1000);
                </script>
            </body>
            </html>
        `);
        
    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).send('登录失败: ' + error.message);
    }
});

/**
 * 生成登录链接
 */
async function createLoginUrl(openid) {
    // 查找该用户对应的待处理令牌
    let targetToken = null;
    for (const [key, value] of loginTokens.entries()) {
        if (value.status === 'pending') {
            targetToken = key;
            value.status = 'link_sent';
            break;
        }
    }
    
    // 如果没有待处理令牌，创建一个新的
    if (!targetToken) {
        targetToken = crypto.randomBytes(16).toString('hex');
        loginTokens.set(targetToken, {
            token: targetToken,
            status: 'link_sent',
            createdAt: Date.now(),
            redirectUrl: '/',
            userInfo: null,
            openid: null
        });
    }
    
    const baseUrl = process.env.API_BASE_URL || 'https://1321178544-65fvlfs2za.ap-beijing.tencentscf.com';
    return `${baseUrl}/wechat-mp/auth?token=${targetToken}&openid=${openid}`;
}

/**
 * 查找或创建用户
 */
async function findOrCreateUser(openid) {
    // 这里应该查询数据库
    // 简化示例，直接返回模拟用户
    return {
        id: 'wechat_' + openid.substring(0, 16),
        username: '微信用户_' + openid.substring(0, 6),
        nickname: '微信用户',
        avatar: 'https://mcock.cn/images/default-avatar.png',
        openid: openid,
        loginType: 'wechat_mp'
    };
}

/**
 * 生成 JWT
 */
function generateJWT(user) {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    return jwt.sign(
        {
            userId: user.id,
            username: user.username,
            openid: user.openid
        },
        secret,
        { expiresIn: '7d' }
    );
}

/**
 * 验证微信签名
 */
function verifyWechatSignature(signature, timestamp, nonce) {
    const token = WECHAT_MP_CONFIG.token;
    const tmpStr = [token, timestamp, nonce].sort().join('');
    const hash = crypto.createHash('sha1').update(tmpStr).digest('hex');
    return hash === signature;
}

/**
 * 解析微信 XML 消息
 */
function parseWechatXml(xml) {
    const result = {};
    const regex = /<(\w+)><!\[CDATA\[([^\]]*)\]\]><\/\w+>|<(\w+)>([^<]*)<\/\w+>/g;
    let match;
    
    while ((match = regex.exec(xml)) !== null) {
        if (match[1]) {
            result[match[1]] = match[2];
        } else if (match[3]) {
            result[match[3]] = match[4];
        }
    }
    
    return result;
}

/**
 * 生成 XML 响应
 */
function generateXmlResponse(message, content) {
    const timestamp = Math.floor(Date.now() / 1000);
    return `<xml>
<ToUserName><![CDATA[${message.FromUserName}]]></ToUserName>
<FromUserName><![CDATA[${message.ToUserName}]]></FromUserName>
<CreateTime>${timestamp}</CreateTime>
<MsgType><![CDATA[text]]></MsgType>
<Content><![CDATA[${content}]]></Content>
</xml>`;
}

module.exports = router;
