/**
 * 电子商务系统路由
 * 包含虚拟商品、实体商品、购物车、订单管理等功能
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

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

// ==================== 商品管理 ====================

// 获取商品列表
router.get('/products', async (req, res) => {
    try {
        const { category, type, page = 1, limit = 20, search } = req.query;
        
        let query = supabase
            .from('products')
            .select('*', { count: 'exact' })
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);
        
        if (category) {
            query = query.eq('category', category);
        }
        
        if (type) {
            query = query.eq('type', type); // virtual, physical
        }
        
        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }
        
        const { data, error, count } = await query;
        
        if (error) throw error;
        
        res.json({
            success: true,
            data: data || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: '获取商品列表失败' });
    }
});

// 获取商品详情
router.get('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data, error } = await supabase
            .from('products')
            .select('*, product_variants(*)')
            .eq('id', id)
            .single();
        
        if (error || !data) {
            return res.status(404).json({ error: '商品不存在' });
        }
        
        // 获取商品评价
        const { data: reviews } = await supabase
            .from('product_reviews')
            .select('*, user_profiles(username, avatar_url)')
            .eq('product_id', id)
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(10);
        
        res.json({
            success: true,
            data: {
                ...data,
                reviews: reviews || []
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取商品详情失败' });
    }
});

// 创建商品（管理员）
router.post('/products', authenticateToken, async (req, res) => {
    try {
        const {
            name,
            description,
            type,
            category,
            price,
            original_price,
            stock,
            images,
            specs,
            is_virtual,
            download_url,
            weight,
            dimensions
        } = req.body;
        
        const { data, error } = await supabase
            .from('products')
            .insert({
                name,
                description,
                type,
                category,
                price,
                original_price,
                stock: stock || -1, // -1表示无限
                images,
                specs,
                is_virtual: is_virtual || false,
                download_url,
                weight,
                dimensions,
                sales_count: 0,
                status: 'active',
                created_by: req.user.id
            })
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({
            success: true,
            message: '商品创建成功',
            data: { product_id: data.id }
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: '创建商品失败' });
    }
});

// ==================== 购物车 ====================

// 获取购物车
router.get('/cart', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const { data, error } = await supabase
            .from('cart_items')
            .select(`
                *,
                product:products(id, name, price, images, stock, is_virtual)
            `)
            .eq('user_id', userId);
        
        if (error) throw error;
        
        // 计算总价
        let total = 0;
        const items = (data || []).map(item => {
            const subtotal = item.quantity * (item.product?.price || 0);
            total += subtotal;
            return { ...item, subtotal };
        });
        
        res.json({
            success: true,
            data: {
                items,
                total,
                count: items.length
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取购物车失败' });
    }
});

// 添加商品到购物车
router.post('/cart', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { product_id, quantity = 1, variant_id } = req.body;
        
        // 检查商品是否存在且有库存
        const { data: product } = await supabase
            .from('products')
            .select('stock, price')
            .eq('id', product_id)
            .single();
        
        if (!product) {
            return res.status(404).json({ error: '商品不存在' });
        }
        
        if (product.stock !== -1 && product.stock < quantity) {
            return res.status(400).json({ error: '库存不足' });
        }
        
        // 检查购物车是否已有该商品
        const { data: existingItem } = await supabase
            .from('cart_items')
            .select('id, quantity')
            .eq('user_id', userId)
            .eq('product_id', product_id)
            .maybeSingle();
        
        if (existingItem) {
            // 更新数量
            const { data, error } = await supabase
                .from('cart_items')
                .update({
                    quantity: existingItem.quantity + quantity,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingItem.id)
                .select()
                .single();
            
            if (error) throw error;
            
            res.json({
                success: true,
                message: '购物车已更新',
                data
            });
        } else {
            // 新增商品
            const { data, error } = await supabase
                .from('cart_items')
                .insert({
                    user_id: userId,
                    product_id,
                    quantity,
                    variant_id,
                    added_at: new Date().toISOString()
                })
                .select()
                .single();
            
            if (error) throw error;
            
            res.json({
                success: true,
                message: '已添加到购物车',
                data
            });
        }
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ error: '添加失败' });
    }
});

// 更新购物车数量
router.put('/cart/:itemId', authenticateToken, async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;
        
        if (quantity <= 0) {
            // 删除商品
            await supabase
                .from('cart_items')
                .delete()
                .eq('id', itemId)
                .eq('user_id', req.user.id);
            
            res.json({
                success: true,
                message: '商品已移除'
            });
        } else {
            const { data, error } = await supabase
                .from('cart_items')
                .update({
                    quantity,
                    updated_at: new Date().toISOString()
                })
                .eq('id', itemId)
                .eq('user_id', req.user.id)
                .select()
                .single();
            
            if (error) throw error;
            
            res.json({
                success: true,
                message: '数量已更新',
                data
            });
        }
    } catch (error) {
        res.status(500).json({ error: '更新失败' });
    }
});

// 清空购物车
router.delete('/cart', authenticateToken, async (req, res) => {
    try {
        await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', req.user.id);
        
        res.json({
            success: true,
            message: '购物车已清空'
        });
    } catch (error) {
        res.status(500).json({ error: '清空失败' });
    }
});

// ==================== 订单管理 ====================

// 创建订单
router.post('/orders', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            items, // [{product_id, quantity, variant_id}]
            address,
            coupon_code,
            note
        } = req.body;
        
        // 计算订单金额
        let subtotal = 0;
        const orderItems = [];
        
        for (const item of items) {
            const { data: product } = await supabase
                .from('products')
                .select('id, name, price, stock, is_virtual')
                .eq('id', item.product_id)
                .single();
            
            if (!product) {
                return res.status(400).json({ error: `商品不存在: ${item.product_id}` });
            }
            
            if (product.stock !== -1 && product.stock < item.quantity) {
                return res.status(400).json({ error: `库存不足: ${product.name}` });
            }
            
            const itemTotal = product.price * item.quantity;
            subtotal += itemTotal;
            
            orderItems.push({
                product_id: product.id,
                product_name: product.name,
                price: product.price,
                quantity: item.quantity,
                total: itemTotal
            });
        }
        
        // 应用优惠券
        let discount = 0;
        if (coupon_code) {
            const { data: coupon } = await supabase
                .from('coupons')
                .select('*')
                .eq('code', coupon_code)
                .eq('status', 'active')
                .gte('valid_until', new Date().toISOString())
                .single();
            
            if (coupon) {
                if (coupon.type === 'percentage') {
                    discount = subtotal * (coupon.value / 100);
                } else {
                    discount = coupon.value;
                }
                discount = Math.min(discount, subtotal);
            }
        }
        
        const shipping = address ? 10 : 0; // 简化运费计算
        const total = subtotal - discount + shipping;
        
        // 生成订单号
        const orderNo = 'ORD' + Date.now() + crypto.randomBytes(4).toString('hex').toUpperCase();
        
        // 创建订单
        const { data: order, error } = await supabase
            .from('orders')
            .insert({
                order_no: orderNo,
                user_id: userId,
                status: 'pending', // pending, paid, shipped, completed, cancelled, refunded
                subtotal,
                discount,
                shipping,
                total,
                coupon_code,
                note,
                shipping_address: address,
                created_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) throw error;
        
        // 创建订单项
        await supabase
            .from('order_items')
            .insert(
                orderItems.map(item => ({
                    order_id: order.id,
                    ...item
                }))
            );
        
        // 扣减库存
        for (const item of items) {
            await supabase.rpc('decrement_product_stock', {
                product_id: item.product_id,
                quantity: item.quantity
            });
        }
        
        res.json({
            success: true,
            message: '订单创建成功',
            data: {
                order_id: order.id,
                order_no: orderNo,
                total,
                status: order.status
            }
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: '创建订单失败' });
    }
});

// 获取订单列表
router.get('/orders', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, page = 1, limit = 10 } = req.query;
        
        let query = supabase
            .from('orders')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);
        
        if (status) {
            query = query.eq('status', status);
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
        res.status(500).json({ error: '获取订单失败' });
    }
});

// 获取订单详情
router.get('/orders/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const { data: order, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();
        
        if (error || !order) {
            return res.status(404).json({ error: '订单不存在' });
        }
        
        const { data: items } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', id);
        
        res.json({
            success: true,
            data: {
                ...order,
                items: items || []
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取订单详情失败' });
    }
});

// 取消订单
router.post('/orders/:id/cancel', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        
        const { data: order } = await supabase
            .from('orders')
            .select('status')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();
        
        if (!order) {
            return res.status(404).json({ error: '订单不存在' });
        }
        
        if (order.status !== 'pending') {
            return res.status(400).json({ error: '只能取消待支付订单' });
        }
        
        await supabase
            .from('orders')
            .update({
                status: 'cancelled',
                cancel_reason: reason,
                cancelled_at: new Date().toISOString()
            })
            .eq('id', id);
        
        // 恢复库存
        const { data: items } = await supabase
            .from('order_items')
            .select('product_id, quantity')
            .eq('order_id', id);
        
        for (const item of items || []) {
            await supabase.rpc('increment_product_stock', {
                product_id: item.product_id,
                quantity: item.quantity
            });
        }
        
        res.json({
            success: true,
            message: '订单已取消'
        });
    } catch (error) {
        res.status(500).json({ error: '取消失败' });
    }
});

// ==================== 优惠券 ====================

// 验证优惠券
router.post('/coupons/verify', authenticateToken, async (req, res) => {
    try {
        const { code, order_amount } = req.body;
        
        const { data: coupon, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code)
            .eq('status', 'active')
            .gte('valid_until', new Date().toISOString())
            .single();
        
        if (error || !coupon) {
            return res.status(400).json({ error: '优惠券无效或已过期' });
        }
        
        // 检查最低消费
        if (coupon.min_order_amount && order_amount < coupon.min_order_amount) {
            return res.status(400).json({ 
                error: `订单金额需满 ${coupon.min_order_amount} 元才能使用该优惠券` 
            });
        }
        
        // 检查使用次数
        if (coupon.max_uses) {
            const { count } = await supabase
                .from('orders')
                .select('*', { count: 'exact' })
                .eq('coupon_code', code);
            
            if (count >= coupon.max_uses) {
                return res.status(400).json({ error: '优惠券使用次数已达上限' });
            }
        }
        
        // 计算折扣
        let discount = 0;
        if (coupon.type === 'percentage') {
            discount = order_amount * (coupon.value / 100);
            if (coupon.max_discount) {
                discount = Math.min(discount, coupon.max_discount);
            }
        } else {
            discount = Math.min(coupon.value, order_amount);
        }
        
        res.json({
            success: true,
            data: {
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                discount: Math.round(discount * 100) / 100
            }
        });
    } catch (error) {
        res.status(500).json({ error: '验证失败' });
    }
});

module.exports = router;
