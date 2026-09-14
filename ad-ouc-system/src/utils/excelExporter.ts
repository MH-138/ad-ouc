import * as XLSX from "xlsx";
import { SubjectRecord } from "../types/assessment";
import { evaluateCompleteAssessment, calculateCDRWashington } from "./scoringCalculators";

export interface ExportOptions {
  anonymize?: boolean; // 脱敏处理
  includeFollowupTimeline?: boolean;
}

/**
 * Anonymize string helper (e.g. "李建平" -> "李*平", "110101196005180011" -> "110101********0011")
 */
export function anonymizeName(name: string): string {
  if (!name) return "";
  if (name.length <= 1) return name;
  if (name.length === 2) return name[0] + "*";
  return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
}

export function anonymizeIdCard(id: string): string {
  if (!id || id.length < 10) return id;
  return id.substring(0, 6) + "********" + id.substring(id.length - 4);
}

export function anonymizePhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return phone.substring(0, 3) + "****" + phone.substring(phone.length - 4);
}

/**
 * Export SubjectRecord to Excel (.xlsx) file
 */
export function exportRecordToExcel(record: SubjectRecord, options: ExportOptions = {}) {
  const { anonymize = false } = options;
  const summary = evaluateCompleteAssessment(record);
  const cdrResult = calculateCDRWashington(record.scales.cdr);

  const displayName = anonymize ? anonymizeName(record.demographics?.name) : record.demographics?.name;
  const displayIdCard = anonymize ? anonymizeIdCard(record.demographics?.idCard) : record.demographics?.idCard;
  const displayPhone = anonymize ? anonymizePhone(record.demographics?.phone1) : record.demographics?.phone1;

  // Sheet 1: 基本资料与病史
  const demographicsData = [
    ["项目", "内容", "备注/单位"],
    ["受试者编号", record.subjectNo, "科研编号"],
    ["方案编号", record.protocolNo, ""],
    ["中心编号", record.centerNo, ""],
    ["访视代码", record.visitCode || "W000 (基线期)", ""],
    ["姓名", displayName, anonymize ? "已脱敏保护" : ""],
    ["性别", record.demographics?.gender === 1 ? "男" : record.demographics?.gender === 2 ? "女" : "未选", ""],
    ["年龄", record.demographics?.age, "岁"],
    ["出生日期", record.demographics?.birthDate, ""],
    ["身份证号", displayIdCard, anonymize ? "已脱敏保护" : ""],
    ["受教育年限", record.demographics?.educationYears, "年 (影响常模校正)"],
    ["联系电话", displayPhone, ""],
    ["身高", record.demographics?.height, "cm"],
    ["体重", record.demographics?.weight, "kg"],
    [
      "BMI 指数",
      record.demographics?.height && record.demographics?.weight
        ? (record.demographics.weight / Math.pow(record.demographics.height / 100, 2)).toFixed(1)
        : "未测",
      "kg/m²",
    ],
    ["脑血管病史", record.history?.cerebrovascular?.has ? "有" : "无", ""],
    ["高血压病史", record.history?.hypertension?.has ? `有 (平时: ${record.history.hypertension.usualBp || "未填"})` : "无", ""],
    ["糖尿病史", record.history?.diabetes?.has ? "有" : "无", ""],
    ["冠心病史", record.history?.coronaryHeartDisease?.has ? "有" : "无", ""],
    ["高脂血症", record.history?.hyperlipidemia?.has ? "有" : "无", ""],
    ["甲状腺异常", record.history?.thyroidAbnormality?.has ? "有" : "无", ""],
    ["脑外伤史", record.history?.tbi?.has ? "有" : "无", ""],
    ["全麻手术史", record.history?.generalAnesthesia?.has ? "有" : "无", ""],
    ["痴呆家族史", record.history?.familyHistoryDementia?.has ? "有" : "无", ""],
    ["MRI禁忌证", record.history?.mriContraindications ? "有" : "无", ""],
    ["主试姓名", record.evaluator || "未填写", ""],
    ["评估日期", record.evalDate, ""],
  ];

  // Sheet 2: 神经心理量表测试汇总表
  // BUG-EXPORT-02: 未作答量表显示 "--" 且不套用阈值灯色，避免空白患者被误判为重度异常/正常
  const unassessed = (s: any) => s && s.isAssessed === false;
  const sc = (s: any, value: any) => (unassessed(s) ? "--" : value);
  const warn = (s: any, normal: string, abnormal: string) =>
    unassessed(s) ? "⚪ 未评估" : s.isAbnormal ? `🔴 ${abnormal}` : `🟢 ${normal}`;
  const cdrUnassessed = !(record.scales?.cdr && Object.values(record.scales.cdr).some((v: any) => v != null));

  const scalesData = [
    ["量表代码", "量表名称", "测试得分", "常模参考界值", "健康状态预警", "靶向评估认知域"],
    ["SCD-Q9", "主观认知下降自测表", sc(summary.scdQ9, summary.scdQ9.score), "≥5 分提示主诉显著", unassessed(summary.scdQ9) ? "⚪ 未评估" : summary.scdQ9.isPositive ? "🟡 主诉阳性" : "🟢 正常", "主观记忆主诉与担忧"],
    ["MMSE", "简易精神状态检查", sc(summary.mmse, summary.mmse.score), `≤${summary.mmse.cutoff} 分 (${summary.mmse.eduGroup})`, warn(summary.mmse, "正常", "异常损害"), "总体认知初筛"],
    ["MoCA-B", "蒙特利尔认知基础量表", sc(summary.mocaB, summary.mocaB.score), `≤${summary.mocaB.cutoff} 分 (${summary.mocaB.eduGroup})`, warn(summary.mocaB, "正常", "异常损害"), "全面认知与执行力"],
    ["AVLT-N5", "华山版听觉长延迟回忆", sc(summary.avltH, summary.avltH.n5LongDelay), `≤${summary.avltH.delayCutoff} 词 (${summary.avltH.ageGroup})`, warn(summary.avltH, "正常", "显著受损"), "情景记忆 (海马依赖)"],
    ["AVLT-N7", "听觉词语再认识别", sc(summary.avltH, summary.avltH.n7Recognition), `≤${summary.avltH.recognitionCutoff} 词`, warn(summary.avltH, "正常", "异常"), "记忆再认提取"],
    ["VFT", "动物词语流畅性 (1分钟)", sc(summary.vft, summary.vft.totalScore), `≤${summary.vft.cutoff} 词 (${summary.vft.eduGroup})`, warn(summary.vft, "正常", "异常"), "语言流畅性与语义提取"],
    ["BNT-30", "波士顿命名自发命名", sc(summary.bnt, summary.bnt.spontaneousScore), `≤${summary.bnt.cutoff} 分 (${summary.bnt.eduGroup})`, warn(summary.bnt, "正常", "找词困难"), "视觉命名与语言表达"],
    ["STT-A", "形状连线 A 耗时", sc(summary.stt, `${summary.stt.sttATotal} 秒`), `>${summary.stt.aCutoff} 秒`, warn(summary.stt, "正常", "速度迟缓"), "信息处理速度与注意"],
    ["STT-B", "形状连线 B 耗时", sc(summary.stt, `${summary.stt.sttBTotal} 秒`), `>${summary.stt.bCutoff} 秒`, warn(summary.stt, "正常", "转换受损"), "认知灵活性与执行控制"],
    ["MES", "记忆与执行量表 (100分)", sc(summary.mes, summary.mes.score), `≤${summary.mes.cutoff} 分`, warn(summary.mes, "正常", "执行下降"), "综合记忆与动作执行"],
    ["Global CDR", "临床痴呆评定等级", cdrUnassessed ? "--" : cdrResult.globalCDR, "0:正常 / 0.5:MCI / 1:轻度痴呆", cdrUnassessed ? "⚪ 未评估" : cdrResult.globalCDR === 0 ? "🟢 正常/SCD" : cdrResult.globalCDR === 0.5 ? "🟡 可疑/MCI" : "🔴 痴呆", "临床痴呆分级 (华盛顿大学)"],
    ["CDR-SB", "CDR 箱总分", cdrUnassessed ? "--" : cdrResult.sumOfBoxes, "0-18 分", cdrUnassessed ? "⚪ 未评估" : cdrResult.sumOfBoxes > 0 ? "需关注" : "正常", "严重度累积积分"],
    ["FAQ", "功能活动问卷 (10项)", sc(summary.faq, summary.faq.sum), "≥9 分提示日常生活受损", warn(summary.faq, "生活自理良好", "独立能力受损"), "工具性日常生活活动 (IADL)"],
    ["GDS-15", "老年抑郁自评量表", sc(summary.gds15, summary.gds15.score), "≥8 分提示抑郁情绪", warn(summary.gds15, "情绪良好", "存在抑郁情绪"), "老年情绪筛查"],
    ["HAMD-17", "汉密尔顿抑郁量表", sc(summary.hamd17, summary.hamd17.total), "<7:正常 / ≥7:可能 / ≥17:肯定", warn(summary.hamd17, "无抑郁", "抑郁症状"), "抑郁严重度评定"],
    ["HAMA-14", "汉密尔顿焦虑量表", sc(summary.hama, summary.hama.total), "<7:无 / ≥7:可能 / ≥14:肯定", warn(summary.hama, "无焦虑", "焦虑症状"), "焦虑严重度评定"],
    ["NPI", "神经精神问卷 (12域)", sc(summary.npi, `总分: ${summary.npi.totalScore} / 痛苦值: ${summary.npi.distressScore}`), "症状域数: " + summary.npi.symptomCount, unassessed(summary.npi) ? "⚪ 未评估" : summary.npi.totalScore > 0 ? "🟡 存在精神行为症状" : "🟢 无异常", "精神行为症状 (BPSD)"],
    ["PSQI", "匹兹堡睡眠质量指数", sc(summary.psqi, summary.psqi.score), ">7 分提示睡眠质量差", warn(summary.psqi, "睡眠良好", "睡眠障碍"), "主观睡眠质量与效率"],
  ];

  // Sheet 3: 诊断结论与干预建议
  const diagnosisData = [
    ["项目", "评估内容与专家建议"],
    ["初步临床诊断分型", getDiagnosisName(record.diagnosis?.category)],
    ["医师审核签署状态", record.diagnosis?.approvalStatus === "approved" ? "已签署审核 (正式生效)" : record.diagnosis?.approvalStatus === "pending" ? "待主治医师审核签字" : "待评估 / 未开展"],
    ["诊断依据要点与随访医嘱", record.diagnosis?.notes || "尚未出具详细随访医嘱"],
    ["建议随访周期", record.followUp?.nextVisitDate ? `下次建议随访时间: ${record.followUp.nextVisitDate}` : "建议 6-12 个月进行一次纵向认知随访"],
    ["主试/签名医生", record.followUp?.evaluatorSignature || record.evaluator || "韩璎教授研究组"],
    ["导出时间", new Date().toLocaleString("zh-CN")],
  ];

  // Create Workbook
  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.aoa_to_sheet(demographicsData);
  const ws2 = XLSX.utils.aoa_to_sheet(scalesData);
  const ws3 = XLSX.utils.aoa_to_sheet(diagnosisData);

  // Set column widths
  ws1["!cols"] = [{ wch: 18 }, { wch: 32 }, { wch: 20 }];
  ws2["!cols"] = [{ wch: 12 }, { wch: 24 }, { wch: 14 }, { wch: 22 }, { wch: 16 }, { wch: 24 }];
  ws3["!cols"] = [{ wch: 20 }, { wch: 60 }];

  XLSX.utils.book_append_sheet(wb, ws1, "患者基本资料与病史");
  XLSX.utils.book_append_sheet(wb, ws2, "全套量表评定与常模");
  XLSX.utils.book_append_sheet(wb, ws3, "临床诊断与随访建议");

  // Trigger download
  // BUG-EXPORT-03: 文件名对 Windows 非法字符（\ / : * ? " < > |）做替换，避免脱敏后含 * 等导致 XLSX.writeFile 抛 ENOENT
  const safeFileNamePart = (s: string) => (s || "").replace(/[\\/:*?"<>|]/g, "_");
  const filename = `宣武医院_SCD认知评定_${safeFileNamePart(displayName || "受试者")}_${safeFileNamePart(record.evalDate || new Date().toISOString().slice(0, 10))}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Export Entire Cohort to Excel (.xlsx) file
 */
export function exportCohortToExcel(cohort: SubjectRecord[], options: ExportOptions = {}) {
  const { anonymize = false } = options;

  const header = [
    "受试者编号",
    "方案号",
    "中心编号",
    "访视代码",
    "姓名",
    "性别",
    "年龄",
    "教育年限",
    "评定日期",
    "SCD-Q9总分",
    "SCD-Q9主诉阳性",
    "MMSE总分",
    "MMSE常模界值",
    "MMSE异常",
    "MoCA-B总分",
    "MoCA-B常模界值",
    "MoCA-B异常",
    "AVLT-N5延迟回忆",
    "AVLT再认异常",
    "VFT动物流畅性",
    "BNT-30命名",
    "STT-A耗时(秒)",
    "STT-B耗时(秒)",
    "Global CDR分级",
    "CDR-SB箱总分",
    "FAQ总分",
    "HAMD-17总分",
    "HAMA总分",
    "NPI症状数",
    "NPI总分",
    "PSQI睡眠分",
    "临床诊断分型",
    "诊断依据与建议",
  ];

  const rows = cohort.map((rec) => {
    const sum = evaluateCompleteAssessment(rec);
    const cdr = calculateCDRWashington(rec.scales.cdr);
    const dName = anonymize ? anonymizeName(rec.demographics?.name) : rec.demographics?.name;
    // BUG-EXPORT-02: 未作答量表在科研数据集中显示 "--" 而非伪造的 0 分
    const un = (s: any) => s && s.isAssessed === false;
    const cval = (s: any, v: any) => (un(s) ? "--" : v);
    const cwarn = (s: any, n: string, a: string) => (un(s) ? "未评估" : s.isAbnormal ? a : n);
    const cdrUn = !(rec.scales?.cdr && Object.values(rec.scales.cdr).some((v: any) => v != null));

    return [
      rec.subjectNo,
      rec.protocolNo,
      rec.centerNo,
      rec.visitCode || "W000",
      dName,
      rec.demographics?.gender === 1 ? "男" : rec.demographics?.gender === 2 ? "女" : "未选",
      rec.demographics?.age,
      rec.demographics?.educationYears,
      rec.evalDate,
      cval(sum.scdQ9, sum.scdQ9.score),
      un(sum.scdQ9) ? "未评估" : sum.scdQ9.isPositive ? "阳性" : "阴性",
      cval(sum.mmse, sum.mmse.score),
      sum.mmse.cutoff,
      cwarn(sum.mmse, "正常", "异常"),
      cval(sum.mocaB, sum.mocaB.score),
      sum.mocaB.cutoff,
      cwarn(sum.mocaB, "正常", "异常"),
      cval(sum.avltH, sum.avltH.n5LongDelay),
      cwarn(sum.avltH, "正常", "异常"),
      cval(sum.vft, sum.vft.totalScore),
      cval(sum.bnt, sum.bnt.spontaneousScore),
      cval(sum.stt, sum.stt.sttATotal),
      cval(sum.stt, sum.stt.sttBTotal),
      cdrUn ? "--" : cdr.globalCDR,
      cdrUn ? "--" : cdr.sumOfBoxes,
      cval(sum.faq, sum.faq.sum),
      cval(sum.hamd17, sum.hamd17.total),
      cval(sum.hama, sum.hama.total),
      cval(sum.npi, sum.npi.symptomCount),
      cval(sum.npi, sum.npi.totalScore),
      cval(sum.psqi, sum.psqi.score),
      getDiagnosisName(rec.diagnosis?.category),
      rec.diagnosis?.notes || "",
    ];
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, "全队列科研数据集");

  const filename = `宣武医院_AD-SCD全队列科研数据集_${cohort.length}例_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

function getDiagnosisName(cat?: number): string {
  switch (cat) {
    case 1:
      return "SCD (主观认知下降 / AD临床前期)";
    case 2:
      return "aMCI (遗忘型轻度认知障碍)";
    case 3:
      return "AD (阿尔茨海默病痴呆期)";
    case 4:
      return "NC (健康老年对照)";
    case 5:
      return "svMCI (皮质下血管性轻度认知障碍)";
    case 6:
      return "FTD (额颞叶痴呆)";
    case 7:
      return "抑郁相关假性认知下降";
    case 8:
      return "FAD (家族型阿尔茨海默病)";
    case 9:
      return "DLB (路易体痴呆)";
    default:
      return "待明确诊断 (结合生物标志物随访)";
  }
}
