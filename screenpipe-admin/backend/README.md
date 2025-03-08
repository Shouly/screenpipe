# TimeGlass 后端服务

TimeGlass 是一个用于时间追踪和生产力分析的应用程序。本仓库包含 TimeGlass 的后端服务代码。

## 项目结构

```
backend/
├── backend/             # 主应用程序代码
│   └── app/             # FastAPI应用
│       ├── api/         # API路由
│       ├── core/        # 核心配置
│       ├── db/          # 数据库连接
│       ├── models/      # 数据模型
│       └── services/    # 业务逻辑服务
├── scripts/             # 脚本工具
│   ├── es_tools.py      # Elasticsearch工具启动脚本
│   └── run_all_tests.py # 测试脚本启动器
├── test/                # 测试代码
│   ├── test_api_endpoints.py  # API测试
│   └── test_data_service_simple.py  # 数据服务测试
├── tools/               # 工具集
│   └── es/              # Elasticsearch工具
│       ├── check_es_data.py        # 查看ES数据
│       ├── clear_es_data.py        # 清空所有索引
│       ├── clear_es_data_force.py  # 强制清空所有索引
│       ├── clear_es_index_data.py  # 清空特定索引数据
│       ├── manage_es_data.py       # 综合管理工具
│       └── README_ES_TOOLS.md      # ES工具说明
├── .env                 # 环境变量配置
├── .env.example         # 环境变量示例
├── pyproject.toml       # 项目依赖配置
├── pytest.ini           # Pytest配置
└── README.md            # 项目说明
```

## 功能

- 数据报告 API：接收并处理客户端发送的数据
- Elasticsearch 集成：存储和索引数据
- 专门的数据提取：从原始数据中提取 OCR 文本、音频转录和 UI 监控数据

## 安装

1. 确保已安装 Python 3.8+ 和 Poetry
2. 克隆仓库
3. 安装依赖：

```bash
cd backend
poetry install
```

## 配置

通过环境变量配置应用：

- `ES_URL`: Elasticsearch URL
- `ES_USER`: Elasticsearch 用户名
- `ES_PWD`: Elasticsearch 密码
- `APP_ENV`: 应用环境 (development, test, production)
- `DEBUG`: 调试模式 (true/false)
- `API_PREFIX`: API 前缀

## 运行

```bash
# 使用 Poetry 运行
poetry run python -m backend.app.main

# 或者激活虚拟环境后运行
poetry shell
python -m backend.app.main
```

## 测试

使用以下命令运行测试：

```bash
# 运行所有测试
python scripts/run_all_tests.py

# 运行测试并显示详细输出
python scripts/run_all_tests.py -v

# 运行测试并生成覆盖率报告
python scripts/run_all_tests.py -c

# 运行特定测试文件
python scripts/run_all_tests.py test/test_api_endpoints.py
```

当前测试覆盖率为 82%。详细的测试信息请查看 [test/README.md](test/README.md)。

## API 文档

启动服务后，可以通过以下 URL 访问 API 文档：

- Swagger UI: http://localhost:8000/api/v1/docs
- ReDoc: http://localhost:8000/api/v1/redoc

## 工具脚本

### Elasticsearch工具

使用`es_tools.py`脚本可以管理Elasticsearch数据：

```bash
# 查看帮助
poetry run python scripts/es_tools.py --help

# 查看ES数据
poetry run python scripts/es_tools.py check

# 清空所有索引（需要确认）
poetry run python scripts/es_tools.py clear

# 强制清空所有索引（无需确认）
poetry run python scripts/es_tools.py force-clear

# 清空特定索引数据
poetry run python scripts/es_tools.py clear-index timeglass-data-2025.03.01

# 使用综合管理工具
poetry run python scripts/es_tools.py manage list
```

更多ES工具的详细说明，请参考 [tools/es/README_ES_TOOLS.md](tools/es/README_ES_TOOLS.md)。

## 代码风格

本项目使用Black和isort进行代码格式化：

```bash
poetry run black .
poetry run isort .
```

## 数据上报API

主要的数据上报API端点是：

```
POST /api/v1/data/report
```

该API接收来自客户端的数据报告，包括屏幕帧、音频转录和UI监控数据，并将其存储在Elasticsearch中。

### 数据存储

数据存储在以下Elasticsearch索引中：

- `timeglass-data-YYYY.MM.DD` - 主数据索引，按日期分片
- `timeglass-ocr-text` - OCR文本专用索引
- `timeglass-audio-transcriptions` - 音频转录专用索引
- `timeglass-ui-monitoring` - UI监控专用索引

这种设计支持高效的全文搜索和时间序列分析。

## 开发

1. 创建新分支进行开发
2. 提交前运行测试确保代码质量
3. 提交 Pull Request 进行代码审查 