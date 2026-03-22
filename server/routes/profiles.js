const express = require('express');
const multer = require('multer');
const COS = require('cos-nodejs-sdk-v5');
const crypto = require('crypto');
const { pool, getUserLevel } = require('../db');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// 图片魔法字节签名（用于验证真实文件类型）
const MAGIC_BYTES = {
    'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
    'image/png':  [Buffer.from([0x89, 0x50, 0x4E, 0x47])],
    'image/gif':  [Buffer.from('GIF87a'), Buffer.from('GIF89a')],
    'image/webp': [Buffer.from('RIFF')],  // RIFF....WEBP
};

function detectImageType(buffer) {
    for (const [mime, signatures] of Object.entries(MAGIC_BYTES)) {
        for (const sig of signatures) {
            if (buffer.length >= sig.length && buffer.subarray(0, sig.length).equals(sig)) {
                if (mime === 'image/webp') {
                    // WEBP 需要额外检查第 8-12 字节
                    if (buffer.length >= 12 && buffer.subarray(8, 12).toString() === 'WEBP') return mime;
                    continue;
                }
                return mime;
            }
        }
    }
    return null;
}

const MIME_TO_EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp' };

// 头像上传配置：限制 2MB，仅允许图片 MIME
const avatarUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /^image\/(jpeg|png|gif|webp)$/;
        if (allowed.test(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传 JPG/PNG/GIF/WebP 图片'));
        }
    }
});

// COS 实例
const cos = new COS({
    SecretId: process.env.COS_SECRET_ID,
    SecretKey: process.env.COS_SECRET_KEY
});
const BUCKET = process.env.COS_BUCKET;
const REGION = process.env.COS_REGION;

// Search users (public, no auth required)
router.get('/search', async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        if (!q) {
            // No keyword: return latest 20 users
            const [rows] = await pool.query(
                'SELECT id, username, avatar_url, created_at FROM users ORDER BY created_at DESC LIMIT 20'
            );
            return res.json({ data: rows, total: rows.length });
        }
        const keyword = `%${q}%`;
        const [rows] = await pool.query(
            'SELECT id, username, avatar_url, created_at FROM users WHERE username LIKE ? LIMIT 20',
            [keyword]
        );
        res.json({ data: rows, total: rows.length });
    } catch (error) {
        console.error('User search error:', error);
        res.status(500).json({ message: 'Search failed' });
    }
});

// Get profile (from users table)
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, username, email, phone, avatar_url, role, is_2fa_enabled, total_donated, created_at FROM users WHERE id = ?',
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        const profile = rows[0];
        const levelInfo = await getUserLevel(profile.id);

        // 判断是否为本人请求（可选认证）
        let isSelf = false;
        const token = req.headers['authorization']?.split(' ')[1];
        if (token) {
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                isSelf = decoded.id === profile.id;
            } catch (_) { /* token 无效忽略 */ }
        }

        if (isSelf) {
            res.json({ ...profile, levelInfo });
        } else {
            // 非本人：隐藏敏感字段
            const { email, phone, is_2fa_enabled, ...publicProfile } = profile;
            res.json({ ...publicProfile, levelInfo });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload avatar
router.post('/:id/avatar', verifyToken, (req, res, next) => {
    avatarUpload.single('avatar')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: '图片大小不能超过 2MB' });
            }
            return res.status(400).json({ message: err.message || '上传失败' });
        }
        next();
    });
}, async (req, res) => {
    try {
        // 只能修改自己的头像
        if (parseInt(req.params.id) !== req.userId) {
            return res.status(403).json({ message: '无权修改他人头像' });
        }

        if (!req.file) {
            return res.status(400).json({ message: '请选择图片' });
        }

        if (!process.env.COS_SECRET_ID || !BUCKET) {
            return res.status(500).json({ message: '服务器存储未配置' });
        }

        // 1. 验证文件魔法字节（防止伪造 MIME type）
        const realType = detectImageType(req.file.buffer);
        if (!realType) {
            return res.status(400).json({ message: '文件不是有效的图片格式' });
        }

        // 2. 用 sharp 重编码图片（消除恶意载荷、EXIF 注入、polyglot 攻击）
        let sharp;
        try { sharp = require('sharp'); } catch (_) { /* sharp 未安装则跳过重编码 */ }

        let outputBuffer, outputMime, outputExt;

        if (sharp) {
            // 统一转为 WebP，去除所有元数据，限制尺寸
            outputBuffer = await sharp(req.file.buffer)
                .resize(512, 512, { fit: 'cover', withoutEnlargement: true })
                .removeMetadata()
                .webp({ quality: 85 })
                .toBuffer();
            outputMime = 'image/webp';
            outputExt = '.webp';
        } else {
            // 无 sharp 时仍使用验证过的真实类型
            outputBuffer = req.file.buffer;
            outputMime = realType;
            outputExt = MIME_TO_EXT[realType] || '.jpg';
        }

        // 3. 安全文件名：仅使用 userId + 时间戳 + 随机串，不信任用户原始文件名
        const randomSuffix = crypto.randomBytes(4).toString('hex');
        const key = `avatars/${req.userId}_${Date.now()}_${randomSuffix}${outputExt}`;

        // 4. 上传到 COS，设置安全响应头
        await new Promise((resolve, reject) => {
            cos.putObject({
                Bucket: BUCKET,
                Region: REGION,
                Key: key,
                Body: outputBuffer,
                ContentType: outputMime,
                Headers: {
                    'Content-Disposition': 'inline',
                    'X-Cos-Meta-Upload-Source': 'avatar',
                    'Cache-Control': 'public, max-age=31536000'
                }
            }, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });

        const avatarUrl = `https://${BUCKET}.cos.${REGION}.myqcloud.com/${key}`;

        // 更新数据库
        await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, req.userId]);

        res.json({ message: '头像更新成功', avatar_url: avatarUrl });
    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({ message: '头像上传失败' });
    }
});

// Update profile (requires authentication, can only update own profile)
router.put('/:id', verifyToken, async (req, res) => {
    try {
        // 只能修改自己的资料
        if (parseInt(req.params.id) !== req.userId) {
            return res.status(403).json({ message: '无权修改他人资料' });
        }

        const { username } = req.body;

        const updates = [];
        const values = [];

        if (username) {
            if (username.length > 50) {
                return res.status(400).json({ message: '用户名不能超过50个字符' });
            }
            updates.push('username = ?');
            values.push(username);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        values.push(req.userId);
        await pool.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        res.json({ message: 'Profile updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
