import React, { useState } from "react";
import {
  Brain,
  Timer,
  Printer,
  FileSpreadsheet,
  PlusCircle,
  Users,
  MessageSquareHeart,
  ClipboardList,
  Activity,
  FileText,
  Wrench,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LayoutGrid,
  ArrowLeft,
  Dna,
  FileCheck,
  User,
  HeartPulse,
  UserCheck,
  Check,
  ShieldAlert,
  Search,
  Bell,
  Stethoscope,
  Camera,
} from "lucide-react";
import { SubjectRecord } from "../types/assessment";
import { AppPageId } from "../types/navigation";

interface AppLayoutProps {
  record: SubjectRecord | null;
  cohort: SubjectRecord[];
  onSelectPatient: (patientId: string) => void;
  onClearPatient?: () => void;
  activePage: AppPageId;
  onNavigate: (pageId: AppPageId) => void;
  onReturnToPortal: () => void;
  onOpenTimerModal: () => void;
  onOpenAiModal: () => void;
  onOpenPrintModal: () => void;
  onOpenUploadModal: () => void;
  onOpenApprovalModal?: () => void;
  pendingAiCount?: number;
  onExportExcel: () => void;
  onNewRecord: () => void;
  children: React.ReactNode;
}

// Doctor-side subsystems
export interface SubsystemConfig {
  id: string;
  code: string;
  name: string;
  shortName: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultPage: AppPageId;
  pageIds: AppPageId[];
  subPages?: { id: AppPageId; title: string; shortTitle: string; code: string }[];
}

export const SYSTEM_SECTIONS: SubsystemConfig[] = [
  {
    id: "sys_patient",
    code: "SEC-1",
    name: "受试者队列与档案中心",
    shortName: "队列与档案",
    icon: Users,
    defaultPage: "patient_center",
    pageIds: ["patient_center", "demographics"],
    subPages: [
      { id: "patient_center", title: "受试者队列概览与随访", shortTitle: "队列中心", code: "Queue" },
      { id: "demographics", title: "临床病史与基线问卷", shortTitle: "病史采集", code: "History" },
    ],
  },
  {
    id: "sys_neuropsych",
    code: "SEC-2",
    name: "神经心理量表临床评定",
    shortName: "量表评定",
    icon: ClipboardList,
    defaultPage: "scd_subjective",
    pageIds: [
      "scd_subjective",
      "mmse_page",
      "moca_b_page",
      "avlt_memory",
      "language_naming",
      "executive_stt",
      "adas_cog",
      "cdr_staging",
      "mood_behavior",
      "daily_sleep",
    ],
    subPages: [
      { id: "scd_subjective", title: "SCD-Q9 主诉量表", shortTitle: "SCD-Q9", code: "SCD" },
      { id: "mmse_page", title: "MMSE 简易精神状态", shortTitle: "MMSE", code: "MMSE" },
      { id: "moca_b_page", title: "MoCA-B 基础认知", shortTitle: "MoCA-B", code: "MoCA" },
      { id: "avlt_memory", title: "AVLT-H 华山记忆测验", shortTitle: "华山记忆", code: "AVLT" },
      { id: "language_naming", title: "言语流畅与命名 (VFT/BNT)", shortTitle: "言语命名", code: "VFT" },
      { id: "executive_stt", title: "连线测验与MES", shortTitle: "连线执行", code: "STT" },
      { id: "adas_cog", title: "ADAS-Cog 认知评定", shortTitle: "ADAS-Cog", code: "ADAS" },
      { id: "cdr_staging", title: "CDR 临床痴呆评定", shortTitle: "CDR分级", code: "CDR" },
      { id: "mood_behavior", title: "情绪与精神行为 (GDS/NPI)", shortTitle: "情绪行为", code: "GDS/NPI" },
      { id: "daily_sleep", title: "日常生活与睡眠 (FAQ/PSQI)", shortTitle: "日常睡眠", code: "FAQ" },
    ],
  },
  {
    id: "sys_biomarkers",
    code: "SEC-3",
    name: "综合诊断与审核",
    shortName: "综合诊断",
    icon: Dna,
    defaultPage: "biomarkers",
    pageIds: ["biomarkers", "comprehensive_report"],
    subPages: [
      { id: "biomarkers", title: "ATN 生物标志物与综合分型", shortTitle: "ATN与分型", code: "ATN" },
      { id: "comprehensive_report", title: "综合临床诊断报告与六维雷达", shortTitle: "综合报告", code: "Report" },
    ],
  },
  {
    id: "sys_tools",
    code: "SEC-4",
    name: "临床常模指南与工具箱",
    shortName: "常模与工具",
    icon: Wrench,
    defaultPage: "clinical_guide",
    pageIds: ["clinical_guide", "tools_lab"],
    subPages: [
      { id: "clinical_guide", title: "宣武医院临床常模手册", shortTitle: "常模手册", code: "Guide" },
      { id: "tools_lab", title: "神经心理计时画板工具箱", shortTitle: "计时工具箱", code: "Tool" },
    ],
  },
];

