# 易宿酒店预订平台 API 文档

最后更新：2026-02-25

## 1. 通用约定

### 1.1 Base URL

本项目存在两组路由前缀：

- 管理端/商户端/鉴权/通用：`https://<domain>/api`
- 用户端 App 公共接口：`https://<domain>/app`

### 1.2 鉴权方式

- 使用 JWT Bearer Token
- 请求头：`Authorization: Bearer <token>`
- 角色：`ADMIN`、`MERCHANT`

### 1.3 统一响应结构

成功响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

失败响应：

```json
{
  "code": 40400,
  "message": "资源不存在",
  "data": null
}
```

说明：

- 统一响应由全局拦截器封装。
- `BigInt` 字段会被转换为字符串。

### 1.4 常见错误码

| HTTP | code | 说明 |
| :--- | :--- | :--- |
| 400 | 40000 | 参数错误 |
| 401 | 40100 | 未登录或登录失效 |
| 403 | 40300 | 无权限 |
| 404 | 40400 | 资源不存在 |
| 409 | 40900 | 状态冲突 |
| 500 | 50000 | 服务端错误 |

---

## 2. 接口总览

### 2.1 系统与鉴权

| 方法 | Path | 鉴权 | 说明 |
| :--- | :--- | :--- | :--- |
| GET | /api/hello | 否 | 连通性测试 |
| POST | /api/auth/register | 否 | 注册 |
| POST | /api/auth/login | 否 | 登录 |
| GET | /api/auth/me | 是 | 当前用户信息 |

### 2.2 商户端

| 方法 | Path | 鉴权 | 角色 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| POST | /api/merchant/profile | 是 | 登录用户 | 完善/更新商户资料 |
| GET | /api/common/tags | 是 | 登录用户 | 获取标签字典 |
| POST | /api/common/upload | 是 | 登录用户 | 通用文件上传 |
| GET | /api/merchant/hotels | 是 | MERCHANT | 获取我的酒店列表 |
| POST | /api/merchant/hotels | 是 | MERCHANT | 创建酒店草稿 |
| GET | /api/merchant/hotels/:id | 是 | MERCHANT | 酒店详情（编辑回显） |
| PUT | /api/merchant/hotels/:id | 是 | MERCHANT | 更新酒店 |
| POST | /api/merchant/hotels/:id/images | 是 | MERCHANT | 批量保存酒店图片 |
| POST | /api/merchant/hotels/:id/submit | 是 | MERCHANT | 提交酒店审核 |
| GET | /api/merchant/hotels/:hotelId/rooms | 是 | MERCHANT | 获取酒店房型列表 |
| GET | /api/merchant/rooms/:id | 是 | MERCHANT | 获取房型详情 |
| POST | /api/merchant/rooms | 是 | MERCHANT | 创建房型 |
| PUT | /api/merchant/rooms/:id | 是 | MERCHANT | 更新房型 |
| PATCH | /api/merchant/rooms/:id/status | 是 | MERCHANT | 修改房型状态 |

### 2.3 管理端

| 方法 | Path | 鉴权 | 角色 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| GET | /api/admin/hotels/audit | 是 | ADMIN | 审核列表 |
| GET | /api/admin/hotels/:id/audit-detail | 是 | ADMIN | 审核详情 |
| POST | /api/admin/hotels/:id/audit | 是 | ADMIN | 提交审核结果 |
| GET | /api/admin/hotels/publish | 是 | ADMIN | 发布列表 |
| GET | /api/admin/hotels/publish/:id | 是 | ADMIN | 发布详情 |
| PATCH | /api/admin/hotels/:id/publish | 是 | ADMIN | 切换上下线 |
| GET | /api/admin/banners/candidate-hotels | 是 | ADMIN | Banner 候选酒店 |
| GET | /api/admin/banners | 是 | ADMIN | Banner 列表 |
| POST | /api/admin/banners | 是 | ADMIN | 创建 Banner |
| PUT | /api/admin/banners/:id | 是 | ADMIN | 更新 Banner |
| DELETE | /api/admin/banners/:id | 是 | ADMIN | 删除 Banner |
| POST | /api/admin/tags | 是 | ADMIN | 创建标签 |
| DELETE | /api/admin/tags/:id | 是 | ADMIN | 删除标签 |

### 2.4 用户端 App（免登录）

