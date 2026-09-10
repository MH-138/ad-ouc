# 认知数据采集系统：接口设计与数据规范文档 (API & Data Specification)

> **文档状态：当前技术契约，待按业务基准继续校准。** 三端身份、受试者绑定、未作答状态和审核流程以 `P3_三端业务流程定稿.md` 为最高依据；本文若与 P3 冲突，以 P3 为准。

## 一、系统架构与三端边界

目标系统将**受试者本人端**、**家属（知情者）观察端**与**医生临床工作站**分为三个独立顶级页面，共享后端数据但不共享页面状态：
- **受试者通道 (`/patient`)**：先绑定或建立本人档案，再进入适老自评界面，完成 SCD-Q9 并查看本人可见摘要。
- **知情者通道 (`/informant`)**：面向照护者与同住亲属，进入前绑定并确认唯一受试者；进入后不提供受试者切换，逐步评定 FAQ、NPI 与 CDR 观察项。
- **医生工作站 (`/examiner`)**：第一屏只显示队列，医生明确新建或选择受试者后，才进入专业量表、病历文档、AI 研判与签字流程。

### 1.1 受试者上下文约束

- 受试者端、家属端开始业务前必须获得唯一 `patientId`。
- 医生端进入时 `patientId` 必须为空，选人后才建立工作上下文。
- 所有草稿、量表、文档、AI 和签字写入都必须携带 `patientId`。
- 服务端必须验证 `patientId` 存在；不得使用前端缓存的第一位受试者作为兜底。

### 1.2 角色枚举

当前现代系统统一使用：

```text
patient    受试者本人
informant  家属/知情者
examiner   医生/研究人员
```

历史原型中的 `self` 和 `rater` 只属于原型。若迁移旧数据，接口边界可将 `self -> patient`、`rater -> examiner`，数据库新数据不得继续混用两套角色值。

### 1.3 统一业务状态

```text
not_started | in_progress | completed | skipped
```

`not_started` 和 `in_progress` 的分数必须为 `null`。`skipped` 必须保存跳过原因且分数为 `null`。只有使用者明确选择数值 0 时，答案才允许是 0。

---

## 二、核心 API 接口设计

### 1. 病历文档智能提取接口
- **接口路径**: `POST /api/v1/ocr/parse-record`（备用路由：`POST /api/ai/parse-medical-record`）
- **功能描述**: 接收上传的病历图片、PDF、文本或示例文档标识，提取人口学、病史与生物标志物，输出统一临床 JSON。返回结果只进入医生核对页面，不自动写入患者档案。
- **请求参数 (Request Body)**:
```json
{
  "sampleKey": "xuanwu_outpatient",          // 可选：内置模拟样本 key ("xuanwu_outpatient" | "mri_report")
  "fileBase64": "data:image/jpeg;base64,...", // 可选：用户上传的图片 Base64 编码
  "mimeType": "image/jpeg",                   // 可选：文件类型
  "rawText": "患者姓名：孙桂兰，女，69岁...",    // 可选：直接粘贴的纯文本病历
  "fileName": "宣武医院门诊病历_孙桂兰.pdf"
}
```

- **响应数据格式 (Response Body)**:
```json
{
  "success": true,
  "jobId": "ocr_job_20260909_001",
  "clinicalJson": {
    "demographics": {
      "name": "孙桂兰",
      "gender": 2,                           // 1: 男, 2: 女
      "age": 69,
      "educationYears": 12,                  // 受教育年数
      "marriage": 2,                         // 婚姻状况代码
      "livingStatus": 1,                     // 居住状况代码
      "phone1": "13800138000"
    },
    "history": {
      "hypertension": true,                  // 高血压
      "diabetes": false,                     // 糖尿病
      "coronaryHeartDisease": false,         // 冠心病
      "hyperlipidemia": true,                // 高脂血症
      "stroke": false                        // 脑卒中
    },
    "biomarkers": {
      "mriHippocampus": 2,                   // 内侧颞叶海马萎缩 MTA 分级 (0~4)
      "apoeGenotype": "ε3/ε4",               // APOE 基因型
      "amyloidStatus": "阳性 (A+)",          // Aβ 淀粉样蛋白
      "tauStatus": "轻度增高 (T+)"           // Tau 蛋白
    }
  }
}
```

---

### 2. AI 临床研判与推理接口
- **接口路径**: `POST /api/ai/clinical-reasoning`
- **功能描述**: 聚合受试者的主观自评、知情者观察、神经心理量表测试成绩以及影像生物标志物，调用临床逻辑生成分型研判建议，推送至主治医师待办清单，待医生电子签名核准后生效。
- **目标请求参数 (Request Body)**:
```json
{
  "patientId": "P-20260909-001"
}
```

目标实现由服务端根据 `patientId` 读取完整档案，避免以前端传入对象作为最终数据源。当前兼容实现仍可接收 `record` 或 `subjectRecord`，后续需收敛。

