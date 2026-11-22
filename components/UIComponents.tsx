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

// Shimmer Table Skeleton Component
export interface TableSkeletonProps {
    cols?: number;
    rows?: number;
    headers?: string[];
    hasCheckbox?: boolean;
    hasActions?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
    cols = 7,
    rows = 7,
    headers,
    hasCheckbox = false,
    hasActions = true,
}) => {
    const effectiveCols = headers ? headers.length : cols;

    return (
        <div className="w-full overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-sm">
            {/* Top Animated Loading Line */}
            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-500 animate-pulse" />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-700/60 font-medium">
                        <tr>
                            {headers ? (
                                headers.map((h, i) => (
                                    <th key={i} className="px-5 py-3.5 whitespace-nowrap">
                                        <span className="opacity-80 font-medium">{h}</span>
                                    </th>
                                ))
                            ) : (
                                Array.from({ length: effectiveCols }).map((_, i) => (
                                    <th key={i} className="px-5 py-3.5">
                                        <div
                                            className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded table-shimmer animate-pulse"
                                            style={{
                                                width: i === 0 && hasCheckbox ? '20px' : `${Math.floor(55 + ((i * 23) % 40))}%`,
                                                maxWidth: '130px',
                                            }}
                                        />
                                    </th>
                                ))
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {Array.from({ length: rows }).map((_, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-colors">
                                {Array.from({ length: effectiveCols }).map((_, cIdx) => {
                                    const isFirst = cIdx === 0;
                                    const isLast = cIdx === effectiveCols - 1;
                                    const isStatus = cIdx === effectiveCols - 2;

                                    return (
                                        <td key={cIdx} className="px-5 py-3.5">
                                            {isFirst && hasCheckbox ? (
                                                <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700/80 animate-pulse table-shimmer" />
                                            ) : isLast && hasActions ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700/70 animate-pulse table-shimmer" />
                                                    <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700/70 animate-pulse table-shimmer" />
                                                </div>
                                            ) : isStatus ? (
                                                <div className="h-6 w-20 rounded-full bg-slate-200/90 dark:bg-slate-700/80 animate-pulse table-shimmer" />
                                            ) : (
                                                <div
                                                    className="h-4 rounded bg-slate-200/80 dark:bg-slate-700/70 animate-pulse table-shimmer"
                                                    style={{
                                                        width: `${Math.max(40, 88 - ((rIdx * 19 + cIdx * 31) % 45))}%`,
                                                        maxWidth: cIdx === 1 ? '160px' : '220px',
                                                    }}
                                                />
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Skeleton Pagination Bar Footer */}
            <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
                <div className="h-4 w-32 rounded bg-slate-200/70 dark:bg-slate-700/60 animate-pulse table-shimmer" />
                <div className="flex items-center gap-2">
                    <div className="h-8 w-16 rounded-lg bg-slate-200/70 dark:bg-slate-700/60 animate-pulse table-shimmer" />
                    <div className="h-8 w-16 rounded-lg bg-slate-200/70 dark:bg-slate-700/60 animate-pulse table-shimmer" />
                </div>
            </div>
        </div>
    );
};

// Shimmer Rows for rendering directly inside custom <tbody>
export const TableSkeletonRows: React.FC<{
    rows?: number;
    cols: number;
    hasCheckbox?: boolean;
    hasActions?: boolean;
}> = ({ rows = 6, cols, hasCheckbox = false, hasActions = false }) => {
    return (
        <>
            {Array.from({ length: rows }).map((_, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-colors">
                    {Array.from({ length: cols }).map((_, cIdx) => {
                        const isFirst = cIdx === 0;
                        const isLast = cIdx === cols - 1;
                        const isStatus = cIdx === cols - 2;

                        return (
                            <td key={cIdx} className="px-5 py-3.5">
                                {isFirst && hasCheckbox ? (
                                    <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700/80 animate-pulse table-shimmer" />
                                ) : isLast && hasActions ? (
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700/70 animate-pulse table-shimmer" />
                                        <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700/70 animate-pulse table-shimmer" />
                                    </div>
                                ) : isStatus ? (
                                    <div className="h-6 w-20 rounded-full bg-slate-200/90 dark:bg-slate-700/80 animate-pulse table-shimmer" />
                                ) : (
                                    <div
                                        className="h-4 rounded bg-slate-200/80 dark:bg-slate-700/70 animate-pulse table-shimmer"
                                        style={{
                                            width: `${Math.max(40, 85 - ((rIdx * 17 + cIdx * 29) % 45))}%`,
                                            maxWidth: '200px',
                                        }}
                                    />
                                )}
                            </td>
                        );
                    })}
                </tr>
            ))}
        </>
    );
};

export const formatAlertMessage = (msg: any): string => {
    if (!msg) return '';
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) {
        return msg.map((item) => formatAlertMessage(item)).filter(Boolean).join('; ');
    }
    if (typeof msg === 'object') {
        if (typeof msg.msg === 'string') return msg.msg;
        if (typeof msg.detail === 'string') return msg.detail;
        if (typeof msg.message === 'string') return msg.message;
        try {
            return JSON.stringify(msg);
        } catch {
            return String(msg);
        }
    }
    return String(msg);
};

// Error Alert Component
export const ErrorAlert: React.FC<{ message: any; onDismiss?: () => void }> = ({ message, onDismiss }) => {
    const text = formatAlertMessage(message);
    if (!text) return null;
    return (
        <div className="alert alert-error">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">error</span>
                    <span>{text}</span>
                </div>
                {onDismiss && (
                    <button onClick={onDismiss} className="ml-4">
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                )}
            </div>
        </div>
    );
};

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
    maxWidth?: string;
    footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = 'max-w-2xl',
    footer,
}) => {
    if (!isOpen) return null;

    const modalContent = (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className={`modal-content flex flex-col max-h-[90vh] ${maxWidth} overflow-hidden`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Fixed Sticky Header */}
                <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-200 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-900 sticky top-0 z-20">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate pr-4">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0"
                        title="Close"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                {/* Scrollable Modal Body */}
                <div className="p-5 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
                    {children}
                </div>

                {/* Optional Sticky Footer */}
                {footer && (
                    <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/95 shrink-0 sticky bottom-0 z-20">
                        {footer}
                    </div>
                )}
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

// Reusable Candidate Avatar with Graceful Fallback
export const CandidateAvatar: React.FC<{
    src?: string | null;
    name: string;
    className?: string;
    iconClassName?: string;
    textClassName?: string;
}> = ({ src, name, className = '', iconClassName = 'text-2xl', textClassName = 'text-[10px]' }) => {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setHasError(false);
    }, [src]);

    const initials = name
        ? name
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((n) => n[0])
              .join('')
              .toUpperCase()
        : 'C';

    const hasImage = Boolean(src && !hasError);

    if (!hasImage) {
        return (
            <div className={`size-full bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-slate-400 select-none ${className}`}>
                <span className={`material-symbols-outlined ${iconClassName}`}>person</span>
                <span className={`font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${textClassName}`}>
                    {initials}
                </span>
            </div>
        );
    }

    return (
        <img
            src={src!}
            alt={name}
            className={`size-full object-cover select-none ${className}`}
            onError={() => setHasError(true)}
            loading="lazy"
        />
    );
};
