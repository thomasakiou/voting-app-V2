import React, { useRef } from 'react';
import { OfficeResponse, resolveImageUrl } from '../api';
import { CandidateAvatar } from './UIComponents';

interface OfficeResultsPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  office: OfficeResponse | null;
  results: any;
  totalVotes: number;
}

export const OfficeResultsPDFModal: React.FC<OfficeResultsPDFModalProps> = ({
  isOpen,
  onClose,
  office,
  results,
  totalVotes,
}) => {
  if (!isOpen) return null;

  const printContainerRef = useRef<HTMLDivElement>(null);

  // Candidates sorted strictly descending by vote_count
  const rawList: any[] = results?.results ? results.results : [];
  const sortedCandidates = [...rawList].sort(
    (a, b) => (Number(b.vote_count) || 0) - (Number(a.vote_count) || 0)
  );

  const officeName = office?.description || results?.office_name || 'Electoral Office';
  const officeCode = office?.office_code || results?.office_code || '';
  const topCandidate = sortedCandidates.length > 0 ? sortedCandidates[0] : null;
  const isWinnerDeclared = totalVotes > 0 && topCandidate && Number(topCandidate.vote_count) > 0;

  const handlePrint = () => {
    if (!printContainerRef.current) {
      window.print();
      return;
    }

    try {
      let iframe = document.getElementById('print-office-results-iframe') as HTMLIFrameElement | null;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'print-office-results-iframe';
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
          <title>Official Results - ${officeName}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
          ${styles}
          <style>
            @page {
              size: A4 portrait;
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
            .results-print-container {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 auto !important;
              padding: 0 !important;
            }
            .page-break-avoid {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .no-print {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div class="results-print-container">
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
      console.warn('Iframe print fallback to window.print():', err);
      window.print();
    }
  };

  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-5xl max-h-[94vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-scale-in">
        {/* Modal Top Control Bar (Hidden during Print) */}
        <div className="no-print p-4 sm:p-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-slate-600 dark:text-slate-300">picture_as_pdf</span>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                Results: {officeName}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Descending order of votes received • Ready for print / PDF
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
          <div ref={printContainerRef} className="results-print-container max-w-4xl mx-auto space-y-5 print:space-y-4 bg-white text-slate-800 p-6 sm:p-8 rounded-xl border border-slate-200 print:shadow-none print:border-none print:p-0">
            {/* Official Header */}
            <div className="text-center pb-4 border-b border-slate-300">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                NECO MCS ELECTORAL COMMITTEE (ELECO)
              </p>
              <h1 className="text-lg font-bold uppercase text-slate-900">
                NECO MULTI-PURPOSE CO-OPERATIVE SOCIETY LIMITED
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Headquarters, National Examinations Council (NECO), Minna, Niger State
              </p>
              <p className="mt-2 text-sm font-bold uppercase text-slate-700 tracking-wide">
                OFFICIAL ELECTION RESULTS &amp; CERTIFICATE OF RETURN
              </p>
            </div>

            {/* Office & Summary Info */}
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Contested Office:</span>
                  <h2 className="text-base font-bold uppercase text-slate-900">{officeName}</h2>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Office Code:</span>
                  <div className="font-mono text-sm font-bold text-slate-700">#{officeCode || 'N/A'}</div>
                </div>
              </div>

              {/* Statistics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                <div className="p-2 bg-slate-50 rounded border border-slate-100">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Total Votes Cast</div>
                  <div className="text-lg font-bold text-slate-900">{totalVotes}</div>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-100">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Candidates</div>
                  <div className="text-lg font-bold text-slate-900">{sortedCandidates.length}</div>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-100">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Declaration Date</div>
                  <div className="text-xs font-semibold text-slate-700 mt-1">{currentDate}</div>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-100">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Status</div>
                  <div className="text-xs font-bold text-slate-700 mt-1">CERTIFIED</div>
                </div>
              </div>
            </div>

            {/* Winner Box (if votes cast) */}
            {isWinnerDeclared && topCandidate && (
              <div className="page-break-avoid rounded-lg border border-slate-300 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 text-white font-bold text-xs uppercase tracking-wider">
                    ★ Elected Winner
                  </span>
                  <span className="text-xs text-slate-500">
                    Highest votes scored in this category
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  {/* Winner Portrait */}
                  <div className="size-24 rounded-lg overflow-hidden bg-slate-100 border border-slate-300 shrink-0 flex items-center justify-center">
                    <CandidateAvatar
                      src={topCandidate.image_url ? resolveImageUrl(topCandidate.image_url) : ''}
                      name={topCandidate.candidate_name}
                      iconClassName="text-5xl"
                      textClassName="text-sm font-bold"
                    />
                  </div>

                  {/* Winner Details */}
                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <h3 className="text-base font-bold text-slate-900 uppercase">
                      {topCandidate.candidate_name}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-600">
                      <span className="font-mono">
                        MCS No: <strong>{topCandidate.mcs_number || topCandidate.candidate_code}</strong>
                      </span>
                      <span>•</span>
                      <span className="font-mono">
                        File No: <strong>{topCandidate.file_no || 'N/A'}</strong>
                      </span>
                      {topCandidate.conraiss && (
                        <>
                          <span>•</span>
                          <span>CONRAISS: <strong>{topCandidate.conraiss}</strong></span>
                        </>
                      )}
                      {topCandidate.station && (
                        <>
                          <span>•</span>
                          <span>Station: <strong>{topCandidate.station}</strong></span>
                        </>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-center sm:justify-start gap-6 text-sm">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Votes Scored:</span>
                        <span className="text-lg font-bold text-slate-900">
                          {topCandidate.vote_count}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Vote Share:</span>
                        <span className="text-lg font-bold text-slate-900">
                          {totalVotes > 0 ? ((topCandidate.vote_count / totalVotes) * 100).toFixed(1) : '0.0'}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Candidates Results Table */}
            <div className="page-break-avoid">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wide">
                  Results — Descending Order of Votes
                </h3>
                <span className="text-[11px] text-slate-400">
                  {sortedCandidates.length} candidate{sortedCandidates.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="overflow-hidden rounded border border-slate-300">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-2 px-3 text-center w-12 border-b border-slate-300">Rank</th>
                      <th className="py-2 px-3 border-b border-slate-300">Candidate</th>
                      <th className="py-2 px-3 border-b border-slate-300">CONRAISS / Station</th>
                      <th className="py-2 px-3 text-right border-b border-slate-300">Votes</th>
                      <th className="py-2 px-3 text-right w-20 border-b border-slate-300">%</th>
                      <th className="py-2 px-3 text-center w-20 border-b border-slate-300">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCandidates.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No candidate results available for this office.
                        </td>
                      </tr>
                    ) : (
                      sortedCandidates.map((cand, idx) => {
                        const rank = idx + 1;
                        const votes = Number(cand.vote_count) || 0;
                        const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : '0.0';
                        const isWinner = isWinnerDeclared && rank === 1;

                        return (
                          <tr
                            key={cand.candidate_code || idx}
                            className={`${isWinner ? 'font-semibold' : ''} ${
                              idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                            } border-b border-slate-100`}
                          >
                            {/* Rank */}
                            <td className="py-2 px-3 text-center align-middle font-bold text-slate-600">
                              {rank}
                            </td>

                            {/* Candidate Identity */}
                            <td className="py-2 px-3 align-middle">
                              <div className="flex items-center gap-2">
                                <div className="size-8 rounded overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                                  <CandidateAvatar
                                    src={cand.image_url ? resolveImageUrl(cand.image_url) : ''}
                                    name={cand.candidate_name}
                                    iconClassName="text-lg"
                                    textClassName="text-[8px] font-bold"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-800 uppercase leading-snug text-[11px]">
                                    {cand.candidate_name}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    MCS: {cand.mcs_number || cand.candidate_code} • File: {cand.file_no || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* CONRAISS & Station */}
                            <td className="py-2 px-3 align-middle text-slate-600 text-[11px]">
                              <div>{cand.conraiss || 'N/A'}</div>
                              <div className="text-[10px] text-slate-400">{cand.station || 'N/A'}</div>
                            </td>

                            {/* Votes */}
                            <td className="py-2 px-3 align-middle text-right font-bold text-slate-800">
                              {votes}
                            </td>

                            {/* Percentage */}
                            <td className="py-2 px-3 align-middle text-right font-semibold text-slate-600">
                              {percentage}%
                            </td>

                            {/* Status */}
                            <td className="py-2 px-3 align-middle text-center">
                              {isWinner ? (
                                <span className="text-[10px] font-bold uppercase text-slate-800">
                                  ★ Elected
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">
                                  —
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Official Certification & ELECO Sign-off Section */}
            <div className="page-break-avoid mt-6 pt-4 border-t border-slate-300 space-y-4">
              <div className="text-center max-w-2xl mx-auto">
                <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                  Official ELECO Declaration &amp; Certification
                </h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed italic">
                  "We, the undersigned members of the NECO MCS Electoral Committee (ELECO), hereby certify that the election for the office of <strong>{officeName}</strong> was conducted in a peaceful, transparent, free, and fair manner in accordance with the Electoral Guidelines and Bye-Laws of the Society, and that the above result reflects the true and accurate votes scored by the accredited candidates."
                </p>
              </div>

              {/* 3-Column Sign-Off Signatures */}
              <div className="grid grid-cols-3 gap-6 pt-8 text-center">
                <div className="flex flex-col items-center justify-end">
                  <div className="w-full border-b border-slate-400 mb-1"></div>
                  <div className="text-xs font-bold text-slate-700 uppercase">ELECO Chairman</div>
                  <div className="text-[10px] text-slate-400">Signature &amp; Date</div>
                </div>
                <div className="flex flex-col items-center justify-end">
                  <div className="w-full border-b border-slate-400 mb-1"></div>
                  <div className="text-xs font-bold text-slate-700 uppercase">ELECO Secretary</div>
                  <div className="text-[10px] text-slate-400">Signature &amp; Date</div>
                </div>
                <div className="flex flex-col items-center justify-end">
                  <div className="w-full border-b border-slate-400 mb-1"></div>
                  <div className="text-xs font-bold text-slate-700 uppercase">Returning Officer</div>
                  <div className="text-[10px] text-slate-400">Signature &amp; Date</div>
                </div>
              </div>

              {/* Audit Timestamp */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-[10px] text-slate-400">
                <span>NECO MCS Electoral Audit • Official Results Record</span>
                <span className="font-mono">Printed: {currentDate} • {currentTime}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
