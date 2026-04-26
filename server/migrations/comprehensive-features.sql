-- ============================================================
-- 第三轮大规模功能更新 - 数据库迁移
-- 包含: AI功能、多媒体、社交深化、SEO营销、安全备份
-- ============================================================

-- ============================================================
-- 一、AI功能增强
-- ============================================================

-- AI写作历史记录
CREATE TABLE IF NOT EXISTS ai_writing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- continue, rewrite, generate-titles
    original_content TEXT,
    generated_content TEXT NOT NULL,
    parameters JSONB DEFAULT '{}',
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_writing_user ON ai_writing_history(user_id);
CREATE INDEX idx_ai_writing_created ON ai_writing_history(created_at DESC);

-- AI内容摘要
CREATE TABLE IF NOT EXISTS ai_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(50) NOT NULL, -- article, comment, etc.
    content_id UUID NOT NULL,
    summary TEXT NOT NULL,
    summary_type VARCHAR(20) DEFAULT 'tldr', -- tldr, key_points, abstract
    language VARCHAR(10) DEFAULT 'zh',
    generated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_summaries_content ON ai_summaries(content_type, content_id);

-- AI翻译记录
CREATE TABLE IF NOT EXISTS ai_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    original_content TEXT NOT NULL,
    translated_content TEXT NOT NULL,
    source_language VARCHAR(10) NOT NULL,
    target_language VARCHAR(10) NOT NULL,
    content_type VARCHAR(50) DEFAULT 'text',
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_translations_user ON ai_translations(user_id);

-- ============================================================
-- 二、多媒体功能
-- ============================================================

-- 文章视频
CREATE TABLE IF NOT EXISTS article_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    video_type VARCHAR(20) DEFAULT 'upload', -- upload, embed, external
    thumbnail_url TEXT,
    duration INTEGER, -- seconds
    width INTEGER,
    height INTEGER,
    file_size BIGINT,
    format VARCHAR(20),
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_article_videos_article ON article_videos(article_id);

-- 播客
CREATE TABLE IF NOT EXISTS podcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    audio_url TEXT NOT NULL,
    cover_image TEXT,
    duration INTEGER, -- seconds
    file_size BIGINT,
    category VARCHAR(100),
    tags TEXT[],
    transcript TEXT, -- 语音转文字
    episode_number INTEGER,
    season_number INTEGER,
    status VARCHAR(20) DEFAULT 'published', -- draft, published, archived
    play_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_podcasts_author ON podcasts(author_id);
CREATE INDEX idx_podcasts_status ON podcasts(status);
CREATE INDEX idx_podcasts_created ON podcasts(created_at DESC);

-- 播客订阅
CREATE TABLE IF NOT EXISTS podcast_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notify_new_episode BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, author_id)
);

CREATE INDEX idx_podcast_subs_user ON podcast_subscriptions(user_id);

-- 播客播放进度
CREATE TABLE IF NOT EXISTS podcast_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    podcast_id UUID NOT NULL REFERENCES podcasts(id) ON DELETE CASCADE,
    current_position INTEGER DEFAULT 0, -- seconds
    completed BOOLEAN DEFAULT false,
    last_played_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, podcast_id)
);

CREATE INDEX idx_podcast_progress_user ON podcast_progress(user_id);

