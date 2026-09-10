import React from "react";
import { SubjectRecord } from "../../types/assessment";
import { User, Activity, FileText, FlaskConical, Heart, ShieldAlert, Coffee } from "lucide-react";

interface Props {
  record: SubjectRecord;
  onChange: (updated: Partial<SubjectRecord>) => void;
}

export const SectionDemographicsHistory: React.FC<Props> = ({ record, onChange }) => {
  const updateDemographics = (fields: Partial<SubjectRecord["demographics"]>) => {
    onChange({
      demographics: { ...record.demographics, ...fields },
    });
  };

  const updateSocialSupport = (fields: Partial<SubjectRecord["demographics"]["socialSupport"]>) => {
    onChange({
      demographics: {
        ...record.demographics,
        socialSupport: { ...record.demographics.socialSupport, ...fields },
      },
    });
  };

  const updateHistory = (fields: Partial<SubjectRecord["history"]>) => {
    onChange({
      history: { ...record.history, ...fields },
    });
  };

  const updatePersonalHistory = (fields: Partial<SubjectRecord["personalHistory"]>) => {
    onChange({
      personalHistory: { ...record.personalHistory, ...fields },
    });
  };

  const updatePresentIllness = (fields: Partial<SubjectRecord["presentIllness"]>) => {
    onChange({
      presentIllness: { ...record.presentIllness, ...fields },
    });
  };

  const updateLabs = (fields: Partial<SubjectRecord["labTests"]>) => {
    onChange({
      labTests: { ...record.labTests, ...fields },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-teal-700 font-bold">
            首都医科大学宣武医院 AD 临床前期 SCD 人群筛查规范 (基线期)
          </div>
          <h2 className="text-lg font-bold mt-1 text-slate-900">
            A ~ G: 基本人口学资料、既往史与现病史档案
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-mono">
          <span className="px-3 py-1 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
            方案: {record.protocolNo}
          </span>
          <span className="px-3 py-1 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
            中心: {record.centerNo}
          </span>
          <span className="px-3 py-1 bg-teal-50 rounded-lg border border-teal-200 text-teal-800 font-bold">
            访视: {record.visitCode}
          </span>
        </div>
      </div>

      {/* Part A: 一般资料 (Demographics) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center space-x-2.5 pb-4 mb-6 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            A
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-800">A. 受试者一般资料与人口学参数</h3>
            <p className="text-xs text-slate-500">受教育年限将直接关联 MMSE、MoCA-B、AVLT、逻辑记忆等量表异常常模截断值</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">受试者姓名 *</label>
            <input
              type="text"
              value={record.demographics.name}
              onChange={(e) => updateDemographics({ name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="如：张三"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">身份证号码</label>
            <input
              type="text"
              value={record.demographics.idCard}
              onChange={(e) => updateDemographics({ idCard: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
              placeholder="18位身份证号"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">受试者编号 (ID)</label>
            <input
              type="text"
              value={record.subjectNo}
              onChange={(e) => onChange({ subjectNo: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
              placeholder="如：01-0023"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">病例来源</label>
            <select
              value={record.demographics.caseSource}
              onChange={(e) => updateDemographics({ caseSource: Number(e.target.value) as 1 | 2 })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value={1}>1. 社区招募筛查</option>
              <option value={2}>2. 医院记忆门诊就诊</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">性别</label>
            <select
              value={record.demographics.gender}
              onChange={(e) => updateDemographics({ gender: Number(e.target.value) as 1 | 2 })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value={1}>1. 男</option>
              <option value={2}>2. 女</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">年龄 (周岁) *</label>
            <input
              type="number"
              value={record.demographics.age}
              onChange={(e) => updateDemographics({ age: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono font-bold text-teal-700"
              min={18}
              max={110}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">受教育年限 (年) *</label>
            <input
              type="number"
              value={record.demographics.educationYears}
              onChange={(e) => updateDemographics({ educationYears: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono font-bold text-teal-700"
              placeholder="0=文盲, 6=小学, 12=高中, 16=本科"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">出生日期</label>
            <input
              type="date"
              value={record.demographics.birthDate}
              onChange={(e) => updateDemographics({ birthDate: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">身高 (cm)</label>
            <input
              type="number"
              value={record.demographics.height || ""}
              onChange={(e) => updateDemographics({ height: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="cm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">体重 (kg)</label>
            <input
              type="number"
              value={record.demographics.weight || ""}
              onChange={(e) => updateDemographics({ weight: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="kg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">职业类型</label>
            <select
              value={record.demographics.occupation}
              onChange={(e) => updateDemographics({ occupation: Number(e.target.value) as any })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value={1}>1. 干部 / 专业技术人员</option>
              <option value={2}>2. 工人</option>
              <option value={3}>3. 农民</option>
              <option value={4}>4. 个体商业人员</option>
              <option value={5}>5. 其他</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">工作性质</label>
            <select
              value={record.demographics.workNature}
              onChange={(e) => updateDemographics({ workNature: Number(e.target.value) as any })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value={1}>1. 脑力劳动者</option>
              <option value={2}>2. 体力劳动者</option>
              <option value={3}>3. 脑力 + 体力</option>
              <option value={4}>4. 其他</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">婚姻状况</label>
            <select
              value={record.demographics.maritalStatus}
              onChange={(e) => updateDemographics({ maritalStatus: Number(e.target.value) as any })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value={1}>1. 已婚 (配偶健在)</option>
              <option value={2}>2. 未婚</option>
              <option value={3}>3. 离异</option>
              <option value={4}>4. 丧偶</option>
              <option value={5}>5. 再婚</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">联系电话 1</label>
            <input
              type="text"
              value={record.demographics.phone1}
              onChange={(e) => updateDemographics({ phone1: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
              placeholder="手机号码"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">微信号 / 备用电话</label>
            <input
              type="text"
              value={record.demographics.wechat || record.demographics.phone2}
              onChange={(e) => updateDemographics({ wechat: e.target.value, phone2: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              placeholder="微信号或家属电话"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">常住家庭地址</label>
            <input
              type="text"
              value={record.demographics.address}
              onChange={(e) => updateDemographics({ address: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              placeholder="省、市、区（县）、街道门牌号"
            />
          </div>
        </div>

        {/* Social support */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            A9 社会支持系统评估
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-600 mb-1">近一年居住方式</label>
              <select
                value={record.demographics.socialSupport.livingAlone}
                onChange={(e) => updateSocialSupport({ livingAlone: Number(e.target.value) as 1 | 2 })}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              >
                <option value={1}>① 一个人住</option>
                <option value={2}>② 和家人一起住</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-600 mb-1">密切支持的朋友数量</label>
              <select
                value={record.demographics.socialSupport.closeFriends}
                onChange={(e) => updateSocialSupport({ closeFriends: Number(e.target.value) as any })}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              >
                <option value={1}>① 一个也没有</option>
                <option value={2}>② 1 - 2 个</option>
                <option value={3}>③ 3 - 5 个</option>
                <option value={4}>④ 6 个或以上</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-600 mb-1">邻里关系支持度</label>
              <select
                value={record.demographics.socialSupport.neighborRelation}
                onChange={(e) => updateSocialSupport({ neighborRelation: Number(e.target.value) as any })}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              >
                <option value={1}>① 相互从不关心，点头之交</option>
                <option value={2}>② 遇到困难可能稍微关心</option>
                <option value={3}>③ 有些邻居很关心</option>
                <option value={4}>④ 大多数邻居都很关心</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Part B: 既往史 (Medical History) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center space-x-2.5 pb-4 mb-6 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            B
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-800">B. 既往病史与危险因素采集</h3>
            <p className="text-xs text-slate-500">排查脑血管病、脑外伤、家族史以及 MRI 禁忌症</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Cerebrovascular */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-800">B1. 脑血管病史</span>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={record.history.cerebrovascular.has}
                  onChange={(e) =>
                    updateHistory({
                      cerebrovascular: { ...record.history.cerebrovascular, has: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>
            {record.history.cerebrovascular.has && (
              <div className="space-y-2 text-xs pt-2 border-t border-slate-200">
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={record.history.cerebrovascular.years || ""}
                    onChange={(e) =>
                      updateHistory({
                        cerebrovascular: { ...record.history.cerebrovascular, years: Number(e.target.value) },
                      })
                    }
                    placeholder="患病年数"
                    className="w-24 p-1.5 border border-slate-300 rounded bg-white"
                  />
                  <select
                    value={record.history.cerebrovascular.type || 1}
                    onChange={(e) =>
                      updateHistory({
                        cerebrovascular: {
                          ...record.history.cerebrovascular,
                          type: Number(e.target.value) as any,
                        },
                      })
                    }
                    className="flex-1 p-1.5 border border-slate-300 rounded bg-white text-xs"
                  >
                    <option value={1}>1. 多发脑梗死</option>
                    <option value={2}>2. 关键部位梗死</option>
                    <option value={3}>3. 腔梗/白质变性</option>
                    <option value={4}>4. 脑出血</option>
                    <option value={5}>5. 其他</option>
                  </select>
                </div>
                <div className="flex items-center space-x-4 text-slate-700">
                  <label className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={record.history.cerebrovascular.regularMed}
                      onChange={(e) =>
                        updateHistory({
                          cerebrovascular: {
                            ...record.history.cerebrovascular,
                            regularMed: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>规律服药</span>
                  </label>
                  <label className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={record.history.cerebrovascular.acuteCognitiveImpairment}
                      onChange={(e) =>
                        updateHistory({
                          cerebrovascular: {
                            ...record.history.cerebrovascular,
                            acuteCognitiveImpairment: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>致急性认知损害</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Hypertension */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-800">B2. 高血压病史</span>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={record.history.hypertension.has}
                  onChange={(e) =>
                    updateHistory({
                      hypertension: { ...record.history.hypertension, has: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>
            {record.history.hypertension.has && (
              <div className="space-y-2 text-xs pt-2 border-t border-slate-200">
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={record.history.hypertension.years || ""}
                    onChange={(e) =>
                      updateHistory({
                        hypertension: { ...record.history.hypertension, years: Number(e.target.value) },
                      })
                    }
                    placeholder="病程 (年)"
                    className="w-24 p-1.5 border border-slate-300 rounded bg-white"
                  />
                  <input
                    type="text"
                    value={record.history.hypertension.maxBp || ""}
                    onChange={(e) =>
                      updateHistory({
                        hypertension: { ...record.history.hypertension, maxBp: e.target.value },
                      })
                    }
                    placeholder="最高血压(如160/100)"
                    className="flex-1 p-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>
                <div className="flex items-center space-x-4 text-slate-700">
                  <label className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={record.history.hypertension.regularMed}
                      onChange={(e) =>
                        updateHistory({
                          hypertension: { ...record.history.hypertension, regularMed: e.target.checked },
                        })
                      }
                    />
                    <span>规律服药</span>
                  </label>
                  <label className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={record.history.hypertension.stable}
                      onChange={(e) =>
                        updateHistory({
                          hypertension: { ...record.history.hypertension, stable: e.target.checked },
                        })
                      }
                    />
                    <span>血压稳定</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Diabetes */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-800">B3. 糖尿病病史</span>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={record.history.diabetes.has}
                  onChange={(e) =>
                    updateHistory({
                      diabetes: { ...record.history.diabetes, has: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>
            {record.history.diabetes.has && (
              <div className="space-y-2 text-xs pt-2 border-t border-slate-200">
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={record.history.diabetes.years || ""}
                    onChange={(e) =>
                      updateHistory({
                        diabetes: { ...record.history.diabetes, years: Number(e.target.value) },
                      })
                    }
                    placeholder="病程 (年)"
                    className="w-24 p-1.5 border border-slate-300 rounded bg-white"
                  />
                  <label className="flex items-center space-x-1 text-slate-700">
                    <input
                      type="checkbox"
                      checked={record.history.diabetes.regularMed}
                      onChange={(e) =>
                        updateHistory({
                          diabetes: { ...record.history.diabetes, regularMed: e.target.checked },
                        })
                      }
                    />
                    <span>规律用药/胰岛素</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Family History of Dementia */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-800">B11. 痴呆家族史</span>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={record.history.familyHistoryDementia.has}
                  onChange={(e) =>
                    updateHistory({
                      familyHistoryDementia: {
                        ...record.history.familyHistoryDementia,
                        has: e.target.checked,
                      },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>
            {record.history.familyHistoryDementia.has && (
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200">
                <div>
                  <label className="text-slate-600">一级亲属患病人数</label>
                  <input
                    type="number"
                    value={record.history.familyHistoryDementia.firstDegreeCount || 0}
                    onChange={(e) =>
                      updateHistory({
                        familyHistoryDementia: {
                          ...record.history.familyHistoryDementia,
                          firstDegreeCount: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full p-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-600">二级亲属患病人数</label>
                  <input
                    type="number"
                    value={record.history.familyHistoryDementia.secondDegreeCount || 0}
                    onChange={(e) =>
                      updateHistory({
                        familyHistoryDementia: {
                          ...record.history.familyHistoryDementia,
                          secondDegreeCount: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full p-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* MRI Contraindications */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-slate-800">B12. MRI 禁忌症</span>
                <p className="text-[11px] text-slate-500">支架/起搏器/金属假牙等</p>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={record.history.mriContraindications}
                  onChange={(e) => updateHistory({ mriContraindications: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
            {record.history.mriContraindications && (
              <p className="text-xs text-red-600 font-medium">⚠️ 存在金属植入物，不可进行 3.0T MRI 序列扫描</p>
            )}
          </div>

          {/* Others: TBI, Anesthesia, Thyroid */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
            <span className="font-bold text-sm text-slate-800">其他专科病史</span>
            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={record.history.generalAnesthesia.has}
                  onChange={(e) =>
                    updateHistory({
                      generalAnesthesia: { ...record.history.generalAnesthesia, has: e.target.checked },
                    })
                  }
                />
                <span>全麻手术史</span>
              </label>
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={record.history.tbi.has}
                  onChange={(e) =>
                    updateHistory({
                      tbi: { ...record.history.tbi, has: e.target.checked },
                    })
                  }
                />
                <span>脑外伤史</span>
              </label>
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={record.history.thyroidAbnormality.has}
                  onChange={(e) =>
                    updateHistory({
                      thyroidAbnormality: { ...record.history.thyroidAbnormality, has: e.target.checked },
                    })
                  }
                />
                <span>甲状腺疾病</span>
              </label>
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={record.history.coPoisoning.has}
                  onChange={(e) =>
                    updateHistory({
                      coPoisoning: { ...record.history.coPoisoning, has: e.target.checked },
                    })
                  }
                />
                <span>CO 中毒史</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Part C: 个人史与饮食生活习惯 (Personal History) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center space-x-2.5 pb-4 mb-6 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            C
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-800">C. 个人史与日常饮食生活习惯</h3>
            <p className="text-xs text-slate-500">烟酒史、饮食模式（素食/肉食/普通）、喝茶、咖啡、吃鱼频次</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">C3.1 饮食偏向</label>
            <select
              value={record.personalHistory.dietHabits.preference}
              onChange={(e) =>
                updatePersonalHistory({
                  dietHabits: {
                    ...record.personalHistory.dietHabits,
                    preference: Number(e.target.value) as any,
                  },
                })
              }
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            >
              <option value={1}>1. 素食为主</option>
              <option value={2}>2. 肉食为主</option>
              <option value={3}>3. 普通均衡饮食</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">C3.2 饮酒频率</label>
            <select
              value={record.personalHistory.dietHabits.drinkAlcoholFreq}
              onChange={(e) =>
                updatePersonalHistory({
                  dietHabits: {
                    ...record.personalHistory.dietHabits,
                    drinkAlcoholFreq: Number(e.target.value) as any,
                  },
                })
              }
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            >
              <option value={1}>1. 每天</option>
              <option value={2}>2. 每周多次</option>
              <option value={3}>3. 每周一次</option>
              <option value={4}>4. 很少</option>
              <option value={5}>5. 从不</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">C3.3 饮茶频率</label>
            <select
              value={record.personalHistory.dietHabits.drinkTeaFreq}
              onChange={(e) =>
                updatePersonalHistory({
                  dietHabits: {
                    ...record.personalHistory.dietHabits,
                    drinkTeaFreq: Number(e.target.value) as any,
                  },
                })
              }
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            >
              <option value={1}>1. 每天</option>
              <option value={2}>2. 每周多次</option>
              <option value={3}>3. 每周一次</option>
              <option value={4}>4. 很少</option>
              <option value={5}>5. 从不</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">C3.4 喝咖啡频率</label>
            <select
              value={record.personalHistory.dietHabits.drinkCoffeeFreq}
              onChange={(e) =>
                updatePersonalHistory({
                  dietHabits: {
                    ...record.personalHistory.dietHabits,
                    drinkCoffeeFreq: Number(e.target.value) as any,
                  },
                })
              }
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            >
              <option value={1}>1. 每天</option>
              <option value={2}>2. 每周多次</option>
              <option value={3}>3. 每周一次</option>
              <option value={4}>4. 很少</option>
              <option value={5}>5. 从不</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">C3.5 吃鱼频率</label>
            <select
              value={record.personalHistory.dietHabits.eatFishFreq}
              onChange={(e) =>
                updatePersonalHistory({
                  dietHabits: {
                    ...record.personalHistory.dietHabits,
                    eatFishFreq: Number(e.target.value) as any,
                  },
                })
              }
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            >
              <option value={1}>1. 每天</option>
              <option value={2}>2. 每周多次</option>
              <option value={3}>3. 每周一次</option>
              <option value={4}>4. 很少</option>
              <option value={5}>5. 从不</option>
            </select>
          </div>
        </div>
      </div>

      {/* Part F & G: 现病史与近1年化验检查 (Present Illness & Labs) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Present illness */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm">
              F
            </div>
            <h3 className="font-bold text-base text-slate-800">F. 主诉与现病史概述</h3>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">主诉 (Chief Complaint)</label>
            <textarea
              rows={2}
              value={record.presentIllness.chiefComplaint}
              onChange={(e) => updatePresentIllness({ chiefComplaint: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="记录患者来诊的主要原因与持续时间"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              1. 认知障碍表现 (举例描述如找词、遗忘、迷路等)
            </label>
            <textarea
              rows={3}
              value={record.presentIllness.cognitiveDeficitDesc}
              onChange={(e) => updatePresentIllness({ cognitiveDeficitDesc: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="详细记录认知损害的具体生活事例"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              2. 精神行为症状 (BPSD 如抑郁、易怒、睡眠节律等)
            </label>
            <textarea
              rows={2}
              value={record.presentIllness.bpsdDesc}
              onChange={(e) => updatePresentIllness({ bpsdDesc: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="记录情绪、幻觉、妄想或性格变化"
            />
          </div>
        </div>

        {/* Labs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm">
              G
            </div>
            <h3 className="font-bold text-base text-slate-800">G. 近1年内常规化验检查 (排查可逆性病因)</h3>
          </div>
          <p className="text-xs text-slate-500">用于排除甲状腺功能减退、维生素B12/叶酸缺乏、神经梅毒等可逆性认知障碍</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <label className="font-medium text-slate-700 block mb-1">G1. 梅毒抗体</label>
              <select
                value={record.labTests.syphilis}
                onChange={(e) => updateLabs({ syphilis: Number(e.target.value) as any })}
                className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white"
              >
                <option value={2}>2. 阴性 (正常)</option>
                <option value={1}>1. 阳性 (异常)</option>
                <option value={3}>3. 未查</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <label className="font-medium text-slate-700 block mb-1">G2. 同型半胱氨酸 (Hcy)</label>
              <select
                value={record.labTests.homocysteine}
                onChange={(e) => updateLabs({ homocysteine: Number(e.target.value) as any })}
                className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white"
              >
                <option value={2}>2. 正常</option>
                <option value={1}>1. 升高 / 异常</option>
                <option value={3}>3. 未查</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <label className="font-medium text-slate-700 block mb-1">G3. 叶酸水平</label>
              <select
                value={record.labTests.folateDeficiency}
                onChange={(e) => updateLabs({ folateDeficiency: Number(e.target.value) as any })}
                className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white"
              >
                <option value={2}>2. 正常</option>
                <option value={1}>1. 缺乏 / 低下</option>
                <option value={3}>3. 未查</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <label className="font-medium text-slate-700 block mb-1">G4. 血清维生素 B12</label>
              <select
                value={record.labTests.vitB12Low}
                onChange={(e) => updateLabs({ vitB12Low: Number(e.target.value) as any })}
                className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white"
              >
                <option value={2}>2. 正常</option>
                <option value={1}>1. 降低 / 缺乏</option>
                <option value={3}>3. 未查</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <label className="font-medium text-slate-700 block mb-1">G5. 甲状腺激素 (TSH/FT3/FT4)</label>
              <select
                value={record.labTests.thyroidAbnormal}
                onChange={(e) => updateLabs({ thyroidAbnormal: Number(e.target.value) as any })}
                className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white"
              >
                <option value={2}>2. 正常</option>
                <option value={1}>1. 异常 (如甲减)</option>
                <option value={3}>3. 未查</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <label className="font-medium text-slate-700 block mb-1">G6. 血红蛋白 (贫血指标)</label>
              <select
                value={record.labTests.hemoglobinLow}
                onChange={(e) => updateLabs({ hemoglobinLow: Number(e.target.value) as any })}
                className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white"
              >
                <option value={2}>2. 正常</option>
                <option value={1}>1. 低下 (贫血)</option>
                <option value={3}>3. 未查</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
