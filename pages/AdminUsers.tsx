import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersAPI, UserOut, UserUpdate } from '../api';
import { LoadingSpinner, ErrorAlert, SuccessAlert, ConfirmDialog, Modal } from '../components/UIComponents';

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
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; userId?: number; username?: string }>({
    isOpen: false,
  });
  const [resetConfirm, setResetConfirm] = useState<{ isOpen: boolean; username?: string }>({
    isOpen: false,
  });
  const [editModal, setEditModal] = useState<{ isOpen: boolean; user?: UserOut }>({
    isOpen: false,
  });

  useEffect(() => {
    loadUsers();
  }, []);

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

  const handleResetPassword = async (username: string) => {
    try {
      await usersAPI.resetPassword(username);
      setSuccess(`Password for ${username} reset to Vote@123`);
    } catch (err: any) {
      setError('Failed to reset password');
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage all users, roles, and permissions.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
            Download Voters List
          </button>
          <Link
            to="/admin/users/bulk-actions"
            className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Bulk Actions
          </Link>
          <Link
            to="/admin/users/bulk-upload"
            className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Bulk Upload
          </Link>
          <Link
            to="/admin/users/create"
            className="px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add User
          </Link>
        </div>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
      {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}

      <div className="bg-white dark:bg-[#1a1d29] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden no-print">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex gap-4">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400">search</span>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="all">All Roles</option>
            <option value="super-admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="voter">Voter</option>
          </select>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Username</th>
                  <th className="px-6 py-3">Full Name</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-500">{user.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{user.username}</td>
                    <td className="px-6 py-4">{user.full_name}</td>
                    <td className="px-6 py-4 capitalize">{user.role.replace('-', ' ')}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(user.id, user.is_active ?? true)}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditModal({ isOpen: true, user })}
                          className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-blue-600 dark:text-blue-400"
                          title="Edit user"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button
                          onClick={() => setResetConfirm({ isOpen: true, username: user.username })}
                          className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded text-amber-600 dark:text-amber-400"
                          title="Reset Password"
                        >
                          <span className="material-symbols-outlined text-sm">lock_reset</span>
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
        isOpen={resetConfirm.isOpen}
        onClose={() => setResetConfirm({ isOpen: false })}
        onConfirm={() => resetConfirm.username && handleResetPassword(resetConfirm.username)}
        title="Reset Password"
        message={`Are you sure you want to reset the password for "${resetConfirm.username}"? It will be set to 'Vote@123'.`}
        confirmText="Reset Password"
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
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
      if (role === 'admin') {
        await usersAPI.createAdmin({ username, password });
      } else {
        await usersAPI.createVoter({ username, password });
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
              placeholder="e.g. jane.doe"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">Password</label>
            <input
              type="password"
              name="password"
              required
              className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-300 bg-white dark:bg-white text-slate-900 dark:text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 outline-none"
              placeholder="Enter password"
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await usersAPI.uploadCSV(file);
      setSuccess('Voters uploaded successfully!');
      setFile(null);
    } catch (err: any) {
      setError(err?.data?.detail || 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Bulk Upload Voters</h1>
        <p className="text-slate-500">Upload a CSV file containing voter records.</p>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
      {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}

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
          <li>Required columns: username, fullname, phone, role, password</li>
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

  const handleEnableAll = async () => {
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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2 text-slate-900 dark:text-white">
          Bulk Voter Status Management
        </h1>
        <p className="text-slate-500">
          Use these actions to enable or disable voting access for all registered voters simultaneously.
        </p>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
      {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}

      <div className="bg-white dark:bg-[#1a1d29] p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex items-start gap-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
          <span className="material-symbols-outlined text-amber-600">warning</span>
          <div>
            <h3 className="font-bold text-amber-800 dark:text-amber-500">
              Warning: Proceed with extreme caution.
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-600 mt-1">
              These actions will affect all voter accounts in the system.
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