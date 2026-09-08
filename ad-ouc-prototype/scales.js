/* =============================================================
 * 认知障碍早期筛查 —— 对话剧本配置文件
 * 所有量表 / 建档流程均由本文件定义，引擎通用读取。
 * 后续新增量表：在本对象中追加一项即可，无需改引擎代码。
 *
 * 题目类型 kind：
 *   choice  - 大按钮选项（带分值 score）
 *   number  - 数字输入（number 型；count:true 表示计入总分）
 *   emoji   - 5 级表情尺（0~4）
 *   timer   - 倒计时 + 数字录入（VFT 用）
 *   recog   - 再认九宫格点选（AVLT 用；targets + distractors 自动混排）
 *   delay   - 延迟回忆倒计时节点（到点自动进入下一项；提供演示跳过）
 *
 * 题目扩展字段：
 *   reveal  - 主试专用词表面板（受试者不可见），{ title, words:[...] }
 *   anchors - 主试评分锚点文案（HAMD/HAMA 用），{ 0:"...", 1:"...", ... }
 *
 * scoring.type:
 *   sum      - 总分 = 各题分值求和（含 emoji 0~4、count:true 的数字）
 *   primary  - 总分 = 指定主指标题（primaryItem）的录入值
 * ============================================================= */

/* ---------- 建档流程（聊天式） ---------- */
window.INTAKE = {
  id: "intake",
  name: "患者建档",
  role: "rater",
  intro: "您好呀，欢迎参加咱们的健康项目～我先简单记一下您的情况，就跟拉家常一样，很快就完事。",
  items: [
    { id: "name",   q: "请问怎么称呼您？（或患者姓名）", kind: "text", required: true, maxLength: 40 },
    { id: "gender", q: "性别是？", kind: "choice", options: [{label:"男",score:0},{label:"女",score:0}] },
    { id: "birth",  q: "出生年份是？（如 1958，系统自动算年龄）", kind: "number", min: 1900, max: new Date().getFullYear(), hint: "输入 4 位年份" },
    { id: "edu",    q: "一共上了几年学？", kind: "number", min: 0, max: 30, hint: "0~30 年" },
    { id: "height", q: "身高大概多少？（厘米）", kind: "number", min: 80, max: 230, hint: "80~230 cm" },
    { id: "weight", q: "体重大概多少？（公斤）", kind: "number", min: 20, max: 250, hint: "20~250 kg" },
    { id: "marry",  q: "婚姻状况？", kind: "choice",
      options: [{label:"已婚",score:0},{label:"未婚",score:0},{label:"离异/丧偶",score:0}] },
    { id: "live",   q: "平时和谁一起住？", kind: "choice",
      options: [{label:"独居",score:0},{label:"与家人同住",score:0}] },
    { id: "phone",  q: "留一个方便联系家人的手机号吧？（可选）", kind: "text", pattern: "^1[3-9]\\d{9}$", optional: true }
  ]
};

/* AVLT 词表（华山版常用 12 词；targets 为目标词，distractors 为干扰词） */
window.AVLT_TARGET = ["篮球","报纸","商店","医生","花园","帽子","红旗","山洞","火柴","钱包","窗户","钞票"];
window.AVLT_DISTRACTOR = ["苹果","火车","铅笔","太阳","皮鞋","电视","蜜蜂","河流","剪刀","台灯","书本","雨伞"];

