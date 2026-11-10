import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { voterContactAPI, portalLocksAPI, APIError } from '../api';

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof APIError) {
    const detail = err.data?.detail;
    if (typeof detail === 'string') return detail;
    if (typeof err.data?.message === 'string') return err.data.message;
  }
  return fallback;
};

export const VoterContactUpdate: React.FC = () => {
  // Step 1: Input MCS Number
  // Step 2: View / Add Contact Info / Raise Dispute
  // Step 3: Enter OTP
  // Step 4: Success Screen
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Voter Profile State
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [hasEmail, setHasEmail] = useState(false);
  const [hasPhone, setHasPhone] = useState(false);
  const [existingMaskedEmail, setExistingMaskedEmail] = useState('');
  const [existingMaskedPhone, setExistingMaskedPhone] = useState('');
  const [isAccredited, setIsAccredited] = useState(false);

  // Inputs for missing details
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // Target email where OTP was actually sent
  const [otpTargetEmail, setOtpTargetEmail] = useState('');

  // OTP state
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Dispute Modal state
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [disputeType, setDisputeType] = useState('Incorrect Email Address');
  const [requestedEmail, setRequestedEmail] = useState('');
  const [requestedPhone, setRequestedPhone] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeSuccess, setDisputeSuccess] = useState('');
  const [disputeError, setDisputeError] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isPortalLocked, setIsPortalLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState('');

  useEffect(() => {
    portalLocksAPI.getStatus().then((status) => {
      if (status.contact_update?.is_locked) {
        setIsPortalLocked(true);
        setLockMessage(
          status.contact_update.message ||
            'The Voter Contact Update portal is currently closed by the election administration.'
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

  // Step 1: Look up voter by MCS number
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your 4-digit MCS number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await voterContactAPI.lookup(username.trim());
      setFullName(data.full_name);
      setHasEmail(data.has_email);
      setHasPhone(data.has_phone);
      setExistingMaskedEmail(data.masked_email || (data.has_email ? 'Registered on file' : ''));
      setExistingMaskedPhone(data.masked_phone || (data.has_phone ? 'Registered on file' : ''));
      setIsAccredited(data.is_accredited);
      setNewEmail('');
      setNewPhone('');
      setStep(2);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to find voter record. Please verify your MCS number.'));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit Contact & Send OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    // If email is missing, voter must provide one
    if (!hasEmail && !newEmail.trim()) {
      setError('Email address is required. Please enter a valid email.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const emailToSend = hasEmail ? undefined : newEmail.trim();
      const phoneToSend = hasPhone ? undefined : (newPhone.trim() || undefined);

      const res = await voterContactAPI.sendOTP(username.trim(), emailToSend, phoneToSend);
      setOtpTargetEmail(res.masked_email || (newEmail ? newEmail : existingMaskedEmail));
      setResendCooldown(60);
      setSuccessMessage(res.message || 'Verification OTP has been dispatched to your email.');
      setStep(3);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to send verification OTP.'));
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Handle OTP inputs
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

  // Step 3: Verify OTP and commit contact details to DB
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otpDigits.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the full 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await voterContactAPI.verifyOTP(username.trim(), otpCode);
      if (res.masked_email) setExistingMaskedEmail(res.masked_email);
      if (res.masked_phone) setExistingMaskedPhone(res.masked_phone);
      setSuccessMessage(res.message);
      setStep(4);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Invalid or expired OTP code. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError('');

    try {
      const emailToSend = hasEmail ? undefined : newEmail.trim();
      const phoneToSend = hasPhone ? undefined : (newPhone.trim() || undefined);
      const res = await voterContactAPI.sendOTP(username.trim(), emailToSend, phoneToSend);
      setResendCooldown(60);
      setSuccessMessage(res.message || 'A fresh OTP has been sent.');
      setOtpDigits(Array(6).fill(''));
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to resend OTP.'));
    } finally {
      setLoading(false);
    }
  };

  // Dispute submission
  const handleRaiseDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason.trim()) {
      setDisputeError('Please provide a reason or explanation for this dispute.');
      return;
    }

    setDisputeSubmitting(true);
    setDisputeError('');

    try {
      await voterContactAPI.raiseDispute({
        username: username.trim(),
        dispute_type: disputeType,
        requested_email: requestedEmail.trim() || undefined,
        requested_phone: requestedPhone.trim() || undefined,
        reason: disputeReason.trim(),
      });
      setDisputeSuccess('Your dispute has been logged successfully. The election administrator will review your request.');
      setDisputeReason('');
      setRequestedEmail('');
      setRequestedPhone('');
    } catch (err: any) {
      setDisputeError(getErrorMessage(err, 'Failed to submit dispute.'));
    } finally {
      setDisputeSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0B1120]">
      {/* Left Visual Sidebar */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0B1120] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-blue-600/20 z-0"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8 flex items-center gap-3">
            <div className="size-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
              <span className="material-symbols-outlined text-4xl">contact_mail</span>
            </div>
            <span className="text-3xl font-bold tracking-tight">NECO MCS</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
            Voter Contact <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">
              Registration & Verification
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-lg leading-relaxed mb-8">
            Register your official email and phone number for OTP verification, or raise a dispute if your existing contact information needs correction.
          </p>

          <div className="space-y-4 max-w-md">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="size-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">1</div>
              <p className="text-sm font-medium text-slate-300">Lookup by 4-digit MCS Number</p>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="size-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">2</div>
              <p className="text-sm font-medium text-slate-300">Add Missing Contact or Raise Dispute</p>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="size-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">3</div>
              <p className="text-sm font-medium text-slate-300">Verify via Secure OTP to Commit to Database</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-lg space-y-8 animate-slide-up">
          {/* Header */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-3">
              <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
              Voter Contact Management
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              {step === 1 && 'Find Your Voter Record'}
              {step === 2 && 'Register Contact Information'}
              {step === 3 && 'Confirm with OTP'}
              {step === 4 && 'Registration Complete'}
            </h2>
            <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
              {step === 1 && 'Enter your 4-digit MCS number to check your voter profile.'}
              {step === 2 && 'Fill in any missing details. Existing records are locked and require a dispute to change.'}
              {step === 3 && `Enter the 6-digit OTP code sent to ${otpTargetEmail || 'your email'}.`}
              {step === 4 && 'Your contact details are confirmed and safely recorded in the database.'}
            </p>
          </div>

          {/* Portal Locked Alert Banner */}
          {isPortalLocked && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border-2 border-red-400 dark:border-red-800 flex items-start gap-3 shadow-md animate-scale-in">
              <span className="material-symbols-outlined text-red-600 text-3xl shrink-0">lock</span>
              <div>
                <h3 className="font-bold text-red-900 dark:text-red-200 text-base">
                  Portal Currently Closed
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-0.5">
                  {lockMessage || 'The Voter Contact Update portal is currently closed by the election administration. Registration and updating of voter contact details are temporarily disabled.'}
                </p>
              </div>
            </div>
          )}

          {/* Alerts */}
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3 text-red-600 dark:text-red-400 animate-scale-in">
              <span className="material-symbols-outlined mt-0.5">error</span>
              <p className="text-sm font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {successMessage && step !== 4 && (
            <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-start gap-3 text-green-700 dark:text-green-400 animate-scale-in">
              <span className="material-symbols-outlined mt-0.5">check_circle</span>
              <p className="text-sm font-medium leading-relaxed">{successMessage}</p>
            </div>
          )}

          {/* STEP 1: MCS LOOKUP */}
          {step === 1 && (
            <form onSubmit={handleLookup} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="mcs-number" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  MCS Number (4 Digits)
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-slate-400 group-focus-within:text-indigo-500 transition-colors text-[24px]">
                      badge
                    </span>
                  </div>
                  <input
                    id="mcs-number"
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
                <p className="text-xs text-slate-400 ml-1">Enter your assigned 4-digit MCS number.</p>
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
                    Find My Profile
                    <span className="material-symbols-outlined text-2xl">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: PROFILE & CONTACT FORM */}
          {step === 2 && (
            <form onSubmit={handleSendOTP} className="space-y-6">
              {/* Voter Identity Card */}
              <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400">MCS Number:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">#{username}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Voter Full Name:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{fullName}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Accreditation:</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isAccredited ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                    {isAccredited ? 'Accredited' : 'Pending'}
                  </span>
                </div>
              </div>

              {/* Email Address Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="contact-email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  {hasEmail ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      <span className="material-symbols-outlined text-[13px]">lock</span>
                      Locked (On Record)
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                      Missing — Enter Below
                    </span>
                  )}
                </div>

                {hasEmail ? (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-slate-400 text-[24px]">mail</span>
                    </div>
                    <input
                      id="contact-email"
                      type="text"
                      disabled
                      readOnly
                      value={existingMaskedEmail}
                      className="w-full pl-14 pr-5 py-3.5 font-mono font-medium text-lg rounded-2xl bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-not-allowed shadow-inner"
                    />
                  </div>
                ) : (
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-slate-400 group-focus-within:text-indigo-500 text-[24px]">mail</span>
                    </div>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="e.g. yourname@example.com"
                      className="input-field pl-14 py-3.5 font-medium text-lg bg-slate-50/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20"
                      autoFocus
                    />
                  </div>
                )}
                <p className="text-xs text-slate-400 ml-1">
                  {hasEmail ? 'Email is already recorded and locked.' : 'Must be unique. An OTP will be sent to confirm.'}
                </p>
              </div>

              {/* Phone Number Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="contact-phone" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    Phone Number
                  </label>
                  {hasPhone ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      <span className="material-symbols-outlined text-[13px]">lock</span>
                      Locked (On Record)
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      Enter Below
                    </span>
                  )}
                </div>

                {hasPhone ? (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-slate-400 text-[24px]">call</span>
                    </div>
                    <input
                      id="contact-phone"
                      type="text"
                      disabled
                      readOnly
                      value={existingMaskedPhone}
                      className="w-full pl-14 pr-5 py-3.5 font-mono font-medium text-lg rounded-2xl bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-not-allowed shadow-inner"
                    />
                  </div>
                ) : (
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-slate-400 group-focus-within:text-indigo-500 text-[24px]">call</span>
                    </div>
                    <input
                      id="contact-phone"
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="e.g. 08012345678"
                      className="input-field pl-14 py-3.5 font-medium text-lg bg-slate-50/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20"
                    />
                  </div>
                )}
                <p className="text-xs text-slate-400 ml-1">
                  {hasPhone ? 'Phone number is locked on record.' : 'Phone numbers must be unique across all voters.'}
                </p>
              </div>

              {/* Dispute Callout if existing info is present */}
              {(hasEmail || hasPhone) && (
                <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold text-sm">
                      <span className="material-symbols-outlined text-[18px]">report_problem</span>
                      Need to change existing details?
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                      To protect voters from unauthorized modifications, existing details cannot be edited directly. You can raise a dispute for administrator review.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDisputeError('');
                      setDisputeSuccess('');
                      setIsDisputeOpen(true);
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-sm"
                  >
                    Raise Dispute
                  </button>
                </div>
              )}

              {/* Action Buttons */}
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
                  disabled={loading || (!hasEmail && !newEmail.trim())}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 text-lg font-bold disabled:opacity-50"
                >
                  {loading ? (
                    <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {hasEmail ? 'Confirm & Send OTP' : 'Submit & Request OTP'}
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
                  Enter 6-Digit Verification OTP
                </label>
                <div
                  className="grid grid-cols-6 gap-2 sm:gap-3 max-w-md mx-auto"
                  onPaste={handleOtpPaste}
                  role="group"
                  aria-label="6-digit verification OTP"
                >
                  {Array.from({ length: 6 }).map((_, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpRefs.current[index] = el; }}
                      id={`contact-otp-${index}`}
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
                <p className="text-xs text-center text-slate-400">
                  Data will be committed to the database only after OTP is confirmed.
                </p>
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
                    Confirm & Save Details
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
                  Back
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

          {/* STEP 4: REGISTRATION SUCCESS */}
          {step === 4 && (
            <div className="space-y-6 text-center animate-scale-in">
              <div className="size-20 mx-auto rounded-3xl bg-green-500/10 border-2 border-green-500 flex items-center justify-center text-green-500 shadow-xl shadow-green-500/10">
                <span className="material-symbols-outlined text-5xl">check_circle</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  Contact Details Recorded!
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Your email and phone number have been confirmed via OTP and recorded in the database.
                </p>
              </div>

              {/* Summary Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left space-y-3 shadow-sm">
                <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-700/50 pb-2">
                  <span className="text-slate-500">MCS Number</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">#{username}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-700/50 pb-2">
                  <span className="text-slate-500">Full Name</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{fullName}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-700/50 pb-2">
                  <span className="text-slate-500">Registered Email</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">
                    {existingMaskedEmail || newEmail}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Registered Phone</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">
                    {existingMaskedPhone || newPhone || 'Not provided'}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <Link
                  to="/accreditation"
                  className="w-full btn-primary flex items-center justify-center gap-2 text-lg font-bold"
                >
                  Proceed to Voter Accreditation
                  <span className="material-symbols-outlined text-2xl">arrow_forward</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setUsername('');
                    setNewEmail('');
                    setNewPhone('');
                  }}
                  className="text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400"
                >
                  Register Another Voter
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            By continuing, you agree to our{' '}
            <Link to="/terms" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">Privacy Policy</Link>.
          </p>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 mb-2">Other portals</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                to="/election"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                           bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-900/30
                           text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400
                           border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700
                           transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">how_to_vote</span>
                Election Portal
              </Link>
              <Link
                to="/accreditation"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                           bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-900/30
                           text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400
                           border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700
                           transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">how_to_reg</span>
                Accreditation Portal
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* DISPUTE MODAL */}
      {isDisputeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                <span className="material-symbols-outlined text-2xl">report_problem</span>
                Raise Contact Dispute
              </div>
              <button
                type="button"
                onClick={() => setIsDisputeOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {disputeSuccess ? (
              <div className="space-y-4 text-center py-4">
                <div className="size-16 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl">check_circle</span>
                </div>
                <p className="font-semibold text-slate-900 dark:text-white">{disputeSuccess}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  The election administrator will review your submission and contact you if needed.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsDisputeOpen(false);
                    setDisputeSuccess('');
                  }}
                  className="w-full btn-primary py-2.5 font-bold"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleRaiseDispute} className="space-y-4">
                {disputeError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold">
                    {disputeError}
                  </div>
                )}

                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Voter: <strong className="text-slate-800 dark:text-slate-200">{fullName} (MCS #{username})</strong>
                </div>

                <div className="space-y-1">
                  <label htmlFor="dispute-type" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Dispute Reason Category
                  </label>
                  <select
                    id="dispute-type"
                    value={disputeType}
                    onChange={(e) => setDisputeType(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Incorrect Email Address">Incorrect Email Address</option>
                    <option value="Incorrect Phone Number">Incorrect Phone Number</option>
                    <option value="Lost Access to Email/Phone">Lost Access to Email or Phone</option>
                    <option value="Unauthorized / Impersonated Details">Unauthorized / Impersonated Details</option>
                    <option value="Other">Other Reason</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="dispute-requested-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Correct / Requested Email Address (Optional)
                  </label>
                  <input
                    id="dispute-requested-email"
                    type="email"
                    value={requestedEmail}
                    onChange={(e) => setRequestedEmail(e.target.value)}
                    placeholder="e.g. correct.email@example.com"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="dispute-requested-phone" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Correct / Requested Phone Number (Optional)
                  </label>
                  <input
                    id="dispute-requested-phone"
                    type="tel"
                    value={requestedPhone}
                    onChange={(e) => setRequestedPhone(e.target.value)}
                    placeholder="e.g. 08012345678"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="dispute-explanation" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Detailed Explanation <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="dispute-explanation"
                    required
                    rows={3}
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Describe why the existing contact info is incorrect and provide any details to verify your identity..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDisputeOpen(false)}
                    className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={disputeSubmitting || !disputeReason.trim()}
                    className="px-5 py-2 text-sm font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 flex items-center gap-2"
                  >
                    {disputeSubmitting ? 'Submitting...' : 'Submit Dispute'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
