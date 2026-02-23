const express = require('express');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, phone, password } = req.body;
        console.log('Register attempt:', { username, email, phone, hasPassword: !!password });

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
            return res.status(409).json({ message: 'User already exists' });
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
        const { username, password } = req.body;

        // Find user by username, email, or phone
        const [users] = await pool.query(
            'SELECT * FROM users WHERE username = ? OR email = ? OR phone = ?',
            [username, username, username]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if 2FA is enabled
        console.log(`Login: User ${user.username} (ID: ${user.id}) 2FA status: ${user.is_2fa_enabled}`);
        if (user.is_2fa_enabled) {
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

            if (emailSent) {
                return res.json({ require2fa: true, userId: user.id, message: 'Verification code sent to your email' });
            } else {
                return res.status(500).json({ message: 'Failed to send verification email' });
            }
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });

        // Return user info without password
        const { password_hash, ...userInfo } = user;
        res.json({ token, user: userInfo });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify 2FA Code
router.post('/login/verify', async (req, res) => {
    try {
        const { userId, code } = req.body;
        console.log(`Verify: Verifying code for User ID ${userId}`);

        const [records] = await pool.query(
            'SELECT * FROM verification_codes WHERE user_id = ? AND code = ? AND type = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
            [userId, code, 'login_2fa']
        );

        if (records.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired verification code' });
        }

        // Code valid, delete used codes
        await pool.query('DELETE FROM verification_codes WHERE user_id = ? AND type = ?', [userId, 'login_2fa']);

        // Get user info
        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        const user = users[0];

        // Generate Token
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
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

// Change Password
router.put('/password', async (req, res) => {
    try {
        const { userId, password } = req.body;
        // In a real app, verify token here

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
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
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
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
            res.json({ message: 'Reset code sent to your email' });
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

module.exports = router;
