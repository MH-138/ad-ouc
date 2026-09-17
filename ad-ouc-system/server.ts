import express, { Request, Response } from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import {
  initDatabase,
  checkTursoHealth,
  getAllPatients,
  getPatientById,
  upsertPatient,
  deletePatient,
  upsertAssessment,
  getDraft,
  saveDraft,
  createAiConsultation,
  getPendingAiConsultations,
  approveAiConsultation,
  cleanAndSeedStandardCohort,
} from "./server/turso.ts";

dotenv.config();

// [BUG-AI-04] 原代码多处使用模型名 "gemini-3.7-flash"，该模型 ID 不存在，
// 会导致"真实 AI 路径"恒为 500、所有 AI 能力实际都走降级。
// 改为可配置的常量，默认使用稳定通用的 gemini-2.5-flash（真实可用 GA 模型）。
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// Lazy initialization / client for Google Gemini API
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ==================== TURSO LIBSQL DATABASE ENDPOINTS ====================

// 1. Turso Database Health & Latency status
app.get("/api/v1/db/status", async (_req: Request, res: Response) => {
  try {
    const status = await checkTursoHealth();
    res.json({ success: true, data: status });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || "Turso DB check failed" });
  }
});

// 2. Patient List
app.get("/api/v1/patients", async (req: Request, res: Response) => {
  try {
    const search = req.query.name || req.query.researchNo || "";
    const patients = await getAllPatients(String(search));
    res.json({ success: true, data: patients });
  } catch (error: any) {
    console.error("Turso list patients error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to fetch patients" });
  }
});

// 3. Patient Detail
app.get("/api/v1/patients/:id", async (req: Request, res: Response) => {
  try {
    const patient = await getPatientById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: "Patient not found" });
    }
    res.json({ success: true, data: patient });
  } catch (error: any) {
    console.error("Turso get patient error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to fetch patient" });
  }
});

// 4. Create or Upsert Patient
app.post("/api/v1/patients", async (req: Request, res: Response) => {
  try {
    const patient = await upsertPatient(req.body);
    res.status(201).json({ success: true, data: patient });
  } catch (error: any) {
    console.error("Turso create patient error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to save patient" });
  }
});

// 5. Update Patient
app.patch("/api/v1/patients/:id", async (req: Request, res: Response) => {
  try {
    const existing = await getPatientById(req.params.id);
    const updatedData = {
      ...(existing?.fullRecord || {}),
      ...existing,
      ...req.body,
      id: req.params.id,
    };
    const patient = await upsertPatient(updatedData);
    res.json({ success: true, data: patient });
  } catch (error: any) {
    console.error("Turso update patient error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to update patient" });
  }
});

// 6. Delete Patient
app.delete("/api/v1/patients/:id", async (req: Request, res: Response) => {
  try {
    const success = await deletePatient(req.params.id);
    res.json({ success });
  } catch (error: any) {
    console.error("Turso delete patient error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to delete patient" });
  }
});

// 7. Assessment Save / Record
app.post("/api/v1/patients/:patientId/assessments", async (req: Request, res: Response) => {
  try {
    const assessmentData = {
      ...req.body,
      patientId: req.params.patientId,
    };
    const saved = await upsertAssessment(assessmentData);
    res.status(201).json({ success: true, data: saved });
  } catch (error: any) {
    console.error("Turso save assessment error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to save assessment" });
  }
});

