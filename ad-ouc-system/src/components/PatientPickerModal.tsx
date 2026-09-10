import React, { useState } from "react";
import { X, User, Plus, Check, Search } from "lucide-react";
import { SubjectRecord } from "../types/assessment";

interface PatientPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cohort: SubjectRecord[];
  activePatientId: string;
  onSelectPatient: (id: string) => void;
  onNewPatient: () => void;
}

export const PatientPickerModal: React.FC<PatientPickerModalProps> = ({
  isOpen,
  onClose,
  cohort,
  activePatientId,
  onSelectPatient,
  onNewPatient,
}) => {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filtered = cohort.filter((p) => {
    const q = search.toLowerCase();
    const name = (p.demographics?.name || "").toLowerCase();
    const no = (p.subjectNo || "").toLowerCase();
    return name.includes(q) || no.includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-base text-slate-900">选择受试者档案</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and New Patient button */}
        <div className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索姓名或编号..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-teal-500 bg-slate-50"
            />
          </div>
          <button
            onClick={() => {
              onNewPatient();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>新建档案</span>
          </button>
        </div>

        {/* Patient List */}
        <div className="mt-4 max-h-80 overflow-y-auto space-y-2 pr-1">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">未找到匹配的受试者档案</div>
          ) : (
            filtered.map((p) => {
              const isSelected = p.id === activePatientId;
              const name = p.demographics?.name || "未知姓名";
              const gender = p.demographics?.gender === 1 ? "男" : "女";
              const age = p.demographics?.age || "--";
              const no = p.subjectNo || p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectPatient(p.id);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "border-teal-500 bg-teal-50/50"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                        isSelected ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                        <span>{name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600">
                          {gender} · {age}岁
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        编号: {no}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-1 text-teal-700 font-bold text-xs">
                      <Check className="w-4 h-4" />
                      <span>当前</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
