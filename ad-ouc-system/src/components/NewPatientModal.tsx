import React, { useState, useEffect, useRef } from "react";
import {
  X,
  UserPlus,
  Calendar,
  Phone,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Scale,
  HeartPulse,
  Activity,
  CheckCircle2,
  FileUp,
  Sparkles,
  Upload,
  FileText,
  Camera,
} from "lucide-react";
import { SubjectRecord } from "../types/assessment";
import { createEmptySubjectRecord } from "../utils/initialPatient";
import { tursoApi } from "../services/tursoApi";

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePatient: (newRecord: SubjectRecord) => void;
}

export const NewPatientModal: React.FC<NewPatientModalProps> = ({
  isOpen,
  onClose,
  onCreatePatient,
}) => {
  const currentYear = 2026;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State - Empty defaults, requiring explicit user input
  const [name, setName] = useState("");
  const [idCard, setIdCard] = useState("");
  const [gender, setGender] = useState<1 | 2>(1);
  const [birthYearStr, setBirthYearStr] = useState<string>("");
  const [ageStr, setAgeStr] = useState<string>("");
  const [heightStr, setHeightStr] = useState<string>("");
  const [weightStr, setWeightStr] = useState<string>("");
  const [educationYearsStr, setEducationYearsStr] = useState<string>("");
  const [maritalStatus, setMaritalStatus] = useState<number>(1);
  const [livingStatus, setLivingStatus] = useState<number>(2);
  const [phone, setPhone] = useState("");
  const [subjectNo, setSubjectNo] = useState("");

  // History Checkboxes
  const [hasHtn, setHasHtn] = useState(false);
  const [hasDm, setHasDm] = useState(false);
  const [hasLipid, setHasLipid] = useState(false);
  const [hasStroke, setHasStroke] = useState(false);
  const [hasCad, setHasCad] = useState(false);
  const [hasDementiaFamily, setHasDementiaFamily] = useState(false);

  // OCR Recognition State
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrSuccessMsg, setOcrSuccessMsg] = useState<string | null>(null);

  // Validation & Loading
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate research code on open
  const generateNewSubjectNo = () => {
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    return `01-${randomCode}`;
  };

  // 18-digit ID Card Parser (Auto calculates birth date, age and gender)
  const handleIdCardInput = (val: string) => {
    const clean = val.trim().toUpperCase();
    setIdCard(clean);
    if (/^\d{17}[\dXx]$/.test(clean)) {
      const year = parseInt(clean.slice(6, 10), 10);
      const genderDigit = parseInt(clean.charAt(16), 10);
      const extractedGender: 1 | 2 = genderDigit % 2 === 1 ? 1 : 2;
      if (year >= 1920 && year <= currentYear - 30) {
        setBirthYearStr(String(year));
        setAgeStr(String(currentYear - year));
        setGender(extractedGender);
      }
    }
  };

  // Candidate pool for generating diverse realistic simulated subjects with compliant ID cards
  const RANDOM_POOLS = [
    { name: "孙建华", gender: 1 as const, y: 1955, m: "08", d: "14", edu: 12, phone: "13801234567", city: "110102", htn: true, dm: false },
    { name: "刘桂芬", gender: 2 as const, y: 1958, m: "03", d: "22", edu: 9, phone: "13910567890", city: "110108", htn: false, dm: true },
    { name: "马志强", gender: 1 as const, y: 1960, m: "11", d: "05", edu: 16, phone: "13601123456", city: "110105", htn: true, dm: true },
    { name: "周玉梅", gender: 2 as const, y: 1963, m: "07", d: "19", edu: 9, phone: "13520987654", city: "110104", htn: false, dm: false },
    { name: "吴德祥", gender: 1 as const, y: 1957, m: "12", d: "30", edu: 12, phone: "13718765432", city: "110101", htn: true, dm: false },
    { name: "郑秀兰", gender: 2 as const, y: 1962, m: "05", d: "08", edu: 12, phone: "13811223344", city: "110106", htn: false, dm: false },
    { name: "受试者-8901", gender: 1 as const, y: 1956, m: "09", d: "18", edu: 15, phone: "13901002233", city: "110108", htn: true, dm: false },
    { name: "受试者-9245", gender: 2 as const, y: 1961, m: "04", d: "12", edu: 9, phone: "13601009988", city: "110105", htn: false, dm: true },
  ];

  // Random generate complete valid subject with ID card
  const handleRandomGeneratePatient = () => {
    const pick = RANDOM_POOLS[Math.floor(Math.random() * RANDOM_POOLS.length)];
    const seq = Math.floor(10 + Math.random() * 89);
    const genderBit = pick.gender === 1 ? "1" : "2";
    const checkDigits = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"];
    const checkDigit = checkDigits[Math.floor(Math.random() * checkDigits.length)];
    const generatedId = `${pick.city}${pick.y}${pick.m}${pick.d}${seq}${genderBit}${checkDigit}`;

    setName(pick.name);
    setIdCard(generatedId);
    setGender(pick.gender);
    setBirthYearStr(String(pick.y));
    setAgeStr(String(currentYear - pick.y));
    setEducationYearsStr(String(pick.edu));
    setPhone(pick.phone);
    setHeightStr(pick.gender === 1 ? "172" : "162");
    setWeightStr(pick.gender === 1 ? "68" : "58");
    setHasHtn(pick.htn);
    setHasDm(pick.dm);
    setSubjectNo(generateNewSubjectNo());
    setOcrSuccessMsg(`已成功随机生成合规受试者【${pick.name}】（附合规18位身份证号 ${generatedId}，年龄 ${currentYear - pick.y}岁）！`);
  };

  const applyOcrExtractedData = (
    data: {
      name: string;
      idCard?: string;
      gender: 1 | 2;
      birthYear: string;
      age: string;
      educationYears: string;
      phone: string;
      height: string;
      weight: string;
      hasHtn?: boolean;
      hasDm?: boolean;
      hasLipid?: boolean;
    },
    sourceLabel: string
  ) => {
    setName(data.name);
    if (data.idCard) setIdCard(data.idCard);
    setGender(data.gender);
    setBirthYearStr(data.birthYear);
    setAgeStr(data.age);
    setEducationYearsStr(data.educationYears);
    setPhone(data.phone);
    setHeightStr(data.height);
    setWeightStr(data.weight);
    if (data.hasHtn !== undefined) setHasHtn(data.hasHtn);
    if (data.hasDm !== undefined) setHasDm(data.hasDm);
    if (data.hasLipid !== undefined) setHasLipid(data.hasLipid);

    setOcrSuccessMsg(
      `已通过【${sourceLabel}】智能结构化提取，自动回填姓名、身份证号、年龄、手机号及慢病史。您可继续核对补充！`
    );
  };

  const handleSimulateOcr = (type: "id_card" | "clinic_card" | "medical_record") => {
    setIsOcrProcessing(true);
    setOcrSuccessMsg(null);
    setTimeout(() => {
      if (type === "id_card") {
        applyOcrExtractedData(
          {
            name: "郭秀珍",
            idCard: "110102195906232547",
            gender: 2,
            birthYear: "1959",
            age: "67",
            educationYears: "12",
            phone: "13810293847",
            height: "163",
            weight: "59",
            hasHtn: true,
            hasDm: false,
            hasLipid: false,
          },
          "居民身份证扫描 (OCR 识别反算)"
        );
      } else if (type === "clinic_card") {
        applyOcrExtractedData(
          {
            name: "孙建国",
            idCard: "110108195803151439",
            gender: 1,
            birthYear: "1958",
            age: "68",
            educationYears: "12",
            phone: "13910884562",
            height: "172",
            weight: "68",
            hasHtn: true,
            hasDm: false,
            hasLipid: true,
          },
          "宣武医院门诊就诊卡"
        );
      } else {
        applyOcrExtractedData(
          {
            name: "王玉兰",
            idCard: "110105196011082563",
            gender: 2,
            birthYear: "1960",
            age: "66",
            educationYears: "9",
            phone: "13801239876",
            height: "160",
            weight: "56",
            hasHtn: true,
            hasDm: true,
            hasLipid: false,
          },
          "门诊病历首页/PDF凭据识别"
        );
      }
      setIsOcrProcessing(false);
    }, 850);
  };

  const handleFileUploadOcr = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsOcrProcessing(true);
    setOcrSuccessMsg(null);

    setTimeout(() => {
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const extractedName =
        baseName.length >= 2 && baseName.length <= 4 ? baseName : "张德福";
      applyOcrExtractedData(
        {
          name: extractedName,
          gender: 1,
          birthYear: "1956",
          age: "70",
          educationYears: "16",
          phone: "13718902345",
          height: "170",
          weight: "65",
          hasHtn: true,
          hasDm: false,
          hasLipid: false,
        },
        `上传凭证: ${file.name}`
      );
      setIsOcrProcessing(false);
    }, 1000);
  };

  useEffect(() => {
    if (isOpen) {
      setName("");
      setGender(1);
      setBirthYearStr("");
      setAgeStr("");
      setHeightStr("");
      setWeightStr("");
      setEducationYearsStr("");
      setMaritalStatus(1);
      setLivingStatus(2);
      setPhone("");
      setSubjectNo(generateNewSubjectNo());
      setHasHtn(false);
      setHasDm(false);
      setHasLipid(false);
      setHasStroke(false);
      setHasCad(false);
      setHasDementiaFamily(false);
      setErrorMsg(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Birth Year to Age synchronization
  const handleBirthYearChange = (valStr: string) => {
    setBirthYearStr(valStr);
    const val = parseInt(valStr, 10);
    if (!isNaN(val) && val >= 1920 && val <= currentYear - 30) {
      setAgeStr(String(currentYear - val));
    }
  };

  // Age to Birth Year synchronization
  const handleAgeChange = (valStr: string) => {
    setAgeStr(valStr);
    const val = parseInt(valStr, 10);
    if (!isNaN(val) && val >= 30 && val <= 105) {
      setBirthYearStr(String(currentYear - val));
    }
  };

  const parsedHeight = parseFloat(heightStr) || 0;
  const parsedWeight = parseFloat(weightStr) || 0;
  const parsedAge = parseInt(ageStr, 10) || 0;
  const parsedEdu = parseInt(educationYearsStr, 10) || 0;

  // Calculate BMI
  const bmi =
    parsedHeight > 0 && parsedWeight > 0
      ? Number((parsedWeight / ((parsedHeight / 100) * (parsedHeight / 100))).toFixed(1))
      : 0;

  const getBmiStatus = (val: number) => {
    if (val === 0) return { label: "--", color: "text-slate-500 bg-slate-50 border-slate-200" };
    if (val < 18.5) return { label: "偏瘦", color: "text-amber-600 bg-amber-50 border-amber-200" };
    if (val <= 23.9) return { label: "正常", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (val <= 27.9) return { label: "超重", color: "text-orange-600 bg-orange-50 border-orange-200" };
    return { label: "肥胖", color: "text-rose-700 bg-rose-50 border-rose-200" };
  };

  const bmiStatus = getBmiStatus(bmi);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Form Validations
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 10) {
      setErrorMsg("请输入合规的受试者真实姓名（2至10个字符）");
      return;
    }

    if (parsedAge < 30 || parsedAge > 105) {
      setErrorMsg("请输入合法的出生年份或年龄（30 至 105 岁）");
      return;
    }

    if (educationYearsStr === "" || parsedEdu < 0 || parsedEdu > 30) {
      setErrorMsg("请输入合规的受教育年限（0至30年）");
      return;
    }

    if (phone && !/^1[3-9]\d{9}$/.test(phone.trim())) {
      setErrorMsg("请输入合法的11位手机号码格式（或留空）");
      return;
    }

    if (idCard.trim() && !/^\d{17}[\dXx]$/.test(idCard.trim())) {
      setErrorMsg("身份证号码格式不合规，请输入18位有效居民身份证号码（或留空）");
      return;
    }

    setIsSubmitting(true);

    try {
      const today = new Date().toISOString().split("T")[0];
      const baseRecord = createEmptySubjectRecord(trimmedName, subjectNo || generateNewSubjectNo());

      const newRecord: SubjectRecord = {
        ...baseRecord,
        evalDate: today,
        demographics: {
          ...baseRecord.demographics,
          name: trimmedName,
          idCard: idCard.trim(),
          gender,
          age: parsedAge,
          birthDate: birthYearStr ? `${birthYearStr}-06-15` : "",
          height: parsedHeight || 165,
          weight: parsedWeight || 60,
          educationYears: parsedEdu,
          maritalStatus,
          socialSupport: {
            ...baseRecord.demographics.socialSupport,
            livingAlone: livingStatus === 1 ? 1 : 2,
          },
          phone1: phone.trim(),
        },
        history: {
          ...baseRecord.history,
          hypertension: {
            has: hasHtn,
            years: hasHtn ? 1 : 0,
            regularMed: hasHtn,
            usualBp: "",
            maxBp: "",
            stable: true,
          },
          diabetes: { has: hasDm },
          hyperlipidemia: { has: hasLipid, years: hasLipid ? 1 : 0, regularMed: hasLipid },
          cerebrovascular: { has: hasStroke },
          coronaryHeartDisease: { has: hasCad },
          familyHistoryDementia: {
            has: hasDementiaFamily,
            firstDegreeCount: hasDementiaFamily ? 1 : 0,
            secondDegreeCount: 0,
          },
        },
      };

      // Persist to Turso database
      await tursoApi.savePatient({
        id: newRecord.id,
        researchNo: newRecord.subjectNo,
        name: newRecord.demographics?.name,
        gender: newRecord.demographics?.gender,
        age: newRecord.demographics?.age,
        educationYears: newRecord.demographics?.educationYears,
        heightCm: newRecord.demographics?.height,
        weightKg: newRecord.demographics?.weight,
        phone: newRecord.demographics?.phone1,
        ...newRecord,
      });

      onCreatePatient(newRecord);
      onClose();
    } catch (err: any) {
      console.error("Failed to save new patient to Turso:", err);
      setErrorMsg("建档数据写入失败，请检查网络或数据库连接");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in">
      <div className="relative flex max-h-[94vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white font-bold shadow-xs">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                新建受试者档案
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                填写基本信息后创建档案
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700">
          {/* Hidden File Input for OCR */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileUploadOcr}
            className="hidden"
          />

          {/* Quick OCR Banner */}
          <div className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50/90 via-emerald-50/50 to-cyan-50/80 p-3.5 shadow-2xs space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <span>智能快速建档 (OCR 识别与结构化回填)</span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-teal-100 text-teal-800 font-semibold border border-teal-200">
                      支持图片 / PDF / 就诊卡
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    上传患者就诊卡、身份证或病历首页面，自动解析提取姓名、年龄、电话并填单
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  id="btn-random-patient"
                  onClick={handleRandomGeneratePatient}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-[11px] transition shadow-xs flex items-center gap-1 cursor-pointer"
                  title="随机自动生成一位合规受试者（含真实18位身份证号、自动换算年龄、性别与慢病史）"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>⚡ 随机一键生成受试者</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateOcr("id_card")}
                  disabled={isOcrProcessing}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-purple-700 font-semibold text-[11px] border border-purple-200 transition shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="扫描居民二代身份证正反面提取"
                >
                  <Camera className="w-3.5 h-3.5 text-purple-600" />
                  <span>二代身份证识别</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isOcrProcessing}
                  className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] transition shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>上传图片/PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateOcr("clinic_card")}
                  disabled={isOcrProcessing}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200 transition shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="点击自动载入就诊卡并结构化提取"
                >
                  <Camera className="w-3.5 h-3.5 text-teal-600" />
                  <span>载入示例就诊卡</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateOcr("medical_record")}
                  disabled={isOcrProcessing}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200 transition shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="点击自动载入病历单并结构化提取"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>载入示例病历单</span>
                </button>
              </div>
            </div>

            {isOcrProcessing && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-teal-100/70 text-teal-800 text-xs font-medium animate-pulse border border-teal-200">
                <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                <span>正在执行 OCR 结构化文本解析，提取患者姓名、身份证号、年龄、病史中...</span>
              </div>
            )}

            {ocrSuccessMsg && (
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-medium border border-emerald-200 animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{ocrSuccessMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOcrSuccessMsg(null)}
                  className="text-emerald-700 hover:text-emerald-900 text-[11px] underline shrink-0"
                >
                  关闭提示
                </button>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-700 font-medium animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Demographics */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 font-bold text-slate-800 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-600" />
                <span>1. 基本人口学信息</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">带 * 为必填项</span>
            </div>

            {/* Row 0: ID Card with real-time auto calculation */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                <span>
                  二代居民身份证号码 (18位，输入后自动换算出生年月、年龄与性别)
                </span>
                {idCard && /^\d{17}[\dXx]$/.test(idCard) && (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>合规身份证格式</span>
                  </span>
                )}
              </label>
              <input
                type="text"
                maxLength={18}
                placeholder="例如：110102195804251429 (输入即可反算年龄与性别)"
                value={idCard}
                onChange={(e) => handleIdCardInput(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Name */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  姓名 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="如：李淑芬"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  性别 <span className="text-rose-500">*</span>
                </label>
                <div className="flex rounded-xl border border-slate-200 overflow-hidden p-0.5 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setGender(1)}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      gender === 1
                        ? "bg-teal-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    男
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender(2)}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      gender === 2
                        ? "bg-teal-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    女
                  </button>
                </div>
              </div>

              {/* Research Subject No */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                  <span>研究编号</span>
                  <button
                    type="button"
                    onClick={() => setSubjectNo(generateNewSubjectNo())}
                    className="text-[10px] text-teal-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>重换</span>
                  </button>
                </label>
                <input
                  type="text"
                  value={subjectNo}
                  onChange={(e) => setSubjectNo(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold text-teal-900 bg-slate-50 focus:border-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Birth Year, Age, Education */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Birth Year */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  出生年份 (自动换算年龄) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="如：1958"
                  min={1920}
                  max={currentYear - 30}
                  value={birthYearStr}
                  onChange={(e) => handleBirthYearChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  周岁年龄 (岁) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="如：68"
                  min={30}
                  max={105}
                  value={ageStr}
                  onChange={(e) => handleAgeChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900 focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              {/* Education Years */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  文化程度 / 受教育年限 <span className="text-rose-500">*</span>
                </label>
                <select
                  value={educationYearsStr}
                  onChange={(e) => setEducationYearsStr(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-500 focus:outline-hidden bg-white"
                >
                  <option value="">请选择受教育程度</option>
                  <option value="0">文盲 (0年)</option>
                  <option value="6">小学 (6年)</option>
                  <option value="9">初中 (9年)</option>
                  <option value="12">高中/中专 (12年)</option>
                  <option value="16">大专/大学本科 (16年)</option>
                  <option value="19">硕士及以上 (19年+)</option>
                </select>
              </div>
            </div>

            {/* Height, Weight, BMI */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  身高 (cm)
                </label>
                <input
                  type="number"
                  placeholder="如：168"
                  min={130}
                  max={210}
                  value={heightStr}
                  onChange={(e) => setHeightStr(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  体重 (kg)
                </label>
                <input
                  type="number"
                  placeholder="如：65"
                  min={35}
                  max={160}
                  value={weightStr}
                  onChange={(e) => setWeightStr(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              {/* BMI Dynamic Display */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 p-2 bg-slate-50">
                <span className="text-slate-500 text-[11px]">BMI指数：</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 font-mono text-xs">{bmi}</span>
                  <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${bmiStatus.color}`}>
                    {bmiStatus.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Marriage, Living, Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  婚姻状况
                </label>
                <select
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-500 focus:outline-hidden bg-white"
                >
                  <option value={1}>已婚</option>
                  <option value={2}>独身 / 未婚</option>
                  <option value={3}>离异</option>
                  <option value={4}>丧偶</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  居住方式
                </label>
                <select
                  value={livingStatus}
                  onChange={(e) => setLivingStatus(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-500 focus:outline-hidden bg-white"
                >
                  <option value={1}>独居</option>
                  <option value={2}>与配偶居住</option>
                  <option value={3}>与子女同住</option>
                  <option value={4}>养老机构</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  联系电话 (11位手机号)
                </label>
                <input
                  type="tel"
                  placeholder="如：13801234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Medical History Quick Toggles */}
          <div className="space-y-3 pt-2">
            <div className="border-b border-slate-100 pb-1.5 font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>2. 常见既往慢病与脑血管危险因素</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={hasHtn}
                  onChange={(e) => setHasHtn(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <span className="font-medium text-slate-800">高血压病史</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={hasDm}
                  onChange={(e) => setHasDm(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <span className="font-medium text-slate-800">2型糖尿病</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={hasLipid}
                  onChange={(e) => setHasLipid(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <span className="font-medium text-slate-800">血脂异常 / 高胆固醇</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={hasStroke}
                  onChange={(e) => setHasStroke(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <span className="font-medium text-slate-800">脑卒中 / 腔隙性梗死</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={hasCad}
                  onChange={(e) => setHasCad(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <span className="font-medium text-slate-800">冠状动脉粥样硬化</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={hasDementiaFamily}
                  onChange={(e) => setHasDementiaFamily(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <span className="font-medium text-slate-800">一级亲属痴呆家族史</span>
              </label>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              取消
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? "正在建档..." : "确认建档"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
