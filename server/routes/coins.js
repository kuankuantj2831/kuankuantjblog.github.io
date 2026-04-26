const express = require('express');
const { pool } = require('../db');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// 硬币奖励配置
const COIN_REWARDS = {
    checkin_weekday: 0.5,    // 工作日签到奖励
    checkin_weekend: 1,      // 周末签到奖励（x2）
    publish_article: 5,      // 发布文章奖励
    article_liked: 1,        // 文章被点赞奖励
    comment_article: 1,      // 评论文章奖励
};

/**
 * 确保用户有硬币记录（如果没有则创建）
 */
async function ensureUserCoins(userId) {
    await pool.query(
        'INSERT IGNORE INTO user_coins (user_id, balance) VALUES (?, 0)',
        [userId]
    );
}

/**
 * 记录交易并更新余额
 */
async function addTransaction(userId, amount, type, description, relatedId = null) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 确保用户记录存在
        await connection.query(
            'INSERT IGNORE INTO user_coins (user_id, balance) VALUES (?, 0)',
            [userId]
        );

        // 更新余额
        if (amount > 0) {
            await connection.query(
                'UPDATE user_coins SET balance = balance + ?, total_earned = total_earned + ? WHERE user_id = ?',
                [amount, amount, userId]
            );
        } else if (amount < 0) {
            // 检查余额是否足够
            const [rows] = await connection.query(
                'SELECT balance FROM user_coins WHERE user_id = ?',
                [userId]
            );
            if (rows.length === 0 || rows[0].balance < Math.abs(amount)) {
                await connection.rollback();
                return { success: false, message: '硬币余额不足' };
            }
            await connection.query(
                'UPDATE user_coins SET balance = balance + ?, total_spent = total_spent + ? WHERE user_id = ?',
                [amount, Math.abs(amount), userId]
            );
        }

        // 记录交易
        await connection.query(
            'INSERT INTO coin_transactions (user_id, amount, type, description, related_id) VALUES (?, ?, ?, ?, ?)',
            [userId, amount, type, description, relatedId]
        );

        await connection.commit();

        // 获取最新余额
        const [balanceRows] = await connection.query(
            'SELECT balance FROM user_coins WHERE user_id = ?',
            [userId]
        );

        return { success: true, balance: balanceRows[0].balance };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// ==================== API 路由 ====================

// GET /coins/balance - 获取用户硬币余额（增强版）
router.get('/balance', verifyToken, async (req, res) => {
    try {
        await ensureUserCoins(req.userId);

        const [rows] = await pool.query(
            'SELECT balance, total_earned, total_spent, last_checkin, checkin_streak FROM user_coins WHERE user_id = ?',
            [req.userId]
        );

        if (rows.length === 0) {
            return res.json({ balance: 0, total_earned: 0, total_spent: 0, last_checkin: null, checkin_streak: 0, checked_in_today: false, total_checkin_days: 0, month_checkin_days: 0 });
        }

        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const lastCheckin = rows[0].last_checkin ? new Date(rows[0].last_checkin).toISOString().split('T')[0] : null;
        const checkedInToday = lastCheckin === today;

        // 查询本月签到天数
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const [monthRows] = await pool.query(
            `SELECT COUNT(*) as cnt FROM coin_transactions WHERE user_id = ? AND type = 'checkin' AND created_at >= ?`,
            [req.userId, monthStart]
        );

        // 查询累计签到天数
        const [totalRows] = await pool.query(
            `SELECT COUNT(*) as cnt FROM coin_transactions WHERE user_id = ? AND type = 'checkin'`,
            [req.userId]
        );

        // 判断今天是工作日还是周末
        const dayOfWeek = now.getDay();
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        const todayReward = isWeekend ? COIN_REWARDS.checkin_weekend : COIN_REWARDS.checkin_weekday;

        res.json({
            balance: rows[0].balance,
            total_earned: rows[0].total_earned,
            total_spent: rows[0].total_spent,
            last_checkin: rows[0].last_checkin,
            checkin_streak: rows[0].checkin_streak,
            checked_in_today: checkedInToday,
            month_checkin_days: monthRows[0].cnt,
            total_checkin_days: totalRows[0].cnt,
            is_weekend: isWeekend,
            today_reward: todayReward
        });
    } catch (error) {
        console.error('Get balance error:', error);
        res.status(500).json({ message: '获取余额失败' });
    }
});

// POST /coins/checkin - 每日签到
router.post('/checkin', verifyToken, async (req, res) => {
    try {
        await ensureUserCoins(req.userId);

        const [rows] = await pool.query(
            'SELECT last_checkin, checkin_streak FROM user_coins WHERE user_id = ?',
            [req.userId]
        );

        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const lastCheckin = rows[0].last_checkin ? new Date(rows[0].last_checkin).toISOString().split('T')[0] : null;

        // 检查是否已签到
        if (lastCheckin === today) {
            return res.status(400).json({ message: '今天已经签到过了', already_checked_in: true });
        }

        // 计算连续签到天数
        let streak = rows[0].checkin_streak || 0;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastCheckin === yesterdayStr) {
            streak += 1;
        } else {
            streak = 1;
        }

        // 计算奖励：周末x2（周六=6，周日=0）
        const dayOfWeek = now.getDay();
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        const reward = isWeekend ? COIN_REWARDS.checkin_weekend : COIN_REWARDS.checkin_weekday;

        // 更新签到信息
        await pool.query(
            'UPDATE user_coins SET last_checkin = ?, checkin_streak = ? WHERE user_id = ?',
            [today, streak, req.userId]
        );

        // 添加交易记录
        const dayLabel = isWeekend ? '周末' : '工作日';
        const result = await addTransaction(
            req.userId,
            reward,
            'checkin',
            `${dayLabel}签到 (连续${streak}天) +${reward}硬币`
        );

        res.json({
            message: '签到成功！',
            reward,
            streak,
            balance: result.balance,
            is_weekend: isWeekend
        });
    } catch (error) {
        console.error('Checkin error:', error);
        res.status(500).json({ message: '签到失败' });
    }
});

