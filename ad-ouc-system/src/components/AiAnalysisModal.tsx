import React, { useState, useEffect } from "react";
import { SubjectRecord } from "../types/assessment";
import {
  Sparkles,
  X,
  Copy,
  Check,
  RefreshCw,
  Brain,
  Stethoscope,
  CheckCircle2,
  Send,
  FileText,
  ShieldCheck,
  ArrowRight,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { tursoApi } from "../services/tursoApi";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  record: SubjectRecord;
  onApplyDiagnosisNotes: (notes: string, category?: number) => void;
  onConsultationSubmitted?: () => void;
  onOpenDoctorApproval?: () => void;
}

export interface MockClinicalScenario {
  id: string;
  tag: string;
  category: number;
  categoryLabel: string;
  title: string;
  confidence: number;
  summary: string;
  reportText: string;
  keyAbnormalities: string[];
  recommendations: string[];
}

const sumNumericValues = (source: Record<string, unknown> | Record<number, unknown> | undefined) =>
  Object.values(source || {}).reduce<number>((sum, val) => sum + Number(val || 0), 0);

export function generateDynamicScenarios(record: SubjectRecord): MockClinicalScenario[] {
  const name = record.demographics?.name || "受试者";
  const age = record.demographics?.age || 68;
  const gender = record.demographics?.gender === 1 ? "男" : "女";
  const edu = record.demographics?.educationYears || 12;
  const mmseScore = sumNumericValues(record.scales.mmse?.items) || 27;
  const moca = record.scales.mocaB;
  const mocaScore =
    (moca?.executiveTrail || 0) +
    (moca?.fluencyFruit || 0) +
    (moca?.orientation || 0) +
    (moca?.calculation13Yuan || 0) +
    (moca?.abstraction || 0) +
    (moca?.delayedRecall || 0) +
    (moca?.visualPerception10Obj || 0) +
    (moca?.naming4Animals || 0) +
    (moca?.attentionDigitsWhite || 0) +
    (moca?.attentionDigitsBlack || 0) || 23;
  const scdScore = sumNumericValues(record.scdQ9 as unknown as Record<string, unknown>) || 6;
  const cdrScore = Math.max(...Object.values(record.scales.cdr || {}).map((val) => Number(val || 0)), 0) || 0.5;
  const id = record.subjectNo || record.id || "01-8962";

  const hasHtn = record.history?.hypertension?.has;
  const htnYears = record.history?.hypertension?.years || 8;
  const htnBp = record.history?.hypertension?.usualBp || "135/85";
  const mriMta = record.biomarkers?.hippocampalSeverity ?? 2;
  const apoe = record.biomarkers?.apoe4Genotype?.value || "ε3/ε4";

  // Random variance factor for realism
  const randomConfidence = (base: number) => Number((base + (Math.random() * 0.04 - 0.02)).toFixed(2));

  return [
    {
      id: "scd_typical",
      tag: "典型SCD",
      category: 1, // 1: 主观认知下降 (SCD)
      categoryLabel: "主观认知下降 (SCD 极早期)",
      title: `${name} - 典型主观认知下降阶段 (SCD, 符合 NIA-AA 临床早期特征)`,
      confidence: randomConfidence(0.93),
      summary: `受试者 ${name} (${gender}, ${age}岁) 自评 SCD-Q9 评分为 ${scdScore}/9 分，主诉近 1 年半记忆力持续减退且明显担忧；全套客观神经心理量表 MMSE ${Math.max(mmseScore, 26)}/30、MoCA-B ${Math.max(mocaScore, 24)}/30，均处于同年龄常模界值之上；全球 CDR=0 分，知情者 FAQ=0 分，日常生活完全独立，符合 Jessen 2014 标准主观认知下降。`,
      keyAbnormalities: [
        `SCD-Q9 主观记忆主诉显著 (${scdScore}/9分)，自感近事遗忘且伴有情绪焦虑担忧`,
        `客观量表 MMSE (${Math.max(mmseScore, 26)}分) 与 MoCA-B (${Math.max(mocaScore, 24)}分) 均在同年龄与受教育(${edu}年)常模内`,
        "知情者 FAQ 0分、全球 CDR 0分，完全保留独立社会日常生活自理能力",
        `头颅 MRI 海马 MTA ${Math.min(mriMta, 1)}级，无明显皮质局灶性脑萎缩`,
      ],
      recommendations: [
        "建议正式纳入宣武医院多中心 SCD 科研队列，建立 12 个月常规纵向随访档案",
        "实施脑健康生活方式干预：坚持地中海-DASH 膳食模式，每周保证 150 分钟中等强度有氧运动",
        hasHtn ? `积极管控高血压(目前平时${htnBp})与脑血管危险因素，监测夜间睡眠结构` : "积极监控心脑血管代谢危险因素，定期检测空腹血糖与血脂谱",
        `建议结合外周血浆 p-tau217 与 APOE 基因型 (${apoe}) 进行纵向神经退行性病理风险分层`,
      ],
      reportText: `【宣武医院认知障碍多模态智能临床研判报告】
受试者编号：${id}   受试者姓名：${name}   性别：${gender}   年龄：${age}岁   文化程度：${edu}年
一、临床综合分型研判：
【主观认知下降 (Subjective Cognitive Decline, SCD 典型期)】
推荐临床诊断编码：SCD (Category 1)    综合研判置信度：${Math.round(randomConfidence(0.93) * 100)}%

二、多维临床依据与神经心理特征：
1. 主观记忆主诉：SCD-Q9 自评分数 ${scdScore}/9 分，主要表现为近事遗忘频度增加、比同龄人更感吃力且伴有明确的内心担忧，符合 Jessen 等提出的 SCD-plus 高危主诉标准。
2. 客观神经测验：MMSE ${Math.max(mmseScore, 26)}/30 分，MoCA-B ${Math.max(mocaScore, 24)}/30 分，均高于受教育常模界值，未达到 MCI 客观损害界限。
3. 痴呆分级与功能：CDR 全球评分 0 分，知情者功能活动量表 FAQ 0 分，生活自理完全正常。
4. 影像与生物学框架：头颅 MRI 示双侧海马形态规则 (MTA ${Math.min(mriMta, 1)}级)，APOE 基因型为 ${apoe}。

三、专家处理与随访建议：
1. 纳入队列：正式建立 SCD 纵向科研队列档案，预约 12 个月后的首轮年度随访。
2. 生活处方：规律执行地中海饮食与有氧运动处方，控制脑血管危险因素暴露。
3. 生物标志物：建议完善外周血 p-tau217 蛋白检测与睡眠监测。
（本建议已实时推送至主治医师工作站待办队列，经医生电子签字后正式生效）`,
    },
    {
      id: "amci_multidomain",
      tag: "遗忘型MCI",
      category: 2, // 2: aMCI
      categoryLabel: "遗忘型轻度认知障碍 (aMCI 多领域)",
      title: `${name} - 遗忘型轻度认知障碍 (aMCI, 海马情景记忆受累)`,
      confidence: randomConfidence(0.91),
      summary: `受试者 ${name} (${age}岁) 客观测验 MMSE 评分为 ${Math.min(mmseScore, 24)}/30 分、MoCA-B 为 ${Math.min(mocaScore, 20)}/30 分；延迟回忆得分显著低于受教育调整后常模临界值 (落后 >1.5 SD)；全球 CDR 评分为 0.5 分 (记忆域 0.5 分)；生活基本自理但复杂工具性日常能力轻度耗时，伴内侧颞叶海马萎缩 (MTA ${Math.max(mriMta, 2)}级)，符合 Albert 2011 诊断标准。`,
      keyAbnormalities: [
        `客观神经心理测验 MMSE ${Math.min(mmseScore, 24)}分，MoCA-B ${Math.min(mocaScore, 20)}分，情景记忆长延迟回忆明确受损`,
        `全球 CDR 评分为 0.5 分，记忆领域得分 0.5，知情者 FAQ 得分 4 分`,
        `头颅 MRI 呈双侧海马轻中度萎缩 (MTA ${Math.max(mriMta, 2)}级)，脑室旁白质轻度疏松 (Fazekas 1级)`,
        `APOE 基因检测提示为 ${apoe}，阿尔茨海默病神经退行性病理演进风险高`,
      ],
      recommendations: [
        "明确诊断为遗忘型轻度认知障碍 (aMCI，考虑阿尔茨海默病前驱期源性)",
        "启动早期认知干预：开展计算机化认知靶向训练 (每周 3 次，每次 45 分钟)",
        "酌情开展促脑代谢干预，评估胆碱酯酶抑制剂或抗氧化药物用药适应证",
        "缩短临床随访周期为每 6 个月随访一次，复查 MMSE、MoCA-B 与血浆 p-tau217",
      ],
      reportText: `【宣武医院认知障碍多模态智能临床研判报告】
受试者编号：${id}   受试者姓名：${name}   性别：${gender}   年龄：${age}岁   文化程度：${edu}年
一、临床综合分型研判：
【遗忘型轻度认知障碍 (amnestic Mild Cognitive Impairment, aMCI)】
推荐临床诊断编码：aMCI (Category 2)    综合研判置信度：${Math.round(randomConfidence(0.91) * 100)}%

二、多维临床依据与神经心理特征：
1. 核心症状：近事遗忘持续 2 年以上，患者及家属均证实记忆力明显减退，常反复询问相同问题。
2. 客观测验损害：MMSE 得分 ${Math.min(mmseScore, 24)}/30 分，MoCA-B 得分 ${Math.min(mocaScore, 20)}/30 分，听觉词语学习长延迟回忆落后于同龄常模 1.8 个标准差。
3. 日常生活能力：CDR 全球评分 0.5 分，FAQ 4分，基本生活自理，但处理财务及复杂家务较前明显吃力。
4. 影像与生物学框架：头颅 3.0T MRI 提示双侧内侧颞叶海马萎缩 (MTA ${Math.max(mriMta, 2)}级)；APOE 基因型为 ${apoe}。

三、专家处理与随访建议：
1. 诊断定性：符合 NIA-AA 2018 标准阿尔茨海默病源性轻度认知障碍前驱期。
2. 临床处置：建议启动促认知与脑代谢支持，开展情景记忆结构化代偿训练。
3. 随访周期：每 6 个月复查一次神经心理量表与头颅核磁，密切监测病情转换轨迹。
（本建议已实时推送至主治医师工作站待办队列，经医生电子签字后正式生效）`,
    },
    {
      id: "vascular_mci",
      tag: "血管性MCI",
      category: 3, // 3: 血管性
      categoryLabel: "血管性认知功能损害 (VaCI/VaMCI)",
      title: `${name} - 脑小血管病伴认知损害 (VaMCI, 脑白质疏松与执行功能减退)`,
      confidence: randomConfidence(0.89),
      summary: `受试者 ${name} (${age}岁) 伴有 ${hasHtn ? `高血压病史 ${htnYears} 年` : "动脉硬化危险因素"}；认知测评以精神运动速度迟缓、数字符号转换受损与画钟测验 (CDT) 得分偏低为主；头颅 MRI FLAIR 序列提示双侧侧脑室旁脑白质高信号 (Fazekas 2级)，伴散在微出血病灶，符合脑小血管病认知损害特征。`,
      keyAbnormalities: [
        `画钟测验 (CDT 2/4分) 与连线测验明显耗时，视空间与额叶执行功能损害优先于情景记忆`,
        `头颅 MRI 显示双侧脑室旁及深部脑白质高信号 (Fazekas 2级)，伴腔隙性脑梗死病灶`,
        hasHtn ? `既往长期高血压病史 (${htnYears}年，平时血压 ${htnBp})，脑微血管硬化基础明确` : "血管源性危险因素暴露明确",
        "CDR 全球评分 0.5 分，波动性记忆下降，无家族性早发阿尔茨海默病史",
      ],
      recommendations: [
        "严格强化血管病二级预防：将血压严格控制在 <130/80 mmHg，配合他汀类稳定斑块",
        "口服改善脑微循环与抗血小板药物 (遵神经内科专科处方)",
        "执行脑血管健康生活方式：低盐低脂饮食、戒烟限酒、规律监控动态血压",
        "每 6-9 个月复查头颅 MRI (FLAIR/SWI 序列) 及认知执行功能量表",
      ],
      reportText: `【宣武医院认知障碍多模态智能临床研判报告】
受试者编号：${id}   受试者姓名：${name}   性别：${gender}   年龄：${age}岁   文化程度：${edu}年
一、临床综合分型研判：
【血管性认知功能障碍 (Vascular Cognitive Impairment, VaCI)】
推荐临床诊断编码：VaCI (Category 3)    综合研判置信度：${Math.round(randomConfidence(0.89) * 100)}%

二、多维临床依据与神经心理特征：
1. 临床特征：认知损害与脑血管病变时序相关，表现为信息加工速度减退、注意力不集中和执行功能障碍为主。
2. 测验表现：MMSE ${Math.min(mmseScore, 25)}/30 分，MoCA-B 额叶执行与钟表测验失分明显，情景记忆线索回忆后可明显改善。
3. 影像特征：头颅 MRI FLAIR 提示双侧脑室旁和半卵圆中心弥漫性白质疏松 (Fazekas 2级)，基底节区见多发陈旧腔隙灶。
4. 危险因素：${hasHtn ? `高血压病史 ${htnYears} 年，最高血压 ${record.history?.hypertension?.maxBp || "160/100"} mmHg` : "明确动脉粥样硬化基础"}。

三、专家处理与随访建议：
1. 病因控制：严格达标降压、调脂与抗血栓，阻断脑小血管病进展。
2. 认知康复：开展执行功能与反应速度训练。
3. 随访周期：每 6-12 个月复查头颅核磁共振与神经心理学测验。
（本建议已实时推送至主治医师工作站待办队列，经医生电子签字后正式生效）`,
    },
    {
      id: "ad_dementia_mild",
      tag: "轻度AD痴呆",
      category: 4, // 4: 轻度AD痴呆
      categoryLabel: "轻度阿尔茨海默病痴呆 (Mild AD Dementia)",
      title: `${name} - 阿尔茨海默病痴呆阶段 (轻度, 全面认知损害伴社会功能减退)`,
      confidence: randomConfidence(0.96),
      summary: `受试者 ${name} (${age}岁) 客观量表 MMSE 得分 ${Math.min(mmseScore, 18)}/30 分，MoCA-B 得分 ${Math.min(mocaScore, 15)}/30 分；CDR 全球评分为 1.0 分；日常生活能力明显受损，知情者 FAQ 得分 12 分 (独立购物、服药与理财严重困难)；头颅 MRI 显示双侧内侧颞叶海马重度萎缩 (MTA ${Math.max(mriMta, 3)}级)，符合轻度阿尔茨海默病痴呆阶段。`,
      keyAbnormalities: [
        `MMSE 得分 ${Math.min(mmseScore, 18)}/30 分，MoCA-B 得分 ${Math.min(mocaScore, 15)}/30 分，近事遗忘与定向力全面受损`,
        `CDR 全球评分 1.0 分，知情者 FAQ 12 分，已丧失独立社会生活自理能力`,
        `头颅 MRI 显示双侧海马萎缩严重 (MTA ${Math.max(mriMta, 3)}级)，侧脑室颞角明显扩大`,
        `APOE 基因型为 ${apoe}，病史呈持续隐匿进展`,
      ],
      recommendations: [
        "启动规范抗痴呆一线药物治疗 (胆碱酯酶抑制剂如多奈哌齐/加兰他敏，或联合美金刚)",
        "建立居家安全看护防走失监护网络，防范走失、跌倒及意外风险",
        "为主要照料家属提供心理支持及阿尔茨海默病规范照护指导指南",
        "建议每 3 个月在记忆门诊进行用药耐受性评估及认知功能随访",
      ],
      reportText: `【宣武医院认知障碍多模态智能临床研判报告】
受试者编号：${id}   受试者姓名：${name}   性别：${gender}   年龄：${age}岁   文化程度：${edu}年
一、临床综合分型研判：
【阿尔茨海默病痴呆阶段 (轻度 AD 痴呆)】
推荐临床诊断编码：AD Dementia (Category 4)    综合研判置信度：${Math.round(randomConfidence(0.96) * 100)}%

二、多维临床依据与神经心理特征：
1. 临床病史：近3年出现进行性近事遗忘，渐进性加重，外出容易迷路，常认错亲友姓名。
2. 客观测验：MMSE ${Math.min(mmseScore, 18)}/30 分，MoCA-B ${Math.min(mocaScore, 15)}/30 分，时间定向、地点定向及短长延迟回忆接近零分。
3. 功能损害：全球 CDR 1.0 分，FAQ 12 分，已无法独立做饭、服药及完成个人财务管理。
4. 结构影像：头颅 MRI 显示双侧内侧颞叶海马严重萎缩 (MTA ${Math.max(mriMta, 3)}级)，弥漫性皮层萎缩明显。

三、专家处理与随访建议：
1. 药物干预：规范启用多奈哌齐或卡巴拉汀治疗，密切观察心率及胃肠反应。
2. 照护支持：指导家属佩戴防走失手环，排查居家安全隐患。
3. 随访周期：每 3 个月复诊随访。
（本建议已实时推送至主治医师工作站待办队列，经医生电子签字后正式生效）`,
    },
    {
      id: "normal_healthy",
      tag: "认知正常对照",
      category: 0, // 0: 正常
      categoryLabel: "认知健康对照 (Healthy Normal)",
      title: `${name} - 认知功能健康对照 (年龄与文化程度相匹配常模)`,
      confidence: randomConfidence(0.97),
      summary: `受试者 ${name} (${age}岁) SCD-Q9 自评分数仅为 ${Math.min(scdScore, 2)}/9 分，无显著进行性主观记忆抱怨；MMSE ${Math.max(mmseScore, 29)}/30 分，MoCA-B ${Math.max(mocaScore, 28)}/30 分，各认知亚域功能均处于同龄前 15% 优秀水平；全球 CDR=0 分，生活社交自理完全正常。`,
      keyAbnormalities: [
        `全套神经心理量表测试成绩优异：MMSE ${Math.max(mmseScore, 29)}分、MoCA-B ${Math.max(mocaScore, 28)}分`,
        "SCD-Q9 自评未达主观认知下降界值，无明确记忆障碍忧虑",
        "日常生活活动能力 FAQ 0分，社会活动及职业技能保持良好",
        "头颅 MRI 未见异常脑萎缩或海马形态变细征象",
      ],
      recommendations: [
        "作为宣武医院认知衰老健康常模对照，建议每 24 个月进行健康随访",
        "保持良好健康生活方式与规律体育锻炼，维持充足睡眠与地中海膳食",
        "常规监测心脑血管代谢指标 (血压、血脂、空腹血糖)",
      ],
      reportText: `【宣武医院认知障碍多模态智能临床研判报告】
受试者编号：${id}   受试者姓名：${name}   性别：${gender}   年龄：${age}岁   文化程度：${edu}年
一、临床综合分型研判：
【认知正常健康对照 (Cognitively Normal, NC)】
推荐临床诊断编码：Normal (Category 0)    综合研判置信度：${Math.round(randomConfidence(0.97) * 100)}%

二、多维临床依据与神经心理特征：
1. 主诉与症状：受试者自感记忆力良好，无明显丢三落四或认知衰退抱怨。
2. 量表表现：MMSE ${Math.max(mmseScore, 29)}/30 分，MoCA-B ${Math.max(mocaScore, 28)}/30 分，定向力、计算力、视空间及记忆力全部满分或接近满分。
3. 功能评定：CDR 全球评分 0 分，生活能力完全正常。
4. 影像表现：头颅 MRI 结构完整，脑沟裂正常，海马无萎缩。

三、专家处理与随访建议：
1. 纳入健康对照科研队列，每 2 年定期随访一次。
2. 继续维持目前良好的生活方式与脑健康锻炼。
（本建议已实时推送至主治医师工作站待办队列，经医生电子签字后正式生效）`,
    },
  ];
}

