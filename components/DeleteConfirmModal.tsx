import React from 'react';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                    <p className="mt-2 text-sm text-slate-600">
                        {message}
                    </p>
                </div>
                <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors"
                    >
                        انصراف
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        حذف
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;
