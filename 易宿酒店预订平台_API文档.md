# 接口文档

## 1. 通用约定

### 1.1 基础信息

| 项 | 说明 |
| :--- | :--- |
| Base URL | https://&lt;domain&gt;/api （示例，可按实际部署替换） |
| 数据格式 | JSON |
| 时间格式 | ISO 8601（例如 2026-02-02T12:00:00Z） |
| 金额单位 | CNY |

### 1.2 鉴权与权限

| 项 | 说明 |
| :--- | :--- |
| 鉴权方式 | Bearer Token（JWT） |
| Header | Authorization: Bearer &lt;token&gt; |
| 角色 | MERCHANT（商户）、ADMIN（管理员） |
| 权限校验 | 后端按接口与角色校验；用户端只读接口可不登录 |

### 1.3 统一响应结构

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| code | number | 0 表示成功；非 0 表示业务错误 |
| message | string | 提示信息 |
| data | any | 响应数据（成功时） |
| requestId | string | 可选：便于排查问题 |

**响应示例：**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "example": true
  },
  "requestId": "b3f1b0b2-xxxx-xxxx-xxxx-9a0c1b2d3e4f"
}
```

### 1.4 分页约定（列表接口）

| 项 | 说明 |
| :--- | :--- |
| 请求参数 | page（从 1 开始）、pageSize（建议 10-20） |
| 返回结构 | list + total + page + pageSize + hasMore |

**分页响应 data 示例：**

```json
{
  "list": [
    {
      "id": 1,
      "nameCn": "示例酒店",
      "minPrice": 399
    }
  ],
  "total": 128,
  "page": 1,
  "pageSize": 10,
  "hasMore": true
}
```

### 1.5 酒店状态字段约定

| 字段 | 可选值 | 说明 |
| :--- | :--- | :--- |
| auditStatus | DRAFT / PENDING / APPROVED / REJECTED | 草稿 / 审核中 / 已通过 / 未通过 |
| publishStatus | ONLINE / OFFLINE | 上线 / 下线（下线可恢复，不做删除） |

### 1.6 常见错误码（建议）

| HTTP | code | 含义 |
| :--- | :--- | :--- |
| 400 | 40000 | 参数错误 |
| 401 | 40100 | 未登录或 token 失效 |
| 403 | 40300 | 无权限（角色不匹配） |
| 404 | 40400 | 资源不存在 |
| 409 | 40900 | 状态冲突（例如审核中不允许编辑） |
| 500 | 50000 | 服务端错误 |

---

## 2. 接口总览

| 模块 | 接口 | 方法 | Path | 鉴权 | 角色 | 说明 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Auth & User | 注册 | POST | /api/auth/register | 否 | - | 注册账号（注册时选择角色） |
| Auth & User | 登录 | POST | /api/auth/login | 否 | - | 凭账号密码获取访问 Token |
| Auth & User | 获取当前用户信息 | GET | /api/auth/me | 是 | ALL | 根据 Token 获取当前登录用户信息 |
| Auth & User | 完善/修改商户资料 | POST | /api/merchant/profile | 是 | MERCHANT | 商户完善或更新企业及联系人信息 |
| Common Data | 获取所有标签列表 | GET | /api/common/tags | 是 | ALL | 获取系统预设的所有标签字典 |
| Common Data | 通用文件上传 | POST | /api/common/upload | 是 | ALL | 接收文件流，返回可访问的 URL |
| Merchant Hotel | 获取我的酒店列表 | GET | /api/merchant/hotels | 是 | MERCHANT | 分页获取当前商户名下的酒店列表 |
| Merchant Hotel | 创建酒店 (草稿) | POST | /api/merchant/hotels | 是 | MERCHANT | 创建新酒店记录，初始状态为 DRAFT |
| Merchant Hotel | 获取酒店详情 (编辑回显) | GET | /api/merchant/hotels/{id} | 是 | MERCHANT | 获取指定酒店的完整信息 |
| Merchant Hotel | 更新酒店信息 (保存草稿) | PUT | /api/merchant/hotels/{id} | 是 | MERCHANT | 保存酒店信息，不改变审核状态 |
| Merchant Hotel | 管理酒店图片 (批量保存) | POST | /api/merchant/hotels/{id}/images | 是 | MERCHANT | 保存前端拖拽排序后的完整图片列表 |
| Merchant Hotel | 提交酒店审核 | POST | /api/merchant/hotels/{id}/submit | 是 | MERCHANT | 将酒店状态修改为 PENDING |
| Merchant Room | 获取某酒店房型列表 | GET | /api/merchant/hotels/{hotelId}/rooms | 是 | MERCHANT | 获取指定酒店下的所有房型 |
| Merchant Room | 创建房型 | POST | /api/merchant/rooms | 是 | MERCHANT | 在指定酒店下创建新房型 |
| Merchant Room | 获取房型详情 | GET | /api/merchant/rooms/{id} | 是 | MERCHANT | 获取指定房型的详细信息（编辑回显） |
| Merchant Room | 更新房型 | PUT | /api/merchant/rooms/{id} | 是 | MERCHANT | 更新指定房型信息 |
| Merchant Room | 修改房型售卖状态 | PATCH | /api/merchant/rooms/{id}/status | 是 | MERCHANT | 快速切换房型的上架/下架状态 |
| Admin Audit | 获取酒店审核列表 | GET | /api/admin/hotels/audit | 是 | ADMIN | 分页获取待审核的酒店列表 |
| Admin Audit | 获取酒店审核详情 | GET | /api/admin/hotels/{id}/audit-detail | 是 | ADMIN | 获取用于审核的酒店完整信息 |
| Admin Audit | 提交审核结果 | POST | /api/admin/hotels/{id}/audit | 是 | ADMIN | 管理员提交通过或拒绝的决定 |
| Admin Publish | 获取酒店发布列表 | GET | /api/admin/hotels/publish | 是 | ADMIN | 获取已通过审核的酒店列表 |
| Admin Publish | 获取酒店发布详情 | GET | /api/admin/hotels/publish/{id} | 是 | ADMIN | 获取酒店发布详情（基础信息/图片/标签/房型） |
| Admin Publish | 修改酒店发布状态 | PATCH | /api/admin/hotels/{id}/publish | 是 | ADMIN | 管理员强制切换酒店的上线/下线状态 |
| Admin Operation | 获取 Banner 候选酒店列表 | GET | /api/admin/banners/candidate-hotels | 是 | ADMIN | 获取 APPROVED 且 ONLINE 的酒店列表 |
| Admin Operation | 获取 Banner 列表 | GET | /api/admin/banners | 是 | ADMIN | 获取所有首页 Banner 配置 |
| Admin Operation | 创建 Banner | POST | /api/admin/banners | 是 | ADMIN | 创建新的 Banner |
| Admin Operation | 更新 Banner | PUT | /api/admin/banners/{id} | 是 | ADMIN | 更新 Banner 信息 |
| Admin Operation | 删除 Banner | DELETE | /api/admin/banners/{id} | 是 | ADMIN | 物理删除一条 Banner 记录 |
| Admin Operation | 创建标签 | POST | /api/admin/tags | 是 | ADMIN | 在系统字典中新增一个标签 |
| Admin Operation | 删除标签 | DELETE | /api/admin/tags/{id} | 是 | ADMIN | 删除标签字典项 |
| App Hotel Browse | 首页 Banner | GET | /app/banners | 否 | - | 获取首页 Banner 列表 |
| App Hotel Browse | 酒店列表 | GET | /app/hotels | 否 | - | 按条件筛选酒店（仅返回已审核上线） |
| App Hotel Browse | 酒店详情 | GET | /app/hotels/{id} | 否 | - | 获取酒店详情（基础信息 + 图片 + 设施 + 标签） |
| App Hotel Browse | 房型列表（按价升序） | GET | /app/hotels/{id}/rooms | 否 | - | 获取房型列表（按价格从低到高排序） |

---

## 模块一：认证与用户中心 (Auth & User)


### 1.1 注册

- **方法**: POST
- **Path**: /api/auth/register
- **鉴权**: 不需要
- **说明**: 用户注册新账号。

**请求参数 (Body)**

```json
{
  "username": "merchant_001",  // 必填，唯一用户名
  "password": "MySecretPassword!123", // 必填，密码
  "role": "MERCHANT"           // 必填，角色：MERCHANT 或 ADMIN
}
```

**响应示例**

```json
{
  "code": 0,
  "message": "ok",
  "data": null
}
```

---

### 1.2 登录

- **方法**: POST
- **Path**: /api/auth/login
- **鉴权**: 不需要
- **说明**: 凭账号密码获取访问 Token。

**请求参数 (Body)**

```json
{
  "username": "merchant_001", // 必填
  "password": "MySecretPassword!123" // 必填
}
```

**响应示例**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    // 核心访问令牌
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhOGYz...", 
    // 用户基础信息，供前端存储和跳转判断
    "user": {
        "id": "a8f30d62-1234-5678-abcd-...", 
        "username": "merchant_001",
        "role": "MERCHANT"
    }
  }
}
```

