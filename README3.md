# 认知障碍早期诊断临床数据采集系统 · V3.0 交付说明

> **版本标识**：V3.0（三端业务流程解耦、现代技术栈重构与全链路闭环交付）  
> **前序版本**：接续根目录下 `README.md`（V1.0 原型框架）与 `README2.md`（V2.0 患者端填表说明）。  
> **本次提交**：方智 / 22040031013  
> **代码隔离准则**：本次交付的代码与文档统一独立存放于 `ad-ouc-system/` 目录，完全保留根目录下原 `ad-ouc-prototype/` 原型代码与原始历史文件，实现绝对隔离与工作留痕。

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

## 一、版本核心升级概述

基于临床规范、宣武医院多中心 SCD/MCI 诊断标准及最新定稿业务流程，V3.0 版本对系统进行了全栈工程化重构与严格的业务解耦：

1. **三端独立通道彻底解耦**：
   - **受试者端**：本人档案确认与自评通道，支持 SCD-Q9 自评与跳过（跳过不计 0 分），个人健康档案剥离内部量表与内部鉴别诊断。
   - **家属端**：知情者观察通道，进入后绑定唯一受试者，移除内部切换控件，提供 FAQ、NPI、CDR 观察填报，未完成时总分保持 `null`。
   - **医生端**：临床与科研工作台，初始 `activePatientId` 严格为 `null`，首屏强制进入受试者队列；量表评定设立受试者守卫，未选患者禁止进入评定；支持一键清除受试者并返回队列。
   - 前端彻底移除角色切换按钮及跨端回调，各端通过 `patient_id` 在云端数据库协同。

2. **云端数据库与草稿多流隔离 (Turso LibSQL)**：
   - 建立 4 张核心业务表：`patients`（主档案）、`assessments`（量表记录）、`drafts`（多端草稿）、`ai_consultations`（AI 研判与医生签字）。
   - `drafts` 升级联合主键 `(patient_id, role, flow_id)`，解决同角色多量表流程草稿相互覆盖问题。

3. **智能辅助与医疗闭环**：
   - **病历 OCR 结构化解析**：支持门诊病历、出院小结的图像/文本提取与人工核对回填。
   - **神经心理绘图智能评定**：双五边形交叉（MMSE）、CDT 钟表描画、三维立方体（MoCA）智能打分与形态分析。
   - **AI 临床研判与医生签字流**：AI 推理生成三段式意见 -> 存入待审核队列 -> 主治医生审查修正 -> 电子签名确认 -> 写入正式诊断与随访计划。

---

## 二、工程目录结构

```text
ad-ouc/
├── README.md                           # [只读保留] V1.0 原始项目说明
├── README2.md                          # [只读保留] V2.0 患者填表个人负责模块说明
├── README3.md                          # [当前文档] V3.0 三端业务重构与系统交付说明
├── ad-ouc-prototype/                   # [只读保留] 历史版本交互原型代码 (HTML/JS)
├── 汇报1.pptx                          # 原始汇报资料
│
└── ad-ouc-system/                      # 【V3.0 现代系统工程目录】
    ├── src/                            # React 19 + TypeScript + TailwindCSS 前端工程
    │   ├── components/                 # 三端公共组件、工作台布局、诊断弹窗、建档弹窗
    │   ├── pages/                      # 各端页面 (受试者端、家属端、受试者中心、各大认知量表)
    │   ├── services/                   # Turso LibSQL 云端 API 客户端
    │   ├── types/                      # TypeScript 严格临床数据与量表类型定义
    │   └── utils/                      # 神经心理计分算法、常模判定、Excel 脱敏导出
    ├── server/                         # 后端服务模块
    │   ├── turso.ts                    # LibSQL 客户端连接、建表 DDL、CRUD 事务实现
    │   └── ocrService.ts               # 文档识别与结构化提取服务
    ├── server.ts                       # Express 全功能后端服务 (端口 3000，集成 Vite 运行时)
    ├── package.json                    # 依赖清单与运行脚本
    ├── tsconfig.json                   # 严格 TypeScript 编译配置
    ├── vite.config.ts                  # Vite 现代化构建配置
    ├── index.html                      # 单页应用入口模板
    │
    └── [全套业务与技术交付文档]
        ├── 00_文档归属与阅读顺序.md        # 系统文档归属与阅读次序清单
        ├── 01_当前实现差距与后续修改顺序.md  # 业务差距清单与阶段验收状态
        ├── P3_三端业务流程定稿.md          # 业务实施定稿准则 (优先级最高)
        ├── 接口与数据表定义文档.md          # 4大数据库表结构与16个HTTP接口定义
        ├── API_AND_DATA_SPEC.md        # 接口与临床数据技术契约
        ├── CHANGELOG_AND_IMPROVEMENTS.md # 变更明细与工作留痕日志
        ├── P2_接口设计与OCR结构化解析交付文档.md
        ├── P1_功能迁移与云端数据库接入说明.md
        └── 认知障碍早期诊断临床数据采集系统_需求文档_已更新.md
```

---

## 三、文档体系与阅读顺序

系统维护与业务验收请按以下顺序查阅 `ad-ouc-system/` 内的文档：

1. [`00_文档归属与阅读顺序.md`](./ad-ouc-system/00_文档归属与阅读顺序.md)：界定团队文档范围与优先级。
2. [`P3_三端业务流程定稿.md`](./ad-ouc-system/P3_三端业务流程定稿.md)：**核心业务流程基准**，定义三端进入规则、状态流转与质控边界。
3. [`接口与数据表定义文档.md`](./ad-ouc-system/接口与数据表定义文档.md)：数据表字段类型、主键约束与全部 API 接口规范。
4. [`CHANGELOG_AND_IMPROVEMENTS.md`](./ad-ouc-system/CHANGELOG_AND_IMPROVEMENTS.md)：所有代码提交与修复的工作留痕记录。
5. [`01_当前实现差距与后续修改顺序.md`](./ad-ouc-system/01_当前实现差距与后续修改顺序.md)：各项功能验收状态核查。

---

## 四、本地安装与运行

### 1. 环境准备
- Node.js 18+ 或 Bun
- npm / yarn / pnpm

### 2. 进入系统工程目录并安装依赖
```bash
cd ad-ouc-system
npm install
```

### 3. 启动全栈开发服务
```bash
npm run dev
```
服务启动后：
- 本地访问地址：`http://localhost:3000`
- 自动挂载 Vite 前端热更新与 Express 后端 API
- 自动连接并校验 Turso LibSQL 云端数据库

### 4. 静态类型检查与生产构建
```bash
npm run lint    # 执行 tsc --noEmit，保障类型安全
npm run build   # 执行 Vite 与 esbuild 打包，生成生产构建 dist/
```
