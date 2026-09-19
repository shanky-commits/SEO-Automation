import React, { useState, useMemo, useEffect } from 'react';
import { College, ActiveStep, AuditReport, QAResult, StakeholderReport } from './types';
import { INITIAL_COLLEGES } from './data/initialColleges';
import { runDeepAudit, generateStructuredRewrite, computeContentDiffPoints } from './utils/auditEngine';
import { Navbar } from './components/Navbar';
import { TopSearchBar } from './components/TopSearchBar';
import { WorkflowProgressBar } from './components/WorkflowProgressBar';
import { ExcelTrackerView } from './components/ExcelTrackerView';
import { AuditStepView } from './components/AuditStepView';
import { ModifyStepView } from './components/ModifyStepView';
import { QAStepView } from './components/QAStepView';
import { ExcelUpdateStepView } from './components/ExcelUpdateStepView';
import { MasterPromptView } from './components/MasterPromptView';
import { StakeholderReportsView } from './components/StakeholderReportsView';
import { ArticleAndMarksOutputView } from './components/ArticleAndMarksOutputView';
import { AddCollegeModal } from './components/AddCollegeModal';
import { Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'collegeseo.colleges.v2';

function loadInitialColleges(): College[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Sanitize any potential stale cross-contamination from earlier sessions
        return parsed.map((c: College) => {
          if (
            c.name.toLowerCase().includes('jaipuria') &&
            c.modifiedContent &&
            c.modifiedContent.includes('IIM Ahmedabad')
          ) {
            return {
              ...c,
              modifiedContent: generateStructuredRewrite(c),
              auditReport: runDeepAudit(c)
            };
          }
          return c;
        });
      }
    }
  } catch (err) {
    console.warn('Could not read colleges from localStorage:', err);
  }
  return INITIAL_COLLEGES;
}

