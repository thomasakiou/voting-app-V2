import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { candidatesAPI, officesAPI, CandidateResponse, OfficeResponse, resolveImageUrl } from '../api';
import { LoadingSpinner, ErrorAlert, SuccessAlert, ConfirmDialog, Modal, TablePagination, usePagination, CandidateAvatar } from '../components/UIComponents';

const compressImage = (file: File, maxWidth = 800, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(e.target?.result as string);
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
            img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const uploadCandidatePhoto = async (file: File): Promise<string> => {
    try {
        const res = await candidatesAPI.uploadImage(file);
        if (res && res.image_url) {
            return res.image_url;
        }
    } catch (err) {
        console.warn('Backend image upload endpoint failed, falling back to compressed data URL:', err);
    }
    return await compressImage(file, 800, 0.85);
};

export const PhotoLightboxModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    candidate: CandidateResponse | null;
}> = ({ isOpen, onClose, candidate }) => {
    if (!isOpen || !candidate) return null;
    const resolvedUrl = candidate.image_url ? resolveImageUrl(candidate.image_url) : '';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Candidate Photo: ${candidate.name}`}>
            <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center">
                    <CandidateAvatar
                        src={resolvedUrl}
                        name={candidate.name}
                        iconClassName="text-7xl"
                        textClassName="text-base font-bold mt-2"
                    />
                </div>

                <div className="w-full text-left bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-semibold">Candidate Code</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {candidate.candidate_code}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-semibold">Office</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            {candidate.office?.description || 'N/A'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-semibold">Status</span>
                        <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                candidate.is_disqualified
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            }`}
                        >
                            {candidate.is_disqualified ? 'Disqualified' : 'Approved Candidate'}
                        </span>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full py-2.5 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                    Close Preview
                </button>
            </div>
        </Modal>
    );
};

const EditCandidateModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    candidate: CandidateResponse;
    offices: OfficeResponse[];
    onUpdate: () => void;
}> = ({ isOpen, onClose, candidate, offices, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [error, setError] = useState('');
    const [name, setName] = useState(candidate.name || '');
    const [officeCode, setOfficeCode] = useState(candidate.office?.office_code || '');
    const [imageUrl, setImageUrl] = useState<string>(candidate.image_url || '');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setName(candidate.name || '');
        setOfficeCode(candidate.office?.office_code || '');
        setImageUrl(candidate.image_url || '');
        setError('');
    }, [candidate]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file (JPG, PNG, WEBP).');
            return;
        }

        try {
            setUploadingImage(true);
            setError('');
            const url = await uploadCandidatePhoto(file);
            setImageUrl(url);
        } catch (err: any) {
            setError('Failed to process image. Please try another image.');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await candidatesAPI.update(candidate.id, {
                candidate_code: candidate.candidate_code.trim(),
                name: name.trim(),
                office_code: officeCode,
                image_url: imageUrl || undefined,
            });
            onUpdate();
            onClose();
        } catch (err: any) {
            setError(err?.data?.detail || 'Failed to update candidate');
        } finally {
            setLoading(false);
        }
    };

    const resolvedDisplayUrl = imageUrl ? resolveImageUrl(imageUrl) : '';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Candidate">
            {error && <div className="mb-4"><ErrorAlert message={error} /></div>}
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Photo Upload & Preview */}
                <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-white">Candidate Photo</label>
                    <div className="flex items-center gap-4 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <div className="relative size-16 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center border border-slate-300 dark:border-slate-600">
                            <CandidateAvatar
                                src={resolvedDisplayUrl}
                                name={name || 'Candidate'}
                                iconClassName="text-3xl"
                                textClassName="text-xs"
                            />
                            {uploadingImage && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-lg animate-spin">progress_activity</span>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 space-y-1">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    disabled={uploadingImage}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1 shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-sm">photo_camera</span>
                                    {imageUrl ? 'Change Photo' : 'Upload Photo'}
                                </button>
                                {imageUrl && (
                                    <button
                                        type="button"
                                        onClick={() => setImageUrl('')}
                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-red-100 hover:text-red-700 transition-colors flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                        Remove
                                    </button>
                                )}
                            </div>
                            <p className="text-[11px] text-slate-500">Supports JPG, PNG, WEBP (portrait recommended)</p>
                        </div>
                    </div>
                </div>

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
                        {offices.map((office) => office && (
                            <option key={office.id} value={office.office_code}>
                                {office.description || office.office_code}
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
                        disabled={loading || uploadingImage}
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
    const [searchTerm, setSearchTerm] = useState('');
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
    const [lightboxCandidate, setLightboxCandidate] = useState<CandidateResponse | null>(null);

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

    const handleToggleDisqualify = async (candidateId: number, currentDisqualified: boolean) => {
        try {
            await candidatesAPI.disqualify(candidateId, !currentDisqualified);
            setSuccess(`Candidate ${!currentDisqualified ? 'disqualified' : 'reinstated'} successfully`);
            loadData();
        } catch (err: any) {
            setError(err?.data?.detail || 'Failed to update candidate qualification status');
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

    const filteredCandidates = candidates.filter((c) => {
        const matchesOffice = officeFilter === 'all' || c.office?.office_code === officeFilter;
        const searchLower = (searchTerm || '').toLowerCase();
        const matchesSearch =
            (c.name || '').toLowerCase().includes(searchLower) ||
            (c.candidate_code || '').toLowerCase().includes(searchLower) ||
            (c.office?.description || '').toLowerCase().includes(searchLower) ||
            (c.office?.office_code || '').toLowerCase().includes(searchLower);
        return matchesOffice && matchesSearch;
    });

    const {
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        totalPages,
        totalItems,
        paginatedItems: paginatedCandidates,
    } = usePagination(filteredCandidates, 10);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, officeFilter, setCurrentPage]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 no-print">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Candidate Management</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage candidates and photos for all offices.</p>
                </div>
                <div className="flex gap-3">
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
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400">search</span>
                        <input
                            type="text"
                            placeholder="Search candidates by name, code, or office..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none"
                        />
                    </div>
                    <select
                        value={officeFilter}
                        onChange={(e) => setOfficeFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                        <option value="all">All Offices</option>
                        {offices.map((office) => office && (
                            <option key={office.id} value={office.office_code}>
                                {office.description || office.office_code}
                            </option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <LoadingSpinner />
                ) : filteredCandidates.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        No candidates found matching your criteria.
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
                                    <tr>
                                        <th className="px-6 py-3">Photo</th>
                                        <th className="px-6 py-3">Candidate Code</th>
                                        <th className="px-6 py-3">Name</th>
                                        <th className="px-6 py-3">Office</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Created</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {paginatedCandidates.map((candidate) => (
                                        <tr key={candidate.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            {/* Photo column with click to preview */}
                                            <td className="px-6 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setLightboxCandidate(candidate)}
                                                    className="group relative size-11 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 shadow-sm transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    title="Click to view candidate photo"
                                                >
                                                    <CandidateAvatar
                                                        src={candidate.image_url ? resolveImageUrl(candidate.image_url) : ''}
                                                        name={candidate.name}
                                                        iconClassName="text-xl"
                                                        textClassName="text-[10px]"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                        <span className="material-symbols-outlined text-xs">zoom_in</span>
                                                    </div>
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-slate-500 font-semibold">{candidate.candidate_code}</td>
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                                <div className="flex items-center gap-2">
                                                    <span>{candidate.name}</span>
                                                    {candidate.image_url && (
                                                        <span className="material-symbols-outlined text-xs text-indigo-500" title="Photo attached">
                                                            image
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">{candidate.office?.description || candidate.office?.office_code || 'N/A'}</td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleToggleDisqualify(candidate.id, candidate.is_disqualified ?? false)}
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                                                        candidate.is_disqualified
                                                            ? 'bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700 dark:bg-red-900/30 dark:text-red-400'
                                                            : 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700 dark:bg-green-900/30 dark:text-green-400'
                                                    }`}
                                                    title={candidate.is_disqualified ? 'Click to Reinstate Candidate' : 'Click to Disqualify Candidate'}
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">
                                                        {candidate.is_disqualified ? 'block' : 'verified'}
                                                    </span>
                                                    {candidate.is_disqualified ? 'Disqualified' : 'Approved'}
                                                </button>
                                            </td>
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

                        <TablePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={setPageSize}
                            pageSizeOptions={[5, 10, 25, 50]}
                            itemName="candidates"
                        />
                    </>
                )}
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

            {/* Photo Lightbox Preview */}
            <PhotoLightboxModal
                isOpen={!!lightboxCandidate}
                onClose={() => setLightboxCandidate(null)}
                candidate={lightboxCandidate}
            />
        </div>
    );
};

export const CreateCandidate: React.FC = () => {
    const [offices, setOffices] = useState<OfficeResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [imageUrl, setImageUrl] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file (JPG, PNG, WEBP).');
            return;
        }

        try {
            setUploadingImage(true);
            setError('');
            const url = await uploadCandidatePhoto(file);
            setImageUrl(url);
        } catch (err: any) {
            setError('Failed to process image. Please try another image.');
        } finally {
            setUploadingImage(false);
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
                office_code,
                image_url: imageUrl || undefined,
            });
            setSuccess('Candidate created successfully!');
            form.reset();
            setImageUrl('');
        } catch (err: any) {
            setError(err?.data?.detail || 'Failed to create candidate');
        } finally {
            setLoading(false);
        }
    };

    const resolvedDisplayUrl = imageUrl ? resolveImageUrl(imageUrl) : '';

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Create New Candidate</h1>
                <p className="text-slate-500">Add a new candidate with photo to an electoral office.</p>
            </div>

            {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
            {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}

            <div className="bg-white dark:bg-[#1a1d29] p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Candidate Photo Uploader */}
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                            Candidate Photo (Optional)
                        </label>
                        <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center gap-4">
                            <div className="relative size-24 rounded-2xl overflow-hidden bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 shadow-sm flex items-center justify-center flex-shrink-0">
                                <CandidateAvatar
                                    src={resolvedDisplayUrl}
                                    name="Candidate"
                                    iconClassName="text-4xl"
                                    textClassName="text-xs"
                                />
                                {uploadingImage && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white text-2xl animate-spin">
                                            progress_activity
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 text-center sm:text-left space-y-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                                    <button
                                        type="button"
                                        disabled={uploadingImage}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-base">upload</span>
                                        {imageUrl ? 'Change Photo' : 'Select Photo'}
                                    </button>
                                    {imageUrl && (
                                        <button
                                            type="button"
                                            onClick={() => setImageUrl('')}
                                            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-red-100 hover:text-red-700 transition-colors flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-base">delete</span>
                                            Remove
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400">
                                    Upload portrait picture (JPG, PNG, WEBP). Voters will see this photo on their ballots.
                                </p>
                            </div>
                        </div>
                    </div>

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
                            {offices.map((office) => office && (
                                <option key={office.id} value={office.office_code}>
                                    {office.description || office.office_code}
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
                        <button type="submit" disabled={loading || uploadingImage} className="btn-primary disabled:opacity-50">
                            {loading ? 'Creating...' : 'Create Candidate'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
