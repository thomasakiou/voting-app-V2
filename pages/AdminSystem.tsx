import React, { useState, useEffect } from 'react';
import { systemAPI, auditLogsAPI, AuditLog } from '../api';
import { LoadingSpinner, ErrorAlert, SuccessAlert, TablePagination, usePagination } from '../components/UIComponents';

export const SystemStatus: React.FC = () => {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        try {
            setLoading(true);
            const data = await systemAPI.getAppStatus();
            setStatus(data);
            setError('');
        } catch (err: any) {
            setError('Failed to load system status');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">System Status</h1>
                <p className="text-slate-500 dark:text-slate-400">Monitor backend API health and status.</p>
            </div>

            {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

            {loading ? (
                <LoadingSpinner />
            ) : (
                <div className="bg-white dark:bg-[#1a1d29] rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="size-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-lg font-semibold">API is Online</span>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">Status</div>
                            <div className="text-lg font-medium">
                                {status?.status || 'Running'}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">Message</div>
                            <div className="text-lg font-medium">
                                {status?.message || 'Python Voting API is running'}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={loadStatus}
                        className="mt-6 btn-secondary"
                    >
                        Refresh Status
                    </button>
                </div>
            )}
        </div>
    );
};

export const SystemConfig: React.FC = () => {
    const [config, setConfig] = useState<any>(null);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadingLogs, setDownloadingLogs] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filterAction, setFilterAction] = useState('');

    const {
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        totalPages,
        totalItems,
        paginatedItems: paginatedAuditLogs,
    } = usePagination(auditLogs, 10);

    useEffect(() => {
        loadData();
    }, [filterAction]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterAction, setCurrentPage]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [configData, logsData] = await Promise.all([
                systemAPI.getConfig().catch(() => ({})),
                auditLogsAPI.getAll(500, 0, filterAction || undefined).catch(() => []),
            ]);
            setConfig(configData);
            setAuditLogs(logsData);
            setError('');
        } catch (err: any) {
            setError('Failed to load settings and audit logs');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadCSV = async () => {
        setDownloadingLogs(true);
        setError('');
        try {
            await auditLogsAPI.downloadCSV();
            setSuccess('Audit logs CSV downloaded successfully.');
        } catch (err) {
            setError('Failed to download audit logs.');
        } finally {
            setDownloadingLogs(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings & Audit Logs</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        View system configuration and downloadable audit logs of all administrative actions.
                    </p>
                </div>

                <button
                    onClick={handleDownloadCSV}
                    disabled={downloadingLogs}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center gap-2 text-sm shadow-md shadow-indigo-500/20 transition-all"
                >
                    <span className="material-symbols-outlined text-sm">download</span>
                    {downloadingLogs ? 'Downloading...' : 'Download Audit Log (CSV)'}
                </button>
            </div>

            {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
            {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}

            {/* AUDIT LOG TABLE (REQUIREMENT 8) */}
            <div className="bg-white dark:bg-[#1a1d29] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-indigo-500">history_edu</span>
                            Official Administrative Audit Trail
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Immutable log of administrative modifications, candidate disqualifications, and election status changes.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                            className="input-field py-1.5 px-3 text-xs dark:bg-slate-900"
                        >
                            <option value="">All Actions</option>
                            <option value="START_VOTING">Start Voting</option>
                            <option value="STOP_VOTING">Stop Voting</option>
                            <option value="DISQUALIFY_CANDIDATE">Disqualify Candidate</option>
                            <option value="QUALIFY_CANDIDATE">Qualify Candidate</option>
                            <option value="DISQUALIFY_OFFICE">Disqualify Office</option>
                            <option value="DISABLE_USER">Disable Voter</option>
                            <option value="ENABLE_USER">Enable Voter</option>
                        </select>
                        <button
                            onClick={loadData}
                            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">refresh</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <LoadingSpinner />
                ) : auditLogs.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        No audit logs recorded for the selected filter.
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold text-xs uppercase">
                                    <tr>
                                        <th className="px-5 py-3">Timestamp</th>
                                        <th className="px-5 py-3">Admin</th>
                                        <th className="px-5 py-3">Action</th>
                                        <th className="px-5 py-3">Target</th>
                                        <th className="px-5 py-3">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {paginatedAuditLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-5 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white">
                                                {log.admin_username}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-xs font-medium text-slate-600 dark:text-slate-300">
                                                {log.target_type && (
                                                    <span className="text-slate-400">[{log.target_type}] </span>
                                                )}
                                                {log.target_id || '-'}
                                            </td>
                                            <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate" title={log.details || ''}>
                                                {log.details || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <TablePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={setPageSize}
                            pageSizeOptions={[10, 25, 50, 100]}
                            itemName="audit records"
                        />
                    </>
                )}
            </div>

            {/* SYSTEM CONFIGURATION JSON */}
            <div className="bg-white dark:bg-[#1a1d29] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Runtime Environment Configuration</h3>
                <pre className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl overflow-auto text-xs font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                    {JSON.stringify(config, null, 2)}
                </pre>
            </div>
        </div>
    );
};
