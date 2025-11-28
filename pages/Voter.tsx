import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { officesAPI, candidatesAPI, votesAPI, votingTimeAPI, OfficeResponse, CandidateResponse, VotingTimeResponse } from '../api';
import { LoadingSpinner, ErrorAlert } from '../components/UIComponents';
import { CountdownTimer } from '../components/CountdownTimer';

export const VoterDashboard: React.FC = () => {
    const { user } = useAuth();
    const [offices, setOffices] = useState<OfficeResponse[]>([]);
    const [votingTime, setVotingTime] = useState<VotingTimeResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [votingStatus, setVotingStatus] = useState<'not_started' | 'active' | 'ended'>('not_started');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [officesData, timeData] = await Promise.all([
                officesAPI.getAll(),
                votingTimeAPI.getVotingTime()
            ]);
            setOffices(officesData);
            setVotingTime(timeData);

            if (timeData) {
                checkVotingStatus(timeData);
            } else {
                // If no time set, assume active or handle as needed (defaulting to active for now if no restrictions)
                setVotingStatus('active');
            }
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    };

    const checkVotingStatus = (timeData: VotingTimeResponse) => {
        const now = new Date().getTime();
        const start = new Date(timeData.start_time).getTime();
        const end = new Date(timeData.end_time).getTime();

        if (now < start) {
            setVotingStatus('not_started');
        } else if (now > end) {
            setVotingStatus('ended');
        } else {
            setVotingStatus('active');
        }
    };

    // Re-check status periodically
    useEffect(() => {
        if (!votingTime) return;

        const interval = setInterval(() => {
            checkVotingStatus(votingTime);
        }, 1000);

        return () => clearInterval(interval);
    }, [votingTime]);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-white shadow-xl shadow-indigo-500/20">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 size-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 size-64 rounded-full bg-black/10 blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Welcome, {user?.full_name ? user.full_name.split(' ')[0] : user?.username}</h1>
                        <p className="text-indigo-100 text-lg max-w-xl">
                            {votingStatus === 'active'
                                ? "The 2024 General Election is currently live. Your voice matters—cast your secure digital ballot today."
                                : votingStatus === 'not_started'
                                    ? "The election has not started yet. Please check back at the scheduled start time."
                                    : "The election has ended. Thank you for participating."}
                        </p>
                    </div>
                    {votingStatus === 'active' ? (
                        <Link
                            to="/voter/ballot"
                            className="px-8 py-4 bg-white text-indigo-600 font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-indigo-50 transform hover:-translate-y-1 transition-all duration-200 flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined">how_to_vote</span>
                            Start Voting
                        </Link>
                    ) : (
                        <div className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl border border-white/20 flex items-center gap-2 cursor-not-allowed">
                            <span className="material-symbols-outlined">block</span>
                            {votingStatus === 'not_started' ? 'Voting Not Started' : 'Voting Closed'}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Election Status Card */}
                <div className="md:col-span-2 card p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Election Status</h2>
                            <p className="text-slate-500 dark:text-slate-400">Real-time updates</p>
                        </div>
                        {votingStatus === 'active' && (
                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-bold flex items-center gap-2 border border-green-200 dark:border-green-800">
                                <span className="relative flex size-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full size-2.5 bg-green-500"></span>
                                </span>
                                Polls Open
                            </span>
                        )}
                        {votingStatus === 'not_started' && (
                            <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-sm font-bold flex items-center gap-2 border border-yellow-200 dark:border-yellow-800">
                                <span className="material-symbols-outlined text-sm">schedule</span>
                                Polls Closed
                            </span>
                        )}
                        {votingStatus === 'ended' && (
                            <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-bold flex items-center gap-2 border border-red-200 dark:border-red-800">
                                <span className="material-symbols-outlined text-sm">lock</span>
                                Election Ended
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Offices on Ballot</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white">{offices.length}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3">
                                {votingStatus === 'not_started' ? 'Starts In' : votingStatus === 'active' ? 'Time Remaining' : 'Status'}
                            </p>
                            {votingTime ? (
                                votingStatus === 'ended' ? (
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">Completed</p>
                                ) : (
                                    <div className="scale-75 origin-top-left -mb-4 -mt-2">
                                        <CountdownTimer
                                            endTime={votingStatus === 'not_started' ? votingTime.start_time : votingTime.end_time}
                                            onExpire={() => checkVotingStatus(votingTime)}
                                        />
                                    </div>
                                )
                            ) : (
                                <p className="text-xl font-bold text-slate-900 dark:text-white">Not Scheduled</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Eligibility Card */}
                <div className="card p-6 flex flex-col justify-center items-center text-center bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
                    <div className="size-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
                        <span className="material-symbols-outlined text-3xl">verified_user</span>
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Verified Voter</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Your identity has been verified. You are eligible to vote in all {offices.length} contests.
                    </p>
                </div>
            </div>

            {/* Offices List */}
            <div className="card p-6">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Contests on Your Ballot</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {offices.map((office) => (
                        <div key={office.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:border-indigo-500/30 transition-colors">
                            <div className="size-10 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-slate-400 shadow-sm">
                                <span className="material-symbols-outlined">how_to_vote</span>
                            </div>
                            <span className="font-medium text-slate-700 dark:text-slate-200">{office.description}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const SelectOffice: React.FC = () => {
    const [offices, setOffices] = useState<OfficeResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [officesData, timeData] = await Promise.all([
                officesAPI.getAll(),
                votingTimeAPI.getVotingTime()
            ]);

            // Check if voting is allowed
            if (timeData) {
                const now = new Date().getTime();
                const start = new Date(timeData.start_time).getTime();
                const end = new Date(timeData.end_time).getTime();

                if (now < start || now > end) {
                    // Redirect to dashboard if not active
                    // You might want to show a message, but redirect is safer
                    window.location.href = '/#/voter/dashboard';
                    return;
                }
            }

            setOffices(officesData);
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Official Ballot</h1>
                <p className="text-slate-500 dark:text-slate-400">Select a contest below to view candidates and cast your vote.</p>
            </div>

            <div className="grid gap-4">
                {offices.map((office) => (
                    <Link
                        key={office.id}
                        to={`/voter/ballot/${office.office_code}`}
                        className="group card p-6 flex items-center justify-between hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300"
                    >
                        <div className="flex items-center gap-6">
                            <div className="size-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                                <span className="material-symbols-outlined text-2xl">how_to_vote</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {office.description}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">
                                    Tap to view candidates
                                </p>
                            </div>
                        </div>
                        <div className="size-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export const VoteCandidate: React.FC = () => {
    const navigate = useNavigate();
    const { officeId } = useParams<{ officeId: string }>();
    const [candidates, setCandidates] = useState<CandidateResponse[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (officeId) {
            loadCandidates();
        }
    }, [officeId]);

    const loadCandidates = async () => {
        try {
            const data = await candidatesAPI.getByOfficeCode(officeId!);
            setCandidates(data);
        } catch (err) {
            setError('Failed to load candidates');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!selected || !officeId) return;

        // Double check voting time before submission
        try {
            const timeData = await votingTimeAPI.getVotingTime();
            if (timeData) {
                const now = new Date().getTime();
                const start = new Date(timeData.start_time).getTime();
                const end = new Date(timeData.end_time).getTime();

                if (now < start || now > end) {
                    setError('Voting is currently closed.');
                    return;
                }
            }
        } catch (err) {
            console.error('Failed to verify voting time:', err);
            // Continue if check fails? Or block? Blocking is safer.
            setError('Failed to verify election status. Please try again.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await votesAPI.cast({
                candidate_code: selected,
                office_code: officeId,
            });
            navigate('/voter/success');
        } catch (err: any) {
            if (err?.status === 400 || err?.status === 409) {
                setError('You have already voted for this office.');
            } else {
                setError(err?.data?.detail || 'Failed to cast vote');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    if (candidates.length === 0) {
        return (
            <div className="max-w-xl mx-auto p-8 text-center card mt-12">
                <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-slate-400 text-4xl">person_off</span>
                </div>
                <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">No Candidates Found</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8">There are no candidates listed for this office yet.</p>
                <button onClick={() => navigate(-1)} className="btn-secondary w-full">
                    Back to Ballot
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8 flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="size-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{candidates[0]?.office.description || 'Office'}</h1>
                    <p className="text-slate-500 dark:text-slate-400">Select one candidate for this office.</p>
                </div>
            </div>

            {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

            <div className="grid md:grid-cols-2 gap-4 mb-8">
                {candidates.map((c) => (
                    <label
                        key={c.id}
                        className={`relative flex items-start gap-4 p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${selected === c.candidate_code
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-lg shadow-indigo-500/10'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                            }`}
                    >
                        <div className={`size-16 rounded-full flex items-center justify-center text-2xl font-bold ${selected === c.candidate_code
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                            }`}>
                            {c.name.charAt(0)}
                        </div>

                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{c.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Candidate Code: {c.candidate_code}</p>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                                Official Candidate
                            </span>
                        </div>

                        <div className={`size-6 rounded-full border-2 flex items-center justify-center mt-1 ${selected === c.candidate_code ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 dark:border-slate-600'
                            }`}>
                            {selected === c.candidate_code && <div className="size-2.5 bg-white rounded-full" />}
                        </div>

                        <input
                            type="radio"
                            name="candidate"
                            className="hidden"
                            onChange={() => setSelected(c.candidate_code)}
                        />
                    </label>
                ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 md:static md:bg-transparent md:border-none md:p-0">
                <div className="max-w-4xl mx-auto flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={!selected || submitting}
                        className="w-full md:w-auto btn-primary flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Submitting...
                            </>
                        ) : (
                            <>
                                Cast Secure Vote
                                <span className="material-symbols-outlined">how_to_vote</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ConfirmVote: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="fixed inset-0 z-50 bg-[#0B1120]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-8 relative animate-scale-in border border-slate-100 dark:border-slate-700">
                <button onClick={() => navigate(-1)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                    <span className="material-symbols-outlined">close</span>
                </button>

                <div className="text-center mb-8">
                    <div className="size-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600 dark:text-indigo-400">
                        <span className="material-symbols-outlined text-4xl">how_to_vote</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Confirm Your Vote</h2>
                    <p className="text-slate-500 dark:text-slate-400">Please review your selection carefully.</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 mb-8 text-center border border-slate-100 dark:border-slate-700/50">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Warning</p>
                    <p className="text-slate-900 dark:text-white font-medium">Once cast, your vote cannot be changed.</p>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex-1 btn-secondary"
                    >
                        Go Back
                    </button>
                    <button
                        onClick={() => navigate('/voter/success')}
                        className="flex-1 btn-primary"
                    >
                        Cast Final Vote
                    </button>
                </div>
            </div>
        </div>
    );
};

export const VoteSuccess: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-lg w-full card p-10 text-center animate-scale-in">
                <div className="size-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-8 text-green-600 dark:text-green-400">
                    <span className="material-symbols-outlined text-5xl">check_circle</span>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Vote Cast Successfully</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8 text-lg">
                    Your ballot has been securely submitted and recorded on the blockchain.
                </p>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 text-left space-y-3 mb-8 border border-slate-100 dark:border-slate-700/50">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400 text-sm">Transaction ID</span>
                        <span className="font-mono text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-slate-700 dark:text-slate-300">
                            0x7f...3a2b
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400 text-sm">Timestamp</span>
                        <span className="font-medium text-slate-900 dark:text-white text-sm">{new Date().toLocaleString()}</span>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/voter/dashboard')}
                    className="w-full btn-primary"
                >
                    Return to Dashboard
                </button>
            </div>
        </div>
    );
};

export const VotingHistory: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Voting History</h1>
                    <p className="text-slate-500 dark:text-slate-400">Your secure voting record.</p>
                </div>
            </div>

            <div className="card p-16 text-center">
                <div className="size-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                    <span className="material-symbols-outlined text-5xl">visibility_off</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Ballot Secrecy Active</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
                    To ensure the integrity and anonymity of the election process, individual voting choices are not retrievable after submission.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-medium">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    Cryptographically Secured
                </div>
            </div>
        </div>
    );
};