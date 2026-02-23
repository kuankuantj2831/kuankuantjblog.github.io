const express = require('express');
const { pool } = require('../db');
const router = express.Router();

// Get all articles
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM articles ORDER BY created_at DESC LIMIT 20');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Search articles - supports keyword, category, tag filtering
router.get('/search', async (req, res) => {
    try {
        const { q, category, tag, page = 1, limit = 20 } = req.query;
        const conditions = [];
        const params = [];

        // Keyword search: match title, summary, content, author_name
        if (q && q.trim()) {
            const keyword = `%${q.trim()}%`;
            conditions.push('(title LIKE ? OR summary LIKE ? OR content LIKE ? OR author_name LIKE ?)');
            params.push(keyword, keyword, keyword, keyword);
        }

        // Category filter
        if (category && category.trim()) {
            conditions.push('category = ?');
            params.push(category.trim());
        }

        // Tag filter (tags stored as comma-separated string, use LIKE)
        if (tag && tag.trim()) {
            conditions.push('tags LIKE ?');
            params.push(`%${tag.trim()}%`);
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        // Count total results
        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total FROM articles ${whereClause}`,
            params
        );
        const total = countResult[0].total;

        // Pagination
        const pageNum = Math.max(1, parseInt(page) || 1);
        const pageSize = Math.min(50, Math.max(1, parseInt(limit) || 20));
        const offset = (pageNum - 1) * pageSize;

        // Query with pagination (exclude full content for performance)
        const [rows] = await pool.query(
            `SELECT id, title, summary, category, tags, cover_image, author_id, author_name, created_at, updated_at
             FROM articles ${whereClause}
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, pageSize, offset]
        );

        res.json({
            data: rows,
            pagination: {
                page: pageNum,
                limit: pageSize,
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Search failed' });
    }
});

// Get single article
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM articles WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Article not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create article
router.post('/', async (req, res) => {
    try {
        const { title, content, summary, category, tags, cover_image, author_id, author_name } = req.body;

        if (!title || !content || !author_id) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const [result] = await pool.query(
            'INSERT INTO articles (title, content, summary, category, tags, cover_image, author_id, author_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [title, content, summary, category, tags, cover_image, author_id, author_name]
        );

        res.status(201).json({ message: 'Article created', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete article
router.delete('/:id', async (req, res) => {
    try {
        const { userId } = req.body; // In a real app, get from token
        const articleId = req.params.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Check ownership
        const [rows] = await pool.query('SELECT author_id FROM articles WHERE id = ?', [articleId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Article not found' });
        }

        if (rows[0].author_id != userId) {
            return res.status(403).json({ message: 'Forbidden: You are not the author' });
        }

        // Delete
        await pool.query('DELETE FROM articles WHERE id = ?', [articleId]);
        res.json({ message: 'Article deleted successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
