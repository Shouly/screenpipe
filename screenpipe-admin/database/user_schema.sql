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
    `token` VARCHAR(255) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_users_email` (`email`),
    UNIQUE KEY `idx_users_token` (`token`),
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

-- 添加一个初始管理员用户（可选）
-- 密码/令牌: admin-token-123456
INSERT INTO `users` (`id`, `email`, `name`, `token`, `created_at`, `updated_at`)
VALUES (
    UUID(),
    'admin@screenpipe.com',
    '管理员',
    'admin-token-123456',
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE `updated_at` = NOW(); 