export default function App() {
  const [colleges, setColleges] = useState<College[]>(loadInitialColleges);
  const [currentTab, setCurrentTab] = useState<'workflow' | 'article-marks' | 'excel' | 'reports' | 'prompt'>('article-marks');
  const [activeStep, setActiveStep] = useState<ActiveStep>('audit');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [lockedNoticeCollege, setLockedNoticeCollege] = useState<College | null>(null);
  const [activeViewCollegeId, setActiveViewCollegeId] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(colleges));
    } catch (e) {
      console.warn('Failed to persist colleges to localStorage', e);
    }
  }, [colleges]);

  // Compute the current sequential target college: the first college whose finalStatus !== 'Done'
  const currentTargetCollege = useMemo(() => {
    return colleges.find((c) => c.finalStatus !== 'Done') || null;
  }, [colleges]);

  // Compute the next college after current target in queue
  const nextTargetCollege = useMemo(() => {
    if (!currentTargetCollege) return null;
    const currentIndex = colleges.findIndex((c) => c.id === currentTargetCollege.id);
    if (currentIndex >= 0 && currentIndex < colleges.length - 1) {
      return colleges[currentIndex + 1];
    }
    return null;
  }, [colleges, currentTargetCollege]);

  // Handlers for Step Transitions
  const handleSaveAuditReport = (report: AuditReport) => {
    if (!currentTargetCollege) return;
    setColleges((prev) =>
      prev.map((c) =>
        c.id === currentTargetCollege.id
          ? {
              ...c,
              auditReport: report,
              auditStatus: 'Audited',
              modificationStatus: c.modificationStatus === 'Not Started' ? 'In Progress' : c.modificationStatus,
              auditNotes: `Audited score ${report.overallScore}/100. Pending 10-part live page modification.`,
              lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' })
            }
          : c
      )
    );
  };

  const handleProceedToModify = () => {
    setActiveStep('modify');
  };

  const handleSaveModifiedContent = (content: string) => {
    if (!currentTargetCollege) return;
    setColleges((prev) =>
      prev.map((c) =>
        c.id === currentTargetCollege.id
          ? {
              ...c,
              modifiedContent: content,
              modificationStatus: 'Modified',
              qaStatus: c.qaStatus === 'Not Started' ? 'In Progress' : c.qaStatus,
              auditNotes: 'Modified page architecture generated. Ready for live QA verification.',
              lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' })
            }
          : c
      )
    );
  };

  const handleProceedToQA = () => {
    setActiveStep('qa');
  };

  const handleSaveQAResult = (qaResult: QAResult) => {
    if (!currentTargetCollege) return;
    setColleges((prev) =>
      prev.map((c) =>
        c.id === currentTargetCollege.id
          ? {
              ...c,
              qaResult,
              qaStatus: qaResult.allPassed ? 'Passed' : 'In Progress',
              lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' })
            }
          : c
      )
    );
  };

  const handleProceedToExcelUpdate = () => {
    setActiveStep('excel');
  };

  // The critical queue unlock event: committing Step 5 marks current college Done and unlocks next!
  const handleCommitExcelAndUnlockNext = (finalNotes: string, report: StakeholderReport) => {
    if (!currentTargetCollege) return;

    const completedCollegeId = currentTargetCollege.id;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' });

    setColleges((prev) =>
      prev.map((c) => {
        if (c.id === completedCollegeId) {
          return {
            ...c,
            auditStatus: 'Audited',
            modificationStatus: 'Modified',
            qaStatus: 'Passed',
            finalStatus: 'Done',
            auditNotes: finalNotes,
            stakeholderReport: report,
            lastUpdated: nowStr
          };
        }
        return c;
      })
    );

    // If next target exists, reset step to 'audit' for the new target
    if (nextTargetCollege) {
      setActiveStep('audit');
    }
  };

  const handleMarkBlocked = (reason: string) => {
    if (!currentTargetCollege) return;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' });

    const blockerReport: StakeholderReport = {
      collegeCompleted: currentTargetCollege.name,
      audit: 'Completed',
      modifications: 'Completed',
      deployment: 'Blocked',
      liveQa: 'Failed',
      excelStatus: 'Updated',
      finalStatus: 'Blocked',
      keyChangesMade: ['Identified blocking technical / source dependency.'],
      issuesStillPending: reason,
      reportTimestamp: nowStr
    };

    setColleges((prev) =>
      prev.map((c) =>
        c.id === currentTargetCollege.id
          ? {
              ...c,
              finalStatus: 'Blocked',
              auditStatus: 'Blocked',
              modificationStatus: 'Blocked',
              auditNotes: `BLOCKED: ${reason}`,
              stakeholderReport: blockerReport,
              lastUpdated: nowStr
            }
          : c
      )
    );
  };

  const handleSelectCollegeFromExcel = (collegeId: string) => {
    const selected = colleges.find((c) => c.id === collegeId);
    if (!selected) return;

    if (selected.finalStatus === 'Done') {
      // Allow reviewing already completed college
      setCurrentTab('reports');
    } else if (currentTargetCollege && selected.id === currentTargetCollege.id) {
      // Active college
      setCurrentTab('workflow');
    } else {
      // Locked college
      setLockedNoticeCollege(selected);
    }
  };

  const handleUpdateCollegeNotes = (collegeId: string, notes: string) => {
    setColleges((prev) =>
      prev.map((c) => (c.id === collegeId ? { ...c, auditNotes: notes } : c))
    );
  };

  const handleAddCollege = (collegeData: {
    name: string;
    liveUrl: string;
    category: string;
    location: string;
    nirfRank?: string;
    existingContent: string;
  }) => {
    const newCollege: College = {
      id: `college-${Date.now()}`,
      order: colleges.length + 1,
      name: collegeData.name,
      liveUrl: collegeData.liveUrl,
      category: collegeData.category,
      location: collegeData.location,
      nirfRank: collegeData.nirfRank,
      auditStatus: 'Queued',
      modificationStatus: 'Not Started',
      qaStatus: 'Not Started',
      finalStatus: 'Queued',
      auditNotes: `Queued as #${colleges.length + 1} in sequential order.`,
      existingContent: collegeData.existingContent,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' })
    };

    setColleges((prev) => [...prev, newCollege]);
  };

  // Automated fetch of college's live URL content: removes old content, starts with new, and updates existingContent
  const handleRefreshCollegeLiveContent = async (
    collegeId: string,
    targetUrl?: string
  ): Promise<{ success: boolean; message: string; meta?: any; diffPoints?: string[] }> => {
    const target = colleges.find((c) => c.id === collegeId);
    if (!target) {
      return { success: false, message: 'College target not found in master queue' };
    }

    const urlToFetch = (targetUrl || target.liveUrl || '').trim();
    if (!urlToFetch) {
      return { success: false, message: 'No live URL configured for this college' };
    }

    try {
      const res = await fetch('/api/fetch-live-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToFetch })
      });

      const data = await res.json();
      if (!data.success || !data.markdown) {
        throw new Error(data.error || 'Failed to fetch content from live page');
      }

      const freshContent = data.markdown;
      const oldWords = target.existingContent
        ? target.existingContent.split(/\s+/).filter(Boolean).length
        : 0;
      const newWords = data.wordCount || freshContent.split(/\s+/).filter(Boolean).length;
      const isNewUrl = targetUrl && targetUrl !== target.liveUrl;

      // Compute official updated data points dynamically for any college
      const diffPoints = computeContentDiffPoints(target.existingContent, freshContent, target.name);

      const nowTime = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        day: 'numeric'
      });

      // Update state: Completely remove old content, wipe old rewrite, and start fresh with new content
      setColleges((prev) =>
        prev.map((c) => {
          if (c.id === collegeId) {
            const updatedCollege: College = {
              ...c,
              liveUrl: urlToFetch, // Replace live URL if modified
              existingContent: freshContent, // Completely remove old content and start with new
              modifiedContent: undefined, // CRITICAL: Wipe previous rewrite to prevent any identity or fact leaks!
              modificationStatus: 'Not Started',
              qaStatus: 'Not Started',
              previousContentBackup: c.existingContent, // Reference backup to calculate visual diff / bold changes
              updatedDiffPoints: diffPoints,
              liveFetchMeta: {
                title: data.title,
                metaDescription: data.metaDescription,
                h1: data.h1,
                statusCode: data.statusCode || 200,
                wordCount: newWords,
                tableCount: data.tableCount,
                faqCount: data.faqCount,
                headings: data.headings,
                fetchedAt: data.fetchedAt || nowTime
              },
              lastUpdated: `Live Official Fetched (${data.statusCode || 200} OK @ ${nowTime})`
            };

            const newReport = runDeepAudit(updatedCollege);
            return {
              ...updatedCollege,
              auditReport: newReport,
              auditNotes: `Automated live fetch: Replaced old content (${oldWords} words). Loaded fresh official page (${newWords} words) from ${urlToFetch}. Audit score: ${newReport.overallScore}/100.`
            };
          }
          return c;
        })
      );

      return {
        success: true,
        message: isNewUrl
          ? `Live URL updated to "${urlToFetch}". Old content removed, and loaded ${newWords} words of official data!`
          : `Live content refreshed! Old content removed, and loaded ${newWords} words of fresh official data.`,
        meta: data,
        diffPoints
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Error occurred while fetching live URL'
      };
    }
  };

  // Top Search-to-Audit Bar: Fetch live URL, isolate identity, wipe old content, and audit
  const handleSearchAndAuditUrl = async (
    url: string,
    optionalName?: string
  ): Promise<{ success: boolean; message: string; wordCount?: number; tableCount?: number }> => {
    const targetUrl = url.trim();
    if (!targetUrl) return { success: false, message: 'Invalid URL provided' };

    try {
      const res = await fetch('/api/fetch-live-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });
      const data = await res.json();
      if (!data.success || !data.markdown) {
        throw new Error(data.error || 'Failed to fetch content from live page');
      }

      const freshContent = data.markdown;
      const wordCount = data.wordCount || freshContent.split(/\s+/).filter(Boolean).length;
      const tableCount = data.tableCount || 0;
      const nowTime = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        day: 'numeric'
      });

      // Check if a college in queue already has this exact URL (case-insensitive)
      const existing = colleges.find((c) => c.liveUrl.toLowerCase() === targetUrl.toLowerCase());
      let targetId = existing?.id;

      if (existing) {
        setColleges((prev) =>
          prev.map((c) => {
            if (c.id === existing.id) {
              const updated: College = {
                ...c,
                existingContent: freshContent,
                modifiedContent: undefined, // Wipe previous rewrite!
                modificationStatus: 'Not Started',
                qaStatus: 'Not Started',
                previousContentBackup: c.existingContent,
                updatedDiffPoints: computeContentDiffPoints(c.existingContent, freshContent, c.name),
                liveFetchMeta: {
                  title: data.title,
                  metaDescription: data.metaDescription,
                  h1: data.h1,
                  statusCode: data.statusCode || 200,
                  wordCount,
                  tableCount,
                  faqCount: data.faqCount,
                  headings: data.headings,
                  fetchedAt: data.fetchedAt || nowTime
                },
                lastUpdated: `Live Synced (${data.statusCode || 200} OK @ ${nowTime})`
              };
              const newReport = runDeepAudit(updated);
              return {
                ...updated,
                auditReport: newReport,
                auditNotes: `Automated live fetch: Loaded ${wordCount} words from ${targetUrl}. Audit score: ${newReport.overallScore}/100.`
              };
            }
            return c;
          })
        );
      } else {
        // Create new college record
        const derivedName =
          optionalName ||
          data.h1?.replace(/^#+\s*/, '') ||
          data.title?.split('|')[0]?.trim() ||
          `College (${new URL(targetUrl).hostname})`;
        const newCollegeId = `college-${Date.now()}`;
        targetId = newCollegeId;

        const newCollege: College = {
          id: newCollegeId,
          order: colleges.length + 1,
          name: derivedName,
          liveUrl: targetUrl,
          category: 'Management / MBA',
          location: 'India',
          auditStatus: 'Audited',
          modificationStatus: 'Not Started',
          qaStatus: 'Not Started',
          finalStatus: 'In Progress',
          existingContent: freshContent,
          modifiedContent: undefined,
          auditNotes: `Live fetched & audited: ${wordCount} words, ${tableCount} tables.`,
          liveFetchMeta: {
            title: data.title,
            metaDescription: data.metaDescription,
            h1: data.h1,
            statusCode: data.statusCode || 200,
            wordCount,
            tableCount,
            faqCount: data.faqCount,
            headings: data.headings,
            fetchedAt: data.fetchedAt || nowTime
          },
          lastUpdated: `Live Created (${data.statusCode || 200} OK @ ${nowTime})`
        };

        const newReport = runDeepAudit(newCollege);
        newCollege.auditReport = newReport;
        newCollege.auditNotes = `Live fetched & audited: ${wordCount} words, ${tableCount} tables. Score: ${newReport.overallScore}/100.`;

        setColleges((prev) => [...prev, newCollege]);
      }

      if (targetId) {
        setActiveViewCollegeId(targetId);
      }
      setCurrentTab('article-marks');

      return {
        success: true,
        message: `Fetched 200 OK — ${wordCount} words, ${tableCount} tables`,
        wordCount,
        tableCount
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Error occurred while fetching live URL'
      };
    }
  };

  // Search & Select CMS Directory college
  const handleSearchAndSelectDirectoryCollege = async (item: {
    name: string;
    liveUrl: string;
    location?: string;
    category?: string;
  }): Promise<{ success: boolean; message: string; wordCount?: number; tableCount?: number }> => {
    return handleSearchAndAuditUrl(item.liveUrl, item.name);
  };

  // Direct modification of college live URL
  const handleModifyCollegeLiveUrl = (collegeId: string, newUrl: string) => {
    const trimmed = newUrl.trim();
    if (!trimmed) return;
    setColleges((prev) =>
      prev.map((c) =>
        c.id === collegeId
          ? {
              ...c,
              liveUrl: trimmed,
              lastUpdated: `Live URL directly updated to: ${trimmed}`
            }
          : c
      )
    );
  };

  const handleUpdateCollegeLiveContent = (
    collegeId: string,
    newContent: string,
    liveUrl?: string,
    liveFetchMeta?: any
  ) => {
    setColleges((prev) =>
      prev.map((c) => {
        if (c.id === collegeId) {
          const updated: College = {
            ...c,
            existingContent: newContent,
            liveUrl: liveUrl || c.liveUrl,
            liveFetchMeta: liveFetchMeta || c.liveFetchMeta,
            lastUpdated: `Live Synced (${liveFetchMeta?.statusCode || 200} OK)`
          };
          const newReport = runDeepAudit(updated);
          return {
            ...updated,
            auditReport: newReport,
            auditNotes: `Live page re-fetched (${liveFetchMeta?.wordCount || newContent.split(/\s+/).length} words). Audited score: ${newReport.overallScore}/100.`
          };
        }
        return c;
      })
    );
  };

  const handleUpdateCollegeData = (collegeId: string, report: AuditReport, modifiedContent: string) => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' });
    setColleges((prev) =>
      prev.map((c) =>
        c.id === collegeId
          ? {
              ...c,
              auditReport: report,
              auditStatus: 'Audited',
              modifiedContent: modifiedContent,
              modificationStatus: 'Modified',
              auditNotes: `Audited score ${report.overallScore}/100. Full updated article ready.`,
              lastUpdated: nowStr
            }
          : c
      )
    );
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Top Main Navigation */}
      <Navbar
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        colleges={colleges}
        currentTargetCollege={currentTargetCollege}
      />

      {/* Global Top Search-to-Audit Bar (Sticky, Visible on All Tabs) */}
      <TopSearchBar
        colleges={colleges}
        activeCollegeId={activeViewCollegeId || currentTargetCollege?.id || colleges[0]?.id}
        onSelectCollege={(collegeId) => {
          setActiveViewCollegeId(collegeId);
          setCurrentTab('article-marks');
        }}
        onSearchAndAuditUrl={handleSearchAndAuditUrl}
        onSearchAndSelectDirectoryCollege={handleSearchAndSelectDirectoryCollege}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Sequential Workflow Steps Bar (Visible when in workflow tab) */}
      {currentTab === 'workflow' && (
        <WorkflowProgressBar
          currentCollege={currentTargetCollege}
          activeStep={activeStep}
          onSelectStep={setActiveStep}
          isLocked={false}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {currentTab === 'workflow' && (
          <div>
            {!currentTargetCollege ? (
              <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center space-y-4 shadow-xs">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-stone-900">
                  Entire Queue Processed & Completed!
                </h2>
                <p className="text-xs text-stone-600 max-w-md mx-auto">
                  Every college has completed the full 5-stage sequential cycle: Deep Audit, Live Page Modification, QA Verification, and Excel Master Sheet Synchronization.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => setCurrentTab('excel')}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    View Master Excel Sheet
                  </button>
                  <button
                    onClick={() => setCurrentTab('reports')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    View Stakeholder Reports
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {activeStep === 'audit' && (
                  <AuditStepView
                    college={currentTargetCollege}
                    onSaveAuditReport={handleSaveAuditReport}
                    onProceedToModify={handleProceedToModify}
                    onMarkBlocked={handleMarkBlocked}
                    onUpdateCollegeContent={handleUpdateCollegeLiveContent}
                    onRefreshContent={handleRefreshCollegeLiveContent}
                    onDirectModifyLiveUrl={handleModifyCollegeLiveUrl}
                  />
                )}

                {activeStep === 'modify' && (
                  <ModifyStepView
                    college={currentTargetCollege}
                    onSaveModifiedContent={handleSaveModifiedContent}
                    onProceedToQA={handleProceedToQA}
                  />
                )}

                {activeStep === 'qa' && (
                  <QAStepView
                    college={currentTargetCollege}
                    onSaveQAResult={handleSaveQAResult}
                    onProceedToExcelUpdate={handleProceedToExcelUpdate}
                  />
                )}

                {activeStep === 'excel' && (
                  <ExcelUpdateStepView
                    college={currentTargetCollege}
                    nextCollege={nextTargetCollege}
                    onCommitExcelAndUnlockNext={handleCommitExcelAndUnlockNext}
                    onViewExcelMaster={() => setCurrentTab('excel')}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {currentTab === 'article-marks' && (
          <ArticleAndMarksOutputView
            colleges={colleges}
            currentCollegeId={activeViewCollegeId || currentTargetCollege?.id || colleges[0]?.id || null}
            onSelectCollege={(collegeId) => setActiveViewCollegeId(collegeId)}
            onUpdateCollegeData={handleUpdateCollegeData}
            onUpdateCollegeContent={handleUpdateCollegeLiveContent}
          />
        )}

        {currentTab === 'excel' && (
          <ExcelTrackerView
            colleges={colleges}
            currentCollegeId={currentTargetCollege?.id || null}
            onSelectCollegeForWorkflow={handleSelectCollegeFromExcel}
            onUpdateCollegeNotes={handleUpdateCollegeNotes}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        )}

        {currentTab === 'reports' && (
          <StakeholderReportsView colleges={colleges} />
        )}

        {currentTab === 'prompt' && (
          <MasterPromptView currentCollege={currentTargetCollege} />
        )}
      </main>

      {/* Hard Rule Queue Lock Notice Modal */}
      {lockedNoticeCollege && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Queue Lock Hard Rule Active
              </h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                You cannot access or process <strong className="text-stone-900">{lockedNoticeCollege.name}</strong> (Target #{lockedNoticeCollege.order}) yet.
              </p>
              <div className="my-3 p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-700 space-y-1">
                <div className="font-semibold text-stone-900">Current Queue Blocker:</div>
                <div className="text-blue-700 font-medium">
                  {currentTargetCollege?.name} (Target #{currentTargetCollege?.order})
                </div>
                <div className="text-[11px] text-stone-500">
                  Must complete: Audit → Modify → Live QA → Excel update before this college is unlocked.
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setLockedNoticeCollege(null)}
                className="px-4 py-2 bg-stone-900 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Understood, Return to Active Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add College Modal */}
      <AddCollegeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddCollege={handleAddCollege}
      />
    </div>
  );
}
