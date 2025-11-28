import React from 'react';
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
