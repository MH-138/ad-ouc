import React from "react";
import {
  Calendar,
  TrendingDown,
  TrendingUp,
  Minus,
  AlertTriangle,
  PlusCircle,
  Clock,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { SubjectRecord } from "../types/assessment";

export interface VisitSnapshot {
  visitCode: string;
  visitName: string;
  evalDate: string;
  mmse: number;
  mocaB: number;
  scdQ9: number;
  cdr: number;
  diagnosis: string;
}

interface LongitudinalTimelineProps {
  currentRecord: SubjectRecord;
  onSelectVisit?: (visitCode: string) => void;
  onNewFollowupVisit?: () => void;
}

export const LongitudinalTimeline: React.FC<LongitudinalTimelineProps> = ({
  currentRecord,
  onSelectVisit,
  onNewFollowupVisit,
}) => {
  const evalDate = currentRecord.evalDate || "2026-08-27";

  // Calculate 12-month follow-up target date
  const baseDateObj = new Date(evalDate);
  const nextDueDateObj = new Date(baseDateObj);
  nextDueDateObj.setFullYear(baseDateObj.getFullYear() + 1);
  const nextDueDateStr = nextDueDateObj.toISOString().slice(0, 10);

  // Simulated multi-visit history for longitudinal tracking demonstration
  const visits: VisitSnapshot[] = [
    {
      visitCode: "W000",
      visitName: "基线入组期 (Baseline)",
      evalDate: evalDate,
      mmse: 28,
      mocaB: 26,
      scdQ9: 6,
      cdr: 0,
      diagnosis: "SCD (主观认知下降)",
    },
    {
      visitCode: "W052",
      visitName: "第1年随访 (Year 1)",
      evalDate: nextDueDateStr,
      mmse: 27,
      mocaB: 25,
      scdQ9: 7,
      cdr: 0.5,
      diagnosis: "SCD / aMCI 转化观察",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              纵向随访队列时间轴 (Longitudinal Cohort Timeline)
            </h3>
            <p className="text-xs text-slate-500">
              追踪认知演变轨迹 · 早期预警 SCD 向 aMCI / AD 的临床转化
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>预计下次随访：{nextDueDateStr}</span>
          </div>
          {onNewFollowupVisit && (
            <button
              onClick={onNewFollowupVisit}
              className="flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-teal-700"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>新增随访期次</span>
            </button>
          )}
        </div>
      </div>

      {/* Timeline nodes */}
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visits.map((v, idx) => {
          const isCurrent = v.visitCode === (currentRecord.visitCode || "W000");
          return (
            <div
              key={v.visitCode}
              onClick={() => onSelectVisit?.(v.visitCode)}
              className={`relative cursor-pointer rounded-xl border p-4 transition ${
                isCurrent
                  ? "border-teal-500 bg-teal-50/40 shadow-xs"
                  : "border-slate-200 bg-slate-50/50 hover:border-teal-300 hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                    isCurrent ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {v.visitCode}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Calendar className="h-3.5 w-3.5" />
                  {v.evalDate}
                </span>
              </div>

              <h4 className="mt-2 text-sm font-bold text-slate-800">{v.visitName}</h4>
              <p className="mt-0.5 text-xs font-medium text-teal-700">{v.diagnosis}</p>

              {/* Mini metric indicators */}
              <div className="mt-3 grid grid-cols-4 gap-1.5 rounded-lg bg-white/80 p-2 text-center text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">MMSE</div>
                  <div className="font-bold text-slate-800">{v.mmse}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">MoCA-B</div>
                  <div className="font-bold text-slate-800">{v.mocaB}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">SCD-Q9</div>
                  <div className="font-bold text-amber-600">{v.scdQ9}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">CDR</div>
                  <div className="font-bold text-slate-800">{v.cdr}</div>
                </div>
              </div>

              {idx > 0 && (
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>比对基线趋势:</span>
                  <span className="flex items-center gap-0.5 font-semibold text-rose-600">
                    <TrendingDown className="h-3.5 w-3.5" /> MMSE -1分
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Future scheduled slot */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-4 text-center">
          <Sparkles className="h-6 w-6 text-teal-500" />
          <h5 className="mt-2 text-xs font-bold text-slate-700">第2年纵向随访 (W104)</h5>
          <p className="mt-1 text-[11px] text-slate-400">
            预计时间：{baseDateObj.getFullYear() + 2}-{String(baseDateObj.getMonth() + 1).padStart(2, "0")}-{String(baseDateObj.getDate()).padStart(2, "0")}
          </p>
          <span className="mt-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-500">
            到期自动通知提醒
          </span>
        </div>
      </div>
    </div>
  );
};
