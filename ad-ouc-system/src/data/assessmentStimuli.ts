// Assessment stimulus constants and reference materials

export const BOSTON_NAMING_STIMULI = [
  { id: 2, name: "树", category: "植物", semanticCue: "植物", multiChoice: ["桃花", "树", "烟花"] },
  { id: 3, name: "笔", category: "文具", semanticCue: "用来书写", multiChoice: ["吸管", "圆珠笔", "笔"] },
  { id: 6, name: "剪刀", category: "工具", semanticCue: "工具/裁纸", multiChoice: ["剪刀", "钳", "匙羹"] },
  { id: 8, name: "花", category: "植物", semanticCue: "植物/花园里生长", multiChoice: ["蔬菜", "草帽", "花"] },
  { id: 9, name: "锯子", category: "木工器材", semanticCue: "木工器材", multiChoice: ["机关枪", "锯子", "刀"] },
  { id: 12, name: "扫把", category: "清洁用具", semanticCue: "用来清洁", multiChoice: ["拖布", "毛笔", "扫把"] },
  { id: 14, name: "冬菇/蘑菇", category: "食物", semanticCue: "食物/吃的东西", multiChoice: ["冬菇", "花菜", "雨伞"] },
  { id: 15, name: "衣架", category: "日用品", semanticCue: "衣柜内有/挂衣服", multiChoice: ["屋顶", "衣架", "勾"] },
  { id: 16, name: "轮椅", category: "医疗辅助", semanticCue: "病人用/推着走", multiChoice: ["大班椅", "手推车", "轮椅"] },
  { id: 17, name: "骆驼", category: "动物", semanticCue: "沙漠里的动物", multiChoice: ["骆驼", "山", "牛"] },
  { id: 21, name: "羽毛球拍", category: "运动用品", semanticCue: "运动用品/打球", multiChoice: ["乒乓球拍", "羽毛球拍", "镜子"] },
  { id: 22, name: "蜗牛", category: "动物", semanticCue: "背着壳爬行的动物", multiChoice: ["蜗牛", "鱿鱼", "蚬"] },
  { id: 24, name: "海马", category: "海洋生物", semanticCue: "海洋生物", multiChoice: ["勾", "鲍鱼", "海马"] },
  { id: 25, name: "飞镖", category: "运动娱乐", semanticCue: "用来投掷/射靶", multiChoice: ["标靶", "飞镖", "火箭"] },
  { id: 30, name: "口琴", category: "乐器", semanticCue: "吹奏乐器", multiChoice: ["口琴", "冷气机", "笛子"] },
  { id: 31, name: "犀牛", category: "动物", semanticCue: "角长在鼻上的大型动物", multiChoice: ["罐头刀", "河马", "犀牛"] },
  { id: 33, name: "冰屋", category: "建筑", semanticCue: "爱斯基摩人居住的冰房", multiChoice: ["冰屋", "草房", "坟墓"] },
  { id: 36, name: "仙人掌", category: "植物", semanticCue: "沙漠里带刺的植物", multiChoice: ["铁树", "仙人掌", "叉"] },
  { id: 37, name: "扶手电梯", category: "交通设施", semanticCue: "上下楼梯电动用的", multiChoice: ["切片面包", "滑梯", "扶手电梯"] },
  { id: 38, name: "竖琴", category: "乐器", semanticCue: "大型拨弦乐器", multiChoice: ["竖琴", "落地灯", "钢琴"] },
  { id: 42, name: "听诊器", category: "医疗器材", semanticCue: "医生用来听心跳的", multiChoice: ["耳筒", "听诊器", "血压计"] },
  { id: 43, name: "金字塔", category: "古迹", semanticCue: "在埃及找到的古建筑", multiChoice: ["粽子", "狮身人面像", "金字塔"] },
  { id: 46, name: "漏斗", category: "用具", semanticCue: "倒水/装油用的尖口器具", multiChoice: ["漏斗", "雪糕筒", "泵"] },
  { id: 47, name: "手风琴", category: "乐器", semanticCue: "拉动波纹箱的乐器", multiChoice: ["口琴", "手风琴", "百叶窗"] },
  { id: 50, name: "圆规", category: "文具", semanticCue: "绘画/画圆圈工具", multiChoice: ["药棉钳", "尺子", "圆规"] },
  { id: 52, name: "三脚架", category: "摄影用具", semanticCue: "摄影/架相机用", multiChoice: ["三脚架", "机械手臂", "画架"] },
  { id: 54, name: "钳子", category: "工具", semanticCue: "夹东西/拔钉子用具", multiChoice: ["锅铲", "钳", "独木舟"] },
  { id: 57, name: "花棚/棚架", category: "园艺", semanticCue: "公园种植爬藤植物的棚", multiChoice: ["棚架", "垃圾筒", "网"] },
  { id: 59, name: "量角器", category: "文具", semanticCue: "测角度用的半圆文具", multiChoice: ["磅秤", "三角尺", "量角器"] },
  { id: 60, name: "算盘", category: "计算工具", semanticCue: "拨算珠计数的工具", multiChoice: ["计算器", "算盘", "门帘"] },
];