| 方法 | Path | 说明 |
| :--- | :--- | :--- |
| GET | /app/banners | 首页 Banner |
| GET | /app/tags | 标签列表 |
| GET | /app/cities | 热门城市列表 |
| GET | /app/location/reverse | 逆地理解析 |
| GET | /app/hotels | 酒店列表 |
| GET | /app/hotels/:id | 酒店详情 |
| GET | /app/hotels/:id/rooms | 房型列表 |
| GET | /app/hotels/:id/price-calendar | 价格日历 |

---

## 3. 详细接口

## 3.1 系统接口

### 3.1.1 GET /api/hello

说明：服务可用性测试。

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "message": "Hello World!"
  }
}
```

---

## 3.2 鉴权接口

### 3.2.1 POST /api/auth/register

请求体：

| 字段 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| username | string | 是 | 用户名（唯一） |
| password | string | 是 | 密码 |
| role | string | 是 | `ADMIN` 或 `MERCHANT` |

请求示例：

```json
{
  "username": "merchant_001",
  "password": "MySecretPassword!123",
  "role": "MERCHANT"
}
```

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "uuid",
    "username": "merchant_001",
    "role": "MERCHANT"
  }
}
```

### 3.2.2 POST /api/auth/login

请求体：

| 字段 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "token": "eyJhbGciOiJI...",
    "user": {
      "id": "uuid",
      "username": "merchant_001",
      "role": "MERCHANT"
    }
  }
}
```

### 3.2.3 GET /api/auth/me

鉴权：需要 `Authorization`。

响应示例（MERCHANT）：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "uuid",
    "username": "merchant_001",
    "role": "MERCHANT",
    "merchantProfile": {
      "merchantName": "易宿商旅",
      "contactName": "张三",
      "contactPhone": "13800138000"
    },
    "hotels": [
      {
        "id": "hotel-uuid",
        "nameCn": "易宿精选酒店",
        "nameEn": "EasyStay",
        "city": "上海",
        "address": "示例路 1 号",
        "auditStatus": "APPROVED",
        "publishStatus": "ONLINE"
      }
    ]
  }
}
```

---

## 3.3 商户资料与通用接口

### 3.3.1 POST /api/merchant/profile

说明：商户资料 upsert（有则更新，无则创建）。

请求体：

| 字段 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| merchantName | string | 是 | 商户名称 |
| contactName | string | 否 | 联系人 |
| contactPhone | string | 否 | 联系电话 |

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": null
}
```

### 3.3.2 GET /api/common/tags

说明：获取系统标签字典（需登录）。

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      { "id": "24", "name": "亲子" },
      { "id": "25", "name": "免费停车" }
    ],
    "total": 2
  }
}
```

### 3.3.3 POST /api/common/upload

说明：上传图片到 Vercel Blob。

请求：`multipart/form-data`

| 字段 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| file | binary | 是 | 图片文件 |

约束：

- 仅支持：`image/jpeg`、`image/png`、`image/webp`
- 大小限制：2MB

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "url": "https://...public.blob.vercel-storage.com/...",
    "filename": "1700000000-abc-file.jpg",
    "size": 245678
  }
}
```

---

## 3.4 商户酒店接口

### 3.4.1 GET /api/merchant/hotels

查询参数：

| 字段 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| page | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 10 | 每页条数 |
| name | string | 否 | - | 酒店中文名模糊搜索 |
| auditStatus | string | 否 | - | 审核状态筛选 |

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": "hotel-uuid",
        "nameCn": "易宿酒店(上海店)",
        "nameEn": "EasyStay Shanghai",
        "city": "上海",
        "address": "示例路 100 号",
        "star": 4,
        "auditStatus": "REJECTED",
        "publishStatus": "OFFLINE",
        "rejectReason": "图片不合规",
        "createdAt": "2026-02-20T10:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10,
    "hasMore": false
  }
}
```

### 3.4.2 POST /api/merchant/hotels

请求体（DTO）：

