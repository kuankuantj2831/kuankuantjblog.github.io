const express = require('express');
const { pool, getUserTitle, getUserLevel } = require('../db');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Get articles with pagination
router.get('/', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;

        const [rows] = await pool.query(
            `SELECT a.*, u.total_donated as author_total_donated
             FROM articles a
             LEFT JOIN users u ON a.author_id = u.id
             ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
            [limit, offset]
        );
        // 附加头衔
        const articles = rows.map(r => ({
            ...r,
            author_title: getUserTitle(r.author_total_donated, r.author_name)
        }));
        res.json(articles);
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
            conditions.push('(a.title LIKE ? OR a.summary LIKE ? OR a.content LIKE ? OR a.author_name LIKE ?)');
            params.push(keyword, keyword, keyword, keyword);
        }

        // Category filter
        if (category && category.trim()) {
            conditions.push('a.category = ?');
            params.push(category.trim());
        }

        // Tag filter (tags stored as comma-separated string, use LIKE)
        if (tag && tag.trim()) {
            conditions.push('a.tags LIKE ?');
            params.push(`%${tag.trim()}%`);
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        // Count total results
        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total FROM articles a ${whereClause}`,
            params
        );
        const total = countResult[0].total;

        // Pagination
        const pageNum = Math.max(1, parseInt(page) || 1);
        const pageSize = Math.min(50, Math.max(1, parseInt(limit) || 20));
        const offset = (pageNum - 1) * pageSize;

        // Query with pagination (exclude full content for performance, include author title)
        const [rows] = await pool.query(
            `SELECT a.id, a.title, a.summary, a.category, a.tags, a.cover_image, a.author_id, a.author_name, a.created_at, a.updated_at, u.total_donated as author_total_donated
             FROM articles a
             LEFT JOIN users u ON a.author_id = u.id
             ${whereClause}
             ORDER BY a.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, pageSize, offset]
        );

        const articles = rows.map(r => ({
            ...r,
            author_title: getUserTitle(r.author_total_donated, r.author_name)
        }));

        res.json({
            data: articles,
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

// RSS 订阅源
router.get('/feed/rss', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id, title, summary, content, author_name, category, created_at
             FROM articles ORDER BY created_at DESC LIMIT 20`
        );

        const escXml = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

        let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Hakimi 的猫爬架</title>
  <link>https://mcock.cn</link>
  <description>分享编程技术、游戏资源、设计素材与学习资料的个人博客</description>
  <language>zh-CN</language>
  <atom:link href="https://mcock.cn/rss.xml" rel="self" type="application/rss+xml"/>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`;

        rows.forEach(a => {
            rss += `
  <item>
    <title>${escXml(a.title)}</title>
    <link>https://mcock.cn/article.html?id=${a.id}</link>
    <guid>https://mcock.cn/article.html?id=${a.id}</guid>
    <description>${escXml(a.summary || a.content?.substring(0, 200) || '')}</description>
    <category>${escXml(a.category)}</category>
    <author>${escXml(a.author_name)}</author>
    <pubDate>${new Date(a.created_at).toUTCString()}</pubDate>
  </item>`;
        });

        rss += `\n</channel>\n</rss>`;
        res.set('Content-Type', 'application/rss+xml; charset=utf-8');
        res.send(rss);
    } catch (error) {
        console.error('RSS error:', error);
        res.status(500).send('RSS generation failed');
    }
});

// 获取所有标签及其文章数（标签云）
router.get('/meta/tags', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT tags FROM articles WHERE tags IS NOT NULL AND tags != ""');
        const tagCount = {};
        rows.forEach(r => {
            (r.tags || '').split(',').forEach(t => {
                const tag = t.trim();
                if (tag) tagCount[tag] = (tagCount[tag] || 0) + 1;
            });
        });
        const tags = Object.entries(tagCount).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
        res.json(tags);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 获取所有分类及其文章数
router.get('/meta/categories', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT category, COUNT(*) as count FROM articles WHERE category IS NOT NULL AND category != "" GROUP BY category ORDER BY count DESC'
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 热门文章（按浏览量排序）
router.get('/meta/hot', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const [rows] = await pool.query(
            'SELECT id, title, view_count, category, author_name, created_at FROM articles ORDER BY view_count DESC LIMIT ?',
            [limit]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single article (with author title) + increment view count
router.get('/:id', async (req, res) => {
    try {
        // 异步增加浏览量（不阻塞响应）
        pool.query('UPDATE articles SET view_count = view_count + 1 WHERE id = ?', [req.params.id]).catch(() => {});

        const [rows] = await pool.query(
            `SELECT a.*, u.total_donated as author_total_donated
             FROM articles a
             LEFT JOIN users u ON a.author_id = u.id
             WHERE a.id = ?`,
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Article not found' });
        }
        const levelInfo = await getUserLevel(rows[0].author_id);
        const article = {
            ...rows[0],
            author_title: getUserTitle(rows[0].author_total_donated, rows[0].author_name),
            author_level: levelInfo.level
        };
        res.json(article);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create article (requires authentication)
router.post('/', verifyToken, async (req, res) => {
    try {
        const { title, content, summary, category, tags, cover_image } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        if (title.length > 200) {
            return res.status(400).json({ message: '标题不能超过200字' });
        }
        if (content.length > 200000) {
            return res.status(400).json({ message: '文章内容不能超过200000字' });
        }

        // 从 token 获取作者信息，防止伪造
        const authorId = req.userId;
        const [userRows] = await pool.query('SELECT username FROM users WHERE id = ?', [authorId]);
        const authorName = userRows.length > 0 ? userRows[0].username : 'Unknown';

        const [result] = await pool.query(
            'INSERT INTO articles (title, content, summary, category, tags, cover_image, author_id, author_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [title, content, summary, category, tags, cover_image, authorId, authorName]
        );

        res.status(201).json({ message: 'Article created', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete article (requires authentication)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const articleId = req.params.id;

        // Check ownership using token userId
        const [rows] = await pool.query('SELECT author_id FROM articles WHERE id = ?', [articleId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Article not found' });
        }

        if (String(rows[0].author_id) !== String(req.userId)) {
            return res.status(403).json({ message: 'Forbidden: You are not the author' });
        }

        await pool.query('DELETE FROM articles WHERE id = ?', [articleId]);
        res.json({ message: 'Article deleted successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