export const AVLT_WORDS_12 = [
  "大衣", "司机", "海棠", "木工", "长裤", "百合",
  "头巾", "腊梅", "士兵", "玉兰", "律师", "手套"
];

export const AVLT_RECOGNITION_24 = [
  { word: "腊梅", original: true, category: "花朵类" },
  { word: "海棠", original: true, category: "花朵类" },
  { word: "玉兰", original: true, category: "花朵类" },
  { word: "百合", original: true, category: "花朵类" },
  { word: "律师", original: true, category: "职业类" },
  { word: "司机", original: true, category: "职业类" },
  { word: "士兵", original: true, category: "职业类" },
  { word: "木工", original: true, category: "职业类" },
  { word: "长裤", original: true, category: "服饰类" },
  { word: "手套", original: true, category: "服饰类" },
  { word: "头巾", original: true, category: "服饰类" },
  { word: "大衣", original: true, category: "服饰类" },
  { word: "士兵", original: true, category: "再认混淆项" },
  { word: "纽扣", original: false, category: "干扰词" },
  { word: "百合", original: true, category: "再认混淆项" },
  { word: "西装", original: false, category: "干扰词" },
  { word: "耳环", original: false, category: "干扰词" },
  { word: "玉兰", original: true, category: "再认混淆项" },
  { word: "主任", original: false, category: "干扰词" },
  { word: "荷花", original: false, category: "干扰词" },
  { word: "头巾", original: true, category: "再认混淆项" },
  { word: "司机", original: true, category: "再认混淆项" },
  { word: "皮鞋", original: false, category: "干扰词" },
  { word: "玉米", original: false, category: "干扰词" },
];

export const LOGICAL_MEMORY_STORY = {
  text: "星期一晚上 6 点，深圳市民王建国正在看电视并打算穿外套出门，一则天气预报打断了他的出行计划，天气预报员提醒市民未来 2-3 小时深圳及周边地区将会有暴风雨来袭，并持续到明天早上。这次暴风雨将会为深圳市带来冰雹和多达 1 米的降雨量，气温会下降 15 摄氏度。王建国决定待在家里。他脱掉了外套，并坐下来看电视。",
  units: [
    { id: 1, name: "6点钟", criterion: "需要提到6点钟" },
    { id: 2, name: "星期一", criterion: "需要提到周一/星期一" },
    { id: 3, name: "晚上", criterion: "需要提到晚上" },
    { id: 4, name: "王", criterion: "需要提到王姓" },
    { id: 5, name: "建国", criterion: "需要提到建国" },
    { id: 6, name: "深圳", criterion: "需要提到深圳" },
    { id: 7, name: "看电视", criterion: "表明他正在看电视" },
    { id: 8, name: "穿外套", criterion: "表明他正在换衣服/穿外套" },
    { id: 9, name: "出门", criterion: "表明他正要出门/准备走" },
    { id: 10, name: "天气预报", criterion: "表明有关于天气的报导" },
    { id: 11, name: "改变出行计划", criterion: "表明出行计划的中断" },
    { id: 12, name: "提醒暴风雨", criterion: "表明有暴风雨的提醒" },
    { id: 13, name: "深圳周边地区", criterion: "表明周边地区将迎来暴风雨" },
    { id: 14, name: "在未来2-3小时", criterion: "意指两到三小时的短句" },
    { id: 15, name: "持续到早上", criterion: "表明暴风雨将持续到明天早上" },
    { id: 16, name: "预报员说", criterion: "表明有人在报告/预报" },
    { id: 17, name: "带来冰雹", criterion: "表明可能有冰雹" },
    { id: 18, name: "多达1米", criterion: "需要提到一米" },
    { id: 19, name: "雨", criterion: "需要提到雨/降雨量" },
    { id: 20, name: "气温下降", criterion: "表明气温将会下降" },
    { id: 21, name: "15摄氏度", criterion: "需要提到下降15摄氏度" },
    { id: 22, name: "决定待在家里", criterion: "表明他决定呆在家里/屋内" },
    { id: 23, name: "脱掉了外套", criterion: "表明他脱掉了外面一层衣服" },
    { id: 24, name: "坐下", criterion: "表明他坐下" },
    { id: 25, name: "看电视", criterion: "表明主人公决定继续看电视/老电影" },
  ],
};

