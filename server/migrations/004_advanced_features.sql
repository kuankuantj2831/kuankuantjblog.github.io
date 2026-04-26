-- ============================================
-- 第四轮高级功能数据库迁移
-- 创建时间: 2026-04-04
-- 功能: 电商、付费内容、高级分析、第三方集成
-- ============================================

-- ============================================
-- 一、电子商务系统
-- ============================================

-- 商品分类表
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    parent_id UUID REFERENCES product_categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 商品表
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('virtual', 'physical')),
    category_id UUID REFERENCES product_categories(id),
    
    -- 价格信息
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2),
    cost_price DECIMAL(10, 2),
    
    -- 库存信息
    stock INTEGER DEFAULT 0,
    stock_warning INTEGER DEFAULT 10,
    
    -- 媒体信息
    cover_image VARCHAR(500),
    images JSONB DEFAULT '[]',
    
    -- 销售信息
    sales_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    -- 状态
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold_out')),
    is_featured BOOLEAN DEFAULT false,
    
    -- 虚拟商品特有字段
    virtual_content TEXT,
    download_limit INTEGER DEFAULT 0,
    download_expire_days INTEGER DEFAULT 0,
    
    -- 实体商品特有字段
    weight DECIMAL(8, 2),
    sku VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 购物车表
CREATE TABLE IF NOT EXISTS shopping_carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    selected_options JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_no VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- 金额信息
    subtotal DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    shipping_fee DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    
    -- 状态
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded')),
    
    -- 地址信息
    shipping_address JSONB,
    shipping_name VARCHAR(100),
    shipping_phone VARCHAR(20),
    
    -- 物流信息
    tracking_number VARCHAR(100),
    tracking_company VARCHAR(50),
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- 支付信息
    payment_method VARCHAR(50),
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- 备注
    user_note TEXT,
    admin_note TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 订单商品表
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    
    -- 虚拟商品交付
    virtual_content TEXT,
    download_count INTEGER DEFAULT 0,
    download_expire_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 优惠券表
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- 优惠类型
    type VARCHAR(20) NOT NULL CHECK (type IN ('fixed', 'percentage')),
    value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount DECIMAL(10, 2),
    
    -- 使用限制
    total_quantity INTEGER,
    used_quantity INTEGER DEFAULT 0,
    per_user_limit INTEGER DEFAULT 1,
    
    -- 有效期
    start_at TIMESTAMP WITH TIME ZONE,
    end_at TIMESTAMP WITH TIME ZONE,
    
    -- 适用范围
    applicable_products JSONB DEFAULT '[]',
    applicable_categories JSONB DEFAULT '[]',
    exclude_products JSONB DEFAULT '[]',
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户优惠券表
CREATE TABLE IF NOT EXISTS user_coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, coupon_id)
);

-- ============================================
-- 二、付费内容系统
-- ============================================

-- 会员套餐表
CREATE TABLE IF NOT EXISTS membership_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    
    -- 价格
    monthly_price DECIMAL(10, 2),
    yearly_price DECIMAL(10, 2),
    
    -- 权益
    benefits JSONB DEFAULT '[]',
    
    -- 权限
    can_read_premium BOOLEAN DEFAULT true,
    can_download BOOLEAN DEFAULT false,
    can_use_ai_features BOOLEAN DEFAULT false,
    priority_support BOOLEAN DEFAULT false,
    
    -- 显示
    color VARCHAR(20) DEFAULT '#667eea',
    icon VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户会员订阅表
CREATE TABLE IF NOT EXISTS user_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES membership_plans(id),
    
    -- 订阅信息
    subscription_type VARCHAR(20) NOT NULL CHECK (subscription_type IN ('monthly', 'yearly')),
    price DECIMAL(10, 2) NOT NULL,
    
    -- 有效期
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- 续订设置
    auto_renew BOOLEAN DEFAULT true,
    
    -- 支付信息
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    
    -- 状态
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 付费文章表
CREATE TABLE IF NOT EXISTS paid_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    
    -- 价格
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2),
    
    -- 免费预览
    free_preview_length INTEGER DEFAULT 500,
    
    -- 会员折扣
    membership_discount JSONB DEFAULT '{}',
    
    -- 销售统计
    sales_count INTEGER DEFAULT 0,
    revenue DECIMAL(12, 2) DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 文章购买记录表
