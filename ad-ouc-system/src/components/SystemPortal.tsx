import React from "react";
import { User, Users, Stethoscope, ArrowRight } from "lucide-react";
import { AppPageId } from "../types/navigation";

export type PortalType = "portal" | "patient" | "informant" | "examiner";

export interface SystemPortalProps {
  onSelectPortal: (portal: PortalType, targetPage?: AppPageId) => void;
}

export const SystemPortal: React.FC<SystemPortalProps> = ({
  onSelectPortal,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* 1. 顶部系统栏 */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-xs">
            AD
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              认知障碍临床数据采集系统
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">三端独立通道分发入口</p>
          </div>
        </div>
      </header>

      {/* 2. 主体区 */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        <div>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            选择入口
          </h2>
        </div>

        {/* 三大独立通道卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 通道 1: 受试者自评 */}
          <div
            onClick={() => onSelectPortal("patient")}
            className="group bg-white hover:bg-teal-50/40 border border-slate-200 hover:border-teal-400 rounded-2xl p-6 transition duration-150 cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-md"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <User className="w-6 h-6" />
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 font-bold border border-teal-200">
                  受试者本人
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition">
                  受试者自评通道
                </h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                受试者本人使用。已建档则直接开始自评；未建档先补基本信息。
              </p>

              <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                <div className="font-medium text-slate-700">
                  个人档案 · SCD-Q9 · 我的健康档案
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-teal-700 text-xs font-bold group-hover:text-teal-800">
              <span>进入自评通道</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* 通道 2: 家属知情者 */}
          <div
            onClick={() => onSelectPortal("informant")}
            className="group bg-white hover:bg-amber-50/40 border border-slate-200 hover:border-amber-400 rounded-2xl p-6 transition duration-150 cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-md"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                  家属 / 知情者
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-700 transition">
                  家属观察通道
                </h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                家属或长期知情者使用。先选择受试者，再逐项完成观察评定。
              </p>

              <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                <div className="font-medium text-slate-700">
                  受试者状态 · FAQ · CDR 家属核实
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-amber-700 text-xs font-bold group-hover:text-amber-800">
              <span>进入家属观察</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* 通道 3: 医生端 */}
          <div
            onClick={() => onSelectPortal("examiner", "patient_center")}
            className="group bg-white hover:bg-indigo-50/40 border border-slate-200 hover:border-indigo-400 rounded-2xl p-6 transition duration-150 cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-md"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 font-bold border border-indigo-200">
                  医生
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition">
                  医生端
                </h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                医生使用。先选受试者，再建档、评定、导入文档、审核 AI 建议并签字。
              </p>

              <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                <div className="font-medium text-slate-700">
                  队列档案 · 专业量表 · 病历文档 · 诊断报告
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-indigo-700 text-xs font-bold group-hover:text-indigo-800">
              <span>进入医生端</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>
        </div>
      </main>

      {/* 3. 页脚 */}
      <footer className="border-t border-slate-200 bg-white py-3 px-6 text-center text-xs text-slate-400">
        认知障碍临床数据采集系统
      </footer>
    </div>
  );
};
