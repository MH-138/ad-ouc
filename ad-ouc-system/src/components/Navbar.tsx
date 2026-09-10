import React from "react";
import {
  Brain,
  FileSpreadsheet,
  Printer,
  Sparkles,
  Timer,
  UserPlus,
  Users,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Layers,
  MessageSquare,
  FileCheck,
} from "lucide-react";
import { SubjectRecord } from "../types/assessment";

export type AppPageId = "patients" | "chat" | "scales" | "report" | "tools" | "guide";

interface NavbarProps {
  record?: SubjectRecord;
  activePage: AppPageId;
  onChangePage: (page: AppPageId) => void;
  onOpenAiModal?: () => void;
  onOpenPrintModal?: () => void;
  onExportExcel?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  record,
  activePage,
  onChangePage,
  onOpenAiModal,
  onOpenPrintModal,
  onExportExcel,
}) => {
  const patientName = record?.demographics?.name || "张建华";
  const visitCode = record?.visitCode || "W000";

  const NAV_ITEMS: { id: AppPageId; label: string; icon: React.ElementType }[] = [
    { id: "patients", label: "受试者档案", icon: Users },
    { id: "chat", label: "适老对话自评", icon: MessageSquare },
    { id: "scales", label: "量表测评中心", icon: Layers },
    { id: "report", label: "综合诊断报告", icon: FileCheck },
    { id: "tools", label: "测验计时工具", icon: Timer },
    { id: "guide", label: "临床规范指南", icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900 text-white shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand & Protocol Tag */}
          <div
            onClick={() => onChangePage("patients")}
            className="flex cursor-pointer items-center space-x-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-500 to-blue-600 shadow-md">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold tracking-tight sm:text-lg">
                  宣武医院 AD-SCD 测评系统
                </span>
              </div>
              <p className="hidden font-mono text-[11px] text-slate-400 sm:block">
                国家神经系统疾病临床医学研究中心
              </p>
            </div>
          </div>

          {/* Center: Main Page Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 rounded-xl bg-slate-800 p-1 border border-slate-700/60">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => onChangePage(item.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    isActive
                      ? "bg-teal-600 text-white shadow-xs"
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: Active Patient Badge & Quick Export */}
          <div className="flex items-center space-x-2.5">
            {/* Active Patient Pill */}
            <div
              onClick={() => onChangePage("patients")}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300 hover:border-teal-500/50"
              title="点击查看受试者档案"
            >
              <div className="h-2 w-2 rounded-full bg-teal-400" />
              <span className="font-semibold text-white">{patientName}</span>
              <span className="text-[11px] text-slate-400 font-mono">({visitCode})</span>
            </div>

            {/* Quick Export Excel */}
            {onExportExcel && (
              <button
                id="btn-nav-export-excel"
                onClick={onExportExcel}
                className="hidden sm:flex items-center space-x-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-900/60"
                title="一键导出科研 Excel 数据集"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                <span>导出Excel</span>
              </button>
            )}

            {/* AI Diagnosis */}
            {onOpenAiModal && (
              <button
                id="btn-nav-ai-diagnosis"
                onClick={onOpenAiModal}
                className="flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-teal-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:from-indigo-500 hover:to-teal-500"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                <span className="hidden sm:inline">AI 诊断</span>
              </button>
            )}

            {/* Print Report */}
            {onOpenPrintModal && (
              <button
                id="btn-nav-print-report"
                onClick={onOpenPrintModal}
                className="hidden lg:flex items-center space-x-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
                title="生成并打印临床报告单"
              >
                <Printer className="h-3.5 w-3.5 text-slate-300" />
                <span>打印报告</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Page Navigation Dropdown/Bar */}
        <div className="flex md:hidden items-center gap-1 overflow-x-auto pb-2 pt-1 border-t border-slate-800">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangePage(item.id)}
                className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${
                  isActive ? "bg-teal-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
