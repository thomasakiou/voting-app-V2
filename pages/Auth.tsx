import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, votingTimeAPI, portalLocksAPI, VotingTimeOut, APIError } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { getDeviceId } from '../utils/device';

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof APIError) {
    const detail = err.data?.detail;
    if (typeof detail === 'string') return detail;
    if (typeof err.data?.message === 'string') return err.data.message;
  }
  return fallback;
};

const AuthError: React.FC<{ error: string }> = ({ error }) => {
  const isDeviceMismatch = error.toLowerCase().includes('device mismatch');
  const isSessionConflict =
    error.toLowerCase().includes('already running on another device') ||
    error.toLowerCase().includes('active administrator session');

  return (
    <div className={`p-4 rounded-2xl border flex items-start gap-3 animate-scale-in ${
      isSessionConflict || isDeviceMismatch
        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
    }`}>
      <span className="material-symbols-outlined mt-0.5">
        {isSessionConflict ? 'devices' : isDeviceMismatch ? 'phonelink_lock' : 'error'}
      </span>
      <div className="text-sm font-medium leading-relaxed">
        <p className="font-semibold">
          {isSessionConflict
            ? 'Single Active Session Enforced'
            : isDeviceMismatch
            ? 'Device Security Lock'
            : 'Authentication Error'}
        </p>
        <p className="mt-0.5">{error}</p>
        {isSessionConflict && (
          <p className="mt-2 text-xs opacity-90">
            For security, this administrator account is currently active on another device. The existing session has priority and cannot be interrupted. Please log out from that device to access the admin portal here.
          </p>
        )}
        {isDeviceMismatch && (
          <p className="mt-2 text-xs opacity-90">
            For security, voting is strictly restricted to the physical device and browser used during your accreditation. If your device was damaged or replaced, an administrator can reverse your accreditation to let you re-register a new device.
          </p>
        )}
      </div>
    </div>
  );
};

const LegalLinks: React.FC = () => (
  <p className="text-center text-sm text-slate-500 dark:text-slate-400">
    By signing in, you agree to our{' '}
    <Link to="/terms" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">Terms of Service</Link>
    {' '}and{' '}
    <Link to="/privacy" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">Privacy Policy</Link>.
  </p>
);

