import { createClient, Client } from "@libsql/client";

// Hardcoded default connection credentials as requested by user
const DEFAULT_TURSO_URL = "libsql://ad-ouc-mh-138.aws-ap-northeast-1.turso.io";
const DEFAULT_TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg0MTU4NjUsImlkIjoiMDFhMDY1ZTQtMzUwMS03NWE1LThlMDEtOGZlODM1OWFlMzI0Iiwia2lkIjoiRzlQRzQ4TGlEaFdPVnJiMldheWZ3RGhBR3lpeDlvWHpkTmdHTmpRR2E4TSIsInJpZCI6IjIzNjU1ZjdjLWM1MWQtNDM1OC04NTE5LTQ1NWJmODUzMzJmOCJ9.VfAe_jo5NJuabb9lcrJmDhhY_1TTzwqlmDwhyzTbpqvFARiZ4_Ykuir9kRV0GwtTHUm0zVGuFHbfmvuqGyzMDw";

const tursoUrl = process.env.TURSO_DATABASE_URL || DEFAULT_TURSO_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN || DEFAULT_TURSO_TOKEN;

let clientInstance: Client | null = null;

export function getTursoClient(): Client {
  if (!clientInstance) {
    clientInstance = createClient({
      url: tursoUrl,
      authToken: tursoToken,
    });
  }
  return clientInstance;
}

// Initialize tables in Turso LibSQL database
export async function initDatabase(): Promise<void> {
  const db = getTursoClient();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      research_no TEXT,
      name TEXT NOT NULL,
      gender TEXT,
      birth_year INTEGER,
      age INTEGER,
      education_years INTEGER,
      occupation TEXT,
      marital_status TEXT,
      living_arrangement TEXT,
      height_cm REAL,
      weight_kg REAL,
      phone TEXT,
      source TEXT,
      created_by_role TEXT,
      history_json TEXT,
      biomarkers_json TEXT,
      raw_data_json TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      scale_code TEXT NOT NULL,
      role TEXT,
      status TEXT,
      current_index INTEGER,
      answers_json TEXT,
      score REAL,
      global_cdr REAL,
      level TEXT,
      label TEXT,
      details_json TEXT,
      started_at TEXT,
      completed_at TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS drafts (
      patient_id TEXT NOT NULL,
      role TEXT NOT NULL,
      flow_type TEXT,
      flow_id TEXT NOT NULL DEFAULT 'default',
      current_index INTEGER,
      answers_json TEXT,
      draft_json TEXT,
      status TEXT,
      client_updated_at TEXT,
      PRIMARY KEY (patient_id, role, flow_id)
    )
  `);

  try {
    await db.execute("ALTER TABLE drafts ADD COLUMN draft_json TEXT");
  } catch (error: any) {
    if (!String(error?.message || error).includes("duplicate column")) {
      console.warn("draft_json migration skipped:", error?.message || error);
    }
  }

  try {
    await db.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_drafts_role_flow ON drafts(patient_id, role, flow_id)");
  } catch (error: any) {
    console.warn("drafts unique index creation skipped:", error?.message || error);
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS ai_consultations (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      patient_name TEXT,
      status TEXT NOT NULL,
      suggested_diagnosis TEXT,
      confidence REAL,
      ai_summary_json TEXT,
      doctor_signature TEXT,
      doctor_notes TEXT,
      created_at TEXT,
      reviewed_at TEXT
    )
  `);

  console.log("Turso database initialized successfully.");
}

