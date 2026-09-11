import React from "react";
import { SubjectRecord } from "../../types/assessment";
import {
  calculateFAQ,
  calculateEcog,
  calculatePSQI,
  calculateRBDSQ,
  calculateESS,
} from "../../utils/scoringCalculators";
import { FAQ_ITEMS, ECOG_ITEMS } from "../../data/assessmentStimuli";
import { Moon, Sun, Activity, CheckCircle2, AlertTriangle } from "lucide-react";

interface Props {
  record: SubjectRecord;
  onChange: (updated: Partial<SubjectRecord>) => void;
}

export const SectionDailyLivingSleep: React.FC<Props> = ({ record, onChange }) => {
  const faqResult = calculateFAQ(record.scales?.faq?.items || {});
  const ecogResult = calculateEcog(record.scales?.ecog?.items || {});
  const psqiResult = calculatePSQI(record.scales?.psqi || ({} as any));
  const rbdsqResult = calculateRBDSQ(record.scales?.rbdsq?.items || {});
  const essResult = calculateESS(record.scales?.ess?.items || {});

  const updateFaqItem = (itemNo: number, val: number) => {
    const current = record.scales?.faq || { informantPresent: false, items: {} };
    onChange({
      scales: {
        ...record.scales,
        faq: {
          ...current,
          items: { ...(current.items || {}), [itemNo]: val },
        },
      },
    });
  };

  const updateEcogItem = (itemNo: number, val: number) => {
    const current = record.scales?.ecog || { items: {} };
    onChange({
      scales: {
        ...record.scales,
        ecog: {
          ...current,
          items: { ...(current.items || {}), [itemNo]: val },
        },
      },
    });
  };

  const updatePsqi = (patch: Partial<SubjectRecord["scales"]["psqi"]>) => {
    const current = record.scales?.psqi || ({} as any);
    onChange({
      scales: {
        ...record.scales,
        psqi: { ...current, ...patch },
      },
    });
  };

  const updatePsqiTrouble = (key: string, val: number) => {
    const currentPsqi = record.scales?.psqi || ({} as any);
    onChange({
      scales: {
        ...record.scales,
        psqi: {
          ...currentPsqi,
          troubles: { ...(currentPsqi.troubles || {}), [key]: val },
        },
      },
    });
  };

  const updateRbdsqItem = (key: string, val: boolean) => {
    const current = record.scales?.rbdsq || { items: {} };
    onChange({
      scales: {
        ...record.scales,
        rbdsq: {
          ...current,
          items: { ...(current.items || {}), [key]: val },
        },
      },
    });
  };

  const updateEssItem = (itemNo: number, val: number) => {
    const current = record.scales?.ess || { items: {} };
    onChange({
      scales: {
        ...record.scales,
        ess: {
          ...current,
          items: { ...(current.items || {}), [itemNo]: val },
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
            日常生活活动能力与睡眠质量多模态评估
          </div>
          <h2 className="text-lg font-bold mt-1 text-slate-900">
            H9、H11、H12、H13、H14: FAQ 功能活动、ECog 日常认知与睡眠量表群
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 block">FAQ 日常生活能力</span>
            <span className={`text-sm font-bold font-mono ${faqResult.isAbnormal ? "text-amber-700" : "text-emerald-700"}`}>
              {faqResult.score} / 30 {faqResult.isAbnormal ? "(受损 ≥5分)" : "(正常)"}
            </span>
          </div>
          <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 block">PSQI 睡眠质量</span>
            <span className={`text-sm font-bold font-mono ${psqiResult.isAbnormal ? "text-amber-700" : "text-emerald-700"}`}>
              {psqiResult.score} / 21 {psqiResult.isAbnormal ? "(差 ≥8分)" : "(良好)"}
            </span>
          </div>
          <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 block">RBDSQ 异态睡眠</span>
            <span className={`text-sm font-bold font-mono ${rbdsqResult.isAbnormal ? "text-amber-700" : "text-emerald-700"}`}>
              {rbdsqResult.score} / 13 {rbdsqResult.isAbnormal ? "(阳性 ≥5)" : "(阴性)"}
            </span>
          </div>
        </div>
      </div>

      {/* H9. FAQ 功能活动调查表 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 font-bold flex items-center justify-center">
              H9
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">
                H9. 功能活动调查表 (FAQ - Pfeffer 10项: 评估独立生活能力)
              </h3>
              <p className="text-xs text-slate-500">
                0=正常独立, 1=有些困难但可独立, 2=需要帮助, 3=完全依赖别人。界值：≥5分提示功能受损；SCD入组必须保持独立。
              </p>
            </div>
          </div>
          <div className="text-right font-mono text-xs">
            <span className={`px-2.5 py-1 rounded-lg border font-bold ${
              faqResult.isAbnormal ? "bg-red-50 text-red-700 border-red-200" : "bg-teal-50 text-teal-700 border-teal-200"
            }`}>
              FAQ 得分: {faqResult.score} / 30 ({faqResult.isAbnormal ? "存在功能受损" : "独立生活良好"})
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {FAQ_ITEMS.map((item, idx) => {
            const itemNo = idx + 1;
            const val = record.scales.faq.items?.[itemNo] ?? 0;
            return (
              <div key={itemNo} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="font-medium text-slate-800 pr-2">
                  {item}
                </span>
                <select
                  value={val}
                  onChange={(e) => updateFaqItem(itemNo, Number(e.target.value))}
                  className="p-1.5 border border-slate-300 rounded bg-white text-xs font-semibold"
                >
                  <option value={0}>0分: 正常独立完成</option>
                  <option value={1}>1分: 虽有困难但能独立</option>
                  <option value={2}>2分: 需他人提示帮助</option>
                  <option value={3}>3分: 完全依赖他人</option>
                </select>
              </div>
            );
          })}
        </div>
      </div>

      {/* H11. ECog 日常认知量表 (12项简版) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center">
              H11
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">
                H11. 日常认知量表 (ECog 12项简化版: 与 10 年前相比)
              </h3>
              <p className="text-xs text-slate-500">
                评分：1=无改变/更好, 2=偶尔更差/稍微变差, 3=经常更差/明显差, 4=非常差。计算平均分（1.00 ~ 4.00）。
              </p>
            </div>
          </div>
          <div className="text-right font-mono text-xs">
            <span className="bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-lg border border-indigo-200">
              ECog 平均分: {ecogResult.avgScore} 分 (主诉感知: {ecogResult.interpretation})
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {ECOG_ITEMS.map((item, idx) => {
            const itemNo = idx + 1;
            const val = record.scales.ecog.items?.[itemNo] ?? 1;
            return (
              <div key={itemNo} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-medium text-slate-800 block">
                  {item}
                </span>
                <select
                  value={val}
                  onChange={(e) => updateEcogItem(itemNo, Number(e.target.value))}
                  className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs font-semibold"
                >
                  <option value={1}>1. 无改变 / 甚至更好</option>
                  <option value={2}>2. 偶尔更差 / 稍微变差</option>
                  <option value={3}>3. 经常更差 / 明显变差</option>
                  <option value={4}>4. 非常差 / 无法独立完成</option>
                </select>
              </div>
            );
          })}
        </div>
      </div>

      {/* H12. PSQI 匹兹堡睡眠质量指数 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center justify-center">
              H12
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">
                H12. 匹兹堡睡眠质量指数 (PSQI, 满分 21 分)
              </h3>
              <p className="text-xs text-slate-500">
                评估近 1 个月的睡眠质量（7大成分：主观质量、入睡时间、睡眠时间、睡眠效率、睡眠障碍、催眠药物、日间功能）。界值：≥8分提示睡眠障碍。
              </p>
            </div>
          </div>
          <div className="text-right font-mono text-xs">
            <span className={`px-2.5 py-1 rounded-lg border font-bold ${
              psqiResult.isAbnormal ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-teal-50 text-teal-700 border-teal-200"
            }`}>
              PSQI 总分: {psqiResult.score} / 21 ({psqiResult.isAbnormal ? "存在睡眠障碍" : "睡眠良好"})
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <label className="font-medium text-slate-700 block mb-1">通常上床睡觉时间</label>
            <input
              type="text"
              value={record.scales.psqi.bedTime || ""}
              onChange={(e) => updatePsqi({ bedTime: e.target.value })}
              className="w-full p-1.5 border border-slate-300 rounded bg-white font-mono"
              placeholder="如 22:30"
            />
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <label className="font-medium text-slate-700 block mb-1">入睡所需时间 (分钟)</label>
            <input
              type="number"
              value={record.scales.psqi.sleepLatencyMinutes || 0}
              onChange={(e) => updatePsqi({ sleepLatencyMinutes: Number(e.target.value) })}
              className="w-full p-1.5 border border-slate-300 rounded bg-white font-mono"
            />
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <label className="font-medium text-slate-700 block mb-1">早晨起床时间</label>
            <input
              type="text"
              value={record.scales.psqi.wakeTime || ""}
              onChange={(e) => updatePsqi({ wakeTime: e.target.value })}
              className="w-full p-1.5 border border-slate-300 rounded bg-white font-mono"
              placeholder="如 06:30"
            />
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <label className="font-medium text-slate-700 block mb-1">每夜实际睡眠时间 (小时)</label>
            <input
              type="number"
              step="0.5"
              value={record.scales.psqi.actualSleepHours || 0}
              onChange={(e) => updatePsqi({ actualSleepHours: Number(e.target.value) })}
              className="w-full p-1.5 border border-slate-300 rounded bg-white font-mono font-bold text-teal-700"
            />
          </div>
        </div>

        {/* Trouble check options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2">
          <div>
            <label className="font-medium text-slate-700 block mb-1">主观自身睡眠质量评价</label>
            <select
              value={record.scales.psqi.selfQuality}
              onChange={(e) => updatePsqi({ selfQuality: Number(e.target.value) })}
              className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs"
            >
              <option value={0}>0. 很好</option>
              <option value={1}>1. 较好</option>
              <option value={2}>2. 较差</option>
              <option value={3}>3. 很差</option>
            </select>
          </div>

          <div>
            <label className="font-medium text-slate-700 block mb-1">服用安眠助眠药物频率</label>
            <select
              value={record.scales.psqi.medication}
              onChange={(e) => updatePsqi({ medication: Number(e.target.value) })}
              className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs"
            >
              <option value={0}>0. 从未服用</option>
              <option value={1}>1. &lt;1次/周</option>
              <option value={2}>2. 1-2次/周</option>
              <option value={3}>3. ≥3次/周</option>
            </select>
          </div>

          <div>
            <label className="font-medium text-slate-700 block mb-1">日间功能障碍/瞌睡打盹</label>
            <select
              value={record.scales.psqi.daytimeDysfunction}
              onChange={(e) => updatePsqi({ daytimeDysfunction: Number(e.target.value) })}
              className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs"
            >
              <option value={0}>0. 无困扰</option>
              <option value={1}>1. 偶尔有轻微问题</option>
              <option value={2}>2. 有一定困扰</option>
              <option value={3}>3. 严重影响日间精力</option>
            </select>
          </div>
        </div>
      </div>

      {/* H13 RBDSQ & H14 ESS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* H13 RBDSQ */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">H13. 快速眼动睡眠行为障碍 (RBDSQ)</h4>
              <p className="text-[11px] text-slate-500">
                13项是非题，排查梦境扮演、睡眠中挥拳踢腿等突触核蛋白病前驱特征 (≥5分阳性)
              </p>
            </div>
            <span className={`font-mono text-xs font-bold px-2 py-1 rounded border ${
              rbdsqResult.isAbnormal ? "bg-red-50 text-red-700 border-red-200" : "bg-teal-50 text-teal-700 border-teal-200"
            }`}>
              得分: {rbdsqResult.score} / 13 ({rbdsqResult.isAbnormal ? "⚠️ 疑似 RBD" : "正常"})
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { key: "q1", text: "1. 经常做生动、激烈的梦境？" },
              { key: "q2", text: "2. 梦境中常与攻击、逃跑或打斗有关？" },
              { key: "q3", text: "3. 醒来后发现手臂或腿部在做梦中的动作？" },
              { key: "q4", text: "4. 睡眠中会无意伤害自己或同床伴侣？" },
              { key: "q5", text: "5. 睡眠中出现说话、喊叫或大笑？" },
              { key: "q7", text: "7. 醒来时能清晰回忆起梦境内容？" },
              { key: "q10", text: "10. 曾被同床者指出睡眠中有大幅肢体抽动？" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-medium text-slate-700">{item.text}</span>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() => updateRbdsqItem(item.key, true)}
                    className={`px-2 py-0.5 rounded text-xs transition ${
                      record.scales.rbdsq.items?.[item.key] === true
                        ? "bg-red-600 text-white font-bold"
                        : "bg-white border border-slate-300 text-slate-700"
                    }`}
                  >
                    是
                  </button>
                  <button
                    type="button"
                    onClick={() => updateRbdsqItem(item.key, false)}
                    className={`px-2 py-0.5 rounded text-xs transition ${
                      record.scales.rbdsq.items?.[item.key] === false
                        ? "bg-slate-700 text-white"
                        : "bg-white border border-slate-300 text-slate-700"
                    }`}
                  >
                    否
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* H14 ESS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">H14. 爱泼沃斯嗜睡量表 (ESS 8项)</h4>
              <p className="text-[11px] text-slate-500">
                0=从不打瞌睡, 1=轻度, 2=中度, 3=很可能打瞌睡 (≥10分提示嗜睡)
              </p>
            </div>
            <span className={`font-mono text-xs font-bold px-2 py-1 rounded border ${
              essResult.isAbnormal ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-teal-50 text-teal-700 border-teal-200"
            }`}>
              得分: {essResult.score} / 24 ({essResult.isAbnormal ? "存在日间嗜睡" : "正常"})
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { no: 1, name: "1. 坐着阅读时" },
              { no: 2, name: "2. 看电视时" },
              { no: 3, name: "3. 在公共场所静坐时 (如影院/会议)" },
              { no: 4, name: "4. 乘车连续1小时不活动时" },
              { no: 5, name: "5. 下午静卧休息时" },
              { no: 6, name: "6. 坐着与人谈话时" },
              { no: 7, name: "7. 午餐后静坐时" },
              { no: 8, name: "8. 乘车遇堵车停顿几分钟时" },
            ].map((item) => (
              <div key={item.no} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-medium text-slate-700">{item.name}</span>
                <select
                  value={record.scales.ess.items?.[item.no] ?? 0}
                  onChange={(e) => updateEssItem(item.no, Number(e.target.value))}
                  className="p-1 border border-slate-300 rounded bg-white text-xs"
                >
                  <option value={0}>0. 从不打瞌睡</option>
                  <option value={1}>1. 轻度瞌睡</option>
                  <option value={2}>2. 中度瞌睡</option>
                  <option value={3}>3. 严重/极易睡着</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
