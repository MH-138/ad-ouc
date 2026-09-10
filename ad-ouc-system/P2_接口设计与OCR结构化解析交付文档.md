# P2 接口设计与 OCR 结构化解析技术交付文档

> **文档状态：专项技术设计，部分实现。** 接口存在不等于完整流程已经验收；身份绑定、医生选人、人工核对和数据写入顺序统一以 `P3_三端业务流程定稿.md` 为准。

> **系统名称**：阿尔茨海默病与认知障碍临床数据采集系统  
> **所属版本**：P2 阶段架构迭代与 OCR 多模态设计  
> **设计基准**：首都医科大学宣武医院认知中心临床规范、PaddleOCR-VL-1.6 视觉多模态大模型标准  
> **隔离红线**：严禁侵入历史版本原型代码（`scales.js` / `app.js` / `styles.css`），所有现代扩展物理隔离于 `src/` 与 `server/`。

---

## 一、OCR 视觉多模态解析与数据流架构

```
[病历照片/扫描件/PDF/文本或示例文档]
           │
           ▼
[POST /api/v1/ocr/parse-record]
           │
           ├─► [阶段一：文档识别服务]
           │   ├── 文档方向矫正与版面布局还原 (Layout Parsing)
           │   ├── 表格抽取与跨行手写/打印混合体识别
           │   └── 生成高保真结构化 Markdown 文本与切片图 (doc_0.md)
           │
           ├─► [阶段二：临床字段语义归一化]
           │   ├── 医疗实体消歧（如“双侧MTA 2级”归一化为海马萎缩）
           │   ├── 基础人口学要素抽取（姓名、年龄、性别、教育年限、电话）
           │   ├── 既往病史与心血管危险因素布尔化（高血压、糖尿病、卒中、家族史）
           │   └── ATN 生物标志物映射（海马MRI、APOE ε4、Aβ-PET、Tau-PET）
           │
           ▼
[返回标准结构化 Clinical JSON]
           │
           ├─► [前端智能回填与医生双签核对] (MedicalRecordUploadModal)
           │
           └─► [医生确认写入] ---> 更新受试者档案
```

当前实现状态：示例文档可返回上述结构；真实文件提交、任务轮询、结果下载和统一归一化尚未完整接入。无论真实或示例路径，都必须先由医生核对，不能直接覆盖档案。

---

## 二、核心 API 接口设计与规范

### 1. 智能病历 OCR 抽取与规范化接口

#### 接口定义
- **接口路径**：`POST /api/v1/ocr/parse-record`（别名兼容：`POST /api/ai/parse-medical-record`）
- **接口功能**：提交临床病历文件或选择示例文档，经文档识别和字段归一化后返回标准临床 JSON。
- **请求格式**：`application/json`

#### 请求参数 (Request Payload)
```typescript
interface OcrParseRequest {
  /** 模式一：选择内置宣武医院标准测试案例 (如 xuanwu_outpatient | mri_report) */
  sampleKey?: "xuanwu_outpatient" | "mri_report";
  /** 模式二：上传的图像或 PDF Base64 编码字符串 (带或不带 data:image/jpeg;base64 前缀) */
  fileBase64?: string;
  /** 文件 MIME 类型 */
  mimeType?: "image/jpeg" | "image/png" | "application/pdf";
  /** 模式三：直接粘贴的病历纯文本 */
  rawText?: string;
  /** 源文件名 */
  fileName?: string;
}
```

#### 请求示例
```json
{
  "sampleKey": "xuanwu_outpatient",
  "fileName": "宣武医院神经内科门诊病历_孙桂兰.pdf"
}
```

