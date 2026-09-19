import React, { useState, useEffect } from 'react';
import { College, QACheckItem, QAResult } from '../types';
import { generateDefaultQAChecks } from '../utils/auditEngine';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ShieldCheck, CheckCircle2, ArrowRight, Smartphone, Monitor, AlertTriangle, ExternalLink, CheckSquare, Square } from 'lucide-react';

interface QAStepViewProps {
  college: College;
  onSaveQAResult: (qaResult: QAResult) => void;
  onProceedToExcelUpdate: () => void;
}

export const QAStepView: React.FC<QAStepViewProps> = ({
  college,
  onSaveQAResult,
  onProceedToExcelUpdate
}) => {
  const [checks, setChecks] = useState<QACheckItem[]>(
    college.qaResult?.checks || generateDefaultQAChecks()
  );
  const [qaNotes, setQaNotes] = useState(college.qaResult?.notes || 'All verification criteria passed. Mobile tables validated with zero horizontal scroll.');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');

  // Check if all items are verified
  const allVerified = checks.every((c) => c.isManualVerified);

  const toggleCheck = (id: string) => {
    const updated = checks.map((c) =>
      c.id === id ? { ...c, isManualVerified: !c.isManualVerified } : c
    );
    setChecks(updated);
  };

  const handleVerifyAll = () => {
    const updated = checks.map((c) => ({ ...c, isManualVerified: true }));
    setChecks(updated);
  };

  const handleSaveAndProceed = () => {
    const result: QAResult = {
      checks,
      allPassed: allVerified,
      notes: qaNotes,
      verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' })
    };
    onSaveQAResult(result);
    onProceedToExcelUpdate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider">
            <span>Step 4 of Strict Sequential Workflow</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mt-1">
            Live Page QA & Definition of Done Verification
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Hard rule: Every requirement must be verified before the Excel tracker can be finalized.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            id="btn-verify-all-qa"
            onClick={handleVerifyAll}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg border border-stone-300 transition-colors cursor-pointer"
          >
            Verify All Checks
          </button>

          <button
            id="btn-proceed-to-excel"
            onClick={handleSaveAndProceed}
            disabled={!allVerified}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approve QA & Proceed to Step 5</span>
          </button>
        </div>
      </div>

      {/* Main Grid: QA Checklist on left, Mobile/Desktop Live Inspector on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive QA Verification Checklist */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Strict Definition of Done Checklist</span>
              </h3>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${allVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {checks.filter((c) => c.isManualVerified).length} / {checks.length} Verified
              </span>
            </div>

            <div className="space-y-3">
              {checks.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    item.isManualVerified
                      ? 'bg-emerald-50/40 border-emerald-300'
                      : 'bg-white border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <button
                    type="button"
                    className="mt-0.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {item.isManualVerified ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4 text-stone-400" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-stone-900">{item.label}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-stone-100 text-stone-600 rounded font-medium">
                        {item.category}
                      </span>
                      {item.id === 'qa-tables-mobile' && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-red-100 text-red-800 font-bold rounded">
                          NON-NEGOTIABLE
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* QA Notes Input */}
            <div className="pt-3 border-t border-stone-100">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                QA Verification Notes (Saved directly to Excel Master Sheet):
              </label>
              <textarea
                value={qaNotes}
                onChange={(e) => setQaNotes(e.target.value)}
                rows={2}
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all"
                placeholder="Document verification specifics..."
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Mobile / Desktop Interactive Viewport Preview */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-stone-900">
                  Live Viewport QA Inspector
                </h4>
                <p className="text-[11px] text-stone-500">
                  Inspect table card transformations and viewport integrity.
                </p>
              </div>

              <div className="inline-flex rounded-lg border border-stone-200 p-0.5 bg-stone-50">
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                    previewDevice === 'mobile' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-500'
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Mobile 375px</span>
                </button>
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                    previewDevice === 'desktop' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-500'
                  }`}
                >
                  <Monitor className="w-3 h-3" />
                  <span>Desktop</span>
                </button>
              </div>
            </div>

            {/* Viewport Frame */}
            <div className="bg-stone-100 p-4 rounded-xl border border-stone-300 flex justify-center overflow-hidden">
              <div
                className={`bg-white rounded-xl border border-stone-300 shadow-md p-4 overflow-y-auto max-h-[620px] transition-all duration-300 ${
                  previewDevice === 'mobile' ? 'w-[375px]' : 'w-full'
                }`}
              >
                <div className="mb-3 pb-2 border-b border-stone-200 flex items-center justify-between text-[11px] text-stone-500">
                  <span className="font-mono">
                    {previewDevice === 'mobile' ? 'iPhone SE / 13 Mini (375 × 667)' : 'Desktop Viewport'}
                  </span>
                  <a
                    href={college.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span>External URL</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                <MarkdownRenderer
                  content={college.modifiedContent || college.existingContent}
                  isMobileView={previewDevice === 'mobile'}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between bg-stone-50 p-4 rounded-xl border border-stone-200">
        <div className="text-xs text-stone-600">
          {!allVerified ? (
            <span className="text-amber-700 flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              Complete all checklist items to unlock Step 5 (Update Excel Tracker).
            </span>
          ) : (
            <span className="text-emerald-700 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All QA requirements satisfied! Ready to commit row to Excel and unlock next college.
            </span>
          )}
        </div>
        <button
          id="btn-bottom-proceed-excel"
          onClick={handleSaveAndProceed}
          disabled={!allVerified}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm inline-flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Commit QA & Proceed to Step 5</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