-- 图片EXIF数据
CREATE TABLE IF NOT EXISTS image_exif (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL UNIQUE,
    camera_make VARCHAR(100),
    camera_model VARCHAR(100),
    lens_model VARCHAR(100),
    aperture VARCHAR(20),
    shutter_speed VARCHAR(20),
    iso INTEGER,
    focal_length VARCHAR(20),
    gps_latitude DECIMAL(10, 8),
    gps_longitude DECIMAL(11, 8),
    gps_altitude DECIMAL(10, 2),
    taken_at TIMESTAMPTZ,
    width INTEGER,
    height INTEGER,
    file_size BIGINT,
    format VARCHAR(20),
    raw_data JSONB, -- 完整的EXIF数据
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_image_exif_gps ON image_exif(gps_latitude, gps_longitude) 
WHERE gps_latitude IS NOT NULL;

-- 直播间
CREATE TABLE IF NOT EXISTS live_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image TEXT,
    status VARCHAR(20) DEFAULT 'upcoming', -- upcoming, live, ended
    stream_key VARCHAR(255) UNIQUE,
    stream_url TEXT,
    playback_url TEXT, -- 回放地址
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    max_viewers INTEGER DEFAULT 0,
    current_viewers INTEGER DEFAULT 0,
    total_viewers INTEGER DEFAULT 0,
    chat_enabled BOOLEAN DEFAULT true,
    password VARCHAR(100), -- 房间密码（可选）
    category VARCHAR(100),
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_live_rooms_status ON live_rooms(status);
CREATE INDEX idx_live_rooms_host ON live_rooms(host_id);
CREATE INDEX idx_live_rooms_scheduled ON live_rooms(scheduled_at);

-- ============================================================
-- 三、社交功能深化
-- ============================================================

-- 私信会话
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    participant2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    unread_count_p1 INTEGER DEFAULT 0,
    unread_count_p2 INTEGER DEFAULT 0,
    is_blocked BOOLEAN DEFAULT false,
    blocked_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(participant1_id, participant2_id)
);

CREATE INDEX idx_conversations_p1 ON conversations(participant1_id);
CREATE INDEX idx_conversations_p2 ON conversations(participant2_id);
CREATE INDEX idx_conversations_last_msg ON conversations(last_message_at DESC);

-- 私信消息
CREATE TABLE IF NOT EXISTS private_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    content_type VARCHAR(20) DEFAULT 'text', -- text, image, file
    media_url TEXT,
    reply_to_id UUID REFERENCES private_messages(id),
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_private_messages_conv ON private_messages(conversation_id);
CREATE INDEX idx_private_messages_sender ON private_messages(sender_id);
CREATE INDEX idx_private_messages_created ON private_messages(created_at DESC);

-- 兴趣群组
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image TEXT,
    avatar_url TEXT,
    creator_id UUID NOT NULL REFERENCES auth.users(id),
    category VARCHAR(100),
    tags TEXT[],
    is_public BOOLEAN DEFAULT true,
    join_type VARCHAR(20) DEFAULT 'auto', -- auto, approval, invite_only
    max_members INTEGER DEFAULT 500,
    member_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    rules TEXT,
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, banned
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_groups_category ON groups(category);
CREATE INDEX idx_groups_status ON groups(status);
CREATE INDEX idx_groups_public ON groups(is_public) WHERE is_public = true;

-- 群组成员
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- member, moderator, admin
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ,
    is_muted BOOLEAN DEFAULT false,
    mute_until TIMESTAMPTZ,
    UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);

-- 群组帖子
CREATE TABLE IF NOT EXISTS group_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    content TEXT NOT NULL,
    content_type VARCHAR(20) DEFAULT 'text', -- text, image, video, link
    media_urls TEXT[],
    link_url TEXT,
    link_preview JSONB,
    is_pinned BOOLEAN DEFAULT false,
    pinned_at TIMESTAMPTZ,
    is_approved BOOLEAN DEFAULT true,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_group_posts_group ON group_posts(group_id);
CREATE INDEX idx_group_posts_author ON group_posts(author_id);
CREATE INDEX idx_group_posts_pinned ON group_posts(group_id, is_pinned) WHERE is_pinned = true;

-- 活动聚会
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image TEXT,
    event_type VARCHAR(20) DEFAULT 'offline', -- offline, online, hybrid
    location_name TEXT,
    location_address TEXT,
    gps_latitude DECIMAL(10, 8),
    gps_longitude DECIMAL(11, 8),
    online_url TEXT,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ,
    timezone VARCHAR(50) DEFAULT 'Asia/Shanghai',
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    registration_deadline TIMESTAMPTZ,
    registration_type VARCHAR(20) DEFAULT 'free', -- free, paid
    registration_fee DECIMAL(10, 2),
    requirements TEXT,
    agenda TEXT,
    status VARCHAR(20) DEFAULT 'upcoming', -- upcoming, ongoing, ended, cancelled
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start ON events(start_at);
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_location ON events(gps_latitude, gps_longitude) 
WHERE gps_latitude IS NOT NULL;

