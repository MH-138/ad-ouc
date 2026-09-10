import { SubjectRecord, AssessmentSummaryResults } from "../types/assessment";

// 1. Edinburgh Handedness
export function calculateHandedness(tasks: Record<string, { left: 0 | 1 | 2; right: 0 | 1 | 2 }>) {
  let leftSum = 0;
  let rightSum = 0;

  Object.values(tasks || {}).forEach((t) => {
    leftSum += t?.left || 0;
    rightSum += t?.right || 0;
  });

  const total = leftSum + rightSum;
  if (total === 0) return { score: 0, result: "未评定" as const, leftSum, rightSum };

  const score = Math.round((100 * (rightSum - leftSum)) / total);
  let result: "左利手" | "双利手" | "右利手" = "右利手";
  if (score < -40) {
    result = "左利手";
  } else if (score <= 40) {
    result = "双利手";
  } else {
    result = "右利手";
  }

  return { score, result, leftSum, rightSum };
}

// 2. MMSE Score & Norm evaluation
export function calculateMMSE(items: Record<string, number>, educationYears: number) {
  let score = 0;
  for (let i = 1; i <= 30; i++) {
    const key = `2.${i}`;
    score += items?.[key] === 1 ? 1 : 0;
  }

  let cutoff = 24;
  let eduGroup = "初中及以上 (>6年)";
  if (educationYears === 0) {
    cutoff = 17;
    eduGroup = "文盲 (0年)";
  } else if (educationYears <= 6) {
    cutoff = 20;
    eduGroup = "小学 (1-6年)";
  }

  const isAbnormal = score <= cutoff;
  return { score, cutoff, eduGroup, isAbnormal };
}

// 3. AVLT-H Score & Norm evaluation (Huashan Auditory Verbal Learning Test)
export function calculateAVLTH(
  avlt: SubjectRecord["scales"]["avltH"],
  age: number,
  _educationYears?: number
) {
  const n1Score = avlt?.n1Words?.length || 0;
  const n2Score = avlt?.n2Words?.length || 0;
  const n3Score = avlt?.n3Words?.length || 0;
  const immediateAvg = Math.round(((n1Score + n2Score + n3Score) / 3) * 10) / 10;
  const n4ShortDelay = avlt?.n4Delayed5MinWords?.length || 0;
  const n5LongDelay = avlt?.n5Delayed20MinWords?.length || 0;
  const n6CuedCount =
    (avlt?.n6CategoryCued?.flowers?.length || 0) +
    (avlt?.n6CategoryCued?.occupations?.length || 0) +
    (avlt?.n6CategoryCued?.clothing?.length || 0);
  const n7Recognition = Math.max(0, 24 - (avlt?.n7RecognitionErrors || 0));

  let delayCutoff = 4;
  let recognitionCutoff = 19;
  let ageGroup = "60-69 岁";

  if (age < 60) {
    delayCutoff = 5;
    recognitionCutoff = 20;
    ageGroup = "50-59 岁";
  } else if (age >= 70) {
    delayCutoff = 3;
    recognitionCutoff = 18;
    ageGroup = "70-79 岁及以上";
  }

  const isDelayAbnormal = n5LongDelay <= delayCutoff;
  const isRecognitionAbnormal = n7Recognition <= recognitionCutoff;

  return {
    n1Score,
    n2Score,
    n3Score,
    immediateAvg,
    n4ShortDelay,
    n5LongDelay,
    n5Score: n5LongDelay,
    n6CuedCount,
    n7Recognition,
    delayCutoff,
    n5Cutoff: delayCutoff,
    recognitionCutoff,
    ageGroup,
    isDelayAbnormal,
    isN5Abnormal: isDelayAbnormal,
    isRecognitionAbnormal,
  };
}

// 4. Verbal Fluency Test (VFT)
export function calculateVFT(
  vft: SubjectRecord["scales"]["vft"],
  educationYears: number,
  _age?: number
) {
  const total =
    (vft?.t1_15s || 0) +
    (vft?.t16_30s || 0) +
    (vft?.t31_45s || 0) +
    (vft?.t46_60s || 0);

  let cutoff = 13;
  let eduGroup = "高中 (9-12年)";
  if (educationYears < 9) {
    cutoff = 12;
    eduGroup = "初中及以下 (≤8年)";
  } else if (educationYears > 12) {
    cutoff = 14;
    eduGroup = "大学及以上 (≥13年)";
  }

  const isAbnormal = total <= cutoff;
  return {
    total,
    totalScore: total,
    cutoff,
    eduGroup,
    group: eduGroup,
    isAbnormal,
  };
}

