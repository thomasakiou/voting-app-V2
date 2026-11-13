import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  usersAPI,
  votingTimeAPI,
  votesAPI,
  portalLocksAPI,
  VotingTimeOut,
  UserStatsOut,
  PortalLocksStatus,
} from '../api';
import { LoadingSpinner, SuccessAlert, ErrorAlert, TablePagination } from '../components/UIComponents';

// ============================================================
// CUSTOM ELECTION CONFIRMATION MODAL
// ============================================================
interface VotingConfirmModalProps {
  isOpen: boolean;
  action: 'start' | 'stop';
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const VotingConfirmModal: React.FC<VotingConfirmModalProps> = ({
  isOpen,
  action,
  loading,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  const isStart = action === 'start';

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="p-6 pb-2 flex items-start gap-4">
          <div className={`size-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
            isStart
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/20'
              : 'bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 shadow-red-500/20'
          }`}>
            <span className="material-symbols-outlined text-3xl">
              {isStart ? 'play_arrow' : 'stop'}
            </span>
          </div>

          <div className="flex-1">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
              isStart
                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
            }`}>
              <span className={`size-1.5 rounded-full ${isStart ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              NECO MCS Election Control
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {isStart ? 'Start Election Voting?' : 'Stop Voting Immediately?'}
            </h3>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
            {isStart
              ? 'You are about to activate the NECO MCS electronic election session. All accredited voters will immediately be able to access their ballots and cast votes in real-time.'
              : 'Are you sure you want to STOP the election now? Voting will terminate immediately. No further ballots can be submitted, and voter dashboard access will be locked.'}
          </p>

          <div className={`p-4 rounded-2xl border text-sm leading-relaxed ${
            isStart
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
              : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300'
          }`}>
            <div className="flex items-center gap-2 font-bold mb-1">
              <span className="material-symbols-outlined text-base">
                {isStart ? 'verified' : 'warning'}
              </span>
              {isStart ? 'Accredited Voters Ready' : 'Immediate Effect Warning'}
            </div>
            <p className="text-xs">
              {isStart
                ? 'Only voters with is_active = True and who successfully accredited with their MCS number will be allowed to vote.'
                : 'Any voter currently in the middle of viewing the ballot will be blocked from submitting further votes.'}
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-6 pt-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`px-6 py-2.5 rounded-xl text-white font-bold text-sm flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all ${
              isStart
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/30'
                : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-500/30'
            }`}
          >
            {loading ? (
              <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">
                  {isStart ? 'play_arrow' : 'stop'}
                </span>
                {isStart ? 'Yes, Start Voting Now' : 'Yes, Stop Voting Immediately'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

// ============================================================

// CUSTOM PORTAL LOCK CONFIRMATION MODAL

// ============================================================

interface PortalLockConfirmModalProps {

  isOpen: boolean;

  portal: 'contact_update' | 'accreditation' | 'election';

  currentLocked: boolean;

  loading: boolean;

  onConfirm: () => void;

  onClose: () => void;

}



const PortalLockConfirmModal: React.FC<PortalLockConfirmModalProps> = ({

  isOpen,

  portal,

  currentLocked,

  loading,

  onConfirm,

  onClose,

}) => {

  if (!isOpen) return null;



  const isLocking = !currentLocked;

  const portalName =

    portal === 'contact_update'

      ? 'Contact Update'

      : portal === 'accreditation'

      ? 'Accreditation'

      : 'Election Voting';



  const modalContent = (

    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>

      <div

        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-in"

        onClick={(e) => e.stopPropagation()}

      >

        {/* Header Ribbon */}

        <div className="p-6 pb-2 flex items-start gap-4">

          <div className={`size-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${

            isLocking

              ? 'bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 shadow-red-500/20'

              : 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/20'

          }`}>

            <span className="material-symbols-outlined text-3xl">

              {isLocking ? 'lock' : 'lock_open'}

            </span>

          </div>



          <div className="flex-1">

            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${

              isLocking

                ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'

                : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'

            }`}>

              <span className={`size-1.5 rounded-full ${isLocking ? 'bg-red-500' : 'bg-emerald-500'}`}></span>

              Portal Access & URL Control

            </span>

            <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">

              {isLocking ? `Lock ${portalName} URL?` : `Unlock & Open ${portalName}?`}

            </h3>

          </div>

        </div>



        {/* Modal Body */}

        <div className="p-6 space-y-4">

          <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">

            {isLocking

              ? `You are about to LOCK the ${portalName} portal URL. Any voter visiting this URL will be immediately blocked and shown a customized alert notifying them that the portal is currently closed.`

              : `You are about to UNLOCK and OPEN the ${portalName} portal URL. Voters will be permitted to access this page normally.`}

          </p>



          <div className={`p-4 rounded-2xl border text-sm leading-relaxed ${

            isLocking

              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300'

              : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'

          }`}>

            <div className="flex items-center gap-2 font-bold mb-1">

              <span className="material-symbols-outlined text-base">

                {isLocking ? 'warning' : 'verified'}

              </span>

              {isLocking ? 'Immediate Restriction Notice' : 'Portal Available for Voters'}

            </div>

            <p className="text-xs">

              {isLocking

                ? 'No voter can proceed past this URL until you choose to unlock it again.'

                : 'Voters can now visit this URL and perform their actions.'}

            </p>

          </div>

        </div>



        {/* Modal Actions */}

        <div className="p-6 pt-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">

          <button

            type="button"

            disabled={loading}

            onClick={onClose}

            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"

          >

            Cancel

          </button>

          <button

            type="button"

            disabled={loading}

            onClick={onConfirm}

            className={`px-6 py-2.5 rounded-xl text-white font-bold text-sm flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all ${

              isLocking

                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-500/30'

                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/30'

            }`}

          >

            {loading ? (

              <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>

            ) : (

              <>

                <span className="material-symbols-outlined text-lg">

                  {isLocking ? 'lock' : 'lock_open'}

                </span>

                {isLocking ? `Yes, Lock ${portalName}` : `Yes, Unlock ${portalName}`}

              </>

            )}

          </button>

        </div>

      </div>

    </div>

  );



  return createPortal(modalContent, document.body);

};



// ============================================================
// CUSTOM ELECTION NOTIFICATION ALERT MODAL
// ============================================================
interface VotingNotificationAlertProps {
  isOpen: boolean;
  type: 'success' | 'danger';
  title: string;
  message: string;
  onClose: () => void;
}

const VotingNotificationAlert: React.FC<VotingNotificationAlertProps> = ({
  isOpen,
  type,
  title,
  message,
  onClose,
}) => {
  if (!isOpen) return null;

  const isSuccess = type === 'success';

  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-in text-center p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`size-20 rounded-3xl mx-auto flex items-center justify-center shadow-xl ${
          isSuccess
            ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-emerald-500/30'
            : 'bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-red-500/30'
        }`}>
          <span className="material-symbols-outlined text-5xl">
            {isSuccess ? 'how_to_vote' : 'lock'}
          </span>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
            <span className="material-symbols-outlined text-sm">notifications_active</span>
            NECO MCS Election Notification
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            {title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
            {message}
          </p>
        </div>

        <button
          onClick={onClose}
          className={`w-full py-3.5 rounded-2xl font-bold text-base text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] ${
            isSuccess
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/30 hover:shadow-emerald-500/50'
              : 'bg-gradient-to-r from-red-600 to-rose-600 shadow-red-500/30 hover:shadow-red-500/50'
          }`}
        >
          Acknowledge & Continue
        </button>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<UserStatsOut | null>(null);
  const [votingStatus, setVotingStatus] = useState<VotingTimeOut | null>(null);
  const [liveVotes, setLiveVotes] = useState<{ total_votes_cast: number; recent_votes: any[] }>({
    total_votes_cast: 0,
    recent_votes: [],
  });
  const [loading, setLoading] = useState(true);
  const [togglingVoting, setTogglingVoting] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [portalLocks, setPortalLocks] = useState<PortalLocksStatus | null>(null);
  const [togglingLock, setTogglingLock] = useState<string | null>(null);

  // Live votes server-side pagination state
  const [livePage, setLivePage] = useState(1);
  const [livePageSize, setLivePageSize] = useState(10);
  const [liveTotalItems, setLiveTotalItems] = useState(0);
  const liveTotalPages = Math.max(1, Math.ceil(liveTotalItems / livePageSize));
  const handleLivePageSizeChange = (newSize: number) => {
    setLivePageSize(newSize);
    setLivePage(1);
  };

  // Custom modal states
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; action: 'start' | 'stop' }>({
    isOpen: false,
    action: 'start',
  });
  const [portalLockConfirm, setPortalLockConfirm] = useState<{

    isOpen: boolean;

    portal: 'contact_update' | 'accreditation' | 'election';

    currentLocked: boolean;

  }>({

    isOpen: false,

    portal: 'contact_update',

    currentLocked: false,

  });

  const [customAlert, setCustomAlert] = useState<{
    isOpen: boolean;
    type: 'success' | 'danger';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  useEffect(() => {
    loadAllData();
    // Poll live votes and status every 4 seconds for real-time visibility
    const interval = setInterval(() => {
      fetchLiveStream();
    }, 4000);
    return () => clearInterval(interval);
  }, [livePage, livePageSize]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [analysisData, statusData, liveData, locksData] = await Promise.all([
        usersAPI.getAnalysis(),
        votingTimeAPI.getStatus(),
        votesAPI.getLive(livePage, livePageSize).catch(() => ({ total_votes_cast: 0, total_items: 0, page: 1, page_size: 10, recent_votes: [] })),
        portalLocksAPI.getStatus().catch(() => null),
      ]);
      setStats(analysisData);
      setVotingStatus(statusData);
      setLiveVotes(liveData);
      setLiveTotalItems(liveData.total_items || 0);
      if (locksData) setPortalLocks(locksData);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      if (err?.status === 401) {
        setError('Your administrator session has expired. Please log out and sign in again to continue monitoring.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveStream = async () => {
    try {
      const [liveData, statusData] = await Promise.all([
        votesAPI.getLive(livePage, livePageSize).catch(() => null),
        votingTimeAPI.getStatus().catch(() => null),
      ]);
      if (liveData) {
        setLiveVotes(liveData);
        setLiveTotalItems(liveData.total_items || 0);
      }
      if (statusData) setVotingStatus(statusData);
    } catch (err) {
      // quiet poll error
    }
  };

  // Click triggers custom confirmation modal
  const openStartConfirm = () => {
    setConfirmModal({ isOpen: true, action: 'start' });
  };

  const openStopConfirm = () => {
    setConfirmModal({ isOpen: true, action: 'stop' });
  };

  // Perform Start Voting
  const executeStartVoting = async () => {
    setTogglingVoting(true);
    setError('');
    try {
      const res = await votingTimeAPI.startVoting();
      setVotingStatus(res);
      setConfirmModal({ isOpen: false, action: 'start' });
      setCustomAlert({
        isOpen: true,
        type: 'success',
        title: 'Voting Started Successfully!',
        message: 'The NECO MCS election session is now officially LIVE. Accredited voters can now authenticate with their MCS number and cast their ballots.',
      });
      setSuccess('Voting has started! Voters can now log in and vote.');
      loadAllData();
    } catch (err: any) {
      const msg = err?.data?.detail || 'Failed to start voting.';
      setError(msg);
      setConfirmModal({ isOpen: false, action: 'start' });
      setCustomAlert({
        isOpen: true,
        type: 'danger',
        title: 'Unable to Start Voting',
        message: msg,
      });
    } finally {
      setTogglingVoting(false);
    }
  };

  // Perform Stop Voting
  const executeStopVoting = async () => {
    setTogglingVoting(true);
    setError('');
    try {
      const res = await votingTimeAPI.stopVoting();
      setVotingStatus(res);
      setConfirmModal({ isOpen: false, action: 'stop' });
      setCustomAlert({
        isOpen: true,
        type: 'danger',
        title: 'Voting Stopped Immediately!',
        message: 'The NECO MCS election session has been officially CLOSED. All voter ballots and dashboard access are now permanently locked.',
      });
      setSuccess('Voting has been stopped immediately. No more votes can be cast.');
      loadAllData();
    } catch (err: any) {
      const msg = err?.data?.detail || 'Failed to stop voting.';
      setError(msg);
      setConfirmModal({ isOpen: false, action: 'stop' });
      setCustomAlert({
        isOpen: true,
        type: 'danger',
        title: 'Unable to Stop Voting',
        message: msg,
      });
    } finally {
      setTogglingVoting(false);
    }
  };

  const handleTogglePortalLock = (

    portal: 'contact_update' | 'accreditation' | 'election',

    currentLocked: boolean

  ) => {

    setPortalLockConfirm({

      isOpen: true,

      portal,

      currentLocked,

    });

  };



  const executeTogglePortalLock = async () => {

    const { portal, currentLocked } = portalLockConfirm;

    const portalName =

      portal === 'contact_update'

        ? 'Contact Update'

        : portal === 'accreditation'

        ? 'Accreditation'

        : 'Election';

    const willLock = !currentLocked;



    setTogglingLock(portal);

    setError('');

    try {

      const res = await portalLocksAPI.toggle(portal, willLock);

      setPortalLocks(res);

      setPortalLockConfirm((prev) => ({ ...prev, isOpen: false }));



      const successMsg = `${portalName} portal URL is now ${

        willLock

          ? 'LOCKED. Any voter visiting that page will see an alert that it is closed.'

          : 'UNLOCKED and open for voters.'

      }`;

      setSuccess(successMsg);

      setCustomAlert({

        isOpen: true,

        type: willLock ? 'danger' : 'success',

        title: willLock ? `${portalName} Portal Locked` : `${portalName} Portal Unlocked`,

        message: successMsg,

      });

    } catch (err: any) {

      const errMsg = err?.data?.detail || err?.message || `Failed to update ${portalName} portal lock.`;

      setError(errMsg);

      setPortalLockConfirm((prev) => ({ ...prev, isOpen: false }));

      setCustomAlert({

        isOpen: true,

        type: 'danger',

        title: 'Lock Update Failed',

        message: errMsg,

      });

    } finally {

      setTogglingLock(null);

    }

  };

  // Download Voters CSV
  const handleDownloadCSV = async () => {
    setDownloading('csv');
    setError('');
    try {
      await usersAPI.downloadCSV();
      setSuccess('Voters register CSV downloaded successfully.');
    } catch (err) {
      setError('Failed to download voters CSV.');
    } finally {
      setDownloading(null);
    }
  };

  // Download Voters PDF
  const handleDownloadPDF = async () => {
    setDownloading('pdf');
    setError('');
    try {
      await usersAPI.downloadPDF();
      setSuccess('Voters register PDF downloaded successfully.');
    } catch (err) {
      setError('Failed to download voters PDF.');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  const isVotingActive = votingStatus?.is_active && votingStatus.status === 'ACTIVE';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* CUSTOM CONFIRMATION MODAL (Replaces default window.confirm) */}
      <VotingConfirmModal
        isOpen={confirmModal.isOpen}
        action={confirmModal.action}
        loading={togglingVoting}
        onConfirm={confirmModal.action === 'start' ? executeStartVoting : executeStopVoting}
        onClose={() => setConfirmModal({ isOpen: false, action: confirmModal.action })}
      />

      {/* CUSTOM PORTAL LOCK CONFIRMATION MODAL */}

      <PortalLockConfirmModal

        isOpen={portalLockConfirm.isOpen}

        portal={portalLockConfirm.portal}

        currentLocked={portalLockConfirm.currentLocked}

        loading={togglingLock === portalLockConfirm.portal}

        onConfirm={executeTogglePortalLock}

        onClose={() => setPortalLockConfirm((prev) => ({ ...prev, isOpen: false }))}

      />



      {/* CUSTOM NOTIFICATION ALERT (Branded popup for action results) */}
      <VotingNotificationAlert
        isOpen={customAlert.isOpen}
        type={customAlert.type}
        title={customAlert.title}
        message={customAlert.message}
        onClose={() => setCustomAlert({ ...customAlert, isOpen: false })}
      />

      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Admin Control Center</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Real-time NECO MCS Election control, live voting stream, and analysis.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Download Voters Buttons */}
          <button
            onClick={handleDownloadCSV}
            disabled={downloading !== null}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:border-indigo-500 transition-all flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-lg text-emerald-600">table_view</span>
            {downloading === 'csv' ? 'Downloading...' : 'Export Voters (CSV)'}
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={downloading !== null}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:border-red-500 transition-all flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-lg text-red-500">picture_as_pdf</span>
            {downloading === 'pdf' ? 'Generating...' : 'Export Voters (PDF)'}
          </button>

          <button
            onClick={loadAllData}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm"
            title="Refresh Data"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </div>

            {/* COMPACT URL LOCKS BAR (Top of Dashboard) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-[#1a1d29] border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold tracking-wide">
          <span className="material-symbols-outlined text-base text-indigo-600">lock_clock</span>
          <span>Voter URL Locks:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* 1. Contact Update Toggle */}
          {(() => {
            const isLocked = portalLocks?.contact_update?.is_locked ?? false;
            return (
              <button
                type="button"
                onClick={() => handleTogglePortalLock('contact_update', isLocked)}
                disabled={togglingLock === 'contact_update'}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all shadow-xs ${
                  isLocked
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                }`}
                title="Click to toggle lock for Contact Update URL"
              >
                {togglingLock === 'contact_update' ? (
                  <div className="size-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span className="material-symbols-outlined text-sm">
                    {isLocked ? 'lock' : 'lock_open'}
                  </span>
                )}
                <span>Contact Update: <b>{isLocked ? 'Locked' : 'Open'}</b></span>
              </button>
            );
          })()}

