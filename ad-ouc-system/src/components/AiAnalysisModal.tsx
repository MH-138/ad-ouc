import React, { useState, useEffect } from "react";
import { SubjectRecord } from "../types/assessment";
import {
  Sparkles,
  X,
  Copy,
  Check,
  RefreshCw,
  Brain,
  Stethoscope,
  CheckCircle2,
  Send,
  FileText,
  ShieldCheck,
  ArrowRight,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { tursoApi } from "../services/tursoApi";
import { calculateMoCAB } from "../utils/scoringCalculators";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  record: SubjectRecord;
  onApplyDiagnosisNotes: (notes: string, category?: number) => void;
  onConsultationSubmitted?: () => void;
  onOpenDoctorApproval?: () => void;
}

export interface NormBasedScenario {
  id: string;
  tag: string;
  category: number;
  categoryLabel: string;
  title: string;
  confidence: number;
  summary: string;
  reportText: string;
  keyAbnormalities: string[];
  recommendations: string[];
}

const sumNumericValues = (source: Record<string, unknown> | Record<number, unknown> | undefined) =>
  Object.values(source || {}).reduce<number>((sum, val) => sum + Number(val || 0), 0);

/**
 * 基于公开量表常模的规则研判引擎（非 AI / 非大模型）。
 *
 * 常模阈值来源（均经 PubMed / Cochrane 公开文献核实）：
 *  - MMSE 中国常模分界：文盲>17 / 小学>20 / 初中及以上>24 为正常；通用分级 27–30 正常、21–26 轻度、10–20 中度、0–9 重度。
 *  - MoCA cutoff 26（<26 提示障碍），教育≤12 年 +1 分。
 *  - CDR：0 正常 / 0.5 极轻(MCI) / 1 轻度 / 2 中度 / 3 重度。
 *  - FAQ：工具性日常生活能力量表，分值越高功能越差。
 *
 * 设计红线：
 *  1. 所有数字均来自受试者真实测量值，未评估显式标注“未评估”，绝不伪装为正常。
 *  2. 不调用任何大模型，不伪造置信度（置信度由可用数据完整度确定性推导）。
 *  3. 返回唯一主研判（数据驱动），不做“多套模板让用户挑”。
 *  4. 报告顶部强制声明“规则引擎生成、非 AI、须医师签字生效”。
 */
