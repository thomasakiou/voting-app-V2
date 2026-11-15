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
              margin: 8mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              background: #ffffff !important;
              color: #0f172a !important;
              margin: 0 !important;
              padding: 0 !important;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            }
            .results-print-container {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 auto !important;
              padding: 2mm !important;
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
        <body class="bg-white">
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
      <div className="w-full max-w-5xl max-h-[94vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-scale-in">
        {/* Modal Top Control Bar (Hidden during Print) */}
        <div className="no-print p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white flex flex-wrap items-center justify-between gap-3 border-b border-emerald-800/40">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                Official Election Results: {officeName}
              </h2>
              <p className="text-xs text-emerald-200/80">
                Arranged in descending order of votes received • Ready for print / PDF download
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>Download / Print Results PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close Preview"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Scrollable Printable Container */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-8 bg-slate-100 dark:bg-slate-950 print:bg-white print:p-0 print:overflow-visible">
          <div ref={printContainerRef} className="results-print-container max-w-4xl mx-auto space-y-6 print:space-y-5 bg-white text-slate-900 p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0">
            {/* Official Header */}
            <div className="text-center pb-5 border-b-2 border-emerald-800/20">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 mb-2">
                <span className="material-symbols-outlined text-xs">how_to_vote</span>
                NECO MCS ELECTORAL COMMITTEE (ELECO)
              </div>
              <h1 className="text-xl sm:text-2xl font-black uppercase text-slate-900 tracking-tight">
                NECO MULTI-PURPOSE CO-OPERATIVE SOCIETY LIMITED
              </h1>
              <p className="text-xs sm:text-sm font-bold uppercase text-slate-600 mt-0.5">
                Headquarters, National Examinations Council (NECO), Minna, Niger State
              </p>
              <div className="mt-2.5 inline-block px-5 py-1.5 rounded-lg bg-emerald-800 text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-sm">
                OFFICIAL ELECTION RESULTS &amp; CERTIFICATE OF RETURN
              </div>
            </div>

            {/* Office & Audit Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/15 pb-3 mb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                    Contested Office:
                  </span>
                  <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
                    {officeName}
                  </h2>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                    Office Code:
                  </span>
                  <div className="font-mono text-sm font-bold text-amber-300">
                    #{officeCode || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Statistics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-white/10 rounded-lg p-2 border border-white/10">
                  <div className="text-[10px] uppercase font-bold text-slate-300">Total Votes Cast</div>
                  <div className="text-lg sm:text-xl font-black text-amber-300">{totalVotes}</div>
                </div>
                <div className="bg-white/10 rounded-lg p-2 border border-white/10">
                  <div className="text-[10px] uppercase font-bold text-slate-300">Candidates</div>
                  <div className="text-lg sm:text-xl font-black text-white">{sortedCandidates.length}</div>
                </div>
                <div className="bg-white/10 rounded-lg p-2 border border-white/10">
                  <div className="text-[10px] uppercase font-bold text-slate-300">Declaration Date</div>
                  <div className="text-xs font-bold text-emerald-200 mt-1">{currentDate}</div>
                </div>
                <div className="bg-white/10 rounded-lg p-2 border border-white/10">
                  <div className="text-[10px] uppercase font-bold text-slate-300">Status</div>
                  <div className="text-xs font-extrabold text-emerald-400 mt-1 flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-xs">verified</span>
                    CERTIFIED
                  </div>
                </div>
              </div>
            </div>

            {/* Winner Spotlight Box (if votes cast) */}
            {isWinnerDeclared && topCandidate && (
              <div className="page-break-avoid rounded-xl border-2 border-amber-400 bg-gradient-to-r from-amber-50 via-white to-amber-50 p-4 sm:p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-sm">
                    <span className="material-symbols-outlined text-sm">emoji_events</span>
                    Elected &amp; Declared Winner
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    Highest Votes Scored in this Category
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  {/* Winner Portrait */}
                  <div className="size-24 sm:size-28 rounded-2xl overflow-hidden bg-slate-100 border-2 border-amber-400 shadow-md shrink-0 flex items-center justify-center relative">
                    <CandidateAvatar
                      src={topCandidate.image_url ? resolveImageUrl(topCandidate.image_url) : ''}
                      name={topCandidate.candidate_name}
                      iconClassName="text-5xl"
                      textClassName="text-sm font-black"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-amber-500 text-slate-950 text-[9px] font-black uppercase text-center py-0.5">
                      Winner
                    </div>
                  </div>

                  {/* Winner Details */}
                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase">
                      {topCandidate.candidate_name}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-700">
                      <span className="px-2 py-0.5 rounded bg-slate-200/80 font-mono font-semibold">
                        MCS No: <strong>{topCandidate.mcs_number || topCandidate.candidate_code}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-200/80 font-mono font-semibold">
                        File No: <strong>{topCandidate.file_no || 'N/A'}</strong>
                      </span>
                      {topCandidate.conraiss && (
                        <span className="px-2 py-0.5 rounded bg-slate-200/80 font-semibold">
                          CONRAISS: <strong>{topCandidate.conraiss}</strong>
                        </span>
                      )}
                      {topCandidate.station && (
                        <span className="px-2 py-0.5 rounded bg-slate-200/80 font-semibold">
                          Station: <strong>{topCandidate.station}</strong>
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-center sm:justify-start gap-4">
                      <div>
                        <span className="text-[11px] text-slate-500 font-bold uppercase block">Votes Scored:</span>
                        <span className="text-xl font-black text-emerald-700">
                          {topCandidate.vote_count} votes
                        </span>
                      </div>
                      <div className="h-8 w-px bg-slate-300"></div>
                      <div>
                        <span className="text-[11px] text-slate-500 font-bold uppercase block">Vote Share:</span>
                        <span className="text-xl font-black text-indigo-700">
                          {totalVotes > 0 ? ((topCandidate.vote_count / totalVotes) * 100).toFixed(1) : '0.0'}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Candidates Results Table - STRICTLY DESCENDING ORDER */}
            <div className="page-break-avoid">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black uppercase text-slate-900 tracking-wide flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-700 text-lg">format_list_numbered</span>
                  Comprehensive Results (Arranged in Descending Order of Votes)
                </h3>
                <span className="text-[11px] font-bold text-slate-500">
                  Total: {sortedCandidates.length} candidate{sortedCandidates.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-300">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3 text-center w-12">Rank</th>
                      <th className="py-2.5 px-3">Candidate Identity</th>
                      <th className="py-2.5 px-3">CONRAISS / Station</th>
                      <th className="py-2.5 px-3 text-right">Votes</th>
                      <th className="py-2.5 px-3 w-36">Vote Share (%)</th>
                      <th className="py-2.5 px-3 text-center w-28">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sortedCandidates.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          No candidate results available for this office.
                        </td>
                      </tr>
                    ) : (
                      sortedCandidates.map((cand, idx) => {
                        const rank = idx + 1;
                        const votes = Number(cand.vote_count) || 0;
                        const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : '0.0';
                        const isWinner = isWinnerDeclared && rank === 1;

                        // Medal badges for top 3
                        let rankBadge = (
                          <span className="size-6 rounded-full bg-slate-100 text-slate-700 font-black inline-flex items-center justify-center text-[11px] border border-slate-300">
                            {rank}
                          </span>
                        );
                        if (rank === 1) {
                          rankBadge = (
                            <span className="size-6 rounded-full bg-amber-400 text-slate-950 font-black inline-flex items-center justify-center text-[11px] shadow-sm ring-2 ring-amber-300">
                              🥇
                            </span>
                          );
                        } else if (rank === 2) {
                          rankBadge = (
                            <span className="size-6 rounded-full bg-slate-300 text-slate-900 font-black inline-flex items-center justify-center text-[11px] shadow-sm">
                              🥈
                            </span>
                          );
                        } else if (rank === 3) {
                          rankBadge = (
                            <span className="size-6 rounded-full bg-amber-700 text-white font-black inline-flex items-center justify-center text-[11px] shadow-sm">
                              🥉
                            </span>
                          );
                        }

                        return (
                          <tr
                            key={cand.candidate_code || idx}
                            className={
                              isWinner
                                ? 'bg-amber-50/60 font-semibold text-slate-900'
                                : idx % 2 === 0
                                ? 'bg-white'
                                : 'bg-slate-50/70'
                            }
                          >
                            {/* Rank */}
                            <td className="py-2.5 px-3 text-center align-middle">{rankBadge}</td>

                            {/* Candidate Identity */}
                            <td className="py-2.5 px-3 align-middle">
                              <div className="flex items-center gap-2.5">
                                <div className="size-9 rounded-lg overflow-hidden bg-slate-100 border border-slate-300 shrink-0 flex items-center justify-center">
                                  <CandidateAvatar
                                    src={cand.image_url ? resolveImageUrl(cand.image_url) : ''}
                                    name={cand.candidate_name}
                                    iconClassName="text-xl"
                                    textClassName="text-[9px] font-bold"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 uppercase leading-snug">
                                    {cand.candidate_name}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                                    <span>MCS: <strong>{cand.mcs_number || cand.candidate_code}</strong></span>
                                    <span>•</span>
                                    <span>File: <strong>{cand.file_no || 'N/A'}</strong></span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* CONRAISS & Station */}
                            <td className="py-2.5 px-3 align-middle text-slate-700">
                              <div><strong>CONRAISS:</strong> {cand.conraiss || 'N/A'}</div>
                              <div className="text-[10px] text-slate-500"><strong>Station:</strong> {cand.station || 'N/A'}</div>
                            </td>

                            {/* Votes */}
                            <td className="py-2.5 px-3 align-middle text-right font-black text-sm text-slate-900">
                              {votes}
                            </td>

                            {/* Percentage Bar */}
                            <td className="py-2.5 px-3 align-middle">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-2 rounded-full ${isWinner ? 'bg-amber-500' : 'bg-emerald-600'}`}
                                    style={{ width: `${Math.min(100, Math.max(0, Number(percentage)))}%` }}
                                  ></div>
                                </div>
                                <span className="font-bold text-slate-800 text-[11px] w-10 text-right">
                                  {percentage}%
                                </span>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-2.5 px-3 align-middle text-center">
                              {isWinner ? (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase border border-emerald-300">
                                  <span className="material-symbols-outlined text-xs">check_circle</span>
                                  Elected
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] uppercase border border-slate-200">
                                  Runner-Up
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
            <div className="page-break-avoid mt-6 pt-5 border-t-2 border-slate-300 space-y-4">
              <div className="text-center max-w-2xl mx-auto">
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  Official ELECO Declaration &amp; Certification
                </h4>
                <p className="text-[10px] text-slate-600 mt-0.5 leading-relaxed italic">
                  "We, the undersigned members of the NECO MCS Electoral Committee (ELECO), hereby certify that the election for the office of <strong className="text-slate-900">{officeName}</strong> was conducted in a peaceful, transparent, free, and fair manner in accordance with the Electoral Guidelines and Bye-Laws of the Society, and that the above result reflects the true and accurate votes scored by the accredited candidates."
                </p>
              </div>

              {/* 3-Column Sign-Off Signatures */}
              <div className="grid grid-cols-3 gap-6 pt-4 text-center">
                {/* ELECO Chairman */}
                <div className="flex flex-col items-center justify-end">
                  <div className="w-full border-b border-slate-400 mb-1"></div>
                  <div className="text-xs font-black text-slate-900 uppercase">ELECO Chairman</div>
                  <div className="text-[10px] text-slate-500 font-medium">Signature &amp; Date</div>
                </div>

                {/* ELECO Secretary */}
                <div className="flex flex-col items-center justify-end">
                  <div className="w-full border-b border-slate-400 mb-1"></div>
                  <div className="text-xs font-black text-slate-900 uppercase">ELECO Secretary</div>
                  <div className="text-[10px] text-slate-500 font-medium">Signature &amp; Date</div>
                </div>

                {/* Returning Officer */}
                <div className="flex flex-col items-center justify-end">
                  <div className="w-full border-b border-slate-400 mb-1"></div>
                  <div className="text-xs font-black text-slate-900 uppercase">Returning Officer</div>
                  <div className="text-[10px] text-slate-500 font-medium">Signature &amp; Date</div>
                </div>
              </div>

              {/* Official Seal and Audit Timestamp */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-slate-200 text-[10px] text-slate-500">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="material-symbols-outlined text-sm text-emerald-700">lock</span>
                  <span>SecureVote Electoral Audit • Certified Official Results Record</span>
                </div>
                <div className="font-mono">
                  Printed: {currentDate} • {currentTime}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
