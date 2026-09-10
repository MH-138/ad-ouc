import React from "react";
import { SubjectRecord } from "../types/assessment";
import {
  evaluateCompleteAssessment,
  calculateGlobalCDR,
  calculateADASCog,
} from "../utils/scoringCalculators";
import { Printer, X, FileText, CheckCircle2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  record: SubjectRecord;
}

export const PrintReportModal: React.FC<Props> = ({ isOpen, onClose, record }) => {
  if (!isOpen) return null;

  const results = evaluateCompleteAssessment(record);
  const cdr = calculateGlobalCDR(record.scales.cdr);
  const adas = calculateADASCog(record.scales.adasCog);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Action bar (hidden when printed) */}
        <div className="p-3.5 px-6 bg-slate-50 text-slate-800 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-teal-700" />
            <span className="font-bold text-sm text-slate-900">宣武医院 AD-SCD 临床科研评估报告（打印/导出预览）</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>立即打印 / 存为 PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto flex-1 font-sans text-slate-900 space-y-6 print:p-0 print:overflow-visible">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4">
            <div className="text-xs uppercase tracking-widest font-bold text-slate-600">
              首都医科大学宣武医院 · 国家神经疾病医学中心
            </div>
            <h1 className="text-2xl font-bold text-slate-950 mt-1">
              阿尔茨海默病主观认知下降 (AD-SCD) 多模态临床神经心理评估报告
            </h1>
            <div className="text-xs text-slate-500 mt-1 flex justify-center space-x-6">
              <span>方案编号: <strong>{record.protocolNo}</strong></span>
              <span>受试者编号: <strong>{record.subjectNo}</strong></span>
              <span>访视代码: <strong>{record.visitCode}</strong></span>
              <span>评估日期: <strong>{record.evalDate}</strong></span>
            </div>
          </div>

          {/* Subject Demographics Grid */}
          <div className="border border-slate-300 rounded-lg p-3.5 text-xs bg-slate-50/50 grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-4">
            <div><strong>受试者姓名：</strong>{record.demographics.name}</div>
            <div><strong>性别：</strong>{record.demographics.gender === 1 ? "男" : "女"}</div>
            <div><strong>实足年龄：</strong>{record.demographics.age} 岁</div>
            <div><strong>受教育年限：</strong>{record.demographics.educationYears} 年 ({record.demographics.educationLevel || "高中/大专"})</div>
            <div><strong>利手：</strong>{record.scales.handedness.dominantHand === "right" ? "右手利 (右利手)" : "左手利"}</div>
            <div><strong>病史提供者：</strong>{record.demographics.informantRelation || "配偶/子女"}</div>
            <div><strong>认知下降首发年龄：</strong>{record.demographics.cognitiveOnsetAge || record.demographics.age} 岁</div>
            <div><strong>APOE 基因型：</strong><span className="font-bold text-teal-800">{record.biomarkers.apoe4Genotype.value || "未检测"}</span></div>
          </div>

          {/* Assessment Scores Table */}
          <div>
            <h3 className="font-bold text-sm text-slate-900 mb-2 border-l-4 border-teal-700 pl-2">
              一、神经心理学量表检查结果与常模对照表
            </h3>
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 text-slate-900 font-semibold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300">量表类别与测验项目</th>
                  <th className="p-2 border-r border-slate-300">得分/结果</th>
                  <th className="p-2 border-r border-slate-300">常模切点 (按年龄/学历)</th>
                  <th className="p-2 border-r border-slate-300">常模判定</th>
                  <th className="p-2">临床功能域评估</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2 border-r border-slate-300 font-medium">SCD-Q9 主观认知下降自评</td>
                  <td className="p-2 border-r border-slate-300 font-bold font-mono">{results.scdQ9.score} / 9 分</td>
                  <td className="p-2 border-r border-slate-300">界值 ≥ 5 分</td>
                  <td className="p-2 border-r border-slate-300">{results.scdQ9.isPositive ? "⚠️ 主诉阳性" : "正常"}</td>
                  <td className="p-2">主观感知与担忧</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-300 font-medium">MMSE 简易精神状态检查</td>
                  <td className="p-2 border-r border-slate-300 font-bold font-mono">{results.mmse.score} / 30 分</td>
                  <td className="p-2 border-r border-slate-300">切点 ≤ {results.mmse.cutoff} 分 ({results.mmse.eduGroup})</td>
                  <td className="p-2 border-r border-slate-300">{results.mmse.isAbnormal ? "❌ 异常" : "✅ 正常"}</td>
                  <td className="p-2">全面精神认知筛查</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-300 font-medium">MoCA-B 蒙特利尔认知基础量表</td>
                  <td className="p-2 border-r border-slate-300 font-bold font-mono">{results.mocaB.score} / 30 分</td>
                  <td className="p-2 border-r border-slate-300">切点 ≤ {results.mocaB.cutoff} 分 ({results.mocaB.eduGroup})</td>
                  <td className="p-2 border-r border-slate-300">{results.mocaB.isAbnormal ? "❌ 异常" : "✅ 正常"}</td>
                  <td className="p-2">多认知域灵敏度</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-300 font-medium">AVLT-H 20min长延迟回忆 (N5)</td>
                  <td className="p-2 border-r border-slate-300 font-bold font-mono">{results.avltH.n5Score} / 12 词</td>
                  <td className="p-2 border-r border-slate-300">切点 ≤ {results.avltH.n5Cutoff} 词 ({results.avltH.ageGroup})</td>
                  <td className="p-2 border-r border-slate-300">{results.avltH.isN5Abnormal ? "❌ 异常" : "✅ 正常"}</td>
                  <td className="p-2">海马依赖长延迟情景记忆</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-300 font-medium">逻辑记忆 30min延时故事回忆</td>
                  <td className="p-2 border-r border-slate-300 font-bold font-mono">{results.logicalMemory.delayedStoryUnits} / 25 单元</td>
                  <td className="p-2 border-r border-slate-300">切点 ≤ {results.logicalMemory.delayedCutoff} 单元</td>
                  <td className="p-2 border-r border-slate-300">{results.logicalMemory.isDelayedAbnormal ? "❌ 异常" : "✅ 正常"}</td>
                  <td className="p-2">语篇故事逻辑记忆</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-300 font-medium">STT-B 形状连线测验耗时</td>
                  <td className="p-2 border-r border-slate-300 font-bold font-mono">{record.scales.stt.sttBTestSeconds} 秒</td>
                  <td className="p-2 border-r border-slate-300">切点 ≥ {results.stt.bCutoff} 秒 ({results.stt.group})</td>
                  <td className="p-2 border-r border-slate-300">{results.stt.isBAbnormal ? "❌ 异常" : "✅ 正常"}</td>
                  <td className="p-2">执行功能与注意转换</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-300 font-medium">BNT 30项波士顿命名测验</td>
                  <td className="p-2 border-r border-slate-300 font-bold font-mono">{results.bnt.spontaneousScore} / 30 题</td>
                  <td className="p-2 border-r border-slate-300">切点 ≤ {results.bnt.cutoff} 题 ({results.bnt.group})</td>
                  <td className="p-2 border-r border-slate-300">{results.bnt.isAbnormal ? "❌ 异常" : "✅ 正常"}</td>
                  <td className="p-2">语言命名与语义提取</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-300 font-medium">MES 记忆与执行量表</td>
                  <td className="p-2 border-r border-slate-300 font-bold font-mono">{results.mes.score} / 100 分</td>
                  <td className="p-2 border-r border-slate-300">切点 ≤ {results.mes.cutoff} 分 ({results.mes.eduGroup})</td>
                  <td className="p-2 border-r border-slate-300">{results.mes.isAbnormal ? "❌ 异常" : "✅ 正常"}</td>
                  <td className="p-2">记忆与执行综合功能</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-300 font-medium">ADAS-Cog 认知总分</td>
                  <td className="p-2 border-r border-slate-300 font-bold font-mono">{adas.totalScore} / 70 分</td>
                  <td className="p-2 border-r border-slate-300">分级: {adas.severity}</td>
                  <td className="p-2 border-r border-slate-300">{adas.totalScore <= 10 ? "✅ 正常" : "轻度受损"}</td>
                  <td className="p-2">临床试验标准认知评分</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-300 font-medium">Global CDR 临床痴呆评定</td>
                  <td className="p-2 border-r border-slate-300 font-bold font-mono">{cdr.globalCDR} 级 (SB: {cdr.cdrSumOfBoxes})</td>
                  <td className="p-2 border-r border-slate-300">SCD必须为 CDR = 0</td>
                  <td className="p-2 border-r border-slate-300">{cdr.globalCDR === 0 ? "✅ 符合SCD" : "⚠️ 需注意"}</td>
                  <td className="p-2">临床痴呆严重度分级</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-300 font-medium">FAQ 日常活动能力调查表</td>
                  <td className="p-2 border-r border-slate-300 font-bold font-mono">{results.faq.score} / 30 分</td>
                  <td className="p-2 border-r border-slate-300">受损切点 ≥ 5 分</td>
                  <td className="p-2 border-r border-slate-300">{results.faq.isAbnormal ? "❌ 受损" : "✅ 独立"}</td>
                  <td className="p-2">日常生活工具性活动</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-300 font-medium">GDS-15 老年抑郁自评量表</td>
                  <td className="p-2 border-r border-slate-300 font-bold font-mono">{results.gds15.score} / 15 分</td>
                  <td className="p-2 border-r border-slate-300">提示抑郁 ≥ 8 分</td>
                  <td className="p-2 border-r border-slate-300">{results.gds15.isDepressed ? "⚠️ 抑郁症状" : "✅ 正常"}</td>
                  <td className="p-2">情绪与心理状态</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-300 font-medium">PSQI 匹兹堡睡眠质量指数</td>
                  <td className="p-2 border-r border-slate-300 font-bold font-mono">{results.psqi.score} / 21 分</td>
                  <td className="p-2 border-r border-slate-300">障碍切点 ≥ 8 分</td>
                  <td className="p-2 border-r border-slate-300">{results.psqi.isAbnormal ? "⚠️ 睡眠障碍" : "✅ 良好"}</td>
                  <td className="p-2">睡眠连续性与质量</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ATN Biomarker summary */}
          <div>
            <h3 className="font-bold text-sm text-slate-900 mb-2 border-l-4 border-teal-700 pl-2">
              二、ATN 生物学框架与影像检测概要
            </h3>
            <div className="grid grid-cols-3 gap-3 text-xs border border-slate-300 p-3 rounded-lg bg-slate-50">
              <div>
                <strong>A (淀粉样蛋白 Aβ)：</strong>
                <span>{record.biomarkers.abetaPet === 1 ? "Aβ-PET 阳性 (A+)" : record.biomarkers.abetaPet === 2 ? "Aβ-PET 阴性 (A-)" : "未行PET检查"}</span>
              </div>
              <div>
                <strong>T (病理 Tau)：</strong>
                <span>{record.biomarkers.tauPet === 1 ? "Tau-PET 阳性 (T+)" : record.biomarkers.tauPet === 2 ? "Tau-PET 阴性 (T-)" : "未行PET检查"}</span>
                {record.biomarkers.plasmaAdBiomarkers.pTau217Value && (
                  <span className="block text-[11px] text-slate-600">血浆 p-tau217: {record.biomarkers.plasmaAdBiomarkers.pTau217Value}</span>
                )}
              </div>
              <div>
                <strong>N (神经变性与萎缩)：</strong>
                <span>{record.biomarkers.hippocampalAtrophy ? "MRI 提示海马/内侧颞叶萎缩" : "无明显海马特异性萎缩"}</span>
              </div>
            </div>
          </div>

          {/* Clinician Diagnosis & Signature */}
          <div className="space-y-4 pt-2">
            <h3 className="font-bold text-sm text-slate-900 mb-1 border-l-4 border-teal-700 pl-2">
              三、临床综合诊断结论与随访处置建议
            </h3>
            <div className="p-3.5 border border-slate-300 rounded-lg bg-slate-50 text-xs space-y-2 leading-relaxed">
              <div>
                <strong>诊断结论：</strong>
                <span className="text-teal-900 font-bold text-sm ml-1">
                  {record.diagnosis?.category === 1 && "主观认知下降 (SCD)"}
                  {record.diagnosis?.category === 2 && "遗忘型轻度认知障碍 (aMCI)"}
                  {record.diagnosis?.category === 3 && "非遗忘型轻度认知障碍 (naMCI)"}
                  {record.diagnosis?.category === 4 && "阿尔茨海默病痴呆期 (AD)"}
                  {record.diagnosis?.category === 5 && "正常健康对照 (NC)"}
                  {record.diagnosis?.category === 6 && "其他类型认知损害"}
                  {!record.diagnosis?.category && "主观认知下降 (SCD)"}
                </span>
              </div>
              <div>
                <strong>专家临床意见与科研队列入组判定：</strong>
                <p className="mt-1 text-slate-800 whitespace-pre-wrap">
                  {record.diagnosis?.notes || "经全套神经心理学测试及知情者问卷评估，符合主观认知下降 (SCD) 诊断标准，建议纳入纵向科研队列进行为期 1 年的定期随访跟踪。"}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-end pt-8 border-t border-slate-300 text-xs">
              <div>
                <div><strong>下次随访约定日期：</strong>{record.followUp.nextVisitDate || "12个月后"}</div>
                <div className="text-slate-500 mt-0.5">随访机构：首都医科大学宣武医院 神经疾病高精尖创新中心</div>
              </div>
              <div className="space-y-1 text-right">
                <div><strong>主试评估医师签名：</strong> <span className="font-serif italic text-base underline underline-offset-4 ml-2">{record.followUp.evaluatorSignature || record.evaluator}</span></div>
                <div className="text-slate-500">报告签发日期：{record.evalDate}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
