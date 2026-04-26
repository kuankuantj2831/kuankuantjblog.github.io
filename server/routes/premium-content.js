/**
 * 付费内容系统路由
 * 包含会员订阅、付费文章、打赏系统、积分商城等功能
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// JWT认证中间件
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: '未提供访问令牌' });
        }
        
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            return res.status(403).json({ error: '无效的访问令牌' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({ error: '认证失败' });
    }
};

// ==================== 会员订阅 ====================

// 获取会员计划
router.get('/membership/plans', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('membership_plans')
            .select('*')
            .eq('status', 'active')
            .order('price', { ascending: true });
        
        if (error) throw error;
        
        res.json({
            success: true,
            data: data || []
        });
    } catch (error) {
        res.status(500).json({ error: '获取会员计划失败' });
    }
});

// 获取当前用户会员状态
router.get('/membership/status', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const { data, error } = await supabase
            .from('user_memberships')
            .select(`
                *,
                plan:membership_plans(*)
            `)
            .eq('user_id', userId)
            .gte('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        
        if (error || !data) {
            return res.json({
                success: true,
                data: {
                    is_member: false,
                    tier: 'free',
                    expires_at: null
                }
            });
        }
        
        res.json({
            success: true,
            data: {
                is_member: true,
                tier: data.plan.tier,
                plan_name: data.plan.name,
                expires_at: data.expires_at,
                started_at: data.started_at,
                features: data.plan.features
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取会员状态失败' });
    }
});

// 订阅会员
router.post('/membership/subscribe', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { plan_id, payment_method, duration_months = 1 } = req.body;
        
        // 获取计划信息
        const { data: plan, error: planError } = await supabase
            .from('membership_plans')
            .select('*')
            .eq('id', plan_id)
            .single();
        
        if (planError || !plan) {
            return res.status(404).json({ error: '会员计划不存在' });
        }
        
        const totalPrice = plan.price * duration_months;
        
        // 计算过期时间
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + parseInt(duration_months));
        
        // 创建订阅记录
        const { data: membership, error } = await supabase
            .from('user_memberships')
            .insert({
                user_id: userId,
                plan_id,
                started_at: new Date().toISOString(),
                expires_at: expiresAt.toISOString(),
                price_paid: totalPrice,
                payment_method,
                status: 'active'
            })
            .select()
            .single();
        
        if (error) throw error;
        
        // 更新用户会员等级
        await supabase
            .from('user_profiles')
            .update({
                membership_tier: plan.tier,
                membership_expires_at: expiresAt.toISOString()
            })
            .eq('id', userId);
        
        res.json({
            success: true,
            message: '订阅成功',
            data: {
                membership_id: membership.id,
                tier: plan.tier,
                expires_at: expiresAt.toISOString()
            }
        });
    } catch (error) {
        console.error('Subscribe error:', error);
        res.status(500).json({ error: '订阅失败' });
    }
});

// 取消订阅
router.post('/membership/cancel', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        await supabase
            .from('user_memberships')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('status', 'active');
        
        res.json({
            success: true,
            message: '订阅已取消，当前会员权益保持到到期日'
        });
    } catch (error) {
        res.status(500).json({ error: '取消失败' });
    }
});

// ==================== 付费文章 ====================

// 设置文章价格
router.post('/articles/:id/price', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { price, preview_length = 500 } = req.body;
        
        // 验证作者身份
        const { data: article } = await supabase
            .from('articles')
            .select('author_id')
            .eq('id', id)
            .single();
        
        if (!article || article.author_id !== req.user.id) {
            return res.status(403).json({ error: '无权操作' });
        }
        
        await supabase
            .from('articles')
            .update({
                is_premium: price > 0,
                price,
                preview_length,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);
        
        res.json({
            success: true,
            message: price > 0 ? '已设置为付费文章' : '已取消付费限制'
        });
    } catch (error) {
        res.status(500).json({ error: '设置失败' });
    }
});

// 购买文章
router.post('/articles/:id/purchase', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        // 获取文章信息
        const { data: article, error } = await supabase
            .from('articles')
            .select('id, title, price, author_id, is_premium')
            .eq('id', id)
            .single();
        
        if (error || !article) {
            return res.status(404).json({ error: '文章不存在' });
        }
        
        if (!article.is_premium || article.price <= 0) {
            return res.status(400).json({ error: '该文章免费' });
        }
        
        if (article.author_id === userId) {
            return res.status(400).json({ error: '不能购买自己的文章' });
        }
        
        // 检查是否已购买
        const { data: existing } = await supabase
            .from('article_purchases')
            .select('id')
            .eq('article_id', id)
            .eq('user_id', userId)
            .single();
        
        if (existing) {
            return res.status(400).json({ error: '已购买该文章' });
        }
        
        // 扣除用户余额（简化处理，实际应该调用支付接口）
        // TODO: 集成支付系统
        
        // 创建购买记录
        await supabase
            .from('article_purchases')
            .insert({
                article_id: id,
                user_id: userId,
                price: article.price,
                purchased_at: new Date().toISOString()
            });
        
        // 给作者分成（70%给作者）
        const authorShare = article.price * 0.7;
        await supabase.rpc('add_user_coins', {
            user_id: article.author_id,
            amount: Math.floor(authorShare * 10), // 转换为金币
            reason: 'article_sale',
            description: `文章《${article.title}》销售收入`
        });
        
        res.json({
            success: true,
            message: '购买成功',
            data: {
                article_id: id,
                price: article.price
            }
        });
    } catch (error) {
        console.error('Purchase error:', error);
        res.status(500).json({ error: '购买失败' });
    }
});

// 检查文章访问权限
router.get('/articles/:id/access', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const { data: article } = await supabase
            .from('articles')
            .select('author_id, is_premium, price')
            .eq('id', id)
            .single();
        
        if (!article) {
            return res.status(404).json({ error: '文章不存在' });
        }
        
        // 作者本人或免费文章
        if (article.author_id === userId || !article.is_premium) {
            return res.json({
                success: true,
                data: {
                    has_access: true,
                    reason: article.author_id === userId ? 'author' : 'free'
                }
            });
        }
        
        // 检查是否购买
        const { data: purchase } = await supabase
            .from('article_purchases')
            .select('id')
            .eq('article_id', id)
            .eq('user_id', userId)
            .single();
        
        if (purchase) {
            return res.json({
                success: true,
                data: {
                    has_access: true,
                    reason: 'purchased'
                }
            });
        }
        
        // 检查会员权限
        const { data: membership } = await supabase
            .from('user_memberships')
            .select('plan:membership_plans(tier)')
            .eq('user_id', userId)
            .gte('expires_at', new Date().toISOString())
            .single();
        
        if (membership && ['premium', 'vip'].includes(membership.plan?.tier)) {
            return res.json({
                success: true,
                data: {
                    has_access: true,
                    reason: 'membership'
                }
            });
        }
        
        res.json({
            success: true,
            data: {
                has_access: false,
                price: article.price,
                reason: 'payment_required'
            }
        });
    } catch (error) {
        res.status(500).json({ error: '检查失败' });
    }
});

// ==================== 打赏系统 ====================

// 打赏文章
router.post('/articles/:id/reward', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { amount, message, anonymous = false } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: '打赏金额必须大于0' });
        }
        
        // 获取文章作者
        const { data: article } = await supabase
            .from('articles')
            .select('author_id, title')
            .eq('id', id)
            .single();
        
        if (!article) {
            return res.status(404).json({ error: '文章不存在' });
        }
        
        if (article.author_id === userId) {
            return res.status(400).json({ error: '不能打赏自己的文章' });
        }
        
        // 扣除打赏者金币
        const { data: balanceCheck } = await supabase
            .rpc('deduct_user_coins', {
                user_id: userId,
                amount: amount * 10, // 1元 = 10金币
                reason: 'reward',
                description: `打赏文章《${article.title}》`
            });
        
        if (!balanceCheck) {
            return res.status(400).json({ error: '金币不足' });
        }
        
        // 给作者增加金币（90%给作者，10%平台）
        const authorShare = Math.floor(amount * 10 * 0.9);
        await supabase.rpc('add_user_coins', {
            user_id: article.author_id,
            amount: authorShare,
            reason: 'reward_received',
            description: `收到文章打赏${amount}元`
        });
        
        // 创建打赏记录
        await supabase
            .from('rewards')
            .insert({
                article_id: id,
                donor_id: userId,
                recipient_id: article.author_id,
                amount,
                message,
                anonymous,
                created_at: new Date().toISOString()
            });
        
        // 更新文章打赏统计
        await supabase.rpc('increment_article_rewards', { article_id: id });
        
        res.json({
            success: true,
            message: '打赏成功',
            data: { amount, message }
        });
    } catch (error) {
        console.error('Reward error:', error);
        res.status(500).json({ error: '打赏失败' });
    }
});

// 获取文章打赏列表
router.get('/articles/:id/rewards', async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;
        
        const { data, error, count } = await supabase
            .from('rewards')
            .select(`
                *,
                donor:user_profiles!donor_id(username, avatar_url)
            `, { count: 'exact' })
            .eq('article_id', id)
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);
        
        if (error) throw error;
        
        // 处理匿名打赏
        const rewards = (data || []).map(r => ({
            ...r,
            donor: r.anonymous ? null : r.donor
        }));
        
        // 计算总额
        const totalAmount = rewards.reduce((sum, r) => sum + r.amount, 0);
        
        res.json({
            success: true,
            data: rewards,
            stats: {
                total_amount: totalAmount,
                count: count || 0
            },
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取打赏列表失败' });
    }
});

// ==================== 积分商城 ====================

// 获取积分商品
router.get('/points-shop/items', async (req, res) => {
    try {
        const { category, page = 1, limit = 20 } = req.query;
        
        let query = supabase
            .from('points_shop_items')
            .select('*', { count: 'exact' })
            .eq('status', 'active')
            .gt('stock', 0)
            .order('sort_order', { ascending: true })
            .range((page - 1) * limit, page * limit - 1);
        
        if (category) {
            query = query.eq('category', category);
        }
        
        const { data, error, count } = await query;
        
        if (error) throw error;
        
        res.json({
            success: true,
            data: data || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取商品失败' });
    }
});

// 积分兑换
router.post('/points-shop/exchange', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { item_id, quantity = 1 } = req.body;
        
        // 获取商品信息
        const { data: item } = await supabase
            .from('points_shop_items')
            .select('*')
            .eq('id', item_id)
            .eq('status', 'active')
            .single();
        
        if (!item) {
            return res.status(404).json({ error: '商品不存在' });
        }
        
        if (item.stock < quantity) {
            return res.status(400).json({ error: '库存不足' });
        }
        
        const totalPoints = item.points_required * quantity;
        
        // 检查积分余额
        const { data: userData } = await supabase
            .from('user_profiles')
            .select('points')
            .eq('id', userId)
            .single();
        
        if (!userData || userData.points < totalPoints) {
            return res.status(400).json({ error: '积分不足' });
        }
        
        // 扣除积分
        await supabase
            .from('user_profiles')
            .update({ points: userData.points - totalPoints })
            .eq('id', userId);
        
        // 减少库存
        await supabase
            .from('points_shop_items')
            .update({ stock: item.stock - quantity })
            .eq('id', item_id);
        
        // 创建兑换记录
        const { data: exchange } = await supabase
            .from('points_exchanges')
            .insert({
                user_id: userId,
                item_id,
                item_name: item.name,
                points_spent: totalPoints,
                quantity,
                status: 'pending',
                created_at: new Date().toISOString()
            })
            .select()
            .single();
        
        res.json({
            success: true,
            message: '兑换成功',
            data: {
                exchange_id: exchange.id,
                points_spent: totalPoints,
                remaining_points: userData.points - totalPoints
            }
        });
    } catch (error) {
        console.error('Exchange error:', error);
        res.status(500).json({ error: '兑换失败' });
    }
});

// 获取兑换记录
router.get('/points-shop/exchanges', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;
        
        const { data, error, count } = await supabase
            .from('points_exchanges')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);
        
        if (error) throw error;
        
        res.json({
            success: true,
            data: data || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取记录失败' });
    }
});

module.exports = router;
