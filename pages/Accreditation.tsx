import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { accreditationAPI, portalLocksAPI, APIError } from '../api';
import { getDeviceId, getDeviceInfo } from '../utils/device';

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof APIError) {
    const detail = err.data?.detail;
    if (typeof detail === 'string') return detail;
    if (typeof err.data?.message === 'string') return err.data.message;
  }
  return fallback;
};

export const Accreditation: React.FC = () => {
  // Step 1: Validate MCS Number
  // Step 2: Confirm Details & Request OTP
  // Step 3: Enter OTP and submit
  // Step 4: Success confirmation
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isPortalLocked, setIsPortalLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState('');

  useEffect(() => {
    portalLocksAPI.getStatus().then((status) => {
      if (status.accreditation?.is_locked) {
        setIsPortalLocked(true);
        setLockMessage(
          status.accreditation.message ||
            'Voter Accreditation is currently closed by the election administration.'
        );
      }
    }).catch(() => null);
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Validate MCS username
  const handleValidateVoter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your 4-digit MCS number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await accreditationAPI.validate(username.trim());
      setFullName(data.full_name);
      setMaskedPhone(data.masked_phone || data.phone || '');
      setMaskedEmail(data.masked_email || data.email || '');
      setStep(2);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to validate MCS number. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Request OTP to pre-registered email
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await accreditationAPI.sendOTP(username.trim());
      if (res.masked_email) setMaskedEmail(res.masked_email);
      if (res.masked_phone) setMaskedPhone(res.masked_phone);
      setStep(3);
      setResendCooldown(60);
      setSuccessMessage(res.message || `A verification OTP has been sent to your registered email.`);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to send accreditation OTP. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // OTP box input handling
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    event.preventDefault();
    setOtpDigits(Array.from({ length: 6 }, (_, i) => pasted[i] || ''));
    otpRefs.current[Math.min(pasted.length, 6) - 1]?.focus();
  };

  // Step 3: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otpDigits.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await accreditationAPI.verifyOTP(username.trim(), otpCode, undefined, undefined, getDeviceId(), getDeviceInfo());
      setSuccessMessage(res.message);
      if (res.masked_email) setMaskedEmail(res.masked_email);
      if (res.masked_phone) setMaskedPhone(res.masked_phone);
      setStep(4);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Invalid or expired OTP. Please check the code and try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError('');
    try {
      const res = await accreditationAPI.sendOTP(username.trim());
      setResendCooldown(60);
      setSuccessMessage(res.message || `A fresh OTP has been sent to your registered email.`);
      setOtpDigits(Array(6).fill(''));
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to resend OTP.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Visual Side Banner */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0B1120] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-violet-600/20 z-0"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-violet-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8 flex items-center gap-3">
            <div className="size-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
              <span className="material-symbols-outlined text-4xl">verified_user</span>
            </div>
            <span className="text-3xl font-bold tracking-tight">NECO MCS</span>
          </div>

          <h1 className="text-5xl font-bold leading-tight mb-6">
            Official Voter <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
              Accreditation Portal
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-lg leading-relaxed mb-8">
            Complete your mandatory biometric & electronic voter accreditation for the NECO MCS Election in 3 simple steps.
          </p>

          <div className="space-y-4 max-w-md">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="size-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">1</div>
              <p className="text-sm font-medium text-slate-300">Validate 4-digit MCS Number</p>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="size-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">2</div>
              <p className="text-sm font-medium text-slate-300">Confirm Name & Registered Contact</p>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="size-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">3</div>
              <p className="text-sm font-medium text-slate-300">Verify OTP to Get Officially Accredited</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-slate-50 dark:bg-[#0B1120]">
        <div className="w-full max-w-lg space-y-8 animate-slide-up">
          {/* Header */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-3">
              <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
              NECO MCS Voter Accreditation
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              {step === 1 && 'Voter Verification'}
              {step === 2 && 'Confirm Your Identity'}
              {step === 3 && 'Enter Accreditation OTP'}
              {step === 4 && 'Accreditation Complete'}
            </h2>
            <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
              {step === 1 && 'Enter your 4-digit MCS number to check eligibility on the voter register.'}
              {step === 2 && 'Confirm your full name and registered contact details to receive your accreditation OTP.'}
              {step === 3 && `Enter the 6-digit OTP code dispatched to ${[maskedEmail, maskedPhone].filter(p => p && p !== 'Not provided').join(' and ') || 'your registered contact'}.`}
              {step === 4 && 'Your accreditation has been finalized and recorded in the election register.'}
            </p>
          </div>

          {/* Portal Locked Alert Banner */}
          {isPortalLocked && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border-2 border-red-400 dark:border-red-800 flex items-start gap-3 shadow-md animate-scale-in">
              <span className="material-symbols-outlined text-red-600 text-3xl shrink-0">lock</span>
              <div>
                <h3 className="font-bold text-red-900 dark:text-red-200 text-base">
                  Accreditation Currently Closed
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-0.5">
                  {lockMessage || 'Voter Accreditation is currently closed by the election administration. Device accreditation and OTP issuance are temporarily disabled.'}
                </p>
              </div>
            </div>
          )}

          {/* Notifications */}
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3 text-red-600 dark:text-red-400 animate-scale-in">
              <span className="material-symbols-outlined mt-0.5">error</span>
              <div className="text-sm font-medium leading-relaxed">
                <p>{error}</p>
                {error.toLowerCase().includes('email') && (
                  <Link
                    to="/contact-update"
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline mt-2"
                  >
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    Click here to register your email and phone number
                  </Link>
                )}
              </div>
            </div>
          )}

          {successMessage && step !== 4 && (
            <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-start gap-3 text-green-700 dark:text-green-400 animate-scale-in">
              <span className="material-symbols-outlined mt-0.5">check_circle</span>
              <p className="text-sm font-medium leading-relaxed">{successMessage}</p>
            </div>
          )}

          {/* STEP 1: VALIDATE MCS NUMBER */}
          {step === 1 && (
            <form onSubmit={handleValidateVoter} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="mcs-username" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  MCS Number (4 Digits)
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-slate-400 group-focus-within:text-indigo-500 transition-colors text-[24px]">
                      badge
                    </span>
                  </div>
                  <input
                    id="mcs-username"
                    name="username"
                    type="text"
                    required
                    maxLength={10}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-field pl-14 py-3.5 font-medium text-lg bg-slate-50/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20"
                    placeholder="e.g. 2668"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-slate-400 ml-1">Example: 2668, 4001, etc.</p>
              </div>

              <button
                type="submit"
                disabled={loading || isPortalLocked || !username.trim()}
                className="w-full btn-primary flex items-center justify-center gap-2 text-lg font-bold disabled:opacity-50"
              >
                {loading ? (
                  <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Validate Voter
                    <span className="material-symbols-outlined text-2xl">arrow_forward</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/contact-update"
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">edit_note</span>
                  Need to register or update your email / phone number? Click here
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: CONFIRM DETAILS (READ-ONLY) & REQUEST OTP */}
          {step === 2 && (
            <form onSubmit={handleSendOTP} className="space-y-6">
              {/* Confirmed Full Name */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="voter-fullname" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    Confirmed Voter Full Name
                  </label>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    Verified
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-indigo-500 text-[24px]">person</span>
                  </div>
                  <input
                    id="voter-fullname"
                    type="text"
                    disabled
                    readOnly
                    value={fullName}
                    className="w-full pl-14 pr-5 py-3.5 font-bold text-lg rounded-2xl bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-not-allowed shadow-inner"
                  />
                </div>
                <p className="text-xs text-slate-400 ml-1">This name is matched from the official NECO MCS register.</p>
              </div>

              {/* Registered Phone Number - Masked */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="voter-phone" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    Registered Phone Number
                  </label>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    Protected
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-indigo-500 text-[24px]">call</span>
                  </div>
                  <input
                    id="voter-phone"
                    type="text"
                    disabled
                    readOnly
                    value={maskedPhone || 'Not provided'}
                    className="w-full pl-14 pr-5 py-3.5 font-mono font-bold text-lg rounded-2xl bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-not-allowed shadow-inner tracking-wider"
                  />
                </div>
              </div>

              {/* Registered Email Address - Masked */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="voter-email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    Registered Email Address
                  </label>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                    OTP Destination
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-indigo-500 text-[24px]">mail</span>
                  </div>
                  <input
                    id="voter-email"
                    type="text"
                    disabled
                    readOnly
                    value={maskedEmail}
                    className="w-full pl-14 pr-5 py-3.5 font-mono font-bold text-lg rounded-2xl bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-300 cursor-not-allowed shadow-inner"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                  Your accreditation OTP will be sent to your registered contact details above.
                </p>
              </div>

              {/* Strict Device Security Notice */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex items-start gap-3">
                <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 mt-0.5">phonelink_lock</span>
                <div className="text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed">
                  <p className="font-bold text-sm text-indigo-900 dark:text-indigo-100 mb-1">
                    Device Binding Security
                  </p>
                  <p>
                    This device (<strong className="font-semibold text-indigo-600 dark:text-indigo-400">{getDeviceInfo()}</strong>) will be securely bound to your voter account. On election day, you can only cast your vote from this exact device and browser.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || (!maskedEmail && !maskedPhone)}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 text-lg font-bold disabled:opacity-50"
                >
                  {loading ? (
                    <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Submit & Request OTP
                      <span className="material-symbols-outlined text-2xl">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: OTP VERIFICATION */}
          {step === 3 && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 text-center">
                  Enter 6-Digit Accreditation OTP
                </label>
                <div
                  className="grid grid-cols-6 gap-2 sm:gap-3 max-w-md mx-auto"
                  onPaste={handleOtpPaste}
                  role="group"
                  aria-label="6-digit accreditation OTP"
                >
                  {Array.from({ length: 6 }).map((_, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpRefs.current[index] = el; }}
                      id={`acc-otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      required
                      autoFocus={index === 0}
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      value={otpDigits[index]}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onFocus={(e) => e.currentTarget.select()}
                      className="w-full aspect-square min-w-0 rounded-xl sm:rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80 text-slate-900 dark:text-white text-center text-xl sm:text-2xl font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otpDigits.join('').length !== 6}
                className="w-full btn-primary flex items-center justify-center gap-2 text-lg font-bold disabled:opacity-50"
              >
                {loading ? (
                  <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Confirm Accreditation
                    <span className="material-symbols-outlined text-2xl">verified</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-sm pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  Back to details
                </button>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendCooldown > 0 || loading}
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 disabled:text-slate-400"
                >
                  {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: ACCREDITATION SUCCESS */}
          {step === 4 && (
            <div className="space-y-6 text-center animate-scale-in">
              <div className="size-20 mx-auto rounded-3xl bg-green-500/10 border-2 border-green-500 flex items-center justify-center text-green-500 shadow-xl shadow-green-500/10">
                <span className="material-symbols-outlined text-5xl">check_circle</span>
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  Accreditation Confirmed!
                </h3>
                {/* EXACT SPECIFIED MESSAGE */}
                <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 font-semibold text-base sm:text-lg">
                  you have been successfully accredited for the NECO MCS election, wait for further instruction for voting.
                </div>
              </div>

              {/* Voter Credentials Summary */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left space-y-3 shadow-sm">
                <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-700/50 pb-2">
                  <span className="text-slate-500">MCS Username</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{username}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-700/50 pb-2">
                  <span className="text-slate-500">Full Name</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{fullName}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-700/50 pb-2">
                  <span className="text-slate-500">Phone Number</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">{maskedPhone || 'On record'}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-700/50 pb-2">
                  <span className="text-slate-500">Registered Email</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">{maskedEmail}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Bound Voting Device</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">phonelink_lock</span>
                    {getDeviceInfo()}
                  </span>
                </div>
              </div>

              <div className="pt-2 p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center space-y-1">
                <span className="material-symbols-outlined text-2xl text-indigo-600 dark:text-indigo-400">info</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  You have been successfully accredited for the NECO MCS election.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Please wait for further instructions for voting.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Portal navigation — links to other voter portals (no admin link) */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mb-2">Other portals</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { to: '/election',       label: 'Election Portal',       icon: 'how_to_vote' },
              { to: '/contact-update', label: 'Contact Update Portal', icon: 'manage_accounts' },
            ].map(l => (
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
      </div>
    </div>
  );
};
