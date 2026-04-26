/**
 * 多媒体功能路由
 * 包含：视频文章、音频播客、图库增强、直播功能
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../db');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: '未提供认证令牌' });
    try {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        return res.status(403).json({ message: '令牌无效' });
    }
};

// ========== 视频文章 ==========

// 添加视频到文章
router.post('/articles/:id/video', authenticateToken, async (req, res) => {
    try {
        const articleId = req.params.id;
        const { video_url, video_platform, video_id, thumbnail_url, duration } = req.body;
        
        // 验证文章所有权
        const [article] = await pool.query('SELECT author_id FROM articles WHERE id = ?', [articleId]);
        if (article.length === 0) return res.status(404).json({ message: '文章不存在' });
        if (article[0].author_id !== req.user.id && !req.user.is_admin) {
            return res.status(403).json({ message: '无权操作' });
        }

        await pool.query(
            `INSERT INTO article_videos (article_id, video_url, video_platform, video_id, thumbnail_url, duration)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE video_url = ?, video_platform = ?, video_id = ?, thumbnail_url = ?, duration = ?`,
            [articleId, video_url, video_platform, video_id, thumbnail_url, duration,
             video_url, video_platform, video_id, thumbnail_url, duration]
        );

        res.json({ message: '视频添加成功' });
    } catch (error) {
        console.error('添加视频错误:', error);
        res.status(500).json({ message: '添加失败' });
    }
});

// 获取文章视频
router.get('/articles/:id/video', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM article_videos WHERE article_id = ?',
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ message: '无视频' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: '获取失败' });
    }
});

// 增加视频观看次数
router.post('/videos/:id/view', async (req, res) => {
    try {
        await pool.query(
            'UPDATE article_videos SET views = views + 1 WHERE id = ?',
            [req.params.id]
        );
        res.json({ message: 'OK' });
    } catch (error) {
        res.status(500).json({ message: '更新失败' });
    }
});

// ========== 音频播客 ==========

// 创建播客
router.post('/podcasts', authenticateToken, async (req, res) => {
    try {
        const { title, description, audio_url, cover_image, duration, file_size, category, tags } = req.body;
        
        const [result] = await pool.query(
            `INSERT INTO podcasts (author_id, author_name, title, description, audio_url, cover_image, duration, file_size, category, tags)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, req.user.username, title, description, audio_url, cover_image, duration, file_size, category, JSON.stringify(tags || [])]
        );

        res.json({ id: result.insertId, message: '播客创建成功' });
    } catch (error) {
        console.error('创建播客错误:', error);
        res.status(500).json({ message: '创建失败' });
    }
});

// 获取播客列表
router.get('/podcasts', async (req, res) => {
    try {
        const { category, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        let query = 'SELECT * FROM podcasts WHERE is_published = TRUE';
        const params = [];
        
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        
        query += ' ORDER BY published_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [rows] = await pool.query(query, params);
        res.json({ podcasts: rows });
    } catch (error) {
        res.status(500).json({ message: '获取失败' });
    }
});

// 获取播客详情
router.get('/podcasts/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM podcasts WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: '播客不存在' });
        
        // 增加播放次数
        await pool.query('UPDATE podcasts SET play_count = play_count + 1 WHERE id = ?', [req.params.id]);
        
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: '获取失败' });
    }
});

// 订阅播客
router.post('/podcasts/:id/subscribe', authenticateToken, async (req, res) => {
    try {
        const podcastId = req.params.id;
        const [podcast] = await pool.query('SELECT author_id FROM podcasts WHERE id = ?', [podcastId]);
        
        if (podcast.length === 0) return res.status(404).json({ message: '播客不存在' });
        
        await pool.query(
            'INSERT INTO podcast_subscriptions (user_id, author_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE created_at = NOW()',
            [req.user.id, podcast[0].author_id]
        );
        
        res.json({ message: '订阅成功' });
    } catch (error) {
        res.status(500).json({ message: '订阅失败' });
    }
});

// 更新播放进度
router.post('/podcasts/:id/progress', authenticateToken, async (req, res) => {
    try {
        const { progress, completed } = req.body;
        
        await pool.query(
            `INSERT INTO podcast_play_history (user_id, podcast_id, progress, completed)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE progress = ?, completed = ?, updated_at = NOW()`,
            [req.user.id, req.params.id, progress, completed, progress, completed]
        );
        
        res.json({ message: '进度更新成功' });
    } catch (error) {
        res.status(500).json({ message: '更新失败' });
    }
});

// ========== 图库增强 ==========

// 保存图片EXIF信息
router.post('/images/exif', authenticateToken, async (req, res) => {
    try {
        const { image_url, article_id, exif_data } = req.body;
        
        await pool.query(
            `INSERT INTO image_exif (image_url, article_id, camera_make, camera_model, lens_model, 
             focal_length, aperture, shutter_speed, iso, taken_at, gps_latitude, gps_longitude, gps_altitude)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE camera_make = ?, camera_model = ?, lens_model = ?`,
            [image_url, article_id, exif_data.camera_make, exif_data.camera_model, exif_data.lens_model,
             exif_data.focal_length, exif_data.aperture, exif_data.shutter_speed, exif_data.iso,
             exif_data.taken_at, exif_data.gps_latitude, exif_data.gps_longitude, exif_data.gps_altitude,
             exif_data.camera_make, exif_data.camera_model, exif_data.lens_model]
        );
        
        res.json({ message: 'EXIF信息保存成功' });
    } catch (error) {
        console.error('保存EXIF错误:', error);
        res.status(500).json({ message: '保存失败' });
    }
});

// 获取图片EXIF信息
router.get('/images/exif', async (req, res) => {
    try {
        const { url, article_id } = req.query;
        
        let query = 'SELECT * FROM image_exif WHERE 1=1';
        const params = [];
        
        if (url) {
            query += ' AND image_url = ?';
            params.push(url);
        }
        if (article_id) {
            query += ' AND article_id = ?';
            params.push(article_id);
        }
        
        const [rows] = await pool.query(query, params);
        res.json({ exif_list: rows });
    } catch (error) {
        res.status(500).json({ message: '获取失败' });
    }
});

// ========== 直播功能 ==========

// 创建直播房间
router.post('/live/rooms', authenticateToken, async (req, res) => {
    try {
        const { title, description, category } = req.body;
        const roomId = generateRoomId();
        
        // 这里应集成实际的直播服务（如Agora、腾讯云直播等）
        // 简化示例，仅创建房间记录
        
        res.json({
            room_id: roomId,
            title,
            stream_key: generateStreamKey(),
            push_url: `rtmp://live.example.com/live/${roomId}`,
            play_url: `https://live.example.com/play/${roomId}.flv`,
            message: '直播房间创建成功'
        });
    } catch (error) {
        res.status(500).json({ message: '创建失败' });
    }
});

// 获取直播房间信息
router.get('/live/rooms/:id', async (req, res) => {
    try {
        // 应从实际的直播服务获取状态
        res.json({
            room_id: req.params.id,
            status: 'live', // live|offline
            viewer_count: 0,
            start_time: new Date()
        });
    } catch (error) {
        res.status(500).json({ message: '获取失败' });
    }
});

// 生成房间ID和流密钥
function generateRoomId() {
    return 'room_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateStreamKey() {
    return Math.random().toString(36).substr(2, 15) + Math.random().toString(36).substr(2, 15);
}

module.exports = router;
