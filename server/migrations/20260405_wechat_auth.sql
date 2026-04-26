-- =====================================================
-- 微信登录认证数据库迁移
-- 创建时间: 2026-04-05
-- =====================================================

-- OAuth状态表（临时存储state）
CREATE TABLE IF NOT EXISTS oauth_states (
    id SERIAL PRIMARY KEY,
    state VARCHAR(64) NOT NULL UNIQUE,
    data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at);

-- 用户微信绑定表
CREATE TABLE IF NOT EXISTS user_wechat_bindings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    openid VARCHAR(100) NOT NULL UNIQUE,
    unionid VARCHAR(100),
    source VARCHAR(50) NOT NULL, -- wechat_web, wechat_mp, wechat_miniapp
    nickname VARCHAR(100),
    avatar_url TEXT,
    sex INTEGER CHECK (sex IN (0, 1, 2)), -- 0未知, 1男, 2女
    country VARCHAR(50),
    province VARCHAR(50),
    city VARCHAR(50),
    language VARCHAR(20) DEFAULT 'zh_CN',
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, source)
);

CREATE INDEX IF NOT EXISTS idx_wechat_bindings_user ON user_wechat_bindings(user_id);
CREATE INDEX IF NOT EXISTS idx_wechat_bindings_unionid ON user_wechat_bindings(unionid);
CREATE INDEX IF NOT EXISTS idx_wechat_bindings_source ON user_wechat_bindings(source);

-- 微信消息记录表
CREATE TABLE IF NOT EXISTS wechat_messages (
    id SERIAL PRIMARY KEY,
    msg_id VARCHAR(100),
    from_user VARCHAR(100) NOT NULL,
    to_user VARCHAR(100) NOT NULL,
    msg_type VARCHAR(50) NOT NULL, -- text, image, voice, video, event, etc.
    content TEXT,
    media_id VARCHAR(200),
    pic_url TEXT,
    event VARCHAR(50),
    event_key VARCHAR(200),
    raw_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wechat_messages_from ON wechat_messages(from_user);
CREATE INDEX IF NOT EXISTS idx_wechat_messages_created ON wechat_messages(created_at);

-- 微信公众号菜单点击记录
CREATE TABLE IF NOT EXISTS wechat_menu_clicks (
    id SERIAL PRIMARY KEY,
    openid VARCHAR(100) NOT NULL,
    menu_key VARCHAR(100) NOT NULL,
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wechat_clicks_openid ON wechat_menu_clicks(openid);

-- 微信扫码登录记录
CREATE TABLE IF NOT EXISTS wechat_qr_logins (
    id SERIAL PRIMARY KEY,
    scene_id VARCHAR(100) NOT NULL,
    ticket VARCHAR(200),
    openid VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending', -- pending, scanned, confirmed, expired
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scanned_at TIMESTAMP,
    confirmed_at TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '5 minutes')
);

CREATE INDEX IF NOT EXISTS idx_wechat_qr_scene ON wechat_qr_logins(scene_id);
CREATE INDEX IF NOT EXISTS idx_wechat_qr_status ON wechat_qr_logins(status, expires_at);

-- 更新触发器
CREATE OR REPLACE FUNCTION update_wechat_binding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wechat_bindings_updated_at
    BEFORE UPDATE ON user_wechat_bindings
    FOR EACH ROW EXECUTE FUNCTION update_wechat_binding_updated_at();

-- 清理过期状态的定时任务函数
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
    DELETE FROM oauth_states WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ language 'plpgsql';

-- 添加RLS安全策略
ALTER TABLE user_wechat_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wechat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY wechat_bindings_user ON user_wechat_bindings
    FOR ALL USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- 注释
COMMENT ON TABLE user_wechat_bindings IS '用户微信账号绑定信息';
COMMENT ON TABLE wechat_messages IS '接收到的微信公众号消息';
COMMENT ON TABLE wechat_qr_logins IS '微信扫码登录记录';
