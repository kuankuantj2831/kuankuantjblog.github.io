-- ============================================================
-- 实时弹幕系统数据库迁移
-- Real-time Danmaku System Migration
-- ============================================================

-- 弹幕历史记录表
CREATE TABLE IF NOT EXISTS danmaku_history (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT DEFAULT '匿名用户',
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    color VARCHAR(20) DEFAULT '#ffffff',
    type VARCHAR(20) DEFAULT 'scroll', -- scroll, top, bottom
    ip_address INET,
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 弹幕房间表（用于管理不同页面的弹幕）
CREATE TABLE IF NOT EXISTS danmaku_rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    max_danmaku_per_minute INTEGER DEFAULT 30, -- 限速
    require_login BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 弹幕屏蔽词表
CREATE TABLE IF NOT EXISTS danmaku_blocked_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word TEXT NOT NULL UNIQUE,
    is_regex BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户弹幕设置表
CREATE TABLE IF NOT EXISTS danmaku_user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    default_color VARCHAR(20) DEFAULT '#ffffff',
    default_size VARCHAR(20) DEFAULT 'normal',
    show_danmaku BOOLEAN DEFAULT TRUE,
    opacity DECIMAL(3,2) DEFAULT 0.8,
    speed INTEGER DEFAULT 5, -- 1-10
    density VARCHAR(20) DEFAULT 'normal', -- sparse, normal, dense
    block_list TEXT[] DEFAULT '{}',
    UNIQUE(user_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_danmaku_history_room ON danmaku_history(room_id);
CREATE INDEX IF NOT EXISTS idx_danmaku_history_created ON danmaku_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_danmaku_history_author ON danmaku_history(author_id);

CREATE INDEX IF NOT EXISTS idx_danmaku_rooms_article ON danmaku_rooms(article_id);
CREATE INDEX IF NOT EXISTS idx_danmaku_rooms_active ON danmaku_rooms(is_active);

-- 插入默认屏蔽词
INSERT INTO danmaku_blocked_words (word) VALUES
('傻逼'), ('sb'), ('fuck'), ('shit'), ('垃圾'), ('废物'), ('去死'), ('nmsl'), ('尼玛'), ('cnm')
ON CONFLICT (word) DO NOTHING;

-- 创建更新触发器
CREATE OR REPLACE FUNCTION update_danmaku_room_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_danmaku_rooms_updated ON danmaku_rooms;
CREATE TRIGGER trigger_danmaku_rooms_updated
    BEFORE UPDATE ON danmaku_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_danmaku_room_updated_at();

-- 检查屏蔽词函数
CREATE OR REPLACE FUNCTION check_danmaku_content(content TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    blocked_word TEXT;
BEGIN
    FOR blocked_word IN SELECT word FROM danmaku_blocked_words WHERE is_regex = FALSE
    LOOP
        IF content ILIKE '%' || blocked_word || '%' THEN
            RETURN FALSE;
        END IF;
    END LOOP;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 启用 RLS
ALTER TABLE danmaku_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE danmaku_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE danmaku_user_settings ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "Danmaku history is viewable" ON danmaku_history
    FOR SELECT USING (is_blocked = FALSE);

CREATE POLICY "Active rooms are viewable" ON danmaku_rooms
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Users can manage own settings" ON danmaku_user_settings
    FOR ALL USING (auth.uid() = user_id);

-- 添加评论
COMMENT ON TABLE danmaku_history IS '弹幕历史记录表';
COMMENT ON TABLE danmaku_rooms IS '弹幕房间表';
COMMENT ON TABLE danmaku_blocked_words IS '弹幕屏蔽词表';
COMMENT ON TABLE danmaku_user_settings IS '用户弹幕设置表';
