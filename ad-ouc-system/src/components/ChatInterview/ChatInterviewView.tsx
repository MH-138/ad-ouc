import React, { useState, useEffect, useRef } from "react";
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Camera,
  Play,
  Pause,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  HelpCircle,
  Clock,
  User,
  HeartPulse,
  Brain,
  Smile,
  Gamepad2,
  Users,
  Check,
} from "lucide-react";
import { SubjectRecord } from "../../types/assessment";
import {
  CHAT_TOPICS,
  CHAT_NODES,
  ChatNode,
  RoleType,
  TopicInfo,
} from "../../utils/chatDecisionTree";
import { tts } from "../../utils/ttsHelper";
import { evaluateCompleteAssessment, calculateCDRWashington } from "../../utils/scoringCalculators";
import { exportRecordToExcel } from "../../utils/excelExporter";

interface ChatInterviewViewProps {
  currentRecord: SubjectRecord;
  onUpdateRecord: (record: SubjectRecord) => void;
  onOpenUploadModal: () => void;
  onOpenAiModal: () => void;
  onOpenPrintModal: () => void;
  onSwitchToWorkbench: () => void;
  role?: RoleType;
}

interface MessageHistoryItem {
  id: string;
  nodeId: string;
  speaker: "ai" | "examiner" | "user";
  text: string;
  timestamp: string;
  value?: any;
}