// 5. Boston Naming Test (BNT 30)
export function calculateBNT(
  bnt: Record<string, any> | SubjectRecord["scales"]["bnt"],
  educationYears: number,
  _age?: number
) {
  let spontaneousScore = 0;
  let cuedScore = 0;
  let recognizedScore = 0;

  const rawItems = (bnt as any)?.items || bnt || {};
  Object.values(rawItems).forEach((item: any) => {
    if (item?.spontaneous) {
      spontaneousScore += 1;
    } else if (item?.semanticCueCorrect) {
      cuedScore += 1;
    } else if (item?.recognitionChoice) {
      recognizedScore += 1;
    }
  });

  let cutoff = 21;
  let eduGroup = "高中 (9-12年)";
  if (educationYears < 9) {
    cutoff = 19;
    eduGroup = "初中及以下 (≤8年)";
  } else if (educationYears > 12) {
    cutoff = 22;
    eduGroup = "大学及以上 (≥13年)";
  }

  const isAbnormal = spontaneousScore <= cutoff;
  return {
    spontaneousScore,
    cuedScore,
    recognizedScore,
    totalCorrect: spontaneousScore + cuedScore,
    totalScore: spontaneousScore,
    cutoff,
    eduGroup,
    group: eduGroup,
    isAbnormal,
  };
}

// 6. Shape Trailing Test (STT-A & STT-B)
export function calculateSTT(
  stt: SubjectRecord["scales"]["stt"],
  educationYears: number,
  age: number
) {
  const sttATotal = (stt?.sttAPracticeSeconds || 0) + (stt?.sttATestSeconds || 0);
  const sttBTotal = (stt?.sttBPracticeSeconds || 0) + (stt?.sttBTestSeconds || 0);

  let sttACutoff = 80;
  let sttBCutoff = 200;
  let ageGroup = "60-69 岁";

  if (age < 60) {
    sttACutoff = 70;
    sttBCutoff = 180;
    ageGroup = "50-59 岁";
  } else if (age >= 70) {
    sttACutoff = 100;
    sttBCutoff = 240;
    ageGroup = "70-79 岁及以上";
  }

  const isSTTAAbnormal = (stt?.sttATestSeconds || 0) >= sttACutoff;
  const isSTTBAbnormal = (stt?.sttBTestSeconds || 0) >= sttBCutoff;

  return {
    sttATotal,
    sttBTotal,
    sttACutoff,
    sttBCutoff,
    aCutoff: sttACutoff,
    bCutoff: sttBCutoff,
    ageGroup,
    group: ageGroup,
    isSTTAAbnormal,
    isSTTBAbnormal,
    isAAbnormal: isSTTAAbnormal,
    isBAbnormal: isSTTBAbnormal,
  };
}

// 7. Logical Memory Story Recall
export function calculateLogicalMemory(
  logical: SubjectRecord["scales"]["logicalMemory"],
  educationYears: number
) {
  const immediate = logical?.immediateStoryUnits || 0;
  const delayed = logical?.delayed30MinStoryUnits || 0;

  let cutoff = 4;
  let eduGroup = "受教育 8-15 年";
  if (educationYears >= 16) {
    cutoff = 8;
    eduGroup = "受教育 ≥16 年 (大学及以上)";
  } else if (educationYears <= 7) {
    cutoff = 2;
    eduGroup = "受教育 ≤7 年 (小学及以下)";
  }

  const isAbnormal = delayed <= cutoff;
  return {
    immediate,
    delayed,
    delayedStoryUnits: delayed,
    cutoff,
    delayedCutoff: cutoff,
    eduGroup,
    isAbnormal,
    isDelayedAbnormal: isAbnormal,
  };
}

