/**
 * 文章版本历史和协作功能路由
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../utils/jwt');

// 验证JWT中间件
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: '未提供认证令牌' });
    }
    
    try {
        const decoded = jwt.verify(token, getJwtSecret());
        req.userId = decoded.userId || decoded.sub;
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: '令牌无效或已过期' });
    }
};

// 检查文章权限
const checkArticlePermission = async (req, res, next) => {
    const { articleId } = req.params;
    const userId = req.userId;
    
    try {
        // 查询文章作者
        const [rows] = await pool.query(
            'SELECT author_id FROM articles WHERE id = ?',
            [articleId]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ message: '文章不存在' });
        }
        
        // 检查是否是作者或管理员
        if (rows[0].author_id !== userId && req.user.role !== 'admin') {
            // 检查是否有协作权限
            const [collabRows] = await pool.query(
                'SELECT permission FROM article_collaborators WHERE article_id = ? AND user_id = ?',
                [articleId, userId]
            );
            
            if (collabRows.length === 0) {
                return res.status(403).json({ message: '无权访问此文章' });
            }
            
            req.collabPermission = collabRows[0].permission;
        }
        
        next();
    } catch (error) {
        console.error('检查权限失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
};

/**
 * 保存新版本
 * POST /api/articles/:articleId/versions
 */
