import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

// Loading Spinner Component
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
    const sizeClasses = {
        sm: 'size-4',
        md: 'size-8',
        lg: 'size-12',
    };

    return (
        <div className="flex items-center justify-center p-8">
            <div className={`${sizeClasses[size]} spinner`}></div>
        </div>
    );
};

// Error Alert Component
export const ErrorAlert: React.FC<{ message: string; onDismiss?: () => void }> = ({ message, onDismiss }) => (
    <div className="alert alert-error">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{message}</span>
            </div>
            {onDismiss && (
                <button onClick={onDismiss} className="ml-4">
                    <span className="material-symbols-outlined text-sm">close</span>
                </button>
            )}
        </div>
    </div>
);

// Success Alert Component
export const SuccessAlert: React.FC<{ message: string; onDismiss?: () => void }> = ({ message, onDismiss }) => (
    <div className="alert alert-success">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>{message}</span>
            </div>
            {onDismiss && (
                <button onClick={onDismiss} className="ml-4">
                    <span className="material-symbols-outlined text-sm">close</span>
                </button>
            )}
        </div>
    </div>
);

// Modal Component
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    const modalContent = (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

// Empty State Component
export const EmptyState: React.FC<{ icon: string; message: string; action?: React.ReactNode }> = ({
    icon,
    message,
    action,
}) => (
    <div className="empty-state">
        <span className="material-symbols-outlined empty-state-icon">{icon}</span>
        <p className="empty-state-text">{message}</p>
        {action && <div className="mt-6">{action}</div>}
    </div>
);

// Confirmation Dialog Component
interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = false,
}) => {
    if (!isOpen) return null;

    const dialogContent = (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">{message}</p>
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200 border border-slate-200 dark:border-slate-600"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 ${isDestructive
                                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30'
                                }`}
                        >
                            {isDestructive && <span className="material-symbols-outlined text-[18px]">delete</span>}
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(dialogContent, document.body);
};

// ============================================================
// TABLE PAGINATION WITH NUMBER OF ROWS FILTER
// ============================================================
export interface TablePaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    pageSizeOptions?: number[];
    itemName?: string;
    className?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 25, 50, 100],
    itemName = 'entries',
    className = '',
}) => {
    if (totalItems === 0) return null;

    const startRow = Math.min((currentPage - 1) * pageSize + 1, totalItems);
    const endRow = Math.min(currentPage * pageSize, totalItems);

    const getPageNumbers = () => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        if (currentPage <= 4) {
            return [1, 2, 3, 4, 5, '...', totalPages];
        }
        if (currentPage >= totalPages - 3) {
            return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        }
        return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    };

    const pages = getPageNumbers();

    return (
        <div className={`p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#1a1d29] ${className}`}>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                    <span>Rows per page:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            const newSize = Number(e.target.value);
                            onPageSizeChange(newSize);
                            onPageChange(1);
                        }}
                        className="px-2.5 py-1 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                    >
                        {pageSizeOptions.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                </div>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span>
                    Showing <span className="font-semibold text-slate-900 dark:text-white">{startRow}</span> to{' '}
                    <span className="font-semibold text-slate-900 dark:text-white">{endRow}</span> of{' '}
                    <span className="font-semibold text-slate-900 dark:text-white">{totalItems}</span> {itemName}
                </span>
            </div>

            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="First page"
                >
                    <span className="material-symbols-outlined text-sm">first_page</span>
                </button>
                <button
                    type="button"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Previous page"
                >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>

                <div className="flex items-center gap-1 mx-1">
                    {pages.map((p, idx) =>
                        p === '...' ? (
                            <span key={`dots-${idx}`} className="px-2 text-slate-400 text-xs select-none">
                                ...
                            </span>
                        ) : (
                            <button
                                key={`page-${p}`}
                                type="button"
                                onClick={() => onPageChange(p as number)}
                                className={`min-w-8 h-8 px-2 text-xs font-semibold rounded-lg transition-colors ${
                                    currentPage === p
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                {p}
                            </button>
                        )
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Next page"
                >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
                <button
                    type="button"
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Last page"
                >
                    <span className="material-symbols-outlined text-sm">last_page</span>
                </button>
            </div>
        </div>
    );
};

export function usePagination<T>(items: T[], initialPageSize: number = 10) {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);

    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(1);
        }
    }, [totalPages, currentPage]);

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, items.length);
    const paginatedItems = useMemo(() => items.slice(startIndex, endIndex), [items, startIndex, endIndex]);

    return {
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        totalPages,
        totalItems: items.length,
        startIndex,
        endIndex,
        paginatedItems,
    };
}
