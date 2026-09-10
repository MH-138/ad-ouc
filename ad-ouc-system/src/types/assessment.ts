export interface SubjectRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  protocolNo: string; // e.g. "IC4-05023-096-CHN"
  centerNo: string; // e.g. "01"
  visitCode: string; // e.g. "W000 (入选)"
  subjectNo: string; // e.g. "SCD-2026-001"
  evaluator: string; // 研究者姓名 (如 韩璎)
  evalDate: string; // 评估日期 YYYY-MM-DD

  // Section A: Demographics
  demographics: {
    name: string;
    idCard: string;
    address: string;
    gender: 1 | 2 | 0; // 1=男, 2=女
    age: number;
    birthDate: string;
    height: number;
    weight: number;
    educationYears: number;
    occupation: 1 | 2 | 3 | 4 | 5; // 1.干部 2.工人 3.农民 4.个体商业 5.其他
    occupationOther?: string;
    workNature: 1 | 2 | 3 | 4; // 1.脑力 2.体力 3.脑力+体力 4.其他
    maritalStatus: 1 | 2 | 3 | 4 | 5; // 1.已婚 2.未婚 3.离异 4.丧偶 5.再婚
    socialSupport: {
      livingAlone: 1 | 2; // 1.一个人 2.和家人
      coResidents: number[]; // 1.配偶 2.子女 3.孙子女 4.父母 5.其他 6.NA
      hasSiblings: 1 | 2; // 1.无 2.有
      closeFriends: 1 | 2 | 3 | 4; // 1.0个 2.1-2个 3.3-5个 4.6个以上
      neighborRelation: 1 | 2 | 3 | 4; // 1.从不关心 2.稍关心 3.很关心 4.大多数很关心
    };
    phone1: string;
    phone2: string;
    wechat: string;
    caseSource: 1 | 2; // 1.社区 2.医院
  };

  // Section B: Past History
  history: {
    cerebrovascular: {
      has: boolean;
      years?: number;
      type?: 1 | 2 | 3 | 4 | 5; // 1.多发梗死 2.关键部位 3.腔梗/白质 4.脑出血 5.其他
      regularMed?: boolean;
      stable?: boolean;
      acuteCognitiveImpairment?: boolean;
    };
    hypertension: {
      has: boolean;
      years?: number;
      maxBp?: string; // e.g. "160/100"
      regularMed?: boolean;
      usualBp?: string;
      stable?: boolean;
    };
    diabetes: {
      has: boolean;
      years?: number;
      regularMed?: boolean;
      stable?: boolean;
    };
    coronaryHeartDisease: {
      has: boolean;
      years?: number;
      regularMed?: boolean;
      stable?: boolean;
      heartFailure?: boolean;
    };
    hyperlipidemia: {
      has: boolean;
      years?: number;
      regularMed?: boolean;
      stable?: boolean;
    };
    anemia: {
      has: boolean;
      years?: number;
      regularMed?: boolean;
      stable?: boolean;
    };
    coPoisoning: {
      has: boolean;
      years?: number;
      acuteCognitiveImpairment?: boolean;
      aggravatedCognition?: boolean;
    };
    generalAnesthesia: {
      has: boolean;
      years?: number;
      acuteCognitiveImpairment?: boolean;
      aggravatedCognition?: boolean;
    };
    thyroidAbnormality: {
      has: boolean;
      years?: number;
      regularMed?: boolean;
      acuteCognitiveImpairment?: boolean;
      aggravatedCognition?: boolean;
    };
    tbi: {
      has: boolean;
      years?: number;
      acuteCognitiveImpairment?: boolean;
      aggravatedCognition?: boolean;
    };
    familyHistoryDementia: {
      has: boolean;
      firstDegreeCount?: number;
      secondDegreeCount?: number;
    };
    mriContraindications: boolean; // 支架/假牙等
    otherConditions?: string;
  };

  // Section C: Personal History
  personalHistory: {
    smoking: {
      has: boolean;
      years?: number;
      cigarettesPerDay?: number;
      quit?: boolean;
      quitYears?: number;
    };
    drinking: {
      has: boolean;
      redWineDailyLiang?: number;
      whiteWineDailyLiang?: number;
      beerDailyBottles?: number;
      years?: number;
      quit?: boolean;
      quitYears?: number;
    };
    dietHabits: {
      preference: 1 | 2 | 3; // 1.素食 2.肉食 3.普通
      drinkAlcoholFreq: 1 | 2 | 3 | 4 | 5; // 1.每天 2.每周多次 3.每周一次 4.很少 5.从不
      drinkTeaFreq: 1 | 2 | 3 | 4 | 5;
      drinkCoffeeFreq: 1 | 2 | 3 | 4 | 5;
      eatFishFreq: 1 | 2 | 3 | 4 | 5;
    };
  };

  // Section D: SCD-Q9 (Subjective Cognitive Decline 9 items)
  scdQ9: {
    q1: 0 | 1; // 记忆问题
    q2: 0 | 1; // 3-5天前对话
    q3: 0 | 1; // 近两年记忆问题
    q4: 0 | 0.5 | 1; // 重要日期 (0从未, 0.5偶尔, 1经常)
    q5: 0 | 0.5 | 1; // 常用号码
    q6: 0 | 1; // 做事说话易忘
    q7: 0 | 0.5 | 1; // 商店买东西忘
    q8: 0 | 1; // 比5年前差
    q9: 0 | 1; // 东西放哪记不住
  };

  // Section E: SCD Structured Interview
  scdInterview: {
    selfAreas: {
      memory: boolean;
      language: boolean;
      organization: boolean;
      attention: boolean;
      other: boolean;
      otherDesc?: string;
    };
    detailedQuestions: {
      // 1: 记性变差
      q1: {
        has: boolean;
        worry?: 0 | 1;
        onset?: 1 | 2 | 3 | 4 | 5; // 1: <6m, 2: 6m-2y, 3: 2-5y, 4: >5y, 5: 不清
        worseThanPeers?: 0 | 1;
        consultedDoctor?: 0 | 1;
        firstConsultMonthsAgo?: number;
      };
      // 2: 找词困难
      q2: {
        has: boolean;
        worry?: 0 | 1;
        onset?: 1 | 2 | 3 | 4 | 5;
        worseThanPeers?: 0 | 1;
        consultedDoctor?: 0 | 1;
        firstConsultMonthsAgo?: number;
      };
      // 3: 计划/安排困难
      q3: {
        has: boolean;
        worry?: 0 | 1;
        onset?: 1 | 2 | 3 | 4 | 5;
        worseThanPeers?: 0 | 1;
        consultedDoctor?: 0 | 1;
        firstConsultMonthsAgo?: number;
      };
      // 4: 不专心易犯错
      q4: {
        has: boolean;
        worry?: 0 | 1;
        onset?: 1 | 2 | 3 | 4 | 5;
        worseThanPeers?: 0 | 1;
        consultedDoctor?: 0 | 1;
        firstConsultMonthsAgo?: number;
      };
      // 5: 其他认知问题
      q5: {
        has: boolean;
        desc?: string;
        worry?: 0 | 1;
        onset?: 1 | 2 | 3 | 4 | 5;
        worseThanPeers?: 0 | 1;
        consultedDoctor?: 0 | 1;
        firstConsultMonthsAgo?: number;
      };
    };
    informant: {
      hasInformant: boolean;
      relation?: 1 | 2 | 3 | 4 | 5; // 1配偶 2孩子 3兄弟姐妹 4朋友 5其他
      relationOther?: string;
      q1Memory: { has: boolean; onset?: number };
      q2WordFinding: { has: boolean; onset?: number };
      q3Planning: { has: boolean; onset?: number };
      q4Attention: { has: boolean; onset?: number };
      q5Other: { has: boolean; onset?: number; desc?: string };
      q6Personality: { has: boolean; onset?: number };
    };
    additional: {
      otherKnownCause: boolean;
      hasFluctuation: boolean;
      onsetForm: 1 | 2 | 3; // 1突然 2不知道 3慢性
      progression: 1 | 2 | 3 | 4; // 1迅速 2不知道 3缓慢 4阶梯式
    };
  };

  // Section F & G: History & Labs
  presentIllness: {
    chiefComplaint: string;
    cognitiveDeficitDesc: string;
    bpsdDesc: string;
  };
  labTests: {
    syphilis: 1 | 2 | 3; // 1.阳性 2.阴性 3.未查
    homocysteine: 1 | 2 | 3;
    folateDeficiency: 1 | 2 | 3;
    vitB12Low: 1 | 2 | 3;
    thyroidAbnormal: 1 | 2 | 3;
    hemoglobinLow: 1 | 2 | 3;
  };

  // Scales Battery
  scales: {
    // H1: Edinburgh Handedness
    handedness: {
      tasks: Record<string, { left: 0 | 1 | 2; right: 0 | 1 | 2 }>;
      calculatedScore?: number;
      result?: "左利手" | "双利手" | "右利手";
    };

    // H2: MMSE (30 items)
    mmse: {
      items: Record<string, number>; // 0 or 1 for items 2.1 - 2.30
      drawingImage?: string; // canvas drawings
    };

    // H3: AVLT-H (Auditory Verbal Learning)
    avltH: {
      n1Words: string[];
      n2Words: string[];
      n3Words: string[];
      n4Delayed5MinWords: string[];
      n5Delayed20MinWords: string[];
      n6CategoryCued: {
        flowers: string[];
        occupations: string[];
        clothing: string[];
      };
      n7RecognitionErrors: number; // 24 items
    };

    // H4: Verbal Fluency Test (VFT)
    vft: {
      category: "animal" | "fruit";
      t1_15s: number;
      t16_30s: number;
      t31_45s: number;
      t46_60s: number;
      wordsList?: string;
    };

    // H5: Boston Naming Test (BNT 30)
    bnt: {
      items: Record<
        number,
        {
          spontaneous: boolean; // 自发命名正确 (1分)
          cued?: boolean; // 语义提示后正确
          recognized?: boolean; // 选择提示正确
          userResponse?: string;
        }
      >;
    };

    // H6: Shape Trailing Test (STT-A & STT-B)
    stt: {
      sttAPracticeSeconds: number;
      sttATestSeconds: number;
      sttBPracticeSeconds: number;
      sttBTestSeconds: number;
      sttAPrompts?: number;
      sttBPrompts?: number;
    };

    // Logical Memory Story Recall (深圳市民王建国故事)
    logicalMemory: {
      immediateStoryUnits: number; // 0-25
      immediateThemeUnits: number;
      delayed30MinStoryUnits: number; // 0-25
      delayed30MinThemeUnits: number;
    };

    // H7: GDS-15 Geriatric Depression Scale
    gds15: {
      answers: Record<number, boolean>; // 1-15: true/false
    };

    // H8: MES Memory and Executive Scale (100 points)
    mes: {
      q1ImmediateSentence: number; // 0-10
      q2KitchenFluency: number; // 0-10
      q3TappingContradiction: number; // 0-10
      q4ShortDelay: number; // 0-10
      q5FingerMotorPraxis: number; // 0-20 (5 gestures, right/left)
      q6TappingGoNoGo: number; // 0-10
      q7LongDelay: number; // 0-10
    };

    // H9: FAQ Functional Activities Questionnaire
    faq: {
      informantPresent: boolean;
      informantRelation?: string;
      items: Record<number, number>; // 1-10: 0,1,2,3 or -1 for NA
    };

    // H10: NPI Neuropsychiatric Inventory (12 items)
    npi: {
      informantRelation?: string;
      items: Record<
        number,
        {
          has: boolean;
          frequency?: number; // 1-4
          severity?: number; // 1-3
          distress?: number; // 0-5
        }
      >;
    };

    // H11: Everyday Cognition (Ecog - 12 items)
    ecog: {
      items: Record<number, number>; // 1-12: 1, 2, 3, 4, or -1 (NA)
    };

    // H12: PSQI Pittsburgh Sleep Quality Index
    psqi: {
      bedTime: string; // e.g. "23:00"
      sleepLatencyMinutes: number;
      wakeTime: string; // e.g. "07:00"
      actualSleepHours: number;
      troubles: Record<string, number>; // a ~ j (0-3)
      selfQuality: number; // 0-3
      medication: number; // 0-3
      daytimeDysfunction: number; // 0-3
      sleepEfficiencyRatio?: number;
    };

    // H13: RBDSQ (REM Sleep Behavior Disorder Questionnaire)
    rbdsq: {
      items: Record<string, boolean>; // 13 items
    };

    // H14: ESS Epworth Sleepiness Scale
    ess: {
      items: Record<number, number>; // 1-8: 0-3
    };

    // H15: MoCA-B (30 points)
    mocaB: {
      executiveTrail: number; // 0 or 1
      immediateRecall: number; // 0-5 (unscored in total)
      fluencyFruit: number; // 0, 1, 2
      orientation: number; // 0-6
      calculation13Yuan: number; // 0-3
      abstraction: number; // 0-3
      delayedRecall: number; // 0-5
      visualPerception10Obj: number; // 0-3
      naming4Animals: number; // 0-4
      attentionDigitsWhite: number; // 0-1
      attentionDigitsBlack: number; // 0-2
    };

    // H16: Vignettes
    vignettes: {
      cognitive1ZhangLiang: number; // 1-5
      cognitive3LiuJun: number; // 1-5
      cognitive4LiWei: number; // 1-5
      mood1TangJing: number; // 1-5
      mood2LiFeng: number; // 1-5
      mood3ZhengBo: number; // 1-5
    };

    // HAMD-17 & HAMA
    hamd17: {
      items: Record<number, number>; // 1-17: 0-4 or 0-2
    };
    hama: {
      items: Record<number, number>; // 1-14: 0-4
    };

    // ADAS-Cog (12 items)
    adasCog: {
      wordRecallErrorsTrial1: number;
      wordRecallErrorsTrial2: number;
      wordRecallErrorsTrial3: number;
      namingErrors: number; // 0-5
      commandsErrors: number; // 0-5
      constructionalPraxisErrors: number; // 0-5
      ideationalPraxisErrors: number; // 0-5
      orientationErrors: number; // 0-8
      wordRecognitionErrorsTrial1: number;
      wordRecognitionErrorsTrial2: number;
      wordRecognitionErrorsTrial3: number;
      rememberingInstructions: number; // 0-5
      spokenLanguageAbility: number; // 0-5
      wordFindingDifficulty: number; // 0-5
      comprehensionDifficulty: number; // 0-5
      concentrationDifficulty: number; // 0-5
    };

    // CDR Clinical Dementia Rating
    cdr: {
      memory: 0 | 0.5 | 1 | 2 | 3;
      orientation: 0 | 0.5 | 1 | 2 | 3;
      judgment: 0 | 0.5 | 1 | 2 | 3;
      community: 0 | 0.5 | 1 | 2 | 3;
      homeHobbies: 0 | 0.5 | 1 | 2 | 3;
      personalCare: 0 | 0.5 | 1 | 2 | 3;
    };
  };

  // Section I: Biomarkers
  biomarkers: {
    mriPerformed: boolean;
    hippocampalAtrophy?: boolean;
    hippocampalSeverity?: 1 | 2 | 3; // 1轻 2中 3重
    hippocampalLaterality?: 1 | 2 | 3; // 1左 2右 3大致相同
    frontotemporalAtrophy?: boolean;
    frontotemporalAsymmetry?: boolean;
    frontotemporalSteplike?: boolean;
    otherAtrophySites?: string;

    abetaPet: 1 | 2 | 3; // 1是-异常 2是-正常 3否
    tauPet: 1 | 2 | 3;
    csfAbetaTau: boolean;
    urineAdTest: boolean;
    apoe4Genotype: {
      tested: boolean;
      value?: string; // e.g. "ε3/ε4" or "ε4/ε4"
    };
    plasmaAdBiomarkers: {
      tested: boolean;
      pTau217Value?: string;
      ratio?: string;
    };
  };

  // Section J: Diagnosis
  diagnosis: {
    category: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9; // 1: SCD, 2: aMCI, 3: AD, 4: NC, 5: svMCI, 6: FTD, 7: Depression, 8: FAD, 9: DLB
    notes?: string;
  };

  // Section K: Follow-up & Sign
  followUp: {
    nextVisitDate: string;
    evaluatorSignature: string;
  };
}