router.post('/articles/:articleId/versions', authenticateToken, checkArticlePermission, async (req, res) => {
    const { articleId } = req.params;
    const { content, change_summary } = req.body;
    const userId = req.userId;
    
    if (!content) {
        return res.status(400).json({ message: '内容不能为空' });
    }
    
    try {
        // 获取文章当前信息
        const [articleRows] = await pool.query(
            'SELECT title, content FROM articles WHERE id = ?',
            [articleId]
        );
        
        if (articleRows.length === 0) {
            return res.status(404).json({ message: '文章不存在' });
        }
        
        const article = articleRows[0];
        
        // 获取最新版本号
        const [versionRows] = await pool.query(
            'SELECT MAX(version_number) as max_version FROM article_versions WHERE article_id = ?',
            [articleId]
        );
        
        const newVersionNumber = (versionRows[0].max_version || 0) + 1;
        const wordCount = content.length;
        
        // 保存新版本
        const [result] = await pool.query(
            `INSERT INTO article_versions 
             (article_id, user_id, version_number, title, content, change_summary, word_count) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [articleId, userId, newVersionNumber, article.title, content, change_summary || '', wordCount]
        );
        
        // 清理旧版本（只保留最近50个版本）
        await pool.query(
            `DELETE FROM article_versions 
             WHERE article_id = ? 
             AND id NOT IN (
                 SELECT id FROM (
                     SELECT id FROM article_versions 
                     WHERE article_id = ? 
                     ORDER BY version_number DESC 
                     LIMIT 50
                 ) as temp
             )`,
            [articleId, articleId]
        );
        
        res.json({
            message: '版本保存成功',
            version: {
                id: result.insertId,
                version_number: newVersionNumber,
                word_count: wordCount,
                created_at: new Date()
            }
        });
        
    } catch (error) {
        console.error('保存版本失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 获取版本列表
 * GET /api/articles/:articleId/versions
 */
router.get('/articles/:articleId/versions', authenticateToken, checkArticlePermission, async (req, res) => {
    const { articleId } = req.params;
    
    try {
        const [versions] = await pool.query(
            `SELECT v.*, u.username as editor_name 
             FROM article_versions v
             LEFT JOIN users u ON v.user_id = u.id
             WHERE v.article_id = ?
             ORDER BY v.version_number DESC
             LIMIT 50`,
            [articleId]
        );
        
        res.json({
            versions: versions.map(v => ({
                id: v.id,
                version_number: v.version_number,
                change_summary: v.change_summary,
                word_count: v.word_count,
                editor_name: v.editor_name,
                created_at: v.created_at
            }))
        });
        
    } catch (error) {
        console.error('获取版本列表失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 获取特定版本
 * GET /api/articles/:articleId/versions/:versionId
 */
router.get('/articles/:articleId/versions/:versionId', authenticateToken, checkArticlePermission, async (req, res) => {
    const { articleId, versionId } = req.params;
    
    try {
        const [versions] = await pool.query(
            `SELECT v.*, u.username as editor_name 
             FROM article_versions v
             LEFT JOIN users u ON v.user_id = u.id
             WHERE v.article_id = ? AND v.id = ?`,
            [articleId, versionId]
        );
        
        if (versions.length === 0) {
            return res.status(404).json({ message: '版本不存在' });
        }
        
        res.json({
            version: versions[0]
        });
        
    } catch (error) {
        console.error('获取版本失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 回滚到指定版本
 * POST /api/articles/:articleId/versions/:versionId/restore
 */
router.post('/articles/:articleId/versions/:versionId/restore', authenticateToken, checkArticlePermission, async (req, res) => {
    const { articleId, versionId } = req.params;
    const userId = req.userId;
    
    // 检查权限（只有作者或编辑权限可以回滚）
    if (req.collabPermission === 'view') {
        return res.status(403).json({ message: '没有编辑权限' });
    }
    
    try {
        // 获取要恢复的版本
        const [versionRows] = await pool.query(
            'SELECT * FROM article_versions WHERE article_id = ? AND id = ?',
            [articleId, versionId]
        );
        
        if (versionRows.length === 0) {
            return res.status(404).json({ message: '版本不存在' });
        }
        
        const version = versionRows[0];
        
        // 获取当前最新版本号
        const [currentVersionRows] = await pool.query(
            'SELECT MAX(version_number) as max_version FROM article_versions WHERE article_id = ?',
            [articleId]
        );
        
        const newVersionNumber = (currentVersionRows[0].max_version || 0) + 1;
        
        // 先保存当前状态为新版本（备份）
        const [currentArticle] = await pool.query(
            'SELECT title, content FROM articles WHERE id = ?',
            [articleId]
        );
        
        if (currentArticle.length > 0) {
            await pool.query(
                `INSERT INTO article_versions 
                 (article_id, user_id, version_number, title, content, change_summary, word_count) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [articleId, userId, newVersionNumber, currentArticle[0].title, 
                 currentArticle[0].content, '回滚前自动备份', currentArticle[0].content.length]
            );
        }
        
        // 更新文章内容
        await pool.query(
            'UPDATE articles SET content = ?, updated_at = NOW() WHERE id = ?',
            [version.content, articleId]
        );
        
        // 记录回滚操作
        await pool.query(
            `INSERT INTO article_versions 
             (article_id, user_id, version_number, title, content, change_summary, word_count) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [articleId, userId, newVersionNumber + 1, version.title, 
             version.content, `从版本${version.version_number}回滚`, version.word_count]
        );
        
        res.json({
            message: '回滚成功',
            article: {
                id: articleId,
                title: version.title,
                content: version.content
            }
        });
        
    } catch (error) {
        console.error('回滚版本失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 对比两个版本
 * POST /api/articles/:articleId/versions/compare
 */
router.post('/articles/:articleId/versions/compare', authenticateToken, checkArticlePermission, async (req, res) => {
    const { articleId } = req.params;
    const { versionId1, versionId2 } = req.body;
    
    try {
        // 获取两个版本的内容
        const [versions] = await pool.query(
            'SELECT id, content, version_number, created_at FROM article_versions WHERE article_id = ? AND id IN (?, ?)',
            [articleId, versionId1, versionId2]
        );
        
        if (versions.length !== 2) {
            return res.status(404).json({ message: '版本不存在' });
        }
        
        const v1 = versions.find(v => v.id == versionId1);
        const v2 = versions.find(v => v.id == versionId2);
        
        // 简单的文本对比（返回两个版本的内容，前端进行diff）
        res.json({
            version1: {
                id: v1.id,
                version_number: v1.version_number,
                created_at: v1.created_at,
                content: v1.content
            },
            version2: {
                id: v2.id,
                version_number: v2.version_number,
                created_at: v2.created_at,
                content: v2.content
            }
        });
        
    } catch (error) {
        console.error('对比版本失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 添加批注
 * POST /api/articles/:articleId/annotations
 */
router.post('/articles/:articleId/annotations', authenticateToken, checkArticlePermission, async (req, res) => {
    const { articleId } = req.params;
    const { selected_text, start_offset, end_offset, comment, version_id } = req.body;
    const userId = req.userId;
    
    if (!comment || !comment.trim()) {
        return res.status(400).json({ message: '评论内容不能为空' });
    }
    
    try {
        const [result] = await pool.query(
            `INSERT INTO article_annotations 
             (article_id, user_id, version_id, selected_text, start_offset, end_offset, comment) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [articleId, userId, version_id || null, selected_text, start_offset, end_offset, comment]
        );
        
        // 获取创建者信息
        const [userRows] = await pool.query(
            'SELECT username FROM users WHERE id = ?',
            [userId]
        );
        
        res.json({
            message: '批注添加成功',
            annotation: {
                id: result.insertId,
                selected_text,
                start_offset,
                end_offset,
                comment,
                user_id: userId,
                username: userRows[0]?.username,
                created_at: new Date()
            }
        });
        
    } catch (error) {
        console.error('添加批注失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 获取批注列表
 * GET /api/articles/:articleId/annotations
 */
router.get('/articles/:articleId/annotations', authenticateToken, checkArticlePermission, async (req, res) => {
    const { articleId } = req.params;
    const { version_id } = req.query;
    
    try {
        let query = `
            SELECT a.*, u.username, u.avatar_url
            FROM article_annotations a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.article_id = ? AND a.status = 'open'
        `;
        const params = [articleId];
        
        if (version_id) {
            query += ' AND (a.version_id = ? OR a.version_id IS NULL)';
            params.push(version_id);
        }
        
        query += ' ORDER BY a.created_at DESC';
        
        const [annotations] = await pool.query(query, params);
        
        // 获取回复
        const annotationIds = annotations.map(a => a.id);
        let replies = [];
        if (annotationIds.length > 0) {
            const [replyRows] = await pool.query(
                `SELECT a.*, u.username, u.avatar_url
                 FROM article_annotations a
                 LEFT JOIN users u ON a.user_id = u.id
                 WHERE a.parent_id IN (?) AND a.status = 'open'
                 ORDER BY a.created_at ASC`,
                [annotationIds]
            );
            replies = replyRows;
        }
        
        // 组织回复
        const annotationsWithReplies = annotations.map(a => ({
            ...a,
            replies: replies.filter(r => r.parent_id === a.id)
        }));
        
        res.json({
            annotations: annotationsWithReplies
        });
        
    } catch (error) {
        console.error('获取批注失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 更新批注状态（解决/关闭）
 * PUT /api/articles/:articleId/annotations/:annotationId
 */
router.put('/articles/:articleId/annotations/:annotationId', authenticateToken, checkArticlePermission, async (req, res) => {
    const { articleId, annotationId } = req.params;
    const { status } = req.body;
    const userId = req.userId;
    
    if (!['open', 'resolved', 'dismissed'].includes(status)) {
        return res.status(400).json({ message: '无效的状态' });
    }
    
    try {
        // 检查权限（只有批注作者或文章作者可以更新）
        const [annotationRows] = await pool.query(
            'SELECT user_id FROM article_annotations WHERE id = ? AND article_id = ?',
            [annotationId, articleId]
        );
        
        if (annotationRows.length === 0) {
            return res.status(404).json({ message: '批注不存在' });
        }
        
        const [articleRows] = await pool.query(
            'SELECT author_id FROM articles WHERE id = ?',
            [articleId]
        );
        
        if (annotationRows[0].user_id !== userId && 
            articleRows[0].author_id !== userId && 
            req.user.role !== 'admin') {
            return res.status(403).json({ message: '无权更新此批注' });
        }
        
        await pool.query(
            'UPDATE article_annotations SET status = ? WHERE id = ?',
            [status, annotationId]
        );
        
        res.json({ message: '状态更新成功' });
        
    } catch (error) {
        console.error('更新批注失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 添加协作者
 * POST /api/articles/:articleId/collaborators
 */
router.post('/articles/:articleId/collaborators', authenticateToken, checkArticlePermission, async (req, res) => {
    const { articleId } = req.params;
    const { user_id, permission } = req.body;
    const currentUserId = req.userId;
    
    // 只有文章作者可以添加协作者
    const [articleRows] = await pool.query(
        'SELECT author_id FROM articles WHERE id = ?',
        [articleId]
    );
    
    if (articleRows[0].author_id !== currentUserId && req.user.role !== 'admin') {
        return res.status(403).json({ message: '只有文章作者可以添加协作者' });
    }
    
    if (!['view', 'comment', 'edit'].includes(permission)) {
        return res.status(400).json({ message: '无效的权限类型' });
    }
    
    try {
        // 检查用户是否存在
        const [userRows] = await pool.query(
            'SELECT id, username FROM users WHERE id = ?',
            [user_id]
        );
        
        if (userRows.length === 0) {
            return res.status(404).json({ message: '用户不存在' });
        }
        
        // 添加或更新协作者
        await pool.query(
            `INSERT INTO article_collaborators (article_id, user_id, permission, invited_by) 
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE permission = ?`,
            [articleId, user_id, permission, currentUserId, permission]
        );
        
        res.json({
            message: '协作者添加成功',
            collaborator: {
                user_id,
                username: userRows[0].username,
                permission
            }
        });
        
    } catch (error) {
        console.error('添加协作者失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 获取协作者列表
 * GET /api/articles/:articleId/collaborators
 */
router.get('/articles/:articleId/collaborators', authenticateToken, checkArticlePermission, async (req, res) => {
    const { articleId } = req.params;
    
    try {
        const [collaborators] = await pool.query(
            `SELECT c.*, u.username, u.avatar_url
             FROM article_collaborators c
             LEFT JOIN users u ON c.user_id = u.id
             WHERE c.article_id = ?`,
            [articleId]
        );
        
        res.json({
            collaborators: collaborators.map(c => ({
                user_id: c.user_id,
                username: c.username,
                avatar_url: c.avatar_url,
                permission: c.permission,
                created_at: c.created_at
            }))
        });
        
    } catch (error) {
        console.error('获取协作者失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 移除协作者
 * DELETE /api/articles/:articleId/collaborators/:userId
 */
router.delete('/articles/:articleId/collaborators/:userId', authenticateToken, checkArticlePermission, async (req, res) => {
    const { articleId, userId: targetUserId } = req.params;
    const currentUserId = req.userId;
    
    // 只有文章作者可以移除协作者
    const [articleRows] = await pool.query(
        'SELECT author_id FROM articles WHERE id = ?',
        [articleId]
    );
    
    if (articleRows[0].author_id !== currentUserId && req.user.role !== 'admin') {
        return res.status(403).json({ message: '只有文章作者可以移除协作者' });
    }
    
    try {
        await pool.query(
            'DELETE FROM article_collaborators WHERE article_id = ? AND user_id = ?',
            [articleId, targetUserId]
        );
        
        res.json({ message: '协作者已移除' });
        
    } catch (error) {
        console.error('移除协作者失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 获取编辑锁（防止冲突）
 * POST /api/articles/:articleId/lock
 */
router.post('/articles/:articleId/lock', authenticateToken, async (req, res) => {
    const { articleId } = req.params;
    const userId = req.userId;
    const { username } = req.user;
    
    const lockToken = require('crypto').randomUUID();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟过期
    
    try {
        // 检查是否已有锁
        const [existingLock] = await pool.query(
            'SELECT * FROM article_edit_locks WHERE article_id = ?',
            [articleId]
        );
        
        if (existingLock.length > 0) {
            // 检查锁是否过期
            if (new Date(existingLock[0].expires_at) > new Date()) {
                // 锁未过期，检查是否是同一用户
                if (existingLock[0].user_id === userId) {
                    // 更新锁的过期时间
                    await pool.query(
                        'UPDATE article_edit_locks SET expires_at = ? WHERE article_id = ?',
                        [expiresAt, articleId]
                    );
                    return res.json({
                        locked: true,
                        lock_token: existingLock[0].lock_token,
                        message: '锁已续期'
                    });
                } else {
                    return res.status(423).json({
                        locked: false,
                        locked_by: existingLock[0].user_name,
                        message: `文章正在被 ${existingLock[0].user_name} 编辑`
                    });
                }
            }
        }
        
        // 获取或更新锁
        await pool.query(
            `INSERT INTO article_edit_locks (article_id, user_id, user_name, lock_token, expires_at)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
             user_id = VALUES(user_id), 
             user_name = VALUES(user_name), 
             lock_token = VALUES(lock_token), 
             expires_at = VALUES(expires_at)`,
            [articleId, userId, username, lockToken, expiresAt]
        );
        
        res.json({
            locked: true,
            lock_token: lockToken,
            expires_at: expiresAt
        });
        
    } catch (error) {
        console.error('获取编辑锁失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

/**
 * 释放编辑锁
 * DELETE /api/articles/:articleId/lock
 */
router.delete('/articles/:articleId/lock', authenticateToken, async (req, res) => {
    const { articleId } = req.params;
    const userId = req.userId;
    
    try {
        await pool.query(
            'DELETE FROM article_edit_locks WHERE article_id = ? AND user_id = ?',
            [articleId, userId]
        );
        
        res.json({ message: '锁已释放' });
        
    } catch (error) {
        console.error('释放编辑锁失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

module.exports = router;
