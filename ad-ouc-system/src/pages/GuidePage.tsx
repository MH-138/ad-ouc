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
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  2. 神经心理测验标准化施测路径与临床质控规范
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  严格遵照首都医科大学宣武医院标准施测时序（控制测验疲劳效应与短时记忆干扰）
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded-md bg-teal-50 px-2.5 py-1 font-bold text-teal-700 border border-teal-200">
                  总耗时约 45-60 分钟
                </span>
                <span className="rounded-md bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                  单盲/双盲环境建议
                </span>
              </div>
            </div>

            {/* 临床四阶段架构全景 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3">
                <span className="text-[11px] font-bold text-teal-800">阶段一 · 准入初筛</span>
                <p className="text-xs font-bold text-slate-900 mt-1">建档、主诉与客观初筛</p>
                <p className="text-[11px] text-slate-500 mt-1">步骤 1 ~ 3 · 建立信任与基线</p>
              </div>
              <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3">
                <span className="text-[11px] font-bold text-sky-800">阶段二 · 记忆核心</span>
                <p className="text-xs font-bold text-slate-900 mt-1">AVLT词表学习与干扰测验</p>
                <p className="text-[11px] text-slate-500 mt-1">步骤 4 ~ 6 · 双倒计时抗干扰</p>
              </div>
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3">
                <span className="text-[11px] font-bold text-indigo-800">阶段三 · 综合域评定</span>
                <p className="text-xs font-bold text-slate-900 mt-1">执行功能、情绪日常与CDR</p>
                <p className="text-[11px] text-slate-500 mt-1">步骤 7 ~ 8 · 多域功能与知情者</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                <span className="text-[11px] font-bold text-amber-800">阶段四 · 综合推理</span>
                <p className="text-xs font-bold text-slate-900 mt-1">ATN生物标志物与AI研判</p>
                <p className="text-[11px] text-slate-500 mt-1">步骤 9 · 医生审核与报告输出</p>
              </div>
            </div>

            {/* 详细施测步骤清单 */}
            <div className="space-y-3.5">
              {[
                {
                  step: "步骤 1",
                  title: "暖场破冰与一般资料采集（OCR智能识别）",
                  focus: "基线准入与质控基石",
                  time: "3-5 分钟",
                  page: "demographics",
                  pageLabel: "进入病史采集",
                  desc: "核实受试者姓名、性别、身份证号（可拍照或载入就诊卡/病历OCR极速解析自动回填）；必须严格核定实际全日制受教育年限（直接决定MMSE、MoCA及AVLT的常模切点判定），完成爱丁堡利手评定及既往慢病与用药史筛查。",
                  points: [
                    "核实听力与视力矫正情况，确保测试期间无感觉障碍干扰",
                    "必须判定利手倾向（左利手/右利手），影响脑区优势半球分析",
                    "慢病与脑卒中后遗症排查，防止非退行性假阳性",
                  ],
                },
                {
                  step: "步骤 2",
                  title: "SCD-Q9 主诉自评与知情者观察",
                  focus: "主观认知下降前瞻特征",
                  time: "3-5 分钟",
                  page: "scd_subjective",
                  pageLabel: "进入 SCD-Q9",
                  desc: "由受试者独立完成 9 项记忆减退自我感知量表（支持语音朗读辅助）；≥ 5 分即判定为主诉阳性；同步开放家属观察通道，由照护者记录日常生活表现，用于主客观不一致性分析。",
                  points: [
                    "重点关注近2年出现且引起自身明显担忧的记忆减退",
                    "保持施测环境安静，主试不可诱导或纠正受试者的主观体验",
                    "评分结果与后续客观量表自动联动比对",
                  ],
                },
                {
                  step: "步骤 3",
                  title: "认知初筛测验 (MMSE 简易精神状态 & MoCA-B 基础认知)",
                  focus: "客观认知功能分层与排查",
                  time: "10-15 分钟",
                  page: "mmse_page",
                  pageLabel: "进入 MMSE",
                  desc: "进行定向力、即刻回忆、注意与计算力、延迟回忆及视空间（五边形交叉绘图）测试；新受试者默认全部为空未作答（显示 --/30分），每题录入即时自动保存并校准常模切界分（文盲≤17/小学≤20/中学及以上≤24）。",
                  points: [
                    "严格遵守标准化指导语，计算题不给受试者草稿纸或计算器",
                    "未作答题目严禁预设分数，答错与未答必须严格区分",
                    "画图测验需保证交叉形成四个角与十个外角的标准五边形结构",
                  ],
                },
                {
                  step: "步骤 4",
                  title: "AVLT-H 华山听觉词语记忆学习（记忆核心施测）",
                  focus: "外显情节记忆即刻学习 (N1-N3)",
                  time: "6-8 分钟",
                  page: "avlt_memory",
                  pageLabel: "进入华山记忆",
                  desc: "以均匀 1 秒/词速度逐词朗读 12 个无关双音节词表，连续进行 3 轮听读自由回忆并记录 N1、N2、N3 得分；完成第 3 轮回忆后，必须立即触发【测试计时中心】启动 5 分钟与 20 分钟倒计时！",
                  points: [
                    "3 轮听读之间不可打断，不可按类别或语义提示受试者",
                    "倒计时启动后严禁再次复述或讨论词表内容",
                    "在等待间隔期立即转入步骤 5 的非记忆类干扰测验",
                  ],
                },
                {
                  step: "步骤 5",
                  title: "间隔非记忆测验 (VFT 动物流畅性 & BNT 命名)",
                  focus: "填补延迟期空档并实施有效干扰",
                  time: "5-10 分钟",
                  page: "language_naming",
                  pageLabel: "进入言语命名",
                  desc: "在 AVLT-H 延迟等待期间进行 60 秒动物命名流畅性（VFT）与 30 项波士顿命名（BNT），消耗言语工作记忆与语义网络，完全阻断受试者在心中默诵前述 12 词表。",
                  points: [
                    "严格计时 60 秒动物流畅性，重复词不重复计分",
                    "BNT 允许在 20 秒后给予音节线索提示",
                    "不可提及记忆测试，保持受试者注意力集中于言语项目",
                  ],
                },
                {
                  step: "步骤 6",
                  title: "AVLT-H 延迟回忆与长延迟再认 (N4 & N5)",
                  focus: "延迟提取与再认辨别力",
                  time: "5 分钟",
                  page: "avlt_memory",
                  pageLabel: "回测 AVLT",
                  desc: "计时中心 5 分钟短延迟警报触发时，执行自由延迟回忆（N4）；20 分钟长延迟警报触发时，执行长延迟自由回忆及 24 词长延迟再认（包含 12 个诱饵词，计算辨别力指数）。",
                  points: [
                    "遗忘型 MCI (aMCI) 患者往往表现为快速遗忘且再认不能获益",
                    "SCD 患者客观延迟得分通常保持在常模正常范围",
                    "严格登记虚报数（错认诱饵词为原词）",
                  ],
                },
                {
                  step: "步骤 7",
                  title: "执行功能测验 (STT-A/B 连线) 与情绪日常量表",
                  focus: "额叶执行转换与情绪干扰排查",
                  time: "10-15 分钟",
                  page: "executive_stt",
                  pageLabel: "进入连线执行",
                  desc: "执行 STT 形状连线测验 A/B 记录耗时与错误数；随后评估老年抑郁量表 (GDS-15, 排除情绪假性痴呆)、FAQ 10项日常生活活动能力与 PSQI 睡眠质量。",
                  points: [
                    "STT-B 测验中出现连错时主试应立即提醒纠正，计时不暂停",
                    "GDS-15 > 8 分提示需警惕抑郁伴随的假性认知下降",
                    "FAQ 评分 > 5 分提示日常独立生活能力已出现实质性受损",
                  ],
                },
                {
                  step: "步骤 8",
                  title: "知情者访谈与 Global CDR 临床痴呆分级判定",
                  focus: "整体社会功能与痴呆分期",
                  time: "5-8 分钟",
                  page: "cdr_staging",
                  pageLabel: "进入 CDR 分级",
                  desc: "结合知情者观察与受试者深入访谈，评定记忆、定向、判断、社区、家务与自理 6 大域；系统严格按照华盛顿大学标准决策树自动推导 Global CDR 分级（0 = 正常/SCD, 0.5 = MCI, 1 = 轻度痴呆）。",
                  points: [
                    "记忆域（M）具有核心决定权，当且仅当记忆域为 0 且次要域受损 ≤ 1 时判定为 0",
                    "知情者必须为每周与患者同住或接触 ≥ 3 天的直系亲属",
                  ],
                },
                {
                  step: "步骤 9",
                  title: "ATN 标志物融合、AI 临床智能推理与三级审核签署",
                  focus: "临床闭环决策与随访医嘱生成",
                  time: "3-5 分钟",
                  page: "comprehensive_report",
                  pageLabel: "进入综合报告",
                  desc: "整合 Aβ 淀粉样蛋白、p-Tau 磷酸化蛋白及 MRI/FDG 神经变性标志物；触发多阶段动态 AI 智能推理动画，综合全套量表生成个性化临床诊断与随访医嘱；应用后进入待审核队列，由主治医生最终研判签署并一键导出标准报告单。",
                  points: [
                    "每次推理均动态执行 4 阶段研判（基线扫描 -> 常模切界 -> ATN融合 -> 决策分型）",
                    "诊断应用后系统自动锁定为待审核状态，待办队列单受试者唯一且支持历史版本留痕",
                    "医生签署确认后自动推送到受试者端与家属端查看",
                  ],
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-teal-300 hover:shadow-xs transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-lg bg-teal-600 px-2.5 py-1 text-xs font-bold text-white shadow-2xs">
                        {item.step}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {item.focus}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-400">⏱️ {item.time}</span>
                      {onNavigate && (
                        <button
                          type="button"
                          onClick={() => onNavigate(item.page)}
                          className="flex items-center gap-1 rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700 hover:bg-teal-100 transition border border-teal-200"
                        >
                          <span>{item.pageLabel}</span>
                          <span className="text-[10px]">→</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">{item.desc}</p>

                  <div className="mt-2.5 rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-600">
                    <div className="font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <span className="text-teal-600">●</span>
                      <span>施测质控关键红线：</span>
                    </div>
                    <ul className="space-y-0.5 pl-3 list-disc text-slate-500">
                      {item.points.map((pt, pidx) => (
                        <li key={pidx}>{pt}</li>
                      ))}
                    </ul>
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