// 8. GDS-15
export function calculateGDS15(answers: Record<number, boolean>) {
  const reverseItems = [1, 5, 7, 11, 13];
  let score = 0;

  for (let i = 1; i <= 15; i++) {
    const ans = answers?.[i];
    if (ans !== undefined) {
      if (reverseItems.includes(i)) {
        if (!ans) score += 1;
      } else {
        if (ans) score += 1;
      }
    }
  }

  let grade = "正常 (0-4分)";
  let level: "normal" | "mild" | "moderate" | "severe" = "normal";
  if (score >= 12) {
    grade = "重度抑郁 (12-15分)";
    level = "severe";
  } else if (score >= 9) {
    grade = "中度抑郁 (9-11分)";
    level = "moderate";
  } else if (score >= 5) {
    grade = "轻度抑郁 (5-8分)";
    level = "mild";
  }

  return {
    score,
    grade,
    level,
    isDepressed: score >= 8,
    isAbnormal: score >= 8,
  };
}

// 9. MES (Memory & Execution Scale, 100 max)
export function calculateMES(mes: SubjectRecord["scales"]["mes"], educationYears?: number) {
  const total =
    (mes?.q1ImmediateSentence || 0) +
    (mes?.q2KitchenFluency || 0) +
    (mes?.q3TappingContradiction || 0) +
    (mes?.q4ShortDelay || 0) +
    (mes?.q5FingerMotorPraxis || 0) +
    (mes?.q6TappingGoNoGo || 0) +
    (mes?.q7LongDelay || 0);

  let cutoff = 75;
  let eduGroup = "初中及以上";
  if (educationYears !== undefined && educationYears <= 6) {
    cutoff = 68;
    eduGroup = "文盲/小学 (≤6年)";
  }

  const isAbnormal = total < cutoff;
  return {
    score: total,
    total,
    cutoff,
    eduGroup,
    isAbnormal,
  };
}

// 10. FAQ (Functional Activities Questionnaire)
export function calculateFAQ(items: Record<number, number>) {
  let sum = 0;
  let validCount = 0;

  Object.values(items || {}).forEach((val) => {
    if (val !== -1 && val >= 0) {
      sum += val;
      validCount += 1;
    }
  });

  const isAbnormal = sum >= 5;
  const isMciPositive = sum >= 9;
  const isScdRange = sum >= 0 && sum <= 4;

  return {
    sum,
    score: sum,
    validCount,
    isAbnormal,
    isMciPositive,
    isScdRange,
  };
}

// 11. NPI (Neuropsychiatric Inventory)
export function calculateNPI(items: SubjectRecord["scales"]["npi"]["items"]) {
  let totalScore = 0;
  let totalDistress = 0;
  let symptomCount = 0;

  Object.values(items || {}).forEach((item) => {
    if (item?.has) {
      symptomCount += 1;
      const freq = item.frequency || 1;
      const sev = item.severity || 1;
      totalScore += freq * sev;
      totalDistress += item.distress || 0;
    }
  });

  return {
    totalScore,
    distressScore: totalDistress,
    totalDistress,
    symptomCount,
  };
}

// 12. Ecog (Everyday Cognition)
export function calculateEcog(items: Record<number, number>) {
  let sum = 0;
  let count = 0;

  Object.values(items || {}).forEach((v) => {
    if (v >= 1 && v <= 4) {
      sum += v;
      count += 1;
    }
  });

  const meanScore = count > 0 ? Math.round((sum / count) * 100) / 100 : 1.0;
  const isMciCutoff = meanScore >= 1.54;
  const isDementiaCutoff = meanScore >= 2.83;

  let interpretation = "无主观认知下降";
  if (meanScore >= 1.8) {
    interpretation = "中重度认知主诉";
  } else if (meanScore >= 1.3) {
    interpretation = "轻度认知下降主诉";
  }

  return {
    sum,
    count,
    meanScore,
    avgScore: meanScore,
    interpretation,
    isMciCutoff,
    isDementiaCutoff,
  };
}

