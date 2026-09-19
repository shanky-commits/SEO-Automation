import React, { useState } from 'react';
import { College } from '../types';
import { Download, Plus, Search, Filter, Lock, Play, CheckCircle2, AlertTriangle, FileSpreadsheet, ExternalLink, Copy, Check } from 'lucide-react';

interface ExcelTrackerViewProps {
  colleges: College[];
  currentCollegeId: string | null;
  onSelectCollegeForWorkflow: (collegeId: string) => void;
  onUpdateCollegeNotes: (collegeId: string, notes: string) => void;
  onOpenAddModal: () => void;
}

export const ExcelTrackerView: React.FC<ExcelTrackerViewProps> = ({
  colleges,
  currentCollegeId,
  onSelectCollegeForWorkflow,
  onUpdateCollegeNotes,
  onOpenAddModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Done' | 'In Progress' | 'Queued' | 'Blocked'>('All');
  const [copiedNotification, setCopiedNotification] = useState(false);

  const filteredColleges = colleges.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.category.toLowerCase().includes(searchTerm.toLowerCase());
    if (statusFilter === 'All') return matchesSearch;
    if (statusFilter === 'Done') return matchesSearch && c.finalStatus === 'Done';
    if (statusFilter === 'In Progress') return matchesSearch && (c.finalStatus === 'In Progress' || c.auditStatus === 'In Progress');
    if (statusFilter === 'Queued') return matchesSearch && c.finalStatus === 'Queued';
    if (statusFilter === 'Blocked') return matchesSearch && c.finalStatus === 'Blocked';
    return matchesSearch;
  });

  const totalCount = colleges.length;
  const doneCount = colleges.filter((c) => c.finalStatus === 'Done').length;
  const inProgressCount = colleges.filter((c) => c.finalStatus === 'In Progress' || c.auditStatus === 'In Progress' || c.modificationStatus === 'In Progress').length;
  const blockedCount = colleges.filter((c) => c.finalStatus === 'Blocked').length;
  const queuedCount = totalCount - doneCount - inProgressCount - blockedCount;

  const exportCSV = () => {
    const headers = ['Order', 'College', 'Live URL', 'Audit Status', 'Modification Status', 'QA Status', 'Final Status', 'Audit Notes', 'Last Updated'];
    const rows = colleges.map((c) => [
      c.order,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.liveUrl}"`,
      c.auditStatus,
      c.modificationStatus,
      c.qaStatus,
      c.finalStatus,
      `"${(c.auditNotes || '').replace(/"/g, '""')}"`,
      `"${c.lastUpdated}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `College_SEO_Audit_Tracker_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyAsGoogleSheetsTSV = () => {
    const headers = ['Order', 'College', 'Live URL', 'Audit Status', 'Modification Status', 'QA Status', 'Final Status', 'Audit Notes'];
    const rows = colleges.map((c) => [
      c.order,
      c.name,
      c.liveUrl,
      c.auditStatus,
      c.modificationStatus,
      c.qaStatus,
      c.finalStatus,
      c.auditNotes || ''
    ]);
    const tsvContent = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(tsvContent);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const getStatusBadge = (type: 'audit' | 'mod' | 'qa' | 'final', value: string) => {
    let color = 'bg-stone-100 text-stone-700 border-stone-200';

    if (value === 'Done' || value === 'Audited' || value === 'Modified' || value === 'Passed') {
      color = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold';
    } else if (value === 'In Progress') {
      color = 'bg-blue-100 text-blue-800 border-blue-300 font-semibold';
    } else if (value === 'Blocked' || value === 'Failed') {
      color = 'bg-red-100 text-red-800 border-red-300 font-semibold';
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] border tracking-tight ${color}`}>
        {value}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Master Queue Rule Reminder */}
      <div className="bg-stone-900 text-white p-5 rounded-2xl shadow-sm border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-blue-400 mb-1">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Master Excel Tracking System & Queue Lock</span>
          </div>
          <h1 className="text-xl font-bold text-stone-100">
            College Page Audit, Modification & QA Queue
          </h1>
          <p className="text-xs text-stone-300 mt-1 max-w-2xl">
            Strict Sequential Hard Rule: Only one college is processed at a time. A college can only be marked <strong className="text-emerald-400 font-semibold">Done</strong> after Audit → Modify → Deploy → QA → Excel update. Next colleges are locked until prior are completed.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
          <button
            id="btn-copy-tsv"
            onClick={copyAsGoogleSheetsTSV}
            className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-lg border border-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Copy table formatted for Google Sheets paste"
          >
            {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedNotification ? 'Copied TSV!' : 'Copy for Google Sheets'}</span>
          </button>
          <button
            id="btn-export-csv"
            onClick={exportCSV}
            className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-lg border border-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            id="btn-add-college-queue"
            onClick={onOpenAddModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add College</span>
          </button>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-stone-500 uppercase">Total Colleges</div>
          <div className="text-2xl font-bold text-stone-900 mt-1">{totalCount}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs bg-emerald-50/20">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase">Completed (Done)</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{doneCount}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-2xs bg-blue-50/20">
          <div className="text-[11px] font-semibold text-blue-700 uppercase">Active / In Progress</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{inProgressCount}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs bg-amber-50/20">
          <div className="text-[11px] font-semibold text-amber-700 uppercase">Queued (Locked)</div>
          <div className="text-2xl font-bold text-amber-800 mt-1">{queuedCount}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-red-200 shadow-2xs bg-red-50/20">
          <div className="text-[11px] font-semibold text-red-700 uppercase">Blocked Issues</div>
          <div className="text-2xl font-bold text-red-700 mt-1">{blockedCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-colleges"
            type="text"
            placeholder="Search college name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs text-stone-800 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(['All', 'In Progress', 'Queued', 'Done', 'Blocked'] as const).map((filter) => (
            <button
              key={filter}
              id={`filter-tab-${filter.toLowerCase().replace(' ', '-')}`}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer shrink-0 ${
                statusFilter === filter
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Spreadsheet / Grid Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-100 text-stone-700 text-xs font-bold border-b border-stone-200 select-none">
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-4 min-w-[220px]">College Name</th>
                <th className="py-3 px-3 min-w-[120px]">Audit Status</th>
                <th className="py-3 px-3 min-w-[130px]">Mod Status</th>
                <th className="py-3 px-3 min-w-[110px]">QA Status</th>
                <th className="py-3 px-3 min-w-[110px]">Final Status</th>
                <th className="py-3 px-4 min-w-[200px]">Audit Notes</th>
                <th className="py-3 px-3 text-right min-w-[140px]">Queue Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-xs font-mono">
              {filteredColleges.map((col) => {
                const isTarget = col.id === currentCollegeId;
                const isCompleted = col.finalStatus === 'Done';
                const isLocked = !isTarget && !isCompleted;

                return (
                  <tr
                    key={col.id}
                    className={`transition-colors ${
                      isTarget
                        ? 'bg-blue-50/60 font-sans'
                        : isCompleted
                        ? 'bg-emerald-50/20 font-sans hover:bg-emerald-50/40'
                        : 'bg-white font-sans hover:bg-stone-50/80'
                    }`}
                  >
                    <td className="py-3 px-3 text-center text-stone-500 font-semibold">
                      {col.order}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="text-stone-900 font-semibold">{col.name}</span>
                        {isTarget && (
                          <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide shrink-0">
                            CURRENT TARGET
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <a
                          href={col.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-sans"
                        >
                          <span className="truncate max-w-[200px]">{col.liveUrl}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-sans">
                      {getStatusBadge('audit', col.auditStatus)}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      {getStatusBadge('mod', col.modificationStatus)}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      {getStatusBadge('qa', col.qaStatus)}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      {getStatusBadge('final', col.finalStatus)}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <input
                        type="text"
                        value={col.auditNotes || ''}
                        onChange={(e) => onUpdateCollegeNotes(col.id, e.target.value)}
                        placeholder="Click to add note in Excel..."
                        className="w-full text-xs text-stone-700 bg-transparent border-b border-dashed border-stone-300 hover:border-stone-500 focus:border-blue-600 focus:outline-none py-0.5 transition-colors"
                      />
                    </td>
                    <td className="py-3 px-3 text-right font-sans">
                      {isTarget ? (
                        <button
                          id={`btn-open-workflow-${col.id}`}
                          onClick={() => onSelectCollegeForWorkflow(col.id)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Run Workflow</span>
                        </button>
                      ) : isCompleted ? (
                        <button
                          id={`btn-review-${col.id}`}
                          onClick={() => onSelectCollegeForWorkflow(col.id)}
                          className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-medium text-xs inline-flex items-center gap-1 border border-stone-200 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Review Done</span>
                        </button>
                      ) : (
                        <div
                          className="inline-flex items-center gap-1 text-[11px] text-stone-400 bg-stone-100 px-2 py-1 rounded border border-stone-200 cursor-not-allowed select-none"
                          title="Locked: Sequential rule mandates finishing current target college before unlocking subsequent colleges."
                        >
                          <Lock className="w-3 h-3 text-stone-400" />
                          <span>Queue Locked</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredColleges.length === 0 && (
          <div className="p-8 text-center text-stone-500 text-sm">
            No colleges match the active search or filter.
          </div>
        )}
      </div>

      {/* Sequential Lock Guidance Note */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
        <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-amber-950">Hard Rule Queue Protection in Effect</h4>
          <p className="mt-0.5 leading-relaxed text-amber-800">
            Per user specification, you cannot audit or modify colleges out of sequence or in batch. The system restricts the active workflow strictly to the top uncompleted college. Once its Audit, Modification, Live QA, and Excel Row reach <strong>Done</strong>, the next college unlocks automatically.
          </p>
        </div>
      </div>
    </div>
  );
};
