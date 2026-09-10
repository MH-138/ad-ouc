import React from "react";
import { SubjectRecord } from "../../types/assessment";
import { calculateSCDQ9 } from "../../utils/scoringCalculators";
import { HelpCircle, AlertCircle, CheckCircle2, MessageSquare, BookOpen } from "lucide-react";

interface Props {
  record: SubjectRecord;
  onChange: (updated: Partial<SubjectRecord>) => void;
}

export const SectionSCDSubjective: React.FC<Props> = ({ record, onChange }) => {
  const { score: scdScore, isPositive: isScdPositive } = calculateSCDQ9(record.scdQ9);

  const updateScdQ9 = (field: keyof SubjectRecord["scdQ9"], val: any) => {
    onChange({
      scdQ9: { ...record.scdQ9, [field]: val },
    });
  };

  const updateInterview = (patch: Partial<SubjectRecord["scdInterview"]>) => {
    onChange({
      scdInterview: { ...record.scdInterview, ...patch },
    });
  };

  const updateVignettes = (patch: Partial<SubjectRecord["scales"]["vignettes"]>) => {
    onChange({
      scales: {
        ...record.scales,
        vignettes: { ...record.scales.vignettes, ...patch },
      },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Summary Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-teal-700 font-bold">
            SCD 核心诊断环节（宣武医院特色体系）
          </div>
          <h2 className="text-lg font-bold mt-1 text-slate-900">
            D、E、H16: 主观认知下降自测、结构性访谈与情景锚定题
          </h2>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-right">
            <span className="text-[11px] text-slate-500 block">SCD-Q9 自评总分</span>
            <span className="text-lg font-bold font-mono text-slate-900">
              {scdScore} <span className="text-xs font-normal text-slate-500">/ 9 分</span>
            </span>
          </div>
          <div
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 ${
              isScdPositive
                ? "bg-amber-50 text-amber-800 border border-amber-200"
                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
            }`}
          >
            {isScdPositive ? <AlertCircle className="w-4 h-4 text-amber-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            <span>{isScdPositive ? "SCD 主诉显著 (≥5分)" : "主诉轻微 (<5分)"}</span>
          </div>
        </div>
      </div>

      {/* Part D: SCD-Q9 自测表 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              D
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">D. 主观认知下降自测表 (SCD-Q9)</h3>
              <p className="text-xs text-slate-500">
                评分标准：是=1分；否=0分；对于频度题：经常=1分，偶尔=0.5分，从未=0分
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-500 font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            宣武临床界值: ≥5 分提示主诉具有临床意义
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Q1 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <span className="font-medium text-slate-800">1. 你认为自己有记忆问题吗？</span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => updateScdQ9("q1", 1)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  record.scdQ9.q1 === 1 ? "bg-teal-600 text-white" : "bg-white text-slate-700 border border-slate-300"
                }`}
              >
                是 (1分)
              </button>
              <button
                type="button"
                onClick={() => updateScdQ9("q1", 0)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  record.scdQ9.q1 === 0 ? "bg-slate-700 text-white" : "bg-white text-slate-700 border border-slate-300"
                }`}
              >
                否 (0分)
              </button>
            </div>
          </div>

          {/* Q2 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <span className="font-medium text-slate-800">2. 你回忆 3-5 天前的对话有困难吗？</span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => updateScdQ9("q2", 1)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  record.scdQ9.q2 === 1 ? "bg-teal-600 text-white" : "bg-white text-slate-700 border border-slate-300"
                }`}
              >
                是 (1分)
              </button>
              <button
                type="button"
                onClick={() => updateScdQ9("q2", 0)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  record.scdQ9.q2 === 0 ? "bg-slate-700 text-white" : "bg-white text-slate-700 border border-slate-300"
                }`}
              >
                否 (0分)
              </button>
            </div>
          </div>

          {/* Q3 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <span className="font-medium text-slate-800">3. 你觉得自己近两年有记忆问题吗？</span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => updateScdQ9("q3", 1)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  record.scdQ9.q3 === 1 ? "bg-teal-600 text-white" : "bg-white text-slate-700 border border-slate-300"
                }`}
              >
                是 (1分)
              </button>
              <button
                type="button"
                onClick={() => updateScdQ9("q3", 0)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  record.scdQ9.q3 === 0 ? "bg-slate-700 text-white" : "bg-white text-slate-700 border border-slate-300"
                }`}
              >
                否 (0分)
              </button>
            </div>
          </div>

          {/* Q4 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <span className="font-medium text-slate-800">4. 忘记个人重要日期（如生日等）</span>
            <div className="flex space-x-1.5">
              <button
                type="button"
                onClick={() => updateScdQ9("q4", 1)}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
                  record.scdQ9.q4 === 1 ? "bg-teal-600 text-white" : "bg-white text-slate-700 border border-slate-300"
                }`}
              >
                经常 (1分)
              </button>
              <button
                type="button"
                onClick={() => updateScdQ9("q4", 0.5)}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
                  record.scdQ9.q4 === 0.5 ? "bg-teal-500 text-white" : "bg-white text-slate-700 border border-slate-300"
                }`}
              >
                偶尔 (0.5分)
              </button>
              <button
                type="button"
                onClick={() => updateScdQ9("q4", 0)}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
                  record.scdQ9.q4 === 0 ? "bg-slate-700 text-white" : "bg-white text-slate-700 border border-slate-300"
                }`}
              >
                从未 (0分)
              </button>
            </div>
          </div>

          {/* Q5 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <span className="font-medium text-slate-800">5. 忘记常用的电话号码或密码</span>
            <div className="flex space-x-1.5">
              <button
                type="button"
                onClick={() => updateScdQ9("q5", 1)}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
                  record.scdQ9.q5 === 1 ? "bg-teal-600 text-white" : "bg-white text-slate-700 border border-slate-300"
                }`}
              >
                经常 (1分)
              </button>
              <button
                type="button"
                onClick={() => updateScdQ9("q5", 0.5)}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
                  record.scdQ9.q5 === 0.5 ? "bg-teal-500 text-white" : "bg-white text-slate-700 border border-slate-300"
                }`}
              >
                偶尔 (0.5分)
              </button>
              <button
                type="button"
                onClick={() => updateScdQ9("q5", 0)}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
                  record.scdQ9.q5 === 0 ? "bg-slate-700 text-white" : "bg-white text-slate-700 border border-slate-300"
                }`}
              >
                从未 (0分)
              </button>
            </div>
          </div>

          {/* Q6 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <span className="font-medium text-slate-800">6. 对要做的事或要说的话容易忘记？</span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => updateScdQ9("q6", 1)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  record.scdQ9.q6 === 1 ? "bg-teal-600 text-white" : "bg-white text-slate-700 border border-slate-300"
                }`}
              >
                是 (1分)
              </button>
              <button
                type="button"
                onClick={() => updateScdQ9("q6", 0)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  record.scdQ9.q6 === 0 ? "bg-slate-700 text-white" : "bg-white text-slate-700 border border-slate-300"
                }`}
              >
                否 (0分)
              </button>
            </div>
          </div>

          {/* Q7 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <span className="font-medium text-slate-800">7. 到了商店忘记原本要买什么</span>
            <div className="flex space-x-1.5">
              <button
                type="button"
                onClick={() => updateScdQ9("q7", 1)}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
                  record.scdQ9.q7 === 1 ? "bg-teal-600 text-white" : "bg-white text-slate-700 border border-slate-300"
                }`}
              >
                经常 (1分)
              </button>
              <button
                type="button"
                onClick={() => updateScdQ9("q7", 0.5)}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
                  record.scdQ9.q7 === 0.5 ? "bg-teal-500 text-white" : "bg-white text-slate-700 border border-slate-300"
                }`}
              >
                偶尔 (0.5分)
              </button>
              <button
                type="button"
                onClick={() => updateScdQ9("q7", 0)}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
                  record.scdQ9.q7 === 0 ? "bg-slate-700 text-white" : "bg-white text-slate-700 border border-slate-300"
                }`}
              >
                从未 (0分)
              </button>
            </div>
          </div>

          {/* Q8 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <span className="font-medium text-slate-800">8. 你认为自己的记忆力比 5 年前要差吗？</span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => updateScdQ9("q8", 1)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  record.scdQ9.q8 === 1 ? "bg-teal-600 text-white" : "bg-white text-slate-700 border border-slate-300"
                }`}
              >
                是 (1分)
              </button>
              <button
                type="button"
                onClick={() => updateScdQ9("q8", 0)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  record.scdQ9.q8 === 0 ? "bg-slate-700 text-white" : "bg-white text-slate-700 border border-slate-300"
                }`}
              >
                否 (0分)
              </button>
            </div>
          </div>

          {/* Q9 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between md:col-span-2">
            <span className="font-medium text-slate-800">9. 你认为自己越来越记不住东西放哪儿了吗？</span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => updateScdQ9("q9", 1)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  record.scdQ9.q9 === 1 ? "bg-teal-600 text-white" : "bg-white text-slate-700 border border-slate-300"
                }`}
              >
                是 (1分)
              </button>
              <button
                type="button"
                onClick={() => updateScdQ9("q9", 0)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  record.scdQ9.q9 === 0 ? "bg-slate-700 text-white" : "bg-white text-slate-700 border border-slate-300"
                }`}
              >
                否 (0分)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Part E: 主观认知下降结构性访谈 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            E
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-800">E. 主观认知下降结构性访谈（受试者自述 + 知情者问卷）</h3>
            <p className="text-xs text-slate-500">
              包含核心5项认知主诉、A-E 深度追问矩阵（担忧、起病时长、同龄对比、就医行为），以及知情者观察
            </p>
          </div>
        </div>

        {/* 5 Domain Deep Interview Matrix */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            1. 受试者自述认知主诉与深度追问 (A ~ E 矩阵)
          </h4>

          {[
            { key: "q1", title: "1. 你是否觉得你的记性变差了？", domain: "记忆力" },
            { key: "q2", title: "2. 你是否比以前更频繁地寻找合适的词？", domain: "语言/找词" },
            { key: "q3", title: "3. 你是否感觉在做计划或有序地安排事情时越来越困难？", domain: "组织/计划" },
            { key: "q4", title: "4. 如果你不专心做一件事是否比以前更容易犯错？", domain: "注意力/专心" },
          ].map((item) => {
            const field = item.key as "q1" | "q2" | "q3" | "q4";
            const qState = record.scdInterview.detailedQuestions[field];
            return (
              <div key={item.key} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-sm">
                    {item.title} ({item.domain})
                  </span>
                  <label className="flex items-center space-x-2 cursor-pointer font-medium">
                    <span>存在该主诉:</span>
                    <input
                      type="checkbox"
                      checked={qState.has}
                      onChange={(e) =>
                        updateInterview({
                          detailedQuestions: {
                            ...record.scdInterview.detailedQuestions,
                            [field]: { ...qState, has: e.target.checked },
                          },
                        })
                      }
                      className="w-4 h-4 text-teal-600 rounded"
                    />
                  </label>
                </div>

                {qState.has && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-200 bg-white p-3 rounded-lg">
                    <div>
                      <label className="font-medium text-slate-600 block mb-1">A. 是否对此感到担忧？</label>
                      <select
                        value={qState.worry ?? 1}
                        onChange={(e) =>
                          updateInterview({
                            detailedQuestions: {
                              ...record.scdInterview.detailedQuestions,
                              [field]: { ...qState, worry: Number(e.target.value) as 0 | 1 },
                            },
                          })
                        }
                        className="w-full p-1.5 border border-slate-300 rounded text-xs"
                      >
                        <option value={1}>1. 是 (存在担忧)</option>
                        <option value={0}>0. 否</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-medium text-slate-600 block mb-1">B. 变差的时间是？</label>
                      <select
                        value={qState.onset ?? 2}
                        onChange={(e) =>
                          updateInterview({
                            detailedQuestions: {
                              ...record.scdInterview.detailedQuestions,
                              [field]: { ...qState, onset: Number(e.target.value) as any },
                            },
                          })
                        }
                        className="w-full p-1.5 border border-slate-300 rounded text-xs"
                      >
                        <option value={1}>1 = 近 6 个月内</option>
                        <option value={2}>2 = 近 6 个月 - 2 年</option>
                        <option value={3}>3 = 2 - 5 年</option>
                        <option value={4}>4 = 超过 5 年</option>
                        <option value={5}>5 = 不清楚</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-medium text-slate-600 block mb-1">C. 是否觉得比同龄人差？</label>
                      <select
                        value={qState.worseThanPeers ?? 1}
                        onChange={(e) =>
                          updateInterview({
                            detailedQuestions: {
                              ...record.scdInterview.detailedQuestions,
                              [field]: { ...qState, worseThanPeers: Number(e.target.value) as 0 | 1 },
                            },
                          })
                        }
                        className="w-full p-1.5 border border-slate-300 rounded text-xs"
                      >
                        <option value={1}>1. 是 (比同龄差)</option>
                        <option value={0}>0. 否</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-medium text-slate-600 block mb-1">D. 是否因该问题看过医生？</label>
                      <select
                        value={qState.consultedDoctor ?? 1}
                        onChange={(e) =>
                          updateInterview({
                            detailedQuestions: {
                              ...record.scdInterview.detailedQuestions,
                              [field]: { ...qState, consultedDoctor: Number(e.target.value) as 0 | 1 },
                            },
                          })
                        }
                        className="w-full p-1.5 border border-slate-300 rounded text-xs"
                      >
                        <option value={1}>1. 是 (曾就诊)</option>
                        <option value={0}>0. 否</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-medium text-slate-600 block mb-1">E. 首次就医时间 (月前)</label>
                      <input
                        type="number"
                        value={qState.firstConsultMonthsAgo ?? 6}
                        onChange={(e) =>
                          updateInterview({
                            detailedQuestions: {
                              ...record.scdInterview.detailedQuestions,
                              [field]: { ...qState, firstConsultMonthsAgo: Number(e.target.value) },
                            },
                          })
                        }
                        className="w-full p-1.5 border border-slate-300 rounded text-xs"
                        placeholder="几个月前"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Informant Questionnaire */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-sm">2. 知情者观察到的认知减退问卷</h4>
            <select
              value={record.scdInterview.informant.relation || 1}
              onChange={(e) =>
                updateInterview({
                  informant: {
                    ...record.scdInterview.informant,
                    relation: Number(e.target.value) as any,
                  },
                })
              }
              className="p-1.5 border border-slate-300 rounded bg-white text-xs"
            >
              <option value={1}>知情者身份: 配偶</option>
              <option value={2}>知情者身份: 孩子</option>
              <option value={3}>知情者身份: 兄弟姐妹</option>
              <option value={4}>知情者身份: 朋友</option>
              <option value={5}>知情者身份: 其他</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="flex items-center space-x-2 p-2 bg-white rounded border border-slate-200">
              <input
                type="checkbox"
                checked={record.scdInterview.informant.q1Memory.has}
                onChange={(e) =>
                  updateInterview({
                    informant: {
                      ...record.scdInterview.informant,
                      q1Memory: { ...record.scdInterview.informant.q1Memory, has: e.target.checked },
                    },
                  })
                }
              />
              <span>1. 观察到受访者记性变差</span>
            </label>

            <label className="flex items-center space-x-2 p-2 bg-white rounded border border-slate-200">
              <input
                type="checkbox"
                checked={record.scdInterview.informant.q2WordFinding.has}
                onChange={(e) =>
                  updateInterview({
                    informant: {
                      ...record.scdInterview.informant,
                      q2WordFinding: { ...record.scdInterview.informant.q2WordFinding, has: e.target.checked },
                    },
                  })
                }
              />
              <span>2. 观察到找词比以前困难</span>
            </label>

            <label className="flex items-center space-x-2 p-2 bg-white rounded border border-slate-200">
              <input
                type="checkbox"
                checked={record.scdInterview.informant.q3Planning.has}
                onChange={(e) =>
                  updateInterview({
                    informant: {
                      ...record.scdInterview.informant,
                      q3Planning: { ...record.scdInterview.informant.q3Planning, has: e.target.checked },
                    },
                  })
                }
              />
              <span>3. 观察到做计划安排变难</span>
            </label>

            <label className="flex items-center space-x-2 p-2 bg-white rounded border border-slate-200">
              <input
                type="checkbox"
                checked={record.scdInterview.informant.q4Attention.has}
                onChange={(e) =>
                  updateInterview({
                    informant: {
                      ...record.scdInterview.informant,
                      q4Attention: { ...record.scdInterview.informant.q4Attention, has: e.target.checked },
                    },
                  })
                }
              />
              <span>4. 观察到不专心时易犯错</span>
            </label>

            <label className="flex items-center space-x-2 p-2 bg-white rounded border border-slate-200">
              <input
                type="checkbox"
                checked={record.scdInterview.informant.q6Personality.has}
                onChange={(e) =>
                  updateInterview({
                    informant: {
                      ...record.scdInterview.informant,
                      q6Personality: { ...record.scdInterview.informant.q6Personality, has: e.target.checked },
                    },
                  })
                }
              />
              <span>5. 观察到行为或性格有变化</span>
            </label>
          </div>
        </div>
      </div>

      {/* Part H16: 情景选择题 (Vignettes 锚定) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            H16
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-800">H16. 情景选择题 (Vignette 锚定评估)</h3>
            <p className="text-xs text-slate-500">
              请受试者想象与自己相同年龄和背景的人物，评价其健康状况 (1=None没有, 2=Mild轻微, 3=Moderate中等, 4=Severe严重, 5=Extreme非常严重)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          {/* Cognitive Vignettes */}
          <div className="space-y-4">
            <h4 className="font-bold text-teal-800 text-sm flex items-center space-x-1.5">
              <BookOpen className="w-4 h-4" />
              <span>认知部分情景 (张亮、刘军、李伟)</span>
            </h4>

            {/* Zhang Liang */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <p className="text-slate-700">
                <strong>1. 张亮：</strong>在过去一个月内看电视、打牌都能集中注意力。但每周都有一次会忘记把钥匙或眼镜放在哪里，每次能在5分钟内找到。您认为张亮在集中注意或记东西方面有无困难？
              </p>
              <select
                value={record.scales.vignettes.cognitive1ZhangLiang}
                onChange={(e) => updateVignettes({ cognitive1ZhangLiang: Number(e.target.value) })}
                className="w-full p-2 border border-slate-300 rounded bg-white font-medium text-slate-800"
              >
                <option value={1}>(1) None 没有</option>
                <option value={2}>(2) Mild 轻微</option>
                <option value={3}>(3) Moderate 中等</option>
                <option value={4}>(4) Severe 严重</option>
                <option value={5}>(5) Extreme 非常严重</option>
              </select>
            </div>

            {/* Liu Jun */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <p className="text-slate-700">
                <strong>2. 刘军：</strong>喜欢照着菜谱做新菜，但做菜时经常做错，要回去读好几遍才能学会。您认为刘军在集中注意或记东西方面有无困难？
              </p>
              <select
                value={record.scales.vignettes.cognitive3LiuJun}
                onChange={(e) => updateVignettes({ cognitive3LiuJun: Number(e.target.value) })}
                className="w-full p-2 border border-slate-300 rounded bg-white font-medium text-slate-800"
              >
                <option value={1}>(1) None 没有</option>
                <option value={2}>(2) Mild 轻微</option>
                <option value={3}>(3) Moderate 中等</option>
                <option value={4}>(4) Severe 严重</option>
                <option value={5}>(5) Extreme 非常严重</option>
              </select>
            </div>

            {/* Li Wei */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <p className="text-slate-700">
                <strong>3. 李伟：</strong>集中注意力不超过15分钟，别人说话很难专心听。做事常做不完或忘记要做什么，但认识新人能记住名字。您认为李伟有无困难？
              </p>
              <select
                value={record.scales.vignettes.cognitive4LiWei}
                onChange={(e) => updateVignettes({ cognitive4LiWei: Number(e.target.value) })}
                className="w-full p-2 border border-slate-300 rounded bg-white font-medium text-slate-800"
              >
                <option value={1}>(1) None 没有</option>
                <option value={2}>(2) Mild 轻微</option>
                <option value={3}>(3) Moderate 中等</option>
                <option value={4}>(4) Severe 严重</option>
                <option value={5}>(5) Extreme 非常严重</option>
              </select>
            </div>
          </div>

          {/* Mood Vignettes */}
          <div className="space-y-4">
            <h4 className="font-bold text-indigo-800 text-sm flex items-center space-x-1.5">
              <MessageSquare className="w-4 h-4" />
              <span>情绪部分情景 (唐静、李峰、郑波)</span>
            </h4>

            {/* Tang Jing */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <p className="text-slate-700">
                <strong>1. 唐静：</strong>喜欢工作与朋友，生活基本满意。但每隔三周会有一两天郁闷并对爱好丧失兴趣，不影响日常活动。您认为她有无悲伤消沉？
              </p>
              <select
                value={record.scales.vignettes.mood1TangJing}
                onChange={(e) => updateVignettes({ mood1TangJing: Number(e.target.value) })}
                className="w-full p-2 border border-slate-300 rounded bg-white font-medium text-slate-800"
              >
                <option value={1}>(1) None 没有</option>
                <option value={2}>(2) Mild 轻微</option>
                <option value={3}>(3) Moderate 中等</option>
                <option value={4}>(4) Severe 严重</option>
                <option value={5}>(5) Extreme 非常严重</option>
              </select>
            </div>

            {/* Li Feng */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <p className="text-slate-700">
                <strong>2. 李峰：</strong>感到紧张焦虑对未来悲观。与别人在一起或做感兴趣的事时心情好些，一个人呆着感到无价值和空虚。您认为他有无抑郁？
              </p>
              <select
                value={record.scales.vignettes.mood2LiFeng}
                onChange={(e) => updateVignettes({ mood2LiFeng: Number(e.target.value) })}
                className="w-full p-2 border border-slate-300 rounded bg-white font-medium text-slate-800"
              >
                <option value={1}>(1) None 没有</option>
                <option value={2}>(2) Mild 轻微</option>
                <option value={3}>(3) Moderate 中等</option>
                <option value={4}>(4) Severe 严重</option>
                <option value={5}>(5) Extreme 非常严重</option>
              </select>
            </div>

            {/* Zheng Bo */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <p className="text-slate-700">
                <strong>3. 郑波：</strong>大多数时候感到抑郁，经常哭且对未来无希望，觉得自己是负担，认为死是最好的选择。您认为他有无严重抑郁？
              </p>
              <select
                value={record.scales.vignettes.mood3ZhengBo}
                onChange={(e) => updateVignettes({ mood3ZhengBo: Number(e.target.value) })}
                className="w-full p-2 border border-slate-300 rounded bg-white font-medium text-slate-800"
              >
                <option value={1}>(1) None 没有</option>
                <option value={2}>(2) Mild 轻微</option>
                <option value={3}>(3) Moderate 中等</option>
                <option value={4}>(4) Severe 严重</option>
                <option value={5}>(5) Extreme 非常严重</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
