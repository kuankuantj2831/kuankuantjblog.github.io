const express = require('express');
const { pool } = require('../db');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// 每日任务模板
const TASK_TEMPLATES = [
    { id: 1, title: '每日登录', description: '登录网站', reward: 5, type: 'login' },
    { id: 2, title: '发布文章', description: '发布一篇新文章', reward: 20, type: 'publish' },
    { id: 3, title: '点赞文章', description: '给3篇文章点赞', reward: 10, type: 'like' },
    { id: 4, title: '评论文章', description: '发表5条评论', reward: 15, type: 'comment' },
    { id: 5, title: '玩游戏', description: '玩任意小游戏5分钟', reward: 25, type: 'game' }
];

// 获取用户每日任务
router.get('/daily', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        const today = new Date().toISOString().split('T')[0];

        // 检查今日任务是否已生成
        const [existing] = await pool.query(
            'SELECT * FROM user_daily_tasks WHERE user_id = ? AND date = ?',
            [userId, today]
        );

        let tasks = [];
        if (existing.length === 0) {
            // 生成今日任务（随机选择3个）
            const selectedTasks = TASK_TEMPLATES.sort(() => 0.5 - Math.random()).slice(0, 3);

            for (const template of selectedTasks) {
                await pool.query(
                    'INSERT INTO user_daily_tasks (user_id, task_id, title, description, reward, type, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [userId, template.id, template.title, template.description, template.reward, template.type, today]
                );
            }
        }

        // 获取今日任务状态
        const [taskRows] = await pool.query(
            'SELECT * FROM user_daily_tasks WHERE user_id = ? AND date = ?',
            [userId, today]
        );

        tasks = taskRows.map(task => ({
            id: task.id,
            task_id: task.task_id,
            title: task.title,
            description: task.description,
            reward: task.reward,
            type: task.type,
            completed: task.completed
        }));

        res.json({ tasks });
    } catch (error) {
        console.error('获取每日任务失败:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 完成任务
router.post('/complete/:taskId', verifyToken, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const userId = req.userId;
        const taskId = req.params.taskId;

        await conn.beginTransaction();

        // SELECT ... FOR UPDATE 防止并发重复完成
        const [taskRows] = await conn.query(
            'SELECT * FROM user_daily_tasks WHERE id = ? AND user_id = ? AND completed = FALSE FOR UPDATE',
            [taskId, userId]
        );

        if (taskRows.length === 0) {
            await conn.rollback();
            return res.status(400).json({ message: '任务不存在或已完成' });
        }

        const task = taskRows[0];

        // 标记任务完成
        await conn.query(
            'UPDATE user_daily_tasks SET completed = TRUE, completed_at = NOW() WHERE id = ?',
            [taskId]
        );

        // 发放奖励
        await conn.query(
            'INSERT INTO coin_transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)',
            [userId, task.reward, 'task', `完成每日任务: ${task.title}`]
        );

        // 更新用户硬币余额
        await conn.query(
            'UPDATE user_coins SET balance = balance + ?, total_earned = total_earned + ? WHERE user_id = ?',
            [task.reward, task.reward, userId]
        );

        await conn.commit();
        res.json({ message: '任务完成', reward: task.reward });
    } catch (error) {
        await conn.rollback();
        console.error('完成任务失败:', error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        conn.release();
    }
});

module.exports = router;