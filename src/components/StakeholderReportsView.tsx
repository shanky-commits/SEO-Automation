import React, { useState } from 'react';
import { College, StakeholderReport } from '../types';
import { FileCheck, AlertTriangle, Copy, Check, Download, ExternalLink } from 'lucide-react';

interface StakeholderReportsViewProps {
  colleges: College[];
}

export const StakeholderReportsView: React.FC<StakeholderReportsViewProps> = ({ colleges }) => {
  const completedOrBlockedColleges = colleges.filter(
    (c) => c.stakeholderReport || c.finalStatus === 'Done' || c.finalStatus === 'Blocked'
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const formatReportText = (c: College) => {
    const report = c.stakeholderReport;
    if (!report) {
      return `College Completed: ${c.name}\nFinal Status: ${c.finalStatus}\nNotes: ${c.auditNotes}`;
    }
    return `College Completed
${report.collegeCompleted}

Audit
${report.audit}

Modifications
${report.modifications}

Deployment
${report.deployment}

Live QA
${report.liveQa}

Excel Status
${report.excelStatus}

Final Status
${report.finalStatus}

Key Changes Made
${report.keyChangesMade.map((k) => `- ${k}`).join('\n')}

Issues Still Pending
- ${report.issuesStillPending}

Timestamp: ${report.reportTimestamp}`;
  };

  const handleCopy = (c: College) => {
    navigator.clipboard.writeText(formatReportText(c));
    setCopiedId(c.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            <span>Executive Delivery Logs</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mt-1">
            Stakeholder Final Reports (Section 20 Protocol)
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Formal per-college sign-off reports submitted to stakeholders upon completion or blocker detection.
          </p>
        </div>
      </div>

      {completedOrBlockedColleges.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-dashed border-stone-300 text-center space-y-2">
          <FileCheck className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-800">No Final Reports Generated Yet</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Process Target #1 through Audit, Modification, Live QA, and Excel Update to generate the first formal stakeholder report.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {completedOrBlockedColleges.map((col) => {
            const report = col.stakeholderReport;
            const isBlocked = col.finalStatus === 'Blocked';

            return (
              <div
                key={col.id}
                className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-500">
                        Target #{col.order}
                      </span>
                      <h3 className="text-base font-bold text-stone-900">{col.name}</h3>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          isBlocked
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {col.finalStatus}
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      Live URL: <a href={col.liveUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{col.liveUrl}</a>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopy(col)}
                    className="self-start sm:self-auto px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedId === col.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedId === col.id ? 'Copied' : 'Copy Report Text'}</span>
                  </button>
                </div>

                <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 font-mono text-xs text-stone-800 space-y-2 leading-relaxed whitespace-pre-wrap">
                  {formatReportText(col)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
