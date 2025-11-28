import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { officesAPI, OfficeResponse } from '../api';
import { LoadingSpinner, ErrorAlert, SuccessAlert, ConfirmDialog, Modal } from '../components/UIComponents';

const EditOfficeModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    office: OfficeResponse;
    onUpdate: () => void;
}> = ({ isOpen, onClose, office, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [description, setDescription] = useState(office.description);

    useEffect(() => {
        setDescription(office.description);
    }, [office]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await officesAPI.update(office.id, { office_code: office.office_code, description });
            onUpdate();
            onClose();
        } catch (err: any) {
            setError(err?.data?.detail || 'Failed to update office');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Office">
            {error && <div className="mb-4"><ErrorAlert message={error} /></div>}
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">Office Code</label>
                    <input
                        type="text"
                        value={office.office_code}
                        disabled
                        className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">Description</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-300 bg-white dark:bg-white text-slate-900 dark:text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 outline-none"
                        placeholder="e.g. President"
                        required
                    />
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

export const OfficeManagement: React.FC = () => {
    const [offices, setOffices] = useState<OfficeResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; officeId?: number; officeName?: string }>({
        isOpen: false,
    });
    const [editModal, setEditModal] = useState<{ isOpen: boolean; office?: OfficeResponse }>({
        isOpen: false,
    });

    useEffect(() => {
        loadOffices();
    }, []);

    const loadOffices = async () => {
        try {
            setLoading(true);
            const data = await officesAPI.getAll();
            setOffices(data);
            setError('');
        } catch (err: any) {
            setError('Failed to load offices');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (officeId: number) => {
        try {
            await officesAPI.delete(officeId);
            setSuccess('Office deleted successfully');
            loadOffices();
        } catch (err: any) {
            setError('Failed to delete office');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Office Management</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage electoral offices and positions.</p>
                </div>
                <Link
                    to="/admin/offices/create"
                    className="px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Add Office
                </Link>
            </div>

            {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
            {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}

            <div className="bg-white dark:bg-[#1a1d29] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {loading ? (
                    <LoadingSpinner />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Office Code</th>
                                    <th className="px-6 py-3">Description</th>
                                    <th className="px-6 py-3">Created</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {offices.map((office) => (
                                    <tr key={office.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-slate-900 dark:text-white font-medium">
                                            {office.office_code}
                                        </td>
                                        <td className="px-6 py-4">{office.description}</td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {new Date(office.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => setEditModal({ isOpen: true, office })}
                                                    className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-blue-600 dark:text-blue-400"
                                                    title="Edit office"
                                                >
                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setDeleteConfirm({ isOpen: true, officeId: office.id, officeName: office.description })
                                                    }
                                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500"
                                                    title="Delete office"
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

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false })}
                onConfirm={() => deleteConfirm.officeId && handleDelete(deleteConfirm.officeId)}
                title="Delete Office"
                message={`Are you sure you want to delete office "${deleteConfirm.officeName}"? This action cannot be undone.`}
                confirmText="Delete"
                isDestructive
            />

            {editModal.office && (
                <EditOfficeModal
                    isOpen={editModal.isOpen}
                    onClose={() => setEditModal({ isOpen: false })}
                    office={editModal.office}
                    onUpdate={() => {
                        loadOffices();
                        setSuccess('Office updated successfully');
                    }}
                />
            )}
        </div>
    );
};

export const CreateOffice: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const form = e.target as HTMLFormElement;
        const office_code = (form.elements.namedItem('office_code') as HTMLInputElement).value.trim();
        const description = (form.elements.namedItem('description') as HTMLInputElement).value.trim();

        try {
            await officesAPI.create({ office_code, description });
            setSuccess('Office created successfully!');
            form.reset();
        } catch (err: any) {
            setError(err?.data?.detail || 'Failed to create office');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Create New Office</h1>
                <p className="text-slate-500">Add a new electoral office or position.</p>
            </div>

            {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
            {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}

            <div className="bg-white dark:bg-[#1a1d29] p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">Office Code</label>
                        <input
                            type="text"
                            name="office_code"
                            required
                            className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-300 bg-white dark:bg-white text-slate-900 dark:text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 outline-none"
                            placeholder="e.g. PRES, GOV, SEN"
                        />
                        <p className="text-xs text-slate-500 mt-1">Unique identifier for this office</p>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">Description</label>
                        <input
                            type="text"
                            name="description"
                            required
                            className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-300 bg-white dark:bg-white text-slate-900 dark:text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 outline-none"
                            placeholder="e.g. President, Governor, Senator"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Link
                            to="/admin/offices"
                            className="px-6 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            Cancel
                        </Link>
                        <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                            {loading ? 'Creating...' : 'Create Office'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};