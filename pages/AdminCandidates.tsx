import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { candidatesAPI, officesAPI, CandidateResponse, OfficeResponse, resolveImageUrl } from '../api';
import { LoadingSpinner, ErrorAlert, SuccessAlert, ConfirmDialog, Modal, TablePagination, usePagination, CandidateAvatar } from '../components/UIComponents';
import { CandidateManifestoModal } from '../components/CandidateManifestoModal';
import { CandidatePhotoCardModal } from '../components/CandidatePhotoCardModal';

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
    onOpenManifesto?: (candidate: CandidateResponse) => void;
    onPrintPhotoCard?: (candidate: CandidateResponse) => void;
}> = ({ isOpen, onClose, candidate, onOpenManifesto, onPrintPhotoCard }) => {
    if (!isOpen || !candidate) return null;
    const resolvedUrl = candidate.image_url ? resolveImageUrl(candidate.image_url) : '';
    const hasManifesto = Boolean(candidate.manifesto_title || candidate.manifesto);

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
                        <span className="text-slate-500 font-semibold">MCS No. (Username)</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                            {candidate.mcs_number || candidate.candidate_code || 'N/A'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-semibold">Staff File No.</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                            {candidate.file_no || 'N/A'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-semibold">CONRAISS</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                            {candidate.conraiss || 'N/A'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-semibold">Station / Dept</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                            {candidate.station || 'N/A'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-semibold">Votes Received</span>
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {candidate.vote_count ?? 0} {candidate.vote_count === 1 ? 'vote' : 'votes'}
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

                    {candidate.manifesto_title && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold block mb-0.5 uppercase tracking-wide">
                                Manifesto Vision
                            </span>
                            <p className="font-bold text-slate-800 dark:text-slate-200 italic line-clamp-2">
                                "{candidate.manifesto_title}"
                            </p>
                        </div>
                    )}
                </div>

                {onOpenManifesto && (
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onOpenManifesto(candidate);
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">menu_book</span>
                        {hasManifesto ? 'View Candidate Manifesto' : 'Preview Empty Manifesto'}
                    </button>
                )}

                {onPrintPhotoCard && (
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onPrintPhotoCard(candidate);
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">print</span>
                        Print Candidate Photo Card (PDF)
                    </button>
                )}

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
    const [mcsNumber, setMcsNumber] = useState(candidate.mcs_number || '');
    const [fileNo, setFileNo] = useState(candidate.file_no || '');
    const [conraiss, setConraiss] = useState(candidate.conraiss || '');
    const [station, setStation] = useState(candidate.station || '');
    const [manifestoTitle, setManifestoTitle] = useState(candidate.manifesto_title || '');
    const [manifesto, setManifesto] = useState(candidate.manifesto || '');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setName(candidate.name || '');
        setOfficeCode(candidate.office?.office_code || '');
        setImageUrl(candidate.image_url || '');
        setMcsNumber(candidate.mcs_number || '');
        setFileNo(candidate.file_no || '');
        setConraiss(candidate.conraiss || '');
        setStation(candidate.station || '');
        setManifestoTitle(candidate.manifesto_title || '');
        setManifesto(candidate.manifesto || '');
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
                mcs_number: mcsNumber.trim() || undefined,
                file_no: fileNo.trim() || undefined,
                conraiss: conraiss.trim() || undefined,
                station: station.trim() || undefined,
                manifesto_title: manifestoTitle.trim() || undefined,
                manifesto: manifesto.trim() || undefined,
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
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Candidate" maxWidth="max-w-3xl">
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

                <div className="grid sm:grid-cols-2 gap-4">
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

                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-white">MCS Number (Username)</label>
                        <input
                            type="text"
                            value={mcsNumber}
                            onChange={(e) => setMcsNumber(e.target.value)}
                            className="input-field"
                            placeholder="e.g. MCS/1234 or staff username"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-white">Staff File Number</label>
                        <input
                            type="text"
                            value={fileNo}
                            onChange={(e) => setFileNo(e.target.value)}
                            className="input-field"
                            placeholder="e.g. P/12345"
                        />
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-white">CONRAISS / Grade Level</label>
                        <input
                            type="text"
                            value={conraiss}
                            onChange={(e) => setConraiss(e.target.value)}
                            className="input-field"
                            placeholder="e.g. CONRAISS 12"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-white">Station / Department</label>
                        <input
                            type="text"
                            value={station}
                            onChange={(e) => setStation(e.target.value)}
                            className="input-field"
                            placeholder="e.g. Head Office / ICT"
                        />
                    </div>
                </div>

                {/* Manifesto Title / Bold Header */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-white">
                        Manifesto Bold Header / Vision Title
                    </label>
                    <input
                        type="text"
                        value={manifestoTitle}
                        onChange={(e) => setManifestoTitle(e.target.value)}
                        className="input-field font-semibold"
                        placeholder="e.g. A New Era of Member Welfare, Transparency & Innovation"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                        Bold headline displayed prominently above the candidate's manifesto.
                    </p>
                </div>

                {/* Manifesto Details */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-semibold text-slate-700 dark:text-white">
                            Candidate Manifesto Body
                        </label>
                        <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                            Markdown & Lists Supported
                        </span>
                    </div>
                    <textarea
                        value={manifesto}
                        onChange={(e) => setManifesto(e.target.value)}
                        rows={6}
                        className="input-field font-sans text-sm leading-relaxed"
                        placeholder={`Type or paste candidate manifesto here...&#10;&#10;Formatting guide:&#10;# Subtitle / Heading&#10;- Bullet point item&#10;1. Numbered agenda item&#10;**Bold keywords** or *italic*`}
                    />
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 space-y-1 mt-1.5">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">Quick Formatting Tips:</div>
                        <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
                            <span><b className="text-indigo-600 dark:text-indigo-400"># Section</b> &rarr; Subtitle</span>
                            <span><b className="text-indigo-600 dark:text-indigo-400">- Item</b> &rarr; Bullet Point</span>
                            <span><b className="text-indigo-600 dark:text-indigo-400">1. Item</b> &rarr; Numbered List</span>
                            <span><b className="text-indigo-600 dark:text-indigo-400">**bold**</b> &rarr; Bold Text</span>
                        </div>
                    </div>
                </div>

                {/* Sticky Action Footer */}
                <div className="sticky bottom-0 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 p-4 sm:p-5 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-700 backdrop-blur-sm flex justify-end gap-3 z-10 shadow-md">
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

const DetailItem: React.FC<{ label: string; value: string; icon: string }> = ({ label, value, icon }) => (
    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center gap-1.5 mb-1">
            <span className="material-symbols-outlined text-[14px] text-slate-400">{icon}</span>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{label}</p>
        </div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 break-all">{value}</p>
    </div>
);

export const CandidateManagement: React.FC = () => {
    const [candidates, setCandidates] = useState<CandidateResponse[]>([]);
    const [offices, setOffices] = useState<OfficeResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [officeFilter, setOfficeFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'disqualified'>('all');
    const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');
    const [selectedCandidateIds, setSelectedCandidateIds] = useState<number[]>([]);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
    const [selectedCandidateForDrawer, setSelectedCandidateForDrawer] = useState<CandidateResponse | null>(null);
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
    const [manifestoModalCandidate, setManifestoModalCandidate] = useState<CandidateResponse | null>(null);
    const [printCardModal, setPrintCardModal] = useState<{
        isOpen: boolean;
        mode: 'single' | 'office';
        candidate?: CandidateResponse | null;
    }>({
        isOpen: false,
        mode: 'office',
        candidate: null,
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

    const handleToggleDisqualify = async (candidateId: number, currentDisqualified: boolean) => {
        try {
            await candidatesAPI.disqualify(candidateId, !currentDisqualified);
            setSuccess(`Candidate ${!currentDisqualified ? 'disqualified' : 'reinstated'} successfully`);
            loadData();
        } catch (err: any) {
            setError(err?.data?.detail || 'Failed to update candidate qualification status');
        }
    };

    const handleToggleHide = async (candidateId: number, currentHidden: boolean) => {
        try {
            await candidatesAPI.hide(candidateId, !currentHidden);
            setSuccess(`Candidate ${!currentHidden ? 'hidden from ballot, statistics, and reports' : 'unhidden and made visible'} successfully`);
            loadData();
        } catch (err: any) {
            setError(err?.data?.detail || 'Failed to update candidate visibility');
        }
    };

    const handleDelete = async (candidateId: number) => {
        try {
            await candidatesAPI.delete(candidateId);
            setSuccess('Candidate deleted successfully');
            setSelectedCandidateIds((prev) => prev.filter((id) => id !== candidateId));
            loadData();
        } catch (err: any) {
            setError('Failed to delete candidate');
        }
    };

    const handleSelectAll = () => {
        const currentIds = paginatedCandidates.map((c) => c.id);
        const allSelected = currentIds.length > 0 && currentIds.every((id) => selectedCandidateIds.includes(id));
        if (allSelected) {
            setSelectedCandidateIds((prev) => prev.filter((id) => !currentIds.includes(id)));
        } else {
            setSelectedCandidateIds((prev) => Array.from(new Set([...prev, ...currentIds])));
        }
    };

    const handleToggleSelect = (id: number) => {
        setSelectedCandidateIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleBulkStatus = async (isDisqualified: boolean) => {
        if (!selectedCandidateIds.length) return;
        setBulkLoading(true);
        try {
            await candidatesAPI.bulkStatus(selectedCandidateIds, isDisqualified);
            setSuccess(`Updated status for ${selectedCandidateIds.length} candidate(s) to ${isDisqualified ? 'Disqualified' : 'Approved'}.`);
            setSelectedCandidateIds([]);
            loadData();
        } catch (err: any) {
            setError(err?.data?.detail || 'Failed to update candidate status in bulk');
        } finally {
            setBulkLoading(false);
        }
    };

    const handleBulkVisibility = async (isHidden: boolean) => {
        if (!selectedCandidateIds.length) return;
        setBulkLoading(true);
        try {
            await candidatesAPI.bulkVisibility(selectedCandidateIds, isHidden);
            setSuccess(`Updated visibility for ${selectedCandidateIds.length} candidate(s) to ${isHidden ? 'Hidden' : 'Visible'}.`);
            setSelectedCandidateIds([]);
            loadData();
        } catch (err: any) {
            setError(err?.data?.detail || 'Failed to update candidate visibility in bulk');
        } finally {
            setBulkLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (!selectedCandidateIds.length) return;
        setBulkLoading(true);
        try {
            const res = await candidatesAPI.bulkDelete(selectedCandidateIds);
            setSuccess(res.message || `Deleted ${selectedCandidateIds.length} candidate(s) successfully.`);
            setSelectedCandidateIds([]);
            setBulkDeleteModalOpen(false);
            loadData();
        } catch (err: any) {
            setError(err?.data?.detail || 'Failed to bulk delete candidates');
        } finally {
            setBulkLoading(false);
        }
    };

    const filteredCandidates = candidates.filter((c) => {
        const matchesOffice = officeFilter === 'all' || c.office?.office_code === officeFilter;
        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'approved' ? !c.is_disqualified : !!c.is_disqualified);
        const matchesVisibility =
            visibilityFilter === 'all' ||
            (visibilityFilter === 'visible' ? !c.is_hidden : !!c.is_hidden);
        const searchLower = (searchTerm || '').toLowerCase();
        const matchesSearch =
            (c.name || '').toLowerCase().includes(searchLower) ||
            (c.candidate_code || '').toLowerCase().includes(searchLower) ||
            (c.office?.description || '').toLowerCase().includes(searchLower) ||
            (c.office?.office_code || '').toLowerCase().includes(searchLower);
        return matchesOffice && matchesStatus && matchesVisibility && matchesSearch;
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
    }, [searchTerm, officeFilter, statusFilter, visibilityFilter, setCurrentPage]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 no-print">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Candidate Management</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage candidates and photos for all offices.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => setPrintCardModal({ isOpen: true, mode: 'office', candidate: null })}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg flex items-center gap-2 shadow-sm transition-colors"
                        title={officeFilter === 'all' ? 'Print photo cards for all candidates' : `Print photo cards for ${offices.find(o => o.office_code === officeFilter)?.description || officeFilter}`}
                    >
                        <span className="material-symbols-outlined text-sm">print</span>
                        <span>Print Photo Cards (PDF)</span>
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

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                        <option value="all">All Statuses</option>
                        <option value="approved">Approved</option>
                        <option value="disqualified">Disqualified</option>
                    </select>

                    <select
                        value={visibilityFilter}
                        onChange={(e) => setVisibilityFilter(e.target.value as any)}
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                        <option value="all">All Visibility</option>
                        <option value="visible">Visible</option>
                        <option value="hidden">Hidden</option>
                    </select>
                </div>

                {/* Bulk Actions Toolbar */}
                {selectedCandidateIds.length > 0 && (
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-200 dark:border-indigo-800/60 flex flex-wrap items-center justify-between gap-3 animate-fade-in text-xs font-semibold">
                        <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                            <span className="material-symbols-outlined text-base">checklist</span>
                            <span><b>{selectedCandidateIds.length}</b> candidate(s) selected</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                disabled={bulkLoading}
                                onClick={() => handleBulkStatus(false)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 shadow-xs transition-colors"
                                title="Approve all selected candidates"
                            >
                                <span className="material-symbols-outlined text-sm">verified</span>
                                Approve All
                            </button>
                            <button
                                type="button"
                                disabled={bulkLoading}
                                onClick={() => handleBulkStatus(true)}
                                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1 shadow-xs transition-colors"
                                title="Disqualify all selected candidates"
                            >
                                <span className="material-symbols-outlined text-sm">block</span>
                                Disqualify All
                            </button>
                            <button
                                type="button"
                                disabled={bulkLoading}
                                onClick={() => handleBulkVisibility(false)}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1 shadow-xs transition-colors"
                                title="Make all selected candidates visible"
                            >
                                <span className="material-symbols-outlined text-sm">visibility</span>
                                Make Visible
                            </button>
                            <button
                                type="button"
                                disabled={bulkLoading}
                                onClick={() => handleBulkVisibility(true)}
                                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1 shadow-xs transition-colors"
                                title="Hide all selected candidates from ballot and reports"
                            >
                                <span className="material-symbols-outlined text-sm">visibility_off</span>
                                Hide All
                            </button>
                            <button
                                type="button"
                                disabled={bulkLoading}
                                onClick={() => setBulkDeleteModalOpen(true)}
                                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1 shadow-xs transition-colors"
                                title="Delete all selected candidates"
                            >
                                <span className="material-symbols-outlined text-sm">delete</span>
                                Delete Selected
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedCandidateIds([])}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                            >
                                Deselect All
                            </button>
                        </div>
                    </div>
                )}

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
                                        <th className="px-4 py-3 w-10">
                                            <input
                                                type="checkbox"
                                                checked={paginatedCandidates.length > 0 && paginatedCandidates.every((c) => selectedCandidateIds.includes(c.id))}
                                                onChange={handleSelectAll}
                                                className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 size-4 cursor-pointer"
                                                title="Select all on current page"
                                            />
                                        </th>
                                        <th className="px-6 py-3">Photo</th>
                                        <th className="px-6 py-3">Candidate Code</th>
                                        <th className="px-6 py-3">Name & Staff Info</th>
                                        <th className="px-6 py-3">Office</th>
                                        <th className="px-6 py-3 text-center">Votes</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Visibility</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {paginatedCandidates.map((candidate) => (
                                        <tr
                                            key={candidate.id}
                                            onClick={() => setSelectedCandidateForDrawer(candidate)}
                                            className={`transition-colors cursor-pointer ${
                                                selectedCandidateIds.includes(candidate.id)
                                                    ? 'bg-indigo-50/50 dark:bg-indigo-950/20'
                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                            }`}
                                        >
                                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCandidateIds.includes(candidate.id)}
                                                    onChange={() => handleToggleSelect(candidate.id)}
                                                    className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 size-4 cursor-pointer"
                                                />
                                            </td>
                                            {/* Photo column with click to preview */}
                                            <td className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    onClick={() => setLightboxCandidate(candidate)}
                                                    className="group relative size-11 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 shadow-sm transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    title="Click to view candidate photo & manifesto"
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
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold">{candidate.name}</span>
                                                        {candidate.image_url && (
                                                            <span className="material-symbols-outlined text-xs text-indigo-500" title="Photo attached">
                                                                image
                                                            </span>
                                                        )}
                                                    </div>
                                                    {candidate.manifesto_title && (
                                                        <span className="text-[11px] text-indigo-600 dark:text-indigo-400 truncate max-w-xs font-normal">
                                                            "{candidate.manifesto_title}"
                                                        </span>
                                                    )}
                                                    <div className="flex flex-wrap gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                                                        <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono font-medium">
                                                            MCS: {candidate.mcs_number || candidate.candidate_code}
                                                        </span>
                                                        {candidate.file_no && (
                                                            <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-medium">
                                                                File: {candidate.file_no}
                                                            </span>
                                                        )}
                                                        {candidate.conraiss && (
                                                            <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-medium">
                                                                {candidate.conraiss}
                                                            </span>
                                                        )}
                                                        {candidate.station && (
                                                            <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-medium">
                                                                {candidate.station}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">{candidate.office?.description || candidate.office?.office_code || 'N/A'}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center min-w-[32px] px-2.5 py-1 rounded-lg text-xs font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                                    {candidate.vote_count ?? 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
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
                                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => handleToggleHide(candidate.id, candidate.is_hidden ?? false)}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                                                        candidate.is_hidden
                                                            ? 'bg-amber-100 text-amber-800 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                                                            : 'bg-emerald-50 text-emerald-700 hover:bg-amber-100 hover:text-amber-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                                                    }`}
                                                    title={candidate.is_hidden ? 'Candidate is Hidden (click to Unhide and show on ballot & reports)' : 'Candidate is Visible (click to Hide from ballot & reports)'}
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">
                                                        {candidate.is_hidden ? 'visibility_off' : 'visibility'}
                                                    </span>
                                                    {candidate.is_hidden ? 'Hidden' : 'Visible'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        onClick={() => handleToggleHide(candidate.id, candidate.is_hidden ?? false)}
                                                        className={`p-1.5 rounded transition-colors ${
                                                            candidate.is_hidden
                                                                ? 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-amber-600 dark:text-amber-400 hover:text-emerald-600'
                                                                : 'hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-500 hover:text-amber-600 dark:text-slate-400'
                                                        }`}
                                                        title={candidate.is_hidden ? 'Unhide candidate (make visible everywhere)' : 'Hide candidate (remove from ballot, reports, stats, pdf)'}
                                                    >
                                                        <span className="material-symbols-outlined text-sm">
                                                            {candidate.is_hidden ? 'visibility_off' : 'visibility'}
                                                        </span>
                                                    </button>
                                                    <button
                                                        onClick={() => setPrintCardModal({ isOpen: true, mode: 'single', candidate })}
                                                        className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded text-amber-600 dark:text-amber-400"
                                                        title="Print official candidate photo card with votes tally"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">print</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setManifestoModalCandidate(candidate)}
                                                        className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded text-indigo-600 dark:text-indigo-400"
                                                        title="View candidate manifesto"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">menu_book</span>
                                                    </button>
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

            <ConfirmDialog
                isOpen={bulkDeleteModalOpen}
                onClose={() => setBulkDeleteModalOpen(false)}
                onConfirm={handleBulkDelete}
                title="Bulk Delete Candidates"
                message={`Are you sure you want to permanently delete all ${selectedCandidateIds.length} selected candidate(s)? This action cannot be undone.`}
                confirmText={bulkLoading ? "Deleting..." : "Delete All Selected"}
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
                onOpenManifesto={(c) => setManifestoModalCandidate(c)}
                onPrintPhotoCard={(c) => setPrintCardModal({ isOpen: true, mode: 'single', candidate: c })}
            />

            {/* Candidate Manifesto Preview Modal */}
            <CandidateManifestoModal
                isOpen={!!manifestoModalCandidate}
                onClose={() => setManifestoModalCandidate(null)}
                candidate={manifestoModalCandidate}
                officeName={manifestoModalCandidate?.office?.description}
            />

            {/* Candidate Photo Card Print Modal (Office or Single) */}
            <CandidatePhotoCardModal
                isOpen={printCardModal.isOpen}
                onClose={() => setPrintCardModal({ isOpen: false, mode: 'office', candidate: null })}
                mode={printCardModal.mode}
                candidate={printCardModal.candidate}
                candidates={filteredCandidates.filter(c => !c.is_hidden)}
                officeTitle={
                    officeFilter === 'all'
                        ? 'All Offices'
                        : offices.find((o) => o.office_code === officeFilter)?.description || officeFilter
                }
            />

            {/* Slide-in Candidate Detail Drawer */}
            {selectedCandidateForDrawer && (
                <>
                    {/* Backdrop overlay */}
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
                        onClick={() => setSelectedCandidateForDrawer(null)}
                    />
                    {/* Drawer panel */}
                    <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white dark:bg-[#1a1d29] shadow-2xl z-50 overflow-y-auto animate-slide-in-right">
                        {/* Header */}
                        <div className="sticky top-0 bg-white dark:bg-[#1a1d29] border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setLightboxCandidate(selectedCandidateForDrawer)}
                                    className="group relative size-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-indigo-500/40 shadow-sm flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    title="Click to view full photo"
                                >
                                    <CandidateAvatar
                                        src={selectedCandidateForDrawer.image_url ? resolveImageUrl(selectedCandidateForDrawer.image_url) : ''}
                                        name={selectedCandidateForDrawer.name}
                                        iconClassName="text-2xl"
                                        textClassName="text-xs"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                        <span className="material-symbols-outlined text-xs">zoom_in</span>
                                    </div>
                                </button>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                                        {selectedCandidateForDrawer.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                        Candidate Code: {selectedCandidateForDrawer.candidate_code}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedCandidateForDrawer(null)}
                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">
                            {/* Contest & Voting Section */}
                            <div className="space-y-1">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                                    Contest & Voting Tally
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <DetailItem
                                        label="Contested Office"
                                        value={selectedCandidateForDrawer.office?.description || selectedCandidateForDrawer.office?.office_code || 'N/A'}
                                        icon="how_to_vote"
                                    />
                                    <DetailItem
                                        label="Votes Count"
                                        value={`${selectedCandidateForDrawer.vote_count ?? 0} votes cast`}
                                        icon="poll"
                                    />
                                </div>
                            </div>

                            {/* Staff Identity Section */}
                            <div className="space-y-1">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                                    Candidate & Staff Identity
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <DetailItem label="Candidate Code" value={selectedCandidateForDrawer.candidate_code} icon="qr_code" />
                                    <DetailItem label="Full Name" value={selectedCandidateForDrawer.name} icon="person" />
                                    <DetailItem
                                        label="MCS Number"
                                        value={selectedCandidateForDrawer.mcs_number || selectedCandidateForDrawer.candidate_code}
                                        icon="badge"
                                    />
                                    <DetailItem label="Staff File No" value={selectedCandidateForDrawer.file_no || '—'} icon="folder_shared" />
                                    <DetailItem label="Station / Location" value={selectedCandidateForDrawer.station || '—'} icon="location_on" />
                                    <DetailItem label="CONRAISS" value={selectedCandidateForDrawer.conraiss || '—'} icon="grade" />
                                </div>
                            </div>

                            {/* Status, Visibility & Registration Section */}
                            <div className="space-y-1">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                                    Status, Visibility & Registration
                                </h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1">Status</p>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                            selectedCandidateForDrawer.is_disqualified
                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        }`}>
                                            <span className="material-symbols-outlined text-[13px]">
                                                {selectedCandidateForDrawer.is_disqualified ? 'block' : 'verified'}
                                            </span>
                                            {selectedCandidateForDrawer.is_disqualified ? 'Disqualified' : 'Approved'}
                                        </span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1">Visibility</p>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                            selectedCandidateForDrawer.is_hidden
                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                                        }`}>
                                            <span className="material-symbols-outlined text-[13px]">
                                                {selectedCandidateForDrawer.is_hidden ? 'visibility_off' : 'visibility'}
                                            </span>
                                            {selectedCandidateForDrawer.is_hidden ? 'Hidden' : 'Visible'}
                                        </span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1">Created At</p>
                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                                            {selectedCandidateForDrawer.created_at ? new Date(selectedCandidateForDrawer.created_at).toLocaleDateString() : '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Manifesto Section */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        Manifesto & Agenda
                                    </h4>
                                    {(selectedCandidateForDrawer.manifesto || selectedCandidateForDrawer.manifesto_title) && (
                                        <button
                                            type="button"
                                            onClick={() => setManifestoModalCandidate(selectedCandidateForDrawer)}
                                            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                            Full Screen View
                                        </button>
                                    )}
                                </div>
                                {selectedCandidateForDrawer.manifesto_title && (
                                    <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60">
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-0.5">
                                            Vision Title / Bold Header
                                        </p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                                            {selectedCandidateForDrawer.manifesto_title}
                                        </p>
                                    </div>
                                )}
                                {selectedCandidateForDrawer.manifesto ? (
                                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                                        {selectedCandidateForDrawer.manifesto}
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400 italic">
                                        No candidate manifesto submitted.
                                    </div>
                                )}
                            </div>

                            {/* Quick Actions */}
                            <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                                    Quick Actions
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => {
                                            setEditModal({ isOpen: true, candidate: selectedCandidateForDrawer });
                                            setSelectedCandidateForDrawer(null);
                                        }}
                                        className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1.5"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                        Edit Candidate
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const newDisq = !selectedCandidateForDrawer.is_disqualified;
                                            await handleToggleDisqualify(selectedCandidateForDrawer.id, selectedCandidateForDrawer.is_disqualified ?? false);
                                            setSelectedCandidateForDrawer((prev) => prev ? { ...prev, is_disqualified: newDisq } : null);
                                        }}
                                        className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                                            selectedCandidateForDrawer.is_disqualified
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                                                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">
                                            {selectedCandidateForDrawer.is_disqualified ? 'verified' : 'block'}
                                        </span>
                                        {selectedCandidateForDrawer.is_disqualified ? 'Reinstate' : 'Disqualify'}
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const newHidden = !selectedCandidateForDrawer.is_hidden;
                                            await handleToggleHide(selectedCandidateForDrawer.id, selectedCandidateForDrawer.is_hidden ?? false);
                                            setSelectedCandidateForDrawer((prev) => prev ? { ...prev, is_hidden: newHidden } : null);
                                        }}
                                        className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                                            selectedCandidateForDrawer.is_hidden
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                                                : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">
                                            {selectedCandidateForDrawer.is_hidden ? 'visibility' : 'visibility_off'}
                                        </span>
                                        {selectedCandidateForDrawer.is_hidden ? 'Make Visible' : 'Hide Everywhere'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setPrintCardModal({ isOpen: true, mode: 'single', candidate: selectedCandidateForDrawer });
                                        }}
                                        className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors flex items-center gap-1.5"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">print</span>
                                        Print Card
                                    </button>
                                    <button
                                        onClick={() => {
                                            setDeleteConfirm({
                                                isOpen: true,
                                                candidateId: selectedCandidateForDrawer.id,
                                                candidateName: selectedCandidateForDrawer.name,
                                            });
                                            setSelectedCandidateForDrawer(null);
                                        }}
                                        className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center gap-1.5"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
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
    const [mcsNumber, setMcsNumber] = useState('');
    const [fileNo, setFileNo] = useState('');
    const [conraiss, setConraiss] = useState('');
    const [station, setStation] = useState('');
    const [manifestoTitle, setManifestoTitle] = useState('');
    const [manifesto, setManifesto] = useState('');
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
                mcs_number: mcsNumber.trim() || undefined,
                file_no: fileNo.trim() || undefined,
                conraiss: conraiss.trim() || undefined,
                station: station.trim() || undefined,
                manifesto_title: manifestoTitle.trim() || undefined,
                manifesto: manifesto.trim() || undefined,
            });
            setSuccess('Candidate created successfully!');
            form.reset();
            setImageUrl('');
            setManifestoTitle('');
            setManifesto('');
            setMcsNumber('');
            setFileNo('');
            setConraiss('');
            setStation('');
        } catch (err: any) {
            setError(err?.data?.detail || 'Failed to create candidate');
        } finally {
            setLoading(false);
        }
    };

    const resolvedDisplayUrl = imageUrl ? resolveImageUrl(imageUrl) : '';

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Create New Candidate</h1>
                <p className="text-slate-500">Add a new candidate with photo, manifesto, and office assignment.</p>
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
                                    Upload portrait picture (JPG, PNG, WEBP). Voters will see this photo on their ballots and profile previews.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
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

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                                MCS Number (Username)
                            </label>
                            <input
                                type="text"
                                value={mcsNumber}
                                onChange={(e) => setMcsNumber(e.target.value)}
                                className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-300 bg-white dark:bg-white text-slate-900 dark:text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 outline-none"
                                placeholder="e.g. MCS/1234 or staff username"
                            />
                            <p className="text-xs text-slate-500 mt-1">Leave empty to auto-link with user's staff profile</p>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                                Staff File Number
                            </label>
                            <input
                                type="text"
                                value={fileNo}
                                onChange={(e) => setFileNo(e.target.value)}
                                className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-300 bg-white dark:bg-white text-slate-900 dark:text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 outline-none"
                                placeholder="e.g. P/12345"
                            />
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                                CONRAISS / Grade Level
                            </label>
                            <input
                                type="text"
                                value={conraiss}
                                onChange={(e) => setConraiss(e.target.value)}
                                className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-300 bg-white dark:bg-white text-slate-900 dark:text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 outline-none"
                                placeholder="e.g. CONRAISS 12"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                                Station / Department
                            </label>
                            <input
                                type="text"
                                value={station}
                                onChange={(e) => setStation(e.target.value)}
                                className="w-full px-4 py-3 text-base rounded-xl border-2 border-slate-200 dark:border-slate-300 bg-white dark:bg-white text-slate-900 dark:text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 outline-none"
                                placeholder="e.g. Head Office / ICT"
                            />
                        </div>
                    </div>

                    {/* Manifesto Header */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                        <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                            Manifesto Bold Header / Vision Title (Optional)
                        </label>
                        <input
                            type="text"
                            value={manifestoTitle}
                            onChange={(e) => setManifestoTitle(e.target.value)}
                            className="w-full px-4 py-3 text-base font-semibold rounded-xl border-2 border-slate-200 dark:border-slate-300 bg-white dark:bg-white text-slate-900 dark:text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 outline-none"
                            placeholder="e.g. Empowering Members Through Transparency, Welfare & Modern Innovation"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            This title is displayed in bold at the top of the candidate's manifesto and ballot card previews.
                        </p>
                    </div>

                    {/* Manifesto Body */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-semibold text-slate-900 dark:text-white">
                                Candidate Detailed Manifesto (Optional)
                            </label>
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                Supports Subtitles, Bullets, Numbers & Bold
                            </span>
                        </div>
                        <textarea
                            value={manifesto}
                            onChange={(e) => setManifesto(e.target.value)}
                            rows={8}
                            className="w-full p-4 text-sm font-sans rounded-xl border-2 border-slate-200 dark:border-slate-300 bg-white dark:bg-white text-slate-900 dark:text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 outline-none leading-relaxed"
                            placeholder={`Type or paste candidate manifesto here...

Formatting guide:
# Subtitle / Key Pillar
- Bullet point action item
1. Numbered milestone
**Bold key points**`}
                        />
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 space-y-1.5 mt-2">
                            <div className="font-semibold text-slate-700 dark:text-slate-300">
                                Formatting syntax:
                            </div>
                            <div className="grid sm:grid-cols-2 gap-1.5 font-mono text-[11px]">
                                <div><b className="text-indigo-600 dark:text-indigo-400"># Heading</b> &rarr; Subtitle heading with bookmark icon</div>
                                <div><b className="text-indigo-600 dark:text-indigo-400">- Bullet</b> &rarr; Clean colored bullet point list</div>
                                <div><b className="text-indigo-600 dark:text-indigo-400">1. Number</b> &rarr; Numbered badge list</div>
                                <div><b className="text-indigo-600 dark:text-indigo-400">**bold**</b> &rarr; Bold keyword emphasis</div>
                            </div>
                        </div>
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
