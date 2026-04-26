/**
 * 微信登录认证路由 - MySQL 版本
 * 支持：
 * - 微信扫码登录（网站应用）
 * - 微信公众号授权登录
 * - 微信小程序登录
 * - 微信用户信息获取
 * - 账号绑定/解绑
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

// 微信配置
const WECHAT_CONFIG = {
    // 网站应用（扫码登录）- 如果未配置则使用公众号配置
    web: {
        appId: process.env.WECHAT_WEB_APPID || process.env.WECHAT_MP_APPID,
        appSecret: process.env.WECHAT_WEB_SECRET || process.env.WECHAT_MP_SECRET,
        redirectUri: process.env.WECHAT_WEB_REDIRECT_URI || 'https://mcock.cn/wechat/callback'
    },
    // 公众号
    mp: {
        appId: process.env.WECHAT_MP_APPID || 'wxc7d39a6a6f8d5fa3',
        appSecret: process.env.WECHAT_MP_SECRET || '0c88e4cdc8768ddddfd953bb84de66d3',
        token: process.env.WECHAT_MP_TOKEN,
        encodingAESKey: process.env.WECHAT_MP_AES_KEY
    },
    // 小程序
    miniapp: {
        appId: process.env.WECHAT_MINIAPP_APPID,
        appSecret: process.env.WECHAT_MINIAPP_SECRET
    }
};

/**
 * 生成微信扫码登录URL
 * GET /api/wechat/login-url
 */
router.get('/login-url', async (req, res) => {
    try {
        const { redirectUrl, state: customState } = req.query;
        
        // 生成随机state防止CSRF攻击
        const state = customState || generateRandomState();
        
        // 存储state到数据库（5分钟有效）
        await cacheState(state, {
            redirectUrl: redirectUrl || '/',
            ip: req.ip,
            timestamp: Date.now()
        });

        // 构建微信扫码登录URL
        const params = new URLSearchParams({
            appid: WECHAT_CONFIG.web.appId,
            redirect_uri: WECHAT_CONFIG.web.redirectUri,
            response_type: 'code',
            scope: 'snsapi_login', // 扫码登录固定scope
            state: state
        });

        const loginUrl = `https://open.weixin.qq.com/connect/qrconnect?${params.toString()}#wechat_redirect`;

        res.json({
            success: true,
            data: {
                loginUrl,
                state,
                expiresIn: 300 // 5分钟有效期
            }
        });
    } catch (error) {
        console.error('Generate Login URL Error:', error);
        res.status(500).json({ error: '生成登录链接失败' });
    }
});

/**
 * 微信公众号授权URL
 * GET /api/wechat/mp-auth-url
 */
router.get('/mp-auth-url', async (req, res) => {
    try {
        const { redirectUrl, scope = 'snsapi_userinfo', state: customState } = req.query;
        
        const state = customState || generateRandomState();
        
        await cacheState(state, {
            redirectUrl: redirectUrl || '/',
            scope,
            ip: req.ip,
            timestamp: Date.now()
        });

        const params = new URLSearchParams({
            appid: WECHAT_CONFIG.mp.appId,
            redirect_uri: WECHAT_CONFIG.web.redirectUri, // 使用相同回调地址
            response_type: 'code',
            scope: scope, // snsapi_base(静默) 或 snsapi_userinfo(需用户同意)
            state: state
        });

        const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?${params.toString()}#wechat_redirect`;

        res.json({
            success: true,
            data: {
                authUrl,
                state,
                scope,
                expiresIn: 300
            }
        });
    } catch (error) {
        res.status(500).json({ error: '生成授权链接失败' });
    }
});

/**
 * 微信登录回调处理
 * GET /api/wechat/callback
 */
