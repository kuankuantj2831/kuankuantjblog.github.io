const express = require('express');
const router = express.Router();
const multer = require('multer');
const COS = require('cos-nodejs-sdk-v5');
const crypto = require('crypto');
const { verifyToken } = require('../middleware/auth');
const { pool } = require('../db');

// Use memory storage for processing before upload to COS
// Limit file size to 50MB to avoid memory issues (Node.js/SCF limits)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Initialize COS
const cos = new COS({
    SecretId: process.env.COS_SECRET_ID,
    SecretKey: process.env.COS_SECRET_KEY
});

const BUCKET = process.env.COS_BUCKET;
const REGION = process.env.COS_REGION;

// Helper to check if COS is configured
const checkCOSConfig = (req, res, next) => {
    if (!process.env.COS_SECRET_ID || !process.env.COS_BUCKET) {
        return res.status(500).json({ message: 'Server COS configuration missing' });
    }
    next();
};

// Helper to fix Chinese filename encoding (latin1 -> utf8)
const fixEncoding = (name) => {
    try {
        return Buffer.from(name, 'latin1').toString('utf8');
    } catch (e) {
        return name;
    }
};

// 获取用户文件前缀（用户隔离目录）
const getUserPrefix = (userId) => `users/${userId}/`;

// POST /sign - 签发 COS 直传签名（前端直传大文件用）
router.post('/sign', verifyToken, checkCOSConfig, (req, res) => {
    const { fileName, fileSize } = req.body;
    if (!fileName || typeof fileName !== 'string') {
        return res.status(400).json({ message: '缺少文件名' });
    }
    // 限制单文件 200MB
    const MAX_SIZE = 200 * 1024 * 1024;
    if (fileSize && fileSize > MAX_SIZE) {
        return res.status(400).json({ message: '文件大小不能超过 200MB' });
    }
    // 安全：清理文件名中的路径遍历字符
    const safeName = fileName.replace(/[\\\/\.\:]/g, '_').substring(0, 200);
    const key = getUserPrefix(req.userId) + safeName;

    // 生成 PUT 签名 URL（有效期 10 分钟）
    cos.getObjectUrl({
        Bucket: BUCKET,
        Region: REGION,
        Key: key,
        Method: 'PUT',
        Sign: true,
        Expires: 600,
    }, (err, data) => {
        if (err) {
            console.error('COS Sign Error:', err);
            return res.status(500).json({ message: '签名生成失败' });
        }
        res.json({ signedUrl: data.Url, key });
    });
});

// GET /list - List files for current user
router.get('/list', verifyToken, checkCOSConfig, (req, res) => {
    const userPrefix = getUserPrefix(req.userId);

    cos.getBucket({
        Bucket: BUCKET,
        Region: REGION,
        Prefix: userPrefix,
        Delimiter: '/',
    }, (err, data) => {
        if (err) {
            console.error('COS List Error:', err);
            return res.status(500).json({ message: 'Failed to list files', error: err.message });
        }

        // Transform data for frontend, strip user prefix from display name
        const files = (data.Contents || [])
            .filter(item => item.Key !== userPrefix) // 排除目录本身
            .map(item => ({
                key: item.Key,
                name: item.Key.replace(userPrefix, ''),
                size: item.Size,
                lastModified: item.LastModified,
                type: 'file'
            }));

        const folders = (data.CommonPrefixes || []).map(item => ({
            key: item.Prefix,
            name: item.Prefix.replace(userPrefix, '').replace(/\/$/, ''),
            type: 'folder'
        }));

        res.json({ files: [...folders, ...files] });
    });
});

// POST /upload - Upload file to user's COS directory
router.post('/upload', verifyToken, checkCOSConfig, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file provided' });
    }

    // Fix Chinese characters garbled issue
    const originalName = fixEncoding(req.file.originalname);
    // 文件存储在用户隔离目录下
    const key = getUserPrefix(req.userId) + originalName;

    cos.putObject({
        Bucket: BUCKET,
        Region: REGION,
        Key: key,
        Body: req.file.buffer,
        ContentLength: req.file.size
    }, (err, data) => {
        if (err) {
            console.error('COS Upload Error:', err);
            return res.status(500).json({ message: 'Failed to upload to COS', error: err.message });
        }
        res.json({ message: 'Upload successful', key: key });
    });
});

// GET /download - Get signed URL for user's file
router.get('/download', verifyToken, checkCOSConfig, (req, res) => {
    const key = req.query.key;
    if (!key) return res.status(400).json({ message: 'Missing file key' });

    // 安全检查：确保用户只能下载自己目录的文件
    const userPrefix = getUserPrefix(req.userId);
    if (!key.startsWith(userPrefix)) {
        return res.status(403).json({ message: '无权访问此文件' });
    }

    cos.getObjectUrl({
        Bucket: BUCKET,
        Region: REGION,
        Key: key,
        Sign: true,
        Expires: 600,
    }, (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error generating link' });
        }
        res.json({ url: data.Url });
    });
});