// 13. PSQI (Pittsburgh Sleep Quality Index)
export function calculatePSQI(psqi: SubjectRecord["scales"]["psqi"]) {
  const compA = psqi?.selfQuality || 0;

  let latencyScore = 0;
  const latMin = psqi?.sleepLatencyMinutes || 0;
  if (latMin <= 15) latencyScore = 0;
  else if (latMin <= 30) latencyScore = 1;
  else if (latMin <= 60) latencyScore = 2;
  else latencyScore = 3;

  const latFreq = psqi?.troubles?.["a"] || 0;
  const compB = Math.min(3, Math.floor((latencyScore + latFreq) / 2));

  let compC = 0;
  const hours = psqi?.actualSleepHours || 7;
  if (hours > 7) compC = 0;
  else if (hours >= 6) compC = 1;
  else if (hours >= 5) compC = 2;
  else compC = 3;

  let compD = 0;
  let efficiency = 85;
  if (psqi?.bedTime && psqi?.wakeTime) {
    const [bH, bM] = psqi.bedTime.split(":").map(Number);
    const [wH, wM] = psqi.wakeTime.split(":").map(Number);
    let bedMins = (wH * 60 + wM) - (bH * 60 + bM);
    if (bedMins <= 0) bedMins += 24 * 60;
    const bedHours = bedMins / 60;
    if (bedHours > 0) {
      efficiency = Math.round(((psqi.actualSleepHours || 0) / bedHours) * 100);
      if (efficiency > 85) compD = 0;
      else if (efficiency >= 75) compD = 1;
      else if (efficiency >= 65) compD = 2;
      else compD = 3;
    }
  }

  let troubleSum = 0;
  ["b", "c", "d", "e", "f", "g", "h", "i", "j"].forEach((k) => {
    troubleSum += psqi?.troubles?.[k] || 0;
  });
  let compE = 0;
  if (troubleSum === 0) compE = 0;
  else if (troubleSum <= 9) compE = 1;
  else if (troubleSum <= 18) compE = 2;
  else compE = 3;

  const compF = psqi?.medication || 0;
  const compG = psqi?.daytimeDysfunction || 0;

  const totalScore = compA + compB + compC + compD + compE + compF + compG;
  let qualityText = "良好 (0-7分)";
  if (totalScore >= 16) qualityText = "很差 (16-21分)";
  else if (totalScore >= 11) qualityText = "较差 (11-15分)";
  else if (totalScore >= 8) qualityText = "存在睡眠障碍 (8-10分)";

  return {
    compA,
    compB,
    compC,
    compD,
    compE,
    compF,
    compG,
    score: totalScore,
    totalScore,
    efficiency,
    qualityText,
    isAbnormal: totalScore >= 8,
  };
}

// 14. RBDSQ & ESS
export function calculateRBDSQ(items: Record<string, boolean>) {
  let score = 0;
  Object.values(items || {}).forEach((v) => {
    if (v) score += 1;
  });
  return {
    score,
    isNormalCutoff: score >= 5,
    isPDCutoff: score >= 6,
    isAbnormal: score >= 5,
  };
}

export function calculateESS(items: Record<number, number>) {
  let score = 0;
  for (let i = 1; i <= 8; i++) {
    score += items?.[i] || 0;
  }
  let level = "正常 (0-6分)";
  if (score > 16) level = "危险性日间嗜睡 (>16分)";
  else if (score > 11) level = "过度日间嗜睡 (>11分)";
  else if (score >= 10) level = "日间瞌睡倾向 (10-11分)";

  return {
    score,
    level,
    isAbnormal: score >= 10,
  };
}

// 15. MoCA-B (Montreal Cognitive Assessment Basic)
export function calculateMoCAB(
  moca: SubjectRecord["scales"]["mocaB"],
  educationYears: number
) {
  const score =
    (moca?.executiveTrail || 0) +
    (moca?.fluencyFruit || 0) +
    (moca?.orientation || 0) +
    (moca?.calculation13Yuan || 0) +
    (moca?.abstraction || 0) +
    (moca?.delayedRecall || 0) +
    (moca?.visualPerception10Obj || 0) +
    (moca?.naming4Animals || 0) +
    (moca?.attentionDigitsWhite || 0) +
    (moca?.attentionDigitsBlack || 0);

  let cutoff = 24;
  let eduGroup = "大学 (>12年)";
  if (educationYears <= 6) {
    cutoff = 19;
    eduGroup = "文盲/小学 (≤6年)";
  } else if (educationYears <= 12) {
    cutoff = 22;
    eduGroup = "中学 (7-12年)";
  }

  const isAbnormal = score <= cutoff;
  return { score, cutoff, eduGroup, isAbnormal };
}