export const ChatInterviewView: React.FC<ChatInterviewViewProps> = ({
  currentRecord,
  onUpdateRecord,
  onOpenUploadModal,
  onOpenAiModal,
  onOpenPrintModal,
  onSwitchToWorkbench,
  role = "examiner",
}) => {
  const [currentNodeId, setCurrentNodeId] = useState<string>("node_welcome");
  const [history, setHistory] = useState<MessageHistoryItem[]>([]);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [largeFont, setLargeFont] = useState(true); // default elderly-friendly large font
  const [lastSavedTime, setLastSavedTime] = useState<string>(
    new Date().toTimeString().slice(0, 8)
  );

  // VFT Countdown Timer State
  const [vftSeconds, setVftSeconds] = useState(60);
  const [vftRunning, setVftRunning] = useState(false);
  const [vftCount, setVftCount] = useState(16);
  const vftTimerRef = useRef<any>(null);

  // AVLT Selected Words in current round
  const [avltSelected, setAvltSelected] = useState<string[]>(
    currentRecord.scales?.avltH?.n1Words || []
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen to TTS state
  useEffect(() => {
    tts.setListener((id) => setSpeakingId(id));
    return () => {
      tts.stop();
    };
  }, []);

  // Initialize first welcome message
  useEffect(() => {
    if (history.length === 0) {
      const node = CHAT_NODES["node_welcome"];
      const prompt = getPromptForRole(node, role);
      setHistory([
        {
          id: "msg_init",
          nodeId: "node_welcome",
          speaker: node.speaker,
          text: prompt,
          timestamp: new Date().toTimeString().slice(0, 5),
        },
      ]);
    }
  }, [role]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, currentNodeId]);

  // Auto save timestamp updater
  useEffect(() => {
    setLastSavedTime(new Date().toTimeString().slice(0, 8));
  }, [currentRecord]);

  // VFT Timer Logic
  useEffect(() => {
    if (vftRunning && vftSeconds > 0) {
      vftTimerRef.current = setInterval(() => {
        setVftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(vftTimerRef.current);
            setVftRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(vftTimerRef.current);
    }
    return () => clearInterval(vftTimerRef.current);
  }, [vftRunning, vftSeconds]);

  const currentNode = CHAT_NODES[currentNodeId] || CHAT_NODES["node_welcome"];
  const summary = evaluateCompleteAssessment(currentRecord);
  const cdrResult = calculateCDRWashington(currentRecord.scales.cdr);

  function getPromptForRole(node: ChatNode, currentRole: RoleType | string = "examiner") {
    if (currentRole === "informant") return node.promptInformant || node.promptPatient;
    if (currentRole === "examiner") return node.promptExaminer || node.promptPatient;
    return node.promptPatient;
  }

  // Handle user response from interactive deck
  const handleSelectOption = (value: any, displayLabel?: string) => {
    const updated = currentNode.setValue(currentRecord, value);
    onUpdateRecord(updated);

    // Stop speech if speaking
    tts.stop();

    // Append to message history
    const userMsg: MessageHistoryItem = {
      id: `msg_user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      nodeId: currentNodeId,
      speaker: "user",
      text: displayLabel || (typeof value === "string" ? value : typeof value === "object" ? (value.label || JSON.stringify(value)) : String(value)),
      timestamp: new Date().toTimeString().slice(0, 5),
      value,
    };

    // Special terminal actions
    if (value === "view_dashboard") {
      onOpenAiModal();
      return;
    }
    if (value === "export_excel") {
      exportRecordToExcel(currentRecord);
      return;
    }
    if (value === "print_report") {
      onOpenPrintModal();
      return;
    }
    if (value === "ocr_upload") {
      onOpenUploadModal();
      return;
    }

    const nextNodeId = currentNode.getNextNodeId(updated, value);

    if (nextNodeId && CHAT_NODES[nextNodeId]) {
      const nextNode = CHAT_NODES[nextNodeId];
      const nextPrompt = getPromptForRole(nextNode, role);

      const aiMsg: MessageHistoryItem = {
        id: `msg_ai_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        nodeId: nextNodeId,
        speaker: nextNode.speaker,
        text: nextPrompt,
        timestamp: new Date().toTimeString().slice(0, 5),
      };

      setHistory((prev) => [...prev, userMsg, aiMsg]);
      setCurrentNodeId(nextNodeId);

      // Auto TTS if patient mode and supported
      if (role === "patient" && nextNode.speechText) {
        tts.speak(aiMsg.id, nextNode.speechText);
      }
    } else {
      setHistory((prev) => [...prev, userMsg]);
    }
  };

  const handleToggleTts = (id: string, text: string) => {
    tts.speak(id, text);
  };

  const handleTopicJump = (topic: TopicInfo) => {
    tts.stop();
    const targetNodeId = topic.firstNodeId;
    const node = CHAT_NODES[targetNodeId];
    if (!node) return;

    setCurrentNodeId(targetNodeId);
    const prompt = getPromptForRole(node, role);
    const aiMsg: MessageHistoryItem = {
      id: "msg_jump_" + Date.now(),
      nodeId: targetNodeId,
      speaker: node.speaker,
      text: prompt,
      timestamp: new Date().toTimeString().slice(0, 5),
    };
    setHistory((prev) => [...prev, aiMsg]);
  };

  const getTopicIcon = (iconName: string) => {
    switch (iconName) {
      case "Handshake":
        return <User className="h-4 w-4" />;
      case "HeartPulse":
        return <HeartPulse className="h-4 w-4" />;
      case "Brain":
        return <Brain className="h-4 w-4" />;
      case "Smile":
        return <Smile className="h-4 w-4" />;
      case "Gamepad2":
        return <Gamepad2 className="h-4 w-4" />;
      case "Users":
        return <Users className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-50">
      {/* Top Banner */}
      <div className="border-b border-slate-200 bg-white px-4 py-2.5 shadow-2xs shrink-0">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          {/* Channel Label */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              {role === "patient" ? "👵 受试者自评问答" : role === "informant" ? "👩‍👧 知情者观察" : "👨‍⚕️ 测评问答"}
            </span>
            <span className="text-[11px] text-slate-400">
              · 当前受试者: {currentRecord.demographics?.name || "未命名"}
            </span>
          </div>

          {/* Quick status indicators */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setLargeFont(!largeFont)}
              className={`rounded-lg border px-2.5 py-1 font-semibold transition ${
                largeFont
                  ? "border-teal-500 bg-teal-50 text-teal-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
              title="切换适老化超大字体"
            >
              {largeFont ? "🔍 超大字体 (适老)" : "🔍 标准字体"}
            </button>
          </div>
        </div>

        {/* 6 Conversational Topic Progress Tabs */}
        <div className="mx-auto mt-2 flex max-w-3xl items-center gap-1.5 overflow-x-auto pb-1">
          {CHAT_TOPICS.map((topic, index) => {
            const isCurrent = topic.id === currentNode.topicId;
            return (
              <button
                key={topic.id}
                onClick={() => handleTopicJump(topic)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  isCurrent
                    ? "bg-teal-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {getTopicIcon(topic.icon)}
                <span>{topic.name}</span>
                <span className="text-[10px] opacity-75">({index + 1}/6)</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Conversation Area with Response Deck Pinned at Bottom */}
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden">
        {/* Message Stream (Scrollable) */}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 pr-2">
          {history.map((msg) => {
            const isAi = msg.speaker === "ai" || msg.speaker === "examiner";
            const isSpeaking = speakingId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isAi ? "justify-start" : "justify-end"}`}
              >
                {isAi && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-tr from-teal-600 to-cyan-500 text-white shadow-sm">
                    <Sparkles className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`relative max-w-[85%] rounded-2xl p-4 shadow-xs transition ${
                    isAi
                      ? "rounded-tl-xs border border-teal-100 bg-white text-slate-800"
                      : "rounded-tr-xs bg-teal-600 text-white"
                  }`}
                >
                  <div
                    className={`leading-relaxed ${
                      largeFont ? "text-lg font-medium" : "text-base"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Audio Readout Speaker Button on AI messages */}
                  {isAi && (
                    <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-400">
                      <button
                        onClick={() => handleToggleTts(msg.id, msg.text)}
                        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold transition ${
                          isSpeaking
                            ? "bg-teal-600 text-white animate-pulse"
                            : "bg-teal-50 text-teal-700 hover:bg-teal-100"
                        }`}
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX className="h-3.5 w-3.5" />
                            <span>正在朗读... (点击停止)</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-3.5 w-3.5" />
                            <span>🔊 语音朗读</span>
                          </>
                        )}
                      </button>
                      <span>{msg.timestamp}</span>
                    </div>
                  )}
                </div>

                {!isAi && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white shadow-2xs">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Interactive Response Deck (Anchored firmly at Bottom) */}
        <div className="shrink-0 border-t border-slate-200 bg-white p-4 shadow-lg">
          {/* Deck Header prompt */}
          <div className="mb-2.5 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>👉 请选择或输入您的回答：</span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-600">
              {currentNode.title}
            </span>
          </div>

          {/* 1. BUTTONS INPUT TYPE */}
          {currentNode.inputType === "buttons" && currentNode.options && (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {currentNode.options.map((opt, optIdx) => (
                <button
                  key={`${currentNode.id}-btn-${optIdx}-${opt.label}`}
                  onClick={() => handleSelectOption(opt.value, opt.label)}
                  className={`flex min-h-[52px] items-center justify-center rounded-xl border p-3.5 text-center font-bold transition active:scale-[0.98] ${
                    largeFont ? "text-lg" : "text-base"
                  } ${
                    opt.color === "emerald"
                      ? "border-emerald-200 bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100"
                      : opt.color === "amber"
                      ? "border-amber-200 bg-amber-50/80 text-amber-800 hover:bg-amber-100"
                      : opt.color === "rose"
                      ? "border-rose-200 bg-rose-50/80 text-rose-800 hover:bg-rose-100"
                      : opt.color === "indigo"
                      ? "border-indigo-200 bg-indigo-50/80 text-indigo-800 hover:bg-indigo-100"
                      : "border-teal-200 bg-teal-50/80 text-teal-900 hover:bg-teal-100"
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span>{opt.label}</span>
                    {opt.subText && (
                      <span className="text-xs font-normal opacity-70">{opt.subText}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 2. EMOTION SCALE DECK (😊 🙂 😐 🙁 😭) */}
          {currentNode.inputType === "emotion_scale" && currentNode.options && (
            <div className="grid grid-cols-5 gap-2">
              {currentNode.options.map((opt, optIdx) => (
                <button
                  key={`${currentNode.id}-emo-${optIdx}-${opt.label}`}
                  onClick={() => handleSelectOption(opt.value, `${opt.icon} ${opt.label}`)}
                  className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-teal-400 hover:bg-teal-50/60 active:scale-95"
                >
                  <span className="text-3xl sm:text-4xl">{opt.icon}</span>
                  <span className="mt-1.5 text-center text-xs font-bold text-slate-700">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* 3. NUMBER STEPPER */}
          {currentNode.inputType === "number_stepper" && currentNode.numberConfig && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => {
                    const current = currentNode.getValue(currentRecord);
                    const min = currentNode.numberConfig?.min || 0;
                    handleSelectOption(Math.max(min, current - 1));
                  }}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl font-bold text-slate-700 hover:bg-slate-200"
                >
                  -
                </button>
                <div className="flex items-baseline gap-1 text-3xl font-extrabold text-teal-700">
                  <span>{currentNode.getValue(currentRecord)}</span>
                  <span className="text-sm font-semibold text-slate-500">
                    {currentNode.numberConfig.unit}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const current = currentNode.getValue(currentRecord);
                    const max = currentNode.numberConfig?.max || 100;
                    handleSelectOption(Math.min(max, current + 1));
                  }}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl font-bold text-slate-700 hover:bg-slate-200"
                >
                  +
                </button>
              </div>

              {/* Quick Presets */}
              {currentNode.numberConfig.presets && (
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  <span className="text-xs text-slate-400">快速点选：</span>
                  {currentNode.numberConfig.presets.map((p, pIdx) => (
                    <button
                      key={`${currentNode.id}-preset-${pIdx}-${p}`}
                      onClick={() => handleSelectOption(p, `${p} ${currentNode.numberConfig?.unit}`)}
                      className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-teal-100 hover:text-teal-800"
                    >
                      {p} {currentNode.numberConfig?.unit}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. TEXT INPUT */}
          {currentNode.inputType === "text_input" && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                defaultValue={currentNode.getValue(currentRecord)}
                placeholder="请输入内容..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSelectOption((e.target as HTMLInputElement).value);
                  }
                }}
                id="chat-text-input"
                className={`flex-1 rounded-xl border border-slate-200 p-3 font-semibold text-slate-800 focus:border-teal-500 focus:outline-hidden ${
                  largeFont ? "text-lg" : "text-base"
                }`}
              />
              <button
                onClick={() => {
                  const input = document.getElementById("chat-text-input") as HTMLInputElement;
                  if (input) handleSelectOption(input.value || "张建华");
                }}
                className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-6 py-3 font-bold text-white shadow-xs hover:bg-teal-700"
              >
                <span>确定</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* 5. AVLT ROUND CARD (N1-N3 即刻学习轮次卡片) */}
          {currentNode.inputType === "avlt_round_card" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                主试朗读12个词语后，点击受试者正确回忆出的词条（变绿计分）：
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {[
                  "外套",
                  "水仙",
                  "教师",
                  "夹克",
                  "玫瑰",
                  "司机",
                  "衬衫",
                  "菊花",
                  "厨师",
                  "毛衣",
                  "荷花",
                  "医生",
                ].map((word) => {
                  const isSelected = avltSelected.includes(word);
                  return (
                    <button
                      key={word}
                      onClick={() => {
                        const nextWords = isSelected
                          ? avltSelected.filter((w) => w !== word)
                          : [...avltSelected, word];
                        setAvltSelected(nextWords);
                      }}
                      className={`flex items-center justify-between rounded-xl border p-2.5 text-sm font-bold transition ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span>{word}</span>
                      {isSelected && <Check className="h-4 w-4 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-teal-700">
                  当前回忆得分：{avltSelected.length} / 12 词
                </span>
                <button
                  onClick={() => handleSelectOption(avltSelected, `正确回忆 ${avltSelected.length} 词`)}
                  className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-700"
                >
                  确认本轮并继续
                </button>
              </div>
            </div>
          )}

          {/* 6. VFT 60s BIG COUNTDOWN TIMER */}
          {currentNode.inputType === "vft_countdown" && (
            <div className="flex flex-col items-center space-y-4 py-2">
              <div
                className={`flex h-24 w-44 items-center justify-center rounded-2xl font-mono text-5xl font-extrabold border-2 transition shadow-xs ${
                  vftSeconds <= 10 && vftSeconds > 0
                    ? "bg-rose-100 border-rose-400 text-rose-700 animate-pulse"
                    : "bg-teal-50 border-teal-200 text-teal-800"
                }`}
              >
                {String(Math.floor(vftSeconds / 60)).padStart(2, "0")}:
                {String(vftSeconds % 60).padStart(2, "0")}
              </div>

              {/* Timer Controls & Counter */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setVftRunning(!vftRunning)}
                  className={`flex items-center gap-1.5 rounded-xl px-5 py-2.5 font-bold text-white shadow-xs ${
                    vftRunning ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {vftRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  <span>{vftRunning ? "暂停计时" : "开始 60 秒倒计时"}</span>
                </button>

                <button
                  onClick={() => {
                    setVftSeconds(60);
                    setVftRunning(false);
                  }}
                  className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-100"
                  title="重置"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              {/* Animal Counter Stepper */}
              <div className="flex items-center gap-3 rounded-xl bg-slate-100 p-2">
                <span className="text-xs font-semibold text-slate-600">说出动物数：</span>
                <button
                  onClick={() => setVftCount(Math.max(0, vftCount - 1))}
                  className="h-8 w-8 rounded-lg bg-white font-bold text-slate-700 shadow-xs"
                >
                  -
                </button>
                <span className="w-8 text-center text-lg font-bold text-slate-800">
                  {vftCount}
                </span>
                <button
                  onClick={() => setVftCount(vftCount + 1)}
                  className="h-8 w-8 rounded-lg bg-white font-bold text-slate-700 shadow-xs"
                >
                  +
                </button>
                <button
                  onClick={() => setVftCount(vftCount + 5)}
                  className="rounded-lg bg-teal-100 px-2 py-1 text-xs font-bold text-teal-800"
                >
                  +5
                </button>
              </div>

              <button
                onClick={() => handleSelectOption(vftCount, `1分钟产出动物 ${vftCount} 个`)}
                className="w-full rounded-xl bg-teal-600 py-3 text-sm font-bold text-white shadow-xs hover:bg-teal-700"
              >
                完成并记录 VFT 流畅性得分
              </button>
            </div>
          )}

          {/* 7. SCALE SCORE SUMMARY (Traffic light warning) */}
          {currentNode.inputType === "scale_score_summary" && (
            <div className="space-y-3">
              <div
                className={`rounded-xl p-4 ${
                  summary.scdQ9.isPositive
                    ? "border border-amber-300 bg-amber-50 text-amber-900"
                    : "border border-emerald-300 bg-emerald-50 text-emerald-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    {summary.scdQ9.isPositive ? (
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    )}
                    <span>SCD-Q9 主观记忆自评总分: {summary.scdQ9.score} / 9 分</span>
                  </div>
                  <span
                    className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                      summary.scdQ9.isPositive
                        ? "bg-amber-200 text-amber-900"
                        : "bg-emerald-200 text-emerald-900"
                    }`}
                  >
                    {summary.scdQ9.isPositive ? "🟡 主诉显著 (≥5分)" : "🟢 正常波动 (<5分)"}
                  </span>
                </div>
                <p className="mt-2 text-xs opacity-90">
                  {summary.scdQ9.isPositive
                    ? "受试者存在明确的记忆下降主诉和主观担忧，符合 SCD 核心入组特征，建议结合客观认知量表及海马 MRI 进一步随访。"
                    : "目前主观记忆主诉处于同龄人正常波动范围。"}
                </p>
              </div>

              <button
                onClick={() => handleSelectOption("continue", "继续下一模块")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 font-bold text-white shadow-xs hover:bg-teal-700"
              >
                <span>继续情绪与睡眠评估</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* 8. UPLOAD CARD INPUT TYPE */}
          {currentNode.inputType === "upload_card" && (
            <div className="flex flex-col items-center justify-center space-y-3 py-3">
              <button
                onClick={onOpenUploadModal}
                className="flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700"
              >
                <Camera className="h-5 w-5" />
                <span>打开拍照 / 文件上传解析窗口</span>
              </button>
              <button
                onClick={() => handleSelectOption("manual", "手动输入")}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                跳过拍照，直接手动填写
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
