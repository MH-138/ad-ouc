import React, { useState, useEffect } from "react";
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

  // Form State - Empty defaults, requiring explicit user input
  const [name, setName] = useState("");
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

  // Validation & Loading
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate research code on open
  const generateNewSubjectNo = () => {
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    return `01-${randomCode}`;
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
