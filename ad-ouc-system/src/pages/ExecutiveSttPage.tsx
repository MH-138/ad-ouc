import React from "react";
import { SubjectRecord } from "../types/assessment";
import { SectionExecutiveAttention } from "../components/sections/SectionExecutiveAttention";

interface ExecutiveSttPageProps {
  record: SubjectRecord;
  onUpdateRecord: (record: SubjectRecord) => void;
}

export const ExecutiveSttPage: React.FC<ExecutiveSttPageProps> = ({
  record,
  onUpdateRecord,
}) => {
  return (
    <div className="space-y-6">
      <SectionExecutiveAttention
        record={record}
        onChange={(updated) => onUpdateRecord({ ...record, ...updated })}
      />
    </div>
  );
};
