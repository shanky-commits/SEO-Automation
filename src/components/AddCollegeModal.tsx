import React, { useState } from 'react';
import { X, Plus, Sparkles, RefreshCw, CheckCircle2, AlertTriangle, ExternalLink, Globe } from 'lucide-react';

interface AddCollegeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCollege: (collegeData: {
    name: string;
    liveUrl: string;
    category: string;
    location: string;
    nirfRank?: string;
    existingContent: string;
  }) => void;
}

export const AddCollegeModal: React.FC<AddCollegeModalProps> = ({
  isOpen,
  onClose,
  onAddCollege
}) => {
  const [name, setName] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [category, setCategory] = useState('Management / MBA');
  const [location, setLocation] = useState('');
  const [nirfRank, setNirfRank] = useState('');
  const [existingContent, setExistingContent] = useState('');

  const [isFetching, setIsFetching] = useState(false);
  const [fetchSuccess, setFetchSuccess] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFetchFromLiveUrl = async (urlToFetch?: string) => {
    const targetUrl = urlToFetch || liveUrl;
    if (!targetUrl || !targetUrl.startsWith('http')) {
      setFetchError('Please enter a valid HTTP/HTTPS URL first');
      return;
    }

    setIsFetching(true);
    setFetchError(null);
    setFetchSuccess(null);

    try {
      const res = await fetch('/api/fetch-live-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });

      const data = await res.json();
      if (data.success && data.markdown) {
        setExistingContent(data.markdown);
        if (!name.trim() && (data.h1 || data.title)) {
          setName(data.h1 || data.title.split(':')[0]);
        }
        if (!location.trim()) {
          if (targetUrl.includes('jaipur')) setLocation('Jaipur, Rajasthan');
          else if (targetUrl.includes('bangalore')) setLocation('Bangalore, Karnataka');
          else if (targetUrl.includes('calcutta') || targetUrl.includes('kolkata')) setLocation('Kolkata, West Bengal');
          else if (targetUrl.includes('lucknow')) setLocation('Lucknow, Uttar Pradesh');
        }
        setFetchSuccess(`Successfully parsed live page! Extracted ${data.wordCount} words, ${data.tableCount} tables, and ${data.faqCount} FAQs.`);
      } else {
        setFetchError(data.error || 'Failed to extract content from URL');
      }
    } catch (err: any) {
      setFetchError(err.message || 'Error connecting to live server');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSelectPreset = (preset: { name: string; url: string; location: string; rank: string }) => {
    setName(preset.name);
    setLiveUrl(preset.url);
    setLocation(preset.location);
    setNirfRank(preset.rank);
    setFetchSuccess(null);
    setFetchError(null);
    handleFetchFromLiveUrl(preset.url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !liveUrl.trim()) return;

    onAddCollege({
      name: name.trim(),
      liveUrl: liveUrl.trim(),
      category,
      location: location.trim() || 'India',
      nirfRank: nirfRank.trim() || undefined,
      existingContent:
        existingContent.trim() ||
        `# ${name} - Admission & Fees\n\n${name} offers various degree programs. Fees and admissions are merit-based.`
    });

    setName('');
    setLiveUrl('');
    setLocation('');
    setNirfRank('');
    setExistingContent('');
    setFetchSuccess(null);
    setFetchError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Add College to Sequential Master Queue
            </h3>
            <p className="text-xs text-stone-500">
              New colleges are appended to the end of the queue in strict order.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verified Live Presets */}
        <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-2">
          <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>Select Verified Live Portal Page (Instant 1-Click Fetch):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() =>
                handleSelectPreset({
                  name: 'Jaipuria Institute of Management, Jaipur',
                  url: 'https://vai2110.github.io/college-cms/content/jaipuria-jaipur-mba/overview.html',
                  location: 'Jaipur, Rajasthan',
                  rank: '#75-100 Management Band (NIRF)'
                })
              }
              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-stone-700 hover:text-blue-700 border border-stone-200 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
            >
              Jaipuria Jaipur MBA (CMS)
            </button>
            <button
              type="button"
              onClick={() =>
                handleSelectPreset({
                  name: 'IIM Bangalore (Indian Institute of Management)',
                  url: 'https://vai2110.github.io/mba-admission-portal/iim-bangalore.html',
                  location: 'Bengaluru, Karnataka',
                  rank: '#2 Management (NIRF 2024)'
                })
              }
              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-stone-700 hover:text-blue-700 border border-stone-200 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
            >
              IIM Bangalore
            </button>
            <button
              type="button"
              onClick={() =>
                handleSelectPreset({
                  name: 'IIM Calcutta (Indian Institute of Management)',
                  url: 'https://vai2110.github.io/mba-admission-portal/iim-calcutta.html',
                  location: 'Kolkata, West Bengal',
                  rank: '#5 Management (NIRF 2024)'
                })
              }
              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-stone-700 hover:text-blue-700 border border-stone-200 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
            >
              IIM Calcutta
            </button>
            <button
              type="button"
              onClick={() =>
                handleSelectPreset({
                  name: 'IIM Lucknow (Indian Institute of Management)',
                  url: 'https://vai2110.github.io/mba-admission-portal/iim-lucknow.html',
                  location: 'Lucknow, Uttar Pradesh',
                  rank: '#7 Management (NIRF 2024)'
                })
              }
              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-stone-700 hover:text-blue-700 border border-stone-200 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
            >
              IIM Lucknow
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-stone-700 mb-1">Live Page URL *</label>
            <div className="flex gap-2">
              <input
                type="url"
                required
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                placeholder="https://vai2110.github.io/college-cms/content/jaipuria-jaipur-mba/overview.html"
                className="flex-1 p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
              />
              <button
                type="button"
                onClick={() => handleFetchFromLiveUrl()}
                disabled={isFetching || !liveUrl.trim()}
                className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
              >
                {isFetching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>{isFetching ? 'Fetching...' : 'Fetch Live URL'}</span>
              </button>
            </div>
            {fetchSuccess && (
              <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[11px] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{fetchSuccess}</span>
              </div>
            )}
            {fetchError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 text-red-800 rounded-lg text-[11px] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span>{fetchError}</span>
              </div>
            )}
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">College Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jaipuria Institute of Management, Jaipur"
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option>Management / MBA</option>
                <option>Engineering / Technology</option>
                <option>Medical / Healthcare</option>
                <option>Law / Legal Studies</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Jaipur, Rajasthan"
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">
              NIRF 2024 / Accreditations
            </label>
            <input
              type="text"
              value={nirfRank}
              onChange={(e) => setNirfRank(e.target.value)}
              placeholder="e.g. #75-100 Management Band (NIRF 2024)"
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-stone-700">
                Extracted Live Content (Markdown)
              </label>
              <span className="text-[11px] text-stone-400">
                {existingContent.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <textarea
              rows={4}
              value={existingContent}
              onChange={(e) => setExistingContent(e.target.value)}
              placeholder="Live page text will be populated automatically when you click 'Fetch Live URL'..."
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-[11px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Sequential Queue</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
