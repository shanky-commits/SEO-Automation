import React from 'react';
import { ActiveStep, College } from '../types';
import { ShieldCheck, FileSpreadsheet, Sparkles, BookOpen, Layers, Lock, CheckCircle2, Award, FileText } from 'lucide-react';

interface NavbarProps {
  currentTab: 'workflow' | 'article-marks' | 'excel' | 'reports' | 'prompt';
  onChangeTab: (tab: 'workflow' | 'article-marks' | 'excel' | 'reports' | 'prompt') => void;
  colleges: College[];
  currentTargetCollege: College | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onChangeTab,
  colleges,
  currentTargetCollege
}) => {
  const completedCount = colleges.filter((c) => c.finalStatus === 'Done').length;
  const totalCount = colleges.length;

  return (
    <header className="bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Brand & Hard Rule Indicator */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-sm shadow-xs">
              CS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white">
                  CollegeSEO Automation
                </span>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30 uppercase tracking-wider hidden sm:inline">
                  Strict Queue-Lock
                </span>
              </div>
              <div className="text-[10px] text-stone-400 truncate max-w-xs">
                Audit → Live Page Modify → QA → Excel
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1">
            <button
              id="nav-tab-article-marks"
              onClick={() => onChangeTab('article-marks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentTab === 'article-marks'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-emerald-300" />
              <span>Article & Audited Marks</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>

            <button
              id="nav-tab-workflow"
              onClick={() => onChangeTab('workflow')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentTab === 'workflow'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Active Workflow</span>
              {currentTargetCollege && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              )}
            </button>

            <button
              id="nav-tab-excel"
              onClick={() => onChangeTab('excel')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentTab === 'excel'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Master Excel Queue</span>
              <span className="text-[10px] bg-stone-800 text-stone-300 px-1.5 py-0.2 rounded border border-stone-700">
                {completedCount}/{totalCount}
              </span>
            </button>

            <button
              id="nav-tab-reports"
              onClick={() => onChangeTab('reports')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentTab === 'reports'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Stakeholder Reports</span>
            </button>

            <button
              id="nav-tab-prompt"
              onClick={() => onChangeTab('prompt')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentTab === 'prompt'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Master Prompt & Rules</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
