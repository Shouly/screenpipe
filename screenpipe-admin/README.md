# [ screenpipe-admin ]

screenpipe-admin 是 screenpipe 生态系统的企业级管理平台，提供全面的监控、分析和远程控制功能，帮助企业优化员工生产力并管理 screenpipe 部署。

```
 _____                                 _                        _           _       
|  ___|                               (_)                      | |         (_)      
| |__ _ __  ___ _ __ ___  ___ _ __  _ _ __   ___    __ _  __| |_ __ ___  _ _ __  
|  __| '_ \/ __| '__/ _ \/ _ \ '_ \| | '_ \ / _ \  / _` |/ _` | '_ ` _ \| | '_ \ 
| |__| | | \__ \ | |  __/  __/ | | | | |_) |  __/ | (_| | (_| | | | | | | | | | |
\____/_| |_|___/_|  \___|\___|_| |_|_| .__/ \___|  \__,_|\__,_|_| |_| |_|_|_| |_|
                                     | |                                          
                                     |_|                                          
```

## [ 核心功能 ]

- **远程控制** - 通过 websocket 实时连接管理客户端设备
- **生产力分析** - 深入分析员工工作效率和应用使用情况
- **插件管理** - 集中管理 screenpipe 插件的发布和分发
- **ocr 文本分析** - 分析从屏幕捕获的文本数据
- **ui 监控** - 监控用户界面交互和应用使用模式

## [ 项目结构 ]

该项目由三个主要部分组成：

- `frontend/` - 基于 react、next.js、tailwind css 和 shadcn/ui 的管理界面
- `backend/` - 基于 python 3.12 和 fastapi 的后端 api 服务
- `database/` - 数据库模式和测试数据

## [ 技术栈 ]

### 前端

- react
- next.js
- tailwind css
- shadcn/ui
- lucide-icons
- framer-motion

### 后端

- python 3.12
- poetry（依赖管理）
- fastapi
- sqlalchemy
- elasticsearch
- pydantic
- websockets

## [ 快速开始 ]

### 后端设置

1. 确保已安装 python 3.12 和 poetry
2. 安装后端依赖：
   ```bash
   cd backend
   poetry install
   ```
3. 创建环境变量文件：
   ```bash
   cp .env.example .env
   ```
   然后编辑 `.env` 文件，设置适当的环境变量。

4. 启动后端服务：
   ```bash
   poetry run python run.py
   ```
   或者：
   ```bash
   poetry run uvicorn backend.app.main:app --reload
   ```

### 前端设置

1. 确保已安装 node.js（18.0.0+）和 npm
2. 安装前端依赖：
   ```bash
   cd frontend
   npm install
   ```
3. 启动开发服务器：
   ```bash
   npm run dev
   ```
4. 在浏览器中打开 [http://localhost:3000](http://localhost:3000)

## [ 主要功能模块 ]

### 远程控制

通过 websocket 连接与客户端实时通信，支持：
- 远程锁屏/解锁
- 远程关机/重启
- 屏幕截图获取
- 命令执行
- 客户端状态监控

### 生产力分析

全面的员工生产力分析工具：
- 应用使用时间统计
- 工作模式识别
- 团队协作效率分析
- 自定义报告生成

### 插件管理

集中式插件管理系统：
- 插件发布和版本控制
- 下载统计和使用分析
- 权限和访问控制
- 自动更新推送

## [ 开发指南 ]

有关详细的开发指南，请参阅各自目录中的 README 文件：

- [前端开发指南](frontend/README.md)
- [后端开发指南](backend/README.md)

## [ 贡献 ]

欢迎贡献！请随时提交问题或拉取请求。

## [ 许可证 ]

本项目遵循与 screenpipe 主项目相同的许可条款。