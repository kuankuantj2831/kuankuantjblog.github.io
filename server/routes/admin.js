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
    const ip = req.ip || req.connection.remoteAddress;
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

module.exports = router;