- **响应数据格式 (Response Body)**:
```json
{
  "success": true,
  "analysis": {
    "proposedCategory": "SCD (主观认知下降阶段)",
    "confidence": 0.92,
    "atnClassification": "A+ T+ N-",
    "rationale": "受试者 SCD-Q9 得分 6/9 分且主观记忆减退明确；MMSE (28分) 与 MoCA-B (26分) 维持正常常模范围；头颅 MRI 提示轻度内侧颞叶改变，符合 NIA-AA 临床早期特征。",
    "riskLevel": "中等进展风险",
    "recommendations": [
      "建议每 6 个月随访神经心理量表与嗅觉测试",
      "控制动脉粥样硬化危险因素，维持规律有氧运动",
      "必要时行外周血 p-tau217 高灵敏定量检测"
    ],
    "requiresDoctorSignature": true
  }
}
```

---

### 3. Turso 云端数据库持久化

当前后端已创建 `patients`、`assessments`、`drafts`、`ai_consultations` 四张表。它们属于“已实现待验收”，不代表所有页面数据已经逐项验证写入。

#### (1) 受试者档案表 (`patients`)
```sql
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  research_no TEXT,
  name TEXT NOT NULL,
  gender TEXT,
  birth_year INTEGER,
  age INTEGER,
  education_years INTEGER,
  height_cm REAL,
  weight_kg REAL,
  phone TEXT,
  raw_data_json TEXT,
  updated_at TEXT
);
```

#### (2) 填报与自评草稿表 (`drafts`)
```sql
CREATE TABLE IF NOT EXISTS drafts (
  patient_id TEXT,
  role TEXT,             -- "patient" | "informant"
  flow_id TEXT,
  draft_json TEXT,       -- 实时暂存的未完成问卷数据
  updated_at TEXT,
  PRIMARY KEY (patient_id, role, flow_id)
);
```

当前数据库实际主键仍为 `(patient_id, role)`，因此同一角色的多个未完成流程可能互相覆盖。目标迁移需加入 `flow_id` 后再按三端验收。

#### (3) 已提交量表表 (`assessments`)

保存 `patient_id`、`scale_code`、`role`、`status`、`answers_json`、`score`、`level` 和时间。未完成或跳过时 `score` 必须为 `NULL`。

#### (4) AI 审核表 (`ai_consultations`)

保存 `patient_id`、AI 原始建议、审核状态、医生修改、签名和审核时间。AI 生成后状态为 `pending_review`，医生签字后为 `approved`。

#### (5) 仍需补齐的持久化对象

- `documents`：文件元数据、原始识别结果、结构化 JSON、核对状态和确认人。
- `notifications`：医生待审核消息及已读状态，或使用可追溯的等价待办结构。
- 访问绑定：受试者/家属访问码与 `patient_id` 的安全绑定关系；演示版可先使用会话绑定。

#### (6) 核心持久化方法 (`tursoApi`)
- `tursoApi.savePatient(record)`: 插入或更新受试者全量数据；
- `tursoApi.fetchCohort()`: 拉取云端全队列档案；
- `tursoApi.saveDraft(patientId, role, draftData)`: 答题过程中实时增量写入数据库，支持断点续填；
- `tursoApi.loadDraft(patientId, role)`: 进入问卷时自动从云端恢复草稿。

### 4. 当前接口实现状态

| 接口 | 当前状态 | 后续验收重点 |
|---|---|---|
| `GET/POST/PATCH/DELETE /api/v1/patients` | 已实现待验收 | 新建空数据、明确选人、删除关联数据 |
| `POST /api/v1/patients/:patientId/assessments` | 已实现待验收 | 未完成/跳过不能有分数 |
| `GET/PUT /api/v1/patients/:patientId/drafts/:role` | 已实现待验收 | 角色隔离、多个流程不覆盖 |
| `POST /api/v1/ocr/parse-record` | 示例路径已实现 | 当前尚不是真实文件 OCR |
| `POST /api/ai/parse-medical-record` | 部分实现 | 真实模型与规则回退返回结构需统一 |
| `POST /api/ai/clinical-reasoning` | 部分实现 | 应由服务端按 `patientId` 取档案 |
| `POST /api/v1/ai-consultations/submit` | 已实现待验收 | 真实/模拟结果统一进入待审核 |
| `POST /api/v1/ai-consultations/:id/approve` | 已实现待验收 | 医生签字后才更新最终诊断 |
| 文档确认写入与通知接口 | 待实现 | 全量数据可恢复、可追溯 |

---

## 三、数据规范与红线约束

1. **跳过逻辑防作弊规范**：
   受试者或家属在自评过程中选择“跳过 / 暂不清楚”时，状态统一持久化为字符串 `"skipped"`，**严禁将其篡改为 0 分**或伪造为正常表现，统计时明确标记该项缺失。
2. **多端状态实时一致性**：
   受试者在 `/patient` 端提交自评后，知情者端 `/informant` 和医生端 `/examiner` 能够无缝读取到最新的 `scdInterview` 与得分进度。
