import React, { useState } from 'react';

interface FailReasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string, explanation: string) => void;
}

const PREDEFINED_REASONS = [
    "قیمت بالا / عدم توافق مالی روی جزئیات معامله",
    "انصراف مشتری از خرید خودرو / تغییر تصمیم",
    "خرید از رقیب یا همکار دیگر",
    "عدم تایید خودرو در کارشناسی فنی و بدنه",
    "عدم تامین نقدینگی / عدم موافقت با شرایط پرداخت",
    "عدم پاسخگویی مشتری به تماس‌ها و پیگیری‌های مکرر",
    "یافتن مورد مناسب‌تر در بازار آزاد",
    "سایر دلایل"
];

const FailReasonModal: React.FC<FailReasonModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [selectedReason, setSelectedReason] = useState<string>('');
    const [customReason, setCustomReason] = useState<string>('');
    const [explanation, setExplanation] = useState<string>('');
    const [error, setError] = useState<string>('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!selectedReason) {
            setError('لطفاً یکی از دلایل شکست معامله را انتخاب کنید.');
            return;
        }

        let finalReason = selectedReason;
        if (selectedReason === 'سایر دلایل') {
            if (!customReason.trim()) {
                setError('لطفاً علت شکست دلخواه خود را بنویسید.');
                return;
            }
            finalReason = customReason.trim();
        }

        onSubmit(finalReason, explanation.trim());
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-[999] p-4" onClick={onClose}>
            <div 
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]" 
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                    <div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <span className="text-red-500 text-lg">⚠️</span>
                            ثبت علت شکست معامله (معامله ناموفق)
                        </h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                            لطفاً دلیل ناموفق شدن این معامله را جهت تحلیل‌های بازاریابی و بهبود فروش مشخص کنید.
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/40 rounded-xl text-xs font-bold">
                            {error}
                        </div>
                    )}

                    {/* Predefined reasons list */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            انتخاب دلیل شکست معامله:
                        </label>
                        <div className="grid grid-cols-1 gap-2 max-h-[30vh] overflow-y-auto pr-1">
                            {PREDEFINED_REASONS.map((reason) => {
                                const isSelected = selectedReason === reason;
                                return (
                                    <label
                                        key={reason}
                                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all text-xs font-medium ${
                                            isSelected
                                                ? 'bg-red-50/55 dark:bg-red-950/20 border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200 ring-1 ring-red-300 dark:ring-red-900/40'
                                                : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="failReason"
                                            checked={isSelected}
                                            onChange={() => {
                                                setSelectedReason(reason);
                                                setError('');
                                            }}
                                            className="mt-0.5 rounded-full text-red-600 focus:ring-red-500 border-slate-300 dark:border-slate-700 w-4 h-4 flex-shrink-0"
                                        />
                                        <span>{reason}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Custom reason input (Visible if "سایر دلایل" is selected) */}
                    {selectedReason === 'سایر دلایل' && (
                        <div className="space-y-1.5 animate-fadeIn">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                علت شکست معامله شما چیست؟ <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                placeholder="مثال: نپسندیدن آپشن‌های خودرو توسط همسر خریدار"
                                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-755 rounded-xl dark:bg-slate-850 dark:text-white outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 font-medium"
                                required
                            />
                        </div>
                    )}

                    {/* Additional explanations */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            توضیحات تکمیلی و جزئیات بیشتر (اختیاری):
                        </label>
                        <textarea
                            value={explanation}
                            onChange={(e) => setExplanation(e.target.value)}
                            placeholder="توضیحات بیشتری درباره دلیل از دست رفتن معامله بنویسید..."
                            rows={3}
                            className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-755 rounded-xl dark:bg-slate-850 dark:text-white outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 font-medium"
                        />
                    </div>
                </form>

                {/* Footer Buttons */}
                <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end gap-3 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                    >
                        انصراف
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="px-6 py-2 text-xs font-black bg-red-600 text-white rounded-xl hover:bg-red-700 transition shadow-sm"
                    >
                        ثبت شکست معامله
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FailReasonModal;
