-- 社交功能数据库迁移
-- 包含：关注系统、私信系统、@提及功能、收藏夹系统、阅读进度

-- 用户关注关系表
CREATE TABLE IF NOT EXISTS user_follows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    follower_id INT NOT NULL COMMENT '关注者ID',
    following_id INT NOT NULL COMMENT '被关注者ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_follow (follower_id, following_id),
    INDEX idx_follower (follower_id),
    INDEX idx_following (following_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 私信消息表
CREATE TABLE IF NOT EXISTS private_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL COMMENT '发送者ID',
    receiver_id INT NOT NULL COMMENT '接收者ID',
    content TEXT NOT NULL COMMENT '消息内容',
    is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读',
    read_at TIMESTAMP NULL COMMENT '阅读时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sender (sender_id),
    INDEX idx_receiver (receiver_id),
    INDEX idx_conversation (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id)),
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 提及通知表
CREATE TABLE IF NOT EXISTS mention_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mentioned_user_id INT NOT NULL COMMENT '被提及用户ID',
    mentioned_by_user_id INT NOT NULL COMMENT '提及者ID',
    article_id INT COMMENT '相关文章ID',
    comment_id INT COMMENT '相关评论ID',
    content TEXT COMMENT '提及内容预览',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_mentioned_user (mentioned_user_id),
    INDEX idx_unread (mentioned_user_id, is_read),
    FOREIGN KEY (mentioned_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mentioned_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户收藏夹表
CREATE TABLE IF NOT EXISTS user_collections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    name VARCHAR(100) NOT NULL COMMENT '收藏夹名称',
    description TEXT COMMENT '收藏夹描述',
    is_public BOOLEAN DEFAULT TRUE COMMENT '是否公开',
    icon VARCHAR(50) DEFAULT '⭐' COMMENT '收藏夹图标',
    color VARCHAR(20) DEFAULT '#667eea' COMMENT '收藏夹颜色',
    sort_order INT DEFAULT 0 COMMENT '排序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 收藏文章关联表
CREATE TABLE IF NOT EXISTS collection_articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    collection_id INT NOT NULL COMMENT '收藏夹ID',
    article_id INT NOT NULL COMMENT '文章ID',
    note TEXT COMMENT '收藏备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_collection_article (collection_id, article_id),
    INDEX idx_collection (collection_id),
    INDEX idx_article (article_id),
    FOREIGN KEY (collection_id) REFERENCES user_collections(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 阅读进度表
CREATE TABLE IF NOT EXISTS reading_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    article_id INT NOT NULL COMMENT '文章ID',
    progress_percent INT DEFAULT 0 COMMENT '阅读进度百分比',
    scroll_position INT DEFAULT 0 COMMENT '滚动位置',
    last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_finished BOOLEAN DEFAULT FALSE COMMENT '是否读完',
    finished_at TIMESTAMP NULL COMMENT '完成时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_article (user_id, article_id),
    INDEX idx_user (user_id),
    INDEX idx_article (article_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 阅读偏好设置表
CREATE TABLE IF NOT EXISTS reading_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    font_size INT DEFAULT 16 COMMENT '字体大小(px)',
    line_height DECIMAL(3,1) DEFAULT 1.8 COMMENT '行高',
    theme VARCHAR(20) DEFAULT 'light' COMMENT '主题: light/dark/sepia',
    font_family VARCHAR(50) DEFAULT 'system' COMMENT '字体',
    content_width VARCHAR(10) DEFAULT 'medium' COMMENT '内容宽度: narrow/medium/wide',
    auto_night_mode BOOLEAN DEFAULT FALSE COMMENT '自动夜间模式',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 更新用户统计表，添加社交相关字段
ALTER TABLE author_stats 
ADD COLUMN IF NOT EXISTS followers_count INT DEFAULT 0 COMMENT '粉丝数',
ADD COLUMN IF NOT EXISTS following_count INT DEFAULT 0 COMMENT '关注数',
ADD COLUMN IF NOT EXISTS unread_messages INT DEFAULT 0 COMMENT '未读私信数',
ADD COLUMN IF NOT EXISTS unread_mentions INT DEFAULT 0 COMMENT '未读提及数';

-- 创建触发器：自动更新粉丝数
DELIMITER //

CREATE TRIGGER IF NOT EXISTS update_followers_count_after_insert
AFTER INSERT ON user_follows
FOR EACH ROW
BEGIN
    UPDATE author_stats 
    SET followers_count = followers_count + 1 
    WHERE author_id = NEW.following_id;
    
    UPDATE author_stats 
    SET following_count = following_count + 1 
    WHERE author_id = NEW.follower_id;
END//

CREATE TRIGGER IF NOT EXISTS update_followers_count_after_delete
AFTER DELETE ON user_follows
FOR EACH ROW
BEGIN
    UPDATE author_stats 
    SET followers_count = GREATEST(0, followers_count - 1) 
    WHERE author_id = OLD.following_id;
    
    UPDATE author_stats 
    SET following_count = GREATEST(0, following_count - 1) 
    WHERE author_id = OLD.follower_id;
END//

DELIMITER ;

-- 插入默认收藏夹（稍后用户可以自定义）
-- 这个将在用户首次使用收藏功能时自动创建
