import React from "react";
import { SubjectRecord } from "../types/assessment";
import { SectionCDRExpert } from "../components/sections/SectionCDRExpert";

interface CdrStagingPageProps {
  record: SubjectRecord;
  onUpdateRecord: (record: SubjectRecord) => void;
}

export const CdrStagingPage: React.FC<CdrStagingPageProps> = ({
  record,
  onUpdateRecord,
}) => {
  return (
    <div className="space-y-6">
      <SectionCDRExpert
        record={record}
        onChange={(updated) => onUpdateRecord({ ...record, ...updated })}
      />
    </div>
  );
};
