import React, { useState } from "react";
import { SubjectRecord } from "../../types/assessment";
import { calculateBNT, calculateVFT } from "../../utils/scoringCalculators";
import { BNT_ITEMS_30 } from "../../data/assessmentStimuli";
import { MessageSquare, Clock, CheckCircle2, HelpCircle, Eye, Tag } from "lucide-react";

interface Props {
  record: SubjectRecord;
  onChange: (updated: Partial<SubjectRecord>) => void;
  onOpenTimerCenter: () => void;
}

export const SectionLanguageNaming: React.FC<Props> = ({ record, onChange, onOpenTimerCenter }) => {
  const eduYears = record.demographics.educationYears || 0;
  const age = record.demographics.age || 65;

  const bntResult = calculateBNT(record.scales.bnt.items, eduYears, age);
  const vftResult = calculateVFT(record.scales.vft, eduYears, age);

  const [activeBntItemIndex, setActiveBntItemIndex] = useState(0);

  const updateBntItem = (
    itemNo: number,
    state: { spontaneous?: boolean; semanticCueCorrect?: boolean; phonemicCueCorrect?: boolean; recognitionChoice?: number }
  ) => {
    const current = record.scales.bnt.items?.[itemNo] || {};
    onChange({
      scales: {
        ...record.scales,
        bnt: {
          ...record.scales.bnt,
          items: {
            ...record.scales.bnt.items,
            [itemNo]: { ...current, ...state },
          },
        },
      },
    });
  };

  const updateVft = (patch: Partial<SubjectRecord["scales"]["vft"]>) => {
    onChange({
      scales: {
        ...record.scales,
        vft: {
          ...record.scales.vft,
          ...patch,
        },
      },
    });
  };

  const currentBntItem = BNT_ITEMS_30[activeBntItemIndex];
  const currentBntScore = record.scales.bnt.items?.[currentBntItem.no];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-teal-700 font-bold">
            语言功能与语义网络提取能力评估
          </div>
          <h2 className="text-lg font-bold mt-1 text-slate-900">
            H4、H5: 词语流畅性测验 (VFT) 与 30项波士顿命名测验 (BNT)
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 block">VFT 1分钟总数 ({vftResult.group})</span>
            <span
              className={`text-sm font-bold font-mono ${
                vftResult.isAbnormal ? "text-amber-700" : "text-emerald-700"
              }`}
            >
              {vftResult.totalScore} 个 {vftResult.isAbnormal ? "(异常 ≤" + vftResult.cutoff + ")" : "(正常)"}
            </span>
          </div>
          <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 block">BNT 自发正确数 ({bntResult.group})</span>
            <span
              className={`text-sm font-bold font-mono ${
                bntResult.isAbnormal ? "text-amber-700" : "text-emerald-700"
              }`}
            >
              {bntResult.spontaneousScore} / 30 {bntResult.isAbnormal ? "(异常 ≤" + bntResult.cutoff + ")" : "(正常)"}
            </span>
          </div>
        </div>
      </div>

      {/* H4. 词语流畅性测验 (VFT) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              H4
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">H4. 词语流畅性测验 (VFT - 动物/水果 1分钟)</h3>
              <p className="text-xs text-slate-500">
                要求受试者在 1 分钟内尽可能多地说出动物（或水果）名称，按 0-15s, 16-30s, 31-45s, 46-60s 分段记录
              </p>
            </div>
          </div>
          <button
            onClick={onOpenTimerCenter}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 transition"
          >
            <Clock className="w-4 h-4 text-blue-600" />
            <span>开启 1分钟分段倒计时</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <label className="font-bold text-slate-700 block">第 1~15 秒正确数</label>
            <input
              type="number"
              min={0}
              value={record.scales.vft.t1_15s}
              onChange={(e) => updateVft({ t1_15s: Number(e.target.value) })}
              className="w-full p-2 border border-slate-300 rounded bg-white font-mono font-bold text-base text-blue-700"
            />
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <label className="font-bold text-slate-700 block">第 16~30 秒正确数</label>
            <input
              type="number"
              min={0}
              value={record.scales.vft.t16_30s}
              onChange={(e) => updateVft({ t16_30s: Number(e.target.value) })}
              className="w-full p-2 border border-slate-300 rounded bg-white font-mono font-bold text-base text-blue-700"
            />
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <label className="font-bold text-slate-700 block">第 31~45 秒正确数</label>
            <input
              type="number"
              min={0}
              value={record.scales.vft.t31_45s}
              onChange={(e) => updateVft({ t31_45s: Number(e.target.value) })}
              className="w-full p-2 border border-slate-300 rounded bg-white font-mono font-bold text-base text-blue-700"
            />
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <label className="font-bold text-slate-700 block">第 46~60 秒正确数</label>
            <input
              type="number"
              min={0}
              value={record.scales.vft.t46_60s}
              onChange={(e) => updateVft({ t46_60s: Number(e.target.value) })}
              className="w-full p-2 border border-slate-300 rounded bg-white font-mono font-bold text-base text-blue-700"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            受试者说出的词汇完整转录记录（用顿号或空格隔开）：
          </label>
          <textarea
            rows={2}
            value={record.scales.vft.wordsList || ""}
            onChange={(e) => updateVft({ wordsList: e.target.value })}
            className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="如：狗、猫、牛、羊、马、老虎、狮子、大象、兔子..."
          />
        </div>
      </div>

      {/* H5. 波士顿命名测验 (BNT 30张图卡片式交互) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              H5
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">
                H5. 波士顿命名测验 (BNT 30题卡片图谱与反应记录)
              </h3>
              <p className="text-xs text-slate-500">
                每幅图片限时 20 秒，记录自发命名正确(1分)、语义提示后正确、辨认选择等状态
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">自发正确总数 / 常模切点</span>
            <span className="text-lg font-bold font-mono text-indigo-600">
              {bntResult.spontaneousScore} / 30{" "}
              <span className="text-xs text-slate-500 font-normal">(切点 ≤ {bntResult.cutoff} 分)</span>
            </span>
          </div>
        </div>

        {/* 30 Items Quick Tab Selector */}
        <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
          {BNT_ITEMS_30.map((item, idx) => {
            const isDone = record.scales.bnt.items?.[item.no]?.spontaneous !== undefined;
            const isSuccess = record.scales.bnt.items?.[item.no]?.spontaneous === true;
            const isCurrent = activeBntItemIndex === idx;

            return (
              <button
                key={item.no}
                type="button"
                onClick={() => setActiveBntItemIndex(idx)}
                className={`w-9 h-8 rounded-lg text-xs font-mono font-medium flex items-center justify-center transition ${
                  isCurrent
                    ? "bg-indigo-600 text-white font-bold ring-2 ring-indigo-400"
                    : isSuccess
                    ? "bg-teal-100 text-teal-800 border border-teal-300"
                    : isDone
                    ? "bg-red-100 text-red-800 border border-red-300"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {item.no}
              </button>
            );
          })}
        </div>

        {/* Active BNT Item Detail Card */}
        <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Left: Target word & Cue information */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
                  第 {currentBntItem.no} 题 / 共 30 题
                </span>
                <h4 className="text-2xl font-bold text-slate-800 mt-1">
                  目标名称：【{currentBntItem.targetWord}】
                </h4>
              </div>
              <button
                onClick={onOpenTimerCenter}
                className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 hover:bg-slate-50"
              >
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>20s 限时计时</span>
              </button>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-slate-700">
                <Tag className="w-4 h-4 text-indigo-500" />
                <span className="font-semibold">功能语义提示语 (Semantic Cue)：</span>
                <span className="text-indigo-900 font-medium">“{currentBntItem.semanticCue}”</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                <HelpCircle className="w-4 h-4 text-amber-500" />
                <span className="font-semibold">四选一辨认选项 (Multiple Choice)：</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {currentBntItem.multipleChoice.map((choice, cIdx) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => updateBntItem(currentBntItem.no, { recognitionChoice: cIdx + 1 })}
                    className={`p-2 rounded-lg text-xs text-center border transition ${
                      currentBntScore?.recognitionChoice === cIdx + 1
                        ? "bg-indigo-600 text-white font-bold"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {cIdx + 1}. {choice}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={activeBntItemIndex === 0}
                onClick={() => setActiveBntItemIndex((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 disabled:opacity-40"
              >
                ← 上一题
              </button>
              <button
                type="button"
                disabled={activeBntItemIndex === BNT_ITEMS_30.length - 1}
                onClick={() => setActiveBntItemIndex((prev) => Math.min(BNT_ITEMS_30.length - 1, prev + 1))}
                className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 disabled:opacity-40"
              >
                下一题 →
              </button>
            </div>
          </div>

          {/* Card Right: Clinician Scoring Switcher */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-4 flex flex-col justify-between">
            <div>
              <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">
                评分与反应状态
              </h5>
              <div className="space-y-2.5 text-xs">
                <button
                  type="button"
                  onClick={() => updateBntItem(currentBntItem.no, { spontaneous: true })}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                    currentBntScore?.spontaneous === true
                      ? "bg-teal-50 border-teal-500 text-teal-900 font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}
                >
                  <span>1. 自发正确 (20秒内)</span>
                  <span className="px-2 py-0.5 rounded bg-teal-200/60 font-mono text-[11px]">得 1 分</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateBntItem(currentBntItem.no, { spontaneous: false, semanticCueCorrect: true })}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                    currentBntScore?.spontaneous === false && currentBntScore?.semanticCueCorrect === true
                      ? "bg-blue-50 border-blue-500 text-blue-900 font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}
                >
                  <span>2. 语义提示后正确</span>
                  <span className="px-2 py-0.5 rounded bg-blue-200/60 font-mono text-[11px]">0分(语义正常)</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateBntItem(currentBntItem.no, { spontaneous: false, semanticCueCorrect: false })}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                    currentBntScore?.spontaneous === false && currentBntScore?.semanticCueCorrect === false
                      ? "bg-red-50 border-red-500 text-red-900 font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}
                >
                  <span>3. 错误 / 需语音辨认</span>
                  <span className="px-2 py-0.5 rounded bg-red-200/60 font-mono text-[11px]">0分(找词困难)</span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              当前状态：{currentBntScore?.spontaneous ? "✅ 自发正确" : currentBntScore?.spontaneous === false ? "❌ 需提示/未答出" : "未评定"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
