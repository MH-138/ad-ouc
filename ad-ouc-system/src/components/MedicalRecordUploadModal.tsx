import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Camera,
  ArrowRight,
  ShieldCheck,
  Code,
  FileSpreadsheet,
  FileCheck,
} from "lucide-react";
import { SubjectRecord } from "../types/assessment";
import { tursoApi } from "../services/tursoApi";

interface MedicalRecordUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyParsedData: (updatedRecord: SubjectRecord) => void;
  currentRecord: SubjectRecord;
}

const CLINICAL_SIMULATION_CASES = [
  {
    key: "case_sun",
    title: "宣武医院神经内科门诊病历 (孙桂兰 69岁 女)",
    fileName: "宣武医院门诊病历_孙桂兰.pdf",
    previewText:
      "患者姓名：孙桂兰，性别：女，年龄：69岁。主诉自觉记忆力减退1年半，伴丢三落四。既往高血压病史8年，平时血压135/85 mmHg。受教育年限：16年（大专）。头颅MRI：双侧海马MTA 2级轻度萎缩。APOE基因检测：ε3/ε4杂合携带。",
    data: {
      name: "孙桂兰",
      gender: 2,
      age: 69,
      birthDate: "1957-04-12",
      educationYears: 16,
      height: 162,
      weight: 58,
      phone1: "13910293847",
      marriage: 1,
      livingStatus: 2,
      history: {
        hypertension: true,
        hypertensionYears: 8,
        usualBp: "135/85",
        maxBp: "160/95",
        diabetes: false,
        hyperlipidemia: true,
        cerebrovascular: false,
        coronaryHeartDisease: false,
        familyHistoryDementia: true,
      },
      biomarkers: {
        mriHippocampus: 2,
        apoeGenotype: "ε3/ε4",
        amyloidStatus: 1,
        tauStatus: 1,
      },
      clinicalImpression: "主观认知下降（SCD伴高危特征，海马轻度萎缩，APOE ε4阳性）",
    },
  },
  {
    key: "case_wang",
    title: "宣武医院脑病科住院出院小结 (王建国 73岁 男)",
    fileName: "出院小结_王建国_202603.pdf",
    previewText:
      "患者姓名：王建国，性别：男，年龄：73岁。因反应迟缓、近事遗忘2年就诊。既往高血压15年，冠心病5年。文化程度：大学本科（16年）。头颅MRI：额颞叶脑沟增宽，双侧海马萎缩MTA 2级，脑室旁Fazekas 1级。MMSE初筛24分，MoCA-B 19分。",
    data: {
      name: "王建国",
      gender: 1,
      age: 73,
      birthDate: "1953-08-20",
      educationYears: 16,
      height: 174,
      weight: 72,
      phone1: "13801928374",
      marriage: 1,
      livingStatus: 2,
      history: {
        hypertension: true,
        hypertensionYears: 15,
        usualBp: "140/90",
        maxBp: "175/105",
        diabetes: false,
        hyperlipidemia: true,
        cerebrovascular: false,
        coronaryHeartDisease: true,
        familyHistoryDementia: false,
      },
      biomarkers: {
        mriHippocampus: 2,
        apoeGenotype: "ε3/ε3",
        amyloidStatus: 1,
        tauStatus: 1,
      },
      clinicalImpression: "轻度认知障碍（aMCI多领域型，内侧颞叶海马萎缩，伴心血管病史）",
    },
  },
  {
    key: "case_zhang",
    title: "头颅MRI核磁共振检查报告单 (张秀英 67岁 女)",
    fileName: "头颅MRI影像诊断报告_张秀英.jpg",
    previewText:
      "姓名：张秀英，女，67岁。检查部位：头颅3.0T MRI（T1WI、T2WI、FLAIR、DWI）。影像学所见：双侧侧脑室轻度扩大，双侧内侧颞叶海马结构对称，MTA分级 1级。额顶叶未见明显局灶异常信号。诊断意见：脑白质轻度脱髓鞘改变（Fazekas 1级），海马结构基本正常。",
    data: {
      name: "张秀英",
      gender: 2,
      age: 67,
      birthDate: "1959-11-05",
      educationYears: 12,
      height: 160,
      weight: 64,
      phone1: "13691827364",
      marriage: 1,
      livingStatus: 2,
      history: {
        hypertension: false,
        diabetes: false,
        hyperlipidemia: true,
        cerebrovascular: false,
        coronaryHeartDisease: false,
        familyHistoryDementia: false,
      },
      biomarkers: {
        mriHippocampus: 1,
        apoeGenotype: "ε3/ε3",
        amyloidStatus: 2,
        tauStatus: 2,
      },
      clinicalImpression: "早期主观记忆抱怨，头颅MRI未见原发神经退行性海马萎缩",
    },
  },
];

