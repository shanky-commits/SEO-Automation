import React, { useState } from 'react';
import { Copy, Check, FileText, Download, ShieldCheck } from 'lucide-react';
import { College } from '../types';

interface MasterPromptViewProps {
  currentCollege: College | null;
}

export const MasterPromptView: React.FC<MasterPromptViewProps> = ({ currentCollege }) => {
  const [copiedMaster, setCopiedMaster] = useState(false);
  const [copiedAuditOnly, setCopiedAuditOnly] = useState(false);

  const masterPromptText = `MASTER PROMPT — COLLEGE PAGE AUDIT + LIVE PAGE MODIFICATION + EXCEL TRACKING

You are a Senior SEO Content Strategist, Higher Education Content Expert, Technical SEO Auditor, UX Reviewer and Web QA Specialist.

I will provide:
1. An Excel sheet containing a list of colleges and their live page URLs.
2. My college-page audit guidelines.
3. Access to the website repository/codebase used to build these college pages.
4. The existing live college pages.

Your job is to work through the colleges sequentially and systematically.

---

1. CORE WORKFLOW — STRICT SEQUENTIAL PROCESS
The Excel sheet is the master queue and tracking system.
You must process colleges in the order in which they appear in the relevant sheet/list, unless I explicitly instruct you to change the order.

For each college:
Step 1 → Pick ONE college (Select only the first college whose status is not completed)
Step 2 → Audit the college
Step 3 → Modify the actual live page
Step 4 → Live QA Verification
Step 5 → Update Excel
Step 6 → Mark Done & Unlock Next

Do NOT audit the entire list at once.

---

2. IMPORTANT: DO NOT REWRITE THE PAGE FROM SCRATCH
The existing college page must be treated as the starting point.
Preserve wherever possible:
- Existing H1
- Existing page structure
- Existing layout
- Existing architecture
- Existing UI
- Existing hierarchy
- Existing navigation
- Existing useful sections
- Existing useful content
- Existing internal links
- Existing design system
- Existing page functionality

Make changes ONLY where the audit identifies a genuine requirement.

---

3. STUDENT-FIRST + GOOGLE-FIRST AUDIT
A. GOOGLE / SEO PERSPECTIVE:
- Search intent satisfaction
- Primary & secondary keyword targeting
- H1/H2/H3 structure
- Meta description & title
- Entity relevance & topical coverage
- Internal linking with descriptive anchor text
- Crawlability and duplicate/thin content elimination

B. STUDENT PERSPECTIVE:
"If I am a student researching this college, does this page actually answer the questions I need to make an informed decision?"
- Courses available, eligibility, fees, admission timeline, entrance exams & cutoffs, verified placements & median CTC.

---

4. TABLE REQUIREMENT — NON-NEGOTIABLE
Every table must be checked for mobile usability.
Mobile rule:
The complete table must be readable on mobile without requiring horizontal scrolling.
Do not simply add "overflow-x: auto" as a workaround.
Modify table design into:
- Stacked information
- Compact rows
- Card-style information
- Responsive columns
- Label/value format

---

5. DEFINITION OF "DONE"
A college can ONLY be marked Final Status = Done when ALL of the following are completed:
☑ Page audited
☑ Audit issues identified
☑ Required changes implemented
☑ Existing architecture preserved
☑ Internal links checked
☑ Anchor text checked
☑ Tables checked on mobile (zero horizontal scroll)
☑ Mobile UI checked
☑ Desktop UI checked
☑ Build/deployment completed
☑ Live page verified
☑ Final QA passed
☑ Excel tracker updated

---

6. FINAL REPORT AFTER EACH COLLEGE (Section 20)
College Completed: [College Name]
Audit: Completed
Modifications: Completed
Deployment: Completed
Live QA: Passed
Excel Status: Updated
Final Status: Done
Key Changes Made: [List]
Issues Still Pending: None
Then STOP.`;

  const copyMaster = () => {
    navigator.clipboard.writeText(masterPromptText);
    setCopiedMaster(true);
    setTimeout(() => setCopiedMaster(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider">
            <span>Reference & Execution Architecture</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mt-1">
            Master Prompt & Non-Negotiable Operational Rules
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            The authoritative master prompt driving the sequential queue-lock automation system.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-copy-master-prompt"
            onClick={copyMaster}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedMaster ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedMaster ? 'Copied Master Prompt!' : 'Copy Master Prompt'}</span>
          </button>
        </div>
      </div>

      {/* Rules Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-2">
          <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5 uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Strict Queue-Lock Rule</span>
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            The AI and automation engine cannot batch-process colleges. College #1 must reach full Done verification before College #2 unlocks.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-2">
          <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5 uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Non-Negotiable Mobile Tables</span>
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Horizontal scrolling (<code className="bg-stone-100 px-1 py-0.5 rounded text-[11px]">overflow-x: auto</code>) is strictly forbidden. Tables must stack into responsive cards on mobile screens.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-2">
          <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5 uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>1,800+ Words & No Fluff</span>
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            All rewritten articles must reach 1,800+ words, map the exact 6 search-intent FAQs, and eliminate subjective adjectives ("world-class", "renowned").
          </p>
        </div>
      </div>

      {/* Verbatim Master Prompt Box */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 bg-stone-100 border-b border-stone-200 flex items-center justify-between text-xs font-bold text-stone-700">
          <span>Verbatim Master Prompt Specification</span>
          <span className="text-[11px] text-stone-500 font-mono">21 Workflow Directives</span>
        </div>
        <div className="p-4 bg-stone-900 text-stone-200 font-mono text-xs overflow-x-auto max-h-[500px] leading-relaxed select-text">
          <pre>{masterPromptText}</pre>
        </div>
      </div>
    </div>
  );
};
