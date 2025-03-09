

-- 插件下载记录表
CREATE TABLE IF NOT EXISTS plugin_downloads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plugin_id INT NOT NULL,
    version_id INT NOT NULL,
    user_id INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE,
    FOREIGN KEY (version_id) REFERENCES plugin_versions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 


-- 插件表
CREATE TABLE `plugins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `icon` varchar(255) DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `status` enum('active', 'inactive', 'deprecated') DEFAULT 'active',
  `visibility` enum('public', 'private', 'organization') DEFAULT 'private',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `downloads_count` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_plugins_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插件版本表
CREATE TABLE `plugin_versions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `plugin_id` int NOT NULL,
  `version` varchar(50) NOT NULL,
  `zip_url` varchar(255) NOT NULL,
  `zip_hash` varchar(255) NOT NULL,
  `zip_size` int NOT NULL,
  `changelog` text,
  `min_app_version` varchar(50) DEFAULT NULL,
  `dependencies` json DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `is_latest` tinyint(1) DEFAULT '1',
  `download_count` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_plugin_versions_plugin_id` (`plugin_id`),
  CONSTRAINT `fk_plugin_versions_plugin_id` FOREIGN KEY (`plugin_id`) REFERENCES `plugins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插件许可证表
CREATE TABLE `plugin_licenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(255) NOT NULL,
  `plugin_id` int NOT NULL,
  `license_key` varchar(255) NOT NULL,
  `issued_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `status` varchar(50) DEFAULT 'active',
  `machine_id` varchar(255) DEFAULT NULL,
  `last_verified_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_plugin_licenses_license_key` (`license_key`),
  KEY `idx_plugin_licenses_user_id` (`user_id`),
  KEY `idx_plugin_licenses_plugin_id` (`plugin_id`),
  CONSTRAINT `fk_plugin_licenses_plugin_id` FOREIGN KEY (`plugin_id`) REFERENCES `plugins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插件评论表
CREATE TABLE `plugin_reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `plugin_id` int NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `rating` int NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `comment` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_verified_purchase` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_plugin_reviews_plugin_id` (`plugin_id`),
  KEY `idx_plugin_reviews_user_id` (`user_id`),
  CONSTRAINT `fk_plugin_reviews_plugin_id` FOREIGN KEY (`plugin_id`) REFERENCES `plugins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插件统计表
CREATE TABLE `plugin_stats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `plugin_id` int NOT NULL,
  `date` date NOT NULL,
  `active_installs` int DEFAULT '0',
  `new_installs` int DEFAULT '0',
  `uninstalls` int DEFAULT '0',
  `updates` int DEFAULT '0',
  `downloads` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_plugin_stats_plugin_id_date` (`plugin_id`, `date`),
  CONSTRAINT `fk_plugin_stats_plugin_id` FOREIGN KEY (`plugin_id`) REFERENCES `plugins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插件使用日志表
CREATE TABLE `plugin_usage_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `plugin_id` int NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `machine_id` varchar(255) DEFAULT NULL,
  `event_type` varchar(50) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `version` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_plugin_usage_logs_plugin_id` (`plugin_id`),
  KEY `idx_plugin_usage_logs_user_id` (`user_id`),
  CONSTRAINT `fk_plugin_usage_logs_plugin_id` FOREIGN KEY (`plugin_id`) REFERENCES `plugins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;