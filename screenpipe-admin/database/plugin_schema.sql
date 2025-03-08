-- 插件表
CREATE TABLE IF NOT EXISTS plugins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    tags JSON,
    status ENUM('active', 'inactive', 'deprecated') NOT NULL DEFAULT 'active',
    visibility ENUM('public', 'private', 'organization') NOT NULL DEFAULT 'private',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    downloads_count INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插件版本表
CREATE TABLE IF NOT EXISTS plugin_versions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plugin_id INT NOT NULL,
    version VARCHAR(50) NOT NULL,
    zip_url VARCHAR(255) NOT NULL,
    zip_hash VARCHAR(64) NOT NULL,
    zip_size INT NOT NULL,
    changelog TEXT,
    min_app_version VARCHAR(50),
    dependencies JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_latest BOOLEAN DEFAULT FALSE,
    download_count INT DEFAULT 0,
    FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE,
    UNIQUE KEY unique_plugin_version (plugin_id, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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