| 字段 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| nameCn | string | 是 | 酒店中文名 |
| nameEn | string | 否 | 酒店英文名 |
| description | string | 否 | 简介 |
| address | string | 否 | 地址 |
| lat | number | 否 | 纬度 |
| lng | number | 否 | 经度 |
| tagIds | number[] | 否 | 标签 ID 数组（当前创建流程中预留） |

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "hotel-uuid",
    "nameCn": "易宿酒店",
    "nameEn": "(待补充)",
    "description": "",
    "auditStatus": "DRAFT",
    "publishStatus": "OFFLINE",
    "createdAt": "2026-02-25T08:00:00.000Z"
  }
}
```

### 3.4.3 GET /api/merchant/hotels/:id

说明：获取酒店编辑详情。

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "hotel-uuid",
    "nameCn": "易宿酒店",
    "nameEn": "EasyStay",
    "city": "上海",
    "address": "示例路 100 号",
    "lat": 31.23,
    "lng": 121.47,
    "star": 4,
    "openedAt": "2021-05-01",
    "description": "...",
    "coverImage": null,
    "minPrice": 399,
    "facilities": {
      "wifi": true,
      "parking": true
    },
    "auditStatus": "DRAFT",
    "publishStatus": "OFFLINE",
    "rejectReason": null,
    "approvedBy": null,
    "approvedAt": null,
    "createdAt": "2026-02-20T10:00:00.000Z",
    "updatedAt": "2026-02-20T10:00:00.000Z",
    "images": [
      { "id": "101", "url": "https://...", "sortOrder": 0 }
    ],
    "tagIds": ["24", "25"]
  }
}
```

### 3.4.4 PUT /api/merchant/hotels/:id

请求体（全为可选字段）：

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| nameCn | string | 酒店中文名 |
| nameEn | string | 酒店英文名 |
| description | string | 简介 |
| city | string | 城市 |
| address | string | 地址 |
| star | number | 星级 |
| openedAt | string | 开业日期（YYYY-MM-DD） |
| lat | number | 纬度 |
| lng | number | 经度 |
| facilities | object | 设施 JSON |
| tagIds | number[] | 标签 ID 列表 |

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "hotel-uuid",
    "nameCn": "易宿酒店(已更新)",
    "nameEn": "EasyStay",
    "city": "上海",
    "address": "示例路 100 号",
    "star": 4,
    "lat": 31.23,
    "lng": 121.47,
    "description": "...",
    "facilities": { "wifi": true },
    "auditStatus": "DRAFT",
    "publishStatus": "OFFLINE",
    "updatedAt": "2026-02-25T08:10:00.000Z"
  }
}
```

### 3.4.5 POST /api/merchant/hotels/:id/images

请求体：

```json
{
  "images": [
    { "url": "https://.../1.jpg", "sortOrder": 0 },
    { "url": "https://.../2.jpg", "sortOrder": 1 }
  ]
}
```

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "hotelId": "hotel-uuid",
    "imageCount": 2
  }
}
```

### 3.4.6 POST /api/merchant/hotels/:id/submit

说明：将酒店状态置为 `PENDING`。

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "hotel-uuid",
    "nameCn": "易宿酒店",
    "auditStatus": "PENDING",
    "updatedAt": "2026-02-25T08:15:00.000Z"
  }
}
```

---

## 3.5 商户房型接口

### 3.5.1 GET /api/merchant/hotels/:hotelId/rooms

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": "501",
        "name": "标准大床房",
        "basePrice": 399,
        "maxGuests": 2,
        "breakfast": false,
        "refundable": true,
        "areaM2": 28,
        "status": 1,
        "coverImage": "https://...",
        "createdAt": "2026-02-20T08:00:00.000Z"
      }
    ],
    "total": 1,
    "hotelId": "hotel-uuid"
  }
}
```

### 3.5.2 GET /api/merchant/rooms/:id

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "501",
    "hotelId": "hotel-uuid",
    "hotelName": "易宿酒店",
    "name": "标准大床房",
    "basePrice": 399,
    "maxGuests": 2,
    "breakfast": false,
    "refundable": true,
    "areaM2": 28,
    "status": 1,
    "coverImage": "https://...",
    "createdAt": "2026-02-20T08:00:00.000Z",
    "updatedAt": "2026-02-25T08:20:00.000Z",
    "priceCalendar": [
      { "date": "2026-02-26", "price": 399, "stock": 10 }
    ]
  }
}
```

### 3.5.3 POST /api/merchant/rooms

请求体：

| 字段 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| hotelId | string | 是 | 所属酒店 |
| name | string | 是 | 房型名称 |
| basePrice | number | 是 | 基础价 |
| maxGuests | number | 是 | 最大入住人数 |
| breakfast | boolean | 否 | 含早 |
| refundable | boolean | 否 | 可取消 |
| areaM2 | number | 否 | 面积 |
| status | number | 否 | 1上架/0下架 |
| currency | string | 否 | 币种，默认 CNY |
| coverImage | string | 否 | 封面图 |
| stockMgtType | number | 否 | 预留字段 |
| totalStock | number | 否 | 预留字段 |
| priceCalendar | array | 否 | 价格日历 |

`priceCalendar` 子项：

```json
{ "date": "2026-02-26", "price": 399, "stock": 10 }
```

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "501",
    "name": "标准大床房",
    "basePrice": 399,
    "maxGuests": 2,
    "breakfast": false,
    "refundable": true,
    "areaM2": 28,
    "status": 1,
    "coverImage": "https://...",
    "createdAt": "2026-02-25T08:20:00.000Z"
  }
}
```

