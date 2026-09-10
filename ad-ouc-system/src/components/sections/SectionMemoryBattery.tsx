import React from "react";
import { SubjectRecord } from "../../types/assessment";
import { calculateAVLTH, calculateLogicalMemory } from "../../utils/scoringCalculators";
import { AVLT_WORDS_LIST, LOGICAL_MEMORY_STORY } from "../../data/assessmentStimuli";
import { Brain, CheckCircle2, Clock, Sparkles, Tag } from "lucide-react";

interface Props {
  record: SubjectRecord;
  onChange: (updated: Partial<SubjectRecord>) => void;
  onOpenTimerCenter: () => void;
}

export const SectionMemoryBattery: React.FC<Props> = ({ record, onChange, onOpenTimerCenter }) => {
  const eduYears = record.demographics.educationYears || 0;
  const age = record.demographics.age || 65;

  const avltResult = calculateAVLTH(record.scales.avltH, age, eduYears);
  const lmResult = calculateLogicalMemory(record.scales.logicalMemory, eduYears);

  const toggleWordInList = (
    trial: "n1Words" | "n2Words" | "n3Words" | "n4Delayed5MinWords" | "n5Delayed20MinWords",
    word: string
  ) => {
    const list = record.scales.avltH[trial] || [];
    const nextList = list.includes(word) ? list.filter((w) => w !== word) : [...list, word];
    onChange({
      scales: {
        ...record.scales,
        avltH: {
          ...record.scales.avltH,
          [trial]: nextList,
        },
      },
    });
  };

  const updateLogicalMemory = (patch: Partial<SubjectRecord["scales"]["logicalMemory"]>) => {
    onChange({
      scales: {
        ...record.scales,
        logicalMemory: {
          ...record.scales.logicalMemory,
          ...patch,
        },
      },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Summary Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-teal-700 font-bold">
            海马依赖性情景记忆核心评估 (AD 最早受损功能域)
          </div>
          <h2 className="text-lg font-bold mt-1 text-slate-900">
            H3: 华山版听觉词语学习测验 (AVLT-H) 与 逻辑记忆故事测验
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 block">AVLT N5 长延迟 ({avltResult.ageGroup})</span>
            <span
              className={`text-sm font-bold font-mono ${
                avltResult.isN5Abnormal ? "text-amber-700" : "text-emerald-700"
              }`}
            >
              {avltResult.n5Score} / 12 {avltResult.isN5Abnormal ? "(异常 ≤" + avltResult.n5Cutoff + ")" : "(正常)"}
            </span>
          </div>
          <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 block">逻辑记忆 30min 延时</span>
            <span
              className={`text-sm font-bold font-mono ${
                lmResult.isDelayedAbnormal ? "text-amber-700" : "text-emerald-700"
              }`}
            >
              {lmResult.delayedStoryUnits} / 25 {lmResult.isDelayedAbnormal ? "(异常 ≤" + lmResult.delayedCutoff + ")" : "(正常)"}
            </span>
          </div>
        </div>
      </div>

      {/* H3. AVLT-H 华山版听觉词语学习测验 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              H3
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">
                H3. 华山版听觉词语学习测验 (AVLT-H 12词学习与延迟回忆)
              </h3>
              <p className="text-xs text-slate-500">
                12个中文双字词（涵盖花卉、职业、服装3大语义分类）：大衣、司机、海棠、木工、长裤、百合、头巾、腊梅、士兵、玉兰、围巾、医生
              </p>
            </div>
          </div>

          <button
            onClick={onOpenTimerCenter}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition"
          >
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>打开 5min / 20min 倒计时器</span>
          </button>
        </div>

        {/* 12 Words Stimuli reference */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="text-xs font-bold text-slate-600 mb-2 flex items-center justify-between">
            <span>【12 个标准测试词语库】（点击下方各轮次回忆词语可直接勾选）</span>
            <span className="text-[11px] text-slate-500 font-normal">宣武多中心标准词表</span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1.5">
            {AVLT_WORDS_LIST.map((word, idx) => (
              <div
                key={word}
                className="p-1.5 bg-white border border-slate-200 rounded text-center text-xs font-medium text-slate-700 shadow-xs"
              >
                <span className="text-[10px] text-slate-400 block font-mono">#{idx + 1}</span>
                {word}
              </div>
            ))}
          </div>
        </div>

        {/* Trials N1 ~ N5 Table */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            N1 ~ N5 各轮次即刻与延迟回忆记录（点选受试者回忆出的词语）
          </h4>

          {[
            { key: "n1Words" as const, title: "第 1 次即刻回忆 (N1)", desc: "首轮听读后即刻回忆", color: "emerald" },
            { key: "n2Words" as const, title: "第 2 次即刻回忆 (N2)", desc: "第2轮听读后即刻回忆", color: "emerald" },
            { key: "n3Words" as const, title: "第 3 次即刻回忆 (N3)", desc: "第3轮听读后即刻回忆", color: "emerald" },
            { key: "n4Delayed5MinWords" as const, title: "5分钟短延迟回忆 (N4)", desc: "间隔5分钟后回忆 (无提示)", color: "amber" },
            { key: "n5Delayed20MinWords" as const, title: "20分钟长延迟回忆 (N5)", desc: "间隔20分钟后回忆 (核心常模指标)", color: "red" },
          ].map((trial) => {
            const currentRecalled = record.scales.avltH[trial.key] || [];
            return (
              <div key={trial.key} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800 text-sm">{trial.title}</span>
                    <span className="text-slate-500 text-[11px]">({trial.desc})</span>
                  </div>
                  <div className="font-mono font-bold text-sm text-emerald-700 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                    回忆得分: {currentRecalled.length} / 12 个词
                  </div>
                </div>

                {/* Word Chips Clicker */}
                <div className="flex flex-wrap gap-1.5">
                  {AVLT_WORDS_LIST.map((w) => {
                    const isSelected = currentRecalled.includes(w);
                    return (
                      <button
                        key={w}
                        type="button"
                        onClick={() => toggleWordInList(trial.key, w)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                          isSelected
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-white text-slate-700 border border-slate-300 hover:border-emerald-400"
                        }`}
                      >
                        {w} {isSelected && "✓"}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* N6 Semantic Cued Recall & N7 Recognition */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 text-sm block">N6. 语义线索回忆 (提供花卉、职业、服装线索)</span>
            <p className="text-slate-500 text-[11px]">
              对N5长延迟回忆未回忆出的词语，按分类提供提示：花卉类、职业类、服装类
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div>
                <label className="text-slate-600 block">花卉类回忆数</label>
                <input
                  type="number"
                  min={0}
                  max={4}
                  value={record.scales.avltH.n6CategoryCued?.flowers?.length || 0}
                  onChange={(e) =>
                    onChange({
                      scales: {
                        ...record.scales,
                        avltH: {
                          ...record.scales.avltH,
                          n6CategoryCued: {
                            ...record.scales.avltH.n6CategoryCued,
                            flowers: Array(Number(e.target.value)).fill("flower"),
                          },
                        },
                      },
                    })
                  }
                  className="w-full p-1.5 border border-slate-300 rounded bg-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-600 block">职业类回忆数</label>
                <input
                  type="number"
                  min={0}
                  max={4}
                  value={record.scales.avltH.n6CategoryCued?.occupations?.length || 0}
                  onChange={(e) =>
                    onChange({
                      scales: {
                        ...record.scales,
                        avltH: {
                          ...record.scales.avltH,
                          n6CategoryCued: {
                            ...record.scales.avltH.n6CategoryCued,
                            occupations: Array(Number(e.target.value)).fill("occupations"),
                          },
                        },
                      },
                    })
                  }
                  className="w-full p-1.5 border border-slate-300 rounded bg-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-600 block">服装类回忆数</label>
                <input
                  type="number"
                  min={0}
                  max={4}
                  value={record.scales.avltH.n6CategoryCued?.clothing?.length || 0}
                  onChange={(e) =>
                    onChange({
                      scales: {
                        ...record.scales,
                        avltH: {
                          ...record.scales.avltH,
                          n6CategoryCued: {
                            ...record.scales.avltH.n6CategoryCued,
                            clothing: Array(Number(e.target.value)).fill("clothing"),
                          },
                        },
                      },
                    })
                  }
                  className="w-full p-1.5 border border-slate-300 rounded bg-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 text-sm block">N7. 24 词再认辨认测验</span>
            <p className="text-slate-500 text-[11px]">
              包含 12 个目标词 + 12 个干扰词（同类/形近）。记录再认错误数 (虚报/漏报)
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <label className="text-slate-700 font-medium">再认错误数 (0-24):</label>
              <input
                type="number"
                min={0}
                max={24}
                value={record.scales.avltH.n7RecognitionErrors ?? 0}
                onChange={(e) =>
                  onChange({
                    scales: {
                      ...record.scales,
                      avltH: {
                        ...record.scales.avltH,
                        n7RecognitionErrors: Number(e.target.value),
                      },
                    },
                  })
                }
                className="w-24 p-1.5 border border-slate-300 rounded bg-white font-mono font-bold"
              />
              <span className="text-slate-500 text-[11px]">
                准确再认数: {24 - (record.scales.avltH.n7RecognitionErrors || 0)} / 24
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 逻辑记忆故事测验 (Logical Memory) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              LM
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">
                逻辑记忆测验 (Logical Memory 故事单元回忆，即刻与30分钟延时)
              </h3>
              <p className="text-xs text-slate-500">
                主试朗读包含25个核心故事单元的故事，受试者进行即刻回忆与30分钟延时回忆
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">30分钟延时得分 / 常模切点</span>
            <span className="text-lg font-bold font-mono text-teal-600">
              {lmResult.delayedStoryUnits} / 25{" "}
              <span className="text-xs text-slate-500 font-normal">(切点 ≤ {lmResult.delayedCutoff} 分)</span>
            </span>
          </div>
        </div>

        {/* Story Text Reference */}
        <div className="p-4 bg-amber-50/50 border border-amber-200/70 rounded-xl space-y-2 text-xs">
          <span className="font-bold text-amber-900 flex items-center space-x-1.5">
            <span>【宣武标准测验故事文本】</span>
          </span>
          <p className="text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-amber-100 font-serif">
            {LOGICAL_MEMORY_STORY.text}
          </p>
          <div className="text-[11px] text-amber-800">
            共包含 25 个故事细节单元及 8 个核心主题单元。
          </div>
        </div>

        {/* Immediate and Delayed score inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 text-sm block">1. 故事即刻回忆 (Immediate Recall)</span>
            <div className="space-y-2">
              <div>
                <label className="block text-slate-600 mb-1">即刻回忆故事单元数 (0-25分)</label>
                <input
                  type="number"
                  min={0}
                  max={25}
                  value={record.scales.logicalMemory.immediateStoryUnits}
                  onChange={(e) => updateLogicalMemory({ immediateStoryUnits: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded bg-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">即刻回忆主题单元数 (0-8分)</label>
                <input
                  type="number"
                  min={0}
                  max={8}
                  value={record.scales.logicalMemory.immediateThemeUnits || 0}
                  onChange={(e) => updateLogicalMemory({ immediateThemeUnits: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded bg-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 text-sm block">2. 故事 30分钟 延时回忆 (Delayed Recall)</span>
            <div className="space-y-2">
              <div>
                <label className="block text-slate-600 mb-1">30min 延时回忆故事单元数 (0-25分) *</label>
                <input
                  type="number"
                  min={0}
                  max={25}
                  value={record.scales.logicalMemory.delayed30MinStoryUnits}
                  onChange={(e) => updateLogicalMemory({ delayed30MinStoryUnits: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded bg-white font-mono font-bold text-teal-700"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">30min 延时回忆主题单元数 (0-8分)</label>
                <input
                  type="number"
                  min={0}
                  max={8}
                  value={record.scales.logicalMemory.delayed30MinThemeUnits || 0}
                  onChange={(e) => updateLogicalMemory({ delayed30MinThemeUnits: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded bg-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
