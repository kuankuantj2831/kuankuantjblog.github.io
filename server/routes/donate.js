const express = require('express');
const { pool, getUserTitle } = require('../db');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// 管理员验证中间件：复用 verifyToken 并检查角色
const requireAdmin = (req, res, next) => {
    verifyToken(req, res, (err) => {
        if (err) return; // verifyToken 已发送响应
        if (req.userRole !== 'admin_standalone' && req.userRole !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    });
};

router.get('/goal', async (req, res) => {
    try {
        const [goals] = await pool.query(
            'SELECT id, title, description, target_amount, current_amount FROM donation_goals WHERE is_active = TRUE ORDER BY id DESC LIMIT 1'
        );
        const goal = goals.length > 0 ? goals[0] : null;

        // 获取总捐助统计（从 users 表的 total_donated 汇总）
        const [stats] = await pool.query(
            `SELECT COUNT(*) as total_donors, COALESCE(SUM(total_donated), 0) as total_amount
             FROM users WHERE total_donated > 0`
        );

        res.json({
            goal,
            stats: stats[0]
        });
    } catch (error) {
        console.error('获取捐助目标失败:', error);
        res.status(500).json({ message: '获取失败' });
    }
});

/**
 * GET /donate/leaderboard - 捐助者排行榜（基于 users.total_donated）
 * Query: ?limit=20
 */
router.get('/leaderboard', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);

        const [rows] = await pool.query(
            `SELECT username as donor_name, total_donated as total_amount
             FROM users
             WHERE total_donated > 0
             ORDER BY total_donated DESC
             LIMIT ?`,
            [limit]
        );

        res.json(rows);
    } catch (error) {
        console.error('获取捐助排行榜失败:', error);
        res.status(500).json({ message: '获取失败' });
    }
});

/**
 * GET /donate/recent - 最近捐助记录（保留兼容，从 donations 表读取已确认的）
 * Query: ?limit=10
 */
router.get('/recent', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);

        const [rows] = await pool.query(
            `SELECT donor_name, amount, message, payment_method, paid_at
             FROM donations
             WHERE status = 'paid'
             ORDER BY paid_at DESC
             LIMIT ?`,
            [limit]
        );

        res.json(rows);
    } catch (error) {
        console.error('获取最近捐助失败:', error);
        res.status(500).json({ message: '获取失败' });
    }
});

// ==================== 管理接口 ====================

/**
 * POST /donate/admin/add - 管理员手动给用户增加赞助金额
 * Body: { user_id, amount, message? }
 * 
 * 流程：
 * 1. 增加 users.total_donated
 * 2. 写入 donations 表记录
 * 3. 更新 donation_goals 进度
 * 4. 返回用户最新头衔
 */
router.post('/admin/add', requireAdmin, async (req, res) => {
    try {
        const { user_id, amount, message } = req.body;

        if (!user_id || !amount) {
            return res.status(400).json({ message: '用户ID和金额必填' });
        }

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0 || numAmount > 10000) {
            return res.status(400).json({ message: '金额需在 0.01 ~ 10000 元之间' });
        }

        // 检查用户是否存在
        const [users] = await pool.query('SELECT id, username, total_donated FROM users WHERE id = ?', [user_id]);
        if (users.length === 0) {
            return res.status(404).json({ message: '用户不存在' });
        }

        const user = users[0];

        // 1. 增加用户累计赞助金额
        await pool.query(
            'UPDATE users SET total_donated = total_donated + ? WHERE id = ?',
            [numAmount, user_id]
        );

        // 2. 写入 donations 表记录
        const orderNo = 'ADMIN' + Date.now() + Math.random().toString(36).substring(2, 6).toUpperCase();
        await pool.query(
            `INSERT INTO donations (order_no, user_id, donor_name, amount, message, payment_method, status, paid_at)
             VALUES (?, ?, ?, ?, ?, 'wechat', 'paid', NOW())`,
            [orderNo, user_id, user.username, numAmount, message || '管理员手动添加']
        );

        // 3. 更新捐助目标进度
        await pool.query(
            'UPDATE donation_goals SET current_amount = current_amount + ? WHERE is_active = TRUE',
            [numAmount]
        );

        // 4. 获取更新后的用户信息
        const [updatedUser] = await pool.query('SELECT total_donated FROM users WHERE id = ?', [user_id]);
        const newTotal = parseFloat(updatedUser[0].total_donated);
        const newTitle = getUserTitle(newTotal, user.username);

        // 检查是否刚获得新头衔
        const oldTitle = getUserTitle(parseFloat(user.total_donated), user.username);
        let titleMessage = '';
        if (newTitle && newTitle !== oldTitle) {
            titleMessage = `🎉 恭喜！${user.username} 获得了 ${newTitle} 头衔！`;
        }

        console.log(`管理员为用户 ${user.username}(ID:${user_id}) 增加赞助 ¥${numAmount.toFixed(2)}，累计 ¥${newTotal.toFixed(2)}，头衔: ${newTitle || '无'}`);

        res.json({
            success: true,
            message: `已为 ${user.username} 增加 ¥${numAmount.toFixed(2)} 赞助`,
            user: {
                id: user_id,
                username: user.username,
                total_donated: newTotal,
                title: newTitle
            },
            title_message: titleMessage
        });

    } catch (error) {
        console.error('增加赞助金额失败:', error);
        res.status(500).json({ message: '操作失败' });
    }
});

/**
 * GET /donate/admin/list - 管理员查看所有捐助记录
 */
router.get('/admin/list', requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const offset = (page - 1) * limit;
        const status = req.query.status || '';

        let whereClause = '';
        const params = [];
        if (status) {
            whereClause = 'WHERE d.status = ?';
            params.push(status);
        }

        const [rows] = await pool.query(
            `SELECT d.*, u.username as user_username, u.total_donated
             FROM donations d
             LEFT JOIN users u ON d.user_id = u.id
             ${whereClause}
             ORDER BY d.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total FROM donations d ${whereClause}`,
            params
        );

        res.json({
            data: rows,
            pagination: {
                page,
                limit,
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('获取捐助列表失败:', error);
        res.status(500).json({ message: '获取失败' });
    }
});

/**
 * GET /donate/admin/users - 获取所有用户的赞助信息（用于管理后台选择用户）
 */
router.get('/admin/users', requireAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id, username, total_donated FROM users ORDER BY username ASC`
        );

        // 附加头衔信息
        const usersWithTitle = rows.map(u => ({
            ...u,
            title: getUserTitle(u.total_donated, u.username)
        }));

        res.json(usersWithTitle);
    } catch (error) {
        console.error('获取用户赞助信息失败:', error);
        res.status(500).json({ message: '获取失败' });
    }
});

/**
 * PUT /donate/admin/goal - 管理员更新捐助目标
 */
router.put('/admin/goal', requireAdmin, async (req, res) => {
    try {
        const { title, description, target_amount } = req.body;
        if (!title || !target_amount) {
            return res.status(400).json({ message: '标题和目标金额必填' });
        }

        // 将当前活跃目标设为非活跃
        await pool.query('UPDATE donation_goals SET is_active = FALSE WHERE is_active = TRUE');

        // 创建新目标
        await pool.query(
            'INSERT INTO donation_goals (title, description, target_amount) VALUES (?, ?, ?)',
            [title, description || '', parseFloat(target_amount)]
        );

        res.json({ message: '捐助目标已更新' });
    } catch (error) {
        console.error('更新捐助目标失败:', error);
        res.status(500).json({ message: '更新失败' });
    }
});

module.exports = router;
