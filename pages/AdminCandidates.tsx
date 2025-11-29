import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { candidatesAPI, officesAPI, CandidateResponse, OfficeResponse } from '../api';
import { LoadingSpinner, ErrorAlert, SuccessAlert, ConfirmDialog, Modal } from '../components/UIComponents';

const EditCandidateModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    candidate: CandidateResponse;
    offices: OfficeResponse[];
    onUpdate: () => void;
}> = ({ isOpen, onClose, candidate, offices, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [name, setName] = useState(candidate.name);
    const [officeCode, setOfficeCode] = useState(candidate.office.office_code);

    useEffect(() => {
        setName(candidate.name);
        setOfficeCode(candidate.office.office_code);
    }, [candidate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await candidatesAPI.update(candidate.id, {
                candidate_code: candidate.candidate_code.trim(),
                name: name.trim(),
                office_code: officeCode
            });
            onUpdate();
            onClose();
        } catch (err: any) {
            setError(err?.data?.detail || 'Failed to update candidate');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Candidate">
            {error && <div className="mb-4"><ErrorAlert message={error} /></div>}
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-white">Candidate Code</label>
                    <input
                        type="text"
                        value={candidate.candidate_code}
                        disabled
                        className="input-field opacity-60 cursor-not-allowed"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-white">Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input-field"
                        placeholder="e.g. John Doe"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-white">Office</label>
                    <select
                        value={officeCode}
                        onChange={(e) => setOfficeCode(e.target.value)}
                        className="input-field"
                        required
                    >
                        {offices.map((office) => (
                            <option key={office.id} value={office.office_code}>
                                {office.description}
                            </option>
                        ))}
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

export const CandidateManagement: React.FC = () => {
    const [candidates, setCandidates] = useState<CandidateResponse[]>([]);
    const [offices, setOffices] = useState<OfficeResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [officeFilter, setOfficeFilter] = useState<string>('all');
    const [deleteConfirm, setDeleteConfirm] = useState<{
        isOpen: boolean;
        candidateId?: number;
        candidateName?: string;
    }>({
        isOpen: false,
    });
    const [editModal, setEditModal] = useState<{ isOpen: boolean; candidate?: CandidateResponse }>({
        isOpen: false,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [candidatesData, officesData] = await Promise.all([
                candidatesAPI.getAll(),
                officesAPI.getAll(),
            ]);
            setCandidates(candidatesData);
            setOffices(officesData);
            setError('');
        } catch (err: any) {
            setError('Failed to load data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (candidateId: number) => {
        try {
            await candidatesAPI.delete(candidateId);
            setSuccess('Candidate deleted successfully');
            loadData();
        } catch (err: any) {
            setError('Failed to delete candidate');
        }
    };

    const filteredCandidates =
        officeFilter === 'all'
            ? candidates
            : candidates.filter((c) => c.office.office_code === officeFilter);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 no-print">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Candidate Management</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage candidates for all offices.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => window.print()}
                        className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                        Download Candidates List
                    </button>
                    <Link
                        to="/admin/candidates/create"
                        className="px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Add Candidate
                    </Link>
                </div>
            </div>

            {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
            {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}

            <div className="bg-white dark:bg-[#1a1d29] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden no-print">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <select
                        value={officeFilter}
                        onChange={(e) => setOfficeFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                        <option value="all">All Offices</option>
                        {offices.map((office) => (
                            <option key={office.id} value={office.office_code}>
                                {office.description}
                            </option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <LoadingSpinner />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Candidate Code</th>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Office</th>
                                    <th className="px-6 py-3">Created</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredCandidates.map((candidate) => (
                                    <tr key={candidate.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-slate-500">{candidate.candidate_code}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{candidate.name}</td>
                                        <td className="px-6 py-4">{candidate.office.description}</td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {new Date(candidate.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => setEditModal({ isOpen: true, candidate })}
                                                    className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-blue-600 dark:text-blue-400"
                                                    title="Edit candidate"
                                                >
                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setDeleteConfirm({
                                                            isOpen: true,
                                                            candidateId: candidate.id,
                                                            candidateName: candidate.name,
                                                        })
                                                    }
                                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500"
                                                    title="Delete candidate"
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

            {/* Print View */}
            <div className="print-only">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold mb-2">Candidates List</h1>
                    <p className="text-sm text-slate-500">Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                </div>
                <table className="w-full text-left text-sm border-collapse border border-slate-300">
                    <thead>
                        <tr className="bg-slate-100">
                            <th className="border border-slate-300 px-4 py-2">Code</th>
                            <th className="border border-slate-300 px-4 py-2">Name</th>
                            <th className="border border-slate-300 px-4 py-2">Office</th>
                            <th className="border border-slate-300 px-4 py-2">Date Added</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCandidates.map((candidate) => (
                            <tr key={candidate.id}>
                                <td className="border border-slate-300 px-4 py-2">{candidate.candidate_code}</td>
                                <td className="border border-slate-300 px-4 py-2">{candidate.name}</td>
                                <td className="border border-slate-300 px-4 py-2">{candidate.office.description}</td>
                                <td className="border border-slate-300 px-4 py-2">{new Date(candidate.created_at).toLocaleDateString()}</td>
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
                onConfirm={() => deleteConfirm.candidateId && handleDelete(deleteConfirm.candidateId)}
                title="Delete Candidate"
                message={`Are you sure you want to delete candidate "${deleteConfirm.candidateName}"? This action cannot be undone.`}
                confirmText="Delete"
                isDestructive
            />

            {editModal.candidate && (
                <EditCandidateModal
                    isOpen={editModal.isOpen}
                    onClose={() => setEditModal({ isOpen: false })}
                    candidate={editModal.candidate}
                    offices={offices}
                    onUpdate={() => {
                        loadData();
                        setSuccess('Candidate updated successfully');
                    }}
                />
            )}
        </div>
    );
};

export const CreateCandidate: React.FC = () => {
    const [offices, setOffices] = useState<OfficeResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadOffices();
    }, []);

    const loadOffices = async () => {
        try {
            const data = await officesAPI.getAll();
            setOffices(data);
        } catch (err) {
            setError('Failed to load offices');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const form = e.target as HTMLFormElement;
        const candidate_code = (form.elements.namedItem('candidate_code') as HTMLInputElement).value.trim();
        const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
        const office_code = (form.elements.namedItem('office_code') as HTMLSelectElement).value;

        try {
            await candidatesAPI.create({
                candidate_code,
                name,
                office_code
            });
            setSuccess('Candidate created successfully!');
            form.reset();
        } catch (err: any) {
            setError(err?.data?.detail || 'Failed to create candidate');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Create New Candidate</h1>
                <p className="text-slate-500">Add a new candidate to an electoral office.</p>
            </div>

            {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
            {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}

            <div className="bg-white dark:bg-[#1a1d29] p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">Candidate Code</label>
                        <input
                            type="text"
                            name="candidate_code"
                            required
                            className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-300 bg-white dark:bg-white text-slate-900 dark:text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 outline-none"
                            placeholder="e.g. CAND001"
                        />
                        <p className="text-xs text-slate-500 mt-1">Unique identifier for this candidate</p>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">Candidate Name</label>
                        <input
                            type="text"
                            name="name"
                            required
                            className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-300 bg-white dark:bg-white text-slate-900 dark:text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 outline-none"
                            placeholder="e.g. John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">Office</label>
                        <select name="office_code" required className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-300 bg-white dark:bg-white text-slate-900 dark:text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 outline-none">
                            <option value="">Select an office</option>
                            {offices.map((office) => (
                                <option key={office.id} value={office.office_code}>
                                    {office.description}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Link
                            to="/admin/candidates"
                            className="px-6 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            Cancel
                        </Link>
                        <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                            {loading ? 'Creating...' : 'Create Candidate'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};