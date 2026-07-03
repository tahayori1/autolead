
import React, { useState, useRef } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { UploadIcon } from './icons/UploadIcon';
import { importZeroCarDeliveryExcel } from '../services/api';
import Spinner from './Spinner';

interface ExcelUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
            setError(null);
            setSuccessMessage(null);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                setSelectedFile(file);
                setError(null);
                setSuccessMessage(null);
            } else {
                setError('لطفاً فقط فایل اکسل (xlsx یا xls) آپلود کنید.');
            }
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('لطفاً یک فایل انتخاب کنید.');
            return;
        }

        setIsUploading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            await importZeroCarDeliveryExcel(selectedFile);
            setSuccessMessage('فایل با موفقیت آپلود شد.');
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطا در آپلود فایل');
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <UploadIcon className="w-6 h-6 text-green-600" />
                        آپلود فایل اکسل
                    </h3>
                    <button onClick={onClose}><CloseIcon className="text-slate-500" /></button>
                </div>

                <div className="space-y-6">
                    <div 
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                            selectedFile ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-sky-500 dark:hover:border-sky-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept=".xlsx, .xls" 
                            onChange={handleFileChange} 
                        />
                        
                        {selectedFile ? (
                            <div className="flex flex-col items-center">
                                <span className="bg-green-100 text-green-700 p-3 rounded-full mb-3">
                                    <UploadIcon className="w-8 h-8" />
                                </span>
                                <p className="font-bold text-slate-700 dark:text-slate-200">{selectedFile.name}</p>
                                <p className="text-xs text-slate-500 mt-1">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <span className="bg-slate-100 dark:bg-slate-700 text-slate-400 p-3 rounded-full mb-3">
                                    <UploadIcon className="w-8 h-8" />
                                </span>
                                <p className="font-bold text-slate-700 dark:text-slate-200">فایل را اینجا رها کنید</p>
                                <p className="text-sm text-slate-500 mt-1">یا برای انتخاب کلیک کنید</p>
                                <p className="text-xs text-slate-400 mt-2">فرمت‌های مجاز: xlsx, xls</p>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm text-center font-medium">
                            {successMessage}
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={onClose} 
                            className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                            disabled={isUploading}
                        >
                            انصراف
                        </button>
                        <button 
                            onClick={handleUpload} 
                            disabled={!selectedFile || isUploading}
                            className="px-8 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed shadow-lg shadow-green-200 dark:shadow-none transition-all flex items-center justify-center min-w-[120px]"
                        >
                            {isUploading ? <Spinner /> : 'آپلود'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExcelUploadModal;