export const EDINBURGH_HANDEDNESS_ITEMS = [
  { key: "writing", name: "1. 写字" },
  { key: "drawing", name: "2. 画画" },
  { key: "throwing", name: "3. 扔东西" },
  { key: "scissors", name: "4. 用剪子" },
  { key: "brushing", name: "5. 刷牙" },
  { key: "knife", name: "6. 用刀子" },
  { key: "spoon", name: "7. 用勺子" },
  { key: "comb", name: "8. 梳头" },
  { key: "match", name: "9. 划火柴" },
  { key: "bottleCap", name: "10. 打开瓶盖" },
];

export const GDS15_ITEMS = [
  { id: 1, text: "1. 你对你的生活基本满意吗？", reverse: true },
  { id: 2, text: "2. 你是否已经放弃了许多爱好与兴趣？", reverse: false },
  { id: 3, text: "3. 你是否觉得生活空虚？", reverse: false },
  { id: 4, text: "4. 你是否感到厌倦？", reverse: false },
  { id: 5, text: "5. 你是否大部分时间精力充沛？", reverse: true },
  { id: 6, text: "6. 你是否害怕会有不幸的事落到你头上？", reverse: false },
  { id: 7, text: "7. 你是否大部分时间感到幸福？", reverse: true },
  { id: 8, text: "8. 你是否经常感到孤立无援？", reverse: false },
  { id: 9, text: "9. 你是否愿意呆在家里而不愿去室外做些新鲜事？", reverse: false },
  { id: 10, text: "10. 你是否觉得记忆力比以前差？", reverse: false },
  { id: 11, text: "11. 你觉得现在活着很开心吗？", reverse: true },
  { id: 12, text: "12. 你是否觉得像现在这样活着毫无意义？", reverse: false },
  { id: 13, text: "13. 你觉得生活充满活力吗？", reverse: true },
  { id: 14, text: "14. 你是否觉得你的处境已毫无希望？", reverse: false },
  { id: 15, text: "15. 你是否觉得大多数人比你强得多？", reverse: false },
];

export const FAQ_ITEMS = [
  "1. 使用电话或手机",
  "2. 整理家庭物品井井有条、不凌乱",
  "3. 自行购物（如购买衣服、食品及家庭用品）",
  "4. 参加需技巧性的游戏或活动（如打扑克、下棋、打麻将、绘画、摄影等）",
  "5. 使用各种电器（如电视、空调、微波炉、电饭煲）",
  "6. 准备和烧一顿饭菜（包括加工蔬菜、使用炉子、调味品用量恰当）",
  "7. 关心和了解新鲜事物（国家大事或邻里中发生的重要事情）",
  "8. 持续一小时以上注意力集中地看电视或小说，或收听广播并能理解讨论",
  "9. 记得重要的时间点（如领退休金日期、按时服药、接送幼儿等）",
  "10. 独自外出活动或走亲访友（指较远距离、如相当于三站公共车辆距离）",
];

