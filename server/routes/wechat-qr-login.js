/**
 * 微信公众号扫码登录（关注即登录）
 * 使用带参数二维码实现
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

// 微信配置
const WECHAT_CONFIG = {
    mp: {
        appId: process.env.WECHAT_MP_APPID || 'wxc7d39a6a6f8d5fa3',
        appSecret: process.env.WECHAT_MP_SECRET || '0c88e4cdc8768ddddfd953bb84de66d3'
    }
};

// 内存存储扫码登录状态（生产环境建议用 Redis）
const qrLoginSessions = new Map();

/**
 * 获取微信 Access Token
 */
async function getAccessToken() {
    try {
        const response = await fetch(
            `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_CONFIG.mp.appId}&secret=${WECHAT_CONFIG.mp.appSecret}`
        );
        const data = await response.json();
        
        if (data.access_token) {
            return data.access_token;
        }
        throw new Error(data.errmsg || '获取access_token失败');
    } catch (error) {
        console.error('Get Access Token Error:', error);
        throw error;
    }
}

/**
 * 生成带参数二维码
 * POST /api/wechat/qr-login/generate
 */
router.post('/generate', async (req, res) => {
    try {
        const { redirectUrl } = req.body;
        
        // 生成唯一场景ID
        const sceneId = generateSceneId();
        
        // 创建登录会话
        const session = {
            sceneId,
            redirectUrl: redirectUrl || '/',
            status: 'pending', // pending, scanned, confirmed, expired
            openid: null,
            userInfo: null,
            createdAt: Date.now(),
            expiresAt: Date.now() + 5 * 60 * 1000 // 5分钟过期
        };
        
        qrLoginSessions.set(sceneId, session);
        
        // 获取 access_token
        const accessToken = await getAccessToken();
        
        // 创建临时二维码
        const qrResponse = await fetch(
            `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${accessToken}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    expire_seconds: 300, // 5分钟有效期
                    action_name: 'QR_SCENE',
                    action_info: {
                        scene: {
                            scene_id: parseInt(sceneId)
                        }
                    }
                })
            }
        );
        
        const qrData = await qrResponse.json();
        
        if (qrData.errcode) {
            throw new Error(qrData.errmsg);
        }
        
        // 返回二维码URL和ticket
        res.json({
            success: true,
            data: {
                sceneId,
                qrUrl: qrData.url, // 二维码内容，用于生成二维码图片
                ticket: qrData.ticket,
                expireSeconds: qrData.expire_seconds,
                // 直接可用的二维码图片URL
                qrImageUrl: `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${encodeURIComponent(qrData.ticket)}`
            }
        });
        
    } catch (error) {
        console.error('Generate QR Error:', error);
        res.status(500).json({
            success: false,
            error: '生成二维码失败: ' + error.message
        });
    }
});

/**
 * 查询扫码登录状态
 * GET /api/wechat/qr-login/status/:sceneId
 */
router.get('/status/:sceneId', async (req, res) => {
    try {
        const { sceneId } = req.params;
        const session = qrLoginSessions.get(sceneId);
        
        if (!session) {
            return res.json({
                success: false,
                error: '会话不存在或已过期'
            });
        }
        
        // 检查是否过期
        if (Date.now() > session.expiresAt) {
            qrLoginSessions.delete(sceneId);
            return res.json({
                success: false,
                error: '二维码已过期'
            });
        }
        
        // 如果已登录，返回token
        if (session.status === 'confirmed' && session.token) {
            // 清理会话
            qrLoginSessions.delete(sceneId);
            
            return res.json({
                success: true,
                data: {
                    status: 'confirmed',
                    token: session.token,
                    user: session.userInfo
                }
            });
        }
        
        res.json({
            success: true,
            data: {
                status: session.status,
                openid: session.openid,
                scanned: !!session.openid
            }
        });
        
    } catch (error) {
        console.error('Check Status Error:', error);
        res.status(500).json({
            success: false,
            error: '查询状态失败'
        });
    }
});

/**
 * 微信公众号事件处理（用户扫码关注）
 * POST /api/wechat/qr-login/webhook
 */
router.post('/webhook', express.raw({ type: 'application/xml' }), async (req, res) => {
    try {
        const xmlData = req.body.toString();
        const message = parseWechatXml(xmlData);
        
        console.log('Received WeChat Event:', message);
        
        const msgType = message.MsgType;
        const event = message.Event;
        const eventKey = message.EventKey; // qrscene_123456
        const openid = message.FromUserName;
        
        // 处理扫码事件
        if (msgType === 'event' && (event === 'SCAN' || event === 'subscribe')) {
            // 提取 sceneId
            let sceneId;
            if (event === 'subscribe') {
                // 关注事件：qrscene_123456
                sceneId = eventKey.replace('qrscene_', '');
            } else {
                // 扫码事件：直接是 scene_id
                sceneId = eventKey;
            }
            
            const session = qrLoginSessions.get(sceneId);
            
            if (session && Date.now() < session.expiresAt) {
                // 获取用户信息
                const userInfo = await getWechatUserInfo(openid);
                
                // 查找或创建用户
                const user = await findOrCreateWechatUser({
                    openid: openid,
                    unionid: userInfo.unionid,
                    nickname: userInfo.nickname,
                    avatar: userInfo.headimgurl,
                    sex: userInfo.sex,
                    country: userInfo.country,
                    province: userInfo.province,
                    city: userInfo.city,
                    source: 'wechat_mp_qr'
                });
                
                // 生成 JWT
                const token = jwt.sign(
                    { id: user.id, username: user.username, role: user.role },
                    process.env.JWT_SECRET || 'your-secret-key',
                    { expiresIn: '7d' }
                );
                
                // 更新会话状态
                session.status = 'confirmed';
                session.openid = openid;
                session.userInfo = user;
                session.token = token;
                
                // 发送回复消息给用户
                const replyXml = generateXmlResponse(message, 
                    `🎉 登录成功！\n\n欢迎 ${userInfo.nickname || user.username} 访问 Hakimi 的猫爬架！\n\n您可以在浏览器中继续操作了。`
                );
                
                res.set('Content-Type', 'application/xml');
                return res.send(replyXml);
            }
        }
        
        // 默认返回success
        res.set('Content-Type', 'application/xml');
        res.send('success');
        
    } catch (error) {
        console.error('Webhook Error:', error);
        res.set('Content-Type', 'application/xml');
        res.send('success');
    }
});

/**
 * 获取微信用户信息
 */
async function getWechatUserInfo(openid) {
    try {
        const accessToken = await getAccessToken();
        const response = await fetch(
            `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${accessToken}&openid=${openid}&lang=zh_CN`
        );
        return await response.json();
    } catch (error) {
        console.error('Get User Info Error:', error);
        return {};
    }
}

/**
 * 查找或创建微信用户
 */
async function findOrCreateWechatUser(wechatData) {
    const { openid, unionid, nickname, avatar, sex, country, province, city, source } = wechatData;
    
    // 先通过openid查找
    let [bindings] = await pool.query(
        `SELECT * FROM user_wechat_bindings WHERE openid = ?`,
        [openid]
    );
    
    if (bindings.length > 0) {
        const binding = bindings[0];
        // 更新信息
        await pool.query(
            `UPDATE user_wechat_bindings SET 
             nickname = ?, avatar_url = ?, sex = ?, country = ?, province = ?, city = ?, updated_at = NOW()
             WHERE id = ?`,
            [nickname, avatar, sex, country, province, city, binding.id]
        );
        
        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [binding.user_id]);
        return users[0];
    }
    
    // 创建新用户
    const username = generateUniqueUsername(nickname);
    
    const [result] = await pool.query(
        `INSERT INTO users (username, nickname, avatar_url, created_at) VALUES (?, ?, ?, NOW())`,
        [username, nickname || username, avatar]
    );
    
    const newUserId = result.insertId;
    
    await pool.query(
        `INSERT INTO user_wechat_bindings 
         (user_id, openid, unionid, source, nickname, avatar_url, sex, country, province, city, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [newUserId, openid, unionid, source, nickname, avatar, sex, country, province, city]
    );
    
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [newUserId]);
    return users[0];
}

/**
 * 生成唯一用户名
 */
function generateUniqueUsername(nickname) {
    const base = nickname ? nickname.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').slice(0, 10) : 'user';
    const random = Math.random().toString(36).slice(2, 8);
    return `${base}_${random}`;
}

/**
 * 生成场景ID
 */
function generateSceneId() {
    return Date.now().toString().slice(-6) + Math.random().toString().slice(2, 5);
}

/**
 * 解析微信XML消息
 */
function parseWechatXml(xml) {
    const result = {};
    const matches = xml.match(/<(\w+)>(?:<!\[CDATA\[(.*?)\]\]>|<\/\w+>|([^<]+)<\/\w+>)/g);
    if (matches) {
        matches.forEach(match => {
            const cdataMatch = match.match(/<(\w+)><!\[CDATA\[(.*?)\]\]><\/\w+>/);
            const plainMatch = match.match(/<(\w+)>([^<]+)<\/\w+>/);
            if (cdataMatch) {
                result[cdataMatch[1]] = cdataMatch[2];
            } else if (plainMatch) {
                result[plainMatch[1]] = plainMatch[2];
            }
        });
    }
    return result;
}

/**
 * 生成XML回复
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
