// Scale configurations, scoring logic, and decision trees
// Ported and unified from ad-ouc-prototype / scales.js & clinical requirements

export const AVLT_TARGET = [
  "卡车", "香蕉", "铅笔", "轮船", "苹果", "钢笔",
  "飞机", "西瓜", "毛笔", "火车", "草莓", "圆珠笔"
];

export const AVLT_DISTRACTOR = [
  "自行车", "葡萄", "尺子", "摩托车", "橘子", "橡皮",
  "轿车", "梨子", "剪刀", "帆船", "桃子", "订书机"
];

export interface ScaleItemOption {
  label: string;
  score: number;
}

export interface ScaleItem {
  id: string;
  q: string;
  kind: "choice" | "number" | "timer" | "delay" | "recog" | "text";
  options?: ScaleItemOption[];
  min?: number;
  max?: number;
  hint?: string;
  anchors?: Record<number, string>;
  reveal?: { title: string; words: string[] };
  seconds?: number;
  demoSeconds?: number;
  primary?: boolean;
  count?: boolean;
  targets?: string[];
  distractors?: string[];
}

export interface ScaleThreshold {
  min: number;
  max: number;
  level: "green" | "yellow" | "red";
  label: string;
}

export interface ScaleDimension {
  key: string;
  name: string;
  items: string[];
  max: number;
}

export interface ScaleDefinition {
  name: string;
  short: string;
  role: "rater" | "self" | "informant";
  intro: string;
  items: ScaleItem[];
  scoring: {
    type: "sum" | "primary" | "custom";
    primaryItem?: string;
    note?: string;
    thresholds: ScaleThreshold[];
  };
  dimensions?: ScaleDimension[];
}

export const INTAKE_QUESTIONS: ScaleItem[] = [
  { id: "name", q: "请问受试者的姓名是？", kind: "text", hint: "如：张建华" },
  {
    id: "gender",
    q: "受试者生理性别是？",
    kind: "choice",
    options: [
      { label: "男", score: 1 },
      { label: "女", score: 2 },
    ],
  },
  { id: "birth", q: "出生年份是哪一年？（如 1955）", kind: "number", min: 1920, max: 2010, hint: "1920~2010" },
  { id: "edu", q: "受教育年限约为几年？（如小学6，初中9，高中12，大学16）", kind: "number", min: 0, max: 25, hint: "0~25 年" },
  { id: "height", q: "受试者身高约为多少厘米？", kind: "number", min: 120, max: 210, hint: "120~210 cm" },
  { id: "weight", q: "受试者体重约为多少公斤？", kind: "number", min: 30, max: 150, hint: "30~150 kg" },
  {
    id: "marry",
    q: "目前的婚姻状况是？",
    kind: "choice",
    options: [
      { label: "已婚", score: 1 },
      { label: "未婚", score: 2 },
      { label: "离异", score: 3 },
      { label: "丧偶", score: 4 },
    ],
  },
  {
    id: "live",
    q: "平时居住情况是？",
    kind: "choice",
    options: [
      { label: "与家人同住", score: 2 },
      { label: "独居", score: 1 },
      { label: "养老机构", score: 3 },
    ],
  },
  { id: "phone", q: "联系电话（便于随访与科研归档）：", kind: "text", hint: "手机号码" },
];

