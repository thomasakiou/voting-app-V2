import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  votesAPI,
  agentsAPI,
  TokenManager,
  AgentsLiveMonitorResponse,
  AgentsLiveOfficeTally,
  AgentsLiveBallotFeedItem,
} from '../api';

function getSavedAgentAuth(): { token: string; role: string; username: string; fullname: string } | null {
  const token = TokenManager.getToken() || localStorage.getItem('access_token') || '';
  if (!token) return null;
  const role = localStorage.getItem('voting_auth_role') || '';
  const username = localStorage.getItem('voting_username') || '';
  const fullname = localStorage.getItem('voting_fullname') || localStorage.getItem('fullname') || '';
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      const tokenRole = payload.role || role;
      if (tokenRole === 'agent' || tokenRole === 'admin' || tokenRole === 'super-admin') {
        return { token, role: tokenRole, username, fullname };
      }
    }
  } catch (e) {
    // ignore decoding errors
  }
  if (role === 'agent' || role === 'admin' || role === 'super-admin') {
    return { token, role, username, fullname };
  }
  return null;
}

export const AgentsLiveView: React.FC = () => {
  const [currentUser, setCurrentUser] = useState(() => getSavedAgentAuth());
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [data, setData] = useState<AgentsLiveMonitorResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedPage, setFeedPage] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = useCallback(() => {
    TokenManager.clearToken();
    localStorage.removeItem('access_token');
    localStorage.removeItem('voting_auth_role');
    localStorage.removeItem('voting_username');
    localStorage.removeItem('voting_fullname');
    localStorage.removeItem('fullname');
    setCurrentUser(null);
    setData(null);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword) {
      setLoginError('Please enter both agent username and password.');
      return;
    }
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await agentsAPI.login(loginUsername, loginPassword);
      const auth = getSavedAgentAuth() || {
        token: res.access_token,
        role: res.role || 'agent',
        username: res.username || loginUsername.trim(),
        fullname: res.fullname || loginUsername.trim(),
      };
      setCurrentUser(auth);
      setFeedPage(1);
      setLoading(true);
    } catch (err: any) {
      setLoginError(err?.data?.detail || err?.message || 'Invalid agent credentials. Please check your username and password.');
    } finally {
      setLoginLoading(false);
    }
  };

  const loadData = useCallback(async (page = 1) => {
    if (!currentUser) return;
    try {
      const result = await votesAPI.getAgentsLiveMonitor(page, 20);
      setData(result);
      setError('');
      setLastRefreshed(new Date());
    } catch (err: any) {
      if (err?.status === 401) {
        handleLogout();
        setLoginError('Your session has expired or is invalid. Please sign in again.');
        return;
      }
      setError(err?.data?.detail || err?.message || 'Failed to load live election monitoring data.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, handleLogout]);

  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      loadData(feedPage);
    }
  }, [currentUser, feedPage, loadData]);

  useEffect(() => {
    if (!currentUser || !autoRefresh) return;
    const interval = setInterval(() => {
      loadData(feedPage);
    }, 10000);
    return () => clearInterval(interval);
  }, [currentUser, autoRefresh, feedPage, loadData]);

  // Unauthenticated: Show Agent Login Card
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-indigo-500 selection:text-white">
        <div className="w-full max-w-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="size-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="material-symbols-outlined text-white text-3xl">verified_user</span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Agent Observer Portal</h1>
              <p className="text-xs text-slate-400">
                Sign in with your assigned agent credentials to observe live election voting proceedings.
              </p>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-2.5">
                <span className="material-symbols-outlined text-red-400 text-base">error</span>
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Agent Username
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-500 text-lg">badge</span>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    required
                    placeholder="Enter agent username"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-500 text-lg">lock</span>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="Enter password"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loginLoading ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">login</span>
                    <span>Enter Observer Portal</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-800 text-center">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Ballot privacy guaranteed: Live observer view presents real-time aggregate tallies and cryptographic receipts with zero disclosure of voter identities.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="size-14 border-4 border-indigo-400/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-white">Loading Election Monitor...</h2>
          <p className="text-sm text-slate-400">Connecting to secure live vote feed</p>
        </div>
      </div>
    );
  }

  // Safe extraction supporting both flat backend response and nested response
  const isVotingActive = Boolean(data?.is_active ?? data?.election_status?.is_active);
  const statusLabel = data?.status || data?.election_status?.status || (isVotingActive ? 'ACTIVE' : 'STANDBY');
  const totalEligible = data?.total_voters ?? data?.overview?.total_eligible_voters ?? 0;
  const totalAccredited = data?.accredited_voters ?? data?.overview?.total_accredited_voters ?? 0;
  const totalVotesCast = data?.total_votes_cast ?? data?.overview?.total_votes_cast ?? 0;
  const turnoutPercentage = data?.turnout_percentage ?? data?.overview?.turnout_percentage ?? 0;
  const endTimeStr = data?.end_time || data?.election_status?.end_time;
  const timeRemainingVal = data?.time_remaining ?? data?.election_status?.time_remaining;

  const rawOffices = data?.offices_results || data?.offices_tally || [];
  const officesList: AgentsLiveOfficeTally[] = Array.isArray(rawOffices) ? rawOffices : [];

  const rawBallots = data?.recent_ballots;
  const ballotsList: AgentsLiveBallotFeedItem[] = Array.isArray(rawBallots)
    ? rawBallots
    : Array.isArray((rawBallots as any)?.items)
    ? (rawBallots as any).items
    : [];

  const totalBallotsCount = data?.total_ballots ?? (rawBallots as any)?.total ?? ballotsList.length;
  const currentPage = data?.page ?? (rawBallots as any)?.page ?? feedPage;
  const pageSize = data?.page_size ?? (rawBallots as any)?.page_size ?? 15;
  const totalPages = Math.max(1, Math.ceil(totalBallotsCount / pageSize));

  const filteredOffices = officesList.filter((o) => {
    const oName = (o.description || o.office_name || o.office_code || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    if (oName.includes(q)) return true;
    const cands = Array.isArray(o.candidates) ? o.candidates : [];
    return cands.some((c) => {
      const cName = (c.candidate_name || c.name || '').toLowerCase();
      return cName.includes(q);
    });
  });

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
            {/* Current Agent Info Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
              <span className="material-symbols-outlined text-indigo-400 text-base">person</span>
              <span className="font-medium text-white">{currentUser.fullname || currentUser.username}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-indigo-500/20 text-indigo-300">
                {currentUser.role}
              </span>
            </div>

            {/* Status indicator */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              isVotingActive && statusLabel === 'ACTIVE'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              <span className={`size-2 rounded-full ${isVotingActive && statusLabel === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {isVotingActive && statusLabel === 'ACTIVE' ? 'VOTING LIVE' : statusLabel}
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

            {/* Sign Out Button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-red-950/40 hover:text-red-300 hover:border-red-800/60 transition-colors cursor-pointer"
              title="Sign out of Agent Portal"
            >
              <span className="material-symbols-outlined text-[15px]">logout</span>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
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
              {totalEligible.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Official registered members</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider font-semibold mb-2">
              <span className="material-symbols-outlined text-base text-blue-400">how_to_reg</span>
              Accredited
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-blue-400">
              {totalAccredited.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Successfully verified</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider font-semibold mb-2">
              <span className="material-symbols-outlined text-base text-emerald-400">how_to_vote</span>
              Total Votes Cast
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
              {totalVotesCast.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Confirmed ballots cast</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider font-semibold mb-2">
              <span className="material-symbols-outlined text-base text-violet-400">trending_up</span>
              Voter Turnout
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-violet-400">
              {turnoutPercentage.toFixed(1)}%
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Votes per eligible voter</p>
          </div>
        </div>

        {/* Election Session Timing */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">schedule</span>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Session Status</p>
              <p className="text-sm font-bold text-white">
                {isVotingActive && statusLabel === 'ACTIVE'
                  ? 'Voting Session in Progress'
                  : `Status: ${statusLabel}`}
              </p>
            </div>
          </div>

          {timeRemainingVal !== null && timeRemainingVal !== undefined && timeRemainingVal > 0 && (
            <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Time Remaining:</span>
              <span className="font-mono text-lg font-bold text-indigo-400">
                {formatSecondsToTime(timeRemainingVal)}
              </span>
            </div>
          )}
        </div>

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
              {searchQuery ? 'No offices match your search criteria.' : 'No office standings available.'}
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
              <p className="text-xs text-slate-400">Stream of ballots recorded by the election system</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Total Ballots: {totalBallotsCount.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            {ballotsList.length === 0 ? (
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
                      {ballotsList.map((ballot) => (
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
                            {ballot.created_at ? new Date(ballot.created_at).toLocaleTimeString() : '—'}
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
                    Page <strong className="text-white">{currentPage}</strong> of{' '}
                    <strong className="text-white">{totalPages}</strong>
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFeedPage(Math.max(1, feedPage - 1))}
                      disabled={currentPage <= 1}
                      className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setFeedPage(feedPage + 1)}
                      disabled={currentPage >= totalPages}
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
  const officeName = office.description || office.office_name || office.office_code;
  const candidates = Array.isArray(office.candidates) ? office.candidates : [];
  const maxVotes = Math.max(...candidates.map((c) => c.vote_count ?? c.votes ?? 0), 1);
  const sortedCandidates = [...candidates].sort((a, b) => {
    const vA = a.vote_count ?? a.votes ?? 0;
    const vB = b.vote_count ?? b.votes ?? 0;
    return vB - vA;
  });

  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-white">{officeName}</h3>
          <p className="text-xs text-slate-400">
            {(office.total_votes ?? 0)} total vote{(office.total_votes ?? 0) !== 1 ? 's' : ''} cast
            {office.max_votes > 1 && ` (up to ${office.max_votes} selections per voter)`}
          </p>
        </div>
        <div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
          <span className="material-symbols-outlined text-lg">how_to_vote</span>
        </div>
      </div>

      <div className="space-y-3.5">
        {sortedCandidates.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No candidates registered for this office</p>
        ) : (
          sortedCandidates.map((cand, idx) => {
            const candName = cand.candidate_name || cand.name || cand.candidate_code;
            const candVotes = cand.vote_count ?? cand.votes ?? 0;
            const candPercentage = cand.percentage !== undefined
              ? cand.percentage
              : (office.total_votes > 0 ? (candVotes / office.total_votes) * 100 : 0);

            return (
              <div key={cand.candidate_code} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2 truncate">
                    <span className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      idx === 0 && candVotes > 0
                        ? 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/50'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-slate-200 truncate">{candName}</span>
                  </div>
                  <div className="font-mono text-white text-right shrink-0 ml-2">
                    <span>{candVotes.toLocaleString()}</span>
                    <span className="text-[11px] text-slate-400 ml-1.5 font-sans">
                      ({candPercentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      idx === 0 && candVotes > 0
                        ? 'bg-gradient-to-r from-amber-400 to-indigo-500'
                        : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.max((candVotes / maxVotes) * 100, candVotes > 0 ? 3 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })
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
