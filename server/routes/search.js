/**
 * 高级全文搜索路由
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

/**
 * 全文搜索
 * GET /api/search
 */
router.get('/search', async (req, res) => {
    const { 
        q, 
        page = 1, 
        limit = 10,
        category,
        author,
        sort = 'relevance',
        timeRange
    } = req.query;
    
    if (!q || q.trim().length === 0) {
        return res.status(400).json({ message: '请输入搜索关键词' });
    }
    
    const keyword = q.trim();
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    try {
        let whereConditions = ['a.is_public != 0 OR a.is_public IS NULL'];
        let params = [];
        
        // 根据是否有全文搜索索引表决定搜索方式
        const [indexRows] = await pool.query('SHOW TABLES LIKE "search_index"');
        const hasSearchIndex = indexRows.length > 0;
        
        let articles = [];
        let total = 0;
        
        if (hasSearchIndex) {
            // 使用全文搜索索引
            let searchQuery = `
                SELECT 
                    a.id, a.title, a.author_name, a.category, 
                    a.created_at, a.tags,
                    LEFT(a.content, 300) as excerpt,
                    COALESCE(s.view_count, 0) as views,
                    COALESCE(s.like_count, 0) as likes
                FROM search_index si
                JOIN articles a ON si.article_id = a.id
                LEFT JOIN article_stats s ON a.id = s.article_id
                WHERE MATCH(si.title, si.content_text) AGAINST(? IN BOOLEAN MODE)
            `;
            params.push(keyword);
            
            // 添加筛选条件
            if (category) {
                searchQuery += ' AND a.category = ?';
                params.push(category);
            }
            if (author) {
                searchQuery += ' AND a.author_name = ?';
                params.push(author);
            }
            if (timeRange) {
                if (timeRange === 'week') {
                    searchQuery += ' AND a.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
                } else if (timeRange === 'month') {
                    searchQuery += ' AND a.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
                } else if (timeRange === 'year') {
                    searchQuery += ' AND a.created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
                }
            }
            
            // 排序
            if (sort === 'newest') {
                searchQuery += ' ORDER BY a.created_at DESC';
            } else if (sort === 'popular') {
                searchQuery += ' ORDER BY COALESCE(s.view_count, 0) DESC';
            } else {
                // 按相关性排序（全文搜索默认）
                searchQuery += ' ORDER BY MATCH(si.title, si.content_text) AGAINST(?) DESC';
                params.push(keyword);
            }
            
            // 分页
            searchQuery += ' LIMIT ? OFFSET ?';
            params.push(parseInt(limit), offset);
            
            const [rows] = await pool.query(searchQuery, params);
            articles = rows;
            
            // 获取总数
            const [countRows] = await pool.query(
                `SELECT COUNT(*) as total 
                 FROM search_index si
                 JOIN articles a ON si.article_id = a.id
                 WHERE MATCH(si.title, si.content_text) AGAINST(? IN BOOLEAN MODE)`,
                [keyword]
            );
            total = countRows[0].total;
            
        } else {
            // 使用LIKE搜索（兼容性方案）
            let searchQuery = `
                SELECT 
                    a.id, a.title, a.author_name, a.category, 
                    a.created_at, a.tags,
                    LEFT(a.content, 300) as excerpt,
                    COALESCE(s.view_count, 0) as views,
                    COALESCE(s.like_count, 0) as likes
                FROM articles a
                LEFT JOIN article_stats s ON a.id = s.article_id
                WHERE (a.title LIKE ? OR a.content LIKE ? OR a.tags LIKE ?)
                AND (a.is_public != 0 OR a.is_public IS NULL)
            `;
            const likePattern = `%${keyword}%`;
            params = [likePattern, likePattern, likePattern];
            
            // 添加筛选条件
            if (category) {
                searchQuery += ' AND a.category = ?';
                params.push(category);
            }
            if (author) {
                searchQuery += ' AND a.author_name = ?';
                params.push(author);
            }
            if (timeRange) {
                if (timeRange === 'week') {
                    searchQuery += ' AND a.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
                } else if (timeRange === 'month') {
                    searchQuery += ' AND a.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
                } else if (timeRange === 'year') {
                    searchQuery += ' AND a.created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
                }
            }
            
            // 排序
            if (sort === 'newest') {
                searchQuery += ' ORDER BY a.created_at DESC';
            } else if (sort === 'popular') {
                searchQuery += ' ORDER BY COALESCE(s.view_count, 0) DESC';
            } else {
                searchQuery += ' ORDER BY a.created_at DESC';
            }
            
            // 分页
            searchQuery += ' LIMIT ? OFFSET ?';
            params.push(parseInt(limit), offset);
            
            const [rows] = await pool.query(searchQuery, params);
            articles = rows;
            
            // 获取总数
            const [countRows] = await pool.query(
                `SELECT COUNT(*) as total 
                 FROM articles a
                 WHERE (a.title LIKE ? OR a.content LIKE ? OR a.tags LIKE ?)
                 AND (a.is_public != 0 OR a.is_public IS NULL)`,
                [likePattern, likePattern, likePattern]
            );
            total = countRows[0].total;
        }
        
        // 高亮关键词
        articles = articles.map(article => ({
            ...article,
            title_highlight: highlightKeyword(article.title, keyword),
            excerpt_highlight: highlightKeyword(article.excerpt, keyword)
        }));
        
        // 记录搜索日志
        try {
            await pool.query(
                'INSERT INTO search_logs (keyword, result_count) VALUES (?, ?)',
                [keyword, total]
            );
        } catch (e) {
            // 忽略日志记录错误
        }
        
        res.json({
            keyword: keyword,
            total: total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit)),
            articles: articles
        });
        
    } catch (error) {
        console.error('搜索失败:', error);
        res.status(500).json({ message: '搜索失败' });
    }
});

