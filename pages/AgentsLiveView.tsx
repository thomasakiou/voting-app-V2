import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { votesAPI, AgentsLiveMonitorResponse, AgentsLiveOfficeTally } from '../api';

export const AgentsLiveView: React.FC = () => {
  const [data, setData] = useState<AgentsLiveMonitorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedPage, setFeedPage] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async (page = 1) => {
    try {
      const result = await votesAPI.getAgentsLiveMonitor(page, 25);
      setData(result);
      setError('');
      setLastRefreshed(new Date());
    } catch (err: any) {
      setError(err?.data?.detail || err?.message || 'Failed to load live election monitoring data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(feedPage);
  }, [feedPage, loadData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadData(feedPage);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, feedPage, loadData]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="size-14 border-4 border-indigo-400/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-white">Loading Election Monitor...</h2>
          <p className="text-sm text-slate-400">Connecting to secure live vote feed</p>
        </div>
      </div>
    );
  }

  const election = data?.election_status;
  const overview = data?.overview;
  const offices = data?.offices_tally || [];
  const ballots = data?.recent_ballots;

  const filteredOffices = offices.filter((o) =>
    o.office_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.candidates.some((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="material-symbols-outlined text-white text-2xl">monitoring</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  Contestants' Agents Live Portal
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Live View Only
                </span>
              </div>
              <p className="text-xs text-slate-400">
                NECO MCS Cooperative Election — Real-Time Process Observer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Status indicator */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              election?.is_active && election?.status === 'ACTIVE'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              <span className={`size-2 rounded-full ${election?.is_active && election?.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {election?.is_active && election?.status === 'ACTIVE' ? 'VOTING LIVE' : election?.status || 'STANDBY'}
            </div>

            {/* Auto refresh button */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                autoRefresh
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">{autoRefresh ? 'sync' : 'sync_disabled'}</span>
              <span>{autoRefresh ? 'Auto (10s)' : 'Manual'}</span>
            </button>

            {/* Manual refresh button */}
            <button
              onClick={() => loadData(feedPage)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Refresh now"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
            </button>

            {/* Return link */}
            <Link
              to="/election"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">how_to_vote</span>
              <span>Voter Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-sm flex items-center gap-3">
            <span className="material-symbols-outlined text-red-400">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Anonymity Banner */}
        <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/30 flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">shield</span>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Ballot Secrecy & Voter Privacy Protected</h2>
              <p className="text-xs text-slate-400">
                In compliance with election regulations, voter names and MCS numbers are strictly hidden. Only anonymized cryptographic ballot receipts are displayed.
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-400 shrink-0 hidden md:block">
            Last Updated: <span className="font-mono text-slate-200">{lastRefreshed.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* KPI Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider font-semibold mb-2">
              <span className="material-symbols-outlined text-base text-indigo-400">groups</span>
              Eligible Voters
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-white">
              {(overview?.total_eligible_voters ?? 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Official registered members</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider font-semibold mb-2">
              <span className="material-symbols-outlined text-base text-blue-400">how_to_reg</span>
              Accredited
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-blue-400">
              {(overview?.total_accredited_voters ?? 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Successfully verified</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider font-semibold mb-2">
              <span className="material-symbols-outlined text-base text-emerald-400">how_to_vote</span>
              Total Votes Cast
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
              {(overview?.total_votes_cast ?? 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Confirmed ballots cast</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider font-semibold mb-2">
              <span className="material-symbols-outlined text-base text-violet-400">trending_up</span>
              Voter Turnout
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-violet-400">
              {(overview?.turnout_percentage ?? 0).toFixed(1)}%
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Votes per eligible voter</p>
          </div>
        </div>

        {/* Election Session Timing */}
        {election && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">schedule</span>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Session Status</p>
                <p className="text-sm font-bold text-white">
                  {election.status === 'ACTIVE' ? 'Voting Session in Progress' : `Status: ${election.status}`}
                </p>
              </div>
            </div>

            {election.time_remaining !== null && election.time_remaining !== undefined && election.time_remaining > 0 && (
              <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Time Remaining:</span>
                <span className="font-mono text-lg font-bold text-indigo-400">
                  {formatSecondsToTime(election.time_remaining)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Live Contest Tallies Grid */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400">leaderboard</span>
                Live Office Standings
              </h2>
              <p className="text-xs text-slate-400">Real-time vote tallies for all contested positions</p>
            </div>
            <div className="relative min-w-[200px]">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by office or candidate..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {filteredOffices.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
              No offices match your search criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredOffices.map((office) => (
                <OfficeCard key={office.office_code} office={office} />
              ))}
            </div>
          )}
        </section>

        {/* Live Anonymized Ballot Stream */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">dynamic_feed</span>
                Anonymized Live Ballot Feed
              </h2>
              <p className="text-xs text-slate-400">Stream of ballots recorded by the blockchain/ledger engine</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Total Ballots: {(ballots?.total ?? 0).toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            {!ballots || ballots.items.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                <span className="material-symbols-outlined text-4xl mb-2 text-slate-600 block">hourglass_empty</span>
                No votes recorded yet. The live stream will populate as ballots are cast.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-5 py-3">Receipt Hash</th>
                        <th className="px-5 py-3">Contest / Office</th>
                        <th className="px-5 py-3">Candidate Voted</th>
                        <th className="px-5 py-3">Timestamp</th>
                        <th className="px-5 py-3 text-right">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                      {ballots.items.map((ballot) => (
                        <tr key={ballot.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-5 py-3 text-indigo-400 font-semibold font-mono">
                            {ballot.receipt_hash}
                          </td>
                          <td className="px-5 py-3 font-sans font-medium text-slate-200">
                            {ballot.office_name}
                          </td>
                          <td className="px-5 py-3 font-sans font-semibold text-white">
                            {ballot.candidate_name}
                          </td>
                          <td className="px-5 py-3 text-slate-400 font-mono">
                            {new Date(ballot.created_at).toLocaleTimeString()}
                          </td>
                          <td className="px-5 py-3 text-right font-sans">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <span className="material-symbols-outlined text-[12px]">verified</span>
                              RECORDED
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Page <strong className="text-white">{ballots.page}</strong> of{' '}
                    <strong className="text-white">{Math.max(1, Math.ceil(ballots.total / ballots.page_size))}</strong>
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFeedPage(Math.max(1, feedPage - 1))}
                      disabled={feedPage <= 1}
                      className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setFeedPage(feedPage + 1)}
                      disabled={feedPage >= Math.ceil(ballots.total / ballots.page_size)}
                      className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-slate-800 text-center text-xs text-slate-500">
        NECO MCS Cooperative Election Monitoring System • Real-Time Agents Observation Portal
      </footer>
    </div>
  );
};

// Sub-component: Office Standing Card
const OfficeCard: React.FC<{ office: AgentsLiveOfficeTally }> = ({ office }) => {
  const maxVotes = Math.max(...office.candidates.map((c) => c.votes), 1);
  const sortedCandidates = [...office.candidates].sort((a, b) => b.votes - a.votes);

  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-white">{office.office_name}</h3>
          <p className="text-xs text-slate-400">
            {office.total_votes} total vote{office.total_votes !== 1 ? 's' : ''} cast
            {office.max_votes > 1 && ` (up to ${office.max_votes} selections per voter)`}
          </p>
        </div>
        <div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
          <span className="material-symbols-outlined text-lg">how_to_vote</span>
        </div>
      </div>

      <div className="space-y-3.5">
        {sortedCandidates.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No candidates registered</p>
        ) : (
          sortedCandidates.map((cand, idx) => (
            <div key={cand.candidate_code} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2 truncate">
                  <span className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    idx === 0 && cand.votes > 0
                      ? 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/50'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="text-slate-200 truncate">{cand.name}</span>
                </div>
                <div className="font-mono text-white text-right shrink-0 ml-2">
                  <span>{cand.votes.toLocaleString()}</span>
                  <span className="text-[11px] text-slate-400 ml-1.5 font-sans">({cand.percentage.toFixed(1)}%)</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    idx === 0 && cand.votes > 0
                      ? 'bg-gradient-to-r from-amber-400 to-indigo-500'
                      : 'bg-indigo-600'
                  }`}
                  style={{ width: `${Math.max((cand.votes / maxVotes) * 100, cand.votes > 0 ? 3 : 0)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

function formatSecondsToTime(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(Math.floor(s)).padStart(2, '0')}`;
}
