import React from "react";
import { SubjectRecord } from "../types/assessment";
import { SectionDailyLivingSleep } from "../components/sections/SectionDailyLivingSleep";

interface DailySleepPageProps {
  record: SubjectRecord;
  onUpdateRecord: (record: SubjectRecord) => void;
}

export const DailySleepPage: React.FC<DailySleepPageProps> = ({
  record,
  onUpdateRecord,
}) => {
  return (
    <div className="space-y-6">
      <SectionDailyLivingSleep
        record={record}
        onChange={(updated) => onUpdateRecord({ ...record, ...updated })}
      />
    </div>
  );
};
