const express = require('express');
const { pool } = require('../db');
const router = express.Router();

// Search knowledge (public)
router.get('/search', async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        if (!q) {
            // No keyword: return latest 20
            const [rows] = await pool.query(
                'SELECT id, title, summary, category, tags, author_name, created_at FROM knowledge ORDER BY created_at DESC LIMIT 20'
            );
            return res.json({ data: rows, total: rows.length });
        }
        const keyword = `%${q}%`;
        const [rows] = await pool.query(
            'SELECT id, title, summary, category, tags, author_name, created_at FROM knowledge WHERE title LIKE ? OR summary LIKE ? OR content LIKE ? ORDER BY created_at DESC LIMIT 20',
            [keyword, keyword, keyword]
        );
        res.json({ data: rows, total: rows.length });
    } catch (error) {
        console.error('Knowledge search error:', error);
        res.status(500).json({ message: 'Search failed' });
    }
});

// Get single knowledge entry
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT k.*, u.username, u.avatar_url FROM knowledge k JOIN users u ON k.author_id = u.id WHERE k.id = ?',
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
