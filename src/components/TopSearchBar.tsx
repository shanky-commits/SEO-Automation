import React, { useState, useEffect, useRef } from 'react';
import { College } from '../types';
import { Search, Globe, Plus, ChevronDown, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, School } from 'lucide-react';

interface DirectoryCollege {
  name: string;
  url?: string;
  liveUrl?: string;
  location?: string;
  category?: string;
  slug?: string;
}

interface TopSearchBarProps {
  colleges: College[];
  activeCollegeId: string | null;
  onSelectCollege: (collegeId: string) => void;
  onSearchAndAuditUrl: (url: string, optionalName?: string) => Promise<{ success: boolean; message: string; wordCount?: number; tableCount?: number }>;
  onSearchAndSelectDirectoryCollege: (item: { name: string; liveUrl: string; location?: string; category?: string }) => Promise<{ success: boolean; message: string; wordCount?: number; tableCount?: number }>;
  onOpenAddModal: () => void;
}

export const TopSearchBar: React.FC<TopSearchBarProps> = ({
  colleges,
  activeCollegeId,
  onSelectCollege,
  onSearchAndAuditUrl,
  onSearchAndSelectDirectoryCollege,
  onOpenAddModal
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [directoryItems, setDirectoryItems] = useState<DirectoryCollege[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [status, setStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({
    type: 'idle',
    message: 'Ready to search college or fetch live URL'
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch live CMS directory in the background once
  useEffect(() => {
    let isMounted = true;
    fetch('/api/live-colleges')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;
        const list = Array.isArray(data) ? data : data.colleges || [];
        setDirectoryItems(list);
      })
      .catch(() => {
        // Benign directory index fetch fallback
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isUrl = query.trim().startsWith('http://') || query.trim().startsWith('https://');

  // Filter in-memory colleges & directory
  const trimmed = query.trim().toLowerCase();
  const matchedInQueue = trimmed
    ? colleges.filter(
        (c) =>
          c.name.toLowerCase().includes(trimmed) ||
          c.location.toLowerCase().includes(trimmed) ||
          c.liveUrl.toLowerCase().includes(trimmed)
      )
    : [];

  const matchedInDirectory = trimmed
    ? directoryItems
        .filter((item) => {
          const itemName = (item.name || '').toLowerCase();
          const itemLoc = (item.location || '').toLowerCase();
          const itemUrl = (item.url || item.liveUrl || '').toLowerCase();
          return itemName.includes(trimmed) || itemLoc.includes(trimmed) || itemUrl.includes(trimmed);
        })
        .slice(0, 8)
    : [];

  const handleExecuteFetch = async (targetUrl?: string, targetName?: string) => {
    const urlToFetch = (targetUrl || query).trim();
    if (!urlToFetch) return;

    setIsDropdownOpen(false);
    setIsSearching(true);
    setStatus({
      type: 'loading',
      message: `Fetching official live page: ${urlToFetch}...`
    });

    try {
      const res = await onSearchAndAuditUrl(urlToFetch, targetName);
      if (res.success) {
        setStatus({
          type: 'success',
          message: `200 OK — ${res.wordCount || 0} words, ${res.tableCount || 0} tables extracted`
        });
        setQuery('');
      } else {
        setStatus({
          type: 'error',
          message: res.message || 'Failed to fetch live URL'
        });
      }
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err.message || 'Error occurred during fetch'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectDirectoryResult = async (item: DirectoryCollege) => {
    const liveUrl = item.url || item.liveUrl || '';
    if (!liveUrl) return;

    setIsDropdownOpen(false);
    setIsSearching(true);
    setStatus({
      type: 'loading',
      message: `Loading & auditing "${item.name}"...`
    });

    try {
      const res = await onSearchAndSelectDirectoryCollege({
        name: item.name,
        liveUrl,
        location: item.location,
        category: item.category || 'Management / MBA'
      });
      if (res.success) {
        setStatus({
          type: 'success',
          message: `200 OK — ${item.name} (${res.wordCount || 0} words, ${res.tableCount || 0} tables)`
        });
        setQuery('');
      } else {
        setStatus({
          type: 'error',
          message: res.message || 'Failed to fetch college'
        });
      }
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err.message || 'Error loading college'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectQueueResult = (collegeId: string) => {
    onSelectCollege(collegeId);
    setIsDropdownOpen(false);
    setQuery('');
    const target = colleges.find((c) => c.id === collegeId);
    setStatus({
      type: 'success',
      message: `Active target switched to: ${target?.name}`
    });
  };

  const activeCollege = colleges.find((c) => c.id === activeCollegeId) || colleges[0];

  return (
    <div className="bg-stone-950 text-stone-200 border-b border-stone-800/80 sticky top-14 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Main Search / URL Fetch Box */}
          <div className="relative flex-1" ref={dropdownRef}>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 flex items-center">
                <div className="absolute left-3 text-stone-400 pointer-events-none">
                  {isUrl ? <Globe className="w-4 h-4 text-blue-400" /> : <Search className="w-4 h-4" />}
                </div>
                <input
                  id="global-search-fetch-input"
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => {
                    if (query.trim()) setIsDropdownOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (isUrl) {
                        handleExecuteFetch();
                      } else if (matchedInQueue.length > 0) {
                        handleSelectQueueResult(matchedInQueue[0].id);
                      } else if (matchedInDirectory.length > 0) {
                        handleSelectDirectoryResult(matchedInDirectory[0]);
                      }
                    }
                  }}
                  placeholder="Type college name (e.g., 'Jaipuria Jaipur', 'IIM Ahmedabad') or paste official live URL (https://...)"
                  className="w-full pl-9 pr-24 py-1.5 bg-stone-900 border border-stone-700/80 focus:border-blue-500 rounded-lg text-xs font-medium text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
                />
                <button
                  id="btn-execute-search-fetch"
                  onClick={() => handleExecuteFetch()}
                  disabled={isSearching || !query.trim()}
                  className={`absolute right-1 px-3 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSearching
                      ? 'bg-stone-800 text-stone-400 cursor-not-allowed'
                      : isUrl
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs'
                      : 'bg-stone-700 hover:bg-stone-600 text-stone-100'
                  }`}
                >
                  {isSearching ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Fetching...</span>
                    </>
                  ) : isUrl ? (
                    <>
                      <Globe className="w-3 h-3" />
                      <span>Fetch & Audit</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3 h-3" />
                      <span>Search</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Autocomplete / Dropdown Results */}
            {isDropdownOpen && query.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
                {/* URL Quick Action */}
                {isUrl && (
                  <button
                    onClick={() => handleExecuteFetch()}
                    className="w-full p-2.5 bg-blue-950/60 hover:bg-blue-900/60 border-b border-stone-800 text-left flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-blue-200">
                          Fetch, Wipe Old Content & Deep Audit URL
                        </div>
                        <div className="text-[11px] text-blue-400/80 font-mono truncate max-w-md">
                          {query}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold">
                      Fetch Live (200 OK)
                    </span>
                  </button>
                )}

                {/* Matches in Current Queue */}
                {matchedInQueue.length > 0 && (
                  <div className="p-1">
                    <div className="px-2 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      Loaded in Queue ({matchedInQueue.length})
                    </div>
                    {matchedInQueue.map((col) => (
                      <button
                        key={col.id}
                        onClick={() => handleSelectQueueResult(col.id)}
                        className="w-full px-2.5 py-1.5 text-left rounded-md hover:bg-stone-800 flex items-center justify-between gap-2 cursor-pointer transition-colors"
                      >
                        <div className="truncate">
                          <div className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                            <School className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{col.name}</span>
                          </div>
                          <div className="text-[10px] text-stone-400 truncate flex items-center gap-2 mt-0.5">
                            <span>{col.location}</span>
                            <span>•</span>
                            <span className="font-mono text-stone-400">{col.liveUrl}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700 shrink-0">
                          {col.finalStatus}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Matches in CollegeCMS Directory */}
                {matchedInDirectory.length > 0 && (
                  <div className="p-1 border-t border-stone-800">
                    <div className="px-2 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Official CMS Directory Matches</span>
                      <span className="text-stone-400 text-[9px] font-normal">Click to fetch live</span>
                    </div>
                    {matchedInDirectory.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectDirectoryResult(item)}
                        className="w-full px-2.5 py-1.5 text-left rounded-md hover:bg-stone-800 flex items-center justify-between gap-2 cursor-pointer transition-colors"
                      >
                        <div className="truncate">
                          <div className="text-xs font-medium text-stone-200 truncate flex items-center gap-1.5">
                            <Globe className="w-3 h-3 text-blue-400 shrink-0" />
                            <span>{item.name}</span>
                          </div>
                          <div className="text-[10px] text-stone-400 truncate font-mono mt-0.5">
                            {item.url || item.liveUrl}
                          </div>
                        </div>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 shrink-0">
                          Fetch Live
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* No results */}
                {!isUrl && matchedInQueue.length === 0 && matchedInDirectory.length === 0 && (
                  <div className="p-4 text-center text-xs text-stone-400">
                    No matching colleges found in queue or CMS directory. You can paste a full URL to fetch directly.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Controls: College Switcher Dropdown, Status Badge, Add College */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Direct College Switcher Dropdown */}
            <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-700/80 rounded-lg px-2 py-1">
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider hidden sm:inline">
                Target:
              </span>
              <select
                id="top-college-switcher"
                value={activeCollege?.id || ''}
                onChange={(e) => onSelectCollege(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer max-w-[200px] truncate"
                title="Switch active target college (never mixes content)"
              >
                {colleges.map((c) => (
                  <option key={c.id} value={c.id} className="bg-stone-900 text-white">
                    #{c.order} {c.name.slice(0, 24)}... ({c.finalStatus})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border max-w-xs truncate ${
                status.type === 'loading'
                  ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                  : status.type === 'success'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                  : status.type === 'error'
                  ? 'bg-red-950/80 text-red-300 border-red-800'
                  : 'bg-stone-900 text-stone-400 border-stone-800'
              }`}
              title={status.message}
            >
              {status.type === 'loading' && <RefreshCw className="w-3 h-3 animate-spin text-blue-400 shrink-0" />}
              {status.type === 'success' && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
              {status.type === 'error' && <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />}
              {status.type === 'idle' && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
              <span className="truncate">{status.message}</span>
            </div>

            {/* Add College Modal Trigger */}
            <button
              id="btn-top-add-college"
              onClick={onOpenAddModal}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              title="Add a college to the master queue"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add College</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
