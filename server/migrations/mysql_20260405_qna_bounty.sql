-- ============================================================
-- 问答悬赏系统数据库迁移 - MySQL 版本
-- Q&A Bounty System Migration for MySQL
-- ============================================================

-- 问题表
CREATE TABLE IF NOT EXISTS qna_questions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    author_id CHAR(36) NOT NULL,
    title TEXT NOT NULL COMMENT '问题标题',
    content TEXT NOT NULL COMMENT '问题内容',
    tags JSON DEFAULT (JSON_ARRAY()) COMMENT '标签数组',
    bounty_amount INT NOT NULL DEFAULT 0 COMMENT '悬赏金币数',
    bounty_expires_at TIMESTAMP NULL COMMENT '悬赏截止时间',
    allow_multiple_answers TINYINT(1) DEFAULT 0 COMMENT '是否允许多个答案',
    status VARCHAR(20) DEFAULT 'open' COMMENT '状态：open, resolved, closed',
    view_count INT DEFAULT 0 COMMENT '浏览量',
    accepted_answer_id CHAR(36) NULL COMMENT '采纳的答案ID',
    resolved_at TIMESTAMP NULL COMMENT '解决时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_qna_questions_author (author_id),
    INDEX idx_qna_questions_status (status),
    INDEX idx_qna_questions_created (created_at DESC),
    INDEX idx_qna_questions_bounty (bounty_amount DESC),
    FULLTEXT INDEX idx_qna_questions_title (title),
    CONSTRAINT fk_qna_questions_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='问答系统问题表';

-- 答案表
CREATE TABLE IF NOT EXISTS qna_answers (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    question_id CHAR(36) NOT NULL,
    author_id CHAR(36) NOT NULL,
    content TEXT NOT NULL COMMENT '答案内容',
    vote_count INT DEFAULT 0 COMMENT '投票数',
    is_accepted TINYINT(1) DEFAULT 0 COMMENT '是否被采纳',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_qna_answers_question (question_id),
    INDEX idx_qna_answers_author (author_id),
    INDEX idx_qna_answers_vote (vote_count DESC),
    CONSTRAINT fk_qna_answers_question FOREIGN KEY (question_id) REFERENCES qna_questions(id) ON DELETE CASCADE,
    CONSTRAINT fk_qna_answers_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='问答系统答案表';

-- 投票表（答案点赞/反对）
CREATE TABLE IF NOT EXISTS qna_votes (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    answer_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    type VARCHAR(10) NOT NULL COMMENT 'up=赞同, down=反对',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_qna_votes (answer_id, user_id),
    INDEX idx_qna_votes_answer (answer_id),
    INDEX idx_qna_votes_user (user_id),
    CONSTRAINT fk_qna_votes_answer FOREIGN KEY (answer_id) REFERENCES qna_answers(id) ON DELETE CASCADE,
    CONSTRAINT fk_qna_votes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_qna_votes_type CHECK (type IN ('up', 'down'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='答案投票表';

-- 添加外键约束（采纳的答案）
ALTER TABLE qna_questions
    ADD CONSTRAINT fk_qna_questions_accepted_answer
    FOREIGN KEY (accepted_answer_id) REFERENCES qna_answers(id)
    ON DELETE SET NULL;

-- 为用户表添加冻结金币字段
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS frozen_coins INT DEFAULT 0 COMMENT '冻结的金币' AFTER coins;

-- 增加浏览量的存储过程
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS increment_question_views(IN question_id CHAR(36))
BEGIN
    UPDATE qna_questions 
    SET view_count = view_count + 1 
    WHERE id = question_id;
END //
DELIMITER ;

-- 冻结金币的存储过程
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS freeze_coins(
    IN user_id CHAR(36),
    IN amount INT,
    OUT success BOOLEAN
)
BEGIN
    DECLARE user_coins INT;
    DECLARE frozen INT;
    
    -- 获取用户余额
    SELECT coins INTO user_coins FROM users WHERE id = user_id;
    
    IF user_coins IS NULL OR user_coins < amount THEN
        SET success = FALSE;
    ELSE
        -- 扣除金币并增加冻结金额
        UPDATE users 
        SET coins = coins - amount, 
            frozen_coins = COALESCE(frozen_coins, 0) + amount 
        WHERE id = user_id;
        SET success = TRUE;
    END IF;
END //
DELIMITER ;

-- 解冻金币的存储过程
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS unfreeze_coins(
    IN user_id CHAR(36),
    IN amount INT
)
BEGIN
    UPDATE users 
    SET coins = coins + amount,
        frozen_coins = GREATEST(COALESCE(frozen_coins, 0) - amount, 0)
    WHERE id = user_id;
END //
DELIMITER ;

-- 发放悬赏的存储过程
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS transfer_bounty(
    IN from_user_id CHAR(36),
    IN to_user_id CHAR(36),
    IN amount INT,
    IN question_id CHAR(36),
    IN answer_id CHAR(36),
    OUT success BOOLEAN
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET success = FALSE;
    END;
    
    START TRANSACTION;
    
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
        id, user_id, type, amount, description, reference_id, reference_type, created_at
    ) VALUES (
        UUID(), to_user_id, 'bounty_reward', amount, '回答悬赏奖励', answer_id, 'qna_answer', NOW()
    );
    
    COMMIT;
    SET success = TRUE;
END //
DELIMITER ;

-- 更新答案投票数的存储过程
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS update_answer_votes(IN answer_id CHAR(36))
BEGIN
    DECLARE up_votes INT;
    DECLARE down_votes INT;
    DECLARE total_votes INT;
    
    SELECT COUNT(*) INTO up_votes FROM qna_votes WHERE answer_id = answer_id AND type = 'up';
    SELECT COUNT(*) INTO down_votes FROM qna_votes WHERE answer_id = answer_id AND type = 'down';
    
    SET total_votes = up_votes - down_votes;
    
    UPDATE qna_answers SET vote_count = total_votes WHERE id = answer_id;
END //
DELIMITER ;

-- 插入示例数据（可选）
-- INSERT INTO qna_questions (author_id, title, content, bounty_amount, tags) VALUES
-- ('your-user-uuid', '如何学习Vue3?', '想学习Vue3，有什么好的教程推荐吗？', 100, '["Vue", "前端"]');