### 3.5.4 PUT /api/merchant/rooms/:id

请求体：与创建接口字段一致（`hotelId` 不可改）。

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "501",
    "name": "标准大床房(升级)",
    "basePrice": 429,
    "maxGuests": 2,
    "breakfast": true,
    "refundable": true,
    "areaM2": 30,
    "status": 1,
    "coverImage": "https://...",
    "updatedAt": "2026-02-25T08:30:00.000Z"
  }
}
```

### 3.5.5 PATCH /api/merchant/rooms/:id/status

请求体：

```json
{ "status": 0 }
```

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "501",
    "name": "标准大床房",
    "status": 0,
    "updatedAt": "2026-02-25T08:35:00.000Z"
  }
}
```

---

## 3.6 管理端审核接口

### 3.6.1 GET /api/admin/hotels/audit

查询参数：

| 字段 | 类型 | 默认值 |
| :--- | :--- | :--- |
| page | number | 1 |
| pageSize | number | 10 |

说明：仅返回 `audit_status=PENDING` 酒店。

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": "hotel-uuid",
        "nameCn": "易宿酒店",
        "nameEn": "EasyStay",
        "address": "示例路 1 号",
        "auditStatus": "PENDING",
        "merchant": {
          "id": "merchant-user-id",
          "username": "merchant_001"
        },
        "createdAt": "2026-02-25T08:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10,
    "hasMore": false
  }
}
```

### 3.6.2 GET /api/admin/hotels/:id/audit-detail

说明：获取审核详情（酒店、图片、标签、商户、房型）。

响应示例（字段较多，示意）：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "hotel-uuid",
    "name_cn": "易宿酒店",
    "name_en": "EasyStay",
    "city": "上海",
    "address": "示例路 1 号",
    "audit_status": "PENDING",
    "hotel_images": [
      { "id": "101", "url": "https://...", "sort_order": 0 }
    ],
    "hotel_tags": [
      { "tags": { "id": "24", "name": "亲子" } }
    ],
    "room_types": [
      {
        "id": "501",
        "name": "标准大床房",
        "base_price": 399,
        "max_guests": 2
      }
    ]
  }
}
```

### 3.6.3 POST /api/admin/hotels/:id/audit

请求体：

| 字段 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| status | string | 是 | `APPROVED` / `REJECTED` |
| rejectionReason | string | 否 | 拒绝原因 |

请求示例：

```json
{ "status": "REJECTED", "rejectionReason": "资料不完整" }
```

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "hotel-uuid",
    "nameCn": "易宿酒店",
    "auditStatus": "REJECTED",
    "rejectReason": "资料不完整",
    "updatedAt": "2026-02-25T08:40:00.000Z"
  }
}
```

---

## 3.7 管理端发布接口

### 3.7.1 GET /api/admin/hotels/publish

查询参数：

| 字段 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| status | string | - | `ONLINE` / `OFFLINE` |
| page | number | 1 | 页码 |
| pageSize | number | 10 | 每页条数 |

说明：仅返回 `audit_status=APPROVED` 酒店。

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": "hotel-uuid",
        "nameCn": "易宿酒店",
        "nameEn": "EasyStay",
        "address": "示例路 1 号",
        "publishStatus": "ONLINE",
        "merchant": {
          "id": "merchant-user-id",
          "username": "merchant_001"
        },
        "createdAt": "2026-02-25T08:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10,
    "hasMore": false
  }
}
```

### 3.7.2 GET /api/admin/hotels/publish/:id

