import React from "react";
import { SubjectRecord } from "../../types/assessment";
import {
  calculateMMSE,
  calculateMoCAB,
  calculateHandedness,
} from "../../utils/scoringCalculators";
import { InteractiveCanvas } from "../InteractiveCanvas";
import { EDINBURGH_HANDEDNESS_ITEMS } from "../../data/assessmentStimuli";
import { CheckCircle2, AlertTriangle, PenTool } from "lucide-react";

interface Props {
  record: SubjectRecord;
  onChange: (updated: Partial<SubjectRecord>) => void;
}

export const SectionComprehensiveScreening: React.FC<Props> = ({ record, onChange }) => {
  const eduYears = record.demographics.educationYears || 0;
  const mmseResult = calculateMMSE(record.scales.mmse.items, eduYears);
  const mocaResult = calculateMoCAB(record.scales.mocaB, eduYears);
  const handednessResult = calculateHandedness(record.scales.handedness.tasks);

  const updateMMSEItem = (key: string, val: number) => {
    onChange({
      scales: {
        ...record.scales,
        mmse: {
          ...record.scales.mmse,
          items: { ...record.scales.mmse.items, [key]: val },
        },
      },
    });
  };

  const updateMoCABField = (field: keyof SubjectRecord["scales"]["mocaB"], val: number) => {
    onChange({
      scales: {
        ...record.scales,
        mocaB: { ...record.scales.mocaB, [field]: val },
      },
    });
  };

  const updateHandednessItem = (taskKey: string, side: "left" | "right", val: 0 | 1 | 2) => {
    const current = record.scales.handedness.tasks?.[taskKey] || { left: 0, right: 2 };
    onChange({
      scales: {
        ...record.scales,
        handedness: {
          ...record.scales.handedness,
          tasks: {
            ...record.scales.handedness.tasks,
            [taskKey]: { ...current, [side]: val },
          },
        },
      },
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Banner */}
      <div className="bg-indigo-50/70 text-slate-900 p-5 rounded-2xl border border-indigo-200 shadow-2xs flex flex-wrap gap-4 items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-indigo-700 font-bold">
            综合认知筛查与大脑偏侧化评估
          </div>
          <h2 className="text-lg font-bold mt-0.5 text-slate-900">
            H1、H2、H15: 爱丁堡利手量表、MMSE (简易精神状态) 与 MoCA-B (基础量表)
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="bg-white px-3.5 py-1.5 rounded-xl border border-indigo-200 text-center shadow-2xs">
            <span className="text-[10px] text-slate-500 block font-medium">MMSE 状态 ({mmseResult.eduGroup})</span>
            <span className={`text-base font-bold font-mono ${mmseResult.isAbnormal ? "text-rose-600" : "text-teal-700"}`}>
              {mmseResult.score} / 30 {mmseResult.isAbnormal ? "(异常 ≤" + mmseResult.cutoff + ")" : "(正常)"}
            </span>
          </div>
          <div className="bg-white px-3.5 py-1.5 rounded-xl border border-indigo-200 text-center shadow-2xs">
            <span className="text-[10px] text-slate-500 block font-medium">MoCA-B 状态 ({mocaResult.eduGroup})</span>
            <span className={`text-base font-bold font-mono ${mocaResult.isAbnormal ? "text-rose-600" : "text-teal-700"}`}>
              {mocaResult.score} / 30 {mocaResult.isAbnormal ? "(异常 ≤" + mocaResult.cutoff + ")" : "(正常)"}
            </span>
          </div>
        </div>
      </div>

      {/* H1. 爱丁堡利手量表 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 font-bold flex items-center justify-center">
              H1
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">H1. 爱丁堡利手量表 (Edinburgh Handedness)</h3>
              <p className="text-xs text-slate-500">
                哪侧手完成动作给2分，另一侧0分；双手均可完成各给1分。公式：100 × (右-左) / (右+左)
              </p>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-mono font-bold text-slate-700">
            判定结果: <span className="text-teal-600 font-bold">{handednessResult.result}</span> (得分: {handednessResult.score})
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {EDINBURGH_HANDEDNESS_ITEMS.map((item) => {
            const task = record.scales.handedness.tasks?.[item.key] || { left: 0, right: 2 };
            return (
              <div key={item.key} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-semibold text-slate-800 block">{item.name}</span>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => {
                      updateHandednessItem(item.key, "left", 2);
                      updateHandednessItem(item.key, "right", 0);
                    }}
                    className={`flex-1 py-1 rounded text-[11px] font-medium transition ${
                      task.left === 2 ? "bg-indigo-600 text-white" : "bg-white border border-slate-300 text-slate-700"
                    }`}
                  >
                    左手 (2)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateHandednessItem(item.key, "left", 1);
                      updateHandednessItem(item.key, "right", 1);
                    }}
                    className={`flex-1 py-1 rounded text-[11px] font-medium transition ${
                      task.left === 1 && task.right === 1
                        ? "bg-indigo-600 text-white"
                        : "bg-white border border-slate-300 text-slate-700"
                    }`}
                  >
                    双手 (1)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateHandednessItem(item.key, "left", 0);
                      updateHandednessItem(item.key, "right", 2);
                    }}
                    className={`flex-1 py-1 rounded text-[11px] font-medium transition ${
                      task.right === 2 && task.left === 0
                        ? "bg-teal-600 text-white"
                        : "bg-white border border-slate-300 text-slate-700"
                    }`}
                  >
                    右手 (2)
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* H2. MMSE (30分完整条目) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              H2
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">H2. 简明精神状态检查 (MMSE, 满分 30 分)</h3>
              <p className="text-xs text-slate-500">
                张明园教授改编版；包含定向、三词即刻记忆、100-7连续计算、延迟回忆、语言命名与双五边形临摹
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">MMSE 得分 / 常模切点</span>
            <span className="text-lg font-bold font-mono text-blue-600">
              {mmseResult.score} / 30{" "}
              <span className="text-xs text-slate-500 font-normal">(切点 ≤ {mmseResult.cutoff} 分)</span>
            </span>
          </div>
        </div>

        {/* MMSE Items Grid */}
        <div className="space-y-4 text-xs">
          {/* 1. Orientation */}
          <div>
            <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. 时间与地点定向力 (10分，每项正确得1分)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { key: "2.1", label: "2.1 哪一年？" },
                { key: "2.2", label: "2.2 什么季节？" },
                { key: "2.3", label: "2.3 几月份？" },
                { key: "2.4", label: "2.4 几号？" },
                { key: "2.5", label: "2.5 星期几？" },
                { key: "2.6", label: "2.6 什么城市？" },
                { key: "2.7", label: "2.7 城区/区县？" },
                { key: "2.8", label: "2.8 街道？" },
                { key: "2.9", label: "2.9 第几层楼？" },
                { key: "2.10", label: "2.10 什么地方/医院？" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => updateMMSEItem(item.key, record.scales.mmse.items?.[item.key] === 1 ? 0 : 1)}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition ${
                    record.scales.mmse.items?.[item.key] === 1
                      ? "bg-teal-50 border-teal-500 text-teal-900 font-semibold"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white font-mono">
                    {record.scales.mmse.items?.[item.key] === 1 ? "1分" : "0分"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Immediate Recall (皮球、国旗、树木) */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-2">
              2. 即刻三词记忆 (3分)：“皮球”、“国旗”、“树木”
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "2.11", label: "2.11 皮球" },
                { key: "2.12", label: "2.12 国旗" },
                { key: "2.13", label: "2.13 树木" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => updateMMSEItem(item.key, record.scales.mmse.items?.[item.key] === 1 ? 0 : 1)}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition ${
                    record.scales.mmse.items?.[item.key] === 1
                      ? "bg-teal-50 border-teal-500 text-teal-900 font-semibold"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white font-mono">
                    {record.scales.mmse.items?.[item.key] === 1 ? "1分" : "0分"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Attention & Calculation (100-7) */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-2">
              3. 注意与计算 (5分，100连续减7：93, 86, 79, 72, 65)
            </h4>
            <div className="grid grid-cols-5 gap-2">
              {[
                { key: "2.14", label: "2.14 100-7=93" },
                { key: "2.15", label: "2.15 93-7=86" },
                { key: "2.16", label: "2.16 86-7=79" },
                { key: "2.17", label: "2.17 79-7=72" },
                { key: "2.18", label: "2.18 72-7=65" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => updateMMSEItem(item.key, record.scales.mmse.items?.[item.key] === 1 ? 0 : 1)}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition ${
                    record.scales.mmse.items?.[item.key] === 1
                      ? "bg-teal-50 border-teal-500 text-teal-900 font-semibold"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white font-mono">
                    {record.scales.mmse.items?.[item.key] === 1 ? "1分" : "0分"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Delayed Recall */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-2">
              4. 延迟三词回忆 (3分)：刚才让您记的三样东西
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "2.19", label: "2.19 皮球 (延迟)" },
                { key: "2.20", label: "2.20 国旗 (延迟)" },
                { key: "2.21", label: "2.21 树木 (延迟)" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => updateMMSEItem(item.key, record.scales.mmse.items?.[item.key] === 1 ? 0 : 1)}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition ${
                    record.scales.mmse.items?.[item.key] === 1
                      ? "bg-teal-50 border-teal-500 text-teal-900 font-semibold"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white font-mono">
                    {record.scales.mmse.items?.[item.key] === 1 ? "1分" : "0分"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Language & Construction */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-2">
              5. 语言与三步指令 (8分)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: "2.22", label: "2.22 出示手表命名" },
                { key: "2.23", label: "2.23 出示铅笔命名" },
                { key: "2.24", label: "2.24 复述‘大家齐心协力拉紧绳’" },
                { key: "2.25", label: "2.25 读并执行‘请闭上您的眼睛’" },
                { key: "2.26", label: "2.26 右手拿纸" },
                { key: "2.27", label: "2.27 双手对折" },
                { key: "2.28", label: "2.28 放到左腿上" },
                { key: "2.29", label: "2.29 独立写一个完整有意义句子" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => updateMMSEItem(item.key, record.scales.mmse.items?.[item.key] === 1 ? 0 : 1)}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition ${
                    record.scales.mmse.items?.[item.key] === 1
                      ? "bg-teal-50 border-teal-500 text-teal-900 font-semibold"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white font-mono">
                    {record.scales.mmse.items?.[item.key] === 1 ? "1分" : "0分"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 6. Drawing: Dual Intersecting Pentagons */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider">
                6. 视空间构图 (1分)：临摹双五边形交叉 (必须有10个角，交叉形成四边形)
              </h4>
              <button
                type="button"
                onClick={() => updateMMSEItem("2.30", record.scales.mmse.items?.["2.30"] === 1 ? 0 : 1)}
                className={`px-3 py-1 rounded text-xs font-semibold transition ${
                  record.scales.mmse.items?.["2.30"] === 1
                    ? "bg-teal-600 text-white"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                2.30 构图评分: {record.scales.mmse.items?.["2.30"] === 1 ? "给 1 分 (正确)" : "给 0 分"}
              </button>
            </div>
            <InteractiveCanvas
              title="MMSE 2.30 双五边形交叉绘图画板"
              instruction="请受试者在右侧白板临摹左侧的标准双五边形交叉图案。"
              referenceSvgType="dualPentagons"
              savedImage={record.scales.mmse.drawingImage}
              onSave={(img) =>
                onChange({
                  scales: {
                    ...record.scales,
                    mmse: { ...record.scales.mmse, drawingImage: img },
                  },
                })
              }
            />
          </div>
        </div>
      </div>

      {/* H15. MoCA-B (30分完整基础版) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              H15
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">
                H15. 蒙特利尔认知评估基础量表 (MoCA-B 华山医院中文版)
              </h3>
              <p className="text-xs text-slate-500">
                针对低教育及文盲老人的认知评估（Nasreddine 2014 / 郭起浩教授 2015 验证版）
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">MoCA-B 总得分 / 切点</span>
            <span className="text-lg font-bold font-mono text-indigo-600">
              {mocaResult.score} / 30{" "}
              <span className="text-xs text-slate-500 font-normal">(切点 ≤ {mocaResult.cutoff} 分)</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Executive Trails */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 block">1. 执行功能 (连线题: 1-点-2-两点... 1分)</span>
            <select
              value={record.scales.mocaB.executiveTrail}
              onChange={(e) => updateMoCABField("executiveTrail", Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-semibold"
            >
              <option value={1}>1 分 (完全按顺序无错误)</option>
              <option value={0}>0 分 (出现任何错误)</option>
            </select>
          </div>

          {/* Fruit Fluency */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 block">2. 词语流畅性 (1分钟说水果名称, 2分)</span>
            <select
              value={record.scales.mocaB.fluencyFruit}
              onChange={(e) => updateMoCABField("fluencyFruit", Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-semibold"
            >
              <option value={2}>2 分 (≥ 13 个)</option>
              <option value={1}>1 分 (8 - 12 个)</option>
              <option value={0}>0 分 (≤ 7 个)</option>
            </select>
          </div>

          {/* Orientation */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 block">3. 定向力 (时间±2h, 星期, 月, 年, 地点, 城市 6分)</span>
            <input
              type="number"
              min={0}
              max={6}
              value={record.scales.mocaB.orientation}
              onChange={(e) => updateMoCABField("orientation", Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-bold font-mono"
            />
          </div>

          {/* 13 Yuan Calculation */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 block">4. 付款计算 (用1/5/10元组合付13元, 3分)</span>
            <select
              value={record.scales.mocaB.calculation13Yuan}
              onChange={(e) => updateMoCABField("calculation13Yuan", Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-semibold"
            >
              <option value={3}>3 分 (提供 3 种正确付款方式)</option>
              <option value={2}>2 分 (提供 2 种正确付款方式)</option>
              <option value={1}>1 分 (提供 1 种正确付款方式)</option>
              <option value={0}>0 分 (未提供正确方式)</option>
            </select>
          </div>

          {/* Abstraction */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 block">5. 抽象概括 (火车轮船/锣鼓笛子/南北 3分)</span>
            <input
              type="number"
              min={0}
              max={3}
              value={record.scales.mocaB.abstraction}
              onChange={(e) => updateMoCABField("abstraction", Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-bold font-mono"
            />
          </div>

          {/* Delayed Recall */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 block">6. 延迟回忆 (桃花、萝卜、沙发、蓝色、筷子 5分)</span>
            <input
              type="number"
              min={0}
              max={5}
              value={record.scales.mocaB.delayedRecall}
              onChange={(e) => updateMoCABField("delayedRecall", Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-bold font-mono"
            />
          </div>

          {/* Visual perception 10 overlapping objects */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 block">7. 视知觉 (1分钟找出10件重叠物品, 3分)</span>
            <select
              value={record.scales.mocaB.visualPerception10Obj}
              onChange={(e) => updateMoCABField("visualPerception10Obj", Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-semibold"
            >
              <option value={3}>3 分 (找出 9 - 10 个)</option>
              <option value={2}>2 分 (找出 6 - 8 个)</option>
              <option value={1}>1 分 (找出 4 - 5 个)</option>
              <option value={0}>0 分 (找出 ≤ 3 个)</option>
            </select>
          </div>

          {/* Naming 4 animals */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 block">8. 动物命名 (斑马、孔雀、老虎、蝴蝶 4分)</span>
            <input
              type="number"
              min={0}
              max={4}
              value={record.scales.mocaB.naming4Animals}
              onChange={(e) => updateMoCABField("naming4Animals", Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-bold font-mono"
            />
          </div>

          {/* Attention Digits */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 block">9. 注意力 (白底读圆形1分 + 黑底读圆和方2分)</span>
            <div className="flex space-x-2">
              <select
                value={record.scales.mocaB.attentionDigitsWhite}
                onChange={(e) => updateMoCABField("attentionDigitsWhite", Number(e.target.value))}
                className="flex-1 p-1.5 border border-slate-300 rounded bg-white text-[11px]"
              >
                <option value={1}>白底: 1分 (≤1错)</option>
                <option value={0}>白底: 0分 (≥2错)</option>
              </select>
              <select
                value={record.scales.mocaB.attentionDigitsBlack}
                onChange={(e) => updateMoCABField("attentionDigitsBlack", Number(e.target.value))}
                className="flex-1 p-1.5 border border-slate-300 rounded bg-white text-[11px]"
              >
                <option value={2}>黑底: 2分 (≤2错)</option>
                <option value={1}>黑底: 1分 (3错)</option>
                <option value={0}>黑底: 0分 (≥4错)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