// POST /delete - Delete user's file
router.post('/delete', verifyToken, checkCOSConfig, (req, res) => {
    const { key } = req.body;

    if (!key || typeof key !== 'string') {
        return res.status(400).json({ message: 'Missing or invalid file key' });
    }

    // 防止路径遍历攻击
    if (key.includes('..')) {
        return res.status(400).json({ message: 'Invalid file key' });
    }

    // 安全检查：确保用户只能删除自己目录的文件
    const userPrefix = getUserPrefix(req.userId);
    if (!key.startsWith(userPrefix)) {
        return res.status(403).json({ message: '无权删除此文件' });
    }

    cos.deleteObject({
        Bucket: BUCKET,
        Region: REGION,
        Key: key
    }, (err, data) => {
        if (err) {
            console.error('COS Delete Error:', err);
            return res.status(500).json({ message: 'Delete failed', error: err.message });
        }
        res.json({ message: 'Deleted successfully' });
    });
});

// --- 文件分享功能 ---

// 创建分享链接
router.post('/share', verifyToken, checkCOSConfig, async (req, res) => {
    try {
        const { fileKey, fileName, password, expiresHours, maxDownloads } = req.body;

        if (!fileKey || !fileName) {
            return res.status(400).json({ message: '缺少必要参数' });
        }

        // 安全检查
        const userPrefix = getUserPrefix(req.userId);
        if (!fileKey.startsWith(userPrefix)) {
            return res.status(403).json({ message: '无权分享此文件' });
        }

        const shareCode = crypto.randomBytes(6).toString('hex');
        let expiresAt = null;
        if (expiresHours && parseInt(expiresHours) > 0) {
            expiresAt = new Date(Date.now() + parseInt(expiresHours) * 3600000);
        }

        await pool.query(
            'INSERT INTO file_shares (user_id, share_code, file_key, file_name, password, expires_at, max_downloads) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.userId, shareCode, fileKey, fileName, password || null, expiresAt, maxDownloads ? parseInt(maxDownloads) : null]
        );

        res.json({
            message: '分享链接已创建',
            shareCode,
            shareUrl: `/share.html?code=${shareCode}`
        });
    } catch (error) {
        console.error('创建分享失败:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 获取我的分享列表
router.get('/shares', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, share_code, file_name, password IS NOT NULL as has_password, expires_at, max_downloads, download_count, created_at FROM file_shares WHERE user_id = ? ORDER BY created_at DESC',
            [req.userId]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 删除分享
router.delete('/share/:shareCode', verifyToken, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM file_shares WHERE share_code = ? AND user_id = ?',
            [req.params.shareCode, req.userId]
        );
        res.json({ message: '已删除' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 获取分享信息（公开接口，不需要登录）
router.get('/share/:shareCode', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT fs.*, u.username as sharer_name FROM file_shares fs JOIN users u ON u.id = fs.user_id WHERE fs.share_code = ?',
            [req.params.shareCode]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: '分享不存在或已删除' });
        }

        const share = rows[0];

        // 检查是否过期
        if (share.expires_at && new Date(share.expires_at) < new Date()) {
            return res.status(410).json({ message: '分享链接已过期' });
        }

        // 检查下载次数
        if (share.max_downloads && share.download_count >= share.max_downloads) {
            return res.status(410).json({ message: '下载次数已达上限' });
        }

        res.json({
            fileName: share.file_name,
            sharerName: share.sharer_name,
            hasPassword: !!share.password,
            createdAt: share.created_at,
            expiresAt: share.expires_at,
            downloadCount: share.download_count,
            maxDownloads: share.max_downloads
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 下载分享文件（公开接口）
router.post('/share/:shareCode/download', checkCOSConfig, async (req, res) => {
    try {
        const { password } = req.body;
        const [rows] = await pool.query(
            'SELECT * FROM file_shares WHERE share_code = ?',
            [req.params.shareCode]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: '分享不存在' });
        }

        const share = rows[0];

        if (share.expires_at && new Date(share.expires_at) < new Date()) {
            return res.status(410).json({ message: '分享链接已过期' });
        }

        if (share.max_downloads && share.download_count >= share.max_downloads) {
            return res.status(410).json({ message: '下载次数已达上限' });
        }

        if (share.password && share.password !== password) {
            return res.status(403).json({ message: '密码错误' });
        }

        // 生成签名下载链接
        cos.getObjectUrl({
            Bucket: BUCKET,
            Region: REGION,
            Key: share.file_key,
            Sign: true,
            Expires: 300,
        }, async (err, data) => {
            if (err) {
                return res.status(500).json({ message: '生成下载链接失败' });
            }

            // 增加下载计数
            await pool.query(
                'UPDATE file_shares SET download_count = download_count + 1 WHERE id = ?',
                [share.id]
            );

            res.json({ url: data.Url, fileName: share.file_name });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