/* ---------- 10 个核心量表 ---------- */
window.SCALES = {

  /* 1. SCD-Q9 主观认知下降自测表（患者自评） */
  "SCD-Q9": {
    name: "主观认知下降自测表", short: "SCD-Q9", role: "self",
    intro: "王叔叔，好多叔叔阿姨说年纪大了记性不如以前，您有这感觉吗？咱们轻松聊聊～",
    items: [
      { id:"q1", q:"您是否觉得自己的记忆力比以前差了？", kind:"choice",
        options:[{label:"是的",score:1},{label:"不是",score:0},{label:"偶尔",score:0.5}] },
      { id:"q2", q:"您是否比同龄人更容易忘事、丢三落四？", kind:"choice",
        options:[{label:"经常",score:1},{label:"偶尔",score:0.5},{label:"从不",score:0}] },
      { id:"q3", q:"您是否常忘记和别人的约定或计划？", kind:"choice",
        options:[{label:"经常",score:1},{label:"偶尔",score:0.5},{label:"从不",score:0}] },
      { id:"q4", q:"您是否觉得找词困难，话到嘴边说不出？", kind:"choice",
        options:[{label:"是的",score:1},{label:"不是",score:0},{label:"偶尔",score:0.5}] },
      { id:"q5", q:"学习新东西（如用手机）是否比以前慢？", kind:"choice",
        options:[{label:"是的",score:1},{label:"不是",score:0},{label:"偶尔",score:0.5}] },
      { id:"q6", q:"您是否曾在熟悉的地方迷路？", kind:"choice",
        options:[{label:"是的",score:1},{label:"不是",score:0},{label:"偶尔",score:0.5}] },
      { id:"q7", q:"处理复杂事务（如算账）是否更吃力？", kind:"choice",
        options:[{label:"是的",score:1},{label:"不是",score:0},{label:"偶尔",score:0.5}] },
      { id:"q8", q:"您是否担心自己会得老年痴呆？", kind:"choice",
        options:[{label:"经常",score:1},{label:"偶尔",score:0.5},{label:"从不",score:0}] },
      { id:"q9", q:"家人是否说过您记性变差了？", kind:"choice",
        options:[{label:"是的",score:1},{label:"不是",score:0},{label:"偶尔",score:0.5}] },
      /* 情景选择题（对照教师「1_AD…加上情景选择题.pdf」：9 题后追加 6 道情境题，A-E + NA） */
      { id:"s1", q:"情景题 1：和别人聊天时，您是否曾忘记对方刚说完的话、需要对方重复？", kind:"choice",
        options:[{label:"A 从不",score:0},{label:"B 很少",score:0},{label:"C 有时",score:0.5},{label:"D 经常",score:1},{label:"E 总是",score:1},{label:"NA 不适用",score:0}] },
      { id:"s2", q:"情景题 2：您是否曾反复问同一个问题、或反复讲同一件事却没意识到？", kind:"choice",
        options:[{label:"A 从不",score:0},{label:"B 很少",score:0},{label:"C 有时",score:0.5},{label:"D 经常",score:1},{label:"E 总是",score:1},{label:"NA 不适用",score:0}] },
      { id:"s3", q:"情景题 3：您是否曾忘记近期和家里人发生的事（如昨天吃了什么、谁来看过您）？", kind:"choice",
        options:[{label:"A 从不",score:0},{label:"B 很少",score:0},{label:"C 有时",score:0.5},{label:"D 经常",score:1},{label:"E 总是",score:1},{label:"NA 不适用",score:0}] },
      { id:"s4", q:"情景题 4：您是否常把常用物品（钥匙、手机、眼镜）放错地方、回头想不起来放哪了？", kind:"choice",
        options:[{label:"A 从不",score:0},{label:"B 很少",score:0},{label:"C 有时",score:0.5},{label:"D 经常",score:1},{label:"E 总是",score:1},{label:"NA 不适用",score:0}] },
      { id:"s5", q:"情景题 5：您是否曾在熟悉的地方（小区、常去的菜场）短暂迷路、想不起怎么走？", kind:"choice",
        options:[{label:"A 从不",score:0},{label:"B 很少",score:0},{label:"C 有时",score:0.5},{label:"D 经常",score:1},{label:"E 总是",score:1},{label:"NA 不适用",score:0}] },
      { id:"s6", q:"情景题 6：您是否曾忘记自己的预约或约定（如就诊、聚会），没去成？", kind:"choice",
        options:[{label:"A 从不",score:0},{label:"B 很少",score:0},{label:"C 有时",score:0.5},{label:"D 经常",score:1},{label:"E 总是",score:1},{label:"NA 不适用",score:0}] }
    ],
    scoring: { type:"sum", note:"SCD-Q9（9 题）+ 情景选择题（6 题），每题 0/0.5/1，满分 15",
      thresholds:[
      { min:0,    max:4.0,  level:"green",  label:"正常范围：主观认知下降不明显" },
      { min:4.5,  max:9.0,  level:"yellow", label:"临界：存在一定主观认知下降，建议关注" },
      { min:9.5,  max:99,   level:"red",    label:"异常：主观认知下降明显，建议由医生进一步评估" }
    ]}
  },

  /* 2. HAMD 汉密尔顿抑郁量表（主试逐题，17 项标准版） */
  "HAMD": {
    name: "汉密尔顿抑郁量表（HAM-D17 标准 17 项）", short: "HAMD", role: "rater",
    intro: "接下来问您几个情绪相关的问题。本量表为【主试模式】：由受过训练的主试根据结构化提问与临床观察逐题评分（0~4 / 0~2），不依赖受试者自评，避免表情尺误用。",
    items: [
      { id:"d1", q:"抑郁情绪（0 无 → 4 极重）", kind:"number", max:4, hint:"0~4",
        anchors:{0:"无",1:"只在问答中流露",2:"自发诉说情绪低落",3:"与环境不协调的空虚/忧郁/悲观",4:"极重，无法交谈"} },
      { id:"d2", q:"有罪感（0 无 → 4 极重）", kind:"number", max:4, hint:"0~4",
        anchors:{0:"无",1:"自责/感到拖累他人",2:"觉得自己犯大错或罪恶深重",3:"罪恶妄想",4:"伴幻觉的罪恶/谴责妄想"} },
      { id:"d3", q:"自杀（0 无 → 4 极重）", kind:"number", max:4, hint:"0~4",
        anchors:{0:"无",1:"觉得活着没意思",2:"希望自己死去/有自杀念头",3:"有自杀行为或企图",4:"持续自杀行为/积极准备"} },
      { id:"d4", q:"入睡困难（0 无 → 2 重度）", kind:"number", max:2, hint:"0~2",
        anchors:{0:"无",1:"偶发",2:"每晚均发生"} },
      { id:"d5", q:"睡眠不深（0 无 → 2 重度）", kind:"number", max:2, hint:"0~2",
        anchors:{0:"无",1:"偶发",2:"每晚均发生"} },
      { id:"d6", q:"早醒（0 无 → 2 重度）", kind:"number", max:2, hint:"0~2",
        anchors:{0:"无",1:"偶发",2:"每晚均发生"} },
      { id:"d7", q:"工作和兴趣（0 正常 → 4 丧失）", kind:"number", max:4, hint:"0~4",
        anchors:{0:"正常",1:"轻度影响",2:"重度影响",3:"不能工作",4:"完全丧失"} },
      { id:"d8", q:"阻滞（0 无 → 4 木僵）", kind:"number", max:4, hint:"0~4",
        anchors:{0:"无",1:"轻度注意迟钝",2:"明显迟滞/言语缓慢",3:"言语少/反应极慢",4:"木僵"} },
      { id:"d9", q:"激越（0 无 → 4 持续）", kind:"number", max:4, hint:"0~4",
        anchors:{0:"无",1:"轻度",2:"中度（踱步等）",3:"重度（无法安抚）",4:"持续"} },
      { id:"d10", q:"精神性焦虑（0 无 → 4 极重）", kind:"number", max:4, hint:"0~4",
        anchors:{0:"无",1:"轻度",2:"中度（过度担忧）",3:"重度",4:"极重（惊恐）"} },
      { id:"d11", q:"躯体性焦虑（0 无 → 2 重度）", kind:"number", max:2, hint:"0~2",
        anchors:{0:"无",1:"轻度（手抖/紧张）",2:"重度（震颤/出汗等）"} },
      { id:"d12", q:"胃肠道症状（0 无 → 2 重度）", kind:"number", max:2, hint:"0~2",
        anchors:{0:"无",1:"轻度（食欲/消化不适）",2:"重度（明显障碍）"} },
      { id:"d13", q:"全身症状（0 无 → 2 重度）", kind:"number", max:2, hint:"0~2",
        anchors:{0:"无",1:"轻度乏力",2:"重度（体重减轻感/不适）"} },
      { id:"d14", q:"性症状（0 无 → 2 重度）", kind:"number", max:2, hint:"0~2",
        anchors:{0:"无",1:"轻度性欲下降",2:"重度（性欲丧失）"} },
      { id:"d15", q:"疑病（0 无 → 4 妄想）", kind:"number", max:4, hint:"0~4",
        anchors:{0:"无",1:"过分关注身体",2:"疑病观念",3:"疑病妄想",4:"伴幻觉的疑病妄想"} },
      { id:"d16", q:"体重减轻（0 无 → 2 确证）", kind:"number", max:2, hint:"0~2",
        anchors:{0:"无",1:"可疑/自述减轻",2:"确证（体检或记录下降）"} },
      { id:"d17", q:"自知力（0 完整 → 2 缺乏）", kind:"number", max:2, hint:"0~2",
        anchors:{0:"自知力完整",1:"部分缺乏",2:"完全缺乏"} }
    ],
    scoring: { type:"sum", note:"HAM-D17 满分 50；阈值按 17 项标准分段",
      thresholds:[
      { min:0,   max:6,   level:"green",  label:"正常范围：无明显抑郁（HAM-D17 < 7）" },
      { min:7,   max:17,  level:"yellow", label:"可能有抑郁（HAM-D17 7~17，轻度）" },
      { min:18,  max:99,  level:"red",    label:"肯定有抑郁（HAM-D17 ≥18，中重度），建议进一步评估" }
    ]},
    dimensions: [
      { key:"emo",  name:"情绪核心", items:["d1","d2","d3"], max:12 },
      { key:"slp",  name:"睡眠",     items:["d4","d5","d6"], max:6 },
      { key:"soma", name:"躯体/认知", items:["d7","d8","d9","d10","d11","d12","d13","d14","d15","d16","d17"], max:32 }
    ]
  },

  /* 3. HAMA 汉密尔顿焦虑量表（主试逐题，14 项标准版） */
  "HAMA": {
    name: "汉密尔顿焦虑量表（HAMA-14 标准 14 项）", short: "HAMA", role: "rater",
    intro: "再聊聊焦虑方面。同样为【主试模式】：主试根据结构化提问与观察，对 14 个因子逐项评 0~4 分。",
    items: [
      { id:"a1", q:"焦虑心境（0 无 → 4 极重）", kind:"number", max:4, hint:"0~4",
        anchors:{0:"无",1:"偶发",2:"持续",3:"明显",4:"极重"} },
      { id:"a2", q:"紧张（0 无 → 4 极重）", kind:"number", max:4, hint:"0~4",
        anchors:{0:"无",1:"轻度",2:"中度",3:"明显",4:"极重"} },
      { id:"a3", q:"害怕（0 无 → 4 极重）", kind:"number", max:4, hint:"0~4",
        anchors:{0:"无",1:"轻度",2:"中度",3:"明显",4:"极重"} },
      { id:"a4", q:"失眠（0 无 → 4 极重）", kind:"number", max:4, hint:"0~4",
        anchors:{0:"无",1:"轻度",2:"中度",3:"明显",4:"极重（夜不能寐）"} },
      { id:"a5", q:"认知功能（0 无 → 4 极重）", kind:"number", max:4, hint:"0~4",
        anchors:{0:"无",1:"轻度（注意难集中）",2:"中度",3:"明显",4:"极重（无法思考）"} },
      { id:"a6", q:"抑郁心境（0 无 → 4 极重）", kind:"number", max:4, hint:"0~4",
        anchors:{0:"无",1:"轻度",2:"中度",3:"明显",4:"极重"} },
      { id:"a7", q:"肌肉系统（0 无 → 4 极重）", kind:"number", max:4, hint:"0~4",
        anchors:{0:"无",1:"轻度（酸痛/僵硬）",2:"中度",3:"明显",4:"极重"} },
      { id:"a8", q:"感觉系统（0 无 → 4 极重）", kind:"number", max:4, hint:"0~4",
        anchors:{0:"无",1:"轻度（耳鸣/视朦）",2:"中度",3:"明显",4:"极重"} },
      { id:"a9", q:"心血管系统（0 无 → 4 极重）", kind:"number", max:4, hint:"0~4",
        anchors:{0:"无",1:"轻度（心悸）",2:"中度",3:"明显",4:"极重（胸痛）"} },
      { id:"a10", q:"呼吸系统（0 无 → 4 极重）", kind:"number", max:4, hint:"0~4",
        anchors:{0:"无",1:"轻度（胸闷）",2:"中度",3:"明显",4:"极重（喘息）"} },
      { id:"a11", q:"胃肠道症状（0 无 → 4 极重）", kind:"number", max:4, hint:"0~4",
        anchors:{0:"无",1:"轻度",2:"中度",3:"明显",4:"极重"} },
      { id:"a12", q:"生殖泌尿系统（0 无 → 4 极重）", kind:"number", max:4, hint:"0~4",
        anchors:{0:"无",1:"轻度",2:"中度",3:"明显",4:"极重"} },
      { id:"a13", q:"植物神经症状（0 无 → 4 极重）", kind:"number", max:4, hint:"0~4",
        anchors:{0:"无",1:"轻度（潮红/出汗）",2:"中度",3:"明显",4:"极重"} },
      { id:"a14", q:"会谈时行为（0 无 → 4 极重）", kind:"number", max:4, hint:"0~4",
        anchors:{0:"无",1:"轻度（不安）",2:"中度",3:"明显（发抖/紧张）",4:"极重"} }
    ],
    scoring: { type:"sum", note:"HAMA-14 满分 56；阈值按 14 项标准分段",
      thresholds:[
      { min:0,   max:6,   level:"green",  label:"无焦虑（HAMA < 7）" },
      { min:7,   max:13,  level:"yellow", label:"可能有焦虑（HAMA 7~13，轻度）" },
      { min:14,  max:99,  level:"red",    label:"肯定有焦虑（HAMA ≥14，中重度），建议进一步评估" }
    ]},
    dimensions: [
      { key:"psy",  name:"精神性焦虑", items:["a1","a2","a3","a4","a5","a6"], max:24 },
      { key:"soma", name:"躯体性焦虑", items:["a7","a8","a9","a10","a11","a12","a13","a14"], max:32 }
    ]
  },

  /* 4. MMSE 简明精神状态检查（Folstein 标准 30 分版） */
  "MMSE": {
    name: "简明精神状态检查（MMSE·标准 30 分）", short: "MMSE", role: "rater",
    intro: "接下来玩几个小测验，放松就好，没有对错。这是标准 MMSE 30 分版，包含定向、记忆、注意、语言与视空间多个维度。",
    items: [
      /* 时间定向 5 分 */
      { id:"m1", q:"现在是哪一年？（答对 1 分）", kind:"choice", options:[{label:"答对",score:1},{label:"答错",score:0}] },
      { id:"m2", q:"现在是什么季节？（答对 1 分）", kind:"choice", options:[{label:"答对",score:1},{label:"答错",score:0}] },
      { id:"m3", q:"今天是几号/日期？（答对 1 分）", kind:"choice", options:[{label:"答对",score:1},{label:"答错",score:0}] },
      { id:"m4", q:"今天是星期几？（答对 1 分）", kind:"choice", options:[{label:"答对",score:1},{label:"答错",score:0}] },
      { id:"m5", q:"现在是几月？（答对 1 分）", kind:"choice", options:[{label:"答对",score:1},{label:"答错",score:0}] },
      /* 地点定向 5 分 */
      { id:"m6", q:"我们现在在哪个国家？（答对 1 分）", kind:"choice", options:[{label:"答对",score:1},{label:"答错",score:0}] },
      { id:"m7", q:"在哪个省/市？（答对 1 分）", kind:"choice", options:[{label:"答对",score:1},{label:"答错",score:0}] },
      { id:"m8", q:"在哪个城市？（答对 1 分）", kind:"choice", options:[{label:"答对",score:1},{label:"答错",score:0}] },
      { id:"m9", q:"这里是什么机构/医院？（答对 1 分）", kind:"choice", options:[{label:"答对",score:1},{label:"答错",score:0}] },
      { id:"m10", q:"是第几层/哪个科室？（答对 1 分）", kind:"choice", options:[{label:"答对",score:1},{label:"答错",score:0}] },
      /* 登记 3 分 */
      { id:"m11", q:"请重复这三个词：皮球、国旗、树木。请复述『皮球』（对 1 分）", kind:"choice", options:[{label:"能复述",score:1},{label:"不能",score:0}] },
      { id:"m12", q:"请复述『国旗』（对 1 分）", kind:"choice", options:[{label:"能复述",score:1},{label:"不能",score:0}] },
      { id:"m13", q:"请复述『树木』（对 1 分）", kind:"choice", options:[{label:"能复述",score:1},{label:"不能",score:0}] },
      /* 注意与计算 5 分 */
      { id:"m14", q:"从 100 连续减 7，算对几次？（0~5 次，每次 1 分）", kind:"number", max:5, hint:"正确次数 0~5" },
      /* 延迟回忆 3 分 */
      { id:"m15", q:"刚才让您记住的三个词，现在还记得几个？（0~3）", kind:"number", max:3, hint:"回忆词数 0~3" },
      /* 命名 2 分 */
      { id:"m16", q:"这是什么东西？（出示钢笔，答对 1 分）", kind:"choice", options:[{label:"答对",score:1},{label:"答错",score:0}] },
      { id:"m17", q:"这是什么？（出示手表，答对 1 分）", kind:"choice", options:[{label:"答对",score:1},{label:"答错",score:0}] },
      /* 复述 1 分 */
      { id:"m18", q:"请重复『四十四只石狮子』（对 1 分）", kind:"choice", options:[{label:"能",score:1},{label:"不能",score:0}] },
      /* 三步指令 3 分 */
      { id:"m19", q:"请拿起这张纸（完成 1 分）", kind:"choice", options:[{label:"完成",score:1},{label:"未完成",score:0}] },
      { id:"m20", q:"请把纸对折（完成 1 分）", kind:"choice", options:[{label:"完成",score:1},{label:"未完成",score:0}] },
      { id:"m21", q:"请把纸放在腿上（完成 1 分）", kind:"choice", options:[{label:"完成",score:1},{label:"未完成",score:0}] },
      /* 阅读 1 分 */
      { id:"m22", q:"请读这句话并按要求做：『闭上你的眼睛』（执行 1 分）", kind:"choice", options:[{label:"执行",score:1},{label:"未执行",score:0}] },
      /* 书写 1 分 */
      { id:"m23", q:"请写一句完整的句子（有主谓 1 分）", kind:"choice", options:[{label:"完成",score:1},{label:"未完成",score:0}] },
      /* 临摹 1 分 */
      { id:"m24", q:"请临摹两个相交的五角星（对 1 分）", kind:"choice", options:[{label:"能",score:1},{label:"不能",score:0}] }
    ],
    scoring: { type:"sum", note:"标准 MMSE 满分 30；阈值按教育程度需主试综合判断（演示用固定分段）", thresholds:[
      { min:27,  max:99,  level:"green",  label:"基本正常（MMSE ≥ 27，演示简化）" },
      { min:21,  max:26,  level:"yellow", label:"临界：轻度认知受损（MMSE 21~26），建议结合教育程度" },
      { min:0,   max:20,  level:"red",    label:"认知明显受损（MMSE ≤ 20）" }
    ]},
    dimensions: [
      { key:"ort_t", name:"时间定向", items:["m1","m2","m3","m4","m5"], max:5 },
      { key:"ort_p", name:"地点定向", items:["m6","m7","m8","m9","m10"], max:5 },
      { key:"mem",   name:"记忆/注意", items:["m11","m12","m13","m14","m15"], max:11 },
      { key:"lang",  name:"语言与视空间", items:["m16","m17","m18","m19","m20","m21","m22","m23","m24"], max:9 }
    ]
  },

  /* 5. MoCA-B 蒙特利尔认知评估基础量表（主试·Nasreddine 标准子测验） */
  "MoCA-B": {
    name: "蒙特利尔认知评估基础量表（MoCA-B·标准）", short: "MoCA-B", role: "rater",
    intro: "再做几个涵盖视空间、记忆、注意、语言、抽象与定向的小练习。满分约 30 分（若受教育≤12 年可加 1 分，演示版需主试手判）。",
    items: [
      /* 视空间与执行（5 分） */
      { id:"c1", q:"立方体临摹：照着画一个三维立方体（对 1 分）", kind:"number", max:1, hint:"0~1" },
      { id:"c2", q:"画钟测验：画出 11 点 10 分（轮廓1+数字1+指针1，共 0~3）", kind:"number", max:3, hint:"0~3" },
      { id:"c5", q:"连线测验：按 1→A→2→B→3→C→4→D→5→E 顺序连（对 1 分）", kind:"number", max:1, hint:"0~1" },
      /* 命名（3 分） */
      { id:"c3", q:"命名：依次指出狮子、犀牛、骆驼，答对几个？（0~3）", kind:"number", max:3, hint:"0~3" },
      /* 注意（6 分） */
      { id:"c4", q:"数字广度倒背：如主试念 2-4-9，您倒着说 9-4-2，正确几位？（0~2）", kind:"number", max:2, hint:"0~2" },
      { id:"c6a", q:"警觉性：听一段话里每次出现『啊』就拍手，正确几次？（0~1）", kind:"number", max:1, hint:"0~1" },
      { id:"c6b", q:"连续减 7：从 100 起连减，算对几次？（0~3）", kind:"number", max:3, hint:"0~3" },
      /* 语言（3 分） */
      { id:"c7", q:"句子复述：只听过一次后复述『他刚到火车站』和『我每天早上去公园散步』，正确几句？（0~2）", kind:"number", max:2, hint:"0~2" },
      { id:"c8", q:"词语流畅：1 分钟内说出以『动物』开头的词，≥11 个得 1 分（0/1）", kind:"number", max:1, hint:"0~1" },
      /* 抽象（2 分） */
      { id:"c9", q:"抽象：说出『香蕉—橘子』『火车—自行车』的相似之处，正确几对？（0~2）", kind:"number", max:2, hint:"0~2" },
      /* 延迟回忆（5 分，不计入编码） */
      { id:"c10", q:"延迟回忆：刚才记过的 5 个词现在能想起几个？（0~5）", kind:"number", max:5, hint:"0~5" },
      /* 定向（6 分） */
      { id:"c11", q:"定向：能答对年/季/月/日/星期/地点 共几项？（0~6）", kind:"number", max:6, hint:"0~6" }
    ],
    scoring: { type:"sum", note:"MoCA-B 满分约 29（子测验和）；标准 cutoff 26，演示按 29 缩放",
      thresholds:[
      { min:0,   max:17,  level:"red",    label:"认知受损提示（MoCA ≤17）" },
      { min:18,  max:23,  level:"yellow", label:"临界：需结合教育年限判断" },
      { min:24,  max:99,  level:"green",  label:"基本正常（MoCA ≥24，演示简化）" }
    ]},
    dimensions: [
      { key:"vis",  name:"视空间与执行", items:["c1","c2","c5"], max:5 },
      { key:"nam",  name:"命名",         items:["c3"],          max:3 },
      { key:"att",  name:"注意",         items:["c4","c6a","c6b"], max:6 },
      { key:"lang", name:"语言",         items:["c7","c8"],      max:3 },
      { key:"abs",  name:"抽象",         items:["c9"],          max:2 },
      { key:"mem",  name:"延迟回忆",     items:["c10"],         max:5 },
      { key:"ort",  name:"定向",         items:["c11"],         max:6 }
    ]
  },

  /* 6. AVLT-H 华山记忆测验（防泄题 + 延迟回忆 + 再认） */
  "AVLT": {
    name: "听觉词汇学习测验（AVLT-H 华山记忆测验）", short: "AVLT-H", role: "rater",
    intro: "我会（由主试）朗读一些词，受试者尽量记住。注意：词表仅主试可见，受试者全程看不到，以保证测验有效。共 3 次学习 + 干扰 + 延迟回忆 + 再认。",
    items: [
      { id:"t1", q:"第 1 次学习：请主试朗读词表后让受试者回忆，记录正确回忆词数（0~12）", kind:"number", max:12,
        hint:"即时回忆词数", reveal:{ title:"目标词表（主试专用·受试者不可见）", words:window.AVLT_TARGET } },
      { id:"t2", q:"第 2 次学习：再朗读一遍，记录回忆词数（0~12）", kind:"number", max:12,
        hint:"即时回忆词数", reveal:{ title:"目标词表（主试专用·受试者不可见）", words:window.AVLT_TARGET } },
      { id:"t3", q:"第 3 次学习：再次朗读，记录回忆词数（0~12）", kind:"number", max:12,
        hint:"即时回忆词数", reveal:{ title:"目标词表（主试专用·受试者不可见）", words:window.AVLT_TARGET } },
      { id:"t4", q:"干扰列表立即回忆：朗读干扰词表，记录受试者回忆词数（0~12）", kind:"number", max:12,
        hint:"干扰回忆词数", reveal:{ title:"干扰词表（主试专用·受试者不可见）", words:window.AVLT_DISTRACTOR } },
      { id:"delay", q:"延迟回忆前等待：请受试者在此期间完成非言语任务（如画钟、连线）。计时结束后自动进入延迟回忆。",
        kind:"delay", seconds:1200, demoSeconds:15, hint:"临床约 20 分钟" },
      { id:"n4", q:"延迟回忆（约 20 分钟后）：受试者能想起几个目标词？（0~12）", kind:"number", max:12,
        primary:true, hint:"延迟回忆词数" },
      { id:"n5", q:"再认：请指出下列词中哪些出现在最初学习的词表里（点选，可多选）", kind:"recog",
        targets:window.AVLT_TARGET, distractors:window.AVLT_DISTRACTOR }
    ],
    scoring: { type:"primary", primaryItem:"n4", thresholds:[
      { min:0,  max:3,  level:"red",    label:"延迟回忆明显受损（<4 个）" },
      { min:4,  max:6,  level:"yellow", label:"延迟回忆偏低，需关注（4~6 个）" },
      { min:7,  max:99, level:"green",  label:"延迟回忆正常（≥7 个）" }
    ]}
  },

  /* 7. VFT 词语流畅性测试（主试计时 60 秒，对照教师「15s 分段」要求） */
  "VFT": {
    name: "词语流畅性测试（VFT）", short: "VFT", role: "rater",
    intro: "接下来 60 秒内，请尽可能多地说出『动物』的名字，我开始计时。计时结束后先录总词数，再按 15 秒一段补录分段词数（用于趋势分析，不重复计分）。",
    items: [
      { id:"v1", q:"60 秒倒计时开始，请说出动物名称（结束后录入正确词数）", kind:"timer", seconds:60,
        primary:true, hint:"倒计时结束后录入正确词数" },
      { id:"v2", q:"分段 1：第 0~15 秒说出几个动物？（仅记录，不计入总分）", kind:"number", max:20, count:false, hint:"0~20" },
      { id:"v3", q:"分段 2：第 16~30 秒说出几个动物？（仅记录）", kind:"number", max:20, count:false, hint:"0~20" },
      { id:"v4", q:"分段 3：第 31~45 秒说出几个动物？（仅记录）", kind:"number", max:20, count:false, hint:"0~20" },
      { id:"v5", q:"分段 4：第 46~60 秒说出几个动物？（仅记录）", kind:"number", max:20, count:false, hint:"0~20" }
    ],
    scoring: { type:"primary", primaryItem:"v1", thresholds:[
      { min:0,  max:8,  level:"red",    label:"词语流畅性明显偏低" },
      { min:9,  max:13, level:"yellow", label:"词语流畅性偏低，需关注" },
      { min:14, max:99, level:"green",  label:"词语流畅性正常" }
    ]}
  },

  /* 8. FAQ 功能活动问卷（知情者·Pfeffer 1982 标准 10 项） */
  "FAQ": {
    name: "功能活动问卷（FAQ·Pfeffer 10 项）", short: "FAQ", role: "informant",
    intro: "家属您好，想了解下他/她平时处理日常事务的能力（0 完全能 → 3 完全不能；NA 可填 0）。共 10 项。",
    items: [
      { id:"f1",  q:"能否使用电话（含查号、拨号）？（0 能 → 3 不能）", kind:"number", max:3, hint:"0~3" },
      { id:"f2",  q:"能否去熟悉的地方购买日常用品？（0 能 → 3 不能）", kind:"number", max:3, hint:"0~3" },
      { id:"f3",  q:"能否准备饭菜？（0 能 → 3 不能）", kind:"number", max:3, hint:"0~3" },
      { id:"f4",  q:"能否料理家务（打扫、整理）？（0 能 → 3 不能）", kind:"number", max:3, hint:"0~3" },
      { id:"f5",  q:"能否洗衣服？（0 能 → 3 不能）", kind:"number", max:3, hint:"0~3" },
      { id:"f6",  q:"能否使用交通工具（独自搭车/开车）？（0 能 → 3 不能）", kind:"number", max:3, hint:"0~3" },
      { id:"f7",  q:"能否对财务负责（管钱、付账）？（0 能 → 3 不能）", kind:"number", max:3, hint:"0~3" },
      { id:"f8",  q:"能否按医嘱服药？（0 能 → 3 不能）", kind:"number", max:3, hint:"0~3" },
      { id:"f9",  q:"能否处理突发事件（如家里有人生病、东西坏了）？（0 能 → 3 不能）", kind:"number", max:3, hint:"0~3" },
      { id:"f10", q:"能否记住约会、事件或服药时间？（0 能 → 3 不能）", kind:"number", max:3, hint:"0~3" }
    ],
    scoring: { type:"sum", note:"FAQ 满分 30（10 项×0~3）；NA 按 0 计",
      thresholds:[
      { min:0,   max:6,   level:"green",  label:"日常功能基本正常" },
      { min:7,   max:15,  level:"yellow", label:"日常功能下降，提示需关注（MCI 风险）" },
      { min:16,  max:99,  level:"red",    label:"日常功能明显受损，建议由医生进一步评估" }
    ]},
    dimensions: [
      { key:"iadl", name:"工具性日常生活能力", items:["f1","f2","f3","f4","f5","f6","f7","f8","f9","f10"], max:30 }
    ]
  },

  /* 9. NPI 神经精神量表（知情者·Cummings 12 域，频率×严重度） */
  "NPI": {
    name: "神经精神量表（NPI·12 域）", short: "NPI", role: "informant",
    intro: "家属您好，问最近一个月他/她是否出现过以下情况。无=填0；有则填「频率(1偶尔/2经常/3频繁/4几乎每天) × 严重度(1轻/2中/3重)」的乘积（1~12）。",
    items: [
      { id:"p1",  q:"妄想（被偷/被害/被人算计感）", kind:"number", max:12, hint:"0 无 / 1~12" },
      { id:"p2",  q:"幻觉（看到或听到不存在的人/物）", kind:"number", max:12, hint:"0 无 / 1~12" },
      { id:"p3",  q:"激越/攻击（易怒、言语或身体攻击）", kind:"number", max:12, hint:"0 无 / 1~12" },
      { id:"p4",  q:"抑郁/心境恶劣（情绪低落、兴趣减退）", kind:"number", max:12, hint:"0 无 / 1~12" },
      { id:"p5",  q:"焦虑（担心、紧张、害怕）", kind:"number", max:12, hint:"0 无 / 1~12" },
      { id:"p6",  q:"情感高涨/欣快（异常开心、得意）", kind:"number", max:12, hint:"0 无 / 1~12" },
      { id:"p7",  q:"淡漠（对事物缺乏兴趣、主动性下降）", kind:"number", max:12, hint:"0 无 / 1~12" },
      { id:"p8",  q:"脱抑制（言行随便、不顾场合）", kind:"number", max:12, hint:"0 无 / 1~12" },
      { id:"p9",  q:"易激惹/情绪不稳（波动大、小事发火）", kind:"number", max:12, hint:"0 无 / 1~12" },
      { id:"p10", q:"异常运动行为（重复动作、坐立不安）", kind:"number", max:12, hint:"0 无 / 1~12" },
      { id:"p11", q:"睡眠/夜间行为（昼夜颠倒、夜醒）", kind:"number", max:12, hint:"0 无 / 1~12" },
      { id:"p12", q:"进食障碍（食欲改变、暴食/拒食）", kind:"number", max:12, hint:"0 无 / 1~12" }
    ],
    scoring: { type:"sum", note:"NPI 总分 = 各域(频率×严重度)之和，满分 144",
      thresholds:[
      { min:0,   max:3,   level:"green",  label:"无明显神经精神症状" },
      { min:4,   max:12,  level:"yellow", label:"存在轻中度症状，建议观察" },
      { min:13,  max:99,  level:"red",    label:"症状较重，建议由医生进一步评估" }
    ]},
    dimensions: [
      { key:"psy", name:"精神行为", items:["p1","p2","p3"], max:36 },
      { key:"emo", name:"情绪",     items:["p4","p5","p6"], max:36 },
      { key:"beh", name:"行为/睡眠/进食", items:["p7","p8","p9","p10","p11","p12"], max:72 }
    ]
  },

  /* 10. CDR 临床痴呆评定量表（主试+知情者·6域，含 Global 规则） */
  "CDR": {
    name: "临床痴呆评定量表（CDR·6域 + Global）", short: "CDR", role: "informant",
    intro: "最后综合评估 6 个方面，每方面按严重程度选（0 正常 / 0.5 可疑 / 1 轻度 / 2 中度 / 3 重度）。完成后将按华盛顿大学规则给出 Global CDR。",
    items: [
      { id:"r1", q:"记忆", kind:"choice",
        options:[{label:"正常 0",score:0},{label:"可疑 0.5",score:0.5},{label:"轻度 1",score:1},{label:"中度 2",score:2},{label:"重度 3",score:3}] },
      { id:"r2", q:"定向力", kind:"choice",
        options:[{label:"正常 0",score:0},{label:"可疑 0.5",score:0.5},{label:"轻度 1",score:1},{label:"中度 2",score:2},{label:"重度 3",score:3}] },
      { id:"r3", q:"判断与解决问题", kind:"choice",
        options:[{label:"正常 0",score:0},{label:"可疑 0.5",score:0.5},{label:"轻度 1",score:1},{label:"中度 2",score:2},{label:"重度 3",score:3}] },
      { id:"r4", q:"社会事务", kind:"choice",
        options:[{label:"正常 0",score:0},{label:"可疑 0.5",score:0.5},{label:"轻度 1",score:1},{label:"中度 2",score:2},{label:"重度 3",score:3}] },
      { id:"r5", q:"家庭爱好", kind:"choice",
        options:[{label:"正常 0",score:0},{label:"可疑 0.5",score:0.5},{label:"轻度 1",score:1},{label:"中度 2",score:2},{label:"重度 3",score:3}] },
      { id:"r6", q:"个人照料", kind:"choice",
        options:[{label:"正常 0",score:0},{label:"可疑 0.5",score:0.5},{label:"轻度 1",score:1},{label:"中度 2",score:2},{label:"重度 3",score:3}] }
    ],
    scoring: { type:"sum", note:"CDR-SB=6域之和；Global CDR 由记忆域主导（华盛顿大学规则，见引擎 cdrGlobal）", thresholds:[
      { min:0,    max:0.5,  level:"green",  label:"CDR-SB 0~0.5" },
      { min:1.0,  max:4.0,  level:"yellow", label:"CDR-SB 1~4" },
      { min:4.5,  max:99,   level:"red",    label:"CDR-SB ≥4.5" }
    ]},
    dimensions: [
      { key:"r1", name:"记忆", items:["r1"], max:3 },
      { key:"r2", name:"定向力", items:["r2"], max:3 },
      { key:"r3", name:"判断与解决问题", items:["r3"], max:3 },
      { key:"r4", name:"社会事务", items:["r4"], max:3 },
      { key:"r5", name:"家庭爱好", items:["r5"], max:3 },
      { key:"r6", name:"个人照料", items:["r6"], max:3 }
    ]
  }
};
