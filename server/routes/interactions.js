const express = require('express');
const { pool } = require('../db');
const router = express.Router();

// --- Likes ---

// Get like status and count
router.get('/articles/:id/like', async (req, res) => {
    try {
        const articleId = req.params.id;
        const userId = req.query.userId; // Optional, to check if user liked

        // Get count
        const [countResult] = await pool.query('SELECT COUNT(*) as count FROM likes WHERE article_id = ?', [articleId]);
        const count = countResult[0].count;

        let liked = false;
        if (userId) {
            const [userLike] = await pool.query('SELECT id FROM likes WHERE article_id = ? AND user_id = ?', [articleId, userId]);
            liked = userLike.length > 0;
        }

        res.json({ count, liked });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Toggle like
router.post('/articles/:id/like', async (req, res) => {
    try {
        const articleId = req.params.id;
        const { userId } = req.body;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Check if already liked
        const [existing] = await pool.query('SELECT id FROM likes WHERE article_id = ? AND user_id = ?', [articleId, userId]);

        if (existing.length > 0) {
            // Unlike
            await pool.query('DELETE FROM likes WHERE article_id = ? AND user_id = ?', [articleId, userId]);
            res.json({ message: 'Unliked', liked: false });
        } else {
            // Like
            await pool.query('INSERT INTO likes (article_id, user_id) VALUES (?, ?)', [articleId, userId]);
            res.json({ message: 'Liked', liked: true });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Comments ---

// Get comments
router.get('/articles/:id/comments', async (req, res) => {
    try {
        const articleId = req.params.id;
        const [rows] = await pool.query('SELECT * FROM comments WHERE article_id = ? ORDER BY created_at DESC', [articleId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add comment
router.post('/articles/:id/comments', async (req, res) => {
    try {
        const articleId = req.params.id;
        const { userId, userName, content } = req.body;

        if (!userId || !content) {
            return res.status(400).json({ message: 'Missing fields' });
        }

        await pool.query(
            'INSERT INTO comments (article_id, user_id, user_name, content) VALUES (?, ?, ?, ?)',
            [articleId, userId, userName || 'Anonymous', content]
        );

        res.status(201).json({ message: 'Comment added' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete comment
router.delete('/comments/:id', async (req, res) => {
    try {
        const commentId = req.params.id;
        const { userId } = req.body;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        // Check ownership (comment author or article author could delete, but let's stick to comment author for now)
        const [comment] = await pool.query('SELECT user_id FROM comments WHERE id = ?', [commentId]);
        if (comment.length === 0) return res.status(404).json({ message: 'Comment not found' });

        if (comment[0].user_id != userId) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        await pool.query('DELETE FROM comments WHERE id = ?', [commentId]);
        res.json({ message: 'Comment deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
