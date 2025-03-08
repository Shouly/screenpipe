# TimeGlass Elasticsearch 工具

本目录包含一系列用于管理 TimeGlass Elasticsearch 数据的工具脚本。

## 工具列表

1. `check_es_data.py` - 查看 Elasticsearch 中的 TimeGlass 相关索引和数据统计
2. `clear_es_data.py` - 清空 Elasticsearch 中的所有 TimeGlass 相关索引（需要确认）
3. `clear_es_data_force.py` - 强制清空 Elasticsearch 中的所有 TimeGlass 相关索引（无需确认）
4. `clear_es_index_data.py` - 清空特定索引的数据，保留索引结构
5. `manage_es_data.py` - 综合管理工具，提供多种功能

## 使用方法

### 查看数据

```bash
# 查看所有TimeGlass相关索引
python check_es_data.py

# 查看详细信息，包括最新文档
python check_es_data.py -v

# 指定每个索引显示的最新文档数量
python check_es_data.py -v -c 5
```

### 清空数据

```bash
# 清空所有TimeGlass相关索引（需要确认）
python clear_es_data.py

# 强制清空所有TimeGlass相关索引（无需确认）
python clear_es_data_force.py

# 清空特定索引的数据
python clear_es_index_data.py timeglass-data-2023.03.01

# 强制清空特定索引的数据（无需确认）
python clear_es_index_data.py timeglass-data-2023.03.01 -f
```

### 综合管理工具

`manage_es_data.py` 是一个功能更全面的管理工具，提供了多种子命令：

```bash
# 列出所有TimeGlass相关索引
python manage_es_data.py list

# 列出匹配特定模式的索引
python manage_es_data.py list -p "timeglass-ocr-*"

# 查看索引详情
python manage_es_data.py info timeglass-data-2023.03.01

# 查看索引详情（包括映射信息）
python manage_es_data.py info timeglass-data-2023.03.01 -v

# 清空索引数据
python manage_es_data.py clear timeglass-data-2023.03.01

# 强制清空索引数据（无需确认）
python manage_es_data.py clear timeglass-data-2023.03.01 -f

# 删除索引
python manage_es_data.py delete timeglass-data-2023.03.01

# 搜索数据
python manage_es_data.py search timeglass-data-2023.03.01 -q "clientId:test*"

# 搜索数据并显示详细信息
python manage_es_data.py search timeglass-data-2023.03.01 -q "clientId:test*" -v

# 限制搜索结果数量
python manage_es_data.py search timeglass-data-2023.03.01 -q "clientId:test*" -l 20
```

## 注意事项

1. 这些工具会直接操作 Elasticsearch 数据，请谨慎使用，特别是清空和删除操作。
2. 工具会从环境变量或应用配置中读取 Elasticsearch 连接信息。
3. 强制清空操作不会提示确认，请确保你知道自己在做什么。
4. 建议在执行清空或删除操作前，先使用查看工具检查数据。 