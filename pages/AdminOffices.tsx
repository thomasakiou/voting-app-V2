import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { officesAPI, OfficeResponse } from '../api';
import { LoadingSpinner, ErrorAlert, SuccessAlert, ConfirmDialog, Modal, TablePagination, usePagination } from '../components/UIComponents';

const EditOfficeModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    office: OfficeResponse;
    onUpdate: () => void;
}> = ({ isOpen, onClose, office, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [description, setDescription] = useState(office.description);
    const [maxVotes, setMaxVotes] = useState<number>(office.max_votes || 1);

    useEffect(() => {
        setDescription(office.description);
        setMaxVotes(office.max_votes || 1);
    }, [office]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await officesAPI.update(office.id, {
                office_code: office.office_code,
                description,
                max_votes: Number(maxVotes) || 1,
            });
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
                <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                        Allowed Candidate Selections (Max Votes)
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="20"
                        value={maxVotes}
                        onChange={(e) => setMaxVotes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-300 bg-white dark:bg-white text-slate-900 dark:text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 outline-none"
                        required
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        How many unique candidates a voter can pick for this contest. Default is 1 for single-winner offices (e.g. President), or 2+ for committee/trustee seats.
                    </p>
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
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disqualified'>('all');
    const [selectedOfficeIds, setSelectedOfficeIds] = useState<number[]>([]);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
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

    const handleToggleDisqualify = async (officeId: number, currentDisqualified: boolean) => {
        try {
            await officesAPI.disqualify(officeId, !currentDisqualified);
            setSuccess(`Office ${!currentDisqualified ? 'disqualified' : 'reinstated'} successfully`);
            loadOffices();
        } catch (err: any) {
            setError(err?.data?.detail || 'Failed to update office status');
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

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const pageIds = paginatedOffices.map((o) => o.id);
            setSelectedOfficeIds((prev) => Array.from(new Set([...prev, ...pageIds])));
        } else {
            const pageIds = new Set(paginatedOffices.map((o) => o.id));
            setSelectedOfficeIds((prev) => prev.filter((id) => !pageIds.has(id)));
        }
    };

    const handleToggleSelect = (officeId: number) => {
        setSelectedOfficeIds((prev) =>
            prev.includes(officeId) ? prev.filter((id) => id !== officeId) : [...prev, officeId]
        );
    };

    const handleBulkDelete = async () => {
        if (!selectedOfficeIds.length) return;
        setBulkLoading(true);
        try {
            const res = await officesAPI.bulkDelete(selectedOfficeIds);
            setSuccess(res.message || `Deleted ${selectedOfficeIds.length} office(s) successfully.`);
            setSelectedOfficeIds([]);
            setBulkDeleteModalOpen(false);
            loadOffices();
        } catch (err: any) {
            setError(err?.data?.detail || 'Failed to bulk delete offices');
        } finally {
            setBulkLoading(false);
        }
    };

    const filteredOffices = offices.filter((o) => {
        const matchesSearch =
            o.office_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' ? !o.is_disqualified : !!o.is_disqualified);
        return matchesSearch && matchesStatus;
    });

    const {
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        totalPages,
        totalItems,
        paginatedItems: paginatedOffices,
    } = usePagination(filteredOffices, 10);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, setCurrentPage]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 no-print">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Office Management</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage electoral offices and positions.</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        to="/admin/offices/create"
                        className="px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Add Office
                    </Link>
                </div>
            </div>

            {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
            {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}

            <div className="bg-white dark:bg-[#1a1d29] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden no-print">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400">search</span>
                        <input
                            type="text"
                            placeholder="Search offices by code or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="disqualified">Disqualified</option>
                    </select>
                </div>

                {/* Bulk Actions Toolbar */}
                {selectedOfficeIds.length > 0 && (
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-200 dark:border-indigo-800/60 flex flex-wrap items-center justify-between gap-3 animate-fade-in text-xs font-semibold">
                        <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                            <span className="material-symbols-outlined text-base">checklist</span>
                            <span><b>{selectedOfficeIds.length}</b> office(s) selected</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                disabled={bulkLoading}
                                onClick={() => setBulkDeleteModalOpen(true)}
                                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1 shadow-xs transition-colors"
                                title="Bulk delete all selected offices"
                            >
                                <span className="material-symbols-outlined text-sm">delete_forever</span>
                                Delete Selected ({selectedOfficeIds.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedOfficeIds([])}
                                className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                            >
                                Deselect All
                            </button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <LoadingSpinner />
                ) : filteredOffices.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        No offices found matching your search.
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
                                                checked={paginatedOffices.length > 0 && paginatedOffices.every((o) => selectedOfficeIds.includes(o.id))}
                                                onChange={handleSelectAll}
                                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                                title="Select all on this page"
                                            />
                                        </th>
                                        <th className="px-6 py-3">Office Code</th>
                                        <th className="px-6 py-3">Description</th>
                                        <th className="px-6 py-3">Max Selections</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Created</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {paginatedOffices.map((office) => (
                                        <tr
                                            key={office.id}
                                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                                                selectedOfficeIds.includes(office.id) ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                                            }`}
                                        >
                                            <td className="px-4 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedOfficeIds.includes(office.id)}
                                                    onChange={() => handleToggleSelect(office.id)}
                                                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-6 py-4 font-mono text-slate-900 dark:text-white font-medium">
                                                {office.office_code}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{office.description}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                                    <span className="material-symbols-outlined text-[14px]">how_to_vote</span>
                                                    {office.max_votes && office.max_votes > 1 ? `Up to ${office.max_votes} candidates` : '1 candidate (Single)'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleToggleDisqualify(office.id, office.is_disqualified ?? false)}
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                                                        office.is_disqualified
                                                            ? 'bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700 dark:bg-red-900/30 dark:text-red-400'
                                                            : 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700 dark:bg-green-900/30 dark:text-green-400'
                                                    }`}
                                                    title={office.is_disqualified ? 'Click to Reinstate Office' : 'Click to Disqualify Office'}
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">
                                                        {office.is_disqualified ? 'block' : 'verified'}
                                                    </span>
                                                    {office.is_disqualified ? 'Disqualified' : 'Active'}
                                                </button>
                                            </td>
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

                        <TablePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={setPageSize}
                            pageSizeOptions={[5, 10, 25, 50]}
                            itemName="offices"
                        />
                    </>
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

            <ConfirmDialog
                isOpen={bulkDeleteModalOpen}
                onClose={() => setBulkDeleteModalOpen(false)}
                onConfirm={handleBulkDelete}
                title="Bulk Delete Offices"
                message={`Are you sure you want to permanently delete all ${selectedOfficeIds.length} selected office(s)? This will also cascade delete all associated candidates and votes. This action cannot be undone.`}
                confirmText={bulkLoading ? "Deleting..." : "Delete All Selected"}
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
        const max_votes = parseInt((form.elements.namedItem('max_votes') as HTMLInputElement)?.value || '1', 10) || 1;

        try {
            await officesAPI.create({ office_code, description, max_votes });
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
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                            Allowed Candidate Selections (Max Votes)
                        </label>
                        <input
                            type="number"
                            name="max_votes"
                            min="1"
                            max="20"
                            defaultValue="1"
                            required
                            className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-300 bg-white dark:bg-white text-slate-900 dark:text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            How many unique candidates a voter can pick for this contest. Set 1 for single-winner offices (e.g. President) or 2+ for multi-winner seats (e.g. Trustees, Committee Members).
                        </p>
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