-- 活动报名
CREATE TABLE IF NOT EXISTS event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'registered', -- registered, attended, cancelled, no_show
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    checked_in_at TIMESTAMPTZ,
    notes TEXT,
    UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_regs_event ON event_registrations(event_id);
CREATE INDEX idx_event_regs_user ON event_registrations(user_id);

-- @提及系统
CREATE TABLE IF NOT EXISTS mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentioned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mentioned_by_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL, -- article, comment, post, message
    content_id UUID NOT NULL,
    mention_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mentions_user ON mentions(mentioned_user_id);
CREATE INDEX idx_mentions_unread ON mentions(mentioned_user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_mentions_content ON mentions(content_type, content_id);

-- ============================================================
-- 四、SEO与营销
-- ============================================================

-- 邮件订阅
CREATE TABLE IF NOT EXISTS email_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending', -- pending, active, unsubscribed
    confirm_token VARCHAR(255),
    confirmed_at TIMESTAMPTZ,
    unsubscribe_token VARCHAR(255) DEFAULT gen_random_uuid(),
    unsubscribed_at TIMESTAMPTZ,
    preferences JSONB DEFAULT '{"newsletter": true, "updates": true, "promotions": false}'::jsonb,
    source VARCHAR(100), -- 订阅来源
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_subs_status ON email_subscriptions(status);
CREATE INDEX idx_email_subs_token ON email_subscriptions(confirm_token) WHERE confirm_token IS NOT NULL;

-- 社交分享记录
CREATE TABLE IF NOT EXISTS social_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content_type VARCHAR(50) NOT NULL, -- article, profile, etc.
    content_id UUID NOT NULL,
    platform VARCHAR(50) NOT NULL, -- wechat, weibo, twitter, facebook, etc.
    url TEXT,
    share_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_social_shares_content ON social_shares(content_type, content_id);
CREATE INDEX idx_social_shares_user ON social_shares(user_id);

-- 推荐奖励
CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    referral_code VARCHAR(50),
    coins_earned INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- pending, claimed, expired
    condition VARCHAR(50), -- user_registered, first_post, etc.
    claimed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referral_referrer ON referral_rewards(referrer_id);
CREATE INDEX idx_referral_referred ON referral_rewards(referred_id);
CREATE INDEX idx_referral_status ON referral_rewards(status);

-- 添加推荐码字段到用户资料
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id);

-- ============================================================
-- 五、安全与备份
-- ============================================================

-- 2FA设置
CREATE TABLE IF NOT EXISTS user_2fa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    secret VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, active, disabled
    activated_at TIMESTAMPTZ,
    disabled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2FA恢复码
CREATE TABLE IF NOT EXISTS user_2fa_recovery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code_hash VARCHAR(255) NOT NULL,
    used BOOLEAN DEFAULT false,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_2fa_recovery_user ON user_2fa_recovery(user_id);

-- 设备管理
CREATE TABLE IF NOT EXISTS user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fingerprint VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    device_type VARCHAR(50), -- desktop, mobile, tablet
    user_agent TEXT,
    last_ip INET,
    last_active_at TIMESTAMPTZ,
    trusted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, fingerprint)
);

CREATE INDEX idx_user_devices_user ON user_devices(user_id);
CREATE INDEX idx_user_devices_fingerprint ON user_devices(fingerprint);

-- 安全日志
CREATE TABLE IF NOT EXISTS security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL, -- login, logout, password_change, 2fa_enabled, etc.
    event_data JSONB,
    ip_address INET,
    device_fingerprint VARCHAR(255),
    user_agent TEXT,
    severity VARCHAR(20) DEFAULT 'info', -- info, warning, critical
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_logs_user ON security_logs(user_id);
CREATE INDEX idx_security_logs_type ON security_logs(event_type);
CREATE INDEX idx_security_logs_created ON security_logs(created_at DESC);