// Check Turso connection status & latency
export async function checkTursoHealth() {
  const start = Date.now();
  const db = getTursoClient();
  try {
    const ping = await db.execute("SELECT 1 as ping");
    const latency = Date.now() - start;
    const pCountRes = await db.execute("SELECT COUNT(*) as cnt FROM patients");
    const aCountRes = await db.execute("SELECT COUNT(*) as cnt FROM assessments");
    const patientCount = Number(pCountRes.rows[0]?.cnt || 0);
    const assessmentCount = Number(aCountRes.rows[0]?.cnt || 0);

    return {
      connected: true,
      url: tursoUrl,
      latencyMs: latency,
      patientCount,
      assessmentCount,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      connected: false,
      url: tursoUrl,
      error: error?.message || String(error),
      timestamp: new Date().toISOString(),
    };
  }
}

// Patients API
export async function getAllPatients(search?: string) {
  const db = getTursoClient();
  let sql = "SELECT * FROM patients ORDER BY updated_at DESC";
  let args: any[] = [];

  if (search && search.trim()) {
    sql = "SELECT * FROM patients WHERE name LIKE ? OR research_no LIKE ? ORDER BY updated_at DESC";
    args = [`%${search.trim()}%`, `%${search.trim()}%`];
  }

  const res = await db.execute({ sql, args });
  return res.rows.map((row: any) => {
    let fullRecord = null;
    if (row.raw_data_json) {
      try {
        fullRecord = JSON.parse(row.raw_data_json as string);
      } catch (e) {}
    }
    return {
      id: row.id,
      researchNo: row.research_no,
      name: row.name,
      gender: row.gender === "male" || row.gender === "1" ? 1 : row.gender === "female" || row.gender === "2" ? 2 : 1,
      birthYear: row.birth_year,
      age: row.age,
      educationYears: row.education_years,
      occupation: row.occupation,
      maritalStatus: row.marital_status,
      livingArrangement: row.living_arrangement,
      heightCm: row.height_cm,
      weightKg: row.weight_kg,
      phone: row.phone,
      source: row.source,
      createdByRole: row.created_by_role,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      fullRecord,
    };
  });
}

export async function getPatientById(id: string) {
  const db = getTursoClient();
  const res = await db.execute({
    sql: "SELECT * FROM patients WHERE id = ? LIMIT 1",
    args: [id],
  });

  if (res.rows.length === 0) return null;
  const row: any = res.rows[0];

  let fullRecord = null;
  if (row.raw_data_json) {
    try {
      fullRecord = JSON.parse(row.raw_data_json as string);
    } catch (e) {}
  }

  const assessmentsRes = await db.execute({
    sql: "SELECT * FROM assessments WHERE patient_id = ? ORDER BY created_at DESC",
    args: [id],
  });

  const assessments = assessmentsRes.rows.map((aRow: any) => ({
    id: aRow.id,
    patientId: aRow.patient_id,
    scaleCode: aRow.scale_code,
    role: aRow.role,
    status: aRow.status,
    currentIndex: aRow.current_index,
    score: aRow.score,
    globalCDR: aRow.global_cdr,
    level: aRow.level,
    label: aRow.label,
    answers: aRow.answers_json ? JSON.parse(aRow.answers_json as string) : {},
    details: aRow.details_json ? JSON.parse(aRow.details_json as string) : {},
    startedAt: aRow.started_at,
    completedAt: aRow.completed_at,
    createdAt: aRow.created_at,
    updatedAt: aRow.updated_at,
  }));

  return {
    id: row.id,
    researchNo: row.research_no,
    name: row.name,
    gender: row.gender === "male" || row.gender === "1" ? 1 : row.gender === "female" || row.gender === "2" ? 2 : 1,
    birthYear: row.birth_year,
    age: row.age,
    educationYears: row.education_years,
    occupation: row.occupation,
    maritalStatus: row.marital_status,
    livingArrangement: row.living_arrangement,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    phone: row.phone,
    source: row.source,
    createdByRole: row.created_by_role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    assessments,
    fullRecord,
  };
}