router.get('/callback', async (req, res) => {
    try {
        const { code, state } = req.query;
        
        if (!code) {
            return res.redirect('/?error=wechat_auth_denied');
        }

        // 验证state
        const stateData = await verifyState(state);
        if (!stateData) {
            return res.redirect('/?error=invalid_state');
        }

        // 判断是网页扫码还是公众号授权
        const isMpAuth = stateData.scope === 'snsapi_userinfo' || stateData.scope === 'snsapi_base';
        const config = isMpAuth ? WECHAT_CONFIG.mp : WECHAT_CONFIG.web;

        // 1. 获取access_token和openid
        const tokenRes = await fetch(
            `https://api.weixin.qq.com/sns/oauth2/access_token?` +
            `appid=${config.appId}&secret=${config.appSecret}&code=${code}&grant_type=authorization_code`
        );
        const tokenData = await tokenRes.json();

        if (tokenData.errcode) {
            console.error('WeChat Token Error:', tokenData);
            return res.redirect('/?error=wechat_token_failed');
        }

        const { access_token, openid, unionid, refresh_token } = tokenData;

        // 2. 获取用户信息（如果是snsapi_userinfo或扫码登录）
        let userInfo = null;
        if (!isMpAuth || stateData.scope === 'snsapi_userinfo') {
            const userRes = await fetch(
                `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`
            );
            userInfo = await userRes.json();

            if (userInfo.errcode) {
                console.error('WeChat User Info Error:', userInfo);
            }
        }

        // 3. 查找或创建用户
        const user = await findOrCreateWechatUser({
            openid,
            unionid,
            nickname: userInfo?.nickname,
            avatar: userInfo?.headimgurl,
            sex: userInfo?.sex,
            country: userInfo?.country,
            province: userInfo?.province,
            city: userInfo?.city,
            source: isMpAuth ? 'wechat_mp' : 'wechat_web'
        });

        // 4. 生成JWT
        const token = generateJWT(user);

        // 5. 设置cookie
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
            sameSite: 'lax'
        });

        // 清理state
        await clearState(state);

        // 判断是 API 请求还是浏览器直接访问
        const acceptHeader = req.get('Accept') || '';
        const isApiRequest = acceptHeader.includes('application/json') || req.get('X-Requested-With') === 'XMLHttpRequest';

        if (isApiRequest) {
            // API 请求返回 JSON
            res.json({
                success: true,
                data: {
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        nickname: user.nickname || user.username,
                        email: user.email,
                        avatar: user.avatar_url || user.avatar,
                        loginType: 'wechat'
                    }
                }
            });
        } else {
            // 浏览器访问重定向到前端回调页
            const redirectUrl = stateData.redirectUrl || '/wechat-callback.html';
            res.redirect(`${redirectUrl}?login=success&token=${token}`);
        }

    } catch (error) {
        console.error('WeChat Callback Error:', error);
        res.redirect('/?error=wechat_callback_failed');
    }
});

/**
 * 微信小程序登录
 * POST /api/wechat/miniapp/login
 */
router.post('/miniapp/login', async (req, res) => {
    try {
        const { code, userInfo: clientUserInfo, encryptedData, iv } = req.body;

        if (!code) {
            return res.status(400).json({ error: '缺少code参数' });
        }

        // 1. 获取session_key和openid
        const sessionRes = await fetch(
            `https://api.weixin.qq.com/sns/jscode2session?` +
            `appid=${WECHAT_CONFIG.miniapp.appId}&secret=${WECHAT_CONFIG.miniapp.appSecret}&js_code=${code}&grant_type=authorization_code`
        );
        const sessionData = await sessionRes.json();

        if (sessionData.errcode) {
            return res.status(400).json({ error: '微信接口调用失败', details: sessionData });
        }

        const { openid, session_key, unionid } = sessionData;

        // 2. 解密用户信息（如果有encryptedData）
        let decryptedUserInfo = null;
        if (encryptedData && iv) {
            decryptedUserInfo = decryptWechatData(encryptedData, iv, session_key);
        }

        const finalUserInfo = decryptedUserInfo || clientUserInfo || {};

        // 3. 查找或创建用户
        const user = await findOrCreateWechatUser({
            openid,
            unionid,
            nickname: finalUserInfo.nickName,
            avatar: finalUserInfo.avatarUrl,
            sex: finalUserInfo.gender,
            country: finalUserInfo.country,
            province: finalUserInfo.province,
            city: finalUserInfo.city,
            source: 'wechat_miniapp'
        });

        // 4. 生成JWT
        const token = generateJWT(user);

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    nickname: user.nickname,
                    avatar: user.avatar_url
                }
            }
        });

    } catch (error) {
        console.error('Miniapp Login Error:', error);
        res.status(500).json({ error: '小程序登录失败' });
    }
});

/**
 * 获取当前绑定的微信信息
 * GET /api/wechat/info
 */