CREATE TABLE IF NOT EXISTS article_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    paid_article_id UUID NOT NULL REFERENCES paid_articles(id),
    
    price DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, article_id)
);

-- 文章打赏记录表
CREATE TABLE IF NOT EXISTS article_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES auth.users(id),
    to_user_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- 打赏金额
    amount DECIMAL(10, 2) NOT NULL,
    coins_amount INTEGER,
    
    -- 留言
    message TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    
    -- 支付信息
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 积分商品表（积分商城）
CREATE TABLE IF NOT EXISTS points_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- 所需积分
    points_required INTEGER NOT NULL,
    original_points INTEGER,
    
    -- 库存
    stock INTEGER DEFAULT 0,
    total_exchanged INTEGER DEFAULT 0,
    
    -- 媒体
    cover_image VARCHAR(500),
    
    -- 类型
    type VARCHAR(20) NOT NULL CHECK (type IN ('virtual', 'physical')),
    virtual_content TEXT,
    
    -- 限制
    per_user_limit INTEGER DEFAULT 1,
    user_level_required INTEGER DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 积分兑换记录表
CREATE TABLE IF NOT EXISTS points_exchanges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES points_products(id),
    
    points_used INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    
    -- 虚拟商品
    virtual_content TEXT,
    
    -- 实体商品地址
    shipping_address JSONB,
    shipping_status VARCHAR(20) DEFAULT 'pending',
    tracking_number VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 三、高级数据分析
-- ============================================

-- 热力图点击数据表
CREATE TABLE IF NOT EXISTS heatmap_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_url VARCHAR(500) NOT NULL,
    
    -- 点击坐标
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    
    -- 元素信息
    element_selector VARCHAR(500),
    element_text VARCHAR(255),
    
    -- 设备信息
    screen_width INTEGER,
    screen_height INTEGER,
    device_type VARCHAR(20),
    
    -- 用户信息（可选）
    user_id UUID REFERENCES auth.users(id),
    session_id VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 热力图滚动数据表
CREATE TABLE IF NOT EXISTS heatmap_scrolls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_url VARCHAR(500) NOT NULL,
    
    -- 滚动深度
    scroll_depth INTEGER NOT NULL,
    max_scroll_depth INTEGER NOT NULL,
    page_height INTEGER,
    
    -- 时间
    time_on_page INTEGER,
    
    -- 设备信息
    device_type VARCHAR(20),
    screen_height INTEGER,
    
    user_id UUID REFERENCES auth.users(id),
    session_id VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 转化漏斗表
CREATE TABLE IF NOT EXISTS conversion_funnels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- 漏斗步骤
    steps JSONB NOT NULL,
    
    -- 状态
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 漏斗事件记录表
CREATE TABLE IF NOT EXISTS funnel_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funnel_id UUID NOT NULL REFERENCES conversion_funnels(id) ON DELETE CASCADE,
    
    -- 步骤信息
    step_index INTEGER NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    
    -- 事件数据
    event_data JSONB DEFAULT '{}',
    
    -- 用户信息
    user_id UUID REFERENCES auth.users(id),
    session_id VARCHAR(100) NOT NULL,
    
    -- 转化时间
    converted_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B 测试表
CREATE TABLE IF NOT EXISTS ab_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- 测试页面
    page_url VARCHAR(500),
    
    -- 变体配置
    variants JSONB NOT NULL,
    
    -- 目标
    goal_type VARCHAR(50) NOT NULL,
    goal_config JSONB DEFAULT '{}',
    
    -- 流量分配
    traffic_percentage INTEGER DEFAULT 100,
    
    -- 状态
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed')),
    
    -- 时间
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B 测试参与记录表
CREATE TABLE IF NOT EXISTS ab_test_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
    
    -- 分配的变体
    variant_id VARCHAR(50) NOT NULL,
    variant_name VARCHAR(100) NOT NULL,
    
    -- 用户信息
    user_id UUID REFERENCES auth.users(id),
    session_id VARCHAR(100) NOT NULL,
    
    -- 转化状态
    converted BOOLEAN DEFAULT false,
    converted_at TIMESTAMP WITH TIME ZONE,
    conversion_value DECIMAL(10, 2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(test_id, user_id, session_id)
);

