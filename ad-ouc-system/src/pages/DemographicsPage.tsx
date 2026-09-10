import React from "react";
import { SubjectRecord } from "../types/assessment";
import { SectionDemographicsHistory } from "../components/sections/SectionDemographicsHistory";

interface DemographicsPageProps {
  record: SubjectRecord;
  onUpdateRecord: (record: SubjectRecord) => void;
}

export const DemographicsPage: React.FC<DemographicsPageProps> = ({
  record,
  onUpdateRecord,
}) => {
  return (
    <div className="space-y-6">
      <SectionDemographicsHistory
        record={record}
        onChange={(updated) => onUpdateRecord({ ...record, ...updated })}
      />
    </div>
  );
};
