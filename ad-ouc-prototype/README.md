# 认知障碍早期筛查 · 基础版本原型

> 聊天式临床数据采集系统的基础可运行版本。面向课程作业演示：录入病人资料 + 填写量表 / 测试 + 自动计分与红黄绿灯预警 + 一键导出 Excel。

## 运行方式

### 方式一：直接打开（最简单）

双击 `index.html` 即可在浏览器运行（需 Chrome / Edge 等现代浏览器，建议 F12 切到手机模拟视图看平板效果）。

### 方式二：本地静态服务（推荐，离线缓存更稳）

```bash
cd ad-ouc-prototype
python -m http.server 8123
# 浏览器打开 http://127.0.0.1:8123/
```

## 功能

- **聊天式建档**：引导录入姓名、性别、出生年份、教育年限、身高体重、婚姻、居住、联系方式，自动生成研究编号。
- **10 个核心量表的对话式评估**：SCD-Q9、HAMD、HAMA、MMSE、MoCA-B、AVLT、VFT、FAQ、NPI、CDR。
- **自动计分 + 红黄绿灯预警**：完成量表后给出原型演示用的分级提示。
- **角色切换**：支持主试、患者和家属三类角色。
- **离线优先**：操作写入 localStorage，刷新或退出重进可恢复。
- **一键导出 Excel**：生成 Excel 可打开的 `.xls` 文件。

## 文件结构

```text
ad-ouc-prototype/
|-- index.html      入口页面（聊天式 UI 骨架）
|-- styles.css      适老化样式（大字体、大按钮、高对比）
|-- scales.js       对话剧本配置（量表 + 建档）
|-- app.js          通用对话引擎（渲染 / 计分 / 导出 / 离线）
`-- README.md       原型基础说明
```

## 如何新增一个量表（无需改引擎）

打开 `scales.js`，在 `window.SCALES` 中追加一项：

```js
"GDS": {
  name: "老年抑郁量表（精简）", short: "GDS", role: "self",
  intro: "问几个心情相关的小问题。",
  items: [
    { id:"g1", q:"您是否感到满意？", kind:"choice",
      options:[{label:"是",score:0},{label:"否",score:1}] }
  ],
  scoring: { type:"sum", thresholds:[
    { min:0, max:4, level:"green", label:"正常范围" },
    { min:5, max:99, level:"yellow", label:"存在抑郁倾向，建议进一步评估" }
  ]}
}
```

刷新页面，量表菜单会自动出现新卡片。

## 说明（课程作业口径）

- 本版本为基础演示原型，量表题目为精简代表题，常模与阈值采用固定分段，仅用于流程演示与评分逻辑验证。
- 未包含病历拍照 OCR、随访时间轴和多患者云同步。
- 个人负责模块的新增功能、接口边界和验收步骤见根目录 [`README2.md`](../README2.md)。
