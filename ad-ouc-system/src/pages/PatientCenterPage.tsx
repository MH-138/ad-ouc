import React, { useState } from "react";
import {
  Users,
  Search,
  PlusCircle,
  Camera,
  Download,
  Brain,
  Award,
  FileCheck,
  FileSpreadsheet,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Activity,
  ChevronRight,
  ClipboardList,
  FileText,
} from "lucide-react";
import { SubjectRecord } from "../types/assessment";
import { AppPageId } from "../types/navigation";
import {
  evaluateCompleteAssessment,
  calculateGlobalCDR,
} from "../utils/scoringCalculators";

interface PatientCenterPageProps {
  currentRecord: SubjectRecord | null;
  cohort: SubjectRecord[];
  onSelectPatient: (patientId: string) => void;
  onUpdateRecord: (record: SubjectRecord) => void;
  onDeletePatient: (patientId: string) => void;
  onLoadPreset: (presetId: string) => void;
  onNewRecord: () => void;
  onOpenUploadModal: () => void;
  onExportExcel: (target?: SubjectRecord) => void;
  onNavigate: (page: AppPageId) => void;
}

export const PatientCenterPage: React.FC<PatientCenterPageProps> = ({
  currentRecord,
  cohort,
  onSelectPatient,
  onUpdateRecord,
  onDeletePatient,
  onLoadPreset,
  onNewRecord,
  onOpenUploadModal,
  onExportExcel,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "scd" | "mci" | "nc">("all");

  // Calculate cohort summary stats
  const totalCount = cohort.length;
  let scdCount = 0;
  let mciCount = 0;
  let ncCount = 0;

  cohort.forEach((p) => {
    const summary = evaluateCompleteAssessment(p);
    const pCdr = calculateGlobalCDR(p.scales.cdr);
    if (pCdr.globalCDR >= 0.5) {
      mciCount++;
    } else if (summary.scdQ9.isPositive) {
      scdCount++;
    } else {
      ncCount++;
    }
  });

  // Filter cohort list
  const filteredCohort = cohort.filter((patient) => {
    const term = searchTerm.toLowerCase();
    const nameMatch =
      (patient.demographics?.name && patient.demographics.name.toLowerCase().includes(term)) ||
      (patient.subjectNo && patient.subjectNo.toLowerCase().includes(term)) ||
      (patient.demographics?.phone1 && patient.demographics.phone1.includes(term));

    if (!nameMatch) return false;

    if (filterType === "all") return true;
    const summary = evaluateCompleteAssessment(patient);
    const pCdr = calculateGlobalCDR(patient.scales.cdr);
    if (filterType === "scd") return summary.scdQ9.isPositive && pCdr.globalCDR === 0;
    if (filterType === "mci") return pCdr.globalCDR >= 0.5;
    if (filterType === "nc") return !summary.scdQ9.isPositive && pCdr.globalCDR === 0;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Cohort Management Header & Statistics */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-tight">
                  受试者队列
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  选择受试者后进入量表、文档和报告流程
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onNewRecord}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ 新建受试者档案</span>
            </button>
            <button
              onClick={onOpenUploadModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-bold transition shadow-2xs"
            >
              <Camera className="w-4 h-4 text-teal-600" />
              <span>上传模拟文档</span>
            </button>
            <button
              onClick={() => onExportExcel()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition shadow-2xs"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>导出全队列Excel</span>
            </button>
          </div>
        </div>

        {/* Cohort Statistical KPI Cards */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-xs font-semibold text-slate-500">在册档案总数</div>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{totalCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">当前队列</div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80">
            <div className="text-xs font-semibold text-amber-800">SCD 主诉阳性</div>
            <div className="text-2xl font-black text-amber-700 mt-1 font-mono">{scdCount}</div>
            <div className="text-[11px] text-amber-600 mt-0.5">SCD-Q9 ≥ 5分</div>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200/80">
            <div className="text-xs font-semibold text-rose-800">aMCI 可疑受损</div>
            <div className="text-2xl font-black text-rose-700 mt-1 font-mono">{mciCount}</div>
            <div className="text-[11px] text-rose-600 mt-0.5">CDR ≥ 0.5分</div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
            <div className="text-xs font-semibold text-emerald-800">正常老年对照 NC</div>
            <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">{ncCount}</div>
            <div className="text-[11px] text-emerald-600 mt-0.5">认知与主诉正常</div>
          </div>
        </div>
      </div>

      {/* 2. Cohort Search, Filtering and List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">受试者档案列表</h2>
            <span className="text-xs text-slate-400">({filteredCohort.length} 位)</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索姓名 / 编号 / 手机号..."
                className="w-56 pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>

            {/* Filter Chips */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
              <button
                onClick={() => setFilterType("all")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterType === "all" ? "bg-white text-teal-700 font-bold shadow-2xs" : "hover:text-slate-900"
                }`}
              >
                全部 ({totalCount})
              </button>
              <button
                onClick={() => setFilterType("scd")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterType === "scd" ? "bg-white text-amber-800 font-bold shadow-2xs" : "hover:text-slate-900"
                }`}
              >
                SCD阳性 ({scdCount})
              </button>
              <button
                onClick={() => setFilterType("mci")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterType === "mci" ? "bg-white text-rose-800 font-bold shadow-2xs" : "hover:text-slate-900"
                }`}
              >
                aMCI ({mciCount})
              </button>
              <button
                onClick={() => setFilterType("nc")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterType === "nc" ? "bg-white text-emerald-800 font-bold shadow-2xs" : "hover:text-slate-900"
                }`}
              >
                NC正常 ({ncCount})
              </button>
            </div>
          </div>
        </div>

        {/* Cohort List Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-2">
          {filteredCohort.map((p) => {
            const isSelected = Boolean(currentRecord && p.id === currentRecord.id);
            const evalResult = evaluateCompleteAssessment(p);
            const pCdr = calculateGlobalCDR(p.scales.cdr);
            const isScdPos = evalResult.scdQ9.isPositive;
            const isMciPos = pCdr.globalCDR >= 0.5;

            return (
              <div
                key={p.id}
                className={`rounded-2xl border p-4.5 transition flex flex-col justify-between ${
                  isSelected
                    ? "border-teal-500 bg-teal-50/30 ring-2 ring-teal-500/20 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs"
                }`}
              >
                <div>
                  {/* Top line info */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base ${
                          isSelected
                            ? "bg-teal-600 text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {p.demographics?.name ? p.demographics.name.slice(0, 1) : "患"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-slate-900">
                            {p.demographics?.name || "未命名"}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {p.demographics?.gender === 1 ? "男" : "女"} · {p.demographics?.age || "--"}岁
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          编号: {p.subjectNo || p.id} · {p.visitCode || "W000"}
                        </div>
                      </div>
                    </div>

                    {/* Diagnostic Tag */}
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                        isMciPos
                          ? "bg-rose-50 text-rose-800 border-rose-200"
                          : isScdPos
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200"
                      }`}
                    >
                      {isMciPos ? "aMCI 可疑" : isScdPos ? "SCD 主诉阳性" : "NC 正常对照"}
                    </span>
                  </div>

                  {/* Clinical Scale Mini Grid */}
                  <div className="mt-3.5 grid grid-cols-4 gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400">SCD-Q9</div>
                      <div
                        className={`font-bold ${
                          isScdPos ? "text-amber-700 font-bold" : "text-emerald-700"
                        }`}
                      >
                        {evalResult.scdQ9.score}分
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">MMSE</div>
                      <div className="font-bold text-slate-800">{evalResult.mmse.score}分</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">MoCA-B</div>
                      <div className="font-bold text-slate-800">{evalResult.mocaB.score}分</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">CDR</div>
                      <div className="font-bold text-teal-800">{pCdr.globalCDR}分</div>
                    </div>
                  </div>

                  {/* Demographic Details line */}
                  <div className="mt-2.5 text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                    <span>受教育: {p.demographics?.educationYears ?? "--"}年</span>
                    <span>评定日期: {p.evalDate || "--"}</span>
                    {p.demographics?.phone1 && (
                      <span className="font-mono">电话: {p.demographics.phone1}</span>
                    )}
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        onSelectPatient(p.id);
                        onNavigate("mmse_page");
                      }}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold transition shadow-2xs flex items-center gap-1"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span>进入评定</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectPatient(p.id);
                        onNavigate("comprehensive_report");
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
                      title="查看综合报告"
                    >
                      <span>综合报告</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onExportExcel(p)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition"
                      title="导出此人Excel"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                    </button>
                    {cohort.length > 1 && (
                      <button
                        onClick={() => onDeletePatient(p.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="删除档案"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