          {/* 2. Accreditation Toggle */}
          {(() => {
            const isLocked = portalLocks?.accreditation?.is_locked ?? false;
            return (
              <button
                type="button"
                onClick={() => handleTogglePortalLock('accreditation', isLocked)}
                disabled={togglingLock === 'accreditation'}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all shadow-xs ${
                  isLocked
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                }`}
                title="Click to toggle lock for Accreditation URL"
              >
                {togglingLock === 'accreditation' ? (
                  <div className="size-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span className="material-symbols-outlined text-sm">
                    {isLocked ? 'lock' : 'lock_open'}
                  </span>
                )}
                <span>Accreditation: <b>{isLocked ? 'Locked' : 'Open'}</b></span>
              </button>
            );
          })()}

          {/* 3. Election Toggle */}
          {(() => {
            const isLocked = portalLocks?.election?.is_locked ?? false;
            return (
              <button
                type="button"
                onClick={() => handleTogglePortalLock('election', isLocked)}
                disabled={togglingLock === 'election'}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all shadow-xs ${
                  isLocked
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                }`}
                title="Click to toggle lock for Election URL"
              >
                {togglingLock === 'election' ? (
                  <div className="size-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span className="material-symbols-outlined text-sm">
                    {isLocked ? 'lock' : 'lock_open'}
                  </span>
                )}
                <span>Election: <b>{isLocked ? 'Locked' : 'Open'}</b></span>
              </button>
            );
          })()}
        </div>
      </div>

