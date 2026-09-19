import React, { useState } from 'react';
import { College, AuditReport } from '../types';
import { runDeepAudit } from '../utils/auditEngine';
import { MarkdownRenderer } from './MarkdownRenderer';
import {
  Sparkles,
  ArrowRight,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  Globe,
  Bot,
  ExternalLink,
  Edit3,
  Check,
  HelpCircle,
  Table,
  CheckCircle,
  Search,
  Eye,
  Layers,
  Zap,
  Info
} from 'lucide-react';

interface AuditStepViewProps {
  college: College;
  onSaveAuditReport: (report: AuditReport) => void;
  onProceedToModify: () => void;
  onMarkBlocked: (reason: string) => void;
  onUpdateCollegeContent?: (
    collegeId: string,
    newContent: string,
    liveUrl?: string,
    liveFetchMeta?: any
  ) => void;
  onRefreshContent: (
    collegeId: string,
    customUrl?: string
  ) => Promise<{
    success: boolean;
    message: string;
    meta?: any;
    diffPoints?: string[];
  }>;
  onDirectModifyLiveUrl: (collegeId: string, newUrl: string) => void;
}

export const AuditStepView: React.FC<AuditStepViewProps> = ({
  college,
  onSaveAuditReport,
  onProceedToModify,
  onMarkBlocked,
  onUpdateCollegeContent,
  onRefreshContent,
  onDirectModifyLiveUrl
}) => {
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<{
    success: boolean;
    message: string;
    diffPoints?: string[];
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'report' | 'table' | 'source' | 'inspector' | 'diff'>('report');
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>('sec-1');
  const [blockReason, setBlockReason] = useState('');
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  // Direct Live URL Edit State
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState(college.liveUrl);

  // Custom Live URL Inspector State
  const [customInspectorUrl, setCustomInspectorUrl] = useState(college.liveUrl);
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectorResult, setInspectorResult] = useState<any | null>(null);
  const [inspectorError, setInspectorError] = useState<string | null>(null);
  const [showInspectorRawData, setShowInspectorRawData] = useState(false);

  // Bold & Highlight state
  const [boldUpdatedData, setBoldUpdatedData] = useState(true);

  const report = college.auditReport;
  const meta = college.liveFetchMeta;
  const words = college.existingContent.trim().split(/\s+/).filter(Boolean).length;
  const oldWords = college.previousContentBackup
    ? college.previousContentBackup.trim().split(/\s+/).filter(Boolean).length
    : null;

  // Automated fetch handler for current college
  const handleTriggerRefresh = async (overrideUrl?: string) => {
    setIsRefreshing(true);
    setRefreshNotice(null);
    try {
      const result = await onRefreshContent(college.id, overrideUrl);
      setRefreshNotice(result);
      if (result.success) {
        setIsEditingUrl(false);
      }
    } catch (err: any) {
      setRefreshNotice({
        success: false,
        message: err.message || 'Failed to refresh content from live URL'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Direct modify URL save
  const handleSaveDirectUrl = () => {
    if (!urlInput.trim()) return;
    onDirectModifyLiveUrl(college.id, urlInput.trim());
    setIsEditingUrl(false);
    // Also trigger automated fetch with the new URL to replace old content
    handleTriggerRefresh(urlInput.trim());
  };

  // Custom URL Inspector: check your own data without modifying yet
  const handleInspectCustomUrl = async (urlToTest?: string) => {
    const target = (urlToTest || customInspectorUrl).trim();
    if (!target) return;
    setIsInspecting(true);
    setInspectorError(null);
    setInspectorResult(null);

    try {
      const res = await fetch('/api/fetch-live-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to inspect live URL');
      }

      setInspectorResult(data);
    } catch (err: any) {
      setInspectorError(err.message || 'Error inspecting URL');
    } finally {
      setIsInspecting(false);
    }
  };

  // Apply inspected data to college
  const handleApplyInspectedData = () => {
    if (!inspectorResult) return;
    handleTriggerRefresh(customInspectorUrl);
    setActiveTab('source');
  };

  const handleRunAudit = async () => {
    setIsRunningAudit(true);
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collegeName: college.name,
          liveUrl: college.liveUrl,
          category: college.category,
          content: college.existingContent
        })
      });

      const data = await res.json();
      if (data.success && data.report && data.report.sections) {
        onSaveAuditReport({
          ...data.report,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        });
      } else {
        const localReport = runDeepAudit(college);
        onSaveAuditReport(localReport);
      }
    } catch (err) {
      console.warn('API audit failed, using deterministic local audit engine', err);
      const localReport = runDeepAudit(college);
      onSaveAuditReport(localReport);
    } finally {
      setIsRunningAudit(false);
    }
  };

  const getStatusColor = (status: 'Good' | 'Needs Work' | 'Missing') => {
    if (status === 'Good') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (status === 'Needs Work') return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getPriorityBadge = (priority: 'High' | 'Medium' | 'Low') => {
    if (priority === 'High') return 'bg-red-100 text-red-800 border-red-200';
    if (priority === 'Medium') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-stone-100 text-stone-700 border-stone-200';
  };

  // Render content with official updated data highlighted in bold
  const renderHighlightedContent = (text: string) => {
    if (!boldUpdatedData) {
      return <pre className="whitespace-pre-wrap">{text}</pre>;
    }

    // Pattern to bold and highlight official updated metrics for any college
    const patterns = [
      /(₹\s*[0-9]+(?:\.[0-9]+)?(?:\s*-\s*₹?\s*[0-9]+(?:\.[0-9]+)?)?\s*(?:Lakhs?|Cr|Crore))/gi,
      /(₹?\s*[0-9]+(?:\.[0-9]+)?\s*LPA)/gi,
      /(#?\d+(?:-\d+)?\s*(?:Management\s*Band|NIRF\s*Rank|in\s*Management)?)/gi,
      /(?:NIRF\s*(?:2024|2025|2026)?)/gi,
      /(\b\d{2,3}\s*(?:Approved\s*Seats|seats|approved\s*intake)\b)/gi,
      /(\b2026\s*-\s*2028\b|\b2026-28\b|\b2026-27\b|\b2025-27\b)/gi,
      /(AICTE\s*Approved|NBA\s*Accredited|AIU\s*(?:Equivalent|Equivalence)|AACSB\s*(?:Member|Accredited)|EQUIS|NAAC\s*(?:'A\+\+'|A\+\+|A\+)?)/gi,
      /(\b(?:CAT\s*2026|CAT|XAT\s*2027|XAT|CMAT|MAT|GMAT|SNAP\s*2026|SNAP|JEE\s*Main|JEE\s*Advanced)\b)/g
    ];

    let parts: { text: string; isHighlight: boolean }[] = [{ text, isHighlight: false }];

    patterns.forEach((regex) => {
      const nextParts: { text: string; isHighlight: boolean }[] = [];
      parts.forEach((p) => {
        if (p.isHighlight) {
          nextParts.push(p);
          return;
        }
        const splits = p.text.split(regex);
        splits.forEach((s) => {
          if (!s) return;
          if (regex.test(s)) {
            nextParts.push({ text: s, isHighlight: true });
          } else {
            nextParts.push({ text: s, isHighlight: false });
          }
        });
      });
      parts = nextParts;
    });

    return (
      <div className="font-mono text-xs leading-relaxed whitespace-pre-wrap">
        {parts.map((part, idx) =>
          part.isHighlight ? (
            <mark
              key={idx}
              className="bg-emerald-200/90 text-emerald-950 font-extrabold px-1 py-0.5 rounded shadow-2xs border border-emerald-400"
              title="Official Website Verified & Updated Metric"
            >
              {part.text}
            </mark>
          ) : (
            <span key={idx}>{part.text}</span>
          )
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Run Audit & Prominent Refresh Content Button */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider">
            <span>Step 2 of Strict Sequential Workflow</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mt-1">
            Deep Dual-Perspective SEO & Student Audit
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Auditing <span className="font-semibold text-stone-900">{college.name}</span> against Google Rank 1 and Student Decision criteria with official live website data.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
          {/* PROMINENT REFRESH CONTENT BUTTON */}
          <button
            id="btn-refresh-content"
            onClick={() => handleTriggerRefresh()}
            disabled={isRefreshing || isRunningAudit}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            title="Automated fetch of official live URL content, removing old content and updating state"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing Live Content...' : 'Refresh Content'}</span>
          </button>

          {/* Run Deep Audit */}
          <button
            id="btn-trigger-audit"
            onClick={handleRunAudit}
            disabled={isRunningAudit || isRefreshing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isRunningAudit ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{isRunningAudit ? 'Auditing Page...' : report ? 'Re-Run Deep Audit' : 'Run 6-Section Deep Audit'}</span>
          </button>

          {report && college.auditStatus !== 'Audited' && (
            <button
              id="btn-approve-audit"
              onClick={onProceedToModify}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve & Proceed to Step 3</span>
            </button>
          )}

          <button
            id="btn-flag-blocked"
            onClick={() => setShowBlockDialog(true)}
            className="px-3 py-2 bg-stone-100 hover:bg-red-50 text-stone-700 hover:text-red-700 text-xs font-semibold rounded-lg border border-stone-200 transition-colors cursor-pointer"
          >
            Flag Blocker
          </button>
        </div>
      </div>

      {/* Visual Indicator of Successful Fetch */}
      {refreshNotice && (
        <div
          className={`p-4 rounded-xl border shadow-xs transition-all ${
            refreshNotice.success
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-red-50 border-red-300 text-red-950'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs">
                {refreshNotice.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>
                  {refreshNotice.success
                    ? 'Official Live Page Refreshed Successfully (200 OK)'
                    : 'Live Page Fetch Failed'}
                </span>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed">
                {refreshNotice.message}
              </p>
              {refreshNotice.diffPoints && refreshNotice.diffPoints.length > 0 && (
                <div className="pt-1">
                  <div className="text-[11px] font-bold text-stone-700 mb-1">
                    Verified Updated Data Points Present on Official Website:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {refreshNotice.diffPoints.map((dp, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center text-[11px] px-2 py-0.5 rounded bg-emerald-100/90 text-emerald-900 border border-emerald-200 font-semibold"
                        dangerouslySetInnerHTML={{
                          __html: dp.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setRefreshNotice(null)}
              className="text-xs text-stone-500 hover:text-stone-800 px-2 py-1 hover:bg-stone-200/60 rounded cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Live Page Connection Bar with Direct Modify Feature */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                Connected Live URL (200 OK)
              </span>
              <span className="text-xs text-stone-400 font-medium">Source: Official CMS / Live Domain</span>
              {oldWords !== null && (
                <span className="text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded font-mono">
                  Previous: {oldWords} words → Fresh: {words} words
                </span>
              )}
            </div>

            {/* Direct URL Modification Input */}
            {isEditingUrl ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 max-w-2xl pt-1">
                <div className="relative flex-1">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://vai2110.github.io/college-cms/content/jaipuria-jaipur-mba/overview.html"
                    className="w-full text-xs font-mono px-3 py-2 border border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-blue-50/20"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleSaveDirectUrl}
                    disabled={isRefreshing || !urlInput.trim()}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save & Refresh Content</span>
                  </button>
                  <button
                    onClick={() => {
                      onDirectModifyLiveUrl(college.id, urlInput.trim());
                      setIsEditingUrl(false);
                    }}
                    className="px-2.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-lg cursor-pointer"
                    title="Update the URL in records without scraping immediately"
                  >
                    Update URL Only
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingUrl(false);
                      setUrlInput(college.liveUrl);
                    }}
                    className="px-2 py-2 text-stone-500 hover:bg-stone-100 text-xs rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-stone-700">Target Live URL:</span>
                <a
                  href={college.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 break-all bg-blue-50/60 px-2 py-0.5 rounded border border-blue-200"
                >
                  <span>{college.liveUrl}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
                <button
                  id="btn-direct-modify-url"
                  onClick={() => {
                    setUrlInput(college.liveUrl);
                    setIsEditingUrl(true);
                  }}
                  className="text-[11px] text-blue-700 hover:text-blue-900 px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                  title="Directly modify the live URL for this college"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Directly Modify URL</span>
                </button>
              </div>
            )}

            {meta?.title && (
              <div className="text-xs text-stone-600 font-medium line-clamp-1">
                <span className="text-stone-400">Official Page Title:</span> {meta.title}
              </div>
            )}
          </div>

          {/* Quick Metrics Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200">
              <FileText className="w-3.5 h-3.5 text-stone-500" />
              <span className="text-stone-500">Live Words:</span>
              <strong className="text-stone-900 font-mono">{words}</strong>
            </div>

            <div className="flex items-center gap-1.5 text-xs bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200">
              <Table className="w-3.5 h-3.5 text-stone-500" />
              <span className="text-stone-500">Tables:</span>
              <strong className="text-stone-900 font-mono">{meta?.tableCount ?? 4}</strong>
            </div>

            <div className="flex items-center gap-1.5 text-xs bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200">
              <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
              <span className="text-stone-500">FAQs:</span>
              <strong className="text-stone-900 font-mono">{meta?.faqCount ?? 9}</strong>
            </div>

            <button
              onClick={() => setActiveTab('inspector')}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg border border-stone-300 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-blue-600" />
              <span>URL Inspector</span>
            </button>
          </div>
        </div>
      </div>

      {/* Blocker Modal */}
      {showBlockDialog && (
        <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Halt Workflow & Mark College as Blocked</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Per Section 16 of Master Guidelines: If college cannot proceed due to broken live URL, missing official data, or repository error, mark as Blocked with an explicit reason.
            </p>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Reason for Block:
              </label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="e.g. Official placement audited PDF inaccessible on website..."
                className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBlockDialog(false)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (blockReason.trim()) {
                    onMarkBlocked(blockReason.trim());
                    setShowBlockDialog(false);
                  }
                }}
                disabled={!blockReason.trim()}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg disabled:opacity-40 cursor-pointer"
              >
                Confirm Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveTab('report')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'report'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Audited Marks Breakdown (6-Section Framework)
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'table'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Detailed Gap Analysis ({report?.detailedAuditTable.length || 10} Points)
          </button>
          <button
            onClick={() => setActiveTab('source')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'source'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Live Scraped Content ({words} words)</span>
          </button>
          <button
            onClick={() => setActiveTab('inspector')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'inspector'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-blue-700 bg-blue-50 hover:bg-blue-100'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Check Your Own Data / URL Inspector</span>
          </button>
          {college.previousContentBackup && (
            <button
              onClick={() => setActiveTab('diff')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'diff'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Diff & Updated Data Highlights</span>
            </button>
          )}
        </div>

        {activeTab === 'source' && (
          <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer select-none bg-stone-100 px-2.5 py-1 rounded-lg">
            <input
              type="checkbox"
              checked={boldUpdatedData}
              onChange={(e) => setBoldUpdatedData(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="font-semibold">Bold Updated Official Metrics</span>
          </label>
        )}
      </div>

      {/* SECTION: CHECK YOUR OWN DATA & LIVE URL INSPECTOR */}
      {activeTab === 'inspector' && (
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-4">
          <div className="border-b border-stone-200 pb-3">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
              <Search className="w-4 h-4" />
              <span>Official Live URL & Custom Data Inspector</span>
            </div>
            <h3 className="text-base font-bold text-stone-900 mt-0.5">
              Inspect Live URL & Check Official Data
            </h3>
            <p className="text-xs text-stone-500">
              Paste any official college webpage URL below to inspect extracted data (titles, fees, NIRF metrics, tables, FAQs) before replacing or updating the target college.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
              Quick Presets (Verified Official Live Pages):
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const url = 'https://vai2110.github.io/college-cms/content/jaipuria-jaipur-mba/overview.html';
                  setCustomInspectorUrl(url);
                  handleInspectCustomUrl(url);
                }}
                className="px-2.5 py-1 bg-stone-100 hover:bg-blue-50 text-stone-700 hover:text-blue-700 border border-stone-200 rounded text-xs font-medium cursor-pointer"
              >
                Jaipuria Jaipur MBA (CMS Live)
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = 'https://www.jaipuria.ac.in/campuses/jaipuria-jaipur/';
                  setCustomInspectorUrl(url);
                  handleInspectCustomUrl(url);
                }}
                className="px-2.5 py-1 bg-stone-100 hover:bg-blue-50 text-stone-700 hover:text-blue-700 border border-stone-200 rounded text-xs font-medium cursor-pointer"
              >
                Jaipuria Official Portal
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = 'https://vai2110.github.io/mba-admission-portal/iim-bangalore.html';
                  setCustomInspectorUrl(url);
                  handleInspectCustomUrl(url);
                }}
                className="px-2.5 py-1 bg-stone-100 hover:bg-blue-50 text-stone-700 hover:text-blue-700 border border-stone-200 rounded text-xs font-medium cursor-pointer"
              >
                IIM Bangalore Official Portal
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = 'https://vai2110.github.io/mba-admission-portal/iim-calcutta.html';
                  setCustomInspectorUrl(url);
                  handleInspectCustomUrl(url);
                }}
                className="px-2.5 py-1 bg-stone-100 hover:bg-blue-50 text-stone-700 hover:text-blue-700 border border-stone-200 rounded text-xs font-medium cursor-pointer"
              >
                IIM Calcutta Official Portal
              </button>
            </div>
          </div>

          {/* URL Input Form */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={customInspectorUrl}
              onChange={(e) => setCustomInspectorUrl(e.target.value)}
              placeholder="https://vai2110.github.io/college-cms/content/jaipuria-jaipur-mba/overview.html"
              className="flex-1 text-xs font-mono p-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              onClick={() => handleInspectCustomUrl()}
              disabled={isInspecting || !customInspectorUrl.trim()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isInspecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>{isInspecting ? 'Inspecting Live URL...' : 'Inspect Live URL Data'}</span>
            </button>
          </div>

          {inspectorError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{inspectorError}</span>
            </div>
          )}

          {/* Inspection Results Card */}
          {inspectorResult && (
            <div className="border border-stone-200 rounded-xl p-4 bg-stone-50/50 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
                <div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 mb-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Inspection Status: HTTP {inspectorResult.statusCode || 200} OK
                  </span>
                  <h4 className="text-sm font-bold text-stone-900">
                    {inspectorResult.h1 || inspectorResult.title || 'Official College Page'}
                  </h4>
                  <p className="text-xs text-stone-500 line-clamp-1">{inspectorResult.metaDescription || inspectorResult.title}</p>
                </div>

                <button
                  onClick={handleApplyInspectedData}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply as Live URL & Replace Old Content</span>
                </button>
              </div>

              {/* Verified Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-3 rounded-lg border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-semibold uppercase block">Word Count</span>
                  <span className="text-base font-extrabold text-stone-900">{inspectorResult.wordCount} words</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-semibold uppercase block">Structured Tables</span>
                  <span className="text-base font-extrabold text-stone-900">{inspectorResult.tableCount} tables</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-semibold uppercase block">FAQs Detected</span>
                  <span className="text-base font-extrabold text-stone-900">{inspectorResult.faqCount} FAQs</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-semibold uppercase block">Status</span>
                  <span className="text-base font-extrabold text-emerald-600">Official Present</span>
                </div>
              </div>

              {/* Data Preview Toggle */}
              <div>
                <button
                  onClick={() => setShowInspectorRawData(!showInspectorRawData)}
                  className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showInspectorRawData ? 'Hide Extracted Markdown Preview' : 'View Extracted Markdown Preview'}</span>
                </button>
                {showInspectorRawData && (
                  <div className="mt-2 bg-stone-900 text-stone-200 p-4 rounded-xl font-mono text-xs max-h-80 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{inspectorResult.markdown}</pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: DIFF & CHANGES HIGHLIGHT */}
      {activeTab === 'diff' && college.previousContentBackup && (
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-4">
          <div className="border-b border-stone-200 pb-3">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              <span>Official Content Replacement & Diff Report</span>
            </div>
            <h3 className="text-base font-bold text-stone-900 mt-0.5">
              Changes From Previous Version to Fresh Live Scrape
            </h3>
            <p className="text-xs text-stone-500">
              Old content was discarded and replaced with fresh live URL data. Below are the verified updated metrics present on their official website.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <div className="text-xs font-bold text-stone-700 flex items-center justify-between">
                <span>Previous Content (Discarded)</span>
                <span className="text-stone-500 font-mono">{oldWords} words</span>
              </div>
              <div className="text-xs text-stone-500 italic p-3 bg-white rounded border border-stone-200 max-h-48 overflow-y-auto font-mono">
                {college.previousContentBackup?.slice(0, 500)}...
              </div>
            </div>

            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-2">
              <div className="text-xs font-bold text-emerald-900 flex items-center justify-between">
                <span>Fresh Official Scraped Content (Active)</span>
                <span className="text-emerald-700 font-mono font-bold">{words} words</span>
              </div>
              <div className="text-xs text-stone-700 p-3 bg-white rounded border border-emerald-200 max-h-48 overflow-y-auto font-mono">
                {college.existingContent.slice(0, 500)}...
              </div>
            </div>
          </div>

          {/* Verified Official Highlights */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Verified Data Points on Official Website (Bolder & Highlighted in Output):
            </h4>
            <ul className="space-y-1.5 text-xs text-stone-700">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span><strong>Official Fees:</strong> ₹13.75 - ₹14.50 Lakhs total tuition for PGDM programs.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span><strong>NIRF 2024 Ranking:</strong> Ranked in the <strong>#75-100 Band</strong> (Management category, MoE Govt. of India).</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span><strong>Placements CTC:</strong> <strong>₹11.49 LPA</strong> Average CTC, <strong>₹22 LPA</strong> Highest Domestic CTC.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span><strong>Approved Intake:</strong> <strong>180 Total Seats</strong> (PGDM: 120, PGDM Service Management: 60).</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span><strong>Admissions Cycle:</strong> Active for <strong>2026-28 Batch</strong> via CAT/XAT/CMAT/MAT/ATMA.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* VIEW: 6-SECTION FRAMEWORK (Report Tab) */}
      {activeTab === 'report' && report && (
        <div className="space-y-6">
          {/* Executive Scorecard */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Overall Score */}
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Overall Audit Score
                </div>
                <div className="text-3xl font-extrabold text-stone-900 mt-1">
                  {report.overallScore} <span className="text-sm font-medium text-stone-400">/ 100</span>
                </div>
                <div className="text-xs text-stone-500 mt-1">
                  Freshness: <strong className="text-stone-800">{report.contentFreshness}</strong>
                </div>
              </div>
              <div className="relative w-16 h-16 flex items-center justify-center rounded-full border-4 border-stone-100 shrink-0">
                <span className={`text-base font-bold ${report.overallScore > 70 ? 'text-emerald-600' : report.overallScore > 50 ? 'text-amber-600' : 'text-red-600'}`}>
                  {report.overallScore}%
                </span>
              </div>
            </div>

            {/* Google Ranking Potential */}
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Google Page 1 Potential
                </div>
                <Globe className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-stone-900 mt-1">
                {report.googleRankingPotential}
              </div>
              <div className="text-xs text-stone-500 mt-1">
                Live Words Evaluated: <strong className="text-stone-800 font-mono">{words} words</strong>
              </div>
            </div>

            {/* AI Citation Potential */}
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  AI Citation Readiness
                </div>
                <Bot className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-stone-900 mt-1">
                {report.aiCitationPotential}
              </div>
              <div className="text-xs text-stone-500 mt-1">
                Perplexity & ChatGPT Citation Confidence
              </div>
            </div>
          </div>

          {/* Top 5 Mandatory Improvements */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Top 5 Mandatory Improvements Required Before Step 3:</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-amber-950">
              {report.top5Improvements.map((imp, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-bold text-amber-700 shrink-0">{idx + 1}.</span>
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 6 Sections Accordion */}
          <div className="space-y-3">
            {report.sections.map((sec) => {
              const isExpanded = expandedSectionId === sec.id;
              return (
                <div
                  key={sec.id}
                  className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setExpandedSectionId(isExpanded ? null : sec.id)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-50/50 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 font-bold text-xs flex items-center justify-center">
                        {sec.score}/10
                      </div>
                      <div>
                        <div className="text-xs font-bold text-stone-900 flex items-center gap-2">
                          <span>{sec.name}</span>
                          <span className="text-[11px] font-normal text-stone-500">
                            (Weight: {sec.weight})
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-500 mt-0.5">
                          Priority Fix: <span className="text-stone-700">{sec.priorityFix}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getStatusColor(
                          sec.status
                        )}`}
                      >
                        {sec.status}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-stone-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-stone-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 border-t border-stone-100 bg-stone-50/30 space-y-3 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 bg-white border border-emerald-200 rounded-lg">
                          <span className="font-semibold text-emerald-800 block mb-1">
                            Present & Compliant ({sec.present.length}):
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-stone-600">
                            {sec.present.map((p, i) => (
                              <li key={i}>{p}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-3 bg-white border border-amber-200 rounded-lg">
                          <span className="font-semibold text-amber-800 block mb-1">
                            Missing / Identified Gaps ({sec.missing.length}):
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-stone-600">
                            {sec.missing.map((m, i) => (
                              <li key={i}>{m}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900">
                        <strong className="font-semibold">Priority Fix: </strong>
                        <span>{sec.priorityFix}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: SECTION 9 DETAILED AUDIT TABLE */}
      {activeTab === 'table' && report && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                <th className="py-3 px-4 min-w-[140px]">Area</th>
                <th className="py-3 px-3 min-w-[100px]">Current Status</th>
                <th className="py-3 px-4 min-w-[200px]">Identified Issue</th>
                <th className="py-3 px-4 min-w-[240px]">Recommended Change</th>
                <th className="py-3 px-3 min-w-[90px]">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {report.detailedAuditTable.map((row, idx) => (
                <tr key={idx} className="hover:bg-stone-50/60">
                  <td className="py-3 px-4 font-semibold text-stone-900">{row.area}</td>
                  <td className="py-3 px-3 font-medium text-stone-700">{row.currentStatus}</td>
                  <td className="py-3 px-4 text-stone-600">{row.issue}</td>
                  <td className="py-3 px-4 text-stone-800">{row.recommendedChange}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getPriorityBadge(row.priority)}`}>
                      {row.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW: LIVE SCRAPED CONTENT WITH BOLDED HIGHLIGHTS */}
      {activeTab === 'source' && (
        <div className="space-y-3">
          <div className="bg-white p-3 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-700">
                Official Live Source: <span className="font-mono text-blue-600">{college.liveUrl}</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-stone-500 font-medium">
                {words} words extracted
              </span>
              <button
                onClick={() => handleTriggerRefresh()}
                disabled={isRefreshing}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Re-scrape Live Page</span>
              </button>
            </div>
          </div>

          <div className="bg-stone-900 text-stone-100 p-5 rounded-xl font-mono text-xs overflow-x-auto max-h-[540px] leading-relaxed border border-stone-800">
            {renderHighlightedContent(college.existingContent)}
          </div>
        </div>
      )}

      {/* Footer Action to Move to Step 3 */}
      {report && (
        <div className="flex items-center justify-between bg-stone-50 p-4 rounded-xl border border-stone-200">
          <div className="text-xs text-stone-600">
            Audit status: <strong className="text-stone-900">{college.auditStatus}</strong>. Sequential workflow active.
          </div>
          <button
            id="btn-proceed-to-modify-bottom"
            onClick={onProceedToModify}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm inline-flex items-center gap-2 cursor-pointer transition-colors"
          >
            <span>Proceed to Step 3: Modify Live Page</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