-- 实时分析数据表（使用 TimescaleDB 超表）
CREATE TABLE IF NOT EXISTS realtime_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15, 4) NOT NULL,
    
    -- 维度
    page_url VARCHAR(500),
    device_type VARCHAR(20),
    country VARCHAR(50),
    referrer VARCHAR(500),
    
    -- 用户信息
    user_id UUID REFERENCES auth.users(id),
    session_id VARCHAR(100),
    
    -- 时间戳（用于超表分区）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 转换为超表（如果安装了 TimescaleDB）
-- SELECT create_hypertable('realtime_analytics', 'created_at', if_not_exists => TRUE);

-- ============================================
-- 四、第三方集成
-- ============================================

-- 社交账号绑定表
CREATE TABLE IF NOT EXISTS user_social_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 社交类型
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('wechat', 'github', 'google', 'weibo', 'qq')),
    
    -- 第三方账号信息
    provider_user_id VARCHAR(100) NOT NULL,
    provider_union_id VARCHAR(100),
    
    -- 用户信息
    nickname VARCHAR(100),
    avatar VARCHAR(500),
    email VARCHAR(255),
    
    -- Token 信息（加密存储）
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- 原始数据
    raw_data JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider, provider_user_id)
);

-- 支付交易记录表
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 订单关联
    order_id UUID REFERENCES orders(id),
    order_no VARCHAR(50),
    
    -- 用户信息
    user_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- 支付信息
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('order', 'membership', 'article', 'reward', 'recharge')),
    amount DECIMAL(10, 2) NOT NULL,
    
    -- 支付渠道
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('alipay', 'wechat_pay', 'stripe')),
    
    -- 第三方交易号
    transaction_no VARCHAR(100),
    
    -- 状态
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'refunded')),
    
    -- 支付时间
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- 原始响应
    channel_response JSONB,
    
    -- 退款信息
    refunded_amount DECIMAL(10, 2) DEFAULT 0,
    refund_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 云存储文件表
CREATE TABLE IF NOT EXISTS cloud_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 文件信息
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    mime_type VARCHAR(100),
    size BIGINT,
    
    -- 存储信息
    storage_provider VARCHAR(50) NOT NULL CHECK (storage_provider IN ('cos', 'oss', 's3')),
    bucket VARCHAR(100) NOT NULL,
    object_key VARCHAR(500) NOT NULL,
    url VARCHAR(1000) NOT NULL,
    
    -- 元数据
    metadata JSONB DEFAULT '{}',
    
    -- 访问控制
    is_public BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 推送设备表
CREATE TABLE IF NOT EXISTS push_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 设备信息
    device_token VARCHAR(500) NOT NULL,
    device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
    
    -- 推送平台
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('jpush', 'firebase', 'apns')),
    
    -- 设备标识
    device_id VARCHAR(100),
    device_model VARCHAR(100),
    os_version VARCHAR(50),
    app_version VARCHAR(50),
    
    -- 状态
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(device_token, provider)
);

-- 推送消息记录表
CREATE TABLE IF NOT EXISTS push_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 目标
    user_id UUID REFERENCES auth.users(id),
    device_id UUID REFERENCES push_devices(id),
    
    -- 消息内容
    title VARCHAR(200) NOT NULL,
    content TEXT,
    
    -- 额外数据
    data JSONB DEFAULT '{}',
    
    -- 消息类型
    type VARCHAR(50) NOT NULL,
    
    -- 发送状态
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'clicked', 'failed')),
    
    -- 时间
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    
    -- 错误信息
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 五、索引创建
-- ============================================

-- 商品相关索引
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;

-- 订单相关索引
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_no ON orders(order_no);

