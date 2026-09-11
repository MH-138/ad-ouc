import React from "react";
import { SubjectRecord } from "../../types/assessment";
import { calculateHAMD17, calculateHAMA, calculateGDS15, calculateNPI } from "../../utils/scoringCalculators";
import { GDS15_ITEMS, NPI_DOMAINS } from "../../data/assessmentStimuli";
import { Smile, Frown, AlertCircle, ShieldAlert, HeartHandshake } from "lucide-react";

interface Props {
  record: SubjectRecord;
  onChange: (updated: Partial<SubjectRecord>) => void;
}

export const SectionMoodBehavior: React.FC<Props> = ({ record, onChange }) => {
  const hamdResult = calculateHAMD17(record.scales?.hamd17?.items || {});
  const hamaResult = calculateHAMA(record.scales?.hama?.items || {});
  const gdsResult = calculateGDS15(record.scales?.gds15?.answers || {});
  const npiResult = calculateNPI(record.scales?.npi?.items || {});

  const updateHamdItem = (itemNo: number, val: number) => {
    const current = record.scales?.hamd17 || { items: {} };
    onChange({
      scales: {
        ...record.scales,
        hamd17: {
          ...current,
          items: { ...(current.items || {}), [itemNo]: val },
        },
      },
    });
  };

  const updateHamaItem = (itemNo: number, val: number) => {
    const current = record.scales?.hama || { items: {} };
    onChange({
      scales: {
        ...record.scales,
        hama: {
          ...current,
          items: { ...(current.items || {}), [itemNo]: val },
        },
      },
    });
  };

  const updateGdsItem = (itemNo: number, val: boolean) => {
    const current = record.scales?.gds15 || { answers: {} };
    onChange({
      scales: {
        ...record.scales,
        gds15: {
          ...current,
          answers: { ...(current.answers || {}), [itemNo]: val },
        },
      },
    });
  };

  const updateNpiDomain = (
    domainNo: number,
    patch: Partial<{ has: boolean; frequency: number; severity: number; distress: number }>
  ) => {
    const npiItems = record.scales?.npi?.items || {};
    const current = npiItems[domainNo] || {
      has: false,
      frequency: 1,
      severity: 1,
      distress: 0,
    };
    const currentNpi = record.scales?.npi || { items: {} };
    onChange({
      scales: {
        ...record.scales,
        npi: {
          ...currentNpi,
          items: {
            ...(currentNpi.items || {}),
            [domainNo]: { ...current, ...patch },
          },
        },
      },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-teal-700 font-bold">
            精神心理、情绪状态与精神行为症状 (BPSD) 评估
          </div>
          <h2 className="text-lg font-bold mt-1 text-slate-900">
            H7、H10、HAMD、HAMA: 抑郁焦虑量表与神经精神量表 (NPI)
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 block">GDS-15 老年抑郁</span>
            <span className={`text-sm font-bold font-mono ${gdsResult.isDepressed ? "text-amber-700" : "text-emerald-700"}`}>
              {gdsResult.score} / 15 {gdsResult.isDepressed ? "(提示抑郁 ≥8)" : "(正常)"}
            </span>
          </div>
          <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 block">HAMD-17 抑郁总分</span>
            <span className="text-sm font-bold font-mono text-slate-800">
              {hamdResult.score} 分 ({hamdResult.severity})
            </span>
          </div>
          <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 block">NPI 精神行为总分 (F×S)</span>
            <span className="text-sm font-bold font-mono text-slate-800">
              {npiResult.totalScore} 分 (照料痛苦: {npiResult.distressScore})
            </span>
          </div>
        </div>
      </div>

      {/* H7. GDS-15 老年抑郁自评量表 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 font-bold flex items-center justify-center">
              H7
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">H7. 老年抑郁自评量表 (GDS-15, 满分 15 分)</h3>
              <p className="text-xs text-slate-500">
                请回答受试者过去一周的感受；界值：≥8分提示存在抑郁症状（需排查假性痴呆/情绪影响）
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              {gdsResult.score} 分 ({gdsResult.isDepressed ? "⚠️ 抑郁症状" : "正常"})
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {GDS15_ITEMS.map((item) => {
            const currentVal = record.scales?.gds15?.answers?.[item.id];
            const isScorePoint = (item.reverse && currentVal === false) || (!item.reverse && currentVal === true);

            return (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition ${
                  isScorePoint ? "bg-rose-50/60 border-rose-300" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="font-medium text-slate-800 mb-2">
                  {item.text}
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => updateGdsItem(item.id, true)}
                    className={`flex-1 py-1 rounded text-xs font-medium transition ${
                      currentVal === true
                        ? "bg-rose-600 text-white"
                        : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    是
                  </button>
                  <button
                    type="button"
                    onClick={() => updateGdsItem(item.id, false)}
                    className={`flex-1 py-1 rounded text-xs font-medium transition ${
                      currentVal === false
                        ? "bg-slate-700 text-white"
                        : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    否
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* H10. 神经精神问卷 (NPI 12项) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-700 font-bold flex items-center justify-center">
              H10
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">
                H10. 神经精神问卷 (Neuropsychiatric Inventory, NPI 12个症状域)
              </h3>
              <p className="text-xs text-slate-500">
                评估过去一个月内出现的精神行为异常：计算总分 (频率 1-4 × 严重度 1-3) 及知情者痛苦程度 (0-5分)
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-pink-600 bg-pink-50 px-2.5 py-1 rounded-lg border border-pink-200">
              症状数: {npiResult.symptomCount} / 12 | 总分: {npiResult.totalScore} | 痛苦值: {npiResult.distressScore}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {NPI_DOMAINS.map((domain) => {
            const current = record.scales?.npi?.items?.[domain.no] || {
              has: false,
              frequency: 1,
              severity: 1,
              distress: 0,
            };

            return (
              <div
                key={domain.no}
                className={`p-4 rounded-xl border transition space-y-3 ${
                  current.has ? "bg-rose-50/40 border-rose-300" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800 text-sm">
                      {domain.no}. {domain.name}
                    </span>
                    <p className="text-[11px] text-slate-500">{domain.desc}</p>
                  </div>
                  <label className="flex items-center space-x-1.5 cursor-pointer ml-3 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={current.has}
                      onChange={(e) => updateNpiDomain(domain.no, { has: e.target.checked })}
                      className="w-4 h-4 text-rose-600 rounded border-slate-300"
                    />
                    <span className="font-bold text-slate-700">存在症状</span>
                  </label>
                </div>

                {current.has && (
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-rose-100">
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1">
                        发生频率 (1-4)
                      </label>
                      <select
                        value={current.frequency}
                        onChange={(e) => updateNpiDomain(domain.no, { frequency: Number(e.target.value) })}
                        className="w-full p-1.5 border border-slate-300 rounded bg-white"
                      >
                        <option value={1}>1 - 偶尔 (&lt;1次/周)</option>
                        <option value={2}>2 - 常常 (约1次/周)</option>
                        <option value={3}>3 - 频繁 (数次/周)</option>
                        <option value={4}>4 - 极其频繁 (每天)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1">
                        严重程度 (1-3)
                      </label>
                      <select
                        value={current.severity}
                        onChange={(e) => updateNpiDomain(domain.no, { severity: Number(e.target.value) })}
                        className="w-full p-1.5 border border-slate-300 rounded bg-white"
                      >
                        <option value={1}>1 - 轻度 (未造成困扰)</option>
                        <option value={2}>2 - 中度 (造成困扰但可控制)</option>
                        <option value={3}>3 - 重度 (极其明显且不可克服)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1">
                        照料者痛苦 (0-5)
                      </label>
                      <select
                        value={current.distress}
                        onChange={(e) => updateNpiDomain(domain.no, { distress: Number(e.target.value) })}
                        className="w-full p-1.5 border border-slate-300 rounded bg-white"
                      >
                        <option value={0}>0 - 无痛苦</option>
                        <option value={1}>1 - 轻微</option>
                        <option value={2}>2 - 较轻</option>
                        <option value={3}>3 - 中等</option>
                        <option value={4}>4 - 严重</option>
                        <option value={5}>5 - 极严重</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* HAMD-17 & HAMA 汉密尔顿抑郁焦虑量表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HAMD-17 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">HAMD-17 汉密尔顿抑郁量表 (17项)</h4>
              <p className="text-[11px] text-slate-500">
                0-7分正常, 8-17轻度, 18-24中度, ≥25严重抑郁
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-200">
              得分: {hamdResult.score} 分 ({hamdResult.severity})
            </span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-xs">
            {[
              { no: 1, name: "1. 抑郁情绪" },
              { no: 2, name: "2. 有罪感" },
              { no: 3, name: "3. 自杀意念" },
              { no: 4, name: "4. 入睡困难" },
              { no: 5, name: "5. 睡眠不深" },
              { no: 6, name: "6. 早醒" },
              { no: 7, name: "7. 工作与兴趣" },
              { no: 8, name: "8. 迟缓" },
              { no: 9, name: "9. 激越" },
              { no: 10, name: "10. 精神性焦虑" },
              { no: 11, name: "11. 躯体性焦虑" },
              { no: 12, name: "12. 胃肠道症状" },
              { no: 13, name: "13. 全身症状" },
              { no: 14, name: "14. 性症状" },
              { no: 15, name: "15. 疑病" },
              { no: 16, name: "16. 体重减轻" },
              { no: 17, name: "17. 自知力" },
            ].map((item) => (
              <div key={item.no} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-medium text-slate-700">{item.name}</span>
                <input
                  type="number"
                  min={0}
                  max={4}
                  value={record.scales.hamd17.items?.[item.no] ?? 0}
                  onChange={(e) => updateHamdItem(item.no, Number(e.target.value))}
                  className="w-16 p-1 border border-slate-300 rounded bg-white font-mono text-center"
                />
              </div>
            ))}
          </div>
        </div>

        {/* HAMA */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">HAMA 汉密尔顿焦虑量表 (14项)</h4>
              <p className="text-[11px] text-slate-500">
                &lt;7分无, 7-13轻度, 14-20中度, ≥21严重焦虑
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
              得分: {hamaResult.score} 分 ({hamaResult.severity})
            </span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-xs">
            {[
              { no: 1, name: "1. 焦虑心境" },
              { no: 2, name: "2. 紧张" },
              { no: 3, name: "3. 害怕" },
              { no: 4, name: "4. 失眠" },
              { no: 5, name: "5. 认知功能 (注意力/记忆)" },
              { no: 6, name: "6. 抑郁心境" },
              { no: 7, name: "7. 肌肉系统症状" },
              { no: 8, name: "8. 感觉系统症状" },
              { no: 9, name: "9. 心血管系统症状" },
              { no: 10, name: "10. 呼吸系统症状" },
              { no: 11, name: "11. 胃肠道系统症状" },
              { no: 12, name: "12. 生殖泌尿系统症状" },
              { no: 13, name: "13. 自主神经系统症状" },
              { no: 14, name: "14. 会谈时行为表现" },
            ].map((item) => (
              <div key={item.no} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-medium text-slate-700">{item.name}</span>
                <input
                  type="number"
                  min={0}
                  max={4}
                  value={record.scales.hama.items?.[item.no] ?? 0}
                  onChange={(e) => updateHamaItem(item.no, Number(e.target.value))}
                  className="w-16 p-1 border border-slate-300 rounded bg-white font-mono text-center"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
