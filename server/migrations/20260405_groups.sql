-- ============================================================
-- 话题圈子系统数据库迁移
-- Topic Groups System Migration
-- ============================================================

-- 圈子表
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category VARCHAR(50) DEFAULT '其他',
    avatar TEXT,
    cover_image TEXT,
    rules TEXT DEFAULT '',
    is_private BOOLEAN DEFAULT FALSE,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 圈子成员表
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- admin, moderator, member
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- 圈子帖子表
CREATE TABLE IF NOT EXISTS group_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'discussion', -- discussion, announcement, question
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 帖子点赞表
CREATE TABLE IF NOT EXISTS group_post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES group_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- 帖子评论表
CREATE TABLE IF NOT EXISTS group_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES group_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES group_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_groups_category ON groups(category);
CREATE INDEX IF NOT EXISTS idx_groups_creator ON groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_groups_created ON groups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_groups_members ON groups(member_count DESC);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_role ON group_members(role);

CREATE INDEX IF NOT EXISTS idx_group_posts_group ON group_posts(group_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_author ON group_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_created ON group_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_posts_pinned ON group_posts(is_pinned) WHERE is_pinned = TRUE;

CREATE INDEX IF NOT EXISTS idx_group_post_likes_post ON group_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_group_post_likes_user ON group_post_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_group_comments_post ON group_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_group_comments_parent ON group_comments(parent_id);

-- 更新触发器函数
CREATE OR REPLACE FUNCTION update_group_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 圈子更新触发器
DROP TRIGGER IF EXISTS trigger_groups_updated ON groups;
CREATE TRIGGER trigger_groups_updated
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_group_updated_at();

-- 帖子更新触发器
DROP TRIGGER IF EXISTS trigger_group_posts_updated ON group_posts;
CREATE TRIGGER trigger_group_posts_updated
    BEFORE UPDATE ON group_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_group_updated_at();

-- 评论更新触发器
DROP TRIGGER IF EXISTS trigger_group_comments_updated ON group_comments;
CREATE TRIGGER trigger_group_comments_updated
    BEFORE UPDATE ON group_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_group_updated_at();

-- 增加帖子点赞数函数
CREATE OR REPLACE FUNCTION increment_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE group_posts SET like_count = like_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- 减少帖子点赞数函数
CREATE OR REPLACE FUNCTION decrement_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE group_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- 增加帖子评论数函数
CREATE OR REPLACE FUNCTION increment_post_comments(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE group_posts SET comment_count = comment_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- 通用计数函数
CREATE OR REPLACE FUNCTION increment(x INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN x + 1;
END;
$$ LANGUAGE plpgsql;

-- 启用 RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_comments ENABLE ROW LEVEL SECURITY;

-- 圈子 RLS 策略
CREATE POLICY "Public groups are viewable" ON groups
    FOR SELECT USING (is_private = FALSE);

CREATE POLICY "Private groups viewable by members" ON groups
    FOR SELECT USING (
        is_private = TRUE AND 
        EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid())
    );

CREATE POLICY "Users can create groups" ON groups
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Only admins can update groups" ON groups
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid() AND role = 'admin')
    );

-- 成员 RLS 策略
CREATE POLICY "Group members are viewable" ON group_members
    FOR SELECT USING (true);

CREATE POLICY "Users can join public groups" ON group_members
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (SELECT 1 FROM groups WHERE id = group_id AND is_private = FALSE)
    );

CREATE POLICY "Users can leave groups" ON group_members
    FOR DELETE USING (user_id = auth.uid());

-- 帖子 RLS 策略
CREATE POLICY "Approved posts are viewable" ON group_posts
    FOR SELECT USING (is_approved = TRUE);

CREATE POLICY "Members can create posts" ON group_posts
    FOR INSERT WITH CHECK (
        author_id = auth.uid() AND
        EXISTS (SELECT 1 FROM group_members WHERE group_id = group_posts.group_id AND user_id = auth.uid())
    );

CREATE POLICY "Authors can update own posts" ON group_posts
    FOR UPDATE USING (author_id = auth.uid());

-- 点赞 RLS 策略
CREATE POLICY "Likes are viewable" ON group_post_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can like posts" ON group_post_likes
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike posts" ON group_post_likes
    FOR DELETE USING (user_id = auth.uid());

-- 评论 RLS 策略
CREATE POLICY "Comments are viewable" ON group_comments
    FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON group_comments
    FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can delete own comments" ON group_comments
    FOR DELETE USING (author_id = auth.uid());

-- 添加评论字段说明
COMMENT ON TABLE groups IS '话题圈子表';
COMMENT ON TABLE group_members IS '圈子成员表';
COMMENT ON TABLE group_posts IS '圈子帖子表';
COMMENT ON TABLE group_post_likes IS '帖子点赞表';
COMMENT ON TABLE group_comments IS '帖子评论表';

-- 插入示例圈子数据（可选）
INSERT INTO groups (name, slug, description, category, creator_id, member_count) VALUES
('前端开发交流', 'frontend-dev', '分享前端技术、框架、最佳实践', '技术', '00000000-0000-0000-0000-000000000000', 1),
('读书笔记', 'book-notes', '分享好书推荐和阅读心得', '生活', '00000000-0000-0000-0000-000000000000', 1),
('游戏玩家', 'gamers', '游戏推荐、攻略分享、开黑组队', '娱乐', '00000000-0000-0000-0000-000000000000', 1)
ON CONFLICT (name) DO NOTHING;
