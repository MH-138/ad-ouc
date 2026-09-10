import { SubjectRecord } from "../types/assessment";

export type RoleType = "patient" | "examiner" | "informant";

export interface ChatOption {
  label: string;
  value: any;
  subText?: string;
  color?: "default" | "primary" | "amber" | "rose" | "emerald" | "indigo";
  icon?: string;
}

export interface ChatNode {
  id: string;
  topicId: "icebreak" | "medical" | "memory_scd" | "mood_sleep" | "games" | "informant";
  speaker: "ai" | "examiner";
  targetRole: RoleType[]; // roles that see this node
  title: string;
  promptPatient: string; // Patient perspective ("您平时...")
  promptInformant: string; // Informant perspective ("他/她平时...")
  promptExaminer: string; // Examiner guide
  speechText: string; // TTS voice content
  inputType:
    | "buttons"
    | "emotion_scale"
    | "number_stepper"
    | "text_input"
    | "avlt_round_card"
    | "vft_countdown"
    | "scale_score_summary"
    | "upload_card";
  options?: ChatOption[];
  numberConfig?: {
    min: number;
    max: number;
    step?: number;
    unit: string;
    presets?: number[];
  };
  // Getter for current value in SubjectRecord
  getValue: (record: SubjectRecord) => any;
  // Setter to update SubjectRecord
  setValue: (record: SubjectRecord, value: any) => SubjectRecord;
  // Next node selector or calculation
  getNextNodeId: (record: SubjectRecord, val: any) => string | null;
}

export interface TopicInfo {
  id: "icebreak" | "medical" | "memory_scd" | "mood_sleep" | "games" | "informant";
  name: string;
  desc: string;
  icon: string;
  color: string;
  firstNodeId: string;
}

export const CHAT_TOPICS: TopicInfo[] = [
  {
    id: "icebreak",
    name: "基本信息",
    desc: "个人基本资料",
    icon: "Handshake",
    color: "teal",
    firstNodeId: "node_welcome",
  },
  {
    id: "medical",
    name: "既往病史",
    desc: "慢性病与心血管病史",
    icon: "HeartPulse",
    color: "blue",
    firstNodeId: "node_bp_has",
  },
  {
    id: "memory_scd",
    name: "记忆主诉",
    desc: "SCD-Q9 主观记忆自评",
    icon: "Brain",
    color: "amber",
    firstNodeId: "node_scd_intro",
  },
  {
    id: "mood_sleep",
    name: "情绪与睡眠",
    desc: "情绪状态与睡眠自评",
    icon: "Smile",
    color: "purple",
    firstNodeId: "node_mood_general",
  },
  {
    id: "games",
    name: "认知测验",
    desc: "定向与认知初筛",
    icon: "Gamepad2",
    color: "rose",
    firstNodeId: "node_games_intro",
  },
  {
    id: "informant",
    name: "知情者观察",
    desc: "日常功能与照料者反馈",
    icon: "Users",
    color: "indigo",
    firstNodeId: "node_informant_switch",
  },
];

