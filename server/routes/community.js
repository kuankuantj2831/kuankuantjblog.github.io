/**
 * 社区互动增强路由
 * 包含：文章投票、问答社区、评论置顶
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// 验证JWT中间件
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: '未提供认证令牌' });
    }
    
    try {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: '令牌无效' });
    }
};

// ============================================
// 文章投票系统
// ============================================

// 获取文章投票状态
router.get('/votes/:articleId', async (req, res) => {
    try {
        const articleId = parseInt(req.params.articleId);
        
        const [rows] = await pool.query(
            `SELECT 
                SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE 0 END) as up_votes,
                SUM(CASE WHEN vote_type = 'down' THEN 1 ELSE 0 END) as down_votes,
                COUNT(*) as total_votes
            FROM article_votes 
            WHERE article_id = ?`,
            [articleId]
        );
        
        res.json({
            up_votes: rows[0].up_votes || 0,
            down_votes: rows[0].down_votes || 0,
            total_votes: rows[0].total_votes || 0,
            score: (rows[0].up_votes || 0) - (rows[0].down_votes || 0)
        });
    } catch (error) {
        console.error('Error getting votes:', error);
        res.status(500).json({ message: '获取投票失败' });
    }
});

// 获取用户投票状态
router.get('/votes/:articleId/my', authenticateToken, async (req, res) => {
    try {
        const articleId = parseInt(req.params.articleId);
        
        const [rows] = await pool.query(
            'SELECT vote_type FROM article_votes WHERE article_id = ? AND user_id = ?',
            [articleId, req.user.id]
        );
        
        res.json({
            has_voted: rows.length > 0,
            vote_type: rows.length > 0 ? rows[0].vote_type : null
        });
    } catch (error) {
        console.error('Error getting my vote:', error);
        res.status(500).json({ message: '获取投票状态失败' });
    }
});

// 投票
router.post('/votes', authenticateToken, async (req, res) => {
    try {
        const { article_id, vote_type } = req.body;
        const userId = req.user.id;
        
        if (!['up', 'down'].includes(vote_type)) {
            return res.status(400).json({ message: '无效的投票类型' });
        }
        
        // 检查是否已投票
        const [existing] = await pool.query(
            'SELECT id, vote_type FROM article_votes WHERE article_id = ? AND user_id = ?',
            [article_id, userId]
        );
        
        if (existing.length > 0) {
            if (existing[0].vote_type === vote_type) {
                // 取消投票
                await pool.query('DELETE FROM article_votes WHERE id = ?', [existing[0].id]);
                
                // 更新文章投票数
                const delta = vote_type === 'up' ? -1 : 1;
                await pool.query(
                    'UPDATE articles SET vote_count = vote_count + ? WHERE id = ?',
                    [delta, article_id]
                );
                
                return res.json({ message: '已取消投票', action: 'removed' });
            } else {
                // 更改投票
                await pool.query(
                    'UPDATE article_votes SET vote_type = ? WHERE id = ?',
                    [vote_type, existing[0].id]
                );
                
                // 更新文章投票数（反转）
                const delta = vote_type === 'up' ? 2 : -2;
                await pool.query(
                    'UPDATE articles SET vote_count = vote_count + ? WHERE id = ?',
                    [delta, article_id]
                );
                
                return res.json({ message: '投票已更改', action: 'changed', vote_type });
            }
        }
        
        // 新投票
        await pool.query(
            'INSERT INTO article_votes (article_id, user_id, vote_type) VALUES (?, ?, ?)',
            [article_id, userId, vote_type]
        );
        
        // 更新文章投票数
        const delta = vote_type === 'up' ? 1 : -1;
        await pool.query(
            'UPDATE articles SET vote_count = vote_count + ? WHERE id = ?',
            [delta, article_id]
        );
        
        res.json({ message: '投票成功', action: 'added', vote_type });
    } catch (error) {
        console.error('Error voting:', error);
        res.status(500).json({ message: '投票失败' });
    }
});

// ============================================
// 问答社区
// ============================================

// 获取问题列表
router.get('/questions', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const sort = req.query.sort || 'newest'; // newest, bounty, unanswered
        
        let orderBy = 'q.created_at DESC';
        if (sort === 'bounty') {
            orderBy = 'q.bounty_coins DESC, q.created_at DESC';
        } else if (sort === 'unanswered') {
            orderBy = 'q.is_resolved ASC, q.created_at DESC';
        }
        
        const [rows] = await pool.query(
            `SELECT q.*, u.username as author_name,
                (SELECT COUNT(*) FROM answers WHERE question_id = q.id) as answer_count
            FROM questions q
            JOIN users u ON q.author_id = u.id
            ORDER BY ${orderBy}
            LIMIT ? OFFSET ?`,
            [limit, offset]
        );
        
        const [count] = await pool.query('SELECT COUNT(*) as total FROM questions');
        
        res.json({
            questions: rows,
            total: count[0].total,
            page,
            totalPages: Math.ceil(count[0].total / limit)
        });
    } catch (error) {
        console.error('Error getting questions:', error);
        res.status(500).json({ message: '获取问题列表失败' });
    }
});

// 获取单个问题
router.get('/questions/:id', async (req, res) => {
    try {
        const questionId = parseInt(req.params.id);
        
        // 增加浏览量
        await pool.query(
            'UPDATE questions SET view_count = view_count + 1 WHERE id = ?',
            [questionId]
        );
        
        // 获取问题详情
        const [questions] = await pool.query(
            `SELECT q.*, u.username as author_name, u.avatar as author_avatar
            FROM questions q
            JOIN users u ON q.author_id = u.id
            WHERE q.id = ?`,
            [questionId]
        );
        
        if (questions.length === 0) {
            return res.status(404).json({ message: '问题不存在' });
        }
        
        // 获取回答列表
        const [answers] = await pool.query(
            `SELECT a.*, u.username as author_name, u.avatar as author_avatar
            FROM answers a
            JOIN users u ON a.author_id = u.id
            WHERE a.question_id = ?
            ORDER BY a.is_accepted DESC, a.vote_count DESC, a.created_at ASC`,
            [questionId]
        );
        
        res.json({
            question: questions[0],
            answers
        });
    } catch (error) {
        console.error('Error getting question:', error);
        res.status(500).json({ message: '获取问题失败' });
    }
});

// 创建问题
router.post('/questions', authenticateToken, async (req, res) => {
    try {
        const { title, content, category_id, tags, bounty_coins = 0 } = req.body;
        const authorId = req.user.id;
        
        // 检查金币是否足够
        if (bounty_coins > 0) {
            const [user] = await pool.query(
                'SELECT coins FROM users WHERE id = ?',
                [authorId]
            );
            
            if (user[0].coins < bounty_coins) {
                return res.status(400).json({ message: '金币不足' });
            }
            
            // 扣除金币
            await pool.query(
                'UPDATE users SET coins = coins - ? WHERE id = ?',
                [bounty_coins, authorId]
            );
        }
        
        const [result] = await pool.query(
            'INSERT INTO questions (title, content, author_id, category_id, tags, bounty_coins) VALUES (?, ?, ?, ?, ?, ?)',
            [title, content, authorId, category_id, JSON.stringify(tags || []), bounty_coins]
        );
        
        res.json({
            message: '问题创建成功',
            question_id: result.insertId
        });
    } catch (error) {
        console.error('Error creating question:', error);
        res.status(500).json({ message: '创建问题失败' });
    }
});

// 更新问题
router.put('/questions/:id', authenticateToken, async (req, res) => {
    try {
        const questionId = parseInt(req.params.id);
        const { title, content, category_id, tags } = req.body;
        
        // 检查权限
        const [existing] = await pool.query(
            'SELECT author_id, is_resolved FROM questions WHERE id = ?',
            [questionId]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ message: '问题不存在' });
        }
        
        if (existing[0].author_id !== req.user.id) {
            return res.status(403).json({ message: '无权修改此问题' });
        }
        
        if (existing[0].is_resolved) {
            return res.status(400).json({ message: '已解决的问题不能修改' });
        }
        
        await pool.query(
            'UPDATE questions SET title = ?, content = ?, category_id = ?, tags = ? WHERE id = ?',
            [title, content, category_id, JSON.stringify(tags || []), questionId]
        );
        
        res.json({ message: '问题更新成功' });
    } catch (error) {
        console.error('Error updating question:', error);
        res.status(500).json({ message: '更新问题失败' });
    }
});

// 删除问题
router.delete('/questions/:id', authenticateToken, async (req, res) => {
    try {
        const questionId = parseInt(req.params.id);
        
        // 检查权限
        const [existing] = await pool.query(
            'SELECT author_id, bounty_coins FROM questions WHERE id = ?',
            [questionId]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ message: '问题不存在' });
        }
        
        if (existing[0].author_id !== req.user.id) {
            return res.status(403).json({ message: '无权删除此问题' });
        }
        
        // 退还未使用的赏金
        if (existing[0].bounty_coins > 0) {
            await pool.query(
                'UPDATE users SET coins = coins + ? WHERE id = ?',
                [existing[0].bounty_coins, req.user.id]
            );
        }
        
        // 删除回答
        await pool.query('DELETE FROM answers WHERE question_id = ?', [questionId]);
        
        // 删除问题
        await pool.query('DELETE FROM questions WHERE id = ?', [questionId]);
        
        res.json({ message: '问题删除成功' });
    } catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ message: '删除问题失败' });
    }
});

// 创建回答
router.post('/questions/:id/answers', authenticateToken, async (req, res) => {
    try {
        const questionId = parseInt(req.params.id);
        const { content } = req.body;
        const authorId = req.user.id;
        
        // 检查问题是否存在
        const [question] = await pool.query(
            'SELECT is_resolved FROM questions WHERE id = ?',
            [questionId]
        );
        
        if (question.length === 0) {
            return res.status(404).json({ message: '问题不存在' });
        }
        
        if (question[0].is_resolved) {
            return res.status(400).json({ message: '已解决的问题不能回答' });
        }
        
        const [result] = await pool.query(
            'INSERT INTO answers (question_id, author_id, content) VALUES (?, ?, ?)',
            [questionId, authorId, content]
        );
        
        // 更新问题回答数
        await pool.query(
            'UPDATE questions SET answer_count = answer_count + 1 WHERE id = ?',
            [questionId]
        );
        
        res.json({
            message: '回答创建成功',
            answer_id: result.insertId
        });
    } catch (error) {
        console.error('Error creating answer:', error);
        res.status(500).json({ message: '创建回答失败' });
    }
});

// 采纳回答
router.post('/answers/:id/accept', authenticateToken, async (req, res) => {
    try {
        const answerId = parseInt(req.params.id);
        
        // 获取回答信息
        const [answers] = await pool.query(
            `SELECT a.*, q.author_id as question_author_id, q.bounty_coins
            FROM answers a
            JOIN questions q ON a.question_id = q.id
            WHERE a.id = ?`,
            [answerId]
        );
        
        if (answers.length === 0) {
            return res.status(404).json({ message: '回答不存在' });
        }
        
        const answer = answers[0];
        
        // 检查权限
        if (answer.question_author_id !== req.user.id) {
            return res.status(403).json({ message: '只有提问者可以采纳回答' });
        }
        
        if (answer.is_accepted) {
            return res.status(400).json({ message: '已经采纳过回答了' });
        }
        
        // 标记回答为已采纳
        await pool.query(
            'UPDATE answers SET is_accepted = TRUE WHERE id = ?',
            [answerId]
        );
        
        // 标记问题为已解决
        await pool.query(
            'UPDATE questions SET is_resolved = TRUE, best_answer_id = ? WHERE id = ?',
            [answerId, answer.question_id]
        );
        
        // 发放赏金
        if (answer.bounty_coins > 0) {
            await pool.query(
                'UPDATE users SET coins = coins + ? WHERE id = ?',
                [answer.bounty_coins, answer.author_id]
            );
        }
        
        res.json({ message: '回答已采纳' });
    } catch (error) {
        console.error('Error accepting answer:', error);
        res.status(500).json({ message: '采纳回答失败' });
    }
});

// 投票回答
router.post('/answers/:id/vote', authenticateToken, async (req, res) => {
    try {
        const answerId = parseInt(req.params.id);
        const { vote_type } = req.body; // up, down
        
        // 这里可以实现类似的投票逻辑
        // 为简化，暂时返回成功
        res.json({ message: '投票成功' });
    } catch (error) {
        console.error('Error voting answer:', error);
        res.status(500).json({ message: '投票失败' });
    }
});

// ============================================
// 评论置顶功能
// ============================================

// 获取置顶评论
router.get('/pinned-comments/:articleId', async (req, res) => {
    try {
        const articleId = parseInt(req.params.articleId);
        
        const [rows] = await pool.query(
            `SELECT pc.*, c.content, c.created_at as comment_created_at,
                u.username as author_name, u.avatar as author_avatar,
                pin_user.username as pinned_by_name
            FROM pinned_comments pc
            JOIN comments c ON pc.comment_id = c.id
            JOIN users u ON c.author_id = u.id
            JOIN users pin_user ON pc.pinned_by = pin_user.id
            WHERE pc.article_id = ?
            ORDER BY pc.pinned_at DESC`,
            [articleId]
        );
        
        res.json({ pinned_comments: rows });
    } catch (error) {
        console.error('Error getting pinned comments:', error);
        res.status(500).json({ message: '获取置顶评论失败' });
    }
});

// 置顶评论（需要管理员或文章作者权限）
router.post('/comments/:id/pin', authenticateToken, async (req, res) => {
    try {
        const commentId = parseInt(req.params.id);
        const { pin_reason } = req.body;
        const userId = req.user.id;
        
        // 获取评论和文章信息
        const [comments] = await pool.query(
            `SELECT c.*, a.author_id as article_author_id
            FROM comments c
            JOIN articles a ON c.article_id = a.id
            WHERE c.id = ?`,
            [commentId]
        );
        
        if (comments.length === 0) {
            return res.status(404).json({ message: '评论不存在' });
        }
        
        const comment = comments[0];
        
        // 检查权限（文章作者或管理员）
        const [users] = await pool.query(
            'SELECT role FROM users WHERE id = ?',
            [userId]
        );
        
        const isAdmin = users[0]?.role === 'admin';
        const isAuthor = comment.article_author_id === userId;
        
        if (!isAdmin && !isAuthor) {
            return res.status(403).json({ message: '无权置顶此评论' });
        }
        
        // 检查是否已置顶
        const [existing] = await pool.query(
            'SELECT id FROM pinned_comments WHERE comment_id = ?',
            [commentId]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ message: '该评论已被置顶' });
        }
        
        // 创建置顶
        await pool.query(
            'INSERT INTO pinned_comments (comment_id, article_id, pinned_by, pin_reason) VALUES (?, ?, ?, ?)',
            [commentId, comment.article_id, userId, pin_reason]
        );
        
        res.json({ message: '评论已置顶' });
    } catch (error) {
        console.error('Error pinning comment:', error);
        res.status(500).json({ message: '置顶评论失败' });
    }
});

// 取消置顶
router.delete('/comments/:id/unpin', authenticateToken, async (req, res) => {
    try {
        const commentId = parseInt(req.params.id);
        const userId = req.user.id;
        
        // 获取置顶信息
        const [pinned] = await pool.query(
            `SELECT pc.*, a.author_id as article_author_id
            FROM pinned_comments pc
            JOIN articles a ON pc.article_id = a.id
            WHERE pc.comment_id = ?`,
            [commentId]
        );
        
        if (pinned.length === 0) {
            return res.status(404).json({ message: '置顶记录不存在' });
        }
        
        // 检查权限
        const [users] = await pool.query(
            'SELECT role FROM users WHERE id = ?',
            [userId]
        );
        
        const isAdmin = users[0]?.role === 'admin';
        const isAuthor = pinned[0].article_author_id === userId;
        const isPinner = pinned[0].pinned_by === userId;
        
        if (!isAdmin && !isAuthor && !isPinner) {
            return res.status(403).json({ message: '无权取消置顶' });
        }
        
        await pool.query(
            'DELETE FROM pinned_comments WHERE comment_id = ?',
            [commentId]
        );
        
        res.json({ message: '已取消置顶' });
    } catch (error) {
        console.error('Error unpinning comment:', error);
        res.status(500).json({ message: '取消置顶失败' });
    }
});

module.exports = router;