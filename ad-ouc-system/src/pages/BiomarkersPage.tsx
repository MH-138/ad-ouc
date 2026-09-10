import React from "react";
import { SubjectRecord } from "../types/assessment";
import { SectionBiomarkersDiagnosis } from "../components/sections/SectionBiomarkersDiagnosis";

interface BiomarkersPageProps {
  record: SubjectRecord;
  onUpdateRecord: (record: SubjectRecord) => void;
}

export const BiomarkersPage: React.FC<BiomarkersPageProps> = ({
  record,
  onUpdateRecord,
}) => {
  return (
    <div className="space-y-6">
      <SectionBiomarkersDiagnosis
        record={record}
        onChange={(updated) => onUpdateRecord({ ...record, ...updated })}
      />
    </div>
  );
};