router.get('/info', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const [bindings] = await pool.query(
            'SELECT * FROM user_wechat_bindings WHERE user_id = ?',
            [userId]
        );

        res.json({
            success: true,
            data: {
                bindings: (bindings || []).map(b => ({
                    id: b.id,
                    source: b.source,
                    nickname: b.nickname,
                    avatar: b.avatar_url,
                    boundAt: b.created_at
                }))
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取信息失败' });
    }
});

/**
 * 绑定微信账号（给已登录用户绑定额外的微信）
 * POST /api/wechat/bind
 */
router.post('/bind', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { code, source = 'wechat_web' } = req.body;

        const config = source === 'wechat_mp' ? WECHAT_CONFIG.mp : WECHAT_CONFIG.web;

        // 获取access_token
        const tokenRes = await fetch(
            `https://api.weixin.qq.com/sns/oauth2/access_token?` +
            `appid=${config.appId}&secret=${config.appSecret}&code=${code}&grant_type=authorization_code`
        );
        const tokenData = await tokenRes.json();

        if (tokenData.errcode) {
            return res.status(400).json({ error: '获取微信信息失败' });
        }

        const { openid, unionid } = tokenData;

        // 检查是否已被其他账号绑定
        const [existing] = await pool.query(
            'SELECT user_id FROM user_wechat_bindings WHERE openid = ? AND user_id != ?',
            [openid, userId]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: '该微信已被其他账号绑定' });
        }

        // 获取用户信息
        const userRes = await fetch(
            `https://api.weixin.qq.com/sns/userinfo?access_token=${tokenData.access_token}&openid=${openid}&lang=zh_CN`
        );
        const userInfo = await userRes.json();

        // 保存绑定关系
        await pool.query(
            `INSERT INTO user_wechat_bindings 
             (user_id, openid, unionid, source, nickname, avatar_url, sex, country, province, city, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()) 
             ON DUPLICATE KEY UPDATE 
             user_id = VALUES(user_id), nickname = VALUES(nickname), avatar_url = VALUES(avatar_url),
             sex = VALUES(sex), country = VALUES(country), province = VALUES(province), city = VALUES(city), updated_at = NOW()`,
            [userId, openid, unionid, source, userInfo.nickname, userInfo.headimgurl, 
             userInfo.sex, userInfo.country, userInfo.province, userInfo.city]
        );

        res.json({
            success: true,
            data: {
                message: '绑定成功',
                nickname: userInfo.nickname
            }
        });

    } catch (error) {
        res.status(500).json({ error: '绑定失败' });
    }
});

/**
 * 解绑微信
 * DELETE /api/wechat/unbind/:bindId
 */
router.delete('/unbind/:bindId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { bindId } = req.params;

        await pool.query(
            'DELETE FROM user_wechat_bindings WHERE id = ? AND user_id = ?',
            [bindId, userId]
        );

        res.json({ success: true, data: { message: '解绑成功' } });
    } catch (error) {
        res.status(500).json({ error: '解绑失败' });
    }
});

/**
 * 刷新微信Token
 * POST /api/wechat/refresh-token
 */
router.post('/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        const refreshRes = await fetch(
            `https://api.weixin.qq.com/sns/oauth2/refresh_token?` +
            `appid=${WECHAT_CONFIG.web.appId}&grant_type=refresh_token&refresh_token=${refreshToken}`
        );
        const data = await refreshRes.json();

        if (data.errcode) {
            return res.status(400).json({ error: '刷新失败', details: data });
        }

        res.json({
            success: true,
            data: {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresIn: data.expires_in
            }
        });
    } catch (error) {
        res.status(500).json({ error: '刷新失败' });
    }
});

/**
 * 微信公众号服务器配置验证（用于接收消息）
 * GET /api/wechat/mp/webhook
 */
router.get('/mp/webhook', (req, res) => {
    const { signature, timestamp, nonce, echostr } = req.query;

    // 验证签名
    const token = WECHAT_CONFIG.mp.token;
    const tmpStr = [token, timestamp, nonce].sort().join('');
    const hash = crypto.createHash('sha1').update(tmpStr).digest('hex');

    if (hash === signature) {
        res.send(echostr); // 验证通过，返回echostr
    } else {
        res.status(403).send('Forbidden');
    }
});

/**
 * 接收微信公众号消息
 * POST /api/wechat/mp/webhook
 */
router.post('/mp/webhook', express.raw({ type: 'application/xml' }), async (req, res) => {
    try {
        const xmlData = req.body;
        
        // 解析XML消息
        const message = parseWechatXml(xmlData);
        
        console.log('Received WeChat Message:', message);

        // 处理不同类型消息
        let response = '';
        switch (message.MsgType) {
            case 'text':
                response = handleTextMessage(message);
                break;
            case 'event':
                response = handleEventMessage(message);
                break;
            default:
                response = 'success';
        }

        res.set('Content-Type', 'application/xml');
        res.send(response);
    } catch (error) {
        console.error('Webhook Error:', error);
        res.send('success'); // 必须返回success，否则微信会重试
    }
});

// ==================== 辅助函数 ====================

function generateRandomState() {
    return crypto.randomBytes(16).toString('hex');
}

async function cacheState(state, data) {
    // 存储到数据库（5分钟过期）
    await pool.query(
        `INSERT INTO oauth_states (state, data, expires_at) 
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))`,
        [state, JSON.stringify(data)]
    );
}

async function verifyState(state) {
    const [rows] = await pool.query(
        `SELECT * FROM oauth_states 
         WHERE state = ? AND expires_at > NOW()`,
        [state]
    );
    
    if (rows.length === 0) return null;
    return JSON.parse(rows[0].data);
}