// 16. HAMD-17 & HAMA
export function calculateHAMD17(items: Record<number, number>) {
  let total = 0;
  for (let i = 1; i <= 17; i++) {
    total += items?.[i] || 0;
  }

  let text = "正常 (<7分)";
  if (total >= 24) text = "严重抑郁 (≥24分)";
  else if (total >= 17) text = "肯定有抑郁 (17-23分)";
  else if (total >= 7) text = "可能有抑郁 (7-16分)";

  return {
    total,
    score: total,
    text,
    severity: text,
    isAbnormal: total >= 7,
  };
}

export function calculateHAMA(items: Record<number, number>) {
  let total = 0;
  for (let i = 1; i <= 14; i++) {
    total += items?.[i] || 0;
  }

  let text = "无焦虑 (<7分)";
  if (total >= 29) text = "严重焦虑 (≥29分)";
  else if (total >= 21) text = "明显焦虑 (21-28分)";
  else if (total >= 14) text = "肯定有焦虑 (14-20分)";
  else if (total >= 7) text = "可能有焦虑 (7-13分)";

  return {
    total,
    score: total,
    text,
    severity: text,
    isAbnormal: total >= 7,
  };
}

// 17. ADAS-Cog (12 subtests)
export function calculateADASCog(adas: SubjectRecord["scales"]["adasCog"]) {
  const recallAvg =
    Math.round(
      (((adas?.wordRecallErrorsTrial1 || 0) +
        (adas?.wordRecallErrorsTrial2 || 0) +
        (adas?.wordRecallErrorsTrial3 || 0)) /
        3) *
        10
    ) / 10;

  const recognitionAvg =
    Math.round(
      (((adas?.wordRecognitionErrorsTrial1 || 0) +
        (adas?.wordRecognitionErrorsTrial2 || 0) +
        (adas?.wordRecognitionErrorsTrial3 || 0)) /
        3) *
        10
    ) / 10;

  const totalScore =
    recallAvg +
    (adas?.namingErrors || 0) +
    (adas?.commandsErrors || 0) +
    (adas?.constructionalPraxisErrors || 0) +
    (adas?.ideationalPraxisErrors || 0) +
    (adas?.orientationErrors || 0) +
    recognitionAvg +
    (adas?.rememberingInstructions || 0) +
    (adas?.spokenLanguageAbility || 0) +
    (adas?.wordFindingDifficulty || 0) +
    (adas?.comprehensionDifficulty || 0) +
    (adas?.concentrationDifficulty || 0);

  const rounded = Math.round(totalScore * 10) / 10;
  let severity = "认知功能基本正常 (≤10分)";
  if (rounded >= 35) {
    severity = "重度认知功能缺损 (≥35分)";
  } else if (rounded >= 22) {
    severity = "中度认知功能缺损 (22-34分)";
  } else if (rounded >= 11) {
    severity = "轻度认知功能损害 (11-21分)";
  }

  return {
    recallAvg,
    recognitionAvg,
    totalScore: rounded,
    severity,
  };
}