export const SCALES_CONFIG: Record<string, ScaleDefinition> = {
  "SCD-Q9": {
    name: "主观认知下降自评量表（SCD-Q9）",
    short: "SCD-Q9",
    role: "self",
    intro: "您好！想了解下您最近一段时间在记忆、思考方面的真实感受。请按实际情况点选，没有好坏之分。",
    items: [
      {
        id: "q1",
        q: "您觉得自己的记忆力在减退吗？",
        kind: "choice",
        options: [{ label: "是", score: 1 }, { label: "否", score: 0 }],
      },
      {
        id: "q2",
        q: "这种减退是否让您感到担心或焦虑？",
        kind: "choice",
        options: [{ label: "是", score: 1 }, { label: "否", score: 0 }],
      },
      {
        id: "q3",
        q: "和同龄人相比，您觉得自己的记忆力更差吗？",
        kind: "choice",
        options: [{ label: "是", score: 1 }, { label: "否", score: 0 }],
      },
      {
        id: "q4",
        q: "这种记忆下降是否已经持续了 5 年以内（起病较近）？",
        kind: "choice",
        options: [{ label: "是", score: 1 }, { label: "否", score: 0 }],
      },
      {
        id: "q5",
        q: "身边的家人或朋友，是否也注意到您的记忆变差了？",
        kind: "choice",
        options: [{ label: "是", score: 1 }, { label: "否", score: 0 }],
      },
      {
        id: "q6",
        q: "做以前熟悉的事情（如做饭、用家电、算账），是否感到更吃力了？",
        kind: "choice",
        options: [{ label: "是", score: 1 }, { label: "否", score: 0 }],
      },
      {
        id: "q7",
        q: "是否有在熟悉的地方短暂迷路或辨不清方向的情况？",
        kind: "choice",
        options: [{ label: "是", score: 1 }, { label: "否", score: 0 }],
      },
      {
        id: "q8",
        q: "说话时是否经常找不到恰当的词（如“那个东西”）？",
        kind: "choice",
        options: [{ label: "是", score: 1 }, { label: "否", score: 0 }],
      },
      {
        id: "q9",
        q: "记新认识的人的名字或近期发生的新鲜事，是否明显感到困难？",
        kind: "choice",
        options: [{ label: "是", score: 1 }, { label: "否", score: 0 }],
      },
      // 场景拓展题
      {
        id: "s1",
        q: "到菜市场买菜或超市购物时，会忘记本来要买什么吗？",
        kind: "choice",
        options: [{ label: "经常发生", score: 1 }, { label: "偶尔或没有", score: 0 }],
      },
      {
        id: "s2",
        q: "家里常放钥匙、老花镜或钱包的地方，会翻找很久吗？",
        kind: "choice",
        options: [{ label: "经常翻找", score: 1 }, { label: "很少", score: 0 }],
      },
      {
        id: "s3",
        q: "看电视或读报纸时，容易走神或跟不上前后剧情吗？",
        kind: "choice",
        options: [{ label: "有这种情况", score: 1 }, { label: "基本正常", score: 0 }],
      },
      {
        id: "s4",
        q: "烧水、热菜或出门时，会忘记关燃气或锁门吗？",
        kind: "choice",
        options: [{ label: "有过险情", score: 1 }, { label: "没有", score: 0 }],
      },
      {
        id: "s5",
        q: "熟人的名字就在嘴边，但一时怎么也叫不上来？",
        kind: "choice",
        options: [{ label: "经常发生", score: 1 }, { label: "偶尔或没有", score: 0 }],
      },
      {
        id: "s6",
        q: "需要同时处理两三件事时，会感到明显慌乱或头脑发懵吗？",
        kind: "choice",
        options: [{ label: "会慌乱", score: 1 }, { label: "还好", score: 0 }],
      },
    ],
    scoring: {
      type: "sum",
      note: "基础 9 项（满分 9）+ 场景 6 项（满分 6），总满分 15 分",
      thresholds: [
        { min: 0, max: 4, level: "green", label: "主观认知下降轻微/无（SCD < 5）" },
        { min: 5, max: 9, level: "yellow", label: "存在典型主观认知下降（SCD 5~9），建议定期随访" },
        { min: 10, max: 99, level: "red", label: "主观认知下降明显（SCD ≥10），高度建议临床神经心理测评" },
      ],
    },
  },

  "HAMD": {
    name: "汉密尔顿抑郁量表（HAMD-17 标准 17 项）",
    short: "HAMD",
    role: "rater",
    intro: "以下请【主试（医生）】根据受试者交谈及知情者观察，逐项评分（部分项 0~4 分，部分项 0~2 分）。",
    items: [
      { id: "h1", q: "抑郁情绪（0 无 → 4 极重）", kind: "number", min: 0, max: 4, hint: "0~4", anchors: { 0: "无", 1: "只在问起时诉述", 2: "自发诉述", 3: "非言语表情显露", 4: "极度痛苦" } },
      { id: "h2", q: "有罪感（0 无 → 4 极重）", kind: "number", min: 0, max: 4, hint: "0~4", anchors: { 0: "无", 1: "自责", 2: "内疚感", 3: "认为患病是惩罚", 4: "罪恶妄想" } },
      { id: "h3", q: "自杀倾向（0 无 → 4 极重）", kind: "number", min: 0, max: 4, hint: "0~4", anchors: { 0: "无", 1: "觉得生活乏味", 2: "希望死去", 3: "有自杀意念", 4: "有自杀行动" } },
      { id: "h4", q: "入睡困难（0 无 → 2 重）", kind: "number", min: 0, max: 2, hint: "0~2", anchors: { 0: "无", 1: "偶尔", 2: "经常（>半小时未睡）" } },
      { id: "h5", q: "睡眠不深（0 无 → 2 重）", kind: "number", min: 0, max: 2, hint: "0~2", anchors: { 0: "无", 1: "易醒", 2: "彻夜不眠" } },
      { id: "h6", q: "早醒（0 无 → 2 重）", kind: "number", min: 0, max: 2, hint: "0~2", anchors: { 0: "无", 1: "早醒约1小时", 2: "早醒>2小时无法再睡" } },
      { id: "h7", q: "工作与兴趣（0 无 → 4 极重）", kind: "number", min: 0, max: 4, hint: "0~4", anchors: { 0: "无", 1: "感到乏力", 2: "兴趣减退", 3: "工作效率明显下降", 4: "不能工作" } },
      { id: "h8", q: "迟缓（思维与语言变慢，0 无 → 4 极重）", kind: "number", min: 0, max: 4, hint: "0~4", anchors: { 0: "无", 1: "轻度迟缓", 2: "明显迟缓", 3: "检查困难", 4: "木僵" } },
      { id: "h9", q: "激越（坐立不安，0 无 → 4 极重）", kind: "number", min: 0, max: 4, hint: "0~4", anchors: { 0: "无", 1: "心神不定", 2: "手足动作多", 3: "不能安坐", 4: "搓手咬唇" } },
      { id: "h10", q: "精神性焦虑（0 无 → 4 极重）", kind: "number", min: 0, max: 4, hint: "0~4", anchors: { 0: "无", 1: "紧张怀疑", 2: "忧虑", 3: "极度恐慌", 4: "惊恐发作" } },
      { id: "h11", q: "躯体性焦虑（心悸胃痛等，0 无 → 4 极重）", kind: "number", min: 0, max: 4, hint: "0~4", anchors: { 0: "无", 1: "轻度", 2: "中度", 3: "严重", 4: "丧失功能" } },
      { id: "h12", q: "胃肠道症状（食欲减退，0 无 → 2 重）", kind: "number", min: 0, max: 2, hint: "0~2", anchors: { 0: "正常", 1: "需催促进食", 2: "严重减退/拒食" } },
      { id: "h13", q: "全身躯体症状（疲乏无力，0 无 → 2 重）", kind: "number", min: 0, max: 2, hint: "0~2", anchors: { 0: "无", 1: "四肢沉重背痛", 2: "严重无力" } },
      { id: "h14", q: "生殖性症状（性欲减退，0 无 → 2 重）", kind: "number", min: 0, max: 2, hint: "0~2", anchors: { 0: "无", 1: "轻度", 2: "明显减退" } },
      { id: "h15", q: "疑病（0 无 → 4 极重）", kind: "number", min: 0, max: 4, hint: "0~4", anchors: { 0: "无", 1: "过分关注躯体", 2: "担心患严重疾病", 3: "深信患病", 4: "疑病妄想" } },
      { id: "h16", q: "体重减轻（0 无 → 2 重）", kind: "number", min: 0, max: 2, hint: "0~2", anchors: { 0: "无", 1: "减轻>0.5kg/周", 2: "减轻>1kg/周" } },
      { id: "h17", q: "自知力（0 充分 → 2 缺失）", kind: "number", min: 0, max: 2, hint: "0~2", anchors: { 0: "知道患病", 1: "部分承认", 2: "否认患病" } },
    ],
    scoring: {
      type: "sum",
      note: "HAMD-17 满分 52 分；阈值标准分段",
      thresholds: [
        { min: 0, max: 7, level: "green", label: "无抑郁（HAMD < 8）" },
        { min: 8, max: 19, level: "yellow", label: "可能有轻度抑郁（HAMD 8~19）" },
        { min: 20, max: 99, level: "red", label: "肯定有抑郁（中重度，HAMD ≥20），建议精神科评估" },
      ],
    },
  },

  "HAMA": {
    name: "汉密尔顿焦虑量表（HAMA-14 标准 14 项）",
    short: "HAMA",
    role: "rater",
    intro: "以下请【主试（医生）】根据结构化提问与观察，对 14 个因子逐项评 0~4 分。",
    items: [
      { id: "a1", q: "焦虑心境（0 无 → 4 极重）", kind: "number", min: 0, max: 4, hint: "0~4", anchors: { 0: "无", 1: "偶发", 2: "持续", 3: "明显", 4: "极重" } },
      { id: "a2", q: "紧张（0 无 → 4 极重）", kind: "number", min: 0, max: 4, hint: "0~4", anchors: { 0: "无", 1: "轻度", 2: "中度", 3: "明显", 4: "极重" } },
      { id: "a3", q: "害怕（0 无 → 4 极重）", kind: "number", min: 0, max: 4, hint: "0~4", anchors: { 0: "无", 1: "轻度", 2: "中度", 3: "明显", 4: "极重" } },
      { id: "a4", q: "失眠（0 无 → 4 极重）", kind: "number", min: 0, max: 4, hint: "0~4", anchors: { 0: "无", 1: "轻度", 2: "中度", 3: "明显", 4: "极重（夜不能寐）" } },
      { id: "a5", q: "认知功能（0 无 → 4 极重）", kind: "number", min: 0, max: 4, hint: "0~4", anchors: { 0: "无", 1: "轻度（注意难集中）", 2: "中度", 3: "明显", 4: "极重（无法思考）" } },
      { id: "a6", q: "抑郁心境（0 无 → 4 极重）", kind: "number", min: 0, max: 4, hint: "0~4", anchors: { 0: "无", 1: "轻度", 2: "中度", 3: "明显", 4: "极重" } },
      { id: "a7", q: "肌肉系统（0 无 → 4 极重）", kind: "number", min: 0, max: 4, hint: "0~4", anchors: { 0: "无", 1: "轻度（酸痛/僵硬）", 2: "中度", 3: "明显", 4: "极重" } },
      { id: "a8", q: "感觉系统（0 无 → 4 极重）", kind: "number", min: 0, max: 4, hint: "0~4", anchors: { 0: "无", 1: "轻度（耳鸣/视朦）", 2: "中度", 3: "明显", 4: "极重" } },
      { id: "a9", q: "心血管系统（0 无 → 4 极重）", kind: "number", min: 0, max: 4, hint: "0~4", anchors: { 0: "无", 1: "轻度（心悸）", 2: "中度", 3: "明显", 4: "极重（胸痛）" } },
      { id: "a10", q: "呼吸系统（0 无 → 4 极重）", kind: "number", min: 0, max: 4, hint: "0~4", anchors: { 0: "无", 1: "轻度（胸闷）", 2: "中度", 3: "明显", 4: "极重（喘息）" } },
      { id: "a11", q: "胃肠道症状（0 无 → 4 极重）", kind: "number", min: 0, max: 4, hint: "0~4", anchors: { 0: "无", 1: "轻度", 2: "中度", 3: "明显", 4: "极重" } },
      { id: "a12", q: "生殖泌尿系统（0 无 → 4 极重）", kind: "number", min: 0, max: 4, hint: "0~4", anchors: { 0: "无", 1: "轻度", 2: "中度", 3: "明显", 4: "极重" } },
      { id: "a13", q: "植物神经症状（0 无 → 4 极重）", kind: "number", min: 0, max: 4, hint: "0~4", anchors: { 0: "无", 1: "轻度（潮红/出汗）", 2: "中度", 3: "明显", 4: "极重" } },
      { id: "a14", q: "会谈时行为（0 无 → 4 极重）", kind: "number", min: 0, max: 4, hint: "0~4", anchors: { 0: "无", 1: "轻度（不安）", 2: "中度", 3: "明显（发抖/紧张）", 4: "极重" } },
    ],
    scoring: {
      type: "sum",
      note: "HAMA-14 满分 56；阈值按 14 项标准分段",
      thresholds: [
        { min: 0, max: 6, level: "green", label: "无焦虑（HAMA < 7）" },
        { min: 7, max: 13, level: "yellow", label: "可能有焦虑（HAMA 7~13，轻度）" },
        { min: 14, max: 99, level: "red", label: "肯定有焦虑（HAMA ≥14，中重度），建议进一步评估" },
      ],
    },
  },

  "MMSE": {
    name: "简明精神状态检查（MMSE·标准 30 分）",
    short: "MMSE",
    role: "rater",
    intro: "放松就好，没有对错。这是标准 MMSE 30 分版，包含定向、记忆、注意、语言与视空间多个维度。",
    items: [
      { id: "m1", q: "现在是哪一年？（答对 1 分）", kind: "choice", options: [{ label: "答对", score: 1 }, { label: "答错", score: 0 }] },
      { id: "m2", q: "现在是什么季节？（答对 1 分）", kind: "choice", options: [{ label: "答对", score: 1 }, { label: "答错", score: 0 }] },
      { id: "m3", q: "今天是几号/日期？（答对 1 分）", kind: "choice", options: [{ label: "答对", score: 1 }, { label: "答错", score: 0 }] },
      { id: "m4", q: "今天是星期几？（答对 1 分）", kind: "choice", options: [{ label: "答对", score: 1 }, { label: "答错", score: 0 }] },
      { id: "m5", q: "现在是几月？（答对 1 分）", kind: "choice", options: [{ label: "答对", score: 1 }, { label: "答错", score: 0 }] },
      { id: "m6", q: "我们现在在哪个国家？（答对 1 分）", kind: "choice", options: [{ label: "答对", score: 1 }, { label: "答错", score: 0 }] },
      { id: "m7", q: "在哪个省/市？（答对 1 分）", kind: "choice", options: [{ label: "答对", score: 1 }, { label: "答错", score: 0 }] },
      { id: "m8", q: "在哪个城市？（答对 1 分）", kind: "choice", options: [{ label: "答对", score: 1 }, { label: "答错", score: 0 }] },
      { id: "m9", q: "这里是什么机构/医院？（答对 1 分）", kind: "choice", options: [{ label: "答对", score: 1 }, { label: "答错", score: 0 }] },
      { id: "m10", q: "是第几层/哪个科室？（答对 1 分）", kind: "choice", options: [{ label: "答对", score: 1 }, { label: "答错", score: 0 }] },
      { id: "m11", q: "请重复这三个词：皮球、国旗、树木。请复述『皮球』（对 1 分）", kind: "choice", options: [{ label: "能复述", score: 1 }, { label: "不能", score: 0 }] },
      { id: "m12", q: "请复述『国旗』（对 1 分）", kind: "choice", options: [{ label: "能复述", score: 1 }, { label: "不能", score: 0 }] },
      { id: "m13", q: "请复述『树木』（对 1 分）", kind: "choice", options: [{ label: "能复述", score: 1 }, { label: "不能", score: 0 }] },
      { id: "m14", q: "从 100 连续减 7，算对几次？（0~5 次，每次 1 分）", kind: "number", min: 0, max: 5, hint: "正确次数 0~5" },
      { id: "m15", q: "刚才让您记住的三个词，现在还记得几个？（0~3）", kind: "number", min: 0, max: 3, hint: "回忆词数 0~3" },
      { id: "m16", q: "这是什么东西？（出示钢笔，答对 1 分）", kind: "choice", options: [{ label: "答对", score: 1 }, { label: "答错", score: 0 }] },
      { id: "m17", q: "这是什么？（出示手表，答对 1 分）", kind: "choice", options: [{ label: "答对", score: 1 }, { label: "答错", score: 0 }] },
      { id: "m18", q: "请重复『四十四只石狮子』（对 1 分）", kind: "choice", options: [{ label: "能", score: 1 }, { label: "不能", score: 0 }] },
      { id: "m19", q: "请拿起这张纸（完成 1 分）", kind: "choice", options: [{ label: "完成", score: 1 }, { label: "未完成", score: 0 }] },
      { id: "m20", q: "请把纸对折（完成 1 分）", kind: "choice", options: [{ label: "完成", score: 1 }, { label: "未完成", score: 0 }] },
      { id: "m21", q: "请把纸放在腿上（完成 1 分）", kind: "choice", options: [{ label: "完成", score: 1 }, { label: "未完成", score: 0 }] },
      { id: "m22", q: "请读这句话并按要求做：『闭上你的眼睛』（执行 1 分）", kind: "choice", options: [{ label: "执行", score: 1 }, { label: "未执行", score: 0 }] },
      { id: "m23", q: "请写一句完整的句子（有主谓 1 分）", kind: "choice", options: [{ label: "完成", score: 1 }, { label: "未完成", score: 0 }] },
      { id: "m24", q: "请临摹两个相交的五角星（对 1 分）", kind: "choice", options: [{ label: "能", score: 1 }, { label: "不能", score: 0 }] },
    ],
    scoring: {
      type: "sum",
      note: "标准 MMSE 满分 30 分",
      thresholds: [
        { min: 27, max: 99, level: "green", label: "基本正常（MMSE ≥ 27）" },
        { min: 21, max: 26, level: "yellow", label: "临界：轻度认知受损（MMSE 21~26）" },
        { min: 0, max: 20, level: "red", label: "认知明显受损（MMSE ≤ 20）" },
      ],
    },
  },

  "MoCA-B": {
    name: "蒙特利尔认知评估基础量表（MoCA-B·标准）",
    short: "MoCA-B",
    role: "rater",
    intro: "再做几个涵盖视空间、记忆、注意、语言、抽象与定向的小练习。满分约 30 分（受教育≤12年+1分）。",
    items: [
      { id: "c1", q: "立方体临摹：照着画一个三维立方体（对 1 分）", kind: "number", min: 0, max: 1, hint: "0~1" },
      { id: "c2", q: "画钟测验：画出 11 点 10 分（轮廓1+数字1+指针1，共 0~3）", kind: "number", min: 0, max: 3, hint: "0~3" },
      { id: "c5", q: "连线测验：按 1→A→2→B→3→C→4→D→5→E 顺序连（对 1 分）", kind: "number", min: 0, max: 1, hint: "0~1" },
      { id: "c3", q: "命名：依次指出狮子、犀牛、骆驼，答对几个？（0~3）", kind: "number", min: 0, max: 3, hint: "0~3" },
      { id: "c4", q: "数字广度倒背：如主试念 2-4-9，您倒着说 9-4-2，正确几位？（0~2）", kind: "number", min: 0, max: 2, hint: "0~2" },
      { id: "c6a", q: "警觉性：听一段话里每次出现『啊』就拍手，正确几次？（0~1）", kind: "number", min: 0, max: 1, hint: "0~1" },
      { id: "c6b", q: "连续减 7：从 100 起连减，算对几次？（0~3）", kind: "number", min: 0, max: 3, hint: "0~3" },
      { id: "c7", q: "句子复述：复述『他刚到火车站』和『我每天早上去公园散步』，正确几句？（0~2）", kind: "number", min: 0, max: 2, hint: "0~2" },
      { id: "c8", q: "词语流畅：1 分钟内说出以『动物』开头的词，≥11 个得 1 分（0/1）", kind: "number", min: 0, max: 1, hint: "0~1" },
      { id: "c9", q: "抽象：说出『香蕉—橘子』『火车—自行车』的相似之处，正确几对？（0~2）", kind: "number", min: 0, max: 2, hint: "0~2" },
      { id: "c10", q: "延迟回忆：刚才记过的 5 个词现在能想起几个？（0~5）", kind: "number", min: 0, max: 5, hint: "0~5" },
      { id: "c11", q: "定向：能答对年/季/月/日/星期/地点 共几项？（0~6）", kind: "number", min: 0, max: 6, hint: "0~6" },
    ],
    scoring: {
      type: "sum",
      note: "MoCA-B 满分约 29（子测验和）；标准 cutoff 26",
      thresholds: [
        { min: 0, max: 17, level: "red", label: "认知受损提示（MoCA ≤17）" },
        { min: 18, max: 23, level: "yellow", label: "临界：需结合教育年限判断（18~23）" },
        { min: 24, max: 99, level: "green", label: "基本正常（MoCA ≥24）" },
      ],
    },
  },

  "AVLT": {
    name: "听觉词汇学习测验（AVLT-H 华山记忆测验）",
    short: "AVLT-H",
    role: "rater",
    intro: "我会朗读词表，受试者尽量记住。词表仅主试可见，受试者不可见。共 3 次学习 + 干扰 + 延迟回忆 + 再认。",
    items: [
      { id: "t1", q: "第 1 次学习：请主试朗读词表后让受试者回忆，记录正确回忆词数（0~12）", kind: "number", min: 0, max: 12, hint: "即时回忆词数", reveal: { title: "目标词表（主试专用·受试者不可见）", words: AVLT_TARGET } },
      { id: "t2", q: "第 2 次学习：再朗读一遍，记录回忆词数（0~12）", kind: "number", min: 0, max: 12, hint: "即时回忆词数", reveal: { title: "目标词表（主试专用·受试者不可见）", words: AVLT_TARGET } },
      { id: "t3", q: "第 3 次学习：再次朗读，记录回忆词数（0~12）", kind: "number", min: 0, max: 12, hint: "即时回忆词数", reveal: { title: "目标词表（主试专用·受试者不可见）", words: AVLT_TARGET } },
      { id: "t4", q: "干扰列表立即回忆：朗读干扰词表，记录受试者回忆词数（0~12）", kind: "number", min: 0, max: 12, hint: "干扰回忆词数", reveal: { title: "干扰词表（主试专用·受试者不可见）", words: AVLT_DISTRACTOR } },
      { id: "delay", q: "延迟回忆前等待：请受试者在此期间完成非言语任务（如画钟、连线）。计时结束后进入延迟回忆。", kind: "delay", seconds: 1200, demoSeconds: 15, hint: "临床约 20 分钟" },
      { id: "n4", q: "延迟回忆（约 20 分钟后）：受试者能想起几个目标词？（0~12）", kind: "number", min: 0, max: 12, primary: true, hint: "延迟回忆词数" },
      { id: "n5", q: "再认：请指出下列词中哪些出现在最初学习的词表里（点选，可多选）", kind: "recog", targets: AVLT_TARGET, distractors: AVLT_DISTRACTOR },
    ],
    scoring: {
      type: "primary",
      primaryItem: "n4",
      thresholds: [
        { min: 0, max: 3, level: "red", label: "延迟回忆明显受损（<4 个）" },
        { min: 4, max: 6, level: "yellow", label: "延迟回忆偏低，需关注（4~6 个）" },
        { min: 7, max: 99, level: "green", label: "延迟回忆正常（≥7 个）" },
      ],
    },
  },

  "VFT": {
    name: "词语流畅性测试（VFT）",
    short: "VFT",
    role: "rater",
    intro: "接下来 60 秒内，请尽可能多地说出『动物』的名字。计时结束后先录总词数，再录 15 秒分段词数。",
    items: [
      { id: "v1", q: "60 秒倒计时开始，请说出动物名称（结束后录入正确词数）", kind: "timer", seconds: 60, primary: true, hint: "倒计时结束后录入正确词数" },
      { id: "v2", q: "分段 1：第 0~15 秒说出几个动物？（仅记录，不计入总分）", kind: "number", min: 0, max: 20, count: false, hint: "0~20" },
      { id: "v3", q: "分段 2：第 16~30 秒说出几个动物？（仅记录）", kind: "number", min: 0, max: 20, count: false, hint: "0~20" },
      { id: "v4", q: "分段 3：第 31~45 秒说出几个动物？（仅记录）", kind: "number", min: 0, max: 20, count: false, hint: "0~20" },
      { id: "v5", q: "分段 4：第 46~60 秒说出几个动物？（仅记录）", kind: "number", min: 0, max: 20, count: false, hint: "0~20" },
    ],
    scoring: {
      type: "primary",
      primaryItem: "v1",
      thresholds: [
        { min: 0, max: 8, level: "red", label: "词语流畅性明显偏低（<9）" },
        { min: 9, max: 13, level: "yellow", label: "词语流畅性偏低，需关注（9~13）" },
        { min: 14, max: 99, level: "green", label: "词语流畅性正常（≥14）" },
      ],
    },
  },

  "FAQ": {
    name: "功能活动问卷（FAQ·Pfeffer 10 项）",
    short: "FAQ",
    role: "informant",
    intro: "家属您好，想了解下他/她平时处理日常事务的能力（0 完全能 → 3 完全不能）。共 10 项。",
    items: [
      { id: "f1", q: "能否使用电话（含查号、拨号）？（0 能 → 3 不能）", kind: "number", min: 0, max: 3, hint: "0~3" },
      { id: "f2", q: "能否去熟悉的地方购买日常用品？（0 能 → 3 不能）", kind: "number", min: 0, max: 3, hint: "0~3" },
      { id: "f3", q: "能否准备饭菜？（0 能 → 3 不能）", kind: "number", min: 0, max: 3, hint: "0~3" },
      { id: "f4", q: "能否料理家务（打扫、整理）？（0 能 → 3 不能）", kind: "number", min: 0, max: 3, hint: "0~3" },
      { id: "f5", q: "能否洗衣服？（0 能 → 3 不能）", kind: "number", min: 0, max: 3, hint: "0~3" },
      { id: "f6", q: "能否使用交通工具（独自搭车/开车）？（0 能 → 3 不能）", kind: "number", min: 0, max: 3, hint: "0~3" },
      { id: "f7", q: "能否对财务负责（管钱、付账）？（0 能 → 3 不能）", kind: "number", min: 0, max: 3, hint: "0~3" },
      { id: "f8", q: "能否按医嘱服药？（0 能 → 3 不能）", kind: "number", min: 0, max: 3, hint: "0~3" },
      { id: "f9", q: "能否处理突发事件（如家里生病、修水管）？（0 能 → 3 不能）", kind: "number", min: 0, max: 3, hint: "0~3" },
      { id: "f10", q: "能否记住约会、事件或服药时间？（0 能 → 3 不能）", kind: "number", min: 0, max: 3, hint: "0~3" },
    ],
    scoring: {
      type: "sum",
      note: "FAQ 满分 30（10 项×0~3）",
      thresholds: [
        { min: 0, max: 6, level: "green", label: "日常功能基本正常（FAQ ≤6）" },
        { min: 7, max: 15, level: "yellow", label: "日常功能下降，提示需关注（MCI 风险，FAQ 7~15）" },
        { min: 16, max: 99, level: "red", label: "日常功能明显受损（FAQ ≥16），高度提示痴呆" },
      ],
    },
  },

  "NPI": {
    name: "神经精神量表（NPI·12 域）",
    short: "NPI",
    role: "informant",
    intro: "家属您好，问最近一个月他/她是否出现过以下情况。无=0；有=频率(1~4)×严重度(1~3)的乘积（1~12）。",
    items: [
      { id: "p1", q: "妄想（被偷/被害/被人算计感）", kind: "number", min: 0, max: 12, hint: "0 无 / 1~12" },
      { id: "p2", q: "幻觉（看到或听到不存在的人/物）", kind: "number", min: 0, max: 12, hint: "0 无 / 1~12" },
      { id: "p3", q: "激越/攻击（易怒、言语或身体攻击）", kind: "number", min: 0, max: 12, hint: "0 无 / 1~12" },
      { id: "p4", q: "抑郁/心境恶劣（情绪低落、兴趣减退）", kind: "number", min: 0, max: 12, hint: "0 无 / 1~12" },
      { id: "p5", q: "焦虑（担心、紧张、害怕）", kind: "number", min: 0, max: 12, hint: "0 无 / 1~12" },
      { id: "p6", q: "情感高涨/欣快（异常开心、得意）", kind: "number", min: 0, max: 12, hint: "0 无 / 1~12" },
      { id: "p7", q: "淡漠（对事物缺乏兴趣、主动性下降）", kind: "number", min: 0, max: 12, hint: "0 无 / 1~12" },
      { id: "p8", q: "脱抑制（言行随便、不顾场合）", kind: "number", min: 0, max: 12, hint: "0 无 / 1~12" },
      { id: "p9", q: "易激惹/情绪不稳（波动大、小事发火）", kind: "number", min: 0, max: 12, hint: "0 无 / 1~12" },
      { id: "p10", q: "异常运动行为（重复动作、坐立不安）", kind: "number", min: 0, max: 12, hint: "0 无 / 1~12" },
      { id: "p11", q: "睡眠/夜间行为（昼夜颠倒、夜醒）", kind: "number", min: 0, max: 12, hint: "0 无 / 1~12" },
      { id: "p12", q: "进食障碍（食欲改变、暴食/拒食）", kind: "number", min: 0, max: 12, hint: "0 无 / 1~12" },
    ],
    scoring: {
      type: "sum",
      note: "NPI 满分 144",
      thresholds: [
        { min: 0, max: 3, level: "green", label: "无明显神经精神症状（NPI ≤3）" },
        { min: 4, max: 12, level: "yellow", label: "存在轻中度症状，建议密切观察（NPI 4~12）" },
        { min: 13, max: 99, level: "red", label: "精神行为症状较重（NPI ≥13），建议临床干预" },
      ],
    },
  },

  "CDR": {
    name: "临床痴呆评定量表（CDR·6域 + Global）",
    short: "CDR",
    role: "informant",
    intro: "最后综合评估 6 个方面，按严重程度选（0 正常 / 0.5 可疑 / 1 轻度 / 2 中度 / 3 重度）。将按华盛顿大学规则给出 Global CDR。",
    items: [
      {
        id: "r1",
        q: "记忆",
        kind: "choice",
        options: [
          { label: "正常 0", score: 0 },
          { label: "可疑 0.5", score: 0.5 },
          { label: "轻度 1", score: 1 },
          { label: "中度 2", score: 2 },
          { label: "重度 3", score: 3 },
        ],
      },
      {
        id: "r2",
        q: "定向力",
        kind: "choice",
        options: [
          { label: "正常 0", score: 0 },
          { label: "可疑 0.5", score: 0.5 },
          { label: "轻度 1", score: 1 },
          { label: "中度 2", score: 2 },
          { label: "重度 3", score: 3 },
        ],
      },
      {
        id: "r3",
        q: "判断与解决问题",
        kind: "choice",
        options: [
          { label: "正常 0", score: 0 },
          { label: "可疑 0.5", score: 0.5 },
          { label: "轻度 1", score: 1 },
          { label: "中度 2", score: 2 },
          { label: "重度 3", score: 3 },
        ],
      },
      {
        id: "r4",
        q: "社会事务",
        kind: "choice",
        options: [
          { label: "正常 0", score: 0 },
          { label: "可疑 0.5", score: 0.5 },
          { label: "轻度 1", score: 1 },
          { label: "中度 2", score: 2 },
          { label: "重度 3", score: 3 },
        ],
      },
      {
        id: "r5",
        q: "家庭爱好",
        kind: "choice",
        options: [
          { label: "正常 0", score: 0 },
          { label: "可疑 0.5", score: 0.5 },
          { label: "轻度 1", score: 1 },
          { label: "中度 2", score: 2 },
          { label: "重度 3", score: 3 },
        ],
      },
      {
        id: "r6",
        q: "个人照料",
        kind: "choice",
        options: [
          { label: "正常 0", score: 0 },
          { label: "可疑 0.5", score: 0.5 },
          { label: "轻度 1", score: 1 },
          { label: "中度 2", score: 2 },
          { label: "重度 3", score: 3 },
        ],
      },
    ],
    scoring: {
      type: "sum",
      note: "CDR-SB=6域之和；Global CDR 由记忆域主导（华盛顿大学规则）",
      thresholds: [
        { min: 0, max: 0.5, level: "green", label: "CDR-SB 0~0.5（认知正常）" },
        { min: 1.0, max: 4.0, level: "yellow", label: "CDR-SB 1~4（可疑/轻度认知受损/MCI）" },
        { min: 4.5, max: 99, level: "red", label: "CDR-SB ≥4.5（轻-中重度痴呆）" },
      ],
    },
  },
};