-- 会员相关索引
CREATE INDEX IF NOT EXISTS idx_user_memberships_user ON user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_expires ON user_memberships(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_memberships_status ON user_memberships(status);

-- 分析相关索引
CREATE INDEX IF NOT EXISTS idx_heatmap_clicks_page ON heatmap_clicks(page_url);
CREATE INDEX IF NOT EXISTS idx_heatmap_clicks_created ON heatmap_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_heatmap_scrolls_page ON heatmap_scrolls(page_url);
CREATE INDEX IF NOT EXISTS idx_funnel_events_funnel ON funnel_events(funnel_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_session ON funnel_events(session_id);
CREATE INDEX IF NOT EXISTS idx_ab_participants_test ON ab_test_participants(test_id);

-- 第三方集成索引
CREATE INDEX IF NOT EXISTS idx_social_accounts_user ON user_social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_provider ON user_social_accounts(provider, provider_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_cloud_files_user ON cloud_files(user_id);
CREATE INDEX IF NOT EXISTS idx_push_devices_user ON push_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_push_devices_token ON push_devices(device_token);
CREATE INDEX IF NOT EXISTS idx_push_messages_user ON push_messages(user_id);

-- ============================================
-- 六、函数和触发器
-- ============================================

-- 更新库存函数
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- 减少库存
    UPDATE products 
    SET stock = stock - NEW.quantity,
        sales_count = sales_count + NEW.quantity
    WHERE id = NEW.product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 订单支付后触发库存更新
CREATE TRIGGER after_order_paid
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    WHEN (NEW.status = 'paid' AND OLD.status = 'pending')
    EXECUTE FUNCTION update_product_stock();

-- 更新会员状态函数
CREATE OR REPLACE FUNCTION check_membership_expiry()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expires_at < NOW() AND NEW.status = 'active' THEN
        NEW.status := 'expired';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_membership_update
    BEFORE UPDATE ON user_memberships
    FOR EACH ROW
    EXECUTE FUNCTION check_membership_expiry();

-- 生成订单号函数
CREATE OR REPLACE FUNCTION generate_order_no()
RETURNS TEXT AS $$
DECLARE
    order_no TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        order_no := 'ORD' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        SELECT EXISTS(SELECT 1 FROM orders WHERE order_no = order_no) INTO exists_check;
        EXIT WHEN NOT exists_check;
    END LOOP;
    RETURN order_no;
END;
$$ LANGUAGE plpgsql;

-- 插入订单时自动生成订单号
CREATE OR REPLACE FUNCTION set_order_no()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_no IS NULL THEN
        NEW.order_no := generate_order_no();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_order_insert
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_no();

-- ============================================
-- 七、初始数据
-- ============================================

-- 插入默认会员套餐
INSERT INTO membership_plans (name, slug, description, monthly_price, yearly_price, benefits, color) VALUES
('免费会员', 'free', '基础功能免费使用', 0, 0, '["阅读免费文章", "基础搜索", "发表评论"]', '#999999'),
('普通会员', 'premium', '解锁更多高级功能', 29.90, 298.00, '["阅读付费文章", "下载资源", "AI写作辅助", "优先客服"]', '#667eea'),
('VIP会员', 'vip', '享受全部特权', 99.90, 998.00, '["全部付费内容", "无限下载", "全部AI功能", "专属客服", "提前体验新功能"]', '#f59e0b')
ON CONFLICT (slug) DO NOTHING;

-- 插入默认商品分类
INSERT INTO product_categories (name, slug, description, sort_order) VALUES
('虚拟商品', 'virtual', '数字内容和虚拟服务', 1),
('实体周边', 'merchandise', '博客周边实体商品', 2),
('会员服务', 'membership', '会员订阅和增值服务', 3)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 八、RLS 策略（行级安全）
-- ============================================

-- 购物车 RLS
ALTER TABLE shopping_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own cart"
    ON shopping_carts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only modify their own cart"
    ON shopping_carts FOR ALL
    USING (auth.uid() = user_id);

-- 订单 RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own orders"
    ON orders FOR SELECT
    USING (auth.uid() = user_id);

-- 会员订阅 RLS
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own memberships"
    ON user_memberships FOR SELECT
    USING (auth.uid() = user_id);

-- 云文件 RLS
ALTER TABLE cloud_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own files"
    ON cloud_files FOR SELECT
    USING (auth.uid() = user_id OR is_public = true);

-- 推送设备 RLS
ALTER TABLE push_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own devices"
    ON push_devices FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================
-- 迁移完成
-- ============================================
