import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    officesAPI,
    candidatesAPI,
    votesAPI,
    votingTimeAPI,
    OfficeResponse,
    CandidateResponse,
    VotingTimeOut,
    MyVoteResponse,
    MyStatsResponse,
} from '../api';
import { LoadingSpinner, ErrorAlert, TablePagination, usePagination } from '../components/UIComponents';

export const VoterDashboard: React.FC = () => {
    const { user } = useAuth();
    const [offices, setOffices] = useState<OfficeResponse[]>([]);
    const [myVotes, setMyVotes] = useState<MyVoteResponse[]>([]);
    const [stats, setStats] = useState<MyStatsResponse | null>(null);
    const [votingStatus, setVotingStatus] = useState<VotingTimeOut | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [officesData, timeStatus, myVotesData, myStatsData] = await Promise.all([
                officesAPI.getAll().catch(() => []),
                votingTimeAPI.getStatus().catch(() => ({ is_active: false, status: 'NOT_STARTED' } as VotingTimeOut)),
                votesAPI.getMyVotes().catch(() => []),
                votesAPI.getMyStats().catch(() => null),
            ]);

            setOffices(officesData);
            setVotingStatus(timeStatus);
            setMyVotes(myVotesData);
            setStats(myStatsData);
        } catch (err) {
            console.error('Failed to load voter dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    const isVotingActive = votingStatus?.is_active && votingStatus?.status === 'ACTIVE';
    const totalOffices = offices.length;
    const votedCount = myVotes.length;
    const allVoted = totalOffices > 0 && votedCount >= totalOffices;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 md:p-8 text-white shadow-xl shadow-indigo-500/20">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 size-64 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 size-64 rounded-full bg-black/10 blur-3xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold mb-3">
                            <span className="material-symbols-outlined text-sm">verified</span>
                            Accredited Voter | MCS #{user?.username}
                        </div>
                        <h1 className="text-2xl md:text-4xl font-extrabold mb-2 tracking-tight">
                            Welcome, {user?.full_name || user?.username}
                        </h1>
                        <p className="text-indigo-100 text-sm md:text-base max-w-xl leading-relaxed">
                            {isVotingActive
                                ? allVoted
                                    ? "You have completed voting in all contests on your ballot. View your cryptographic vote receipts below."
                                    : "The NECO MCS Election is currently live. Cast your secure digital vote for each office."
                                : "Voting is currently closed. You can review your voting statistics and verification receipts below."}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        {isVotingActive && !allVoted ? (
                            <Link
                                to="/voter/ballot"
                                className="w-full sm:w-auto px-8 py-4 bg-white text-indigo-600 font-extrabold rounded-2xl shadow-lg hover:shadow-xl hover:bg-indigo-50 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-base"
                            >
                                <span className="material-symbols-outlined text-xl">how_to_vote</span>
                                Proceed to Ballot
                            </Link>
                        ) : (
                            <Link
                                to="/voter/history"
                                className="w-full sm:w-auto px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl border border-white/20 flex items-center justify-center gap-2 transition-all text-sm md:text-base"
                            >
                                <span className="material-symbols-outlined text-xl">receipt_long</span>
                                View My Voting Stats
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Voting Progress & Status Cards */}
            <div className="grid md:grid-cols-3 gap-6">
                {/* Voting Progress Card */}
                <div className="md:col-span-2 card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Ballot Progress</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {votedCount} of {totalOffices} offices voted
                            </p>
                        </div>

                        {allVoted ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1.5 border border-green-200 dark:border-green-800">
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                Ballot Complete
                            </span>
                        ) : isVotingActive ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                In Progress
                            </span>
                        ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                Polls Closed
                            </span>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-indigo-500 to-violet-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${totalOffices > 0 ? (votedCount / totalOffices) * 100 : 0}%` }}
                        ></div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                            <span className="text-xs text-slate-400">Total Offices</span>
                            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{totalOffices}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
                            <span className="text-xs text-emerald-600 dark:text-emerald-400">Cast Votes</span>
                            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{votedCount}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                            <span className="text-xs text-slate-400">Remaining</span>
                            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                                {Math.max(0, totalOffices - votedCount)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Eligibility Verification Card */}
                <div className="card p-6 flex flex-col justify-center items-center text-center bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
                    <div className="size-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/10">
                        <span className="material-symbols-outlined text-3xl">verified_user</span>
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">Accredited Voter</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                        Your identity has been confirmed for the NECO MCS election. Your ballot is strictly anonymous and encrypted.
                    </p>
                </div>
            </div>

            {/* My Cast Votes & Cryptographic Receipts */}
            <div className="card p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Your Cast Votes & Receipts</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Verified voting confirmations for your records.
                        </p>
                    </div>
                    <Link
                        to="/voter/history"
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                        View Full Details
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </Link>
                </div>

                {myVotes.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 border border-dashed rounded-2xl border-slate-200 dark:border-slate-700">
                        <p className="mb-3">You have not cast any votes yet.</p>
                        {isVotingActive && (
                            <Link to="/voter/ballot" className="btn-primary inline-flex items-center gap-2 text-sm font-semibold">
                                Cast Your First Vote
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {myVotes.map((vote) => (
                            <div
                                key={vote.id}
                                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400">
                                        {vote.office_name}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                                        <span className="material-symbols-outlined text-xs">check</span>
                                        Voted
                                    </span>
                                </div>
                                <div className="text-base font-bold text-slate-900 dark:text-white">
                                    {vote.candidate_name}
                                </div>
                                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                                    <span className="text-slate-400 font-mono">Receipt:</span>
                                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                        {vote.receipt_hash || 'MCS-RECORDED'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================================
// SELECT OFFICE (BALLOT PAGE - REQUIREMENT 4)
// ============================================================
export const SelectOffice: React.FC = () => {
    const [offices, setOffices] = useState<OfficeResponse[]>([]);
    const [myVotes, setMyVotes] = useState<MyVoteResponse[]>([]);
    const [votingStatus, setVotingStatus] = useState<VotingTimeOut | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [officesData, timeStatus, myVotesData] = await Promise.all([
                officesAPI.getAll().catch(() => []),
                votingTimeAPI.getStatus().catch(() => null),
                votesAPI.getMyVotes().catch(() => []),
            ]);

            setOffices(officesData);
            setVotingStatus(timeStatus);
            setMyVotes(myVotesData);
        } catch (err) {
            console.error('Failed to load ballot offices:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    // Build voted offices lookup map
    const votedOfficesMap = new Map<string, MyVoteResponse>();
    myVotes.forEach((v) => {
        votedOfficesMap.set(v.office_code, v);
    });

    const isVotingActive = votingStatus?.is_active && votingStatus.status === 'ACTIVE';

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
                    <span className="material-symbols-outlined text-sm">ballot</span>
                    Official NECO MCS Election Ballot
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Official Election Ballot
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                    Select any contested office below to vote. Once you submit your vote for a category, it is permanently locked and you can view only your confirmation statistics.
                </p>
            </div>

            {!isVotingActive && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-sm font-medium text-center">
                    Voting is currently closed or stopped by administrator. Ballots cannot be submitted at this time.
                </div>
            )}

            <div className="grid gap-4">
                {offices.map((office) => {
                    const isVoted = votedOfficesMap.has(office.office_code);
                    const voteInfo = votedOfficesMap.get(office.office_code);
                    const isDisqualified = office.is_disqualified;

                    if (isVoted) {
                        // Already Voted Category (Requirement 4)
                        return (
                            <div
                                key={office.id}
                                className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border-2 border-emerald-300 dark:border-emerald-800/60 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <span className="material-symbols-outlined text-2xl">check_circle</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                {office.description}
                                            </h3>
                                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                                Voted
                                            </span>
                                        </div>
                                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                                            Voted for: {voteInfo?.candidate_name}
                                        </p>
                                        <p className="text-xs font-mono text-slate-400 mt-0.5">
                                            Receipt: {voteInfo?.receipt_hash || 'MCS-VERIFIED'}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <span className="text-xs font-semibold text-slate-400 italic">
                                        Category Locked
                                    </span>
                                </div>
                            </div>
                        );
                    }

                    if (isDisqualified) {
                        return (
                            <div
                                key={office.id}
                                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between opacity-60 cursor-not-allowed"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                                        <span className="material-symbols-outlined text-2xl">block</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
                                            {office.description}
                                        </h3>
                                        <p className="text-xs text-red-500 font-semibold">Contest Disqualified by Admin</p>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // Available to vote
                    return (
                        <Link
                            key={office.id}
                            to={isVotingActive ? `/voter/ballot/${office.office_code}` : '#'}
                            className={`group card p-5 flex items-center justify-between transition-all duration-200 ${
                                isVotingActive
                                    ? 'hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10'
                                    : 'opacity-50 cursor-not-allowed'
                            }`}
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="size-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-2xl">how_to_vote</span>
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors truncate">
                                        {office.description}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Click to view candidates and cast vote
                                    </p>
                                </div>
                            </div>

                            <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <span className="material-symbols-outlined text-xl">arrow_forward</span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

// ============================================================
// VOTE CANDIDATE (SELECTION FOR SPECIFIC OFFICE)
// ============================================================
export const VoteCandidate: React.FC = () => {
    const navigate = useNavigate();
    const { officeId } = useParams<{ officeId: string }>();
    const [office, setOffice] = useState<OfficeResponse | null>(null);
    const [candidates, setCandidates] = useState<CandidateResponse[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [alreadyVoted, setAlreadyVoted] = useState(false);
    const [existingVote, setExistingVote] = useState<MyVoteResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (officeId) {
            loadOfficeData();
        }
    }, [officeId]);

    const loadOfficeData = async () => {
        try {
            setLoading(true);
            const [officeData, candData, myVotes] = await Promise.all([
                officesAPI.getByCode(officeId!).catch(() => null),
                candidatesAPI.getByOfficeCode(officeId!).catch(() => []),
                votesAPI.getMyVotes().catch(() => []),
            ]);

            setOffice(officeData);
            setCandidates(candData);

            // Check if already voted
            const found = myVotes.find((v) => v.office_code === officeId);
            if (found) {
                setAlreadyVoted(true);
                setExistingVote(found);
            }
        } catch (err) {
            setError('Failed to load candidate information.');
        } finally {
            setLoading(false);
        }
    };

    const handleCastVote = async () => {
        if (!selected || !officeId) return;

        setSubmitting(true);
        setError('');

        try {
            const result = await votesAPI.cast({
                candidate_code: selected,
                office_code: officeId,
            });
            sessionStorage.setItem('last_vote_receipt', JSON.stringify(result));
            navigate('/voter/success');
        } catch (err: any) {
            setError(err?.data?.detail || 'Failed to submit vote. You may have already voted for this office.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    if (alreadyVoted) {
        return (
            <div className="max-w-md mx-auto p-8 card text-center space-y-4 my-12 animate-scale-in">
                <div className="size-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-4xl">check_circle</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Already Voted</h2>
                <p className="text-sm text-slate-500">
                    You have already cast your ballot for <b>{office?.description || officeId}</b>.
                </p>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-600 dark:text-slate-300">
                    Candidate: {existingVote?.candidate_name}<br />
                    Receipt: {existingVote?.receipt_hash || 'MCS-VERIFIED'}
                </div>
                <Link to="/voter/ballot" className="btn-primary w-full inline-block text-center font-bold">
                    Return to Ballot
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <Link
                        to="/voter/ballot"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-2 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Back to Ballot
                    </Link>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {office?.description || 'Contest'}
                    </h1>
                    <p className="text-sm text-slate-500">Select one candidate to cast your vote.</p>
                </div>
            </div>

            {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

            {/* Candidates Selection Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
                {candidates.map((cand) => {
                    const isDisqualified = cand.is_disqualified;
                    const isSelected = selected === cand.candidate_code;

                    if (isDisqualified) {
                        return (
                            <div
                                key={cand.id}
                                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed"
                            >
                                <span className="text-xs font-bold text-red-500 uppercase">Disqualified</span>
                                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">{cand.name}</h3>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={cand.id}
                            onClick={() => setSelected(cand.candidate_code)}
                            className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                                isSelected
                                    ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/30 shadow-lg shadow-indigo-500/10'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="text-xs font-mono font-semibold text-slate-400">
                                        #{cand.candidate_code}
                                    </span>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                                        {cand.name}
                                    </h3>
                                </div>
                                <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                    isSelected
                                        ? 'border-indigo-600 bg-indigo-600 text-white'
                                        : 'border-slate-300 dark:border-slate-600'
                                }`}>
                                    {isSelected && <span className="material-symbols-outlined text-sm font-bold">check</span>}
                                </div>
                            </div>

                            <p className="text-xs text-slate-400 mt-4">
                                Tap to select this candidate for {office?.description}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Submit Action */}
            <div className="pt-4 flex justify-end">
                <button
                    onClick={handleCastVote}
                    disabled={!selected || submitting}
                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-lg rounded-2xl shadow-xl shadow-indigo-500/20 flex items-center gap-2 transition-all"
                >
                    {submitting ? (
                        <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <>
                            Cast Vote for Selected Candidate
                            <span className="material-symbols-outlined text-2xl">how_to_vote</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

// ============================================================
// CONFIRM VOTE PLACEHOLDER / SUCCESS PAGE
// ============================================================
export const ConfirmVote: React.FC = () => {
    return <VoteCandidate />;
};

export const VoteSuccess: React.FC = () => {
    const rawReceipt = sessionStorage.getItem('last_vote_receipt');
    const receipt = rawReceipt ? JSON.parse(rawReceipt) : null;

    return (
        <div className="max-w-md mx-auto p-8 card text-center space-y-6 my-12 animate-scale-in">
            <div className="size-20 rounded-3xl bg-green-500/10 border-2 border-green-500 flex items-center justify-center mx-auto text-green-500 shadow-xl shadow-green-500/10">
                <span className="material-symbols-outlined text-5xl">verified</span>
            </div>

            <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Vote Successfully Cast!</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Your ballot has been cryptographically signed and permanently counted.
                </p>
            </div>

            {receipt && (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left space-y-3">
                    <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-700/60 pb-2">
                        <span className="text-slate-500">Contest</span>
                        <span className="font-bold text-slate-900 dark:text-white">{receipt.office_name}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-700/60 pb-2">
                        <span className="text-slate-500">Candidate Selected</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{receipt.candidate_name}</span>
                    </div>
                    <div className="space-y-1 pt-1">
                        <span className="text-xs text-slate-400 font-mono block">Cryptographic Verification Hash:</span>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 font-mono text-xs text-slate-700 dark:text-slate-300 break-all select-all border border-slate-200 dark:border-slate-800 font-bold">
                            {receipt.receipt_hash}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
                <Link to="/voter/ballot" className="btn-primary font-bold py-3 text-center">
                    Vote in Other Contests
                </Link>
                <Link to="/voter/dashboard" className="btn-secondary font-bold py-3 text-center">
                    Go to My Voter Dashboard
                </Link>
            </div>
        </div>
    );
};

// ============================================================
// VOTING HISTORY & STATS (REQUIREMENT 4)
// ============================================================
export const VotingHistory: React.FC = () => {
    const { user } = useAuth();
    const [votes, setVotes] = useState<MyVoteResponse[]>([]);
    const [loading, setLoading] = useState(true);

    const {
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        totalPages,
        totalItems,
        paginatedItems: paginatedVotes,
    } = usePagination(votes, 10);

    useEffect(() => {
        loadVotes();
    }, []);

    const loadVotes = async () => {
        try {
            setLoading(true);
            const data = await votesAPI.getMyVotes();
            setVotes(data);
        } catch (err) {
            console.error('Failed to load my votes:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    My Voting History & Statistics
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Your personal audit trail of cast ballots and cryptographic verification hashes for MCS #{user?.username}.
                </p>
            </div>

            {votes.length === 0 ? (
                <div className="p-10 text-center card text-slate-400 space-y-4">
                    <span className="material-symbols-outlined text-5xl text-slate-300">history</span>
                    <p>You have not cast any votes yet.</p>
                    <Link to="/voter/ballot" className="btn-primary inline-flex items-center gap-2">
                        Go to Ballot
                    </Link>
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-3.5">Office</th>
                                    <th className="px-6 py-3.5">Candidate Voted</th>
                                    <th className="px-6 py-3.5">Receipt Hash</th>
                                    <th className="px-6 py-3.5">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {paginatedVotes.map((v) => (
                                    <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{v.office_name}</td>
                                        <td className="px-6 py-4 font-semibold text-indigo-600 dark:text-indigo-400">{v.candidate_name}</td>
                                        <td className="px-6 py-4 font-mono text-xs">
                                            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-300">
                                                {v.receipt_hash || 'MCS-VERIFIED'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500">
                                            {new Date(v.created_at).toLocaleString()}
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
                        pageSizeOptions={[5, 10, 25]}
                        itemName="votes"
                    />
                </div>
            )}
        </div>
    );
};
