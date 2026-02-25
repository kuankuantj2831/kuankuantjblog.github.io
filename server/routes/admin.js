const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Hardcoded Admin Credentials
const ADMIN_USERNAME = 'kuankuantj';
const ADMIN_PASSWORD_HASH = '$2a$10$EG2y7feSU9bHRtK.PzVCTOAkzNIRx6hNoz/snybwKdRUytVWe0P4i';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// In-memory lockout store (Note: resets on server restart/serverless cold start)
// Map<IP, { attempts: number, lockUntil: number }>
const loginAttempts = new Map();

// Middleware to check Admin Token
const requireAdmin = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err || decoded.role !== 'admin_standalone') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    });
};

// Admin Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();

    // Check Lockout
    const attempt = loginAttempts.get(ip);
    if (attempt) {
        if (attempt.lockUntil > now) {
            const minutesLeft = Math.ceil((attempt.lockUntil - now) / 60000);
            return res.status(429).json({ message: `Account locked. Try again in ${minutesLeft} minutes.` });
        }
        // Reset if lock expired
        if (attempt.lockUntil !== 0 && attempt.lockUntil <= now) {
            loginAttempts.delete(ip);
        }
    }

    // Verify Credentials
    if (username === ADMIN_USERNAME && bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
        // Success: Reset attempts
        loginAttempts.delete(ip);

        const token = jwt.sign({ role: 'admin_standalone' }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token });
    } else {
        // Failure: Increment attempts
        const current = loginAttempts.get(ip) || { attempts: 0, lockUntil: 0 };
        current.attempts += 1;

        if (current.attempts >= 3) {
            current.lockUntil = now + 30 * 60 * 1000; // Lock for 30 minutes
            loginAttempts.set(ip, current);
            return res.status(429).json({ message: 'Too many failed attempts. Account locked for 30 minutes.' });
        } else {
            loginAttempts.set(ip, current);
            return res.status(401).json({ message: `Invalid credentials. ${3 - current.attempts} attempts remaining.` });
        }
    }
});

// --- Protected Routes ---

// Get all users
router.get('/users', requireAdmin, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, username, email, phone, role, created_at FROM users ORDER BY created_at DESC');
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete user
router.delete('/users/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add user
router.post('/users', requireAdmin, async (req, res) => {
    try {
        const { username, password, role, email, phone } = req.body;
        // bcrypt is already required at top

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO users (username, password_hash, role, email, phone) VALUES (?, ?, ?, ?, ?)',
            [username, hashedPassword, role || 'user', email || null, phone || null]
        );

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset user password
router.put('/users/:id/password', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({ message: 'New password is required' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, id]);

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== 硬币管理 ====================

// GET /admin/coins - 获取所有用户硬币信息
router.get('/coins', requireAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT u.id, u.username, u.email,
                   COALESCE(uc.balance, 0) as balance,
                   COALESCE(uc.total_earned, 0) as total_earned,
                   COALESCE(uc.total_spent, 0) as total_spent,
                   uc.last_checkin, uc.checkin_streak
            FROM users u
            LEFT JOIN user_coins uc ON u.id = uc.user_id
            ORDER BY COALESCE(uc.balance, 0) DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Get all coins error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /admin/coins/:userId - 获取指定用户硬币详情和最近交易记录
router.get('/coins/:userId', requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;

        // 用户基本信息 + 硬币信息
        const [userRows] = await pool.query(`
            SELECT u.id, u.username, u.email,
                   COALESCE(uc.balance, 0) as balance,
                   COALESCE(uc.total_earned, 0) as total_earned,
                   COALESCE(uc.total_spent, 0) as total_spent,
                   uc.last_checkin, uc.checkin_streak
            FROM users u
            LEFT JOIN user_coins uc ON u.id = uc.user_id
            WHERE u.id = ?
        `, [userId]);

        if (userRows.length === 0) {
            return res.status(404).json({ message: '用户不存在' });
        }

        // 最近 50 条交易记录
        const [transactions] = await pool.query(`
            SELECT id, amount, type, description, related_id, created_at
            FROM coin_transactions
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 50
        `, [userId]);

        res.json({
            user: userRows[0],
            transactions
        });
    } catch (error) {
        console.error('Get user coins detail error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /admin/coins/:userId - 管理员修改用户硬币余额
router.put('/coins/:userId', requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { amount, reason } = req.body;

        if (amount === undefined || amount === null) {
            return res.status(400).json({ message: '请提供调整数量' });
        }

        const adjustAmount = parseInt(amount);
        if (isNaN(adjustAmount) || adjustAmount === 0) {
            return res.status(400).json({ message: '调整数量必须为非零整数' });
        }

        // 确保用户存在
        const [userRows] = await pool.query('SELECT id, username FROM users WHERE id = ?', [userId]);
        if (userRows.length === 0) {
            return res.status(404).json({ message: '用户不存在' });
        }

        // 确保用户有硬币记录
        await pool.query(
            'INSERT IGNORE INTO user_coins (user_id, balance) VALUES (?, 0)',
            [userId]
        );

        // 检查扣除时余额是否足够
        if (adjustAmount < 0) {
            const [balanceRows] = await pool.query(
                'SELECT balance FROM user_coins WHERE user_id = ?',
                [userId]
            );
            if (balanceRows[0].balance < Math.abs(adjustAmount)) {
                return res.status(400).json({
                    message: `余额不足，当前余额: ${balanceRows[0].balance}`
                });
            }
        }

        // 更新余额
        if (adjustAmount > 0) {
            await pool.query(
                'UPDATE user_coins SET balance = balance + ?, total_earned = total_earned + ? WHERE user_id = ?',
                [adjustAmount, adjustAmount, userId]
            );
        } else {
            await pool.query(
                'UPDATE user_coins SET balance = balance + ?, total_spent = total_spent + ? WHERE user_id = ?',
                [adjustAmount, Math.abs(adjustAmount), userId]
            );
        }

        // 记录交易
        const description = reason
            ? `管理员调整: ${reason} (${adjustAmount > 0 ? '+' : ''}${adjustAmount})`
            : `管理员调整 (${adjustAmount > 0 ? '+' : ''}${adjustAmount})`;

        await pool.query(
            'INSERT INTO coin_transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)',
            [userId, adjustAmount, 'admin', description]
        );

        // 获取最新余额
        const [newBalance] = await pool.query(
            'SELECT balance, total_earned, total_spent FROM user_coins WHERE user_id = ?',
            [userId]
        );

        res.json({
            message: '调整成功',
            username: userRows[0].username,
            adjustment: adjustAmount,
            balance: newBalance[0].balance,
            total_earned: newBalance[0].total_earned,
            total_spent: newBalance[0].total_spent
        });
    } catch (error) {
        console.error('Admin adjust coins error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