export const AppLayout: React.FC<AppLayoutProps> = ({
  record,
  cohort,
  onSelectPatient,
  onClearPatient,
  activePage,
  onNavigate,
  onReturnToPortal,
  onOpenTimerModal,
  onOpenAiModal,
  onOpenPrintModal,
  onOpenUploadModal,
  onOpenApprovalModal,
  pendingAiCount = 0,
  onExportExcel,
  onNewRecord,
  children,
}) => {
  const [systemDropdownOpen, setSystemDropdownOpen] = useState(false);
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);

  // Identify current active subsystem
  const currentSystem =
    SYSTEM_SECTIONS.find((sys) => sys.pageIds.includes(activePage)) || SYSTEM_SECTIONS[0];
  const CurrentIcon = currentSystem.icon;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col selection:bg-teal-500 selection:text-white">
      {/* 1. Global Navigation Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between gap-3">
            {/* Left: Back to Portal button + Active System Indicator */}
            <div className="flex items-center gap-2.5">
              {/* Return to Portal Button */}
              <button
                type="button"
                onClick={onReturnToPortal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 font-bold text-xs transition border border-slate-200 hover:border-teal-300 shadow-2xs group"
                title="返回系统总导航门户"
              >
                <LayoutGrid className="w-4 h-4 text-teal-600 group-hover:scale-110 transition" />
                <span className="hidden sm:inline">系统门户</span>
                <span className="sm:hidden">门户</span>
              </button>

              <div className="h-5 w-px bg-slate-200 hidden sm:block" />

              {/* Current Subsystem Selector Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setSystemDropdownOpen(!systemDropdownOpen);
                    setPatientDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50/90 hover:bg-teal-100 border border-teal-200 text-teal-900 transition text-xs font-bold"
                >
                  <CurrentIcon className="w-4 h-4 text-teal-700" />
                  <span className="hidden md:inline">{currentSystem.name}</span>
                  <span className="md:hidden">{currentSystem.shortName}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-teal-600" />
                </button>

                {/* Subsystem Dropdown Switcher */}
                {systemDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setSystemDropdownOpen(false)}
                    />
                    <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 space-y-1">
                      <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        医生端模块
                      </div>
                      {SYSTEM_SECTIONS.map((sys) => {
                        const isCurrent = sys.id === currentSystem.id;
                        const Icon = sys.icon;
                        return (
                          <button
                            key={sys.id}
                            type="button"
                            onClick={() => {
                              onNavigate(sys.defaultPage);
                              setSystemDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition ${
                              isCurrent
                                ? "bg-teal-600 text-white font-bold"
                                : "text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className={`w-4 h-4 ${isCurrent ? "text-white" : "text-teal-600"}`} />
                              <div>
                                <div>{sys.name}</div>
                                <div className={`text-[10px] ${isCurrent ? "text-teal-100" : "text-slate-400"}`}>
                                  {sys.code}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className={`w-3.5 h-3.5 ${isCurrent ? "text-teal-200" : "text-slate-300"}`} />
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right: patient selection and doctor tools */}
            <div className="flex items-center gap-2 shrink-0">
              {/* 1. Multi-patient Dropdown Switcher */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setPatientDropdownOpen(!patientDropdownOpen);
                    setSystemDropdownOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                    record
                      ? "bg-slate-100/90 hover:bg-slate-200/90 border-slate-200 text-slate-800"
                      : "bg-teal-50 hover:bg-teal-100 border-teal-300 text-teal-900 font-bold"
                  }`}
                  title={record ? "点击切换或新建受试者档案" : "未选受试者，点击从档案库选择"}
                >
                  <User className="w-3.5 h-3.5 text-teal-600" />
                  <span className="font-bold">{record ? "当前受试者" : "未选受试者"}</span>
                  <span className="text-slate-600 hidden md:inline">
                    {record?.demographics?.name || (record ? "未命名" : "(请在队列中选择)")}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {/* Patient List Dropdown */}
                {patientDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setPatientDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl p-2.5 z-50 space-y-1.5">
                      <div className="flex items-center justify-between px-2.5 py-1 text-xs font-bold text-slate-500 border-b border-slate-100 pb-2">
                        <span>受试者档案库 ({cohort.length})</span>
                        <button
                          onClick={() => {
                            onNewRecord();
                            setPatientDropdownOpen(false);
                          }}
                          className="flex items-center gap-1 text-[11px] font-bold text-teal-600 hover:text-teal-800"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>新建受试者</span>
                        </button>
                      </div>

                      <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                        {cohort.map((p) => {
                          const isSel = Boolean(record && p.id === record.id);
                          return (
                            <button
                              key={p.id}
                              onClick={() => {
                                onSelectPatient(p.id);
                                setPatientDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition ${
                                isSel
                                  ? "bg-teal-50 border border-teal-200 text-teal-900 font-bold"
                                  : "hover:bg-slate-100 text-slate-700"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                                    isSel
                                      ? "bg-teal-600 text-white"
                                      : "bg-slate-200 text-slate-700"
                                  }`}
                                >
                                  {p.demographics?.name ? p.demographics.name.slice(0, 1) : "患"}
                                </div>
                                <div>
                                  <div className="text-slate-900 font-bold">
                                    {p.demographics?.name || "未命名"}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {p.subjectNo || "SCD-000"} · {p.visitCode || "W000"}
                                  </div>
                                </div>
                              </div>
                              {isSel && <Check className="w-4 h-4 text-teal-600" />}
                            </button>
                          );
                        })}
                      </div>

                      <div className="border-t border-slate-100 pt-2 space-y-1">
                        {record && onClearPatient && (
                          <button
                            onClick={() => {
                              onClearPatient();
                              onNavigate("patient_center");
                              setPatientDropdownOpen(false);
                            }}
                            className="w-full text-center py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                          >
                            返回受试者队列中心 (清除当前选择)
                          </button>
                        )}
                        <button
                          onClick={() => {
                            onNavigate("patient_center");
                            setPatientDropdownOpen(false);
                          }}
                          className="w-full text-center py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition"
                        >
                          打开受试者队列中心
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Doctor pending approvals */}
              {onOpenApprovalModal && (
                <button
                  type="button"
                  id="btn-nav-pending-approval"
                  onClick={onOpenApprovalModal}
                  className="relative p-2 rounded-xl bg-slate-100/90 hover:bg-teal-50 border border-slate-200 text-slate-700 hover:text-teal-900 transition flex items-center gap-1.5 shadow-2xs"
                  title="AI 临床研判审核消息与医师签字待办"
                >
                  <Bell className="w-4 h-4 text-teal-700" />
                  {!!pendingAiCount && pendingAiCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full leading-none animate-pulse shadow-xs">
                      {pendingAiCount}
                    </span>
                  )}
                  <span className="text-xs font-bold text-slate-700 hidden xl:inline">
                    待审核
                  </span>
                </button>
              )}

              {/* Document parsing */}
              <button
                type="button"
                onClick={onOpenUploadModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-xs font-bold text-teal-800 transition shadow-2xs"
                title="导入病历或影像检查报告"
              >
                <Camera className="w-3.5 h-3.5 text-teal-600" />
                <span className="hidden sm:inline">上传模拟文档</span>
                <span className="sm:hidden">文档</span>
              </button>

              {/* 4. Doctor Station Badge */}
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
                <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                <span>医生端</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Sub-Page Horizontal Bar (for the active subsystem) */}
        {currentSystem.subPages && currentSystem.subPages.length > 1 && (
          <div className="bg-slate-100/80 border-t border-slate-200 px-4 sm:px-6 py-2 overflow-x-auto">
            <div className="max-w-7xl mx-auto flex items-center gap-1.5 min-w-max">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
                {currentSystem.shortName}:
              </span>
              {currentSystem.subPages.map((sub, idx) => {
                const isSubActive = activePage === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      onNavigate(sub.id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      isSubActive
                        ? "bg-teal-700 text-white shadow-2xs font-bold"
                        : "bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200/80"
                    }`}
                  >
                    <span
                      className={`text-[10px] font-mono font-bold px-1 py-0.2 rounded ${
                        isSubActive ? "bg-teal-800 text-teal-100" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span>{sub.shortTitle}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* 3. Main Page Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
};
