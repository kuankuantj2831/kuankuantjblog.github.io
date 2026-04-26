const express = require('express');
const https = require('https');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Cloudflare Turnstile 验证函数（密钥从环境变量读取）
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || '';

function verifyTurnstile(token, remoteip) {
    if (!token) {
        if (TURNSTILE_SECRET_KEY) {
            console.warn('Turnstile: no token provided but secret is configured, rejecting');
            return Promise.resolve(false);
        }
        console.warn('Turnstile: no token and no secret key configured, skipping verification');
        return Promise.resolve(null);
    }
    return new Promise((resolve) => {
        const postData = JSON.stringify({
            secret: TURNSTILE_SECRET_KEY,
            response: token,
            remoteip: remoteip || undefined
        });
        const options = {
            hostname: 'challenges.cloudflare.com',
            path: '/turnstile/v0/siteverify',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    console.log('Turnstile verify result:', data.success);
                    resolve(data.success === true);
                } catch (e) {
                    console.error('Turnstile parse error:', e);
                    resolve(false);
                }
            });
        });
        req.on('error', (error) => {
            console.error('Turnstile verification error:', error);
            resolve(false);
        });
        req.write(postData);
        req.end();
    });
}

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, phone, password, turnstileToken } = req.body;
        console.log('Register attempt:', { username, email, phone, hasPassword: !!password });

        // Turnstile 人机验证（降级：无 token 时放行并记录）
        const turnstileValid = await verifyTurnstile(turnstileToken, req.ip);
        if (turnstileValid === false) {
            console.warn('Register failed: Turnstile verification explicitly failed');
            return res.status(403).json({ message: '人机验证失败，请刷新页面重试' });
        }
        if (turnstileValid === null) console.warn('Register: Turnstile skipped (no token), IP:', req.ip);

        if (!username || (!email && !phone) || !password) {
            console.warn('Register failed: Missing fields');
            return res.status(400).json({ message: 'Username, password, and either email or phone are required' });
        }

        // Check if user exists
        console.log('Checking if user exists...');
        const [existing] = await pool.query(
            'SELECT id FROM users WHERE username = ? OR (email IS NOT NULL AND email = ?) OR (phone IS NOT NULL AND phone = ?)',
            [username, email || null, phone || null]
        );
        if (existing.length > 0) {
            console.warn('Register failed: User already exists', existing);
            return res.status(409).json({ message: '用户名、邮箱或手机号已被注册' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO users (username, email, phone, password_hash) VALUES (?, ?, ?, ?)',
            [username, email || null, phone || null, hashedPassword]
        );



        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password, turnstileToken } = req.body;

        // Turnstile 人机验证（降级：无 token 时放行并记录）
        const turnstileValid = await verifyTurnstile(turnstileToken, req.ip);
        if (turnstileValid === false) {
            console.warn('Login failed: Turnstile verification explicitly failed');
            return res.status(403).json({ message: '人机验证失败，请刷新页面重试' });
        }
        if (turnstileValid === null) console.warn('Login: Turnstile skipped (no token), IP:', req.ip);

        // Find user by username, email, or phone
        const [users] = await pool.query(
            'SELECT * FROM users WHERE username = ? OR email = ? OR phone = ?',
            [username, username, username]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: '账号或密码错误' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ message: '账号或密码错误' });
        }

        // Check if 2FA is enabled
        console.log(`Login: User ${user.username} (ID: ${user.id}) 2FA status: ${user.is_2fa_enabled}`);
        if (user.is_2fa_enabled) {
            // 检查用户是否有邮箱（2FA 需要邮箱发送验证码）
            if (!user.email) {
                console.warn(`Login: User ${user.id} has 2FA enabled but no email address`);
                return res.status(400).json({ message: '已开启二步验证但未绑定邮箱，请联系管理员' });
            }

            console.log('Login: 2FA is enabled, sending code...');
            // Generate 6-digit code
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            // Save code to DB with DB-relative expiration
            await pool.query(
                'INSERT INTO verification_codes (user_id, code, expires_at, type) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE), ?)',
                [user.id, code, 'login_2fa']
            );

            // Send email
            const { sendVerificationEmail } = require('../utils/email');
            const emailSent = await sendVerificationEmail(user.email, code);

            const { getJwtSecret } = require('../middleware/auth');
            // 使用短期 JWT 作为 2FA 会话令牌，避免暴露 userId
            const twoFaToken = jwt.sign({ id: user.id, type: '2fa_session' }, getJwtSecret(), { expiresIn: '10m' });

            if (emailSent) {
                return res.json({ require2fa: true, twoFaToken, message: '验证码已发送至您的邮箱' });
            } else {
                return res.status(500).json({ message: '验证邮件发送失败，请稍后重试' });
            }
        }

        const { getJwtSecret } = require('../middleware/auth');
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, getJwtSecret(), { expiresIn: '24h' });

        // Return user info without password
        const { password_hash, ...userInfo } = user;
        res.json({ token, user: userInfo });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify 2FA Code
