import React, { useState, useEffect } from "react";
import { SubjectRecord } from "../../types/assessment";
import { calculateSTT, calculateMES } from "../../utils/scoringCalculators";
import { Clock, Play, Pause, RotateCcw, AlertTriangle, CheckCircle2, Zap } from "lucide-react";

interface Props {
  record: SubjectRecord;
  onChange: (updated: Partial<SubjectRecord>) => void;
}

export const SectionExecutiveAttention: React.FC<Props> = ({ record, onChange }) => {
  const eduYears = record.demographics?.educationYears || 0;
  const age = record.demographics?.age || 65;

  const sttResult = calculateSTT(record.scales?.stt || ({} as any), eduYears, age);
  const mesResult = calculateMES(record.scales?.mes || ({} as any), eduYears);

  // Interactive Stopwatch for STT-A / STT-B
  const [stopwatchTarget, setStopwatchTarget] = useState<"sttATestSeconds" | "sttBTestSeconds" | null>(null);
  const [stopwatchSec, setStopwatchSec] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchSec((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStopwatchRunning]);

  const handleStopwatchSave = () => {
    if (stopwatchTarget) {
      const currentStt = record.scales?.stt || ({} as any);
      onChange({
        scales: {
          ...record.scales,
          stt: {
            ...currentStt,
            [stopwatchTarget]: stopwatchSec,
          },
        },
      });
    }
    setIsStopwatchRunning(false);
  };

  const updateSTT = (patch: Partial<SubjectRecord["scales"]["stt"]>) => {
    const currentStt = record.scales?.stt || ({} as any);
    onChange({
      scales: {
        ...record.scales,
        stt: { ...currentStt, ...patch },
      },
    });
  };

  const updateMES = (patch: Partial<SubjectRecord["scales"]["mes"]>) => {
    const currentMes = record.scales?.mes || ({} as any);
    onChange({
      scales: {
        ...record.scales,
        mes: { ...currentMes, ...patch },
      },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-teal-700 font-bold">
            执行功能、信息处理速度与工作记忆评估
          </div>
          <h2 className="text-lg font-bold mt-1 text-slate-900">
            H6、H8: 形状连线测验 (STT-A/B) 与 记忆与执行功能量表 (MES)
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 block">STT-B 耗时 ({sttResult.group})</span>
            <span
              className={`text-sm font-bold font-mono ${
                sttResult.isBAbnormal ? "text-amber-700" : "text-emerald-700"
              }`}
            >
              {record.scales.stt.sttBTestSeconds} 秒 {sttResult.isBAbnormal ? "(异常 ≥" + sttResult.bCutoff + "s)" : "(正常)"}
            </span>
          </div>
          <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 block">MES 总分 ({mesResult.eduGroup})</span>
            <span
              className={`text-sm font-bold font-mono ${
                mesResult.isAbnormal ? "text-amber-700" : "text-emerald-700"
              }`}
            >
              {mesResult.score} / 100 {mesResult.isAbnormal ? "(异常 ≤" + mesResult.cutoff + "分)" : "(正常)"}
            </span>
          </div>
        </div>
      </div>

      {/* H6. 形状连线测验 (STT-A & STT-B) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              H6
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">
                H6. 形状连线测验 (Shape Trail Test, STT-A 与 STT-B)
              </h3>
              <p className="text-xs text-slate-500">
                针对中文非英语母语老人的连线测验（圆圈和方块交叉交替连线 1~25），包含练习期与正试期耗时秒数
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">STT 常模判定</span>
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
              年龄组: {sttResult.group} (A切点: ≥{sttResult.aCutoff}s, B切点: ≥{sttResult.bCutoff}s)
            </span>
          </div>
        </div>

        {/* Stopwatch Bar */}
        <div className="p-4 bg-purple-50/80 border border-purple-200 text-slate-900 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">内置连线精准秒表</span>
              <span className="font-mono text-2xl font-bold tracking-widest text-purple-800">
                {stopwatchSec} <span className="text-xs font-normal text-slate-500">秒 (s)</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                setStopwatchTarget("sttATestSeconds");
                setIsStopwatchRunning(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-2xs"
            >
              为 STT-A 计时
            </button>
            <button
              type="button"
              onClick={() => {
                setStopwatchTarget("sttBTestSeconds");
                setIsStopwatchRunning(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-2xs"
            >
              为 STT-B 计时
            </button>
            {isStopwatchRunning ? (
              <button
                type="button"
                onClick={handleStopwatchSave}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center space-x-1 shadow-2xs"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>停止并填入</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStopwatchSec(0)}
                className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
                title="清零秒表"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* STT-A */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm">STT-A 测验 (纯数字顺序 1~25)</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                sttResult.isAAbnormal ? "bg-red-100 text-red-700" : "bg-teal-100 text-teal-700"
              }`}>
                {sttResult.isAAbnormal ? "异常" : "正常"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-slate-600 block mb-1">练习期耗时 (秒)</label>
                <input
                  type="number"
                  value={record.scales.stt.sttAPracticeSeconds}
                  onChange={(e) => updateSTT({ sttAPracticeSeconds: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded bg-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1">正试期耗时 (秒) *</label>
                <input
                  type="number"
                  value={record.scales.stt.sttATestSeconds}
                  onChange={(e) => updateSTT({ sttATestSeconds: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded bg-white font-mono font-bold text-base text-purple-700"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1">主试提示次数</label>
                <input
                  type="number"
                  value={record.scales.stt.sttAPrompts || 0}
                  onChange={(e) => updateSTT({ sttAPrompts: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* STT-B */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm">STT-B 测验 (圆1-方2-圆3-方4 交替)</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                sttResult.isBAbnormal ? "bg-red-100 text-red-700" : "bg-teal-100 text-teal-700"
              }`}>
                {sttResult.isBAbnormal ? "异常" : "正常"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-slate-600 block mb-1">练习期耗时 (秒)</label>
                <input
                  type="number"
                  value={record.scales.stt.sttBPracticeSeconds}
                  onChange={(e) => updateSTT({ sttBPracticeSeconds: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded bg-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1">正试期耗时 (秒) *</label>
                <input
                  type="number"
                  value={record.scales.stt.sttBTestSeconds}
                  onChange={(e) => updateSTT({ sttBTestSeconds: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded bg-white font-mono font-bold text-base text-purple-700"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1">主试提示次数</label>
                <input
                  type="number"
                  value={record.scales.stt.sttBPrompts || 0}
                  onChange={(e) => updateSTT({ sttBPrompts: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded bg-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* H8. 记忆与执行功能量表 (MES, 满分 100 分) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              H8
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">
                H8. 记忆与执行功能量表 (MES, 华山医院郭起浩教授制定, 100分制)
              </h3>
              <p className="text-xs text-slate-500">
                涵盖即刻与延迟长短句、厨房用品流畅性、敲击相反抑制、手指运动构音动作、Go/No-go 范式
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">MES 总分 / 常模切点</span>
            <span className="text-lg font-bold font-mono text-indigo-600">
              {mesResult.score} / 100{" "}
              <span className="text-xs text-slate-500 font-normal">(切点 ≤ {mesResult.cutoff} 分)</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <label className="font-bold text-slate-800 block">1. 即刻句子回忆 (0-10分)</label>
            <input
              type="number"
              min={0}
              max={10}
              value={record.scales.mes.q1ImmediateSentence}
              onChange={(e) => updateMES({ q1ImmediateSentence: Number(e.target.value) })}
              className="w-full p-2 border border-slate-300 rounded bg-white font-mono font-bold"
            />
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <label className="font-bold text-slate-800 block">2. 厨房用品流畅性 (0-10分)</label>
            <input
              type="number"
              min={0}
              max={10}
              value={record.scales.mes.q2KitchenFluency}
              onChange={(e) => updateMES({ q2KitchenFluency: Number(e.target.value) })}
              className="w-full p-2 border border-slate-300 rounded bg-white font-mono font-bold"
            />
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <label className="font-bold text-slate-800 block">3. 敲击相反反应 (0-10分)</label>
            <input
              type="number"
              min={0}
              max={10}
              value={record.scales.mes.q3TappingContradiction}
              onChange={(e) => updateMES({ q3TappingContradiction: Number(e.target.value) })}
              className="w-full p-2 border border-slate-300 rounded bg-white font-mono font-bold"
            />
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <label className="font-bold text-slate-800 block">4. 短延迟回忆 (0-10分)</label>
            <input
              type="number"
              min={0}
              max={10}
              value={record.scales.mes.q4ShortDelay}
              onChange={(e) => updateMES({ q4ShortDelay: Number(e.target.value) })}
              className="w-full p-2 border border-slate-300 rounded bg-white font-mono font-bold"
            />
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <label className="font-bold text-slate-800 block">5. 手指运动行为动作 (0-20分)</label>
            <input
              type="number"
              min={0}
              max={20}
              value={record.scales.mes.q5FingerMotorPraxis}
              onChange={(e) => updateMES({ q5FingerMotorPraxis: Number(e.target.value) })}
              className="w-full p-2 border border-slate-300 rounded bg-white font-mono font-bold"
            />
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <label className="font-bold text-slate-800 block">6. 敲击 Go/No-go (0-10分)</label>
            <input
              type="number"
              min={0}
              max={10}
              value={record.scales.mes.q6TappingGoNoGo}
              onChange={(e) => updateMES({ q6TappingGoNoGo: Number(e.target.value) })}
              className="w-full p-2 border border-slate-300 rounded bg-white font-mono font-bold"
            />
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 md:col-span-2">
            <label className="font-bold text-slate-800 block">7. 长延迟线索回忆 (0-30分)</label>
            <input
              type="number"
              min={0}
              max={30}
              value={record.scales.mes.q7LongDelay}
              onChange={(e) => updateMES({ q7LongDelay: Number(e.target.value) })}
              className="w-full p-2 border border-slate-300 rounded bg-white font-mono font-bold text-indigo-700"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