export const CHAT_NODES: Record<string, ChatNode> = {
  // ================= 1. 基本信息 (Icebreak) =================
  node_welcome: {
    id: "node_welcome",
    topicId: "icebreak",
    speaker: "ai",
    targetRole: ["patient", "examiner", "informant"],
    title: "基本信息登记",
    promptPatient: "您好！欢迎参加宣武医院认知健康随访。接下来请如实填写基本信息。",
    promptInformant: "您好！欢迎协助填写宣武医院认知健康随访资料。",
    promptExaminer: "开始受试者基线资料录入。",
    speechText: "您好！欢迎参加宣武医院认知健康随访。接下来请如实填写基本信息。",
    inputType: "buttons",
    options: [
      { label: "开始登记个人信息", value: "start", color: "emerald", icon: "Check" },
    ],
    getValue: () => "start",
    setValue: (r) => r,
    getNextNodeId: () => "node_name_input",
  },

  node_upload_doc: {
    id: "node_upload_doc",
    topicId: "icebreak",
    speaker: "ai",
    targetRole: ["patient", "examiner", "informant"],
    title: "病历 / 检查单智能拍照识别",
    promptPatient: "请拍摄或上传您的出院小结、门诊病历或检查报告，AI 助手将自动提取姓名、年龄及病史信息。",
    promptInformant: "请拍摄或上传患者的出院小结或门诊病历，系统将智能提取关键字段供您核对确认。",
    promptExaminer: "支持上传医疗单据照片或 PDF，AI 自动提取关键字段填入档案。",
    speechText: "请拍摄或上传您的出院小结、门诊病历或检查报告，AI 助手将自动提取姓名、年龄及病史信息。",
    inputType: "upload_card",
    getValue: () => null,
    setValue: (r) => r,
    getNextNodeId: () => "node_name_input",
  },

  node_name_input: {
    id: "node_name_input",
    topicId: "icebreak",
    speaker: "ai",
    targetRole: ["patient", "examiner", "informant"],
    title: "受试者姓名",
    promptPatient: "请问怎么称呼您？请输入您的真实姓名：",
    promptInformant: "请问患者的真实姓名是？",
    promptExaminer: "核对受试者姓名：",
    speechText: "请问怎么称呼您？请输入您的真实姓名。",
    inputType: "text_input",
    getValue: (r) => r.demographics?.name || "",
    setValue: (r, val) => ({
      ...r,
      demographics: { ...r.demographics, name: val },
    }),
    getNextNodeId: () => "node_gender_select",
  },

  node_gender_select: {
    id: "node_gender_select",
    topicId: "icebreak",
    speaker: "ai",
    targetRole: ["patient", "examiner", "informant"],
    title: "性别",
    promptPatient: "请问您的性别是？",
    promptInformant: "请问患者的性别是？",
    promptExaminer: "受试者性别：",
    speechText: "请问您的性别是男士还是女士？",
    inputType: "buttons",
    options: [
      { label: "男士 (Male)", value: 1, color: "primary", icon: "User" },
      { label: "女士 (Female)", value: 2, color: "rose", icon: "UserCheck" },
    ],
    getValue: (r) => r.demographics?.gender || 1,
    setValue: (r, val) => ({
      ...r,
      demographics: { ...r.demographics, gender: val },
    }),
    getNextNodeId: () => "node_age_input",
  },

  node_age_input: {
    id: "node_age_input",
    topicId: "icebreak",
    speaker: "ai",
    targetRole: ["patient", "examiner", "informant"],
    title: "实足年龄",
    promptPatient: "请问您今年多大年纪啦？",
    promptInformant: "请问患者今年实足年龄是多少岁？",
    promptExaminer: "录入受试者实际周岁：",
    speechText: "请问您今年多大年纪啦？",
    inputType: "number_stepper",
    numberConfig: {
      min: 45,
      max: 99,
      unit: "岁",
      presets: [55, 60, 63, 65, 68, 72, 75, 80],
    },
    getValue: (r) => r.demographics?.age || 65,
    setValue: (r, val) => ({
      ...r,
      demographics: { ...r.demographics, age: Number(val) },
    }),
    getNextNodeId: () => "node_edu_years",
  },

  node_edu_years: {
    id: "node_edu_years",
    topicId: "icebreak",
    speaker: "ai",
    targetRole: ["patient", "examiner", "informant"],
    title: "受教育年限",
    promptPatient: "您以前读过几年书？（这对我们精准匹配常模标准非常重要哦）",
    promptInformant: "请问患者以前正规上学读了多少年书？",
    promptExaminer: "核定受试者正规受教育年限（年）：",
    speechText: "您以前读过几年书？这对我们精准匹配常模标准非常重要哦。",
    inputType: "buttons",
    options: [
      { label: "未上过学 / 文盲 (0年)", value: 0, subText: "≤0年" },
      { label: "小学水平 (1-6年)", value: 6, subText: "6年" },
      { label: "初中毕业 (7-9年)", value: 9, subText: "9年" },
      { label: "高中 / 中专 (10-12年)", value: 12, subText: "12年" },
      { label: "大专 / 本科及以上 (≥16年)", value: 16, subText: "16年+" },
    ],
    getValue: (r) => r.demographics?.educationYears || 12,
    setValue: (r, val) => ({
      ...r,
      demographics: { ...r.demographics, educationYears: Number(val) },
    }),
    getNextNodeId: () => "node_living_status",
  },

  node_living_status: {
    id: "node_living_status",
    topicId: "icebreak",
    speaker: "ai",
    targetRole: ["patient", "examiner", "informant"],
    title: "居住情况",
    promptPatient: "您平时在家里是一个人住，还是和老伴儿、孩子们一起住？",
    promptInformant: "患者平时是独居，还是与家人同住？",
    promptExaminer: "受试者家庭居住状况：",
    speechText: "您平时在家里是一个人住，还是和老伴儿、孩子们一起住？",
    inputType: "buttons",
    options: [
      { label: "和家人 / 老伴同住", value: 2, color: "emerald", icon: "Users" },
      { label: "一个人独居", value: 1, color: "amber", icon: "Home" },
    ],
    getValue: (r) => r.demographics?.socialSupport?.livingAlone || 2,
    setValue: (r, val) => ({
      ...r,
      demographics: {
        ...r.demographics,
        socialSupport: {
          ...r.demographics.socialSupport,
          livingAlone: val,
        },
      },
    }),
    getNextNodeId: () => "node_bp_has",
  },

  // ================= 2. 身体小毛病 (Medical History) =================
  node_bp_has: {
    id: "node_bp_has",
    topicId: "medical",
    speaker: "ai",
    targetRole: ["patient", "examiner", "informant"],
    title: "高血压病史",
    promptPatient: "平时量血压，医生说过您血压高不高呀？",
    promptInformant: "患者平时有没有高血压？",
    promptExaminer: "高血压病史筛查：",
    speechText: "平时量血压，医生说过您血压高不高呀？",
    inputType: "buttons",
    options: [
      { label: "没有高血压，平时挺好", value: false, color: "emerald" },
      { label: "有高血压，在吃降压药", value: true, color: "amber" },
    ],
    getValue: (r) => r.history?.hypertension?.has || false,
    setValue: (r, val) => ({
      ...r,
      history: {
        ...r.history,
        hypertension: {
          ...r.history.hypertension,
          has: val,
          regularMed: val,
        },
      },
    }),
    getNextNodeId: (_r, val) => (val ? "node_bp_detail" : "node_dm_has"),
  },

  node_bp_detail: {
    id: "node_bp_detail",
    topicId: "medical",
    speaker: "ai",
    targetRole: ["patient", "examiner", "informant"],
    title: "血压控制与平时数值",
    promptPatient: "您这高血压大概多少年了？平时吃的药规律吗？",
    promptInformant: "患者高血压病程及服药情况：",
    promptExaminer: "高血压病程与平稳性：",
    speechText: "您这高血压大概多少年了？平时吃的药规律吗？",
    inputType: "buttons",
    options: [
      { label: "一直按时吃药，控制平稳 (约130/80)", value: { years: 5, stable: true, med: true }, color: "emerald" },
      { label: "吃药但偶尔有波动", value: { years: 8, stable: false, med: true }, color: "amber" },
      { label: "偶尔吃/不规律", value: { years: 10, stable: false, med: false }, color: "rose" },
    ],
    getValue: (r) => r.history?.hypertension?.stable,
    setValue: (r, val) => ({
      ...r,
      history: {
        ...r.history,
        hypertension: {
          ...r.history.hypertension,
          years: val.years,
          stable: val.stable,
          regularMed: val.med,
          usualBp: val.stable ? "130/80" : "145/95",
        },
      },
    }),
    getNextNodeId: () => "node_dm_has",
  },

  node_dm_has: {
    id: "node_dm_has",
    topicId: "medical",
    speaker: "ai",
    targetRole: ["patient", "examiner", "informant"],
    title: "糖尿病史",
    promptPatient: "平时测血糖高不高？有没有确诊过糖尿病？",
    promptInformant: "患者平时有没有糖尿病？",
    promptExaminer: "糖尿病病史筛查：",
    speechText: "平时测血糖高不高？有没有确诊过糖尿病？",
    inputType: "buttons",
    options: [
      { label: "血糖正常，无糖尿病", value: false, color: "emerald" },
      { label: "有糖尿病 / 偏高", value: true, color: "amber" },
    ],
    getValue: (r) => r.history?.diabetes?.has || false,
    setValue: (r, val) => ({
      ...r,
      history: {
        ...r.history,
        diabetes: { ...r.history.diabetes, has: val, regularMed: val },
      },
    }),
    getNextNodeId: () => "node_stroke_has",
  },

  node_stroke_has: {
    id: "node_stroke_has",
    topicId: "medical",
    speaker: "ai",
    targetRole: ["patient", "examiner", "informant"],
    title: "脑血管病 / 脑梗史",
    promptPatient: "以前头脑血管出过毛病吗？比如脑梗死、脑出血或短暂头晕手麻？",
    promptInformant: "患者既往是否有过脑梗死、脑出血或脑血管意外？",
    promptExaminer: "脑血管病（卒中/TIA）筛查：",
    speechText: "以前头脑血管出过毛病吗？比如脑梗死、脑出血或短暂头晕手麻？",
    inputType: "buttons",
    options: [
      { label: "从来没有过脑血管病", value: false, color: "emerald" },
      { label: "曾有轻微腔梗 / 脑梗", value: true, color: "amber" },
    ],
    getValue: (r) => r.history?.cerebrovascular?.has || false,
    setValue: (r, val) => ({
      ...r,
      history: {
        ...r.history,
        cerebrovascular: { ...r.history.cerebrovascular, has: val },
      },
    }),
    getNextNodeId: () => "node_family_has",
  },

  node_family_has: {
    id: "node_family_has",
    topicId: "medical",
    speaker: "ai",
    targetRole: ["patient", "examiner", "informant"],
    title: "痴呆家族史",
    promptPatient: "在您的父母或亲兄弟姐妹中，以前有没有上了年纪出现明显糊涂、老年痴呆的情况？",
    promptInformant: "患者一级或二级亲属中是否有老年性痴呆或认知障碍家族史？",
    promptExaminer: "认知障碍家族史（一级/二级亲属）：",
    speechText: "在您的父母或亲兄弟姐妹中，以前有没有上了年纪出现明显糊涂、老年痴呆的情况？",
    inputType: "buttons",
    options: [
      { label: "没有家族痴呆史", value: false, color: "emerald" },
      { label: "有直系亲属出现过", value: true, color: "amber" },
    ],
    getValue: (r) => r.history?.familyHistoryDementia?.has || false,
    setValue: (r, val) => ({
      ...r,
      history: {
        ...r.history,
        familyHistoryDementia: { ...r.history.familyHistoryDementia, has: val },
      },
    }),
    getNextNodeId: () => "node_scd_intro",
  },

  // ================= 3. 记性咋样 (SCD-Q9) =================
  node_scd_intro: {
    id: "node_scd_intro",
    topicId: "memory_scd",
    speaker: "ai",
    targetRole: ["patient", "examiner", "informant"],
    title: "主观记忆减退评估 (SCD-Q9)",
    promptPatient: "接下来我们聊聊您平时的记性。好多叔叔阿姨都反映上了年纪记性不如以前，咱们看看您是不是也有些小体会：",
    promptInformant: "接下来评估患者自身的主观记忆变化情况（SCD-Q9问卷）：",
    promptExaminer: "开始 SCD-Q9 主观认知下降 9 项问卷评定：",
    speechText: "接下来我们聊聊您平时的记性。好多叔叔阿姨都反映上了年纪记性不如以前，咱们看看您是不是也有些小体会。",
    inputType: "buttons",
    options: [{ label: "好的，请问吧！", value: "next", color: "primary" }],
    getValue: () => "next",
    setValue: (r) => r,
    getNextNodeId: () => "node_scd_q1",
  },

  node_scd_q1: {
    id: "node_scd_q1",
    topicId: "memory_scd",
    speaker: "ai",
    targetRole: ["patient", "examiner", "informant"],
    title: "SCD-Q1: 记忆问题存在感",
    promptPatient: "您感觉自己有记忆力下降的问题吗？",
    promptInformant: "患者自己有抱怨过记忆力下降吗？",
    promptExaminer: "1. 您感觉自己有记忆问题吗？",
    speechText: "您感觉自己有记忆力下降的问题吗？",
    inputType: "buttons",
    options: [
      { label: "没有，记性挺好 (否)", value: 0, color: "emerald" },
      { label: "有的，感觉记性不如从前 (是)", value: 1, color: "amber" },
    ],
    getValue: (r) => r.scdQ9?.q1 || 0,
    setValue: (r, val) => ({
      ...r,
      scdQ9: { ...r.scdQ9, q1: val },
    }),
    getNextNodeId: () => "node_scd_q2",
  },

  node_scd_q2: {
    id: "node_scd_q2",
    topicId: "memory_scd",
    speaker: "ai",
    targetRole: ["patient", "examiner", "informant"],
    title: "SCD-Q2: 近几天谈话内容",
    promptPatient: "您会记不住 3 到 5 天前跟别人谈话的具体内容吗？",
    promptInformant: "患者会记不住几天前与别人的对话内容吗？",
    promptExaminer: "2. 记不住3-5天前谈话内容？",
    speechText: "您会记不住 3 到 5 天前跟别人谈话的具体内容吗？",
    inputType: "buttons",
    options: [
      { label: "能记住 (否)", value: 0, color: "emerald" },
      { label: "有时真想不起来 (是)", value: 1, color: "amber" },
    ],
    getValue: (r) => r.scdQ9?.q2 || 0,
    setValue: (r, val) => ({
      ...r,
      scdQ9: { ...r.scdQ9, q2: val },
    }),
    getNextNodeId: () => "node_scd_q3",
  },

  node_scd_q3: {
    id: "node_scd_q3",
    topicId: "memory_scd",
    speaker: "ai",
    targetRole: ["patient", "examiner", "informant"],
    title: "SCD-Q3: 近两年是否有变化",
    promptPatient: "这些记忆上的小问题，是不是在最近两年里变得明显了？",
    promptInformant: "患者记忆减退在近两年内是否有所加重？",
    promptExaminer: "3. 记忆问题是否在近2年内发生？",
    speechText: "这些记忆上的小问题，是不是在最近两年里变得明显了？",
    inputType: "buttons",
    options: [
      { label: "没有加重 (否)", value: 0, color: "emerald" },
      { label: "是的，这两年感觉更明显 (是)", value: 1, color: "amber" },
    ],
    getValue: (r) => r.scdQ9?.q3 || 0,
    setValue: (r, val) => ({
      ...r,
      scdQ9: { ...r.scdQ9, q3: val },
    }),
    getNextNodeId: () => "node_scd_q4",
  },

  node_scd_q4: {
    id: "node_scd_q4",
    topicId: "memory_scd",
    speaker: "ai",
    targetRole: ["patient", "examiner", "informant"],
    title: "SCD-Q4: 重要日期 (生日/节日)",
    promptPatient: "重要日期（比如家人生日、传统节日、纪念日），您会记不住吗？",
    promptInformant: "重要日期（家人生日、纪念日），患者是否会遗忘？",
    promptExaminer: "4. 会忘记重要日期吗？",
    speechText: "重要日期比如家人生日、传统节日，您会记不住吗？",
    inputType: "buttons",
    options: [
      { label: "从不遗忘 (0分)", value: 0, color: "emerald" },
      { label: "偶尔会忘 (0.5分)", value: 0.5, color: "amber" },
      { label: "经常记不住 (1分)", value: 1, color: "rose" },
    ],
    getValue: (r) => r.scdQ9?.q4 || 0,
    setValue: (r, val) => ({
      ...r,
      scdQ9: { ...r.scdQ9, q4: val },
    }),
    getNextNodeId: () => "node_scd_q5",
  },

  node_scd_q5: {
    id: "node_scd_q5",
    topicId: "memory_scd",
    speaker: "ai",
    targetRole: ["patient", "examiner", "informant"],
    title: "SCD-Q5: 常用电话号码",
    promptPatient: "家人的常用电话号码或者自家门牌号，您会突然记不住吗？",
    promptInformant: "常用电话或地址门牌，患者会突然遗忘吗？",
    promptExaminer: "5. 会忘记常用电话号码吗？",
    speechText: "家人的常用电话号码或者自家门牌号，您会突然记不住吗？",
    inputType: "buttons",
    options: [
      { label: "从不忘记 (0分)", value: 0, color: "emerald" },
      { label: "偶尔要想一下 (0.5分)", value: 0.5, color: "amber" },
      { label: "经常记不得 (1分)", value: 1, color: "rose" },
    ],
    getValue: (r) => r.scdQ9?.q5 || 0,
    setValue: (r, val) => ({
      ...r,
      scdQ9: { ...r.scdQ9, q5: val },
    }),
    getNextNodeId: () => "node_scd_q8",
  },

  node_scd_q8: {
    id: "node_scd_q8",
    topicId: "memory_scd",
    speaker: "ai",
    targetRole: ["patient", "examiner", "informant"],
    title: "SCD-Q8: 与5年前相比",
    promptPatient: "跟 5 年前的自己相比，您觉得现在的记忆力是不是确实下降了？",
    promptInformant: "与5年前相比，患者记忆力是否确有退步？",
    promptExaminer: "8. 记忆力是否明显比5年前差？",
    speechText: "跟 5 年前的自己相比，您觉得现在的记忆力是不是确实下降了？",
    inputType: "buttons",
    options: [
      { label: "差不多，没大变化 (否)", value: 0, color: "emerald" },
      { label: "是的，确实比5年前差 (是)", value: 1, color: "amber" },
    ],
    getValue: (r) => r.scdQ9?.q8 || 0,
    setValue: (r, val) => ({
      ...r,
      scdQ9: { ...r.scdQ9, q8: val },
    }),
    getNextNodeId: () => "node_scd_summary",
  },

  node_scd_summary: {
    id: "node_scd_summary",
    topicId: "memory_scd",
    speaker: "ai",
    targetRole: ["patient", "examiner", "informant"],
    title: "SCD-Q9 主诉综合预警看板",
    promptPatient: "好的，您的记忆问卷已汇总完成！系统正在自动比对临床常模：",
    promptInformant: "患者的 SCD-Q9 主观记忆评分已生成：",
    promptExaminer: "SCD-Q9 评分与红黄绿灯判定：",
    speechText: "好的，您的记忆问卷已汇总完成。系统已为您自动完成常模比对。",
    inputType: "scale_score_summary",
    getValue: (r) => {
      const q = r.scdQ9;
      return (q.q1 || 0) + (q.q2 || 0) + (q.q3 || 0) + (q.q4 || 0) + (q.q5 || 0) + (q.q6 || 0) + (q.q7 || 0) + (q.q8 || 0) + (q.q9 || 0);
    },
    setValue: (r) => r,
    getNextNodeId: () => "node_mood_general",
  },

  // ================= 4. 心情与睡觉 (Mood & Sleep) =================
  node_mood_general: {
    id: "node_mood_general",
    topicId: "mood_sleep",
    speaker: "ai",
    targetRole: ["patient", "examiner", "informant"],
    title: "整体情绪自评 (5级表情尺)",
    promptPatient: "在最近两周里，您大部分时间的心情感觉怎么样？请在下面表情尺里点选最符合您的心情：",
    promptInformant: "在最近两周内，患者的情绪状态大致处于什么水平？",
    promptExaminer: "情绪状态筛查 (HAMD / GDS 映射表情尺)：",
    speechText: "在最近两周里，您大部分时间的心情感觉怎么样？请在下面表情尺里点选最符合您的心情。",
    inputType: "emotion_scale",
    options: [
      { label: "非常舒畅 开心", value: 0, icon: "😊" },
      { label: "挺好 比较平稳", value: 1, icon: "🙂" },
      { label: "一般 有点提不起劲", value: 2, icon: "😐" },
      { label: "有些烦闷 沮丧", value: 3, icon: "🙁" },
      { label: "很难过 焦虑难受", value: 4, icon: "😭" },
    ],
    getValue: (r) => r.scales?.hamd17?.items?.[1] || 0,
    setValue: (r, val) => ({
      ...r,
      scales: {
        ...r.scales,
        hamd17: {
          ...r.scales.hamd17,
          items: { ...r.scales.hamd17.items, 1: Number(val) },
        },
      },
    }),
    getNextNodeId: () => "node_sleep_hours",
  },

  node_sleep_hours: {
    id: "node_sleep_hours",
    topicId: "mood_sleep",
    speaker: "ai",
    targetRole: ["patient", "examiner", "informant"],
    title: "实际夜间睡眠时长",
    promptPatient: "您最近晚上躺下后，通常每天能实际睡着几个小时？",
    promptInformant: "患者夜间实际平均睡眠时长大约多少小时？",
    promptExaminer: "PSQI 实际有效睡眠时间（小时）：",
    speechText: "您最近晚上躺下后，通常每天能实际睡着几个小时？",
    inputType: "buttons",
    options: [
      { label: "7小时以上 (睡眠充足)", value: 7.5, color: "emerald" },
      { label: "6 到 7 小时 (基本正常)", value: 6.5, color: "primary" },
      { label: "5 到 6 小时 (偏少)", value: 5.5, color: "amber" },
      { label: "少于 5 小时 (失眠/多梦)", value: 4.5, color: "rose" },
    ],
    getValue: (r) => r.scales?.psqi?.actualSleepHours || 7,
    setValue: (r, val) => ({
      ...r,
      scales: {
        ...r.scales,
        psqi: { ...r.scales.psqi, actualSleepHours: Number(val) },
      },
    }),
    getNextNodeId: () => "node_games_intro",
  },

  // ================= 5. 互动小游戏 (Cognitive Battery) =================
  node_games_intro: {
    id: "node_games_intro",
    topicId: "games",
    speaker: "ai",
    targetRole: ["patient", "examiner", "informant"],
    title: "认知小游戏测试",
    promptPatient: "太棒啦！接下来咱们玩几个锻炼大脑的小游戏，包括词语记忆、看图命名和算算数，就当做个大脑体操，不用紧张！",
    promptInformant: "接下来将由主试对患者开展客观神经心理测验（MMSE、AVLT词表、VFT流畅性等）：",
    promptExaminer: "准备进入客观认知测验（MMSE 30项定向/计算 + AVLT-H 词语学习测验）：",
    speechText: "太棒啦！接下来咱们玩几个锻炼大脑的小游戏，包括词语记忆、看图命名和算算数，就当做个大脑体操，不用紧张！",
    inputType: "buttons",
    options: [{ label: "开始大脑小游戏 🎮", value: "start_games", color: "emerald" }],
    getValue: () => "start_games",
    setValue: (r) => r,
    getNextNodeId: () => "node_mmse_orientation",
  },

  node_mmse_orientation: {
    id: "node_mmse_orientation",
    topicId: "games",
    speaker: "examiner",
    targetRole: ["patient", "examiner"],
    title: "MMSE: 时间与地点定向 (5分)",
    promptPatient: "请问您知道今天大概是哪一年？现在是什么季节？我们现在在什么城市？",
    promptInformant: "主试正在评定患者的时间和空间定向力：",
    promptExaminer: "提问今年年份、季节、月份、日期、星期几及所在省/市：",
    speechText: "请问您知道今天大概是哪一年？现在是什么季节？我们现在在哪个城市？",
    inputType: "buttons",
    options: [
      { label: "全部准确无误 (5分)", value: 5, color: "emerald" },
      { label: "错1个 (如季节或日期记错 4分)", value: 4, color: "primary" },
      { label: "错2个 (3分)", value: 3, color: "amber" },
      { label: "错3个及以上 (≤2分)", value: 2, color: "rose" },
    ],
    getValue: (r) => {
      let sc = 0;
      for (let i = 1; i <= 5; i++) sc += r.scales?.mmse?.items?.[`2.${i}`] || 0;
      return sc || 5;
    },
    setValue: (r, val) => {
      const items = { ...r.scales.mmse.items };
      const score = Number(val);
      for (let i = 1; i <= 5; i++) {
        items[`2.${i}`] = i <= score ? 1 : 0;
      }
      return {
        ...r,
        scales: { ...r.scales, mmse: { ...r.scales.mmse, items } },
      };
    },
    getNextNodeId: () => "node_avlt_n1",
  },

  node_avlt_n1: {
    id: "node_avlt_n1",
    topicId: "games",
    speaker: "examiner",
    targetRole: ["patient", "examiner"],
    title: "AVLT 听觉词汇学习测验 (N1-N3 即刻轮次)",
    promptPatient: "现在我念 12 个词语，请您认真听。念完后，请把您记住的词说出来，不用按顺序。",
    promptInformant: "主试正在进行华山版听觉词语学习（AVLT-H N1-N3学习）：",
    promptExaminer: "主试以每秒1词朗读12个词表（服饰/职业/花朵），点击患者说出的词条变绿计分：",
    speechText: "现在我念 12 个词语，请您认真听。念完后，请把您记住的词尽量说出来，不用按顺序。",
    inputType: "avlt_round_card",
    getValue: (r) => r.scales?.avltH?.n1Words || [],
    setValue: (r, words) => ({
      ...r,
      scales: {
        ...r.scales,
        avltH: {
          ...r.scales.avltH,
          n1Words: words,
          n2Words: words.length >= 6 ? words.slice(0, 8) : words,
          n3Words: words.length >= 7 ? words.slice(0, 9) : words,
        },
      },
    }),
    getNextNodeId: () => "node_vft_countdown",
  },

  node_vft_countdown: {
    id: "node_vft_countdown",
    topicId: "games",
    speaker: "examiner",
    targetRole: ["patient", "examiner"],
    title: "VFT 动物词语流畅性 (60秒大屏倒计时)",
    promptPatient: "请您在 1 分钟之内，尽可能多地说出您知道的【动物名字】（如猫、狗、老虎），越多越好！准备好了吗？开始！",
    promptInformant: "主试正在进行 1 分钟动物流畅性提取计时：",
    promptExaminer: "点击开始60秒倒计时（最后10秒变红闪烁），记录患者说出的正确动物词数：",
    speechText: "请您在 1 分钟之内，尽可能多地说出您知道的动物名字，比如猫、狗、老虎，越多越好。准备好了吗？开始！",
    inputType: "vft_countdown",
    getValue: (r) => r.scales?.vft?.t1_15s + r.scales?.vft?.t16_30s + r.scales?.vft?.t31_45s + r.scales?.vft?.t46_60s || 16,
    setValue: (r, count) => {
      const c = Number(count);
      const quarter = Math.floor(c / 4);
      return {
        ...r,
        scales: {
          ...r.scales,
          vft: {
            ...r.scales.vft,
            t1_15s: quarter + 1,
            t16_30s: quarter,
            t31_45s: quarter,
            t46_60s: Math.max(0, c - quarter * 3 - 1),
          },
        },
      };
    },
    getNextNodeId: () => "node_informant_switch",
  },

  // ================= 6. 家人怎么看 (Informant / FAQ / CDR) =================
  node_informant_switch: {
    id: "node_informant_switch",
    topicId: "informant",
    speaker: "ai",
    targetRole: ["patient", "examiner", "informant"],
    title: "知情者角色切换与日常能力评定",
    promptPatient: "叔叔/阿姨辛苦啦！接下来请您的老伴或家人来回答最后几个关于日常生活和脾气性格的小问题，好吗？",
    promptInformant: "您好！请家属（知情者）根据患者近半年来的真实日常生活情况进行补充评定：",
    promptExaminer: "切换为【知情者视角】（FAQ日常生活能力 + CDR痴呆评定 + NPI精神行为）：",
    speechText: "辛苦啦！接下来请您的老伴或家人来回答最后几个关于日常生活和脾气性格的小问题，好吗？",
    inputType: "buttons",
    options: [
      { label: "切换到家属视角 (继续评定)", value: "switch_informant", color: "indigo", icon: "Users" },
      { label: "主试协助直接完成", value: "examiner_direct", color: "emerald" },
    ],
    getValue: () => "switch_informant",
    setValue: (r) => r,
    getNextNodeId: () => "node_faq_bills",
  },

  node_faq_bills: {
    id: "node_faq_bills",
    topicId: "informant",
    speaker: "ai",
    targetRole: ["examiner", "informant"],
    title: "FAQ-1: 财务与结账管理",
    promptPatient: "在自己管理存折、日常算账、交水电费方面，情况如何？",
    promptInformant: "在自己管钱、银行存取款、计算日常开支和交水电费方面，他/她目前：",
    promptExaminer: "FAQ-1 财务能力评定：",
    speechText: "在自己管理存折、日常算账、交水电费方面，他目前表现如何？",
    inputType: "buttons",
    options: [
      { label: "完全独立，清清楚楚 (0分)", value: 0, color: "emerald" },
      { label: "有些吃力，但自己还能办 (1分)", value: 1, color: "primary" },
      { label: "需要家人提醒或协助 (2分)", value: 2, color: "amber" },
      { label: "完全依赖家人代办 (3分)", value: 3, color: "rose" },
    ],
    getValue: (r) => r.scales?.faq?.items?.[1] || 0,
    setValue: (r, val) => ({
      ...r,
      scales: {
        ...r.scales,
        faq: {
          ...r.scales.faq,
          items: { ...r.scales.faq.items, 1: Number(val) },
        },
      },
    }),
    getNextNodeId: () => "node_faq_shopping",
  },

  node_faq_shopping: {
    id: "node_faq_shopping",
    topicId: "informant",
    speaker: "ai",
    targetRole: ["examiner", "informant"],
    title: "FAQ-2: 独自去超市/菜市场购物",
    promptPatient: "一个人出门买菜或去超市买东西，情况如何？",
    promptInformant: "独自去菜市场或超市买东西，挑东西、付钱找零，他/她目前：",
    promptExaminer: "FAQ-2 独自外出购物能力：",
    speechText: "独自去菜市场或超市买东西，挑东西、付钱找零，他目前表现如何？",
    inputType: "buttons",
    options: [
      { label: "完全独立无障碍 (0分)", value: 0, color: "emerald" },
      { label: "能买，但偶尔买错或算慢 (1分)", value: 1, color: "primary" },
      { label: "需要家人陪同去 (2分)", value: 2, color: "amber" },
      { label: "无法独立购物 (3分)", value: 3, color: "rose" },
    ],
    getValue: (r) => r.scales?.faq?.items?.[2] || 0,
    setValue: (r, val) => ({
      ...r,
      scales: {
        ...r.scales,
        faq: {
          ...r.scales.faq,
          items: { ...r.scales.faq.items, 2: Number(val) },
        },
      },
    }),
    getNextNodeId: () => "node_final_conclusion",
  },

  node_final_conclusion: {
    id: "node_final_conclusion",
    topicId: "informant",
    speaker: "ai",
    targetRole: ["patient", "examiner", "informant"],
    title: "评估全部完成 · 智能诊断预警已生成",
    promptPatient: "恭喜您！全套评估已经顺利完成啦。系统已根据您的常模自动生成了健康诊断建议与红绿灯状态。",
    promptInformant: "全套认知与日常生活评估已圆满完成，系统已生成三色预警综合报告：",
    promptExaminer: "全部 10 项核心量表数据已自动同步保存，可一键导出 Excel 或生成三甲标准报告单。",
    speechText: "恭喜您！全套评估已经顺利完成啦。系统已根据您的常模自动生成了健康诊断建议与红绿灯状态。",
    inputType: "buttons",
    options: [
      { label: "📊 查看综合评估看板", value: "view_dashboard", color: "emerald", icon: "Activity" },
      { label: "📑 导出完整 Excel 数据表", value: "export_excel", color: "primary", icon: "Download" },
      { label: "🖨️ 打印标准临床报告单", value: "print_report", color: "indigo", icon: "Printer" },
    ],
    getValue: () => "view_dashboard",
    setValue: (r) => r,
    getNextNodeId: () => null,
  },
};
