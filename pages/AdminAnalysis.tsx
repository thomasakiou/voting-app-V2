import React, { useState, useEffect } from 'react';
import {
  usersAPI,
  officesAPI,
  resultsAPI,
  votingTimeAPI,
  votesAPI,
  UserStatsOut,
  OfficeResponse,
  VotingTimeOut,
} from '../api';
import { LoadingSpinner, ErrorAlert } from '../components/UIComponents';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

const ACCREDITATION_COLORS = ['#10b981', '#f59e0b', '#ef4444'];
const FUNNEL_COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#3b82f6'];
const OFFICE_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

export const AdminAnalysis: React.FC = () => {
  const [stats, setStats] = useState<UserStatsOut | null>(null);
  const [votingStatus, setVotingStatus] = useState<VotingTimeOut | null>(null);
  const [offices, setOffices] = useState<OfficeResponse[]>([]);
  const [officeVotesData, setOfficeVotesData] = useState<Array<{ name: string; code: string; votes: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<'csv' | 'pdf' | null>(null);
  const [error, setError] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  useEffect(() => {
    loadAllAnalytics();
    // Auto-refresh analytics every 6 seconds during live election
    const timer = setInterval(() => {
      loadAllAnalytics(false);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const loadAllAnalytics = async (showLoadingSpinner: boolean = true) => {
    try {
      if (showLoadingSpinner) setLoading(true);
      setError('');

      const [statsData, statusData, officesData] = await Promise.all([
        usersAPI.getAnalysis(),
        votingTimeAPI.getStatus(),
        officesAPI.getAll().catch(() => [] as OfficeResponse[]),
      ]);

      setStats(statsData);
      setVotingStatus(statusData);
      setOffices(officesData);
      setLastRefreshed(new Date());

      // Fetch results per office for category participation comparison
      if (officesData && officesData.length > 0) {
        const officeResults = await Promise.all(
          officesData.map(async (off) => {
            try {
              const res = await resultsAPI.getByOfficeCode(off.office_code);
              const totalVotesForOffice = res?.results?.reduce(
                (sum: number, r: any) => sum + (r.vote_count || 0),
                0
              ) || 0;
              return {
                name: off.description,
                code: off.office_code,
                votes: totalVotesForOffice,
              };
            } catch {
              return {
                name: off.description,
                code: off.office_code,
                votes: 0,
              };
            }
          })
        );
        setOfficeVotesData(officeResults);
      }
    } catch (err: any) {
      console.error('Analytics load error:', err);
      if (err?.status === 401) {
        setError('Your session has expired. Please sign out and log in again.');
      } else {
        setError('Failed to load real-time election analysis data.');
      }
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    setDownloading('csv');
    try {
      await usersAPI.downloadCSV();
    } catch {
      setError('Failed to download voters CSV.');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading('pdf');
    try {
      await usersAPI.downloadPDF();
    } catch {
      setError('Failed to download voters PDF.');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  // 1. Data for Accreditation / Eligibility Donut Chart
  const accreditationPieData = [
    {
      name: 'Accredited (Eligible)',
      value: stats?.accredited_voters || 0,
      color: '#10b981',
    },
    {
      name: 'Pending Accreditation',
      value: stats?.unaccredited_voters || 0,
      color: '#f59e0b',
    },
    {
      name: 'Disqualified / Inactive',
      value: stats?.disabled_voters || 0,
      color: '#ef4444',
    },
  ].filter((item) => item.value > 0);

  // 2. Data for Funnel Bar Chart
  const voterFunnelData = [
    {
      stage: 'Registered',
      count: stats?.total_voters || 0,
      fill: '#6366f1',
    },
    {
      stage: 'Accredited (OTP)',
      count: stats?.accredited_voters || 0,
      fill: '#8b5cf6',
    },
    {
      stage: 'Eligible Voters',
      count: stats?.eligible_voters || 0,
      fill: '#10b981',
    },
    {
      stage: 'Ballots Cast',
      count: stats?.total_votes_cast || 0,
      fill: '#3b82f6',
    },
  ];

  // 3. Voter Account Status Data (Active vs Disqualified)
  const accountStatusData = [
    {
      name: 'Active Accounts',
      value: stats?.active_voters || 0,
      color: '#10b981',
    },
    {
      name: 'Disqualified by Admin',
      value: stats?.disabled_voters || 0,
      color: '#ef4444',
    },
  ];

  const totalRegistered = stats?.total_voters || 0;
  const accreditedCount = stats?.accredited_voters || 0;
  const unaccreditedCount = stats?.unaccredited_voters || 0;
  const eligibleCount = stats?.eligible_voters || 0;
  const disqualifiedCount = stats?.disabled_voters || 0;
  const totalVotesCast = stats?.total_votes_cast || 0;
  const turnoutPercent = stats?.turnout_percentage || 0;

  const accreditationRate = totalRegistered > 0
    ? ((accreditedCount / totalRegistered) * 100).toFixed(1)
    : '0.0';

  const isVotingActive = votingStatus?.is_active && votingStatus.status === 'ACTIVE';

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span className="material-symbols-outlined text-[16px]">insights</span>
            Live Election Intelligence
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Voters Register & Election Process Analysis
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Real-time pictorial analytics of voter accreditation, eligibility status, and participation across contested offices.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Refreshed: {lastRefreshed.toLocaleTimeString()}
          </div>

          <button
            onClick={() => loadAllAnalytics(true)}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 transition-all shadow-sm"
            title="Refresh Analysis"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            disabled={downloading !== null}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:border-emerald-500 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-base text-emerald-600">table_view</span>
            {downloading === 'csv' ? 'Exporting...' : 'Export CSV'}
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={downloading !== null}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:border-red-500 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-base text-red-500">picture_as_pdf</span>
            {downloading === 'pdf' ? 'Generating...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

      {/* TOP METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Registered Voters */}
        <div className="card p-5 border-l-4 border-l-indigo-500 bg-white dark:bg-slate-800/90 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Register</span>
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 material-symbols-outlined text-xl">
              groups
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {totalRegistered.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1">Eligible voters table register</p>
          </div>
        </div>

        {/* Accredited Voters */}
        <div className="card p-5 border-l-4 border-l-emerald-500 bg-white dark:bg-slate-800/90 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Accredited (OTP Verified)</span>
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 material-symbols-outlined text-xl">
              verified
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {accreditedCount.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {accreditationRate}% of register accredited
            </p>
          </div>
        </div>

        {/* Eligible vs Disqualified */}
        <div className="card p-5 border-l-4 border-l-blue-500 bg-white dark:bg-slate-800/90 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Eligible to Vote</span>
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 material-symbols-outlined text-xl">
              how_to_vote
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-blue-600 dark:text-blue-400">
              {eligibleCount.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {disqualifiedCount} accounts disqualified
            </p>
          </div>
        </div>

        {/* Total Votes Cast & Turnout */}
        <div className="card p-5 border-l-4 border-l-amber-500 bg-white dark:bg-slate-800/90 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ballots Cast</span>
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 material-symbols-outlined text-xl">
              ballot
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
              {totalVotesCast.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Turnout: <b>{turnoutPercent}%</b> of accredited
            </p>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 1: ACCREDITATION BREAKDOWN & ELECTION PROCESS FUNNEL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CHART 1: ACCREDITATION & ELIGIBILITY PIE/DONUT */}
        <div className="card p-6 bg-white dark:bg-slate-800/90 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500">pie_chart</span>
                Accreditation & Eligibility Distribution
              </h3>
              <p className="text-xs text-slate-500">Breakdown of accredited, pending, and disqualified voters</p>
            </div>
          </div>

          <div className="h-72 w-full">
            {accreditationPieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No voter data recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={accreditationPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {accreditationPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '12px',
                    }}
                    formatter={(value: any, name: any) => [`${value} Voters`, name]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-center text-xs">
            <div>
              <span className="text-emerald-600 font-bold text-base block">{accreditedCount}</span>
              <span className="text-slate-500">Accredited</span>
            </div>
            <div>
              <span className="text-amber-500 font-bold text-base block">{unaccreditedCount}</span>
              <span className="text-slate-500">Pending OTP</span>
            </div>
            <div>
              <span className="text-red-600 font-bold text-base block">{disqualifiedCount}</span>
              <span className="text-slate-500">Disqualified</span>
            </div>
          </div>
        </div>

        {/* CHART 2: VOTING FUNNEL / STAGES BAR CHART */}
        <div className="card p-6 bg-white dark:bg-slate-800/90 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500">bar_chart</span>
                Voter Accreditation & Turnout Funnel
              </h3>
              <p className="text-xs text-slate-500">Drop-off and progress from registration to cast ballots</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={voterFunnelData} margin={{ top: 15, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                <XAxis
                  dataKey="stage"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [`${value} Voters`, 'Count']}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {voterFunnelData.map((entry, index) => (
                    <Cell key={`funnel-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-500">
            <span>Accreditation Conversion: <b>{accreditationRate}%</b></span>
            <span>Election Turnout: <b>{turnoutPercent}%</b></span>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 2: CATEGORY / OFFICE PARTICIPATION COMPARISON */}
      <div className="card p-6 bg-white dark:bg-slate-800/90 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-violet-500">how_to_vote</span>
              Participation by Contested Office / Category
            </h3>
            <p className="text-xs text-slate-500">Total votes submitted across each elective position</p>
          </div>

          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 w-fit">
            {offices.length} Active Offices
          </span>
        </div>

        <div className="h-80 w-full">
          {officeVotesData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              No contested offices configured.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={officeVotesData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  width={90}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [`${value} Ballots Cast`, 'Votes']}
                />
                <Bar dataKey="votes" radius={[0, 8, 8, 0]}>
                  {officeVotesData.map((_, index) => (
                    <Cell
                      key={`office-${index}`}
                      fill={OFFICE_COLORS[index % OFFICE_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* SUMMARY TABLE CARD */}
      <div className="card p-6 bg-white dark:bg-slate-800/90 space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">table_chart</span>
          Detailed Election Audit Metrics
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Metric Category</th>
                <th className="px-4 py-3">Count</th>
                <th className="px-4 py-3">% of Register</th>
                <th className="px-4 py-3">Operational Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-500 text-base">groups</span>
                  Total Database Register
                </td>
                <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{totalRegistered}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">100.0%</td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                    Official Roster
                  </span>
                </td>
              </tr>

              <tr>
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500 text-base">verified</span>
                  Accredited Voters (OTP Validated)
                </td>
                <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{accreditedCount}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{accreditationRate}%</td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    Ready to Vote
                  </span>
                </td>
              </tr>

              <tr>
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-base">hourglass_empty</span>
                  Unaccredited Voters (Pending)
                </td>
                <td className="px-4 py-3 font-bold text-amber-600 dark:text-amber-400">{unaccreditedCount}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {totalRegistered > 0 ? ((unaccreditedCount / totalRegistered) * 100).toFixed(1) : 0}%
                </td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                    Awaiting Accreditation
                  </span>
                </td>
              </tr>

              <tr>
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500 text-base">block</span>
                  Disqualified / Inactive Voters
                </td>
                <td className="px-4 py-3 font-bold text-red-600 dark:text-red-400">{disqualifiedCount}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {totalRegistered > 0 ? ((disqualifiedCount / totalRegistered) * 100).toFixed(1) : 0}%
                </td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    Access Revoked
                  </span>
                </td>
              </tr>

              <tr>
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-500 text-base">how_to_vote</span>
                  Total Votes Submitted
                </td>
                <td className="px-4 py-3 font-bold text-blue-600 dark:text-blue-400">{totalVotesCast}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">-</td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    Cryptographically Logged
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
