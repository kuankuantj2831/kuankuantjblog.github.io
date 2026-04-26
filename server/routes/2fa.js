/**
 * 双因素认证 (2FA) 路由
 * Two-Factor Authentication Routes
 */
const express = require('express');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { pool } = require('../db');
const router = express.Router();

// 认证中间件
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid token' });
    }
};

// 生成备用恢复码
function generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
        codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
}

// 记录安全审计日志
async function logSecurityEvent(userId, action, category, details, status = 'success', riskLevel = 'low', req) {
    try {
        const ip = req?.ip || req?.headers['x-forwarded-for'] || 'unknown';
        const userAgent = req?.headers['user-agent'] || 'unknown';
        
        await pool.execute(
            `INSERT INTO security_audit_logs 
            (user_id, action, category, ip_address, user_agent, details, status, risk_level) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, action, category, ip, userAgent, JSON.stringify(details), status, riskLevel]
        );
    } catch (err) {
        console.error('Failed to log security event:', err);
    }
}

// ==================== TOTP 2FA 设置 ====================

// 1. 生成 TOTP 密钥和二维码
router.post('/totp/setup', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 获取用户信息
        const [users] = await pool.execute('SELECT username, email FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = users[0];
        
        // 生成 TOTP 密钥
        const secret = speakeasy.generateSecret({
            name: `HakimiBlog:${user.email}`,
            length: 32
        });
        
        // 生成二维码
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
        
        // 临时保存密钥（未验证前不正式启用）
        await pool.execute(
            `INSERT INTO user_2fa (user_id, secret, type, enabled, verified) 
             VALUES (?, ?, 'totp', FALSE, FALSE)
             ON DUPLICATE KEY UPDATE secret = ?, type = 'totp', enabled = FALSE, verified = FALSE`,
            [userId, secret.base32, secret.base32]
        );
        
        await logSecurityEvent(userId, '2FA_SETUP_INITIATED', 'security', { type: 'totp' }, 'success', 'medium', req);
        
        res.json({
            success: true,
            data: {
                secret: secret.base32,
                qrCode: qrCodeUrl,
                manualEntryKey: secret.base32
            }
        });
    } catch (error) {
        console.error('2FA setup error:', error);
        res.status(500).json({ message: 'Failed to setup 2FA' });
    }
});

// 2. 验证并启用 TOTP 2FA
router.post('/totp/verify', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ message: 'Verification code required' });
        }
        
        // 获取用户的 TOTP 密钥
        const [rows] = await pool.execute('SELECT secret FROM user_2fa WHERE user_id = ?', [userId]);
        if (rows.length === 0 || !rows[0].secret) {
            return res.status(400).json({ message: '2FA not setup' });
        }
        
        // 验证 TOTP 码
        const verified = speakeasy.totp.verify({
            secret: rows[0].secret,
            encoding: 'base32',
            token: token,
            window: 2 // 允许前后1个时间窗口的误差
        });
        
        if (!verified) {
            await logSecurityEvent(userId, '2FA_SETUP_VERIFY_FAILED', 'security', { type: 'totp' }, 'failure', 'medium', req);
            return res.status(400).json({ message: 'Invalid verification code' });
        }
        
        // 生成备用恢复码
        const backupCodes = generateBackupCodes();
        const hashedBackupCodes = backupCodes.map(code => crypto.createHash('sha256').update(code).digest('hex'));
        
        // 启用 2FA
        await pool.execute(
            `UPDATE user_2fa 
             SET enabled = TRUE, verified = TRUE, backup_codes = ? 
             WHERE user_id = ?`,
            [JSON.stringify(hashedBackupCodes), userId]
        );
        
        await logSecurityEvent(userId, '2FA_ENABLED', 'security', { type: 'totp' }, 'success', 'high', req);
        
        res.json({
            success: true,
            message: '2FA enabled successfully',
            data: {
                backupCodes: backupCodes // 仅显示一次，用户必须保存
            }
        });
    } catch (error) {
        console.error('2FA verify error:', error);
        res.status(500).json({ message: 'Failed to verify 2FA' });
    }
});

// 3. 验证 TOTP 码（登录时使用）
router.post('/totp/validate', async (req, res) => {
    try {
        const { userId, token, backupCode } = req.body;
        
        if (!userId) {
            return res.status(400).json({ message: 'User ID required' });
        }
        
        // 获取用户的 2FA 配置
        const [rows] = await pool.execute('SELECT * FROM user_2fa WHERE user_id = ? AND enabled = TRUE', [userId]);
        if (rows.length === 0) {
            return res.status(400).json({ message: '2FA not enabled for this user' });
        }
        
        const user2fa = rows[0];
        let verified = false;
        let isBackupCode = false;
        
        // 验证 TOTP 码
        if (token) {
            verified = speakeasy.totp.verify({
                secret: user2fa.secret,
                encoding: 'base32',
                token: token,
                window: 2
            });
        }
        
        // 验证备用恢复码
        if (!verified && backupCode && user2fa.backup_codes) {
            const backupCodes = JSON.parse(user2fa.backup_codes);
            const hashedInput = crypto.createHash('sha256').update(backupCode.toUpperCase()).digest('hex');
            const codeIndex = backupCodes.indexOf(hashedInput);
            
            if (codeIndex !== -1) {
                verified = true;
                isBackupCode = true;
                
                // 移除已使用的备用码
                backupCodes.splice(codeIndex, 1);
                await pool.execute('UPDATE user_2fa SET backup_codes = ? WHERE user_id = ?', 
                    [JSON.stringify(backupCodes), userId]);
            }
        }
        
        if (!verified) {
            await logSecurityEvent(userId, '2FA_VALIDATION_FAILED', 'security', 
                { type: user2fa.type, isBackup: !!backupCode }, 'failure', 'high', req);
            return res.status(400).json({ message: 'Invalid code' });
        }
        
        await logSecurityEvent(userId, '2FA_VALIDATION_SUCCESS', 'security', 
            { type: user2fa.type, isBackupCode }, 'success', 'medium', req);
        
        res.json({
            success: true,
            message: '2FA validation successful',
            data: { isBackupCode }
        });
    } catch (error) {
        console.error('2FA validation error:', error);
        res.status(500).json({ message: 'Failed to validate 2FA' });
    }
});

// 4. 禁用 2FA
router.post('/totp/disable', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { token, password } = req.body;
        
        // 验证密码
        const [users] = await pool.execute('SELECT password_hash FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const bcrypt = require('bcryptjs');
        const validPassword = await bcrypt.compare(password, users[0].password_hash);
        if (!validPassword) {
            await logSecurityEvent(userId, '2FA_DISABLE_PASSWORD_FAILED', 'security', {}, 'failure', 'high', req);
            return res.status(400).json({ message: 'Invalid password' });
        }
        
        // 如果提供了 TOTP 码，验证它
        if (token) {
            const [rows] = await pool.execute('SELECT secret FROM user_2fa WHERE user_id = ? AND enabled = TRUE', [userId]);
            if (rows.length === 0) {
                return res.status(400).json({ message: '2FA not enabled' });
            }
            
            const verified = speakeasy.totp.verify({
                secret: rows[0].secret,
                encoding: 'base32',
                token: token,
                window: 2
            });
            
            if (!verified) {
                await logSecurityEvent(userId, '2FA_DISABLE_FAILED', 'security', {}, 'failure', 'high', req);
                return res.status(400).json({ message: 'Invalid verification code' });
            }
        }
        
        // 禁用 2FA
        await pool.execute('DELETE FROM user_2fa WHERE user_id = ?', [userId]);
        
        await logSecurityEvent(userId, '2FA_DISABLED', 'security', {}, 'success', 'critical', req);
        
        res.json({
            success: true,
            message: '2FA disabled successfully'
        });
    } catch (error) {
        console.error('2FA disable error:', error);
        res.status(500).json({ message: 'Failed to disable 2FA' });
    }
});

// 5. 获取 2FA 状态
router.get('/status', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [rows] = await pool.execute(
            'SELECT enabled, type, verified FROM user_2fa WHERE user_id = ?', 
            [userId]
        );
        
        if (rows.length === 0) {
            return res.json({
                success: true,
                data: { enabled: false }
            });
        }
        
        res.json({
            success: true,
            data: {
                enabled: rows[0].enabled,
                type: rows[0].type,
                verified: rows[0].verified
            }
        });
    } catch (error) {
        console.error('Get 2FA status error:', error);
        res.status(500).json({ message: 'Failed to get 2FA status' });
    }
});

// 6. 重新生成备用恢复码
router.post('/backup-codes/regenerate', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { token } = req.body;
        
        // 验证 TOTP
        const [rows] = await pool.execute('SELECT secret FROM user_2fa WHERE user_id = ? AND enabled = TRUE', [userId]);
        if (rows.length === 0) {
            return res.status(400).json({ message: '2FA not enabled' });
        }
        
        const verified = speakeasy.totp.verify({
            secret: rows[0].secret,
            encoding: 'base32',
            token: token,
            window: 2
        });
        
        if (!verified) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }
        
        // 生成新的备用码
        const backupCodes = generateBackupCodes();
        const hashedBackupCodes = backupCodes.map(code => crypto.createHash('sha256').update(code).digest('hex'));
        
        await pool.execute(
            'UPDATE user_2fa SET backup_codes = ? WHERE user_id = ?',
            [JSON.stringify(hashedBackupCodes), userId]
        );
        
        await logSecurityEvent(userId, '2FA_BACKUP_CODES_REGENERATED', 'security', {}, 'success', 'medium', req);
        
        res.json({
            success: true,
            data: { backupCodes }
        });
    } catch (error) {
        console.error('Regenerate backup codes error:', error);
        res.status(500).json({ message: 'Failed to regenerate backup codes' });
    }
});

module.exports = router;