export async function upsertPatient(data: any) {
  const db = getTursoClient();
  const now = new Date().toISOString();
  const id = data.id || `pat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const researchNo = data.researchNo || data.subjectNo || `S${new Date().getFullYear().toString().slice(-2)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const name = data.name || data.demographics?.name || "受试者";
  const gender = String(data.gender ?? data.demographics?.gender ?? "1");
  const birthYear = data.birthYear || (data.age ? new Date().getFullYear() - data.age : 1955);
  const age = data.age ?? data.demographics?.age ?? (new Date().getFullYear() - birthYear);
  const educationYears = data.educationYears ?? data.demographics?.educationYears ?? 9;
  const heightCm = data.heightCm ?? data.height ?? data.demographics?.height ?? 165;
  const weightKg = data.weightKg ?? data.weight ?? data.demographics?.weight ?? 65;
  const phone = data.phone || data.demographics?.phone1 || "";
  const maritalStatus = String(data.maritalStatus ?? data.demographics?.maritalStatus ?? "married");
  const livingArrangement = String(data.livingArrangement ?? data.demographics?.socialSupport?.livingAlone ?? "with_family");
  const source = data.source || "manual";
  const createdByRole = data.createdByRole || "rater";

  const historyJson = JSON.stringify(data.history || {});
  const biomarkersJson = JSON.stringify(data.biomarkers || {});
  const rawDataJson = JSON.stringify(data);

  await db.execute({
    sql: `
      INSERT INTO patients (
        id, research_no, name, gender, birth_year, age, education_years,
        marital_status, living_arrangement, height_cm, weight_kg, phone,
        source, created_by_role, history_json, biomarkers_json, raw_data_json,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        research_no = excluded.research_no,
        name = excluded.name,
        gender = excluded.gender,
        birth_year = excluded.birth_year,
        age = excluded.age,
        education_years = excluded.education_years,
        marital_status = excluded.marital_status,
        living_arrangement = excluded.living_arrangement,
        height_cm = excluded.height_cm,
        weight_kg = excluded.weight_kg,
        phone = excluded.phone,
        history_json = excluded.history_json,
        biomarkers_json = excluded.biomarkers_json,
        raw_data_json = excluded.raw_data_json,
        updated_at = excluded.updated_at
    `,
    args: [
      id, researchNo, name, gender, birthYear, age, educationYears,
      maritalStatus, livingArrangement, heightCm, weightKg, phone,
      source, createdByRole, historyJson, biomarkersJson, rawDataJson,
      data.createdAt || now, now
    ],
  });

  return getPatientById(id);
}

export async function deletePatient(id: string) {
  const db = getTursoClient();
  await db.execute({ sql: "DELETE FROM drafts WHERE patient_id = ?", args: [id] });
  await db.execute({ sql: "DELETE FROM assessments WHERE patient_id = ?", args: [id] });
  const res = await db.execute({ sql: "DELETE FROM patients WHERE id = ?", args: [id] });
  return res.rowsAffected > 0;
}

// Assessments API
export async function upsertAssessment(data: any) {
  const db = getTursoClient();
  const now = new Date().toISOString();
  const id = data.id || `asm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const patientId = data.patientId;
  const scaleCode = data.scaleCode;
  const role = data.role || "rater";
  const status = data.status || "completed";
  const currentIndex = data.currentIndex || 0;
  const score = data.score != null ? Number(data.score) : null;
  const globalCDR = data.globalCDR != null ? Number(data.globalCDR) : null;
  const level = data.level || null;
  const label = data.label || null;
  const answersJson = JSON.stringify(data.answers || {});
  const detailsJson = JSON.stringify(data.details || {});
  const startedAt = data.startedAt || now;
  const completedAt = status === "completed" ? (data.completedAt || now) : null;

  await db.execute({
    sql: `
      INSERT INTO assessments (
        id, patient_id, scale_code, role, status, current_index,
        answers_json, score, global_cdr, level, label, details_json,
        started_at, completed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        current_index = excluded.current_index,
        answers_json = excluded.answers_json,
        score = excluded.score,
        global_cdr = excluded.global_cdr,
        level = excluded.level,
        label = excluded.label,
        details_json = excluded.details_json,
        completed_at = excluded.completed_at,
        updated_at = excluded.updated_at
    `,
    args: [
      id, patientId, scaleCode, role, status, currentIndex,
      answersJson, score, globalCDR, level, label, detailsJson,
      startedAt, completedAt, now, now
    ],
  });

  return { id, patientId, scaleCode, role, status, score, globalCDR, level, label, startedAt, completedAt };
}

// Drafts API
export async function getDraft(patientId: string, role: string, flowId?: string) {
  const db = getTursoClient();
  let sql = "SELECT * FROM drafts WHERE patient_id = ? AND role = ?";
  const args: any[] = [patientId, role];

  if (flowId && flowId !== "all") {
    sql += " AND flow_id = ? LIMIT 1";
    args.push(flowId);
  } else {
    sql += " ORDER BY client_updated_at DESC LIMIT 1";
  }

  const res = await db.execute({ sql, args });
  if (res.rows.length === 0) return null;
  const row: any = res.rows[0];
  return {
    patientId: row.patient_id,
    role: row.role,
    flowType: row.flow_type,
    flowId: row.flow_id,
    currentIndex: row.current_index,
    ...(row.draft_json ? JSON.parse(row.draft_json as string) : {}),
    answers: row.answers_json ? JSON.parse(row.answers_json as string) : {},
    status: row.status,
    clientUpdatedAt: row.client_updated_at,
  };
}

export async function saveDraft(data: any) {
  const db = getTursoClient();
  const now = new Date().toISOString();
  const patientId = data.patientId;
  const role = data.role;
  const flowId = data.flowId || "default";
  const flowType = data.flowType || "scale";
  const currentIndex = data.currentIndex || 0;
  const answersJson = JSON.stringify(data.answers || {});
  const draftJson = JSON.stringify(data.draftJson || data);
  const status = data.status || "in_progress";
  const clientUpdatedAt = data.clientUpdatedAt || now;

  const existing = await db.execute({
    sql: "SELECT 1 FROM drafts WHERE patient_id = ? AND role = ? AND flow_id = ? LIMIT 1",
    args: [patientId, role, flowId],
  });

  if (existing.rows.length > 0) {
    await db.execute({
      sql: `
        UPDATE drafts SET
          flow_type = ?,
          current_index = ?,
          answers_json = ?,
          draft_json = ?,
          status = ?,
          client_updated_at = ?
        WHERE patient_id = ? AND role = ? AND flow_id = ?
      `,
      args: [flowType, currentIndex, answersJson, draftJson, status, clientUpdatedAt, patientId, role, flowId],
    });
  } else {
    await db.execute({
      sql: `
        INSERT INTO drafts (
          patient_id, role, flow_type, flow_id, current_index,
          answers_json, draft_json, status, client_updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [patientId, role, flowType, flowId, currentIndex, answersJson, draftJson, status, clientUpdatedAt],
    });
  }
  return { success: true };
}

