# TimeGlass 后端测试

本目录包含 TimeGlass 后端服务的测试代码。

## 测试结构

- `test_api_endpoints.py`: API 端点测试
- `test_data_service.py`: 数据服务测试（存在问题，暂不使用）
- `test_data_service_simple.py`: 简化版数据服务测试（可单独运行）

## 运行测试

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

## 测试覆盖率

当前测试覆盖率：

| 模块                                    | 语句数 | 未覆盖 | 覆盖率 |
|----------------------------------------|--------|--------|--------|
| backend/app/api/__init__.py            | 0      | 0      | 100%   |
| backend/app/api/api.py                 | 4      | 0      | 100%   |
| backend/app/api/endpoints/__init__.py  | 0      | 0      | 100%   |
| backend/app/api/endpoints/data.py      | 19     | 0      | 100%   |
| backend/app/core/__init__.py           | 0      | 0      | 100%   |
| backend/app/core/config.py             | 13     | 0      | 100%   |
| backend/app/db/__init__.py             | 0      | 0      | 100%   |
| backend/app/db/elasticsearch.py        | 56     | 38     | 32%    |
| backend/app/main.py                    | 25     | 4      | 84%    |
| backend/app/models/__init__.py         | 0      | 0      | 100%   |
| backend/app/models/data.py             | 71     | 0      | 100%   |
| backend/app/services/__init__.py       | 0      | 0      | 100%   |
| backend/app/services/data_service.py   | 78     | 7      | 91%    |
| **总计**                               | **266**| **49** | **82%**|

## 已知问题

1. `test_data_service.py` 中的测试存在事件循环关闭问题，导致测试失败。
2. 所有使用 `datetime.utcnow()` 的地方都有弃用警告，建议使用 `datetime.now(datetime.UTC)` 替代。
3. FastAPI 的 `on_event` 方法已弃用，建议使用 lifespan 事件处理程序替代。

## 改进计划

1. 修复 `test_data_service.py` 中的事件循环问题。
2. 增加对 Elasticsearch 模块的测试覆盖率。
3. 更新代码以解决弃用警告。
4. 添加更多的边界条件测试。 