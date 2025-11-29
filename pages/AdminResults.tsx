import React, { useState, useEffect } from 'react';
import { officesAPI, resultsAPI, OfficeResponse } from '../api';
import { LoadingSpinner, ErrorAlert } from '../components/UIComponents';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const ElectionResults: React.FC = () => {
    const [offices, setOffices] = useState<OfficeResponse[]>([]);
    const [selectedOffice, setSelectedOffice] = useState<string>('');
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);
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
            setError('Failed to load offices');
        }
    };

    const loadResults = async (officeCode: string) => {
        try {
            setLoading(true);
            setError('');
            const data = await resultsAPI.getByOfficeCode(officeCode);
            setResults(data);
        } catch (err: any) {
            setError('Failed to load results');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOfficeChange = (officeCode: string) => {
        setSelectedOffice(officeCode);
        loadResults(officeCode);
    };

    // Sort results by vote count descending
    const sortedResults = results?.results ? [...results.results].sort((a: any, b: any) => b.vote_count - a.vote_count) : [];

    // Calculate total votes and percentages client-side
    const totalVotes = sortedResults.reduce((sum: number, r: any) => sum + r.vote_count, 0) || 0;

    // Transform results for charts
    const chartData = sortedResults.map((r: any, index: number) => {
        const percentage = totalVotes > 0 ? ((r.vote_count / totalVotes) * 100).toFixed(1) : '0.0';
        return {
            name: r.candidate_name,
            votes: r.vote_count,
            percentage: parseFloat(percentage),
            fill: COLORS[index % COLORS.length],
        };
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 md:gap-4 no-print">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Election Results</h1>
                    <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">View voting results by office.</p>
                </div>
                <button
                    onClick={() => window.print()}
                    className="w-full sm:w-auto px-3 md:px-4 py-2 md:py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center gap-2 text-sm md:text-base"
                >
                    <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                    Download Results PDF
                </button>
            </div>

            {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

            <div className="bg-white dark:bg-[#1a1d29] rounded-xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 no-print">
                <div className="mb-4 md:mb-6">
                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Select Office</label>
                    <select
                        value={selectedOffice}
                        onChange={(e) => handleOfficeChange(e.target.value)}
                        className="input-field max-w-full md:max-w-md dark:bg-slate-900"
                    >
                        {offices.map((office) => (
                            <option key={office.id} value={office.office_code} className="dark:bg-slate-900 dark:text-white">
                                {office.description}
                            </option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <LoadingSpinner />
                ) : results ? (
                    <div className="space-y-8">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                            <div className="p-3 md:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                                <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Total Votes</div>
                                <div className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                                    {totalVotes}
                                </div>
                            </div>
                            <div className="p-3 md:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                                <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Candidates</div>
                                <div className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                                    {sortedResults.length}
                                </div>
                            </div>
                            <div className="p-3 md:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 sm:col-span-2 lg:col-span-1">
                                <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Leading Candidate</div>
                                <div className="text-lg md:text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 truncate">
                                    {sortedResults[0]?.candidate_name || 'N/A'}
                                </div>
                            </div>
                        </div>

                        {/* Bar Chart */}
                        <div>
                            <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Vote Distribution</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                                    <XAxis dataKey="name" stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                                        itemStyle={{ color: '#f3f4f6' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="votes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Pie Chart */}
                        <div>
                            <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Vote Percentage</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={(entry) => `${entry.name}: ${entry.percentage}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="votes"
                                    >
                                        {chartData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                                        itemStyle={{ color: '#f3f4f6' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Results Table */}
                        <div>
                            <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4 text-slate-900 dark:text-white">Detailed Results</h3>
                            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 -mx-4 md:mx-0">
                                <table className="w-full text-left text-sm min-w-[600px]">
                                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                                        <tr>
                                            <th className="px-4 md:px-6 py-3">Rank</th>
                                            <th className="px-4 md:px-6 py-3">Candidate</th>
                                            <th className="px-4 md:px-6 py-3">Votes</th>
                                            <th className="px-4 md:px-6 py-3">Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-900">
                                        {sortedResults.map((result: any, index: number) => {
                                            const percentage = totalVotes > 0 ? ((result.vote_count / totalVotes) * 100).toFixed(1) : '0.0';
                                            return (
                                                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">{index + 1}</td>
                                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                                        {result.candidate_name}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{result.vote_count}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 max-w-xs bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                                                <div
                                                                    className="bg-indigo-600 h-2 rounded-full"
                                                                    style={{ width: `${percentage}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="font-medium text-slate-700 dark:text-slate-300">{percentage}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-500">
                        Select an office to view results
                    </div>
                )}
            </div>

            {/* Print View */}
            <div className="print-only">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold mb-2">Official Election Results</h1>
                    <h2 className="text-xl text-slate-700 mb-1">
                        Office: {offices.find(o => o.office_code === selectedOffice)?.description || selectedOffice}
                    </h2>
                    <p className="text-sm text-slate-500">Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                </div>

                {results && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 border border-slate-300 rounded">
                                <div className="text-sm text-slate-500">Total Votes Cast</div>
                                <div className="text-2xl font-bold">{totalVotes}</div>
                            </div>
                            <div className="p-4 border border-slate-300 rounded">
                                <div className="text-sm text-slate-500">Winner</div>
                                <div className="text-2xl font-bold text-indigo-700">
                                    {sortedResults[0]?.candidate_name || 'N/A'}
                                </div>
                            </div>
                        </div>

                        <table className="w-full text-left text-sm border-collapse border border-slate-300">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="border border-slate-300 px-4 py-2">Rank</th>
                                    <th className="border border-slate-300 px-4 py-2">Candidate</th>
                                    <th className="border border-slate-300 px-4 py-2">Votes</th>
                                    <th className="border border-slate-300 px-4 py-2">Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedResults.map((result: any, index: number) => {
                                    const percentage = totalVotes > 0 ? ((result.vote_count / totalVotes) * 100).toFixed(1) : '0.0';
                                    return (
                                        <tr key={index}>
                                            <td className="border border-slate-300 px-4 py-2 font-bold">{index + 1}</td>
                                            <td className="border border-slate-300 px-4 py-2">{result.candidate_name}</td>
                                            <td className="border border-slate-300 px-4 py-2">{result.vote_count}</td>
                                            <td className="border border-slate-300 px-4 py-2">{percentage}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="mt-12 text-xs text-slate-400 text-center border-t border-slate-200 pt-4">
                    SecureVote System - Official Audit Record
                </div>
            </div>
        </div>
    );
};
