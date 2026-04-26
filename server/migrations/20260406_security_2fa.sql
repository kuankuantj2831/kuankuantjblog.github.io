-- ============================================
-- 第八轮：安全与隐私增强 - 数据库迁移
-- Security & Privacy Enhancement - Database Migration
-- ============================================

-- 1. 用户2FA配置表
CREATE TABLE IF NOT EXISTS `user_2fa` (
    `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    `user_id` CHAR(36) NOT NULL,
    `enabled` BOOLEAN DEFAULT FALSE,
    `type` ENUM('totp', 'sms', 'email') DEFAULT 'totp',
    `secret` VARCHAR(255) NULL,
    `backup_codes` JSON NULL,
    `verified` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_user_2fa_user` (`user_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 用户登录会话表（用于安全管理）
CREATE TABLE IF NOT EXISTS `user_sessions` (
    `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    `user_id` CHAR(36) NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `device_info` VARCHAR(255) NULL,
    `location` VARCHAR(100) NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `last_activity` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `expires_at` TIMESTAMP NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_user_sessions_user` (`user_id`),
    INDEX `idx_user_sessions_active` (`is_active`, `expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 安全审计日志表
CREATE TABLE IF NOT EXISTS `security_audit_logs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` CHAR(36) NULL,
    `action` VARCHAR(50) NOT NULL,
    `category` ENUM('auth', 'security', 'admin', 'data', 'system') DEFAULT 'auth',
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `device_info` VARCHAR(255) NULL,
    `location` VARCHAR(100) NULL,
    `details` JSON NULL,
    `status` ENUM('success', 'failure', 'warning') DEFAULT 'success',
    `risk_level` ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_audit_user` (`user_id`),
    INDEX `idx_audit_action` (`action`),
    INDEX `idx_audit_category` (`category`),
    INDEX `idx_audit_created` (`created_at`),
    INDEX `idx_audit_risk` (`risk_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 端到端加密消息表
CREATE TABLE IF NOT EXISTS `encrypted_messages` (
    `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    `sender_id` CHAR(36) NOT NULL,
    `receiver_id` CHAR(36) NOT NULL,
    `session_id` CHAR(36) NOT NULL,
    `encrypted_content` TEXT NOT NULL,
    `nonce` VARCHAR(255) NOT NULL,
    `ephemeral_public_key` TEXT NULL,
    `read_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_enc_msg_receiver` (`receiver_id`, `read_at`),
    INDEX `idx_enc_msg_session` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 加密会话表（用于端到端加密）
CREATE TABLE IF NOT EXISTS `encrypted_sessions` (
    `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    `user1_id` CHAR(36) NOT NULL,
    `user2_id` CHAR(36) NOT NULL,
    `user1_public_key` TEXT NOT NULL,
    `user2_public_key` TEXT NULL,
    `shared_secret_hash` VARCHAR(255) NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_session_users` (`user1_id`, `user2_id`),
    FOREIGN KEY (`user1_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user2_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 隐私设置表
CREATE TABLE IF NOT EXISTS `user_privacy_settings` (
    `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    `user_id` CHAR(36) NOT NULL UNIQUE,
    `profile_visibility` ENUM('public', 'followers', 'private') DEFAULT 'public',
    `show_online_status` BOOLEAN DEFAULT TRUE,
    `show_last_seen` BOOLEAN DEFAULT TRUE,
    `allow_search_by_email` BOOLEAN DEFAULT FALSE,
    `allow_tagging` BOOLEAN DEFAULT TRUE,
    `data_retention_days` INT DEFAULT 365,
    `auto_delete_inactive` BOOLEAN DEFAULT FALSE,
    `gdpr_export_requested` BOOLEAN DEFAULT FALSE,
    `gdpr_export_completed_at` TIMESTAMP NULL,
    `gdpr_deletion_requested` BOOLEAN DEFAULT FALSE,
    `gdpr_deletion_scheduled_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 敏感数据访问日志
CREATE TABLE IF NOT EXISTS `sensitive_data_access` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` CHAR(36) NULL,
    `data_type` VARCHAR(50) NOT NULL,
    `data_id` CHAR(36) NULL,
    `action` VARCHAR(50) NOT NULL,
    `accessed_by` CHAR(36) NULL,
    `ip_address` VARCHAR(45) NULL,
    `reason` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_sensitive_user` (`user_id`),
    INDEX `idx_sensitive_type` (`data_type`),
    INDEX `idx_sensitive_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. 安全事件告警规则表
CREATE TABLE IF NOT EXISTS `security_alerts` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` CHAR(36) NULL,
    `alert_type` VARCHAR(50) NOT NULL,
    `severity` ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `details` JSON NULL,
    `is_resolved` BOOLEAN DEFAULT FALSE,
    `resolved_at` TIMESTAMP NULL,
    `resolved_by` CHAR(36) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_alerts_user` (`user_id`),
    INDEX `idx_alerts_type` (`alert_type`),
    INDEX `idx_alerts_severity` (`severity`),
    INDEX `idx_alerts_resolved` (`is_resolved`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 为现有用户创建默认隐私设置
INSERT INTO `user_privacy_settings` (`user_id`)
SELECT `id` FROM `users`
WHERE `id` NOT IN (SELECT `user_id` FROM `user_privacy_settings`);

-- 创建视图：用户安全概览
CREATE OR REPLACE VIEW `user_security_overview` AS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    u2fa.enabled as has_2fa,
    u2fa.type as _2fa_type,
    u2fa.verified as _2fa_verified,
    COUNT(DISTINCT us.id) as active_sessions,
    COUNT(DISTINCT sal.id) as recent_security_events,
    ups.profile_visibility,
    u.created_at
FROM `users` u
LEFT JOIN `user_2fa` u2fa ON u.id = u2fa.user_id
LEFT JOIN `user_sessions` us ON u.id = us.user_id AND us.is_active = TRUE
LEFT JOIN `security_audit_logs` sal ON u.id = sal.user_id AND sal.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
LEFT JOIN `user_privacy_settings` ups ON u.id = ups.user_id
GROUP BY u.id, u.username, u.email, u2fa.enabled, u2fa.type, u2fa.verified, ups.profile_visibility, u.created_at;
