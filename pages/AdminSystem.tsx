import React, { useState, useEffect } from 'react';
import { systemAPI } from '../api';
import { LoadingSpinner, ErrorAlert } from '../components/UIComponents';

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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const data = await systemAPI.getConfig();
            setConfig(data);
            setError('');
        } catch (err: any) {
            setError('Failed to load configuration');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">System Configuration</h1>
                <p className="text-slate-500 dark:text-slate-400">View system configuration settings.</p>
            </div>

            {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

            {loading ? (
                <LoadingSpinner />
            ) : (
                <div className="bg-white dark:bg-[#1a1d29] rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <pre className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg overflow-auto text-sm">
                        {JSON.stringify(config, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};
