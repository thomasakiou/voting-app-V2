import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  usersAPI,
  votingTimeAPI,
  votesAPI,
  VotingTimeOut,
  UserStatsOut,
} from '../api';
import { LoadingSpinner, SuccessAlert, ErrorAlert } from '../components/UIComponents';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<UserStatsOut | null>(null);
  const [votingStatus, setVotingStatus] = useState<VotingTimeOut | null>(null);
  const [liveVotes, setLiveVotes] = useState<{ total_votes_cast: number; recent_votes: any[] }>({
    total_votes_cast: 0,
    recent_votes: [],
  });
  const [loading, setLoading] = useState(true);
  const [togglingVoting, setTogglingVoting] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadAllData();
    // Poll live votes and status every 4 seconds for real-time visibility
    const interval = setInterval(() => {
      fetchLiveStream();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [analysisData, statusData, liveData] = await Promise.all([
        usersAPI.getAnalysis(),
        votingTimeAPI.getStatus(),
        votesAPI.getLive().catch(() => ({ total_votes_cast: 0, recent_votes: [] })),
      ]);
      setStats(analysisData);
      setVotingStatus(statusData);
      setLiveVotes(liveData);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveStream = async () => {
    try {
      const [liveData, statusData] = await Promise.all([
        votesAPI.getLive().catch(() => null),
        votingTimeAPI.getStatus().catch(() => null),
      ]);
      if (liveData) setLiveVotes(liveData);
      if (statusData) setVotingStatus(statusData);
    } catch (err) {
      // quiet poll error
    }
  };

  // Start Voting Button
  const handleStartVoting = async () => {
    if (!window.confirm('Are you sure you want to START the election? Voters will immediately be able to cast their ballots.')) {
      return;
    }
    setTogglingVoting(true);
    setError('');
    setSuccess('');
    try {
      const res = await votingTimeAPI.startVoting();
      setVotingStatus(res);
      setSuccess('Voting has started! Voters can now log in and vote.');
      loadAllData();
    } catch (err: any) {
      setError(err?.data?.detail || 'Failed to start voting.');
    } finally {
      setTogglingVoting(false);
    }
  };

  // Stop Voting Button
  const handleStopVoting = async () => {
    if (!window.confirm('Are you sure you want to STOP voting immediately? No further ballots can be submitted.')) {
      return;
    }
    setTogglingVoting(true);
    setError('');
    setSuccess('');
    try {
      const res = await votingTimeAPI.stopVoting();
      setVotingStatus(res);
      setSuccess('Voting has been stopped immediately. No more votes can be cast.');
      loadAllData();
    } catch (err: any) {
      setError(err?.data?.detail || 'Failed to stop voting.');
    } finally {
      setTogglingVoting(false);
    }
  };

  // Download Voters CSV
  const handleDownloadCSV = async () => {
    setDownloading('csv');
    setError('');
    try {
      await usersAPI.downloadCSV();
      setSuccess('Voters register CSV downloaded successfully.');
    } catch (err) {
      setError('Failed to download voters CSV.');
    } finally {
      setDownloading(null);
    }
  };

  // Download Voters PDF
  const handleDownloadPDF = async () => {
    setDownloading('pdf');
    setError('');
    try {
      await usersAPI.downloadPDF();
      setSuccess('Voters register PDF downloaded successfully.');
    } catch (err) {
      setError('Failed to download voters PDF.');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  const isVotingActive = votingStatus?.is_active && votingStatus.status === 'ACTIVE';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Admin Control Center</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Real-time NECO MCS Election control, live voting stream, and analysis.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Download Voters Buttons */}
          <button
            onClick={handleDownloadCSV}
            disabled={downloading !== null}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:border-indigo-500 transition-all flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-lg text-emerald-600">table_view</span>
            {downloading === 'csv' ? 'Downloading...' : 'Export Voters (CSV)'}
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={downloading !== null}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:border-red-500 transition-all flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-lg text-red-500">picture_as_pdf</span>
            {downloading === 'pdf' ? 'Generating...' : 'Export Voters (PDF)'}
          </button>

          <button
            onClick={loadAllData}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm"
            title="Refresh Data"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}
      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

      {/* ELECTION STATE & START/STOP CONTROLS CARD */}
      <div className={`rounded-3xl p-6 md:p-8 text-white shadow-xl transition-all duration-300 ${
        isVotingActive
          ? 'bg-gradient-to-r from-emerald-600 to-teal-700 shadow-emerald-500/20'
          : 'bg-gradient-to-r from-slate-800 to-indigo-900 shadow-slate-900/30'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                isVotingActive
                  ? 'bg-emerald-500/30 text-emerald-100 border border-emerald-400/40 animate-pulse'
                  : 'bg-white/10 text-slate-300 border border-white/20'
              }`}>
                <span className={`size-2 rounded-full ${isVotingActive ? 'bg-emerald-300' : 'bg-red-400'}`}></span>
                {isVotingActive ? 'Voting Live In Progress' : 'Voting Stopped / Closed'}
              </span>
              <span className="text-xs text-white/70">
                Live Total: <b>{liveVotes.total_votes_cast}</b> votes cast
              </span>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight">
              {isVotingActive ? 'Election Session is Currently Active' : 'Voting is Currently Closed'}
            </h2>
            <p className="text-white/80 max-w-2xl text-sm md:text-base leading-relaxed">
              {isVotingActive
                ? 'Accredited voters are actively casting ballots. Click Stop Voting to immediately terminate the session and lock all voter dashboard access.'
                : 'Voters cannot vote while the election session is closed. Click Start Voting to unlock ballot access and commence voting.'}
            </p>
          </div>

          {/* START / STOP VOTING BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            {isVotingActive ? (
              <button
                onClick={handleStopVoting}
                disabled={togglingVoting}
                className="px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-lg shadow-xl shadow-red-900/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 border-2 border-red-400/50"
              >
                {togglingVoting ? (
                  <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-2xl">stop_circle</span>
                    Stop Voting Now
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleStartVoting}
                disabled={togglingVoting}
                className="px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-lg shadow-xl shadow-emerald-900/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 border-2 border-emerald-300/50"
              >
                {togglingVoting ? (
                  <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-2xl">play_circle</span>
                    Start Voting Now
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ANALYSIS OF ALL VOTERS (REQUIREMENT 3) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600">analytics</span>
            Voters Register & Turnout Analysis
          </h3>
          <span className="text-xs text-slate-500">Live Voter Demographics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Registered */}
          <div className="card p-5 border-l-4 border-l-blue-500 bg-white dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">All Registered Voters</span>
              <span className="material-symbols-outlined text-blue-500">groups</span>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {stats?.total_voters || 0}
              </div>
              <p className="text-xs text-slate-400 mt-1">Total database register</p>
            </div>
          </div>

          {/* Accredited Voters */}
          <div className="card p-5 border-l-4 border-l-indigo-500 bg-white dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">Accredited Voters</span>
              <span className="material-symbols-outlined text-indigo-500">verified</span>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {stats?.accredited_voters || 0}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {stats?.unaccredited_voters || 0} awaiting accreditation
              </p>
            </div>
          </div>

          {/* Eligible Voters */}
          <div className="card p-5 border-l-4 border-l-emerald-500 bg-white dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">Eligible Voters</span>
              <span className="material-symbols-outlined text-emerald-500">how_to_vote</span>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {stats?.eligible_voters || 0}
              </div>
              <p className="text-xs text-slate-400 mt-1">Accredited & Active</p>
            </div>
          </div>

          {/* Non-Eligible / Disqualified */}
          <div className="card p-5 border-l-4 border-l-red-500 bg-white dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">Non-Eligible Voters</span>
              <span className="material-symbols-outlined text-red-500">block</span>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-red-600 dark:text-red-400">
                {stats?.non_eligible_voters || 0}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {stats?.disabled_voters || 0} disqualified by admin
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TURNOUT AND LIVE FEED ROW */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Turnout & Fast Metrics */}
        <div className="card p-6 space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Voting Turnout Progress</h3>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-slate-600 dark:text-slate-300">Participation Turnout</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{stats?.turnout_percentage || 0}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-3.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-violet-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, stats?.turnout_percentage || 0)}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Total Ballots Cast</span>
              <span className="font-bold text-slate-900 dark:text-white">{stats?.total_votes_cast || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Active Voter Accounts</span>
              <span className="font-bold text-green-600">{stats?.active_voters || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Disqualified Voter Accounts</span>
              <span className="font-bold text-red-600">{stats?.disabled_voters || 0}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60">
            <Link
              to="/admin/users"
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors"
            >
              Manage Individual Voters
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* LIVE STREAM: AS VOTERS CAST THEIR VOTE (REQUIREMENT 3) */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="size-3 rounded-full bg-emerald-500 animate-ping"></div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Live Ballot Cast Feed</h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              Live Auto-Refresh
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-4">
            Real-time feed as voters cast votes from their dashboards.
          </p>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            {liveVotes.recent_votes.length === 0 ? (
              <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl border-slate-200 dark:border-slate-700">
                No ballots cast yet. Once voters cast votes, they will stream here live.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold text-xs uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Voter Name</th>
                    <th className="px-4 py-2.5">Contested Office</th>
                    <th className="px-4 py-2.5">Candidate Voted</th>
                    <th className="px-4 py-2.5">Receipt Hash</th>
                    <th className="px-4 py-2.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {liveVotes.recent_votes.map((vote: any) => (
                    <tr key={vote.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{vote.user_name}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{vote.office_name}</td>
                      <td className="px-4 py-3 font-medium text-indigo-600 dark:text-indigo-400">
                        {vote.candidate_name}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold">
                          {vote.receipt_hash || 'MCS-SECURE'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {new Date(vote.created_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