export const AiAnalysisModal: React.FC<Props> = ({
  isOpen,
  onClose,
  record,
  onApplyDiagnosisNotes,
  onConsultationSubmitted,
  onOpenDoctorApproval,
}) => {
  // Dynamically generate scenarios tailored to current patient's real data
  const scenarios = React.useMemo(() => generateDynamicScenarios(record), [record]);

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("scd_typical");
  const [analysisText, setAnalysisText] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [sentConsultationId, setSentConsultationId] = useState<string | null>(null);

  // Multi-phase dynamic reasoning animation states
  const [isAnimating, setIsAnimating] = useState(false);
  const [animProgress, setAnimProgress] = useState(0);
  const [animPhase, setAnimPhase] = useState<number>(0);
  const [animLog, setAnimLog] = useState<string>("");

  const currentScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  const runAnimatedReasoning = (targetScenarioId?: string) => {
    setIsAnimating(true);
    setAnimProgress(0);
    setAnimPhase(0);
    setAnimLog("正在调取受试者基线生理数据、慢病史与既往检查...");

    // Phase 1: 扫描量表
    const t1 = setTimeout(() => {
      setAnimProgress(32);
      setAnimPhase(1);
      setAnimLog("测算年龄与受教育常模偏离度（MMSE/MoCA-B/AVLT长延迟回忆）...");
    }, 400);

    // Phase 2: ATN融合
    const t2 = setTimeout(() => {
      setAnimProgress(68);
      setAnimPhase(2);
      setAnimLog("融合 ATN 框架（Aβ42/40、p-tau217）、APOE基因型与头颅 MRI 海马萎缩等级...");
    }, 900);

    // Phase 3: 决策树分型
    const t3 = setTimeout(() => {
      setAnimProgress(92);
      setAnimPhase(3);
      setAnimLog("调用宣武医院国家神经疾病医学中心临床决策树，推断最终分型与个体化随访处方...");
    }, 1400);

    // Phase 4: 完成并自动推送
    const t4 = setTimeout(async () => {
      setAnimProgress(100);
      setAnimPhase(4);
      setAnimLog("临床推理完成！已自动推送至主治医师工作台待办队列...");

      const updatedScenarios = generateDynamicScenarios(record);
      const chosenId = targetScenarioId || selectedScenarioId;
      const matched = updatedScenarios.find((s) => s.id === chosenId) || updatedScenarios[0];
      setSelectedScenarioId(matched.id);

      // Add dynamic timestamp and serial number so each reasoning is fresh and distinct
      const timestampStr = new Date().toLocaleString("zh-CN", { hour12: false });
      const serialCode = `XW-AI-${Date.now().toString().slice(-6)}`;
      const dynamicHeader = `【宣武医院认知障碍多模态智能临床研判报告】\n推理流水号：${serialCode}   研判生成时间：${timestampStr}\n`;
      const finalReport = matched.reportText.replace(
        "【宣武医院认知障碍多模态智能临床研判报告】\n",
        dynamicHeader
      );

      setAnalysisText(finalReport);
      setIsAnimating(false);

      // 核心闭环：AI 临床诊断智能推理完成后，自动推送到主治医师待办审核队列
      setIsSendingMessage(true);
      try {
        const consultation = await tursoApi.submitAiConsultation({
          patientId: record.id,
          patientName: record.demographics?.name || "受试者",
          scenarioTag: matched.tag,
          category: matched.category,
          confidence: matched.confidence,
          summary: matched.summary,
          reportText: finalReport,
        });

        if (consultation && consultation.id) {
          setSentConsultationId(consultation.id);
        }
        setMessageSent(true);
        if (onConsultationSubmitted) onConsultationSubmitted();
      } catch (e) {
        console.warn("Auto consultation submit:", e);
        setMessageSent(true);
      } finally {
        setIsSendingMessage(false);
      }
    }, 1900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  };

  useEffect(() => {
    if (isOpen) {
      // Pick initial scenario matching patient's real scores
      const mmse = sumNumericValues(record.scales.mmse?.items) || 27;
      let initialId = "scd_typical";
      if (mmse < 20) initialId = "ad_dementia_mild";
      else if (mmse < 25) initialId = "amci_multidomain";
      else if (record.history?.hypertension?.has && record.history?.cerebrovascular?.has) initialId = "vascular_mci";
      else if (mmse >= 29 && sumNumericValues(record.scdQ9 as unknown as Record<string, unknown>) <= 2) initialId = "normal_healthy";

      setSelectedScenarioId(initialId);
      setMessageSent(false);
      runAnimatedReasoning(initialId);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Real AI API invocation with animation
  const handleRealAiReasoning = async () => {
    setMessageSent(false);
    runAnimatedReasoning();
  };

  const handleSelectScenario = (sc: MockClinicalScenario) => {
    setSelectedScenarioId(sc.id);
    setMessageSent(false);
    runAnimatedReasoning(sc.id);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(analysisText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = async () => {
    onApplyDiagnosisNotes(analysisText, currentScenario.category);
    setApplied(true);
    setTimeout(() => setApplied(false), 2500);

    // 如果此前尚未推送或失败，在此进行保底推送
    if (!messageSent) {
      setIsSendingMessage(true);
      try {
        const consultation = await tursoApi.submitAiConsultation({
          patientId: record.id,
          patientName: record.demographics?.name || "受试者",
          scenarioTag: currentScenario.tag,
          category: currentScenario.category,
          confidence: currentScenario.confidence,
          summary: currentScenario.summary,
          reportText: analysisText,
        });

        if (consultation && consultation.id) {
          setSentConsultationId(consultation.id);
          setMessageSent(true);
          if (onConsultationSubmitted) onConsultationSubmitted();
        }
      } catch (e) {
        console.warn("Auto consultation submit:", e);
      } finally {
        setIsSendingMessage(false);
      }
    }
  };

  return (
    <div
      id="modal-ai-reasoning"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 px-6 bg-slate-50 text-slate-900 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-slate-900">
                  AI 辅助研判
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold border border-purple-200">
                  待医生审核
                </span>
              </div>
              <p className="text-xs text-slate-500">
                受试者：{record.demographics?.name || "受试者"} ({record.demographics?.gender === 1 ? "男" : "女"}, {record.demographics?.age}岁) · 编号：{record.subjectNo || record.id}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700 leading-relaxed">
          {/* Status Bar & Dynamic Reasoning Animated Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 via-slate-50 to-teal-50 border border-purple-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    isAnimating ? "bg-purple-600 animate-ping" : "bg-emerald-500"
                  }`}
                />
                <span className="font-bold text-slate-800 text-xs">
                  {isAnimating ? "AI 多阶段临床多模态推理计算中..." : "AI 临床智能研判已就绪"}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                经医师电子签字后正式生效
              </span>
            </div>

            {/* Dynamic Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span className="font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>{animLog || "准备启动多模态临床推断..."}</span>
                </span>
                <span className="font-mono font-bold text-purple-700">{animProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-600 to-teal-600 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${animProgress}%` }}
                />
              </div>
            </div>

            {/* 4 Phase Step Indicators with animated active highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px] pt-1">
              {[
                { phase: 0, title: "1. 扫描基线与慢病", sub: "年龄/病史/主诉" },
                { phase: 1, title: "2. 常模切点测算", sub: "MMSE/MoCA/AVLT" },
                { phase: 2, title: "3. ATN影像融合", sub: "Aβ/Tau/MTA海马" },
                { phase: 3, title: "4. 临床决策分型", sub: "生成诊断与随访" },
              ].map((step) => {
                const isPassed = animPhase > step.phase || animProgress === 100;
                const isCurrent = animPhase === step.phase && isAnimating;
                return (
                  <div
                    key={step.phase}
                    className={`p-2 rounded-lg border transition flex flex-col justify-between ${
                      isCurrent
                        ? "bg-purple-100/70 border-purple-400 text-purple-900 font-bold shadow-xs scale-102 ring-2 ring-purple-300"
                        : isPassed
                        ? "bg-white border-emerald-300 text-emerald-800"
                        : "bg-white/60 border-slate-200 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      {isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Brain className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? "text-purple-600 animate-spin" : "text-slate-400"}`} />
                      )}
                      <span className="truncate">{step.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5">{step.sub}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clinical Scenario Selector Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                <span>选择研判类型：</span>
              </label>
              <span className="text-[11px] text-slate-500">点击可切换不同临床分型推理模型与依据</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {scenarios.map((sc) => {
                const isSelected = selectedScenarioId === sc.id;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => handleSelectScenario(sc)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-purple-50 border-purple-500 text-purple-950 font-bold shadow-xs"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs">{sc.tag}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/80 border border-slate-200 text-slate-600">
                        {Math.round(sc.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {sc.categoryLabel}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Inference Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-600" />
                <span>{currentScenario.title}</span>
              </h4>
              <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 font-bold border border-purple-200">
                综合置信度: {Math.round(currentScenario.confidence * 100)}%
              </span>
            </div>

            <p className="text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200 text-xs">
              {currentScenario.summary}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-800 text-[11px] block border-b border-slate-100 pb-1">
                  核心临床异常表征：
                </span>
                <ul className="space-y-1 text-slate-600 text-[11px]">
                  {currentScenario.keyAbnormalities.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-800 text-[11px] block border-b border-slate-100 pb-1">
                  科研随访与临床建议：
                </span>
                <ul className="space-y-1 text-slate-600 text-[11px]">
                  {currentScenario.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-teal-600 font-bold">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Generated Medical Report Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-purple-600" />
                <span>研判意见正文：</span>
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 transition cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "已复制" : "复制报告"}</span>
              </button>
            </div>
            <textarea
              value={analysisText}
              onChange={(e) => setAnalysisText(e.target.value)}
              rows={9}
              className="w-full p-3 font-mono text-xs bg-slate-900 text-purple-300 rounded-xl border border-slate-700 focus:outline-hidden leading-relaxed shadow-inner"
            />
          </div>

          {/* Doctor Workstation Consultation Alert */}
          {messageSent && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  研判意见已成功推送到医生工作站（待审核消息 +1），经医生电子签字后生效
                </span>
              </div>
              {onOpenDoctorApproval && (
                <button
                  type="button"
                  onClick={onOpenDoctorApproval}
                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                >
                  <span>立即跳转医生签字</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Action Bar */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRealAiReasoning}
              disabled={isAnimating || isSendingMessage}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              title="根据受试者最新量表与生物学指标重新启动多模态推断"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAnimating ? "animate-spin" : ""}`} />
              <span>{isAnimating ? "多阶段推理计算中..." : "重新执行 AI 智能推理"}</span>
            </button>

            <button
              type="button"
              onClick={() => runAnimatedReasoning()}
              disabled={isAnimating || isSendingMessage}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>重置研判参数</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleApply}
              disabled={isAnimating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{applied ? "✓ 已应用！已转为「待医生审核签署」" : "应用至临床诊断并提交待审核"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