响应示例（示意）：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "hotel-uuid",
    "nameCn": "易宿酒店",
    "nameEn": "EasyStay",
    "city": "上海",
    "address": "示例路 1 号",
    "lat": 31.23,
    "lng": 121.47,
    "star": 4,
    "openedAt": "2021-05-01",
    "description": "...",
    "auditStatus": "APPROVED",
    "publishStatus": "ONLINE",
    "merchant": {
      "id": "merchant-user-id",
      "username": "merchant_001"
    },
    "images": [
      { "id": "101", "url": "https://...", "sortOrder": 0 }
    ],
    "tags": [
      { "id": "24", "name": "亲子" }
    ],
    "roomTypes": [
      {
        "id": "501",
        "name": "标准大床房",
        "basePrice": 399,
        "currency": "CNY",
        "maxGuests": 2,
        "breakfast": false,
        "refundable": true,
        "areaM2": 28
      }
    ]
  }
}
```

### 3.7.3 PATCH /api/admin/hotels/:id/publish

请求体：

```json
{ "status": "OFFLINE" }
```

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "hotel-uuid",
    "nameCn": "易宿酒店",
    "publishStatus": "OFFLINE",
    "updatedAt": "2026-02-25T08:45:00.000Z"
  }
}
```

---

## 3.8 管理端运营接口（Banner/Tag）

### 3.8.1 GET /api/admin/banners/candidate-hotels

查询参数：

| 字段 | 类型 | 默认值 |
| :--- | :--- | :--- |
| page | number | 1 |
| pageSize | number | 10 |

说明：返回 `APPROVED + ONLINE` 且未创建 Banner 的酒店。

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": "hotel-uuid",
        "nameCn": "易宿酒店",
        "nameEn": "EasyStay",
        "address": "示例路 1 号",
        "description": "...",
        "hotelImages": [{ "url": "https://..." }]
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10,
    "hasMore": false
  }
}
```

### 3.8.2 GET /api/admin/banners

查询参数：`page`、`pageSize`。

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": "59",
        "hotelId": "hotel-uuid",
        "hotel": {
          "id": "hotel-uuid",
          "nameCn": "易宿酒店",
          "nameEn": "EasyStay"
        },
        "title": "国庆大促",
        "imageUrl": "https://...",
        "isActive": true,
        "displayOrder": 1,
        "createdAt": "2026-02-25T08:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10,
    "hasMore": false
  }
}
```

### 3.8.3 POST /api/admin/banners

请求体：

| 字段 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| hotelId | string | 是 | 酒店 ID |
| title | string | 是 | 标题 |
| imageUrl | string | 否 | 图片 |
| isActive | boolean | 否 | 是否启用，默认 true |
| displayOrder | number | 否 | 排序，默认 0 |

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "60",
    "hotelId": "hotel-uuid",
    "title": "新春活动",
    "imageUrl": "https://...",
    "isActive": true,
    "displayOrder": 0,
    "createdAt": "2026-02-25T09:00:00.000Z"
  }
}
```

### 3.8.4 PUT /api/admin/banners/:id

请求体：

| 字段 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| title | string | 否 | 标题 |
| imageUrl | string | 否 | 图片 |
| isActive | boolean | 否 | 是否启用 |
| displayOrder | number | 否 | 排序 |

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "60",
    "title": "新春活动(更新)",
    "isActive": false,
    "displayOrder": 9,
    "updatedAt": "2026-02-25T09:10:00.000Z"
  }
}
```

### 3.8.5 DELETE /api/admin/banners/:id

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": { "id": "60" }
}
```

### 3.8.6 POST /api/admin/tags

请求体：

```json
{ "name": "电竞主题", "description": "可选" }
```

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "40",
    "name": "电竞主题",
    "createdAt": "2026-02-25T09:15:00.000Z"
  }
}
```

### 3.8.7 DELETE /api/admin/tags/:id

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": { "id": "40" }
}
```

---

## 3.9 用户端 App 公共接口

### 3.9.1 GET /app/banners

查询参数：

| 字段 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| city | string | 否 | 城市筛选 |

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": [
    {
      "id": 59,
      "title": "国庆大促",
      "imageUrl": "https://...",
      "hotelId": "hotel-uuid",
      "sortOrder": 0
    }
  ]
}
```

### 3.9.2 GET /app/tags

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      { "id": "24", "name": "亲子" },
      { "id": "25", "name": "免费停车" }
    ],
    "total": 2
  }
}
```

### 3.9.3 GET /app/cities

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      { "city": "上海", "hotelCount": 53 },
      { "city": "武汉", "hotelCount": 52 }
    ],
    "total": 2
  }
}
```

### 3.9.4 GET /app/location/reverse

查询参数：