/**
 * 获取搜索建议
 * GET /api/search/suggestions
 */
router.get('/search/suggestions', async (req, res) => {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
        return res.json({ suggestions: [] });
    }
    
    const keyword = q.trim();
    
    try {
        // 从历史搜索中获取建议
        const [rows] = await pool.query(
            `SELECT DISTINCT keyword, COUNT(*) as count
             FROM search_logs
             WHERE keyword LIKE ?
             GROUP BY keyword
             ORDER BY count DESC, created_at DESC
             LIMIT 10`,
            [`${keyword}%`]
        );
        
        // 从热门文章中获取标题建议
        const [titleRows] = await pool.query(
            `SELECT DISTINCT title
             FROM articles
             WHERE title LIKE ? AND (is_public != 0 OR is_public IS NULL)
             ORDER BY created_at DESC
             LIMIT 5`,
            [`%${keyword}%`]
        );
        
        const suggestions = [
            ...rows.map(r => r.keyword),
            ...titleRows.map(r => r.title)
        ].slice(0, 10);
        
        res.json({ suggestions: [...new Set(suggestions)] });
        
    } catch (error) {
        console.error('获取搜索建议失败:', error);
        res.json({ suggestions: [] });
    }
});

/**
 * 获取热门搜索
 * GET /api/search/trending
 */
router.get('/search/trending', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT keyword, COUNT(*) as count
             FROM search_logs
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
             GROUP BY keyword
             ORDER BY count DESC
             LIMIT 10`
        );
        
        res.json({
            trending: rows
        });
        
    } catch (error) {
        console.error('获取热门搜索失败:', error);
        res.json({ trending: [] });
    }
});

/**
 * 获取筛选选项
 * GET /api/search/filters
 */
router.get('/search/filters', async (req, res) => {
    try {
        // 获取所有分类
        const [categoryRows] = await pool.query(
            `SELECT DISTINCT category, COUNT(*) as count
             FROM articles
             WHERE category IS NOT NULL AND category != ''
             AND (is_public != 0 OR is_public IS NULL)
             GROUP BY category`
        );
        
        // 获取所有作者
        const [authorRows] = await pool.query(
            `SELECT DISTINCT author_name, COUNT(*) as count
             FROM articles
             WHERE author_name IS NOT NULL AND author_name != ''
             AND (is_public != 0 OR is_public IS NULL)
             GROUP BY author_name
             ORDER BY count DESC
             LIMIT 20`
        );
        
        // 获取所有标签
        const [tagRows] = await pool.query(
            `SELECT DISTINCT tags
             FROM articles
             WHERE tags IS NOT NULL AND tags != ''
             AND (is_public != 0 OR is_public IS NULL)
             ORDER BY created_at DESC
             LIMIT 100`
        );
        
        // 解析所有标签
        const allTags = new Set();
        tagRows.forEach(row => {
            if (row.tags) {
                row.tags.split(/[,，]/).forEach(tag => {
                    const trimmed = tag.trim();
                    if (trimmed) allTags.add(trimmed);
                });
            }
        });
        
        res.json({
            categories: categoryRows,
            authors: authorRows,
            tags: [...allTags].slice(0, 30)
        });
        
    } catch (error) {
        console.error('获取筛选选项失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 高亮关键词
 */
function highlightKeyword(text, keyword) {
    if (!text || !keyword) return text;
    
    // 转义正则特殊字符
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    
    return text.replace(regex, '<mark>$1</mark>');
}

module.exports = router;