// POST /coins/donate - 投币给文章
router.post('/donate', verifyToken, async (req, res) => {
    try {
        const { article_id, amount } = req.body;

        if (!article_id || !amount) {
            return res.status(400).json({ message: '缺少必要参数' });
        }

        const coinAmount = parseInt(amount);
        if (isNaN(coinAmount) || coinAmount < 1 || coinAmount > 10) {
            return res.status(400).json({ message: '投币数量必须在 1-10 之间' });
        }

        // 检查文章是否存在
        const [articles] = await pool.query(
            'SELECT id, author_id, title FROM articles WHERE id = ?',
            [article_id]
        );

        if (articles.length === 0) {
            return res.status(404).json({ message: '文章不存在' });
        }

        const article = articles[0];

        // 不能给自己的文章投币
        if (article.author_id === req.userId) {
            return res.status(400).json({ message: '不能给自己的文章投币' });
        }

        // 扣除投币者的硬币
        const deductResult = await addTransaction(
            req.userId,
            -coinAmount,
            'donate',
            `向文章「${article.title}」投了${coinAmount}枚硬币`,
            article_id
        );

        if (!deductResult.success) {
            return res.status(400).json({ message: deductResult.message });
        }

        // 给文章作者增加硬币
        await addTransaction(
            article.author_id,
            coinAmount,
            'receive',
            `文章「${article.title}」收到${coinAmount}枚硬币`,
            article_id
        );

        res.json({
            message: `成功投了${coinAmount}枚硬币！`,
            balance: deductResult.balance
        });
    } catch (error) {
        console.error('Donate error:', error);
        res.status(500).json({ message: '投币失败' });
    }
});

// GET /coins/transactions - 获取交易记录
router.get('/transactions', verifyToken, async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        const type = req.query.type; // 可选：按类型筛选

        let whereClause = 'WHERE user_id = ?';
        const params = [req.userId];

        if (type && ['checkin', 'publish', 'liked', 'comment', 'donate', 'receive', 'admin'].includes(type)) {
            whereClause += ' AND type = ?';
            params.push(type);
        }

        // 总数
        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total FROM coin_transactions ${whereClause}`,
            params
        );
        const total = countResult[0].total;

        // 分页查询
        const [rows] = await pool.query(
            `SELECT id, amount, type, description, related_id, created_at 
             FROM coin_transactions ${whereClause} 
             ORDER BY created_at DESC 
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        res.json({
            data: rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ message: '获取交易记录失败' });
    }
});

// GET /coins/article/:id - 获取文章收到的总硬币数
router.get('/article/:id', async (req, res) => {
    try {
        const articleId = parseInt(req.params.id);
        if (isNaN(articleId)) {
            return res.status(400).json({ message: '无效的文章 ID' });
        }

        const [rows] = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total_coins 
             FROM coin_transactions 
             WHERE type = 'receive' AND related_id = ?`,
            [articleId]
        );

        res.json({ total_coins: rows[0].total_coins });
    } catch (error) {
        console.error('Get article coins error:', error);
        res.status(500).json({ message: '获取文章硬币数失败' });
    }
});

// GET /coins/calendar - 获取签到日历（某月的签到记录）
router.get('/calendar', verifyToken, async (req, res) => {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const month = parseInt(req.query.month) || (new Date().getMonth() + 1);

        const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
        // 计算下个月第一天
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

        const [rows] = await pool.query(
            `SELECT DATE(created_at) as checkin_date, amount
             FROM coin_transactions
             WHERE user_id = ? AND type = 'checkin' AND created_at >= ? AND created_at < ?
             ORDER BY created_at ASC`,
            [req.userId, monthStart, monthEnd]
        );

        // 转换为日期集合
        const checkinDates = {};
        rows.forEach(row => {
            const dateStr = new Date(row.checkin_date).toISOString().split('T')[0];
            checkinDates[dateStr] = row.amount;
        });

        // 计算该月总天数
        const daysInMonth = new Date(year, month, 0).getDate();
        const checkinCount = Object.keys(checkinDates).length;
        const checkinRate = Math.round((checkinCount / daysInMonth) * 100);

        res.json({
            year,
            month,
            days_in_month: daysInMonth,
            checkin_dates: checkinDates,
            checkin_count: checkinCount,
            checkin_rate: checkinRate
        });
    } catch (error) {
        console.error('Get calendar error:', error);
        res.status(500).json({ message: '获取签到日历失败' });
    }
});

// GET /coins/leaderboard - 硬币排行榜 TOP 10
router.get('/leaderboard', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT uc.user_id, uc.balance, uc.total_earned, u.username
             FROM user_coins uc
             JOIN users u ON uc.user_id = u.id
             ORDER BY uc.balance DESC
             LIMIT 10`
        );

        const leaderboard = rows.map((row, index) => ({
            rank: index + 1,
            username: row.username,
            total_earned: row.total_earned,
            balance: row.balance
        }));

        res.json({ leaderboard });
    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ message: '获取排行榜失败' });
    }
});

// 导出路由和工具函数（供其他模块调用，如发布文章时奖励硬币）
router.addTransaction = addTransaction;
router.COIN_REWARDS = COIN_REWARDS;
module.exports = router;
