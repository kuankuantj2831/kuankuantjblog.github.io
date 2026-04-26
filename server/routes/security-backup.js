/**
 * 安全与备份路由
 * 包含双因素认证、登录保护、设备管理、安全日志、数据备份、内容加密等功能
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Supabase客户端
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

// 获取客户端IP
const getClientIP = (req) => {
    return req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress;
};

// 获取设备指纹
const getDeviceFingerprint = (req) => {
    const userAgent = req.headers['user-agent'] || '';
    const accept = req.headers['accept'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';
    const acceptEncoding = req.headers['accept-encoding'] || '';
    
    const fingerprint = crypto
        .createHash('sha256')
        .update(`${userAgent}${accept}${acceptLanguage}${acceptEncoding}`)
        .digest('hex')
        .substring(0, 32);
    
    return fingerprint;
};

// ==================== 双因素认证 (2FA) ====================

// 启用2FA - 生成密钥
router.post('/2fa/enable', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { password } = req.body;
        
        // 验证密码
        // 注意：实际应用中需要验证用户密码
        
        // 生成2FA密钥
        const secret = speakeasy.generateSecret({
            name: `HakimiBlog:${req.user.email}`,
            length: 32
        });
        
        // 临时保存密钥（等待验证）
        const { error } = await supabase
            .from('user_2fa')
            .upsert({
                user_id: userId,
                secret: secret.base32,
                status: 'pending',
                created_at: new Date().toISOString()
            });
        
        if (error) throw error;
        
        // 生成二维码
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
        
        res.json({
            success: true,
            data: {
                secret: secret.base32,
                qr_code: qrCodeUrl,
                manual_entry_key: secret.base32
            }
        });
    } catch (error) {
        console.error('Enable 2FA error:', error);
        res.status(500).json({ error: '启用2FA失败' });
    }
});

// 验证并激活2FA
router.post('/2fa/verify', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { code } = req.body;
        
        // 获取待验证的密钥
        const { data: faData, error } = await supabase
            .from('user_2fa')
            .select('secret')
            .eq('user_id', userId)
            .eq('status', 'pending')
            .single();
        
        if (error || !faData) {
            return res.status(400).json({ error: '未找到待验证的2FA设置' });
        }
        
        // 验证TOTP代码
        const verified = speakeasy.totp.verify({
            secret: faData.secret,
            encoding: 'base32',
            token: code,
            window: 2
        });
        
        if (!verified) {
            return res.status(400).json({ error: '验证码不正确' });
        }
        
        // 激活2FA
        await supabase
            .from('user_2fa')
            .update({
                status: 'active',
                activated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
        
        // 生成备用恢复码
        const recoveryCodes = Array.from({ length: 10 }, () => 
            crypto.randomBytes(4).toString('hex').toUpperCase()
        );
        
        // 保存加密后的恢复码
        await supabase
            .from('user_2fa_recovery')
            .insert(
                recoveryCodes.map(code => ({
                    user_id: userId,
                    code_hash: crypto.createHash('sha256').update(code).digest('hex'),
                    used: false
                }))
            );
        
        res.json({
            success: true,
            message: '2FA已启用',
            data: {
                recovery_codes: recoveryCodes // 仅显示一次
            }
        });
    } catch (error) {
        console.error('Verify 2FA error:', error);
        res.status(500).json({ error: '验证失败' });
    }
});

// 禁用2FA
router.post('/2fa/disable', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { code, password } = req.body;
        
        // 获取2FA密钥
        const { data: faData } = await supabase
            .from('user_2fa')
            .select('secret')
            .eq('user_id', userId)
            .eq('status', 'active')
            .single();
        
        if (!faData) {
            return res.status(400).json({ error: '2FA未启用' });
        }
        
        // 验证TOTP代码
        const verified = speakeasy.totp.verify({
            secret: faData.secret,
            encoding: 'base32',
            token: code,
            window: 2
        });
        
        if (!verified) {
            return res.status(400).json({ error: '验证码不正确' });
        }
        
        // 删除2FA设置
        await supabase
            .from('user_2fa')
            .delete()
            .eq('user_id', userId);
        
        // 删除恢复码
        await supabase
            .from('user_2fa_recovery')
            .delete()
            .eq('user_id', userId);
        
        res.json({
            success: true,
            message: '2FA已禁用'
        });
    } catch (error) {
        res.status(500).json({ error: '禁用2FA失败' });
    }
});

// 使用恢复码登录
router.post('/2fa/recover', async (req, res) => {
    try {
        const { email, recovery_code } = req.body;
        
        // 查找用户
        const { data: userData } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('email', email)
            .single();
        
        if (!userData) {
            return res.status(400).json({ error: '用户不存在' });
        }
        
        const codeHash = crypto.createHash('sha256').update(recovery_code.toUpperCase()).digest('hex');
        
        // 验证恢复码
        const { data: recoveryData } = await supabase
            .from('user_2fa_recovery')
            .select('id')
            .eq('user_id', userData.id)
            .eq('code_hash', codeHash)
            .eq('used', false)
            .single();
        
        if (!recoveryData) {
            return res.status(400).json({ error: '无效的恢复码' });
        }
        
        // 标记恢复码为已使用
        await supabase
            .from('user_2fa_recovery')
            .update({ used: true, used_at: new Date().toISOString() })
            .eq('id', recoveryData.id);
        
        res.json({
            success: true,
            message: '恢复成功，请重新登录',
            data: { recovery_used: true }
        });
    } catch (error) {
        res.status(500).json({ error: '恢复失败' });
    }
});

// 检查2FA状态
router.get('/2fa/status', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const { data, error } = await supabase
            .from('user_2fa')
            .select('status, activated_at')
            .eq('user_id', userId)
            .single();
        
        res.json({
            success: true,
            data: {
                enabled: data?.status === 'active',
                activated_at: data?.activated_at
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取状态失败' });
    }
});

// ==================== 设备管理 ====================

// 获取设备列表
router.get('/devices', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const { data, error } = await supabase
            .from('user_devices')
            .select('*')
            .eq('user_id', userId)
            .order('last_active_at', { ascending: false });
        
        if (error) throw error;
        
        // 标记当前设备
        const currentFingerprint = getDeviceFingerprint(req);
        const devices = (data || []).map(d => ({
            ...d,
            is_current: d.fingerprint === currentFingerprint
        }));
        
        res.json({
            success: true,
            data: devices
        });
    } catch (error) {
        res.status(500).json({ error: '获取设备列表失败' });
    }
});

// 注册/更新设备
router.post('/devices/register', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { device_name, device_type } = req.body;
        
        const fingerprint = getDeviceFingerprint(req);
        const ip = getClientIP(req);
        const userAgent = req.headers['user-agent'] || '';
        
        const { error } = await supabase
            .from('user_devices')
            .upsert({
                user_id: userId,
                fingerprint: fingerprint,
                device_name: device_name || '未知设备',
                device_type: device_type || 'unknown',
                user_agent: userAgent,
                last_ip: ip,
                last_active_at: new Date().toISOString(),
                trusted: true
            }, {
                onConflict: 'user_id,fingerprint'
            });
        
        if (error) throw error;
        
        res.json({ success: true, message: '设备已注册' });
    } catch (error) {
        res.status(500).json({ error: '注册设备失败' });
    }
});

// 移除设备
router.delete('/devices/:deviceId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { deviceId } = req.params;
        
        await supabase
            .from('user_devices')
            .delete()
            .eq('id', deviceId)
            .eq('user_id', userId);
        
        res.json({ success: true, message: '设备已移除' });
    } catch (error) {
        res.status(500).json({ error: '移除设备失败' });
    }
});

// 撤销所有其他设备
router.post('/devices/revoke-others', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const currentFingerprint = getDeviceFingerprint(req);
        
        await supabase
            .from('user_devices')
            .delete()
            .eq('user_id', userId)
            .neq('fingerprint', currentFingerprint);
        
        res.json({ success: true, message: '已撤销其他所有设备' });
    } catch (error) {
        res.status(500).json({ error: '操作失败' });
    }
});

// ==================== 安全日志 ====================

// 获取安全日志
router.get('/logs', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20, type } = req.query;
        
        let query = supabase
            .from('security_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);
        
        if (type) {
            query = query.eq('event_type', type);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        res.json({
            success: true,
            data: data || []
        });
    } catch (error) {
        res.status(500).json({ error: '获取安全日志失败' });
    }
});

// 记录安全事件（内部使用）
router.post('/logs/record', async (req, res) => {
    try {
        const { user_id, event_type, event_data, severity = 'info' } = req.body;
        const ip = getClientIP(req);
        const fingerprint = getDeviceFingerprint(req);
        
        await supabase
            .from('security_logs')
            .insert({
                user_id,
                event_type,
                event_data,
                ip_address: ip,
                device_fingerprint: fingerprint,
                severity,
                created_at: new Date().toISOString()
            });
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: '记录日志失败' });
    }
});

// ==================== 数据备份 ====================

// 请求数据备份
router.post('/backup/request', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { data_types = ['profile', 'articles', 'comments', 'collections'] } = req.body;
        
        // 检查最近是否有备份请求
        const { data: recentBackup } = await supabase
            .from('data_backups')
            .select('created_at')
            .eq('user_id', userId)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .single();
        
        if (recentBackup) {
            return res.status(429).json({ error: '24小时内只能请求一次备份' });
        }
        
        // 创建备份记录
        const { data: backup, error } = await supabase
            .from('data_backups')
            .insert({
                user_id: userId,
                data_types: data_types,
                status: 'pending',
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            })
            .select()
            .single();
        
        if (error) throw error;
        
        // TODO: 异步生成备份文件
        
        res.json({
            success: true,
            message: '备份请求已提交，处理完成后将通过邮件通知',
            data: { backup_id: backup.id }
        });
    } catch (error) {
        console.error('Backup request error:', error);
        res.status(500).json({ error: '请求备份失败' });
    }
});

// 获取备份列表
router.get('/backups', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const { data, error } = await supabase
            .from('data_backups')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        res.json({
            success: true,
            data: data || []
        });
    } catch (error) {
        res.status(500).json({ error: '获取备份列表失败' });
    }
});

// 下载备份
router.get('/backups/:backupId/download', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { backupId } = req.params;
        
        const { data: backup, error } = await supabase
            .from('data_backups')
            .select('*')
            .eq('id', backupId)
            .eq('user_id', userId)
            .eq('status', 'completed')
            .single();
        
        if (error || !backup) {
            return res.status(404).json({ error: '备份不存在或未就绪' });
        }
        
        // 检查是否过期
        if (new Date(backup.expires_at) < new Date()) {
            return res.status(410).json({ error: '备份已过期' });
        }
        
        // TODO: 从存储中获取备份文件
        
        res.json({
            success: true,
            data: {
                download_url: backup.file_url,
                expires_at: backup.expires_at
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取下载链接失败' });
    }
});

// 删除备份
router.delete('/backups/:backupId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { backupId } = req.params;
        
        await supabase
            .from('data_backups')
            .delete()
            .eq('id', backupId)
            .eq('user_id', userId);
        
        res.json({ success: true, message: '备份已删除' });
    } catch (error) {
        res.status(500).json({ error: '删除备份失败' });
    }
});

// ==================== 内容加密 ====================

// 加密内容（使用用户密码派生的密钥）
router.post('/encrypt', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { content, content_type = 'note' } = req.body;
        
        if (!content) {
            return res.status(400).json({ error: '内容不能为空' });
        }
        
        // 生成随机加密密钥
        const contentKey = crypto.randomBytes(32);
        const iv = crypto.randomBytes(16);
        
        // 使用AES-256-GCM加密
        const cipher = crypto.createCipheriv('aes-256-gcm', contentKey, iv);
        let encrypted = cipher.update(content, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();
        
        // 组合加密数据
        const encryptedData = {
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
            data: encrypted
        };
        
        // 加密内容密钥（使用用户的加密密钥）
        // 注意：实际应用中应该从用户密码派生密钥
        const { data: userKey } = await supabase
            .from('user_encryption_keys')
            .select('encrypted_master_key')
            .eq('user_id', userId)
            .single();
        
        // 保存加密内容
        const { data: savedContent, error } = await supabase
            .from('encrypted_contents')
            .insert({
                user_id: userId,
                content_type,
                encrypted_data: encryptedData,
                encrypted_key: contentKey.toString('base64'), // 应该使用用户密钥加密
                created_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({
            success: true,
            message: '内容已加密',
            data: { content_id: savedContent.id }
        });
    } catch (error) {
        console.error('Encrypt error:', error);
        res.status(500).json({ error: '加密失败' });
    }
});

// 解密内容
router.post('/decrypt/:contentId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { contentId } = req.params;
        
        const { data: content, error } = await supabase
            .from('encrypted_contents')
            .select('*')
            .eq('id', contentId)
            .eq('user_id', userId)
            .single();
        
        if (error || !content) {
            return res.status(404).json({ error: '内容不存在' });
        }
        
        const encryptedData = content.encrypted_data;
        const key = Buffer.from(content.encrypted_key, 'base64');
        const iv = Buffer.from(encryptedData.iv, 'hex');
        const authTag = Buffer.from(encryptedData.authTag, 'hex');
        
        // 解密
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        res.json({
            success: true,
            data: {
                content: decrypted,
                content_type: content.content_type,
                created_at: content.created_at
            }
        });
    } catch (error) {
        console.error('Decrypt error:', error);
        res.status(500).json({ error: '解密失败' });
    }
});

// 获取加密内容列表
router.get('/encrypted-contents', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const { data, error } = await supabase
            .from('encrypted_contents')
            .select('id, content_type, created_at, updated_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        res.json({
            success: true,
            data: data || []
        });
    } catch (error) {
        res.status(500).json({ error: '获取内容列表失败' });
    }
});

// 删除加密内容
router.delete('/encrypted-contents/:contentId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { contentId } = req.params;
        
        await supabase
            .from('encrypted_contents')
            .delete()
            .eq('id', contentId)
            .eq('user_id', userId);
        
        res.json({ success: true, message: '内容已删除' });
    } catch (error) {
        res.status(500).json({ error: '删除失败' });
    }
});

module.exports = router;