#### 响应结构 (Response JSON Specification)
```json
{
  "success": true,
  "jobId": "job_paddlevl_17730998271_9x3a",
  "state": "done",
  "sourceDocName": "宣武医院神经内科门诊病历_孙桂兰.pdf",
  "rawMarkdown": "首都医科大学宣武医院 门诊病历记录\n姓名：孙桂兰 性别：女 年龄：69岁...",
  "clinicalJson": {
    "demographics": {
      "name": "孙桂兰",
      "gender": 2,
      "age": 69,
      "educationYears": 12,
      "phone1": "13910827361",
      "height": 160,
      "weight": 58
    },
    "history": {
      "chiefComplaint": "记忆力进行性减退1年半，主观记忆下降明显，伴钥匙遗失与找词困难",
      "hypertension": true,
      "hypertensionYears": 8,
      "usualBp": "130/80",
      "diabetes": false,
      "coronaryHeartDisease": false,
      "stroke": false,
      "familyHistory": true
    },
    "biomarkers": {
      "mriAtrophy": true,
      "mriDescription": "双侧海马体积对称性轻度变小，MTA分级2级；Fazekas 1级脑白质病变",
      "apoe4": 1,
      "abetaPet": 1,
      "tauPet": 0
    },
    "rawTextExcerpt": "双侧海马萎缩 MTA 2级，APOE ε3/ε4 携带，初步诊断：主观认知下降 (SCD)",
    "sourceDocName": "宣武医院神经内科门诊病历_孙桂兰.pdf"
  },
  "confidenceScore": 0.96
}
```

---

### 2. 受试者队列管理与持久化接口

#### 2.1 获取全量受试者列表
- **路径**：`GET /api/v1/patients`
- **响应**：
```json
{
  "success": true,
  "count": 3,
  "patients": [
    {
      "id": "pat_001_scd",
      "subjectNo": "XW-2026-001",
      "visitCode": "W000",
      "demographics": {
        "name": "张建华",
        "gender": 1,
        "age": 71,
        "educationYears": 12,
        "phone1": "13801234567"
      },
      "scales": { ... },
      "diagnosis": { ... }
    }
  ]
}
```

#### 2.2 新增 / 更新受试者档案
- **路径**：`POST /api/v1/patients` 或 `PUT /api/v1/patients/:id`
- **请求体**：完整 `SubjectRecord` 对象。
- **存储落地**：写入 Turso LibSQL 的 `patients` 表，自动解析并序列化 `demographics`、`history`、`scales`、`biomarkers` 等结构化 JSON 字段。

#### 2.3 家属端/受试者端实时草稿持久化
- **路径**：`PUT /api/v1/patients/:patientId/drafts/:role`
- **参数**：`:role` 为 `patient` | `informant` | `examiner`
- **功能**：当家属或受试者完成某一题作答时，静默调用保存，确保断点续答与网络重连不丢数据。
- **获取草稿**：`GET /api/v1/patients/:patientId/drafts/:role`

---

## 三、真实接入与示例路径的当前状态

`server/ocrService.ts` 当前保存了文档识别服务配置、返回类型和两份示例文档：
- `JOB_URL`: `https://paddleocr.aistudio-app.com/api/v2/ocr/jobs`
- `TOKEN`: `3c0908da25250490257e66b5511fbd634d992fb5`
- `MODEL`: `PaddleOCR-VL-1.6`

当前能力分为：

1. **示例路径，已实现待验收**：点击“模拟文档”后载入示例内容并返回固定结构 JSON。
2. **文本/图片字段提取，部分实现**：`POST /api/ai/parse-medical-record` 可接收文本或 Base64；配置有效时调用模型，否则返回规则结果。
3. **真实 OCR 异步任务，待实现**：仍需补齐文件上传、任务提交、`jobId` 轮询、JSONL 下载、错误处理和超时取消。
4. **人工确认写入，待完整验收**：解析结果必须展示给医生修改，只有确认后才能更新当前 `patient_id`。

真实接口和示例路径必须返回同一份结构化 JSON 契约。示例路径不能伪装成真实识别成功，业务页面也不展示供应商、模型、Token 或任务地址。