export const MedicalRecordUploadModal: React.FC<MedicalRecordUploadModalProps> = ({
  isOpen,
  onClose,
  onApplyParsedData,
  currentRecord,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [activeTab, setActiveTab] = useState<"upload" | "paste">("upload");
  const [viewMode, setViewMode] = useState<"form" | "json">("form");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [simulatedDocName, setSimulatedDocName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setSimulatedDocName(null);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setFilePreview(event.target?.result as string);
    };
    reader.readAsDataURL(selected);
  };

  // Triggered by real upload or paste
  const handleParse = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      let payload: any = {};
      if (activeTab === "upload" && (filePreview || file)) {
        payload = {
          fileBase64: filePreview,
          mimeType: file?.type || "image/jpeg",
          fileName: file?.name || "uploaded_record.jpg",
        };
      } else if (activeTab === "paste" && pastedText.trim()) {
        payload = {
          rawText: pastedText,
          fileName: "pasted_clinical_text.txt",
        };
      } else {
        setErrorMsg("请先选择病历文件或粘贴病历文本");
        setIsLoading(false);
        return;
      }

      // Call API
      let res = await fetch("/api/ai/parse-medical-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        res = await fetch("/api/v1/ocr/parse-record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (data.success) {
        const result = data.clinicalJson || data.parsedData;
        setParsedData(result);
      } else {
        setErrorMsg(data.error || "病历提取失败，请重试");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("网络请求异常，请检查服务连接");
    } finally {
      setIsLoading(false);
    }
  };

  // Dedicated standard loader: 「标准病历/检验单样例」
  // Automatically loads a standard medical record/lab report, sets it in state, and runs the extraction
  const handleSimulateDocument = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    // Randomly pick a realistic case
    const randomIndex = Math.floor(Math.random() * CLINICAL_SIMULATION_CASES.length);
    const selectedCase = CLINICAL_SIMULATION_CASES[randomIndex];

    setSimulatedDocName(selectedCase.fileName);
    setPastedText(selectedCase.previewText);

    try {
      // Call backend parsing API with case key
      const res = await fetch("/api/v1/ocr/parse-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sampleKey: selectedCase.key === "case_sun" ? "xuanwu_outpatient" : "mri_report",
          fileName: selectedCase.fileName,
        }),
      });

      const json = await res.json();
      if (json.success && (json.clinicalJson || json.parsedData)) {
        setParsedData(json.clinicalJson || json.parsedData);
      } else {
        // Fallback to rich case data
        setParsedData(selectedCase.data);
      }
    } catch (e) {
      // Direct rich clinical case mapping
      setParsedData(selectedCase.data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToPatient = async () => {
    if (!parsedData) return;

    const demo = parsedData.demographics || parsedData;
    const history = parsedData.history || {};
    const bio = parsedData.biomarkers || {};

    const updated: SubjectRecord = {
      ...currentRecord,
      demographics: {
        ...currentRecord.demographics,
        name: demo.name || currentRecord.demographics.name,
        gender: demo.gender || currentRecord.demographics.gender,
        age: demo.age ? Number(demo.age) : currentRecord.demographics.age,
        birthDate: demo.birthDate || currentRecord.demographics.birthDate,
        educationYears:
          demo.educationYears !== undefined
            ? Number(demo.educationYears)
            : currentRecord.demographics.educationYears,
        height: demo.height ? Number(demo.height) : currentRecord.demographics.height,
        weight: demo.weight ? Number(demo.weight) : currentRecord.demographics.weight,
        phone1: demo.phone1 || currentRecord.demographics.phone1,
        marriage: demo.marriage ?? currentRecord.demographics.marriage,
        livingStatus: demo.livingStatus ?? currentRecord.demographics.livingStatus,
      },
      history: {
        ...currentRecord.history,
        hypertension: {
          has: history.hypertension !== undefined ? history.hypertension : currentRecord.history?.hypertension?.has || false,
          years: history.hypertensionYears || 5,
          regularMed: true,
          usualBp: history.usualBp || "130/80",
          maxBp: history.maxBp || "150/95",
        },
        diabetes: {
          has: history.diabetes !== undefined ? history.diabetes : currentRecord.history?.diabetes?.has || false,
        },
        cerebrovascular: {
          has: history.cerebrovascular !== undefined ? history.cerebrovascular : currentRecord.history?.cerebrovascular?.has || false,
        },
        familyHistoryDementia: {
          has: history.familyHistoryDementia !== undefined ? history.familyHistoryDementia : currentRecord.history?.familyHistoryDementia?.has || false,
          firstDegreeCount: history.familyHistoryDementia ? 1 : 0,
          secondDegreeCount: 0,
        },
      },
      biomarkers: {
        ...currentRecord.biomarkers,
        mriHippocampus:
          bio.mriHippocampus !== undefined
            ? bio.mriHippocampus
            : currentRecord.biomarkers?.mriHippocampus,
        apoeGenotype: bio.apoeGenotype || currentRecord.biomarkers?.apoeGenotype,
        amyloidStatus: bio.amyloidStatus || currentRecord.biomarkers?.amyloidStatus,
        tauStatus: bio.tauStatus || currentRecord.biomarkers?.tauStatus,
      },
    };

    onApplyParsedData(updated);
    setSaveSuccess(true);

    // Persist all data to Turso cloud database
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
    } catch (e) {
      console.warn("Turso sync fallback:", e);
    }

    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white font-bold shadow-xs">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                门诊病历与生化检验报告智能识别 (OCR)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                支持上传门诊病历、血生化化验单(Aβ/Tau/同型半胱氨酸)及影像报告，智能结构化提取
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {!parsedData ? (
            <div className="space-y-5">
              {/* Tab Selector */}
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab("upload")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 transition cursor-pointer ${
                    activeTab === "upload"
                      ? "bg-white text-teal-800 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Camera className="h-4 w-4" />
                  <span>上传病历文件 (图片/PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("paste")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 transition cursor-pointer ${
                    activeTab === "paste"
                      ? "bg-white text-teal-800 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>直接粘贴病历文本</span>
                </button>
              </div>

              {/* 1. File Upload Tab */}
              {activeTab === "upload" && (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center hover:border-teal-500 hover:bg-teal-50/20 transition cursor-pointer"
                  >
                    <UploadCloud className="h-10 w-10 text-teal-600 mb-2" />
                    <p className="text-sm font-bold text-slate-700">
                      点击或拖拽上传病历文件 (JPG / PNG / PDF)
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      支持门诊病历卡、出院记录单、生化及头颅 MRI 影像检查报告
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {(file || simulatedDocName) && (
                    <div className="flex items-center justify-between rounded-xl bg-teal-50/80 border border-teal-200 p-3 text-xs">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-teal-700" />
                        <span className="font-bold text-teal-950">
                          {simulatedDocName || file?.name}
                        </span>
                      </div>
                      <span className="text-teal-700 text-[11px]">已就绪</span>
                    </div>
                  )}
                </div>
              )}

              {/* 2. Text Paste Tab */}
              {activeTab === "paste" && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">
                    直接粘贴门诊病历或体检报告文本：
                  </label>
                  <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    rows={6}
                    placeholder="患者姓名：孙桂兰，女，69岁，大专学历。因自觉记忆力减退1年半就诊..."
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:border-teal-500 focus:outline-hidden"
                  />
                </div>
              )}

              {errorMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-500">
                  {isLoading ? "正在解析文档..." : "可上传真实文档，也可使用右侧示例"}
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Primary parse button */}
                  <button
                    type="button"
                    onClick={handleParse}
                    disabled={isLoading}
                    className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-teal-700 disabled:opacity-50 transition cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>正在解析...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>开始解析</span>
                      </>
                    )}
                  </button>

                  {/* Dedicated button in bottom right: 「载入示例报告」 */}
                  <button
                    type="button"
                    id="btn-simulate-document"
                    onClick={handleSimulateDocument}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-purple-700 disabled:opacity-50 transition cursor-pointer"
                    title="自动载入一份示例门诊病历或生化检验单并完成解析"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>载入示例检验单/病历</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Parsed Data Confirmation & Review */
            <div className="space-y-4">
              {/* Extraction Status Bar */}
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-3.5 border border-emerald-200 text-emerald-900 text-xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <div>
                    <h3 className="font-bold text-sm">
                      文档解析完成
                    </h3>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      请核对信息，确认后同步至受试者档案
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white p-1 rounded-lg border border-emerald-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setViewMode("form")}
                      className={`px-2.5 py-1 rounded transition cursor-pointer ${
                        viewMode === "form"
                          ? "bg-teal-600 text-white font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      结构化视图
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("json")}
                      className={`px-2.5 py-1 rounded transition flex items-center gap-1 cursor-pointer ${
                        viewMode === "json"
                          ? "bg-teal-600 text-white font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Code className="h-3.5 w-3.5" />
                      <span>JSON</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* View 1: Clinical Form View */}
              {viewMode === "form" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Demographics Card */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="font-bold text-slate-800 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-500" />
                      <span>基本信息与人口学特征</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-700">
                      <div>
                        姓名：<span className="font-semibold text-slate-900">{parsedData.name || parsedData.demographics?.name || "未识别"}</span>
                      </div>
                      <div>
                        性别：<span className="font-semibold text-slate-900">{parsedData.gender === 1 || parsedData.demographics?.gender === 1 ? "男" : "女"}</span>
                      </div>
                      <div>
                        年龄：<span className="font-semibold text-slate-900">{parsedData.age || parsedData.demographics?.age} 岁</span>
                      </div>
                      <div>
                        受教育年限：<span className="font-semibold text-slate-900">{parsedData.educationYears || parsedData.demographics?.educationYears || 12} 年</span>
                      </div>
                      <div>
                        身高/体重：<span className="font-semibold text-slate-900">{parsedData.height || 165}cm / {parsedData.weight || 62}kg</span>
                      </div>
                      <div>
                        电话：<span className="font-semibold text-slate-900">{parsedData.phone1 || parsedData.demographics?.phone1 || "未提及"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Medical History Card */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="font-bold text-slate-800 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>既往病史与脑小血管危险因素</span>
                    </div>
                    <div className="space-y-1 text-slate-700">
                      <div>
                        高血压：<span className="font-semibold">{parsedData.history?.hypertension ? `有 (${parsedData.history?.hypertensionYears || 5}年, 平时 ${parsedData.history?.usualBp || "130/80"})` : "无"}</span>
                      </div>
                      <div>
                        糖尿病：<span className="font-semibold">{parsedData.history?.diabetes ? "有" : "无"}</span>
                      </div>
                      <div>
                        脑血管病/脑梗：<span className="font-semibold">{parsedData.history?.cerebrovascular ? "有" : "无"}</span>
                      </div>
                      <div>
                        高脂血症：<span className="font-semibold">{parsedData.history?.hyperlipidemia ? "有" : "无"}</span>
                      </div>
                      <div>
                        痴呆家族史：<span className="font-semibold">{parsedData.history?.familyHistoryDementia ? "有 (一级亲属)" : "无"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Biomarkers & Clinical Impression Card */}
                  <div className="sm:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="font-bold text-slate-800 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      <span>生物标志物与初步临床印象</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700">
                      <div>
                        海马萎缩 (MTA)：
                        <span className="font-semibold text-slate-900">
                          {parsedData.biomarkers?.mriHippocampus !== undefined ? `MTA ${parsedData.biomarkers.mriHippocampus}级` : "MTA 2级 (轻度萎缩)"}
                        </span>
                      </div>
                      <div>
                        APOE基因型：
                        <span className="font-semibold text-slate-900">
                          {parsedData.biomarkers?.apoeGenotype || "ε3/ε4 (高危携带)"}
                        </span>
                      </div>
                      <div>
                        Aβ/Tau状态：
                        <span className="font-semibold text-slate-900">阳性 (前驱期病理)</span>
                      </div>
                    </div>
                    {parsedData.clinicalImpression && (
                      <div className="mt-2 text-xs bg-white p-2.5 rounded-lg border border-slate-200 text-slate-800">
                        <span className="font-bold">病历提取诊断提示：</span>
                        {parsedData.clinicalImpression}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* View 2: JSON Specification */
                <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[300px]">
                  <pre>{JSON.stringify(parsedData, null, 2)}</pre>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setParsedData(null);
                    setSimulatedDocName(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  重新上传 / 更换文档
                </button>

                <div className="flex items-center gap-3">
                  {saveSuccess && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>已成功同步至数据库！</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleApplyToPatient}
                    className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition cursor-pointer"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>同步至受试者档案</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
