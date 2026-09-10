import React, { useState, useEffect } from "react";
import { SubjectRecord } from "../types/assessment";
import {
  Users,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Save,
  MessageSquare,
  Activity,
  HeartHandshake,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  User,
  ListOrdered,
  LayoutList,
  Stethoscope,
} from "lucide-react";
import { calculateFAQ } from "../utils/scoringCalculators";
import { tursoApi } from "../services/tursoApi";

interface InformantInterviewPageProps {
  record: SubjectRecord;
  onUpdateRecord: (record: SubjectRecord) => void;
  onReturnToPortal: () => void;
}

const FAQ_QUESTIONS = [
  { key: 1, title: "1. 摆弄财务（如记账、写支票、算钱、缴水电费）" },
  { key: 2, title: "2. 填写表格、办理商业业务或保险" },
  { key: 3, title: "3. 独自外出购物（选择商品、付款找零）" },
  { key: 4, title: "4. 玩需要智力的游戏（如打桥牌、下棋、打麻将）" },
  { key: 5, title: "5. 操作电器（如微波炉、遥控器、手机智能应用）" },
  { key: 6, title: "6. 准备完整的一顿饭（买菜、切配、调味、烹饪）" },
  { key: 7, title: "7. 了解时事新闻并与家人讨论" },
  { key: 8, title: "8. 理解阅读材料（报纸、书籍或电视剧情节）" },
  { key: 9, title: "9. 记住约会、家庭节日、服药时间" },
  { key: 10, title: "10. 独自乘坐公共交通或在熟悉的社区周边出行" },
];

