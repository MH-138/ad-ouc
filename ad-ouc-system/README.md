# 认知障碍早期诊断临床数据采集系统

> **项目提交**：方智 / 22040031013  
> **所属版本**：V3.0（三端业务流程解耦、现代技术栈重构与全链路闭环交付）

---

## 【本次主要完成工作摘要】

| 评估考察维度 | 本次核心完成工作与技术实现 | 核心代码与测试路径 |
|---|---|---|
| **1. 三端业务彻底解耦与闭环** | 彻底拆分受试者端、家属端、医生工作台三大通道。受试者端自评（SCD-Q9跳过不记0分）；家属端绑定受试者并隔离填写FAQ/CDR；医生端初始患者为null，设置受试者工作区守卫，杜绝未选人乱填。彻底移除前端切换角色按钮。 | `src/App.tsx`<br>`src/components/AppLayout.tsx`<br>`src/pages/InformantInterviewPage.tsx`<br>`src/pages/PatientPortalPage.tsx` |
| **2. 云端数据库设计与实现** | 接入 Turso LibSQL 云端关系型数据库，建立 4 张核心数据表（`patients` 主档案、`assessments` 测评明细、`drafts` 多流草稿、`ai_consultations` 研判审核）。草稿采用 `(patient_id, role, flow_id)` 联合主键，彻底解决同角色多流程覆盖。 | `server/turso.ts`<br>`server.ts`<br>`src/services/tursoApi.ts` |
| **3. 全套神经心理量表与算法** | 严格按宣武医院及多中心认知障碍标准实现全套量表：MMSE（30分）、MoCA-B（30分）、AVLT-H、STT连线、CDR（华盛顿大学分级算法与总分计算）、FAQ、NPI、PSQI、HAMD-17、HAMA等。未作答状态显示为空，绝不记为0分。 | `src/pages/*`<br>`src/utils/scoringCalculators.ts`<br>`src/utils/prototypeScales.ts` |
| **4. 医疗多模态与 AI 审核闭环** | ① **门诊病历 OCR 结构化提取**：支持病历图像/PDF/文本解析并一键回填档案。<br>② **神经心理绘图智能打分**：双五边形交叉、CDT 钟表描画、立方体仿画的形态分析与自动评分。<br>③ **AI 临床综合研判**：AI 生成三段式诊断意见 -> 待审核队列 -> 医生签字确认写入正式诊断。 | `src/components/MedicalRecordUploadModal.tsx`<br>`src/components/DoctorApprovalModal.tsx`<br>`src/components/AiAnalysisModal.tsx`<br>`server/ocrService.ts` |
| **5. 完整技术文档与数据契约** | 撰写完备的文档体系：三端业务流程定稿、16个API接口与数据表定义文档、历史阶段日志与留痕记录、测试差距清单与代码保护红线。 | `ad-ouc-system/*.md` |
| **6. 工程质量与环境规范** | TypeScript 严格类型检查 **0 错误**（`npm run lint` 通过）；Vite 生产打包构建成功（`npm run build`）；配置完整 `.gitignore`，零污染保护历史原型。 | `package.json`<br>`tsconfig.json`<br>`vite.config.ts` |

---

## 项目入口

本项目分为三个入口：

1. **受试者端**：先确认本人档案；已有档案直接使用，无档案时首次建档，然后完成 SCD-Q9 并查看本人可见摘要。
2. **家属端**：进入前绑定一位受试者，确认关系后完成 FAQ、NPI、CDR 等观察评定。
3. **医生端**：首先进入空的受试者队列，医生新建或明确选择受试者后，才进入专业量表、文档、报告、AI 审核与签字。

三个端不提供前端角色切换，业务流程以 `P3_三端业务流程定稿.md` 为准。

## 必读文档

- [`00_文档归属与阅读顺序.md`](./00_文档归属与阅读顺序.md)：系统文档归属与阅读次序清单。
- [`P3_三端业务流程定稿.md`](./P3_三端业务流程定稿.md)：当前唯一业务实施基准。
- [`接口与数据表定义文档.md`](./接口与数据表定义文档.md)：数据库 4 大表结构与全部 16 个 API 接口规范。
- [`01_当前实现差距与后续修改顺序.md`](./01_当前实现差距与后续修改顺序.md)：现有代码与目标的差距、验收状态记录。
- [`CHANGELOG_AND_IMPROVEMENTS.md`](./CHANGELOG_AND_IMPROVEMENTS.md)：详细代码变更与工作留痕日志。
- [`API_AND_DATA_SPEC.md`](./API_AND_DATA_SPEC.md)：接口与数据规范，内容必须服从 P3。
- [`P2_接口设计与OCR结构化解析交付文档.md`](./P2_接口设计与OCR结构化解析交付文档.md)：文档解析专项说明。

P1、P2 和变更日志属于历史阶段记录。根目录 `ad-ouc-prototype/` 中的历史原型文件保持只读。

## 当前状态

- 已完成受试者端、家属端、医生端三端彻底解耦，消除默认受试者兜底与跨端切换。
- 已完成 Turso LibSQL 云端数据表、多流草稿联合键、量表未作答记空与 AI 医生签字闭环。
- 已通过严格的 TypeScript 类型安全检查 (`npm run lint`) 与全包生产构建 (`npm run build`)。

## 本地运行

### 环境要求
- Node.js 18+ 或 Bun
- npm / yarn / pnpm

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
复制环境配置文件模版：
```bash
cp .env.example .env
```
如需使用 Gemini AI 临床诊断辅助及病历拍照识别功能，在 `.env` 中填入你的 API Key：
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. 启动本地开发服务
```bash
npm run dev
```
开发服务器将启动在 `http://localhost:3000`。

### 4. 构建与生产部署
```bash
npm run build
npm run start
```
构建产物输出至 `dist/`，后端入口为 `dist/server.cjs`。

## 使用范围

本软件为辅助临床医生、神经心理测量师及临床科研人员记录与分析认知量表数据的工具。AI 辅助分析建议仅供医学科研与辅助决策参考，最终临床诊断须由具有执业资格的专科医生结合患者完整病史、体征与辅助检查结果作出。
