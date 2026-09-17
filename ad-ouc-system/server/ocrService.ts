/**
 * PaddleOCR-VL-1.6 Integration & Clinical Information Extraction Service
 *
 * [BUG-OCR-01] 真实 PaddleOCR 异步任务（提交 → 轮询 → 下载）尚未接入。
 * 此前 parseDocumentWithOcr 会无视上传内容、固定返回预设演示病历（孙桂兰等），
 * 造成「上传任何文件都回显同一份假病历」的误导。现已彻底移除该假解析逻辑，
 * 避免课堂演示中出现伪造的 OCR 结果。
 *
 * 真实接入时：在下方补充 submitJob / pollJob / downloadResult，
 * 并让 server.ts 的 /api/ai/parse-medical-record 在配置 GEMINI_API_KEY 时调用之；
 * 当前未接入时，前端应引导用户改用「粘贴病历文本」走规则回退解析（parseMedicalRecordFallback）。
 */

export const PADDLE_OCR_CONFIG = {
  JOB_URL: process.env.PADDLE_OCR_JOB_URL || "https://paddleocr.aistudio-app.com/api/v2/ocr/jobs",
  TOKEN: process.env.PADDLE_OCR_TOKEN || "", // 真实接入 PaddleOCR 时从 .env 读取，绝不硬编码
  MODEL: process.env.PADDLE_OCR_MODEL || "PaddleOCR-VL-1.6",
  OPTIONAL_PAYLOAD: {
    useDocOrientationClassify: false,
    useDocUnwarping: false,
    useChartRecognition: false,
  },
};

export interface ExtractedClinicalData {
  demographics: {
    name: string;
    gender: 1 | 2;
    age: number;
    educationYears: number;
    phone1?: string;
    height?: number;
    weight?: number;
  };
  history: {
    chiefComplaint: string;
    hypertension: boolean;
    diabetes: boolean;
    coronaryHeartDisease: boolean;
    stroke: boolean;
    familyHistory: boolean;
  };
  biomarkers: {
    mriAtrophy: boolean;
    mriDescription: string;
    apoe4: number; // 1: 阳性/携带, 2: 阴性, 0: 未查
    abetaPet: number; // 1: 阳性, 2: 阴性, 0: 未查
    tauPet: number; // 1: 阳性, 2: 阴性, 0: 未查
  };
  rawTextExcerpt: string;
  sourceDocName: string;
}
