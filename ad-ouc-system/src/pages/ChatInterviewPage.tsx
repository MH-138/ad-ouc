import React, { useState } from "react";
import { SubjectRecord } from "../types/assessment";
import { ChatInterviewView } from "../components/ChatInterview/ChatInterviewView";
import { RoleType } from "../utils/chatDecisionTree";
import { AppPageId } from "../types/navigation";

interface ChatInterviewPageProps {
  record: SubjectRecord;
  onUpdateRecord: (record: SubjectRecord) => void;
  onOpenUploadModal: () => void;
  onOpenAiModal: () => void;
  onOpenPrintModal: () => void;
  onNavigate: (pageId: AppPageId) => void;
  role?: RoleType;
  onChangeRole?: (role: RoleType) => void;
}

export const ChatInterviewPage: React.FC<ChatInterviewPageProps> = ({
  record,
  onUpdateRecord,
  onOpenUploadModal,
  onOpenAiModal,
  onOpenPrintModal,
  onNavigate,
  role: parentRole,
  onChangeRole: parentOnChangeRole,
}) => {
  const [internalRole, setInternalRole] = useState<RoleType>("patient");
  const activeRole = parentRole || internalRole;
  const handleRoleChange = parentOnChangeRole || setInternalRole;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col rounded-2xl overflow-hidden border border-slate-200 shadow-xs bg-white">
      <ChatInterviewView
        currentRecord={record}
        onUpdateRecord={onUpdateRecord}
        onOpenUploadModal={onOpenUploadModal}
        onOpenAiModal={onOpenAiModal}
        onOpenPrintModal={onOpenPrintModal}
        onSwitchToWorkbench={() => onNavigate("mmse_page")}
        role={activeRole}
        onChangeRole={handleRoleChange}
      />
    </div>
  );
};
