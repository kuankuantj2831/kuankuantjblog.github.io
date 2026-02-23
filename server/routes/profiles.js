const express = require('express');
const { pool } = require('../db');
const router = express.Router();

// Get profile
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM profiles WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            // If not found, try to find in users and create default?
            // For now just return 404
            return res.status(404).json({ message: 'Profile not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update profile
router.put('/:id', async (req, res) => {
    try {
        const { username, avatar_url } = req.body;

        // Upsert profile
        await pool.query(
            'INSERT INTO profiles (id, username, avatar_url) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE username = VALUES(username), avatar_url = VALUES(avatar_url)',
            [req.params.id, username, avatar_url]
        );

        res.json({ message: 'Profile updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
