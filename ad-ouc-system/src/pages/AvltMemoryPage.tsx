import React from "react";
import { SubjectRecord } from "../types/assessment";
import { SectionMemoryBattery } from "../components/sections/SectionMemoryBattery";

interface AvltMemoryPageProps {
  record: SubjectRecord;
  onUpdateRecord: (record: SubjectRecord) => void;
  onOpenTimerCenter: () => void;
}

export const AvltMemoryPage: React.FC<AvltMemoryPageProps> = ({
  record,
  onUpdateRecord,
  onOpenTimerCenter,
}) => {
  return (
    <div className="space-y-6">
      <SectionMemoryBattery
        record={record}
        onChange={(updated) => onUpdateRecord({ ...record, ...updated })}
        onOpenTimerCenter={onOpenTimerCenter}
      />
    </div>
  );
};
