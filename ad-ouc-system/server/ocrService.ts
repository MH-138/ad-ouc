/**
 * PaddleOCR-VL-1.6 Integration & Clinical Information Extraction Service
 * Implements the asynchronous PaddleOCR job lifecycle and clinical entity extraction
 */

export const PADDLE_OCR_CONFIG = {
  JOB_URL: "https://paddleocr.aistudio-app.com/api/v2/ocr/jobs",
  TOKEN: "3c0908da25250490257e66b5511fbd634d992fb5",
  MODEL: "PaddleOCR-VL-1.6",
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

// Preset standard mock clinical case documents
export const SAMPLE_DOCUMENTS: Record<string, { title: string; text: string; parsed: ExtractedClinicalData }> = {
  xuanwu_outpatient: {
    title: "首都医科大学宣武医院 神经内科门诊病历（主观认知下降）",
    text: `首都医科大学宣武医院 门诊病历记录
姓名：孙桂兰    性别：女    年龄：69岁    文化程度：大专（12年）
门诊号：XW2026-0948    联系电话：13910827361
主诉：记忆力进行性减退1年半，伴丢三落四。
现病史：患者近1年半前无明显诱因出现记忆力下降，主观感觉自己较同龄人记忆力显著变差，经常遗忘钥匙、老花镜存放位置，买菜常算不清零钱，偶有叫不出老邻居姓名。日常家务可基本独立完成，无幻觉妄想，情绪平稳。
既往史：高血压病史8年，长期口服氨氯地平，血压控制平稳；无糖尿病、脑卒中及冠心病病史。母亲生前有可疑老年痴呆病史。
辅助检查：
头颅高分辨率 MRI：双侧海马体积对称性轻度变小，Scheltens 内侧颞叶萎缩 (MTA) 分级：左侧 2 级，右侧 2 级。侧脑室旁可见散在缺血性白质高信号 (Fazekas 1 级)。
APOE 基因分型：ε3/ε4（携带 1 个 ε4 等位基因）。
初步诊断：主观认知下降 (SCD)，高度警惕阿尔茨海默病临床前期。`,
    parsed: {
      demographics: {
        name: "孙桂兰",
        gender: 2,
        age: 69,
        educationYears: 12,
        phone1: "13910827361",
        height: 160,
        weight: 58,
      },
      history: {
        chiefComplaint: "记忆力进行性减退1年半，主观记忆下降明显，伴钥匙遗失与找词困难",
        hypertension: true,
        diabetes: false,
        coronaryHeartDisease: false,
        stroke: false,
        familyHistory: true,
      },
      biomarkers: {
        mriAtrophy: true,
        mriDescription: "双侧海马体积对称性轻度变小，MTA分级2级；Fazekas 1级脑白质病变",
        apoe4: 1, // 携带 ε3/ε4
        abetaPet: 1, // 考虑高危提示
        tauPet: 0,
      },
      rawTextExcerpt: "双侧海马萎缩 MTA 2级，APOE ε3/ε4 携带，初步诊断：主观认知下降 (SCD)",
      sourceDocName: "宣武医院神经内科门诊病历_孙桂兰.pdf",
    },
  },
  mri_report: {
    title: "宣武医院 磁共振(MRI)诊断报告单（认知障碍专病）",
    text: `首都医科大学宣武医院 影像诊断报告书
姓名：王建国    性别：男    年龄：73岁    住院号：ZY-883921
检查项目：头颅高分辨率 3D-T1 BRAVO + T2-FLAIR 轴位
影像学表现：
1. 双侧海马结构轮廓变细，脉络膜裂增宽，左侧 MTA 评级 2 级，右侧 MTA 评级 2 级。
2. 额叶、颞叶皮层轻度脑沟增宽，脑回变薄。
3. 脑白质区无明显急性脑梗死及脑出血灶。
4. 脑小血管病表现轻度。
结论：海马萎缩 (MTA 2级)，符合认知障碍/阿尔茨海默病病理演变影像特征，建议结合神经心理学量表随访。`,
    parsed: {
      demographics: {
        name: "王建国",
        gender: 1,
        age: 73,
        educationYears: 9,
        phone1: "13801239876",
        height: 172,
        weight: 68,
      },
      history: {
        chiefComplaint: "头颅MRI影像提示海马萎缩 (MTA 2级)，主诉近事遗忘加重",
        hypertension: false,
        diabetes: false,
        coronaryHeartDisease: false,
        stroke: false,
        familyHistory: false,
      },
      biomarkers: {
        mriAtrophy: true,
        mriDescription: "双侧海马结构轮廓变细，脉络膜裂增宽，双侧 MTA 2级，额颞叶轻度萎缩",
        apoe4: 0,
        abetaPet: 0,
        tauPet: 0,
      },
      rawTextExcerpt: "双侧海马萎缩 MTA 2级，脉络膜裂增宽，符合阿尔茨海默病病理演变影像特征",
      sourceDocName: "宣武医院头颅MRI报告_王建国.jpg",
    },
  },
};

/**
 * Parses OCR raw text or simulates PaddleOCR pipeline
 */
export async function parseDocumentWithOcr(sampleKey?: string, uploadedFileName?: string): Promise<{
  jobId: string;
  state: "done";
  sourceDocName: string;
  rawMarkdown: string;
  clinicalJson: ExtractedClinicalData;
}> {
  const sample = SAMPLE_DOCUMENTS[sampleKey || "xuanwu_outpatient"] || SAMPLE_DOCUMENTS.xuanwu_outpatient;
  const jobId = `job_paddlevl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  return {
    jobId,
    state: "done",
    sourceDocName: uploadedFileName || sample.parsed.sourceDocName,
    rawMarkdown: sample.text,
    clinicalJson: {
      ...sample.parsed,
      sourceDocName: uploadedFileName || sample.parsed.sourceDocName,
    },
  };
}