// 8. Role Drafts (Supports flowId for multi-workflow isolation)
app.get("/api/v1/patients/:patientId/drafts/:role/:flowId?", async (req: Request, res: Response) => {
  try {
    const flowId = req.params.flowId || (req.query.flowId ? String(req.query.flowId) : undefined);
    const draft = await getDraft(req.params.patientId, req.params.role, flowId);
    res.json({ success: true, data: draft });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

app.put("/api/v1/patients/:patientId/drafts/:role/:flowId?", async (req: Request, res: Response) => {
  try {
    const flowId = req.params.flowId || req.body?.flowId || (req.query.flowId ? String(req.query.flowId) : "default");
    await saveDraft({
      patientId: req.params.patientId,
      role: req.params.role,
      flowId,
      ...req.body,
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

// 9. Batch Seed Initial Clinical Cohort to Turso
app.post("/api/v1/seed-cohort", async (req: Request, res: Response) => {
  try {
    const cohort = req.body?.cohort || [];
    const results = [];
    for (const patient of cohort) {
      const saved = await upsertPatient(patient);
      results.push(saved);
    }
    res.json({ success: true, count: results.length });
  } catch (error: any) {
    console.error("Turso seed error:", error);
    res.status(500).json({ success: false, error: error?.message });
  }
});

// 9.1 Reset Database & Seed Standard Differentiated 4-Patient Cohort
app.post("/api/v1/reset-cohort", async (_req: Request, res: Response) => {
  try {
    const result = await cleanAndSeedStandardCohort();
    res.json(result);
  } catch (error: any) {
    console.error("Reset cohort error:", error);
    res.status(500).json({ success: false, error: error?.message });
  }
});

// AI Clinical Diagnostic & Synthesis Analysis Endpoint
app.post("/api/ai/analyze-assessment", async (req: Request, res: Response) => {
  // 在 try 之外解构，确保 catch 降级分支仍可访问入参
  const { patientData, assessmentSummary } = req.body;
  try {
    const ai = getGeminiClient();
    if (!ai) {
      // Return structured rule-based evaluation if API key is not configured
      return res.json({
        success: true,
        isAiGenerated: false,
        analysis: generateRuleBasedAnalysis(patientData, assessmentSummary),
      });
    }

    const prompt = `
你是一位专门从事阿尔茨海默病（AD）极早期诊断、主观认知下降（SCD）与轻度认知障碍（MCI）临床研究的资深神经心理学专家（认知障碍临床数据采集系统课程作业神经心理评估团队）。
请根据以下受试者的全套病史、神经心理量表得分及异常切点、生物标志物数据，生成一份权威、规范、严谨的临床科研综合评估与鉴别诊断报告：

【受试者基础资料与病史】
- 姓名：${patientData?.demographics?.name || "未填写"}
- 年龄：${patientData?.demographics?.age || "未知"} 岁
- 性别：${patientData?.demographics?.gender === 1 ? "男" : patientData?.demographics?.gender === 2 ? "女" : "未选"}
- 受教育年限：${patientData?.demographics?.educationYears || 0} 年
- 既往史：脑血管病 (${patientData?.history?.cerebrovascular ? "有" : "无"}), 高血压 (${patientData?.history?.hypertension ? "有" : "无"}), 糖尿病 (${patientData?.history?.diabetes ? "有" : "无"}), 痴呆家族史 (${patientData?.history?.familyHistory ? "有" : "无"})
- 主观主诉（SCD-Q9得分）：${assessmentSummary?.scdQ9Score || 0} 分

【神经心理量表测试结果与常模判定】
${JSON.stringify(assessmentSummary?.scales || {}, null, 2)}

【生物标志物检查（ATN）】
- MRI 海马/额颞叶萎缩：${patientData?.biomarkers?.mriAtrophy ? "有萎缩 (程度: " + patientData?.biomarkers?.mriSeverity + ")" : "无明显萎缩"}
- Aβ-PET：${patientData?.biomarkers?.abetaPet === 1 ? "异常/阳性" : patientData?.biomarkers?.abetaPet === 2 ? "正常/阴性" : "未查"}
- Tau-PET：${patientData?.biomarkers?.tauPet === 1 ? "异常/阳性" : patientData?.biomarkers?.tauPet === 2 ? "正常/阴性" : "未查"}
- APOE ε4 等位基因：${patientData?.biomarkers?.apoe4 === 1 ? "携带 (阳性)" : "未携带/未查"}

请输出结构化的JSON响应，包含以下字段：
1. "overallImpression": 简明综合临床印象（100-200字）
2. "domainAssessment": 对六大认知域（情景记忆、执行功能与注意力、语言与命名、视空间、日常生活自理、精神情绪与睡眠）的逐项评定与受损程度（正常 / 轻度下降 / 中重度受损）及依据
3. "suggestedDiagnosis": 最可能的临床诊断分型（如 SCD、aMCI、AD痴呆、正常老年NC、抑郁相关认知下降等），并附带置信度与鉴别诊断依据
4. "keyAbnormalities": 标红或需特别关注的核心异常指标列表
5. "recommendations": 后续临床随访、影像/体液标志物补充、非药物干预或生活方式干预建议清单
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      success: true,
      isAiGenerated: true,
      analysis: parsed,
    });
  } catch (error: any) {
    // [BUG-AI-01] 真实 Gemini Key 无效/缺失/网络异常时，本端点原先直接返回 500，
    // 导致 AI 综合分析功能完全不可用。改为与 /api/ai/clinical-reasoning 一致的降级策略：
    // 调用规则库生成结构化分析，并明确标记 isAiGenerated:false，保证前端永不崩溃。
    console.error("AI assessment analysis error, falling back to rule-based analysis:", error?.message || error);
    return res.json({
      success: true,
      isAiGenerated: false,
      analysis: generateRuleBasedAnalysis(patientData, assessmentSummary),
    });
  }
});

app.post("/api/ai/clinical-reasoning", async (req: Request, res: Response) => {
  try {
    const { record, subjectRecord, userPrompt } = req.body;
    const patientRecord = record || subjectRecord || {};

    const ai = getGeminiClient();
    if (!ai) {
      const fallback = generateClinicalReasoningFallback(patientRecord);
      return res.json({
        success: true,
        reasoningText: fallback.reasoningText,
        analysis: fallback.analysis,
        requiresDoctorSignature: true,
      });
    }

    const prompt = userPrompt || `请根据以下受试者档案输出标准临床研判意见，结构包括：一、临床分型结论；二、依据；三、处理与随访建议。\n${JSON.stringify(patientRecord)}`;
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    return res.json({
      success: true,
      reasoningText: response.text || "",
      requiresDoctorSignature: true,
    });
  } catch (error: any) {
    const fallback = generateClinicalReasoningFallback(req.body?.record || req.body?.subjectRecord || {});
    return res.json({
      success: true,
      reasoningText: fallback.reasoningText,
      analysis: fallback.analysis,
      requiresDoctorSignature: true,
    });
  }
});

// Rule-based fallback generator if API key is missing or offline
function generateRuleBasedAnalysis(patientData: any, summary: any) {
  const age = patientData?.demographics?.age || 65;
  const edu = patientData?.demographics?.educationYears || 12;
  // [BUG-AI-03] 缺失量表不再用 ?? 28 / ?? 25 / ?? 0 当作"正常/满分"默认值
  // （这会像 BUG-EXPORT-02 的反面一样，把"未评估"伪装成"有结论"）。统一为 null，
  // 缺数据时不参与分型，并在结论中明确标注"数据不足"。
  const mmse = summary?.scales?.mmse?.score ?? null;
  const moca = summary?.scales?.mocaB?.score ?? null;
  const scdScore = summary?.scdQ9Score ?? 0;
  const cdr = summary?.scales?.cdr?.globalCDR ?? null;

  const mmseMissing = mmse === null;
  const mocaMissing = moca === null;
  const cdrMissing = cdr === null;

  let diag = "NC (正常健康对照)";
  // 仅当 MMSE / MoCA / CDR 三项均有数据时，才进行客观分型，避免缺项被误判
  if (!mmseMissing && !mocaMissing && !cdrMissing) {
    if (scdScore >= 5 && mmse >= 27 && moca >= 24 && cdr === 0) {
      diag = "SCD (主观认知下降/AD临床前期)";
    } else if (cdr === 0.5 || moca < 22 || mmse < 24) {
      diag = "aMCI (遗忘型轻度认知障碍)";
    } else if (cdr >= 1 || mmse < 20) {
      diag = "AD (阿尔茨海默病痴呆期)";
    }
  } else {
    diag = "数据不足（部分核心量表未评估，暂不给出确定性临床分型）";
  }

  const fmt = (v: number | null, suffix = "") => (v === null ? "未评估" : `${v}${suffix}`);

  return {
    overallImpression: `受试者年龄 ${age} 岁，受教育年限 ${edu} 年。主观认知自评 SCD-Q9 为 ${scdScore} 分，MMSE ${fmt(mmse, " 分")}，MoCA-B ${fmt(moca, " 分")}，Global CDR ${fmt(cdr)}。整体认知功能符合 ${diag} 的临床特征谱。`,
    domainAssessment: {
      episodicMemory: scdScore >= 4 ? "轻度主观下降，客观延时回忆轻度波动" : "基本正常",
      executiveFunction: "基本在同年龄常模范围内",
      languageNaming: "流畅性良好，命名无显著障碍",
      visuospatial: "视空间构图及模仿良好",
      dailyLiving: "日常生活能力良好 (FAQ在正常范围)",
      moodSleep: "情绪平稳，睡眠状况需结合量表综合随访",
    },
    suggestedDiagnosis: diag,
    keyAbnormalities: [
      scdScore >= 5 ? `SCD-Q9 主诉显著 (得分: ${scdScore}分)` : "无明显认知主诉",
      cdrMissing
        ? "CDR 未评估"
        : cdr! > 0
        ? `CDR评级异常 (Global CDR: ${cdr})`
        : "CDR为0 (无功能性痴呆)",
      mmseMissing ? "MMSE 未评估" : "",
      mocaMissing ? "MoCA-B 未评估" : "",
    ].filter(Boolean),
    recommendations: [
      "建议每 6-12 个月进行一次神经心理量表标准化纵向随访，监测认知轨迹",
      "结合头颅 MRI 高分辨率海马体积测量及必要时行 Aβ-PET / 血浆 p-tau217 检测",
      "保持地中海饮食模式，每周进行适量中等强度有氧运动及认知训练",
    ],
  };
}

function generateClinicalReasoningFallback(record: any) {
  const name = record?.demographics?.name || "受试者";
  const age = record?.demographics?.age || "--";
  const edu = record?.demographics?.educationYears || "--";
  const scd = record?.scales?.scdQ9?.score ?? "--";
  const mmse = record?.scales?.mmse?.score ?? "--";
  const moca = record?.scales?.mocaB?.score ?? "--";
  const cdr = record?.scales?.cdr?.globalScore ?? record?.scales?.cdr?.globalCDR ?? "--";

  let diagnosis = "主观认知下降 (SCD)";
  if (typeof mmse === "number" && mmse < 20) diagnosis = "阿尔茨海默病性痴呆待排";
  else if ((typeof cdr === "number" && cdr >= 0.5) || (typeof moca === "number" && moca < 22)) diagnosis = "轻度认知障碍 (MCI)";
  else if (typeof scd === "number" && scd < 5) diagnosis = "认知正常范围";

  const reasoningText = `受试者：${name}，${age}岁，受教育${edu}年。

一、临床分型结论：
建议分型为：${diagnosis}。该结论需由医生结合病史、查体、影像和随访资料签字确认后生效。

二、主要依据：
SCD-Q9：${scd}；MMSE：${mmse}；MoCA-B：${moca}；CDR：${cdr}。目前资料提示主观记忆主诉、客观量表和日常功能状态需要联合判断。

三、处理与随访建议：
建议完善病历核对、影像/生物标志物资料录入；按 6-12 个月周期复查认知量表；合并高血压、糖尿病、血脂异常者同步控制危险因素。`;

  return {
    reasoningText,
    analysis: {
      proposedCategory: diagnosis,
      confidence: 0.86,
      requiresDoctorSignature: true,
    },
  };
}

// AI Consultation & Doctor Signature Workflow Endpoints
app.get("/api/v1/ai-consultations/pending", async (req: Request, res: Response) => {
  try {
    const list = await getPendingAiConsultations();
    res.json({ success: true, count: list.length, items: list });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

app.post("/api/v1/ai-consultations/submit", async (req: Request, res: Response) => {
  try {
    const { patientId, patientName, suggestedDiagnosis, confidence, aiSummary } = req.body;
    const result = await createAiConsultation({
      patientId,
      patientName,
      suggestedDiagnosis,
      confidence,
      aiSummary,
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

app.post("/api/v1/ai-consultations/:id/approve", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { doctorSignature, doctorNotes, confirmedCategory } = req.body;
    const result = await approveAiConsultation(id, doctorSignature, doctorNotes, confirmedCategory);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

// PaddleOCR Mock & Document Extraction Endpoints
// AI Medical Record / Discharge Summary / Lab OCR & Parsing Endpoint
app.post("/api/ai/parse-medical-record", async (req: Request, res: Response) => {
  try {
    const { fileBase64, mimeType, rawText } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      if (fileBase64 && mimeType && !rawText?.trim()) {
        return res.status(503).json({
          success: false,
          error:
            "当前环境未配置 GEMINI_API_KEY，暂时无法解析上传图片。请先配置大模型能力，或改为粘贴病历文本后建档。",
        });
      }
      // Return smart simulated OCR & clinical parsing
      const fallbackResult = parseMedicalRecordFallback(rawText || "");
      return res.json({
        success: true,
        isAiGenerated: false,
        parsedData: fallbackResult,
      });
    }

    const systemPrompt = `你是一位专门从中文临床病历、出院小结、检查报告中提取关键临床信息的医疗智能助手。
请从提供的病历文本或病历照片中提取以下患者结构化信息并输出为纯JSON：
{
  "name": "姓名 (字符串)",
  "gender": 1 (男=1, 女=2, 未知=0),
  "age": 年龄 (数字),
  "birthDate": "出生日期 YYYY-MM-DD",
  "idCard": "身份证号",
  "educationYears": 受教育年限 (数字，小学6年/初中9年/高中12年/大学16年),
  "height": 身高 (cm，数字),
  "weight": 体重 (kg，数字),
  "phone1": "手机号",
  "chiefComplaint": "主诉",
  "history": {
    "hypertension": true/false (是否有高血压),
    "hypertensionYears": 病程年数,
    "usualBp": "平时血压如 130/85",
    "maxBp": "最高血压如 160/100",
    "diabetes": true/false,
    "diabetesYears": 病程年数,
    "cerebrovascular": true/false (脑梗死/脑出血),
    "coronaryHeartDisease": true/false,
    "hyperlipidemia": true/false,
    "thyroidAbnormal": true/false,
    "tbi": true/false (脑外伤),
    "generalAnesthesia": true/false (全麻手术),
    "familyHistoryDementia": true/false (痴呆家族史)
  },
  "currentMedications": "当前主要服药",
  "clinicalImpression": "病历初步诊断/印象",
  "confidenceScore": 0.95 (0-1 置信度)
}
如果某些字段在病历中未提及，请留空字符串或 null。
`;

    let contents: any[] = [];
    if (fileBase64 && mimeType) {
      contents = [
        {
          inlineData: {
            data: fileBase64.replace(/^data:[^;]+;base64,/, ""),
            mimeType: mimeType || "image/jpeg",
          },
        },
        { text: systemPrompt + "\n请识别并提取上面病历图像中的关键字段。" },
      ];
    } else {
      contents = [
        { text: systemPrompt + `\n以下是病历文本内容：\n\n${rawText || ""}` },
      ];
    }

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      success: true,
      isAiGenerated: true,
      parsedData: parsed,
    });
  } catch (error: any) {
    console.error("AI parse-medical-record error:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "病历智能解析失败",
    });
  }
});

// AI Cognitive Drawing Analysis (MMSE Pentagons, CDT Clock, MoCA Cube)
app.post("/api/ai/analyze-drawing", async (req: Request, res: Response) => {
  try {
    const { drawingBase64, referenceType, title } = req.body;

    const ai = getGeminiClient();
    if (!ai || !drawingBase64) {
      // Return clinical heuristic scoring
      return res.json({
        success: true,
        isAiGenerated: false,
        result: generateDrawingScoreFallback(referenceType || "dualPentagons", title),
      });
    }

    const systemPrompt = `你是一位专门评定神经心理学绘图测验的神经认知专家。
根据用户临摹绘图的图片，评定其视空间与构图能力：
- 若为双五边形 (dualPentagons)：必须是两个五边形，且交叉部分必须形成一个四边形。如果符合，得1分；不符合得0分。
- 若为钟表 (circle/clock/CDT)：表盘圆整(1分)、1-12数字均匀分布(1分)、时针分针指示正确(2分)，满分4分。
- 若为立方体 (cube)：三维透视结构完整，各平行边比例正确，得1分，否则0分。
请输出纯JSON格式：
{
  "score": 数字得分,
  "maxScore": 满分数字,
  "status": "normal" 或 "abnormal",
  "clinicalComment": "简练专业的神经心理评定意见 (50字以内)"
}`;

    const cleanBase64 = drawingBase64.replace(/^data:[^;]+;base64,/, "");
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: "image/png",
          },
        },
        { text: systemPrompt + `\n测试类型：${referenceType || title || "绘图仿画"}` },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      success: true,
      isAiGenerated: true,
      result: parsed,
    });
  } catch (error: any) {
    console.error("AI analyze-drawing error:", error);
    return res.json({
      success: true,
      isAiGenerated: false,
      result: generateDrawingScoreFallback("dualPentagons", "绘图测验"),
    });
  }
});

function generateDrawingScoreFallback(
  type: string,
  title?: string
): { score: number | null; maxScore: number; status: string; clinicalComment: string } {
  // [BUG-AI-02] 本兜底仅在"无真实绘图图像"或"AI 服务不可用"时调用。
  // 原先无论何种类型都返回满分 + status:"normal"，等于把"未做测验/网络异常"伪装成"视空间结构正常"，
  // 与 BUG-SCALE-03（空 MoCA-B 显示 23 分）同源，会误导医生。
  // 现统一返回 score:null + status:"untested" + "未测评"说明，不套用任何阈值。
  const maxScore = type === "circle" || type === "clock" || (title && (title.includes("钟") || title.includes("CDT"))) ? 4 : 1;
  return {
    score: null,
    maxScore,
    status: "untested",
    clinicalComment: "未上传绘图图像或 AI 服务不可用，本项未测评，不计入视空间功能判定。",
  };
}

// Fallback regex / heuristic parser for clinical notes
function parseMedicalRecordFallback(text: string) {
  const nameMatch = text.match(/姓名[：:\s]*([^\s,，;；\n]+)/);
  const ageMatch = text.match(/年龄[：:\s]*(\d{1,3})/);
  const genderMatch = text.match(/性别[：:\s]*(男|女)/);
  const bpMatch = text.match(/血压[：:\s]*(\d{2,3}[\/／]\d{2,3})/);
  const eduMatch = text.match(/(文盲|小学|初中|高中|中专|大专|本科|硕士|博士|受教育\s*\d+\s*年)/);

  let eduYears = 12;
  if (eduMatch) {
    const s = eduMatch[0];
    if (s.includes("文盲")) eduYears = 0;
    else if (s.includes("小学")) eduYears = 6;
    else if (s.includes("初中")) eduYears = 9;
    else if (s.includes("高中") || s.includes("中专")) eduYears = 12;
    else if (s.includes("大专") || s.includes("本科")) eduYears = 16;
    else if (s.includes("硕士") || s.includes("博士")) eduYears = 19;
  }

  const hasHTN = /高血压|血压偏高|降压药|氨氯地平|缬沙坦/.test(text);
  const hasDM = /糖尿病|血糖高|二甲双胍|胰岛素/.test(text);
  const hasStroke = /脑梗|脑卒中|脑出血|腔梗/.test(text);
  const hasFamily = /家族史.*(痴呆|阿尔茨海默|认知障碍|老年性痴呆)/.test(text);

  return {
    name: nameMatch ? nameMatch[1] : "张建华",
    gender: genderMatch ? (genderMatch[1] === "男" ? 1 : 2) : 1,
    age: ageMatch ? parseInt(ageMatch[1], 10) : 66,
    birthDate: "1960-05-18",
    educationYears: eduYears,
    height: 172,
    weight: 70,
    phone1: "13812345678",
    chiefComplaint: text.includes("主诉") ? text.substring(text.indexOf("主诉"), text.indexOf("主诉") + 50) : "自觉近1年记忆力减退，易遗忘近期事件与熟人姓名。",
    history: {
      hypertension: hasHTN,
      hypertensionYears: hasHTN ? 8 : 0,
      usualBp: bpMatch ? bpMatch[1] : "135/85",
      maxBp: "160/100",
      diabetes: hasDM,
      diabetesYears: hasDM ? 5 : 0,
      cerebrovascular: hasStroke,
      coronaryHeartDisease: /冠心病|心绞痛/.test(text),
      hyperlipidemia: /高脂血症|高血脂|阿托伐他汀/.test(text),
      thyroidAbnormal: /甲减|甲亢|甲状腺/.test(text),
      tbi: /脑外伤|头部撞击/.test(text),
      generalAnesthesia: /全麻|手术史/.test(text),
      familyHistoryDementia: hasFamily,
    },
    currentMedications: "苯磺酸氨氯地平 5mg qd, 阿托伐他汀钙片 20mg qn",
    clinicalImpression: "主观认知下降（SCD，轻度心血管危险因素控制良好）",
    confidenceScore: 0.92,
  };
}

async function startServer() {
  try {
    await initDatabase();
    // [BUG-DB-01] 原先每次启动都按"非标准队列/脏数据"启发式自动清库重播种，
    // 多人共用共享云库时一方启动即清空他人数据（数据丢失风险）。
    // 现改为：默认不写入示例队列；仅当显式设置 SEED_ON_BOOT=true 时才清库重播种；
    // 已有业务数据一律跳过。示例队列可随时通过 POST /api/v1/reset-cohort 手动触发。
    const seedOnBoot = process.env.SEED_ON_BOOT === "true";

    if (seedOnBoot) {
      console.log("[DB] SEED_ON_BOOT=true：即将清空并重置为标准 4 位受试者队列…");
      await cleanAndSeedStandardCohort();
    } else {
      const currentPatients = await getAllPatients();
      console.log(
        `[DB] 自动播种已关闭（默认不写入示例队列），当前已有 ${currentPatients.length} 位受试者。如需示例数据请设置 SEED_ON_BOOT=true 或调用 POST /api/v1/reset-cohort。`
      );
    }
  } catch (err) {
    console.error("Failed to initialize Turso database on boot:", err);
  }

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
