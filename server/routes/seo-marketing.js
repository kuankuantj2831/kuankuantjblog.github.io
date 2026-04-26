/**
 * SEO与营销路由
 * 包含邮件订阅、社交分享、推荐奖励等功能
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Supabase客户端
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

// ==================== 邮件订阅系统 ====================

// 订阅邮件
router.post('/subscribe', async (req, res) => {
    try {
        const { email, name, preferences = {} } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: '邮箱不能为空' });
        }
        
        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: '邮箱格式不正确' });
        }
        
        // 生成确认令牌
        const confirmToken = crypto.randomBytes(32).toString('hex');
        
        const { data, error } = await supabase
            .from('email_subscriptions')
            .upsert({
                email: email.toLowerCase(),
                name: name || null,
                preferences: preferences,
                confirm_token: confirmToken,
                status: 'pending',
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'email',
                ignoreDuplicates: false
            })
            .select()
            .single();
        
        if (error) throw error;
        
        // TODO: 发送确认邮件
        
        res.json({
            success: true,
            message: '订阅成功，请检查邮箱确认',
            data: { id: data.id, email: data.email }
        });
    } catch (error) {
        console.error('Subscribe error:', error);
        res.status(500).json({ error: '订阅失败' });
    }
});

// 确认订阅
router.get('/subscribe/confirm/:token', async (req, res) => {
    try {
        const { token } = req.params;
        
        const { data, error } = await supabase
            .from('email_subscriptions')
            .update({
                status: 'active',
                confirmed_at: new Date().toISOString(),
                confirm_token: null,
                updated_at: new Date().toISOString()
            })
            .eq('confirm_token', token)
            .eq('status', 'pending')
            .select()
            .single();
        
        if (error || !data) {
            return res.status(400).json({ error: '无效的确认链接或已过期' });
        }
        
        res.json({
            success: true,
            message: '订阅已确认',
            data: { email: data.email }
        });
    } catch (error) {
        res.status(500).json({ error: '确认失败' });
    }
});

// 取消订阅
router.get('/subscribe/unsubscribe/:token', async (req, res) => {
    try {
        const { token } = req.params;
        
        const { data, error } = await supabase
            .from('email_subscriptions')
            .update({
                status: 'unsubscribed',
                unsubscribed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('unsubscribe_token', token)
            .select()
            .single();
        
        if (error || !data) {
            return res.status(400).json({ error: '无效的退订链接' });
        }
        
        res.json({
            success: true,
            message: '已成功退订'
        });
    } catch (error) {
        res.status(500).json({ error: '退订失败' });
    }
});

// 更新订阅偏好设置
router.put('/subscribe/preferences', async (req, res) => {
    try {
        const { email, preferences } = req.body;
        
        const { data, error } = await supabase
            .from('email_subscriptions')
            .update({
                preferences: preferences,
                updated_at: new Date().toISOString()
            })
            .eq('email', email.toLowerCase())
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({
            success: true,
            message: '偏好设置已更新',
            data: { preferences: data.preferences }
        });
    } catch (error) {
        res.status(500).json({ error: '更新失败' });
    }
});

// ==================== 社交分享增强 ====================

// 记录分享
router.post('/share', authenticateToken, async (req, res) => {
    try {
        const { content_type, content_id, platform, url } = req.body;
        const userId = req.user.id;
        
        const { data, error } = await supabase
            .from('social_shares')
            .insert({
                user_id: userId,
                content_type,
                content_id,
                platform,
                url
            })
            .select()
            .single();
        
        if (error) throw error;
        
        // 更新内容分享计数
        if (content_type === 'article') {
            await supabase.rpc('increment_article_shares', { article_id: content_id });
        }
        
        res.json({
            success: true,
            message: '分享已记录',
            data: { share_id: data.id }
        });
    } catch (error) {
        console.error('Share error:', error);
        res.status(500).json({ error: '记录分享失败' });
    }
});

// 获取分享统计
router.get('/shares/stats/:contentType/:contentId', async (req, res) => {
    try {
        const { contentType, contentId } = req.params;
        
        const { data, error } = await supabase
            .from('social_shares')
            .select('platform')
            .eq('content_type', contentType)
            .eq('content_id', contentId);
        
        if (error) throw error;
        
        // 按平台统计
        const stats = data.reduce((acc, share) => {
            acc[share.platform] = (acc[share.platform] || 0) + 1;
            return acc;
        }, {});
        
        res.json({
            success: true,
            data: {
                total: data.length,
                platforms: stats
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取统计失败' });
    }
});

// 生成分享链接
router.post('/share/generate-link', authenticateToken, async (req, res) => {
    try {
        const { content_type, content_id } = req.body;
        const userId = req.user.id;
        
        // 获取用户推荐码
        const { data: userData } = await supabase
            .from('user_profiles')
            .select('referral_code')
            .eq('id', userId)
            .single();
        
        const referralCode = userData?.referral_code || userId.substring(0, 8);
        
        // 生成分享链接
        let baseUrl = '';
        switch (content_type) {
            case 'article':
                baseUrl = `/article.html?id=${content_id}`;
                break;
            case 'profile':
                baseUrl = `/profile.html?id=${content_id}`;
                break;
            default:
                baseUrl = '/';
        }
        
        const shareUrl = `${baseUrl}?ref=${referralCode}`;
        
        res.json({
            success: true,
            data: {
                url: shareUrl,
                referral_code: referralCode
            }
        });
    } catch (error) {
        res.status(500).json({ error: '生成链接失败' });
    }
});

// ==================== 推荐奖励机制 ====================

// 获取推荐信息
router.get('/referral/info', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const { data: userData, error: userError } = await supabase
            .from('user_profiles')
            .select('referral_code, referred_by')
            .eq('id', userId)
            .single();
        
        if (userError) throw userError;
        
        // 生成推荐码（如果没有）
        let referralCode = userData.referral_code;
        if (!referralCode) {
            referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
            await supabase
                .from('user_profiles')
                .update({ referral_code: referralCode })
                .eq('id', userId);
        }
        
        // 获取推荐统计
        const { data: referrals, error: refError } = await supabase
            .from('user_profiles')
            .select('id, created_at')
            .eq('referred_by', userId);
        
        if (refError) throw refError;
        
        // 获取奖励历史
        const { data: rewards, error: rewardError } = await supabase
            .from('referral_rewards')
            .select('*')
            .eq('referrer_id', userId)
            .order('created_at', { ascending: false });
        
        if (rewardError) throw rewardError;
        
        const totalEarned = rewards?.reduce((sum, r) => sum + (r.coins_earned || 0), 0) || 0;
        
        res.json({
            success: true,
            data: {
                referral_code: referralCode,
                referral_url: `${process.env.SITE_URL}/?ref=${referralCode}`,
                stats: {
                    total_referrals: referrals?.length || 0,
                    total_earned: totalEarned,
                    pending_rewards: rewards?.filter(r => r.status === 'pending').length || 0
                },
                referrals: referrals || [],
                rewards: rewards || []
            }
        });
    } catch (error) {
        console.error('Get referral info error:', error);
        res.status(500).json({ error: '获取推荐信息失败' });
    }
});

// 处理推荐注册
router.post('/referral/register', async (req, res) => {
    try {
        const { referral_code, new_user_id } = req.body;
        
        if (!referral_code || !new_user_id) {
            return res.status(400).json({ error: '缺少必要参数' });
        }
        
        // 查找推荐人
        const { data: referrer, error: referrerError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('referral_code', referral_code.toUpperCase())
            .single();
        
        if (referrerError || !referrer) {
            return res.status(404).json({ error: '无效的推荐码' });
        }
        
        // 不能推荐自己
        if (referrer.id === new_user_id) {
            return res.status(400).json({ error: '不能使用自己的推荐码' });
        }
        
        // 更新新用户的推荐来源
        await supabase
            .from('user_profiles')
            .update({ referred_by: referrer.id })
            .eq('id', new_user_id);
        
        // 创建推荐奖励记录
        await supabase
            .from('referral_rewards')
            .insert({
                referrer_id: referrer.id,
                referred_id: new_user_id,
                coins_earned: 100, // 推荐奖励金币
                status: 'pending',
                condition: 'user_registered'
            });
        
        res.json({
            success: true,
            message: '推荐关系已建立',
            data: {
                referrer_id: referrer.id,
                reward_pending: true
            }
        });
    } catch (error) {
        console.error('Referral register error:', error);
        res.status(500).json({ error: '处理推荐失败' });
    }
});

// 领取推荐奖励
router.post('/referral/claim-reward', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { reward_id } = req.body;
        
        // 获取待领取的奖励
        const { data: reward, error } = await supabase
            .from('referral_rewards')
            .select('*')
            .eq('id', reward_id)
            .eq('referrer_id', userId)
            .eq('status', 'pending')
            .single();
        
        if (error || !reward) {
            return res.status(404).json({ error: '奖励不存在或已领取' });
        }
        
        // 发放奖励
        await supabase.rpc('add_user_coins', {
            user_id: userId,
            amount: reward.coins_earned,
            reason: 'referral_reward',
            description: `推荐奖励: ${reward.condition}`
        });
        
        // 更新奖励状态
        await supabase
            .from('referral_rewards')
            .update({
                status: 'claimed',
                claimed_at: new Date().toISOString()
            })
            .eq('id', reward_id);
        
        res.json({
            success: true,
            message: `成功领取 ${reward.coins_earned} 金币`,
            data: { coins_earned: reward.coins_earned }
        });
    } catch (error) {
        console.error('Claim reward error:', error);
        res.status(500).json({ error: '领取奖励失败' });
    }
});

// ==================== SEO数据接口 ====================

// 获取站点地图数据
router.get('/sitemap/data', async (req, res) => {
    try {
        // 获取所有文章
        const { data: articles, error: articleError } = await supabase
            .from('articles')
            .select('id, title, updated_at, category')
            .eq('status', 'published')
            .order('updated_at', { ascending: false });
        
        if (articleError) throw articleError;
        
        // 获取所有分类
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('slug, name, updated_at');
        
        if (catError) throw catError;
        
        // 获取所有标签
        const { data: tags, error: tagError } = await supabase
            .from('tags')
            .select('slug, name');
        
        if (tagError) throw tagError;
        
        res.json({
            success: true,
            data: {
                articles: articles || [],
                categories: categories || [],
                tags: tags || [],
                last_updated: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取站点地图数据失败' });
    }
});

// 获取SEO元数据
router.get('/seo/meta/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        
        let metaData = {};
        
        switch (type) {
            case 'article':
                const { data: article } = await supabase
                    .from('articles')
                    .select('title, summary, cover_image, tags')
                    .eq('id', id)
                    .single();
                
                if (article) {
                    metaData = {
                        title: article.title,
                        description: article.summary?.substring(0, 200) || '',
                        image: article.cover_image,
                        keywords: article.tags?.join(', ') || '',
                        type: 'article'
                    };
                }
                break;
                
            case 'profile':
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('username, bio, avatar_url')
                    .eq('id', id)
                    .single();
                
                if (profile) {
                    metaData = {
                        title: `${profile.username}的个人主页`,
                        description: profile.bio?.substring(0, 200) || '',
                        image: profile.avatar_url,
                        type: 'profile'
                    };
                }
                break;
        }
        
        res.json({
            success: true,
            data: metaData
        });
    } catch (error) {
        res.status(500).json({ error: '获取SEO数据失败' });
    }
});

module.exports = router;
