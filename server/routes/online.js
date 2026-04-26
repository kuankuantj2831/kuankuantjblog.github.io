const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { verifyToken } = require('../middleware/auth');
const crypto = require('crypto');

// 生成访客ID：基于IP的哈希，保护隐私
function getVisitorId(req) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
    return crypto.createHash('sha256').update(ip + (req.headers['user-agent'] || '')).digest('hex').substring(0, 32);
}

// POST /online/heartbeat - 更新登录用户在线状态
router.post('/heartbeat', verifyToken, async (req, res) => {
    try {
        await pool.query(
            `INSERT INTO user_online (user_id, last_active) VALUES (?, NOW())
             ON DUPLICATE KEY UPDATE last_active = NOW()`,
            [req.userId]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Heartbeat error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /online/visitor-heartbeat - 更新匿名访客在线状态（无需认证）
router.post('/visitor-heartbeat', async (req, res) => {
    try {
        const visitorId = getVisitorId(req);
        await pool.query(
            `INSERT INTO visitor_online (visitor_id, last_active) VALUES (?, NOW())
             ON DUPLICATE KEY UPDATE last_active = NOW()`,
            [visitorId]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Visitor heartbeat error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /online/status?userIds=1,2,3 - 查询用户在线状态
router.get('/status', async (req, res) => {
    try {
        const { userIds } = req.query;
        if (!userIds) return res.json({ online: {} });

        const ids = userIds.split(',').map(Number).filter(id => Number.isInteger(id) && id > 0).slice(0, 100);
        if (ids.length === 0) return res.json({ online: {} });

        const placeholders = ids.map(() => '?').join(',');
        const [rows] = await pool.query(
            `SELECT user_id, last_active FROM user_online
             WHERE user_id IN (${placeholders}) AND last_active > DATE_SUB(NOW(), INTERVAL 5 MINUTE)`,
            ids
        );

        const online = {};
        rows.forEach(row => { online[row.user_id] = true; });
        res.json({ online });
    } catch (error) {
        console.error('Online status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /online/count - 获取当前在线人数（所有访客，基于visitor_online表）
router.get('/count', async (req, res) => {
    try {
        const [[{ count }]] = await pool.query(
            `SELECT COUNT(*) as count FROM visitor_online WHERE last_active > DATE_SUB(NOW(), INTERVAL 5 MINUTE)`
        );
        // 定期清理过期记录
        pool.query(`DELETE FROM visitor_online WHERE last_active < DATE_SUB(NOW(), INTERVAL 1 HOUR)`).catch(() => {});
        res.json({ count });
    } catch (error) {
        console.error('Online count error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
