/**
 * 第三方集成路由
 * 包含社交登录、支付集成、云存储、推送服务等功能
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const crypto = require('crypto');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// JWT认证中间件
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: '未提供访问令牌' });
        }
        
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            return res.status(403).json({ error: '无效的访问令牌' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({ error: '认证失败' });
    }
};

// ==================== 社交登录 ====================

// 微信登录
router.post('/auth/wechat', async (req, res) => {
    try {
        const { code } = req.body;
        
        // 获取微信access_token和openid
        const tokenRes = await axios.get('https://api.weixin.qq.com/sns/oauth2/access_token', {
            params: {
                appid: process.env.WECHAT_APP_ID,
                secret: process.env.WECHAT_APP_SECRET,
                code,
                grant_type: 'authorization_code'
            }
        });
        
        if (tokenRes.data.errcode) {
            return res.status(400).json({ error: '微信授权失败' });
        }
        
        const { access_token, openid, unionid } = tokenRes.data;
        
        // 获取用户信息
        const userRes = await axios.get('https://api.weixin.qq.com/sns/userinfo', {
            params: {
                access_token,
                openid
            }
        });
        
        const wxUser = userRes.data;
        
        // 查找或创建用户
        let { data: existingUser } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('wechat_unionid', unionid || openid)
            .single();
        
        if (!existingUser) {
            // 创建新用户
            const { data: authUser, error: authError } = await supabase.auth.signUp({
                email: `wechat_${openid}@temp.com`,
                password: crypto.randomBytes(32).toString('hex')
            });
            
            if (authError) throw authError;
            
            await supabase
                .from('user_profiles')
                .update({
                    username: wxUser.nickname,
                    avatar_url: wxUser.headimgurl,
                    wechat_openid: openid,
                    wechat_unionid: unionid || openid
                })
                .eq('id', authUser.user.id);
            
            existingUser = authUser.user;
        }
        
        // 生成JWT
        const { data: { session }, error: signError } = await supabase.auth.signInWithPassword({
            email: existingUser.email,
            password: existingUser.encrypted_password
        });
        
        if (signError) throw signError;
        
        res.json({
            success: true,
            data: {
                token: session.access_token,
                user: existingUser
            }
        });
    } catch (error) {
        console.error('WeChat login error:', error);
        res.status(500).json({ error: '微信登录失败' });
    }
});

// GitHub登录
router.post('/auth/github', async (req, res) => {
    try {
        const { code } = req.body;
        
        // 获取GitHub access_token
        const tokenRes = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code
        }, {
            headers: { Accept: 'application/json' }
        });
        
        const accessToken = tokenRes.data.access_token;
        
        // 获取GitHub用户信息
        const userRes = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        const githubUser = userRes.data;
        
        // 查找或创建用户
        let { data: existingUser } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('github_id', githubUser.id)
            .single();
        
        if (!existingUser) {
            const { data: authUser, error: authError } = await supabase.auth.signUp({
                email: githubUser.email || `github_${githubUser.id}@temp.com`,
                password: crypto.randomBytes(32).toString('hex')
            });
            
            if (authError) throw authError;
            
            await supabase
                .from('user_profiles')
                .update({
                    username: githubUser.login,
                    avatar_url: githubUser.avatar_url,
                    github_id: githubUser.id,
                    bio: githubUser.bio
                })
                .eq('id', authUser.user.id);
            
            existingUser = authUser.user;
        }
        
        res.json({
            success: true,
            data: {
                token: accessToken,
                user: existingUser
            }
        });
    } catch (error) {
        console.error('GitHub login error:', error);
        res.status(500).json({ error: 'GitHub登录失败' });
    }
});

// Google登录
router.post('/auth/google', async (req, res) => {
    try {
        const { id_token } = req.body;
        
        // 验证Google ID Token
        const googleRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`);
        const googleUser = googleRes.data;
        
        // 查找或创建用户
        let { data: existingUser } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('google_id', googleUser.sub)
            .single();
        
        if (!existingUser) {
            const { data: authUser, error: authError } = await supabase.auth.signUp({
                email: googleUser.email,
                password: crypto.randomBytes(32).toString('hex')
            });
            
            if (authError) throw authError;
            
            await supabase
                .from('user_profiles')
                .update({
                    username: googleUser.name,
                    avatar_url: googleUser.picture,
                    google_id: googleUser.sub,
                    email_verified: googleUser.email_verified
                })
                .eq('id', authUser.user.id);
            
            existingUser = authUser.user;
        }
        
        res.json({
            success: true,
            data: {
                user: existingUser
            }
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({ error: 'Google登录失败' });
    }
});

// ==================== 支付集成 ====================

// 创建支付宝订单
router.post('/payment/alipay/create', authenticateToken, async (req, res) => {
    try {
        const { order_id, return_url } = req.body;
        const userId = req.user.id;
        
        // 获取订单信息
        const { data: order } = await supabase
            .from('orders')
            .select('*')
            .eq('id', order_id)
            .eq('user_id', userId)
            .single();
        
        if (!order) {
            return res.status(404).json({ error: '订单不存在' });
        }
        
        // 调用支付宝SDK创建订单
        // 这里简化处理，实际应使用alipay-sdk
        const alipayOrder = {
            out_trade_no: order.order_no,
            total_amount: order.total,
            subject: `订单 ${order.order_no}`,
            return_url,
            notify_url: `${process.env.API_BASE_URL}/integrations/payment/alipay/notify`
        };
        
        // TODO: 集成支付宝SDK
        
        res.json({
            success: true,
            data: {
                order_id: order.id,
                payment_url: 'https://mapi.alipay.com/gateway.do?' + new URLSearchParams(alipayOrder).toString()
            }
        });
    } catch (error) {
        res.status(500).json({ error: '创建支付订单失败' });
    }
});

// 支付宝回调通知
router.post('/payment/alipay/notify', async (req, res) => {
    try {
        const { out_trade_no, trade_status, trade_no } = req.body;
        
        // 验证签名（简化处理）
        // TODO: 验证支付宝签名
        
        if (trade_status === 'TRADE_SUCCESS') {
            // 更新订单状态
            await supabase
                .from('orders')
                .update({
                    status: 'paid',
                    payment_method: 'alipay',
                    payment_no: trade_no,
                    paid_at: new Date().toISOString()
                })
                .eq('order_no', out_trade_no);
        }
        
        res.send('success');
    } catch (error) {
        console.error('Alipay notify error:', error);
        res.send('fail');
    }
});

// 创建微信支付订单
router.post('/payment/wechat/create', authenticateToken, async (req, res) => {
    try {
        const { order_id } = req.body;
        const userId = req.user.id;
        
        const { data: order } = await supabase
            .from('orders')
            .select('*')
            .eq('id', order_id)
            .eq('user_id', userId)
            .single();
        
        if (!order) {
            return res.status(404).json({ error: '订单不存在' });
        }
        
        // TODO: 调用微信支付统一下单接口
        // 返回prepay_id和支付参数
        
        res.json({
            success: true,
            data: {
                appId: process.env.WECHAT_PAY_APP_ID,
                timeStamp: Math.floor(Date.now() / 1000).toString(),
                nonceStr: crypto.randomBytes(16).toString('hex'),
                package: `prepay_id=xxx`,
                signType: 'RSA',
                paySign: 'xxx'
            }
        });
    } catch (error) {
        res.status(500).json({ error: '创建微信支付订单失败' });
    }
});

// Stripe支付
router.post('/payment/stripe/create', authenticateToken, async (req, res) => {
    try {
        const { order_id } = req.body;
        const userId = req.user.id;
        
        const { data: order } = await supabase
            .from('orders')
            .select('*')
            .eq('id', order_id)
            .eq('user_id', userId)
            .single();
        
        if (!order) {
            return res.status(404).json({ error: '订单不存在' });
        }
        
        // TODO: 创建Stripe PaymentIntent
        
        res.json({
            success: true,
            data: {
                client_secret: 'pi_xxx_secret_xxx'
            }
        });
    } catch (error) {
        res.status(500).json({ error: '创建Stripe订单失败' });
    }
});

// ==================== 云存储 ====================

// 获取上传凭证（腾讯云COS）
router.get('/storage/tencent/credential', authenticateToken, async (req, res) => {
    try {
        const { filename, filetype } = req.query;
        
        // 生成临时密钥
        // TODO: 使用腾讯云STS服务生成临时凭证
        
        const credential = {
            tmpSecretId: 'xxx',
            tmpSecretKey: 'xxx',
            sessionToken: 'xxx',
            expiredTime: Math.floor(Date.now() / 1000) + 1800
        };
        
        res.json({
            success: true,
            data: {
                credential,
                bucket: process.env.TENCENT_COS_BUCKET,
                region: process.env.TENCENT_COS_REGION,
                path: `uploads/${req.user.id}/${Date.now()}_${filename}`
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取上传凭证失败' });
    }
});

// 阿里云OSS上传凭证
router.get('/storage/aliyun/credential', authenticateToken, async (req, res) => {
    try {
        // TODO: 使用阿里云STS生成临时凭证
        
        res.json({
            success: true,
            data: {
                accessKeyId: 'xxx',
                accessKeySecret: 'xxx',
                securityToken: 'xxx',
                expiration: new Date(Date.now() + 1800 * 1000).toISOString(),
                bucket: process.env.ALIYUN_OSS_BUCKET,
                region: process.env.ALIYUN_OSS_REGION
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取OSS凭证失败' });
    }
});

// 文件上传回调
router.post('/storage/callback', authenticateToken, async (req, res) => {
    try {
        const { filename, url, size, mime_type } = req.body;
        const userId = req.user.id;
        
        const { data, error } = await supabase
            .from('uploaded_files')
            .insert({
                user_id: userId,
                filename,
                url,
                size,
                mime_type,
                uploaded_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({
            success: true,
            data: { file_id: data.id, url }
        });
    } catch (error) {
        res.status(500).json({ error: '记录上传失败' });
    }
});

// ==================== 推送服务 ====================

// 注册推送设备
router.post('/push/register', authenticateToken, async (req, res) => {
    try {
        const { device_token, platform, device_type } = req.body;
        const userId = req.user.id;
        
        await supabase
            .from('push_devices')
            .upsert({
                user_id: userId,
                device_token,
                platform, // jpush, firebase, apns
                device_type, // ios, android, web
                is_active: true,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,device_token'
            });
        
        res.json({
            success: true,
            message: '设备注册成功'
        });
    } catch (error) {
        res.status(500).json({ error: '注册失败' });
    }
});

// 发送推送（管理员）
router.post('/push/send', authenticateToken, async (req, res) => {
    try {
        const { title, content, target_users, extras = {} } = req.body;
        
        // TODO: 调用极光推送或Firebase Cloud Messaging
        
        // 记录推送
        await supabase
            .from('push_notifications')
            .insert({
                title,
                content,
                target_type: target_users === 'all' ? 'all' : 'specific',
                target_users: Array.isArray(target_users) ? target_users : null,
                extras,
                sent_at: new Date().toISOString(),
                sent_by: req.user.id
            });
        
        res.json({
            success: true,
            message: '推送已发送'
        });
    } catch (error) {
        res.status(500).json({ error: '发送失败' });
    }
});

// 获取用户推送设置
router.get('/push/settings', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const { data, error } = await supabase
            .from('push_settings')
            .select('*')
            .eq('user_id', userId)
            .single();
        
        if (error || !data) {
            return res.json({
                success: true,
                data: {
                    new_comment: true,
                    new_follower: true,
                    new_message: true,
                    article_like: true,
                    system_notice: true
                }
            });
        }
        
        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({ error: '获取设置失败' });
    }
});

// 更新推送设置
router.put('/push/settings', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const settings = req.body;
        
        await supabase
            .from('push_settings')
            .upsert({
                user_id: userId,
                ...settings,
                updated_at: new Date().toISOString()
            });
        
        res.json({
            success: true,
            message: '设置已更新'
        });
    } catch (error) {
        res.status(500).json({ error: '更新失败' });
    }
});

module.exports = router;
