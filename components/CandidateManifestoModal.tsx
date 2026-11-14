import React from 'react';
import { CandidateResponse, resolveImageUrl } from '../api';
import { CandidateAvatar } from './UIComponents';

interface CandidateManifestoModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateResponse | null;
  officeName?: string;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  canSelectMore?: boolean;
  isMulti?: boolean;
}

// Inline Markdown helper for **bold** and *italic*
const renderInlineMarkdown = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-bold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={idx} className="italic text-slate-800 dark:text-slate-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
};

// Formats manifesto text into headings, bullet lists, numbered lists, and paragraphs
export const renderFormattedManifesto = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: { type: 'bullet' | 'number'; items: string[] } | null = null;

  const flushList = () => {
    if (!currentList) return;
    if (currentList.type === 'bullet') {
      elements.push(
        <ul key={`list-${elements.length}`} className="my-3 space-y-2 pl-1">
          {currentList.items.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2.5 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed"
            >
              <span className="size-2 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-2 shrink-0" />
              <span className="flex-1">{renderInlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={`list-${elements.length}`} className="my-3 space-y-2.5 pl-1">
          {currentList.items.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-3 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed"
            >
              <span className="size-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 border border-indigo-200 dark:border-indigo-800">
                {idx + 1}
              </span>
              <span className="flex-1">{renderInlineMarkdown(item)}</span>
            </li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  lines.forEach((rawLine, lineIdx) => {
    const line = rawLine.trim();

    // Blank line
    if (!line) {
      flushList();
      elements.push(<div key={`blank-${lineIdx}`} className="h-2" />);
      return;
    }

    // Subtitle / Section Heading: ###, ##, #
    if (line.startsWith('#')) {
      flushList();
      const cleanHeader = line.replace(/^#+\s*/, '');
      elements.push(
        <div key={`header-${lineIdx}`} className="pt-4 pb-1">
          <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
            <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-lg">
              bookmark
            </span>
            {renderInlineMarkdown(cleanHeader)}
          </h4>
        </div>
      );
      return;
    }

    // Bullet point: -, *, •
    const bulletMatch = line.match(/^[-*•]\s+(.*)$/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== 'bullet') {
        flushList();
        currentList = { type: 'bullet', items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      return;
    }

    // Numbered list: 1. or 1)
    const numberMatch = line.match(/^\d+[.)]\s+(.*)$/);
    if (numberMatch) {
      if (!currentList || currentList.type !== 'number') {
        flushList();
        currentList = { type: 'number', items: [] };
      }
      currentList.items.push(numberMatch[1]);
      return;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p
        key={`p-${lineIdx}`}
        className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed"
      >
        {renderInlineMarkdown(line)}
      </p>
    );
  });

  flushList();
  return elements;
};

export const CandidateManifestoModal: React.FC<CandidateManifestoModalProps> = ({
  isOpen,
  onClose,
  candidate,
  officeName,
  isSelected,
  onToggleSelect,
  canSelectMore = true,
  isMulti = false,
}) => {
  if (!isOpen || !candidate) return null;

  const resolvedUrl = candidate.image_url ? resolveImageUrl(candidate.image_url) : '';
  const resolvedOffice = officeName || candidate.office?.description || 'Election Candidate';
  const hasManifesto = Boolean(candidate.manifesto_title || candidate.manifesto);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Profile Bar */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-50 to-indigo-50/40 dark:from-slate-900 dark:to-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative size-16 sm:size-20 rounded-2xl overflow-hidden bg-white dark:bg-slate-700 border-2 border-indigo-200 dark:border-slate-600 shadow-md flex items-center justify-center shrink-0">
              <CandidateAvatar
                src={resolvedUrl}
                name={candidate.name}
                iconClassName="text-3xl"
                textClassName="text-xs"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-block text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  #{candidate.candidate_code}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {resolvedOffice}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 leading-snug">
                {candidate.name}
              </h2>
              <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[14px]">menu_book</span>
                Official Candidate Manifesto & Action Agenda
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors shrink-0"
            title="Close Manifesto"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Scrollable Manifesto Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-5 flex-1">
          {/* Bold Header / Headline */}
          {candidate.manifesto_title ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-transparent border-l-4 border-l-indigo-600 border border-indigo-100 dark:border-indigo-900/40">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                Vision & Key Agenda
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-snug">
                {candidate.manifesto_title}
              </h3>
            </div>
          ) : null}

          {/* Detailed Formatted Manifesto Content */}
          {candidate.manifesto ? (
            <div className="prose dark:prose-invert max-w-none space-y-3">
              {renderFormattedManifesto(candidate.manifesto)}
            </div>
          ) : (
            <div className="py-12 px-6 text-center space-y-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <span className="material-symbols-outlined text-4xl text-slate-400 block">
                description
              </span>
              <h4 className="font-bold text-slate-700 dark:text-slate-300">
                Manifesto Not Yet Uploaded
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {candidate.name} has not submitted their detailed campaign manifesto. You may still vote for them or inspect other contestants for this office.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
          >
            Back to Ballot
          </button>

          {onToggleSelect && (
            <button
              type="button"
              disabled={!isSelected && !canSelectMore}
              onClick={() => {
                onToggleSelect();
                onClose();
              }}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 text-sm ${
                isSelected
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/25'
                  : !canSelectMore
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25'
              }`}
            >
              <span className="material-symbols-outlined text-lg">
                {isSelected ? 'remove_circle' : 'how_to_vote'}
              </span>
              {isSelected
                ? (isMulti ? 'Deselect Candidate' : 'Selected on Ballot')
                : !canSelectMore
                ? 'Selection Limit Reached'
                : `Vote for ${candidate.name.split(' ')[0]}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