// Portal navigation links shown at the bottom of login pages
// showAdmin=true only on the admin login page (never on voter pages)
interface PortalNavProps {
  exclude?: 'election' | 'accreditation' | 'contact' | 'admin';
  showAdmin?: boolean;
}
const PortalNav: React.FC<PortalNavProps> = ({ exclude, showAdmin = false }) => {
  const links = [
    { to: '/election',      label: 'Election Portal',         icon: 'how_to_vote',      show: exclude !== 'election' },
    { to: '/accreditation', label: 'Accreditation Portal',    icon: 'how_to_reg',       show: exclude !== 'accreditation' },
    { to: '/contact-update',label: 'Contact Update Portal',   icon: 'manage_accounts',  show: exclude !== 'contact' },
    { to: '/admin/login',   label: 'Admin Portal',            icon: 'admin_panel_settings', show: showAdmin },
  ].filter(l => l.show);

  if (links.length === 0) return null;

  return (
    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
      <p className="text-center text-xs text-slate-400 dark:text-slate-500 mb-2">Other portals</p>
      <div className="flex flex-wrap justify-center gap-2">
        {links.map(l => (
          <Link
            key={l.to}
            to={l.to}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                       bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-900/30
                       text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400
                       border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700
                       transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

const AuthField: React.FC<{ id: string; name: string; label: string; icon: string; type: string; placeholder: string; value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ id, name, label, icon, type, placeholder, value, onChange }) => (
  <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
        <span className="material-symbols-outlined text-slate-400 group-focus-within:text-indigo-500 transition-colors text-[24px]">{icon}</span>
      </div>
      <input
        id={id}
        name={name}
        type={type}
        required
        value={value}
        onChange={onChange}
        className="input-field pl-14 py-3.5 font-medium text-lg bg-slate-50/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20"
        placeholder={placeholder}
      />
    </div>
  </div>
);

const AuthShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen flex">
    <div className="hidden lg:flex lg:w-1/2 relative bg-[#0B1120] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-violet-600/20 z-0"></div>
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-violet-500/20 rounded-full blur-3xl"></div>
      <div className="relative z-10 flex flex-col justify-center px-16 text-white">
        <div className="mb-8 flex items-center gap-3">
          <div className="size-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
            <span className="material-symbols-outlined text-4xl">how_to_vote</span>
          </div>
          <span className="text-3xl font-bold tracking-tight">NECO MCS</span>
        </div>
        <h1 className="text-5xl font-bold leading-tight mb-6">
          The Future of <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Electronic Voting</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-lg leading-relaxed">
          Experience an authenticated, transparent, and cryptographically secure voting system designed for the NECO MCS Election.
        </p>
        <div className="mt-12 flex gap-4">
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <span className="material-symbols-outlined text-green-400">verified</span>
            <span className="text-sm font-medium text-slate-300">OTP Verified</span>
          </div>
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <span className="material-symbols-outlined text-blue-400">shield</span>
            <span className="text-sm font-medium text-slate-300">Cryptographic Receipts</span>
          </div>
        </div>
      </div>
    </div>
    <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50 dark:bg-[#0B1120]">
      <div className="w-full max-w-md space-y-8 animate-slide-up">
        <div className="lg:hidden flex items-center gap-3 mb-6">
          <div className="size-12 rounded-xl bg-indigo-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-2xl">how_to_vote</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">NECO MCS Voting</h2>
        </div>
        {children}
      </div>
    </div>
  </div>
);

// ============================================================
// ELECTION DAY LOGIN (/election and /login)
// ============================================================
export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [votingStatus, setVotingStatus] = useState<VotingTimeOut | null>(null);
  const [isElectionPortalLocked, setIsElectionPortalLocked] = useState(false);
  const [electionLockMessage, setElectionLockMessage] = useState('');
  const [error, setError] = useState('');

  // Check election status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setCheckingStatus(true);
      const [status, locks] = await Promise.all([
        votingTimeAPI.getStatus().catch(() => null),
        portalLocksAPI.getStatus().catch(() => null),
      ]);
      if (status) setVotingStatus(status);
      if (locks?.election?.is_locked) {
        setIsElectionPortalLocked(true);
        setElectionLockMessage(
          locks.election.message ||
            'The Election portal is currently closed by the election administrator.'
        );
      } else {
        setIsElectionPortalLocked(false);
      }
    } catch (err) {
      console.error('Failed to check voting status:', err);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleValidateVoter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your 4-digit MCS number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await authAPI.login(username.trim(), undefined, getDeviceId());
      sessionStorage.setItem('otp_username', username.trim());
      const contactMask = [data.masked_email, data.masked_phone].filter(Boolean).join(' and ') || data.masked_email || '';
      sessionStorage.setItem('otp_email_mask', contactMask);
      navigate('/verify-otp');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to initiate election login. Please ensure you are accredited and voting is active.'));
    } finally {
      setLoading(false);
    }
  };

  const isVotingOpen = votingStatus?.is_active && votingStatus.status === 'ACTIVE';

  return (
    <AuthShell>
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-3">
          <span className="material-symbols-outlined text-[16px]">how_to_vote</span>
          NECO MCS Election Day Portal
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Cast Your Vote</h2>
        <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
          Enter your 4-digit MCS number to receive your one-time voting passcode.
        </p>
      </div>

      {error && <AuthError error={error} />}

      {/* PORTAL LOCKED ALERT BANNER */}
      {isElectionPortalLocked && (
        <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/40 border-2 border-red-400 dark:border-red-800 space-y-2 shadow-md animate-scale-in">
          <div className="flex items-center gap-3 text-red-700 dark:text-red-300 font-bold text-lg">
            <span className="material-symbols-outlined text-2xl">lock</span>
            Election Portal Currently Closed
          </div>
          <p className="text-sm text-red-800 dark:text-red-200 leading-relaxed">
            {electionLockMessage || 'The Election portal is currently closed by the election administrator. Voting and ballot access are temporarily disabled.'}
          </p>
        </div>
      )}

      {/* LOCKED STATUS BANNER */}
      {!checkingStatus && !isVotingOpen && !isElectionPortalLocked && (
        <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 space-y-3">
          <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400 font-bold text-lg">
            <span className="material-symbols-outlined text-2xl">lock</span>
            Voting is Currently Locked
          </div>
          <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
            The election portal is locked until election officials open the voting session on election day. Please check back when voting commences.
          </p>
          <div className="pt-2">
            <button
              onClick={checkStatus}
              className="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-800/40 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Refresh Status
            </button>
          </div>
        </div>
      )}

      {/* ELECTION VALIDATE FORM */}
      <form onSubmit={handleValidateVoter} className="space-y-6">
        <AuthField
          id="username"
          name="username"
          label="MCS Number (Username)"
          icon="badge"
          type="text"
          placeholder="e.g. 2668"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading || !username.trim() || (!checkingStatus && !isVotingOpen) || isElectionPortalLocked}
          className="w-full btn-primary flex items-center justify-center gap-2 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              Validate & Send Voting OTP
              <span className="material-symbols-outlined text-2xl">arrow_forward</span>
            </>
          )}
        </button>
      </form>

      <LegalLinks />
      <PortalNav exclude="election" />
    </AuthShell>
  );
};

