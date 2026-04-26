/**
 * 高级数据分析路由
 * 包含热力图分析、转化漏斗、A/B测试、实时数据大屏等功能
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

// ==================== 热力图分析 ====================

// 记录点击数据
router.post('/heatmap/click', async (req, res) => {
    try {
        const { page_url, x, y, element_selector, device_type, screen_width, screen_height } = req.body;
        
        const { error } = await supabase
            .from('heatmap_clicks')
            .insert({
                page_url,
                x,
                y,
                element_selector,
                device_type: device_type || 'desktop',
                screen_width,
                screen_height,
                created_at: new Date().toISOString()
            });
        
        if (error) throw error;
        
        res.json({ success: true });
    } catch (error) {
        console.error('Record click error:', error);
        res.status(500).json({ error: '记录失败' });
    }
});

// 获取热力图数据
router.get('/heatmap/data', authenticateToken, async (req, res) => {
    try {
        const { page_url, date_from, date_to, device_type } = req.query;
        
        let query = supabase
            .from('heatmap_clicks')
            .select('*')
            .eq('page_url', page_url);
        
        if (date_from) {
            query = query.gte('created_at', date_from);
        }
        if (date_to) {
            query = query.lte('created_at', date_to);
        }
        if (device_type) {
            query = query.eq('device_type', device_type);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // 处理数据，生成热力图格式
        const heatmapData = (data || []).map(click => ({
            x: click.x,
            y: click.y,
            value: 1
        }));
        
        // 聚合数据
        const aggregated = {};
        heatmapData.forEach(point => {
            const key = `${Math.floor(point.x / 10) * 10},${Math.floor(point.y / 10) * 10}`;
            if (!aggregated[key]) {
                aggregated[key] = { x: parseInt(key.split(',')[0]), y: parseInt(key.split(',')[1]), value: 0 };
            }
            aggregated[key].value += 1;
        });
        
        res.json({
            success: true,
            data: Object.values(aggregated),
            total_clicks: data?.length || 0
        });
    } catch (error) {
        res.status(500).json({ error: '获取热力图数据失败' });
    }
});

// 获取滚动深度数据
router.get('/heatmap/scroll', authenticateToken, async (req, res) => {
    try {
        const { page_url, date_from, date_to } = req.query;
        
        const { data, error } = await supabase
            .from('scroll_depth')
            .select('*')
            .eq('page_url', page_url)
            .gte('created_at', date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .lte('created_at', date_to || new Date().toISOString());
        
        if (error) throw error;
        
        // 计算各深度百分比的平均停留时间
        const depthStats = {};
        (data || []).forEach(record => {
            const depth = Math.floor(record.depth_percent / 10) * 10;
            if (!depthStats[depth]) {
                depthStats[depth] = { count: 0, totalTime: 0 };
            }
            depthStats[depth].count++;
            depthStats[depth].totalTime += record.time_spent || 0;
        });
        
        const result = Object.entries(depthStats).map(([depth, stats]) => ({
            depth: parseInt(depth),
            user_count: stats.count,
            avg_time: Math.round(stats.totalTime / stats.count)
        })).sort((a, b) => a.depth - b.depth);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({ error: '获取滚动数据失败' });
    }
});

// 记录滚动深度
router.post('/heatmap/scroll', async (req, res) => {
    try {
        const { page_url, depth_percent, time_spent, page_height } = req.body;
        
        await supabase
            .from('scroll_depth')
            .insert({
                page_url,
                depth_percent,
                time_spent,
                page_height,
                created_at: new Date().toISOString()
            });
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: '记录失败' });
    }
});

// ==================== 转化漏斗 ====================

// 定义漏斗步骤
const FUNNEL_STEPS = {
    registration: [
        { name: '访问注册页', event: 'page_view_register' },
        { name: '填写表单', event: 'form_start_register' },
        { name: '提交注册', event: 'form_submit_register' },
        { name: '注册成功', event: 'register_success' }
    ],
    article_purchase: [
        { name: '浏览文章', event: 'article_view' },
        { name: '点击购买', event: 'article_purchase_click' },
        { name: '确认订单', event: 'order_confirm' },
        { name: '支付成功', event: 'payment_success' }
    ],
    membership: [
        { name: '浏览会员页', event: 'page_view_membership' },
        { name: '选择计划', event: 'membership_select' },
        { name: '确认订阅', event: 'membership_confirm' },
        { name: '订阅成功', event: 'membership_success' }
    ]
};

// 获取转化漏斗数据
router.get('/funnel/:funnelType', authenticateToken, async (req, res) => {
    try {
        const { funnelType } = req.params;
        const { date_from, date_to } = req.query;
        
        const steps = FUNNEL_STEPS[funnelType];
        if (!steps) {
            return res.status(400).json({ error: '无效的漏斗类型' });
        }
        
        const funnelData = [];
        let previousCount = null;
        
        for (const step of steps) {
            let query = supabase
                .from('conversion_events')
                .select('*', { count: 'exact' })
                .eq('event_name', step.event);
            
            if (date_from) query = query.gte('created_at', date_from);
            if (date_to) query = query.lte('created_at', date_to);
            
            const { count, error } = await query;
            
            if (error) throw error;
            
            const conversionRate = previousCount ? ((count / previousCount) * 100).toFixed(2) : 100;
            
            funnelData.push({
                step_name: step.name,
                event_name: step.event,
                count: count || 0,
                conversion_rate: parseFloat(conversionRate)
            });
            
            previousCount = count || 0;
        }
        
        res.json({
            success: true,
            data: funnelData,
            total_conversion: funnelData.length > 0 
                ? ((funnelData[funnelData.length - 1].count / funnelData[0].count) * 100).toFixed(2)
                : 0
        });
    } catch (error) {
        console.error('Funnel error:', error);
        res.status(500).json({ error: '获取漏斗数据失败' });
    }
});

// 记录转化事件
router.post('/funnel/event', async (req, res) => {
    try {
        const { event_name, user_id, metadata = {} } = req.body;
        
        await supabase
            .from('conversion_events')
            .insert({
                event_name,
                user_id,
                metadata,
                created_at: new Date().toISOString()
            });
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: '记录事件失败' });
    }
});

// ==================== A/B测试 ====================

// 创建A/B测试
router.post('/abtest/create', authenticateToken, async (req, res) => {
    try {
        const { name, description, page_url, variants, traffic_split = 50 } = req.body;
        
        const { data, error } = await supabase
            .from('ab_tests')
            .insert({
                name,
                description,
                page_url,
                status: 'running',
                traffic_split,
                created_by: req.user.id,
                created_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) throw error;
        
        // 创建变体
        const variantInserts = variants.map((v, index) => ({
            test_id: data.id,
            name: v.name,
            variant_key: `variant_${index}`,
            content: v.content,
            traffic_percentage: index === 0 ? traffic_split : (100 - traffic_split)
        }));
        
        await supabase
            .from('ab_test_variants')
            .insert(variantInserts);
        
        res.json({
            success: true,
            message: 'A/B测试创建成功',
            data: { test_id: data.id }
        });
    } catch (error) {
        console.error('Create AB test error:', error);
        res.status(500).json({ error: '创建失败' });
    }
});

// 获取用户应看到的变体
router.post('/abtest/variant', async (req, res) => {
    try {
        const { test_id, user_id } = req.body;
        
        // 检查用户是否已有分配
        const { data: existing } = await supabase
            .from('ab_test_assignments')
            .select('variant:ab_test_variants(*)')
            .eq('test_id', test_id)
            .eq('user_id', user_id)
            .single();
        
        if (existing) {
            return res.json({
                success: true,
                data: existing.variant
            });
        }
        
        // 获取所有变体
        const { data: variants } = await supabase
            .from('ab_test_variants')
            .select('*')
            .eq('test_id', test_id);
        
        if (!variants || variants.length === 0) {
            return res.status(404).json({ error: '测试不存在' });
        }
        
        // 随机分配变体
        const random = Math.random() * 100;
        let cumulative = 0;
        let selectedVariant = variants[0];
        
        for (const variant of variants) {
            cumulative += variant.traffic_percentage;
            if (random <= cumulative) {
                selectedVariant = variant;
                break;
            }
        }
        
        // 记录分配
        await supabase
            .from('ab_test_assignments')
            .insert({
                test_id,
                user_id,
                variant_id: selectedVariant.id,
                assigned_at: new Date().toISOString()
            });
        
        res.json({
            success: true,
            data: selectedVariant
        });
    } catch (error) {
        res.status(500).json({ error: '获取变体失败' });
    }
});

// 记录A/B测试事件
router.post('/abtest/event', async (req, res) => {
    try {
        const { test_id, variant_id, event_type, user_id } = req.body;
        
        await supabase
            .from('ab_test_events')
            .insert({
                test_id,
                variant_id,
                event_type, // view, click, conversion
                user_id,
                created_at: new Date().toISOString()
            });
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: '记录事件失败' });
    }
});

// 获取A/B测试结果
router.get('/abtest/:testId/results', authenticateToken, async (req, res) => {
    try {
        const { testId } = req.params;
        
        const { data: variants } = await supabase
            .from('ab_test_variants')
            .select('*')
            .eq('test_id', testId);
        
        const results = [];
        
        for (const variant of variants || []) {
            // 获取展示数
            const { count: views } = await supabase
                .from('ab_test_events')
                .select('*', { count: 'exact' })
                .eq('variant_id', variant.id)
                .eq('event_type', 'view');
            
            // 获取转化数
            const { count: conversions } = await supabase
                .from('ab_test_events')
                .select('*', { count: 'exact' })
                .eq('variant_id', variant.id)
                .eq('event_type', 'conversion');
            
            results.push({
                variant_id: variant.id,
                variant_name: variant.name,
                views: views || 0,
                conversions: conversions || 0,
                conversion_rate: views > 0 ? ((conversions / views) * 100).toFixed(2) : 0
            });
        }
        
        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        res.status(500).json({ error: '获取结果失败' });
    }
});

// 停止A/B测试
router.post('/abtest/:testId/stop', authenticateToken, async (req, res) => {
    try {
        const { testId } = req.params;
        const { winning_variant_id } = req.body;
        
        await supabase
            .from('ab_tests')
            .update({
                status: 'stopped',
                winning_variant_id,
                stopped_at: new Date().toISOString()
            })
            .eq('id', testId);
        
        res.json({
            success: true,
            message: 'A/B测试已停止'
        });
    } catch (error) {
        res.status(500).json({ error: '停止失败' });
    }
});

// ==================== 实时数据大屏 ====================

// 获取实时统计数据
router.get('/dashboard/realtime', authenticateToken, async (req, res) => {
    try {
        const now = new Date();
        const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
        
        // 当前在线用户数（基于最近5分钟的活动）
        const { count: onlineUsers } = await supabase
            .from('user_activity')
            .select('*', { count: 'exact', head: true })
            .gte('last_active', fiveMinutesAgo.toISOString());
        
        // 今日PV
        const today = new Date().toISOString().split('T')[0];
        const { data: todayStats } = await supabase
            .from('daily_stats')
            .select('page_views, unique_visitors')
            .eq('date', today)
            .single();
        
        // 今日注册数
        const { count: todayRegistrations } = await supabase
            .from('user_profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today);
        
        // 实时文章阅读
        const { data: recentArticles } = await supabase
            .from('article_views')
            .select('article:articles(title), count')
            .gte('viewed_at', fiveMinutesAgo.toISOString())
            .order('count', { ascending: false })
            .limit(5);
        
        res.json({
            success: true,
            data: {
                online_users: onlineUsers || 0,
                today_pv: todayStats?.page_views || 0,
                today_uv: todayStats?.unique_visitors || 0,
                today_registrations: todayRegistrations || 0,
                recent_hot_articles: recentArticles || []
            }
        });
    } catch (error) {
        console.error('Realtime dashboard error:', error);
        res.status(500).json({ error: '获取实时数据失败' });
    }
});

// 获取历史趋势数据
router.get('/dashboard/trends', authenticateToken, async (req, res) => {
    try {
        const { days = 30 } = req.query;
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        
        const { data, error } = await supabase
            .from('daily_stats')
            .select('*')
            .gte('date', startDate.toISOString().split('T')[0])
            .order('date', { ascending: true });
        
        if (error) throw error;
        
        res.json({
            success: true,
            data: data || []
        });
    } catch (error) {
        res.status(500).json({ error: '获取趋势数据失败' });
    }
});

// 获取用户行为统计
router.get('/dashboard/user-behavior', authenticateToken, async (req, res) => {
    try {
        const { date_from, date_to } = req.query;
        
        // 设备分布
        const { data: deviceData } = await supabase
            .from('user_sessions')
            .select('device_type')
            .gte('created_at', date_from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .lte('created_at', date_to || new Date().toISOString());
        
        const deviceStats = {};
        (deviceData || []).forEach(session => {
            const type = session.device_type || 'unknown';
            deviceStats[type] = (deviceStats[type] || 0) + 1;
        });
        
        // 来源分布
        const { data: sourceData } = await supabase
            .from('user_sessions')
            .select('referrer_source')
            .gte('created_at', date_from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .lte('created_at', date_to || new Date().toISOString());
        
        const sourceStats = {};
        (sourceData || []).forEach(session => {
            const source = session.referrer_source || 'direct';
            sourceStats[source] = (sourceStats[source] || 0) + 1;
        });
        
        res.json({
            success: true,
            data: {
                device_distribution: deviceStats,
                source_distribution: sourceStats
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取行为数据失败' });
    }
});

// 获取内容分析
router.get('/dashboard/content', authenticateToken, async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        // 热门文章
        const { data: popularArticles } = await supabase
            .from('articles')
            .select('id, title, view_count, like_count, comment_count')
            .order('view_count', { ascending: false })
            .limit(parseInt(limit));
        
        // 文章分类分布
        const { data: categoryData } = await supabase
            .from('articles')
            .select('category, count')
            .not('category', 'is', null)
            .group('category');
        
        res.json({
            success: true,
            data: {
                popular_articles: popularArticles || [],
                category_distribution: categoryData || []
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取内容分析失败' });
    }
});

module.exports = router;