async function clearState(state) {
    await pool.query('DELETE FROM oauth_states WHERE state = ?', [state]);
}

async function findOrCreateWechatUser(wechatData) {
    const { openid, unionid, nickname, avatar, source } = wechatData;

    // 先通过unionid或openid查找
    let [bindings] = await pool.query(
        `SELECT * FROM user_wechat_bindings 
         WHERE unionid = ? OR openid = ?`,
        [unionid || openid, openid]
    );

    let binding = bindings[0];

    if (binding) {
        // 更新绑定信息
        await pool.query(
            `UPDATE user_wechat_bindings SET 
             openid = ?, unionid = ?, nickname = ?, avatar_url = ?, sex = ?, 
             country = ?, province = ?, city = ?, updated_at = NOW()
             WHERE id = ?`,
            [openid, unionid, wechatData.nickname, wechatData.avatar, wechatData.sex,
             wechatData.country, wechatData.province, wechatData.city, binding.id]
        );

        // 获取用户信息
        const [users] = await pool.query(
            'SELECT * FROM users WHERE id = ?',
            [binding.user_id]
        );
        
        return users[0];
    }

    // 创建新用户
    const username = generateUniqueUsername(nickname);
    
    const [result] = await pool.query(
        `INSERT INTO users (username, nickname, avatar_url, created_at) 
         VALUES (?, ?, ?, NOW())`,
        [username, nickname || username, avatar]
    );

    const newUserId = result.insertId;

    // 创建绑定记录
    await pool.query(
        `INSERT INTO user_wechat_bindings 
         (user_id, openid, unionid, source, nickname, avatar_url, sex, country, province, city, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [newUserId, openid, unionid, source, wechatData.nickname, wechatData.avatar,
         wechatData.sex, wechatData.country, wechatData.province, wechatData.city]
    );

    // 返回新用户
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [newUserId]);
    return users[0];
}

function generateUniqueUsername(nickname) {
    const base = nickname ? nickname.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').slice(0, 10) : 'user';
    const random = Math.random().toString(36).slice(2, 8);
    return `${base}_${random}`;
}

function generateJWT(user) {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

function decryptWechatData(encryptedData, iv, sessionKey) {
    try {
        const sessionKeyBuffer = Buffer.from(sessionKey, 'base64');
        const encryptedBuffer = Buffer.from(encryptedData, 'base64');
        const ivBuffer = Buffer.from(iv, 'base64');

        const decipher = crypto.createDecipheriv('aes-128-cbc', sessionKeyBuffer, ivBuffer);
        decipher.setAutoPadding(true);

        let decoded = decipher.update(encryptedBuffer, 'binary', 'utf8');
        decoded += decipher.final('utf8');

        return JSON.parse(decoded);
    } catch (error) {
        console.error('Decrypt Error:', error);
        return null;
    }
}

function parseWechatXml(xml) {
    // 简化版XML解析
    const result = {};
    const matches = xml.toString().match(/<(\w+)><!\[CDATA\[(.*?)\]\]><\/\w+>/g);
    if (matches) {
        matches.forEach(match => {
            const [, key, value] = match.match(/<(\w+)><!\[CDATA\[(.*?)\]\]><\/\w+>/);
            result[key] = value;
        });
    }
    return result;
}

function handleTextMessage(message) {
    const content = message.Content;
    
    // 自动回复逻辑
    if (content.includes('登录') || content.includes('扫码')) {
        return generateXmlResponse(message, '请点击菜单"网站登录"获取登录二维码');
    }
    
    if (content.includes('文章') || content.includes('博客')) {
        return generateXmlResponse(message, '访问 https://mcock.cn 查看最新文章！');
    }

    return generateXmlResponse(message, '感谢您的留言！我们会尽快回复。访问网站 mcock.cn 体验更多功能~');
}

function handleEventMessage(message) {
    const event = message.Event;
    
    if (event === 'subscribe') {
        return generateXmlResponse(message, '欢迎订阅Hakimi的猫爬架！🐱\n\n在这里您可以：\n📖 阅读最新博客文章\n💬 参与社区讨论\n🎮 体验互动功能\n\n点击菜单开始探索吧！');
    }
    
    if (event === 'CLICK') {
        const eventKey = message.EventKey;
        if (eventKey === 'latest_articles') {
            return generateXmlResponse(message, '最新文章：请访问 mcock.cn 查看');
        }
    }

    return 'success';
}

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

// 认证中间件
function authenticateToken(req, res, next) {
    const token = req.cookies?.auth_token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: '未登录' });
    }

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        req.user = user;
        next();
    } catch (error) {
        res.status(403).json({ error: 'Token无效' });
    }
}

module.exports = router;