-- 数据备份
CREATE TABLE IF NOT EXISTS data_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data_types TEXT[] NOT NULL, -- profile, articles, comments, collections, etc.
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    file_url TEXT,
    file_size BIGINT,
    expires_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_data_backups_user ON data_backups(user_id);
CREATE INDEX idx_data_backups_status ON data_backups(status);

-- 用户加密密钥
CREATE TABLE IF NOT EXISTS user_encryption_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    encrypted_master_key TEXT NOT NULL,
    key_derivation_salt VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 加密内容
CREATE TABLE IF NOT EXISTS encrypted_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type VARCHAR(50) DEFAULT 'note', -- note, diary, etc.
    encrypted_data JSONB NOT NULL, -- {iv, authTag, data}
    encrypted_key TEXT NOT NULL, -- 用用户公钥加密的内容密钥
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_encrypted_contents_user ON encrypted_contents(user_id);

-- ============================================================
-- 触发器函数
-- ============================================================

-- 更新 conversations 最后消息时间
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.content, 100),
        unread_count_p1 = CASE 
            WHEN NEW.sender_id = participant2_id THEN unread_count_p1 + 1 
            ELSE unread_count_p1 
        END,
        unread_count_p2 = CASE 
            WHEN NEW.sender_id = participant1_id THEN unread_count_p2 + 1 
            ELSE unread_count_p2 
        END
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation ON private_messages;
CREATE TRIGGER trigger_update_conversation
AFTER INSERT ON private_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message();

-- 更新群组统计
CREATE OR REPLACE FUNCTION update_group_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_group_members ON group_members;
CREATE TRIGGER trigger_update_group_members
AFTER INSERT OR DELETE ON group_members
FOR EACH ROW
EXECUTE FUNCTION update_group_stats();

-- 更新活动报名人数
CREATE OR REPLACE FUNCTION update_event_participants()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'registered' THEN
        UPDATE events SET current_participants = current_participants + 1 WHERE id = NEW.event_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'registered' AND NEW.status != 'registered' THEN
        UPDATE events SET current_participants = current_participants - 1 WHERE id = NEW.event_id;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'registered' THEN
        UPDATE events SET current_participants = current_participants - 1 WHERE id = OLD.event_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_event_regs ON event_registrations;
CREATE TRIGGER trigger_update_event_regs
AFTER INSERT OR UPDATE OR DELETE ON event_registrations
FOR EACH ROW
EXECUTE FUNCTION update_event_participants();

-- ============================================================
-- Row Level Security (RLS) 策略
-- ============================================================

-- 启用RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE encrypted_contents ENABLE ROW LEVEL SECURITY;

-- 会话RLS策略
CREATE POLICY "Users can view their own conversations" ON conversations
    FOR SELECT USING (participant1_id = auth.uid() OR participant2_id = auth.uid());

-- 私信RLS策略
CREATE POLICY "Users can view messages in their conversations" ON private_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations c 
            WHERE c.id = conversation_id 
            AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
        )
    );

-- 群组RLS策略
CREATE POLICY "Public groups are viewable by all" ON groups
    FOR SELECT USING (is_public = true OR EXISTS (
        SELECT 1 FROM group_members WHERE group_id = id AND user_id = auth.uid()
    ));

-- 加密内容RLS策略
CREATE POLICY "Users can only access their own encrypted content" ON encrypted_contents
    FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- 注释说明
-- ============================================================

COMMENT ON TABLE ai_writing_history IS 'AI写作助手使用历史';
COMMENT ON TABLE podcasts IS '音频播客内容';
COMMENT ON TABLE live_rooms IS '直播间信息';
COMMENT ON TABLE conversations IS '私信会话';
COMMENT ON TABLE groups IS '兴趣群组';
COMMENT ON TABLE events IS '活动聚会';
COMMENT ON TABLE email_subscriptions IS '邮件订阅列表';
COMMENT ON TABLE user_2fa IS '用户双因素认证设置';
COMMENT ON TABLE security_logs IS '用户安全事件日志';
COMMENT ON TABLE data_backups IS '用户数据备份记录';
COMMENT ON TABLE encrypted_contents IS '用户加密存储的私密内容';