// AI Consultations & Doctor Signature Workflow
export async function createAiConsultation(data: {
  id?: string;
  patientId: string;
  patientName?: string;
  suggestedDiagnosis: string;
  confidence?: number;
  aiSummary: any;
}) {
  const db = getTursoClient();
  const now = new Date().toISOString();

  // 1. Check if an active pending consultation already exists for this patient
  const existingPending = await db.execute({
    sql: "SELECT * FROM ai_consultations WHERE patient_id = ? AND status = 'pending_doctor_signature' ORDER BY created_at DESC LIMIT 1",
    args: [data.patientId],
  });

  if (existingPending.rows.length > 0) {
    const existingRow: any = existingPending.rows[0];
    let prevSummary: any = {};
    try {
      prevSummary = JSON.parse(existingRow.ai_summary_json || "{}");
    } catch (e) {}

    const versionHistory = Array.isArray(prevSummary.versionHistory)
      ? prevSummary.versionHistory
      : [];

    versionHistory.push({
      version: versionHistory.length + 1,
      createdAt: existingRow.created_at,
      suggestedDiagnosis: existingRow.suggested_diagnosis,
      confidence: existingRow.confidence,
    });

    const mergedSummary = {
      ...data.aiSummary,
      version: versionHistory.length + 1,
      versionHistory,
    };

    await db.execute({
      sql: `
        UPDATE ai_consultations
        SET suggested_diagnosis = ?, confidence = ?, ai_summary_json = ?, created_at = ?, patient_name = ?
        WHERE id = ?
      `,
      args: [
        data.suggestedDiagnosis,
        data.confidence || 0.88,
        JSON.stringify(mergedSummary),
        now,
        data.patientName || existingRow.patient_name,
        existingRow.id,
      ],
    });

    return { id: existingRow.id, status: "pending_doctor_signature", createdAt: now, updated: true };
  }

  // 2. Insert new pending record if none exists
  const id = data.id || `aic_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const summaryWithVer = {
    ...data.aiSummary,
    version: 1,
    versionHistory: [],
  };

  await db.execute({
    sql: `
      INSERT INTO ai_consultations (
        id, patient_id, patient_name, status, suggested_diagnosis,
        confidence, ai_summary_json, doctor_signature, doctor_notes,
        created_at, reviewed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      id,
      data.patientId,
      data.patientName || "受试者",
      "pending_doctor_signature",
      data.suggestedDiagnosis,
      data.confidence || 0.88,
      JSON.stringify(summaryWithVer),
      "",
      "",
      now,
      "",
    ],
  });
  return { id, status: "pending_doctor_signature", createdAt: now, updated: false };
}

