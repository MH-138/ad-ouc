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
  X,
  Smile,
  Moon,
  Check,
} from "lucide-react";
import { SubjectRecord } from "../types/assessment";
import { tts } from "../utils/ttsHelper";
import { tursoApi } from "../services/tursoApi";
import { GDS15_ITEMS } from "../data/assessmentStimuli";
import { calculateSCDQ9, calculateGDS15, calculatePSQI } from "../utils/scoringCalculators";

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
  // 当前选择的自评量表：SCD主观认知、GDS情绪心理、PSQI睡眠生活
  const [selectedSurvey, setSelectedSurvey] = useState<"scd" | "gds" | "psqi">("scd");

  // SCD 答题状态
  const [scdIdx, setScdIdx] = useState(0);
  // GDS 答题状态
  const [gdsIdx, setGdsIdx] = useState(0);

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
  const gdsAnswers: Record<number, boolean> = record.scales?.gds15?.answers || {};
  const psqiState = record.scales?.psqi || {
    bedTime: "22:30",
    sleepLatencyMinutes: 20,
    wakeTime: "06:30",
    actualSleepHours: 7,
    troubles: {},
    selfQuality: 1,
    medication: 0,
    daytimeDysfunction: 0,
  };

  // Track TTS
  useEffect(() => {
    tts.setListener((id) => setSpeakingId(id));
    return () => {
      tts.stop();
    };
  }, []);

  // Save changes to cloud database and broadcast to global state
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
        scdQ9: updated.scdQ9,
        scales: updated.scales,
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

  // ================= 1. SCD-Q9 作答与全系统数据自动同步 =================
  const currentScdQ = SCD_QUESTIONS[scdIdx];
  const isLastScdQ = scdIdx === SCD_QUESTIONS.length - 1;

  const handleScdAnswer = (val: string) => {
    tts.stop();
    const updatedAnswers = {
      ...scdAnswers,
      [currentScdQ.id]: val,
    };

    // 同步更新主干 record.scdQ9（q1 到 q9）
    const qKeyMap: Record<string, keyof SubjectRecord["scdQ9"]> = {
      q1: "q1", q2: "q2", q3: "q3", q4: "q4", q5: "q5",
      q6: "q6", q7: "q7", q8: "q8", q9: "q9",
    };

    const nextScdQ9 = { ...(record.scdQ9 || {}) } as SubjectRecord["scdQ9"];
    Object.keys(updatedAnswers).forEach((key) => {
      const field = qKeyMap[key];
      if (field) {
        nextScdQ9[field] = updatedAnswers[key] === "yes" ? 1 : 0;
      }
    });

    // 自动调用算法计算分值
    const coreQuestions = SCD_QUESTIONS.filter((q) => q.type === "core");
    const answeredCoreCount = coreQuestions.filter((q) => updatedAnswers[q.id] !== undefined).length;
    const isCompleted = answeredCoreCount === coreQuestions.length;
    const { score: calcScore, isPositive: calcPos } = calculateSCDQ9(nextScdQ9);

    const updated: SubjectRecord = {
      ...record,
      scdQ9: nextScdQ9,
      scdInterview: {
        ...record.scdInterview,
        patientSCD: updatedAnswers,
      },
      scales: {
        ...record.scales,
        scdQ9: {
          ...record.scales.scdQ9,
          status: isCompleted ? "completed" : "in_progress",
          score: calcScore,
          isPositive: calcPos,
        },
      },
    };

    persistChanges(updated);

    if (!isLastScdQ) {
      setScdIdx((prev) => prev + 1);
    }
  };

  // 跳过 SCD 自评
  const handleSkipEntireScd = () => {
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

  // ================= 2. GDS-15 情绪心理自评与全系统数据自动同步 =================
  const currentGdsQ = GDS15_ITEMS[gdsIdx];
  const isLastGdsQ = gdsIdx === GDS15_ITEMS.length - 1;

  const handleGdsAnswer = (val: boolean) => {
    tts.stop();
    const nextAnswers = {
      ...gdsAnswers,
      [currentGdsQ.id]: val,
    };

    const gdsResult = calculateGDS15(nextAnswers);

    const updated: SubjectRecord = {
      ...record,
      scales: {
        ...record.scales,
        gds15: {
          answers: nextAnswers,
        },
      },
    };

    persistChanges(updated);

    if (!isLastGdsQ) {
      setGdsIdx((prev) => prev + 1);
    }
  };

  // ================= 3. PSQI 睡眠生活自评与数据自动同步 =================
  const handleUpdatePsqi = (patch: Partial<SubjectRecord["scales"]["psqi"]>) => {
    const nextPsqi = { ...psqiState, ...patch };
    const psqiCalc = calculatePSQI(nextPsqi);

    const updated: SubjectRecord = {
      ...record,
      scales: {
        ...record.scales,
        psqi: nextPsqi,
      },
    };

    persistChanges(updated);
  };

  // 语音播报
  const handleReadScdQuestion = () => {
    if (!currentScdQ) return;
    const textToRead = `${currentScdQ.title}。${currentScdQ.hint || ""}`;
    tts.speak(`scd_q_${currentScdQ.id}`, textToRead);
  };

  const handleReadGdsQuestion = () => {
    if (!currentGdsQ) return;
    tts.speak(`gds_q_${currentGdsQ.id}`, currentGdsQ.text);
  };

  // Calculate stats for My Health Tab
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const hasScdAnswered = Boolean(
    (record.scdQ9 && Object.values(record.scdQ9).some((v) => typeof v === "number")) ||
    (record.scdInterview?.patientSCD && Object.keys(record.scdInterview.patientSCD).length > 0)
  );
  const scdStatus = record.scales?.scdQ9?.status || (hasScdAnswered ? "in_progress" : "not_started");
  const scdScore = hasScdAnswered
    ? (record.scales?.scdQ9?.score ?? calculateSCDQ9(record.scdQ9).score)
    : null;
  const isScdPositive = scdScore !== null ? scdScore >= 5 : false;

  const gdsAnsweredCount = Object.keys(gdsAnswers).length;
  const gdsScoreResult = calculateGDS15(gdsAnswers);
  const hasPsqiAnswered = Boolean(
    record.scales?.psqi && (
      (record.scales.psqi.troubles && Object.keys(record.scales.psqi.troubles).length > 0) ||
      record.scales.psqi.selfQuality !== undefined
    )
  );
  const psqiScoreResult = calculatePSQI(record.scales?.psqi);

  const hasDoctorNotes = Boolean(record.diagnosis?.notes && record.diagnosis.notes.trim() !== "");
  const doctorNotes = record.diagnosis?.notes || "";

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
          /* 情况 B：受试者已建档，提供三大量表自评切换 */
          <div className="flex-1 flex flex-col space-y-4">
            {/* 三大自评量表选择栏 */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setSelectedSurvey("scd")}
                className={`p-3 rounded-xl text-left transition flex items-center justify-between ${
                  selectedSurvey === "scd"
                    ? "bg-teal-50 border-2 border-teal-600 text-teal-900 shadow-2xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold">1. SCD-Q9 记忆自评</div>
                    <div className="text-[11px] text-slate-500">
                      {scdStatus === "completed"
                        ? `已完成 (${scdScore !== null ? `${scdScore}分` : "--"})`
                        : `${Object.keys(scdAnswers).length} / 15 题`}
                    </div>
                  </div>
                </div>
                {scdStatus === "completed" && (
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedSurvey("gds")}
                className={`p-3 rounded-xl text-left transition flex items-center justify-between ${
                  selectedSurvey === "gds"
                    ? "bg-amber-50 border-2 border-amber-600 text-amber-900 shadow-2xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <Smile className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold">2. GDS-15 情绪心理</div>
                    <div className="text-[11px] text-slate-500">
                      {gdsAnsweredCount === 15
                        ? `已完成 (${gdsScoreResult.score}分)`
                        : `${gdsAnsweredCount} / 15 题`}
                    </div>
                  </div>
                </div>
                {gdsAnsweredCount === 15 && (
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedSurvey("psqi")}
                className={`p-3 rounded-xl text-left transition flex items-center justify-between ${
                  selectedSurvey === "psqi"
                    ? "bg-indigo-50 border-2 border-indigo-600 text-indigo-900 shadow-2xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold">3. PSQI 睡眠生活</div>
                    <div className="text-[11px] text-slate-500">
                      {psqiScoreResult.score > 0 ? `评分: ${psqiScoreResult.score}分` : "作息与质量"}
                    </div>
                  </div>
                </div>
                {psqiScoreResult.score > 0 && (
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                )}
              </button>
            </div>

            {/* 问卷一：SCD-Q9 主观记忆自评 */}
            {selectedSurvey === "scd" && (
              <div className="flex-1 flex flex-col justify-between bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[460px]">
                <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">
                      {currentScdQ.type === "core" ? "SCD核心自评" : "生活情景题"}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">
                      第 {scdIdx + 1} 题 / 共 {SCD_QUESTIONS.length} 题
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleReadScdQuestion}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                      speakingId === `scd_q_${currentScdQ.id}`
                        ? "bg-teal-600 text-white border-teal-600 animate-pulse"
                        : "bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200"
                    }`}
                  >
                    {speakingId === `scd_q_${currentScdQ.id}` ? (
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

                <div className="w-full bg-slate-100 h-1.5">
                  <div
                    className="bg-teal-600 h-1.5 transition-all duration-300"
                    style={{ width: `${((scdIdx + 1) / SCD_QUESTIONS.length) * 100}%` }}
                  />
                </div>

                <div className="flex-1 p-6 sm:p-10 flex flex-col justify-center max-w-2xl mx-auto w-full text-center space-y-4">
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug tracking-tight">
                    {currentScdQ.title}
                  </div>
                  {currentScdQ.hint && (
                    <p className="text-base text-slate-500 leading-relaxed max-w-lg mx-auto">
                      {currentScdQ.hint}
                    </p>
                  )}

                  {scdAnswers[currentScdQ.id] && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium mx-auto mt-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>
                        当前已选：
                        {scdAnswers[currentScdQ.id] === "yes"
                          ? "是 (有此感觉)"
                          : scdAnswers[currentScdQ.id] === "no"
                          ? "否 (没有)"
                          : "已跳过"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200 bg-slate-50 p-4 sm:p-6">
                  <div className="max-w-2xl mx-auto space-y-3">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <button
                        type="button"
                        onClick={() => handleScdAnswer("yes")}
                        className={`py-4 sm:py-5 rounded-2xl font-bold text-lg sm:text-xl transition shadow-xs flex items-center justify-center gap-2 active:scale-98 ${
                          scdAnswers[currentScdQ.id] === "yes"
                            ? "bg-teal-600 text-white ring-4 ring-teal-200"
                            : "bg-white hover:bg-teal-50 text-teal-900 border-2 border-teal-500"
                        }`}
                      >
                        <span>是 (有明显感觉)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleScdAnswer("no")}
                        className={`py-4 sm:py-5 rounded-2xl font-bold text-lg sm:text-xl transition shadow-xs flex items-center justify-center gap-2 active:scale-98 ${
                          scdAnswers[currentScdQ.id] === "no"
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
                        disabled={scdIdx === 0}
                        onClick={() => setScdIdx((prev) => Math.max(0, prev - 1))}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 disabled:opacity-30 transition"
                      >
                        ← 上一题
                      </button>

                      <button
                        type="button"
                        onClick={() => handleScdAnswer("skipped")}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-amber-700 hover:bg-amber-50 transition border border-amber-200 bg-white"
                      >
                        跳过此题
                      </button>

                      <button
                        type="button"
                        disabled={isLastScdQ}
                        onClick={() => setScdIdx((prev) => Math.min(SCD_QUESTIONS.length - 1, prev + 1))}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-teal-700 hover:text-teal-900 disabled:opacity-30 transition"
                      >
                        下一题 →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 问卷二：GDS-15 情绪与心理自评 */}
            {selectedSurvey === "gds" && (
              <div className="flex-1 flex flex-col justify-between bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[460px]">
                <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                      GDS-15 近一周情绪自评
                    </span>
                    <span className="text-xs text-slate-400 font-bold">
                      第 {gdsIdx + 1} 题 / 共 15 题
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleReadGdsQuestion}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                      speakingId === `gds_q_${currentGdsQ.id}`
                        ? "bg-amber-600 text-white border-amber-600 animate-pulse"
                        : "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200"
                    }`}
                  >
                    {speakingId === `gds_q_${currentGdsQ.id}` ? (
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

                <div className="w-full bg-slate-100 h-1.5">
                  <div
                    className="bg-amber-500 h-1.5 transition-all duration-300"
                    style={{ width: `${((gdsIdx + 1) / 15) * 100}%` }}
                  />
                </div>

                <div className="flex-1 p-6 sm:p-10 flex flex-col justify-center max-w-2xl mx-auto w-full text-center space-y-4">
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug tracking-tight">
                    {currentGdsQ.text}
                  </div>
                  <p className="text-base text-slate-500 leading-relaxed max-w-lg mx-auto">
                    请根据您最近一星期的实际心情感受如实选择
                  </p>

                  {gdsAnswers[currentGdsQ.id] !== undefined && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium mx-auto mt-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>当前已选：{gdsAnswers[currentGdsQ.id] ? "是" : "否"}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200 bg-slate-50 p-4 sm:p-6">
                  <div className="max-w-2xl mx-auto space-y-3">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <button
                        type="button"
                        onClick={() => handleGdsAnswer(true)}
                        className={`py-4 sm:py-5 rounded-2xl font-bold text-lg sm:text-xl transition shadow-xs flex items-center justify-center gap-2 active:scale-98 ${
                          gdsAnswers[currentGdsQ.id] === true
                            ? "bg-amber-600 text-white ring-4 ring-amber-200"
                            : "bg-white hover:bg-amber-50 text-amber-900 border-2 border-amber-500"
                        }`}
                      >
                        <span>是</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleGdsAnswer(false)}
                        className={`py-4 sm:py-5 rounded-2xl font-bold text-lg sm:text-xl transition shadow-xs flex items-center justify-center gap-2 active:scale-98 ${
                          gdsAnswers[currentGdsQ.id] === false
                            ? "bg-slate-700 text-white ring-4 ring-slate-200"
                            : "bg-white hover:bg-slate-100 text-slate-700 border-2 border-slate-300"
                        }`}
                      >
                        <span>否</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        disabled={gdsIdx === 0}
                        onClick={() => setGdsIdx((prev) => Math.max(0, prev - 1))}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 disabled:opacity-30 transition"
                      >
                        ← 上一题
                      </button>

                      <button
                        type="button"
                        disabled={isLastGdsQ}
                        onClick={() => setGdsIdx((prev) => Math.min(14, prev + 1))}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-amber-700 hover:text-amber-900 disabled:opacity-30 transition"
                      >
                        下一题 →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 问卷三：PSQI 睡眠质量与作息自评 */}
            {selectedSurvey === "psqi" && (
              <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">PSQI 匹兹堡睡眠质量与生活习惯自评</h3>
                    <p className="text-xs text-slate-500 mt-0.5">请根据您近一个月的实际睡眠情况选择填写</p>
                  </div>
                  <span className="text-xs font-bold text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                    当前睡眠评分：{psqiScoreResult.score} 分 ({psqiScoreResult.qualityText})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                  <div className="space-y-2">
                    <label className="font-bold text-slate-700 block">1. 通常晚上几点上床睡觉？</label>
                    <input
                      type="time"
                      value={psqiState.bedTime}
                      onChange={(e) => handleUpdatePsqi({ bedTime: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-300 text-base font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-bold text-slate-700 block">2. 通常早上几点起床？</label>
                    <input
                      type="time"
                      value={psqiState.wakeTime}
                      onChange={(e) => handleUpdatePsqi({ wakeTime: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-300 text-base font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-bold text-slate-700 block">3. 关灯到睡着通常需要多少分钟？</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[15, 30, 45, 60].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => handleUpdatePsqi({ sleepLatencyMinutes: mins })}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                            psqiState.sleepLatencyMinutes === mins
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {mins === 60 ? ">60分钟" : `≤${mins}分钟`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-bold text-slate-700 block">4. 每夜实际睡眠时间大约几个小时？</label>
                    <div className="grid grid-cols-5 gap-2">
                      {[5, 6, 7, 8, 9].map((hours) => (
                        <button
                          key={hours}
                          type="button"
                          onClick={() => handleUpdatePsqi({ actualSleepHours: hours })}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                            psqiState.actualSleepHours === hours
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {hours} 小时
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="font-bold text-slate-700 block">5. 自评近 1 个月总体睡眠质量：</label>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { val: 0, label: "非常好" },
                        { val: 1, label: "较好" },
                        { val: 2, label: "较差" },
                        { val: 3, label: "非常差" },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => handleUpdatePsqi({ selfQuality: item.val })}
                          className={`p-3 rounded-xl border text-sm font-bold transition ${
                            psqiState.selfQuality === item.val
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 情况 C：受试者可见的「我的健康档案与检查结果」 */
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-xl">
                    {record.demographics?.name ? record.demographics.name.slice(0, 1) : "患"}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {record.demographics?.name} 的认知健康全套自评档案
                    </h2>
                    <p className="text-xs text-slate-500">
                      研究编号: {record.subjectNo || record.id} · 宣武医院认知中心健康档案
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3.5 py-1 rounded-full text-xs font-bold ${
                      scdScore === null
                        ? "bg-slate-100 text-slate-600 border border-slate-200"
                        : isScdPositive
                        ? "bg-amber-100 text-amber-900 border border-amber-200"
                        : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                    }`}
                  >
                    {scdScore === null
                      ? "待开展记忆自评"
                      : isScdPositive
                      ? "主观记忆下降 (SCD)"
                      : "正常认知老化"}
                  </span>
                </div>
              </div>

              {/* 四维自评与随访综合看板 */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-teal-800 flex items-center justify-between">
                      <span>1. 记忆自评 (SCD)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-teal-700">主观主诉</span>
                    </div>
                    <div className="text-2xl font-bold text-teal-900 mt-2">
                      {scdScore !== null ? `${scdScore} 分` : (
                        <span className="text-sm text-slate-500 font-normal">待完成</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-teal-700 mt-1">
                    {scdScore !== null
                      ? (isScdPositive ? "主诉阳性 (≥5分)" : "正常认知波动")
                      : "建议完成记忆题目"}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-amber-800 flex items-center justify-between">
                      <span>2. 情绪自评 (GDS)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-amber-700">心理状态</span>
                    </div>
                    <div className="text-2xl font-bold text-amber-900 mt-2">
                      {gdsAnsweredCount > 0 ? `${gdsScoreResult.score} 分` : (
                        <span className="text-sm text-slate-500 font-normal">待完成</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-amber-700 mt-1">
                    {gdsAnsweredCount > 0 ? gdsScoreResult.grade : "自评近1周情绪"}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-indigo-800 flex items-center justify-between">
                      <span>3. 睡眠自评 (PSQI)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-indigo-700">生活作息</span>
                    </div>
                    <div className="text-2xl font-bold text-indigo-900 mt-2">
                      {hasPsqiAnswered ? `${psqiScoreResult.score} 分` : (
                        <span className="text-sm text-slate-500 font-normal">待完成</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-indigo-700 mt-1">
                    {hasPsqiAnswered ? psqiScoreResult.qualityText : "自评近1个月睡眠与作息"}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-600">4. 医生随访指导</div>
                    <div className="text-sm font-bold text-slate-900 mt-2">
                      {hasDoctorNotes ? "已出具随访医嘱" : "等待医生评估"}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {hasDoctorNotes ? "医生已签字指导" : "测评后将自动同步"}
                    </p>
                  </div>
                  {hasDoctorNotes && (
                    <button
                      type="button"
                      onClick={() => setIsFollowUpModalOpen(true)}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>查看医生随访详情</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 医生随访与生活指导意见 */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                    <span>主治医生随访指导意见：</span>
                  </div>
                  {hasDoctorNotes && (
                    <button
                      type="button"
                      onClick={() => setIsFollowUpModalOpen(true)}
                      className="text-teal-700 hover:text-teal-900 text-xs font-semibold underline cursor-pointer"
                    >
                      查看完整医嘱
                    </button>
                  )}
                </div>
                {hasDoctorNotes ? (
                  <p className="text-sm text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200 whitespace-pre-wrap">
                    {doctorNotes}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic bg-white/60 p-3 rounded-xl border border-slate-200/60">
                    暂无医生针对性随访医嘱。受试者完成自评后，请由主治医师开展专业神经心理测评并签署。
                  </p>
                )}
              </div>

              {/* Follow-up Notes Modal */}
              {isFollowUpModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
                  <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-5 h-5 text-teal-600" />
                        <h3 className="font-bold text-base text-slate-900">
                          主治医生临床随访指导意见
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsFollowUpModalOpen(false)}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs text-slate-700 max-h-[60vh] overflow-y-auto">
                      <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100">
                        <span className="font-bold text-teal-800">受试者：</span>
                        <span>{record.demographics?.name} ({record.demographics?.gender === 1 ? "男" : "女"}, {record.demographics?.age}岁)</span>
                        <span className="ml-3 font-bold text-teal-800">建档编号：</span>
                        <span>{record.subjectNo || record.id}</span>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="font-bold text-slate-800">随访医嘱及生活指导正文：</div>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {doctorNotes}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <span>签署医生：{record.followUp?.evaluatorSignature || record.evaluator || "主治医师"}</span>
                        <span>下一次随访预约：{record.followUp?.nextVisitDate || "1年后复查"}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setIsFollowUpModalOpen(false)}
                        className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
                      >
                        已阅关闭
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