// 18. Global CDR Algorithm Engine (Washington University / Xuanwu Protocol)
export function calculateGlobalCDR(cdr: SubjectRecord["scales"]["cdr"]) {
  const M = cdr?.memory ?? 0;
  const secondaries = [
    cdr?.orientation ?? 0,
    cdr?.judgment ?? 0,
    cdr?.community ?? 0,
    cdr?.homeHobbies ?? 0,
    cdr?.personalCare ?? 0,
  ];

  const sumOfBoxes = Math.round((M + secondaries.reduce((a, b) => a + b, 0)) * 10) / 10;

  const sameAsM = secondaries.filter((s) => s === M).length;
  const greaterThanM = secondaries.filter((s) => s > M).length;
  const lessThanM = secondaries.filter((s) => s < M).length;
  const zerosCount = secondaries.filter((s) => s === 0).length;
  const ge1Count = secondaries.filter((s) => s >= 1).length;
  const ge05Count = secondaries.filter((s) => s >= 0.5).length;

  let globalCDR: 0 | 0.5 | 1 | 2 | 3 = M;

  if (M === 0.5) {
    if (ge1Count >= 3) {
      globalCDR = 1;
    } else {
      globalCDR = 0.5;
    }
  } else if (M === 0) {
    if (ge05Count >= 2) {
      globalCDR = 0.5;
    } else {
      globalCDR = 0;
    }
  } else if (M >= 1) {
    if (sameAsM >= 3) {
      globalCDR = M;
    } else if (greaterThanM >= 3) {
      const freq: Record<number, number> = {};
      secondaries.forEach((s) => (freq[s] = (freq[s] || 0) + 1));
      let maxF = 0;
      let majorityScore: 0 | 0.5 | 1 | 2 | 3 = M;
      Object.entries(freq).forEach(([scoreStr, f]) => {
        const sc = parseFloat(scoreStr) as 0 | 0.5 | 1 | 2 | 3;
        if (f > maxF && sc > M) {
          maxF = f;
          majorityScore = sc;
        }
      });
      globalCDR = majorityScore;
    } else if (lessThanM >= 3) {
      if (zerosCount >= 3) {
        globalCDR = 0.5;
      } else {
        const freq: Record<number, number> = {};
        secondaries.forEach((s) => (freq[s] = (freq[s] || 0) + 1));
        let maxF = 0;
        let majorityScore: 0 | 0.5 | 1 | 2 | 3 = M;
        Object.entries(freq).forEach(([scoreStr, f]) => {
          const sc = parseFloat(scoreStr) as 0 | 0.5 | 1 | 2 | 3;
          if (f > maxF && sc < M) {
            maxF = f;
            majorityScore = sc;
          }
        });
        globalCDR = majorityScore;
      }
    } else {
      globalCDR = M;
    }
  }

  let description = "健康/正常 (CDR 0)";
  if (globalCDR === 0.5) description = "可疑痴呆 / MCI (CDR 0.5)";
  else if (globalCDR === 1) description = "轻度痴呆 (CDR 1)";
  else if (globalCDR === 2) description = "中度痴呆 (CDR 2)";
  else if (globalCDR === 3) description = "重度痴呆 (CDR 3)";

  return {
    globalCDR,
    cdrSumOfBoxes: sumOfBoxes,
    sumOfBoxes,
    description,
  };
}

export const calculateCDRWashington = calculateGlobalCDR;

// 19. SCD-Q9 calculation
export function calculateSCDQ9(scd: SubjectRecord["scdQ9"]) {
  let score = 0;
  score += scd?.q1 || 0;
  score += scd?.q2 || 0;
  score += scd?.q3 || 0;
  score += scd?.q4 || 0;
  score += scd?.q5 || 0;
  score += scd?.q6 || 0;
  score += scd?.q7 || 0;
  score += scd?.q8 || 0;
  score += scd?.q9 || 0;

  const isPositive = score >= 5;
  return { score, isPositive };
}

// 20. Comprehensive Overall Evaluation
export function evaluateCompleteAssessment(record: SubjectRecord): AssessmentSummaryResults {
  const eduYears = record.demographics?.educationYears || 0;
  const age = record.demographics?.age || 65;
  const scales = record.scales || ({} as any);

  return {
    scdQ9: calculateSCDQ9(record.scdQ9),
    handedness: calculateHandedness(scales.handedness?.tasks || {}),
    mmse: calculateMMSE(scales.mmse?.items || {}, eduYears),
    mocaB: calculateMoCAB(scales.mocaB || {}, eduYears),
    avltH: calculateAVLTH(scales.avltH || {}, age, eduYears),
    logicalMemory: calculateLogicalMemory(scales.logicalMemory || {}, eduYears),
    vft: calculateVFT(scales.vft || {}, eduYears, age),
    bnt: calculateBNT(scales.bnt || {}, eduYears, age),
    stt: calculateSTT(scales.stt || {}, eduYears, age),
    mes: calculateMES(scales.mes || {}, eduYears),
    faq: calculateFAQ(scales.faq?.items || {}),
    ecog: calculateEcog(scales.ecog?.items || {}),
    gds15: calculateGDS15(scales.gds15?.answers || {}),
    hamd17: calculateHAMD17(scales.hamd17?.items || {}),
    hama: calculateHAMA(scales.hama?.items || {}),
    psqi: calculatePSQI(scales.psqi || {}),
    rbdsq: calculateRBDSQ(scales.rbdsq?.items || {}),
    ess: calculateESS(scales.ess?.items || {}),
    npi: calculateNPI(scales.npi?.items || {}),
  };
}
