import React from "react";
import { SubjectRecord } from "../types/assessment";
import { SectionADASCog } from "../components/sections/SectionADASCog";

interface AdasCogPageProps {
  record: SubjectRecord;
  onUpdateRecord: (record: SubjectRecord) => void;
}

export const AdasCogPage: React.FC<AdasCogPageProps> = ({
  record,
  onUpdateRecord,
}) => {
  return (
    <div className="space-y-6">
      <SectionADASCog
        record={record}
        onChange={(updated) => onUpdateRecord({ ...record, ...updated })}
      />
    </div>
  );
};
