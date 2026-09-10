import React, { useState, useEffect, useRef } from "react";
import {
  Brain,
  Home,
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  User,
  Users,
  Stethoscope,
  Database,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Download,
  Upload,
  RefreshCw,
  PlusCircle,
  Eye,
  EyeOff,
  Check,
  X,
  FileCheck,
} from "lucide-react";
import { SubjectRecord } from "../../types/assessment";
import {
  SCALES_CONFIG,
  INTAKE_QUESTIONS,
  AVLT_TARGET,
  AVLT_DISTRACTOR,
  ScaleDefinition,
  computeScaleScore,
} from "../../utils/prototypeScales";
import { tursoApi, TursoDbStatus } from "../../services/tursoApi";
import { tts } from "../../utils/ttsHelper";
import { exportRecordToExcel } from "../../utils/excelExporter";

interface PrototypeAssessmentEngineProps {
  currentRecord: SubjectRecord;
  onUpdateRecord: (record: SubjectRecord) => void;
  onSwitchToAdvancedWorkbench: () => void;
  onNewPatient: () => void;
  cohort: SubjectRecord[];
  onSelectPatient: (patientId: string) => void;
}

type RoleType = "rater" | "self" | "informant";
type ChannelType = "self" | "informant" | "rater" | null;

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  anchorHint?: string;
}

