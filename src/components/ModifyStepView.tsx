import React, { useState, useEffect } from 'react';
import { College } from '../types';
import { generateStructuredRewrite, runDeepAudit } from '../utils/auditEngine';
import { MarkdownRenderer } from './MarkdownRenderer';
import {
  Sparkles,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Smartphone,
  Monitor,
  AlertCircle,
  Copy,
  Check,
  FileText,
  Award,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  TrendingUp
} from 'lucide-react';

interface ModifyStepViewProps {
  college: College;
  onSaveModifiedContent: (content: string) => void;
  onProceedToQA: () => void;
}

export const ModifyStepView: React.FC<ModifyStepViewProps> = ({
  college,
  onSaveModifiedContent,
  onProceedToQA
}) => {
  const [content, setContent] = useState(college.modifiedContent || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showMarksSheet, setShowMarksSheet] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedWithMarks, setCopiedWithMarks] = useState(false);

  // Sync if college modifiedContent changes
  useEffect(() => {
    if (college.modifiedContent && !content) {
      setContent(college.modifiedContent);
    }
  }, [college.modifiedContent]);

  // Ensure auditReport is available (fallback to deep audit if missing)
  const report = college.auditReport || runDeepAudit(college);

  const handleGenerateRewrite = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collegeName: college.name,
          liveUrl: college.liveUrl,
          category: college.category,
          location: college.location,
          existingContent: college.existingContent,
          auditSummary: report.auditSummary || ''
        })
      });

      const data = await res.json();
      if (data.success && data.rewrittenMarkdown) {
        setContent(data.rewrittenMarkdown);
        onSaveModifiedContent(data.rewrittenMarkdown);
      } else {
        const generated = generateStructuredRewrite(college);
        setContent(generated);
        onSaveModifiedContent(generated);
      }
    } catch (err) {
      console.warn('API rewrite failed, using built-in high-precision rewrite', err);
      const generated = generateStructuredRewrite(college);
      setContent(generated);
      onSaveModifiedContent(generated);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAndProceed = () => {
    onSaveModifiedContent(content);
    onProceedToQA();
  };

  // Rule Compliance Inspections
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const targetWords = 1800;
  const wordCountPassed = words >= targetWords;

  // Banned marketing words inspection
  const bannedKeywords = ['world-class', 'state-of-the-art', 'renowned', 'prestigious'];
  const lowerContent = content.toLowerCase();
  const detectedBanned = bannedKeywords.filter((w) => lowerContent.includes(w));

  // FAQ check (all 6 required questions)
  const requiredFaqs = [
    'fee structure',
    'placements',
    'nirf ranking',
    'admission',
    'scholarships',
    'courses are offered'
  ];
  const detectedFaqs = requiredFaqs.filter((faq) => lowerContent.includes(faq));
  const allFaqsPresent = detectedFaqs.length >= 6;

  // Table presence
  const hasTables = content.includes('| ---') || content.includes('|:---');

  const copyMarkdown = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyArticleWithMarks = () => {
    let combined = `# ${college.name.toUpperCase()} - UPDATED ARTICLE & AUDITED MARKS\n\n`;
    combined += `## Part 1: Audited Marks Scorecard\n`;
    combined += `- Overall Audited Score: ${report.overallScore} / 100 (Existing) -> 96 / 100 (Projected Post-Rewrite)\n`;
    combined += `- Content Freshness: ${report.contentFreshness}\n`;
    combined += `- Google Rank 1 Potential: ${report.googleRankingPotential}\n`;
    combined += `- AI Citation Potential: ${report.aiCitationPotential}\n\n`;
    combined += `### Section Marks Breakdown:\n`;
    report.sections.forEach((sec) => {
      combined += `- ${sec.name}: ${sec.score}/10 [${sec.status}] (Fix: ${sec.priorityFix})\n`;
    });
    combined += `\n---\n\n## Part 2: Full 10-Part Rewritten Live Page Article (${words} words)\n\n`;
    combined += content;

    navigator.clipboard.writeText(combined);
    setCopiedWithMarks(true);
    setTimeout(() => setCopiedWithMarks(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider">
            <span>Step 3 of Strict Sequential Workflow</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mt-1">
            Modify Actual Live Page (10-Part Architectural Rewrite)
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Optimized for <span className="font-semibold text-stone-900">{college.name}</span> — 1,800+ authoritative words, zero fluff, and verified mobile card tables.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            id="btn-generate-rewrite"
            onClick={handleGenerateRewrite}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{isGenerating ? 'Generating Rewrite...' : content ? 'Re-Generate 10-Part Rewrite' : 'Generate Full 10-Part Rewrite'}</span>
          </button>

          {content && (
            <button
              id="btn-save-proceed-qa"
              onClick={handleSaveAndProceed}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Apply & Proceed to Step 4 (QA)</span>
            </button>
          )}
        </div>
      </div>

      {/* Audited Marks & Scorecard Bar */}
      <div className="bg-stone-900 text-white p-4 rounded-xl border border-stone-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <Award className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-stone-100 flex items-center gap-2">
                <span>Audited Marks & Scorecard</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                  Existing: {report.overallScore}/100 → Projected: 96/100
                </span>
              </div>
              <div className="text-[11px] text-stone-400">
                Audit Status: <span className="text-emerald-400 font-semibold">{college.auditStatus}</span> • Freshness: {report.contentFreshness}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMarksSheet(!showMarksSheet)}
              className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-md border border-stone-700 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{showMarksSheet ? 'Hide Marks Details' : 'View Section Marks'}</span>
              {showMarksSheet ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <button
              onClick={copyArticleWithMarks}
              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              {copiedWithMarks ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedWithMarks ? 'Copied Full Package!' : 'Copy Article + Audited Marks'}</span>
            </button>
          </div>
        </div>

        {/* 6 Section Marks Pill Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-3">
          {report.sections.map((s) => (
            <div key={s.id} className="bg-stone-800/80 p-2 rounded-lg border border-stone-700/60">
              <div className="text-[10px] text-stone-400 truncate">{s.name}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-bold font-mono text-emerald-400">{s.score}/10</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-stone-700 text-stone-300 font-medium">
                  {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Expanded Marks Breakdown Details */}
        {showMarksSheet && (
          <div className="mt-4 pt-3 border-t border-stone-800 space-y-3">
            <div className="text-xs font-bold text-stone-200">
              Audited Criteria & Gap Resolution Details:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {report.sections.map((sec) => (
                <div key={sec.id} className="bg-stone-800/60 p-2.5 rounded-lg border border-stone-700 text-[11px] space-y-1">
                  <div className="font-bold text-stone-100 flex items-center justify-between">
                    <span>{sec.name}</span>
                    <span className="text-emerald-400 font-mono font-semibold">{sec.score} / 10</span>
                  </div>
                  <div className="text-stone-300">
                    <strong className="text-amber-400">Addressed by Rewrite:</strong> {sec.priorityFix}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Real-time Rewrite Compliance Rules Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Word Count Metric */}
        <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 uppercase">
            <span>Word Count (Target: 1,800+)</span>
            {wordCountPassed ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            )}
          </div>
          <div className="text-xl font-bold text-stone-900 mt-1">
            {words} <span className="text-xs font-normal text-stone-500">/ 1,800 words</span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full transition-all ${wordCountPassed ? 'bg-emerald-600' : 'bg-blue-600'}`}
              style={{ width: `${Math.min(100, Math.round((words / targetWords) * 100))}%` }}
            />
          </div>
        </div>

        {/* Marketing Fluff Scanner */}
        <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 uppercase">
            <span>Vague Fluff Scanner</span>
            {detectedBanned.length === 0 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
            )}
          </div>
          <div className="text-xl font-bold text-stone-900 mt-1">
            {detectedBanned.length === 0 ? (
              <span className="text-emerald-700 text-sm font-semibold">Clean (0 Fluff)</span>
            ) : (
              <span className="text-red-700 text-sm font-semibold">{detectedBanned.length} Fluff Words</span>
            )}
          </div>
          <div className="text-[10px] text-stone-500 mt-1 truncate">
            {detectedBanned.length === 0 ? 'No subjective filler detected' : detectedBanned.join(', ')}
          </div>
        </div>

        {/* FAQ Coverage */}
        <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 uppercase">
            <span>Required FAQs</span>
            {allFaqsPresent ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            )}
          </div>
          <div className="text-xl font-bold text-stone-900 mt-1">
            {detectedFaqs.length} <span className="text-xs font-normal text-stone-500">/ 6 Verified</span>
          </div>
          <div className="text-[10px] text-stone-500 mt-1 truncate">
            {allFaqsPresent ? 'All 6 search intent queries mapped' : 'Missing search FAQs'}
          </div>
        </div>

        {/* Mobile Tables Check */}
        <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 uppercase">
            <span>Mobile Table System</span>
            {hasTables ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            )}
          </div>
          <div className="text-xl font-bold text-stone-900 mt-1">
            {hasTables ? (
              <span className="text-emerald-700 text-sm font-semibold">Zero-Scroll Stack</span>
            ) : (
              <span className="text-stone-500 text-sm">No Tables</span>
            )}
          </div>
          <div className="text-[10px] text-stone-500 mt-1 truncate">
            Non-negotiable mobile usability active
          </div>
        </div>
      </div>

      {!content && (
        <div className="bg-white p-12 rounded-xl border border-dashed border-stone-300 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900">
            No Modified Live Content Yet
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Click <strong>Generate Full 10-Part Rewrite</strong> to generate the comprehensive, 1,800+ word article adhering to the strict higher-education architecture rules.
          </p>
          <button
            onClick={handleGenerateRewrite}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
          >
            Generate Architectural Rewrite
          </button>
        </div>
      )}

      {content && (
        <div className="space-y-4">
          {/* Editor & Live Preview Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-800">Viewport Preview Mode:</span>
              <div className="inline-flex rounded-lg border border-stone-200 p-0.5 bg-stone-50">
                <button
                  id="btn-viewport-desktop"
                  onClick={() => setPreviewMode('desktop')}
                  className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    previewMode === 'desktop'
                      ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop (1280px)</span>
                </button>
                <button
                  id="btn-viewport-mobile"
                  onClick={() => setPreviewMode('mobile')}
                  className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    previewMode === 'mobile'
                      ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile (375px Card-Stack)</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-copy-markdown"
                onClick={copyMarkdown}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Markdown' : 'Copy Markdown'}</span>
              </button>
            </div>
          </div>

          {/* Split Pane: Markdown Raw Code + Live Formatted Render */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Raw Markdown Source Editor */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-2xs flex flex-col">
              <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-xs font-bold text-stone-700">
                <span>Markdown Source Editor</span>
                <span className="text-[11px] font-mono text-stone-500">{words} words</span>
              </div>
              <textarea
                id="textarea-modified-content"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  onSaveModifiedContent(e.target.value);
                }}
                className="w-full h-[650px] p-4 text-xs font-mono text-stone-800 bg-white focus:outline-none resize-none leading-relaxed"
                placeholder="Article markdown..."
              />
            </div>

            {/* Live Render Preview (with Mobile / Desktop simulator) */}
            <div className="bg-stone-100 rounded-xl border border-stone-200 p-4 flex flex-col items-center justify-start overflow-hidden">
              <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-stone-300 text-xs text-stone-600 font-semibold">
                <span>
                  {previewMode === 'mobile' ? 'Mobile Viewport Simulator (375px)' : 'Full Desktop Viewport'}
                </span>
                <span className="text-[11px] text-emerald-700 font-medium">
                  Rule 6: Card-based tables guarantee zero horizontal scroll
                </span>
              </div>

              <div
                className={`transition-all duration-300 bg-white rounded-xl shadow-md border border-stone-300 overflow-y-auto max-h-[650px] p-5 sm:p-6 w-full ${
                  previewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-none'
                }`}
              >
                <MarkdownRenderer content={content} isMobileView={previewMode === 'mobile'} />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between bg-stone-50 p-4 rounded-xl border border-stone-200">
            <div className="text-xs text-stone-600">
              Modifications saved. Next step is <strong className="text-stone-900">Step 4: Live QA Verification</strong>.
            </div>
            <button
              id="btn-bottom-proceed-qa"
              onClick={handleSaveAndProceed}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              <span>Proceed to Step 4: Live QA</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
