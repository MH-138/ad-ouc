/* =============================================================
 * 认知障碍早期筛查 —— 对话剧本配置文件
 * 所有量表 / 建档流程均由本文件定义，引擎通用读取。
 * 后续新增量表：在本对象中追加一项即可，无需改引擎代码。
 *
 * 题目类型 kind：
 *   choice  - 大按钮选项（带分值 score）
 *   number  - 数字输入（number 型；count:true 表示计入总分）
 *   emoji   - 5 级表情尺（0~4）
 *   timer   - 倒计时 + 数字录入（VFT / AVLT 用）
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
    { id: "name",   q: "请问怎么称呼您？（或患者姓名）", kind: "text" },
    { id: "gender", q: "性别是？", kind: "choice", options: [{label:"男",score:0},{label:"女",score:0}] },
    { id: "birth",  q: "出生年份是？（如 1958，系统自动算年龄）", kind: "number", hint: "输入 4 位年份" },
    { id: "edu",    q: "一共上了几年学？", kind: "number", hint: "年" },
    { id: "height", q: "身高大概多少？（厘米）", kind: "number", hint: "cm" },
    { id: "weight", q: "体重大概多少？（公斤）", kind: "number", hint: "kg" },
    { id: "marry",  q: "婚姻状况？", kind: "choice",
      options: [{label:"已婚",score:0},{label:"未婚",score:0},{label:"离异/丧偶",score:0}] },
    { id: "live",   q: "平时和谁一起住？", kind: "choice",
      options: [{label:"独居",score:0},{label:"与家人同住",score:0}] },
    { id: "phone",  q: "留一个方便联系家人的手机号吧？", kind: "text" }
  ]
};

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
        options:[{label:"是的",score:1},{label:"不是",score:0},{label:"偶尔",score:0.5}] }
    ],
    scoring: { type:"sum", thresholds:[
      { min:0,   max:2.0,  level:"green",  label:"正常范围：主观认知下降不明显" },
      { min:2.5, max:4.5,  level:"yellow", label:"临界：存在一定主观认知下降，建议关注" },
      { min:5.0, max:99,   level:"red",    label:"异常：主观认知下降明显，建议由医生进一步评估" }
    ]}
  },

  /* 2. HAMD 汉密尔顿抑郁量表（主试逐题，0~4 / 0~2） */
  "HAMD": {
    name: "汉密尔顿抑郁量表（17项·精简）", short: "HAMD", role: "rater",
    intro: "接下来问您几个情绪相关的问题，由我（主试）根据您的表现逐题记录。",
    items: [
      { id:"d1", q:"抑郁情绪（如何程度？0 无 → 4 极重）", kind:"number", max:4, hint:"0~4 整数" },
      { id:"d2", q:"有罪感（0 无 → 2 重度）", kind:"number", max:2, hint:"0~2 整数" },
      { id:"d3", q:"自杀倾向（0 无 → 2 极重）", kind:"number", max:2, hint:"0~2 整数" },
      { id:"d4", q:"入睡困难（0 无 → 2 极重）", kind:"number", max:2, hint:"0~2 整数" },
      { id:"d5", q:"工作与兴趣（0 正常 → 4 丧失）", kind:"number", max:4, hint:"0~4 整数" },
      { id:"d6", q:"阻滞（言语缓慢/注意力差，0 无 → 4 极重）", kind:"number", max:4, hint:"0~4 整数" },
      { id:"d7", q:"焦虑（精神性，0 无 → 4 极重）", kind:"number", max:4, hint:"0~4 整数" }
    ],
    scoring: { type:"sum", thresholds:[
      { min:0,   max:6,   level:"green",  label:"正常范围：无明显抑郁" },
      { min:7,   max:16,  level:"yellow", label:"可能有抑郁，建议持续关注" },
      { min:17,  max:99,  level:"red",    label:"肯定有抑郁，建议由医生进一步评估" }
    ]}
  },

  /* 3. HAMA 汉密尔顿焦虑量表（主试逐题，0~4） */
  "HAMA": {
    name: "汉密尔顿焦虑量表（精简）", short: "HAMA", role: "rater",
    intro: "再聊聊焦虑方面，同样由我逐题记录。",
    items: [
      { id:"a1", q:"焦虑心境（0 无 → 4 极重）", kind:"number", max:4, hint:"0~4" },
      { id:"a2", q:"紧张（0 无 → 4 极重）", kind:"number", max:4, hint:"0~4" },
      { id:"a3", q:"害怕（0 无 → 4 极重）", kind:"number", max:4, hint:"0~4" },
      { id:"a4", q:"躯体性焦虑（心悸/出汗，0 无 → 4 极重）", kind:"number", max:4, hint:"0~4" },
      { id:"a5", q:"睡眠障碍（0 无 → 4 极重）", kind:"number", max:4, hint:"0~4" }
    ],
    scoring: { type:"sum", thresholds:[
      { min:0,   max:6,   level:"green",  label:"无焦虑" },
      { min:7,   max:13,  level:"yellow", label:"可能有焦虑" },
      { min:14,  max:99,  level:"red",    label:"肯定有焦虑，建议进一步评估" }
    ]}
  },

  /* 4. MMSE 简明精神状态检查（主试提问·精简代表题） */
  "MMSE": {
    name: "简明精神状态检查（MMSE·精简）", short: "MMSE", role: "rater",
    intro: "接下来玩几个小测验，放松就好，没有对错。",
    items: [
      { id:"m1", q:"现在是哪一年？（答对得 1 分）", kind:"choice",
        options:[{label:"答对",score:1},{label:"答错",score:0}] },
      { id:"m2", q:"现在是什么季节？（答对得 1 分）", kind:"choice",
        options:[{label:"答对",score:1},{label:"答错",score:0}] },
      { id:"m3", q:"我说 3 个词，能马上重复出来吗？（0~3 个）", kind:"number", max:3, hint:"记住的词数 0~3" },
      { id:"m4", q:"100 减 7 连续减 5 次，算对几次？（0~5）", kind:"number", max:5, hint:"正确次数 0~5" },
      { id:"m5", q:"刚才那 3 个词还记得几个？（0~3）", kind:"number", max:3, hint:"回忆词数 0~3" },
      { id:"m6", q:"能正确命名钢笔和手表吗？（0~2）", kind:"number", max:2, hint:"正确命名数 0~2" },
      { id:"m7", q:"能复述『四十四只石狮子』吗？（0/1）", kind:"choice",
        options:[{label:"能",score:1},{label:"不能",score:0}] },
      { id:"m8", q:"能按指令『拿纸、对折、放桌上』吗？（0/1）", kind:"choice",
        options:[{label:"能",score:1},{label:"不能",score:0}] },
      { id:"m9", q:"能临摹一个交叠的五角星吗？（0/1）", kind:"choice",
        options:[{label:"能",score:1},{label:"不能",score:0}] }
    ],
    scoring: { type:"sum", note:"演示精简版，满分约 23，按比例映射 30 分制", thresholds:[
      { min:0,   max:16,  level:"red",    label:"认知明显受损（按教育程度需主试判断）" },
      { min:17,  max:20,  level:"yellow", label:"临界：建议结合教育程度评估" },
      { min:21,  max:99,  level:"green",  label:"基本正常（演示简化）" }
    ]}
  },

  /* 5. MoCA-B 蒙特利尔认知评估基础量表（主试·精简） */
  "MoCA-B": {
    name: "蒙特利尔认知评估基础量表（MoCA-B·精简）", short: "MoCA-B", role: "rater",
    intro: "再做几个和注意力、记忆有关的小练习。",
    items: [
      { id:"c1", q:"画钟测验：能画出 11 点 10 分的钟面吗？（0/1/2）", kind:"number", max:2, hint:"0~2" },
      { id:"c2", q:"命名动物图片（猫/狮子/犀牛），答对几个？（0~3）", kind:"number", max:3, hint:"0~3" },
      { id:"c3", q:"数字广度倒背，正确几位？（0~3）", kind:"number", max:3, hint:"0~3" },
      { id:"c4", q:"词语延迟回忆，记住几个词？（0~5）", kind:"number", max:5, hint:"0~5" },
      { id:"c5", q:"连线测验（1→A→2→B…），能完成吗？（0/1）", kind:"choice",
        options:[{label:"能",score:1},{label:"不能",score:0}] }
    ],
    scoring: { type:"sum", thresholds:[
      { min:0,   max:13,  level:"red",    label:"认知受损提示" },
      { min:14,  max:18,  level:"yellow", label:"临界：需结合教育程度" },
      { min:19,  max:99,  level:"green",  label:"基本正常（演示简化）" }
    ]}
  },

  /* 6. AVLT-H 华山记忆测验（主试口述 + 数字录入） */
  "AVLT": {
    name: "听觉词汇学习测验（AVLT-H 华山记忆测验）", short: "AVLT-H", role: "rater",
    intro: "我会念一些词，您尽量记住，念完请说出记得的词。共 3 轮。",
    items: [
      { id:"n1", q:"第 1 轮：念完词后，您回忆出几个词？（0~15）", kind:"number", max:15, hint:"即时回忆词数" },
      { id:"n2", q:"第 2 轮：又念一遍，您回忆出几个词？（0~15）", kind:"number", max:15, hint:"即时回忆词数" },
      { id:"n3", q:"第 3 轮：再次念一遍，您回忆出几个词？（0~15）", kind:"number", max:15, hint:"即时回忆词数" },
      { id:"n4", q:"（约 20 分钟后）延迟回忆：还能想起几个词？（0~15）", kind:"number", max:15, primary:true, hint:"延迟回忆词数" },
      { id:"n5", q:"再认：从一列词中认出学过的，认对几个？（0~15）", kind:"number", max:15, hint:"再认正确数" }
    ],
    scoring: { type:"primary", primaryItem:"n4", thresholds:[
      { min:0,  max:3,  level:"red",    label:"延迟回忆明显受损" },
      { min:4,  max:6,  level:"yellow", label:"延迟回忆偏低，需关注" },
      { min:7,  max:99, level:"green",  label:"延迟回忆正常" }
    ]}
  },

  /* 7. VFT 词语流畅性测试（主试计时 60 秒） */
  "VFT": {
    name: "词语流畅性测试（VFT）", short: "VFT", role: "rater",
    intro: "接下来 60 秒内，请尽可能多地说出『动物』的名字，我开始计时。",
    items: [
      { id:"v1", q:"60 秒倒计时开始，请说出动物名称（结束后录入正确词数）", kind:"timer", seconds:60,
        primary:true, hint:"倒计时结束后录入正确词数" }
    ],
    scoring: { type:"primary", primaryItem:"v1", thresholds:[
      { min:0,  max:8,  level:"red",    label:"词语流畅性明显偏低" },
      { min:9,  max:13, level:"yellow", label:"词语流畅性偏低，需关注" },
      { min:14, max:99, level:"green",  label:"词语流畅性正常" }
    ]}
  },

  /* 8. FAQ 功能活动问卷（知情者） */
  "FAQ": {
    name: "功能活动问卷（FAQ·精简）", short: "FAQ", role: "informant",
    intro: "家属您好，想了解下他/她平时处理日常事务的情况（0 完全能 → 3 完全不能）。",
    items: [
      { id:"f1", q:"能独立处理财务/算账吗？（0 能 → 3 不能）", kind:"number", max:3, hint:"0~3" },
      { id:"f2", q:"能独立购物吗？（0 能 → 3 不能）", kind:"number", max:3, hint:"0~3" },
      { id:"f3", q:"能独立做饭吗？（0 能 → 3 不能）", kind:"number", max:3, hint:"0~3" },
      { id:"f4", q:"能独立打电话吗？（0 能 → 3 不能）", kind:"number", max:3, hint:"0~3" },
      { id:"f5", q:"能独立乘坐交通工具吗？（0 能 → 3 不能）", kind:"number", max:3, hint:"0~3" }
    ],
    scoring: { type:"sum", thresholds:[
      { min:0,  max:6,  level:"green",  label:"日常功能基本正常" },
      { min:7,  max:99, level:"yellow", label:"日常功能下降，提示需关注（MCI 风险）" }
    ]}
  },

  /* 9. NPI 神经精神量表（知情者·精简） */
  "NPI": {
    name: "神经精神量表（NPI·精简）", short: "NPI", role: "informant",
    intro: "最近一个月，他/她有没有出现过以下情况？（无=0，有则录频率×严重度）",
    items: [
      { id:"p1", q:"妄想（被偷/被害感）频率（0 无 → 4 几乎每天）", kind:"number", max:4, hint:"0~4" },
      { id:"p2", q:"幻觉（看到/听到不存在的）频率（0 无 → 4）", kind:"number", max:4, hint:"0~4" },
      { id:"p3", q:"抑郁/情绪低落频率（0 无 → 4）", kind:"number", max:4, hint:"0~4" },
      { id:"p4", q:"焦虑/担心频率（0 无 → 4）", kind:"number", max:4, hint:"0~4" }
    ],
    scoring: { type:"sum", thresholds:[
      { min:0,  max:2,  level:"green",  label:"无明显神经精神症状" },
      { min:3,  max:7,  level:"yellow", label:"存在轻中度症状，建议观察" },
      { min:8,  max:99, level:"red",    label:"症状较重，建议由医生进一步评估" }
    ]}
  },

  /* 10. CDR 临床痴呆评定量表（主试+知情者·6域） */
  "CDR": {
    name: "临床痴呆评定量表（CDR·6域）", short: "CDR", role: "informant",
    intro: "最后综合评估 6 个方面，每方面按严重程度选（0 正常 / 0.5 可疑 / 1 轻度 / 2 中度 / 3 重度）。",
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
    scoring: { type:"sum", note:"CDR-SB=6域之和；Global CDR 由记忆域主导，演示按 SB 分级", thresholds:[
      { min:0,    max:0.5,  level:"green",  label:"CDR-SB 0~0.5：基本正常" },
      { min:1.0,  max:4.0,  level:"yellow", label:"CDR-SB 1~4：可疑/轻度痴呆" },
      { min:4.5,  max:99,   level:"red",    label:"CDR-SB ≥4.5：中重度，建议进一步评估" }
    ]}
  }
};
