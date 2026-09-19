import React, { useState } from 'react';
import { College, StakeholderReport } from '../types';
import { FileSpreadsheet, CheckCircle2, ArrowRight, Copy, Check, ShieldCheck, Lock, Sparkles } from 'lucide-react';

interface ExcelUpdateStepViewProps {
  college: College;
  nextCollege: College | null;
  onCommitExcelAndUnlockNext: (finalNotes: string, report: StakeholderReport) => void;
  onViewExcelMaster: () => void;
}

export const ExcelUpdateStepView: React.FC<ExcelUpdateStepViewProps> = ({
  college,
  nextCollege,
  onCommitExcelAndUnlockNext,
  onViewExcelMaster
}) => {
  const [auditNotes, setAuditNotes] = useState(
    college.auditNotes.includes('Pending')
      ? `Audit score ${college.auditReport?.overallScore || 85}/100. 10-part 1800+ word rewrite applied with mobile card tables. All QA checks passed.`
      : college.auditNotes
  );

  const [changesList, setChangesList] = useState<string[]>([
    'Expanded content to 1,800+ authoritative words with complete 2025-26 admission cutoffs and schedules.',
    'Engineered mobile-responsive card tables for Courses, Fees, and Placements with verified zero horizontal scroll.',
    'Substituted subjective marketing filler ("world-class", "renowned") with official NIRF 2024 and IPRS audited salary metrics.',
    'Implemented the exact 6 mandatory student-intent FAQ questions with schema-ready factual answers.',
    'Added descriptive contextual internal links with natural anchor texts pointing to dedicated course directories.'
  ]);

  const [newChangeInput, setNewChangeInput] = useState('');
  const [issuesPending, setIssuesPending] = useState('None');
  const [copiedReport, setCopiedReport] = useState(false);

  const isAlreadyDone = college.finalStatus === 'Done';

  const generatedReport: StakeholderReport = {
    collegeCompleted: college.name,
    audit: 'Completed',
    modifications: 'Completed',
    deployment: 'Completed',
    liveQa: 'Passed',
    excelStatus: 'Updated',
    finalStatus: 'Done',
    keyChangesMade: changesList,
    issuesStillPending: issuesPending,
    reportTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' })
  };

  const handleCommit = () => {
    onCommitExcelAndUnlockNext(auditNotes, generatedReport);
  };

  const formatReportText = () => {
    return `College Completed
${generatedReport.collegeCompleted}

Audit
${generatedReport.audit}

Modifications
${generatedReport.modifications}

Deployment
${generatedReport.deployment}

Live QA
${generatedReport.liveQa}

Excel Status
${generatedReport.excelStatus}

Final Status
${generatedReport.finalStatus}

Key Changes Made
${generatedReport.keyChangesMade.map((c) => `- ${c}`).join('\n')}

Issues Still Pending
- ${generatedReport.issuesStillPending}

Timestamp: ${generatedReport.reportTimestamp}`;
  };

  const copyReport = () => {
    navigator.clipboard.writeText(formatReportText());
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider">
            <span>Step 5 of Strict Sequential Workflow</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mt-1">
            Excel Master Sheet Update & Final Status Sign-Off
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Synchronizing authoritative tracker row and generating Section 20 Stakeholder Final Report.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            id="btn-copy-stakeholder-report"
            onClick={copyReport}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg border border-stone-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedReport ? 'Copied Final Report!' : 'Copy Section 20 Report'}</span>
          </button>

          <button
            id="btn-commit-and-unlock-next"
            onClick={handleCommit}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {isAlreadyDone
                ? 'Save & Return to Master Queue'
                : nextCollege
                ? `Finalize "Done" & Unlock Target #${nextCollege.order}`
                : 'Finalize All Colleges in Queue (Done)'}
            </span>
          </button>
        </div>
      </div>

      {/* Row Synchronization Preview Card */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Master Excel Row to be Written / Synchronized</span>
          </h3>
          <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
            Status Transition: Final Status → Done
          </span>
        </div>

        {/* Excel-like single row representation */}
        <div className="overflow-x-auto border border-stone-200 rounded-lg">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-stone-100 text-stone-600 font-bold border-b border-stone-200">
                <th className="py-2.5 px-3">College</th>
                <th className="py-2.5 px-3">Audit Status</th>
                <th className="py-2.5 px-3">Modification Status</th>
                <th className="py-2.5 px-3">QA Status</th>
                <th className="py-2.5 px-3">Final Status</th>
                <th className="py-2.5 px-3">Audit Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-200">
              <tr>
                <td className="py-3 px-3 font-semibold text-stone-900 max-w-[200px] truncate">
                  {college.name}
                </td>
                <td className="py-3 px-3">
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded border border-emerald-300">
                    Audited
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded border border-emerald-300">
                    Modified
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded border border-emerald-300">
                    Passed
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span className="bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-2xs">
                    Done
                  </span>
                </td>
                <td className="py-3 px-3 min-w-[280px]">
                  <input
                    type="text"
                    value={auditNotes}
                    onChange={(e) => setAuditNotes(e.target.value)}
                    className="w-full text-xs p-1.5 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 20 Stakeholder Final Report Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Section 20: Official Stakeholder Final Report</span>
            </h3>
            <span className="text-[11px] text-stone-500 font-mono">
              Ready to submit
            </span>
          </div>

          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 font-mono text-xs text-stone-800 space-y-2.5 whitespace-pre-wrap leading-relaxed">
            <div>
              <span className="font-bold text-stone-500 block text-[10px] uppercase">College Completed</span>
              <span className="font-semibold text-stone-900">{generatedReport.collegeCompleted}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-stone-200">
              <div>
                <span className="text-stone-500 block text-[10px] uppercase">Audit</span>
                <span className="font-bold text-emerald-700">Completed</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px] uppercase">Modifications</span>
                <span className="font-bold text-emerald-700">Completed</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px] uppercase">Deployment / Live</span>
                <span className="font-bold text-emerald-700">Completed</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px] uppercase">Live QA</span>
                <span className="font-bold text-emerald-700">Passed</span>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-200">
              <span className="font-bold text-stone-500 block text-[10px] uppercase mb-1">Key Changes Made</span>
              <ul className="space-y-1 font-sans text-xs text-stone-800 pl-4 list-disc">
                {changesList.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-stone-200">
              <span className="font-bold text-stone-500 block text-[10px] uppercase">Issues Still Pending</span>
              <span className="font-sans text-xs text-emerald-800 font-semibold">{issuesPending}</span>
            </div>
          </div>
        </div>

        {/* Next College Unlocking Queue Card */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
              <Lock className="w-3.5 h-3.5 text-stone-500" />
              <span>Queue Status & Next Target</span>
            </div>
            <h4 className="text-base font-bold text-stone-900">
              {nextCollege ? `College #${nextCollege.order} in Queue` : 'Queue Fully Completed'}
            </h4>

            {nextCollege ? (
              <div className="mt-3 bg-stone-50 p-3.5 rounded-lg border border-stone-200 space-y-2 text-xs text-stone-700">
                <div className="font-semibold text-stone-900">{nextCollege.name}</div>
                <div className="text-stone-500 text-[11px] truncate">{nextCollege.liveUrl}</div>
                <div className="text-amber-800 bg-amber-50 p-2 rounded text-[11px] border border-amber-200 font-medium">
                  Currently locked by strict rule. Clicking <strong>Finalize & Unlock</strong> below will commit College #{college.order} to Excel and automatically promote College #{nextCollege.order} to active.
                </div>
              </div>
            ) : (
              <div className="mt-3 bg-emerald-50 p-3.5 rounded-lg border border-emerald-200 text-xs text-emerald-900 font-medium">
                This is the final college in the current master list. All college audits, modifications, and QA verifications will be 100% complete!
              </div>
            )}
          </div>

          <div className="space-y-2 pt-4 border-t border-stone-100">
            <button
              id="btn-finalize-and-unlock"
              onClick={handleCommit}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Finalize Done & Unlock Next College</span>
            </button>
            <button
              onClick={onViewExcelMaster}
              className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              View Full Excel Master Sheet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
