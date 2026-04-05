-- =====================================================
-- 第六轮创新功能: 完整数据库迁移
-- 创建时间: 2026-04-04
-- =====================================================

-- ==================== AI大模型集成表 ====================

-- AI对话历史表
CREATE TABLE IF NOT EXISTS ai_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(100) NOT NULL,
    provider VARCHAR(50) DEFAULT 'siliconflow',
    model VARCHAR(100),
    messages JSONB DEFAULT '[]',
    context_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP,
    token_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session ON ai_conversations(session_id);

-- AI生成的内容表
CREATE TABLE IF NOT EXISTS ai_generated_content (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- title, summary, content, code_review, etc.
    prompt TEXT,
    result TEXT,
    parameters JSONB DEFAULT '{}',
    model VARCHAR(100),
    tokens_used INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT
);

CREATE INDEX IF NOT EXISTS idx_ai_content_user ON ai_generated_content(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_content_type ON ai_generated_content(type);

-- ==================== 实时协作表 ====================

-- 协作房间表
CREATE TABLE IF NOT EXISTS collaboration_rooms (
    id VARCHAR(36) PRIMARY KEY,
    article_id INTEGER REFERENCES articles(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    host_id INTEGER NOT NULL REFERENCES users(id),
    max_users INTEGER DEFAULT 10,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_collab_rooms_article ON collaboration_rooms(article_id);
CREATE INDEX IF NOT EXISTS idx_collab_rooms_host ON collaboration_rooms(host_id);

-- 协作消息表
CREATE TABLE IF NOT EXISTS collaboration_messages (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(36) NOT NULL REFERENCES collaboration_rooms(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(50) DEFAULT 'text', -- text, system, operation
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_collab_messages_room ON collaboration_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_collab_messages_created ON collaboration_messages(created_at);

-- 协作内容快照表
CREATE TABLE IF NOT EXISTS collaboration_snapshots (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(36) NOT NULL REFERENCES collaboration_rooms(id) ON DELETE CASCADE,
    content TEXT,
    version INTEGER NOT NULL,
    operations JSONB DEFAULT '[]',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_collab_snapshots_room ON collaboration_snapshots(room_id);

-- 白板表
CREATE TABLE IF NOT EXISTS whiteboards (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    width INTEGER DEFAULT 1920,
    height INTEGER DEFAULT 1080,
    owner_id INTEGER NOT NULL REFERENCES users(id),
    template VARCHAR(50) DEFAULT 'blank',
    elements JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_whiteboards_owner ON whiteboards(owner_id);

-- 视频会议房间表
CREATE TABLE IF NOT EXISTS video_rooms (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    host_id INTEGER NOT NULL REFERENCES users(id),
    max_participants INTEGER DEFAULT 20,
    settings JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active', -- active, ended
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);

-- 视频会议参与者表
CREATE TABLE IF NOT EXISTS video_participants (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(36) NOT NULL REFERENCES video_rooms(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    is_screen_sharing BOOLEAN DEFAULT FALSE,
    is_muted BOOLEAN DEFAULT FALSE,
    is_video_off BOOLEAN DEFAULT FALSE,
    UNIQUE(room_id, user_id, joined_at)
);

-- ==================== 游戏化社交表 ====================

-- 用户宠物表
CREATE TABLE IF NOT EXISTS user_pets (
    id VARCHAR(36) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    species VARCHAR(50) NOT NULL,
    level INTEGER DEFAULT 0,
    exp INTEGER DEFAULT 0,
    stage INTEGER DEFAULT 0,
    hunger INTEGER DEFAULT 80 CHECK (hunger >= 0 AND hunger <= 100),
    happiness INTEGER DEFAULT 80 CHECK (happiness >= 0 AND happiness <= 100),
    health INTEGER DEFAULT 100 CHECK (health >= 0 AND health <= 100),
    hygiene INTEGER DEFAULT 80 CHECK (hygiene >= 0 AND hygiene <= 100),
    energy INTEGER DEFAULT 100 CHECK (energy >= 0 AND energy <= 100),
    accessories JSONB DEFAULT '[]',
    skills JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_fed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_fed INTEGER DEFAULT 0,
    total_played INTEGER DEFAULT 0,
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_pets_user ON user_pets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_pets_species ON user_pets(species);

-- 用户库存表
CREATE TABLE IF NOT EXISTS user_inventory (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id VARCHAR(50) NOT NULL,
    quantity INTEGER DEFAULT 0 CHECK (quantity >= 0),
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_user ON user_inventory(user_id);

-- 用户任务表
CREATE TABLE IF NOT EXISTS user_missions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mission_id VARCHAR(50) NOT NULL,
    progress INTEGER DEFAULT 0,
    target INTEGER,
    completed BOOLEAN DEFAULT FALSE,
    claimed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    claimed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, mission_id)
);

CREATE INDEX IF NOT EXISTS idx_user_missions_user ON user_missions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_missions_completed ON user_missions(completed, claimed);

-- 成就表
CREATE TABLE IF NOT EXISTS achievements (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'beginner', -- beginner, intermediate, advanced, expert, legendary
    icon VARCHAR(200),
    requirement JSONB NOT NULL,
    reward_coins INTEGER DEFAULT 0,
    reward_badge VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户成就表
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(50) NOT NULL REFERENCES achievements(id),
    progress INTEGER DEFAULT 0,
    unlocked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

-- 成就展示表
CREATE TABLE IF NOT EXISTS user_achievement_showcase (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(50) NOT NULL REFERENCES achievements(id),
    position INTEGER NOT NULL CHECK (position >= 1 AND position <= 6),
    UNIQUE(user_id, position),
    UNIQUE(user_id, achievement_id)
);

-- 挑战表
CREATE TABLE IF NOT EXISTS challenges (
    id VARCHAR(36) PRIMARY KEY,
    challenger_id INTEGER NOT NULL REFERENCES users(id),
    opponent_id INTEGER NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    duration INTEGER DEFAULT 7, -- days
    status VARCHAR(50) DEFAULT 'pending', -- pending, active, completed, cancelled
    challenger_score INTEGER DEFAULT 0,
    opponent_score INTEGER DEFAULT 0,
    winner_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    end_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_challenges_challenger ON challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_challenges_opponent ON challenges(opponent_id);

-- ==================== 低代码平台表 ====================

-- 低代码页面表
CREATE TABLE IF NOT EXISTS lowcode_pages (
    id VARCHAR(36) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    title VARCHAR(200),
    description TEXT,
    template VARCHAR(50) DEFAULT 'blank',
    components JSONB DEFAULT '[]',
    styles JSONB DEFAULT '{}',
    scripts JSONB DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    version INTEGER DEFAULT 1,
    is_published BOOLEAN DEFAULT FALSE,
    published_url TEXT,
    custom_domain VARCHAR(200),
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lowcode_pages_user ON lowcode_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_lowcode_pages_published ON lowcode_pages(is_published);

-- 低代码页面版本表
CREATE TABLE IF NOT EXISTS lowcode_page_versions (
    id SERIAL PRIMARY KEY,
    page_id VARCHAR(36) NOT NULL REFERENCES lowcode_pages(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    components JSONB,
    styles JSONB,
    scripts JSONB,
    settings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    UNIQUE(page_id, version)
);

-- 低代码表单表
CREATE TABLE IF NOT EXISTS lowcode_forms (
    id VARCHAR(36) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    fields JSONB DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    responses_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lowcode_forms_user ON lowcode_forms(user_id);

-- 表单回复表
CREATE TABLE IF NOT EXISTS lowcode_form_responses (
    id VARCHAR(36) PRIMARY KEY,
    form_id VARCHAR(36) NOT NULL REFERENCES lowcode_forms(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    data JSONB NOT NULL,
    ip VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_form_responses_form ON lowcode_form_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_created ON lowcode_form_responses(created_at);

-- 工作流表
CREATE TABLE IF NOT EXISTS lowcode_workflows (
    id VARCHAR(36) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    trigger VARCHAR(50) NOT NULL, -- form_submit, schedule, webhook, manual
    trigger_config JSONB DEFAULT '{}',
    nodes JSONB DEFAULT '[]',
    connections JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT FALSE,
    run_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workflows_user ON lowcode_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger ON lowcode_workflows(trigger, is_active);

-- 工作流执行记录表
CREATE TABLE IF NOT EXISTS lowcode_workflow_executions (
    id VARCHAR(36) PRIMARY KEY,
    workflow_id VARCHAR(36) NOT NULL REFERENCES lowcode_workflows(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'running', -- running, completed, failed
    input JSONB,
    output JSONB,
    error TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workflow_exec_workflow ON lowcode_workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_exec_status ON lowcode_workflow_executions(status);

-- 自定义组件表
CREATE TABLE IF NOT EXISTS lowcode_custom_components (
    id VARCHAR(36) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    props JSONB DEFAULT '[]',
    template TEXT,
    styles TEXT,
    scripts TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    use_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_custom_components_user ON lowcode_custom_components(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_components_public ON lowcode_custom_components(is_public);

-- ==================== PWA与边缘计算表 ====================

-- PWA版本表
CREATE TABLE IF NOT EXISTS pwa_versions (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL,
    release_notes TEXT,
    released_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);

-- 离线保存内容表
CREATE TABLE IF NOT EXISTS offline_saved (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title VARCHAR(200),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    UNIQUE(user_id, url)
);

CREATE INDEX IF NOT EXISTS idx_offline_saved_user ON offline_saved(user_id);

-- 后台同步任务表
CREATE TABLE IF NOT EXISTS background_sync_tasks (
    id VARCHAR(100) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL,
    data JSONB,
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sync_tasks_user ON background_sync_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_tasks_status ON background_sync_tasks(status, scheduled_at);

-- 推送订阅表
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    endpoint TEXT NOT NULL UNIQUE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    p256dh VARCHAR(255) NOT NULL,
    auth VARCHAR(255) NOT NULL,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

-- ==================== 插入默认数据 ====================

-- 插入默认成就
INSERT INTO achievements (id, name, description, category, icon, requirement, reward_coins) VALUES
('pet_owner', '宠物主人', '领养您的第一只宠物', 'beginner', '🐾', '{"type": "pet_adopted", "count": 1}', 100),
('pet_master', '宠物大师', '将宠物培养到50级', 'advanced', '👑', '{"type": "pet_level", "level": 50}', 500),
('task_master', '任务达人', '完成100个日常任务', 'intermediate', '📋', '{"type": "missions_completed", "count": 100}', 300),
('challenger', '挑战者', '赢得10次竞技挑战', 'intermediate', '🏆', '{"type": "challenges_won", "count": 10}', 400),
('collector', '收藏家', '解锁50个成就', 'expert', '🎖️', '{"type": "achievements_unlocked", "count": 50}', 1000),
('legend', '传奇', '达到100级', 'legendary', '⭐', '{"type": "user_level", "level": 100}', 5000)
ON CONFLICT (id) DO NOTHING;

-- ==================== 创建触发器 ====================

-- 更新时间触发器（如果已存在则跳过）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ai_conversations_updated_at') THEN
        CREATE TRIGGER update_ai_conversations_updated_at
            BEFORE UPDATE ON ai_conversations
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 创建行级安全策略
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whiteboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE lowcode_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lowcode_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE lowcode_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE lowcode_custom_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_saved ENABLE ROW LEVEL SECURITY;
ALTER TABLE background_sync_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY ai_conversations_user ON ai_conversations
    FOR ALL USING (user_id = current_setting('app.current_user_id')::INTEGER);

CREATE POLICY user_pets_user ON user_pets
    FOR ALL USING (user_id = current_setting('app.current_user_id')::INTEGER);

CREATE POLICY lowcode_pages_user ON lowcode_pages
    FOR ALL USING (user_id = current_setting('app.current_user_id')::INTEGER);

CREATE POLICY lowcode_forms_user ON lowcode_forms
    FOR ALL USING (user_id = current_setting('app.current_user_id')::INTEGER);

CREATE POLICY offline_saved_user ON offline_saved
    FOR ALL USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- 注释
COMMENT ON TABLE ai_conversations IS 'AI对话历史记录';
COMMENT ON TABLE user_pets IS '用户虚拟宠物';
COMMENT ON TABLE lowcode_pages IS '低代码平台页面';
COMMENT ON TABLE lowcode_workflows IS '低代码工作流';
COMMENT ON TABLE offline_saved IS 'PWA离线保存内容';
