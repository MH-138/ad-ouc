import React from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, LayoutGrid } from "lucide-react";
import { AppPageId, APP_PAGES } from "../types/navigation";
import { SubjectRecord } from "../types/assessment";

interface PageShellProps {
  currentPageId: AppPageId;
  record: SubjectRecord;
  onNavigate: (pageId: AppPageId) => void;
  onReturnToPortal?: () => void;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}

export const PageShell: React.FC<PageShellProps> = ({
  currentPageId,
  record,
  onNavigate,
  onReturnToPortal,
  children,
  headerAction,
}) => {
  const currentIndex = APP_PAGES.findIndex((p) => p.id === currentPageId);
  const currentPage = APP_PAGES[currentIndex] || APP_PAGES[0];
  const prevPage = currentIndex > 0 ? APP_PAGES[currentIndex - 1] : null;
  const nextPage = currentIndex < APP_PAGES.length - 1 ? APP_PAGES[currentIndex + 1] : null;
  const badge = currentPage.getBadge(record);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Clean Top Header Card with Breadcrumb */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            {/* Breadcrumb path */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              {onReturnToPortal && (
                <button
                  type="button"
                  onClick={onReturnToPortal}
                  className="font-medium text-slate-600 hover:text-teal-700 flex items-center gap-1 transition"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-teal-600" />
                  <span>系统门户</span>
                </button>
              )}
              {onReturnToPortal && <span>/</span>}
              <span className="font-semibold text-slate-700">{currentPage.categoryName}</span>
              <span>/</span>
              <span className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200/60 font-bold font-mono text-teal-800 text-[11px]">
                {currentPage.code}
              </span>
              {badge && (
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${badge.color}`}>
                  {badge.text}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {currentPage.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {currentPage.description}
            </p>
          </div>

          {headerAction && (
            <div className="flex items-center gap-2 self-start md:self-auto">
              {headerAction}
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Page Content */}
      <div>{children}</div>

      {/* 3. Bottom Page Turn Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Previous Page Button */}
        {prevPage ? (
          <button
            type="button"
            onClick={() => {
              onNavigate(prevPage.id);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4 text-teal-600" />
            <span className="text-slate-400 font-normal">上一项:</span>
            <span>{prevPage.shortTitle}</span>
          </button>
        ) : (
          <div className="hidden sm:block text-xs text-slate-400">已是第一项</div>
        )}

        {/* Back to Portal button in bottom footer */}
        {onReturnToPortal && (
          <button
            type="button"
            onClick={onReturnToPortal}
            className="text-xs font-bold text-slate-500 hover:text-teal-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-teal-600" />
            <span>返回系统门户</span>
          </button>
        )}

        {/* Next Page Button */}
        {nextPage ? (
          <button
            type="button"
            onClick={() => {
              onNavigate(nextPage.id);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-xs font-bold text-white transition shadow-2xs"
          >
            <span>下一项: {nextPage.shortTitle}</span>
            <ChevronRight className="w-4 h-4 text-teal-200" />
          </button>
        ) : (
          <div className="hidden sm:block text-xs text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> 全部测评已完成
          </div>
        )}
      </div>
    </div>
  );
};