export const NPI_ITEMS = [
  { id: 1, name: "妄想", desc: "错误的观念，如认为别人偷东西、有人害他、配偶不忠等" },
  { id: 2, name: "幻觉", desc: "看到或听到不存在的东西或声音，和实际不存在的人说话" },
  { id: 3, name: "激越/攻击性", desc: "拒绝别人的帮助、固执、向别人大喊大叫、大骂等" },
  { id: 4, name: "抑郁/心境恶劣", desc: "说或表现出伤心、情绪低落、哭泣" },
  { id: 5, name: "焦虑", desc: "与照料者分开后不安、精神紧张、呼吸急促、叹气、过度担心" },
  { id: 6, name: "情感高涨/欣快", desc: "过于高兴、感觉过于良好、不合时宜的大笑或幽默" },
  { id: 7, name: "情感淡漠", desc: "对以往活动丧失兴趣、对他人计划漠不关心、自发活动减少" },
  { id: 8, name: "脱抑制", desc: "行为突兀，如与陌生人搭讪自来熟、不顾及他人感受说粗话" },
  { id: 9, name: "易激惹/情绪不稳", desc: "不耐烦、对延误无法忍受、突然暴躁" },
  { id: 10, name: "异常运动行为", desc: "反复进行无意义活动，如转圈、摆弄纽扣、无目的多动" },
  { id: 11, name: "睡眠/夜间行为", desc: "夜间把别人弄醒、过早起床、白天频繁打瞌睡" },
  { id: 12, name: "食欲和进食障碍", desc: "体重异常增减、口味偏好发生显著改变" },
];

export const ECOG_ITEMS = [
  "1. 记得自己把东西放在哪里",
  "2. 记得今天是几号或星期几",
  "3. 能听懂口头的指令",
  "4. 在与人交谈中能正确表达自己的想法",
  "5. 能看着地图找到一个新地方",
  "6. 到去过很多次的地方时，能认得路",
  "7. 能预计天气的变化，并根据变化调整自己的计划",
  "8. 对可能要发生的事情预先做好应对计划（未雨绸缪）",
  "9. 保持工作和生活环境的整洁",
  "10. 准确、有条不紊地记账而不出错",
  "11. 能同时做两件事（比如一边看电视一边打毛线）",
  "12. 烧饭或工作的同时能说话",
];

export const BNT_ITEMS_30 = BOSTON_NAMING_STIMULI.map((item, idx) => ({
  no: idx + 1,
  targetWord: item.name,
  category: item.category,
  semanticCue: item.semanticCue,
  multipleChoice: item.multiChoice,
}));

export const AVLT_WORDS_LIST = AVLT_WORDS_12;

export const NPI_DOMAINS = NPI_ITEMS.map((item) => ({
  no: item.id,
  name: item.name,
  desc: item.desc,
}));

export const PRESET_SAMPLE_PATIENTS = [
  {
    id: "demo-scd-001",
    name: "李建平 (典型 SCD 临床前期主观认知下降)",
    age: 63,
    gender: 1,
    educationYears: 16,
    diag: 1, // SCD
    scdQ9Score: 7,
    mmseScore: 29,
    mocaScore: 26,
    cdrGlobal: 0,
    avltDelay: 6,
    desc: "63岁大学本科退休工程师。主诉近2年记忆力下降，经常找不到钥匙或忘记熟人名字，伴有明显担忧与焦虑。MMSE 29分，MoCA 26分，CDR 0分，AVLT长延迟在同龄常模临界，无日常生活能力受损。Aβ-PET可疑轻度摄取，APOE ε4杂合子。",
  },
  {
    id: "demo-amci-002",
    name: "王淑芬 (典型 aMCI 遗忘型轻度认知障碍)",
    age: 68,
    gender: 2,
    educationYears: 12,
    diag: 2, // aMCI
    scdQ9Score: 8,
    mmseScore: 24,
    mocaScore: 19,
    cdrGlobal: 0.5,
    avltDelay: 2,
    desc: "68岁高中文化退休教师。近1年近事遗忘明显，重复询问同一问题，出门偶有定向迷茫。MMSE 24分，MoCA 19分（异常），AVLT长延迟2个（低于-1.0SD），Global CDR 0.5，FAQ 4分（独立生活基本自理）。MRI提示双侧海马轻中度萎缩。",
  },
  {
    id: "demo-nc-003",
    name: "张卫国 (正常健康老年对照 NC)",
    age: 61,
    gender: 1,
    educationYears: 15,
    diag: 4, // NC
    scdQ9Score: 1,
    mmseScore: 30,
    mocaScore: 28,
    cdrGlobal: 0,
    avltDelay: 8,
    desc: "61岁大专学历健康志愿者。无认知下降主诉，各项神经心理学量表均处于同年龄和教育水平常模正常高限。SCD-Q9为1分，MMSE 30分，MoCA 28分，CDR 0分。",
  },
];
