# Time Glass

Time Glass是一个时间管理应用，帮助用户追踪和优化他们的时间使用。

## 项目结构

该项目由两个主要部分组成：

- `frontend/` - 基于React、Next.js、Tailwind CSS和shadcn/ui的前端应用
- `backend/` - 基于Python 3.12和FastAPI的后端API

## 技术栈

### 前端

- React
- Next.js
- Tailwind CSS
- shadcn/ui

### 后端

- Python 3.12
- Poetry（依赖管理）
- FastAPI
- SQLAlchemy
- Pydantic

## 开始使用

### 后端设置

1. 确保已安装Python 3.12和Poetry
2. 安装后端依赖：
   ```bash
   cd backend
   poetry install
   ```
3. 创建环境变量文件：
   ```bash
   cp .env.example .env
   ```
   然后编辑`.env`文件，设置适当的环境变量。

4. 启动后端服务：
   ```bash
   poetry run python run.py
   ```
   或者：
   ```bash
   poetry run uvicorn backend.app.main:app --reload
   ```

### 前端设置

1. 确保已安装Node.js（18.0.0+）和npm
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

## 开发

有关详细的开发指南，请参阅各自目录中的README文件：

- [前端开发指南](frontend/README.md)
- [后端开发指南](backend/README.md)

## 贡献

欢迎贡献！请随时提交问题或拉取请求。