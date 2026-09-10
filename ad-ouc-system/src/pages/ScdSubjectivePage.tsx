import React from "react";
import { SubjectRecord } from "../types/assessment";
import { SectionSCDSubjective } from "../components/sections/SectionSCDSubjective";

interface ScdSubjectivePageProps {
  record: SubjectRecord;
  onUpdateRecord: (record: SubjectRecord) => void;
}

export const ScdSubjectivePage: React.FC<ScdSubjectivePageProps> = ({
  record,
  onUpdateRecord,
}) => {
  return (
    <div className="space-y-6">
      <SectionSCDSubjective
        record={record}
        onChange={(updated) => onUpdateRecord({ ...record, ...updated })}
      />
    </div>
  );
};
