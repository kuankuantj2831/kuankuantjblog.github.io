-- 微信登录认证相关表
-- 创建时间: 2026-04-06

-- 用户微信绑定表
CREATE TABLE IF NOT EXISTS user_wechat_bindings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    openid VARCHAR(64) NOT NULL UNIQUE,
    unionid VARCHAR(64),
    source ENUM('wechat_web', 'wechat_mp', 'wechat_miniapp') NOT NULL DEFAULT 'wechat_web',
    nickname VARCHAR(100),
    avatar_url VARCHAR(500),
    sex TINYINT DEFAULT 0 COMMENT '0:未知, 1:男, 2:女',
    country VARCHAR(50),
    province VARCHAR(50),
    city VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_unionid (unionid),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- OAuth state 缓存表（用于防止CSRF攻击）
CREATE TABLE IF NOT EXISTS oauth_states (
    id INT PRIMARY KEY AUTO_INCREMENT,
    state VARCHAR(64) NOT NULL UNIQUE,
    data TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_state (state),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 清理过期state的定时任务（可选，也可以通过应用层清理）
-- 事件调度器需要手动开启：SET GLOBAL event_scheduler = ON;
DELIMITER $$

DROP EVENT IF EXISTS cleanup_expired_oauth_states$$

CREATE EVENT IF NOT EXISTS cleanup_expired_oauth_states
    ON SCHEDULE EVERY 1 HOUR
    DO
    BEGIN
        DELETE FROM oauth_states WHERE expires_at < NOW();
    END$$

DELIMITER ;