export type CognitiveDomain =
  | "memory"
  | "executive"
  | "language"
  | "visuospatial"
  | "dailyLiving"
  | "moodSleep";

export interface AssessmentSummaryResults {
  scdQ9: { score: number; isPositive: boolean };
  handedness: { score: number; result: "左利手" | "双利手" | "右利手" | "未评定"; leftSum?: number; rightSum?: number };
  mmse: { score: number; cutoff: number; eduGroup: string; isAbnormal: boolean };
  mocaB: { score: number; cutoff: number; eduGroup: string; isAbnormal: boolean };
  avltH: {
    n1Score: number;
    n2Score: number;
    n3Score: number;
    immediateAvg: number;
    n4ShortDelay: number;
    n5LongDelay: number;
    n5Score: number;
    n6CuedCount: number;
    n7Recognition: number;
    delayCutoff: number;
    n5Cutoff: number;
    recognitionCutoff: number;
    ageGroup: string;
    isDelayAbnormal: boolean;
    isN5Abnormal: boolean;
    isRecognitionAbnormal: boolean;
  };
  logicalMemory: {
    immediate: number;
    delayed: number;
    delayedStoryUnits: number;
    cutoff: number;
    delayedCutoff: number;
    eduGroup: string;
    isAbnormal: boolean;
    isDelayedAbnormal: boolean;
  };
  vft: {
    total: number;
    totalScore: number;
    cutoff: number;
    eduGroup: string;
    group: string;
    isAbnormal: boolean;
  };
  bnt: {
    spontaneousScore: number;
    cuedScore: number;
    recognizedScore: number;
    totalCorrect: number;
    totalScore: number;
    cutoff: number;
    eduGroup: string;
    group: string;
    isAbnormal: boolean;
  };
  stt: {
    sttATotal: number;
    sttBTotal: number;
    sttACutoff: number;
    sttBCutoff: number;
    aCutoff: number;
    bCutoff: number;
    ageGroup: string;
    group: string;
    isSTTAAbnormal: boolean;
    isSTTBAbnormal: boolean;
    isAAbnormal: boolean;
    isBAbnormal: boolean;
  };
  mes: {
    score: number;
    total: number;
    cutoff: number;
    eduGroup: string;
    isAbnormal: boolean;
  };
  faq: {
    sum: number;
    score: number;
    validCount: number;
    isAbnormal: boolean;
    isMciPositive: boolean;
    isScdRange: boolean;
  };
  ecog: {
    sum: number;
    count: number;
    meanScore: number;
    avgScore: number;
    interpretation: string;
    isMciCutoff: boolean;
    isDementiaCutoff: boolean;
  };
  gds15: {
    score: number;
    grade: string;
    level: "normal" | "mild" | "moderate" | "severe";
    isDepressed: boolean;
    isAbnormal: boolean;
  };
  hamd17: {
    total: number;
    score: number;
    text: string;
    severity: string;
    isAbnormal: boolean;
  };
  hama: {
    total: number;
    score: number;
    text: string;
    severity: string;
    isAbnormal: boolean;
  };
  psqi: {
    compA: number;
    compB: number;
    compC: number;
    compD: number;
    compE: number;
    compF: number;
    compG: number;
    score: number;
    totalScore: number;
    efficiency: number;
    qualityText: string;
    isAbnormal: boolean;
  };
  rbdsq: {
    score: number;
    isNormalCutoff: boolean;
    isPDCutoff: boolean;
    isAbnormal: boolean;
  };
  ess: {
    score: number;
    level: string;
    isAbnormal: boolean;
  };
  npi: {
    totalScore: number;
    distressScore: number;
    totalDistress: number;
    symptomCount: number;
  };
}