// ============================================================
// ADMIN LOGIN (No OTP required, username + password)
// ============================================================
export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, adminLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [sessionMessage, setSessionMessage] = useState('');

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'admin' || user?.role === 'super-admin')) {
      navigate('/admin/dashboard', { replace: true });
    }
    checkActiveSession();
  }, [isAuthenticated, user, navigate]);

  const checkActiveSession = async () => {
    try {
      const res = await authAPI.getAdminSessionStatus();
      if (res?.has_active_session) {
        setHasActiveSession(true);
        setSessionMessage(
          res.message ||
            'Another admin session is currently logged in. You cannot log in until that session logs out.'
        );
      } else {
        setHasActiveSession(false);
      }
    } catch {
      // Ignore network errors on passive check
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const form = e.currentTarget;
    const username = (form.elements.namedItem('username') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    try {
      await adminLogin(username, password);
      navigate('/admin/dashboard', { replace: true });
    } catch (err: any) {
      const msg = getErrorMessage(err, 'Invalid administrator credentials.');
      setError(msg);

      // Check if rejection was due to another active admin session
      const isSessionConflict =
        msg.toLowerCase().includes('another admin') ||
        msg.toLowerCase().includes('already logged in') ||
        msg.toLowerCase().includes('already running on another') ||
        msg.toLowerCase().includes('another device');

      if (isSessionConflict) {
        setHasActiveSession(true);
        // Alert the user as requested so they are unmistakably notified
        alert(
          'ACCESS DENIED: Another administrator session is currently logged in to this portal.\n\n' +
          'Only one admin can be logged in at a time. You cannot log in until the active administrator logs out.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 text-xs font-semibold mb-3">
          <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
          Election Administration
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Sign In</h2>
        <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
          Enter your administrative credentials to manage election parameters.
        </p>
      </div>

      {/* ACTIVE SESSION WARNING BANNER */}
      {hasActiveSession && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-700 space-y-1.5 shadow-md animate-scale-in">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-base">
            <span className="material-symbols-outlined text-2xl text-amber-600 dark:text-amber-400">
              admin_panel_settings
            </span>
            <span>Another Admin Session Is Currently Logged In</span>
          </div>
          <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
            {sessionMessage ||
              'An administrator is currently active on the portal. Only one administrator can be logged in at a time. You cannot log in until that session logs out.'}
          </p>
        </div>
      )}

      {error && <AuthError error={error} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <AuthField id="admin-username" name="username" label="Username" icon="person" type="text" placeholder="admin" />
        <div className="space-y-2">
          <label htmlFor="admin-password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Password</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-slate-400 group-focus-within:text-indigo-500 text-[24px]">lock</span>
            </div>
            <input
              id="admin-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              className="input-field pl-14 pr-14 py-3.5 font-medium text-lg bg-slate-50/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <span className="material-symbols-outlined text-[24px]">{showPassword ? 'visibility' : 'visibility_off'}</span>
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary flex items-center justify-center gap-2 group text-lg font-bold"
        >
          {loading ? (
            <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              Sign In to Admin Portal
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-2xl">arrow_forward</span>
            </>
          )}
        </button>
      </form>

      <LegalLinks />
      <PortalNav showAdmin={false} />
    </AuthShell>
  );
};

// ============================================================
// VERIFY VOTING OTP
// ============================================================
export const VerifyOTP: React.FC = () => {
  const navigate = useNavigate();
  const { verifyOTP, isAuthenticated } = useAuth();
  const username = sessionStorage.getItem('otp_username');
  const maskedEmail = sessionStorage.getItem('otp_email_mask');
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendSeconds, setResendSeconds] = useState(60);

  useEffect(() => {
    if (!isAuthenticated && !username) {
      navigate('/election', { replace: true });
    }
  }, [isAuthenticated, navigate, username]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setResendSeconds((seconds) => {
        if (seconds <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const updateDigit = (index: number, digit: string) => {
    const nextDigits = [...otpDigits];
    nextDigits[index] = digit;
    setOtpDigits(nextDigits);

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    updateDigit(index, digit);
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!digits) return;
    event.preventDefault();
    setOtpDigits(Array.from({ length: 6 }, (_, index) => digits[index] || ''));
    otpRefs.current[Math.min(digits.length, 6) - 1]?.focus();
  };

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username) return;
    setLoading(true);
    setError('');
    try {
      await verifyOTP(username, otpDigits.join(''), getDeviceId());
      sessionStorage.removeItem('otp_username');
      sessionStorage.removeItem('otp_email_mask');
      navigate('/voter/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'OTP verification failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!username || resendSeconds > 0) return;
    setResending(true);
    setError('');
    setSuccess('');
    try {
      await authAPI.login(username, undefined, getDeviceId());
      setOtpDigits(Array(6).fill(''));
      setResendSeconds(60);
      setSuccess('A fresh voting OTP has been dispatched to your email.');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to resend voting OTP. Please try again.'));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell>
      <div className="text-center">
        <div className="size-16 mx-auto mb-5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-indigo-600 dark:text-indigo-400">mark_email_read</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Verify Voting OTP</h2>
        <p className="mt-3 text-base sm:text-lg leading-relaxed text-slate-500 dark:text-slate-400">
          A 6-digit voting passcode was dispatched to your registered contact {maskedEmail ? `(${maskedEmail})` : ''}.
        </p>
      </div>

      {error && <AuthError error={error} />}
      {success && (
        <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-3 text-green-700 dark:text-green-400 animate-scale-in">
          <span className="material-symbols-outlined">check_circle</span>
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-6">
        <div className="space-y-3">
          <label htmlFor="otp-0" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 text-center">
            Enter 6-Digit Passcode
          </label>
          <div
            className="grid grid-cols-6 gap-2 sm:gap-3 max-w-md mx-auto"
            onPaste={handleOtpPaste}
            role="group"
            aria-label="6-digit OTP code"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <input
                key={index}
                ref={(element) => { otpRefs.current[index] = element; }}
                id={`otp-${index}`}
                name={`otp-${index}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                required
                autoFocus={index === 0}
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                value={otpDigits[index]}
                onChange={(event) => handleOtpChange(index, event.target.value)}
                onKeyDown={(event) => handleOtpKeyDown(index, event)}
                onFocus={(event) => event.currentTarget.select()}
                className="w-full aspect-square min-w-0 rounded-xl sm:rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80 text-slate-900 dark:text-white text-center text-xl sm:text-2xl font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                aria-label={`OTP digit ${index + 1}`}
              />
            ))}
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || otpDigits.join('').length !== 6}
          className="w-full btn-primary flex items-center justify-center gap-2 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              Verify & Enter Ballot
              <span className="material-symbols-outlined text-2xl">arrow_forward</span>
            </>
          )}
        </button>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || resendSeconds > 0}
          className="min-h-10 px-4 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          {resending ? 'Sending...' : resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : 'Resend OTP'}
        </button>
      </div>

      <div className="text-center">
        <Link to="/election" className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          Change MCS Username
        </Link>
      </div>

      <LegalLinks />
    </AuthShell>
  );
};
