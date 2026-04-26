-- ============================================
-- 新一轮高级功能数据库迁移
-- 包含：用户成长系统、内容推荐、社区互动、管理后台
-- ============================================

-- 一、用户成长系统
-- 1. 用户等级和经验表
CREATE TABLE IF NOT EXISTS user_levels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    level INT DEFAULT 1,
    current_exp INT DEFAULT 0,
    total_exp INT DEFAULT 0,
    next_level_exp INT DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_level (level),
    INDEX idx_exp (total_exp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. 经验值获取记录
CREATE TABLE IF NOT EXISTS exp_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    exp_gained INT NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_time (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. 成就徽章表
CREATE TABLE IF NOT EXISTS badges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    badge_key VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    icon VARCHAR(255),
    color VARCHAR(20) DEFAULT '#667eea',
    condition_type VARCHAR(50) NOT NULL,
    condition_value INT NOT NULL,
    exp_reward INT DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. 用户徽章关联表
CREATE TABLE IF NOT EXISTS user_badges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    badge_id INT NOT NULL,
    is_equipped BOOLEAN DEFAULT FALSE,
    equipped_order INT DEFAULT 0,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_badge (user_id, badge_id),
    INDEX idx_equipped (user_id, is_equipped)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. 每日任务表
CREATE TABLE IF NOT EXISTS daily_tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    task_key VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    task_type VARCHAR(50) NOT NULL,
    target_count INT DEFAULT 1,
    exp_reward INT DEFAULT 10,
    coin_reward INT DEFAULT 5,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. 用户每日任务进度
CREATE TABLE IF NOT EXISTS user_daily_tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    task_id INT NOT NULL,
    task_date DATE NOT NULL,
    progress INT DEFAULT 0,
    target_count INT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES daily_tasks(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_task_date (user_id, task_id, task_date),
    INDEX idx_date (task_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. 商城商品表
CREATE TABLE IF NOT EXISTS shop_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_key VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    item_type VARCHAR(50) NOT NULL,
    icon VARCHAR(255),
    price INT NOT NULL,
    stock INT DEFAULT -1,
    is_limited BOOLEAN DEFAULT FALSE,
    valid_days INT DEFAULT 0,
    effect_data JSON,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. 用户购买记录
CREATE TABLE IF NOT EXISTS user_purchases (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    price_paid INT NOT NULL,
    quantity INT DEFAULT 1,
    valid_until TIMESTAMP NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP NULL,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES shop_items(id) ON DELETE CASCADE,
    INDEX idx_user (user_id, purchased_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 二、内容推荐系统
-- 1. 用户阅读历史（用于推荐算法）
CREATE TABLE IF NOT EXISTS user_reading_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    article_id INT NOT NULL,
    read_duration INT DEFAULT 0,
    read_percentage INT DEFAULT 0,
    is_liked BOOLEAN DEFAULT FALSE,
    is_favorited BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_article (user_id, article_id),
    INDEX idx_read_at (read_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. 文章相关性分数（预计算）
CREATE TABLE IF NOT EXISTS article_similarity (
    id INT PRIMARY KEY AUTO_INCREMENT,
    article_id_1 INT NOT NULL,
    article_id_2 INT NOT NULL,
    similarity_score DECIMAL(5,4) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_pair (article_id_1, article_id_2),
    INDEX idx_score (similarity_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. 热门文章统计
CREATE TABLE IF NOT EXISTS article_trending (
    id INT PRIMARY KEY AUTO_INCREMENT,
    article_id INT NOT NULL UNIQUE,
    view_count_24h INT DEFAULT 0,
    like_count_24h INT DEFAULT 0,
    comment_count_24h INT DEFAULT 0,
    trending_score DECIMAL(10,2) DEFAULT 0,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    INDEX idx_trending (trending_score DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. 专题合集表
CREATE TABLE IF NOT EXISTS collections_series (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    cover_image VARCHAR(255),
    author_id INT,
    category_id INT,
    is_published BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_published (is_published, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. 专题文章关联
CREATE TABLE IF NOT EXISTS series_articles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    series_id INT NOT NULL,
    article_id INT NOT NULL,
    article_order INT DEFAULT 0,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (series_id) REFERENCES collections_series(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    UNIQUE KEY unique_series_article (series_id, article_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 三、社区互动增强
-- 1. 文章投票表
CREATE TABLE IF NOT EXISTS article_votes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    article_id INT NOT NULL,
    user_id INT NOT NULL,
    vote_type ENUM('up', 'down') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_article_vote (article_id, user_id),
    INDEX idx_vote_type (vote_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. 问答帖子表
CREATE TABLE IF NOT EXISTS questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(300) NOT NULL,
    content TEXT NOT NULL,
    author_id INT NOT NULL,
    category_id INT,
    tags JSON,
    bounty_coins INT DEFAULT 0,
    is_resolved BOOLEAN DEFAULT FALSE,
    best_answer_id INT NULL,
    view_count INT DEFAULT 0,
    vote_count INT DEFAULT 0,
    answer_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_resolved (is_resolved, created_at),
    INDEX idx_bounty (bounty_coins DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. 问答回答表
CREATE TABLE IF NOT EXISTS answers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    question_id INT NOT NULL,
    author_id INT NOT NULL,
    content TEXT NOT NULL,
    is_accepted BOOLEAN DEFAULT FALSE,
    vote_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_question (question_id, vote_count DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. 评论置顶表
CREATE TABLE IF NOT EXISTS pinned_comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    comment_id INT NOT NULL UNIQUE,
    article_id INT NOT NULL,
    pinned_by INT NOT NULL,
    pin_reason VARCHAR(255),
    pinned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (pinned_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 四、管理后台功能
-- 1. 系统日志表
CREATE TABLE IF NOT EXISTS system_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    level VARCHAR(20) NOT NULL,
    category VARCHAR(50),
    message TEXT NOT NULL,
    metadata JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_level_time (level, created_at),
    INDEX idx_category (category, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. 内容审核队列
CREATE TABLE IF NOT EXISTS content_moderation (
    id INT PRIMARY KEY AUTO_INCREMENT,
    content_type ENUM('article', 'comment', 'question', 'answer') NOT NULL,
    content_id INT NOT NULL,
    author_id INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'auto_approved') DEFAULT 'pending',
    ai_score DECIMAL(5,2),
    ai_reason TEXT,
    reviewed_by INT,
    review_note VARCHAR(255),
    flagged_keywords JSON,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status, submitted_at),
    INDEX idx_author (author_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. 用户行为统计（每日汇总）
CREATE TABLE IF NOT EXISTS user_activity_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    stat_date DATE NOT NULL,
    login_count INT DEFAULT 0,
    article_view_count INT DEFAULT 0,
    article_like_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    post_count INT DEFAULT 0,
    active_minutes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, stat_date),
    INDEX idx_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. 网站访问统计
CREATE TABLE IF NOT EXISTS site_analytics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    stat_date DATE NOT NULL,
    page_views INT DEFAULT 0,
    unique_visitors INT DEFAULT 0,
    new_visitors INT DEFAULT 0,
    returning_visitors INT DEFAULT 0,
    avg_session_duration INT DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    top_pages JSON,
    traffic_sources JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. 管理员操作日志
CREATE TABLE IF NOT EXISTS admin_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id INT,
    old_data JSON,
    new_data JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_action (action, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 初始化数据
-- ============================================

-- 插入默认徽章
INSERT INTO badges (badge_key, name, description, icon, color, condition_type, condition_value, exp_reward) VALUES
('first_article', '初出茅庐', '发布第一篇文章', '📝', '#667eea', 'article_count', 1, 50),
('article_10', '笔耕不辍', '发布10篇文章', '📚', '#764ba2', 'article_count', 10, 200),
('article_50', '著作等身', '发布50篇文章', '📖', '#f5576c', 'article_count', 50, 1000),
('popular_author', '人气作者', '获得100个赞', '⭐', '#ffd700', 'like_received', 100, 300),
('commentator', '活跃评论者', '发表50条评论', '💬', '#4facfe', 'comment_count', 50, 150),
('early_bird', '早起鸟', '连续7天登录', '🌅', '#43e97b', 'login_streak', 7, 100),
('collector', '收藏家', '收藏50篇文章', '🔖', '#fa709a', 'favorite_count', 50, 100),
('social_butterfly', '社交达人', '关注20个用户', '🦋', '#fee140', 'following_count', 20, 100),
('helper', '热心帮助', '回答被采纳5次', '✅', '#30cfd0', 'best_answer', 5, 500),
('veteran', '资深用户', '注册满1年', '🎂', '#ff6b6b', 'account_age', 365, 1000);

-- 插入每日任务
INSERT INTO daily_tasks (task_key, name, description, task_type, target_count, exp_reward, coin_reward, sort_order) VALUES
('daily_login', '每日登录', '每天登录网站', 'login', 1, 20, 10, 1),
('read_articles', '阅读文章', '阅读3篇文章', 'read', 3, 15, 5, 2),
('like_article', '点赞文章', '给2篇文章点赞', 'like', 2, 10, 3, 3),
('post_comment', '发表评论', '发表1条评论', 'comment', 1, 15, 5, 4),
('share_article', '分享文章', '分享1篇文章', 'share', 1, 10, 5, 5);

-- 插入商城商品
INSERT INTO shop_items (item_key, name, description, item_type, icon, price, stock, is_limited, valid_days, effect_data) VALUES
('name_color_red', '红色昵称', '将昵称显示为红色（7天）', 'name_color', '🔴', 100, -1, FALSE, 7, '{"color": "#ff4444"}'),
('name_color_gold', '金色昵称', '将昵称显示为金色（7天）', 'name_color', '🟡', 200, -1, FALSE, 7, '{"color": "#ffd700"}'),
('name_color_rainbow', '彩虹昵称', '将昵称显示为彩虹渐变（7天）', 'name_color', '🌈', 500, -1, FALSE, 7, '{"color": "rainbow"}'),
('badge_slot', '额外徽章位', '增加一个徽章展示位置（永久）', 'badge_slot', '➕', 300, -1, FALSE, 0, '{"slot_increase": 1}'),
('exp_boost', '经验加速卡', '获得经验值翻倍（24小时）', 'exp_boost', '⚡', 150, -1, FALSE, 1, '{"multiplier": 2}'),
('featured_frame', '头像框-星辉', '星辉头像框（30天）', 'avatar_frame', '✨', 300, 100, TRUE, 30, '{"frame": "starlight"}'),
('featured_frame_vip', '头像框-VIP', '尊贵VIP头像框（30天）', 'avatar_frame', '👑', 800, 50, TRUE, 30, '{"frame": "vip"}');

-- 创建触发器：新用户自动创建等级记录
DELIMITER //
CREATE TRIGGER IF NOT EXISTS create_user_level_after_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO user_levels (user_id, level, current_exp, total_exp, next_level_exp)
    VALUES (NEW.id, 1, 0, 0, 100);
END//
DELIMITER ;
