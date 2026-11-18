import React, { useRef } from 'react';
import { CandidateResponse, resolveImageUrl } from '../api';
import { CandidateAvatar } from './UIComponents';

interface CandidatePhotoCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'single' | 'office';
  candidate?: CandidateResponse | null;
  candidates?: CandidateResponse[];
  officeTitle?: string;
}

export const CandidatePhotoCardModal: React.FC<CandidatePhotoCardModalProps> = ({
  isOpen,
  onClose,
  mode,
  candidate,
  candidates = [],
  officeTitle,
}) => {
  if (!isOpen) return null;

  const candidateList = mode === 'single' ? (candidate ? [candidate] : []) : candidates;
  const isSingle = mode === 'single';

  const printContainerRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printContainerRef.current) {
      window.print();
      return;
    }

    try {
      let iframe = document.getElementById('print-photo-cards-iframe') as HTMLIFrameElement | null;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'print-photo-cards-iframe';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);
      }

      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map((node) => node.outerHTML)
        .join('\n');

      const printHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${isSingle ? `Candidate Card - ${candidate?.name}` : `Candidate Cards - ${officeTitle || 'All Offices'}`}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
          ${styles}
          <style>
            @page {
              size: ${isSingle ? 'A4 portrait' : 'A4 landscape'};
              margin: 12mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              background: #ffffff !important;
              color: #1e293b !important;
              margin: 0 !important;
              padding: 0 !important;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              font-size: 12px;
            }
            .candidate-print-container {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 auto !important;
              padding: 0 !important;
            }
            .candidate-photo-card {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              background: #ffffff !important;
              border: 1px solid #cbd5e1 !important;
              margin-bottom: 10px;
            }
            .no-print {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div class="candidate-print-container">
            ${printContainerRef.current.innerHTML}
          </div>
        </body>
        </html>
      `;

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(printHtml);
        doc.close();

        setTimeout(() => {
          try {
            iframe?.contentWindow?.focus();
            iframe?.contentWindow?.print();
          } catch (e) {
            window.print();
          }
        }, 350);
      } else {
        window.print();
      }
    } catch (err) {
      console.warn('Iframe print error, falling back to window.print():', err);
      window.print();
    }
  };

  return (
    <div className="candidate-print-modal fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-5xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-scale-in">
        {/* Modal Top Control Bar */}
        <div className="no-print p-4 sm:p-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-slate-600 dark:text-slate-300">badge</span>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                {isSingle
                  ? `Candidate Card: ${candidate?.name}`
                  : `Candidate Cards — ${officeTitle || 'All Offices'}`}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isSingle
                  ? 'Official candidate identification card'
                  : `${candidateList.length} candidate card${candidateList.length === 1 ? '' : 's'} ready for print / PDF`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-lg bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-sm flex items-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close Preview"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Scrollable Printable Container */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-8 bg-slate-50 dark:bg-slate-950 print:bg-white print:p-0 print:overflow-visible">
          <div ref={printContainerRef} className="candidate-print-container max-w-4xl mx-auto space-y-6 print:space-y-4">
            {/* Document Header */}
            <div className="text-center pb-3 border-b border-slate-300">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                National Examinations Council (NECO) MCS
              </p>
              <h1 className="text-lg font-bold uppercase text-slate-900 dark:text-white">
                NECO Multi-Purpose Co-operative Society Limited
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Electoral Committee (ELECO) • Official Candidate Identification Cards
              </p>
              {officeTitle && (
                <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200 uppercase">
                  Office: {officeTitle}
                </p>
              )}
            </div>

            {/* Candidates Card Grid */}
            {candidateList.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No candidates available to display.
              </div>
            ) : (
              <div
                className={`grid gap-4 ${
                  isSingle ? 'grid-cols-1 max-w-xl mx-auto' : 'grid-cols-1 md:grid-cols-2 print:grid-cols-2'
                }`}
              >
                {candidateList.map((cand) => {
                  const resolvedUrl = cand.image_url ? resolveImageUrl(cand.image_url) : '';
                  const resolvedOffice = cand.office?.description || cand.office?.office_code || officeTitle || 'General Office';
                  const voteCount = cand.vote_count ?? 0;

                  return (
                    <div
                      key={cand.id}
                      className="candidate-photo-card bg-white rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden print:border print:border-slate-400 flex flex-col justify-between page-break-avoid"
                      style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                    >
                      {/* Top Bar */}
                      <div className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          NECO MCS • Official Candidate
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                          #{cand.candidate_code}
                        </span>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="flex items-start gap-4">
                          {/* Candidate Portrait */}
                          <div className="size-24 sm:size-28 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                            <CandidateAvatar
                              src={resolvedUrl}
                              name={cand.name}
                              iconClassName="text-5xl"
                              textClassName="text-xs"
                            />
                          </div>

                          {/* Candidate Info */}
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">
                              Contesting For:
                            </span>
                            <div className="text-xs font-bold text-slate-600 uppercase leading-snug line-clamp-2">
                              {resolvedOffice}
                            </div>
                            <h3 className="text-base font-bold text-slate-900 uppercase mt-1 leading-tight">
                              {cand.name}
                            </h3>

                            {/* Status */}
                            <div className="mt-1.5 text-[11px] font-semibold text-slate-500">
                              {cand.is_disqualified ? '✗ Disqualified' : '✓ Certified Candidate'}
                            </div>
                          </div>
                        </div>

                        {/* Staff Particulars */}
                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded border border-slate-100">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase block">MCS No.</span>
                            <span className="font-mono font-bold text-slate-700 text-[11px]">
                              {cand.mcs_number || cand.candidate_code || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase block">File No.</span>
                            <span className="font-mono font-bold text-slate-700 text-[11px]">
                              {cand.file_no || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase block">CONRAISS</span>
                            <span className="font-bold text-slate-700 text-[11px]">
                              {cand.conraiss || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase block">Station</span>
                            <span className="font-bold text-slate-700 text-[11px] truncate block" title={cand.station || ''}>
                              {cand.station || 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* Manifesto (if available) */}
                        {cand.manifesto_title && (
                          <div className="text-xs text-slate-600 border-l-2 border-slate-300 pl-3 py-1">
                            <span className="text-[9px] font-bold uppercase text-slate-400 block">Vision / Slogan:</span>
                            <p className="font-medium italic text-[11px] line-clamp-1">"{cand.manifesto_title}"</p>
                          </div>
                        )}

                        {/* Votes Box */}
                        <div className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-slate-500">Votes Received</span>
                          <span className="text-base font-bold text-slate-800 font-mono">
                            {voteCount}
                            <span className="text-[10px] font-normal text-slate-500 ml-1">
                              vote{voteCount === 1 ? '' : 's'}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="bg-slate-50 px-4 py-1.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Official Election Photo Card</span>
                        <span className="font-mono">{new Date().toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Document Sign-off */}
            <div className="pt-4 border-t border-slate-300 text-center space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs text-slate-600 pt-4">
                <div className="border-t border-slate-400 pt-1">
                  <span className="font-bold block text-slate-700">ELECO Chairman</span>
                  <span className="text-[10px] text-slate-400">Signature & Date</span>
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <span className="font-bold block text-slate-700">ELECO Secretary</span>
                  <span className="text-[10px] text-slate-400">Signature & Date</span>
                </div>
                <div className="border-t border-slate-400 pt-1 col-span-2 sm:col-span-1">
                  <span className="font-bold block text-slate-700">Official Seal</span>
                  <span className="text-[10px] text-slate-400">NECO MCS Electoral Board</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Generated via NECO MCS Electronic Voting & Accreditation System
              </p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="no-print p-4 sm:p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click <b>Print / Save PDF</b> to generate the official document.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-lg bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-sm flex items-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
