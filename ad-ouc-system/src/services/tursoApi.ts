// Client-side service communicating with the Turso LibSQL database backend

export interface TursoDbStatus {
  connected: boolean;
  url: string;
  latencyMs?: number;
  patientCount?: number;
  assessmentCount?: number;
  error?: string;
  timestamp: string;
}

export interface TursoPatient {
  id: string;
  researchNo: string;
  name: string;
  gender: 1 | 2;
  birthYear?: number;
  age: number;
  educationYears: number;
  occupation?: string;
  maritalStatus?: string;
  livingArrangement?: string;
  heightCm?: number;
  weightKg?: number;
  phone?: string;
  source?: string;
  createdByRole?: string;
  createdAt?: string;
  updatedAt?: string;
  fullRecord?: any;
}

export interface TursoAssessment {
  id?: string;
  patientId: string;
  scaleCode: string;
  role?: string;
  status?: string;
  currentIndex?: number;
  score?: number | null;
  globalCDR?: number | null;
  level?: "green" | "yellow" | "red" | string;
  label?: string;
  answers?: Record<string, any>;
  details?: Record<string, any>;
  startedAt?: string;
  completedAt?: string;
}

export const tursoApi = {
  // Check health and latency
  async checkStatus(): Promise<TursoDbStatus> {
    try {
      const res = await fetch("/api/v1/db/status");
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
      return {
        connected: false,
        url: "libsql://ad-ouc-mh-138.aws-ap-northeast-1.turso.io",
        error: json.error || "Status check failed",
        timestamp: new Date().toISOString(),
      };
    } catch (e: any) {
      return {
        connected: false,
        url: "libsql://ad-ouc-mh-138.aws-ap-northeast-1.turso.io",
        error: e?.message || "Network error",
        timestamp: new Date().toISOString(),
      };
    }
  },

  // Fetch all patients from Turso
  async getPatients(search?: string): Promise<TursoPatient[]> {
    try {
      const url = search
        ? `/api/v1/patients?search=${encodeURIComponent(search)}`
        : "/api/v1/patients";
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
      return [];
    } catch (e) {
      console.error("Failed to load patients from Turso:", e);
      return [];
    }
  },

  // Get single patient with assessments
  async getPatient(id: string): Promise<any | null> {
    try {
      const res = await fetch(`/api/v1/patients/${encodeURIComponent(id)}`);
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
      return null;
    } catch (e) {
      console.error("Failed to load patient from Turso:", e);
      return null;
    }
  },

  // Create or update patient in Turso
  async savePatient(patientData: any): Promise<any | null> {
    try {
      const res = await fetch("/api/v1/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patientData),
      });
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
      return null;
    } catch (e) {
      console.error("Failed to save patient to Turso:", e);
      return null;
    }
  },

  // Delete patient
  async deletePatient(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/v1/patients/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      return !!json.success;
    } catch (e) {
      console.error("Failed to delete patient from Turso:", e);
      return false;
    }
  },

  // Save assessment to Turso
  async saveAssessment(patientId: string, assessmentData: TursoAssessment): Promise<any | null> {
    try {
      const res = await fetch(`/api/v1/patients/${encodeURIComponent(patientId)}/assessments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assessmentData),
      });
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
      return null;
    } catch (e) {
      console.error("Failed to save assessment to Turso:", e);
      return null;
    }
  },

  // Seed default cohort to Turso if empty
  async seedCohort(cohort: any[]): Promise<number> {
    try {
      const res = await fetch("/api/v1/seed-cohort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cohort }),
      });
      const json = await res.json();
      return json.count || 0;
    } catch (e) {
      console.error("Failed to seed cohort to Turso:", e);
      return 0;
    }
  },

  // Save role draft with flowId support
  async saveDraft(patientId: string, role: string, draftData: any, flowId: string = "default"): Promise<boolean> {
    try {
      const res = await fetch(`/api/v1/patients/${encodeURIComponent(patientId)}/drafts/${encodeURIComponent(role)}/${encodeURIComponent(flowId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draftData,
          flowId,
          draftJson: draftData,
        }),
      });
      const json = await res.json();
      return !!json.success;
    } catch (e) {
      return false;
    }
  },

  // Get role draft with flowId support
  async getDraft(patientId: string, role: string, flowId: string = "default"): Promise<any | null> {
    try {
      const res = await fetch(`/api/v1/patients/${encodeURIComponent(patientId)}/drafts/${encodeURIComponent(role)}/${encodeURIComponent(flowId)}`);
      const json = await res.json();
      return json.success ? json.data : null;
    } catch (e) {
      return null;
    }
  },

  // Alias for getDraft
  async loadDraft(patientId: string, role: string, flowId: string = "default"): Promise<any | null> {
    return this.getDraft(patientId, role, flowId);
  },

  // AI Consultations & Doctor Signature Workflow
  async getPendingAiConsultations(): Promise<any[]> {
    try {
      const res = await fetch("/api/v1/ai-consultations/pending");
      const json = await res.json();
      return json.success && Array.isArray(json.items) ? json.items : [];
    } catch (e) {
      return [];
    }
  },

  async submitAiConsultation(payload: {
    patientId: string;
    patientName?: string;
    suggestedDiagnosis?: string;
    scenarioTag?: string;
    category?: number;
    confidence?: number;
    summary?: string;
    reportText?: string;
    aiSummary?: any;
  }): Promise<any> {
    try {
      const res = await fetch("/api/v1/ai-consultations/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          suggestedDiagnosis:
            payload.suggestedDiagnosis || payload.reportText || payload.summary || "",
          aiSummary: payload.aiSummary || {
            suggestedCategory: payload.category,
            scenarioTag: payload.scenarioTag,
            summary: payload.summary,
            reportText: payload.reportText,
          },
        }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e?.message };
    }
  },

  async approveAiConsultation(
    id: string,
    doctorSignature: string,
    doctorNotes: string,
    confirmedCategory?: number
  ): Promise<any> {
    try {
      const res = await fetch(`/api/v1/ai-consultations/${encodeURIComponent(id)}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorSignature, doctorNotes, confirmedCategory }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e?.message };
    }
  },

  // Document parsing API
  async parseOcrRecord(sampleKey?: string, fileName?: string): Promise<any> {
    try {
      const res = await fetch("/api/v1/ocr/parse-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sampleKey, fileName }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e?.message };
    }
  },
};
