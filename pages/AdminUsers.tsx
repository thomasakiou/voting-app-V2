import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { usersAPI, voterContactAPI, UserOut, UserUpdate, VoterDisputeOut } from '../api';
import { LoadingSpinner, ErrorAlert, SuccessAlert, ConfirmDialog, Modal, TablePagination, usePagination } from '../components/UIComponents';

const EditUserModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  user: UserOut;
  onUpdate: () => void;
}> = ({ isOpen, onClose, user, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fullName, setFullName] = useState(user.full_name);
  const [role, setRole] = useState<'super-admin' | 'admin' | 'voter'>(user.role);

  useEffect(() => {
    setFullName(user.full_name);
    setRole(user.role);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await usersAPI.update(user.id, { full_name: fullName, role });
      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err?.data?.detail || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User">
      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">Username</label>
          <input
            type="text"
            value={user.username}
            disabled
            className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-300 bg-white dark:bg-white text-slate-900 dark:text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 outline-none"
            placeholder="Enter full name"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-300 bg-white dark:bg-white text-slate-900 dark:text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 outline-none"
          >
            <option value="voter">Voter</option>
            <option value="admin">Admin</option>
            <option value="super-admin">Super Admin</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200 border border-slate-200 dark:border-slate-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

export const UserList: React.FC = () => {
  const [users, setUsers] = useState<UserOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [accreditationFilter, setAccreditationFilter] = useState<'all' | 'accredited' | 'pending'>('all');
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
      const matchesSearch =
        !q ||
        user.username.toLowerCase().includes(q) ||
        user.full_name.toLowerCase().includes(q) ||
        (user.phone && user.phone.includes(q)) ||
        (user.email && user.email.toLowerCase().includes(q));

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && (user.is_active ?? true)) ||
        (statusFilter === 'inactive' && !user.is_active);

      const matchesAccreditation =
        accreditationFilter === 'all' ||
        (accreditationFilter === 'accredited' && user.is_accredited) ||
        (accreditationFilter === 'pending' && !user.is_accredited);

      return matchesSearch && matchesRole && matchesStatus && matchesAccreditation;
    });
  }, [users, searchTerm, roleFilter, statusFilter, accreditationFilter]);

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
  }, [searchTerm, roleFilter, statusFilter, accreditationFilter, setCurrentPage]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage all users, roles, and permissions.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => usersAPI.downloadCSV({ search: searchTerm, role: roleFilter, status: statusFilter, accreditation: accreditationFilter })}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:border-emerald-500 flex items-center gap-2 text-sm shadow-sm"
          >
            <span className="material-symbols-outlined text-sm text-emerald-600">table_view</span>
            Export CSV
          </button>
          <button
            onClick={() => usersAPI.downloadPDF({ search: searchTerm, role: roleFilter, status: statusFilter, accreditation: accreditationFilter })}
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

      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
      {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}

      <div className="bg-white dark:bg-[#1a1d29] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden no-print">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[220px] relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400">search</span>
            <input
              type="text"
              placeholder="Search by MCS username, full name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none"
            />
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
              <option value="admin">Admin</option>
              <option value="super-admin">Super Admin</option>
            </select>
          </div>

          {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all' || accreditationFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
                setStatusFilter('all');
                setAccreditationFilter('all');
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
            {(statusFilter !== 'all' || accreditationFilter !== 'all' || roleFilter !== 'all') && (
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">Filtered View Active</span>
            )}
          </div>
        )}

        {loading ? (
          <LoadingSpinner />
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
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">MCS Username</th>
                    <th className="px-5 py-3">Full Name</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3">Accreditation</th>
                    <th className="px-5 py-3">Eligibility / Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-5 py-4 font-mono text-slate-500 text-xs">{user.id}</td>
                      <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">{user.username}</td>
                      <td className="px-5 py-4 font-medium">{user.full_name}</td>
                      <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300">
                        <div>{user.phone || <span className="text-slate-400 italic">No phone</span>}</div>
                        <div className="text-slate-400">{user.email || <span className="italic">No email</span>}</div>
                      </td>
                      <td className="px-5 py-4">
                        {user.role === 'voter' ? (
                          user.is_accredited ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                                <span className="material-symbols-outlined text-[14px]">check</span>
                                Accredited
                              </span>
                              <button
                                onClick={() =>
                                  setReverseConfirm({
                                    isOpen: true,
                                    userId: user.id,
                                    username: user.username,
                                    fullName: user.full_name,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800 transition-colors"
                                title="Reverse accreditation so this voter can re-accredit"
                              >
                                <span className="material-symbols-outlined text-[13px]">replay</span>
                                Reverse
                              </button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              <span className="material-symbols-outlined text-[14px]">pending</span>
                              Pending
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-slate-400 uppercase font-semibold">Admin</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggleStatus(user.id, user.is_active ?? true)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                            user.is_active
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-red-100 hover:text-red-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700'
                              : 'bg-red-100 text-red-800 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-red-900/30 dark:text-red-400 border border-red-300 dark:border-red-700'
                          }`}
                          title={user.is_active ? 'Click to Disqualify / Disable voter' : 'Click to Qualify / Enable voter'}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {user.is_active ? 'check_circle' : 'block'}
                          </span>
                          {user.is_active ? 'Active (Eligible)' : 'Disqualified'}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-1">
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

      {/* Print View - Voters Only */}
      <div className="print-only">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Registered Voters List</h1>
          <p className="text-sm text-slate-500">Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        </div>
        <table className="w-full text-left text-sm border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 px-4 py-2">ID</th>
              <th className="border border-slate-300 px-4 py-2">Username</th>
              <th className="border border-slate-300 px-4 py-2">Full Name</th>
              <th className="border border-slate-300 px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.filter(u => u.role === 'voter').map((user) => (
              <tr key={user.id}>
                <td className="border border-slate-300 px-4 py-2">{user.id}</td>
                <td className="border border-slate-300 px-4 py-2">{user.username}</td>
                <td className="border border-slate-300 px-4 py-2">{user.full_name}</td>
                <td className="border border-slate-300 px-4 py-2">{user.is_active ? 'Active' : 'Inactive'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-8 text-xs text-slate-400 text-center">
          SecureVote System - Confidential Document
        </div>
      </div>

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [role, setRole] = useState<'admin' | 'voter'>('voter');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = e.target as HTMLFormElement;
    const username = (form.elements.namedItem('username') as HTMLInputElement).value.trim();
    try {
      if (role === 'admin') {
        await usersAPI.createAdmin({ username });
      } else {
        await usersAPI.createVoter({ username });
      }
      setSuccess('User created successfully!');
      form.reset();
    } catch (err: any) {
      setError(err?.data?.detail || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Create New User</h1>
        <p className="text-slate-500">Fill in the details to add a new user to the system.</p>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
      {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}

      <div className="bg-white dark:bg-[#1a1d29] p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">Username</label>
            <input
              type="text"
              name="username"
              required
              className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-300 bg-white dark:bg-white text-slate-900 dark:text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 outline-none"
              placeholder="e.g. 2668"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'voter')}
              className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-300 bg-white dark:bg-white text-slate-900 dark:text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 outline-none"
            >
              <option value="voter">Voter</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setSuccess('');
      setSkippedDetails([]);
      setCreatedCount(null);
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

  try {
    const res = await usersAPI.uploadCSV(file);
    setCreatedCount(res.created);
    if (res.skipped > 0) {
      setSkippedDetails(res.skipped_details || []);
      setSuccess(`Import completed: ${res.created} voter(s) successfully registered.`);
    } else {
      setSuccess(`All ${res.created} voter(s) successfully uploaded without errors!`);
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
    a.download = 'voter_upload_failures.csv';
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

      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
      {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}

      {/* DETAILED ALERT FOR SKIPPED / FAILED ROWS (Requirement 6) */}
      {skippedDetails.length > 0 && (
        <div className="p-5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-2xl">warning</span>
              <h3 className="font-bold text-amber-900 dark:text-amber-300 text-lg">
                Upload Warning: {skippedDetails.length} Row(s) Were Not Uploaded
              </h3>
            </div>
            <button
              onClick={downloadSkippedReport}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Download Failure Report (.CSV)
            </button>
          </div>

          <p className="text-sm text-amber-800 dark:text-amber-400">
            The following voter records could not be imported. Review the failure reasons below to correct your CSV:
          </p>

          <div className="max-h-72 overflow-y-auto rounded-lg border border-amber-200 dark:border-amber-800/50 bg-white dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead className="bg-amber-100/70 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 text-xs uppercase font-semibold sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">MCS Number</th>
                  <th className="px-4 py-2.5">Full Name</th>
                  <th className="px-4 py-2.5">Failure / Skip Reason</th>
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

      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
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