const verifyAttempts = new Map(); // Map<userId, { count, resetAt }>
const VERIFY_ATTEMPTS_MAX = 1000;
function cleanupVerifyAttempts() {
    if (verifyAttempts.size > VERIFY_ATTEMPTS_MAX) {
        const now = Date.now();
        for (const [key, val] of verifyAttempts) {
            if (val.resetAt < now) verifyAttempts.delete(key);
        }
    }
}
router.post('/login/verify', async (req, res) => {
    try {
        const { twoFaToken, code } = req.body;

        // 解码 2FA 会话令牌获取 userId
        const { getJwtSecret } = require('../middleware/auth');
        let userId;
        try {
            const decoded = jwt.verify(twoFaToken, getJwtSecret());
            if (decoded.type !== '2fa_session') throw new Error('Invalid token type');
            userId = decoded.id;
        } catch (tokenErr) {
            return res.status(401).json({ message: '2FA 会话已过期，请重新登录' });
        }

        console.log(`Verify: Verifying code for User ID ${userId}`);

        // 防暴力破解：每个 userId 最多尝试 5 次
        const attempt = verifyAttempts.get(userId) || { count: 0, resetAt: Date.now() + 10 * 60 * 1000 };
        if (attempt.resetAt < Date.now()) {
            attempt.count = 0;
            attempt.resetAt = Date.now() + 10 * 60 * 1000;
        }
        if (attempt.count >= 5) {
            cleanupVerifyAttempts();
            return res.status(429).json({ message: '验证尝试次数过多，请10分钟后再试' });
        }

        const [records] = await pool.query(
            'SELECT * FROM verification_codes WHERE user_id = ? AND code = ? AND type = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
            [userId, code, 'login_2fa']
        );

        if (records.length === 0) {
            attempt.count++;
            verifyAttempts.set(userId, attempt);
            cleanupVerifyAttempts();
            return res.status(400).json({ message: '验证码无效或已过期' });
        }

        // Code valid, delete used codes and reset attempts
        verifyAttempts.delete(userId);
        await pool.query('DELETE FROM verification_codes WHERE user_id = ? AND type = ?', [userId, 'login_2fa']);

        // Get user info
        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        const user = users[0];

        // Generate Token
        const { getJwtSecret } = require('../middleware/auth');
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, getJwtSecret(), { expiresIn: '24h' });
        const { password_hash, ...userInfo } = user;
        res.json({ token, user: userInfo });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Toggle 2FA (Requires Login)
router.post('/user/2fa', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;

        const { enable } = req.body; // true or false
        console.log(`Toggle 2FA: User ID ${req.user.id} setting 2FA to ${enable}`);

        await pool.query('UPDATE users SET is_2fa_enabled = ? WHERE id = ?', [enable, req.user.id]);

        // Verify update
        const [updatedUser] = await pool.query('SELECT is_2fa_enabled FROM users WHERE id = ?', [req.user.id]);
        console.log(`Toggle 2FA: DB value is now ${updatedUser[0].is_2fa_enabled}`);

        res.json({ message: `Two-factor authentication ${enable ? 'enabled' : 'disabled'}` });
    } catch (error) {
        console.error('Toggle 2FA Error:', error);
        res.status(400).json({ message: 'Invalid token or server error' });
    }
});

// Change Password (requires authentication)
router.put('/password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, password } = req.body;
        const userId = req.userId; // 从 token 获取

        if (!currentPassword || !password) {
            return res.status(400).json({ message: 'currentPassword and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Verify user exists and check old password
        const [users] = await pool.query('SELECT id, password_hash FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const validOld = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!validOld) {
            return res.status(401).json({ message: '当前密码错误' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Send Password Reset Code
router.post('/send-reset-code', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        // Check if user exists
        const [users] = await pool.query('SELECT id, email FROM users WHERE email = ?', [email]);

        // 无论用户是否存在，都返回相同响应，防止用户枚举
        if (users.length === 0) {
            return res.json({ message: 'If the email exists, a reset code has been sent' });
        }
        const user = users[0];

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Save code to DB
        await pool.query(
            'INSERT INTO verification_codes (user_id, code, expires_at, type) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), ?)',
            [user.id, code, 'reset_password']
        );

        // Send email
        const { sendVerificationEmail } = require('../utils/email');
        const emailSent = await sendVerificationEmail(user.email, code, '【Hakimi 的猫爬架】密码重置验证码');

        if (emailSent) {
            res.json({ message: 'If the email exists, a reset code has been sent' });
        } else {
            res.status(500).json({ message: 'Failed to send email' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset Password with Code
router.post('/reset-password', async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;
        if (!email || !code || !newPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Verify code
        const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });
        const user = users[0];

        // Use more lenient time check for debugging if needed, but here standard > NOW()
        const [records] = await pool.query(
            'SELECT * FROM verification_codes WHERE user_id = ? AND code = ? AND type = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
            [user.id, code, 'reset_password']
        );

        if (records.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired code' });
        }

        // Update Password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, user.id]);

        // Delete used codes
        await pool.query('DELETE FROM verification_codes WHERE user_id = ? AND type = ?', [user.id, 'reset_password']);

        res.json({ message: 'Password reset successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify token & return current user info (lightweight)
router.get('/me', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, username, email, avatar_url, role FROM users WHERE id = ?',
            [req.userId]
        );
        if (rows.length === 0) {
            return res.status(401).json({ message: 'User not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
