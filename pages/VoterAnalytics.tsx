import React, { useState, useEffect } from 'react';
import { officesAPI, resultsAPI, OfficeResponse } from '../api';
import { LoadingSpinner, ErrorAlert } from '../components/UIComponents';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const VoterAnalytics: React.FC = () => {
    const [offices, setOffices] = useState<OfficeResponse[]>([]);
    const [selectedOffice, setSelectedOffice] = useState<string>('');
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [resultsLoading, setResultsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadOffices();
    }, []);

    const loadOffices = async () => {
        try {
            const data = await officesAPI.getAll();
            setOffices(data);
            if (data.length > 0) {
                setSelectedOffice(data[0].office_code);
                loadResults(data[0].office_code);
            }
        } catch (err) {
            setError('Failed to load election data');
        } finally {
            setLoading(false);
        }
    };

    const loadResults = async (officeCode: string) => {
        try {
            setResultsLoading(true);
            const data = await resultsAPI.getByOfficeCode(officeCode);
            setResults(data);
        } catch (err) {
            console.error('Failed to load results:', err);
        } finally {
            setResultsLoading(false);
        }
    };

    const handleOfficeChange = (officeCode: string) => {
        setSelectedOffice(officeCode);
        loadResults(officeCode);
    };

    if (loading) return <LoadingSpinner />;

    // Calculate total votes if not provided by API
    const totalVotes = results?.total_votes ?? results?.results?.reduce((sum: number, r: any) => sum + r.vote_count, 0) ?? 0;

    // Prepare chart data with client-side percentage calculation
    const chartData = results?.results?.map((r: any, index: number) => {
        const percentage = totalVotes > 0 ? ((r.vote_count / totalVotes) * 100).toFixed(1) : '0.0';
        return {
            name: r.candidate_name,
            votes: r.vote_count,
            percentage: parseFloat(percentage),
            color: COLORS[index % COLORS.length]
        };
    }) || [];

    // Sort for leaderboard
    const sortedResults = [...(results?.results || [])].map((r: any) => ({
        ...r,
        percentage: totalVotes > 0 ? ((r.vote_count / totalVotes) * 100).toFixed(1) : '0.0'
    })).sort((a, b) => b.vote_count - a.vote_count);

    // Handle ties for the leader
    const maxVotes = sortedResults.length > 0 ? sortedResults[0].vote_count : 0;
    const leaders = sortedResults.filter(r => r.vote_count === maxVotes && r.vote_count > 0);



    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Live Election Analytics</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time insights and candidate standings.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full border border-red-100 dark:border-red-800/50 animate-pulse">
                    <span className="size-2 bg-red-500 rounded-full"></span>
                    <span className="text-sm font-bold uppercase tracking-wider">Live Updates</span>
                </div>
            </div>

            {/* Office Selector */}
            <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar">
                {offices.map((office) => (
                    <button
                        key={office.id}
                        onClick={() => handleOfficeChange(office.office_code)}
                        className={`whitespace-nowrap px-6 py-3 rounded-xl font-medium transition-all duration-200 ${selectedOffice === office.office_code
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                            }`}
                    >
                        {office.description}
                    </button>
                ))}
            </div>

            {resultsLoading ? (
                <div className="h-96 flex items-center justify-center">
                    <LoadingSpinner />
                </div>
            ) : results ? (
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Leaderboard Column */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Current Leader(s) Card */}
                        <div className="card p-6 bg-gradient-to-br from-indigo-600 to-violet-600 text-white border-none">
                            <h3 className="text-indigo-100 font-medium mb-4">
                                {leaders.length > 1 ? 'Current Leaders (Tie)' : 'Current Leader'}
                            </h3>

                            {leaders.length > 0 ? (
                                <div className="space-y-6">
                                    {leaders.map((leader: any, index: number) => (
                                        <div key={index} className={`${index > 0 ? 'pt-6 border-t border-white/10' : ''}`}>
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className="size-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold backdrop-blur-sm shrink-0">
                                                    {leader.candidate_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold leading-tight">{leader.candidate_name}</h2>
                                                    <p className="text-indigo-100 text-sm mt-1">{leader.vote_count} votes ({leader.percentage}%)</p>
                                                </div>
                                            </div>
                                            <div className="w-full bg-black/20 rounded-full h-2">
                                                <div className="bg-white h-2 rounded-full" style={{ width: `${leader.percentage}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-indigo-100">
                                    No votes cast yet
                                </div>
                            )}
                        </div>

                        <div className="card p-6">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Leaderboard</h3>
                            <div className="space-y-4">
                                {sortedResults.map((r: any, index: number) => (
                                    <div key={index} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className={`size-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                            index === 1 ? 'bg-slate-100 text-slate-700' :
                                                index === 2 ? 'bg-orange-100 text-orange-700' :
                                                    'bg-slate-50 text-slate-500'
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <span className="font-medium text-slate-900 dark:text-white">{r.candidate_name}</span>
                                                <span className="text-slate-500 text-sm">{r.vote_count}</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                                                <div
                                                    className="h-1.5 rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${r.percentage}%`,
                                                        backgroundColor: COLORS[index % COLORS.length]
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Chart Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="card p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-slate-900 dark:text-white">Vote Distribution</h3>
                                <div className="text-sm text-slate-500">
                                    Total Votes: <span className="font-bold text-slate-900 dark:text-white">{totalVotes}</span>
                                </div>
                            </div>

                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6B7280', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6B7280', fontSize: 12 }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{
                                                backgroundColor: '#1f2937',
                                                border: 'none',
                                                borderRadius: '0.75rem',
                                                color: '#f3f4f6',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                            }}
                                        />
                                        <Bar dataKey="votes" radius={[8, 8, 0, 0]} animationDuration={1500}>
                                            {chartData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="card p-6 flex items-center gap-4">
                                <div className="size-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <span className="material-symbols-outlined">how_to_vote</span>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Cast</p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalVotes}</p>
                                </div>
                            </div>
                            <div className="card p-6 flex items-center gap-4">
                                <div className="size-12 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                    <span className="material-symbols-outlined">groups</span>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Candidates</p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{results.results?.length || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card p-12 text-center">
                    <div className="size-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-slate-400 text-3xl">analytics</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Data Available</h3>
                    <p className="text-slate-500 dark:text-slate-400">Select an office to view analytics.</p>
                </div>
            )}
        </div>
    );
};
