# 系统改动说明

> 文档状态：历史变更摘要。是否真正完成以业务验收结果为准，当前流程统一见 `P3_三端业务流程定稿.md`。

## 本次改动

- 首页改为三个入口：受试者、家属、医生。
- 医生端顶部改为选择受试者，不再把某个受试者当成页面主标题。
- 医生端外部入口使用 `上传文档`；弹窗内可上传真实文件或粘贴文本。
- 文档弹窗右下角提供 `模拟文档`，用于演示同一套解析和核对流程。
- AI 弹窗保留真实接口调用，同时提供 `模拟回复`。
- `模拟回复` 会写入医生待审核；医生签字后才写回诊断意见。
- 家属 FAQ/CDR、受试者 SCD 自评等草稿按角色保存完整 JSON。
- 新增并校准 `P3_三端业务流程定稿.md`。

## P3 三端业务流程定稿对齐实施

1. **草稿隔离与多流程扩展**：
   - `server/turso.ts`：更新 `drafts` 表，引入 `flow_id` 联合查验与持久化逻辑，解决同角色不同业务流草稿覆盖问题。
   - `server.ts` & `src/services/tursoApi.ts`：接口扩展为 `/api/v1/patients/:patientId/drafts/:role/:flowId?`，全链路传递 `flowId`。
2. **受试者上下文与三端解耦**：
   - `src/App.tsx`：初始 `activePatientId` 严格为 `null`，移除远程加载后自动选中第一人；医生端第一屏强制进入受试者队列。
   - 医生工作台受试者守卫：未选择受试者时，禁止访问量表与综合报告，并引导至队列中心选择或新建档案；顶部增加一键清除受试者并返回队列。
   - 移除跨端切换：完全删除 `AppLayout`、`ChatInterviewView` 中的 `role` 与 `onChangeRole` 回调，三端通道彻底独立。
3. **受试者端与家属端页面边界与计分规范**：
   - `src/pages/InformantInterviewPage.tsx`：移除受试者切换下拉框及医生研判卡片，绑定唯一受试者；草稿接入 `flowId: "faq_cdr"`；FAQ 未答满时总分保持 `null`。
   - `src/pages/PatientPortalPage.tsx`：SCD-Q9 未完成时不记总分（保持 `null`），支持整量表跳过；受试者健康档案剥离内部量表（MMSE、MoCA）与内部诊断结论。
   - `src/components/SystemPortal.tsx`：移除顶部档案库和新建患者按钮，维持纯通道分发入口。
4. **新建受试者与空白初始档案**：
   - `src/utils/initialPatient.ts`：新增 `createEmptySubjectRecord`，量表均为空状态，杜绝默认 0 分或示例阳性分污染。
   - `src/components/NewPatientModal.tsx`：表单初始字段清空，强制录入校验，建档写入空白档案。

## 未改动

- 未修改历史原型的 `app.js`、`scales.js`、`styles.css`。
- 未修改 `window.INTAKE`。
- 未把 SCD-Q9 跳过记为 0 分。
