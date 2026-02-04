# 易宿酒店预订平台 — task.md（两人协作版）

> 技术路线：标准分层（RN 用户端 + Web 管理端） + NestJS 后端（REST） + PostgreSQL + Prisma + JWT/RBAC
> 目标：一套后端同时服务 **App（/app/**）与 **管理端（/admin/**）**，并满足结营大作业功能要求。
> 版本：v1.0　日期：2026-02-03

---

## 0. 角色分工（两名开发者）

- **开发者 A（后端 Owner + App API）**：后端基础设施、鉴权与权限、用户端只读接口、通用能力、测试/CI 骨架
- **开发者 B（管理端 Owner + 管理 API + Web）**：商户/管理员写接口、审核/上下线、Web 管理端页面与联调、补齐日志/上传

> 约定：所有任务都要有 **验收标准（AC）**；UT 以可测性与核心模块为主，不可测的可标注“无”。
> UT = Jest 单元测试（Service 层优先，能测就测），必要时补 e2e（supertest）。

---

## 1. 项目初始化与规范（Day 1）

### T1.1 建仓与目录结构（Owner：A）

**内容**

- 建立 mono-repo（当前结构）：`service/`、`web/`、`app/`（可选 `packages/shared/`）
- 统一 Node 版本（.nvmrc）与包管理（npm）
- 增加基础脚本：`lint`、`test`、`test:e2e`、`format`、`dev`、`build`

**AC**

- 任意开发者 clone 后能一键安装依赖并跑起 `service/`
- lint/format 能运行

**UT**

- 无（脚手架任务）

---

### T1.2 代码规范与提交规范（Owner：A）

**内容**

- ESLint + Prettier（api/web/rn 统一规则）
- commitlint + husky（可选）
- 环境变量模板：`.env.example`（API 的 DB/JWT/UPLOAD 等）

**AC**

- `npm run lint` 全绿；`npm run format` 能自动修复
- `.env.example` 覆盖运行所需变量

**UT**

- 无

---

---

## 2. 后端（NestJS + Prisma）基础设施（Day 1–2）

### T2.1 NestJS 项目骨架（Owner：A）

**内容**

- 创建 `service/` Nest 项目
- 配置 `ConfigModule`（dotenv）
- 全局 `ValidationPipe`（DTO 校验）
- 统一响应封装（建议：Interceptor）`{code,message,data}`
- 全局异常过滤（ExceptionFilter）：把 HttpException 统一映射到业务 code

**AC**

- `GET /health` 返回统一结构（code=0）
- 传入非法 DTO 参数时返回 40000 格式错误

**UT（必须）**

- `ResponseInterceptor`：输入 data -> 输出统一结构（快照测试）
- `HttpExceptionFilter`：401/403/409/400 映射正确

---

### T2.2 Prisma 接入与数据库迁移（Owner：A）

**内容**

- Prisma 初始化（schema.prisma）并连 PostgreSQL
- 建立核心表（最小集）：users、merchant_profile、room_price_calendar、hotels、hotel_images、room_types、tags、hotel_tags、banners、hotel_audit_logs（可选）
- `PrismaService` 封装 + 生命周期钩子
- 种子数据（seed）：管理员/商户账号、1-2 家酒店、房型、banner、标签等

**AC**

- `npx prisma migrate dev` 可成功
- `npm run db:seed` 可生成可用演示数据
- App 列表接口能看到 seed 酒店（后续接口完成后验证）

**UT（必须）**

- PrismaService 初始化测试（mock prisma client，验证 onModuleInit 被调用）
- Seed 脚本（可选 UT）：在测试库插入后 count 符合预期

---

### T2.3 CORS 与静态资源（Owner：B）

**内容**

- 开启 CORS（允许管理端域名 + 本地端口）
- 静态资源托管（上传图片本地目录）：`/static/*`
- 约定上传文件返回 URL 形式

**AC**

- Web 调用 api 不报 CORS
- 访问 `GET /static/test.png` 正常

**UT（建议）**

- 配置层 UT：验证 CORS options 被加载（简单断言即可）

---

## 3. 鉴权与权限（JWT + RBAC）（Day 2）

### T3.1 AuthModule：注册/登录/当前用户（Owner：A）

**内容**

- `POST /auth/register`：username/password/role
- `POST /auth/login`：签发 JWT（包含 userId、role）
- `GET /me`：返回当前用户信息
- 密码加密：bcrypt（hash + compare）
- Passport + JwtStrategy

**AC**

- 注册后可登录，返回 token
- 错误密码返回 40100；重复用户名返回 40900
- `/me` 无 token 返回 40100

**UT（必须）**

- AuthService.register：新用户创建成功；重名抛 ConflictException
- AuthService.login：正确密码返回 token；错误密码抛 UnauthorizedException
- JwtStrategy：payload -> req.user 映射正确（单测）

---

### T3.2 RolesGuard + 装饰器（Owner：A）

**内容**

- `@Roles('ADMIN'|'MERCHANT')`
- `RolesGuard`：从 req.user.role 校验
- `@CurrentUser()` decorator（拿 userId/role）

**AC**

- 管理员接口用 MERCHANT token 访问 -> 40300
- 商户接口用 ADMIN token（如不允许）-> 40300（按你们规则）

**UT（必须）**

- RolesGuard：匹配/不匹配两种路径
- CurrentUser decorator：能取到注入对象字段

---

## 4. 用户端（App）只读 API（/app/*）（Day 3）

### T4.1 Banner 列表（Owner：A）

**接口**：`GET /app/banners?city=`**内容**

- 查询启用 banner（isActive=1），按 sortOrder 排序
- 支持可选 city 筛选（没有也可）

**AC**

- 返回数组包含 imageUrl、hotelId、title
- 无数据返回空数组（code=0）

**UT（必须）**

- BannerService.list：isActive 过滤正确；sortOrder 排序正确

---

### T4.2 酒店列表筛选/分页（Owner：A）

**接口**：`GET /app/hotels`**内容**

- 仅返回 `auditStatus=APPROVED && publishStatus=ONLINE`
- 支持筛选：city、keyword（name/address）、star、minPrice/maxPrice、tags（多选）
- 支持排序：`price_asc`（min_price 升序）
- 支持分页：page/pageSize，返回 `list/total/hasMore`

**AC**

- 分页正确；price_asc 排序正确；tags 过滤生效
- tags 策略需在代码注释写清楚（any-of / all-of）

**UT（必须）**

- 状态过滤永远生效（APPROVED+ONLINE）
- 价格区间过滤（边界测试）
- 排序测试（min_price 升序）
- 分页测试（page=2 offset 正确）

---

### T4.3 酒店详情 + 图片（Owner：A）

**接口**：`GET /app/hotels/:id`**内容**

- 返回酒店基础信息 + images（按 sortOrder）+ tags + facilities
- 仅返回 APPROVED+ONLINE（对用户隐藏下线/未过审酒店）

**AC**

- images 有序；不存在返回 40400
- 下线/未通过酒店访问返回 40400

**UT（必须）**

- 正常返回包含 images/tags
- sortOrder 排序正确
- 非在线或非通过 -> NotFoundException

---

### T4.4 房型列表（按价升序）（Owner：A）

**接口**：`GET /app/hotels/:id/rooms`**内容**

- 后端 `ORDER BY base_price ASC`
- 只返回 status=1（可售）房型
- 酒店不可见（未通过/下线）时返回 40400

**AC**

- 房型价格从低到高
- 不可见酒店返回 40400

**UT（必须）**

- 价格排序 + status 过滤

---

## 5. 商户端 API（/admin/* MERCHANT）（Day 3–4）

### T5.1 商户创建酒店草稿（Owner：B）

**接口**：`POST /admin/hotels`（MERCHANT）**内容**

- 创建 hotels：auditStatus=DRAFT、publishStatus=OFFLINE，merchantId=当前用户
- 最小字段允许：nameCn/city

**AC**

- 返回 hotelId 与状态
- ADMIN 访问此接口被拒绝（按规则）

**UT（必须）**

- merchantId 写入正确，默认状态正确

---

### T5.2 商户编辑酒店（Owner：B）

**接口**：`PUT /admin/hotels/:id`（MERCHANT）**内容**

- 仅允许编辑：DRAFT/REJECTED（PENDING 禁止）
- 仅允许编辑自己名下酒店
- 支持更新：中/英名、地址、星级、开业时间、facilities、tags、coverImage、description

**AC**

- 编辑审核中酒店返回 40900
- 编辑非自己酒店返回 40300
- 更新成功后 updatedAt 变化

**UT（必须）**

- PENDING -> Conflict
- merchantId 不一致 -> Forbidden
- 正常更新：mock Prisma update 参数断言

---

### T5.3 商户酒店列表（Owner：B）

**接口**：`GET /admin/hotels`（MERCHANT）**内容**

- 返回当前商户酒店（全状态）
- 支持 auditStatus/publishStatus/keyword 分页

**AC**

- 只返回自己酒店
- 分页/筛选正确

**UT（必须）**

- where 条件包含 merchantId
- auditStatus/publishStatus 过滤正确

---

### T5.4 房型管理（Owner：B）

**接口**

- `POST /admin/hotels/:id/rooms`
- `PUT /admin/rooms/:roomId`
- `DELETE /admin/rooms/:roomId`（或“停售”）

**内容**

- 仅允许商户操作自己酒店的房型
- 新增/修改后触发 `hotels.min_price` 重算（取可售房型最低价）

**AC**

- 用户端 rooms 按新价格排序正确
- 删除/停售后 min_price 更新正确

**UT（必须）**

- 新增房型后调用 `recalcMinPrice(hotelId)`
- recalcMinPrice：有房型取最小价；无可售房型置空或 0（需约定并写清楚）

---

### T5.5 图片管理（可选，Owner：B）

**接口**（二选一）

- 简化：编辑酒店时直接传 `images[]` URL 数组
- 或：`POST /admin/hotels/:id/images`、`DELETE /admin/images/:id`

**AC**

- 详情页 images 有序
- 可删除/重排

**UT（建议）**

- 排序/重排逻辑单测

---

### T5.6 提交审核（Owner：B）

**接口**：`POST /admin/hotels/:id/submit`（MERCHANT）**内容**

- DRAFT/REJECTED -> PENDING
- 提交前校验必填字段完整：nameCn/nameEn/address/star/openedAt + 至少 1 个房型及价格

**AC**

- 缺字段返回 40000 并明确缺哪些
- 成功后 auditStatus=PENDING
- 提交后禁止继续编辑（后端层面）

**UT（必须）**

- validateHotelBeforeSubmit：缺字段组合测试
- submit：状态变更正确，调用 validate

---

## 6. 管理员审核与上下线（/admin/* ADMIN）（Day 4–5）

### T6.1 审核列表（Owner：B）

**接口**：`GET /admin/review/hotels`（ADMIN）**内容**

- 支持 auditStatus/publishStatus/keyword 分页
- 返回商户信息（merchantId/merchantName 可选）

**AC**

- ADMIN 可见全量酒店
- MERCHANT 访问被拒

**UT（必须）**

- where 条件映射正确
- 分页正确

---

### T6.2 审核通过（Owner：B）

**接口**：`POST /admin/review/hotels/:id/approve`（ADMIN）**内容**

- PENDING -> APPROVED
- 可选参数 `autoOnline`：true 则 publishStatus=ONLINE

**AC**

- 非 PENDING 返回 40900
- 通过后 rejectReason 清空（推荐）
- 记录 approvedBy/approvedAt（若你表里有）

**UT（必须）**

- 只有 PENDING 可 approve
- autoOnline=true 时 publishStatus 变 ONLINE

---

### T6.3 审核不通过（必须原因）（Owner：B）

**接口**：`POST /admin/review/hotels/:id/reject`（ADMIN）**内容**

- PENDING -> REJECTED
- reason 必填并落库（hotels.rejectReason）

**AC**

- reason 为空返回 40000
- 商户端能看到原因并可修改后重新提交

**UT（必须）**

- reason 必填校验
- 只有 PENDING 可 reject

---

### T6.4 上线/下线（Owner：B）

**接口**

- `POST /admin/hotels/:id/online`
- `POST /admin/hotels/:id/offline`（可选 reason）

**内容**

- 仅 APPROVED 才允许 ONLINE
- OFFLINE 不删除，可再次 online

**AC**

- 未通过酒店 online -> 40900
- offline 后用户端列表不可见

**UT（必须）**

- online：auditStatus != APPROVED -> Conflict
- offline：publishStatus 更新正确

---

### T6.5 操作日志（可选加分）（Owner：B）

**内容**

- 每次 submit/approve/reject/online/offline 写入 `hotel_audit_logs`
- `GET /admin/audit-logs?hotelId=&page=`

**AC**

- 日志按时间倒序
- 可筛选 hotelId

**UT（建议）**

- log 写入方法：action/operatorId/reason 正确

---

## 7. 上传模块

### T7.1 UploadModule（Owner：B）

**内容**

- `POST /upload`（JWT）使用 multer 接收文件
- 保存到 `uploads/`，返回 URL `/static/<file>`
- 限制：类型 jpg/png/webp；大小限制（如 2MB）

**AC**

- 上传成功返回 URL，可直接访问
- 非法类型/过大返回 40000

**UT（必须）**

- 文件类型白名单校验函数（纯函数单测）
- size limit（可用 mock）

---

## 8. Web 管理端（React + Vite + Antd）（Day 5–6）

### T8.1 登录/注册页（Owner：B）

**内容**

- 登录：拿 token 存储（localStorage）
- 注册：选择角色（商户/管理员）
- axios 拦截器：自动带 Authorization

**AC**

- 登录成功跳转对应角色首页
- 登录失败提示 message

**UT（必须）**

- 登录表单校验（React Testing Library）
- axios 拦截器：有 token 时 header 注入（单测）

---

### T8.2 商户：酒店编辑页（Owner：B）

**内容**

- 表单：基础信息 + 标签/设施 + 图片 + 房型 CRUD
- 保存草稿、提交审核按钮（状态不同按钮不同）
- 展示 rejectReason（若 REJECTED）

**AC**

- DRAFT/REJECTED 可编辑；PENDING 只读
- 保存后刷新仍显示最新数据

**UT（建议）**

- 表单必填校验（星级范围、价格为正）
- 房型列表组件：新增/编辑/删除行为测试

---

### T8.3 管理员：审核/上下线页（Owner：B）

**内容**

- 列表：按状态筛选 + 关键字搜索 + 分页
- 详情抽屉：查看酒店+房型+图片
- 操作：通过/驳回（必填原因）/上线/下线

**AC**

- 通过/驳回后列表状态刷新
- 下线后用户端不再可见

**UT（建议）**

- 驳回弹窗：原因必填校验
- 列表筛选参数拼接正确（单测）

---

## 9. RN 用户端（React Native）（Day 6–7）

### T9.1 三页路由与基础组件（Owner：A）

**内容**

- 页面：查询页 / 列表页 / 详情页
- 路由：React Navigation
- 请求封装：axios + baseURL（支持环境切换）

**AC**

- 可从查询页进入列表再进详情
- baseURL 配置能切换（真机用局域网 IP）

**UT（建议）**

- 请求封装：baseURL 与 query 参数序列化测试（纯函数/封装层单测）

---

### T9.2 查询页（日历+筛选）（Owner：A）

**内容**

- 日历选择（react-native-calendars）：入住/离店、间夜计算
- 城市选择（Picker/Modal）
- 标签多选，点击查询跳列表

**AC**

- 离店必须 > 入住（本地校验）
- 条件带到列表页并生效

**UT（建议）**

- 间夜计算函数单测（边界：同日/跨月/跨年）

---

### T9.3 列表页（分页上滑自动加载）（Owner：A）

**内容**

- FlatList + `onEndReached`：page++ 拉下一页
- 筛选/排序按钮（简单即可）
- 空态/错误态

**AC**

- 连续滚动可加载多页，不重复请求
- 无更多时停止加载

**UT（建议）**

- 分页状态机函数：hasMore=false 不再发请求（单测）

---

### T9.4 详情页（轮播+房型按价升序）（Owner：A）

**内容**

- 图片轮播（Swiper）
- 房型列表展示（直接使用后端已排序结果）
- 图片失败占位

**AC**

- 房型显示价格升序
- 图片加载失败有占位

**UT（建议）**

- 房型渲染组件：传入数据 -> 渲染正确（RN Testing Library）

---

## 10. 联调与质量保障（持续进行）

### T10.1 后端 e2e（Owner：A）

**内容**

- supertest 启动 Nest app
- 主链路：注册 -> 登录 -> 创建酒店 -> 提交 -> 审核通过 -> 上线 -> app 列表可见

**AC**

- `npm run test:e2e` 全绿
- e2e 失败能给出清晰错误

**e2e 说明**

- e2e 用独立测试库（docker pg + TEST_DATABASE_URL）
- 测试前清库/事务回滚策略（任选其一）

---

### T10.2 接口契约与共享类型（Owner：B）

**内容**

- `packages/shared` 放置 TypeScript 类型（HotelDTO/RoomDTO/Response `<T>`）
- 前后端对齐字段命名（camelCase）
- Mock JSON（便于前端无后端时开发）

**AC**

- 类型在 RN/Web 均可复用
- 字段名一致，不需要前端到处适配

**UT（建议）**

- 可选：zod schema 做契约校验

---

## 11. 最终交付清单（验收前 1 天）

- ✅ 后端服务可启动（README 说明）
- ✅ 数据库迁移与 seed 可用
- ✅ 用户端 3 页可演示：查询 → 列表（上滑加载）→ 详情（房型升序）
- ✅ 管理端 3 页可演示：登录注册 → 商户录入提交 → 管理员审核上下线
- ✅ 单元测试覆盖核心 Service（Auth/Hotel/Room/Review）
- ✅ e2e 跑通主链路（建议）
- ✅ API 文档 Word（已生成）与数据库设计 Word（已生成）

---

## 12. 里程碑建议（可按你们节奏调整）

- **M1（第 2 天）**：Auth + Prisma 迁移 + 基础框架完成
- **M2（第 3 天）**：/app 四个只读接口完成并有 UT
- **M3（第 5 天）**：商户提交审核 + 管理员审核上线链路完成并有 UT
- **M4（第 7 天）**：RN/Web 页面联调完成 + e2e 跑通主链路
