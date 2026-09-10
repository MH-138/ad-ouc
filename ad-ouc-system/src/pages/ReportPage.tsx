import React from "react";
import {
  FileCheck,
  Printer,
  Sparkles,
  FileSpreadsheet,
  Layers,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import { SubjectRecord } from "../types/assessment";
import { SectionComprehensiveReport } from "../components/sections/SectionComprehensiveReport";

interface ReportPageProps {
  record: SubjectRecord;
  onOpenAiModal: () => void;
  onOpenPrintModal: () => void;
  onExportExcel: () => void;
  onNavigateToScales: () => void;
}

export const ReportPage: React.FC<ReportPageProps> = ({
  record,
  onOpenAiModal,
  onOpenPrintModal,
  onExportExcel,
  onNavigateToScales,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">
              综合诊断评估与随访决策中心
            </h1>
            <span className="rounded-md bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-700">
              宣武医院标准
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            受试者：<strong>{record.demographics?.name || "张建华"}</strong>（{record.demographics?.gender || "女"}，{record.demographics?.age || 71}岁，受教育{record.demographics?.educationYears || 12}年）· 期次：{record.visitCode || "W000"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onNavigateToScales}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <Layers className="h-4 w-4 text-slate-500" />
            <span>返回修改量表</span>
          </button>

          <button
            onClick={onOpenAiModal}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:from-indigo-700 hover:to-teal-700"
          >
            <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
            <span>AI 深度诊断推理</span>
          </button>

          <button
            onClick={onExportExcel}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-2xs hover:bg-emerald-100"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>导出科研 Excel</span>
          </button>

          <button
            onClick={onOpenPrintModal}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800"
          >
            <Printer className="h-4 w-4 text-slate-300" />
            <span>打印临床报告单</span>
          </button>
        </div>
      </div>

      {/* Main Report Body */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <SectionComprehensiveReport
          record={record}
          onOpenAiModal={onOpenAiModal}
          onOpenPrintModal={onOpenPrintModal}
        />
      </div>
    </div>
  );
};
