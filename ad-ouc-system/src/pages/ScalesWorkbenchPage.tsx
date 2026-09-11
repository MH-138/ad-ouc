import React, { useState } from "react";
import {
  User,
  HelpCircle,
  Brain,
  Layers,
  MessageSquare,
  Zap,
  Activity,
  Award,
  Smile,
  Moon,
  Dna,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Timer,
  Clock,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { SubjectRecord } from "../types/assessment";
import { evaluateCompleteAssessment, calculateGlobalCDR } from "../utils/scoringCalculators";

// Sub sections
import { SectionDemographicsHistory } from "../components/sections/SectionDemographicsHistory";
import { SectionSCDSubjective } from "../components/sections/SectionSCDSubjective";
import { SectionComprehensiveScreening } from "../components/sections/SectionComprehensiveScreening";
import { SectionMemoryBattery } from "../components/sections/SectionMemoryBattery";
import { SectionLanguageNaming } from "../components/sections/SectionLanguageNaming";
import { SectionExecutiveAttention } from "../components/sections/SectionExecutiveAttention";
import { SectionADASCog } from "../components/sections/SectionADASCog";
import { SectionCDRExpert } from "../components/sections/SectionCDRExpert";
import { SectionMoodBehavior } from "../components/sections/SectionMoodBehavior";
import { SectionDailyLivingSleep } from "../components/sections/SectionDailyLivingSleep";
import { SectionBiomarkersDiagnosis } from "../components/sections/SectionBiomarkersDiagnosis";

export type ScaleSectionId =
  | "demographics"
  | "scd_subjective"
  | "screening"
  | "memory"
  | "language"
  | "executive"
  | "adas_cog"
  | "cdr"
  | "mood_behavior"
  | "daily_sleep"
  | "biomarkers";

interface ScaleCategory {
  title: string;
  items: {
    id: ScaleSectionId;
    code: string;
    name: string;
    icon: React.ElementType;
    badge?: (record: SubjectRecord) => string | null;
  }[];
}

const SCALE_CATEGORIES: ScaleCategory[] = [
  {
    title: "一、基础与主诉自评",
    items: [
      {
        id: "demographics",
        code: "A-G",
        name: "受试者基本信息与病史",
        icon: User,
        badge: (r) => (r.demographics?.name ? "已建档" : "未填写"),
      },
      {
        id: "scd_subjective",
        code: "D,E,H16",
        name: "SCD 主观认知主诉 (Q9)",
        icon: HelpCircle,
        badge: (r) => (r.scdQ9 ? `Q9自评` : null),
      },
    ],
  },
  {
    title: "二、核心神经心理测验",
    items: [
      {
        id: "screening",
        code: "H1,H2",
        name: "利手、MMSE 与 MoCA-B 初筛",
        icon: Brain,
        badge: (r) => {
          const evalRes = evaluateCompleteAssessment(r);
          return `MMSE ${evalRes.mmse.score}分`;
        },
      },
      {
        id: "memory",
        code: "H3,LM",
        name: "AVLT-H 华山听觉与逻辑记忆",
        icon: Layers,
        badge: (r) => (r.scales?.avltH ? `N1-N5词表` : null),
      },
      {
        id: "language",
        code: "H4,H5",
        name: "VFT 动物流畅性 & BNT-30 命名",
        icon: MessageSquare,
        badge: (r) => {
          const totalVft = (r.scales?.vft?.t1_15s || 0) + (r.scales?.vft?.t16_30s || 0) + (r.scales?.vft?.t31_45s || 0) + (r.scales?.vft?.t46_60s || 0);
          return `VFT: ${totalVft}个`;
        },
      },
      {
        id: "executive",
        code: "H6,H8",
        name: "STT-A/B 形状连线与 MES 量表",
        icon: Zap,
        badge: (r) => (r.scales?.stt ? `STT 连线` : null),
      },
      {
        id: "adas_cog",
        code: "ADAS",
        name: "ADAS-Cog 12项认知子量表",
        icon: Activity,
        badge: (r) => (r.scales?.adasCog ? `ADAS量表` : null),
      },
    ],
  },
  {
    title: "三、临床分级、行为与生物学",
    items: [
      {
        id: "cdr",
        code: "CDR",
        name: "Global CDR 华盛顿大学分级",
        icon: Award,
        badge: (r) => {
          const cdrRes = calculateGlobalCDR(r.scales?.cdr);
          return `CDR ${cdrRes.globalCDR}分`;
        },
      },
      {
        id: "mood_behavior",
        code: "H7,H10",
        name: "情绪精神 (GDS, NPI, HAMD)",
        icon: Smile,
        badge: (r) => {
          const evalRes = evaluateCompleteAssessment(r);
          return `GDS ${evalRes.gds15.score}分`;
        },
      },
      {
        id: "daily_sleep",
        code: "H9,H11-14",
        name: "日常生活与睡眠 (FAQ, PSQI)",
        icon: Moon,
        badge: (r) => {
          const evalRes = evaluateCompleteAssessment(r);
          return `FAQ ${evalRes.faq.score}分`;
        },
      },
      {
        id: "biomarkers",
        code: "I,J,K",
        name: "ATN 生物标志物与诊断意见",
        icon: Dna,
        badge: (r) => (r.diagnosis?.category ? `分型已定` : null),
      },
    ],
  },
];

interface ScalesWorkbenchPageProps {
  record: SubjectRecord;
  onUpdateRecord: (record: SubjectRecord) => void;
  onOpenTimerCenter: () => void;
  onNavigateToReport: () => void;
}

export const ScalesWorkbenchPage: React.FC<ScalesWorkbenchPageProps> = ({
  record,
  onUpdateRecord,
  onOpenTimerCenter,
  onNavigateToReport,
}) => {
  const [activeSection, setActiveSection] = useState<ScaleSectionId>("demographics");

  const allItems = SCALE_CATEGORIES.flatMap((c) => c.items);
  const currentIndex = allItems.findIndex((i) => i.id === activeSection);
  const currentItem = allItems[currentIndex] || allItems[0];

  const handleRecordChange = (updated: Partial<SubjectRecord>) => {
    onUpdateRecord({
      ...record,
      ...updated,
    });
  };

  const goToNext = () => {
    if (currentIndex < allItems.length - 1) {
      setActiveSection(allItems[currentIndex + 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      onNavigateToReport();
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setActiveSection(allItems[currentIndex - 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Left Column: Categorized Scales List Sidebar (Width: ~280px) */}
      <aside className="w-full shrink-0 lg:w-72">
        <div className="sticky top-20 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                宣武医院全套量表目录
              </h2>
              <p className="mt-0.5 text-xs font-semibold text-slate-800">
                11 大模块 · 逐项评定
              </p>
            </div>
            <button
              onClick={onOpenTimerCenter}
              className="flex items-center gap-1 rounded-lg bg-teal-50 px-2 py-1 text-xs font-bold text-teal-700 hover:bg-teal-100"
              title="打开神经心理秒表/倒计时"
            >
              <Timer className="h-3.5 w-3.5" />
              <span>计时器</span>
            </button>
          </div>

          {/* Categorized List */}
          <div className="space-y-4">
            {SCALE_CATEGORIES.map((cat, catIdx) => (
              <div key={catIdx} className="space-y-1">
                <div className="px-2 text-[11px] font-bold text-slate-400">
                  {cat.title}
                </div>
                <div className="space-y-0.5">
                  {cat.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    const badgeText = item.badge?.(record);

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveSection(item.id);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${
                          isActive
                            ? "bg-teal-600 text-white shadow-xs"
                            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`h-4 w-4 shrink-0 ${
                              isActive ? "text-teal-100" : "text-slate-400"
                            }`}
                          />
                          <span className="truncate">{item.name}</span>
                        </div>

                        {badgeText && (
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold shrink-0 ${
                              isActive
                                ? "bg-teal-700 text-teal-100"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {badgeText}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Quick jump to Report */}
          <div className="border-t border-slate-100 pt-3">
            <button
              onClick={onNavigateToReport}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-teal-300 transition hover:bg-slate-800"
            >
              <span>查看综合诊断报告</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Right Column: Independent Scale Form Workspace */}
      <main className="flex-1 space-y-6">
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>量表测评</span>
            <span>/</span>
            <span className="font-mono text-teal-600">{currentItem.code}</span>
            <span>/</span>
            <span className="font-bold text-slate-800">{currentItem.name}</span>
          </div>

          <div className="text-xs text-slate-400">
            第 <strong className="text-slate-700">{currentIndex + 1}</strong> / {allItems.length} 项
          </div>
        </div>

        {/* Dynamic Scale Content */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          {activeSection === "demographics" && (
            <SectionDemographicsHistory record={record} onChange={handleRecordChange} />
          )}

          {activeSection === "scd_subjective" && (
            <SectionSCDSubjective record={record} onChange={handleRecordChange} />
          )}

          {activeSection === "screening" && (
            <SectionComprehensiveScreening record={record} onChange={handleRecordChange} />
          )}

          {activeSection === "memory" && (
            <SectionMemoryBattery
              record={record}
              onChange={handleRecordChange}
              onOpenTimerCenter={onOpenTimerCenter}
            />
          )}

          {activeSection === "language" && (
            <SectionLanguageNaming
              record={record}
              onChange={handleRecordChange}
              onOpenTimerCenter={onOpenTimerCenter}
            />
          )}

          {activeSection === "executive" && (
            <SectionExecutiveAttention record={record} onChange={handleRecordChange} />
          )}

          {activeSection === "adas_cog" && (
            <SectionADASCog record={record} onChange={handleRecordChange} />
          )}

          {activeSection === "cdr" && (
            <SectionCDRExpert record={record} onChange={handleRecordChange} />
          )}

          {activeSection === "mood_behavior" && (
            <SectionMoodBehavior record={record} onChange={handleRecordChange} />
          )}

          {activeSection === "daily_sleep" && (
            <SectionDailyLivingSleep record={record} onChange={handleRecordChange} />
          )}

          {activeSection === "biomarkers" && (
            <SectionBiomarkersDiagnosis record={record} onChange={handleRecordChange} />
          )}
        </div>

        {/* Bottom Pager Controls */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={goToPrev}
            className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>上一项 ({currentIndex > 0 ? allItems[currentIndex - 1].name : "首项"})</span>
          </button>

          <button
            type="button"
            onClick={goToNext}
            className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-teal-700"
          >
            <span>
              {currentIndex < allItems.length - 1
                ? `保存并进入下一项: ${allItems[currentIndex + 1].name}`
                : "完成量表测评，查看综合诊断报告"}
            </span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </main>
    </div>
  );
};
