import React from "react";
import { SubjectRecord } from "../../types/assessment";
import { calculateADASCog } from "../../utils/scoringCalculators";
import { InteractiveCanvas } from "../InteractiveCanvas";
import { Brain, FileSpreadsheet, Sparkles, PenTool } from "lucide-react";

interface Props {
  record: SubjectRecord;
  onChange: (updated: Partial<SubjectRecord>) => void;
}

export const SectionADASCog: React.FC<Props> = ({ record, onChange }) => {
  const adasResult = calculateADASCog(record.scales.adasCog);

  const updateAdas = (patch: Partial<SubjectRecord["scales"]["adasCog"]>) => {
    onChange({
      scales: {
        ...record.scales,
        adasCog: {
          ...record.scales.adasCog,
          ...patch,
        },
      },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-teal-700 font-bold">
            国际临床试验标准认知量表 (AD 药物与干预研究金标准)
          </div>
          <h2 className="text-lg font-bold mt-1 text-slate-900">
            ADAS-Cog: 阿尔茨海默病评定量表-认知部分 (12项完整评估)
          </h2>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-right">
            <span className="text-[11px] text-slate-500 block">ADAS-Cog 缺陷分 (0-70)</span>
            <span className="text-lg font-bold font-mono text-slate-900">
              {adasResult.totalScore} <span className="text-xs font-normal text-slate-500">/ 70 分</span>
            </span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold">
            {adasResult.severity}
          </div>
        </div>
      </div>

      {/* ADAS-Cog Items Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="pb-4 border-b border-slate-100">
          <h3 className="font-bold text-base text-slate-800">
            ADAS-Cog 认知评估 12 项条目 (采用错误计分制：0分=无缺陷，分数越高提示认知损害越严重)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            涵盖即刻单词回忆、指令执行、结构性构图、命名、意向性运用、定向力、单词辨认、测试指令记忆与语言交流能力
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* 1. Word Recall */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 block text-sm">1. 单词回忆 (10词3次学习)</span>
            <p className="text-slate-500 text-[11px]">记录3次试验中未回忆出的平均词数 (0-10分)</p>
            <div className="grid grid-cols-3 gap-1.5">
              <div>
                <label className="text-[11px] text-slate-600 block">第1次错误</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={record.scales.adasCog.wordRecallErrorsTrial1}
                  onChange={(e) => updateAdas({ wordRecallErrorsTrial1: Number(e.target.value) })}
                  className="w-full p-1.5 border border-slate-300 rounded bg-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block">第2次错误</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={record.scales.adasCog.wordRecallErrorsTrial2}
                  onChange={(e) => updateAdas({ wordRecallErrorsTrial2: Number(e.target.value) })}
                  className="w-full p-1.5 border border-slate-300 rounded bg-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block">第3次错误</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={record.scales.adasCog.wordRecallErrorsTrial3}
                  onChange={(e) => updateAdas({ wordRecallErrorsTrial3: Number(e.target.value) })}
                  className="w-full p-1.5 border border-slate-300 rounded bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* 2. Commands */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 block text-sm">2. 听理解指令 (1~5步指令)</span>
            <p className="text-slate-500 text-[11px]">握拳、指天花板、指门、摸耳朵、拍手等 (0-5分)</p>
            <select
              value={record.scales.adasCog.commandsErrors}
              onChange={(e) => updateAdas({ commandsErrors: Number(e.target.value) })}
              className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-semibold"
            >
              <option value={0}>0分: 5条指令全部正确执行</option>
              <option value={1}>1分: 错误 1 项</option>
              <option value={2}>2分: 错误 2 项</option>
              <option value={3}>3分: 错误 3 项</option>
              <option value={4}>4分: 错误 4 项</option>
              <option value={5}>5分: 5条指令全部错误</option>
            </select>
          </div>

          {/* 3. Constructional Praxis */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 block text-sm">3. 结构性练习 (临摹图形)</span>
            <p className="text-slate-500 text-[11px]">圆形、两重叠长方形、菱形、正方体 (0-5分)</p>
            <select
              value={record.scales.adasCog.constructionalPraxisErrors}
              onChange={(e) => updateAdas({ constructionalPraxisErrors: Number(e.target.value) })}
              className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-semibold"
            >
              <option value={0}>0分: 4种图形全部临摹准确</option>
              <option value={1}>1分: 1种图形临摹错误</option>
              <option value={2}>2分: 2种图形临摹错误</option>
              <option value={3}>3分: 3种图形临摹错误</option>
              <option value={4}>4分: 4种图形皆不准确</option>
              <option value={5}>5分: 无法画出任何图形</option>
            </select>
          </div>

          {/* 4. Naming Objects and Fingers */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 block text-sm">4. 实物与手指命名</span>
            <p className="text-slate-500 text-[11px]">花、床、哨子、手电、铅笔、梳子及5根手指 (0-5分)</p>
            <select
              value={record.scales.adasCog.namingErrors}
              onChange={(e) => updateAdas({ namingErrors: Number(e.target.value) })}
              className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-semibold"
            >
              <option value={0}>0分: 全部正确命名 (0-1个错误)</option>
              <option value={1}>1分: 错误 2-3 个</option>
              <option value={2}>2分: 错误 4-5 个</option>
              <option value={3}>3分: 错误 6-7 个</option>
              <option value={4}>4分: 错误 8-9 个</option>
              <option value={5}>5分: 错误 ≥ 10 个</option>
            </select>
          </div>

          {/* 5. Ideational Praxis */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 block text-sm">5. 意向性练习 (折信装信封)</span>
            <p className="text-slate-500 text-[11px]">将纸对折、装入信封、封口、写地址贴邮票模拟 (0-5分)</p>
            <select
              value={record.scales.adasCog.ideationalPraxisErrors}
              onChange={(e) => updateAdas({ ideationalPraxisErrors: Number(e.target.value) })}
              className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-semibold"
            >
              <option value={0}>0分: 5步动作均完整正确完成</option>
              <option value={1}>1分: 1步动作错误</option>
              <option value={2}>2分: 2步动作错误</option>
              <option value={3}>3分: 3步动作错误</option>
              <option value={4}>4分: 4步动作错误</option>
              <option value={5}>5分: 完全不能进行动作序列</option>
            </select>
          </div>

          {/* 6. Orientation */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 block text-sm">6. 定向力 (时间与地点)</span>
            <p className="text-slate-500 text-[11px]">人、日、月、年、季节、时辰、地点、城市 (0-8分)</p>
            <input
              type="number"
              min={0}
              max={8}
              value={record.scales.adasCog.orientationErrors}
              onChange={(e) => updateAdas({ orientationErrors: Number(e.target.value) })}
              className="w-full p-2 border border-slate-300 rounded bg-white font-mono font-bold text-base"
            />
          </div>

          {/* 7. Word Recognition */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 block text-sm">7. 单词辨认 (12词+12干扰词)</span>
            <p className="text-slate-500 text-[11px]">3次测试中错认词汇的平均分 (0-12分)</p>
            <div className="grid grid-cols-3 gap-1.5">
              <div>
                <label className="text-[11px] text-slate-600 block">第1次错认</label>
                <input
                  type="number"
                  min={0}
                  max={12}
                  value={record.scales.adasCog.wordRecognitionErrorsTrial1}
                  onChange={(e) => updateAdas({ wordRecognitionErrorsTrial1: Number(e.target.value) })}
                  className="w-full p-1.5 border border-slate-300 rounded bg-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block">第2次错认</label>
                <input
                  type="number"
                  min={0}
                  max={12}
                  value={record.scales.adasCog.wordRecognitionErrorsTrial2}
                  onChange={(e) => updateAdas({ wordRecognitionErrorsTrial2: Number(e.target.value) })}
                  className="w-full p-1.5 border border-slate-300 rounded bg-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block">第3次错认</label>
                <input
                  type="number"
                  min={0}
                  max={12}
                  value={record.scales.adasCog.wordRecognitionErrorsTrial3}
                  onChange={(e) => updateAdas({ wordRecognitionErrorsTrial3: Number(e.target.value) })}
                  className="w-full p-1.5 border border-slate-300 rounded bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* 8. Remembering Test Instructions */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 block text-sm">8. 回忆测验指令的能力</span>
            <p className="text-slate-500 text-[11px]">在辨认任务中是否需要反复提醒规则 (0-5分)</p>
            <select
              value={record.scales.adasCog.rememberingInstructions}
              onChange={(e) => updateAdas({ rememberingInstructions: Number(e.target.value) })}
              className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-semibold"
            >
              <option value={0}>0分: 从不需要重复提醒指令</option>
              <option value={1}>1分: 极少数时候需提醒一次</option>
              <option value={2}>2分: 需提醒 2-3 次</option>
              <option value={3}>3分: 需反复提醒规则</option>
              <option value={4}>4分: 难以理解并记住指令</option>
              <option value={5}>5分: 完全无法遵循指令</option>
            </select>
          </div>

          {/* 9. Spoken Language Ability */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 block text-sm">9. 语言交流表达能力</span>
            <p className="text-slate-500 text-[11px]">评估交谈时语法的完整性与表达质量 (0-5分)</p>
            <select
              value={record.scales.adasCog.spokenLanguageAbility}
              onChange={(e) => updateAdas({ spokenLanguageAbility: Number(e.target.value) })}
              className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-semibold"
            >
              <option value={0}>0分: 语言流利，表达清晰无缺陷</option>
              <option value={1}>1分: 偶尔有词汇选择缺陷</option>
              <option value={2}>2分: 存在轻度语法或用词障碍</option>
              <option value={3}>3分: 交流显著受限</option>
              <option value={4}>4分: 仅能说简单断续词句</option>
              <option value={5}>5分: 丧失语言交流功能</option>
            </select>
          </div>

          {/* 10. Word Finding */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 block text-sm">10. 找词困难 (Word-Finding)</span>
            <p className="text-slate-500 text-[11px]">在自发交谈中找词停顿或迂回表达 (0-5分)</p>
            <select
              value={record.scales.adasCog.wordFindingDifficulty}
              onChange={(e) => updateAdas({ wordFindingDifficulty: Number(e.target.value) })}
              className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-semibold"
            >
              <option value={0}>0分: 无找词困难</option>
              <option value={1}>1分: 偶尔停顿找词</option>
              <option value={2}>2分: 经常使用替代词或停顿</option>
              <option value={3}>3分: 明显找词困难</option>
              <option value={4}>4分: 几乎所有句子都有找词障碍</option>
              <option value={5}>5分: 几乎无法表达实质词汇</option>
            </select>
          </div>

          {/* 11. Comprehension */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 block text-sm">11. 听理解能力 (Comprehension)</span>
            <p className="text-slate-500 text-[11px]">对主试日常交谈提问的理解程度 (0-5分)</p>
            <select
              value={record.scales.adasCog.comprehensionDifficulty}
              onChange={(e) => updateAdas({ comprehensionDifficulty: Number(e.target.value) })}
              className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-semibold"
            >
              <option value={0}>0分: 完全理解，无理解错误</option>
              <option value={1}>1分: 偶尔需主试重复问题</option>
              <option value={2}>2分: 经常需重复或解释</option>
              <option value={3}>3分: 仅能理解简单明确的简短语句</option>
              <option value={4}>4分: 大多数问题无法准确理解</option>
              <option value={5}>5分: 完全不能理解言语提问</option>
            </select>
          </div>

          {/* 12. Concentration */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 block text-sm">12. 注意力与分心 (Concentration)</span>
            <p className="text-slate-500 text-[11px]">测验全程中的走神与分心表现 (0-5分)</p>
            <select
              value={record.scales.adasCog.concentrationDifficulty}
              onChange={(e) => updateAdas({ concentrationDifficulty: Number(e.target.value) })}
              className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-semibold"
            >
              <option value={0}>0分: 全程专注，配合良好</option>
              <option value={1}>1分: 偶尔一次走神</option>
              <option value={2}>2分: 多次走神需提醒</option>
              <option value={3}>3分: 经常分心东张西望</option>
              <option value={4}>4分: 极难维持注意力在测验上</option>
              <option value={5}>5分: 无法集中注意力完成测试</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
