# Time Glass 前端

这是Time Glass应用的前端部分，使用React、Next.js、Tailwind CSS和shadcn/ui构建。项目采用Next.js的App Router架构。

## 技术栈

- [Next.js](https://nextjs.org/) - React框架（使用App Router架构）
- [React](https://reactjs.org/) - 用户界面库
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [shadcn/ui](https://ui.shadcn.com/) - 组件库

## 开发环境要求

- Node.js 18.0.0或更高版本
- npm 9.0.0或更高版本

## 安装

1. 安装依赖：
   ```bash
   cd frontend
   npm install
   ```

## 开发

启动开发服务器：

```bash
npm run dev
```

然后在浏览器中打开 [http://localhost:3000](http://localhost:3000)。

## 构建

构建生产版本：

```bash
npm run build
```

## 运行生产版本

```bash
npm start
```

## 项目结构

- `app/` - Next.js App Router路由和页面
  - `layout.tsx` - 全局布局组件
  - `page.tsx` - 首页
  - `about/` - 关于页面
  - `dashboard/` - 仪表盘页面
  - `productivity/` - 生产力分析页面
  - `ocr-text/` - OCR文本识别页面
  - `ui-monitoring/` - UI监控页面
- `components/` - React组件
  - `ui/` - shadcn/ui基础组件
  - `layout/` - 布局相关组件（如Header、Footer）
  - `dashboard/` - 仪表盘相关组件
  - `productivity/` - 生产力分析相关组件
  - `ui-monitoring/` - UI监控相关组件
- `lib/` - 工具函数和共享代码
  - `api/` - API调用函数
  - `utils/` - 工具函数
  - `types/` - TypeScript类型定义
- `public/` - 静态资源

## 开发指南

### 添加新页面

1. 在`app/`目录下创建新的目录，如`app/new-feature/`
2. 在该目录中创建`page.tsx`文件
3. 如需特定布局，可添加`layout.tsx`文件

示例：
```tsx
// app/new-feature/page.tsx
export default function NewFeaturePage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold">新功能</h1>
      {/* 页面内容 */}
    </div>
  );
}
```

### 客户端组件与服务器组件

- 默认情况下，App Router中的组件都是服务器组件
- 需要使用浏览器API、React hooks或事件处理的组件，需添加`"use client"`指令

```tsx
"use client";

import { useState } from 'react';

export function ClientComponent() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      点击次数: {count}
    </button>
  );
}
```

## 与后端通信

前端通过API与后端通信。API端点配置在环境变量中。

## 部署

项目可以部署到Vercel、Netlify或其他支持Next.js的平台。
