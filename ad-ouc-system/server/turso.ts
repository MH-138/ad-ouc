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
  const id = data.id || `aic_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
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
      JSON.stringify(data.aiSummary || {}),
      "",
      "",
      now,
      "",
    ],
  });
  return { id, status: "pending_doctor_signature", createdAt: now };
}

export async function getPendingAiConsultations() {
  const db = getTursoClient();
  const res = await db.execute({
    sql: "SELECT * FROM ai_consultations WHERE status = 'pending_doctor_signature' ORDER BY created_at DESC",
  });
  return res.rows.map((r: any) => ({
    id: r.id,
    patientId: r.patient_id,
    patientName: r.patient_name,
    status: r.status,
    suggestedDiagnosis: r.suggested_diagnosis,
    confidence: r.confidence,
    aiSummary: r.ai_summary_json ? JSON.parse(r.ai_summary_json as string) : {},
    createdAt: r.created_at,
  }));
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
