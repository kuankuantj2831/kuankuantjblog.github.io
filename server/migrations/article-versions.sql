-- 文章版本历史系统数据库迁移
-- 执行此脚本创建必要的表

-- 文章版本表
CREATE TABLE IF NOT EXISTS article_versions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  article_id VARCHAR(255) NOT NULL COMMENT '文章ID',
  user_id VARCHAR(255) NOT NULL COMMENT '编辑者ID',
  version_number INT NOT NULL COMMENT '版本号',
  title VARCHAR(255) COMMENT '文章标题',
  content TEXT COMMENT '文章内容',
  change_summary VARCHAR(255) COMMENT '变更说明',
  word_count INT DEFAULT 0 COMMENT '字数统计',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_article_version (article_id, version_number),
  KEY idx_article_id (article_id),
  KEY idx_user_id (user_id),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章版本历史';

-- 文章批注/评论表
CREATE TABLE IF NOT EXISTS article_annotations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  article_id VARCHAR(255) NOT NULL COMMENT '文章ID',
  user_id VARCHAR(255) NOT NULL COMMENT '评论者ID',
  version_id INT COMMENT '关联版本ID',
  selected_text TEXT COMMENT '选中的文本',
  start_offset INT COMMENT '起始位置',
  end_offset INT COMMENT '结束位置',
  comment TEXT NOT NULL COMMENT '评论内容',
  parent_id INT DEFAULT NULL COMMENT '父评论ID（支持回复）',
  status ENUM('open', 'resolved', 'dismissed') DEFAULT 'open' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_article_id (article_id),
  KEY idx_user_id (user_id),
  KEY idx_version_id (version_id),
  KEY idx_parent_id (parent_id),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章批注评论';

-- 协作者表
CREATE TABLE IF NOT EXISTS article_collaborators (
  id INT AUTO_INCREMENT PRIMARY KEY,
  article_id VARCHAR(255) NOT NULL COMMENT '文章ID',
  user_id VARCHAR(255) NOT NULL COMMENT '协作者ID',
  permission ENUM('view', 'comment', 'edit') DEFAULT 'view' COMMENT '权限级别',
  invited_by VARCHAR(255) COMMENT '邀请人ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_article_user (article_id, user_id),
  KEY idx_article_id (article_id),
  KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章协作者';

-- 编辑锁表
CREATE TABLE IF NOT EXISTS article_edit_locks (
  article_id VARCHAR(255) PRIMARY KEY COMMENT '文章ID',
  user_id VARCHAR(255) NOT NULL COMMENT '当前编辑者ID',
  user_name VARCHAR(100) COMMENT '编辑者名称',
  lock_token VARCHAR(255) NOT NULL COMMENT '锁令牌',
  expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章编辑锁';

-- 创建定时任务清理过期锁（需要EVENT权限）
SET GLOBAL event_scheduler = ON;

DELIMITER $$

CREATE EVENT IF NOT EXISTS cleanup_expired_locks
ON SCHEDULE EVERY 5 MINUTE
DO
BEGIN
  DELETE FROM article_edit_locks WHERE expires_at < NOW();
END$$

DELIMITER ;

-- 添加触发器：自动清理旧版本（只保留最近50个）
DELIMITER $$

CREATE TRIGGER IF NOT EXISTS cleanup_old_versions
AFTER INSERT ON article_versions
FOR EACH ROW
BEGIN
  DELETE FROM article_versions 
  WHERE article_id = NEW.article_id 
  AND id NOT IN (
    SELECT id FROM (
      SELECT id FROM article_versions 
      WHERE article_id = NEW.article_id 
      ORDER BY version_number DESC 
      LIMIT 50
    ) as temp
  );
END$$

DELIMITER ;

-- 插入测试数据（可选）
-- INSERT INTO article_versions (article_id, user_id, version_number, title, content, change_summary, word_count) 
-- VALUES ('test-article-id', 'user-id', 1, '测试标题', '测试内容', '初始版本', 100);
