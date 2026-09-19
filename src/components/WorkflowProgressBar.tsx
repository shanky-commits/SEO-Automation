import React from 'react';
import { College, ActiveStep } from '../types';
import { CheckCircle2, Lock, ArrowRight, ShieldCheck, FileSearch, FileEdit, Table, FileSpreadsheet, AlertTriangle } from 'lucide-react';

interface WorkflowProgressBarProps {
  currentCollege: College | null;
  activeStep: ActiveStep;
  onSelectStep: (step: ActiveStep) => void;
  isLocked: boolean;
}

export const WorkflowProgressBar: React.FC<WorkflowProgressBarProps> = ({
  currentCollege,
  activeStep,
  onSelectStep,
  isLocked
}) => {
  if (!currentCollege) {
    return (
      <div className="bg-white border-b border-stone-200 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-600 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>All colleges in queue have completed the sequential workflow!</span>
          </div>
        </div>
      </div>
    );
  }

  // Determine completion of individual steps for current college
  const isAuditDone = currentCollege.auditStatus === 'Audited';
  const isModifyDone = currentCollege.modificationStatus === 'Modified';
  const isQADone = currentCollege.qaStatus === 'Passed';
  const isExcelDone = currentCollege.finalStatus === 'Done';
  const isBlocked = currentCollege.finalStatus === 'Blocked' || currentCollege.auditStatus === 'Blocked';

  const steps = [
    {
      id: 'audit' as ActiveStep,
      number: 1,
      title: '1. Deep Audit',
      description: '6-Section Google & Student Audit',
      icon: FileSearch,
      status: isAuditDone ? 'completed' : activeStep === 'audit' ? 'active' : 'pending'
    },
    {
      id: 'modify' as ActiveStep,
      number: 2,
      title: '2. Modify Live Page',
      description: '10-Part 1,800w Architecture',
      icon: FileEdit,
      status: isModifyDone ? 'completed' : !isAuditDone ? 'disabled' : activeStep === 'modify' ? 'active' : 'pending'
    },
    {
      id: 'qa' as ActiveStep,
      number: 3,
      title: '3. Live QA Verify',
      description: 'Mobile Tables & Zero Scroll',
      icon: ShieldCheck,
      status: isQADone ? 'completed' : !isModifyDone ? 'disabled' : activeStep === 'qa' ? 'active' : 'pending'
    },
    {
      id: 'excel' as ActiveStep,
      number: 4,
      title: '4. Update Excel',
      description: 'Sync Authoritative Row',
      icon: FileSpreadsheet,
      status: isExcelDone ? 'completed' : !isQADone ? 'disabled' : activeStep === 'excel' ? 'active' : 'pending'
    }
  ];

  return (
    <div className="bg-white border-b border-stone-200 shadow-xs">
      {/* Target College Header Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3.5 pb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-md tracking-wide uppercase">
              Target #{currentCollege.order} in Queue
            </span>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 truncate max-w-lg">
              {currentCollege.name}
            </h2>
            <span className="text-xs text-stone-500 hidden sm:inline">
              ({currentCollege.category})
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isBlocked ? (
              <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-red-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                Queue Halted: Blocked
              </span>
            ) : isExcelDone ? (
              <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Complete & Verified Done
              </span>
            ) : (
              <span className="bg-amber-50 text-amber-900 text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-amber-200">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                Sequential Queue-Lock Active (Locked to this College)
              </span>
            )}
            <a
              href={currentCollege.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium bg-stone-50 px-2 py-1 rounded border border-stone-200"
            >
              <span>Live Page URL</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Sequential Steps Tracker Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-3 pt-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          {steps.map((step) => {
            const Icon = step.icon;
            const isClickable = step.status !== 'disabled';
            const isActive = activeStep === step.id;

            return (
              <button
                key={step.id}
                id={`btn-step-${step.id}`}
                disabled={!isClickable}
                onClick={() => onSelectStep(step.id)}
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                  isActive
                    ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-600'
                    : step.status === 'completed'
                    ? 'border-emerald-200 bg-emerald-50/40 text-emerald-950 hover:bg-emerald-50/80 cursor-pointer'
                    : step.status === 'disabled'
                    ? 'border-stone-200 bg-stone-50/60 text-stone-400 opacity-60 cursor-not-allowed'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 cursor-pointer'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                    step.status === 'completed'
                      ? 'bg-emerald-600 text-white'
                      : isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {step.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate leading-tight flex items-center gap-1">
                    <span>{step.title}</span>
                    {step.status === 'disabled' && <Lock className="w-2.5 h-2.5 text-stone-400" />}
                  </div>
                  <div className="text-[10px] text-stone-500 truncate mt-0.5">
                    {step.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