export async function getPendingAiConsultations() {
  const db = getTursoClient();
  const res = await db.execute({
    sql: "SELECT * FROM ai_consultations WHERE status = 'pending_doctor_signature' ORDER BY created_at DESC",
  });

  // Strict deduplication by patientId (only retain latest pending record per patient)
  const patientMap = new Map<string, any>();
  for (const r of res.rows as any[]) {
    const patientId = String(r.patient_id);
    if (!patientMap.has(patientId)) {
      patientMap.set(patientId, {
        id: r.id,
        patientId: r.patient_id,
        patientName: r.patient_name,
        status: r.status,
        suggestedDiagnosis: r.suggested_diagnosis,
        confidence: r.confidence,
        aiSummary: r.ai_summary_json ? JSON.parse(r.ai_summary_json as string) : {},
        createdAt: r.created_at,
      });
    }
  }

  return Array.from(patientMap.values());
}

export async function approveAiConsultation(
  id: string,
  doctorSignature: string,
  doctorNotes: string,
  confirmedCategory?: number
) {
  const db = getTursoClient();
  const now = new Date().toISOString();

  // 1. Update consultation row
  await db.execute({
    sql: `
      UPDATE ai_consultations
      SET status = 'approved', doctor_signature = ?, doctor_notes = ?, reviewed_at = ?
      WHERE id = ?
    `,
    args: [doctorSignature, doctorNotes, now, id],
  });

  // 2. Query consultation to get patient_id
  const consultRes = await db.execute({
    sql: "SELECT * FROM ai_consultations WHERE id = ? LIMIT 1",
    args: [id],
  });

  if (consultRes.rows.length > 0) {
    const consult: any = consultRes.rows[0];
    const patientId = consult.patient_id;

    // 3. Update patient's diagnosis and fullRecord in Turso
    const patientRes = await db.execute({
      sql: "SELECT * FROM patients WHERE id = ? LIMIT 1",
      args: [patientId],
    });

    if (patientRes.rows.length > 0) {
      const patientRow: any = patientRes.rows[0];
      let fullRecord: any = {};
      try {
        fullRecord = JSON.parse(patientRow.raw_data_json || "{}");
      } catch (e) {}

      fullRecord.diagnosis = {
        category: confirmedCategory || fullRecord.diagnosis?.category || 1,
        notes: doctorNotes || consult.suggested_diagnosis || "",
        evaluatorSignature: doctorSignature,
        approvedAt: now,
      };

      if (!fullRecord.followUp) fullRecord.followUp = {};
      fullRecord.followUp.evaluatorSignature = doctorSignature;
      fullRecord.followUp.signDate = now.split("T")[0];

      await db.execute({
        sql: "UPDATE patients SET raw_data_json = ?, updated_at = ? WHERE id = ?",
        args: [JSON.stringify(fullRecord), now, patientId],
      });
    }
  }

  return { success: true, reviewedAt: now };
}

