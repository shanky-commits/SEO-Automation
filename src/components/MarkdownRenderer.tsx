import React from 'react';

interface MarkdownRendererProps {
  content: string;
  isMobileView?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isMobileView = false }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let tableRows: string[] = [];
  let inTable = false;
  let keyIndex = 0;

  const flushTable = () => {
    if (tableRows.length === 0) return;
    const headerLine = tableRows[0];
    const dataLines = tableRows.slice(2); // skip separator

    const parseCells = (row: string) =>
      row
        .split('|')
        .map((c) => c.trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

    const headers = parseCells(headerLine);

    if (isMobileView) {
      // NON-NEGOTIABLE RULE 6: Stacked mobile card format, ZERO horizontal scroll
      elements.push(
        <div key={`table-card-group-${keyIndex++}`} className="my-5 space-y-3">
          <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            Mobile-Optimized Card Stack (Zero Horizontal Scroll)
          </div>
          {dataLines.map((row, rIdx) => {
            const cells = parseCells(row);
            return (
              <div
                key={`card-${rIdx}`}
                className="bg-white rounded-xl border border-stone-200 p-3.5 shadow-xs space-y-2"
              >
                {headers.map((h, hIdx) => (
                  <div key={`cell-${hIdx}`} className="text-xs flex flex-col sm:flex-row sm:justify-between py-1 border-b border-stone-100 last:border-0">
                    <span className="font-semibold text-stone-500 uppercase tracking-wider text-[10px]">{h.replace(/\*\*/g, '')}</span>
                    <span className="text-stone-900 font-medium mt-0.5 sm:mt-0 text-left sm:text-right">{renderInlineText(cells[hIdx] || '—')}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      );
    } else {
      // Desktop format: clean high-contrast table
      elements.push(
        <div key={`table-${keyIndex++}`} className="my-6 overflow-hidden rounded-xl border border-stone-200 shadow-xs bg-white">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                {headers.map((h, i) => (
                  <th key={i} className="px-4 py-3 font-semibold text-stone-700 text-xs tracking-wider uppercase">
                    {renderInlineText(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {dataLines.map((row, rIdx) => {
                const cells = parseCells(row);
                return (
                  <tr key={rIdx} className="hover:bg-stone-50/70 transition-colors">
                    {cells.map((c, cIdx) => (
                      <td key={cIdx} className="px-4 py-3 text-stone-800 text-xs leading-relaxed">
                        {renderInlineText(c)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    tableRows = [];
    inTable = false;
  };

  const renderInlineText = (text: string): React.ReactNode => {
    // Links: [Label](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    // Bold: **text**
    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    // Simplified regex replacement
    const processedText = text;
    // Process markdown link
    const linkMatches = Array.from(processedText.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g));
    if (linkMatches.length > 0) {
      let currentIdx = 0;
      linkMatches.forEach((m, idx) => {
        const pre = processedText.substring(currentIdx, m.index);
        if (pre) parts.push(renderBoldItalics(pre, `pre-${idx}`));
        parts.push(
          <a
            key={`link-${idx}`}
            href={m[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 underline font-medium hover:text-blue-900 transition-colors inline-flex items-center gap-1"
          >
            {m[1]}
          </a>
        );
        currentIdx = (m.index || 0) + m[0].length;
      });
      const tail = processedText.substring(currentIdx);
      if (tail) parts.push(renderBoldItalics(tail, 'tail'));
      return <>{parts}</>;
    }

    return renderBoldItalics(processedText, 'pure');
  };

  const renderBoldItalics = (text: string, keyPrefix: string) => {
    // Handle **bold**
    const boldSplit = text.split(/\*\*([^*]+)\*\*/g);
    if (boldSplit.length > 1) {
      return (
        <span key={keyPrefix}>
          {boldSplit.map((chunk, i) =>
            i % 2 === 1 ? (
              <strong key={i} className="font-semibold text-stone-900">
                {chunk}
              </strong>
            ) : (
              chunk
            )
          )}
        </span>
      );
    }
    return text;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Check table row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      tableRows.push(trimmed);
      return;
    } else if (inTable) {
      flushTable();
    }

    // Headings
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${idx}`} className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 mt-6 mb-4 pb-2 border-b border-stone-200">
          {trimmed.replace('# ', '')}
        </h1>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${idx}`} className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-900 mt-8 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-blue-600 inline-block"></span>
          {trimmed.replace('## ', '')}
        </h2>
      );
    } else if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${idx}`} className="text-base sm:text-lg font-semibold text-stone-800 mt-6 mb-2">
          {trimmed.replace('### ', '')}
        </h3>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <li key={`li-${idx}`} className="ml-5 list-disc text-sm text-stone-700 my-1 leading-relaxed">
          {renderInlineText(trimmed.replace(/^[-*]\s+/, ''))}
        </li>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      elements.push(
        <div key={`num-${idx}`} className="flex gap-2 my-2 text-sm text-stone-800 leading-relaxed pl-1">
          <span className="font-semibold text-blue-700 min-w-[20px]">{trimmed.match(/^\d+\./)?.[0]}</span>
          <span>{renderInlineText(trimmed.replace(/^\d+\.\s+/, ''))}</span>
        </div>
      );
    } else if (trimmed.startsWith('---')) {
      elements.push(<hr key={`hr-${idx}`} className="my-8 border-stone-200" />);
    } else if (trimmed.length > 0) {
      elements.push(
        <p key={`p-${idx}`} className="text-sm text-stone-700 leading-relaxed my-3">
          {renderInlineText(trimmed)}
        </p>
      );
    }
  });

  if (inTable) {
    flushTable();
  }

  return <div className="markdown-article">{elements}</div>;
};
