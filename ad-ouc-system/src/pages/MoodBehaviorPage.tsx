import React from "react";
import { SubjectRecord } from "../types/assessment";
import { SectionMoodBehavior } from "../components/sections/SectionMoodBehavior";

interface MoodBehaviorPageProps {
  record: SubjectRecord;
  onUpdateRecord: (record: SubjectRecord) => void;
}

export const MoodBehaviorPage: React.FC<MoodBehaviorPageProps> = ({
  record,
  onUpdateRecord,
}) => {
  return (
    <div className="space-y-6">
      <SectionMoodBehavior
        record={record}
        onChange={(updated) => onUpdateRecord({ ...record, ...updated })}
      />
    </div>
  );
};
