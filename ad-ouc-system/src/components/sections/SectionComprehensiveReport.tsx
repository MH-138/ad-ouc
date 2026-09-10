import React, { useState } from "react";
import { SubjectRecord, AssessmentSummaryResults } from "../../types/assessment";
import {
  evaluateCompleteAssessment,
  calculateGlobalCDR,
  calculateADASCog,
} from "../../utils/scoringCalculators";
import {
  Sparkles,
  Printer,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Brain,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  Stethoscope,
  Calendar,
  Save,
} from "lucide-react";

interface Props {
  record: SubjectRecord;
  onOpenAiModal: () => void;
  onOpenPrintModal: () => void;
  onChange?: (updated: Partial<SubjectRecord>) => void;
  onExportExcel?: () => void;
}

export const SectionComprehensiveReport: React.FC<Props> = ({
  record,
  onOpenAiModal,
  onOpenPrintModal,
  onChange,
  onExportExcel,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  const results: AssessmentSummaryResults = evaluateCompleteAssessment(record);
  const cdr = calculateGlobalCDR(record.scales.cdr);
  const adas = calculateADASCog(record.scales.adasCog);

  // Check which batteries have actual data entered
  const hasScdStarted = Boolean(
    (record.scdQ9 && Object.values(record.scdQ9).some((v) => typeof v === "number")) ||
    (record.scdInterview?.patientSCD && Object.keys(record.scdInterview.patientSCD).length > 0)
  );
  const hasMmseStarted = Boolean(
    record.scales.mmse?.items && Object.keys(record.scales.mmse.items).length > 0
  );
  const hasMocaStarted = Boolean(
    record.scales.mocaB &&
      (record.scales.mocaB.executiveTrail !== undefined ||
        record.scales.mocaB.fluencyFruit !== undefined ||
        record.scales.mocaB.orientation !== undefined)
  );
  const hasAvltStarted = Boolean(
    record.scales.avltH?.n1Words && record.scales.avltH.n1Words.length > 0
  );
  const hasLogicalMemoryStarted = Boolean(
    record.scales.logicalMemory?.delayedStoryUnits !== undefined &&
      record.scales.logicalMemory.delayedStoryUnits > 0
  );
  const hasSttStarted = Boolean(
    record.scales.stt?.sttBTestSeconds !== undefined &&
      record.scales.stt.sttBTestSeconds > 0
  );
  const hasBntStarted = Boolean(
    record.scales.bnt?.spontaneousScore !== undefined &&
      record.scales.bnt.spontaneousScore > 0
  );
  const hasMesStarted = Boolean(
    record.scales.mes?.score !== undefined && record.scales.mes.score > 0
  );
  const hasFaqStarted = Boolean(
    record.scales.faq?.items && Object.keys(record.scales.faq.items).length > 0
  );
  const hasPsqiStarted = Boolean(
    record.scales.psqi && (
      (record.scales.psqi.troubles && Object.keys(record.scales.psqi.troubles).length > 0) ||
      record.scales.psqi.selfQuality !== undefined
    )
  );

  const triggerSaveFeedback = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleUpdateDiagnosis = (patch: Partial<SubjectRecord["diagnosis"]>) => {
    if (!onChange) return;
    onChange({
      diagnosis: {
        ...(record.diagnosis || { category: 1, notes: "" }),
        ...patch,
      } as any,
    });
    triggerSaveFeedback();
  };

  const handleUpdateFollowUp = (patch: Partial<SubjectRecord["followUp"]>) => {
    if (!onChange) return;
    onChange({
      followUp: {
        ...record.followUp,
        ...patch,
      },
    });
    triggerSaveFeedback();
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(record, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `SCD_Subject_${record.subjectNo || record.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCsv = () => {
    if (onExportExcel) {
      onExportExcel();
      return;
    }
    const headers = [
      "SubjectID", "Name", "Age", "Gender", "EduYears", "ProtocolNo", "VisitCode",
      "SCD_Q9", "MMSE", "MoCA_B", "AVLT_N5", "LogicalMemory_Delayed",
      "STT_A_Sec", "STT_B_Sec", "BNT_Score", "MES_Total", "ADAS_Cog",
      "CDR_Global", "CDR_SB", "FAQ", "ECog_Avg", "GDS_15", "HAMD_17", "HAMA",
      "PSQI", "RBDSQ", "ESS", "NPI_Total", "APOE", "AbetaPET", "TauPET", "DiagnosisCategory",
      "ApprovalStatus", "DoctorNotes"
    ];

    const values = [
      record.subjectNo, record.demographics.name, record.demographics.age,
      record.demographics.gender === 1 ? "Male" : "Female", record.demographics.educationYears,
      record.protocolNo, record.visitCode,
      hasScdStarted ? results.scdQ9.score : "--",
      hasMmseStarted ? results.mmse.score : "--",
      hasMocaStarted ? results.mocaB.score : "--",
      hasAvltStarted ? results.avltH.n5Score : "--",
      hasLogicalMemoryStarted ? results.logicalMemory.delayedStoryUnits : "--",
      record.scales.stt.sttATestSeconds, record.scales.stt.sttBTestSeconds,
      hasBntStarted ? results.bnt.spontaneousScore : "--",
      hasMesStarted ? results.mes.score : "--",
      adas.totalScore,
      cdr.globalCDR, cdr.cdrSumOfBoxes,
      hasFaqStarted ? results.faq.score : "--",
      results.ecog.avgScore,
      results.gds15.score, results.hamd17.score, results.hama.score,
      hasPsqiStarted ? results.psqi.score : "--",
      results.rbdsq.score, results.ess.score,
      results.npi.totalScore, record.biomarkers.apoe4Genotype.value,
      record.biomarkers.abetaPet === 1 ? "Positive" : "Negative",
      record.biomarkers.tauPet === 1 ? "Positive" : "Negative",
      record.diagnosis?.category ?? 0,
      record.diagnosis?.approvalStatus || "none",
      record.diagnosis?.notes || ""
    ];

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(",") + "\n" + values.map(v => `"${v ?? ""}"`).join(",");
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", encodeURI(csvContent));
    downloadAnchor.setAttribute("download", `SCD_Data_${record.subjectNo || record.id}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyClipboard = () => {
    const summaryText = `【首都医科大学宣武医院 AD-SCD 临床评估报告】
受试者: ${record.demographics.name} | 年龄: ${record.demographics.age}岁 | 性别: ${record.demographics.gender === 1 ? "男" : "女"} | 文化程度: ${record.demographics.educationYears}年
编号: ${record.subjectNo} | 访视: ${record.visitCode} | 日期: ${record.evalDate}

【主要评估量表结果】
• SCD-Q9 主诉自评: ${hasScdStarted ? `${results.scdQ9.score}/9 分 (${results.scdQ9.isPositive ? "SCD主诉阳性" : "轻微"})` : "未开展"}
• MMSE 简易精神状态: ${hasMmseStarted ? `${results.mmse.score}/30 分 (常模切点 ≤${results.mmse.cutoff}分 -> ${results.mmse.isAbnormal ? "异常" : "正常"})` : "未开展"}
• MoCA-B 蒙特利尔基础: ${hasMocaStarted ? `${results.mocaB.score}/30 分 (常模切点 ≤${results.mocaB.cutoff}分 -> ${results.mocaB.isAbnormal ? "异常" : "正常"})` : "未开展"}
• AVLT-H 20min长延迟回忆: ${hasAvltStarted ? `${results.avltH.n5Score}/12 个词` : "未开展"}
• Global CDR 全球痴呆评定: ${cdr.globalCDR} 级 (CDR-SB: ${cdr.cdrSumOfBoxes} 分, 判定: ${cdr.description})
• ADAS-Cog 认知总分: ${adas.totalScore}/70 分 (${adas.severity})
• FAQ 日常活动功能: ${hasFaqStarted ? `${results.faq.score}/30 分` : "未测"}
• PSQI 睡眠质量: ${hasPsqiStarted ? `${results.psqi.score}/21 分` : "未测"}

【生物标志物与诊断】
• APOE 基因型: ${record.biomarkers.apoe4Genotype.value || "未测"}
• Aβ-PET: ${record.biomarkers.abetaPet === 1 ? "阳性 (A+)" : "阴性 (A-)"}
• Tau-PET: ${record.biomarkers.tauPet === 1 ? "阳性 (T+)" : "阴性 (T-)"}
• 临床诊断: ${record.diagnosis?.category === 1 ? "主观认知下降 (SCD)" : record.diagnosis?.category === 2 ? "遗忘型轻度认知障碍 (aMCI)" : "待研判/其他"}
• 评估医师: ${record.followUp?.evaluatorSignature || record.evaluator || "待签字"}`;

    navigator.clipboard.writeText(summaryText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-teal-700 font-bold">
            临床神经心理学全套量表与生物标志物综合分析看板
          </div>
          <h2 className="text-xl font-bold mt-1 text-slate-900">
            受试者综合评估报告与智能辅助决策
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            受试者: <span className="font-semibold text-slate-800">{record.demographics.name}</span> | 年龄: {record.demographics.age}岁 | 受教育: {record.demographics.educationYears}年 | 方案: {record.protocolNo}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onOpenAiModal}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-2xs transition"
          >
            <Sparkles className="w-4 h-4 text-purple-200" />
            <span>AI 临床智能推理</span>
          </button>

          <button
            onClick={onOpenPrintModal}
            className="flex items-center space-x-1 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold border border-indigo-200 transition"
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>A4 报告打印</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition"
            title="导出为多中心科研 Excel/CSV 格式"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>导出表格 (Excel/CSV)</span>
          </button>

          <button
            onClick={handleCopyClipboard}
            className="flex items-center space-x-1 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition"
            title="复制临床摘要文本"
          >
            {isCopied ? <Check className="w-4 h-4 text-teal-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
            <span>{isCopied ? "已复制" : "复制摘要"}</span>
          </button>
        </div>
      </div>

      {/* Core Diagnosis Card & Global CDR & ADAS-Cog */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Diagnosis & Approval status card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              综合临床诊断分类
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                record.diagnosis?.approvalStatus === "approved"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : record.diagnosis?.approvalStatus === "pending"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
            >
              {record.diagnosis?.approvalStatus === "approved"
                ? "✓ 医师已审核签署"
                : record.diagnosis?.approvalStatus === "pending"
                ? "⏳ 待主治医师审核签字"
                : "待评估 / 未开展"}
            </span>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">
              临床分型确认 (支持医生调整)：
            </label>
            <select
              value={record.diagnosis?.category ?? 0}
              onChange={(e) => handleUpdateDiagnosis({ category: Number(e.target.value) as any })}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-800"
            >
              <option value={0}>待临床综合研判 (0)</option>
              <option value={1}>1. 主观认知下降 (SCD)</option>
              <option value={2}>2. 遗忘型轻度认知障碍 (aMCI)</option>
              <option value={3}>3. 非遗忘型轻度认知障碍 (naMCI)</option>
              <option value={4}>4. 阿尔茨海默病痴呆期 (AD)</option>
              <option value={5}>5. 正常健康对照 (NC)</option>
              <option value={6}>6. 其他类型认知损害</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-500">
                主治医生临床诊断意见与随访建议：
              </label>
              {saveToast && (
                <span className="text-[10px] text-emerald-600 font-bold">已保存</span>
              )}
            </div>
            <textarea
              rows={3}
              value={record.diagnosis?.notes || ""}
              onChange={(e) => handleUpdateDiagnosis({ notes: e.target.value })}
              placeholder="尚未出具临床随访建议。可点击右上角「AI 临床智能推理」生成意见并推送到医生审核。"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 leading-relaxed focus:border-teal-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-500">审核状态切换:</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => handleUpdateDiagnosis({ approvalStatus: "pending" })}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition ${
                  record.diagnosis?.approvalStatus === "pending"
                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                待审核
              </button>
              <button
                type="button"
                onClick={() => handleUpdateDiagnosis({ approvalStatus: "approved" })}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition ${
                  record.diagnosis?.approvalStatus === "approved"
                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                已签署
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Global CDR 全球痴呆评定
            </span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-bold font-mono text-slate-900">
                {cdr.globalCDR}
              </span>
              <span className="text-sm font-semibold text-slate-600">级 ({cdr.description})</span>
            </div>
            <div className="text-xs text-slate-500 font-mono mt-1">
              CDR-SB (Sum of Boxes): <strong className="text-slate-800 font-bold">{cdr.cdrSumOfBoxes}</strong> / 18 分
            </div>
          </div>
          <div className="text-[11px] text-teal-700 bg-teal-50 p-2.5 rounded-xl border border-teal-100">
            {cdr.globalCDR === 0 ? "✅ 符合 SCD 核心准则 (CDR=0, 无客观痴呆)" : "⚠️ CDR > 0 提示存在客观轻度功能减退"}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              ADAS-Cog 认知损伤程度
            </span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-bold font-mono text-slate-900">
                {adas.totalScore}
              </span>
              <span className="text-xs text-slate-500">/ 70 分 (错误计分)</span>
            </div>
            <div className="text-xs font-semibold text-indigo-700 mt-1">
              评级：{adas.severity}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            涵盖即刻记忆、执行力、命名、定向、理解及运用共 12 个认知子维度。
          </div>
        </div>
      </div>

      {/* Normative Traffic Light Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-800 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              <span>神经心理学量表常模对比红黄绿灯矩阵</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              自动依据受试者年龄 ({record.demographics.age} 岁) 及受教育年限 ({record.demographics.educationYears} 年) 匹配中国人群常模切点
            </p>
          </div>
          <button
            onClick={handleCopyClipboard}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
            <span>{isCopied ? "已复制到剪贴板" : "复制报告摘要"}</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5 pl-6">测验量表名称</th>
                <th className="p-3.5">受试者得分 / 表现</th>
                <th className="p-3.5">对应年龄/教育常模切点</th>
                <th className="p-3.5">常模界值判定</th>
                <th className="p-3.5 pr-6">临床意义分析</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {/* SCD-Q9 */}
              <tr className="hover:bg-slate-50/50 transition">
                <td className="p-3.5 pl-6 font-medium text-slate-900">SCD-Q9 主观认知自评</td>
                <td className="p-3.5 font-mono font-bold text-slate-900">
                  {hasScdStarted ? `${results.scdQ9.score} / 9 分` : "-- / 9 分"}
                </td>
                <td className="p-3.5 text-slate-500">界值 ≥ 5 分</td>
                <td className="p-3.5">
                  {!hasScdStarted ? (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                      ⚪ 待评定 / 未开展
                    </span>
                  ) : (
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold inline-flex items-center space-x-1 ${
                      results.scdQ9.isPositive ? "bg-amber-100 text-amber-800" : "bg-teal-100 text-teal-800"
                    }`}>
                      {results.scdQ9.isPositive ? "⚠️ 主诉阳性" : "✅ 轻微/正常"}
                    </span>
                  )}
                </td>
                <td className="p-3.5 pr-6 text-slate-600 text-[11px]">
                  {!hasScdStarted
                    ? "受试者尚未开展 SCD-Q9 自评问卷"
                    : results.scdQ9.isPositive
                    ? "受试者主观感到记忆或认知功能存在下降且有困扰"
                    : "主观认知功能主诉不明显"}
                </td>
              </tr>

              {/* MMSE */}
              <tr className="hover:bg-slate-50/50 transition">
                <td className="p-3.5 pl-6 font-medium text-slate-900">MMSE 简易精神状态检查</td>
                <td className="p-3.5 font-mono font-bold text-slate-900">
                  {hasMmseStarted ? `${results.mmse.score} / 30 分` : "-- / 30 分"}
                </td>
                <td className="p-3.5 text-slate-500">{results.mmse.eduGroup} 切点 ≤ {results.mmse.cutoff} 分</td>
                <td className="p-3.5">
                  {!hasMmseStarted ? (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                      ⚪ 待评定 / 未测
                    </span>
                  ) : (
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold inline-flex items-center space-x-1 ${
                      results.mmse.isAbnormal ? "bg-red-100 text-red-800" : "bg-teal-100 text-teal-800"
                    }`}>
                      {results.mmse.isAbnormal ? "❌ 低于常模(异常)" : "✅ 正常范围"}
                    </span>
                  )}
                </td>
                <td className="p-3.5 pr-6 text-slate-600 text-[11px]">
                  {!hasMmseStarted
                    ? "尚未开展 MMSE 精神状态检查"
                    : results.mmse.isAbnormal
                    ? "提示存在客观全面认知功能损害"
                    : "全面精神认知筛查良好"}
                </td>
              </tr>

              {/* MoCA-B */}
              <tr className="hover:bg-slate-50/50 transition">
                <td className="p-3.5 pl-6 font-medium text-slate-900">MoCA-B 基础认知量表</td>
                <td className="p-3.5 font-mono font-bold text-slate-900">
                  {hasMocaStarted ? `${results.mocaB.score} / 30 分` : "-- / 30 分"}
                </td>
                <td className="p-3.5 text-slate-500">{results.mocaB.eduGroup} 切点 ≤ {results.mocaB.cutoff} 分</td>
                <td className="p-3.5">
                  {!hasMocaStarted ? (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                      ⚪ 待评定 / 未测
                    </span>
                  ) : (
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold inline-flex items-center space-x-1 ${
                      results.mocaB.isAbnormal ? "bg-red-100 text-red-800" : "bg-teal-100 text-teal-800"
                    }`}>
                      {results.mocaB.isAbnormal ? "❌ 低于常模(异常)" : "✅ 正常范围"}
                    </span>
                  )}
                </td>
                <td className="p-3.5 pr-6 text-slate-600 text-[11px]">
                  {!hasMocaStarted
                    ? "尚未开展 MoCA-B 基础认知测评"
                    : results.mocaB.isAbnormal
                    ? "基础认知敏锐度降低，提示 MCI 倾向"
                    : "执行与视空间等多维基础认知完整"}
                </td>
              </tr>

              {/* AVLT-H N5 */}
              <tr className="hover:bg-slate-50/50 transition">
                <td className="p-3.5 pl-6 font-medium text-slate-900">AVLT-H 20分钟长延迟回忆 (N5)</td>
                <td className="p-3.5 font-mono font-bold text-slate-900">
                  {hasAvltStarted ? `${results.avltH.n5Score} / 12 词` : "-- / 12 词"}
                </td>
                <td className="p-3.5 text-slate-500">{results.avltH.ageGroup} 切点 ≤ {results.avltH.n5Cutoff} 词</td>
                <td className="p-3.5">
                  {!hasAvltStarted ? (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                      ⚪ 待评定 / 未测
                    </span>
                  ) : (
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold inline-flex items-center space-x-1 ${
                      results.avltH.isN5Abnormal ? "bg-red-100 text-red-800" : "bg-teal-100 text-teal-800"
                    }`}>
                      {results.avltH.isN5Abnormal ? "❌ 情景记忆受损" : "✅ 正常范围"}
                    </span>
                  )}
                </td>
                <td className="p-3.5 pr-6 text-slate-600 text-[11px]">
                  {!hasAvltStarted
                    ? "尚未开展华山听觉词语学习长延迟回忆测验"
                    : results.avltH.isN5Abnormal
                    ? "海马依赖性情景长延迟记忆受损 (AD 核心标志)"
                    : "海马巩固与长延迟提取能力良好"}
                </td>
              </tr>

              {/* Logical Memory */}
              <tr className="hover:bg-slate-50/50 transition">
                <td className="p-3.5 pl-6 font-medium text-slate-900">逻辑记忆 30分钟延时故事回忆</td>
                <td className="p-3.5 font-mono font-bold text-slate-900">
                  {hasLogicalMemoryStarted ? `${results.logicalMemory.delayedStoryUnits} / 25 单元` : "-- / 25 单元"}
                </td>
                <td className="p-3.5 text-slate-500">切点 ≤ {results.logicalMemory.delayedCutoff} 单元</td>
                <td className="p-3.5">
                  {!hasLogicalMemoryStarted ? (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                      ⚪ 待评定 / 未测
                    </span>
                  ) : (
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold inline-flex items-center space-x-1 ${
                      results.logicalMemory.isDelayedAbnormal ? "bg-red-100 text-red-800" : "bg-teal-100 text-teal-800"
                    }`}>
                      {results.logicalMemory.isDelayedAbnormal ? "❌ 故事回忆异常" : "✅ 正常范围"}
                    </span>
                  )}
                </td>
                <td className="p-3.5 pr-6 text-slate-600 text-[11px]">
                  {!hasLogicalMemoryStarted
                    ? "尚未开展逻辑故事延时回忆"
                    : results.logicalMemory.isDelayedAbnormal
                    ? "复杂语篇故事记忆遗忘加速"
                    : "语篇逻辑情景记忆完好"}
                </td>
              </tr>

              {/* STT-B */}
              <tr className="hover:bg-slate-50/50 transition">
                <td className="p-3.5 pl-6 font-medium text-slate-900">STT-B 形状连线测验耗时</td>
                <td className="p-3.5 font-mono font-bold text-slate-900">
                  {hasSttStarted ? `${record.scales.stt.sttBTestSeconds} 秒` : "-- 秒"}
                </td>
                <td className="p-3.5 text-slate-500">{results.stt.group} 切点 ≥ {results.stt.bCutoff} 秒</td>
                <td className="p-3.5">
                  {!hasSttStarted ? (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                      ⚪ 待评定 / 未测
                    </span>
                  ) : (
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold inline-flex items-center space-x-1 ${
                      results.stt.isBAbnormal ? "bg-red-100 text-red-800" : "bg-teal-100 text-teal-800"
                    }`}>
                      {results.stt.isBAbnormal ? "❌ 执行功能减退" : "✅ 正常速度"}
                    </span>
                  )}
                </td>
                <td className="p-3.5 pr-6 text-slate-600 text-[11px]">
                  {!hasSttStarted
                    ? "尚未开展形状连线执行功能测验"
                    : results.stt.isBAbnormal
                    ? "注意转换与额叶执行功能耗时显著延长"
                    : "注意力与心理灵活性处理正常"}
                </td>
              </tr>

              {/* BNT */}
              <tr className="hover:bg-slate-50/50 transition">
                <td className="p-3.5 pl-6 font-medium text-slate-900">BNT 30项波士顿命名</td>
                <td className="p-3.5 font-mono font-bold text-slate-900">
                  {hasBntStarted ? `${results.bnt.spontaneousScore} / 30 题` : "-- / 30 题"}
                </td>
                <td className="p-3.5 text-slate-500">{results.bnt.group} 切点 ≤ {results.bnt.cutoff} 题</td>
                <td className="p-3.5">
                  {!hasBntStarted ? (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                      ⚪ 待评定 / 未测
                    </span>
                  ) : (
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold inline-flex items-center space-x-1 ${
                      results.bnt.isAbnormal ? "bg-red-100 text-red-800" : "bg-teal-100 text-teal-800"
                    }`}>
                      {results.bnt.isAbnormal ? "❌ 命名找词障碍" : "✅ 语义命名正常"}
                    </span>
                  )}
                </td>
                <td className="p-3.5 pr-6 text-slate-600 text-[11px]">
                  {!hasBntStarted
                    ? "尚未开展波士顿命名测验"
                    : results.bnt.isAbnormal
                    ? "物体命名与语义提取受损"
                    : "语言与视觉语义识别良好"}
                </td>
              </tr>

              {/* MES */}
              <tr className="hover:bg-slate-50/50 transition">
                <td className="p-3.5 pl-6 font-medium text-slate-900">MES 记忆与执行量表</td>
                <td className="p-3.5 font-mono font-bold text-slate-900">
                  {hasMesStarted ? `${results.mes.score} / 100 分` : "-- / 100 分"}
                </td>
                <td className="p-3.5 text-slate-500">{results.mes.eduGroup} 切点 ≤ {results.mes.cutoff} 分</td>
                <td className="p-3.5">
                  {!hasMesStarted ? (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                      ⚪ 待评定 / 未测
                    </span>
                  ) : (
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold inline-flex items-center space-x-1 ${
                      results.mes.isAbnormal ? "bg-red-100 text-red-800" : "bg-teal-100 text-teal-800"
                    }`}>
                      {results.mes.isAbnormal ? "❌ MES 异常" : "✅ 正常"}
                    </span>
                  )}
                </td>
                <td className="p-3.5 pr-6 text-slate-600 text-[11px]">
                  {!hasMesStarted
                    ? "尚未开展 MES 记忆与执行综合测验"
                    : results.mes.isAbnormal
                    ? "综合记忆与动作执行能力受损"
                    : "记忆与执行复合功能良好"}
                </td>
              </tr>

              {/* FAQ */}
              <tr className="hover:bg-slate-50/50 transition">
                <td className="p-3.5 pl-6 font-medium text-slate-900">FAQ 功能活动调查表</td>
                <td className="p-3.5 font-mono font-bold text-slate-900">
                  {hasFaqStarted ? `${results.faq.score} / 30 分` : "-- / 30 分"}
                </td>
                <td className="p-3.5 text-slate-500">界值 ≥ 5 分提示受损</td>
                <td className="p-3.5">
                  {!hasFaqStarted ? (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                      ⚪ 待评定 / 未测
                    </span>
                  ) : (
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold inline-flex items-center space-x-1 ${
                      results.faq.isAbnormal ? "bg-red-100 text-red-800" : "bg-teal-100 text-teal-800"
                    }`}>
                      {results.faq.isAbnormal ? "❌ 生活自理受损" : "✅ 独立完整 (SCD符合)"}
                    </span>
                  )}
                </td>
                <td className="p-3.5 pr-6 text-slate-600 text-[11px]">
                  {!hasFaqStarted
                    ? "尚未开展知情者 FAQ 日常活动功能调查"
                    : results.faq.isAbnormal
                    ? "日常生活工具性活动受到明显损害"
                    : "完全具备独立社区与家务生活能力"}
                </td>
              </tr>

              {/* PSQI */}
              <tr className="hover:bg-slate-50/50 transition">
                <td className="p-3.5 pl-6 font-medium text-slate-900">PSQI 匹兹堡睡眠质量</td>
                <td className="p-3.5 font-mono font-bold text-slate-900">
                  {hasPsqiStarted ? `${results.psqi.score} / 21 分` : "-- / 21 分"}
                </td>
                <td className="p-3.5 text-slate-500">界值 ≥ 8 分提示障碍</td>
                <td className="p-3.5">
                  {!hasPsqiStarted ? (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                      ⚪ 待评定 / 未测
                    </span>
                  ) : (
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold inline-flex items-center space-x-1 ${
                      results.psqi.isAbnormal ? "bg-amber-100 text-amber-800" : "bg-teal-100 text-teal-800"
                    }`}>
                      {results.psqi.isAbnormal ? "⚠️ 睡眠障碍" : "✅ 睡眠良好"}
                    </span>
                  )}
                </td>
                <td className="p-3.5 pr-6 text-slate-600 text-[11px]">
                  {!hasPsqiStarted
                    ? "尚未开展 PSQI 睡眠质量问卷"
                    : results.psqi.isAbnormal
                    ? "慢性睡眠紊乱可加剧脑内 Aβ 清除障碍，需重点干预"
                    : "睡眠节律与质量良好"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