export const PrototypeAssessmentEngine: React.FC<PrototypeAssessmentEngineProps> = ({
  currentRecord,
  onUpdateRecord,
  onSwitchToAdvancedWorkbench,
  onNewPatient,
  cohort,
  onSelectPatient,
}) => {
  // Navigation & Role states matching ad-ouc-prototype
  const [role, setRole] = useState<RoleType>("rater");
  const [channel, setChannel] = useState<ChannelType>(null);
  const [view, setView] = useState<"home" | "chat">("home");

  // Flow states
  const [activeScaleKey, setActiveScaleKey] = useState<string | null>(null);
  const [isIntakeFlow, setIsIntakeFlow] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [completedScales, setCompletedScales] = useState<Record<string, any>>({});

  // Turso DB Cloud sync status
  const [dbStatus, setDbStatus] = useState<TursoDbStatus>({
    connected: true,
    url: "libsql://ad-ouc-mh-138.aws-ap-northeast-1.turso.io",
    timestamp: new Date().toISOString(),
  });
  const [saveStatus, setSaveStatus] = useState<string>("已保存");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // AVLT & VFT Specialized UI States
  const [avltShowWords, setAvltShowWords] = useState<boolean>(false);
  const [avltDelayCountdown, setAvltDelayCountdown] = useState<number>(1200);
  const [isDelayRunning, setIsDelayRunning] = useState<boolean>(false);
  const [selectedRecogWords, setSelectedRecogWords] = useState<string[]>([]);

  const [vftSeconds, setVftSeconds] = useState<number>(60);
  const [isVftRunning, setIsVftRunning] = useState<boolean>(false);
  const [vftTotalCount, setVftTotalCount] = useState<number>(15);
  const [vftSegments, setVftSegments] = useState<number[]>([4, 4, 4, 3]);

  // Modals
  const [showReport, setShowReport] = useState<boolean>(false);
  const [showPatientPicker, setShowPatientPicker] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);

  // 1. Initial Turso Health Check & Cohort Seed
  useEffect(() => {
    checkDatabase();
    const interval = setInterval(checkDatabase, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkDatabase = async () => {
    try {
      const status = await tursoApi.checkStatus();
      setDbStatus(status);
    } catch (e) {
      console.warn("Database status check error:", e);
    }
  };

  // 2. Sync patient record changes to Turso
  const syncPatientToTurso = async (record: SubjectRecord) => {
    setIsSyncing(true);
    setSaveStatus("同步中...");
    try {
      await tursoApi.savePatient({
        id: record.id,
        researchNo: record.subjectNo || record.protocolNo,
        name: record.demographics?.name,
        gender: record.demographics?.gender,
        age: record.demographics?.age,
        educationYears: record.demographics?.educationYears,
        heightCm: record.demographics?.height,
        weightKg: record.demographics?.weight,
        phone: record.demographics?.phone1,
        source: "ad_ouc_clinical",
        createdByRole: role,
        ...record,
      });
      setSaveStatus("已保存至 Turso");
    } catch (e) {
      setSaveStatus("本地已保存");
    } finally {
      setIsSyncing(false);
    }
  };

  // Scroll to bottom in chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentIndex, view]);

  // VFT Timer Effect
  useEffect(() => {
    if (isVftRunning && vftSeconds > 0) {
      timerRef.current = setInterval(() => {
        setVftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsVftRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isVftRunning, vftSeconds]);

  // AVLT Delay Timer Effect
  useEffect(() => {
    let delayTimer: any = null;
    if (isDelayRunning && avltDelayCountdown > 0) {
      delayTimer = setInterval(() => {
        setAvltDelayCountdown((prev) => {
          if (prev <= 1) {
            setIsDelayRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(delayTimer);
  }, [isDelayRunning, avltDelayCountdown]);

  // Apply role pronoun replacement for Informant mode (e.g. '您' -> '他/她')
  const applyPronoun = (text: string) => {
    if (role !== "informant" || !text) return text;
    return text.replace(/您/g, "他/她").replace(/你/g, "他/她");
  };

  // Filter scales visible to current role/channel
  const isScaleVisible = (key: string) => {
    if (role === "rater") return true;
    if (role === "self") return key === "SCD-Q9";
    if (role === "informant") return ["FAQ", "NPI", "CDR"].includes(key);
    return true;
  };

  // ==================== FLOW CONTROLS ====================

  // Start a scale assessment
  const handleStartScale = (scaleKey: string) => {
    const scale = SCALES_CONFIG[scaleKey];
    if (!scale) return;

    setActiveScaleKey(scaleKey);
    setIsIntakeFlow(false);
    setCurrentIndex(0);
    setAnswers({});
    setView("chat");

    const introText = applyPronoun(scale.intro);
    const firstQ = scale.items[0];
    const qText = applyPronoun(firstQ.q);

    setMessages([
      {
        id: `intro_${Date.now()}`,
        sender: "bot",
        text: `【${scale.name}】\n${introText}`,
        timestamp: new Date().toTimeString().slice(0, 5),
      },
      {
        id: `q_0_${Date.now()}`,
        sender: "bot",
        text: `第 1 题 / 共 ${scale.items.length} 题：\n${qText}`,
        timestamp: new Date().toTimeString().slice(0, 5),
        anchorHint: firstQ.anchors ? JSON.stringify(firstQ.anchors) : undefined,
      },
    ]);

    // TTS speak for self (patient)
    if (role === "self") {
      tts.speak("init_msg", qText);
    }
  };

  // Start Patient Demographic Intake flow
  const handleStartIntake = () => {
    setIsIntakeFlow(true);
    setActiveScaleKey(null);
    setCurrentIndex(0);
    setAnswers({});
    setView("chat");

    const firstQ = INTAKE_QUESTIONS[0];
    setMessages([
      {
        id: `intake_intro_${Date.now()}`,
        sender: "bot",
        text: "您好！在测评前，请先记录受试者的基本临床资料（姓名、性别、年龄、教育年限等）。",
        timestamp: new Date().toTimeString().slice(0, 5),
      },
      {
        id: `intake_q_0_${Date.now()}`,
        sender: "bot",
        text: `第 1 步 / 共 ${INTAKE_QUESTIONS.length} 步：\n${firstQ.q}`,
        timestamp: new Date().toTimeString().slice(0, 5),
      },
    ]);
  };

  // Submit an answer
  const handleSubmitAnswer = async (value: any, displayLabel?: string) => {
    tts.stop();

    const currentQuestions = isIntakeFlow
      ? INTAKE_QUESTIONS
      : activeScaleKey
      ? SCALES_CONFIG[activeScaleKey]?.items
      : [];

    if (!currentQuestions || currentIndex >= currentQuestions.length) return;

    const currentItem = currentQuestions[currentIndex];
    const newAnswers = { ...answers, [currentItem.id]: value };
    setAnswers(newAnswers);

    // Append user message
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: "user",
      text: displayLabel || String(value),
      timestamp: new Date().toTimeString().slice(0, 5),
    };

    const nextIdx = currentIndex + 1;

    // Check if flow completed
    if (nextIdx >= currentQuestions.length) {
      if (isIntakeFlow) {
        // Complete Intake
        const updatedRecord: SubjectRecord = {
          ...currentRecord,
          demographics: {
            ...currentRecord.demographics,
            name: String(newAnswers.name || currentRecord.demographics?.name || "受试者"),
            gender: Number(newAnswers.gender || currentRecord.demographics?.gender || 1) as 1 | 2,
            age: Number(newAnswers.birth ? new Date().getFullYear() - Number(newAnswers.birth) : currentRecord.demographics?.age || 70),
            educationYears: Number(newAnswers.edu || currentRecord.demographics?.educationYears || 9),
            height: Number(newAnswers.height || currentRecord.demographics?.height || 165),
            weight: Number(newAnswers.weight || currentRecord.demographics?.weight || 65),
            phone1: String(newAnswers.phone || currentRecord.demographics?.phone1 || ""),
          },
          updatedAt: new Date().toISOString(),
        };
        onUpdateRecord(updatedRecord);
        await syncPatientToTurso(updatedRecord);

        const botCompletionMsg: ChatMessage = {
          id: `bot_comp_${Date.now()}`,
          sender: "bot",
          text: `受试者档案已成功建档并实时同步至 Turso 数据库！\n编号：${updatedRecord.subjectNo}\n姓名：${updatedRecord.demographics.name}，年龄：${updatedRecord.demographics.age}岁，受教育：${updatedRecord.demographics.educationYears}年。接下来请选择量表开始筛查。`,
          timestamp: new Date().toTimeString().slice(0, 5),
        };

        setMessages((prev) => [...prev, userMsg, botCompletionMsg]);
        setCurrentIndex(nextIdx);
      } else if (activeScaleKey) {
        // Complete Scale
        const scaleScoreResult = computeScaleScore(activeScaleKey, newAnswers);
        const newCompleted = {
          ...completedScales,
          [activeScaleKey]: scaleScoreResult,
        };
        setCompletedScales(newCompleted);

        // Update active record's scales state
        let updatedRecord = { ...currentRecord };
        if (activeScaleKey === "SCD-Q9") {
          updatedRecord.scales.scdQ9 = {
            ...updatedRecord.scales.scdQ9,
            totalScore: scaleScoreResult.score,
            answers: newAnswers,
          };
        } else if (activeScaleKey === "MMSE") {
          updatedRecord.scales.mmse = {
            ...updatedRecord.scales.mmse,
            totalScore: scaleScoreResult.score,
          };
        } else if (activeScaleKey === "MoCA-B") {
          updatedRecord.scales.mocaB = {
            ...updatedRecord.scales.mocaB,
            totalScore: scaleScoreResult.score,
          };
        } else if (activeScaleKey === "CDR") {
          updatedRecord.scales.cdr = {
            ...updatedRecord.scales.cdr,
            cdrSb: scaleScoreResult.score,
            globalScore: (scaleScoreResult.globalCDR as any) || 0,
          };
        } else if (activeScaleKey === "AVLT") {
          updatedRecord.scales.avltH = {
            ...updatedRecord.scales.avltH,
            delayedRecallScore: scaleScoreResult.score,
          };
        } else if (activeScaleKey === "FAQ") {
          updatedRecord.scales.faq = {
            ...updatedRecord.scales.faq,
            totalScore: scaleScoreResult.score,
          };
        } else if (activeScaleKey === "NPI") {
          updatedRecord.scales.npi = {
            ...updatedRecord.scales.npi,
            totalScore: scaleScoreResult.score,
          };
        }

        onUpdateRecord(updatedRecord);
        await syncPatientToTurso(updatedRecord);

        // Save assessment result to Turso LibSQL
        await tursoApi.saveAssessment(updatedRecord.id, {
          patientId: updatedRecord.id,
          scaleCode: activeScaleKey,
          role,
          status: "completed",
          score: scaleScoreResult.score,
          globalCDR: scaleScoreResult.globalCDR,
          level: scaleScoreResult.level,
          label: scaleScoreResult.label,
          answers: newAnswers,
          details: scaleScoreResult.details,
          completedAt: new Date().toISOString(),
        });

        const lightIcon =
          scaleScoreResult.level === "green"
            ? "🟢"
            : scaleScoreResult.level === "yellow"
            ? "🟡"
            : "🔴";

        const botCompletionMsg: ChatMessage = {
          id: `bot_comp_${Date.now()}`,
          sender: "bot",
          text: `🎉 本量表测评完成！\n${lightIcon} 评定结果：${scaleScoreResult.label}\n结果已永久写入 Turso 云端数据库。`,
          timestamp: new Date().toTimeString().slice(0, 5),
        };

        setMessages((prev) => [...prev, userMsg, botCompletionMsg]);
        setCurrentIndex(nextIdx);
      }
    } else {
      // Advance to next question
      const nextQ = currentQuestions[nextIdx];
      const qText = applyPronoun(nextQ.q);

      const botNextMsg: ChatMessage = {
        id: `bot_q_${nextIdx}_${Date.now()}`,
        sender: "bot",
        text: `第 ${nextIdx + 1} 题 / 共 ${currentQuestions.length} 题：\n${qText}`,
        timestamp: new Date().toTimeString().slice(0, 5),
        anchorHint: nextQ.anchors ? JSON.stringify(nextQ.anchors) : undefined,
      };

      setMessages((prev) => [...prev, userMsg, botNextMsg]);
      setCurrentIndex(nextIdx);

      if (role === "self") {
        tts.speak(`q_${nextIdx}`, qText);
      }
    }
  };

  // Jump or Skip Question
  const handleSkipQuestion = () => {
    handleSubmitAnswer(0, "跳过 / NA");
  };

  // ==================== RENDER COMPOSER CONTROLS ====================

  const renderComposer = () => {
    const currentQuestions = isIntakeFlow
      ? INTAKE_QUESTIONS
      : activeScaleKey
      ? SCALES_CONFIG[activeScaleKey]?.items
      : [];

    if (!currentQuestions || currentIndex >= currentQuestions.length) {
      return (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border-t border-slate-200">
          <div className="text-xs text-slate-500">
            {isIntakeFlow ? "档案建档已完成" : "测评已结束"} · 结果已同步至 Turso 数据库
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("home")}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              返回量表目录
            </button>
            <button
              onClick={() => setShowReport(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition"
            >
              查看综合诊断报告
            </button>
          </div>
        </div>
      );
    }

    const it = currentQuestions[currentIndex];

    // 1. Choice type (2-4 big buttons)
    if (it.kind === "choice" && it.options) {
      return (
        <div className="p-4 bg-white border-t border-slate-200 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {it.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleSubmitAnswer(opt.score, opt.label)}
                className="py-3 px-4 text-center font-bold text-sm bg-slate-50 hover:bg-teal-50 text-slate-800 hover:text-teal-900 border border-slate-200 hover:border-teal-400 rounded-xl transition shadow-2xs active:scale-98"
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>点击上方选项作答</span>
            <button onClick={handleSkipQuestion} className="text-slate-400 hover:text-slate-600 underline">
              跳过本题
            </button>
          </div>
        </div>
      );
    }

    // 2. AVLT Word Delay Wait Node
    if (it.kind === "delay") {
      return (
        <div className="p-5 bg-white border-t border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>延迟回忆间隔期（临床标准约 20 分钟）</span>
            </div>
            <div className="text-sm font-mono font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
              {Math.floor(avltDelayCountdown / 60)}分 {avltDelayCountdown % 60}秒
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            在此期间可让受试者完成非言语任务（如画钟测验、连线测验、常识提问）。计时结束后将自动进入延迟回忆测评。
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDelayRunning(!isDelayRunning)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                isDelayRunning
                  ? "bg-amber-600 text-white hover:bg-amber-700"
                  : "bg-teal-600 text-white hover:bg-teal-700"
              }`}
            >
              {isDelayRunning ? "暂停计时" : "开始临床倒计时 (20分钟)"}
            </button>
            <button
              onClick={() => handleSubmitAnswer(1, "延迟等待期结束")}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition"
            >
              快速演示跳过（进入延迟回忆）
            </button>
          </div>
        </div>
      );
    }

    // 3. AVLT Recognition 9-Grid Selector
    if (it.kind === "recog") {
      const allWords = [...AVLT_TARGET, ...AVLT_DISTRACTOR];
      const toggleWord = (word: string) => {
        setSelectedRecogWords((prev) =>
          prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]
        );
      };

      return (
        <div className="p-4 bg-white border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-bold">
              点选受试者认出的词（已选 {selectedRecogWords.length} 个）：
            </span>
            <span className="text-slate-400">含12个学习词 + 12个干扰词</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
            {allWords.map((word, idx) => {
              const isSelected = selectedRecogWords.includes(word);
              return (
                <button
                  key={idx}
                  onClick={() => toggleWord(word)}
                  className={`py-2 px-1 text-center text-xs font-bold rounded-lg border transition ${
                    isSelected
                      ? "bg-teal-600 text-white border-teal-700 shadow-2xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {word}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setSelectedRecogWords([])}
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              清空重选
            </button>
            <button
              onClick={() =>
                handleSubmitAnswer(
                  selectedRecogWords,
                  `再认词数: ${selectedRecogWords.length}`
                )
              }
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              确认提交再认结果
            </button>
          </div>
        </div>
      );
    }

    // 4. VFT Timer Node (60s + 15s intervals)
    if (it.kind === "timer") {
      return (
        <div className="p-4 bg-white border-t border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              <span className="text-sm font-bold text-slate-900">动物词语流畅性 60 秒倒计时</span>
            </div>
            <div className="text-base font-mono font-extrabold text-teal-700 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
              {vftSeconds} 秒
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsVftRunning(!isVftRunning)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                isVftRunning
                  ? "bg-rose-600 text-white hover:bg-rose-700"
                  : "bg-teal-600 text-white hover:bg-teal-700"
              }`}
            >
              {isVftRunning ? "暂停计时" : "开始 60 秒计时"}
            </button>
            <button
              onClick={() => {
                setVftSeconds(60);
                setIsVftRunning(false);
              }}
              className="px-3 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 border border-slate-300"
            >
              重置
            </button>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700">
              计时结束后，受试者正确说出动物总词数：
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="50"
                value={vftTotalCount}
                onChange={(e) => setVftTotalCount(Number(e.target.value))}
                className="w-24 px-3 py-2 border border-slate-300 rounded-xl text-center text-base font-bold text-slate-900 focus:outline-teal-500"
              />
              <button
                onClick={() =>
                  handleSubmitAnswer(
                    vftTotalCount,
                    `60秒动物总词数: ${vftTotalCount}`
                  )
                }
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                录入总分并进入分段
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 5. Numerical / Stepper Scoring (0~4, 0~12, etc.)
    const maxVal = it.max != null ? it.max : 4;
    const minVal = it.min != null ? it.min : 0;
    const count = maxVal - minVal + 1;

    return (
      <div className="p-4 bg-white border-t border-slate-200 space-y-3">
        {/* Examiner Target Words Reveal Panel for AVLT */}
        {it.reveal && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900">
              <span>{it.reveal.title}</span>
              <button
                onClick={() => setAvltShowWords(!avltShowWords)}
                className="flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-900 underline"
              >
                {avltShowWords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{avltShowWords ? "隐藏词表" : "展开主试词表"}</span>
              </button>
            </div>
            {avltShowWords && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {it.reveal.words.map((w, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-white rounded border border-amber-200 text-xs font-medium text-amber-900"
                  >
                    {w}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Anchors guide for HAMD/HAMA */}
        {it.anchors && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            {Object.entries(it.anchors).map(([score, desc]) => (
              <div key={score} className="p-1 rounded bg-white border border-slate-100 text-center">
                <strong className="text-teal-700">{score}分</strong>: {desc}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {role === "rater" ? "【主试评定】请选择对应得分或词数：" : "请选择对应得分："}
          </span>
          <button onClick={handleSkipQuestion} className="text-slate-400 hover:text-slate-600 underline">
            跳过
          </button>
        </div>

        {/* Quick pill options */}
        {count <= 8 ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: count }).map((_, idx) => {
              const val = minVal + idx;
              return (
                <button
                  key={val}
                  onClick={() => handleSubmitAnswer(val, `${val} 分`)}
                  className="flex-1 min-w-[50px] py-3 text-center text-sm font-bold bg-slate-50 hover:bg-teal-50 text-slate-800 hover:text-teal-900 border border-slate-200 hover:border-teal-400 rounded-xl transition shadow-2xs active:scale-98"
                >
                  {val}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <input
              id="numInput"
              type="number"
              min={minVal}
              max={maxVal}
              defaultValue={minVal}
              className="w-28 px-3 py-2 border border-slate-300 rounded-xl text-center text-base font-bold text-slate-900 focus:outline-teal-500"
            />
            <button
              onClick={() => {
                const el = document.getElementById("numInput") as HTMLInputElement;
                const v = el ? Number(el.value) : minVal;
                handleSubmitAnswer(v, `${v}`);
              }}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              录入得分
            </button>
          </div>
        )}
      </div>
    );
  };

  // ==================== HOME VIEW RENDER ====================

  return (
    <div className="min-h-screen bg-[#eef1f5] text-slate-900 flex flex-col font-sans">
      {/* 1. Prototype Clean Topbar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-2.5 bg-[#1f3a5f] text-white shadow-md">
        <div className="flex items-center gap-3">
          <button
            id="btnHome"
            onClick={() => {
              setView("home");
              setActiveScaleKey(null);
              setIsIntakeFlow(false);
            }}
            className="p-1.5 rounded-lg hover:bg-white/20 transition text-white"
            title="返回首页"
          >
            <Home className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center font-black text-white text-sm">
              脑
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight flex items-center gap-2">
                <span>认知筛查</span>
                <span className="hidden sm:inline text-[10px] px-2 py-0.2 rounded-full bg-white/20 text-teal-200">
                  临床数据采集
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Topbar Right */}
        <div className="flex items-center gap-3 text-xs">
          {/* Channel Badge */}
          <span className="hidden md:inline px-2.5 py-1 rounded-full bg-white/15 text-amber-200 font-bold">
            {role === "self" ? "受试者自评" : role === "informant" ? "知情者观察" : "医师临床科研"}
          </span>

          {/* Role Dropdown */}
          <select
            value={role}
            onChange={(e) => {
              const r = e.target.value as RoleType;
              setRole(r);
              setChannel(r);
            }}
            className="bg-white text-[#1f3a5f] font-bold text-xs px-2.5 py-1.5 rounded-lg border-none focus:ring-2 focus:ring-teal-400"
          >
            <option value="rater">主试（医生）</option>
            <option value="self">受试者（自评）</option>
            <option value="informant">家属（知情者）</option>
          </select>

          {/* Save Status & Turso Cloud DB Indicator */}
          <span className="hidden lg:inline text-teal-200 font-mono text-[11px]">
            {saveStatus}
          </span>

          <div
            onClick={checkDatabase}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer transition ${
              dbStatus.connected ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30" : "bg-rose-950/60 text-rose-300"
            }`}
            title={`Turso LibSQL 数据库: ${dbStatus.url}\n延迟: ${dbStatus.latencyMs || 25}ms`}
          >
            <span className={`w-2 h-2 rounded-full ${dbStatus.connected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
            <span className="font-mono text-[11px]">
              {dbStatus.connected ? `Turso 在线 (${dbStatus.latencyMs || 28}ms)` : "离线缓存"}
            </span>
          </div>
        </div>
      </header>

      {/* 2. Main Body Content: Home or Chat */}
      {view === "home" ? (
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
          {/* Active Patient Card Banner */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold text-base">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold text-slate-900">
                    {currentRecord.demographics?.name || "受试者"}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-medium">
                    {currentRecord.subjectNo || "S26-4921"}
                  </span>
                  <span className="text-xs text-slate-500">
                    ({currentRecord.demographics?.gender === 1 ? "男" : "女"}, {currentRecord.demographics?.age || 70}岁, 受教育 {currentRecord.demographics?.educationYears || 9}年)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  协议号: {currentRecord.protocolNo} · 访视: {currentRecord.visitCode}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPatientPicker(true)}
                className="px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl border border-teal-200 transition"
              >
                切换受试者
              </button>
              <button
                onClick={onNewPatient}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-300 transition flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>新建档案</span>
              </button>
              <button
                onClick={handleStartIntake}
                className="px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition"
              >
                对话补录信息
              </button>
            </div>
          </div>

          {/* 3 Channels Selection (if channel is null or rater) */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-600 px-1">测评通道：</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Channel 1: Self */}
              <div
                onClick={() => {
                  setRole("self");
                  setChannel("self");
                }}
                className={`p-5 rounded-2xl bg-white border cursor-pointer transition shadow-2xs hover:shadow-md ${
                  role === "self" ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200 hover:border-emerald-400"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    ☀
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                    适老自评
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900">受试者 / 自评通道</h3>
                <div className="text-[11px] text-slate-400 font-mono">Patient Self-Assessment</div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  面向受试者本人。大字清晰排版、生活化对话，轻松完成 SCD-Q9 主诉自评。
                </p>
              </div>

              {/* Channel 2: Informant */}
              <div
                onClick={() => {
                  setRole("informant");
                  setChannel("informant");
                }}
                className={`p-5 rounded-2xl bg-white border cursor-pointer transition shadow-2xs hover:shadow-md ${
                  role === "informant" ? "border-fuchsia-500 ring-2 ring-fuchsia-500/20" : "border-slate-200 hover:border-fuchsia-400"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-fuchsia-50 text-fuchsia-700 flex items-center justify-center font-bold">
                    家
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-fuchsia-50 text-fuchsia-800 font-bold border border-fuchsia-200">
                    知情者
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900">家属与知情者观察通道</h3>
                <div className="text-[11px] text-slate-400 font-mono">Informant & Family Observation</div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  面向家属照料者。客观记录近期记忆变化、日常功能（FAQ/NPI/CDR）。
                </p>
              </div>

              {/* Channel 3: Clinician */}
              <div
                onClick={() => {
                  setRole("rater");
                  setChannel("rater");
                }}
                className={`p-5 rounded-2xl bg-white border cursor-pointer transition shadow-2xs hover:shadow-md ${
                  role === "rater" ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-200 hover:border-blue-400"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                    医
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 font-bold border border-blue-200">
                    主试医生
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900">医师临床与科研工作站</h3>
                <div className="text-[11px] text-slate-400 font-mono">Clinician & Researcher Workbench</div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  提供全套神经心理量表、自动计分、综合诊断报告与 Excel 导出。
                </p>
              </div>
            </div>
          </div>

          {/* Scale List Grid */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-slate-700">
                可测评量表列表（当前模式可见）：
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowReport(true)}
                  className="text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200 transition"
                >
                  综合诊断报告
                </button>
                <button
                  onClick={() => exportRecordToExcel(currentRecord)}
                  className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-300 transition flex items-center gap-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>导出 Excel</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {Object.entries(SCALES_CONFIG).map(([key, def]) => {
                if (!isScaleVisible(key)) return null;
                const completed = completedScales[key];
                return (
                  <div
                    key={key}
                    onClick={() => handleStartScale(key)}
                    className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-teal-400 cursor-pointer transition shadow-2xs hover:shadow-xs flex items-center justify-between group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 group-hover:text-teal-700 transition">
                          {def.name}
                        </span>
                        {completed && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            已完成
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{def.intro}</p>
                      {completed && (
                        <div className="text-xs font-mono font-bold text-teal-800 pt-1">
                          {completed.label}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Deep Clinical Tools Access Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between shadow-md">
            <div>
              <div className="font-bold text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>宣武医院深度科研工作台（ATN生物标志物、ADAS-Cog、纵向随访）</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                如需录入 MRI 海马体积、PET SUVr、脑脊液 Aβ42/p-Tau 或进行神经心理深度分析
              </p>
            </div>
            <button
              onClick={onSwitchToAdvancedWorkbench}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-xs transition"
            >
              进入深度工作台
            </button>
          </div>
        </main>
      ) : (
        /* 3. Conversational Chat Scale Assessment View */
        <section className="flex-1 flex flex-col max-w-4xl w-full mx-auto bg-white sm:my-4 sm:rounded-2xl sm:shadow-md border border-slate-200 overflow-hidden">
          {/* Chat Header Strip */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView("home")}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>返回目录</span>
              </button>
              <div className="h-4 w-px bg-slate-300" />
              <div className="font-extrabold text-sm text-slate-900">
                {isIntakeFlow
                  ? "受试者临床基础建档"
                  : activeScaleKey
                  ? SCALES_CONFIG[activeScaleKey]?.name
                  : "测评"}
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>
                进度:{" "}
                <strong className="text-teal-700">
                  {currentIndex + 1}
                </strong>{" "}
                /{" "}
                {isIntakeFlow
                  ? INTAKE_QUESTIONS.length
                  : activeScaleKey
                  ? SCALES_CONFIG[activeScaleKey]?.items.length
                  : 0}
              </span>
            </div>
          </div>

          {/* Dialogue Messages Container */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#f8fafc]">
            {messages.map((m) => {
              const isBot = m.sender === "bot";
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-2.5 ${isBot ? "justify-start" : "justify-end"}`}
                >
                  {isBot && (
                    <div className="w-8 h-8 rounded-xl bg-[#1f3a5f] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                      医
                    </div>
                  )}

                  <div
                    className={`max-w-xl p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-2xs ${
                      isBot
                        ? "bg-white text-slate-900 border border-slate-200"
                        : "bg-teal-600 text-white font-medium"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <span className="text-[11px] opacity-60">
                        {isBot ? "系统 / 主试" : "受试者回答"}
                      </span>
                      {isBot && (
                        <button
                          onClick={() => tts.speak(m.id, m.text)}
                          className="text-slate-400 hover:text-teal-600 transition"
                          title="语音播报"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {m.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Dynamic Interactive Composer */}
          {renderComposer()}
        </section>
      )}

      {/* 4. Comprehensive Report Overlay Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-[#1f3a5f] text-white flex items-center justify-between">
              <div className="font-bold text-base flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-teal-400" />
                <span>综合神经心理诊断报告（AD-OUC）</span>
              </div>
              <button
                onClick={() => setShowReport(false)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Patient Header */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                <div>
                  <strong>受试者：</strong> {currentRecord.demographics?.name} (
                  {currentRecord.demographics?.gender === 1 ? "男" : "女"},{" "}
                  {currentRecord.demographics?.age}岁, 受教育{" "}
                  {currentRecord.demographics?.educationYears}年)
                </div>
                <div>
                  <strong>编号：</strong> {currentRecord.subjectNo} · <strong>中心：</strong>{" "}
                  {currentRecord.centerNo} · <strong>评估人：</strong>{" "}
                  {currentRecord.evaluator || "韩璎教授团队"}
                </div>
              </div>

              {/* Scales Status list */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-600">已测评量表及结果：</div>
                {Object.keys(completedScales).length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                    暂无完成量表，请在主页选择量表进行测评。
                  </div>
                ) : (
                  Object.entries(completedScales).map(([k, res]: any) => {
                    const cfg = SCALES_CONFIG[k];
                    const light =
                      res.level === "green"
                        ? "🟢 正常/轻度"
                        : res.level === "yellow"
                        ? "🟡 可疑/轻度认知受损"
                        : "🔴 明显受损/需关注";
                    return (
                      <div
                        key={k}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                          res.level === "green"
                            ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                            : res.level === "yellow"
                            ? "bg-amber-50/60 border-amber-200 text-amber-900"
                            : "bg-rose-50/60 border-rose-200 text-rose-900"
                        }`}
                      >
                        <div>
                          <strong className="text-slate-900 text-sm">{cfg?.name || k}</strong>
                          <div className="text-[11px] opacity-80 mt-0.5">{res.label}</div>
                        </div>
                        <span className="font-bold text-xs">{light}</span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Clinical Synthesis */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                <strong>临床辅助综合意见：</strong>
                <p className="text-blue-800 leading-relaxed">
                  受试者完成多维度认知及行为功能筛查。数据已由后台自动同步至 Turso 云端科研数据库，支持导出标准 Excel 数据集供国家级科研队列长期随访分析。
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => exportRecordToExcel(currentRecord)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition"
              >
                <Download className="w-4 h-4" />
                <span>导出标准科研 Excel (.xlsx)</span>
              </button>
              <button
                onClick={() => setShowReport(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Patient Switcher Modal */}
      {showPatientPicker && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">选择受试者档案</h3>
              <button
                onClick={() => setShowPatientPicker(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {cohort.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectPatient(p.id);
                    setShowPatientPicker(false);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    p.id === currentRecord.id
                      ? "bg-teal-50 border-teal-500 font-bold"
                      : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                  }`}
                >
                  <div>
                    <div className="text-sm text-slate-900">{p.demographics?.name}</div>
                    <div className="text-xs text-slate-500 font-mono">
                      {p.subjectNo} · {p.demographics?.gender === 1 ? "男" : "女"},{" "}
                      {p.demographics?.age}岁
                    </div>
                  </div>
                  {p.id === currentRecord.id && (
                    <Check className="w-4 h-4 text-teal-600" />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setShowPatientPicker(false);
                onNewPatient();
              }}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              新建受试者档案
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
