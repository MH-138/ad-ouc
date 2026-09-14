import React from "react";
import { SubjectRecord } from "../types/assessment";
import { SectionLanguageNaming } from "../components/sections/SectionLanguageNaming";

interface LanguageNamingPageProps {
  record: SubjectRecord;
  onUpdateRecord: (record: SubjectRecord) => void;
  onOpenTimerCenter: () => void;
}

export const LanguageNamingPage: React.FC<LanguageNamingPageProps> = ({
  record,
  onUpdateRecord,
  onOpenTimerCenter,
}) => {
  return (
    <div className="space-y-6">
      <SectionLanguageNaming
        record={record}
        onChange={(updated) => onUpdateRecord({ ...record, ...updated })}
        onOpenTimerCenter={onOpenTimerCenter}
      />
    </div>
  );
};
