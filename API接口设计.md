# 认知障碍早期诊断临床数据采集系统 · API 接口设计

> 版本：`v1`　> 更新时间：`2026-09-04`

本文是前端与后端同学的接口契约。当前前端原型仍使用 `localStorage`，以下接口是后端接入时的统一约定，不代表已经联网调用。

## 1. 约定

### 1.1 基础地址与请求头

```text
Base URL: /api/v1
Content-Type: application/json
Authorization: Bearer <token>        # 登录接入后启用；课程演示可省略
X-Request-Id: <uuid>                 # 建议前端每次请求生成，用于排查问题
Idempotency-Key: <uuid>              # 创建档案、提交答案、导出任务建议携带
```

文件导入使用 `multipart/form-data`，字段名为 `file`；文件只允许后端在授权范围内处理，不应写入公共静态目录。

### 1.2 统一返回结构

成功：

```json
{
  "success": true,
  "data": {},
  "requestId": "req_20260904_001"
}
```

失败：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "出生年份不合理",
    "fields": { "birthYear": "应为 1900 至当前年份之间的年份" }
  },
  "requestId": "req_20260904_001"
}
```

HTTP 状态码：`200` 查询 / 更新成功，`201` 创建成功，`202` 异步任务已受理，`400` 参数错误，`401` 未登录，`403` 无权限，`404` 不存在，`409` 重复提交或版本冲突，`413` 文件过大，`415` 文件格式不支持，`422` 业务校验失败，`500` 服务端错误。

## 2. 核心数据对象

### 2.1 患者档案 `Patient`

```json
{
  "id": "pat_01J8...",
  "researchNo": "S2609-1234",
  "name": "张三",
  "gender": "male",
  "birthYear": 1958,
  "age": 68,
  "educationYears": 9,
  "occupation": "退休教师",
  "maritalStatus": "married",
  "livingArrangement": "with_family",
  "heightCm": 168,
  "weightKg": 65,
  "phone": "13800000000",
  "source": "manual",
  "createdByRole": "rater",
  "createdAt": "2026-09-04T08:00:00Z",
  "updatedAt": "2026-09-04T08:03:00Z"
}
```

约束：`name` 2~40 个字；`birthYear` 为当前年份前 1~120 年；`educationYears` 0~30；`heightCm` 80~230；`weightKg` 20~250；`phone` 可空，填写时校验大陆 11 位手机号。`age` 由后端根据出生年份计算，前端传入时仅作兼容，不作为最终数据源。

### 2.2 量表会话 `Assessment`

```json
{
  "id": "asm_01J8...",
  "patientId": "pat_01J8...",
  "scaleCode": "SCD-Q9",
  "role": "self",
  "status": "in_progress",
  "currentIndex": 3,
  "answers": { "q1": 1, "q2": 0.5 },
  "score": null,
  "level": null,
  "startedAt": "2026-09-04T08:10:00Z",
  "completedAt": null,
  "version": 4
}
```

`status`：`not_started`、`in_progress`、`completed`、`skipped`。`skipped` 不计算为 0 分，`score` 和 `level` 必须为空。

## 3. 患者档案接口

| 方法      | 路径                                  | 前端调用时机       | MVP |
| ------- | ----------------------------------- | ------------ | --- |
| `POST`  | `/patients`                         | 手工建档完成后提交    | 必做  |
| `GET`   | `/patients/{patientId}`             | 打开档案 / 恢复工作台 | 必做  |
| `PATCH` | `/patients/{patientId}`             | 表格导入后补填或修改   | 必做  |
| `GET`   | `/patients?researchNo=&name=&page=` | 医生查找已有患者     | 必做  |

### `POST /patients`

请求体使用 `Patient` 的可写字段：

```json
{
  "researchNo": "S2609-1234",
  "name": "张三",
  "gender": "male",
  "birthYear": 1958,
  "educationYears": 9,
  "heightCm": 168,
  "weightKg": 65,
  "maritalStatus": "married",
  "livingArrangement": "with_family",
  "phone": "13800000000",
  "source": "manual",
  "createdByRole": "rater"
}
```

返回：`201 + data.patient`。如果携带相同 `Idempotency-Key` 重试，返回同一患者，不重复创建。

### `PATCH /patients/{patientId}`

只传需要修改的字段，并建议携带：

```json
{
  "educationYears": 12,
  "phone": "13800000000",
  "source": "table_import",
  "version": 4
}
```

版本不一致返回 `409 VERSION_CONFLICT`，前端应重新获取档案后提示用户确认覆盖。

## 4. 表格导入与缺失字段

### `POST /patients/import/preview`

上传 CSV / TSV / `.xls`，后端只做解析和校验，不直接写入患者档案。

返回示例：

```json
{
  "success": true,
  "data": {
    "importId": "imp_01J8...",
    "fileName": "patients.csv",
    "totalRows": 3,
    "matchedPatientId": "pat_01J8...",
    "records": [{
      "rowNumber": 2,
      "matched": true,
      "fields": {
        "name": { "value": "张三", "valid": true, "sourceHeader": "患者姓名" },
        "birthYear": { "value": 1958, "valid": true, "sourceHeader": "出生年份" }
      },
      "missingFields": ["educationYears", "weightKg"],
      "invalidFields": []
    }]
  }
}
```

### `POST /patients/import/{importId}/confirm`

前端展示预览并让医生 / 家属确认后调用。后端创建新档案或更新匹配档案，并返回缺失字段：

```json
{
  "recordIndex": 0,
  "patientId": "pat_01J8...",
  "confirmedFields": ["name", "gender", "birthYear", "heightCm"],
  "missingFields": ["educationYears", "weightKg"],
  "invalidFields": [],
  "nextAction": "complete_missing_fields"
}
```

### `PATCH /patients/{patientId}/missing-fields`

提交聊天补填字段：

```json
{
  "fields": { "educationYears": 9, "weightKg": 65 },
  "source": "table_import_completion",
  "version": 5
}
```

前端可在表格导入补填页面把设备交给患者完成剩余字段；后端仍按同一 `patientId` 接收，不新增患者，不覆盖已确认字段。

## 5. 草稿与量表接口

### `PUT /patients/{patientId}/drafts/{role}`

前端每次答题后或退出前保存。`role`：`rater`、`self`、`informant`。

```json
{
  "flowType": "intake",
  "flowId": "intake",
  "currentIndex": 4,
  "answers": { "name": "张三", "gender": "male" },
  "status": "in_progress",
  "clientUpdatedAt": "2026-09-04T08:04:00Z"
}
```

### `GET /patients/{patientId}/drafts/{role}`

返回该角色最近草稿；没有草稿返回 `data: null`。角色切换确认后进入新角色首页，不应把一个角色草稿展示给另一个角色。

### `POST /patients/{patientId}/assessments`

创建量表会话：

```json
{ "scaleCode": "SCD-Q9", "role": "self", "mode": "baseline" }
```

返回 `201 + data.assessment`。

### `PATCH /assessments/{assessmentId}/answers`

增量提交单题答案，支持断网后重试：

```json
{
  "itemId": "q4",
  "value": 1,
  "displayValue": "是的",
  "currentIndex": 4,
  "clientVersion": 3
}
```

### `POST /assessments/{assessmentId}/complete`

完成量表并由后端计分。前端不应把本地计算结果作为最终结果源。

返回：

```json
{
  "assessmentId": "asm_01J8...",
  "status": "completed",
  "score": 5,
  "level": "yellow",
  "label": "存在一定主观认知下降，建议关注"
}
```

### `POST /assessments/{assessmentId}/skip`

整体跳过自评模块：

```json
{ "reason": "patient_unavailable" }
```

返回 `status: skipped`，不生成分数、灯色或诊断结论。

## 6. 结果、报告与导出

| 方法     | 路径                                  | 用途            |
| ------ | ----------------------------------- | ------------- |
| `GET`  | `/patients/{patientId}/assessments` | 查看量表会话与结果     |
| `GET`  | `/patients/{patientId}/report`      | 医生查看综合筛查报告    |
| `POST` | `/exports`                          | 创建导出任务        |
| `GET`  | `/exports/{exportId}`               | 查询导出状态并获取下载地址 |

### `POST /exports`

```json
{
  "patientIds": ["pat_01J8..."],
  "format": "xlsx",
  "anonymize": true,
  "include": ["patient", "assessment_summary"]
}
```

返回 `202`，后端异步生成文件；前端轮询 `GET /exports/{exportId}`，不要阻塞页面。

## 7. 基础咨询接口（可选）

### `GET /faq/categories`

获取固定 FAQ 分类和问题列表。当前前端可继续使用本地配置，后端接入后再切换。

### `POST /faq/answer`

```json
{ "questionId": "what-is-screening", "role": "self" }
```

返回固定答案和免责声明。超出基础信息范围时返回 `nextAction: consult_doctor`，不得直接返回诊断结论。

## 8. 字段枚举

```text
gender: male | female | unknown
maritalStatus: married | unmarried | divorced | widowed | unknown
livingArrangement: alone | with_family | other | unknown
role: rater | self | informant
source: manual | table_import | follow_up
assessment.status: not_started | in_progress | completed | skipped
level: green | yellow | red | null
```

前端显示中文，接口传稳定英文枚举；后端返回的未知枚举前端应降级显示“其他”，不能导致页面崩溃。

## 9. 错误码

| 错误码                            | 含义         | 前端处理                         |
| ------------------------------ | ---------- | ---------------------------- |
| `VALIDATION_ERROR`             | 字段格式或范围不合法 | 在对应输入项下显示字段错误，允许重试           |
| `FILE_FORMAT_UNSUPPORTED`      | 不支持的表格格式   | 提示 CSV / TSV / `.xls`，保留重新选择 |
| `IMPORT_PARSE_ERROR`           | 表格无法解析     | 展示原因，不创建档案                   |
| `PATIENT_NOT_FOUND`            | 未找到患者      | 回到查找 / 新建流程                  |
| `DUPLICATE_RESEARCH_NO`        | 研究编号重复     | 提示后端返回的冲突记录，不覆盖              |
| `VERSION_CONFLICT`             | 草稿或档案版本冲突  | 重新获取并让用户确认                   |
| `ASSESSMENT_ALREADY_COMPLETED` | 量表已完成      | 只读展示结果，不重复提交                 |
| `RATE_LIMITED`                 | 请求过于频繁     | 延迟重试并保留本地草稿                  |
| `INTERNAL_ERROR`               | 服务端异常      | 不丢数据，提示稍后重试                  |

## 10. 前端接入顺序

1. 先接 `POST /patients`、`GET/PATCH /patients/{id}`，打通基础信息。
2. 接 `POST /patients/import/preview` → `confirm` → `missing-fields`，打通表格导入和补填。
3. 接草稿接口，答一题保存一题；离线时继续写本地队列，联网后按 `Idempotency-Key` 重试。
4. 接量表会话、答案、完成和跳过接口，后端负责最终计分。
5. 最后接报告、导出和 FAQ；导出使用异步任务，不阻塞答题页面。

## 11. 安全与隐私

- 患者姓名、电话、出生年份和量表答案属于敏感数据，生产环境必须 HTTPS、鉴权、审计和最小权限。
- 表格导入接口必须限制大小、扩展名和 MIME，并防止 CSV 公式注入与路径穿越。
- 日志只记录 `patientId`、`requestId` 和错误码，不打印姓名、电话、原始病历或答案。
- 前端展示患者结果时遵守角色权限：受试者只看泛化提示，医生 / 授权家属才可查看相应结果。
- 当前课程原型未连接这些接口，不上传任何患者数据。