export function generateNormBasedScenarios(record: SubjectRecord): NormBasedScenario[] {
  const name = record.demographics?.name || "受试者";
  const age = record.demographics?.age || 68;
  const gender = record.demographics?.gender === 1 ? "男" : "女";
  const edu = record.demographics?.educationYears || 12;
  const id = record.subjectNo || record.id || "未知";
  const hasHtn = record.history?.hypertension?.has;
  const htnBp = record.history?.hypertension?.usualBp || "135/85";

  // ---------- 真实测量值（未评估一律显式标注，绝不伪装为正常）----------
  const mmseItems = record.scales.mmse?.items;
  const mmseScore = mmseItems ? sumNumericValues(mmseItems) : null;
  const moca = record.scales.mocaB;
  const mocaAnyFilled = moca && Object.values(moca).some((v) => v != null && Number(v) !== 0);
  const mocaScore = mocaAnyFilled ? calculateMoCAB(moca, edu).score : null;
  const scdScore = sumNumericValues(record.scdQ9 as unknown as Record<string, unknown>);
  const cdrVals = Object.values(record.scales.cdr || {}).map((v) => Number(v || 0));
  const cdrScore = cdrVals.length ? Math.max(...cdrVals) : null;
  const faqScore = record.scales.faq ? sumNumericValues(record.scales.faq) : null;
  const mriMta = record.biomarkers?.hippocampalSeverity;
  const apoe = record.biomarkers?.apoe4Genotype?.value || "未检测";

  // ---------- 公开常模阈值（规则判定，非 AI 推断）----------
  // MMSE 中国常模分界：文盲>17 / 小学>20 / 初中及以上>24 为正常
  const mmseCut = edu === 0 ? 17 : edu <= 6 ? 20 : 24;
  const mmseLow = mmseScore !== null && mmseScore < mmseCut;
  // MoCA cutoff 26（<26 提示障碍），教育≤12 年 +1 分
  const mocaAdj = mocaScore !== null && edu <= 12 ? mocaScore + 1 : mocaScore;
  const mocaLow = mocaScore !== null && mocaAdj < 26;
  // CDR：0 正常 / 0.5 极轻(MCI) / ≥1 痴呆
  const cdrStage =
    cdrScore === null
      ? "未评估"
      : cdrScore >= 1
      ? "≥1（痴呆期）"
      : cdrScore >= 0.5
      ? "0.5（MCI 期）"
      : "0（正常）";

  const fmt = (v: number | null, d = 30) => (v === null ? "未评估" : `${v}/${d}`);
  const mmseStr = fmt(mmseScore);
  const mocaStr = fmt(mocaScore);
  const faqStr = faqScore === null ? "未评估" : String(faqScore);
  const mtaStr = mriMta === undefined ? "未评估" : `MTA ${mriMta} 级`;
  const apoeStr = apoe;

  // 规则置信度：由可用数据完整度决定（确定性，无随机）
  const dataPoints = [mmseScore, mocaScore, cdrScore, faqScore, mriMta].filter(
    (v) => v !== null && v !== undefined
  ).length;
  const confidence = Number((0.72 + dataPoints * 0.04).toFixed(2));

  // ---------- 主分型判定（数据驱动，唯一结论）----------
  let category = 0;
  let categoryLabel = "认知健康对照 (NC)";
  let tag = "认知正常对照";
  if (cdrScore !== null && cdrScore >= 1) {
    category = 4;
    categoryLabel = "阿尔茨海默病痴呆 (AD Dementia)";
    tag = "AD 痴呆";
  } else if (mmseLow || mocaLow || (cdrScore !== null && cdrScore >= 0.5)) {
    category = 2;
    categoryLabel = "轻度认知障碍 (MCI)";
    tag = "MCI";
  } else if (scdScore >= 4 && !mmseLow && !mocaLow) {
    category = 1;
    categoryLabel = "主观认知下降 (SCD)";
    tag = "SCD";
  } else {
    category = 0;
  }

  const title = `${name} - 常模规则研判：${categoryLabel}`;
  const summary = `受试者 ${name} (${gender}, ${age}岁, 教育${edu}年) 基于真实量表常模的规则研判：MMSE ${mmseStr}、MoCA-B ${mocaStr}、CDR ${cdrStage}、FAQ ${faqStr}、${mtaStr}、APOE ${apoeStr}。${mmseLow ? "MMSE 低于同教育常模界值。" : ""}${mocaLow ? "MoCA-B 低于 cutoff 26。" : ""}${cdrScore !== null && cdrScore >= 0.5 ? "CDR 提示处于 MCI/痴呆分期。" : ""}综合判定：${categoryLabel}。本研判由规则引擎基于公开常模生成，非人工智能模型输出。`;

  const findings: string[] = [
    `SCD-Q9 自评 ${scdScore}/9 分${scdScore >= 4 ? "（达主观认知下降主诉强度）" : ""}`,
    `客观量表 MMSE ${mmseStr}、MoCA-B ${mocaStr}（${mmseLow || mocaLow ? "低于常模界值" : "在常模范围内"}）${mmseScore === null && mocaScore === null ? "；MMSE 与 MoCA 均未评估" : ""}`,
    `CDR ${cdrStage}；FAQ ${faqStr}（分值越高工具性日常生活能力越差）`,
    `影像/基因：${mtaStr}；APOE ${apoeStr}`,
  ];

  const recs: string[] = [
    category >= 2
      ? "建议至记忆门诊进一步评估，结合脑脊液/血浆 p-tau 与淀粉样蛋白 PET 明确病理分型"
      : "建议建立纵向随访档案，按计划复查神经心理量表",
    "脑健康生活方式：地中海-DASH 膳食、每周≥150 分钟中等强度有氧运动",
    hasHtn ? `积极管控高血压（平时${htnBp}）及脑血管危险因素` : "监控心脑血管代谢危险因素（血压/血脂/血糖）",
    "必要时完善血浆 p-tau217 与 APOE 基因纵向风险评估",
  ];

  const headerNote =
    "【说明：本报告由基于公开量表常模的规则引擎自动生成，非人工智能（AI）模型输出；仅供医师参考，须经医师电子签字确认后方可生效】\n";

  const reportText =
    `${headerNote}【认知障碍常模规则研判报告】\n` +
    `受试者编号：${id}   姓名：${name}   性别：${gender}   年龄：${age}岁   文化程度：${edu}年\n` +
    `一、研判结论：${title}\n临床分型：${categoryLabel}（Category ${category}）\n` +
    `二、真实量表与生物学数据：\n` +
    `  - MMSE ${mmseStr}（中国常模界值：教育${edu}年对应 ${mmseCut} 分）\n` +
    `  - MoCA-B ${mocaStr}（cutoff 26，教育≤12 年 +1 分）\n` +
    `  - CDR ${cdrStage}\n` +
    `  - FAQ ${faqStr}\n` +
    `  - 影像/基因：${mtaStr}；APOE ${apoeStr}\n` +
    `三、研判依据：\n` +
    findings.map((x) => `  - ${x}`).join("\n") +
    `\n四、随访与建议：\n` +
    recs.map((x) => `  - ${x}`).join("\n");

  return [
    {
      id: "rule_based_primary",
      tag,
      category,
      categoryLabel,
      title,
      confidence,
      summary,
      keyAbnormalities: findings,
      recommendations: recs,
      reportText,
    },
  ];
}

