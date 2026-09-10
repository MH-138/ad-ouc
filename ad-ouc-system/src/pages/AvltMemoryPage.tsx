import React from "react";
import { SubjectRecord } from "../types/assessment";
import { SectionMemoryBattery } from "../components/sections/SectionMemoryBattery";

interface AvltMemoryPageProps {
  record: SubjectRecord;
  onUpdateRecord: (record: SubjectRecord) => void;
}

export const AvltMemoryPage: React.FC<AvltMemoryPageProps> = ({
  record,
  onUpdateRecord,
}) => {
  return (
    <div className="space-y-6">
      <SectionMemoryBattery
        record={record}
        onChange={(updated) => onUpdateRecord({ ...record, ...updated })}
      />
    </div>
  );
};