{/* Alerts */}
      {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}
      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

      {/* ELECTION STATE & START/STOP CONTROLS CARD */}
      <div className={`rounded-3xl p-6 md:p-8 text-white shadow-xl transition-all duration-300 ${
        isVotingActive
          ? 'bg-gradient-to-r from-emerald-600 to-teal-700 shadow-emerald-500/20'
          : 'bg-gradient-to-r from-slate-800 to-indigo-900 shadow-slate-900/30'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                isVotingActive
                  ? 'bg-emerald-500/30 text-emerald-100 border border-emerald-400/40 animate-pulse'
                  : 'bg-white/10 text-slate-300 border border-white/20'
              }`}>
                <span className={`size-2 rounded-full ${isVotingActive ? 'bg-emerald-300' : 'bg-red-400'}`}></span>
                {isVotingActive ? 'Voting Live In Progress' : 'Voting Stopped / Closed'}
              </span>
              <span className="text-xs text-white/70">
                Live Total: <b>{liveVotes.total_votes_cast}</b> votes cast
              </span>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight">
              {isVotingActive ? 'Election Session is Currently Active' : 'Voting is Currently Closed'}
            </h2>
            <p className="text-white/80 max-w-2xl text-sm md:text-base leading-relaxed">
              {isVotingActive
                ? 'Accredited voters are actively casting ballots. Click Stop Voting to immediately terminate the session and lock all voter dashboard access.'
                : 'Voters cannot vote while the election session is closed. Click Start Voting to unlock ballot access and commence voting.'}
            </p>
          </div>

          {/* START / STOP VOTING BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            {isVotingActive ? (
              <button
                onClick={openStopConfirm}
                disabled={togglingVoting}
                className="px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-lg shadow-xl shadow-red-900/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 border-2 border-red-400/50"
              >
                {togglingVoting ? (
                  <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-2xl">stop_circle</span>
                    Stop Voting Now
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={openStartConfirm}
                disabled={togglingVoting}
                className="px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-lg shadow-xl shadow-emerald-900/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 border-2 border-emerald-300/50"
              >
                {togglingVoting ? (
                  <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-2xl">play_circle</span>
                    Start Voting Now
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ANALYSIS OF ALL VOTERS (REQUIREMENT 3) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600">analytics</span>
            Voters Register & Turnout Analysis
          </h3>
          <Link
            to="/admin/analysis"
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all hover:scale-105"
          >
            Open Visual Analysis Charts
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Registered */}
          <div className="card p-5 border-l-4 border-l-blue-500 bg-white dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">All Registered Voters</span>
              <span className="material-symbols-outlined text-blue-500">groups</span>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {stats?.total_voters || 0}
              </div>
              <p className="text-xs text-slate-400 mt-1">Total database register</p>
            </div>
          </div>

          {/* Accredited Voters */}
          <div className="card p-5 border-l-4 border-l-indigo-500 bg-white dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">Accredited Voters</span>
              <span className="material-symbols-outlined text-indigo-500">verified</span>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {stats?.accredited_voters || 0}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {stats?.unaccredited_voters || 0} awaiting accreditation
              </p>
            </div>
          </div>

          {/* Eligible Voters */}
          <div className="card p-5 border-l-4 border-l-emerald-500 bg-white dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">Eligible Voters</span>
              <span className="material-symbols-outlined text-emerald-500">how_to_vote</span>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {stats?.eligible_voters || 0}
              </div>
              <p className="text-xs text-slate-400 mt-1">Accredited & Active</p>
            </div>
          </div>

          {/* Non-Eligible / Disqualified */}
          <div className="card p-5 border-l-4 border-l-red-500 bg-white dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">Non-Eligible Voters</span>
              <span className="material-symbols-outlined text-red-500">block</span>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-red-600 dark:text-red-400">
                {stats?.non_eligible_voters || 0}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {stats?.disabled_voters || 0} disqualified by admin
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TURNOUT AND LIVE FEED ROW */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Turnout & Fast Metrics */}
        <div className="card p-6 space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Voting Turnout Progress</h3>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-slate-600 dark:text-slate-300">Participation Turnout</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{stats?.turnout_percentage || 0}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-3.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-violet-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, stats?.turnout_percentage || 0)}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Total Ballots Cast</span>
              <span className="font-bold text-slate-900 dark:text-white">{stats?.total_votes_cast || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Active Voter Accounts</span>
              <span className="font-bold text-green-600">{stats?.active_voters || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Disqualified Voter Accounts</span>
              <span className="font-bold text-red-600">{stats?.disabled_voters || 0}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60">
            <Link
              to="/admin/users"
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors"
            >
              Manage Individual Voters
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* LIVE STREAM: AS VOTERS CAST THEIR VOTE (REQUIREMENT 3) */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="size-3 rounded-full bg-emerald-500 animate-ping"></div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Live Ballot Cast Feed</h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              Live Auto-Refresh
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-4">
            Real-time feed as voters cast votes from their dashboards.
          </p>

          <div className="overflow-x-auto">
            {liveVotes.recent_votes.length === 0 ? (
              <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl border-slate-200 dark:border-slate-700">
                No ballots cast yet. Once voters cast votes, they will stream here live.
              </div>
            ) : (
              <>
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold text-xs uppercase">
                    <tr>
                      <th className="px-4 py-2.5">Username</th>
                      <th className="px-4 py-2.5">Contested Office</th>
                      <th className="px-4 py-2.5">Candidate Voted</th>
                      <th className="px-4 py-2.5">Receipt Hash</th>
                      <th className="px-4 py-2.5">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(liveVotes.recent_votes || []).map((vote: any) => (
                      <tr key={vote.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white font-mono">
                          {vote.username || vote.user_name}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{vote.office_name}</td>
                        <td className="px-4 py-3 font-medium text-indigo-600 dark:text-indigo-400">
                          {vote.candidate_name}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold">
                            {vote.receipt_hash || 'MCS-SECURE'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {new Date(vote.created_at).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <TablePagination
                  currentPage={livePage}
                  totalPages={liveTotalPages}
                  totalItems={liveTotalItems}
                  pageSize={livePageSize}
                  onPageChange={setLivePage}
                  onPageSizeChange={handleLivePageSizeChange}
                  pageSizeOptions={[5, 10, 25, 50]}
                  itemName="ballots"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
