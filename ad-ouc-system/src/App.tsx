import React, { useState, useEffect, useRef } from "react";
import { SubjectRecord } from "./types/assessment";
import {
  DEFAULT_COHORT,
  TYPICAL_SCD_PRESET,
  PENDING_REVIEW_PRESET,
  BLANK_PATIENT_1_PRESET,
  BLANK_PATIENT_2_PRESET,
  hydrateSubjectRecord,
} from "./utils/initialPatient";
import { AppPageId } from "./types/navigation";
import { RoleType } from "./utils/chatDecisionTree";
import { exportRecordToExcel, exportCohortToExcel } from "./utils/excelExporter";
import { tursoApi } from "./services/tursoApi";

// Top-level Navigation Components & Portals
import { SystemPortal, PortalType } from "./components/SystemPortal";
import { AppLayout } from "./components/AppLayout";
import { ChatInterviewView } from "./components/ChatInterview/ChatInterviewView";
import { InformantInterviewPage } from "./pages/InformantInterviewPage";
import { PatientPortalPage } from "./pages/PatientPortalPage";

// Examiner Workbench Pages
import { PatientCenterPage } from "./pages/PatientCenterPage";
import { DemographicsPage } from "./pages/DemographicsPage";
import { ScdSubjectivePage } from "./pages/ScdSubjectivePage";
import { MmsePage } from "./pages/MmsePage";
import { MocaBPage } from "./pages/MocaBPage";
import { AvltMemoryPage } from "./pages/AvltMemoryPage";
import { LanguageNamingPage } from "./pages/LanguageNamingPage";
import { ExecutiveSttPage } from "./pages/ExecutiveSttPage";
import { AdasCogPage } from "./pages/AdasCogPage";
import { CdrStagingPage } from "./pages/CdrStagingPage";
import { MoodBehaviorPage } from "./pages/MoodBehaviorPage";
import { DailySleepPage } from "./pages/DailySleepPage";
import { BiomarkersPage } from "./pages/BiomarkersPage";
import { ComprehensiveReportPage } from "./pages/ComprehensiveReportPage";
import { ToolsLabPage } from "./pages/ToolsLabPage";
import { GuidePage } from "./pages/GuidePage";

// Global Utility Modals
import { TimerCenter } from "./components/TimerCenter";
import { AiAnalysisModal } from "./components/AiAnalysisModal";
import { PrintReportModal } from "./components/PrintReportModal";
import { MedicalRecordUploadModal } from "./components/MedicalRecordUploadModal";
import { PatientPickerModal } from "./components/PatientPickerModal";
import { DoctorApprovalModal } from "./components/DoctorApprovalModal";
import { NewPatientModal } from "./components/NewPatientModal";
import { ArrowLeft, User, Users } from "lucide-react";

