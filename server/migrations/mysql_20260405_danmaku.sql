-- ============================================================
-- 实时弹幕系统数据库迁移 - MySQL 版本
-- Real-time Danmaku System Migration for MySQL
-- ============================================================

-- 弹幕历史记录表
CREATE TABLE IF NOT EXISTS danmaku_history (
    id VARCHAR(50) PRIMARY KEY COMMENT '弹幕唯一ID',
    room_id VARCHAR(50) NOT NULL COMMENT '房间ID',
    content TEXT NOT NULL COMMENT '弹幕内容',
    author VARCHAR(50) DEFAULT '匿名用户' COMMENT '发送者昵称',
    author_id CHAR(36) NULL COMMENT '发送者用户ID',
    color VARCHAR(20) DEFAULT '#ffffff' COMMENT '弹幕颜色',
    type VARCHAR(20) DEFAULT 'scroll' COMMENT 'scroll, top, bottom',
    ip_address VARCHAR(45) NULL COMMENT 'IP地址',
    is_blocked TINYINT(1) DEFAULT 0 COMMENT '是否被屏蔽',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_danmaku_history_room (room_id),
    INDEX idx_danmaku_history_created (created_at DESC),
    INDEX idx_danmaku_history_author (author_id),
    INDEX idx_danmaku_history_blocked (is_blocked),
    CONSTRAINT fk_danmaku_history_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='弹幕历史记录表';

-- 弹幕房间表
CREATE TABLE IF NOT EXISTS danmaku_rooms (
    id VARCHAR(50) PRIMARY KEY COMMENT '房间ID',
    name VARCHAR(100) NOT NULL COMMENT '房间名称',
    description TEXT COMMENT '房间描述',
    article_id CHAR(36) NULL COMMENT '关联的文章ID',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否激活',
    max_danmaku_per_minute INT DEFAULT 30 COMMENT '每分钟最大弹幕数（限速）',
    require_login TINYINT(1) DEFAULT 0 COMMENT '是否需要登录',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_danmaku_rooms_article (article_id),
    INDEX idx_danmaku_rooms_active (is_active),
    CONSTRAINT fk_danmaku_rooms_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='弹幕房间表';

-- 弹幕屏蔽词表
CREATE TABLE IF NOT EXISTS danmaku_blocked_words (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    word VARCHAR(100) NOT NULL COMMENT '屏蔽词',
    is_regex TINYINT(1) DEFAULT 0 COMMENT '是否正则表达式',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_blocked_words_word (word),
    INDEX idx_blocked_words_regex (is_regex)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='弹幕屏蔽词表';

-- 用户弹幕设置表
CREATE TABLE IF NOT EXISTS danmaku_user_settings (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    default_color VARCHAR(20) DEFAULT '#ffffff' COMMENT '默认颜色',
    default_size VARCHAR(20) DEFAULT 'normal' COMMENT '默认大小',
    show_danmaku TINYINT(1) DEFAULT 1 COMMENT '是否显示弹幕',
    opacity DECIMAL(3,2) DEFAULT 0.80 COMMENT '不透明度 0-1',
    speed INT DEFAULT 5 COMMENT '速度 1-10',
    density VARCHAR(20) DEFAULT 'normal' COMMENT '弹幕密度：sparse, normal, dense',
    block_list JSON DEFAULT (JSON_ARRAY()) COMMENT '用户屏蔽关键词列表',
    UNIQUE KEY uk_danmaku_settings_user (user_id),
    CONSTRAINT fk_danmaku_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户弹幕设置表';

-- 插入默认屏蔽词
INSERT INTO danmaku_blocked_words (word) VALUES
('傻逼'), ('sb'), ('fuck'), ('shit'), ('垃圾'), ('废物'), ('去死'), ('nmsl'), ('尼玛'), ('cnm'),
('TMD'), ('他妈'), ('智障'), ('脑残'), ('滚'), ('贱人'), ('恶心'), ('变态')
ON DUPLICATE KEY UPDATE word = word;

-- 检查屏蔽词的函数
DELIMITER //
CREATE FUNCTION IF NOT EXISTS check_danmaku_content(content TEXT) RETURNS TINYINT(1)
DETERMINISTIC
BEGIN
    DECLARE blocked_word VARCHAR(100);
    DECLARE done INT DEFAULT FALSE;
    DECLARE cur CURSOR FOR SELECT word FROM danmaku_blocked_words WHERE is_regex = 0;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO blocked_word;
        IF done THEN
            LEAVE read_loop;
        END IF;
        IF INSTR(LOWER(content), LOWER(blocked_word)) > 0 THEN
            CLOSE cur;
            RETURN 0;
        END IF;
    END LOOP;
    CLOSE cur;
    
    RETURN 1;
END //
DELIMITER ;

-- 限速检查存储过程
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS check_danmaku_rate_limit(
    IN room_id VARCHAR(50),
    IN user_ip VARCHAR(45),
    IN max_per_minute INT,
    OUT allowed TINYINT(1)
)
BEGIN
    DECLARE recent_count INT;
    
    -- 统计该房间最近1分钟内的弹幕数
    SELECT COUNT(*) INTO recent_count 
    FROM danmaku_history 
    WHERE room_id = room_id 
      AND ip_address = user_ip
      AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE);
    
    IF recent_count >= max_per_minute THEN
        SET allowed = 0;
    ELSE
        SET allowed = 1;
    END IF;
END //
DELIMITER ;

-- 创建默认弹幕房间
INSERT INTO danmaku_rooms (id, name, description, is_active) VALUES
('global', '全局弹幕池', '全站通用弹幕', 1),
('home', '首页弹幕', '首页特别弹幕房间', 1)
ON DUPLICATE KEY UPDATE id = id;
