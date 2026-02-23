const express = require('express');
const { pool } = require('../db');
const router = express.Router();

// Get profile (from users table)
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, username, email, phone, avatar_url, role, is_2fa_enabled, created_at FROM users WHERE id = ?',
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update profile (update users table)
router.put('/:id', async (req, res) => {
    try {
        const { username, avatar_url } = req.body;

        // Build dynamic update query
        const updates = [];
        const values = [];

        if (username) {
            updates.push('username = ?');
            values.push(username);
        }
        if (avatar_url !== undefined) {
            updates.push('avatar_url = ?');
            values.push(avatar_url);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        values.push(req.params.id);
        await pool.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        res.json({ message: 'Profile updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
