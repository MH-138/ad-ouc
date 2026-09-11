import React from "react";
import { SubjectRecord } from "../../types/assessment";
import { Dna, Activity, FileCheck, Stethoscope, Calendar, ShieldCheck, Info } from "lucide-react";

interface Props {
  record: SubjectRecord;
  onChange: (updated: Partial<SubjectRecord>) => void;
}

export const SectionBiomarkersDiagnosis: React.FC<Props> = ({ record, onChange }) => {
  const updateBiomarkers = (patch: Partial<SubjectRecord["biomarkers"]>) => {
    const current = record.biomarkers || ({} as any);
    onChange({
      biomarkers: { ...current, ...patch },
    });
  };

  const updateDiagnosis = (patch: Partial<SubjectRecord["diagnosis"]>) => {
    onChange({
      diagnosis: { ...(record.diagnosis || { category: 1, notes: "" }), ...patch } as any,
    });
  };

  const updateFollowUp = (patch: Partial<SubjectRecord["followUp"]>) => {
    const current = record.followUp || ({} as any);
    onChange({
      followUp: { ...current, ...patch },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-teal-700 font-bold">
            NIA-AA ATN 生物学框架、多中心入组诊断与随访体系
          </div>
          <h2 className="text-lg font-bold mt-1 text-slate-900">
            I、J、K: 分子影像与生化标志物、临床综合诊断结论及随访预约
          </h2>
        </div>
        <div className="flex items-center space-x-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-xs">
          <span className="text-slate-500">APOE 基因型:</span>
          <span className="text-teal-700 font-bold">{record.biomarkers?.apoe4Genotype?.value || "未检测"}</span>
        </div>
      </div>

      {/* Part I: 生物标志物 (ATN 体系) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            I
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-800">
              I. AD 早期生物标志物 (ATN Framework: 影像、体液与基因)
            </h3>
            <p className="text-xs text-slate-500">
              用于明确受试者是否处于阿尔茨海默病生物学连续谱（SCD plus 生物标志物阳性亚型）
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
          {/* Amyloid (A) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                A
              </span>
              <span className="font-bold text-slate-800 text-sm">淀粉样蛋白 (Aβ 沉积)</span>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-slate-600 block mb-1">Aβ-PET 显像结果 (11C-PIB / 18F-AV45)</label>
                <select
                  value={record.biomarkers.abetaPet}
                  onChange={(e) => updateBiomarkers({ abetaPet: Number(e.target.value) as any })}
                  className="w-full p-2 border border-slate-300 rounded bg-white text-xs"
                >
                  <option value={2}>2. 阴性 (A- 无明显淀粉样斑块沉着)</option>
                  <option value={1}>1. 阳性 (A+ 皮层特异性放射性浓聚)</option>
                  <option value={3}>3. 未做该项检查</option>
                </select>
              </div>

              <label className="flex items-center space-x-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={record.biomarkers.csfAbetaTau}
                  onChange={(e) => updateBiomarkers({ csfAbetaTau: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <span className="text-slate-700">脑脊液 CSF Aβ42/Aβ40 比值降低 (阳性)</span>
              </label>
            </div>
          </div>

          {/* Tau Pathology (T) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-md bg-rose-100 text-rose-800 font-bold flex items-center justify-center text-xs">
                T
              </span>
              <span className="font-bold text-slate-800 text-sm">病理性 Tau 蛋白与神经变性</span>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-slate-600 block mb-1">Tau-PET 显像结果 (18F-AV1451 / MK-6240)</label>
                <select
                  value={record.biomarkers.tauPet}
                  onChange={(e) => updateBiomarkers({ tauPet: Number(e.target.value) as any })}
                  className="w-full p-2 border border-slate-300 rounded bg-white text-xs"
                >
                  <option value={2}>2. 阴性 (T- 内侧颞叶无明显Tau积累)</option>
                  <option value={1}>1. 阳性 (T+ 内嗅皮层/新皮层浓聚)</option>
                  <option value={3}>3. 未做该项检查</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 block mb-1">血浆超灵敏 p-tau217 / p-tau181 (Simoa)</label>
                <input
                  type="text"
                  value={record.biomarkers.plasmaAdBiomarkers.pTau217Value || ""}
                  onChange={(e) =>
                    updateBiomarkers({
                      plasmaAdBiomarkers: {
                        ...record.biomarkers.plasmaAdBiomarkers,
                        pTau217Value: e.target.value,
                      },
                    })
                  }
                  placeholder="如: 0.12 pg/mL (正常) 或 0.58 pg/mL (升高)"
                  className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Neurodegeneration & Genetics (N & Genotype) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                N
              </span>
              <span className="font-bold text-slate-800 text-sm">结构 MRI 萎缩与 APOE 基因</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={record.biomarkers.hippocampalAtrophy}
                    onChange={(e) => updateBiomarkers({ hippocampalAtrophy: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>内侧颞叶/海马萎缩 (MTA ≥ 2)</span>
                </label>
              </div>

              <div>
                <label className="text-slate-600 block mb-1">APOE 基因分型检测</label>
                <select
                  value={record.biomarkers.apoe4Genotype.value || "ε3/ε3"}
                  onChange={(e) =>
                    updateBiomarkers({
                      apoe4Genotype: {
                        tested: true,
                        value: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-mono font-bold"
                >
                  <option value="ε3/ε3">ε3/ε3 (野生型, 正常风险)</option>
                  <option value="ε3/ε4">ε3/ε4 (杂合子, AD高危 ↑3~4倍)</option>
                  <option value="ε4/ε4">ε4/ε4 (纯合子, AD极高危 ↑12~15倍)</option>
                  <option value="ε2/ε3">ε2/ε3 (保护型等位基因)</option>
                  <option value="ε2/ε4">ε2/ε4 (复杂型)</option>
                  <option value="未检测">未检测 APOE</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Part J: 临床诊断结论 (Clinical Diagnosis) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            J
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-800">J. 临床综合诊断与入组分类 (宣武规范)</h3>
            <p className="text-xs text-slate-500">
              结合主诉自述(SCD-Q9)、客观神经心理学量表(MMSE/MoCA/AVLT/STT/CDR)及生物学指标进行确诊分类
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              综合诊断分型：
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { val: 1, title: "1. 主观认知下降 (SCD)", desc: "有主诉但客观测验正常、CDR=0、生活独立" },
                { val: 2, title: "2. 遗忘型轻度认知障碍 (aMCI)", desc: "AVLT/逻辑记忆延迟低于常模、CDR=0.5" },
                { val: 3, title: "3. 非遗忘型轻度认知障碍 (naMCI)", desc: "单/多非记忆域损害(STT/BNT/MES)、CDR=0.5" },
                { val: 4, title: "4. 阿尔茨海默病痴呆期 (AD)", desc: "多认知域显著受损、FAQ受损、CDR≥1" },
                { val: 5, title: "5. 正常健康对照 (NC)", desc: "无认知主诉且客观神经心理测试均正常" },
                { val: 6, title: "6. 其他类型认知损害", desc: "血管性/路易体/额颞叶/抑郁假性认知损害" },
              ].map((diag) => (
                <button
                  key={diag.val}
                  type="button"
                  onClick={() => updateDiagnosis({ category: diag.val as any })}
                  className={`p-3.5 rounded-xl border text-left transition ${
                    (record.diagnosis?.category ?? 1) === diag.val
                      ? "bg-teal-600 text-white font-bold shadow-md border-teal-600"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="text-sm font-semibold">{diag.title}</div>
                  <div className={`text-[11px] mt-1 ${(record.diagnosis?.category ?? 1) === diag.val ? "text-teal-100" : "text-slate-500"}`}>
                    {diag.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              宣武医院多中心临床专家诊断意见与科研入组说明：
            </label>
            <textarea
              rows={3}
              value={record.diagnosis?.notes || ""}
              onChange={(e) => updateDiagnosis({ notes: e.target.value })}
              className="w-full p-3 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="记录受试者符合入组标准的详细判定理由..."
            />
          </div>
        </div>
      </div>

      {/* Part K: 随访计划 (Follow Up) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            K
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-800">K. 队列随访计划与评估医师签字</h3>
            <p className="text-xs text-slate-500">
              SCD 队列常规按照 12 个月 (1年) 进行定期随访，跟踪纵向认知轨迹与生物学转化率
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">下次访视预约日期 (W052 / 1年后)</label>
            <input
              type="date"
              value={record.followUp.nextVisitDate}
              onChange={(e) => updateFollowUp({ nextVisitDate: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded bg-white font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">评估主试医师签名 *</label>
            <input
              type="text"
              value={record.followUp.evaluatorSignature}
              onChange={(e) => updateFollowUp({ evaluatorSignature: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded bg-white font-medium text-slate-800"
              placeholder="医师姓名"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">本次完成评估日期</label>
            <input
              type="date"
              value={record.evalDate}
              onChange={(e) => onChange({ evalDate: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded bg-white font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
