import React, { useState } from "react";
import {
  BookOpen,
  X,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Timer,
  Sparkles,
  Printer,
  Layers,
  FileSpreadsheet,
  Activity,
  Heart,
  ChevronRight,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<
    "overview" | "workflow" | "scales" | "norms" | "faq"
  >("overview");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-50 text-slate-900 p-5 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <span>宣武医院 AD-SCD 认知评定工作台 · 临床使用手册</span>
                <span className="text-xs bg-teal-50 text-teal-800 px-2.5 py-0.5 rounded-full font-bold border border-teal-200">
                  v2.0 规范版
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                基于国家神经系统疾病临床医学研究中心 / 贾建平教授团队 SCD 前瞻队列测评规范
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition"
            title="关闭手册"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 overflow-x-auto space-x-2 text-xs font-semibold">
          {[
            { id: "overview", name: "系统概览与定位", icon: Brain },
            { id: "workflow", name: "标准临床测评流程", icon: Activity },
            { id: "scales", name: "全套量表清单与分工", icon: Layers },
            { id: "norms", name: "常模标准与CDR判定", icon: FileSpreadsheet },
            { id: "faq", name: "操作技巧与常见问题", icon: Heart },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex items-center space-x-1.5 px-4 py-2.5 border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? "border-teal-600 text-teal-700 bg-white rounded-t-lg shadow-sm"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 leading-relaxed">
          {activeSection === "overview" && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
                <h3 className="font-bold text-teal-900 text-base mb-1">
                  💡 什么是 SCD（主观认知下降）？
                </h3>
                <p className="text-xs text-teal-800 leading-relaxed">
                  主观认知下降（Subjective Cognitive Decline, SCD）是指个体自我感觉记忆力或其他认知功能相较于既往正常水平发生持续减退，但在客观神经心理学测验（如 MMSE、MoCA、AVLT 等）中得分依然在同龄、同受教育年限的正常常模范围内，且日常生活能力完全独立。SCD 是阿尔茨海默病（AD）在临床前期（Preclinical AD）的关键早期预警窗口。
                </p>
              </div>

              <h4 className="font-bold text-slate-900 text-base">系统核心能力</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>患者资料与基线全景建档</span>
                  </div>
                  <p className="text-slate-600">
                    涵盖基本人口学、精准教育年限、心脑血管病史、外伤/麻醉/一氧化碳中毒排他筛查、家族史、BMI及神经体征。
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>12 大维度量表数字化测评</span>
                  </div>
                  <p className="text-slate-600">
                    从 SCD-Q9、爱丁堡利手、MMSE、MoCA-B、华山 AVLT-H、BNT-30、STT 连线到 ADAS-Cog、CDR、NPI、FAQ、PSQI 全覆盖。
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>客观常模自动校准与红绿灯</span>
                  </div>
                  <p className="text-slate-600">
                    根据患者实际年龄与教育年限自动分层（文盲/小学/初中/大学），实时给出正常（绿）、可疑（黄）、损伤（红）判断。
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>AI 智能诊断推理与一键打印</span>
                  </div>
                  <p className="text-slate-600">
                    Gemini AI 综合全部量表分值、主客观分离特征与生物标志物给出专业分析，并支持输出三甲医院标准报告单。
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === "workflow" && (
            <div className="space-y-5 animate-fade-in">
              <h4 className="font-bold text-slate-900 text-base">
                临床测评五步标准化流程（宣武工作法）
              </h4>

              <div className="space-y-3 text-xs">
                {[
                  {
                    step: "第一步",
                    title: "建档与病史基线 (Tab: A-G)",
                    desc: "录入患者姓名、年龄、准确受教育年限（极为关键，直接影响常模判定切点）、既往病史及痴呆家族史。",
                    badge: "必填基线",
                  },
                  {
                    step: "第二步",
                    title: "主观主诉与初筛评估 (Tab: SCD专项 / 认知初筛)",
                    desc: "让患者填写 SCD-Q9 问卷（≥5分提示主观减退显著）；由主试进行利手评定、MMSE（30分）与 MoCA-B 认知筛查。",
                    badge: "主诉与初筛",
                  },
                  {
                    step: "第三步",
                    title: "多任务记忆与延迟测验 (Tab: 记忆核心 / 计时中心)",
                    desc: "进行 AVLT-H 词表学习（N1-N3），随即开启【测试计时器】5分钟与20分钟倒计时；在等待间隔期依次完成语言命名 (BNT/VFT) 与执行力 (STT连线) 测验，随后在计时器响铃时回测 N4 短延迟与 N5 长延迟记忆。",
                    badge: "核心测试",
                  },
                  {
                    step: "第四步",
                    title: "情绪、行为与日常生活能力 (Tab: 情绪与行为 / 生活与睡眠)",
                    desc: "评定 GDS-15 抑郁（排查情绪因素对记忆的主诉干扰）、NPI 精神行为症状、FAQ 10项日常生活活动能力与 PSQI 睡眠质量。",
                    badge: "功能与心理",
                  },
                  {
                    step: "第五步",
                    title: "CDR 痴呆分级、AI 诊断推理与报告生成 (Tab: CDR / 评估看板)",
                    desc: "系统自动计算 Global CDR 与箱总分；点击【AI 诊断辅助】获取大模型结构化临床意见，最后点击【评估报告】生成并打印三甲标准报告单。",
                    badge: "结论与输出",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start space-x-3"
                  >
                    <div className="w-16 flex-shrink-0 text-center">
                      <span className="text-[11px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full block">
                        {item.step}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-1 block font-medium">
                        {item.badge}
                      </span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="font-bold text-slate-800 text-sm">{item.title}</div>
                      <p className="text-slate-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "scales" && (
            <div className="space-y-4 animate-fade-in text-xs">
              <h4 className="font-bold text-slate-900 text-base">系统支持的全套神经心理量表</h4>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">量表/测验代码</th>
                      <th className="p-2.5">量表全称与满分</th>
                      <th className="p-2.5">测评认知域 / 靶向功能</th>
                      <th className="p-2.5">临床阳性/界值规则</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">SCD-Q9</td>
                      <td className="p-2.5">主观认知下降问卷 (9分)</td>
                      <td className="p-2.5">记忆主诉、同龄对比、情绪担忧</td>
                      <td className="p-2.5 text-rose-600 font-semibold">≥5分 提示主观显著下降</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">MMSE</td>
                      <td className="p-2.5">简易精神状态检查 (30分)</td>
                      <td className="p-2.5">总体认知初筛（定向/计算/复述）</td>
                      <td className="p-2.5">文盲≤17，小学≤20，中学及以上≤24</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">MoCA-B</td>
                      <td className="p-2.5">蒙特利尔认知评估基础量表 (30分)</td>
                      <td className="p-2.5">全面认知筛查（执行/注意/视空间）</td>
                      <td className="p-2.5">≤6年≤19，7-12年≤22，&gt;12年≤24</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">AVLT-H</td>
                      <td className="p-2.5">华山版听觉词语学习测验</td>
                      <td className="p-2.5">海马依赖性听觉情景记忆 (N1-N7)</td>
                      <td className="p-2.5">N5长延迟回忆：&lt;60岁≤5词，60-69岁≤4词，≥70岁≤3词</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">Logical Memory</td>
                      <td className="p-2.5">逻辑记忆故事测验 (25单元)</td>
                      <td className="p-2.5">连贯叙事长时记忆提取</td>
                      <td className="p-2.5">延迟回忆：≤7年≤2分，8-15年≤4分，≥16年≤8分</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">VFT</td>
                      <td className="p-2.5">动物范畴词语流畅性测验 (1分钟)</td>
                      <td className="p-2.5">语义提取与执行流畅性</td>
                      <td className="p-2.5">≤8年≤12词，9-12年≤13词，≥13年≤14词</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">BNT-30</td>
                      <td className="p-2.5">波士顿命名测验 30 项版</td>
                      <td className="p-2.5">视觉词语命名与找词困难</td>
                      <td className="p-2.5">自发命名：≤8年≤19分，9-12年≤21分，≥13年≤22分</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">STT-A / STT-B</td>
                      <td className="p-2.5">形状连线测验 (Shape Trails)</td>
                      <td className="p-2.5">处理速度 (A) 与认知灵活性 (B)</td>
                      <td className="p-2.5">用时过长 (如 STT-B &gt; 200 秒) 提示执行受损</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">CDR</td>
                      <td className="p-2.5">临床痴呆评定量表 (6大维度)</td>
                      <td className="p-2.5">痴呆严重程度与临床分级</td>
                      <td className="p-2.5 font-semibold text-teal-700">0(健康), 0.5(MCI/可疑), 1(轻度), 2(中度), 3(重度)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">GDS-15</td>
                      <td className="p-2.5">老年抑郁自评量表 (15分)</td>
                      <td className="p-2.5">抑郁情绪排查</td>
                      <td className="p-2.5 text-amber-600 font-semibold">≥8分 提示抑郁状态（需排查情绪性记忆主诉）</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">FAQ</td>
                      <td className="p-2.5">功能活动问卷 (10项 0-30分)</td>
                      <td className="p-2.5">工具性日常生活活动能力 (IADL)</td>
                      <td className="p-2.5">0-4分符合 SCD 独立期，≥9分提示痴呆期受损</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">NPI</td>
                      <td className="p-2.5">神经精神问卷 (12个症状域)</td>
                      <td className="p-2.5">精神行为症状 (BPSD)</td>
                      <td className="p-2.5">统计总分 (频率×严重度) 及知情者痛苦值</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === "norms" && (
            <div className="space-y-4 animate-fade-in text-xs">
              <h4 className="font-bold text-slate-900 text-base">
                宣武医院中国老年人群常模与判定原则
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="font-bold text-slate-900 text-sm block">
                    1. 主客观认知功能分离（SCD 的金标准）
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    <strong>SCD 核心诊断特征</strong>：患者主观主诉持续存在（SCD-Q9 ≥ 5分），但客观神经心理学测验（MMSE、MoCA-B、AVLT N5长延迟）<strong>全部在同龄常模的 -1.0SD / -1.5SD 以上（表现为正常绿灯）</strong>，且 FAQ 评分在 0-4 分（生活完全自理）。
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="font-bold text-slate-900 text-sm block">
                    2. aMCI（遗忘型轻度认知障碍）判定
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    <strong>aMCI 核心诊断特征</strong>：患者主观主诉伴客观听觉词表长延迟回忆（AVLT N5）或逻辑记忆延迟回忆显著落后（<strong>低于年龄/教育常模 -1.5SD，系统呈红灯</strong>），CDR 评分为 0.5 分，FAQ &lt; 9 分（日常生活自理或仅有极轻微受累）。
                  </p>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <span className="font-bold text-amber-900 text-sm flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>Global CDR Washington Univ. 算法引擎说明</span>
                </span>
                <p className="text-amber-800 leading-relaxed">
                  系统采用经典的华盛顿大学临床痴呆评定算法：当记忆（M）为核心维度的同时，结合定向、判断、社区、家务、自理等 5 项次要维度（Secondaries）的多数票规则（Majority Rule）严格计算。系统同时输出 <strong>Global CDR 等级 (0/0.5/1/2/3)</strong> 与 <strong>Sum of Boxes (箱总分 0-18分)</strong>。
                </p>
              </div>
            </div>
          )}

          {activeSection === "faq" && (
            <div className="space-y-4 animate-fade-in text-xs">
              <h4 className="font-bold text-slate-900 text-base">高频操作技巧与常见问题</h4>

              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-bold text-slate-900 text-sm">
                    Q1: 如何快速演示或查看典型病例的数据分布？
                  </span>
                  <p className="text-slate-600">
                    点击右上角【<strong>典型病例</strong>】下拉菜单，即可一键载入「李建平 (典型SCD)」、「王淑芬 (典型aMCI)」或「张卫国 (健康老年对照)」。系统会自动填充全部病史、量表、常模对比及生物标志物。
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-bold text-slate-900 text-sm">
                    Q2: 如何使用多任务测试计时器避免打乱测评节奏？
                  </span>
                  <p className="text-slate-600">
                    在完成 AVLT N3 即刻词表学习后，点击顶栏【<strong>测试计时器</strong>】，启动 5 分钟与 20 分钟倒计时。计时在后台独立运行，不会阻塞您切换到其他 Tab 进行 VFT 语言流畅性或 STT 连线测试。倒计时结束时会有状态提示。
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-bold text-slate-900 text-sm">
                    Q3: 测评数据会丢失吗？如何保存与导出？
                  </span>
                  <p className="text-slate-600">
                    系统内置 <strong>LocalStorage 自动实时同步</strong>，意外刷新页面不会丢失数据。完成全部测评后，点击【<strong>评估报告</strong>】可直接调起浏览器打印窗口导出为高清 PDF 电子报告单。
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            宣武医院认知障碍多中心科研协作组 · Xuanwu AD-SCD Workstation
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium text-xs shadow-sm transition"
          >
            我已知晓，开始测评
          </button>
        </div>
      </div>
    </div>
  );
};