// Clean old garbage data (like corrupted names or outdated sub-4) and seed the standard 4-patient cohort
export async function cleanAndSeedStandardCohort() {
  const db = getTursoClient();
  const now = new Date().toISOString();

  // 1. Delete all existing consultations, assessments, drafts, and patients
  await db.execute("DELETE FROM ai_consultations");
  await db.execute("DELETE FROM assessments");
  await db.execute("DELETE FROM drafts");
  await db.execute("DELETE FROM patients");

  // 2. Define the 4 standard patients with realistic 18-digit ID cards and differentiated clinical states
  const cohort = [
    {
      id: "sub-scd-001",
      research_no: "SCD-2026-001",
      name: "张建华",
      gender: "1",
      birth_year: 1955,
      age: 71,
      education_years: 12,
      marital_status: "married",
      living_arrangement: "with_family",
      height_cm: 168,
      weight_kg: 66,
      phone: "13801015678",
      source: "xuanwu_outpatient",
      created_by_role: "doctor",
      raw_data: {
        id: "sub-scd-001",
        subjectNo: "SCD-2026-001",
        evalDate: "2026-09-08",
        demographics: {
          name: "张建华",
          idCard: "110102195508123218",
          gender: 1,
          age: 71,
          birthDate: "1955-08-12",
          educationYears: 12,
          phone1: "13801015678",
          address: "北京市西城区宣武门内大街",
        },
        scdQ9: { q1: 1, q2: 1, q3: 1, q4: 0.5, q5: 0.5, q6: 1, q7: 0.5, q8: 1, q9: 0.5 },
        scales: {
          mmse: { items: { "2.1": 1, "2.2": 1, "2.3": 1, "2.4": 1, "2.5": 1, "2.6": 1, "2.7": 1, "2.8": 1, "2.9": 1, "2.10": 1, "2.11": 1, "2.12": 1, "2.13": 1, "2.14": 1, "2.15": 1, "2.16": 1, "2.17": 1, "2.18": 1, "2.19": 1, "2.20": 1, "2.21": 1, "2.22": 1, "2.23": 1, "2.24": 1, "2.25": 1, "2.26": 1, "2.27": 1, "2.28": 1 } },
          mocaB: { executiveTrail: 1, immediateRecall: 5, fluencyFruit: 2, orientation: 6, calculation13Yuan: 3, abstraction: 3, delayedRecall: 4, visualPerception10Obj: 3, naming4Animals: 4, attentionDigitsWhite: 1, attentionDigitsBlack: 2 },
          cdr: { memory: 0, orientation: 0, judgment: 0, community: 0, homeHobbies: 0, personalCare: 0 },
        },
        diagnosis: {
          category: 1,
          notes: "【宣武医院神经内科临床诊断与随访医嘱】\n临床诊断：主观认知下降 (Subjective Cognitive Decline, SCD)\n评定依据：受试者存在主观记忆减退主诉且自感担忧（SCD-Q9评分为7分），客观认知量表测试 MMSE 28分、MoCA-B 26分，全球 CDR=0分，知情者 FAQ 0分，日常生活自理能力完整。\n随访医嘱：\n1. 纳入宣武医院多中心 SCD 早期干预随访队列，预约 12 个月后复查。\n2. 执行地中海膳食与有氧步行锻炼处方。\n3. 控制血压与代谢危险因素，定期检测血浆 p-tau217 与睡眠质量。",
          evaluatorSignature: "韩璎 教授 / 主任医师",
          approvedAt: "2026-09-08T09:30:00.000Z",
          approvalStatus: "approved",
        },
        followUp: {
          nextVisitDate: "2027-09-08",
          evaluatorSignature: "韩璎 教授 / 主任医师",
          signDate: "2026-09-08",
        },
      },
    },
    {
      id: "sub-scd-002",
      research_no: "SCD-2026-002",
      name: "李淑芬",
      gender: "2",
      birth_year: 1958,
      age: 68,
      education_years: 9,
      marital_status: "married",
      living_arrangement: "with_family",
      height_cm: 162,
      weight_kg: 58,
      phone: "13910884562",
      source: "self_portal",
      created_by_role: "patient",
      raw_data: {
        id: "sub-scd-002",
        subjectNo: "SCD-2026-002",
        evalDate: "2026-09-10",
        demographics: {
          name: "李淑芬",
          idCard: "110108195804251429",
          gender: 2,
          age: 68,
          birthDate: "1958-04-25",
          educationYears: 9,
          phone1: "13910884562",
          address: "北京市海淀区中关村南大街",
        },
        scdQ9: { q1: 1, q2: 1, q3: 1, q4: 0.5, q5: 0.5, q6: 1, q7: 0.5, q8: 0.5, q9: 0 },
        scales: {
          gds15: { answers: { 1: false, 2: false, 3: false, 4: false, 5: true, 6: false, 7: true, 8: false, 9: false, 10: true, 11: false, 12: false, 13: true, 14: false, 15: false } },
          psqi: { bedTime: "22:30", sleepLatencyMinutes: 30, wakeTime: "06:00", actualSleepHours: 6, troubles: { a: 1, b: 2, c: 1, d: 0, e: 0, f: 0, g: 0, h: 0, i: 0, j: 0 }, selfQuality: 2, medication: 0, daytimeDysfunction: 1 },
        },
        diagnosis: {
          category: 1,
          notes: "",
          approvalStatus: "pending",
        },
        followUp: {
          nextVisitDate: "",
          evaluatorSignature: "",
        },
      },
    },
    {
      id: "sub-blank-003",
      research_no: "BLANK-2026-003",
      name: "王卫国",
      gender: "1",
      birth_year: 1961,
      age: 65,
      education_years: 12,
      marital_status: "married",
      living_arrangement: "with_family",
      height_cm: 172,
      weight_kg: 70,
      phone: "13601237890",
      source: "manual",
      created_by_role: "rater",
      raw_data: {
        id: "sub-blank-003",
        subjectNo: "BLANK-2026-003",
        evalDate: "2026-09-10",
        demographics: {
          name: "王卫国",
          idCard: "110105196111082513",
          gender: 1,
          age: 65,
          birthDate: "1961-11-08",
          educationYears: 12,
          phone1: "13601237890",
          address: "北京市朝阳区北苑路",
        },
        scdQ9: {},
        scales: {},
        diagnosis: {
          category: 0,
          notes: "",
          approvalStatus: "none",
        },
        followUp: {
          nextVisitDate: "",
          evaluatorSignature: "",
        },
      },
    },
    {
      id: "sub-blank-004",
      research_no: "BLANK-2026-004",
      name: "赵桂兰",
      gender: "2",
      birth_year: 1963,
      age: 63,
      education_years: 9,
      marital_status: "married",
      living_arrangement: "with_family",
      height_cm: 160,
      weight_kg: 56,
      phone: "13520194837",
      source: "manual",
      created_by_role: "rater",
      raw_data: {
        id: "sub-blank-004",
        subjectNo: "BLANK-2026-004",
        evalDate: "2026-09-10",
        demographics: {
          name: "赵桂兰",
          idCard: "110104196307194627",
          gender: 2,
          age: 63,
          birthDate: "1963-07-19",
          educationYears: 9,
          phone1: "13520194837",
          address: "北京市丰台区方庄东路",
        },
        scdQ9: {},
        scales: {},
        diagnosis: {
          category: 0,
          notes: "",
          approvalStatus: "none",
        },
        followUp: {
          nextVisitDate: "",
          evaluatorSignature: "",
        },
      },
    },
  ];

  // Insert standard patients
  for (const p of cohort) {
    await db.execute({
      sql: `
        INSERT INTO patients (
          id, research_no, name, gender, birth_year, age, education_years,
          marital_status, living_arrangement, height_cm, weight_kg, phone,
          source, created_by_role, history_json, biomarkers_json, raw_data_json,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '{}', '{}', ?, ?, ?)
      `,
      args: [
        p.id,
        p.research_no,
        p.name,
        p.gender,
        p.birth_year,
        p.age,
        p.education_years,
        p.marital_status,
        p.living_arrangement,
        p.height_cm,
        p.weight_kg,
        p.phone,
        p.source,
        p.created_by_role,
        JSON.stringify(p.raw_data),
        now,
        now,
      ],
    });
  }

  // 3. Create strictly ONE pending AI consultation for 李淑芬
  const pendingSummary = {
    tag: "典型SCD",
    suggestedCategory: 1,
    confidence: 0.92,
    summary: "受试者 李淑芬 (女, 68岁) 自评 SCD-Q9 评分为 6/9 分，主诉近 1 年半记忆力持续减退且有担忧情绪；知情者 FAQ 0分，日常生活完全独立，符合 Jessen 2014 标准主观认知下降早期特征。",
    reportText: "【宣武医院认知障碍多模态智能临床研判报告】\n受试者编号：SCD-2026-002   受试者姓名：李淑芬   性别：女   年龄：68岁   文化程度：9年\n一、临床综合分型研判：\n【主观认知下降 (Subjective Cognitive Decline, SCD 典型期)】\n推荐临床诊断编码：SCD (Category 1)    综合研判置信度：92%\n\n二、多维临床依据与自评特征：\n1. 主观记忆自评：SCD-Q9 自评分数 6/9 分，伴近事遗忘与明显担忧，符合 Jessen 等 SCD-plus 高危主诉标准。\n2. 心理与情绪自评：GDS-15 评分 4/15 分，处于轻度情绪波动范围；PSQI 睡眠障碍指数 5 分。\n\n三、专家处理与随访建议：\n1. 纳入宣武医院多中心 SCD 科研队列，建立 12 个月纵向追踪档案。\n2. 建议由主治医师完成客观神经心理量表测试（MMSE、MoCA-B）并签署电子签名。\n（本建议已实时推送至主治医师工作站待办队列，经医生电子签字后正式生效）",
    version: 1,
    versionHistory: [],
  };

  await db.execute({
    sql: `
      INSERT INTO ai_consultations (
        id, patient_id, patient_name, status, suggested_diagnosis,
        confidence, ai_summary_json, doctor_signature, doctor_notes,
        created_at, reviewed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, '', '', ?, '')
    `,
    args: [
      "aic_scd_002_lishufen",
      "sub-scd-002",
      "李淑芬",
      "pending_doctor_signature",
      "典型SCD: 李淑芬 - 典型主观认知下降阶段 (SCD, 符合 NIA-AA 临床早期特征)",
      0.92,
      JSON.stringify(pendingSummary),
      now,
    ],
  });

  console.log("Standard 4-cohort patient database cleaned and initialized successfully.");
  return { success: true, count: 4 };
}
