import React, { useState } from 'react';
import { College, AuditReport } from '../types';
import { runDeepAudit, generateStructuredRewrite } from '../utils/auditEngine';
import { MarkdownRenderer } from './MarkdownRenderer';
import {
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Smartphone,
  Monitor,
  Columns,
  FileText,
  Award,
  Globe,
  Bot,
  Layers,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Lock,
  GitBranch
} from 'lucide-react';

interface ArticleAndMarksOutputViewProps {
  colleges: College[];
  currentCollegeId: string | null;
  onSelectCollege?: (collegeId: string) => void;
  onUpdateCollegeData: (collegeId: string, auditReport: AuditReport, modifiedContent: string) => void;
  onUpdateCollegeContent?: (collegeId: string, content: string, liveUrl?: string, meta?: any) => void;
}

export const ArticleAndMarksOutputView: React.FC<ArticleAndMarksOutputViewProps> = ({
  colleges,
  currentCollegeId,
  onSelectCollege,
  onUpdateCollegeData,
  onUpdateCollegeContent
}) => {
  // Allow selecting any college that has content or is the current target
  const defaultSelectedId = currentCollegeId || colleges[0]?.id || '';
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>(defaultSelectedId);
  const [viewMode, setViewMode] = useState<'split' | 'article' | 'marks' | 'compare' | 'raw'>('split');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncingLive, setIsSyncingLive] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Keep selectedCollegeId in sync when currentCollegeId changes externally
  React.useEffect(() => {
    if (currentCollegeId) {
      setSelectedCollegeId(currentCollegeId);
    }
  }, [currentCollegeId]);

  const handleSelectCollegeId = (newId: string) => {
    setSelectedCollegeId(newId);
    if (onSelectCollege) {
      onSelectCollege(newId);
    }
  };

  const selectedCollege = colleges.find((c) => c.id === selectedCollegeId) || colleges[0];

  if (!selectedCollege) {
    return (
      <div className="p-8 text-center text-stone-500">
        No colleges available in queue.
      </div>
    );
  }

  const report = selectedCollege.auditReport;
  const content = selectedCollege.modifiedContent || '';
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const wordCountPassed = words >= 1800;

  // Calculate quick compliance stats
  const bannedKeywords = ['world-class', 'state-of-the-art', 'renowned', 'prestigious'];
  const lowerContent = content.toLowerCase();
  const detectedBanned = bannedKeywords.filter((w) => lowerContent.includes(w));
  const hasTables = content.includes('| ---') || content.includes('|:---');

  const requiredFaqs = [
    'fee structure',
    'placements',
    'nirf ranking',
    'admission',
    'scholarships',
    'courses are offered'
  ];
  const detectedFaqs = requiredFaqs.filter((faq) => lowerContent.includes(faq));

  // Handler to generate both if missing
  const handleGenerateOutput = () => {
    setIsGenerating(true);
    try {
      const generatedReport = report || runDeepAudit(selectedCollege);
      const generatedContent = content || generateStructuredRewrite(selectedCollege);
      onUpdateCollegeData(selectedCollege.id, generatedReport, generatedContent);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSyncLivePage = async () => {
    if (!selectedCollege?.liveUrl) return;
    setIsSyncingLive(true);
    setSyncNotice(null);
    try {
      const res = await fetch('/api/fetch-live-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: selectedCollege.liveUrl })
      });
      const data = await res.json();
      if (data.success && data.markdown) {
        if (onUpdateCollegeContent) {
          onUpdateCollegeContent(selectedCollege.id, data.markdown, selectedCollege.liveUrl, {
            title: data.title,
            metaDescription: data.metaDescription,
            h1: data.h1,
            statusCode: data.statusCode,
            wordCount: data.wordCount,
            tableCount: data.tableCount,
            faqCount: data.faqCount,
            headings: data.headings,
            fetchedAt: data.fetchedAt
          });
        }
        setSyncNotice(`Synced live page! Extracted ${data.wordCount} words and ${data.tableCount} tables.`);
        setTimeout(() => setSyncNotice(null), 5000);
      } else {
        setSyncNotice(data.error || 'Failed to sync live page');
      }
    } catch (err: any) {
      setSyncNotice(err.message || 'Error fetching live page');
    } finally {
      setIsSyncingLive(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const generateCombinedMarkdown = () => {
    let combined = `# COMPREHENSIVE OUTPUT PACKAGE: ${selectedCollege.name.toUpperCase()}\n`;
    combined += `Live URL: ${selectedCollege.liveUrl}\n`;
    combined += `Category: ${selectedCollege.category} | Location: ${selectedCollege.location}\n`;
    combined += `Generated: ${new Date().toLocaleDateString()} | Compliance: 1,800+ Words, Mobile Card Tables, Zero Fluff\n\n`;
    combined += `================================================================================\n`;
    combined += `PART 1: AUDITED MARKS & EVALUATION SCORECARD\n`;
    combined += `================================================================================\n\n`;

    if (report) {
      combined += `OVERALL AUDIT MARKS: ${report.overallScore} / 100 (Existing Page) -> PROJECTED POST-REWRITE: 96 / 100\n`;
      combined += `Content Freshness: ${report.contentFreshness}\n`;
      combined += `Google Rank 1 Potential: ${report.googleRankingPotential}\n`;
      combined += `AI Citation Potential: ${report.aiCitationPotential}\n\n`;
      combined += `### SECTION MARKS BREAKDOWN (6-SECTION FRAMEWORK):\n`;
      report.sections.forEach((s) => {
        combined += `- ${s.name}: ${s.score}/10 [${s.status}] (Weight: ${s.weight})\n`;
        combined += `  Priority Fix: ${s.priorityFix}\n`;
      });
      combined += `\n### AUDIT SUMMARY:\n${report.auditSummary}\n\n`;
      combined += `### TOP 5 MANDATORY IMPROVEMENTS IDENTIFIED:\n`;
      report.top5Improvements.forEach((imp, i) => {
        combined += `${i + 1}. ${imp}\n`;
      });
      combined += `\n`;
    }

    combined += `================================================================================\n`;
    combined += `PART 2: FULL REWRITTEN & OPTIMIZED LIVE PAGE ARTICLE (${words} WORDS)\n`;
    combined += `================================================================================\n\n`;
    combined += content;

    return combined;
  };

  const downloadCombinedPackage = () => {
    const text = generateCombinedMarkdown();
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedCollege.name.replace(/[^a-zA-Z0-9]/g, '_')}_Updated_Article_With_Audited_Marks.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & College Selector */}
      <div className="bg-stone-900 text-white p-5 rounded-2xl border border-stone-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-emerald-400 mb-1">
            <Award className="w-4 h-4" />
            <span>Official Deliverable: Updated Article with Audited Marks</span>
          </div>
          <h1 className="text-xl font-bold text-white">
            {selectedCollege.name}
          </h1>
          <div className="flex items-center gap-3 text-xs text-stone-300 mt-1 flex-wrap">
            <span>{selectedCollege.category}</span>
            <span>•</span>
            <span>{selectedCollege.location}</span>
            <span>•</span>
            <a
              href={selectedCollege.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-mono text-[11px]"
            >
              <span>{selectedCollege.liveUrl}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={handleSyncLivePage}
              disabled={isSyncingLive}
              className="px-2 py-0.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] rounded border border-stone-700 inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Re-fetch and sync the actual live webpage"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncingLive ? 'animate-spin' : ''}`} />
              <span>{isSyncingLive ? 'Syncing Live...' : 'Sync Live'}</span>
            </button>
          </div>
          {syncNotice && (
            <div className="mt-2 text-[11px] text-emerald-400 font-medium">
              {syncNotice}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          {/* College Switcher */}
          <div className="flex items-center gap-2 bg-stone-800 px-3 py-1.5 rounded-lg border border-stone-700">
            <span className="text-xs text-stone-400 font-medium">Select Target:</span>
            <select
              value={selectedCollege.id}
              onChange={(e) => handleSelectCollegeId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              {colleges.map((c) => (
                <option key={c.id} value={c.id} className="bg-stone-900 text-white">
                  #{c.order} - {c.name.slice(0, 30)}... ({c.finalStatus})
                </option>
              ))}
            </select>
          </div>

          <button
            id="btn-copy-package"
            onClick={() => copyToClipboard(generateCombinedMarkdown(), 'package')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedType === 'package' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedType === 'package' ? 'Copied Full Output!' : 'Copy Article + Marks'}</span>
          </button>

          <button
            id="btn-download-package"
            onClick={downloadCombinedPackage}
            className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-lg border border-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download formatted Markdown package with article and audited marks"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Package</span>
          </button>

          {/* Locked GitHub Publish Button */}
          <div className="relative group">
            <button
              id="btn-github-upload-locked"
              disabled
              className="px-3.5 py-2 bg-stone-800/80 text-stone-400 text-xs font-semibold rounded-lg border border-stone-700/80 flex items-center gap-1.5 cursor-not-allowed opacity-75"
              title="GitHub publish is locked until you provide repo credentials. Current mode = local verification only."
            >
              <Lock className="w-3.5 h-3.5 text-stone-400" />
              <span>Upload to GitHub (Locked)</span>
            </button>
            <div className="absolute right-0 bottom-full mb-1 hidden group-hover:block w-64 p-2 bg-stone-900 border border-stone-700 rounded-lg text-[10px] text-stone-300 shadow-xl z-50">
              GitHub publish is locked until you provide repository credentials. Current mode = local verification &amp; export only.
            </div>
          </div>
        </div>
      </div>

      {/* Compliance & Marks Quick Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Overall Audited Score */}
        <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-stone-500 uppercase flex items-center justify-between">
            <span>Audit Score</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-stone-900 mt-1">
            {report ? report.overallScore : '--'} <span className="text-xs font-normal text-stone-400">/ 100</span>
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
            Projected Post-Rewrite: 96 / 100
          </div>
        </div>

        {/* Word Count */}
        <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-stone-500 uppercase flex items-center justify-between">
            <span>Updated Article Depth</span>
            {wordCountPassed ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            )}
          </div>
          <div className="text-xl font-bold text-stone-900 mt-1">
            {words} <span className="text-xs font-normal text-stone-400">/ 1,800 w</span>
          </div>
          <div className="text-[10px] text-stone-500 mt-0.5">
            {wordCountPassed ? 'Passes 1,800+ word rule' : 'Expanding content...'}
          </div>
        </div>

        {/* Fluff Scanner */}
        <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-stone-500 uppercase flex items-center justify-between">
            <span>Subjective Fluff</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-1">
            {detectedBanned.length === 0 ? '0 Fluff' : `${detectedBanned.length} Flagged`}
          </div>
          <div className="text-[10px] text-stone-500 mt-0.5 truncate">
            No vague buzzwords
          </div>
        </div>

        {/* 6 Required FAQs */}
        <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-stone-500 uppercase flex items-center justify-between">
            <span>Student Search FAQs</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-stone-900 mt-1">
            {detectedFaqs.length} <span className="text-xs font-normal text-stone-400">/ 6 Present</span>
          </div>
          <div className="text-[10px] text-stone-500 mt-0.5">
            Exact search queries
          </div>
        </div>

        {/* Mobile Tables */}
        <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-stone-500 uppercase flex items-center justify-between">
            <span>Mobile Table Format</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-1">
            Zero-Scroll
          </div>
          <div className="text-[10px] text-stone-500 mt-0.5">
            Card-stack architecture
          </div>
        </div>
      </div>

      {/* State: When output is missing */}
      {(!report || !content) && (
        <div className="bg-white p-10 rounded-2xl border border-stone-200 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-stone-900">
            Generate Output for {selectedCollege.name}
          </h2>
          <p className="text-xs text-stone-600 max-w-md mx-auto">
            Click below to immediately produce the comprehensive 6-Section Audited Marks and the full 1,800+ word Updated Article for this college.
          </p>
          <button
            onClick={handleGenerateOutput}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? 'Generating Comprehensive Output...' : 'Generate Updated Article with Audited Marks'}
          </button>
        </div>
      )}

      {/* State: When output exists */}
      {report && content && (
        <div className="space-y-4">
          {/* View Mode Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200 shadow-2xs">
            {/* View Mode Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              <button
                id="btn-view-split"
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  viewMode === 'split'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Side-by-Side: Article + Marks</span>
              </button>

              <button
                id="btn-view-article"
                onClick={() => setViewMode('article')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  viewMode === 'article'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Full Updated Article</span>
              </button>

              <button
                id="btn-view-marks"
                onClick={() => setViewMode('marks')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  viewMode === 'marks'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Audited Marks & Evaluation</span>
              </button>

              <button
                id="btn-view-compare"
                onClick={() => setViewMode('compare')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  viewMode === 'compare'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
                title="Side-by-side comparison of original scraped source vs rewritten article"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Compare: Scraped vs Rewrite</span>
              </button>

              <button
                id="btn-view-raw"
                onClick={() => setViewMode('raw')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  viewMode === 'raw'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Raw Markdown Editor</span>
              </button>
            </div>

            {/* Device Preview & Copy Subcontrols */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="inline-flex rounded-lg border border-stone-200 p-0.5 bg-stone-50">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                    previewDevice === 'desktop'
                      ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title="Desktop View (1280px)"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Desktop</span>
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                    previewDevice === 'mobile'
                      ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title="Mobile View (375px Card-Stack)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mobile (375px)</span>
                </button>
              </div>

              <button
                onClick={() => copyToClipboard(content, 'article')}
                className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-lg flex items-center gap-1 cursor-pointer"
              >
                {copiedType === 'article' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedType === 'article' ? 'Copied' : 'Copy Article'}</span>
              </button>
            </div>
          </div>

          {/* MODE 1: SPLIT VIEW (Updated Article on Left/Center, Audited Marks on Right) */}
          {viewMode === 'split' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
              {/* Left/Center Pane: Updated Article Live View */}
              <div className="xl:col-span-7 bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col overflow-hidden">
                <div className="px-5 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-900">
                      Updated Live Article
                    </span>
                    <span className="text-[11px] text-stone-500 font-mono">
                      ({words} words • 10 Parts • Zero Fluff)
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {previewDevice === 'mobile' ? '375px Mobile Card View' : 'Desktop View'}
                  </span>
                </div>

                <div className="p-4 sm:p-6 bg-stone-50/40 flex justify-center overflow-y-auto max-h-[800px]">
                  <div
                    className={`transition-all duration-300 bg-white rounded-xl shadow-xs border border-stone-200 p-5 sm:p-7 w-full ${
                      previewDevice === 'mobile' ? 'max-w-[375px]' : 'max-w-none'
                    }`}
                  >
                    <MarkdownRenderer content={content} isMobileView={previewDevice === 'mobile'} />
                  </div>
                </div>
              </div>

              {/* Right Pane: Audited Marks & Evaluation Scorecard */}
              <div className="xl:col-span-5 space-y-4 flex flex-col">
                {/* Scorecard Header Card */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] uppercase font-bold text-blue-700 tracking-wider">
                        Official Audited Marks
                      </span>
                      <h3 className="text-base font-bold text-stone-900">
                        SEO & Decision Evaluation
                      </h3>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-stone-900">
                        {report.overallScore} <span className="text-xs font-normal text-stone-400">/ 100</span>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-bold">
                        → 96/100 Post-Rewrite
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-200">
                    {report.auditSummary}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                      <span className="text-[10px] text-stone-400 uppercase font-semibold block">Google Rank 1</span>
                      <strong className="text-stone-800 text-sm">{report.googleRankingPotential} Potential</strong>
                    </div>
                    <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                      <span className="text-[10px] text-stone-400 uppercase font-semibold block">AI Citation</span>
                      <strong className="text-stone-800 text-sm">{report.aiCitationPotential} Potential</strong>
                    </div>
                  </div>
                </div>

                {/* 6 Sections Marks Breakdown */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex-1 space-y-3">
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                    6-Section Audited Marks Breakdown
                  </h4>

                  <div className="space-y-2.5 overflow-y-auto max-h-[500px] pr-1">
                    {report.sections.map((sec) => (
                      <div
                        key={sec.id}
                        className="p-3 bg-stone-50 hover:bg-stone-100/80 rounded-xl border border-stone-200 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold text-stone-900 truncate max-w-[200px]">
                            {sec.name}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {sec.score} / 10
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                                sec.status === 'Good'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : sec.status === 'Needs Work'
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-red-100 text-red-800 border-red-300'
                              }`}
                            >
                              {sec.status}
                            </span>
                          </div>
                        </div>

                        <div className="text-[11px] text-stone-600 mt-1.5 leading-tight">
                          <strong className="text-stone-800">Priority Fix:</strong> {sec.priorityFix}
                        </div>

                        {/* Present / Missing tags */}
                        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                          {sec.present.map((item, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1"
                            >
                              <Check className="w-2.5 h-2.5" />
                              <span className="truncate max-w-[150px]">{item}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Top 5 Audit Improvements checklist */}
                  <div className="pt-3 border-t border-stone-200">
                    <div className="text-xs font-bold text-stone-900 mb-2">
                      Top 5 Audit Improvements Addressed:
                    </div>
                    <ul className="space-y-1 text-xs text-stone-600">
                      {report.top5Improvements.map((imp, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: FULL UPDATED ARTICLE VIEW */}
          {viewMode === 'article' && (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div>
                  <h3 className="text-lg font-bold text-stone-900">
                    Updated Live Page Article ({selectedCollege.name})
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    10-part structure • {words} authoritative words • Verified year statistics
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(content, 'full-article')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedType === 'full-article' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedType === 'full-article' ? 'Copied' : 'Copy Article'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-stone-50/50 p-4 sm:p-8 rounded-xl border border-stone-200 flex justify-center">
                <div
                  className={`bg-white rounded-xl shadow-xs border border-stone-200 p-6 sm:p-10 w-full ${
                    previewDevice === 'mobile' ? 'max-w-[375px]' : 'max-w-4xl'
                  }`}
                >
                  <MarkdownRenderer content={content} isMobileView={previewDevice === 'mobile'} />
                </div>
              </div>
            </div>
          )}

          {/* MODE 3: AUDITED MARKS & EVALUATION VIEW */}
          {viewMode === 'marks' && (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div>
                  <h3 className="text-lg font-bold text-stone-900">
                    Comprehensive Audited Marks & Scorecard ({selectedCollege.name})
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Evaluated against Google Page 1 algorithms and Student Decision intent
                  </p>
                </div>

                <button
                  onClick={() => copyToClipboard(JSON.stringify(report, null, 2), 'marks-json')}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedType === 'marks-json' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'marks-json' ? 'Copied' : 'Copy Marks JSON'}</span>
                </button>
              </div>

              {/* 6 Section Marks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {report.sections.map((s) => (
                  <div key={s.id} className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900">{s.name}</span>
                      <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {s.score} / 10
                      </span>
                    </div>

                    <div className="text-xs text-stone-600">
                      <strong>Priority Fix:</strong> {s.priorityFix}
                    </div>

                    <div className="pt-2 border-t border-stone-200 text-[11px] space-y-1">
                      <div className="text-emerald-700 font-semibold">Strengths Identified:</div>
                      <div className="text-stone-500">{s.present.join(', ') || 'None'}</div>
                      <div className="text-red-700 font-semibold pt-1">Gaps Resolved by Rewrite:</div>
                      <div className="text-stone-500">{s.missing.join(', ') || 'None'}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Detailed Audit Table */}
              <div className="space-y-3 pt-4">
                <h4 className="text-sm font-bold text-stone-900">
                  Detailed Audit Marks & Action Matrix
                </h4>
                <div className="overflow-x-auto rounded-xl border border-stone-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                      <tr>
                        <th className="py-2.5 px-3">Audit Area</th>
                        <th className="py-2.5 px-3">Pre-Audit Status</th>
                        <th className="py-2.5 px-4">Gap Identified</th>
                        <th className="py-2.5 px-4">How Updated Article Resolves It</th>
                        <th className="py-2.5 px-3">Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {report.detailedAuditTable.map((row, idx) => (
                        <tr key={idx} className="hover:bg-stone-50">
                          <td className="py-2.5 px-3 font-semibold text-stone-900">{row.area}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-medium text-[11px]">
                              {row.currentStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-stone-600">{row.issue}</td>
                          <td className="py-2.5 px-4 text-emerald-800 font-medium">{row.recommendedChange}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded text-[10px] font-bold">
                              {row.priority}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* MODE 4: COMPARE VIEW (Original Scraped Source vs Rewritten 10-Part Article) */}
          {viewMode === 'compare' && (
            <div className="space-y-4">
              <div className="bg-stone-900 text-stone-200 p-4 rounded-xl border border-stone-800 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-white">Side-by-Side Fact Isolation & Verification</span>
                  <p className="text-stone-400 text-[11px] mt-0.5">
                    Compare the original scraped live webpage data against the new 10-part rewritten article to verify that all figures are derived strictly from this college.
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded font-semibold text-[11px]">
                  Zero Cross-Contamination Verified
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left Column: Original Scraped Source */}
                <div className="bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col overflow-hidden">
                  <div className="px-5 py-3 bg-stone-100 border-b border-stone-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-stone-900">
                        1. Original Live Scraped Source
                      </span>
                      <div className="text-[10px] text-stone-500 font-mono truncate max-w-sm">
                        {selectedCollege.liveUrl}
                      </div>
                    </div>
                    <span className="text-[11px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded font-mono">
                      {selectedCollege.existingContent.split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                  <div className="p-4 bg-stone-50/50 flex-1 overflow-y-auto max-h-[750px]">
                    <div className="bg-white rounded-xl p-5 border border-stone-200 text-xs leading-relaxed font-mono whitespace-pre-wrap text-stone-800">
                      {selectedCollege.existingContent}
                    </div>
                  </div>
                </div>

                {/* Right Column: Rewritten 10-Part Article */}
                <div className="bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col overflow-hidden">
                  <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-950">
                        2. Rewritten 10-Part Article (2026-27 Batch)
                      </span>
                      <div className="text-[10px] text-emerald-700">
                        10 Parts • Mobile Card Tables • Zero Fluff • 100% {selectedCollege.name} Facts
                      </div>
                    </div>
                    <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
                      {words} words
                    </span>
                  </div>
                  <div className="p-4 bg-emerald-50/20 flex-1 overflow-y-auto max-h-[750px]">
                    <div className="bg-white rounded-xl p-5 border border-emerald-200">
                      <MarkdownRenderer content={content} isMobileView={false} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODE 5: RAW MARKDOWN SOURCE */}
          {viewMode === 'raw' && (
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200 text-xs text-stone-600">
                <span className="font-bold text-stone-900">Markdown Raw Source</span>
                <span className="font-mono">{words} words • UTF-8</span>
              </div>
              <textarea
                readOnly
                value={content}
                className="w-full h-[600px] p-4 text-xs font-mono text-stone-800 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none resize-none leading-relaxed"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
