# 易宿酒店预订平台（EasyHotel）

第五届携程前端训练营大作业，包含：
- `App` 用户端（React Native + Expo）
- `Web` 商户端 / 管理端（React + Ant Design）
- `Service` 后端服务（NestJS + Prisma + PostgreSQL）

## 项目简介

易宿是一个“酒店上架 + 审核发布 + 用户浏览”的完整业务闭环项目。
系统角色和职责：
- 用户端（App）：浏览酒店、筛选排序、查看酒店详情和房型信息
- 商户端（Web）：维护酒店资料、管理房型、提交审核
- 管理端（Web）：审核酒店、发布上下线、运营 Banner 与标签
- 后端（Service）：统一鉴权、数据访问、业务规则和接口封装

## 核心功能

### 用户端 App
- 首页 Banner 展示
- 酒店列表（城市/价格/星级/标签筛选）
- 酒店详情与房型列表
- 日期、人数、位置相关筛选

### 商户端 Web
- 商户账号登录
- 酒店创建与编辑
- 酒店图片管理
- 房型创建、编辑、状态切换
- 提交审核

### 管理端 Web
- 酒店审核（通过 / 拒绝）
- 酒店发布上下线
- Banner 管理
- 标签管理

## 技术栈

- 后端：NestJS 11、Prisma、PostgreSQL（Neon）
- 前端（Web）：React、React Router、Ant Design、Zustand、Axios
- 前端（App）：React Native、Expo、React Navigation、React Query、FlashList
- 构建与部署：Vercel（后端）、Netlify（Web）、EAS Build（App）

## 仓库结构

```text
easyhotel/
├── app/                 # Expo App（用户端）
├── easyhotel-web/       # React Web（商户端 + 管理端）
├── service/             # NestJS API 服务
├── scripts/             # 开发辅助脚本
├── task.md              # 任务拆解文档
└── 易宿酒店预订平台_API文档.md
```

## 本地开发

### 1. 环境要求

- Node.js >= 20
- npm >= 10
- PostgreSQL（或 Neon 数据库）

### 2. 安装依赖

在仓库根目录执行：

```bash
npm install
npm install --prefix service
npm install --prefix easyhotel-web
npm install --prefix app
```

### 3. 环境变量

按模板创建本地环境文件：

- `service/.env.example` -> `service/.env`
- `easyhotel-web/.env.example` -> `easyhotel-web/.env`
- `app/.env.example` -> `app/.env`

关键变量：

- 后端：`DATABASE_URL`、`JWT_SECRET`、`CORS_ORIGINS`
- Web：`REACT_APP_API_BASE_URL`
- App：`EXPO_PUBLIC_API_BASE_URL`

### 4. 启动项目

启动后端：

```bash
npm run start:dev --workspace service
```

启动 Web：

```bash
npm start --prefix easyhotel-web
```

启动 App（Expo）：

```bash
npm start --prefix app
```

## 数据库与种子数据

```bash
npm run prisma:migrate --workspace service
npm run db:seed --workspace service
```

## 部署说明

### 后端（Vercel）

- Root Directory：`service`
- 主要环境变量：
  - `DATABASE_URL`
  - `JWT_SECRET` / `JWT_REFRESH_SECRET`
  - `CORS_ORIGINS`
  - `BLOB_READ_WRITE_TOKEN`

### Web（Netlify）

- Base Directory：`easyhotel-web`（或使用手动 build 命令）
- Build Command：`npm run build`（手动模式可用 `npm run build --prefix easyhotel-web`）
- Publish Directory：`build`（手动模式可用 `easyhotel-web/build`）
- 主要环境变量：`REACT_APP_API_BASE_URL`

### App（EAS Build）

已配置 `app/eas.json`，常用命令：

```bash
cd app
npx --yes eas-cli login
npx --yes eas-cli build:configure
npx --yes eas-cli build --platform android --profile preview
```

## 接口文档

- 详细接口说明见：[易宿酒店预订平台_API文档.md](./易宿酒店预订平台_API文档.md)
