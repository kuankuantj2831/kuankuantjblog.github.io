-- ============================================================
-- 问答悬赏系统数据库迁移
-- Q&A Bounty System Migration
-- ============================================================

-- 问题表
CREATE TABLE IF NOT EXISTS qna_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    bounty_amount INTEGER NOT NULL DEFAULT 0,
    bounty_expires_at TIMESTAMP WITH TIME ZONE,
    allow_multiple_answers BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'open', -- open, resolved, closed
    view_count INTEGER DEFAULT 0,
    accepted_answer_id UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 答案表
CREATE TABLE IF NOT EXISTS qna_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES qna_questions(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    vote_count INTEGER DEFAULT 0,
    is_accepted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 投票表（答案点赞/反对）
CREATE TABLE IF NOT EXISTS qna_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    answer_id UUID NOT NULL REFERENCES qna_answers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('up', 'down')), -- up=赞同, down=反对
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(answer_id, user_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_qna_questions_author ON qna_questions(author_id);
CREATE INDEX IF NOT EXISTS idx_qna_questions_status ON qna_questions(status);
CREATE INDEX IF NOT EXISTS idx_qna_questions_created ON qna_questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qna_questions_tags ON qna_questions USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_qna_questions_bounty ON qna_questions(bounty_amount DESC) WHERE bounty_amount > 0;

CREATE INDEX IF NOT EXISTS idx_qna_answers_question ON qna_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_qna_answers_author ON qna_answers(author_id);
CREATE INDEX IF NOT EXISTS idx_qna_answers_vote ON qna_answers(vote_count DESC);

CREATE INDEX IF NOT EXISTS idx_qna_votes_answer ON qna_votes(answer_id);
CREATE INDEX IF NOT EXISTS idx_qna_votes_user ON qna_votes(user_id);

-- 添加外键约束
ALTER TABLE qna_questions 
    ADD CONSTRAINT fk_qna_questions_accepted_answer 
    FOREIGN KEY (accepted_answer_id) REFERENCES qna_answers(id) 
    ON DELETE SET NULL;

-- 更新触发器函数
CREATE OR REPLACE FUNCTION update_qna_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_qna_questions_updated ON qna_questions;
CREATE TRIGGER trigger_qna_questions_updated
    BEFORE UPDATE ON qna_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_qna_updated_at();

DROP TRIGGER IF EXISTS trigger_qna_answers_updated ON qna_answers;
CREATE TRIGGER trigger_qna_answers_updated
    BEFORE UPDATE ON qna_answers
    FOR EACH ROW
    EXECUTE FUNCTION update_qna_updated_at();

-- 增加浏览量函数
CREATE OR REPLACE FUNCTION increment_question_views(question_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE qna_questions 
    SET view_count = view_count + 1 
    WHERE id = question_id;
END;
$$ LANGUAGE plpgsql;

-- 冻结金币函数（用于悬赏）
CREATE OR REPLACE FUNCTION freeze_coins(
    user_id UUID,
    amount INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    user_coins INTEGER;
BEGIN
    -- 获取用户余额
    SELECT coins INTO user_coins FROM users WHERE id = user_id;
    
    IF user_coins < amount THEN
        RETURN FALSE;
    END IF;
    
    -- 扣除金币
    UPDATE users SET coins = coins - amount WHERE id = user_id;
    
    -- 记录冻结金额（可以添加到用户表的冻结字段，或单独创建冻结记录表）
    UPDATE users SET frozen_coins = COALESCE(frozen_coins, 0) + amount WHERE id = user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 解冻金币函数
CREATE OR REPLACE FUNCTION unfreeze_coins(
    user_id UUID,
    amount INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE users 
    SET coins = coins + amount,
        frozen_coins = GREATEST(COALESCE(frozen_coins, 0) - amount, 0)
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- 发放悬赏函数
CREATE OR REPLACE FUNCTION transfer_bounty(
    from_user_id UUID,
    to_user_id UUID,
    amount INTEGER,
    question_id UUID,
    answer_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- 扣除冻结的金币
    UPDATE users 
    SET frozen_coins = GREATEST(COALESCE(frozen_coins, 0) - amount, 0)
    WHERE id = from_user_id;
    
    -- 给答案作者增加金币
    UPDATE users 
    SET coins = coins + amount,
        total_earned = COALESCE(total_earned, 0) + amount
    WHERE id = to_user_id;
    
    -- 记录交易
    INSERT INTO coin_transactions (
        user_id,
        type,
        amount,
        description,
        reference_id,
        reference_type,
        created_at
    ) VALUES (
        to_user_id,
        'bounty_reward',
        amount,
        '回答悬赏奖励',
        answer_id,
        'qna_answer',
        NOW()
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 更新答案投票数函数
CREATE OR REPLACE FUNCTION update_answer_votes(answer_id UUID)
RETURNS VOID AS $$
DECLARE
    up_votes INTEGER;
    down_votes INTEGER;
    total_votes INTEGER;
BEGIN
    SELECT COUNT(*) INTO up_votes FROM qna_votes WHERE answer_id = answer_id AND type = 'up';
    SELECT COUNT(*) INTO down_votes FROM qna_votes WHERE answer_id = answer_id AND type = 'down';
    
    total_votes := up_votes - down_votes;
    
    UPDATE qna_answers SET vote_count = total_votes WHERE id = answer_id;
END;
$$ LANGUAGE plpgsql;

-- 为用户表添加冻结金币字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS frozen_coins INTEGER DEFAULT 0;

-- 启用 RLS（行级安全）
ALTER TABLE qna_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qna_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE qna_votes ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "Questions are viewable by everyone" ON qna_questions
    FOR SELECT USING (true);

CREATE POLICY "Users can create questions" ON qna_questions
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own questions" ON qna_questions
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own questions" ON qna_questions
    FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Answers are viewable by everyone" ON qna_answers
    FOR SELECT USING (true);

CREATE POLICY "Users can create answers" ON qna_answers
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own answers" ON qna_answers
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Votes are viewable by everyone" ON qna_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can create votes" ON qna_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes" ON qna_votes
    FOR DELETE USING (auth.uid() = user_id);

-- 添加评论字段说明
COMMENT ON TABLE qna_questions IS '问答系统问题表';
COMMENT ON TABLE qna_answers IS '问答系统答案表';
COMMENT ON TABLE qna_votes IS '答案投票表';
