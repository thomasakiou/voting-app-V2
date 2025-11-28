import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersAPI, officesAPI, candidatesAPI, votesAPI, votingTimeAPI, VotingTimeResponse } from '../api';
import { LoadingSpinner, SuccessAlert, ErrorAlert } from '../components/UIComponents';

interface DashboardStats {
  total_users: number;
  total_voters: number;
  total_admins: number;
  total_offices: number;
  total_candidates: number;
  total_votes: number;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [votingTime, setVotingTime] = useState<VotingTimeResponse | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [timeSuccess, setTimeSuccess] = useState('');
  const [timeError, setTimeError] = useState('');
  const [updatingTime, setUpdatingTime] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Fetch all data in parallel to calculate stats
      const [users, offices, candidates, votes, timeData] = await Promise.all([
        usersAPI.getAll(),
        officesAPI.getAll(),
        candidatesAPI.getAll(),
        votesAPI.getAll(),
        votingTimeAPI.getVotingTime()
      ]);

      if (timeData) {
        setVotingTime(timeData);
        // Format for datetime-local input (YYYY-MM-DDThh:mm)
        setStartTime(new Date(timeData.start_time).toISOString().slice(0, 16));
        setEndTime(new Date(timeData.end_time).toISOString().slice(0, 16));
      }

      const voters = users.filter(u => u.role === 'voter');
      const admins = users.filter(u => u.role === 'admin' || u.role === 'super-admin');

      setStats({
        total_users: users.length,
        total_voters: voters.length,
        total_admins: admins.length,
        total_offices: offices.length,
        total_candidates: candidates.length,
        total_votes: votes.length
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingTime(true);
    setTimeSuccess('');
    setTimeError('');

    try {
      const updatedTime = await votingTimeAPI.setVotingTime({
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString()
      });
      setVotingTime(updatedTime);
      setTimeSuccess('Voting schedule updated successfully');
    } catch (err: any) {
      setTimeError(err?.data?.detail || 'Failed to update voting schedule');
    } finally {
      setUpdatingTime(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const statCards = [
    {
      title: 'Total Votes',
      value: stats?.total_votes || 0,
      icon: 'how_to_vote',
      color: 'from-indigo-500 to-violet-600',
      link: '/admin/results',
      trend: 'Live Count'
    },
    {
      title: 'Registered Voters',
      value: stats?.total_voters || 0,
      icon: 'group',
      color: 'from-blue-500 to-cyan-500',
      link: '/admin/users',
      trend: `${stats?.total_users || 0} Total Users`
    },
    {
      title: 'Candidates',
      value: stats?.total_candidates || 0,
      icon: 'person_add',
      color: 'from-emerald-500 to-teal-500',
      link: '/admin/candidates',
      trend: 'Across all offices'
    },
    {
      title: 'Offices',
      value: stats?.total_offices || 0,
      icon: 'account_balance',
      color: 'from-orange-500 to-amber-500',
      link: '/admin/offices',
      trend: 'Active contests'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time election insights and system status.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium border border-green-200 dark:border-green-800">
            <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
            System Operational
          </span>
          <button
            onClick={loadStats}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Link
            key={index}
            to={stat.link}
            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 dark:border-slate-700/50"
          >
            <div className={`absolute top-0 right-0 -mt-4 -mr-4 size-24 rounded-full bg-gradient-to-br ${stat.color} opacity-10 group-hover:opacity-20 transition-opacity`}></div>

            <div className="flex items-start justify-between mb-4">
              <div className={`size-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300`}>
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
              <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors">arrow_forward</span>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1 mb-2">{stat.value}</h3>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
                {stat.trend}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Activity / Quick Actions */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Quick Actions</h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Link to="/admin/users/create" className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:border-indigo-500/30 hover:bg-white dark:hover:bg-slate-800 transition-all group">
              <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <span className="material-symbols-outlined">person_add</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white">Add New User</h4>
                <p className="text-xs text-slate-500">Create admin or voter</p>
              </div>
            </Link>

            <Link to="/admin/users/bulk-upload" className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:border-indigo-500/30 hover:bg-white dark:hover:bg-slate-800 transition-all group">
              <div className="size-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <span className="material-symbols-outlined">upload_file</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white">Bulk Upload</h4>
                <p className="text-xs text-slate-500">Import voters via CSV</p>
              </div>
            </Link>

            <Link to="/admin/offices/create" className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:border-indigo-500/30 hover:bg-white dark:hover:bg-slate-800 transition-all group">
              <div className="size-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <span className="material-symbols-outlined">add_business</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white">Create Office</h4>
                <p className="text-xs text-slate-500">Add new electoral position</p>
              </div>
            </Link>

            <Link to="/admin/results" className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:border-indigo-500/30 hover:bg-white dark:hover:bg-slate-800 transition-all group">
              <div className="size-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <span className="material-symbols-outlined">analytics</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white">View Analytics</h4>
                <p className="text-xs text-slate-500">Check election progress</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Voting Schedule Configuration */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Voting Schedule</h3>

          {timeSuccess && <SuccessAlert message={timeSuccess} onDismiss={() => setTimeSuccess('')} />}
          {timeError && <ErrorAlert message={timeError} onDismiss={() => setTimeError('')} />}

          <form onSubmit={handleTimeUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="input-field py-2 dark:[color-scheme:dark]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Time</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="input-field py-2 dark:[color-scheme:dark]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={updatingTime}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2"
              >
                {updatingTime ? (
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined">update</span>
                    Update Schedule
                  </>
                )}
              </button>
            </div>
          </form>

          {votingTime && (
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/50">
              <p className="text-xs font-medium text-slate-500 uppercase mb-3">Current Status</p>
              <div className="flex items-center gap-2">
                <div className={`size-3 rounded-full ${new Date() >= new Date(votingTime.start_time) && new Date() <= new Date(votingTime.end_time)
                  ? 'bg-green-500 animate-pulse'
                  : new Date() < new Date(votingTime.start_time)
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                  }`}></div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {new Date() >= new Date(votingTime.start_time) && new Date() <= new Date(votingTime.end_time)
                    ? 'Voting Active'
                    : new Date() < new Date(votingTime.start_time)
                      ? 'Scheduled'
                      : 'Voting Ended'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* System Health */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">System Health</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">API Server</span>
              </div>
              <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">Online</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Database</span>
              </div>
              <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">Connected</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Last Backup</span>
              </div>
              <span className="text-xs text-slate-500">2 hours ago</span>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-medium text-slate-500 uppercase">Storage Usage</span>
                <span className="ml-auto text-xs font-bold text-slate-700 dark:text-slate-300">45%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full w-[45%] bg-indigo-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
