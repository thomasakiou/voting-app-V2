import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, voterContactAPI, telegramAPI, UserOut, UserUpdate, VoterDisputeOut } from '../api';
import { LoadingSpinner, TableSkeleton, ErrorAlert, SuccessAlert, ConfirmDialog, Modal, TablePagination, usePagination } from '../components/UIComponents';

const EditUserModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  user: UserOut;
  onUpdate: () => void;
}> = ({ isOpen, onClose, user, onUpdate }) => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super-admin';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [username, setUsername] = useState(user.username || '');
  const [fullName, setFullName] = useState(user.full_name || '');
  const [role, setRole] = useState<'super-admin' | 'admin' | 'voter' | 'agent'>(user.role || 'voter');
  const [phone, setPhone] = useState(user.phone || '');
  const [email, setEmail] = useState(user.email || '');
  const [fileNo, setFileNo] = useState(user.staff_file_no || '');
  const [conraiss, setConraiss] = useState(user.staff_conraiss || '');
  const [station, setStation] = useState(user.staff_station || '');
  const [staffActive, setStaffActive] = useState<boolean>(user.staff_active ?? true);
  const [password, setPassword] = useState('');

  useEffect(() => {
    setUsername(user.username || '');
    setFullName(user.full_name || '');
    setRole(user.role || 'voter');
    setPhone(user.phone || '');
    setEmail(user.email || '');
    setFileNo(user.staff_file_no || '');
    setConraiss(user.staff_conraiss || '');
    setStation(user.staff_station || '');
    setStaffActive(user.staff_active ?? true);
    setPassword('');
    setError('');
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('MCS Number (Username) is compulsory.');
      return;
    }
    if (!fullName.trim()) {
      setError('Staff Full Name is compulsory.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await usersAPI.update(user.id, {
        username: username.trim(),
        full_name: fullName.trim(),
        role,
        phone: phone.trim() || undefined,
        email: email.trim().toLowerCase() || undefined,
        staff_file_no: fileNo.trim() || undefined,
        staff_conraiss: conraiss.trim() || undefined,
        staff_station: station.trim() || undefined,
        staff_active: staffActive,
        password: password.trim() || undefined,
      });
      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err?.data?.detail || err?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit User: ${user.full_name || user.username}`} maxWidth="max-w-3xl">
      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Compulsory Fields Notice */}
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-blue-600 dark:text-blue-400">info</span>
            <span><strong>Compulsory Fields:</strong> MCS Number, Full Name, and Role. All other fields are optional.</span>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">* Required</span>
        </div>

        {/* Compulsory Identity Fields */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">
              MCS Number (Username) <span className="text-red-500 font-bold">*</span>
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
              placeholder="e.g. 2668 or staff MCS number"
            />
            <p className="text-[11px] text-slate-500 mt-1">Unique identifier used for voting, login, and accreditation</p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">
              User Role <span className="text-red-500 font-bold">*</span>
            </label>
            <select
              required
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium"
            >
              <option value="voter">Voter (Standard Voter Account)</option>
              <option value="agent">Agent (Observer / Live Monitoring)</option>
              <option value="admin">Admin (Election Manager)</option>
              {isSuperAdmin && <option value="super-admin">Super Admin (Full System Access)</option>}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">Role determines user access permissions</p>
          </div>
        </div>

        {role === 'admin' && (
          <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-300 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">lock_clock</span>
                Single-Use Admin Account Status:
              </span>
              {user.admin_login_count && user.admin_login_count > 0 ? (
                <span className="px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                  Used / Expired ({user.admin_login_count} login recorded)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Unused (Ready for 1 login)
                </span>
              )}
            </div>
            <p className="text-[11px] text-purple-800/80 dark:text-purple-300/80">
              Admin accounts created by the Super Admin can only log in once. Super Admin accounts can log in at anytime.
            </p>
            <div className="pt-2 border-t border-purple-200 dark:border-purple-800 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold text-[11px] text-purple-900 dark:text-purple-300">Live Session:</span>{' '}
                {user.current_session_id ? (
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Currently Logged In
                  </span>
                ) : (
                  <span className="text-slate-500">Not Logged In</span>
                )}
              </div>
              {user.current_session_id && (
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm(`Terminate active session and log out admin "${user.username}" immediately?`)) {
                      setLoading(true);
                      try {
                        await usersAPI.logoutAdmin(user.id);
                        user.current_session_id = null;
                        onUpdate();
                      } catch (err: any) {
                        setError(err?.data?.detail || err?.message || 'Failed to logout admin');
                      } finally {
                        setLoading(false);
                      }
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  Logout Admin Session
                </button>
              )}
            </div>
            {user.admin_login_count && user.admin_login_count > 0 && (
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  try {
                    await usersAPI.resetAdminLogin(user.id);
                    user.admin_login_count = 0;
                    onUpdate();
                  } catch (err: any) {
                    setError(err?.data?.detail || err?.message || 'Failed to reset admin login');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="mt-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 transition-all"
              >
                <span className="material-symbols-outlined text-sm">lock_reset</span>
                Reset Login Status (Allow 1 More Login)
              </button>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">
            Staff Full Name <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none font-semibold"
            placeholder="e.g. Ibrahim Abubakar"
          />
        </div>

        {/* Optional Contact Details */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Contact Details (Optional)
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none font-mono"
                placeholder="e.g. 08012345678"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                placeholder="e.g. user@neco.gov.ng"
              />
            </div>
          </div>
        </div>

        {/* Telegram Bot Integration Details */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-sky-500">send</span>
              Telegram Bot Integration
            </span>
            {user.telegram_chat_id ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                Connected
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                Not Connected
              </span>
            )}
          </div>
          {user.telegram_chat_id ? (
            <div className="p-3.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 flex items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-semibold text-sky-900 dark:text-sky-200">
                  {user.telegram_username ? `Account: ${user.telegram_username}` : `Chat ID: ${user.telegram_chat_id}`}
                </p>
                <p className="text-[11px] text-sky-700 dark:text-sky-400">
                  This voter receives instant verification OTPs via @NECOMCSVotingOTPBot.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm(`Unlink Telegram account from voter "${user.full_name}" (${user.username})?\n\nThe voter will no longer receive OTPs on Telegram until they re-verify their phone.`)) {
                    setLoading(true);
                    try {
                      await telegramAPI.unlink(user.username);
                      user.telegram_chat_id = null;
                      user.telegram_username = null;
                      onUpdate();
                    } catch (err: any) {
                      setError(err?.data?.detail || err?.message || 'Failed to unlink Telegram');
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 transition-all shrink-0 shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">link_off</span>
                Unlink Telegram
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              Voter has not linked their Telegram account. They can link anytime by opening @NECOMCSVotingOTPBot and sending their registered phone number.
            </p>
          )}
        </div>

        {/* Optional Staff Registry Details */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Staff Registry Details (Optional)
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                File Number (Optional)
              </label>
              <input
                type="text"
                value={fileNo}
                onChange={(e) => setFileNo(e.target.value)}
                className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                placeholder="e.g. P/12345"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                CONRAISS (Optional)
              </label>
              <input
                type="text"
                value={conraiss}
                onChange={(e) => setConraiss(e.target.value)}
                className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                placeholder="e.g. CONRAISS 12"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                Station / Dept (Optional)
              </label>
              <input
                type="text"
                value={station}
                onChange={(e) => setStation(e.target.value)}
                className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                placeholder="e.g. Minna HQ"
              />
            </div>
          </div>
        </div>

        {/* Security & Password */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="grid sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                Reset Password (Optional)
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                placeholder="Leave blank to keep existing password"
              />
            </div>

            <div className="pt-6">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                <input
                  type="checkbox"
                  checked={staffActive}
                  onChange={(e) => setStaffActive(e.target.checked)}
                  className="size-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <div className="text-sm">
                  <span className="font-semibold text-slate-900 dark:text-white block">Staff Active Status</span>
                  <span className="text-xs text-slate-500">Uncheck to mark staff as inactive</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all border border-slate-200 dark:border-slate-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                Saving...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">save</span>
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const DetailItem: React.FC<{ label: string; value: string; icon: string }> = ({ label, value, icon }) => (
  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
    <div className="flex items-center gap-1.5 mb-1">
      <span className="material-symbols-outlined text-[14px] text-slate-400">{icon}</span>
      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{label}</p>
    </div>
    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 break-all">{value}</p>
  </div>
);

export const UserList: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super-admin';
  const isCurUserAdmin = currentUser?.role === 'admin';
  const [users, setUsers] = useState<UserOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [accreditationFilter, setAccreditationFilter] = useState<'all' | 'accredited' | 'pending'>('all');
  const [staffStatusFilter, setStaffStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkUnaccreditModalOpen, setBulkUnaccreditModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; userId?: number; username?: string }>({
    isOpen: false,
  });
  const [reverseConfirm, setReverseConfirm] = useState<{
    isOpen: boolean;
    userId?: number;
    username?: string;
    fullName?: string;
  }>({
    isOpen: false,
  });
  const [editModal, setEditModal] = useState<{ isOpen: boolean; user?: UserOut }>({
    isOpen: false,
  });
  const [selectedUserForDrawer, setSelectedUserForDrawer] = useState<UserOut | null>(null);

  // Disputes state
  const [disputes, setDisputes] = useState<VoterDisputeOut[]>([]);
  const [isDisputesOpen, setIsDisputesOpen] = useState(false);
  const [disputesLoading, setDisputesLoading] = useState(false);

  // Bulk Disqualify Modal state
  const [isDisqualifyModalOpen, setIsDisqualifyModalOpen] = useState(false);
  const [disqualifyFile, setDisqualifyFile] = useState<File | null>(null);
  const [isDisqualifying, setIsDisqualifying] = useState(false);
  const [disqualifyError, setDisqualifyError] = useState('');

  useEffect(() => {
    loadUsers();
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    try {
      setDisputesLoading(true);
      const data = await voterContactAPI.getDisputes();
      setDisputes(data);
    } catch (err: any) {
      console.error('Failed to load disputes', err);
    } finally {
      setDisputesLoading(false);
    }
  };

  const handleResolveDispute = async (disputeId: number, action: 'APPROVE' | 'REJECT') => {
    try {
      await voterContactAPI.resolveDispute(disputeId, { action });
      setSuccess(`Dispute #${disputeId} ${action === 'APPROVE' ? 'approved and voter contact updated' : 'rejected'}.`);
      loadDisputes();
      loadUsers();
    } catch (err: any) {
      setError(err?.data?.detail || err?.message || 'Failed to update dispute');
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await usersAPI.getAll();
      setUsers(data);
      setError('');
    } catch (err: any) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await usersAPI.toggleStatus(userId, !currentStatus);
      setSuccess(`User status updated successfully`);
      loadUsers();
    } catch (err: any) {
      setError('Failed to update user status');
    }
  };

  const handleDelete = async (userId: number) => {
    try {
      await usersAPI.delete(userId);
      setSuccess('User deleted successfully');
      loadUsers();
    } catch (err: any) {
      setError('Failed to delete user');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pageIds = paginatedUsers.map((u) => u.id);
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = new Set(paginatedUsers.map((u) => u.id));
      setSelectedUserIds((prev) => prev.filter((id) => !pageIds.has(id)));
    }
  };

  const handleToggleSelectUser = (userId: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleBulkDeleteUsers = async () => {
    if (!selectedUserIds.length) return;
    setBulkLoading(true);
    try {
      const res = await usersAPI.bulkDelete(selectedUserIds);
      setSuccess(res.message || `Deleted ${selectedUserIds.length} user(s) successfully.`);
      setSelectedUserIds([]);
      setBulkDeleteModalOpen(false);
      loadUsers();
    } catch (err: any) {
      setError(err?.data?.detail || err?.message || 'Failed to bulk delete users');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkUnaccreditUsers = async () => {
    if (!selectedUserIds.length) return;
    setBulkLoading(true);
    try {
      const res = await usersAPI.bulkUnaccredit(selectedUserIds);
      setSuccess(res.message || `Unaccredited ${res.unaccredited_count} voter(s). ${res.skipped_count > 0 ? `${res.skipped_count} voter(s) skipped (already voted).` : ''}`);
      setSelectedUserIds([]);
      setBulkUnaccreditModalOpen(false);
      loadUsers();
    } catch (err: any) {
      setError(err?.data?.detail || err?.message || 'Failed to bulk unaccredit users');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleReverseAccreditation = async (userId: number) => {
    try {
      await usersAPI.reverseAccreditation(userId);
      setSuccess('Accreditation reversed successfully. Voter can now re-accredit.');
      loadUsers();
    } catch (err: any) {
      setError(err?.data?.detail || err?.message || 'Failed to reverse accreditation');
    }
  };

  const handleDisqualifyCSV = async () => {
    if (!disqualifyFile) return;
    setIsDisqualifying(true);
    setDisqualifyError('');
    try {
      const res = await usersAPI.bulkDisqualifyCSV(disqualifyFile);
      setIsDisqualifyModalOpen(false);
      setDisqualifyFile(null);
      setSuccess(
        `Successfully disqualified ${res.disqualified_count} voter(s).${
          res.not_found_count > 0 ? ` (${res.not_found_count} usernames not found in system)` : ''
        }`
      );
      await loadUsers();
    } catch (err: any) {
      setDisqualifyError(err?.data?.detail || err?.message || 'Failed to disqualify voters.');
    } finally {
      setIsDisqualifying(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return users.filter((user) => {
      if (isCurUserAdmin && user.role === 'super-admin') {
        return false;
      }

      const matchesSearch =
        !q ||
        user.username.toLowerCase().includes(q) ||
        user.full_name.toLowerCase().includes(q) ||
        (user.phone && user.phone.includes(q)) ||
        (user.email && user.email.toLowerCase().includes(q)) ||
        (user.staff_file_no && user.staff_file_no.toLowerCase().includes(q)) ||
        (user.staff_station && user.staff_station.toLowerCase().includes(q)) ||
        (user.staff_rank && user.staff_rank.toLowerCase().includes(q));

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && (user.is_active ?? true)) ||
        (statusFilter === 'inactive' && !user.is_active);

      const matchesAccreditation =
        accreditationFilter === 'all' ||
        (accreditationFilter === 'accredited' && user.is_accredited) ||
        (accreditationFilter === 'pending' && !user.is_accredited);

      const matchesStaffStatus =
        staffStatusFilter === 'all' ||
        (staffStatusFilter === 'active' && user.staff_active !== false) ||
        (staffStatusFilter === 'inactive' && user.staff_active === false);

      return matchesSearch && matchesRole && matchesStatus && matchesAccreditation && matchesStaffStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter, accreditationFilter, staffStatusFilter, isCurUserAdmin]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    paginatedItems: paginatedUsers,
  } = usePagination(filteredUsers, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, accreditationFilter, staffStatusFilter, setCurrentPage]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage all users, roles, and permissions.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => usersAPI.downloadCSV({ search: searchTerm, role: roleFilter, status: statusFilter, accreditation: accreditationFilter, staff_status: staffStatusFilter })}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:border-emerald-500 flex items-center gap-2 text-sm shadow-sm"
          >
            <span className="material-symbols-outlined text-sm text-emerald-600">table_view</span>
            Export CSV
          </button>
          <button
            onClick={() => usersAPI.downloadPDF({ search: searchTerm, role: roleFilter, status: statusFilter, accreditation: accreditationFilter, staff_status: staffStatusFilter })}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:border-red-500 flex items-center gap-2 text-sm shadow-sm"
          >
            <span className="material-symbols-outlined text-sm text-red-500">picture_as_pdf</span>
            Export PDF
          </button>
          <button
            onClick={() => {
              setIsDisqualifyModalOpen(true);
              setDisqualifyFile(null);
              setDisqualifyError('');
            }}
            className="px-3.5 py-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 font-medium rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center gap-2 text-sm shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-sm text-red-600">person_off</span>
            Disqualify Voters (CSV)
          </button>
          <button
            onClick={() => {
              loadDisputes();
              setIsDisputesOpen(true);
            }}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:border-amber-500 flex items-center gap-2 text-sm shadow-sm relative"
          >
            <span className="material-symbols-outlined text-sm text-amber-500">report_problem</span>
            Disputes
            {disputes.filter((d) => d.status === 'PENDING').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-xs font-bold bg-amber-500 text-white">
                {disputes.filter((d) => d.status === 'PENDING').length}
              </span>
            )}
          </button>
          <Link
            to="/admin/users/bulk-actions"
            className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-sm"
          >
            Bulk Actions
          </Link>
          <Link
            to="/admin/users/bulk-upload"
            className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-sm"
          >
            Bulk Upload
          </Link>
          <Link
            to="/admin/users/create"
            className="px-3.5 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add User
          </Link>
        </div>
      </div>

      {error && (
        <div className="space-y-3">
          <ErrorAlert message={error} onDismiss={() => setError('')} />
          {(error.toLowerCase().includes('session') ||
            error.toLowerCase().includes('unauthorized') ||
            error.toLowerCase().includes('logged in') ||
            error.toLowerCase().includes('not authenticated') ||
            error.toLowerCase().includes('credentials')) && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 flex flex-wrap items-center justify-between gap-4 animate-scale-in">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-2xl">admin_panel_settings</span>
                <div className="text-sm text-amber-900 dark:text-amber-200">
                  <p className="font-bold">Admin Authentication Required</p>
                  <p className="text-xs text-amber-800 dark:text-amber-300">Your administrator session has timed out. Please sign in again to authorize bulk voter registration.</p>
                </div>
              </div>
              <Link
                to="/admin/login"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shrink-0 shadow-md transition-colors"
              >
                Sign In to Admin Portal
              </Link>
            </div>
          )}
        </div>
      )}
      {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}

      <div className="bg-white dark:bg-[#1a1d29] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden no-print">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[220px] relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400">search</span>
            <input
              type="text"
              placeholder="Search by MCS username, full name, file no, station, rank..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          {/* Filter by Staff Status */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">Staff Status:</label>
            <select
              value={staffStatusFilter}
              onChange={(e) => setStaffStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="all">All Staff Statuses</option>
              <option value="active">Active Staff Only</option>
              <option value="inactive">Inactive Staff Only</option>
            </select>
          </div>

          {/* Filter by Eligibility / Status */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="active">Eligible / Active</option>
              <option value="inactive">Disqualified / Inactive</option>
            </select>
          </div>

          {/* Filter by Accreditation */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">Accreditation:</label>
            <select
              value={accreditationFilter}
              onChange={(e) => setAccreditationFilter(e.target.value as any)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="all">All Accreditation</option>
              <option value="accredited">Accredited</option>
              <option value="pending">Pending / Not Accredited</option>
            </select>
          </div>

          {/* Filter by Role */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">Role:</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="all">All Roles</option>
              <option value="voter">Voters Only</option>
              <option value="agent">Agents Only</option>
              <option value="admin">Admin</option>
              {isSuperAdmin && <option value="super-admin">Super Admin</option>}
            </select>
          </div>

          {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all' || accreditationFilter !== 'all' || staffStatusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
                setStatusFilter('all');
                setAccreditationFilter('all');
                setStaffStatusFilter('all');
              }}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Counter Summary Bar */}
        {!loading && (
          <div className="px-4 py-2 bg-slate-50/70 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>
              Showing <strong className="font-semibold text-slate-700 dark:text-slate-200">{filteredUsers.length}</strong> of{' '}
              <strong className="font-semibold text-slate-700 dark:text-slate-200">{users.length}</strong> total registered users
            </span>
            {(statusFilter !== 'all' || accreditationFilter !== 'all' || roleFilter !== 'all' || staffStatusFilter !== 'all') && (
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">Filtered View Active</span>
            )}
          </div>
        )}

        {/* Bulk Actions Toolbar */}
        {selectedUserIds.length > 0 && (
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-200 dark:border-indigo-800/60 flex flex-wrap items-center justify-between gap-3 animate-fade-in text-xs font-semibold">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
              <span className="material-symbols-outlined text-base">checklist</span>
              <span><b>{selectedUserIds.length}</b> user(s) selected</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={bulkLoading}
                onClick={() => setBulkDeleteModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1 shadow-xs transition-colors"
                title="Bulk delete all selected users"
              >
                <span className="material-symbols-outlined text-sm">delete_forever</span>
                Delete Selected ({selectedUserIds.length})
              </button>
              {selectedUserIds.some(id => users.find(u => u.id === id)?.is_accredited) && (
                <button
                  type="button"
                  disabled={bulkLoading}
                  onClick={() => setBulkUnaccreditModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center gap-1 shadow-xs transition-colors"
                  title="Reverse accreditation for selected voters"
                >
                  <span className="material-symbols-outlined text-sm">undo</span>
                  Unaccredit Selected ({selectedUserIds.filter(id => users.find(u => u.id === id)?.is_accredited).length})
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedUserIds([])}
                className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Deselect All
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <TableSkeleton
            cols={9}
            rows={8}
            headers={['', 'MCS Username', 'Staff Full Name', 'File No', 'Station', 'Rank', 'CONRAISS', 'Staff Status', 'Actions']}
            hasCheckbox={true}
            hasActions={true}
          />
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No users found matching your search criteria.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
                  <tr>
                    <th className="px-4 py-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={paginatedUsers.length > 0 && paginatedUsers.every((u) => selectedUserIds.includes(u.id))}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        title="Select all on this page"
                      />
                    </th>
                    <th className="px-5 py-3">MCS Username</th>
                    <th className="px-5 py-3">Staff Full Name</th>
                    <th className="px-5 py-3">File No</th>
                    <th className="px-5 py-3">Station</th>
                    <th className="px-5 py-3">Rank</th>
                    <th className="px-5 py-3">CONRAISS</th>
                    <th className="px-5 py-3">Staff Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                        selectedUserIds.includes(user.id) ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                      }`}
                      onClick={() => setSelectedUserForDrawer(user)}
                    >
                      <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={() => handleToggleSelectUser(user.id)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                        <div>{user.username}</div>
                        {user.role === 'admin' && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                              Admin
                            </span>
                            {user.admin_login_count && user.admin_login_count > 0 ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300" title="Used single-use admin account">
                                Used (1/1)
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" title="Unused single-use admin account">
                                Unused (Ready)
                              </span>
                            )}
                            {user.current_session_id && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-600 text-white flex items-center gap-1 shadow-sm" title="This admin account is currently logged in">
                                <span className="size-1 rounded-full bg-white animate-ping"></span>
                                Active Now
                              </span>
                            )}
                          </div>
                        )}
                        {user.role === 'super-admin' && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                              Super Admin (Anytime)
                            </span>
                          </div>
                        )}
                        {user.role === 'agent' && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                              Agent
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 font-medium">{user.full_name}</td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{user.staff_file_no || '—'}</td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{user.staff_station || '—'}</td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{user.staff_rank || '—'}</td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{user.staff_conraiss || '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          user.staff_active !== false
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          <span className="material-symbols-outlined text-[14px]">{user.staff_active !== false ? 'check_circle' : 'cancel'}</span>
                          {user.staff_active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {user.role === 'voter' && user.is_accredited && (
                            <button
                              onClick={() =>
                                setReverseConfirm({
                                  isOpen: true,
                                  userId: user.id,
                                  username: user.username,
                                  fullName: user.full_name,
                                })
                              }
                              className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded text-amber-600 dark:text-amber-400"
                              title="Reverse accreditation (allow re-accreditation)"
                            >
                              <span className="material-symbols-outlined text-sm">replay</span>
                            </button>
                          )}
                          <button
                            onClick={() => setEditModal({ isOpen: true, user })}
                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-blue-600 dark:text-blue-400"
                            title="Edit user"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          {user.role === 'admin' && user.admin_login_count && user.admin_login_count > 0 && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (window.confirm(`Reset single-use login for admin "${user.username}"? They will be able to log in once more.`)) {
                                  try {
                                    await usersAPI.resetAdminLogin(user.id);
                                    loadUsers();
                                  } catch (err: any) {
                                    alert(err?.data?.detail || err?.message || 'Failed to reset admin login');
                                  }
                                }
                              }}
                              className="p-1.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded text-purple-600 dark:text-purple-400"
                              title="Reset admin login (allow 1 more login)"
                            >
                              <span className="material-symbols-outlined text-sm">lock_reset</span>
                            </button>
                          )}
                          {user.role === 'admin' && user.current_session_id && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (window.confirm(`Are you sure you want to log out admin "${user.username}"? Their active session will be terminated immediately.`)) {
                                  try {
                                    await usersAPI.logoutAdmin(user.id);
                                    loadUsers();
                                  } catch (err: any) {
                                    alert(err?.data?.detail || err?.message || 'Failed to logout admin');
                                  }
                                }
                              }}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded text-rose-600 dark:text-rose-400"
                              title="Force logout admin session"
                            >
                              <span className="material-symbols-outlined text-sm">logout</span>
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteConfirm({ isOpen: true, userId: user.id, username: user.username })}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500"
                            title="Delete user"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
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
              pageSizeOptions={[10, 25, 50, 100, 250]}
              itemName="users"
            />
          </>
        )}
      </div>

      {/* Slide-in User Detail Drawer */}
      {selectedUserForDrawer && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setSelectedUserForDrawer(null)}
          />
          {/* Drawer panel */}
          <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white dark:bg-[#1a1d29] shadow-2xl z-50 overflow-y-auto animate-slide-in-right">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-[#1a1d29] border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400">person</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedUserForDrawer.full_name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">MCS #{selectedUserForDrawer.username}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForDrawer(null)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Staff Identity Section */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Staff Identity</h4>
                <div className="grid grid-cols-2 gap-4">
                  <DetailItem label="MCS Username" value={selectedUserForDrawer.username} icon="badge" />
                  <DetailItem label="Full Name" value={selectedUserForDrawer.full_name} icon="person" />
                  <DetailItem label="Staff File No" value={selectedUserForDrawer.staff_file_no || '—'} icon="folder_shared" />
                  <DetailItem label="Station" value={selectedUserForDrawer.staff_station || '—'} icon="location_on" />
                  <DetailItem label="Rank" value={selectedUserForDrawer.staff_rank || '—'} icon="military_tech" />
                  <DetailItem label="CONRAISS" value={selectedUserForDrawer.staff_conraiss || '—'} icon="grade" />
                </div>
              </div>

              {/* Contact Section */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Contact Information</h4>
                <div className="grid grid-cols-1 gap-4">
                  <DetailItem label="Phone" value={selectedUserForDrawer.phone || '—'} icon="call" />
                  <DetailItem label="Email" value={selectedUserForDrawer.email || '—'} icon="mail" />
                </div>
              </div>

              {/* Status Section */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Status & Role</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1">Staff Status</p>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      selectedUserForDrawer.staff_active !== false
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      <span className="material-symbols-outlined text-[14px]">{selectedUserForDrawer.staff_active !== false ? 'check_circle' : 'cancel'}</span>
                      {selectedUserForDrawer.staff_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1">Eligibility</p>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      selectedUserForDrawer.is_active
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {selectedUserForDrawer.is_active ? 'Eligible' : 'Disqualified'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1">Accreditation</p>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      selectedUserForDrawer.is_accredited
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {selectedUserForDrawer.is_accredited ? 'Accredited' : 'Pending'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1">Role</p>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase">{selectedUserForDrawer.role}</span>
                  </div>
                  {selectedUserForDrawer.role === 'admin' && (
                    <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 sm:col-span-2">
                      <p className="text-[11px] text-purple-600 dark:text-purple-400 mb-1 font-bold">Admin Live Session</p>
                      {selectedUserForDrawer.current_session_id ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 animate-pulse">
                          <span className="size-2 rounded-full bg-emerald-500"></span>
                          Currently Logged In (Active)
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-500">Not Logged In</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Quick Actions</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setEditModal({ isOpen: true, user: selectedUserForDrawer }); setSelectedUserForDrawer(null); }}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    Edit User
                  </button>
                  <button
                    onClick={() => { handleToggleStatus(selectedUserForDrawer.id, selectedUserForDrawer.is_active ?? true); setSelectedUserForDrawer(null); }}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors flex items-center gap-2 ${
                      selectedUserForDrawer.is_active
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100'
                        : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{selectedUserForDrawer.is_active ? 'block' : 'check_circle'}</span>
                    {selectedUserForDrawer.is_active ? 'Disqualify' : 'Enable'}
                  </button>
                  <button
                    onClick={() => { setDeleteConfirm({ isOpen: true, userId: selectedUserForDrawer.id, username: selectedUserForDrawer.username }); setSelectedUserForDrawer(null); }}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Delete
                  </button>
                  {selectedUserForDrawer.role === 'admin' && selectedUserForDrawer.current_session_id && (
                    <button
                      onClick={async () => {
                        if (window.confirm(`Are you sure you want to log out admin "${selectedUserForDrawer.username}"? Their active session will be terminated immediately.`)) {
                          try {
                            await usersAPI.logoutAdmin(selectedUserForDrawer.id);
                            loadUsers();
                            setSelectedUserForDrawer(null);
                            setSuccess(`Logged out admin "${selectedUserForDrawer.username}" successfully.`);
                          } catch (err: any) {
                            alert(err?.data?.detail || err?.message || 'Failed to logout admin');
                          }
                        }
                      }}
                      className="px-4 py-2 text-sm font-semibold rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">logout</span>
                      Logout Admin
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false })}
        onConfirm={() => deleteConfirm.userId && handleDelete(deleteConfirm.userId)}
        title="Delete User"
        message={`Are you sure you want to delete user "${deleteConfirm.username}"? This action cannot be undone.`}
        confirmText="Delete"
        isDestructive
      />

      <ConfirmDialog
        isOpen={bulkDeleteModalOpen}
        onClose={() => setBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDeleteUsers}
        title="Bulk Delete Users"
        message={`Are you sure you want to permanently delete all ${selectedUserIds.length} selected user(s)? This will cascade delete any votes or records associated with them. The currently active administrator account will not be deleted. This action cannot be undone.`}
        confirmText={bulkLoading ? "Deleting..." : "Delete All Selected"}
        isDestructive
      />

      <ConfirmDialog
        isOpen={bulkUnaccreditModalOpen}
        onClose={() => setBulkUnaccreditModalOpen(false)}
        onConfirm={handleBulkUnaccreditUsers}
        title="Bulk Reverse Accreditation"
        message={`Are you sure you want to reverse accreditation for ${selectedUserIds.filter(id => users.find(u => u.id === id)?.is_accredited).length} selected accredited voter(s)? They will need to re-accredit. Voters who have already cast votes will be skipped automatically.`}
        confirmText={bulkLoading ? "Processing..." : "Unaccredit Selected"}
      />

      <ConfirmDialog
        isOpen={reverseConfirm.isOpen}
        onClose={() => setReverseConfirm({ isOpen: false })}
        onConfirm={() => {
          if (reverseConfirm.userId) {
            handleReverseAccreditation(reverseConfirm.userId);
            setReverseConfirm({ isOpen: false });
          }
        }}
        title="Reverse Voter Accreditation"
        message={`Are you sure you want to reverse accreditation for voter "${reverseConfirm.fullName || ''}" (MCS #${reverseConfirm.username})? Their status will be set back to Pending so they can undergo accreditation again.`}
        confirmText="Reverse Accreditation"
      />

      {editModal.user && (
        <EditUserModal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false })}
          user={editModal.user}
          onUpdate={() => {
            loadUsers();
            setSuccess('User updated successfully');
          }}
        />
      )}

      {/* Voter Disputes Modal */}
      <Modal
        isOpen={isDisputesOpen}
        onClose={() => setIsDisputesOpen(false)}
        title="Voter Contact Disputes"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Review and action contact correction requests submitted by voters for locked details.
          </p>

          {disputesLoading ? (
            <LoadingSpinner size="md" />
          ) : disputes.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No voter contact disputes logged in the system.
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.map((dispute) => (
                <div
                  key={dispute.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {dispute.full_name}
                        </span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          #{dispute.username}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        Category: {dispute.dispute_type} • {new Date(dispute.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        dispute.status === 'RESOLVED'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : dispute.status === 'REJECTED'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                      }`}
                    >
                      {dispute.status}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2 text-xs bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                    <div>
                      <span className="text-slate-400 block">Current on file:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {dispute.current_email || 'No email'} | {dispute.current_phone || 'No phone'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Requested change:</span>
                      <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                        {dispute.requested_email || 'Keep email'} | {dispute.requested_phone || 'Keep phone'}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-lg border border-amber-200/50 dark:border-amber-900/30">
                    <span className="font-bold text-amber-800 dark:text-amber-300 block mb-0.5">Voter Explanation:</span>
                    {dispute.reason}
                  </div>

                  {dispute.status === 'PENDING' && (
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleResolveDispute(dispute.id, 'REJECT')}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleResolveDispute(dispute.id, 'APPROVE')}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[15px]">check</span>
                        Approve & Update Contact
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* BULK DISQUALIFY VIA CSV MODAL */}
      <Modal
        isOpen={isDisqualifyModalOpen}
        onClose={() => {
          setIsDisqualifyModalOpen(false);
          setDisqualifyFile(null);
          setDisqualifyError('');
        }}
        title="Bulk Disqualify Voters by CSV"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Upload a CSV file containing voter usernames (MCS numbers). All matching voters will instantly become Inactive and will be barred from accreditation and voting.
          </p>

          {disqualifyError && <ErrorAlert message={disqualifyError} onDismiss={() => setDisqualifyError('')} />}

          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-red-500 rounded-xl p-6 text-center transition-colors">
            <input
              type="file"
              accept=".csv"
              id="userlist-disqualify-csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setDisqualifyFile(e.target.files[0]);
                  setDisqualifyError('');
                }
              }}
            />
            <label
              htmlFor="userlist-disqualify-csv"
              className="cursor-pointer block space-y-2"
            >
              <span className="material-symbols-outlined text-4xl text-slate-400 dark:text-slate-500 block">
                upload_file
              </span>
              <span className="text-sm font-semibold text-primary dark:text-blue-400">
                {disqualifyFile ? disqualifyFile.name : 'Click to select CSV file'}
              </span>
              <span className="text-xs text-slate-500 block">
                Supported format: .csv (Column: username or MCS number)
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsDisqualifyModalOpen(false);
                setDisqualifyFile(null);
                setDisqualifyError('');
              }}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!disqualifyFile || isDisqualifying}
              onClick={handleDisqualifyCSV}
              className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg flex items-center gap-2 shadow-sm"
            >
              {isDisqualifying ? (
                <>
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Disqualifying...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">person_off</span>
                  Upload & Disqualify Now
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export const CreateUser: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super-admin';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'voter' | 'agent' | 'admin' | 'super-admin'>('voter');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [fileNo, setFileNo] = useState('');
  const [conraiss, setConraiss] = useState('');
  const [station, setStation] = useState('');
  const [password, setPassword] = useState('');
  const [staffActive, setStaffActive] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('MCS Number (Username) is compulsory.');
      return;
    }
    if (!fullName.trim()) {
      setError('Staff Full Name is compulsory.');
      return;
    }
    if (!isSuperAdmin && role === 'super-admin') {
      setError('Only Super Administrators can create Super Admin accounts.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await usersAPI.create({
        username: username.trim(),
        full_name: fullName.trim(),
        role,
        phone: phone.trim() || undefined,
        email: email.trim().toLowerCase() || undefined,
        staff_file_no: fileNo.trim() || undefined,
        staff_conraiss: conraiss.trim() || undefined,
        staff_station: station.trim() || undefined,
        password: password.trim() || undefined,
        staff_active: staffActive,
      });

      setSuccess(`${role === 'admin' ? 'Administrator' : role === 'super-admin' ? 'Super Admin' : role === 'agent' ? 'Contestant Agent' : 'Voter'} created successfully!`);
      setUsername('');
      setFullName('');
      setPhone('');
      setEmail('');
      setFileNo('');
      setConraiss('');
      setStation('');
      setPassword('');
      setRole('voter');
    } catch (err: any) {
      const detail = err?.data?.detail;
      let msg = 'Failed to create user';
      if (typeof detail === 'string') {
        msg = detail;
      } else if (Array.isArray(detail)) {
        msg = detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ');
      } else if (typeof detail === 'object' && detail?.msg) {
        msg = detail.msg;
      } else if (err?.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Create New User / Voter</h1>
        <p className="text-slate-500">Register an individual voter, agent, or administrator into the NECO MCS election system.</p>
      </div>

      {error && (
        <div className="space-y-3 mb-6">
          <ErrorAlert message={error} onDismiss={() => setError('')} />
          {(error.toLowerCase().includes('session') ||
            error.toLowerCase().includes('unauthorized') ||
            error.toLowerCase().includes('logged in') ||
            error.toLowerCase().includes('not authenticated') ||
            error.toLowerCase().includes('credentials')) && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 flex flex-wrap items-center justify-between gap-4 animate-scale-in">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-2xl">admin_panel_settings</span>
                <div className="text-sm text-amber-900 dark:text-amber-200">
                  <p className="font-bold">Admin Authentication Required</p>
                  <p className="text-xs text-amber-800 dark:text-amber-300">Your administrator session has timed out. Please sign in again to authorize registration.</p>
                </div>
              </div>
              <Link
                to="/admin/login"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shrink-0 shadow-md transition-colors"
              >
                Sign In to Admin Portal
              </Link>
            </div>
          )}
        </div>
      )}
      {success && <div className="mb-6"><SuccessAlert message={success} onDismiss={() => setSuccess('')} /></div>}

      <div className="bg-white dark:bg-[#1a1d29] p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Compulsory Fields Notice */}
          <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-blue-600 dark:text-blue-400">info</span>
              <span><strong>Compulsory Fields:</strong> MCS Number, Full Name, and Role. All other fields are optional.</span>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">* Required</span>
          </div>

          {/* Compulsory Identity Fields */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                MCS Number (Username) <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                placeholder={role === 'agent' ? 'e.g. agent_apc' : 'e.g. 2668 or staff MCS number'}
              />
              <p className="text-xs text-slate-500 mt-1">Unique staff username used for voting and accreditation</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                User Role <span className="text-red-500 font-bold">*</span>
              </label>
              <select
                required
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium"
              >
                <option value="voter">Voter (Standard Voter Account)</option>
                <option value="agent">Agent (Live Election Monitor Portal)</option>
                <option value="admin">Admin (Election Manager)</option>
                {isSuperAdmin && <option value="super-admin">Super Admin (Full System Access)</option>}
              </select>
              <p className="text-xs text-slate-500 mt-1">Permissions assigned to this account</p>
              {role === 'admin' && (
                <div className="mt-2 p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-[11px] text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-purple-600 dark:text-purple-400">lock_clock</span>
                  <span><strong>Single-Use Admin:</strong> Admin accounts created by Super Admin can only log in once for security. Super Admin can log in at anytime.</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">
              Staff Full Name <span className="text-red-500 font-bold">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none font-semibold"
              placeholder="e.g. Ibrahim Abubakar"
            />
          </div>

          {/* Optional Contact Details */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Contact Details (Optional)
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none font-mono"
                  placeholder="e.g. 08012345678"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                  placeholder="e.g. user@neco.gov.ng"
                />
              </div>
            </div>
          </div>

          {/* Optional Staff Registry Details */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Staff Registry Details (Optional)
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                  Staff File Number (Optional)
                </label>
                <input
                  type="text"
                  value={fileNo}
                  onChange={(e) => setFileNo(e.target.value)}
                  className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                  placeholder="e.g. P/12345"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                  CONRAISS (Optional)
                </label>
                <input
                  type="text"
                  value={conraiss}
                  onChange={(e) => setConraiss(e.target.value)}
                  className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                  placeholder="e.g. CONRAISS 12"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                  Station / Dept (Optional)
                </label>
                <input
                  type="text"
                  value={station}
                  onChange={(e) => setStation(e.target.value)}
                  className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                  placeholder="e.g. Minna HQ"
                />
              </div>
            </div>
          </div>

          {/* Security & Password */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="grid sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                  Password (Optional)
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                  placeholder={role === 'agent' ? 'Set password (e.g. agent2026)' : 'Leave empty for default role password'}
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {role === 'agent' ? 'Agents log in with username and password alone (no OTP).' : 'Defaults to role default password (e.g. voter123 / admin123).'}
                </p>
              </div>

              <div className="pt-2 sm:pt-4">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={staffActive}
                    onChange={(e) => setStaffActive(e.target.checked)}
                    className="size-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <div className="text-sm">
                    <span className="font-semibold text-slate-900 dark:text-white block">Staff Active Status</span>
                    <span className="text-xs text-slate-500">Uncheck to mark staff as inactive</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Link
              to="/admin/users"
              className="px-6 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const BulkUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [skippedDetails, setSkippedDetails] = useState<Array<{ username: string; full_name?: string; reason: string }>>([]);
  const [createdCount, setCreatedCount] = useState<number | null>(null);
  const [existingCount, setExistingCount] = useState<number>(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setSuccess('');
      setSkippedDetails([]);
      setCreatedCount(null);
      setExistingCount(0);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setSkippedDetails([]);
    setCreatedCount(null);
    setExistingCount(0);

    try {
      const res = await usersAPI.uploadCSV(file);
      setCreatedCount(res.created);

      const rawSkipped = res.skipped_details || [];
      setSkippedDetails(rawSkipped);
      setExistingCount(rawSkipped.length);

      if (rawSkipped.length > 0) {
        setSuccess(
          `Import finished: ${res.created} new voter(s) successfully added. ${rawSkipped.length} record(s) were safely skipped (duplicate MCS numbers, duplicate Staff File numbers, or email conflicts prevented).`
        );
      } else if (res.created > 0) {
        setSuccess(
          `Upload complete: All ${res.created} new voter(s) successfully registered with zero duplicates or conflicts.`
        );
      } else {
        setSuccess(
          `No new voters were registered. All records in this file were skipped due to existing MCS numbers or duplicate File numbers.`
        );
      }
      setFile(null);
    } catch (err: any) {
      setError(err?.data?.detail || err?.message || 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const downloadSkippedReport = () => {
    if (!skippedDetails.length) return;
    const header = "MCS Number,Full Name,Failure Reason\n";
    const rows = skippedDetails.map(item => `"${item.username}","${item.full_name || ''}","${item.reason.replace(/"/g, '""')}"`).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voter_upload_skipped_report.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Bulk Upload Voters</h1>
        <p className="text-slate-500">Upload a CSV file containing voter records into the system.</p>
      </div>

      {error && (
        <div className="space-y-3">
          <ErrorAlert message={error} onDismiss={() => setError('')} />
          {(error.toLowerCase().includes('session') ||
            error.toLowerCase().includes('unauthorized') ||
            error.toLowerCase().includes('logged in') ||
            error.toLowerCase().includes('not authenticated') ||
            error.toLowerCase().includes('credentials')) && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 flex flex-wrap items-center justify-between gap-4 animate-scale-in">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-2xl">admin_panel_settings</span>
                <div className="text-sm text-amber-900 dark:text-amber-200">
                  <p className="font-bold">Admin Authentication Required</p>
                  <p className="text-xs text-amber-800 dark:text-amber-300">Your administrator session has timed out. Please sign in again to authorize bulk voter registration.</p>
                </div>
              </div>
              <Link
                to="/admin/login"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shrink-0 shadow-md transition-colors"
              >
                Sign In to Admin Portal
              </Link>
            </div>
          )}
        </div>
      )}
      {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}

      {/* Info notice for existing voters */}
      {existingCount > 0 && skippedDetails.length === 0 && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-center gap-3 text-sm text-blue-800 dark:text-blue-300 shadow-sm animate-scale-in">
          <span className="material-symbols-outlined text-blue-600 text-xl">info</span>
          <div>
            <p className="font-semibold">All existing voters preserved</p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
              {existingCount} voter(s) in this file are already registered in the database and were safely skipped.
            </p>
          </div>
        </div>
      )}

      {/* DETAILED ALERT FOR SKIPPED RECORDS (DUPLICATE MCS NUMBERS, FILE NUMBERS, EMAILS) */}
      {skippedDetails.length > 0 && (
        <div className="p-5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700 space-y-4 animate-scale-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-2xl">warning</span>
              <h3 className="font-bold text-amber-900 dark:text-amber-300 text-lg">
                Upload Notice: {skippedDetails.length} Record(s) Skipped Due to Constraints
              </h3>
            </div>
            <button
              onClick={downloadSkippedReport}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Download Skipped Records Report (.CSV)
            </button>
          </div>

          <p className="text-sm text-amber-800 dark:text-amber-400">
            The following records were skipped because their <strong>MCS Number (Username)</strong> or <strong>Staff File Number</strong> is already assigned in the system or duplicated within the file. Duplicate MCS numbers and File numbers are strictly rejected.
          </p>

          <div className="max-h-72 overflow-y-auto rounded-lg border border-amber-200 dark:border-amber-800/50 bg-white dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead className="bg-amber-100/70 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 text-xs uppercase font-semibold sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">MCS Number</th>
                  <th className="px-4 py-2.5">Full Name</th>
                  <th className="px-4 py-2.5">Failure Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 dark:divide-amber-900/30 font-medium">
                {skippedDetails.map((item, idx) => (
                  <tr key={idx} className="hover:bg-amber-50/50 dark:hover:bg-amber-950/20">
                    <td className="px-4 py-2 text-slate-900 dark:text-white font-mono text-xs">{item.username}</td>
                    <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{item.full_name || '—'}</td>
                    <td className="px-4 py-2 text-red-600 dark:text-red-400 text-xs">{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#1a1d29] border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-12 text-center hover:border-primary transition-colors">
        <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4 block">
          cloud_upload
        </span>
        <h3 className="text-lg font-medium mb-2">
          {file ? file.name : 'Select your CSV file'}
        </h3>
        <p className="text-slate-500 text-sm mb-6">CSV format with required columns</p>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          id="csv-upload"
        />
        <label
          htmlFor="csv-upload"
          className="inline-block px-4 py-2 bg-primary/10 text-primary font-medium rounded-lg hover:bg-primary/20 cursor-pointer"
        >
          Select File
        </label>
        {file && (
          <button
            onClick={handleUpload}
            disabled={loading}
            className="ml-3 btn-primary disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        )}
      </div>

      <div className="mt-8">
        <h3 className="font-bold mb-4">Instructions</h3>
        <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li>File must be in CSV format.</li>
          <li>Supported headers: username (or mcs_number), full_name, phone, email, role, password</li>
          <li>Duplicate usernames or duplicate emails are skipped to preserve system integrity.</li>
          <li>Max file size is 10MB.</li>
        </ul>
      </div>
    </div>
  );
};

export const BulkActions: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Bulk Disqualify state
  const [disqualifyFile, setDisqualifyFile] = useState<File | null>(null);
  const [disqualifyLoading, setDisqualifyLoading] = useState(false);
  const [disqualifyResult, setDisqualifyResult] = useState<{
    disqualified_count: number;
    not_found_count: number;
    not_found_usernames: string[];
  } | null>(null);

  const handleEnableAll = async () => {
    if (!window.confirm('Are you sure you want to enable voting access for ALL registered voters?')) return;
    setLoading(true);
    setError('');
    try {
      await usersAPI.enableAllVoters();
      setSuccess('All voters enabled successfully');
    } catch (err: any) {
      setError('Failed to enable voters');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableAll = async () => {
    if (!window.confirm('Warning: Are you sure you want to disable voting access for ALL registered voters?')) return;
    setLoading(true);
    setError('');
    try {
      await usersAPI.disableAllVoters();
      setSuccess('All voters disabled successfully');
    } catch (err: any) {
      setError('Failed to disable voters');
    } finally {
      setLoading(false);
    }
  };

  const handleDisqualifyUpload = async () => {
    if (!disqualifyFile) {
      setError('Please select a CSV file containing voter usernames to disqualify.');
      return;
    }

    if (!window.confirm(`Are you sure you want to disqualify all voters listed in "${disqualifyFile.name}"? They will become Inactive and ineligible to vote.`)) {
      return;
    }

    setDisqualifyLoading(true);
    setError('');
    setSuccess('');
    setDisqualifyResult(null);

    try {
      const res = await usersAPI.bulkDisqualifyCSV(disqualifyFile);
      setDisqualifyResult({
        disqualified_count: res.disqualified_count,
        not_found_count: res.not_found_count,
        not_found_usernames: res.not_found_usernames || [],
      });
      setSuccess(`Disqualification complete: ${res.disqualified_count} voter(s) successfully disqualified (set to Inactive).`);
      setDisqualifyFile(null);
    } catch (err: any) {
      setError(err?.data?.detail || err?.message || 'Failed to disqualify voters from CSV.');
    } finally {
      setDisqualifyLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black mb-2 text-slate-900 dark:text-white">
          Bulk Voter Status Management
        </h1>
        <p className="text-slate-500">
          Manage voting eligibility and account statuses in bulk via mass actions or CSV upload.
        </p>
      </div>

      {error && (
        <div className="space-y-3">
          <ErrorAlert message={error} onDismiss={() => setError('')} />
          {(error.toLowerCase().includes('session') ||
            error.toLowerCase().includes('unauthorized') ||
            error.toLowerCase().includes('logged in') ||
            error.toLowerCase().includes('not authenticated') ||
            error.toLowerCase().includes('credentials')) && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 flex flex-wrap items-center justify-between gap-4 animate-scale-in">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-2xl">admin_panel_settings</span>
                <div className="text-sm text-amber-900 dark:text-amber-200">
                  <p className="font-bold">Admin Authentication Required</p>
                  <p className="text-xs text-amber-800 dark:text-amber-300">Your administrator session has timed out. Please sign in again to authorize bulk voter registration.</p>
                </div>
              </div>
              <Link
                to="/admin/login"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shrink-0 shadow-md transition-colors"
              >
                Sign In to Admin Portal
              </Link>
            </div>
          )}
        </div>
      )}
      {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}

      {/* SECTION 1: BULK DISQUALIFY VIA CSV (Requirement 5) */}
      <div className="bg-white dark:bg-[#1a1d29] p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
            <span className="material-symbols-outlined">person_off</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Bulk Disqualify Voters by CSV
            </h2>
            <p className="text-sm text-slate-500">
              Upload a CSV file containing usernames (MCS numbers) of voters to be disqualified (set to Inactive / Ineligible).
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4">
          <input
            type="file"
            accept=".csv"
            id="bulk-disqualify-csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setDisqualifyFile(e.target.files[0]);
                setError('');
                setSuccess('');
                setDisqualifyResult(null);
              }
            }}
          />
          <label
            htmlFor="bulk-disqualify-csv"
            className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium rounded-lg text-sm cursor-pointer whitespace-nowrap transition-colors"
          >
            {disqualifyFile ? 'Change File' : 'Select Usernames CSV'}
          </label>
          <span className="text-sm text-slate-600 dark:text-slate-400 truncate flex-1">
            {disqualifyFile ? disqualifyFile.name : 'No file chosen (CSV with usernames)'}
          </span>
          <button
            onClick={handleDisqualifyUpload}
            disabled={!disqualifyFile || disqualifyLoading}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {disqualifyLoading ? 'Processing...' : 'Disqualify Voters'}
          </button>
        </div>

        {disqualifyResult && (
          <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              {disqualifyResult.disqualified_count} voter(s) successfully marked as Inactive.
            </div>
            {disqualifyResult.not_found_count > 0 && (
              <div className="text-amber-700 dark:text-amber-400">
                <span className="font-semibold">{disqualifyResult.not_found_count}</span> username(s) from the CSV were not found in the system:
                <p className="mt-1 font-mono text-xs max-h-20 overflow-y-auto bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded">
                  {disqualifyResult.not_found_usernames.join(', ')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2: GLOBAL STATUS SWITCH */}
      <div className="bg-white dark:bg-[#1a1d29] p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
        <div className="flex items-start gap-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
          <span className="material-symbols-outlined text-amber-600">warning</span>
          <div>
            <h3 className="font-bold text-amber-800 dark:text-amber-500">
              Warning: Proceed with extreme caution.
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-600 mt-1">
              These actions will affect all voter accounts in the system simultaneously.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={handleEnableAll}
            disabled={loading}
            className="w-full py-3 px-4 bg-primary text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Enable All Voters
          </button>
          <button
            onClick={handleDisableAll}
            disabled={loading}
            className="w-full py-3 px-4 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            Disable All Voters
          </button>
        </div>
      </div>
    </div>
  );
};

