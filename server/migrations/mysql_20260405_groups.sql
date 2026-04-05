-- ============================================================
-- 话题圈子系统数据库迁移 - MySQL 版本
-- Topic Groups System Migration for MySQL
-- ============================================================

-- 圈子表
CREATE TABLE IF NOT EXISTS `groups` (
    `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    `name` VARCHAR(100) NOT NULL COMMENT '圈子名称',
    `slug` VARCHAR(100) NOT NULL COMMENT '圈子标识',
    `description` TEXT NOT NULL COMMENT '圈子描述',
    `category` VARCHAR(50) DEFAULT '其他' COMMENT '分类',
    `avatar` TEXT COMMENT '圈子头像',
    `cover_image` TEXT COMMENT '封面图',
    `rules` TEXT DEFAULT '' COMMENT '圈子规则',
    `is_private` TINYINT(1) DEFAULT 0 COMMENT '是否私密',
    `creator_id` CHAR(36) NOT NULL COMMENT '创建者ID',
    `member_count` INT DEFAULT 0 COMMENT '成员数',
    `post_count` INT DEFAULT 0 COMMENT '帖子数',
    `last_activity_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '最后活动时间',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_groups_name` (`name`),
    UNIQUE KEY `uk_groups_slug` (`slug`),
    INDEX `idx_groups_category` (`category`),
    INDEX `idx_groups_creator` (`creator_id`),
    INDEX `idx_groups_created` (`created_at` DESC),
    INDEX `idx_groups_members` (`member_count` DESC),
    FULLTEXT INDEX `idx_groups_description` (`description`),
    CONSTRAINT `fk_groups_creator` FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='话题圈子表';

-- 圈子成员表
CREATE TABLE IF NOT EXISTS `group_members` (
    `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    `group_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `role` VARCHAR(20) DEFAULT 'member' COMMENT 'admin, moderator, member',
    `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_group_members` (`group_id`, `user_id`),
    INDEX `idx_group_members_group` (`group_id`),
    INDEX `idx_group_members_user` (`user_id`),
    INDEX `idx_group_members_role` (`role`),
    CONSTRAINT `fk_group_members_group` FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_group_members_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='圈子成员表';

-- 圈子帖子表
CREATE TABLE IF NOT EXISTS `group_posts` (
    `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    `group_id` CHAR(36) NOT NULL,
    `author_id` CHAR(36) NOT NULL,
    `title` TEXT COMMENT '帖子标题',
    `content` TEXT NOT NULL COMMENT '帖子内容',
    `type` VARCHAR(20) DEFAULT 'discussion' COMMENT 'discussion, announcement, question',
    `like_count` INT DEFAULT 0 COMMENT '点赞数',
    `comment_count` INT DEFAULT 0 COMMENT '评论数',
    `is_pinned` TINYINT(1) DEFAULT 0 COMMENT '是否置顶',
    `is_approved` TINYINT(1) DEFAULT 1 COMMENT '是否审核通过',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_group_posts_group` (`group_id`),
    INDEX `idx_group_posts_author` (`author_id`),
    INDEX `idx_group_posts_created` (`created_at` DESC),
    INDEX `idx_group_posts_pinned` (`is_pinned`),
    FULLTEXT INDEX `idx_group_posts_content` (`content`),
    CONSTRAINT `fk_group_posts_group` FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_group_posts_author` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='圈子帖子表';

-- 帖子点赞表
CREATE TABLE IF NOT EXISTS `group_post_likes` (
    `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    `post_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_group_post_likes` (`post_id`, `user_id`),
    INDEX `idx_group_post_likes_post` (`post_id`),
    INDEX `idx_group_post_likes_user` (`user_id`),
    CONSTRAINT `fk_group_post_likes_post` FOREIGN KEY (`post_id`) REFERENCES `group_posts`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_group_post_likes_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子点赞表';

-- 帖子评论表
CREATE TABLE IF NOT EXISTS `group_comments` (
    `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    `post_id` CHAR(36) NOT NULL,
    `author_id` CHAR(36) NOT NULL,
    `content` TEXT NOT NULL COMMENT '评论内容',
    `parent_id` CHAR(36) NULL COMMENT '父评论ID（嵌套回复）',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_group_comments_post` (`post_id`),
    INDEX `idx_group_comments_parent` (`parent_id`),
    INDEX `idx_group_comments_author` (`author_id`),
    CONSTRAINT `fk_group_comments_post` FOREIGN KEY (`post_id`) REFERENCES `group_posts`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_group_comments_author` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_group_comments_parent` FOREIGN KEY (`parent_id`) REFERENCES `group_comments`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子评论表';

-- 计数函数存储过程
DELIMITER //

-- 增加帖子点赞数
CREATE PROCEDURE IF NOT EXISTS `increment_post_likes`(IN p_post_id CHAR(36))
BEGIN
    UPDATE `group_posts` SET `like_count` = `like_count` + 1 WHERE `id` = p_post_id;
END //

-- 减少帖子点赞数
CREATE PROCEDURE IF NOT EXISTS `decrement_post_likes`(IN p_post_id CHAR(36))
BEGIN
    UPDATE `group_posts` SET `like_count` = GREATEST(`like_count` - 1, 0) WHERE `id` = p_post_id;
END //

-- 增加帖子评论数
CREATE PROCEDURE IF NOT EXISTS `increment_post_comments`(IN p_post_id CHAR(36))
BEGIN
    UPDATE `group_posts` SET `comment_count` = `comment_count` + 1 WHERE `id` = p_post_id;
END //

-- 更新圈子成员数
CREATE PROCEDURE IF NOT EXISTS `update_group_member_count`(IN p_group_id CHAR(36))
BEGIN
    UPDATE `groups` 
    SET `member_count` = (SELECT COUNT(*) FROM `group_members` WHERE `group_id` = p_group_id),
        `last_activity_at` = NOW()
    WHERE `id` = p_group_id;
END //

-- 更新圈子帖子数
CREATE PROCEDURE IF NOT EXISTS `update_group_post_count`(IN p_group_id CHAR(36))
BEGIN
    UPDATE `groups` 
    SET `post_count` = (SELECT COUNT(*) FROM `group_posts` WHERE `group_id` = p_group_id),
        `last_activity_at` = NOW()
    WHERE `id` = p_group_id;
END //

DELIMITER ;

-- 插入示例圈子数据
INSERT INTO `groups` (`id`, `name`, `slug`, `description`, `category`, `creator_id`, `member_count`) VALUES
('11111111-1111-1111-1111-111111111111', '前端开发交流', 'frontend-dev', '分享前端技术、框架、最佳实践', '技术', '00000000-0000-0000-0000-000000000000', 1),
('22222222-2222-2222-2222-222222222222', '读书笔记', 'book-notes', '分享好书推荐和阅读心得', '生活', '00000000-0000-0000-0000-000000000000', 1),
('33333333-3333-3333-3333-333333333333', '游戏玩家', 'gamers', '游戏推荐、攻略分享、开黑组队', '娱乐', '00000000-0000-0000-0000-000000000000', 1)
ON DUPLICATE KEY UPDATE `name` = `name`;
