-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `avatar` VARCHAR(1024) DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `last_login_at` DATETIME DEFAULT NULL,
    `last_login_ip` VARCHAR(255) DEFAULT NULL,
    `oauth_provider` VARCHAR(50) DEFAULT NULL,
    `oauth_id` VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_users_email` (`email`),
    KEY `idx_users_oauth` (`oauth_provider`, `oauth_id`),
    KEY `idx_users_created_at` (`created_at`),
    KEY `idx_users_last_login_at` (`last_login_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户设备表
CREATE TABLE IF NOT EXISTS `user_devices` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `device_type` ENUM('desktop', 'mobile', 'tablet', 'other') NOT NULL,
    `os` VARCHAR(255) NOT NULL,
    `os_version` VARCHAR(255) DEFAULT NULL,
    `browser` VARCHAR(255) DEFAULT NULL,
    `browser_version` VARCHAR(255) DEFAULT NULL,
    `ip_address` VARCHAR(255) DEFAULT NULL,
    `last_active_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `is_current` BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (`id`),
    KEY `idx_user_devices_user_id` (`user_id`),
    KEY `idx_user_devices_last_active_at` (`last_active_at`),
    CONSTRAINT `fk_user_devices_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 登录码表（用于无密码登录）
CREATE TABLE IF NOT EXISTS `login_codes` (
    `id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `code` VARCHAR(255) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expires_at` DATETIME NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (`id`),
    KEY `idx_login_codes_email` (`email`),
    KEY `idx_login_codes_code` (`code`),
    KEY `idx_login_codes_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 