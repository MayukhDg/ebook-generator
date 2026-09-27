'use client';

import React from 'react';
import { 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Quote, 
  Bookmark, 
  HelpCircle,
  Layers,
  ChevronRight
} from 'lucide-react';

interface BlogPostContentProps {
  content: string;
}

// Helper to render inline formatting: bold, italic, code, links
function renderInline(text: string): React.ReactNode {
  if (!text) return null;

  // Split by inline markdown tokens: `code`, **bold**, *italic*, [link](url)
  const tokens: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // 1. Inline code: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      tokens.push(
        <code
          key={keyIdx++}
          className="rounded bg-slate-800/90 border border-slate-700/60 px-1.5 py-0.5 font-mono text-xs text-amber-300"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // 2. Bold: **text**
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      tokens.push(
        <strong key={keyIdx++} className="font-bold text-white tracking-wide">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // 3. Italic: *text* (or _text_)
    const italicMatch = remaining.match(/^\*([^*]+)\*/) || remaining.match(/^_([^_]+)_/);
    if (italicMatch) {
      tokens.push(
        <em key={keyIdx++} className="italic text-slate-200">
          {italicMatch[1]}
        </em>
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // 4. Markdown link: [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      tokens.push(
        <a
          key={keyIdx++}
          href={linkMatch[2]}
          target={linkMatch[2].startsWith('http') ? '_blank' : undefined}
          rel={linkMatch[2].startsWith('http') ? 'noopener noreferrer' : undefined}
          className="font-medium text-amber-400 hover:text-amber-300 underline underline-offset-4 decoration-amber-500/40 hover:decoration-amber-300 transition-colors"
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Plain text until next token
    const nextSpecial = remaining.search(/[`*_\[]/);
    if (nextSpecial === -1) {
      tokens.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      // Just a lone special char
      tokens.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      tokens.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return tokens.length === 1 ? tokens[0] : <>{tokens}</>;
}

export default function BlogPostContent({ content }: BlogPostContentProps) {
  if (!content) return null;

  // Normalize line endings and tabs
  const normalized = content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove zero-width spaces or unexpected artifacts
    .replace(/\u200B/g, '');

  const lines = normalized.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let elementKey = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // -------------------------------------------------------------------------
    // Blank line -> skip
    // -------------------------------------------------------------------------
    if (!line) {
      i++;
      continue;
    }

    // -------------------------------------------------------------------------
    // 1. Code Block: ```lang ... ```
    // -------------------------------------------------------------------------
    if (line.startsWith('```')) {
      const lang = line.replace('```', '').trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip ending ```

      elements.push(
        <div key={elementKey++} className="my-8 rounded-2xl border border-slate-800 bg-slate-950/90 overflow-hidden shadow-2xl">
          {lang && (
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-[11px] font-mono text-slate-400">
              <span>{lang.toUpperCase()}</span>
              <span className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-700 inline-block" />
                <span className="h-2 w-2 rounded-full bg-slate-700 inline-block" />
                <span className="h-2 w-2 rounded-full bg-slate-700 inline-block" />
              </span>
            </div>
          )}
          <pre className="p-4 sm:p-5 font-mono text-xs sm:text-sm text-slate-200 overflow-x-auto leading-relaxed">
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      );
      continue;
    }

    // -------------------------------------------------------------------------
    // 2. Horizontal Divider: --- or ***
    // -------------------------------------------------------------------------
    if (line === '---' || line === '***' || line === '___') {
      elements.push(
        <div key={elementKey++} className="my-10 flex items-center justify-center">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
        </div>
      );
      i++;
      continue;
    }

    // -------------------------------------------------------------------------
    // 3. Table: starts with '|' OR contains multiple tabs '\t'
    // -------------------------------------------------------------------------
    if (line.startsWith('|') || (rawLine.includes('\t') && rawLine.split('\t').filter(Boolean).length >= 2)) {
      const tableLines: string[] = [];
      const isPipeTable = line.startsWith('|');

      while (i < lines.length) {
        const cur = lines[i].trim();
        if (!cur) break;
        if (isPipeTable && !cur.startsWith('|')) break;
        if (!isPipeTable && !lines[i].includes('\t')) break;
        tableLines.push(lines[i]);
        i++;
      }

      // Parse table rows
      const parsedRows: string[][] = [];
      let isFirstRowHeader = true;

      for (const tLine of tableLines) {
        if (tLine.includes('---')) continue; // Markdown separator line

        let cells: string[] = [];
        if (isPipeTable) {
          cells = tLine
            .split('|')
            .map((c) => c.trim())
            .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
        } else {
          cells = tLine.split('\t').map((c) => c.trim()).filter(Boolean);
        }

        if (cells.length > 0) {
          parsedRows.push(cells);
        }
      }

      if (parsedRows.length > 0) {
        const headerRow = parsedRows[0];
        const bodyRows = parsedRows.slice(1);

        elements.push(
          <div key={elementKey++} className="my-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-amber-300">
                    {headerRow.map((cell, cIdx) => (
                      <th
                        key={cIdx}
                        className="py-3.5 px-4 font-bold uppercase tracking-wider text-xs whitespace-nowrap"
                      >
                        {renderInline(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {bodyRows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={rIdx % 2 === 0 ? 'bg-slate-950/30 hover:bg-slate-900/40 transition-colors' : 'bg-slate-900/20 hover:bg-slate-900/40 transition-colors'}
                    >
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="py-3 px-4 text-slate-300 leading-normal">
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }
      continue;
    }

    // -------------------------------------------------------------------------
    // 4. Workflow / Pipeline Diagram: [Step 1] -> [Step 2] -> [Step 3]
    // -------------------------------------------------------------------------
    if (line.includes('->') && line.includes('[') && line.includes(']')) {
      const parts = line.split('->').map((p) => p.replace(/[\[\]]/g, '').trim()).filter(Boolean);
      if (parts.length >= 2) {
        elements.push(
          <div key={elementKey++} className="my-8 rounded-2xl border border-amber-500/20 bg-slate-950/80 p-5 shadow-lg">
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> Sequential Execution Pipeline
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {parts.map((part, pIdx) => (
                <React.Fragment key={pIdx}>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-white shadow-sm">
                    {part}
                  </div>
                  {pIdx < parts.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-amber-400 shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        );
        i++;
        continue;
      }
    }

    // -------------------------------------------------------------------------
    // 5. Headings: #, ##, ###, or Numbered Section Titles
    // -------------------------------------------------------------------------
    // Markdown H1 / H2
    if (line.startsWith('# ') || line.startsWith('## ')) {
      const headingText = line.replace(/^#+\s*/, '').trim();
      elements.push(
        <h2
          key={elementKey++}
          className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-12 mb-4 pt-6 border-b border-slate-800/80 pb-3 flex items-center gap-3"
        >
          <span className="h-5 w-1 rounded-full bg-gradient-to-b from-amber-400 to-orange-500 shrink-0 inline-block" />
          <span>{renderInline(headingText)}</span>
        </h2>
      );
      i++;
      continue;
    }

    // Markdown H3 / H4
    if (line.startsWith('### ') || line.startsWith('#### ')) {
      const headingText = line.replace(/^#+\s*/, '').trim();
      elements.push(
        <h3
          key={elementKey++}
          className="text-lg sm:text-xl font-bold text-amber-400 mt-8 mb-3 tracking-tight flex items-center gap-2"
        >
          <span className="text-amber-500/70 font-mono text-sm">#</span>
          <span>{renderInline(headingText)}</span>
        </h3>
      );
      i++;
      continue;
    }

    // Unmarked Major Headings: "1. Title", "Step 1: Title", "The Core Concept: ...", "The Solution: ..."
    if (
      /^Step\s+\d+:\s+/i.test(line) ||
      /^\d+[\.\)]\s+([A-Z][^.]{3,80})$/.test(line.replace(/\t/g, ' ')) ||
      (/^(The\s+(Core\s+Concept|Solution|Framework|Result)|Key\s+Takeaways|Summary\s+Checklist):\s*/i.test(line) && line.length < 80)
    ) {
      elements.push(
        <h2
          key={elementKey++}
          className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-10 mb-4 pt-4 border-b border-slate-800/60 pb-2.5 flex items-center gap-3"
        >
          <span className="h-4 w-1 rounded-full bg-amber-400 shrink-0 inline-block" />
          <span>{renderInline(line.replace(/\t/g, ' '))}</span>
        </h2>
      );
      i++;
      continue;
    }

    // -------------------------------------------------------------------------
    // 6. Blockquote or Epigraph: starts with '>' or starts/ends with quotes
    // -------------------------------------------------------------------------
    if (line.startsWith('>') || (line.startsWith('"') && line.endsWith('"') && line.length > 50)) {
      const quoteText = line.replace(/^>\s*/, '').replace(/^"|"$/g, '').trim();
      elements.push(
        <blockquote
          key={elementKey++}
          className="my-7 rounded-2xl border-l-4 border-amber-500 bg-amber-500/5 px-6 py-4 italic text-slate-200 text-base sm:text-lg leading-relaxed shadow-sm"
        >
          <p>{renderInline(quoteText)}</p>
        </blockquote>
      );
      i++;
      continue;
    }

    // -------------------------------------------------------------------------
    // 7. Callout Card: "The Catalyst: ...", "Audience Anchor: ...", "Context Eviction: ..."
    // -------------------------------------------------------------------------
    const calloutMatch = line.match(/^([A-Z][A-Za-z\s]{2,25}):\s+(.+)$/);
    if (calloutMatch && calloutMatch[1].length < 24 && !calloutMatch[1].toLowerCase().includes('http')) {
      const label = calloutMatch[1].trim();
      const rest = calloutMatch[2].trim();

      elements.push(
        <div
          key={elementKey++}
          className="my-5 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 to-slate-950/80 p-4 sm:p-5 shadow-md flex items-start gap-3.5"
        >
          <div className="mt-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 p-1.5 text-amber-400 shrink-0">
            <Bookmark className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
              {label}
            </div>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {renderInline(rest)}
            </p>
          </div>
        </div>
      );
      i++;
      continue;
    }

    // -------------------------------------------------------------------------
    // 8. Bullet List: lines starting with '•', '-', '*'
    // -------------------------------------------------------------------------
    const isBulletItem = (str: string) => /^[•\-\*]\s+/.test(str) || /^•\t/.test(str);
    if (isBulletItem(line)) {
      const listItems: string[] = [];
      while (i < lines.length) {
        const cur = lines[i].trim();
        if (!cur) break;
        if (!isBulletItem(cur)) break;
        // Strip bullet token
        const cleaned = cur.replace(/^[•\-\*]\s*/, '').replace(/^•\t/, '').trim();
        listItems.push(cleaned);
        i++;
      }

      elements.push(
        <ul key={elementKey++} className="my-6 space-y-3 pl-1">
          {listItems.map((item, lIdx) => (
            <li key={lIdx} className="flex items-start gap-3 text-base text-slate-300 leading-relaxed">
              <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0 mt-2.5 inline-block shadow-sm shadow-amber-400/40" />
              <div className="flex-1">{renderInline(item)}</div>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // -------------------------------------------------------------------------
    // 9. Numbered List: lines starting with '1. ', '2. ', etc.
    // -------------------------------------------------------------------------
    const isNumberedItem = (str: string) => /^\d+[\.\)]\s+/.test(str) || /^\d+\.\t/.test(str);
    if (isNumberedItem(line)) {
      const listItems: { num: string; text: string }[] = [];
      while (i < lines.length) {
        const cur = lines[i].trim();
        if (!cur) break;
        const match = cur.match(/^(\d+)[\.\)]\s*(.*)$/);
        if (!match) break;
        listItems.push({ num: match[1], text: match[2].trim() });
        i++;
      }

      elements.push(
        <ol key={elementKey++} className="my-6 space-y-3.5 pl-1">
          {listItems.map((item, lIdx) => (
            <li key={lIdx} className="flex items-start gap-3.5 text-base text-slate-300 leading-relaxed">
              <span className="h-6 w-6 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 font-mono shadow-sm">
                {item.num}
              </span>
              <div className="flex-1 pt-0.5">{renderInline(item.text)}</div>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // -------------------------------------------------------------------------
    // 10. Standard Narrative Paragraph
    // -------------------------------------------------------------------------
    // Collect consecutive narrative lines that belong to this paragraph
    const paraLines: string[] = [line];
    i++;

    while (i < lines.length) {
      const nextRaw = lines[i];
      const next = nextRaw.trim();
      if (!next) break; // empty line terminates paragraph

      // Stop if next line is a special element
      const nextIsHeading =
        next.startsWith('#') ||
        /^Step\s+\d+:\s+/i.test(next) ||
        /^\d+[\.\)]\s+([A-Z][^.]{3,80})$/.test(next.replace(/\t/g, ' ')) ||
        (/^(The\s+(Core\s+Concept|Solution|Framework|Result)|Key\s+Takeaways|Summary\s+Checklist):\s*/i.test(next) && next.length < 80);

      const nextIsTable = next.startsWith('|') || (nextRaw.includes('\t') && nextRaw.split('\t').filter(Boolean).length >= 2);
      const nextIsPipeline = next.includes('->') && next.includes('[') && next.includes(']');
      const nextIsCallout = /^[A-Z][A-Za-z\s]{2,25}:\s+.+$/.test(next) && !next.toLowerCase().startsWith('http');
      const nextIsQuote = next.startsWith('>') || (next.startsWith('"') && next.endsWith('"') && next.length > 50);
      const nextIsDivider = next === '---' || next === '***' || next === '___';
      const nextIsCodeFence = next.startsWith('```');

      if (
        nextIsHeading ||
        nextIsDivider ||
        nextIsCodeFence ||
        nextIsTable ||
        nextIsPipeline ||
        nextIsCallout ||
        nextIsQuote ||
        isBulletItem(next) ||
        isNumberedItem(next)
      ) {
        break;
      }

      paraLines.push(next);
      i++;
    }

    elements.push(
      <p
        key={elementKey++}
        className="text-base sm:text-lg text-slate-300 leading-[1.8] mb-6 font-normal tracking-normal"
      >
        {renderInline(paraLines.join(' '))}
      </p>
    );
  }

  return (
    <div className="prose prose-invert max-w-none text-slate-200">
      {elements}
    </div>
  );
}
