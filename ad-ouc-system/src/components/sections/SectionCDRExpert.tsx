import React from "react";
import { SubjectRecord } from "../../types/assessment";
import { calculateGlobalCDR } from "../../utils/scoringCalculators";
import { Award, CheckCircle2, AlertTriangle, HelpCircle, ShieldCheck } from "lucide-react";

interface Props {
  record: SubjectRecord;
  onChange: (updated: Partial<SubjectRecord>) => void;
}

export const SectionCDRExpert: React.FC<Props> = ({ record, onChange }) => {
  const cdrResult = calculateGlobalCDR(record.scales.cdr);

  const updateCDRDomain = (domain: keyof SubjectRecord["scales"]["cdr"], val: number) => {
    onChange({
      scales: {
        ...record.scales,
        cdr: {
          ...record.scales.cdr,
          [domain]: val,
        },
      },
    });
  };

  const domainOptions = [
    { value: 0, label: "0 分 (健康/正常)", desc: "无认知衰退或仅轻微遗忘" },
    { value: 0.5, label: "0.5 分 (可疑/极轻度)", desc: "轻微一致的遗忘，事件部分回忆，轻度困难" },
    { value: 1, label: "1 分 (轻度痴呆)", desc: "中度遗忘，近期事件影响明显，日常活动需提示" },
    { value: 2, label: "2 分 (中度痴呆)", desc: "严重遗忘，仅保留高度熟悉材料，生活部分需照料" },
    { value: 3, label: "3 分 (重度痴呆)", desc: "严重记忆丧失，仅存片段，完全依赖专人照料" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-teal-700 font-bold">
            临床痴呆严重度分级金标准 (Washington Univ. / 宣武医院规则)
          </div>
          <h2 className="text-lg font-bold mt-1 text-slate-900">
            CDR: 临床痴呆评定量表与 Global CDR 决策树引擎
          </h2>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 block">CDR-SB (Sum of Boxes)</span>
            <span className="text-lg font-bold font-mono text-slate-900">
              {cdrResult.cdrSumOfBoxes} <span className="text-xs font-normal text-slate-500">/ 18 分</span>
            </span>
          </div>
          <div className="bg-amber-50 px-4 py-2 rounded-xl border border-amber-200 text-center">
            <span className="text-[10px] text-amber-700 block">Global CDR 全球总评</span>
            <span className="text-lg font-bold font-mono text-amber-800">
              {cdrResult.globalCDR} 级
            </span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold">
            {cdrResult.description}
          </div>
        </div>
      </div>

      {/* Decision Engine logic explanation banner */}
      <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-2xl text-xs text-teal-900 space-y-1.5">
        <div className="flex items-center space-x-2 font-bold text-sm text-teal-950">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>华盛顿大学 ADRC / 宣武医院 Global CDR 核心判定规则：</span>
        </div>
        <p className="leading-relaxed text-teal-800">
          1. <strong>记忆力 (M) 为锚定域</strong>：当至少3个次要领域评分与 M 一致时，Global CDR = M。
          <br />
          2. <strong>次要领域多数原则</strong>：若次要领域中有 ≥3 个领域评分一致且偏离 M，则依多数次要领域级别定级。
          <br />
          3. <strong>SCD 入组标准</strong>：必须满足 <strong>Global CDR = 0</strong>（或极轻微主诉时 M=0.5 且 CDR-SB ≤ 0.5），保证无客观痴呆。
        </p>
      </div>

      {/* 6 Domains Rating Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="pb-4 border-b border-slate-100">
          <h3 className="font-bold text-base text-slate-800">
            CDR 6 大功能域临床分级评估（请结合受试者检查与知情者访谈判定）
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
          {/* 1. Memory (M) - The Anchor */}
          <div className="p-4 bg-teal-50/40 border-2 border-teal-500/60 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-100 px-2 py-0.5 rounded">
                  核心首要领域
                </span>
                <h4 className="font-bold text-base text-slate-900 mt-1">1. 记忆力 (Memory, M)</h4>
              </div>
              <span className="text-xl font-bold font-mono text-teal-700">
                {record.scales.cdr.memory} 分
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              {domainOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateCDRDomain("memory", opt.value)}
                  className={`w-full p-2.5 rounded-xl border text-left transition ${
                    record.scales.cdr.memory === opt.value
                      ? "bg-teal-600 text-white font-bold shadow-xs border-teal-600"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-semibold">{opt.label}</div>
                  <div className={`text-[11px] mt-0.5 ${record.scales.cdr.memory === opt.value ? "text-teal-100" : "text-slate-500"}`}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Orientation */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-base text-slate-900">2. 定向力 (Orientation)</h4>
              <span className="text-xl font-bold font-mono text-slate-700">
                {record.scales.cdr.orientation} 分
              </span>
            </div>
            <div className="space-y-1.5 pt-1">
              {domainOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateCDRDomain("orientation", opt.value)}
                  className={`w-full p-2.5 rounded-xl border text-left transition ${
                    record.scales.cdr.orientation === opt.value
                      ? "bg-teal-600 text-white font-bold shadow-2xs border-teal-600"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-semibold">{opt.label}</div>
                  <div className={`text-[11px] mt-0.5 ${record.scales.cdr.orientation === opt.value ? "text-teal-100" : "text-slate-500"}`}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Judgment & Problem Solving */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-base text-slate-900">3. 判断与解决问题 (Judgment)</h4>
              <span className="text-xl font-bold font-mono text-teal-700">
                {record.scales.cdr.judgment} 分
              </span>
            </div>
            <div className="space-y-1.5 pt-1">
              {domainOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateCDRDomain("judgment", opt.value)}
                  className={`w-full p-2.5 rounded-xl border text-left transition ${
                    record.scales.cdr.judgment === opt.value
                      ? "bg-teal-600 text-white font-bold shadow-2xs border-teal-600"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-semibold">{opt.label}</div>
                  <div className={`text-[11px] mt-0.5 ${record.scales.cdr.judgment === opt.value ? "text-teal-100" : "text-slate-500"}`}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Community Affairs */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-base text-slate-900">4. 社区事务 (Community Affairs)</h4>
              <span className="text-xl font-bold font-mono text-teal-700">
                {record.scales.cdr.community} 分
              </span>
            </div>
            <div className="space-y-1.5 pt-1">
              {domainOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateCDRDomain("community", opt.value)}
                  className={`w-full p-2.5 rounded-xl border text-left transition ${
                    record.scales.cdr.community === opt.value
                      ? "bg-teal-600 text-white font-bold shadow-2xs border-teal-600"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-semibold">{opt.label}</div>
                  <div className={`text-[11px] mt-0.5 ${record.scales.cdr.community === opt.value ? "text-teal-100" : "text-slate-500"}`}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Home & Hobbies */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-base text-slate-900">5. 家务与爱好 (Home & Hobbies)</h4>
              <span className="text-xl font-bold font-mono text-teal-700">
                {record.scales.cdr.homeHobbies} 分
              </span>
            </div>
            <div className="space-y-1.5 pt-1">
              {domainOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateCDRDomain("homeHobbies", opt.value)}
                  className={`w-full p-2.5 rounded-xl border text-left transition ${
                    record.scales.cdr.homeHobbies === opt.value
                      ? "bg-teal-600 text-white font-bold shadow-2xs border-teal-600"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-semibold">{opt.label}</div>
                  <div className={`text-[11px] mt-0.5 ${record.scales.cdr.homeHobbies === opt.value ? "text-teal-100" : "text-slate-500"}`}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 6. Personal Care */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-base text-slate-900">6. 个人自理 (Personal Care)</h4>
              <span className="text-xl font-bold font-mono text-teal-700">
                {record.scales.cdr.personalCare} 分
              </span>
            </div>
            <div className="space-y-1.5 pt-1">
              {domainOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateCDRDomain("personalCare", opt.value)}
                  className={`w-full p-2.5 rounded-xl border text-left transition ${
                    record.scales.cdr.personalCare === opt.value
                      ? "bg-teal-600 text-white font-bold shadow-2xs border-teal-600"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-semibold">{opt.label}</div>
                  <div className={`text-[11px] mt-0.5 ${record.scales.cdr.personalCare === opt.value ? "text-teal-100" : "text-slate-500"}`}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
