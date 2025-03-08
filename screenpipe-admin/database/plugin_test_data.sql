-- 测试数据
-- 插入插件数据
INSERT INTO plugins (name, description, tags, status, visibility, downloads_count) VALUES
('数据分析插件', '提供高级数据分析功能，支持多种图表和报表生成', JSON_ARRAY('数据分析', '图表', '报表'), 'active', 'public', 1250),
('任务自动化', '自动化重复性任务，提高工作效率', JSON_ARRAY('自动化', '效率', '工作流'), 'active', 'private', 780),
('日程管理', '高效管理日程和提醒', JSON_ARRAY('日程', '提醒', '管理'), 'active', 'public', 2340),
('笔记同步', '跨设备同步笔记和文档', JSON_ARRAY('笔记', '同步', '文档'), 'inactive', 'private', 560),
('代码片段', '管理和分享代码片段', JSON_ARRAY('代码', '开发', '分享'), 'active', 'organization', 1870),
('翻译助手', '实时翻译多种语言', JSON_ARRAY('翻译', '语言', '国际化'), 'deprecated', 'public', 3200);

-- 插入插件版本数据
-- 数据分析插件版本
INSERT INTO plugin_versions (plugin_id, version, zip_url, zip_hash, zip_size, changelog, min_app_version, dependencies, is_latest, download_count) VALUES
(1, '1.0.0', '/storage/plugins/1/data-analysis-1.0.0.zip', 'a1b2c3d4e5f6g7h8i9j0', 1024000, '初始版本', '2.0.0', '{}', FALSE, 450),
(1, '1.1.0', '/storage/plugins/1/data-analysis-1.1.0.zip', 'b2c3d4e5f6g7h8i9j0k1', 1126400, '修复了一些bug，提高了性能', '2.0.0', '{}', FALSE, 350),
(1, '1.2.0', '/storage/plugins/1/data-analysis-1.2.0.zip', 'c3d4e5f6g7h8i9j0k1l2', 1228800, '添加了新的图表类型', '2.1.0', '{"chart-lib": "^2.0.0"}', TRUE, 450);

-- 任务自动化插件版本
INSERT INTO plugin_versions (plugin_id, version, zip_url, zip_hash, zip_size, changelog, min_app_version, dependencies, is_latest, download_count) VALUES
(2, '1.0.0', '/storage/plugins/2/task-automation-1.0.0.zip', 'd4e5f6g7h8i9j0k1l2m3', 819200, '初始版本', '2.0.0', '{}', FALSE, 280),
(2, '1.1.0', '/storage/plugins/2/task-automation-1.1.0.zip', 'e5f6g7h8i9j0k1l2m3n4', 870400, '添加了更多自动化模板', '2.0.0', '{}', TRUE, 500);

-- 日程管理插件版本
INSERT INTO plugin_versions (plugin_id, version, zip_url, zip_hash, zip_size, changelog, min_app_version, dependencies, is_latest, download_count) VALUES
(3, '1.0.0', '/storage/plugins/3/schedule-1.0.0.zip', 'f6g7h8i9j0k1l2m3n4o5', 614400, '初始版本', '1.5.0', '{}', FALSE, 800),
(3, '1.1.0', '/storage/plugins/3/schedule-1.1.0.zip', 'g7h8i9j0k1l2m3n4o5p6', 665600, '添加了日历视图', '1.5.0', '{"calendar-widget": "^1.0.0"}', FALSE, 740),
(3, '1.2.0', '/storage/plugins/3/schedule-1.2.0.zip', 'h8i9j0k1l2m3n4o5p6q7', 716800, '添加了提醒功能', '2.0.0', '{"calendar-widget": "^1.2.0", "notification-service": "^1.0.0"}', TRUE, 800);

-- 笔记同步插件版本
INSERT INTO plugin_versions (plugin_id, version, zip_url, zip_hash, zip_size, changelog, min_app_version, dependencies, is_latest, download_count) VALUES
(4, '1.0.0', '/storage/plugins/4/note-sync-1.0.0.zip', 'i9j0k1l2m3n4o5p6q7r8', 512000, '初始版本', '2.0.0', '{}', FALSE, 210),
(4, '1.1.0', '/storage/plugins/4/note-sync-1.1.0.zip', 'j0k1l2m3n4o5p6q7r8s9', 563200, '添加了冲突解决功能', '2.0.0', '{}', TRUE, 350);

-- 代码片段插件版本
INSERT INTO plugin_versions (plugin_id, version, zip_url, zip_hash, zip_size, changelog, min_app_version, dependencies, is_latest, download_count) VALUES
(5, '1.0.0', '/storage/plugins/5/code-snippets-1.0.0.zip', 'k1l2m3n4o5p6q7r8s9t0', 768000, '初始版本', '1.8.0', '{}', FALSE, 620),
(5, '1.1.0', '/storage/plugins/5/code-snippets-1.1.0.zip', 'l2m3n4o5p6q7r8s9t0u1', 819200, '添加了语法高亮', '1.8.0', '{"highlight-js": "^10.0.0"}', FALSE, 550),
(5, '1.2.0', '/storage/plugins/5/code-snippets-1.2.0.zip', 'm3n4o5p6q7r8s9t0u1v2', 870400, '添加了代码分享功能', '2.0.0', '{"highlight-js": "^10.0.0", "share-api": "^1.0.0"}', TRUE, 700);

-- 翻译助手插件版本
INSERT INTO plugin_versions (plugin_id, version, zip_url, zip_hash, zip_size, changelog, min_app_version, dependencies, is_latest, download_count) VALUES
(6, '1.0.0', '/storage/plugins/6/translator-1.0.0.zip', 'n4o5p6q7r8s9t0u1v2w3', 921600, '初始版本', '1.5.0', '{}', FALSE, 950),
(6, '1.1.0', '/storage/plugins/6/translator-1.1.0.zip', 'o5p6q7r8s9t0u1v2w3x4', 972800, '添加了更多语言支持', '1.5.0', '{}', FALSE, 1050),
(6, '1.2.0', '/storage/plugins/6/translator-1.2.0.zip', 'p6q7r8s9t0u1v2w3x4y5', 1024000, '添加了离线翻译功能', '1.8.0', '{"offline-dict": "^1.0.0"}', TRUE, 1200);

-- 插入一些下载记录
INSERT INTO plugin_downloads (plugin_id, version_id, user_id, ip_address, user_agent, downloaded_at) VALUES
(1, 3, 101, '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(1, 3, 102, '192.168.1.2', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 5, 103, '192.168.1.3', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(3, 8, 104, '192.168.1.4', 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(3, 8, 105, '192.168.1.5', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(4, 10, 106, '192.168.1.6', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(5, 13, 107, '192.168.1.7', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(6, 16, 108, '192.168.1.8', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(6, 16, 109, '192.168.1.9', 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(6, 16, 110, '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', DATE_SUB(NOW(), INTERVAL 1 DAY)); 