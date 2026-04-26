-- AI功能和数据分析相关的数据库迁移

-- AI使用日志表
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL COMMENT '用户ID',
  action VARCHAR(50) NOT NULL COMMENT '操作类型(summary/continue/polish/title/tags/proofread)',
  input_length INT DEFAULT 0 COMMENT '输入长度',
  output_length INT DEFAULT 0 COMMENT '输出长度',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_user_id (user_id),
  KEY idx_action (action),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI使用日志';

-- 文章统计数据表
CREATE TABLE IF NOT EXISTS article_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  article_id VARCHAR(255) NOT NULL COMMENT '文章ID',
  view_count INT DEFAULT 0 COMMENT '浏览量',
  like_count INT DEFAULT 0 COMMENT '点赞数',
  comment_count INT DEFAULT 0 COMMENT '评论数',
  favorite_count INT DEFAULT 0 COMMENT '收藏数',
  share_count INT DEFAULT 0 COMMENT '分享数',
  coin_count INT DEFAULT 0 COMMENT '投币数',
  avg_read_time INT DEFAULT 0 COMMENT '平均阅读时长(秒)',
  read_complete_rate DECIMAL(5,2) DEFAULT 0 COMMENT '阅读完成率(%)',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_article_id (article_id),
  KEY idx_view_count (view_count),
  KEY idx_like_count (like_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章统计数据';

-- 每日统计数据表
CREATE TABLE IF NOT EXISTS daily_article_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  article_id VARCHAR(255) NOT NULL COMMENT '文章ID',
  stat_date DATE NOT NULL COMMENT '统计日期',
  view_count INT DEFAULT 0 COMMENT '当日浏览量',
  like_count INT DEFAULT 0 COMMENT '当日点赞数',
  comment_count INT DEFAULT 0 COMMENT '当日评论数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_article_date (article_id, stat_date),
  KEY idx_stat_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章每日统计';

-- 作者统计数据表
CREATE TABLE IF NOT EXISTS author_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  author_id VARCHAR(255) NOT NULL COMMENT '作者ID',
  total_articles INT DEFAULT 0 COMMENT '文章总数',
  total_views INT DEFAULT 0 COMMENT '总浏览量',
  total_likes INT DEFAULT 0 COMMENT '总点赞数',
  total_comments INT DEFAULT 0 COMMENT '总评论数',
  total_favorites INT DEFAULT 0 COMMENT '总收藏数',
  followers_count INT DEFAULT 0 COMMENT '粉丝数',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_author_id (author_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='作者统计数据';

-- 搜索索引表（用于全文搜索优化）
CREATE TABLE IF NOT EXISTS search_index (
  id INT AUTO_INCREMENT PRIMARY KEY,
  article_id VARCHAR(255) NOT NULL COMMENT '文章ID',
  title VARCHAR(255) NOT NULL COMMENT '文章标题',
  content_text TEXT COMMENT '纯文本内容',
  tags VARCHAR(500) COMMENT '标签',
  author_name VARCHAR(100) COMMENT '作者名',
  category VARCHAR(50) COMMENT '分类',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FULLTEXT INDEX ft_title_content (title, content_text) WITH PARSER ngram,
  FULLTEXT INDEX ft_tags (tags) WITH PARSER ngram,
  KEY idx_author (author_name),
  KEY idx_category (category),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='搜索索引表';

-- 搜索记录表
CREATE TABLE IF NOT EXISTS search_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  keyword VARCHAR(200) NOT NULL COMMENT '搜索关键词',
  user_id VARCHAR(255) COMMENT '用户ID（可选）',
  result_count INT DEFAULT 0 COMMENT '返回结果数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_keyword (keyword),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='搜索记录';

-- 触发器：当文章被创建时，初始化统计数据
DELIMITER $$

CREATE TRIGGER IF NOT EXISTS init_article_stats
AFTER INSERT ON articles
FOR EACH ROW
BEGIN
  INSERT INTO article_stats (article_id, view_count, like_count, comment_count, favorite_count)
  VALUES (NEW.id, 0, 0, 0, 0)
  ON DUPLICATE KEY UPDATE article_id = NEW.id;
  
  -- 更新作者文章数
  INSERT INTO author_stats (author_id, total_articles)
  VALUES (NEW.author_id, 1)
  ON DUPLICATE KEY UPDATE total_articles = total_articles + 1;
  
  -- 添加搜索索引
  INSERT INTO search_index (article_id, title, content_text, tags, author_name, category)
  VALUES (NEW.id, NEW.title, LEFT(NEW.content, 10000), NEW.tags, NEW.author_name, NEW.category);
END$$

-- 触发器：当文章被更新时，更新搜索索引
CREATE TRIGGER IF NOT EXISTS update_search_index
AFTER UPDATE ON articles
FOR EACH ROW
BEGIN
  UPDATE search_index 
  SET title = NEW.title,
      content_text = LEFT(NEW.content, 10000),
      tags = NEW.tags,
      author_name = NEW.author_name,
      category = NEW.category
  WHERE article_id = NEW.id;
END$$

-- 触发器：当文章被删除时，清理相关数据
CREATE TRIGGER IF NOT EXISTS cleanup_article_stats
AFTER DELETE ON articles
FOR EACH ROW
BEGIN
  DELETE FROM article_stats WHERE article_id = OLD.id;
  DELETE FROM daily_article_stats WHERE article_id = OLD.id;
  DELETE FROM search_index WHERE article_id = OLD.id;
  
  -- 减少作者文章数
  UPDATE author_stats 
  SET total_articles = GREATEST(0, total_articles - 1)
  WHERE author_id = OLD.author_id;
END$$

DELIMITER ;