export default function App() {
  // 1. Multi-Portal Routing state ("portal" | "patient" | "informant" | "examiner")
  const [currentPortal, setCurrentPortal] = useState<PortalType>(() => {
    const saved = localStorage.getItem("xuanwu_scd_active_portal");
    if (saved && ["portal", "patient", "informant", "examiner"].includes(saved)) {
      return saved as PortalType;
    }
    return "portal";
  });

  // 2. Active Page within Examiner Workbench
  const [activePage, setActivePage] = useState<AppPageId>("patient_center");

  // 3. Cohort & Active Patient State
  const [cohort, setCohort] = useState<SubjectRecord[]>(() => {
    const saved = localStorage.getItem("xuanwu_scd_patient_cohort");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(hydrateSubjectRecord);
        }
      } catch (e) {}
    }
    return DEFAULT_COHORT;
  });

  const [activePatientId, setActivePatientId] = useState<string | null>(() => {
    // Strictly null initially. Never fallback to default cohort or local storage on clean open
    return null;
  });

  // 4. Global Modals State
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPatientPickerOpen, setIsPatientPickerOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [pendingAiConsultations, setPendingAiConsultations] = useState<any[]>([]);
  const [pendingPortalAfterPatientSelect, setPendingPortalAfterPatientSelect] =
    useState<PortalType | null>(null);

  // Periodically refresh pending AI consultation reviews
  const refreshPendingAi = async () => {
    try {
      const list = await tursoApi.getPendingAiConsultations();
      if (Array.isArray(list)) {
        setPendingAiConsultations(list);
      }
    } catch (e) {}
  };

  useEffect(() => {
    refreshPendingAi();
    const interval = setInterval(refreshPendingAi, 12000);
    return () => clearInterval(interval);
  }, []);

  // Derived Active Record: strictly null when activePatientId is null
  const activeRecord: SubjectRecord | null = activePatientId
    ? cohort.find((p) => p.id === activePatientId) || null
    : null;

  // Load cohort from Turso on mount
  useEffect(() => {
    const loadTursoPatients = async () => {
      try {
        const remotePatients = await tursoApi.getPatients();
        if (Array.isArray(remotePatients) && remotePatients.length > 0) {
          const mappedCohort: SubjectRecord[] = remotePatients.map((p: any) => {
            const full = p.fullRecord || {};
            return hydrateSubjectRecord({
              ...full,
              ...p,
              id: p.id,
              subjectNo: p.research_no ?? p.researchNo ?? p.subjectNo ?? full.subjectNo ?? "",
              protocolNo: p.protocol_no ?? p.protocolNo ?? full.protocolNo,
              centerNo: p.center_no ?? p.centerNo ?? full.centerNo,
              visitCode: p.visit_code ?? p.visitCode ?? full.visitCode,
              evaluator: p.evaluator ?? full.evaluator,
              demographics: {
                ...(full.demographics || {}),
                name: p.name ?? full.demographics?.name,
                gender: p.gender === 1 || p.gender === 2 ? p.gender : full.demographics?.gender,
                age: p.age ?? full.demographics?.age,
                educationYears: p.education_years ?? p.educationYears ?? full.demographics?.educationYears,
                height: p.height_cm ?? p.height ?? full.demographics?.height,
                weight: p.weight_kg ?? p.weight ?? full.demographics?.weight,
                phone1: p.phone ?? full.demographics?.phone1,
                marriageStatus: p.marriage_status ?? full.demographics?.marriageStatus,
                livingStatus: p.living_status ?? full.demographics?.livingStatus,
              },
              scales: full.scales ?? p.scales,
              diagnosis: full.diagnosis ?? p.diagnosis,
              followUp: full.followUp ?? p.followUp,
              biomarkers: full.biomarkers ?? p.biomarkers,
            });
          });
          setCohort(mappedCohort);
        } else {
          // If Turso is empty, seed it with DEFAULT_COHORT
          await tursoApi.seedCohort(DEFAULT_COHORT);
        }
      } catch (e) {
        console.warn("Turso sync fallback to local storage:", e);
      }
    };
    loadTursoPatients();
  }, []);

  // Persist State
  useEffect(() => {
    localStorage.setItem("xuanwu_scd_active_portal", currentPortal);
  }, [currentPortal]);

  useEffect(() => {
    localStorage.setItem("xuanwu_scd_patient_cohort", JSON.stringify(cohort));
  }, [cohort]);

  useEffect(() => {
    if (activePatientId) {
      localStorage.setItem("xuanwu_scd_active_patient_id", activePatientId);
    } else {
      localStorage.removeItem("xuanwu_scd_active_patient_id");
    }
  }, [activePatientId]);

  // Record CRUD Handlers with Turso persistence
  const handleUpdateRecord = async (updated: SubjectRecord) => {
    const hydrated = hydrateSubjectRecord(updated);
    setCohort((prev) =>
      prev.map((p) =>
        p.id === hydrated.id
          ? { ...hydrated, updatedAt: new Date().toISOString() }
          : p
      )
    );
    try {
      await tursoApi.savePatient({
        id: hydrated.id,
        researchNo: hydrated.subjectNo,
        name: hydrated.demographics?.name,
        gender: hydrated.demographics?.gender,
        age: hydrated.demographics?.age,
        educationYears: hydrated.demographics?.educationYears,
        heightCm: hydrated.demographics?.height,
        weightKg: hydrated.demographics?.weight,
        phone: hydrated.demographics?.phone1,
        ...hydrated,
      });
    } catch (e) {
      console.warn("Turso update failed:", e);
    }
  };

  const handleNewPatient = () => {
    setIsNewPatientModalOpen(true);
  };

  const handleCreatePatient = (newRecord: SubjectRecord) => {
    const hydrated = hydrateSubjectRecord(newRecord);
    setCohort((prev) => [hydrated, ...prev]);
    setActivePatientId(hydrated.id);
    if (pendingPortalAfterPatientSelect) {
      setCurrentPortal(pendingPortalAfterPatientSelect);
      setPendingPortalAfterPatientSelect(null);
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    if (cohort.length <= 1) {
      alert("请至少保留一位受试者档案。");
      return;
    }
    setCohort((prev) => {
      const filtered = prev.filter((p) => p.id !== patientId);
      if (activePatientId === patientId) {
        setActivePatientId(filtered[0].id);
      }
      return filtered;
    });
    try {
      await tursoApi.deletePatient(patientId);
    } catch (e) {
      console.warn("Turso delete failed:", e);
    }
  };

  const handleLoadPreset = (presetName: string) => {
    let newRec: SubjectRecord;
    if (presetName === "typical_scd") {
      newRec = { ...TYPICAL_SCD_PRESET, id: "sub-" + Date.now() };
    } else if (presetName === "pending_review" || presetName === "early_mci") {
      newRec = { ...PENDING_REVIEW_PRESET, id: "sub-" + Date.now() };
    } else if (presetName === "blank_patient_1") {
      newRec = { ...BLANK_PATIENT_1_PRESET, id: "sub-" + Date.now() };
    } else {
      newRec = { ...BLANK_PATIENT_2_PRESET, id: "sub-" + Date.now() };
    }
    setCohort((prev) => [newRec, ...prev]);
    setActivePatientId(newRec.id);
  };

  // Portal selection from Gateway
  const handleSelectPortal = (portal: PortalType, targetPage?: AppPageId) => {
    if (portal === "patient" || portal === "informant") {
      setPendingPortalAfterPatientSelect(portal);
      setIsPatientPickerOpen(true);
      return;
    }
    // Clinician workbench: initial state has activePatientId as null, land on patient queue
    setActivePatientId(null);
    setCurrentPortal(portal);
    setActivePage(targetPage || "patient_center");
  };

  // ================= RENDER PORTAL 1: SYSTEM GATEWAY (THREE ISOLATED CHANNELS) =================
  if (currentPortal === "portal") {
    return (
      <>
        <SystemPortal onSelectPortal={handleSelectPortal} />
        <PatientPickerModal
          isOpen={isPatientPickerOpen}
          onClose={() => {
            setPendingPortalAfterPatientSelect(null);
            setIsPatientPickerOpen(false);
          }}
          cohort={cohort}
          activePatientId={activePatientId}
          onSelectPatient={(patientId) => {
            setActivePatientId(patientId);
            if (pendingPortalAfterPatientSelect) {
              setCurrentPortal(pendingPortalAfterPatientSelect);
              setPendingPortalAfterPatientSelect(null);
            }
          }}
          onNewPatient={handleNewPatient}
        />
        <NewPatientModal
          isOpen={isNewPatientModalOpen}
          onClose={() => setIsNewPatientModalOpen(false)}
          onCreatePatient={handleCreatePatient}
        />
      </>
    );
  }

  // ================= RENDER PORTAL 2: PATIENT SELF-ASSESSMENT =================
  if (currentPortal === "patient") {
    if (!activeRecord) {
      setCurrentPortal("portal");
      return null;
    }
    return (
      <PatientPortalPage
        record={activeRecord}
        onUpdateRecord={handleUpdateRecord}
        onReturnToPortal={() => {
          setActivePatientId(null);
          setCurrentPortal("portal");
        }}
      />
    );
  }

  // ================= RENDER PORTAL 3: INFORMANT & FAMILY OBSERVATION =================
  if (currentPortal === "informant") {
    if (!activeRecord) {
      setCurrentPortal("portal");
      return null;
    }
    return (
      <InformantInterviewPage
        record={activeRecord}
        onUpdateRecord={handleUpdateRecord}
        onReturnToPortal={() => {
          setActivePatientId(null);
          setCurrentPortal("portal");
        }}
      />
    );
  }

  // ================= RENDER PORTAL 4: CLINICIAN & RESEARCHER WORKBENCH =================
  const renderExaminerPage = () => {
    // If no patient is selected, block access to scales and report; guide user to select a patient from patient queue
    if (!activeRecord && activePage !== "patient_center" && activePage !== "clinical_guide") {
      return (
        <div className="flex flex-col items-center justify-center min-h-[55vh] bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">未选择受试者</h3>
          <p className="text-sm text-slate-500 max-w-md mb-6">
            进入临床量表评定、病历识别或综合报告前，请先在受试者队列中选择受试者或新建档案。
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActivePage("patient_center")}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
            >
              打开受试者中心选择
            </button>
            <button
              onClick={handleNewPatient}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
            >
              新建受试者档案
            </button>
          </div>
        </div>
      );
    }

    switch (activePage) {
      case "patient_center":
        return (
          <PatientCenterPage
            currentRecord={activeRecord}
            cohort={cohort}
            onSelectPatient={setActivePatientId}
            onUpdateRecord={handleUpdateRecord}
            onDeletePatient={handleDeletePatient}
            onLoadPreset={handleLoadPreset}
            onNewRecord={handleNewPatient}
            onOpenUploadModal={() => {
              if (!activeRecord) {
                alert("请先选择受试者后再上传病历或影像。");
                return;
              }
              setIsUploadModalOpen(true);
            }}
            onExportExcel={(rec) => {
              const target = rec || activeRecord;
              if (target) exportRecordToExcel(target);
            }}
            onNavigate={setActivePage}
          />
        );
      case "demographics":
        return (
          <DemographicsPage
            record={activeRecord!}
            onUpdateRecord={handleUpdateRecord}
          />
        );
      case "chat_interview":
        return (
          <div className="h-[calc(100vh-140px)] flex flex-col rounded-2xl overflow-hidden border border-slate-200 shadow-xs bg-white">
            <ChatInterviewView
              currentRecord={activeRecord!}
              onUpdateRecord={handleUpdateRecord}
              onOpenUploadModal={() => setIsUploadModalOpen(true)}
              onOpenAiModal={() => setIsAiModalOpen(true)}
              onOpenPrintModal={() => setIsPrintModalOpen(true)}
              onSwitchToWorkbench={() => setActivePage("mmse_page")}
              role="examiner"
            />
          </div>
        );
      case "scd_subjective":
        return (
          <ScdSubjectivePage
            record={activeRecord!}
            onUpdateRecord={handleUpdateRecord}
          />
        );
      case "mmse_page":
        return (
          <MmsePage
            record={activeRecord!}
            onUpdateRecord={handleUpdateRecord}
          />
        );
      case "moca_b_page":
        return (
          <MocaBPage
            record={activeRecord!}
            onUpdateRecord={handleUpdateRecord}
          />
        );
      case "avlt_memory":
        return (
          <AvltMemoryPage
            record={activeRecord!}
            onUpdateRecord={handleUpdateRecord}
          />
        );
      case "language_naming":
        return (
          <LanguageNamingPage
            record={activeRecord!}
            onUpdateRecord={handleUpdateRecord}
          />
        );
      case "executive_stt":
        return (
          <ExecutiveSttPage
            record={activeRecord!}
            onUpdateRecord={handleUpdateRecord}
          />
        );
      case "adas_cog":
        return (
          <AdasCogPage
            record={activeRecord!}
            onUpdateRecord={handleUpdateRecord}
          />
        );
      case "cdr_staging":
        return (
          <CdrStagingPage
            record={activeRecord!}
            onUpdateRecord={handleUpdateRecord}
          />
        );
      case "mood_behavior":
        return (
          <MoodBehaviorPage
            record={activeRecord!}
            onUpdateRecord={handleUpdateRecord}
          />
        );
      case "daily_sleep":
        return (
          <DailySleepPage
            record={activeRecord!}
            onUpdateRecord={handleUpdateRecord}
          />
        );
      case "biomarkers":
        return (
          <BiomarkersPage
            record={activeRecord!}
            onUpdateRecord={handleUpdateRecord}
          />
        );
      case "comprehensive_report":
        return (
          <ComprehensiveReportPage
            record={activeRecord!}
            onUpdateRecord={handleUpdateRecord}
            onOpenAiModal={() => setIsAiModalOpen(true)}
            onOpenPrintModal={() => setIsPrintModalOpen(true)}
            onExportExcel={() => {
              if (activeRecord) exportRecordToExcel(activeRecord);
            }}
          />
        );
      case "tools_lab":
        return (
          <ToolsLabPage
            record={activeRecord!}
            onUpdateRecord={handleUpdateRecord}
          />
        );
      case "clinical_guide":
        return <GuidePage onNavigate={setActivePage} />;
      default:
        return (
          <PatientCenterPage
            currentRecord={activeRecord}
            cohort={cohort}
            onSelectPatient={setActivePatientId}
            onUpdateRecord={handleUpdateRecord}
            onDeletePatient={handleDeletePatient}
            onLoadPreset={handleLoadPreset}
            onNewRecord={handleNewPatient}
            onOpenUploadModal={() => {
              if (!activeRecord) {
                alert("请先选择受试者后再上传病历或影像。");
                return;
              }
              setIsUploadModalOpen(true);
            }}
            onExportExcel={(rec) => {
              const target = rec || activeRecord;
              if (target) exportRecordToExcel(target);
            }}
            onNavigate={setActivePage}
          />
        );
    }
  };

  return (
    <AppLayout
      record={activeRecord}
      cohort={cohort}
      onSelectPatient={setActivePatientId}
      onClearPatient={() => {
        setActivePatientId(null);
        setActivePage("patient_center");
      }}
      activePage={activePage}
      onNavigate={setActivePage}
      onReturnToPortal={() => {
        setActivePatientId(null);
        setCurrentPortal("portal");
      }}
      onOpenTimerModal={() => {
        if (!activeRecord) {
          alert("请先选择受试者后再使用评定计时器。");
          return;
        }
        setIsTimerModalOpen(true);
      }}
      onOpenAiModal={() => {
        if (!activeRecord) {
          alert("请先选择受试者后再启动 AI 辅助研判。");
          return;
        }
        setIsAiModalOpen(true);
      }}
      onOpenPrintModal={() => {
        if (!activeRecord) {
          alert("请先选择受试者后再打印报告。");
          return;
        }
        setIsPrintModalOpen(true);
      }}
      onOpenUploadModal={() => {
        if (!activeRecord) {
          alert("请先选择受试者后再上传病历。");
          return;
        }
        setIsUploadModalOpen(true);
      }}
      onOpenApprovalModal={() => setIsApprovalModalOpen(true)}
      pendingAiCount={pendingAiConsultations.length}
      onExportExcel={() => {
        if (activeRecord) exportRecordToExcel(activeRecord);
      }}
      onNewRecord={handleNewPatient}
    >
      {renderExaminerPage()}

      {/* Global Utilities */}
      {activeRecord && (
        <>
          <TimerCenter
            isOpen={isTimerModalOpen}
            onClose={() => setIsTimerModalOpen(false)}
            onSaveVft={(count) => {
              const q = Math.floor(count / 4);
              handleUpdateRecord({
                ...activeRecord,
                scales: {
                  ...activeRecord.scales,
                  vft: {
                    ...activeRecord.scales.vft,
                    t1_15s: q,
                    t16_30s: q,
                    t31_45s: q,
                    t46_60s: count - q * 3,
                  },
                },
              });
            }}
            onSaveStt={(timeSec, type) => {
              if (type === "A") {
                handleUpdateRecord({
                  ...activeRecord,
                  scales: {
                    ...activeRecord.scales,
                    stt: { ...activeRecord.scales.stt, sttATestSeconds: timeSec },
                  },
                });
              } else {
                handleUpdateRecord({
                  ...activeRecord,
                  scales: {
                    ...activeRecord.scales,
                    stt: { ...activeRecord.scales.stt, sttBTestSeconds: timeSec },
                  },
                });
              }
            }}
          />

          <AiAnalysisModal
            isOpen={isAiModalOpen}
            onClose={() => setIsAiModalOpen(false)}
            record={activeRecord}
            onConsultationSubmitted={() => {
              refreshPendingAi();
            }}
            onOpenDoctorApproval={() => {
              setIsAiModalOpen(false);
              setIsApprovalModalOpen(true);
            }}
            onApplyDiagnosisNotes={(notes, category) => {
              handleUpdateRecord({
                ...activeRecord,
                diagnosis: {
                  ...activeRecord.diagnosis,
                  category: category !== undefined ? category : (activeRecord.diagnosis?.category ?? 1),
                  notes,
                  approvalStatus: "pending",
                },
              });
              refreshPendingAi();
            }}
          />

          <PrintReportModal
            isOpen={isPrintModalOpen}
            onClose={() => setIsPrintModalOpen(false)}
            record={activeRecord}
          />

          <MedicalRecordUploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            currentRecord={activeRecord}
            onApplyParsedData={(updated) => {
              handleUpdateRecord(updated);
            }}
          />
        </>
      )}

      {/* Doctor Approval & Electronic Signature Modal */}
      <DoctorApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        activeRecord={activeRecord || undefined}
        onRecordUpdated={async (patientId) => {
          refreshPendingAi();
          try {
            const remote = await tursoApi.getPatient(patientId);
            if (remote?.fullRecord) {
              handleUpdateRecord(remote.fullRecord);
            }
          } catch (e) {}
        }}
      />

      {/* New Patient Registration Modal */}
      <NewPatientModal
        isOpen={isNewPatientModalOpen}
        onClose={() => setIsNewPatientModalOpen(false)}
        onCreatePatient={handleCreatePatient}
      />
    </AppLayout>
  );
}
