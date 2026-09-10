import React, { useState, useEffect } from "react";
import {
  Brain,
  Volume2,
  VolumeX,
  CheckCircle2,
  ArrowLeft,
  Calendar,
  User,
  Heart,
  Activity,
  FileText,
  AlertCircle,
  HelpCircle,
  Stethoscope,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { SubjectRecord } from "../types/assessment";
import { tts } from "../utils/ttsHelper";
import { tursoApi } from "../services/tursoApi";

interface QuestionItem {
  id: string;
  title: string;
  hint?: string;
  type: "core" | "scenario";
}

const SCD_QUESTIONS: QuestionItem[] = [
  { id: "q1", title: "1. 您认为自己有记忆力减退的问题吗？", hint: "感觉近来记忆力比过去或同龄朋友有所下降", type: "core" },
  { id: "q2", title: "2. 您回忆 3~5 天前的对话或事情有困难吗？", hint: "前几天刚和家人朋友说过的话，容易遗忘", type: "core" },
  { id: "q3", title: "3. 您觉得自己近 1~2 年内记忆减退明显吗？", hint: "感觉这一两年不如从前敏捷，记性大不如前", type: "core" },
  { id: "q4", title: "4. 这种记忆减退对您的日常生活产生影响了吗？", hint: "日常偶有遗忘，但靠自己或日历提醒尚能应对", type: "core" },
  { id: "q5", title: "5. 您会反复问相同的问题而不自知吗？", hint: "刚问过的事情过会儿又想不起来，再次询问家人", type: "core" },
  { id: "q6", title: "6. 您觉得自己记事情比身边的同龄人更吃力吗？", hint: "与熟悉的同龄老人相比，感觉自己记性更差", type: "core" },
  { id: "q7", title: "7. 您是否感到这种记性变差在逐渐加重？", hint: "不是偶尔累了忘事，而是觉得记忆力持续在衰退", type: "core" },
  { id: "q8", title: "8. 您常把随身物品（钥匙、老花镜）放错且找不到吗？", hint: "经常到处找钥匙、手机、药盒或存折等随身物品", type: "core" },
  { id: "q9", title: "9. 您经常因为记性不好而感到心里担忧或苦恼吗？", hint: "心里常常挂念担忧，怕自己脑子出大问题", type: "core" },
  { id: "s1", title: "10. 外出买菜或办事，不带小纸条是否经常漏买重要东西？", hint: "以前脑子都能记住，现在不记下容易漏掉", type: "scenario" },
  { id: "s2", title: "11. 在熟悉的社区或街巷行走时，偶有辨不清方向发懵吗？", hint: "在熟路上突然停下辨认方向", type: "scenario" },
  { id: "s3", title: "12. 观看电视连续剧或听别人讲长故事，经常跟不上剧情吗？", hint: "需要别人解释人物关系或情节发展", type: "scenario" },
  { id: "s4", title: "13. 使用用了多年的电视遥控器或微波炉，偶尔感到生疏吗？", hint: "原本很熟悉的操作，有时突然卡壳不会按", type: "scenario" },
  { id: "s5", title: "14. 路上遇到熟人，是否常有一时叫不上对方姓名的情况？", hint: "看着面熟，但名字在嘴边一时卡壳说不出来", type: "scenario" },
  { id: "s6", title: "15. 算账或清点买菜找零时，是否需要反复核对多遍才放心？", hint: "对数额不太自信，需要比过去多核算两遍", type: "scenario" },
];

interface PatientPortalPageProps {
  record: SubjectRecord;
  onUpdateRecord: (updated: SubjectRecord) => void;
  onReturnToPortal: () => void;
}

export const PatientPortalPage: React.FC<PatientPortalPageProps> = ({
  record,
  onUpdateRecord,
  onReturnToPortal,
}) => {
  const [activeTab, setActiveTab] = useState<"survey" | "my_health">("survey");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newDemographics, setNewDemographics] = useState({
    name: record.demographics?.name || "",
    gender: record.demographics?.gender || 1,
    age: record.demographics?.age || 65,
    educationYears: record.demographics?.educationYears || 9,
    phone1: record.demographics?.phone1 || "",
  });

  // Check if patient info is already created
  const hasProfile = Boolean(record.demographics?.name && record.demographics.name.trim() !== "");

  // Load existing answers
  const scdAnswers: Record<string, string | number> = record.scdInterview?.patientSCD || {};

  // All survey items (9 core questions + 6 scenarios)
  const allQuestions = SCD_QUESTIONS;

  const currentQ = allQuestions[currentIdx];
  const isLastQ = currentIdx === allQuestions.length - 1;

  // Track TTS
  useEffect(() => {
    tts.setListener((id) => setSpeakingId(id));
    return () => {
      tts.stop();
    };
  }, []);

  // Save changes to cloud database
  const persistChanges = async (updated: SubjectRecord) => {
    onUpdateRecord(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);

    try {
      await tursoApi.savePatient({
        id: updated.id,
        researchNo: updated.subjectNo,
        name: updated.demographics?.name,
        gender: updated.demographics?.gender,
        age: updated.demographics?.age,
        educationYears: updated.demographics?.educationYears,
        heightCm: updated.demographics?.height,
        weightKg: updated.demographics?.weight,
        phone: updated.demographics?.phone1,
        ...updated,
      });
      // Also save patient draft
      await tursoApi.saveDraft(updated.id, "patient", {
        updatedAt: new Date().toISOString(),
        scdInterview: updated.scdInterview,
      });
    } catch (e) {
      console.warn("Patient cloud save fallback:", e);
    }
  };

  // Submit initial profile if not yet created
  const handleSaveInitialProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDemographics.name.trim()) {
      alert("请输入您的姓名");
      return;
    }
    const updated: SubjectRecord = {
      ...record,
      demographics: {
        ...record.demographics,
        name: newDemographics.name.trim(),
        gender: newDemographics.gender as 1 | 2,
        age: Number(newDemographics.age),
        educationYears: Number(newDemographics.educationYears),
        phone1: newDemographics.phone1,
      },
    };
    persistChanges(updated);
  };

  // Answer a question
  const handleAnswer = (val: string) => {
    tts.stop();
    const updatedAnswers = {
      ...scdAnswers,
      [currentQ.id]: val,
    };

    // Check whether all core questions are answered
    const coreQuestions = SCD_QUESTIONS.filter((q) => q.type === "core");
    const answeredCoreCount = coreQuestions.filter((q) => updatedAnswers[q.id] !== undefined).length;
    const isCompleted = answeredCoreCount === coreQuestions.length;

    // Calculate score strictly only when completed; otherwise keep null
    let calculatedScore: number | null = null;
    let isPos = false;
    if (isCompleted) {
      let scoreSum = 0;
      coreQuestions.forEach((item) => {
        if (updatedAnswers[item.id] === "yes") {
          scoreSum += 1;
        }
      });
      calculatedScore = scoreSum;
      isPos = scoreSum >= 5;
    }

    const updated: SubjectRecord = {
      ...record,
      scdInterview: {
        ...record.scdInterview,
        patientSCD: updatedAnswers,
      },
      scales: {
        ...record.scales,
        scdQ9: {
          ...record.scales.scdQ9,
          status: isCompleted ? "completed" : "in_progress",
          score: calculatedScore,
          isPositive: isPos,
        },
      },
    };

    persistChanges(updated);

    if (!isLastQ) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  // Skip single question (recorded as 'skipped', score not counted)
  const handleSkip = () => {
    handleAnswer("skipped");
  };

  // Skip entire self-assessment module strictly recorded as skipped with null score
  const handleSkipEntireAssessment = () => {
    tts.stop();
    const updated: SubjectRecord = {
      ...record,
      scales: {
        ...record.scales,
        scdQ9: {
          ...record.scales.scdQ9,
          status: "skipped",
          score: null,
          isPositive: false,
        },
      },
    };
    persistChanges(updated);
  };

  // Read question aloud
  const handleReadQuestion = () => {
    if (!currentQ) return;
    const textToRead = `${currentQ.title}。${currentQ.hint || ""}`;
    tts.speak(`scd_q_${currentQ.id}`, textToRead);
  };

  // Calculate stats for My Health Tab (strictly conforming to patient view boundaries)
  const scdStatus = record.scales?.scdQ9?.status || (Object.keys(scdAnswers).length > 0 ? "in_progress" : "not_started");
  const scdScore = record.scales?.scdQ9?.score ?? null;
  const isScdPositive = scdScore !== null && scdScore >= 5;
  const doctorNotes = record.diagnosis?.notes || "健康生活方式建议：保持规律作息、清淡地中海饮食、每日坚持30分钟轻度有氧活动与认知锻炼。";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* 1. 适老顶部导航栏 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onReturnToPortal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200"
            >
              <ArrowLeft className="w-4 h-4 text-teal-700" />
              <span>返回门户</span>
            </button>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-base text-slate-900 leading-tight">
                  受试者认知自评通道
                </h1>
                <div className="text-xs text-slate-500">
                  {hasProfile ? (
                    <span>
                      当前受试者：<strong className="text-slate-800">{record.demographics?.name}</strong> (
                      {record.demographics?.gender === 1 ? "男" : "女"}，{record.demographics?.age}岁)
                    </span>
                  ) : (
                    <span>首次建档与自评</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                已保存到数据库
              </span>
            )}
            {hasProfile && (
              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setActiveTab("survey")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeTab === "survey"
                      ? "bg-white text-teal-800 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  记忆自评
                </button>
                <button
                  onClick={() => setActiveTab("my_health")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeTab === "my_health"
                      ? "bg-white text-teal-800 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  我的健康档案
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. 主体区 */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 flex flex-col">
        {/* 情况 A：若未建档，提示受试者建档 */}
        {!hasProfile ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm max-w-xl mx-auto w-full my-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 mx-auto flex items-center justify-center">
                <User className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">请完善您的基本信息</h2>
              <p className="text-xs text-slate-500">
                仅需登记您的姓名和年龄，完成后即可开始记忆自评
              </p>
            </div>

            <form onSubmit={handleSaveInitialProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  真实姓名 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如：张建华"
                  value={newDemographics.name}
                  onChange={(e) =>
                    setNewDemographics({ ...newDemographics, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base font-medium focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    性别 *
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewDemographics({ ...newDemographics, gender: 1 })}
                      className={`flex-1 py-3 rounded-xl border text-sm font-bold transition ${
                        newDemographics.gender === 1
                          ? "bg-teal-50 border-teal-500 text-teal-800"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      男士
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewDemographics({ ...newDemographics, gender: 2 })}
                      className={`flex-1 py-3 rounded-xl border text-sm font-bold transition ${
                        newDemographics.gender === 2
                          ? "bg-teal-50 border-teal-500 text-teal-800"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      女士
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    实足周岁 *
                  </label>
                  <input
                    type="number"
                    min={40}
                    max={100}
                    value={newDemographics.age}
                    onChange={(e) =>
                      setNewDemographics({ ...newDemographics, age: Number(e.target.value) })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base font-medium focus:border-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  联系电话
                </label>
                <input
                  type="tel"
                  placeholder="便于接收健康随访提醒"
                  value={newDemographics.phone1}
                  onChange={(e) =>
                    setNewDemographics({ ...newDemographics, phone1: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base font-medium focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-base transition shadow-md"
              >
                保存档案并开始自评
              </button>
            </form>
          </div>
        ) : activeTab === "survey" ? (
          /* 情况 B：受试者已建档，直接进入 SCD-Q9 自评 */
          <div className="flex-1 flex flex-col justify-between bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {/* 顶部进度条 */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">
                  {currentQ.type === "core" ? "核心自评" : "生活情景"}
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  第 {currentIdx + 1} 题 / 共 {allQuestions.length} 题
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReadQuestion}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                    speakingId === `scd_q_${currentQ.id}`
                      ? "bg-teal-600 text-white border-teal-600 animate-pulse"
                      : "bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200"
                  }`}
                >
                  {speakingId === `scd_q_${currentQ.id}` ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>停止朗读</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>🔊 语音读题</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 进度条指示 */}
            <div className="w-full bg-slate-100 h-1.5">
              <div
                className="bg-teal-600 h-1.5 transition-all duration-300"
                style={{
                  width: `${((currentIdx + 1) / allQuestions.length) * 100}%`,
                }}
              />
            </div>

            {/* 题目展示区（适老超大字体） */}
            <div className="flex-1 p-6 sm:p-10 flex flex-col justify-center max-w-2xl mx-auto w-full text-center space-y-4">
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug tracking-tight">
                {currentQ.title}
              </div>
              {currentQ.hint && (
                <p className="text-base text-slate-500 leading-relaxed max-w-lg mx-auto">
                  {currentQ.hint}
                </p>
              )}

              {/* 当前题已答提示 */}
              {scdAnswers[currentQ.id] && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium mx-auto mt-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>
                    当前已选：
                    {scdAnswers[currentQ.id] === "yes"
                      ? "是 (有此感觉)"
                      : scdAnswers[currentQ.id] === "no"
                      ? "否 (没有)"
                      : scdAnswers[currentQ.id] === "skipped"
                      ? "已跳过"
                      : "不确定"}
                  </span>
                </div>
              )}
            </div>

            {/* 底部固定大按钮回答甲板 (Sticky Bottom Deck) */}
            <div className="border-t border-slate-200 bg-slate-50 p-4 sm:p-6">
              <div className="max-w-2xl mx-auto space-y-3">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => handleAnswer("yes")}
                    className={`py-4 sm:py-5 rounded-2xl font-bold text-lg sm:text-xl transition shadow-xs flex items-center justify-center gap-2 active:scale-98 ${
                      scdAnswers[currentQ.id] === "yes"
                        ? "bg-teal-600 text-white ring-4 ring-teal-200"
                        : "bg-white hover:bg-teal-50 text-teal-900 border-2 border-teal-500"
                    }`}
                  >
                    <span>是 (有明显感觉)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAnswer("no")}
                    className={`py-4 sm:py-5 rounded-2xl font-bold text-lg sm:text-xl transition shadow-xs flex items-center justify-center gap-2 active:scale-98 ${
                      scdAnswers[currentQ.id] === "no"
                        ? "bg-slate-700 text-white ring-4 ring-slate-200"
                        : "bg-white hover:bg-slate-100 text-slate-700 border-2 border-slate-300"
                    }`}
                  >
                    <span>否 (未出现 / 正常)</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 disabled:opacity-30 transition"
                  >
                    ← 上一题
                  </button>

                  <button
                    type="button"
                    onClick={handleSkip}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-amber-700 hover:bg-amber-50 transition border border-amber-200 bg-white"
                  >
                    跳过此题 (暂不清楚)
                  </button>

                  <button
                    type="button"
                    disabled={isLastQ}
                    onClick={() => setCurrentIdx((prev) => Math.min(allQuestions.length - 1, prev + 1))}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-teal-700 hover:text-teal-900 disabled:opacity-30 transition"
                  >
                    下一题 →
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 情况 C：受试者可见的「我的健康档案与检查结果」 */
          <div className="space-y-6">
            {/* 综合状态概览卡 */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-xl">
                    {record.demographics?.name ? record.demographics.name.slice(0, 1) : "患"}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {record.demographics?.name} 的认知健康报告
                    </h2>
                    <p className="text-xs text-slate-500">
                      研究编号: {record.subjectNo || record.id} · 宣武医院认知中心健康档案
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3.5 py-1 rounded-full text-xs font-bold ${
                      isScdPositive
                        ? "bg-amber-100 text-amber-900 border border-amber-200"
                        : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                    }`}
                  >
                    {isScdPositive ? "主观记忆下降 (SCD)" : "正常认知老化"}
                  </span>
                </div>
              </div>

              {/* 核心指标看板 - 仅展示本人档案、SCD自评进度与随访建议，不展示医生专业量表 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200">
                  <div className="text-xs font-bold text-teal-800">SCD-Q9 主观自评状态</div>
                  <div className="text-2xl font-bold text-teal-900 mt-2">
                    {scdStatus === "completed" ? (
                      <span>{scdScore !== null ? `${scdScore} 分` : "--"}</span>
                    ) : scdStatus === "skipped" ? (
                      <span className="text-base text-amber-700">已明确跳过</span>
                    ) : (
                      <span className="text-base text-slate-500">待完成自评</span>
                    )}
                  </div>
                  <p className="text-xs text-teal-700 mt-1">
                    {scdStatus === "completed"
                      ? (isScdPositive ? "自评提示存在主观记忆改变感受" : "自评在正常认知波动范围内")
                      : scdStatus === "skipped"
                      ? "自评已跳过，分数值保持为空"
                      : "建议您完成全部记忆自评题目"}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-600">受试者基本信息摘要</div>
                  <div className="text-sm font-bold text-slate-900 mt-2 space-y-1">
                    <div>性别：{record.demographics?.gender === 1 ? "男" : "女"} · 年龄：{record.demographics?.age || "--"} 岁</div>
                    <div className="text-xs text-slate-500 font-normal">受教育：{record.demographics?.educationYears ?? "--"} 年</div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    档案建档编号：{record.subjectNo || record.id}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-600">临床随访建议状态</div>
                  <div className="text-base font-bold text-slate-900 mt-2">
                    {record.diagnosis?.notes ? "医生已提供随访建议" : "等待主治医生综合评估"}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {record.diagnosis?.notes ? "请参考下方医生随访与生活指导" : "医生完成综合测评后将更新此项"}
                  </p>
                </div>
              </div>

              {/* 医生随访与生活指导意见（仅展示已录入的生活随访内容） */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Stethoscope className="w-4 h-4 text-teal-600" />
                  <span>健康指导与随访安排：</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {doctorNotes}
                </p>
              </div>

              {/* 宣武医院脑健康科普与生活建议 */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>宣武医院专家脑健康生活指导</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                    <div className="font-bold text-slate-800">1. 规律作息与有氧步行</div>
                    <p className="text-slate-500">
                      每日保证 7-8 小时高质量睡眠，傍晚快走 30 分钟，促进脑源性神经营养因子分泌。
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                    <div className="font-bold text-slate-800">2. 地中海式脑健康饮食</div>
                    <p className="text-slate-500">
                      多食深色绿叶蔬菜、蓝莓等浆果，适量坚果与深海鱼类，减少高糖、高盐和油炸食物。
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                    <div className="font-bold text-slate-800">3. 坚持主动用脑与社交活动</div>
                    <p className="text-slate-500">
                      下棋、阅读、学习新技能或与老朋友交流，建立丰富的认知储备，延缓脑衰老。
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                    <div className="font-bold text-slate-800">4. 控制慢性心脑血管指标</div>
                    <p className="text-slate-500">
                      规律监测血压、血糖与血脂，遵医嘱按时服药，避免血压剧烈波动损伤脑小血管。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
