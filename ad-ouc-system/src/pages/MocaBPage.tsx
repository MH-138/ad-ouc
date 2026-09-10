import React, { useState } from "react";
import { SubjectRecord } from "../types/assessment";
import { calculateMoCAB } from "../utils/scoringCalculators";
import { Brain, CheckCircle2, AlertTriangle, Eye, Clock, HelpCircle, Save } from "lucide-react";
import { InteractiveCanvas } from "../components/InteractiveCanvas";

interface MocaBPageProps {
  record: SubjectRecord;
  onUpdateRecord: (record: SubjectRecord) => void;
}

export const MocaBPage: React.FC<MocaBPageProps> = ({ record, onUpdateRecord }) => {
  const [saveToast, setSaveToast] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  const eduYears = record.demographics.educationYears || 0;
  const mocaData = record.scales.mocaB || {};

  const hasMocaStarted = Boolean(
    record.scales.mocaB &&
      (record.scales.mocaB.executiveTrail !== undefined ||
        record.scales.mocaB.fluencyFruit !== undefined ||
        record.scales.mocaB.orientation !== undefined ||
        record.scales.mocaB.calculation13Yuan !== undefined ||
        record.scales.mocaB.abstraction !== undefined ||
        record.scales.mocaB.delayedRecall !== undefined ||
        record.scales.mocaB.visualPerception10Obj !== undefined ||
        record.scales.mocaB.naming4Animals !== undefined ||
        record.scales.mocaB.attentionDigitsWhite !== undefined ||
        record.scales.mocaB.attentionDigitsBlack !== undefined)
  );

  const mocaResult = calculateMoCAB(mocaData, eduYears);

  const triggerSaveFeedback = () => {
    const timeStr = new Date().toLocaleTimeString();
    setLastSavedTime(timeStr);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const updateMoCABField = (field: keyof SubjectRecord["scales"]["mocaB"], val: number | undefined) => {
    onUpdateRecord({
      ...record,
      scales: {
        ...record.scales,
        mocaB: { ...record.scales.mocaB, [field]: val },
      },
    });
    triggerSaveFeedback();
  };

  return (
    <div className="space-y-6">
      {/* Score Overview Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                H15 · 适合中国低教育与老年人群
              </span>
              {lastSavedTime && (
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  已自动保存 ({lastSavedTime})
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              H15. 蒙特利尔认知评估基础量表 (MoCA-B 华山版)
            </h2>
            <p className="text-xs text-slate-500">
              依据中国老年人群教育程度调整切界分（文盲≤19，小学≤22，中学及以上≤24）
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-center">
              <span className="block text-[11px] text-slate-500">教育分层</span>
              <span className="font-mono text-sm font-bold text-slate-800">
                {mocaResult.eduGroup} ({eduYears} 年)
              </span>
            </div>
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 px-4 py-2 text-center">
              <span className="block text-[11px] text-indigo-800 font-medium">MoCA-B 得分</span>
              <span
                className={`font-mono text-base font-bold ${
                  !hasMocaStarted
                    ? "text-slate-400"
                    : mocaResult.isAbnormal
                    ? "text-amber-700"
                    : "text-emerald-700"
                }`}
              >
                {hasMocaStarted ? `${mocaResult.score} / 30 分` : "-- / 30 分"}
              </span>
              <span className="block text-[10px] text-slate-500">
                {!hasMocaStarted
                  ? "(待录入 / 未评定)"
                  : mocaResult.isAbnormal
                  ? `(异常 ≤${mocaResult.cutoff}分)`
                  : `(正常 >${mocaResult.cutoff}分)`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 9 Cognitive Domains Interactive Cards */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-6">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              MoCA-B 九大认知子域逐项评定 (共 30 分)
            </h3>
            <p className="text-xs text-slate-500">
              逐项评定受试者在执行、言语、定向、计算、抽象、记忆、视知觉、命名和注意力的表现
            </p>
          </div>
          {saveToast && (
            <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 animate-fade-in">
              ✓ 评定表已自动保存
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* 1. Executive Trails */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">1. 执行功能 (连线题: 1-点-2-两点...)</span>
              <span className="font-mono font-bold text-indigo-600">1 分</span>
            </div>
            <p className="text-[11px] text-slate-500">
              要求受试者在数字与对应点数间交替连线 (如 1 → 1点 → 2 → 2点...)
            </p>
            <select
              value={mocaData.executiveTrail !== undefined ? mocaData.executiveTrail : ""}
              onChange={(e) =>
                updateMoCABField("executiveTrail", e.target.value === "" ? undefined : Number(e.target.value))
              }
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs font-semibold text-slate-800"
            >
              <option value="">-- 请选择 --</option>
              <option value={1}>1 分 (完全按顺序无错误)</option>
              <option value={0}>0 分 (出现任何错误或无法完成)</option>
            </select>
          </div>

          {/* 2. Fluency Fruit */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">2. 词语流畅性 (1分钟说水果名称)</span>
              <span className="font-mono font-bold text-indigo-600">2 分</span>
            </div>
            <p className="text-[11px] text-slate-500">
              请受试者在 1 分钟内尽可能多地说出水果名称
            </p>
            <select
              value={mocaData.fluencyFruit !== undefined ? mocaData.fluencyFruit : ""}
              onChange={(e) =>
                updateMoCABField("fluencyFruit", e.target.value === "" ? undefined : Number(e.target.value))
              }
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs font-semibold text-slate-800"
            >
              <option value="">-- 请选择 --</option>
              <option value={2}>2 分 (≥ 13 个)</option>
              <option value={1}>1 分 (8 - 12 个)</option>
              <option value={0}>0 分 (≤ 7 个)</option>
            </select>
          </div>

          {/* 3. Orientation */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">3. 定向力 (时间/地点/城市)</span>
              <span className="font-mono font-bold text-indigo-600">6 分</span>
            </div>
            <p className="text-[11px] text-slate-500">
              时间 (±2h), 星期, 月份, 年份, 当前地点, 城市 (每对1项得1分)
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={6}
                placeholder="0 - 6"
                value={mocaData.orientation !== undefined ? mocaData.orientation : ""}
                onChange={(e) =>
                  updateMoCABField("orientation", e.target.value === "" ? undefined : Number(e.target.value))
                }
                className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs font-bold font-mono text-center text-slate-800"
              />
              <span className="text-slate-500 shrink-0">/ 6 分</span>
            </div>
          </div>

          {/* 4. Calculation (13 Yuan) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">4. 付款计算 (付 13 元的三种方法)</span>
              <span className="font-mono font-bold text-indigo-600">3 分</span>
            </div>
            <p className="text-[11px] text-slate-500">
              用 1元/5元/10元 纸币组合支付 13 元，要求给出不同方案
            </p>
            <select
              value={mocaData.calculation13Yuan !== undefined ? mocaData.calculation13Yuan : ""}
              onChange={(e) =>
                updateMoCABField("calculation13Yuan", e.target.value === "" ? undefined : Number(e.target.value))
              }
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs font-semibold text-slate-800"
            >
              <option value="">-- 请选择 --</option>
              <option value={3}>3 分 (给出 3 种正确付款方式)</option>
              <option value={2}>2 分 (给出 2 种正确付款方式)</option>
              <option value={1}>1 分 (给出 1 种正确付款方式)</option>
              <option value={0}>0 分 (无法正确给出)</option>
            </select>
          </div>

          {/* 5. Abstraction */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">5. 抽象概括能力</span>
              <span className="font-mono font-bold text-indigo-600">3 分</span>
            </div>
            <p className="text-[11px] text-slate-500">
              ①火车与轮船(交通工具) ②锣鼓与笛子(乐器) ③南与北(方向)
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={3}
                placeholder="0 - 3"
                value={mocaData.abstraction !== undefined ? mocaData.abstraction : ""}
                onChange={(e) =>
                  updateMoCABField("abstraction", e.target.value === "" ? undefined : Number(e.target.value))
                }
                className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs font-bold font-mono text-center text-slate-800"
              />
              <span className="text-slate-500 shrink-0">/ 3 分</span>
            </div>
          </div>

          {/* 6. Delayed Recall */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">6. 延迟回忆 (5词回忆)</span>
              <span className="font-mono font-bold text-indigo-600">5 分</span>
            </div>
            <p className="text-[11px] text-slate-500">
              桃花、萝卜、沙发、蓝色、筷子 (无提示自主回忆)
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={5}
                placeholder="0 - 5"
                value={mocaData.delayedRecall !== undefined ? mocaData.delayedRecall : ""}
                onChange={(e) =>
                  updateMoCABField("delayedRecall", e.target.value === "" ? undefined : Number(e.target.value))
                }
                className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs font-bold font-mono text-center text-slate-800"
              />
              <span className="text-slate-500 shrink-0">/ 5 分</span>
            </div>
          </div>

          {/* 7. Visual Perception (10 Overlapping Objects) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">7. 视知觉 (1分钟辨认10件重叠物品)</span>
              <span className="font-mono font-bold text-indigo-600">3 分</span>
            </div>
            <p className="text-[11px] text-slate-500">
              出示重叠图，让受试者找出剪刀、钥匙、梳子等 10 件物品
            </p>
            <select
              value={mocaData.visualPerception10Obj !== undefined ? mocaData.visualPerception10Obj : ""}
              onChange={(e) =>
                updateMoCABField("visualPerception10Obj", e.target.value === "" ? undefined : Number(e.target.value))
              }
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs font-semibold text-slate-800"
            >
              <option value="">-- 请选择 --</option>
              <option value={3}>3 分 (正确找出 9 - 10 个)</option>
              <option value={2}>2 分 (正确找出 6 - 8 个)</option>
              <option value={1}>1 分 (正确找出 4 - 5 个)</option>
              <option value={0}>0 分 (仅找出 ≤ 3 个)</option>
            </select>
          </div>

          {/* 8. Animal Naming */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">8. 动物辨认命名</span>
              <span className="font-mono font-bold text-indigo-600">4 分</span>
            </div>
            <p className="text-[11px] text-slate-500">
              出示斑马、孔雀、老虎、蝴蝶图片让受试者指认 (每对1得1分)
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={4}
                placeholder="0 - 4"
                value={mocaData.naming4Animals !== undefined ? mocaData.naming4Animals : ""}
                onChange={(e) =>
                  updateMoCABField("naming4Animals", e.target.value === "" ? undefined : Number(e.target.value))
                }
                className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs font-bold font-mono text-center text-slate-800"
              />
              <span className="text-slate-500 shrink-0">/ 4 分</span>
            </div>
          </div>

          {/* 9. Attention Digits */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">9. 注意力测验 (白底与黑底)</span>
              <span className="font-mono font-bold text-indigo-600">3 分</span>
            </div>
            <p className="text-[11px] text-slate-500">
              白底读圆形数字 (1分) + 黑底读圆和方形数字 (2分)
            </p>
            <div className="flex gap-2">
              <select
                value={mocaData.attentionDigitsWhite !== undefined ? mocaData.attentionDigitsWhite : ""}
                onChange={(e) =>
                  updateMoCABField("attentionDigitsWhite", e.target.value === "" ? undefined : Number(e.target.value))
                }
                className="flex-1 p-2 border border-slate-300 rounded-xl bg-white text-xs"
              >
                <option value="">-- 白底 --</option>
                <option value={1}>白底: 1分 (≤1错)</option>
                <option value={0}>白底: 0分 (≥2错)</option>
              </select>
              <select
                value={mocaData.attentionDigitsBlack !== undefined ? mocaData.attentionDigitsBlack : ""}
                onChange={(e) =>
                  updateMoCABField("attentionDigitsBlack", e.target.value === "" ? undefined : Number(e.target.value))
                }
                className="flex-1 p-2 border border-slate-300 rounded-xl bg-white text-xs"
              >
                <option value="">-- 黑底 --</option>
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
