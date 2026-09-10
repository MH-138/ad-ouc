import React, { useState, useEffect } from "react";
import {
  X,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Clock,
  Send,
  ShieldCheck,
  Stethoscope,
  RefreshCw,
} from "lucide-react";
import { tursoApi } from "../services/tursoApi";
import { SubjectRecord } from "../types/assessment";

interface DoctorApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordUpdated?: (recordId: string) => void;
  activeRecord?: SubjectRecord;
}

export const DoctorApprovalModal: React.FC<DoctorApprovalModalProps> = ({
  isOpen,
  onClose,
  onRecordUpdated,
  activeRecord,
}) => {
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [doctorName, setDoctorName] = useState("韩璎 教授 / 主任医师");
  const [confirmedCategory, setConfirmedCategory] = useState<number>(2); // 2: SCD
  const [doctorNotes, setDoctorNotes] = useState<string>("");
  const [signingSuccess, setSigningSuccess] = useState(false);

  // Load pending list on open
  useEffect(() => {
    if (isOpen) {
      loadPending();
    }
  }, [isOpen]);

  const loadPending = async () => {
    setLoading(true);
    try {
      const items = await tursoApi.getPendingAiConsultations();
      setPendingList(items);
      if (items.length > 0) {
        setSelectedId(items[0].id);
        setDoctorNotes(items[0].suggestedDiagnosis || "");
        if (items[0].aiSummary?.suggestedCategory) {
          setConfirmedCategory(items[0].aiSummary.suggestedCategory);
        }
      } else {
        setSelectedId(null);
      }
    } catch (e) {
      console.error("Failed to load pending AI reviews:", e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentItem = pendingList.find((item) => item.id === selectedId);

  const handleApprove = async () => {
    if (!selectedId) return;
    if (!doctorName.trim()) {
      alert("请输入医师签名！");
      return;
    }

    setLoading(true);
    try {
      const res = await tursoApi.approveAiConsultation(
        selectedId,
        doctorName,
        doctorNotes,
        confirmedCategory
      );

      if (res.success) {
        setSigningSuccess(true);
        if (onRecordUpdated && currentItem?.patientId) {
          onRecordUpdated(currentItem.patientId);
        }
        setTimeout(() => {
          setSigningSuccess(false);
          loadPending();
        }, 1500);
      } else {
        alert("签署确认失败: " + (res.error || "未知错误"));
      }
    } catch (e: any) {
      alert("网络请求失败: " + e?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>AI 临床研判审核与医师签字确认</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-200">
                  待签字: {pendingList.length} 条
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                审核系统自动生成的临床推理报告，确认分型并签署医生电子签名
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadPending}
              disabled={loading}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 transition"
              title="刷新待审核列表"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left: Pending List */}
          <div className="w-full md:w-72 border-r border-slate-200 bg-slate-50/50 p-3 overflow-y-auto shrink-0">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
              待审核待办队列
            </div>
            {pendingList.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-70" />
                暂无待审核的 AI 临床研判
              </div>
            ) : (
              <div className="space-y-1.5">
                {pendingList.map((item) => {
                  const isSel = item.id === selectedId;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedId(item.id);
                        setDoctorNotes(item.suggestedDiagnosis || "");
                        if (item.aiSummary?.suggestedCategory) {
                          setConfirmedCategory(item.aiSummary.suggestedCategory);
                        }
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition text-xs ${
                        isSel
                          ? "bg-white border-teal-500 shadow-sm font-bold text-teal-950"
                          : "bg-white/80 border-slate-200 hover:bg-white text-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900">{item.patientName}</span>
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          待签字
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {item.suggestedDiagnosis || "AI 辅助研判结果"}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {item.createdAt?.split("T")[0] || "今日"}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Review & Signature Form */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-white">
            {signingSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  医师已签署，诊断意见已写入档案。
                </span>
              </div>
            )}

            {currentItem ? (
              <div className="space-y-4">
                {/* 1. Patient & AI Summary Card */}
                <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-900">
                      受试者：{currentItem.patientName} (档案号: {currentItem.patientId})
                    </span>
                    <span className="text-[11px] font-mono text-teal-700">
                      生成时间: {currentItem.createdAt?.replace("T", " ").slice(0, 16)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-teal-100">
                    <div className="font-bold text-slate-900 mb-1">
                      【AI 临床综合研判建议】
                    </div>
                    <p className="whitespace-pre-wrap">{currentItem.suggestedDiagnosis}</p>
                  </div>
                </div>

                {/* 2. Doctor Final Classification Choice */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-900 block">
                    1. 临床分型核定与确认：
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      { val: 1, label: "正常老年对照 (NC)" },
                      { val: 2, label: "主观认知下降 (SCD)" },
                      { val: 3, label: "遗忘型轻度认知障碍-单领域 (aMCI-sd)" },
                      { val: 4, label: "遗忘型轻度认知障碍-多领域 (aMCI-md)" },
                      { val: 5, label: "非遗忘型轻度认知障碍 (naMCI)" },
                      { val: 6, label: "阿尔茨海默病性痴呆 (ADD)" },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setConfirmedCategory(opt.val)}
                        className={`p-2.5 rounded-xl border text-left font-bold transition ${
                          confirmedCategory === opt.val
                            ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Doctor Notes / Revision */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900 block">
                    2. 主治医师最终诊断意见与随访建议（可在此直接修正）：
                  </label>
                  <textarea
                    rows={4}
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none leading-relaxed"
                    placeholder="在此输入或确认医师最终诊断综述..."
                  />
                </div>

                {/* 4. Doctor Signature */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-teal-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">医师电子签名</div>
                      <div className="text-[10px] text-slate-400">
                        签字后将作为医疗与科研随访唯一有效凭证写入云数据库
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white focus:border-teal-500 outline-none w-48 text-center"
                      placeholder="医师姓名 / 职称"
                    />
                    <button
                      onClick={handleApprove}
                      disabled={loading}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{loading ? "签署中..." : "医师签字并确认生成"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                <FileCheck className="w-12 h-12 text-slate-300 mx-auto" />
                <div className="font-bold text-slate-600">当前没有选中的待审核项目</div>
                <div>请从左侧列表选择待审核的受试者研判报告</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
