import React, { useState } from "react";
import {
  BookOpen,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  Activity,
  Heart,
  FileSpreadsheet,
  Search,
} from "lucide-react";

interface GuidePageProps {
  onNavigate?: (page: string) => void;
}

export const GuidePage: React.FC<GuidePageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<"standard" | "workflow" | "norms" | "cdr" | "faq">("standard");
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              首都医科大学宣武医院 AD-SCD 临床评定规范与使用手册
            </h1>
            <p className="text-xs text-slate-500">
              国家神经系统疾病临床医学研究中心 / 贾建平教授团队 SCD 前瞻性队列测评标准
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab("standard")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeTab === "standard" ? "bg-white text-teal-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            📋 入组标准
          </button>
          <button
            onClick={() => setActiveTab("workflow")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeTab === "workflow" ? "bg-white text-teal-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🔄 测评流程
          </button>
          <button
            onClick={() => setActiveTab("norms")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeTab === "norms" ? "bg-white text-teal-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            📊 常模切界分
          </button>
          <button
            onClick={() => setActiveTab("cdr")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeTab === "cdr" ? "bg-white text-teal-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🏅 CDR决策树
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        {activeTab === "standard" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                1. 主观认知下降 (Subjective Cognitive Decline, SCD) 临床入组标准
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                依据 2014 年 SCD-I (Subjective Cognitive Decline Initiative) 国际诊断框架及宣武医院专家共识
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4">
                <h3 className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" />
                  <span>核心必备标准 (Inclusion Criteria)</span>
                </h3>
                <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-slate-700">
                  <li>• 存在自我感知的持续性记忆力下降（起病在近 5 年内为佳）；</li>
                  <li>• SCD-Q9 问卷评分 ≥ 5 分，或受试者对记忆减退存在明显主观担忧；</li>
                  <li>• 年龄 ≥ 50 岁，具有可靠的知情同意能力；</li>
                  <li>• 客观认知筛查（MMSE / MoCA-B）校正后均在同龄同教育程度正常范围内；</li>
                  <li>• 日常生活能力基本不受损害（FAQ &lt; 5 分，CDR = 0 或 0.5 但记忆域为0）。</li>
                </ul>
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
                <h3 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <span>重要排除标准 (Exclusion Criteria)</span>
                </h3>
                <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-slate-700">
                  <li>• 达到 MCI 或轻度痴呆诊断标准（客观量表显著受损）；</li>
                  <li>• 严重重度抑郁或焦虑症导致的主观记忆主诉（HAMD-17 &gt; 24分）；</li>
                  <li>• 严重脑血管病（大面积脑梗死、脑出血后遗症）；</li>
                  <li>• 严重甲状腺功能减退、维生素 B12 缺乏症等系统性躯体疾病；</li>
                  <li>• 严重酗酒或药物滥用史。</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === "workflow" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                2. 神经心理测验标准化施测流程
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                宣武医院标准施测顺序（控制疲劳效应与记忆干扰）
              </p>
            </div>

            <div className="space-y-3">
              {[
                { step: "步骤 1", title: "暖场破冰与一般资料采集", desc: "建立良好信任，核对年龄、受教育年限、利手判断及慢病史。" },
                { step: "步骤 2", title: "SCD-Q9 主诉自评与问卷", desc: "受试者独立完成 9 项记忆自评（可采用大字号语音对话模式）。" },
                { step: "步骤 3", title: "初筛测验 (MMSE & MoCA-B)", desc: "完成定向力、计算力、视空间（画钟/连线）等初筛项目。" },
                { step: "步骤 4", title: "AVLT-H 华山听觉词语记忆学习", desc: "连续 3 轮听读词表回忆 (N1-N3)，随后启动 5分钟 / 20分钟 倒计时。" },
                { step: "步骤 5", title: "间隔非记忆测验 (VFT 动物流畅性 & BNT 命名)", desc: "在延迟记忆等待间隙完成 60 秒动物流畅性与 30 项命名测验。" },
                { step: "步骤 6", title: "AVLT-H 延迟回忆与再认 (N4 & N5)", desc: "倒计时结束，立即进行自由延迟回忆及24词再认测试。" },
                { step: "步骤 7", title: "执行功能测验 (STT-A/B 连线)", desc: "记录完成 A 图与 B 图连线所需净时间（秒）与错误数。" },
                { step: "步骤 8", title: "情绪与日常生活能力 (GDS-15, FAQ, CDR)", desc: "知情者与受试者联合评估，判定 Global CDR 等级。" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <span className="shrink-0 rounded-lg bg-teal-600 px-2.5 py-1 text-xs font-bold text-white">
                    {item.step}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                    <p className="mt-0.5 text-xs text-slate-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "norms" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                3. 中国人群神经心理量表常模切界分速查表
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                依据宣武医院及上海华山医院全国大样本常模数据
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/80 text-slate-700">
                    <th className="p-3 font-bold">测验量表</th>
                    <th className="p-3 font-bold">文盲组 (0年)</th>
                    <th className="p-3 font-bold">小学组 (1-6年)</th>
                    <th className="p-3 font-bold">中学及以上 (≥7年)</th>
                    <th className="p-3 font-bold">临床异常提示</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  <tr>
                    <td className="p-3 font-bold text-slate-800">MMSE (30分)</td>
                    <td className="p-3">≤ 17 分异常</td>
                    <td className="p-3">≤ 20 分异常</td>
                    <td className="p-3">≤ 24 分异常</td>
                    <td className="p-3 text-rose-600">低于切界分提示痴呆/严重受损</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-800">MoCA-B 基础版 (30分)</td>
                    <td className="p-3">≤ 19 分异常</td>
                    <td className="p-3">≤ 22 分异常</td>
                    <td className="p-3">≤ 24 分异常</td>
                    <td className="p-3 text-amber-600">MCI 早期识别高敏感性指标</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-800">AVLT-H 短延迟回忆 (N4)</td>
                    <td className="p-3">≤ 3 词</td>
                    <td className="p-3">≤ 4 词</td>
                    <td className="p-3">≤ 5 词</td>
                    <td className="p-3 text-rose-600">遗忘型 MCI (aMCI) 核心特征</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-800">VFT 动物流畅性 (1分钟)</td>
                    <td className="p-3">&lt; 11 个</td>
                    <td className="p-3">&lt; 13 个</td>
                    <td className="p-3">&lt; 16 个</td>
                    <td className="p-3 text-amber-600">额叶执行与语言语义网络损害</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-800">SCD-Q9 主诉问卷 (9分)</td>
                    <td className="p-3" colSpan={3}>≥ 5 分即判定为 SCD 主诉阳性</td>
                    <td className="p-3 text-teal-700 font-bold">SCD 核心入组指标</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "cdr" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                4. Washington University Global CDR 判定决策规则
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                严格遵循华盛顿大学临床痴呆评定规则（记忆域为主导核心）
              </p>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-700">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="font-bold text-slate-900">① 核心主导原则 (Memory-Centric Rule)</h4>
                <p className="mt-1">
                  记忆（Memory, M）是 CDR 评分的核心主导域。当至少有 3 个其他非记忆次要域（定向力、判断力、社区事务、家务与爱好、个人自理）的评分与记忆域一致时，<strong>Global CDR 直接等于记忆域评分</strong>。
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="font-bold text-slate-900">② 当记忆域为 0 分时 (M = 0)</h4>
                <p className="mt-1">
                  若 M = 0，且至多有 1 个次要域评为 0.5 分，则 Global CDR = 0；若有 2 个或更多次要域 ≥ 0.5 分，则 Global CDR = 0.5。
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="font-bold text-slate-900">③ 当记忆域为 0.5 分时 (M = 0.5)</h4>
                <p className="mt-1">
                  若 M = 0.5，且至少 3 个次要域 ≥ 1 分，则 Global CDR 升级为 1；否则若次要域多数为 0 或 0.5，则 Global CDR = 0.5（典型 MCI / 极轻度认知障碍）。
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
