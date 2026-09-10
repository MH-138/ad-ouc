import React, { useState } from "react";
import { SubjectRecord } from "../types/assessment";
import { calculateMMSE, calculateHandedness } from "../utils/scoringCalculators";
import { InteractiveCanvas } from "../components/InteractiveCanvas";
import { EDINBURGH_HANDEDNESS_ITEMS } from "../data/assessmentStimuli";
import { Activity, CheckCircle2, AlertTriangle, Save, Sparkles, Check } from "lucide-react";

interface MmsePageProps {
  record: SubjectRecord;
  onUpdateRecord: (record: SubjectRecord) => void;
}

export const MmsePage: React.FC<MmsePageProps> = ({ record, onUpdateRecord }) => {
  const [saveToast, setSaveToast] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  const eduYears = record.demographics.educationYears || 0;
  const mmseItems = record.scales.mmse?.items || {};
  const mmseAnsweredCount = Object.keys(mmseItems).length;
  const isMmseStarted = mmseAnsweredCount > 0;

  const mmseResult = calculateMMSE(mmseItems, eduYears);
  const handednessTasks = record.scales.handedness?.tasks || {};
  const hasHandednessStarted = Object.keys(handednessTasks).length > 0;
  const handednessResult = calculateHandedness(handednessTasks);

  const triggerSaveFeedback = () => {
    const timeStr = new Date().toLocaleTimeString();
    setLastSavedTime(timeStr);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const updateMMSEItem = (key: string, val: number) => {
    onUpdateRecord({
      ...record,
      scales: {
        ...record.scales,
        mmse: {
          ...record.scales.mmse,
          items: { ...record.scales.mmse.items, [key]: val },
        },
      },
    });
    triggerSaveFeedback();
  };

  const updateHandednessItem = (taskKey: string, side: "left" | "right", val: 0 | 1 | 2) => {
    const current = record.scales.handedness.tasks?.[taskKey] || { left: 0, right: 0 };
    onUpdateRecord({
      ...record,
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
    triggerSaveFeedback();
  };

  return (
    <div className="space-y-6">
      {/* Overview Score Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                H1 & H2 · 神经心理初筛与大脑偏侧化
              </span>
              {lastSavedTime && (
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  已自动保存 ({lastSavedTime})
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              爱丁堡利手量表 与 MMSE 简易精神状态检查
            </h2>
            <p className="text-xs text-slate-500">
              初筛受试者整体认知水平，按教育年限匹配中国常模切界分（文盲≤17，小学≤20，初中及以上≤24）
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-center">
              <span className="block text-[11px] text-slate-500">利手判定</span>
              <span className="font-mono text-sm font-bold text-slate-800">
                {hasHandednessStarted ? `${handednessResult.result} (${handednessResult.score}分)` : "未评定 / 待测"}
              </span>
            </div>
            <div className="rounded-xl border border-teal-200 bg-teal-50/50 px-4 py-2 text-center">
              <span className="block text-[11px] text-teal-800 font-medium">
                MMSE 得分 ({mmseResult.eduGroup})
              </span>
              <span
                className={`font-mono text-base font-bold ${
                  !isMmseStarted
                    ? "text-slate-400"
                    : mmseResult.isAbnormal
                    ? "text-amber-700"
                    : "text-emerald-700"
                }`}
              >
                {isMmseStarted ? `${mmseResult.score} / 30 分` : "-- / 30 分"}
              </span>
              <span className="block text-[10px] text-slate-500">
                {!isMmseStarted
                  ? "(待录入 0/30 项)"
                  : mmseResult.isAbnormal
                  ? `(异常 ≤${mmseResult.cutoff}分 · 已答${mmseAnsweredCount}项)`
                  : `(正常 >${mmseResult.cutoff}分 · 已答${mmseAnsweredCount}项)`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. H1 Edinburgh Handedness */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 font-bold text-teal-700">
              H1
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                H1. 爱丁堡利手量表 (Edinburgh Handedness Inventory)
              </h3>
              <p className="text-xs text-slate-500">
                习惯哪侧手完成动作选该侧 (2分)；双手均可使用选双手 (各1分)。
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-mono font-bold text-slate-700">
            判定: <span className="font-bold text-teal-600">{handednessResult.result}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {hasHandednessStarted
              ? `已录入偏侧化评定 (${Object.keys(handednessTasks).length} / ${EDINBURGH_HANDEDNESS_ITEMS.length} 项)`
              : "尚未录入利手评定（请主试按实际表现点击对应侧肢体）"}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const allRight: Record<string, { left: 0; right: 2 }> = {};
                EDINBURGH_HANDEDNESS_ITEMS.forEach((item) => {
                  allRight[item.key] = { left: 0, right: 2 };
                });
                onUpdateRecord({
                  ...record,
                  scales: {
                    ...record.scales,
                    handedness: { ...record.scales.handedness, tasks: allRight },
                  },
                });
                triggerSaveFeedback();
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold border border-teal-200 transition"
            >
              一键全设右利手(常用)
            </button>
            {hasHandednessStarted && (
              <button
                type="button"
                onClick={() => {
                  onUpdateRecord({
                    ...record,
                    scales: {
                      ...record.scales,
                      handedness: { ...record.scales.handedness, tasks: {} },
                    },
                  });
                  triggerSaveFeedback();
                }}
                className="text-[11px] px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-500 transition"
              >
                重置清空
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5 text-xs">
          {EDINBURGH_HANDEDNESS_ITEMS.map((item) => {
            const task = record.scales.handedness?.tasks?.[item.key];
            const isLeftSelected = task?.left === 2 && task?.right === 0;
            const isBothSelected = task?.left === 1 && task?.right === 1;
            const isRightSelected = task?.right === 2 && task?.left === 0;

            return (
              <div
                key={item.key}
                className={`space-y-1.5 rounded-xl border p-3 transition ${
                  task
                    ? "border-slate-200 bg-slate-50"
                    : "border-dashed border-slate-200 bg-white"
                }`}
              >
                <span className="block font-semibold text-slate-800">{item.name}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      updateHandednessItem(item.key, "left", 2);
                      updateHandednessItem(item.key, "right", 0);
                    }}
                    className={`flex-1 rounded py-1 text-[11px] font-medium transition cursor-pointer ${
                      isLeftSelected
                        ? "bg-indigo-600 text-white font-bold"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
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
                    className={`flex-1 rounded py-1 text-[11px] font-medium transition cursor-pointer ${
                      isBothSelected
                        ? "bg-indigo-600 text-white font-bold"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
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
                    className={`flex-1 rounded py-1 text-[11px] font-medium transition cursor-pointer ${
                      isRightSelected
                        ? "bg-teal-600 text-white font-bold"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
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

      {/* 2. H2 MMSE 30-Point Complete Battery */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 font-bold text-blue-600">
              H2
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                H2. 简易精神状态检查 (MMSE, 满分 30 分)
              </h3>
              <p className="text-xs text-slate-500">
                包含时间/地点定向力、即刻记忆、连续减7计算、延迟回忆、命名与复述、三步指令及双五边形临摹
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="block text-xs text-slate-400">MMSE 得分</span>
            <span className={`font-mono text-lg font-bold ${isMmseStarted ? "text-blue-600" : "text-slate-400"}`}>
              {isMmseStarted ? `${mmseResult.score} / 30 分` : "-- / 30 分"}
            </span>
            <span className="block text-[10px] text-slate-400">
              {isMmseStarted ? `已录入 ${mmseAnsweredCount}/30 项` : "(未录入 / 待测评)"}
            </span>
          </div>
        </div>

        {/* MMSE Subdomains */}
        <div className="space-y-5 text-xs">
          {/* Section 1: Orientation */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-bold uppercase tracking-wider text-slate-700">
                1. 时间与地点定向力 (共 10 分，点击切换正确/错误)
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {[
                { key: "2.1", label: "2.1 今年是哪一年？" },
                { key: "2.2", label: "2.2 现在是什么季节？" },
                { key: "2.3", label: "2.3 现在是几月？" },
                { key: "2.4", label: "2.4 今天是几号？" },
                { key: "2.5", label: "2.5 星期几？" },
                { key: "2.6", label: "2.6 什么城市？" },
                { key: "2.7", label: "2.7 城区/区县？" },
                { key: "2.8", label: "2.8 街道/乡镇？" },
                { key: "2.9", label: "2.9 第几层楼？" },
                { key: "2.10", label: "2.10 什么地方/医院？" },
              ].map((item) => {
                const rawVal = record.scales.mmse.items?.[item.key];
                const isAnswered = rawVal !== undefined;
                const isCorrect = rawVal === 1;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      if (!isAnswered) updateMMSEItem(item.key, 1);
                      else if (isCorrect) updateMMSEItem(item.key, 0);
                      else updateMMSEItem(item.key, 1);
                    }}
                    className={`flex items-center justify-between rounded-xl border p-2.5 text-left transition cursor-pointer ${
                      !isAnswered
                        ? "border-dashed border-slate-200 bg-white text-slate-500 hover:border-teal-300"
                        : isCorrect
                        ? "border-teal-500 bg-teal-50 font-semibold text-teal-900"
                        : "border-slate-300 bg-slate-100 text-slate-700"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                        !isAnswered
                          ? "bg-slate-100 text-slate-400 border border-slate-200"
                          : isCorrect
                          ? "bg-teal-600 text-white"
                          : "bg-rose-500 text-white"
                      }`}
                    >
                      {!isAnswered ? "--" : isCorrect ? "1分" : "0分"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Immediate Registration */}
          <div className="border-t border-slate-100 pt-3">
            <h4 className="mb-2 font-bold uppercase tracking-wider text-slate-700">
              2. 即刻三词记忆 (共 3 分)：“皮球”、“国旗”、“树木”
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "2.11", label: "2.11 皮球" },
                { key: "2.12", label: "2.12 国旗" },
                { key: "2.13", label: "2.13 树木" },
              ].map((item) => {
                const rawVal = record.scales.mmse.items?.[item.key];
                const isAnswered = rawVal !== undefined;
                const isCorrect = rawVal === 1;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      if (!isAnswered) updateMMSEItem(item.key, 1);
                      else if (isCorrect) updateMMSEItem(item.key, 0);
                      else updateMMSEItem(item.key, 1);
                    }}
                    className={`flex items-center justify-between rounded-xl border p-2.5 text-left transition cursor-pointer ${
                      !isAnswered
                        ? "border-dashed border-slate-200 bg-white text-slate-500 hover:border-teal-300"
                        : isCorrect
                        ? "border-teal-500 bg-teal-50 font-semibold text-teal-900"
                        : "border-slate-300 bg-slate-100 text-slate-700"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                        !isAnswered
                          ? "bg-slate-100 text-slate-400 border border-slate-200"
                          : isCorrect
                          ? "bg-teal-600 text-white"
                          : "bg-rose-500 text-white"
                      }`}
                    >
                      {!isAnswered ? "--" : isCorrect ? "1分" : "0分"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Serial 7s / Calculation */}
          <div className="border-t border-slate-100 pt-3">
            <h4 className="mb-2 font-bold uppercase tracking-wider text-slate-700">
              3. 注意力与计算力 (共 5 分)：100-7 连续递减 5 次
            </h4>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {[
                { key: "2.14", label: "2.14 [93]" },
                { key: "2.15", label: "2.15 [86]" },
                { key: "2.16", label: "2.16 [79]" },
                { key: "2.17", label: "2.17 [72]" },
                { key: "2.18", label: "2.18 [65]" },
              ].map((item) => {
                const rawVal = record.scales.mmse.items?.[item.key];
                const isAnswered = rawVal !== undefined;
                const isCorrect = rawVal === 1;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      if (!isAnswered) updateMMSEItem(item.key, 1);
                      else if (isCorrect) updateMMSEItem(item.key, 0);
                      else updateMMSEItem(item.key, 1);
                    }}
                    className={`flex items-center justify-between rounded-xl border p-2.5 text-left transition cursor-pointer ${
                      !isAnswered
                        ? "border-dashed border-slate-200 bg-white text-slate-500 hover:border-teal-300"
                        : isCorrect
                        ? "border-teal-500 bg-teal-50 font-semibold text-teal-900"
                        : "border-slate-300 bg-slate-100 text-slate-700"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                        !isAnswered
                          ? "bg-slate-100 text-slate-400 border border-slate-200"
                          : isCorrect
                          ? "bg-teal-600 text-white"
                          : "bg-rose-500 text-white"
                      }`}
                    >
                      {!isAnswered ? "--" : isCorrect ? "1分" : "0分"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Delayed Recall */}
          <div className="border-t border-slate-100 pt-3">
            <h4 className="mb-2 font-bold uppercase tracking-wider text-slate-700">
              4. 延迟回忆 (共 3 分)：请回忆刚才说的 3 个词
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "2.19", label: "2.19 皮球 (回忆)" },
                { key: "2.20", label: "2.20 国旗 (回忆)" },
                { key: "2.21", label: "2.21 树木 (回忆)" },
              ].map((item) => {
                const rawVal = record.scales.mmse.items?.[item.key];
                const isAnswered = rawVal !== undefined;
                const isCorrect = rawVal === 1;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      if (!isAnswered) updateMMSEItem(item.key, 1);
                      else if (isCorrect) updateMMSEItem(item.key, 0);
                      else updateMMSEItem(item.key, 1);
                    }}
                    className={`flex items-center justify-between rounded-xl border p-2.5 text-left transition cursor-pointer ${
                      !isAnswered
                        ? "border-dashed border-slate-200 bg-white text-slate-500 hover:border-teal-300"
                        : isCorrect
                        ? "border-teal-500 bg-teal-50 font-semibold text-teal-900"
                        : "border-slate-300 bg-slate-100 text-slate-700"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                        !isAnswered
                          ? "bg-slate-100 text-slate-400 border border-slate-200"
                          : isCorrect
                          ? "bg-teal-600 text-white"
                          : "bg-rose-500 text-white"
                      }`}
                    >
                      {!isAnswered ? "--" : isCorrect ? "1分" : "0分"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Language & Praxis */}
          <div className="border-t border-slate-100 pt-3">
            <h4 className="mb-2 font-bold uppercase tracking-wider text-slate-700">
              5. 语言功能与指令操作 (共 8 分)
            </h4>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { key: "2.22", label: "2.22 命名: 手表" },
                { key: "2.23", label: "2.23 命名: 铅笔" },
                { key: "2.24", label: "2.24 复述‘齐心协力拉紧绳’" },
                { key: "2.25", label: "2.25 读并执行‘闭上眼睛’" },
                { key: "2.26", label: "2.26 右手拿纸" },
                { key: "2.27", label: "2.27 双手对折" },
                { key: "2.28", label: "2.28 放到左腿上" },
                { key: "2.29", label: "2.29 独立写出完整句子" },
              ].map((item) => {
                const rawVal = record.scales.mmse.items?.[item.key];
                const isAnswered = rawVal !== undefined;
                const isCorrect = rawVal === 1;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      if (!isAnswered) updateMMSEItem(item.key, 1);
                      else if (isCorrect) updateMMSEItem(item.key, 0);
                      else updateMMSEItem(item.key, 1);
                    }}
                    className={`flex items-center justify-between rounded-xl border p-2.5 text-left transition cursor-pointer ${
                      !isAnswered
                        ? "border-dashed border-slate-200 bg-white text-slate-500 hover:border-teal-300"
                        : isCorrect
                        ? "border-teal-500 bg-teal-50 font-semibold text-teal-900"
                        : "border-slate-300 bg-slate-100 text-slate-700"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                        !isAnswered
                          ? "bg-slate-100 text-slate-400 border border-slate-200"
                          : isCorrect
                          ? "bg-teal-600 text-white"
                          : "bg-rose-500 text-white"
                      }`}
                    >
                      {!isAnswered ? "--" : isCorrect ? "1分" : "0分"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 6: Dual Pentagons Drawing */}
          <div className="border-t border-slate-100 pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-700">
                  6. 视空间结构临摹 (共 1 分)：双五边形交叉临摹
                </h4>
                <p className="text-xs text-slate-500">
                  评分标准：必须画出两个五边形（各5个角），且两图交叉形成一个四边形交叉区。
                </p>
              </div>
              {(() => {
                const val230 = record.scales.mmse.items?.["2.30"];
                const isAnswered230 = val230 !== undefined;
                const isCorrect230 = val230 === 1;
                return (
                  <button
                    type="button"
                    onClick={() => {
                      if (!isAnswered230) updateMMSEItem("2.30", 1);
                      else if (isCorrect230) updateMMSEItem("2.30", 0);
                      else updateMMSEItem("2.30", 1);
                    }}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition shadow-2xs cursor-pointer ${
                      !isAnswered230
                        ? "bg-slate-100 text-slate-500 border border-dashed border-slate-300 hover:bg-slate-200"
                        : isCorrect230
                        ? "bg-teal-600 text-white hover:bg-teal-700"
                        : "bg-rose-500 text-white hover:bg-rose-600"
                    }`}
                  >
                    {!isAnswered230 ? "点击判定: 待评定" : isCorrect230 ? "✓ 临摹准确 (1分)" : "✗ 存在错误 (0分)"}
                  </button>
                );
              })()}
            </div>

            <InteractiveCanvas
              title="MMSE 2.30 双五边形交叉绘图画板"
              instruction="请受试者在右侧白板临摹左侧的标准双五边形交叉图案。"
              referenceSvgType="dualPentagons"
              savedImage={record.scales.mmse.drawingImage}
              onSave={(img) => {
                onUpdateRecord({
                  ...record,
                  scales: {
                    ...record.scales,
                    mmse: { ...record.scales.mmse, drawingImage: img },
                  },
                });
                triggerSaveFeedback();
              }}
            />
          </div>
        </div>
      </div>

      {/* Action Bar & Save Feedback */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-teal-600" />
          <span className="text-xs font-bold text-slate-800">
            {isMmseStarted
              ? `已完成 ${mmseAnsweredCount} / 30 项测试，当前总得分：${mmseResult.score} 分`
              : "MMSE 题目尚未录入，请逐项点击评分"}
          </span>
          {saveToast && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md animate-fade-in">
              ✓ 云端实时保存成功
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const fullItems: Record<string, number> = {};
              for (let i = 1; i <= 30; i++) {
                fullItems[`2.${i}`] = 1;
              }
              onUpdateRecord({
                ...record,
                scales: {
                  ...record.scales,
                  mmse: { ...record.scales.mmse, items: fullItems },
                },
              });
              triggerSaveFeedback();
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
            title="一键将MMSE所有题目设为正确（常模满分），再针对性核减错误项"
          >
            一键全对(快速录入满分)
          </button>

          {isMmseStarted && (
            <button
              type="button"
              onClick={() => {
                onUpdateRecord({
                  ...record,
                  scales: {
                    ...record.scales,
                    mmse: { ...record.scales.mmse, items: {} },
                  },
                });
                triggerSaveFeedback();
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-rose-600 transition"
            >
              清空重做
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              triggerSaveFeedback();
              alert(`MMSE 量表测评数据已成功保存！当前得分：${mmseResult.score} 分 (${mmseResult.isAbnormal ? "低于常模界值" : "正常"})。已写入云端数据库。`);
            }}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>完成评定并提交保存</span>
          </button>
        </div>
      </div>
    </div>
  );
};
