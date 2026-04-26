const express = require('express');
const { pool } = require('../db');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// 提交分数
router.post('/scores', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { gameName, score, playTime } = req.body;

        if (!gameName || score === undefined || score === null) {
            return res.status(400).json({ message: '缺少必要参数' });
        }

        const safeScore = Math.max(0, Math.min(parseInt(score) || 0, 999999));
        const safeTime = Math.max(0, Math.min(parseInt(playTime) || 0, 86400));

        await pool.query(
            'INSERT INTO game_scores (user_id, game_name, score, play_time) VALUES (?, ?, ?, ?)',
            [userId, gameName, safeScore, safeTime]
        );

        res.status(201).json({ message: '分数已提交' });
    } catch (error) {
        console.error('提交分数失败:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 获取排行榜（某游戏 Top N）
router.get('/leaderboard/:gameName', async (req, res) => {
    try {
        const gameName = req.params.gameName;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);

        const [rows] = await pool.query(`
            SELECT gs.score, gs.play_time, gs.created_at, u.username, u.avatar_url
            FROM game_scores gs
            JOIN users u ON u.id = gs.user_id
            WHERE gs.game_name = ?
            ORDER BY gs.score DESC, gs.play_time ASC
            LIMIT ?
        `, [gameName, limit]);

        res.json(rows);
    } catch (error) {
        console.error('获取排行榜失败:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 获取用户个人最高分
router.get('/my-best/:gameName', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT MAX(score) as best_score, COUNT(*) as play_count FROM game_scores WHERE user_id = ? AND game_name = ?',
            [req.userId, req.params.gameName]
        );
        res.json(rows[0] || { best_score: 0, play_count: 0 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 获取用户某游戏历史记录
router.get('/my-history/:gameName', verifyToken, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const [rows] = await pool.query(
            'SELECT score, play_time, created_at FROM game_scores WHERE user_id = ? AND game_name = ? ORDER BY created_at DESC LIMIT ?',
            [req.userId, req.params.gameName, limit]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
