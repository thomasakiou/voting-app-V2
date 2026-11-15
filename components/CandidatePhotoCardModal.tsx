import React from 'react';
import { CandidateResponse, resolveImageUrl } from '../api';
import { CandidateAvatar } from './UIComponents';

interface CandidatePhotoCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Mode: 'single' for an individual candidate, 'office' for batch candidates by office
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="candidate-print-modal fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-5xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-scale-in">
        {/* Modal Top Control Bar (Hidden during Print) */}
        <div className="no-print p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <span className="material-symbols-outlined text-2xl">badge</span>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                {isSingle
                  ? `Candidate Photo Card: ${candidate?.name}`
                  : `Office Candidates Photo Cards — ${officeTitle || 'All Offices'}`}
              </h2>
              <p className="text-xs text-indigo-200">
                {isSingle
                  ? 'Official Electoral Identification & Votes Photo Card'
                  : `Total ${candidateList.length} candidate card${candidateList.length === 1 ? '' : 's'} ready for print / PDF export`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>Print / Save as PDF</span>
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
          {/* Printable Document Headings */}
          <div className="candidate-print-container max-w-4xl mx-auto space-y-8 print:space-y-6">
            {/* Batch Document Header */}
            <div className="text-center pb-4 border-b-2 border-indigo-900/30 dark:border-indigo-400/30">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-2">
                National Examinations Council (NECO) MCS
              </div>
              <h1 className="text-xl sm:text-2xl font-black uppercase text-slate-900 dark:text-white tracking-tight">
                NECO Multi-Purpose Co-operative Society Limited
              </h1>
              <p className="text-xs sm:text-sm font-bold uppercase text-slate-600 dark:text-slate-300 mt-0.5">
                Electoral Committee (ELECO) • Official Candidate Photo Identification & Accreditation Cards
              </p>
              {officeTitle && (
                <div className="mt-2 inline-block px-4 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black uppercase tracking-wider shadow-sm">
                  Office: {officeTitle}
                </div>
              )}
            </div>

            {/* Candidates Card Grid */}
            {candidateList.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No candidates available to display.
              </div>
            ) : (
              <div
                className={`grid gap-6 ${
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
                      className="candidate-photo-card bg-white rounded-2xl border-2 border-slate-300 dark:border-slate-700 overflow-hidden shadow-md print:shadow-none print:border-2 print:border-slate-800 flex flex-col justify-between page-break-avoid"
                      style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                    >
                      {/* Top Security Banner */}
                      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-amber-400">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-amber-400 text-base">verified</span>
                          <span className="text-[11px] font-black uppercase tracking-wider">
                            NECO MCS • Official Candidate
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/30 border border-white/20 text-amber-300">
                          #{cand.candidate_code}
                        </span>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="flex items-start gap-4">
                          {/* Candidate Portrait Image */}
                          <div className="relative size-28 sm:size-32 rounded-2xl overflow-hidden bg-slate-100 border-2 border-indigo-300 shadow-sm shrink-0 flex items-center justify-center">
                            <CandidateAvatar
                              src={resolvedUrl}
                              name={cand.name}
                              iconClassName="text-5xl"
                              textClassName="text-xs"
                            />
                            <div className="absolute bottom-0 inset-x-0 bg-indigo-900/90 text-white text-[9px] font-bold text-center py-0.5 tracking-tight uppercase">
                              Accredited
                            </div>
                          </div>

                          {/* Candidate Core Identity */}
                          <div className="flex-1 min-w-0">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide bg-indigo-100 text-indigo-800 mb-1">
                              Contesting For:
                            </span>
                            <div className="text-xs sm:text-sm font-extrabold text-indigo-700 uppercase leading-snug line-clamp-2">
                              {resolvedOffice}
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase mt-1 leading-tight tracking-tight">
                              {cand.name}
                            </h3>

                            {/* Status badge */}
                            <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                              <span className="material-symbols-outlined text-sm">check_circle</span>
                              <span>{cand.is_disqualified ? 'Disqualified' : 'Certified Candidate'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Staff Particulars Grid */}
                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">
                              MCS No. (Username)
                            </span>
                            <span className="font-mono font-bold text-slate-800 text-[11px] break-all">
                              {cand.mcs_number || cand.candidate_code || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">
                              File Number
                            </span>
                            <span className="font-mono font-bold text-slate-800 text-[11px]">
                              {cand.file_no || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">
                              CONRAISS
                            </span>
                            <span className="font-bold text-slate-800 text-[11px]">
                              {cand.conraiss || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">
                              Station
                            </span>
                            <span className="font-bold text-slate-800 text-[11px] truncate block" title={cand.station || ''}>
                              {cand.station || 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* Manifesto Title (if available) */}
                        {cand.manifesto_title && (
                          <div className="px-3 py-1.5 rounded-lg bg-indigo-50/80 border-l-2 border-indigo-600 text-xs">
                            <span className="text-[9px] font-black uppercase text-indigo-700 block">
                              Vision / Slogan:
                            </span>
                            <p className="font-semibold text-slate-800 italic line-clamp-1 text-[11px]">
                              "{cand.manifesto_title}"
                            </p>
                          </div>
                        )}

                        {/* Votes Received Tally Box (Prominent on Single Candidate & Available on Batch) */}
                        <div className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-50 via-violet-50 to-indigo-50 border border-indigo-200 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-indigo-600 text-lg">how_to_vote</span>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block leading-none">
                                Votes Received
                              </span>
                              <span className="text-[9px] text-slate-500 font-medium">Official Ballot Tally</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-base sm:text-lg font-black text-indigo-900 font-mono">
                              {voteCount}
                            </span>
                            <span className="text-[10px] font-bold text-indigo-600 ml-1">
                              Vote{voteCount === 1 ? '' : 's'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Official Footer Verification Bar */}
                      <div className="bg-slate-100 px-4 py-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                        <div className="flex items-center gap-1">
                          <span className="size-1.5 rounded-full bg-emerald-500"></span>
                          <span>Official Election Photo Card</span>
                        </div>
                        <div className="font-mono text-[9px]">
                          Issued: {new Date().toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Document Print Verification Sign-off */}
            <div className="pt-6 border-t-2 border-slate-300 text-center space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs text-slate-600 pt-4">
                <div className="border-t border-slate-400 pt-1">
                  <span className="font-bold block text-slate-900">ELECO Chairman</span>
                  <span className="text-[10px] text-slate-500">Signature & Date</span>
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <span className="font-bold block text-slate-900">ELECO Secretary</span>
                  <span className="text-[10px] text-slate-500">Signature & Date</span>
                </div>
                <div className="border-t border-slate-400 pt-1 col-span-2 sm:col-span-1">
                  <span className="font-bold block text-slate-900">Official Seal</span>
                  <span className="text-[10px] text-slate-500">NECO MCS Electoral Board</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                Generated via NECO MCS Electronic Voting & Accreditation System • Confidential Audit Document
              </p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer (Hidden during Print) */}
        <div className="no-print p-4 sm:p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click <b>Print / Save as PDF</b> to generate the official high-resolution photo card document.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all"
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
