# EasyHotel Service（NestJS）

本目录是后端服务端代码，技术栈：NestJS + Prisma + PostgreSQL。

---

## 目录结构

```
service/
  src/
    common/
      decorators/
        current-user.decorator.ts
        roles.decorator.ts
        current-user.decorator.spec.ts
      guards/
        roles.guard.ts
        roles.guard.spec.ts
    modules/
      app/
        app.module.ts
        app.controller.ts
        app.service.ts
      auth/
        auth.module.ts
        auth.controller.ts
        auth.service.ts
        auth.service.spec.ts
        dto/
          login.dto.ts
          register.dto.ts
        guards/
          jwt-auth.guard.ts
        strategies/
          jwt.strategy.ts
          jwt.strategy.spec.ts
        types/
          auth-user.ts
          jwt-payload.ts
    prisma/
      prisma.service.ts
      prisma.module.ts
    app.module.ts
    main.ts
    app.controller.spec.ts
    database.provider.ts
  prisma/
    schema.prisma
    migrations/
    seed.ts
  test/
    app.e2e-spec.ts
    jest-e2e.json
  uploads/              # 运行时生成（本地静态资源）
  dist/                 # 构建产物（可删除，构建会重新生成）
  package.json
  nest-cli.json
  tsconfig.json
  tsconfig.build.json
  eslint.config.mjs
  .prettierrc
  .gitignore
```

---

## 各目录/文件职责

### `src/main.ts`

应用入口：创建 Nest 应用、配置 CORS/静态资源、全局 ValidationPipe，启动端口。

### `src/app.module.ts`

根模块：聚合各功能模块（`AppApiModule`、`AuthModule`）以及全局 provider。

### `src/common/`

放置跨模块复用的横切能力：

- `decorators/`：`@CurrentUser`、`@Roles`
- `guards/`：`RolesGuard`

### `src/modules/app/`

示例功能模块（当前包含 `/api/hello`）。

- `app.module.ts`：模块定义
- `app.controller.ts`：路由控制器
- `app.service.ts`：业务服务

### `src/modules/auth/`

鉴权模块：注册/登录/当前用户 + JWT。

- `auth.controller.ts`：`/auth/register`、`/auth/login`、`/me`
- `auth.service.ts`：注册/登录逻辑、密码加密、JWT 签发
- `dto/`：请求校验
- `guards/`：JWT 守卫
- `strategies/`：JWT 解析策略
- `types/`：Auth 类型

### `src/prisma/`

- `prisma.service.ts`：PrismaClient 封装（连接/断开）。
- `prisma.module.ts`：封装并导出 PrismaService，供各功能模块复用。

### `prisma/`

- `schema.prisma`：数据库模型
- `migrations/`：迁移历史
- `seed.ts`：演示/初始数据种子

### `test/`

E2E 测试相关配置与用例。

---

## 推荐目录结构

建议按“功能模块 + common 横切能力”组织：

```
src/
  common/
    decorators/
    guards/
    filters/
    interceptors/
  modules/
    app/          # 用户端只读 API（/app/*）
      banners/
      hotels/
      rooms/
    admin/        # 管理端 API（/admin/*）
      hotels/
      review/
      rooms/
    auth/
    upload/
  prisma/
    prisma.module.ts
    prisma.service.ts
  app.module.ts
  main.ts
```

说明：
- `common/filters` 与 `common/interceptors` 用于统一错误码和响应结构。
- 每个功能域一个模块（避免按“controller/service”横切拆分）。

---

## 常用命令

```
# 根目录统一安装
npm install

# 启动服务
npm run start:dev --workspace service

# 测试
npm run test --workspace service
npm run test:e2e --workspace service

# Prisma
npm run prisma:migrate --workspace service
npm run db:seed --workspace service
```