// Washington University Global CDR Calculation
export function calculateWashingtonGlobalCDR(answers: Record<string, number>): number {
  const m = answers.r1 ?? 0;
  const others = [
    answers.r2 ?? 0,
    answers.r3 ?? 0,
    answers.r4 ?? 0,
    answers.r5 ?? 0,
    answers.r6 ?? 0,
  ];
  const maxOther = Math.max(...others);
  const cntHalf = others.filter((x) => x >= 0.5).length;

  if (m === 0 && maxOther === 0) return 0;
  if (m === 0.5 && maxOther === 0) return 0.5;
  if (m >= 1 && m < 2 && cntHalf >= 1) return 1;
  if (m >= 2 && m < 3 && maxOther >= 1 && cntHalf >= 2) return 2;
  if (m === 3 && others.filter((x) => x === 3).length >= 3) return 3;
  return m;
}

// Compute score for any scale
export function computeScaleScore(
  scaleKey: string,
  answers: Record<string, any>
): {
  score: number;
  globalCDR?: number;
  level: "green" | "yellow" | "red";
  label: string;
  details: any;
} {
  const cfg = SCALES_CONFIG[scaleKey];
  if (!cfg) {
    return { score: 0, level: "green", label: "已完成", details: {} };
  }

  if (scaleKey === "CDR") {
    let sb = 0;
    ["r1", "r2", "r3", "r4", "r5", "r6"].forEach((k) => {
      sb += Number(answers[k] || 0);
    });
    const g = calculateWashingtonGlobalCDR(answers);
    let level: "green" | "yellow" | "red" = "green";
    if (g === 0.5) level = "yellow";
    else if (g >= 1) level = "red";
    return {
      score: sb,
      globalCDR: g,
      level,
      label: `Global CDR = ${g} · CDR-SB = ${sb}`,
      details: { sb, globalCDR: g },
    };
  }

  if (scaleKey === "AVLT") {
    const t1 = Number(answers.t1 || 0);
    const t2 = Number(answers.t2 || 0);
    const t3 = Number(answers.t3 || 0);
    const tTotal = t1 + t2 + t3;
    const n4 = Number(answers.n4 || 0);
    const recogList = Array.isArray(answers.n5) ? answers.n5 : [];
    const targetHits = recogList.filter((w: string) => AVLT_TARGET.includes(w)).length;
    const distractorFA = recogList.filter((w: string) => AVLT_DISTRACTOR.includes(w)).length;
    const recogScore = Math.max(0, targetHits - distractorFA);

    let level: "green" | "yellow" | "red" = "green";
    if (n4 <= 3) level = "red";
    else if (n4 <= 6) level = "yellow";

    return {
      score: n4,
      level,
      label: `延迟回忆 ${n4}/12 · 学习总量 ${tTotal}/36 · 再认净分 ${recogScore}`,
      details: { t1, t2, t3, tTotal, n4, recogScore, targetHits, distractorFA },
    };
  }

  if (scaleKey === "VFT") {
    const v1 = Number(answers.v1 || 0);
    let level: "green" | "yellow" | "red" = "green";
    if (v1 <= 8) level = "red";
    else if (v1 <= 13) level = "yellow";
    return {
      score: v1,
      level,
      label: `60秒词数: ${v1} (前15s: ${answers.v2 || 0} / 30s: ${answers.v3 || 0} / 45s: ${answers.v4 || 0} / 60s: ${answers.v5 || 0})`,
      details: {
        total: v1,
        segments: [answers.v2 || 0, answers.v3 || 0, answers.v4 || 0, answers.v5 || 0],
      },
    };
  }

  // General sum scoring
  let sum = 0;
  cfg.items.forEach((it) => {
    if (it.count !== false && answers[it.id] != null) {
      sum += Number(answers[it.id]);
    }
  });

  let level: "green" | "yellow" | "red" = "green";
  let label = `${cfg.short} 得分: ${sum}`;

  for (const th of cfg.scoring.thresholds) {
    if (sum >= th.min && sum <= th.max) {
      level = th.level;
      label = th.label;
      break;
    }
  }

  return { score: sum, level, label, details: { sum } };
}