export const InformantInterviewPage: React.FC<InformantInterviewPageProps> = ({
  record,
  onUpdateRecord,
  onReturnToPortal,
}) => {
  const [activeTab, setActiveTab] = useState<"memory" | "faq" | "cdr_informant" | "doctor_feedback">("memory");
  const [saveToast, setSaveToast] = useState(false);

  // FAQ step-by-step answering mode
  const [faqStepMode, setFaqStepMode] = useState<boolean>(true);
  const [faqStepIndex, setFaqStepIndex] = useState<number>(0);

  const faqItems = record.scales.faq?.items || {};
  const faqAnsweredCount = Object.keys(faqItems).length;
  const faqScoreObj = calculateFAQ(faqItems);
  const faqScore = faqAnsweredCount >= 10 ? faqScoreObj.score : null;

  // Load saved draft on patient change or mount using flowId
  useEffect(() => {
    let isMounted = true;
    async function loadSavedDraft() {
      try {
        const draft = await tursoApi.loadDraft(record.id, "informant", "faq_cdr");
        if (draft && isMounted) {
          if (draft.faq || draft.informant || draft.cdr) {
            onUpdateRecord({
              ...record,
              scales: {
                ...record.scales,
                faq: draft.faq || record.scales.faq,
                cdr: draft.cdr || record.scales.cdr,
              },
              scdInterview: {
                ...record.scdInterview,
                informant: draft.informant || record.scdInterview.informant,
              },
            });
          }
        }
      } catch (e) {
        console.warn("Could not load informant draft:", e);
      }
    }
    loadSavedDraft();
    return () => {
      isMounted = false;
    };
  }, [record.id]);

  const handleUpdateRecord = async (patch: Partial<SubjectRecord>) => {
    const updated = {
      ...record,
      ...patch,
    };
    onUpdateRecord(updated);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);

    // Save draft to Turso cloud database with specific flowId
    try {
      await tursoApi.saveDraft(record.id, "informant", {
        updatedAt: new Date().toISOString(),
        faq: updated.scales.faq,
        informant: updated.scdInterview?.informant,
        cdr: updated.scales.cdr,
      }, "faq_cdr");
    } catch (e) {
      console.warn("Informant draft sync failed:", e);
    }
  };

  const updateFaqItem = (key: number, val: number) => {
    const currentFaq = record.scales.faq?.items || {};
    handleUpdateRecord({
      scales: {
        ...record.scales,
        faq: {
          ...record.scales.faq,
          items: {
            ...currentFaq,
            [key]: val,
          },
        },
      },
    });
  };

  const updateInformantField = (
    field: keyof SubjectRecord["scdInterview"]["informant"],
    val: any
  ) => {
    handleUpdateRecord({
      scdInterview: {
        ...record.scdInterview,
        informant: {
          ...record.scdInterview.informant,
          [field]: val,
        },
      },
    });
  };

  const updateCdrDomain = (
    domain: "memory" | "orientation" | "judgment" | "community" | "home" | "care",
    val: number
  ) => {
    handleUpdateRecord({
      scales: {
        ...record.scales,
        cdr: {
          ...record.scales.cdr,
          [domain]: val,
        },
      },
    });
  };

  // Check patient live progress
  const patientScdAnswers = record.scdInterview?.patientSCD || {};
  const patientScdCount = Object.values(patientScdAnswers).filter(Boolean).length;
  const patientHasBegun = patientScdCount > 0;
  const hasDiagnosis = !!record.diagnosis?.category;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-amber-500 selection:text-white">
      {/* 1. Header Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onReturnToPortal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回门户</span>
            </button>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-bold text-sm text-slate-900 leading-tight">
                  家属与知情者观察评定通道
                </h1>
                <div className="text-[11px] text-slate-500">
                  受试者: <strong className="text-slate-800">{record.demographics?.name || "未命名"}</strong> ({record.demographics?.gender === 1 ? "男" : "女"}, {record.demographics?.age || 70}岁)
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {saveToast && (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                已同步草稿
              </span>
            )}
          </div>
        </div>
      </header>

      {/* 2. Real-time Status Card of Patient */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 pt-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-900">受试者状态：</span>
            <span
              className={`px-2.5 py-1 rounded-full font-medium ${
                patientHasBegun
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {patientHasBegun
                ? `受试者本人已完成 SCD-Q9 自评 (${patientScdCount}/9 项)`
                : "受试者待完成本人自评"}
            </span>
          </div>

          <div className="text-slate-500 font-medium">
            家属观察评定进度：
            <strong className="text-amber-700">
              {faqAnsweredCount > 0 ? `FAQ ${faqAnsweredCount}/10 题` : "待开始评定"}
            </strong>
          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Tabs */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 pt-4">
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs flex gap-1.5">
          <button
            onClick={() => setActiveTab("memory")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "memory"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>1. 记忆与日常变化知情者观察</span>
          </button>
          <button
            onClick={() => setActiveTab("faq")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "faq"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>2. FAQ 日常生活活动能力量表</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/10">
              {faqAnsweredCount === 0 ? "待评定" : `${faqAnsweredCount}/10 题`}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("cdr_informant")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "cdr_informant"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>3. 临床痴呆分级 (CDR) 家属核实</span>
          </button>
          <button
            onClick={() => setActiveTab("doctor_feedback")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "doctor_feedback"
                ? "bg-teal-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>4. 医生综合诊断与随访反馈</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              record.diagnosis?.notes ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
            }`}>
              {record.diagnosis?.notes ? "已出具" : "待医生评定"}
            </span>
          </button>
        </div>
      </div>

      {/* 4. Main Form Content */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 flex-1">
        {activeTab === "memory" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    一、知情者主诉与近期认知改变
                  </h2>
                  <p className="text-xs text-slate-500">
                    请知情家属（伴侣、子女或长期共同居住者）客观回答受试者近1~2年的状态
                  </p>
                </div>
              </div>

              <div className="space-y-5 pt-4 border-t border-slate-100 text-xs">
                {/* Informant Confirmed Decline */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="font-bold text-slate-900 text-sm block">
                    1. 作为家属/知情者，您是否确切觉得受试者的记忆力或反应力比过去变差了？
                  </label>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => updateInformantField("hasInformant", true)}
                      className={`p-3 rounded-xl border text-center font-bold text-xs transition ${
                        record.scdInterview?.informant?.hasInformant === true
                          ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      是，家属能明确观察到认知/记忆变差
                    </button>
                    <button
                      type="button"
                      onClick={() => updateInformantField("hasInformant", false)}
                      className={`p-3 rounded-xl border text-center font-bold text-xs transition ${
                        record.scdInterview?.informant?.hasInformant === false
                          ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      否，家属觉得其记忆与同龄人无明显异常
                    </button>
                  </div>
                </div>

                {/* Relation */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="font-bold text-slate-900 text-sm block">
                    2. 知情者与受试者的关系：
                  </label>
                  <div className="grid grid-cols-5 gap-2 pt-1">
                    {[
                      { val: 1, label: "配偶" },
                      { val: 2, label: "子女" },
                      { val: 3, label: "兄弟姐妹" },
                      { val: 4, label: "朋友/邻里" },
                      { val: 5, label: "其他照料者" },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => updateInformantField("relation", opt.val as any)}
                        className={`p-2.5 rounded-xl border text-center font-bold text-xs transition ${
                          record.scdInterview?.informant?.relation === opt.val
                            ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Specific Complaints */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <label className="font-bold text-slate-900 text-sm block">
                    3. 家属日常观察到的具体变化表现（可多选）：
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { key: "repeatedQuestions", label: "经常重复提问或反复叙述同一件事" },
                      { key: "misplacingItems", label: "放错物品并找不着（如钥匙、存折、眼镜）" },
                      { key: "forgettingAppointments", label: "忘记约会、重要活动或服药时间" },
                      { key: "orientationDifficulty", label: "在以往熟悉的街道或场所走错路线" },
                      { key: "wordFindingTrouble", label: "说话时常卡壳，想不起常见熟人的名字或物品词汇" },
                      { key: "appliancesDifficulty", label: "使用微波炉、遥控器或智能手机变得吃力" },
                    ].map((item) => {
                      const isChecked = !!(record.scdInterview?.informant as any)?.[item.key];
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => updateInformantField(item.key as any, !isChecked)}
                          className={`p-3 rounded-xl border text-left font-bold text-xs transition flex items-center justify-between ${
                            isChecked
                              ? "bg-amber-50 border-amber-500 text-amber-900 font-bold"
                              : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <span>{item.label}</span>
                          <span
                            className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                              isChecked
                                ? "bg-amber-600 border-amber-600 text-white"
                                : "border-slate-300"
                            }`}
                          >
                            {isChecked && "✓"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "faq" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    二、FAQ 日常生活活动能力量表（知情者评定）
                  </h2>
                  <p className="text-xs text-slate-500">
                    评估受试者在过去 4 周内的实际独立生活能力（总分 0~30分，≥5分提示功能受损）
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {/* Mode switcher: step by step vs full list */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setFaqStepMode(true)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        faqStepMode
                          ? "bg-white text-amber-800 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                      <span>分步引导答题</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFaqStepMode(false)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        !faqStepMode
                          ? "bg-white text-amber-800 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <LayoutList className="w-3.5 h-3.5" />
                      <span>全表模式</span>
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">当前状态</span>
                    {faqAnsweredCount === 0 ? (
                      <span className="text-sm font-bold text-slate-400">
                        待评定 (0/10 题)
                      </span>
                    ) : (
                      <span
                        className={`text-xl font-bold font-mono ${
                          faqScore >= 5 ? "text-rose-600" : "text-emerald-700"
                        }`}
                      >
                        {faqScore}{" "}
                        <span className="text-xs font-normal text-slate-400">
                          / 30 分 ({faqAnsweredCount}/10 题)
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 1. Step-by-step Guided Answering Mode */}
              {faqStepMode ? (
                <div className="pt-4 border-t border-slate-100 space-y-6">
                  {/* Step progress pills */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {FAQ_QUESTIONS.map((q, idx) => {
                      const isAnswered = record.scales.faq?.items?.[q.key] !== undefined;
                      const isCurrent = idx === faqStepIndex;
                      return (
                        <button
                          key={q.key}
                          type="button"
                          onClick={() => setFaqStepIndex(idx)}
                          className={`flex-1 min-w-8 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center border ${
                            isCurrent
                              ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                              : isAnswered
                              ? "bg-amber-50 text-amber-900 border-amber-300 font-bold"
                              : "bg-slate-50 text-slate-400 border-slate-200"
                          }`}
                        >
                          {q.key}
                        </button>
                      );
                    })}
                  </div>

                  {/* Current Active Step Question Card */}
                  {(() => {
                    const currentQ = FAQ_QUESTIONS[faqStepIndex];
                    const currentVal = record.scales.faq?.items?.[currentQ.key];

                    return (
                      <div className="p-6 rounded-2xl bg-amber-50/30 border border-amber-200 space-y-5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-700 font-mono">
                            第 {faqStepIndex + 1} / {FAQ_QUESTIONS.length} 题
                          </span>
                          <span className="text-xs text-slate-400">
                            {currentVal !== undefined ? `已选: ${currentVal} 分` : "尚未作答"}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                          {currentQ.title}
                        </h3>

                        {/* Large, Easy-to-tap Option Buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          {[
                            { score: 0, label: "0分: 完全正常独立", desc: "无需任何提醒或协助，能独自独立完成" },
                            { score: 1, label: "1分: 有困难但能自理", desc: "完成略显吃力或较慢，但仍能自己做完" },
                            { score: 2, label: "2分: 需要别人协助", desc: "不能独立完成，需要家人或照料者指导协助" },
                            { score: 3, label: "3分: 完全依赖他人", desc: "完全丧失该项能力，完全由他人代劳" },
                          ].map((opt) => (
                            <button
                              key={opt.score}
                              type="button"
                              onClick={() => {
                                updateFaqItem(currentQ.key, opt.score);
                                if (faqStepIndex < FAQ_QUESTIONS.length - 1) {
                                  setFaqStepIndex(faqStepIndex + 1);
                                }
                              }}
                              className={`p-4 rounded-xl text-left transition border ${
                                currentVal === opt.score
                                  ? "bg-amber-600 text-white border-amber-600 shadow-md font-bold"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-amber-50/50 hover:border-amber-300"
                              }`}
                            >
                              <div className="text-sm font-bold">{opt.label}</div>
                              <div
                                className={`text-xs mt-1 ${
                                  currentVal === opt.score ? "text-amber-100" : "text-slate-500"
                                }`}
                              >
                                {opt.desc}
                              </div>
                            </button>
                          ))}
                        </div>

                        {/* Prev & Next Controls */}
                        <div className="flex items-center justify-between pt-4 border-t border-amber-100">
                          <button
                            type="button"
                            disabled={faqStepIndex === 0}
                            onClick={() => setFaqStepIndex(faqStepIndex - 1)}
                            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold transition disabled:opacity-40"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span>上一题</span>
                          </button>

                          {faqStepIndex < FAQ_QUESTIONS.length - 1 ? (
                            <button
                              type="button"
                              onClick={() => setFaqStepIndex(faqStepIndex + 1)}
                              className="flex items-center gap-1 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-2xs"
                            >
                              <span>下一题</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActiveTab("cdr_informant")}
                              className="flex items-center gap-1 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs"
                            >
                              <span>完成 FAQ 并进入 CDR 核实</span>
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* 2. Full Table Mode */
                <div className="space-y-4 pt-4 border-t border-slate-100 text-xs">
                  {FAQ_QUESTIONS.map((q) => {
                    const currentVal = record.scales.faq?.items?.[q.key];
                    return (
                      <div
                        key={q.key}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-slate-900">{q.title}</div>
                          <div className="text-[11px] text-slate-400">
                            {currentVal !== undefined ? `得分: ${currentVal}` : "未作答"}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                          {[
                            { score: 0, label: "0分: 完全正常独立" },
                            { score: 1, label: "1分: 有困难但能自理" },
                            { score: 2, label: "2分: 需要别人协助" },
                            { score: 3, label: "3分: 完全依赖他人" },
                          ].map((opt) => (
                            <button
                              key={opt.score}
                              type="button"
                              onClick={() => updateFaqItem(q.key, opt.score)}
                              className={`p-2 rounded-lg text-left text-xs font-semibold transition border ${
                                currentVal === opt.score
                                  ? "bg-amber-600 text-white border-amber-600 shadow-2xs font-bold"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "cdr_informant" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  三、CDR 临床痴呆评定量表（知情者问询六大领域）
                </h2>
                <p className="text-xs text-slate-500">
                  结合知情家属陈述核实：0分=健康无减退；0.5分=可疑/轻微减退(SCD/MCI)；1分=轻度痴呆
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100 text-xs">
                {[
                  {
                    key: "memory" as const,
                    name: "1. 记忆力 (Memory)",
                    desc: "近期事件遗忘、对重要事件的重现能力",
                  },
                  {
                    key: "orientation" as const,
                    name: "2. 定向力 (Orientation)",
                    desc: "时间定向（年月日）、地点定向（熟悉路线定位）",
                  },
                  {
                    key: "judgment" as const,
                    name: "3. 判断与解决问题能力 (Judgment)",
                    desc: "对突发事件的应对、商业财务判断、相似性辨析",
                  },
                  {
                    key: "community" as const,
                    name: "4. 社区事务能力 (Community Affairs)",
                    desc: "独自在单位工作、参与社区活动、银行购物交涉",
                  },
                  {
                    key: "home" as const,
                    name: "5. 家居与业余爱好 (Home and Hobbies)",
                    desc: "做家务、烹饪、园艺、使用工具的熟练程度",
                  },
                  {
                    key: "care" as const,
                    name: "6. 个人照料能力 (Personal Care)",
                    desc: "穿衣、洗漱、个人卫生、进食自理",
                  },
                ].map((dom) => {
                  const val = record.scales.cdr?.[dom.key];
                  return (
                    <div
                      key={dom.key}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-900">{dom.name}</div>
                        <div className="text-xs text-slate-500">{dom.desc}</div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {[
                          { score: 0, label: "0 分: 正常无受损" },
                          { score: 0.5, label: "0.5 分: 可疑/轻微受损" },
                          { score: 1, label: "1.0 分: 轻度受损" },
                          { score: 2, label: "2.0 分: 中度/严重受损" },
                        ].map((opt) => (
                          <button
                            key={opt.score}
                            type="button"
                            onClick={() => updateCdrDomain(dom.key, opt.score)}
                            className={`p-2.5 rounded-lg text-left text-xs font-semibold transition border ${
                              val === opt.score
                                ? "bg-amber-600 text-white border-amber-600 shadow-2xs font-bold"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "doctor_feedback" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      主治医师临床评估结论与家属随访指导
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      受试者完成自评与家属知情观察后，由主治医师综合出具的临床诊断分型与居家生活照护指南
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      record.diagnosis?.notes
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    {record.diagnosis?.notes ? "主治医师已出具随访指导" : "等待主治医生综合评估"}
                  </span>
                </div>
              </div>

              {/* Status Flow Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 font-semibold">1. 受试者本人自评</div>
                  <div className="text-sm font-bold text-slate-800 mt-1">
                    {patientHasBegun ? "已提交 SCD-Q9 自评" : "待完成本人自评"}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 font-semibold">2. 家属知情观察</div>
                  <div className="text-sm font-bold text-slate-800 mt-1">
                    {faqAnsweredCount > 0 ? `FAQ 已答 ${faqAnsweredCount}/10 项` : "待开始测评"}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200">
                  <div className="text-teal-800 font-semibold">3. 医生审核与指导</div>
                  <div className="text-sm font-bold text-teal-900 mt-1">
                    {record.diagnosis?.notes ? "已签署出具随访医嘱" : "待主治医师评定"}
                  </div>
                </div>
              </div>

              {/* Doctor Guidance Content */}
              {record.diagnosis?.notes ? (
                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200 space-y-2">
                    <div className="font-bold text-teal-900 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      <span>主治医师个性化诊断意见与随访医嘱：</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                      {record.diagnosis.notes}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                      <div className="font-bold text-slate-800">照料者居家提醒</div>
                      <p className="text-slate-500 leading-relaxed">
                        鼓励受试者自主完成力所能及的家务与社区活动，勿过早包办代替；多以正面鼓励为主，避免因记忆遗忘产生责备情绪。
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                      <div className="font-bold text-slate-800">定期神经心理随访复查</div>
                      <p className="text-slate-500 leading-relaxed">
                        建议遵医嘱在 {record.followUp?.nextVisitDate || "6至12个月"} 后前往宣武医院认知中心门诊复查量表及头颅影像。
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100">
                    <span>评估签署医师：{record.followUp?.evaluatorSignature || record.evaluator || "主治医师"}</span>
                    <span>档案编号：{record.subjectNo || record.id}</span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <Stethoscope className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="font-bold text-slate-700 text-xs">
                    受试者自评或家属观察已暂存，等待主治医师进行专业神经心理学测试
                  </div>
                  <p className="text-slate-400 text-[11px] max-w-md mx-auto">
                    主治医生在完成临床客观量表（MMSE/MoCA/AVLT/CDR）与生物标志物综合分析并签署后，针对家属的随访与照护指导将同步更新至此处。
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