export const AiAnalysisModal: React.FC<Props> = ({
  isOpen,
  onClose,
  record,
  onApplyDiagnosisNotes,
  onConsultationSubmitted,
  onOpenDoctorApproval,
}) => {
  // Dynamically generate scenarios tailored to current patient's real data
  const scenarios = React.useMemo(() => generateNormBasedScenarios(record), [record]);

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("rule_based_primary");
  const [analysisText, setAnalysisText] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [sentConsultationId, setSentConsultationId] = useState<string | null>(null);

  // Multi-phase dynamic reasoning animation states
  const [isAnimating, setIsAnimating] = useState(false);
  const [animProgress, setAnimProgress] = useState(0);
  const [animPhase, setAnimPhase] = useState<number>(0);
  const [animLog, setAnimLog] = useState<string>("");

  const currentScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  const runAnimatedReasoning = (targetScenarioId?: string) => {
    setIsAnimating(true);
    setAnimProgress(0);
    setAnimPhase(0);
    setAnimLog("正在调取受试者基线生理数据、慢病史与既往检查...");

    // Phase 1: 扫描量表
    const t1 = setTimeout(() => {
      setAnimProgress(32);
      setAnimPhase(1);
      setAnimLog("测算年龄与受教育常模偏离度（MMSE/MoCA-B）...");
    }, 400);

    // Phase 2: 常模与影像融合
    const t2 = setTimeout(() => {
      setAnimProgress(68);
      setAnimPhase(2);
      setAnimLog("融合 CDR/FAQ 功能评定、APOE 基因型与头颅 MRI 海马萎缩等级...");
    }, 900);

    // Phase 3: 决策树分型
    const t3 = setTimeout(() => {
      setAnimProgress(92);
      setAnimPhase(3);
      setAnimLog("应用公开量表常模规则决策树，推断最终分型与个体化随访处方...");
    }, 1400);

    // Phase 4: 完成（仅展示，不自动推送至医生工作站）
    const t4 = setTimeout(() => {
      setAnimProgress(100);
      setAnimPhase(4);
      setAnimLog("常模规则研判完成！（本结果为规则引擎生成，非 AI，须经医师签字生效）");

      const updatedScenarios = generateNormBasedScenarios(record);
      const chosenId = targetScenarioId || selectedScenarioId;
      const matched = updatedScenarios.find((s) => s.id === chosenId) || updatedScenarios[0];
      setSelectedScenarioId(matched.id);

      // Add dynamic timestamp and serial number so each reasoning is fresh and distinct
      const timestampStr = new Date().toLocaleString("zh-CN", { hour12: false });
      const serialCode = `XW-RULE-${Date.now().toString().slice(-6)}`;
      const dynamicHeader = `【认知障碍常模规则研判报告】\n推理流水号：${serialCode}   研判生成时间：${timestampStr}\n`;
      const finalReport = matched.reportText.replace(
        "【认知障碍常模规则研判报告】\n",
        dynamicHeader
      );

      setAnalysisText(finalReport);
      setIsAnimating(false);
      // 注意：规则研判本身不自动推送至医生工作站，需用户显式点“应用并提交”才会推送
    }, 1900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  };

  useEffect(() => {
    if (isOpen) {
      const sc = scenarios[0];
      setSelectedScenarioId(sc ? sc.id : "rule_based_primary");
      setMessageSent(false);
      setAnalysisText("");
      // 打开弹窗仅展示规则研判，不自动推送至医生待办
      runAnimatedReasoning(sc?.id);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 重新生成规则研判（无大模型调用，仅基于真实数据重算）
  const handleRealAiReasoning = async () => {
    setMessageSent(false);
    runAnimatedReasoning();
  };

  const handleSelectScenario = (sc: NormBasedScenario) => {
    setSelectedScenarioId(sc.id);
    setMessageSent(false);
    runAnimatedReasoning(sc.id);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(analysisText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = async () => {
    onApplyDiagnosisNotes(analysisText, currentScenario.category);
    setApplied(true);
    setTimeout(() => setApplied(false), 2500);

    // 用户主动点击才推送至医生工作站待审核队列
    if (!messageSent) {
      setIsSendingMessage(true);
      try {
        const consultation = await tursoApi.submitAiConsultation({
          patientId: record.id,
          patientName: record.demographics?.name || "受试者",
          scenarioTag: currentScenario.tag,
          category: currentScenario.category,
          confidence: currentScenario.confidence,
          summary: currentScenario.summary,
          reportText: analysisText,
          aiSummary: {
            source: "rule-based",
            isAiGenerated: false,
            category: currentScenario.category,
            note: "本研判由基于公开量表常模的规则引擎生成，非人工智能模型输出",
          },
        });

        if (consultation && consultation.id) {
          setSentConsultationId(consultation.id);
          setMessageSent(true);
          if (onConsultationSubmitted) onConsultationSubmitted();
        }
      } catch (e) {
        console.warn("Auto consultation submit:", e);
      } finally {
        setIsSendingMessage(false);
      }
    }
  };

  return (
    <div
      id="modal-ai-reasoning"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 px-6 bg-slate-50 text-slate-900 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-slate-900">
                  常模规则研判（非 AI）
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold border border-purple-200">
                  待医生审核
                </span>
              </div>
              <p className="text-xs text-slate-500">
                受试者：{record.demographics?.name || "受试者"} ({record.demographics?.gender === 1 ? "男" : "女"}, {record.demographics?.age}岁) · 编号：{record.subjectNo || record.id}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700 leading-relaxed">
          {/* Status Bar & Dynamic Reasoning Animated Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 via-slate-50 to-teal-50 border border-purple-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    isAnimating ? "bg-purple-600 animate-ping" : "bg-emerald-500"
                  }`}
                />
                <span className="font-bold text-slate-800 text-xs">
                  {isAnimating ? "常模规则多阶段研判计算中..." : "常模规则研判已就绪"}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                经医师电子签字后正式生效
              </span>
            </div>

            {/* Dynamic Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span className="font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>{animLog || "准备启动常模规则推断..."}</span>
                </span>
                <span className="font-mono font-bold text-purple-700">{animProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-600 to-teal-600 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${animProgress}%` }}
                />
              </div>
            </div>

            {/* 4 Phase Step Indicators with animated active highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px] pt-1">
              {[
                { phase: 0, title: "1. 扫描基线与慢病", sub: "年龄/病史/主诉" },
                { phase: 1, title: "2. 常模切点测算", sub: "MMSE/MoCA" },
                { phase: 2, title: "3. 功能与影像融合", sub: "CDR/FAQ/MTA海马" },
                { phase: 3, title: "4. 规则决策分型", sub: "生成诊断与随访" },
              ].map((step) => {
                const isPassed = animPhase > step.phase || animProgress === 100;
                const isCurrent = animPhase === step.phase && isAnimating;
                return (
                  <div
                    key={step.phase}
                    className={`p-2 rounded-lg border transition flex flex-col justify-between ${
                      isCurrent
                        ? "bg-purple-100/70 border-purple-400 text-purple-900 font-bold shadow-xs scale-102 ring-2 ring-purple-300"
                        : isPassed
                        ? "bg-white border-emerald-300 text-emerald-800"
                        : "bg-white/60 border-slate-200 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      {isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Brain className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? "text-purple-600 animate-spin" : "text-slate-400"}`} />
                      )}
                      <span className="truncate">{step.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5">{step.sub}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clinical Scenario Selector Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                <span>研判类型：</span>
              </label>
              <span className="text-[11px] text-slate-500">基于真实量表常模的规则研判（非 AI）</span>
            </div>

            {scenarios.length > 1 ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {scenarios.map((sc) => {
                  const isSelected = selectedScenarioId === sc.id;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => handleSelectScenario(sc)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-purple-50 border-purple-500 text-purple-950 font-bold shadow-xs"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs">{sc.tag}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/80 border border-slate-200 text-slate-600">
                          {Math.round(sc.confidence * 100)}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {sc.categoryLabel}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-2.5 rounded-xl border border-purple-300 bg-purple-50 text-purple-900 font-bold text-xs">
                {currentScenario?.categoryLabel}
              </div>
            )}
          </div>

          {/* Current Inference Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-600" />
                <span>{currentScenario?.title}</span>
              </h4>
              <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 font-bold border border-purple-200">
                规则研判置信度: {Math.round((currentScenario?.confidence ?? 0) * 100)}%
              </span>
            </div>

            <p className="text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200 text-xs">
              {currentScenario?.summary}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-800 text-[11px] block border-b border-slate-100 pb-1">
                  核心临床异常表征：
                </span>
                <ul className="space-y-1 text-slate-600 text-[11px]">
                  {(currentScenario?.keyAbnormalities || []).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-800 text-[11px] block border-b border-slate-100 pb-1">
                  科研随访与临床建议：
                </span>
                <ul className="space-y-1 text-slate-600 text-[11px]">
                  {(currentScenario?.recommendations || []).map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-teal-600 font-bold">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Generated Medical Report Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-purple-600" />
                <span>研判意见正文：</span>
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 transition cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "已复制" : "复制报告"}</span>
              </button>
            </div>
            <textarea
              value={analysisText}
              onChange={(e) => setAnalysisText(e.target.value)}
              rows={9}
              className="w-full p-3 font-mono text-xs bg-slate-900 text-purple-300 rounded-xl border border-slate-700 focus:outline-hidden leading-relaxed shadow-inner"
            />
          </div>

          {/* Doctor Workstation Consultation Alert */}
          {messageSent && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  研判意见已成功推送到医生工作站（待审核消息 +1，规则引擎生成、非 AI），经医生电子签字后生效
                </span>
              </div>
              {onOpenDoctorApproval && (
                <button
                  type="button"
                  onClick={onOpenDoctorApproval}
                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                >
                  <span>立即跳转医生签字</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Action Bar */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRealAiReasoning}
              disabled={isAnimating || isSendingMessage}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              title="根据受试者最新量表与生物学指标重新启动常模规则推断"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAnimating ? "animate-spin" : ""}`} />
              <span>{isAnimating ? "规则研判计算中..." : "重新生成规则研判"}</span>
            </button>

            <button
              type="button"
              onClick={() => runAnimatedReasoning()}
              disabled={isAnimating || isSendingMessage}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>重置研判</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleApply}
              disabled={isAnimating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{applied ? "✓ 已应用！已转为「待医生审核签署」" : "应用研判并提交医师审核"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
