const express = require('express');
const { pool, getUserLevel, getUserTitle, calcLevel } = require('../db');
const { verifyToken } = require('../middleware/auth');
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

// Toggle like (requires authentication)
router.post('/articles/:id/like', verifyToken, async (req, res) => {
    try {
        const articleId = req.params.id;
        const userId = req.userId; // 从 token 获取，防止伪造

        // Check if already liked
        const [existing] = await pool.query('SELECT id FROM likes WHERE article_id = ? AND user_id = ?', [articleId, userId]);

        if (existing.length > 0) {
            // Unlike
            await pool.query('DELETE FROM likes WHERE article_id = ? AND user_id = ?', [articleId, userId]);
            res.json({ message: 'Unliked', liked: false });
        } else {
            // Like
            await pool.query('INSERT INTO likes (article_id, user_id) VALUES (?, ?)', [articleId, userId]);

            // 通知文章作者
            try {
                const [article] = await pool.query('SELECT author_id, title FROM articles WHERE id = ?', [articleId]);
                const [liker] = await pool.query('SELECT username FROM users WHERE id = ?', [userId]);
                if (article.length > 0 && article[0].author_id !== userId) {
                    const likerName = liker.length > 0 ? liker[0].username : '某用户';
                    await pool.query(
                        'INSERT INTO notifications (user_id, type, title, content, related_id) VALUES (?, ?, ?, ?, ?)',
                        [article[0].author_id, 'like', '收到点赞', `${likerName} 赞了你的文章「${(article[0].title || '').substring(0, 30)}」`, articleId]
                    );
                }
            } catch (e) { console.error('点赞通知失败:', e.message); }

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
        const [rows] = await pool.query('SELECT * FROM comments WHERE article_id = ? ORDER BY created_at ASC', [articleId]);

        if (rows.length === 0) return res.json(rows);

        // 批量获取所有评论者的等级（单次查询代替 N+1）
        const userIds = [...new Set(rows.map(c => c.user_id))];
        const placeholders = userIds.map(() => '?').join(',');

        const [coinRows] = await pool.query(
            `SELECT user_id, COALESCE(total_earned, 0) AS total_earned FROM user_coins WHERE user_id IN (${placeholders})`, userIds
        );
        const [artRows] = await pool.query(
            `SELECT author_id, COUNT(*) AS cnt FROM articles WHERE author_id IN (${placeholders}) GROUP BY author_id`, userIds
        );
        const [cmtRows] = await pool.query(
            `SELECT user_id, COUNT(*) AS cnt FROM comments WHERE user_id IN (${placeholders}) GROUP BY user_id`, userIds
        );
        const [likeRows] = await pool.query(
            `SELECT a.author_id, COUNT(*) AS cnt FROM likes l JOIN articles a ON l.article_id = a.id WHERE a.author_id IN (${placeholders}) GROUP BY a.author_id`, userIds
        );

        const coinMap = Object.fromEntries(coinRows.map(r => [r.user_id, r.total_earned]));
        const artMap = Object.fromEntries(artRows.map(r => [r.author_id, r.cnt]));
        const cmtMap = Object.fromEntries(cmtRows.map(r => [r.user_id, r.cnt]));
        const likeMap = Object.fromEntries(likeRows.map(r => [r.author_id, r.cnt]));

        // 批量获取评论者的捐赠信息用于头衔
        const [donateRows] = await pool.query(
            `SELECT id, username, total_donated FROM users WHERE id IN (${placeholders})`, userIds
        );
        const donateMap = Object.fromEntries(donateRows.map(r => [r.id, r]));

        const comments = rows.map(c => {
            const exp = (coinMap[c.user_id] || 0) + (artMap[c.user_id] || 0) * 20 + (cmtMap[c.user_id] || 0) * 5 + (likeMap[c.user_id] || 0) * 3;
            const uInfo = donateMap[c.user_id] || {};
            return { ...c, user_level: calcLevel(exp).level, user_title: getUserTitle(uInfo.total_donated, uInfo.username) };
        });

        res.json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add comment (requires authentication) — supports reply via parent_id
router.post('/articles/:id/comments', verifyToken, async (req, res) => {
    try {
        const articleId = req.params.id;
        const userId = req.userId; // 从 token 获取
        const { content, parentId } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Missing content' });
        }
        if (content.length > 5000) {
            return res.status(400).json({ message: '评论内容不能超过5000字' });
        }

        // 如果是回复，验证父评论存在
        if (parentId) {
            const [parent] = await pool.query('SELECT id, user_id, user_name FROM comments WHERE id = ? AND article_id = ?', [parentId, articleId]);
            if (parent.length === 0) {
                return res.status(400).json({ message: '回复的评论不存在' });
            }
        }

        // 从数据库获取用户名，防止伪造
        const [userRows] = await pool.query('SELECT username FROM users WHERE id = ?', [userId]);
        const userName = userRows.length > 0 ? userRows[0].username : 'Anonymous';

        const [result] = await pool.query(
            'INSERT INTO comments (article_id, user_id, user_name, content, parent_id) VALUES (?, ?, ?, ?, ?)',
            [articleId, userId, userName || 'Anonymous', content, parentId || null]
        );

        // 通知：回复通知父评论作者，否则通知文章作者
        try {
            if (parentId) {
                const [parent] = await pool.query('SELECT user_id, user_name FROM comments WHERE id = ?', [parentId]);
                if (parent.length > 0 && parent[0].user_id !== parseInt(userId)) {
                    const preview = (content || '').substring(0, 50);
                    await pool.query(
                        'INSERT INTO notifications (user_id, type, title, content, related_id) VALUES (?, ?, ?, ?, ?)',
                        [parent[0].user_id, 'comment', '收到回复', `${userName} 回复了你的评论：${preview}`, articleId]
                    );
                }
            } else {
                const [article] = await pool.query('SELECT author_id, title FROM articles WHERE id = ?', [articleId]);
                if (article.length > 0 && article[0].author_id !== parseInt(userId)) {
                    const preview = (content || '').substring(0, 50);
                    await pool.query(
                        'INSERT INTO notifications (user_id, type, title, content, related_id) VALUES (?, ?, ?, ?, ?)',
                        [article[0].author_id, 'comment', '收到评论', `${userName} 评论了你的文章「${(article[0].title || '').substring(0, 30)}」：${preview}`, articleId]
                    );
                }
            }
        } catch (e) { console.error('评论通知失败:', e.message); }

        res.status(201).json({ message: 'Comment added', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete comment (requires authentication)
router.delete('/comments/:id', verifyToken, async (req, res) => {
    try {
        const commentId = req.params.id;

        const [comment] = await pool.query('SELECT user_id FROM comments WHERE id = ?', [commentId]);
        if (comment.length === 0) return res.status(404).json({ message: 'Comment not found' });

        if (comment[0].user_id !== req.userId) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        await pool.query('DELETE FROM comments WHERE id = ?', [commentId]);
        res.json({ message: 'Comment deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Favorites (收藏) ---

// Get favorite status and count for an article
router.get('/articles/:id/favorite', async (req, res) => {
    try {
        const articleId = req.params.id;
        const userId = req.query.userId;

        const [countResult] = await pool.query('SELECT COUNT(*) as count FROM favorites WHERE article_id = ?', [articleId]);
        const count = countResult[0].count;

        let favorited = false;
        if (userId) {
            const [userFav] = await pool.query('SELECT id FROM favorites WHERE article_id = ? AND user_id = ?', [articleId, userId]);
            favorited = userFav.length > 0;
        }

        res.json({ count, favorited });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Toggle favorite (requires authentication)
router.post('/articles/:id/favorite', verifyToken, async (req, res) => {
    try {
        const articleId = req.params.id;
        const userId = req.userId; // 从 token 获取

        const [existing] = await pool.query('SELECT id FROM favorites WHERE article_id = ? AND user_id = ?', [articleId, userId]);

        if (existing.length > 0) {
            await pool.query('DELETE FROM favorites WHERE article_id = ? AND user_id = ?', [articleId, userId]);
            res.json({ message: 'Unfavorited', favorited: false });
        } else {
            await pool.query('INSERT INTO favorites (article_id, user_id) VALUES (?, ?)', [articleId, userId]);

            // 通知文章作者
            try {
                const [article] = await pool.query('SELECT author_id, title FROM articles WHERE id = ?', [articleId]);
                const [faver] = await pool.query('SELECT username FROM users WHERE id = ?', [userId]);
                if (article.length > 0 && article[0].author_id !== parseInt(userId)) {
                    const faverName = faver.length > 0 ? faver[0].username : '某用户';
                    await pool.query(
                        'INSERT INTO notifications (user_id, type, title, content, related_id) VALUES (?, ?, ?, ?, ?)',
                        [article[0].author_id, 'favorite', '文章被收藏', `${faverName} 收藏了你的文章「${(article[0].title || '').substring(0, 30)}」`, articleId]
                    );
                }
            } catch (e) { console.error('收藏通知失败:', e.message); }

            res.json({ message: 'Favorited', favorited: true });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's favorite articles (for profile page)
router.get('/favorites', async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ message: 'Missing userId' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const [rows] = await pool.query(`
            SELECT a.id, a.title, a.summary, a.category, a.cover_image, a.author_name, a.created_at,
                   u.total_donated,
                   f.created_at as favorited_at
            FROM favorites f
            JOIN articles a ON f.article_id = a.id
            LEFT JOIN users u ON a.author_id = u.id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC
            LIMIT ? OFFSET ?
        `, [userId, limit, offset]);

        const [countResult] = await pool.query('SELECT COUNT(*) as total FROM favorites WHERE user_id = ?', [userId]);
        const total = countResult[0].total;

        res.json({
            articles: rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