| 字段 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| lat | number | 是 | 纬度，-90~90 |
| lng | number | 是 | 经度，-180~180 |

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "city": "上海",
    "district": "浦东新区",
    "nearby": "世纪大道",
    "formattedAddress": "上海市浦东新区世纪大道100号",
    "source": "amap"
  }
}
```

降级返回示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "city": null,
    "district": null,
    "nearby": null,
    "formattedAddress": null,
    "source": "fallback"
  }
}
```

### 3.9.5 GET /app/hotels

查询参数：

| 字段 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| checkIn | string | 否 | 入住日期，YYYY-MM-DD |
| checkOut | string | 否 | 离店日期，YYYY-MM-DD |
| city | string | 否 | 城市 |
| keyword | string | 否 | 关键词（酒店名/地址） |
| star | number | 否 | 星级 1-5 |
| minPrice | number | 否 | 最低价 |
| maxPrice | number | 否 | 最高价 |
| tags | string | 否 | 标签，逗号分隔 |
| facilities | string | 否 | 设施 key，逗号分隔 |
| lat | number | 否 | 用户纬度 |
| lng | number | 否 | 用户经度 |
| adults | number | 否 | 成人数 1-9 |
| children | number | 否 | 儿童数 0-9 |
| sort | string | 否 | `default` / `rating_desc` / `price_asc` / `price_desc` / `star_desc` / `distance_asc` |
| page | number | 否 | 页码，>=1 |
| pageSize | number | 否 | 每页条数，>=1 |

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": "hotel-uuid",
        "nameCn": "易宿轻奢酒店",
        "nameEn": "EasyStay Premium",
        "star": 4,
        "city": "上海",
        "address": "示例路 100 号",
        "lat": 31.23,
        "lng": 121.47,
        "coverImage": "https://...",
        "minPrice": 594,
        "description": "...",
        "tags": ["免费停车", "度假休闲"],
        "distanceMeters": 1200
      }
    ],
    "total": 127,
    "page": 1,
    "pageSize": 10,
    "hasMore": true
  }
}
```

### 3.9.6 GET /app/hotels/:id

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "hotel-uuid",
    "nameCn": "易宿轻奢酒店",
    "nameEn": "EasyStay Premium",
    "star": 4,
    "city": "上海",
    "address": "示例路 100 号",
    "lat": 31.23,
    "lng": 121.47,
    "openedAt": "2021-05-01T00:00:00.000Z",
    "facilities": { "wifi": true, "parking": true },
    "tags": ["免费停车", "度假休闲"],
    "images": [
      { "id": 1, "url": "https://...", "sortOrder": 0 }
    ],
    "minPrice": 594,
    "coverImage": "https://...",
    "description": "...",
    "contactPhone": "13800138000"
  }
}
```

### 3.9.7 GET /app/hotels/:id/rooms

查询参数：

| 字段 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| checkIn | string | 否 | 入住日期 |
| checkOut | string | 否 | 离店日期 |
| adults | number | 否 | 成人数 |
| children | number | 否 | 儿童数 |

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": [
    {
      "id": 501,
      "name": "标准大床房",
      "basePrice": 399,
      "currency": "CNY",
      "maxGuests": 2,
      "breakfast": false,
      "refundable": true,
      "areaM2": 28,
      "coverImage": "https://...",
      "stock": 10,
      "totalPrice": 798
    }
  ]
}
```

### 3.9.8 GET /app/hotels/:id/price-calendar

查询参数：

| 字段 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| startDate | string | 否 | 今天 | 起始日期 |
| days | number | 否 | 180 | 天数，7~365 |

响应示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "startDate": "2026-02-25",
    "endDate": "2026-08-23",
    "list": [
      {
        "date": "2026-02-25",
        "minPrice": 399,
        "hasStock": true,
        "low": true
      },
      {
        "date": "2026-02-26",
        "minPrice": null,
        "hasStock": false,
        "low": false
      }
    ]
  }
}
```

---

## 4. 备注

1. 管理端和商户端接口依赖角色守卫，未带 token 或角色不匹配会返回 401/403。  
2. `APPROVED` 之前的酒店不会出现在 App 公共接口。  
3. Banner、Tag 等 `BigInt` 主键在响应中会序列化为字符串。  
4. 上传接口依赖 `BLOB_READ_WRITE_TOKEN`，未配置时会返回错误。  
5. 地理解析依赖 `AMAP_WEB_SERVICE_KEY`；未配置时 `source` 返回 `fallback`。