---

### 1.3 获取当前用户信息

- **方法**: GET
- **Path**: /api/auth/me
- **鉴权**: 需要 Token
- **角色**: ALL
- **说明**: 根据 Token 获取当前登录用户的信息。商户角色会额外返回 profile 信息。

**请求参数**: 无

**响应示例 (商户身份)**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "a8f30d62-1234-5678-abcd-...",
    "username": "merchant_001",
    "role": "MERCHANT",
    "createdAt": "2026-01-01T10:00:00Z",
    // 商户扩展信息，若未完善则字段可能不存在或为空
    "merchantProfile": {
        "merchantName": "易宿商旅集团",
        "contactName": "张三",
        "contactPhone": "13800138000"
    },
    "hotels": [
    {
        "id": "d3f49b6a-5368-463c-927a-550006bff93c",
        "nameCn": "易宿精选酒店(北京中心店)",
        "nameEn": "EasyStay Hotel 北京 No.1",
        "city": "北京",
        "address": "北京市示范区街道1号",
        "auditStatus": "APPROVED",
        "publishStatus": "ONLINE"
    }]
  }
}
```

---

### 1.4 完善/修改商户资料

- **方法**: POST
- **Path**: /api/merchant/profile
- **鉴权**: 需要 Token
- **角色**: MERCHANT
- **说明**: 商户完善或更新自己的企业及联系人信息（Upsert 操作）。

**请求参数 (Body)**

```json
{
  "merchantName": "易宿商旅集团", // 必填
  "contactName": "张三",          // 选填
  "contactPhone": "13800138000"   // 选填
}
```

**响应示例**

```json
{
  "code": 0,
  "message": "ok",
  "data": null
}
```

---

## 模块二：公共数据 (Common Data)

### 2.1 获取所有标签列表

- **方法**: GET

- **Path**: /api/common/tags

- **鉴权**: 需要 Token

- **角色**: ALL

- **说明**: 获取系统预设的所有标签字典，供前端（如编辑酒店页）展示复选框选项。


**请求参数**: 无

**响应示例**


```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      { "id": "1", "name": "亲子" },
      { "id": "2", "name": "免费停车" },
      { "id": "3", "name": "商务出行" },
      { "id": "4", "name": "近地铁" }
    ],
    "total": 4
  }
}
```

### 2.2 通用文件上传

- **方法**: POST

- **Path**: /api/common/upload

- **鉴权**: 需要 Token

- **角色**: ALL

- **说明**: 核心文件上传接口。接收 multipart/form-data 格式的文件流，返回可访问的 URL。


**请求参数 (Form-Data)**

| 字段 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| file | File (Binary) | 是 | 图片文件二进制数据 |

**响应示例**


```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "url": "https://your-oss-bucket.com/uploads/2026/02/04/hotel_cover_123.jpg",
    "filename": "hotel_cover_123.jpg",
    "size": 245678
  }
}
```

## 模块三：商户端 - 酒店管理 (Merchant Hotel)

注：本模块所有接口，后端均需校验操作的酒店是否属于当前登录商户。

### 3.1 获取我的酒店列表

- **方法**: GET

- **Path**: /api/merchant/hotels

- **鉴权**: 需要 Token

- **角色**: MERCHANT

- **说明**: 分页获取当前商户名下的酒店列表。支持筛选。


**请求参数 (Query)**

| 字段 | 类型 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| page | int | 否 | 页码 | 1 |
| pageSize | int | 否 | 每页条数 | 10 |
| name | string | 否 | 名称模糊搜索 | 易宿 |
| auditStatus| string | 否 | 审核状态(DRAFT, PENDING, APPROVED, REJECTED) | REJECTED |

**响应示例**


```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "total": 25,
    "page": 1,
    "pageSize": 10,
    "list": [
      {
        "id": "hotel-uuid-sz-001",
        "nameCn": "易宿酒店(深圳南山店)",
        "city": "深圳",
        "star": 5,
        "auditStatus": "REJECTED",
        "publishStatus": "ONLINE",
        // 仅当 auditStatus 为 REJECTED 时返回
        "rejectReason": "外观图片含有明显无关水印，请重新上传。"
      },
      {
        "id": "hotel-uuid-bj-002",
        "nameCn": "易宿酒店(北京国贸店)",
        "city": "北京",
        "star": 4,
        "auditStatus": "APPROVED",
        "publishStatus": "ONLINE",
        "rejectReason": null
      }
      // ... 更多列表项
    ]
  }
}
```

### 3.2 创建酒店 (草稿)

- **方法**: POST

- **Path**: /api/merchant/hotels

- **鉴权**: 需要 Token

- **角色**: MERCHANT

- **说明**: 创建一个仅包含最基础信息的新酒店记录，初始状态为 DRAFT。


**请求参数 (Body)**


```json
{
  "nameCn": "易宿精选酒店(待编辑店)" // 必填
}
```


**响应示例**


```json
{
  "code": 0,
  "message": "ok",
  "data": {
    // 返回新创建的酒店 ID，前端拿到后跳转到编辑页
    "id": "new-hotel-uuid-xxxx-yyyy" 
  }
}
```

### 3.3 获取酒店详情 (编辑回显)

- **方法**: GET

- **Path**: /api/merchant/hotels/{id}

- **鉴权**: 需要 Token

- **角色**: MERCHANT

- **说明**: 获取指定酒店的完整信息，用于编辑页面的数据填充。


**请求参数 (Path): id (酒店 UUID)**


**响应示例**


```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "hotel-uuid-sz-001",
    "nameCn": "易宿酒店(深圳南山店)",
    "nameEn": "EasyStay Hotel (Nanshan Branch)",
    "city": "深圳",
    "address": "南山区粤海街道科技南十二路88号",
    "star": 5,
    "openedAt": "2020-10-01",
    "lat": 22.54286,
    "lng": 113.95918,
    "description": "<p>这是一家位于科技园核心地带的高端商务酒店...</p>",
    // 设施对象 (JSONB)
    "facilities": {
        "wifi": true,
        "parking": true,
        "gym": true,
        "pool": false,
        "restaurant": true,
        "meetingRoom": true
    },
    // 已关联的标签 ID 数组
    "tagIds": [2, 3, 4],
    // 图片列表，按 sortOrder 排序
    "images": [
      { "url": "https://oss.../cover.jpg", "sortOrder": 0 },
      { "url": "https://oss.../lobby.jpg", "sortOrder": 1 },
      { "url": "https://oss.../room.jpg",  "sortOrder": 2 }
    ],
    "auditStatus": "REJECTED",
    "publishStatus": "ONLINE",
    "rejectReason": "外观图片含有明显无关水印，请重新上传。"
  }
}
```

### 3.4 更新酒店信息 (保存草稿)

- **方法**: PUT

- **Path**: /api/merchant/hotels/{id}

- **鉴权**: 需要 Token

- **角色**: MERCHANT

- **说明**: 保存酒店的基础信息、描述、设施和标签。此操作不改变审核状态。


**请求参数 (Path)**: id (酒店 UUID)

**请求参数 (Body)** - 这是完整的可能字段列表


```json
{
  "nameCn": "易宿酒店(深圳南山店)-已修改", // 必填
  "nameEn": "EasyStay Hotel Nanshan Edited", // 选填
  "city": "深圳",        // 必填
  "address": "南山区粤海街道...新的地址", // 必填
  "star": 5,            // 必填
  "openedAt": "2020-10-01", // 选填
  "lat": 22.54286,      // 选填
  "lng": 113.95918,     // 选填
  "description": "<p>更新后的富文本描述内容...</p>", // 选填
  // 设施对象，全量提交
  "facilities": { 
      "wifi": true, 
      "parking": true, 
      "gym": false, 
      "pool": false
  },
  // 选中的标签 ID 数组，全量提交（后端会重置关联）
  "tagIds": [1, 2] 
}
```


**响应示例**


```json
{
  "code": 0,
  "message": "ok",
  "data": null
}
```

### 3.5 管理酒店图片 (批量保存)

- **方法**: POST

- **Path**: /api/merchant/hotels/{id}/images

- **鉴权**: 需要 Token

- **角色**: MERCHANT

- **说明**: 保存前端拖拽排序后的完整图片列表。


**请求参数 (Path)**: id (酒店 UUID)

**请求参数 (Body)**


```json
{
  "images": [
    { 
      "url": "https://oss.../new_cover.jpg", 
      "sortOrder": 0  // 排在第一个的默认为封面
    },
    { 
      "url": "https://oss.../lobby_v2.jpg", 
      "sortOrder": 1 
    },
    { 
      "url": "https://oss.../room_detail.jpg", 
      "sortOrder": 2 
    }
  ]
}
```


**响应示例**


```json
{ "code": 0, "message": "ok", "data": null }
```

### 3.6 提交酒店审核

- **方法**: POST

- **Path**: /api/merchant/hotels/{id}/submit

- **鉴权**: 需要 Token

- **角色**: MERCHANT

- **说明**: 将酒店状态从 DRAFT/REJECTED 修改为 PENDING，提交给管理员。


**请求参数 (Path)**: id (酒店 UUID)

**请求参数 (Body)**: 无

**响应示例**


```json
{ "code": 0, "message": "ok", "data": null }
```

## 模块四：商户端 - 房型管理 (Merchant Room)

注：后端需校验房型所属酒店的权限。

### 4.1 获取某酒店房型列表

- **方法**: GET

- **Path**: /api/merchant/hotels/{hotelId}/rooms

- **鉴权**: 需要 Token

- **角色**: MERCHANT

- **说明**: 获取指定酒店下的所有房型。


**请求参数 (Path): hotelId (酒店 UUID)**


**响应示例**


```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": "room-uuid-101",
        "name": "标准大床房",
        "coverImage": "https://oss.../room_std_cover.jpg", 
        "basePrice": 380,
        "currency": "CNY",
        "maxGuests": 2,
        "breakfast": false,
        "refundable": true,
        "areaM2": 28,
        "status": 1
      },
      {
        "id": "room-uuid-102",
        "name": "豪华双床房",
        "coverImage": null,
        "basePrice": 580,
        "currency": "CNY",
        "maxGuests": 3,
        "breakfast": true,
        "refundable": true,
        "areaM2": 35,
        "status": 0
      }
    ],
    "total": 2,
    "hotelId": "hotel-uuid-sz-001"
  }
}
```

### 4.2 创建房型

- **方法**: POST

- **Path**: /api/merchant/rooms

- **鉴权**: 需要 Token

- **角色**: MERCHANT

- **说明**: 在指定酒店下创建新房型。


**请求参数 (Body)**


```json
{
  "hotelId": "hotel-uuid-sz-001", // 必填，所属酒店
  "name": "商务套房",              // 必填
  "coverImage": "https://oss.../suite_cover.jpg", // 选填，封面图URL
  "basePrice": 880,   // 必填，基础价格
  "maxGuests": 2,     // 必填
  "breakfast": true,  // 必填
  "refundable": false, // 必填
  "areaM2": 45,       // 选填，面积
  "status": 1,        // 必填，初始状态(1上架/0下架)
  "stockMgtType": 1,  // 必填，库存模式(0不管理/1标准)
  "totalStock": 10,   // 选填，当 stockMgtType=1 时必填
  "priceCalendar": [  // 选填，价格日历
    {
      "date": "2026-02-25",  // 日期 (YYYY-MM-DD)
      "price": 980,          // 该日期的价格
      "stock": 10            // 该日期的库存(默认10)
    }
  ]
}
```


**响应示例**


```json
{ "code": 0, "message": "ok", "data": null }
```

### 4.3 获取房型详情

- **方法**: GET

- **Path**: /api/merchant/rooms/{id}

- **鉴权**: 需要 Token

- **角色**: MERCHANT

- **说明**: 获取指定房型的详细信息，用于编辑页面回显。


**请求参数 (Path)**: id (房型 ID, int)

**响应示例**


```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "room-uuid-101",
    "hotelId": "hotel-uuid-sz-001",
    "hotelName": "易宿酒店(深圳南山店)",
    "name": "标准大床房",
    "basePrice": 380,
    "currency": "CNY",
    "maxGuests": 2,
    "breakfast": false,
    "refundable": true,
    "areaM2": 30,
    "status": 1,
    "coverImage": "https://oss.../room_std_cover.jpg",
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-02-01T14:30:00Z",
    "priceCalendar": [
      {
        "date": "2026-02-25",
        "price": 380,
        "stock": 10
      },
      {
        "date": "2026-02-26",
        "price": 420,
        "stock": 8
      }
    ]
  }
}
```

### 4.4 更新房型

- **方法**: PUT

- **Path**: /api/merchant/rooms/{id}

- **鉴权**: 需要 Token

- **角色**: MERCHANT

- **说明**: 更新指定房型信息。


**请求参数 (Path)**: id (房型 ID, int)

**请求参数 (Body)** - 不包含 hotelId

```json
{
  "name": "商务套房(含早升级版)",
  "coverImage": "https://oss.../suite_cover_v2.jpg",
  "basePrice": 980,
  "maxGuests": 2,
  "breakfast": true,
  "refundable": true,
  "areaM2": 45,
  "status": 1,
  "stockMgtType": 1,
  "totalStock": 10,
  "priceCalendar": [  // 选填，价格日历(更新会替换原有的所有日期记录)
    {
      "date": "2026-02-25",
      "price": 980,
      "stock": 12
    },
    {
      "date": "2026-02-26",
      "price": 1080,
      "stock": 10
    }
  ]
}
```


**响应示例**


```json
{ "code": 0, "message": "ok", "data": null }
```

### 4.5 修改房型售卖状态 (快速上下架)

- **方法**: PATCH

- **Path**: /api/merchant/rooms/{id}/status

- **鉴权**: 需要 Token

- **角色**: MERCHANT

- **说明**: 列表页快速切换房型的上架/下架状态。


**请求参数 (Path)**: id (房型 ID)

**请求参数 (Body)**


```json
{
  "status": 0 // 目标状态：1(上架) 或 0(下架)
}
```


**响应示例**


```json
{ "code": 0, "message": "ok", "data": null }
```

## 模块五：管理员端 - 酒店审核 (Admin Audit)

### 5.1 获取酒店审核列表

- **方法**: GET

- **Path**: /api/admin/hotels/audit

- **鉴权**: 需要 Token

- **角色**: ADMIN

- **说明**: 分页获取待审核的酒店列表。


**请求参数 (Query)**

| 字段 | 类型 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| page | int | 否 | 页码 | 1 |
| pageSize | int | 否 | 每页条数 | 10 |


**响应示例**


```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "total": 5,
    "page": 1,
    "pageSize": 10,
    "list": [
      {
        "id": "hotel-uuid-sz-001",
        "nameCn": "易宿酒店(深圳南山店)",
        "city": "深圳",
        "auditStatus": "PENDING",
        // 提交审核的时间
        "updatedAt": "2026-02-04T10:30:00Z",
        // 关联商户信息
        "merchant": {
            "id": "user-id-merchant-A",
            "username": "merchant_001"
        }
      }
      // ...
    ]
  }
}
```

### 5.2 获取酒店审核详情 (只读)

- **方法**: GET

- **Path**: /api/admin/hotels/{id}/audit-detail

- **鉴权**: 需要 Token

- **角色**: ADMIN

- **说明**: 获取用于审核的酒店完整信息。结构与 3.3 获取酒店详情 基本一致，但为只读视图。


**请求参数 (Path)**: id (酒店 UUID)

**响应示例**: (参见 API 3.3 的响应结构)

---

### 5.3 提交审核结果

- **方法**: POST

- **Path**: /api/admin/hotels/{id}/audit

- **鉴权**: 需要 Token

- **角色**: ADMIN

- **说明**: 管理员提交通过或拒绝的决定。


**请求参数 (Path)**: id (酒店 UUID)

**请求参数 (Body)**


```json
{
  "status": "REJECTED", // 必填，APPROVED(通过) 或 REJECTED(拒绝)
  "rejectionReason": "酒店外观图片含有无关水印，且描述中包含违规营销词汇，请修改后重新提交。" // 当 status 为 REJECTED 时必填
}
```


**响应示例**


```json
{ "code": 0, "message": "ok", "data": null }
```

## 模块六：管理员端 - 上下线管理 (Admin Publish)

### 6.1 获取酒店发布列表

- **方法**: GET

- **Path**: /api/admin/hotels/publish

- **鉴权**: 需要 Token

- **角色**: ADMIN

- **说明**: 获取已通过审核的酒店列表，管理其在线状态。


**请求参数 (Query)**

| 字段 | 类型 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| page | int | 否 | 页码 | 1 |
| pageSize | int | 否 | 每页条数 | 10 |
| status | string | 否 | 状态(ONLINE/OFFLINE) | ONLINE |


**响应示例**


```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "total": 80,
    "page": 1,
    "list": [
      {
        "id": "hotel-uuid-bj-002",
        "nameCn": "易宿酒店(北京国贸店)",
        "city": "北京",
        "auditStatus": "APPROVED",
        "publishStatus": "ONLINE"
      }
      // ...
    ]
  }
}
```

### 6.2 修改酒店发布状态 (强制上下架)

- **方法**: PATCH

- **Path**: /api/admin/hotels/{id}/publish

- **鉴权**: 需要 Token

- **角色**: ADMIN

- **说明**: 管理员强制切换酒店的上线/下线状态。


**请求参数 (Path)**: id (酒店 UUID)

**请求参数 (Body)**


```json
{
  "status": "OFFLINE" // 必填，ONLINE 或 OFFLINE
}
```


**响应示例**


```json
{ "code": 0, "message": "ok", "data": null }
```

### 6.3 获取酒店发布详情

- **方法**: GET

- **Path**: /api/admin/hotels/publish/{id}

- **鉴权**: 需要 Token

- **角色**: ADMIN

- **说明**: 获取酒店发布详情（基础信息 + 图片 + 标签 + 房型）。


**请求参数 (Path)**: id (酒店 UUID)

**响应示例**


```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "hotel-uuid-bj-002",
    "nameCn": "易宿酒店(北京国贸店)",
    "nameEn": "EasyStay Hotel Beijing",
    "city": "北京",
    "address": "北京市朝阳区建国路88号",
    "star": 5,
    "openedAt": "2020-10-01",
    "auditStatus": "APPROVED",
    "publishStatus": "ONLINE",
    "merchant": {
      "id": "merchant-id-001",
      "username": "merchant_001"
    },
    "images": [
      { "id": 11, "url": "https://oss.../cover.jpg", "sortOrder": 0 },
      { "id": 12, "url": "https://oss.../lobby.jpg", "sortOrder": 1 }
    ],
    "tags": [
      { "id": 2, "name": "亲子" },
      { "id": 3, "name": "免费停车" }
    ],
    "roomTypes": [
      {
        "id": 101,
        "name": "标准大床房",
        "basePrice": 380,
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

## 模块七：管理员端 - 运营管理 (Admin Operation)

### 7.0 获取 Banner 候选酒店列表 (新增)

- **方法**: GET

- **Path**: /api/admin/banners/candidate-hotels

- **鉴权**: 需要 Token

- **角色**: ADMIN

- **说明**: 获取状态为 APPROVED 且 ONLINE 的酒店列表，供创建 Banner 时选择。


**请求参数 (Query)**

| 字段 | 类型 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| 字段 | 类型 | 说明 | 示例 | :--- |
| :--- | :--- | :--- | name | string |


**响应示例**


```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": "hotel-uuid-sanya-001",
        "nameCn": "易宿三亚亚龙湾度假酒店",
        "nameEn": "EasyStay Yalong Bay Resort",
        "city": "三亚",
        "address": "亚龙湾路888号",
        "description": "海滨度假酒店",
        "hotelImages": [
          { "url": "https://oss.../sanya_cover.jpg", "sortOrder": 0 }
        ]
      },
      {
        "id": "hotel-uuid-sz-005",
        "nameCn": "易宿深圳湾科技酒店",
        "nameEn": "EasyStay Shenzhen Bay Hotel",
        "city": "深圳",
        "address": "后海大道123号",
        "description": "科技商务酒店",
        "hotelImages": [
          { "url": "https://oss.../sz_cover.jpg", "sortOrder": 0 }
        ]
      }
    ],
    "total": 2,
    "page": 1,
    "pageSize": 10,
    "hasMore": false
  }
}
```

### 7.1 获取 Banner 列表

- **方法**: GET

- **Path**: /api/admin/banners

- **鉴权**: 需要 Token

- **角色**: ADMIN

- **说明**: 获取所有首页 Banner 配置，按 sortOrder 升序。


**请求参数: 无 响应示例**


```json
{
  "code": 0,
  "message": "ok",
  "data": [
    {
      "id": "banner-uuid-1",
      "title": "夏日海边特惠",
      "imageUrl": "https://oss.../banner_summer.jpg",
      "displayOrder": 1,
      "isActive": true,
      // 关联的酒店简要信息
      "hotel": {
          "id": "hotel-uuid-sanya-001",
          "nameCn": "易宿三亚亚龙湾度假酒店",
          "nameEn": "EasyStay Yalong Bay Resort"
      }
    },
    {
      "id": "banner-uuid-2",
      "title": "商务出行首选",
      "imageUrl": "https://oss.../banner_business.jpg",
      "displayOrder": 2,
      "isActive": false, // 已禁用
      "hotel": {
          "id": "hotel-uuid-bj-002",
          "nameCn": "易宿酒店(北京国贸店)",
          "nameEn": "EasyStay Hotel Beijing"
      }
    }
  ]
}
```

### 7.2 创建 Banner

- **方法**: POST

- **Path**: /api/admin/banners

- **鉴权**: 需要 Token

- **角色**: ADMIN

- **说明**: 创建新的 Banner。hotelId 必须选自 API 7.0 返回的列表。


**请求参数 (Body)**


```json
{
  "title": "国庆黄金周大促",        // 选填
  "imageUrl": "https://oss.../banner_national_day.jpg", // 必填
  // 必填，从候选列表中选择的酒店ID
  "hotelId": "hotel-uuid-sz-005", 
  "displayOrder": 10,   // 必填，排序值
  "isActive": true   // 必填，是否启用
}
```


**响应示例**


```json
{ "code": 0, "message": "ok", "data": null }
```

### 7.3 更新 Banner

- **方法**: PUT

- **Path**: /api/admin/banners/{id}

- **鉴权**: 需要 Token

- **角色**: ADMIN

- **说明**: 更新 Banner 信息。


**请求参数 (Path)**: id (Banner ID, int)

**请求参数 (Body)**


```json
{
  "title": "国庆黄金周大促(已结束)",
  "imageUrl": "https://oss.../banner_national_day.jpg",
  "hotelId": "hotel-uuid-sz-005",
  "displayOrder": 99,
  "isActive": false // 修改为禁用
}
```


**响应示例**


```json
{ "code": 0, "message": "ok", "data": null }
```

### 7.4 删除 Banner

- **方法**: DELETE

- **Path**: /api/admin/banners/{id}

- **鉴权**: 需要 Token

- **角色**: ADMIN

- **说明**: 物理删除一条 Banner 记录。


**请求参数 (Path): id (Banner ID) 响应示例**


```json
{ "code": 0, "message": "ok", "data": null }
```

### 7.5 创建标签

- **方法**: POST

- **Path**: /api/admin/tags

- **鉴权**: 需要 Token

- **角色**: ADMIN

- **说明**: 在系统字典中新增一个标签。


**请求参数 (Body)**


```json
{
  "name": "电竞主题" // 必填，唯一
}
```


**响应示例**


```json
{
  "code": 0,
  "message": "ok",
  // 返回新创建的对象，方便前端回显
  "data": {
    "id": "18",
    "name": "电竞主题",
    "createdAt": "2026-02-04T12:00:00Z"
  }
}
```

### 7.6 删除标签

- **方法**: DELETE

- **Path**: /api/admin/tags/{id}

- **鉴权**: 需要 Token

- **角色**: ADMIN

- **说明**: 删除标签字典项。后端需校验是否仍有酒店在使用该标签。


**请求参数 (Path)**: id (标签 ID, int)

**响应示例**


```json
{ "code": 0, "message": "ok", "data": null }
```

---

## 模块八：用户端 - 酒店浏览 (App Hotel Browse)

### 8.1 首页 Banner

- **方法**: GET

- **Path**: /app/banners

- **鉴权**: 不需要

- **角色**: -

- **说明**: 获取首页 Banner 列表；点击 Banner 跳转对应酒店详情。


**请求参数 (Query)**

| 字段 | 类型 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| city | string | 否 | 城市（可选：用于按城市投放） | 广州 |

**响应示例**


```json
{
  "code": 0,
  "message": "ok",
  "data": [
    {
      "id": "banner-uuid-1",
      "title": "海景特惠",
      "imageUrl": "https://.../b1.png",
      "hotelId": "hotel-uuid-1001",
      "displayOrder": 10
    }
  ]
}
```

---

### 8.2 酒店列表

- **方法**: GET

- **Path**: /app/hotels

- **鉴权**: 不需要

- **角色**: -

- **说明**: 按条件筛选酒店（仅返回 auditStatus=APPROVED 且 publishStatus=ONLINE）。

- **备注**: 列表页需支持"上滑自动加载"：前端根据 hasMore 与 page/pageSize 发起下一页请求。


**请求参数 (Query)**

| 字段 | 类型 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| city | string | 否 | 城市 | 广州 |
| keyword | string | 否 | 关键词（酒店名/地标） | 天河 |
| checkIn | string | 否 | 入住日期（YYYY-MM-DD） | 2026-02-10 |
| checkOut | string | 否 | 离店日期（YYYY-MM-DD） | 2026-02-11 |
| star | number | 否 | 星级（1-5） | 5 |
| minPrice | number | 否 | 最低价（含） | 300 |
| maxPrice | number | 否 | 最高价（含） | 800 |
| tags | string | 否 | 标签（逗号分隔） | 亲子,免费停车 |
| sort | string | 否 | 排序：price_asc / default | price_asc |
| page | number | 否 | 页码（默认 1） | 1 |
| pageSize | number | 否 | 每页条数（默认 10） | 10 |

**响应示例**


```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": "hotel-uuid-1001",
        "nameCn": "易宿海景酒店",
        "star": 5,
        "city": "广州",
        "address": "天河区xx路",
        "coverImage": "https://.../c.png",
        "minPrice": 399,
        "tags": [
          "亲子",
          "免费停车"
        ]
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10,
    "hasMore": false
  }
}
```

---

### 8.3 酒店详情

- **方法**: GET

- **Path**: /app/hotels/{id}

- **鉴权**: 不需要

- **角色**: -

- **说明**: 获取酒店详情（基础信息 + 图片 + 设施 + 标签）。

- **备注**: 详情页房型列表建议单独接口（/rooms），以便按价格升序与支持后续价格日历扩展。


**请求参数 (Path)**: id (酒店 ID, string/UUID)

**响应示例**


```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "hotel-uuid-1001",
    "nameCn": "易宿海景酒店",
    "nameEn": "Yisu Seaview Hotel",
    "star": 5,
    "city": "广州",
    "address": "天河区xx路",
    "openedAt": "2018-05-01",
    "facilities": {
      "wifi": true,
      "parking": true,
      "gym": true,
      "pool": false,
      "restaurant": true,
      "meetingRoom": false
    },
    "tags": [
      "亲子",
      "免费停车"
    ],
    "images": [
      {
        "id": 11,
        "url": "https://.../1.png",
        "sortOrder": 1
      },
      {
        "id": 12,
        "url": "https://.../2.png",
        "sortOrder": 2
      }
    ],
    "minPrice": 399
  }
}
```

---

### 8.4 房型列表（按价升序）

- **方法**: GET

- **Path**: /app/hotels/{id}/rooms

- **鉴权**: 不需要

- **角色**: -

- **说明**: 获取房型列表（后端按价格从低到高排序返回）。


**请求参数 (Path)**: id (酒店 ID, string/UUID)

**请求参数 (Query)**

| 字段 | 类型 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| checkIn | string | 否 | 入住日期（可选：做价格日历时使用） | 2026-02-10 |
| checkOut | string | 否 | 离店日期（可选） | 2026-02-11 |

**响应示例**


```json
{
  "code": 0,
  "message": "ok",
  "data": [
    {
      "id": "room-uuid-501",
      "hotelId": "hotel-uuid-1001",
      "name": "高级大床房",
      "basePrice": 399,
      "maxGuests": 2,
      "breakfast": false
    },
    {
      "id": "room-uuid-502",
      "hotelId": "hotel-uuid-1001",
      "name": "豪华套房",
      "basePrice": 699,
      "maxGuests": 3,
      "breakfast": true
    }
  ]
}
```

