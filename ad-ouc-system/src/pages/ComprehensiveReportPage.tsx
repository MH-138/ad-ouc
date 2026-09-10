import React from "react";
import { SubjectRecord } from "../types/assessment";
import { SectionComprehensiveReport } from "../components/sections/SectionComprehensiveReport";

interface ComprehensiveReportPageProps {
  record: SubjectRecord;
  onUpdateRecord: (record: SubjectRecord) => void;
  onOpenAiModal: () => void;
  onOpenPrintModal: () => void;
  onExportExcel: () => void;
}

export const ComprehensiveReportPage: React.FC<ComprehensiveReportPageProps> = ({
  record,
  onUpdateRecord,
  onOpenAiModal,
  onOpenPrintModal,
  onExportExcel,
}) => {
  return (
    <div className="space-y-6">
      <SectionComprehensiveReport
        record={record}
        onChange={(updated) => onUpdateRecord({ ...record, ...updated })}
        onOpenAiModal={onOpenAiModal}
        onOpenPrintModal={onOpenPrintModal}
        onExportExcel={onExportExcel}
      />
    </div>
  );
};
