/**
 * 用户成长系统路由
 * 包含：等级/经验、成就徽章、每日任务、积分商城
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

// 获取用户等级信息
router.get('/level', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT l.*, 
                (SELECT COUNT(*) FROM exp_history WHERE user_id = ?) as exp_records,
                (SELECT SUM(exp_gained) FROM exp_history WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as weekly_exp
            FROM user_levels l 
            WHERE l.user_id = ?`,
            [req.user.id, req.user.id, req.user.id]
        );
        
        if (rows.length === 0) {
            // 创建新记录
            await pool.query(
                'INSERT INTO user_levels (user_id, level, current_exp, total_exp, next_level_exp) VALUES (?, 1, 0, 0, 100)',
                [req.user.id]
            );
            return res.json({
                level: 1,
                current_exp: 0,
                total_exp: 0,
                next_level_exp: 100,
                exp_records: 0,
                weekly_exp: 0
            });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching level:', error);
        res.status(500).json({ message: '获取等级信息失败' });
    }
});

// 获取经验值历史
router.get('/exp/history', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        
        const [rows] = await pool.query(
            `SELECT * FROM exp_history 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?`,
            [req.user.id, limit, offset]
        );
        
        const [count] = await pool.query(
            'SELECT COUNT(*) as total FROM exp_history WHERE user_id = ?',
            [req.user.id]
        );
        
        res.json({
            history: rows,
            total: count[0].total,
            page,
            totalPages: Math.ceil(count[0].total / limit)
        });
    } catch (error) {
        console.error('Error fetching exp history:', error);
        res.status(500).json({ message: '获取经验历史失败' });
    }
});

// 获取所有徽章
router.get('/badges', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM badges ORDER BY condition_value ASC');
        res.json({ badges: rows });
    } catch (error) {
        console.error('Error fetching badges:', error);
        res.status(500).json({ message: '获取徽章失败' });
    }
});

// 获取用户徽章
router.get('/badges/my', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT b.*, ub.is_equipped, ub.equipped_order, ub.earned_at
            FROM badges b
            LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = ?
            WHERE ub.id IS NOT NULL
            ORDER BY ub.earned_at DESC`,
            [req.user.id]
        );
        
        res.json({ badges: rows });
    } catch (error) {
        console.error('Error fetching user badges:', error);
        res.status(500).json({ message: '获取用户徽章失败' });
    }
});

// 装备/取消装备徽章
router.post('/badges/equip', authenticateToken, async (req, res) => {
    const { badge_id, is_equipped } = req.body;
    
    try {
        if (is_equipped) {
            // 检查已装备数量
            const [equipped] = await pool.query(
                'SELECT COUNT(*) as count FROM user_badges WHERE user_id = ? AND is_equipped = TRUE',
                [req.user.id]
            );
            
            if (equipped[0].count >= 3) {
                return res.status(400).json({ message: '最多只能装备3个徽章' });
            }
            
            await pool.query(
                'UPDATE user_badges SET is_equipped = TRUE, equipped_order = ? WHERE user_id = ? AND badge_id = ?',
                [equipped[0].count + 1, req.user.id, badge_id]
            );
        } else {
            await pool.query(
                'UPDATE user_badges SET is_equipped = FALSE, equipped_order = 0 WHERE user_id = ? AND badge_id = ?',
                [req.user.id, badge_id]
            );
        }
        
        res.json({ message: '操作成功' });
    } catch (error) {
        console.error('Error equipping badge:', error);
        res.status(500).json({ message: '操作失败' });
    }
});

// 获取每日任务
router.get('/tasks/daily', authenticateToken, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // 确保今日任务记录存在
        await pool.query(
            `INSERT IGNORE INTO user_daily_tasks (user_id, task_id, task_date, target_count, progress)
            SELECT ?, id, ?, target_count, 0 FROM daily_tasks WHERE is_active = TRUE`,
            [req.user.id, today]
        );
        
        const [rows] = await pool.query(
            `SELECT dt.*, udt.progress, udt.is_completed, udt.completed_at
            FROM daily_tasks dt
            LEFT JOIN user_daily_tasks udt ON dt.id = udt.task_id AND udt.user_id = ? AND udt.task_date = ?
            WHERE dt.is_active = TRUE
            ORDER BY dt.sort_order ASC`,
            [req.user.id, today]
        );
        
        res.json({ tasks: rows });
    } catch (error) {
        console.error('Error fetching daily tasks:', error);
        res.status(500).json({ message: '获取每日任务失败' });
    }
});

// 完成任务（内部调用）
async function completeTask(userId, taskType, progress = 1) {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // 获取任务
        const [tasks] = await pool.query(
            'SELECT * FROM daily_tasks WHERE task_key = ? AND is_active = TRUE',
            [taskType]
        );
        
        if (tasks.length === 0) return;
        
        const task = tasks[0];
        
        // 确保记录存在
        await pool.query(
            `INSERT IGNORE INTO user_daily_tasks (user_id, task_id, task_date, target_count, progress)
            VALUES (?, ?, ?, ?, 0)`,
            [userId, task.id, today, task.target_count]
        );
        
        // 更新进度
        const [result] = await pool.query(
            `UPDATE user_daily_tasks 
            SET progress = LEAST(progress + ?, target_count),
                is_completed = CASE WHEN progress + ? >= target_count THEN TRUE ELSE is_completed END,
                completed_at = CASE WHEN progress + ? >= target_count AND is_completed = FALSE THEN NOW() ELSE completed_at END
            WHERE user_id = ? AND task_id = ? AND task_date = ? AND is_completed = FALSE`,
            [progress, progress, progress, userId, task.id, today]
        );
        
        // 检查是否刚完成
        const [updated] = await pool.query(
            'SELECT * FROM user_daily_tasks WHERE user_id = ? AND task_id = ? AND task_date = ?',
            [userId, task.id, today]
        );
        
        if (updated.length > 0 && updated[0].is_completed && result.changedRows > 0) {
            // 发放奖励
            await addExp(userId, task.exp_reward, `完成每日任务: ${task.name}`);
            await addCoins(userId, task.coin_reward);
            
            return {
                completed: true,
                expReward: task.exp_reward,
                coinReward: task.coin_reward
            };
        }
        
        return { completed: false };
    } catch (error) {
        console.error('Error completing task:', error);
        return { completed: false };
    }
}

// 获取商城商品
router.get('/shop/items', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM shop_items WHERE is_active = TRUE ORDER BY sort_order ASC'
        );
        res.json({ items: rows });
    } catch (error) {
        console.error('Error fetching shop items:', error);
        res.status(500).json({ message: '获取商品失败' });
    }
});

// 获取用户购买记录
router.get('/shop/purchases', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT p.*, i.name, i.item_type, i.icon, i.effect_data
            FROM user_purchases p
            JOIN shop_items i ON p.item_id = i.id
            WHERE p.user_id = ? AND (p.valid_until IS NULL OR p.valid_until > NOW())
            ORDER BY p.purchased_at DESC`,
            [req.user.id]
        );
        
        res.json({ purchases: rows });
    } catch (error) {
        console.error('Error fetching purchases:', error);
        res.status(500).json({ message: '获取购买记录失败' });
    }
});

// 购买商品
router.post('/shop/buy', authenticateToken, async (req, res) => {
    const { item_id } = req.body;
    
    try {
        // 获取商品信息
        const [items] = await pool.query(
            'SELECT * FROM shop_items WHERE id = ? AND is_active = TRUE',
            [item_id]
        );
        
        if (items.length === 0) {
            return res.status(404).json({ message: '商品不存在' });
        }
        
        const item = items[0];
        
        // 检查库存
        if (item.stock !== -1 && item.stock <= 0) {
            return res.status(400).json({ message: '商品已售罄' });
        }
        
        // 检查用户金币
        const [users] = await pool.query(
            'SELECT coins FROM users WHERE id = ?',
            [req.user.id]
        );
        
        if (users[0].coins < item.price) {
            return res.status(400).json({ message: '金币不足' });
        }
        
        // 扣除金币
        await pool.query(
            'UPDATE users SET coins = coins - ? WHERE id = ?',
            [item.price, req.user.id]
        );
        
        // 减少库存
        if (item.stock > 0) {
            await pool.query(
                'UPDATE shop_items SET stock = stock - 1 WHERE id = ?',
                [item_id]
            );
        }
        
        // 创建购买记录
        const validUntil = item.valid_days > 0 
            ? new Date(Date.now() + item.valid_days * 24 * 60 * 60 * 1000)
            : null;
        
        await pool.query(
            'INSERT INTO user_purchases (user_id, item_id, price_paid, valid_until) VALUES (?, ?, ?, ?)',
            [req.user.id, item_id, item.price, validUntil]
        );
        
        res.json({ 
            message: '购买成功',
            remainingCoins: users[0].coins - item.price
        });
    } catch (error) {
        console.error('Error buying item:', error);
        res.status(500).json({ message: '购买失败' });
    }
});

// 添加经验值（内部函数）
async function addExp(userId, exp, description) {
    try {
        // 获取当前等级信息
        const [levels] = await pool.query(
            'SELECT * FROM user_levels WHERE user_id = ?',
            [userId]
        );
        
        if (levels.length === 0) return;
        
        let { level, current_exp, total_exp, next_level_exp } = levels[0];
        
        // 记录历史
        await pool.query(
            'INSERT INTO exp_history (user_id, action_type, exp_gained, description) VALUES (?, ?, ?, ?)',
            [userId, 'earn', exp, description]
        );
        
        // 更新经验
        current_exp += exp;
        total_exp += exp;
        
        let leveledUp = false;
        let newLevel = level;
        
        // 检查升级
        while (current_exp >= next_level_exp) {
            current_exp -= next_level_exp;
            newLevel++;
            next_level_exp = Math.floor(100 * Math.pow(1.2, newLevel - 1));
            leveledUp = true;
        }
        
        await pool.query(
            'UPDATE user_levels SET level = ?, current_exp = ?, total_exp = ?, next_level_exp = ? WHERE user_id = ?',
            [newLevel, current_exp, total_exp, next_level_exp, userId]
        );
        
        // 检查徽章
        await checkBadges(userId);
        
        return {
            leveledUp,
            newLevel,
            current_exp,
            total_exp
        };
    } catch (error) {
        console.error('Error adding exp:', error);
    }
}

// 添加金币（内部函数）
async function addCoins(userId, amount) {
    try {
        await pool.query(
            'UPDATE users SET coins = coins + ? WHERE id = ?',
            [amount, userId]
        );
    } catch (error) {
        console.error('Error adding coins:', error);
    }
}

// 检查徽章（内部函数）
async function checkBadges(userId) {
    try {
        // 获取用户统计
        const [stats] = await pool.query(
            `SELECT 
                (SELECT COUNT(*) FROM articles WHERE author_id = ?) as article_count,
                (SELECT COUNT(*) FROM comments WHERE author_id = ?) as comment_count,
                (SELECT COUNT(*) FROM favorites WHERE user_id = ?) as favorite_count,
                (SELECT COUNT(*) FROM user_follows WHERE follower_id = ?) as following_count`,
            [userId, userId, userId, userId]
        );
        
        const userStats = stats[0];
        
        // 获取所有徽章
        const [badges] = await pool.query('SELECT * FROM badges');
        
        for (const badge of badges) {
            let shouldAward = false;
            
            switch (badge.condition_type) {
                case 'article_count':
                    shouldAward = userStats.article_count >= badge.condition_value;
                    break;
                case 'comment_count':
                    shouldAward = userStats.comment_count >= badge.condition_value;
                    break;
                case 'favorite_count':
                    shouldAward = userStats.favorite_count >= badge.condition_value;
                    break;
                case 'following_count':
                    shouldAward = userStats.following_count >= badge.condition_value;
                    break;
            }
            
            if (shouldAward) {
                // 检查是否已获得
                const [existing] = await pool.query(
                    'SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?',
                    [userId, badge.id]
                );
                
                if (existing.length === 0) {
                    // 授予徽章
                    await pool.query(
                        'INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)',
                        [userId, badge.id]
                    );
                    
                    // 发放经验奖励
                    await addExp(userId, badge.exp_reward, `获得徽章: ${badge.name}`);
                }
            }
        }
    } catch (error) {
        console.error('Error checking badges:', error);
    }
}

// 导出函数供其他模块使用
module.exports = {
    router,
    addExp,
    addCoins,
    completeTask,
    checkBadges
};
