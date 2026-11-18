import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { accreditationAPI, AccreditationStatusCheckResponse, APIError } from '../api';

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof APIError) {
    const detail = err.data?.detail;
    if (typeof detail === 'string') return detail;
    if (typeof err.data?.message === 'string') return err.data.message;
  }
  return fallback;
};

interface RecentQuery {
  username: string;
  fullName: string;
  isAccredited: boolean;
  statusLabel: string;
}

export const AccreditationStatusCheck: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialUsername = searchParams.get('username') || searchParams.get('mcs') || '';

  const [username, setUsername] = useState(initialUsername);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AccreditationStatusCheckResponse | null>(null);
  const [recentChecks, setRecentChecks] = useState<RecentQuery[]>([]);

  // Automatically check if username provided in URL query string
  useEffect(() => {
    if (initialUsername.trim()) {
      handleCheck(initialUsername.trim());
    }
  }, []);

  const handleCheck = async (targetUsername: string) => {
    const cleanUsername = targetUsername.trim();
    if (!cleanUsername) {
      setError('Please enter an MCS number to check accreditation status.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await accreditationAPI.checkStatus(cleanUsername);
      setResult(data);

      // Keep recent searches updated
      setRecentChecks((prev) => {
        const filtered = prev.filter((item) => item.username.toLowerCase() !== data.username.toLowerCase());
        return [
          {
            username: data.username,
            fullName: data.full_name,
            isAccredited: data.is_accredited,
            statusLabel: data.status_label,
          },
          ...filtered,
        ].slice(0, 5);
      });

      // Update query param without full page reload
      setSearchParams({ username: data.username }, { replace: true });
    } catch (err) {
      const msg = getErrorMessage(
        err,
        `Voter with MCS number '${cleanUsername}' was not found in the voters register. Please verify the number.`
      );
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCheck(username);
  };

  const handleClear = () => {
    setUsername('');
    setResult(null);
    setError('');
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B1120] text-slate-800 dark:text-slate-100 transition-colors">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/election" className="flex items-center gap-3 group">
            <div className="size-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[22px]">how_to_reg</span>
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                NECO MCS Elections
                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  Open Checker
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Accreditation Verification Portal</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/accreditation"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                         bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60
                         text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">fingerprint</span>
              <span className="hidden sm:inline">Accredit Now</span>
            </Link>
            <Link
              to="/election"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                         bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700
                         text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">how_to_vote</span>
              <span>Vote</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-4 shadow-sm">
            <span className="material-symbols-outlined text-[15px]">verified_user</span>
            Open Public Verification • No Login Required
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Check Voter Accreditation Status
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Verify whether a voter has been accredited for the NECO MCS Election. Enter the 4-digit MCS number below to view instant real-time verification details.
          </p>
        </div>

        {/* Search Card */}
        <div className="w-full max-w-xl bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/40 p-6 sm:p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="mcs-input" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Voter MCS Number
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-slate-400 dark:text-slate-500 text-[20px] pointer-events-none">
                  badge
                </span>
                <input
                  id="mcs-input"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="e.g. 0317, 1072, 2714-2..."
                  autoFocus
                  disabled={loading}
                  className="w-full pl-11 pr-10 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 
                             bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400
                             text-base font-medium tracking-wide focus:outline-none focus:ring-2 focus:ring-indigo-500 
                             focus:border-transparent transition-all shadow-sm"
                />
                {username && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    title="Clear input"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">info</span>
                Enter the assigned 4-digit cooperative number (case-insensitive).
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-white
                         bg-gradient-to-r from-indigo-600 via-indigo-700 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700
                         disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 active:scale-[0.99] transition-all"
            >
              {loading ? (
                <>
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Checking Register...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[19px]">search</span>
                  <span>Check Accreditation Status</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Recent Checks */}
          {recentChecks.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Recent Searches:
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                {recentChecks.map((item) => (
                  <button
                    key={item.username}
                    type="button"
                    onClick={() => {
                      setUsername(item.username);
                      handleCheck(item.username);
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                      item.isAccredited
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px]">
                      {item.isAccredited ? 'check_circle' : 'hourglass_top'}
                    </span>
                    <span>{item.username}</span>
                    <span className="opacity-75 font-normal">({item.fullName.split(' ')[0]})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error Notice */}
        {error && (
          <div className="w-full max-w-xl mt-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-3 shadow-md animate-scale-in">
            <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-2xl shrink-0 mt-0.5">
              cancel
            </span>
            <div>
              <h3 className="font-bold text-red-900 dark:text-red-200 text-sm">Voter Not Found</h3>
              <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 mt-0.5 leading-relaxed">{error}</p>
              <div className="mt-3 flex items-center gap-3">
                <Link
                  to="/contact-update"
                  className="text-xs font-semibold text-red-800 dark:text-red-200 underline hover:no-underline"
                >
                  Contact Update Portal &rarr;
                </Link>
                <Link
                  to="/accreditation"
                  className="text-xs font-semibold text-red-800 dark:text-red-200 underline hover:no-underline"
                >
                  Accreditation Portal &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="w-full max-w-xl mt-6 space-y-4 animate-scale-in">
            {/* Status Card Banner */}
            <div
              className={`p-6 rounded-2xl border-2 shadow-lg backdrop-blur-sm ${
                !result.is_active
                  ? 'bg-red-50 dark:bg-red-950/40 border-red-400 dark:border-red-800'
                  : result.is_accredited
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-700/80'
                  : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-400 dark:border-amber-700/80'
              }`}
            >
              {/* Badge & Icon */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`size-12 rounded-xl flex items-center justify-center text-white shadow-md ${
                      !result.is_active
                        ? 'bg-red-600'
                        : result.is_accredited
                        ? 'bg-emerald-600'
                        : 'bg-amber-600'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[28px]">
                      {!result.is_active
                        ? 'block'
                        : result.is_accredited
                        ? 'verified'
                        : 'pending_actions'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-slate-400">
                      Official Status
                    </span>
                    <h2
                      className={`text-xl sm:text-2xl font-black tracking-tight ${
                        !result.is_active
                          ? 'text-red-700 dark:text-red-400'
                          : result.is_accredited
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {result.status_label}
                    </h2>
                  </div>
                </div>

                {/* Pulse indicator */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shrink-0">
                  <span
                    className={`size-2.5 rounded-full ${
                      !result.is_active
                        ? 'bg-red-500'
                        : result.is_accredited
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-amber-500'
                    }`}
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-mono">
                    {result.username}
                  </span>
                </div>
              </div>

              {/* Status Message */}
              <p
                className={`mt-4 text-sm font-medium leading-relaxed ${
                  !result.is_active
                    ? 'text-red-800 dark:text-red-200'
                    : result.is_accredited
                    ? 'text-emerald-900 dark:text-emerald-200'
                    : 'text-amber-900 dark:text-amber-200'
                }`}
              >
                {result.message}
              </p>

              {/* Date of Accreditation */}
              {result.is_accredited && result.accredited_at && (
                <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-900/40 px-3 py-1.5 rounded-lg w-fit">
                  <span className="material-symbols-outlined text-[15px]">event_available</span>
                  <span>
                    Accredited on:{' '}
                    {new Date(result.accredited_at).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Voter Details Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">person</span>
                Voter Register Record
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase">Full Name</span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block truncate">
                    {result.full_name}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase">MCS Number</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                    {result.username}
                  </span>
                </div>

                {result.staff_file_no && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="block text-[11px] font-semibold text-slate-400 uppercase">Staff File No</span>
                    <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                      {result.staff_file_no}
                    </span>
                  </div>
                )}

                {result.staff_station && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="block text-[11px] font-semibold text-slate-400 uppercase">Station / Office</span>
                    <span className="font-bold text-slate-900 dark:text-white mt-0.5 block truncate">
                      {result.staff_station}
                    </span>
                  </div>
                )}

                {result.staff_rank && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 sm:col-span-2">
                    <span className="block text-[11px] font-semibold text-slate-400 uppercase">Rank / Designation</span>
                    <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                      {result.staff_rank}
                    </span>
                  </div>
                )}

                {(result.masked_phone || result.masked_email) && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 sm:col-span-2 flex flex-wrap gap-4">
                    {result.masked_email && (
                      <div>
                        <span className="block text-[11px] font-semibold text-slate-400 uppercase">Masked Email</span>
                        <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                          {result.masked_email}
                        </span>
                      </div>
                    )}
                    {result.masked_phone && (
                      <div>
                        <span className="block text-[11px] font-semibold text-slate-400 uppercase">Masked Phone</span>
                        <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                          {result.masked_phone}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons depending on status */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
                {result.is_accredited ? (
                  <Link
                    to="/election"
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white
                               bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all text-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">how_to_vote</span>
                    <span>Proceed to Cast Vote</span>
                  </Link>
                ) : (
                  <Link
                    to={`/accreditation`}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white
                               bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all text-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">fingerprint</span>
                    <span>Accredit This Voter Now</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-3 rounded-xl font-bold text-slate-700 dark:text-slate-200
                             bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700
                             border border-slate-200 dark:border-slate-700 transition-all text-sm"
                >
                  Check Another Voter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Informational Guidance Box */}
        <div className="w-full max-w-xl mt-8 p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-slate-600 dark:text-slate-400 text-xs leading-relaxed space-y-2">
          <div className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5 text-sm">
            <span className="material-symbols-outlined text-[18px] text-indigo-600 dark:text-indigo-400">help</span>
            About NECO MCS Voter Accreditation
          </div>
          <p>
            • <strong>Accredited Voters</strong> have successfully verified their 4-digit MCS number and registered physical device, allowing them to participate in voting on election day.
          </p>
          <p>
            • <strong>Unaccredited Voters</strong> must visit the{' '}
            <Link to="/accreditation" className="text-indigo-600 dark:text-indigo-400 underline font-semibold">
              Accreditation Portal
            </Link>{' '}
            to complete verification before the accreditation window closes.
          </p>
          <p>
            • If your MCS number cannot be found or contact details need correction, visit the{' '}
            <Link to="/contact-update" className="text-indigo-600 dark:text-indigo-400 underline font-semibold">
              Contact Update Portal
            </Link>.
          </p>
        </div>

        {/* Portal Directory Links */}
        <div className="w-full max-w-xl mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 font-semibold uppercase tracking-wider">
            Quick Portals Navigation
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              to="/accreditation"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                         bg-white hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-900/30
                         text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400
                         border border-slate-200 dark:border-slate-700 transition"
            >
              <span className="material-symbols-outlined text-[14px]">how_to_reg</span>
              Accreditation Portal
            </Link>
            <Link
              to="/election"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                         bg-white hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-900/30
                         text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400
                         border border-slate-200 dark:border-slate-700 transition"
            >
              <span className="material-symbols-outlined text-[14px]">how_to_vote</span>
              Election Voting Portal
            </Link>
            <Link
              to="/contact-update"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                         bg-white hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-900/30
                         text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400
                         border border-slate-200 dark:border-slate-700 transition"
            >
              <span className="material-symbols-outlined text-[14px]">manage_accounts</span>
              Contact Update Portal
            </Link>
            <Link
              to="/agents/live"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                         bg-white hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-900/30
                         text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400
                         border border-slate-200 dark:border-slate-700 transition"
            >
              <span className="material-symbols-outlined text-[14px]">visibility</span>
              Agents Live View
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/60 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
        <p>&copy; {new Date().getFullYear()} NECO Multi-Purpose Cooperative Society Ltd. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link to="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400">Terms of Service</Link>
          <span>•</span>
          <Link to="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
};
