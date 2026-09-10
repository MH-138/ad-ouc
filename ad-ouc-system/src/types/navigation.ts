import {
  User,
  MessageSquareHeart,
  FileText,
  AlertCircle,
  Activity,
  Brain,
  Layers,
  Sparkles,
  Award,
  Smile,
  Moon,
  Dna,
  FileCheck,
  Timer,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import { SubjectRecord } from "./assessment";
import {
  evaluateCompleteAssessment,
  calculateGlobalCDR,
  calculateMMSE,
  calculateMoCAB,
} from "../utils/scoringCalculators";

export type AppPageId =
  | "patient_center" // 1. 受试者档案与队列中心
  | "chat_interview" // 2. 适老沉浸式语音对话自评
  | "demographics" // 3. A-G 基本信息与完整病史
  | "scd_subjective" // 4. D,E,H16 SCD-Q9 主观认知下降
  | "mmse_page" // 5. H1, H2 利手量表与 MMSE 简易精神状态
  | "moca_b_page" // 6. H15 MoCA-B 蒙特利尔认知评估基础版
  | "avlt_memory" // 7. H3 华山听觉词语与逻辑记忆 (AVLT-H)
  | "language_naming" // 8. H4, H5 动物流畅性 (VFT) 与 BNT-30 命名
  | "executive_stt" // 9. H6, H8 形状连线测验 (STT) 与 MES
  | "adas_cog" // 10. ADAS-Cog 认知子量表 (12项)
  | "cdr_staging" // 11. Global CDR 临床痴呆评定与决策树
  | "mood_behavior" // 12. H7, H10 情绪精神 (GDS-15, NPI, HAMD-17)
  | "daily_sleep" // 13. H9, H11-14 功能活动 (FAQ) 与睡眠 (PSQI)
  | "biomarkers" // 14. I, J, K ATN 生物标志物与诊断分型
  | "comprehensive_report" // 15. 综合诊断决策报告 & A4 打印单
  | "tools_lab" // 16. 神经心理测验计时与手绘工具箱
  | "clinical_guide"; // 17. 宣武医院临床评定规范与常模手册

export interface PageMeta {
  id: AppPageId;
  pageNumber: number;
  title: string;
  shortTitle: string;
  code: string;
  category: "center" | "baseline" | "cognition" | "staging" | "report_tools";
  categoryName: string;
  icon: LucideIcon;
  description: string;
  getBadge: (record: SubjectRecord) => { text: string; color: string } | null;
}

export const APP_PAGES: PageMeta[] = [
  // 1. 档案与自评中心
  {
    id: "patient_center",
    pageNumber: 1,
    title: "受试者档案与随访队列中心",
    shortTitle: "受试者档案",
    code: "Profile",
    category: "center",
    categoryName: "档案与自评",
    icon: User,
    description: "受试者人口学概要、纵向随访时间轴与教学案例载入",
    getBadge: (r) => ({ text: r.visitCode || "基线期", color: "bg-indigo-100 text-indigo-700" }),
  },
  {
    id: "chat_interview",
    pageNumber: 2,
    title: "适老沉浸式语音对话自评",
    shortTitle: "语音对话自评",
    code: "Chat",
    category: "center",
    categoryName: "档案与自评",
    icon: MessageSquareHeart,
    description: "适老超大字号、温暖生活化 6 大主题语音对话自评",
    getBadge: (r) => {
      const answers = Object.keys(r.scdQ9 || {}).length;
      return answers > 0 ? { text: `自评就绪`, color: "bg-teal-100 text-teal-700" } : null;
    },
  },

  // 2. 基础与主诉
  {
    id: "demographics",
    pageNumber: 3,
    title: "A-G. 受试者基本信息与病史",
    shortTitle: "基本信息与病史",
    code: "A-G",
    category: "baseline",
    categoryName: "基础与主诉",
    icon: FileText,
    description: "人口学特征、现病史主诉、既往史、体格检查及化验",
    getBadge: (r) => (r.demographics?.name ? { text: r.demographics.name, color: "bg-slate-100 text-slate-700" } : null),
  },
  {
    id: "scd_subjective",
    pageNumber: 4,
    title: "D, E, H16. SCD-Q9 主观认知下降评定",
    shortTitle: "SCD-Q9 主诉问卷",
    code: "D/E/H16",
    category: "baseline",
    categoryName: "基础与主诉",
    icon: AlertCircle,
    description: "SCD-Q9 主诉问卷 (≥5分阳性)、衰弱及自报主诉",
    getBadge: (r) => {
      const summary = evaluateCompleteAssessment(r);
      return {
        text: summary.scdQ9.isPositive ? `SCD阳性 (${summary.scdQ9.score}分)` : `阴性 (${summary.scdQ9.score}分)`,
        color: summary.scdQ9.isPositive ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800",
      };
    },
  },

  // 3. 核心认知功能测评
  {
    id: "mmse_page",
    pageNumber: 5,
    title: "H1, H2. 利手量表与 MMSE 简易精神状态检查",
    shortTitle: "MMSE 简易精神状态",
    code: "H1/H2",
    category: "cognition",
    categoryName: "神经心理量表库",
    icon: Activity,
    description: "爱丁堡利手量表与 MMSE 30 项完整评定 (含双五边形画板)",
    getBadge: (r) => {
      const mmse = calculateMMSE(r.scales.mmse.items, r.demographics.educationYears || 0);
      return {
        text: `${mmse.score}/30分`,
        color: mmse.isAbnormal ? "bg-red-100 text-red-700" : "bg-teal-100 text-teal-700",
      };
    },
  },
  {
    id: "moca_b_page",
    pageNumber: 6,
    title: "H15. MoCA-B 蒙特利尔认知评估基础量表",
    shortTitle: "MoCA-B 基础量表",
    code: "H15",
    category: "cognition",
    categoryName: "神经心理量表库",
    icon: Brain,
    description: "华山医院中文基础版 (适合低教育老人, 30分制及画钟)",
    getBadge: (r) => {
      const moca = calculateMoCAB(r.scales.mocaB, r.demographics.educationYears || 0);
      return {
        text: `${moca.score}/30分`,
        color: moca.isAbnormal ? "bg-red-100 text-red-700" : "bg-teal-100 text-teal-700",
      };
    },
  },
  {
    id: "avlt_memory",
    pageNumber: 7,
    title: "H3, LM. 华山听觉词语学习与逻辑记忆 (AVLT-H)",
    shortTitle: "AVLT-H 记忆量表",
    code: "H3/LM",
    category: "cognition",
    categoryName: "神经心理量表库",
    icon: Layers,
    description: "AVLT-H 词语短/长延迟回忆、再认与逻辑记忆篇章",
    getBadge: (r) => {
      const n5 = r.scales.avltH?.n5Delayed20MinWords?.length || 0;
      return { text: `N5回忆: ${n5}/12词`, color: "bg-blue-100 text-blue-700" };
    },
  },
  {
    id: "language_naming",
    pageNumber: 8,
    title: "H4, H5. 动物流畅性 (VFT) 与 BNT-30 波士顿命名",
    shortTitle: "VFT流畅性与命名",
    code: "H4/H5",
    category: "cognition",
    categoryName: "神经心理量表库",
    icon: Sparkles,
    description: "1分钟动物产出量评定与 30 张高清晰实物图片命名",
    getBadge: (r) => {
      const vft = (r.scales.vft?.t1_15s || 0) + (r.scales.vft?.t16_30s || 0) + (r.scales.vft?.t31_45s || 0) + (r.scales.vft?.t46_60s || 0);
      return { text: `VFT: ${vft}个`, color: "bg-purple-100 text-purple-700" };
    },
  },
  {
    id: "executive_stt",
    pageNumber: 9,
    title: "H6, H8. 形状连线测验 (STT) 与记忆执行筛查 (MES)",
    shortTitle: "STT连线与MES筛查",
    code: "H6/H8",
    category: "cognition",
    categoryName: "神经心理量表库",
    icon: Activity,
    description: "STT-A/B 连线用时毫秒级评定与 MES 100分记忆执行测验",
    getBadge: (r) => {
      const m = r.scales.mes;
      const total = (m?.q1ImmediateSentence || 0) + (m?.q2KitchenFluency || 0) + (m?.q3TappingContradiction || 0) + (m?.q4ShortDelay || 0) + (m?.q5FingerMotorPraxis || 0) + (m?.q6TappingGoNoGo || 0) + (m?.q7LongDelay || 0);
      return { text: `MES: ${total}/100分`, color: "bg-indigo-100 text-indigo-700" };
    },
  },
  {
    id: "adas_cog",
    pageNumber: 10,
    title: "ADAS-Cog. 阿尔茨海默病评定量表认知部分 (12项)",
    shortTitle: "ADAS-Cog 认知子量表",
    code: "ADAS",
    category: "cognition",
    categoryName: "神经心理量表库",
    icon: Award,
    description: "国际多中心临床试验核心疗效指标 (0-70分反向评分)",
    getBadge: (r) => {
      const adas = r.scales.adasCog;
      if (!adas) return null;
      const sum = (adas.wordRecallErrorsTrial1 || 0) + (adas.namingErrors || 0) + (adas.commandsErrors || 0);
      return { text: `ADAS ${sum}分`, color: "bg-amber-100 text-amber-800" };
    },
  },

  // 4. 临床分级与行为
  {
    id: "cdr_staging",
    pageNumber: 11,
    title: "Global CDR. 临床痴呆评定与华盛顿大学决策树",
    shortTitle: "CDR 痴呆分级",
    code: "CDR",
    category: "staging",
    categoryName: "临床分级与行为",
    icon: Award,
    description: "记忆、定向、判断、社区、家务、自理 6 大维度与决策树",
    getBadge: (r) => {
      const cdr = calculateGlobalCDR(r.scales.cdr);
      return {
        text: `CDR ${cdr.globalCDR}分 (${cdr.description})`,
        color: cdr.globalCDR === 0 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800",
      };
    },
  },
  {
    id: "mood_behavior",
    pageNumber: 12,
    title: "H7, H10. 情绪与精神行为评定 (GDS-15, NPI, HAMD)",
    shortTitle: "情绪与精神行为",
    code: "H7/H10",
    category: "staging",
    categoryName: "临床分级与行为",
    icon: Smile,
    description: "老年抑郁量表 (GDS-15)、神经精神问卷 (NPI) 与汉密尔顿",
    getBadge: (r) => {
      const answers = r.scales.gds15?.answers || {};
      const count = Object.values(answers).filter(Boolean).length;
      return { text: `GDS: ${count}分`, color: count >= 5 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700" };
    },
  },
  {
    id: "daily_sleep",
    pageNumber: 13,
    title: "H9, H11-H14. 功能活动问卷 (FAQ) 与匹兹堡睡眠 (PSQI)",
    shortTitle: "日常生活与睡眠",
    code: "H9/H11",
    category: "staging",
    categoryName: "临床分级与行为",
    icon: Moon,
    description: "10 项日常生活能力评估 (FAQ ≥9分异常) 与睡眠质量评定",
    getBadge: (r) => {
      const items = r.scales.faq?.items || {};
      const sum = Object.values(items).reduce((acc: number, cur) => acc + (cur > 0 ? cur : 0), 0);
      return { text: `FAQ: ${sum}分`, color: sum >= 9 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700" };
    },
  },
  {
    id: "biomarkers",
    pageNumber: 14,
    title: "I, J, K. ATN 生物标志物与贾建平团队临床诊断意见",
    shortTitle: "ATN生物标志物与诊断",
    code: "I/J/K",
    category: "staging",
    categoryName: "临床分级与行为",
    icon: Dna,
    description: "Aβ/Tau/神经退行标志物、9 大临床综合分型与干预方案",
    getBadge: (r) => (r.diagnosis?.category ? { text: "分型已定", color: "bg-teal-100 text-teal-700" } : null),
  },

  // 5. 报告与辅助工具
  {
    id: "comprehensive_report",
    pageNumber: 15,
    title: "综合认知诊断决策报告与 A4 打印单",
    shortTitle: "综合诊断报告",
    code: "Report",
    category: "report_tools",
    categoryName: "报告与工具",
    icon: FileCheck,
    description: "认知六维雷达图、常模偏离度红绿灯、AI诊断推理与打印",
    getBadge: () => ({ text: "A4标准", color: "bg-indigo-100 text-indigo-700" }),
  },
  {
    id: "tools_lab",
    pageNumber: 16,
    title: "神经心理测验秒表与手绘白板工具箱",
    shortTitle: "测验计时与工具箱",
    code: "Tools",
    category: "report_tools",
    categoryName: "报告与工具",
    icon: Timer,
    description: "VFT 60s倒计时器、STT毫秒秒表、CDT画钟测验画板",
    getBadge: () => null,
  },
  {
    id: "clinical_guide",
    pageNumber: 17,
    title: "宣武医院临床评定规范与常模速查手册",
    shortTitle: "临床规范指南",
    code: "Guide",
    category: "report_tools",
    categoryName: "报告与工具",
    icon: BookOpen,
    description: "AD-SCD 入组/排除标准、各量表常模切界分与标准化SOP",
    getBadge: () => null,
  },
];
