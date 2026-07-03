import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { Plus, Clock, AlertCircle } from 'lucide-react';

interface AddCustomPriceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payload: {
        source_name: 'custom';
        model_name: string;
        price_rial: number;
        price_text: string;
        captured_at: string;
    }) => Promise<void>;
    existingModels: string[];
}

const formatMySQLDateTime = (date: Date): string => {
    const pad = (num: number) => String(num).padStart(2, '0');
    const yyyy = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
};

const convertToPersianWords = (tomanAmount: number): string => {
    if (!tomanAmount) return '';
    if (tomanAmount < 1000) return `${tomanAmount} تومان`;
    
    const billion = Math.floor(tomanAmount / 1000000000);
    const million = Math.floor((tomanAmount % 1000000000) / 1000000);
    const thousand = Math.floor((tomanAmount % 1000000) / 1000);
    
    let text = '';
    if (billion > 0) {
        text += `${billion} میلیارد`;
    }
    if (million > 0) {
        if (text) text += ' و ';
        text += `${million} میلیون`;
    }
    if (thousand > 0) {
        if (text) text += ' و ';
        text += `${thousand} هزار`;
    }
    text += ' تومان';
    return text;
};

const toEnglishDigits = (str: string): string => {
    const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
    const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
    let res = str;
    for (let i = 0; i < 10; i++) {
        res = res.replace(persianDigits[i], String(i)).replace(arabicDigits[i], String(i));
    }
    return res;
};

const AddCustomPriceModal: React.FC<AddCustomPriceModalProps> = ({ isOpen, onClose, onSubmit, existingModels }) => {
    const [modelName, setModelName] = useState('');
    const [isCustomModel, setIsCustomModel] = useState(false);
    const [customModelText, setCustomModelText] = useState('');
    const [priceToman, setPriceToman] = useState<number | ''>('');
    const [priceText, setPriceText] = useState('');
    const [capturedAt, setCapturedAt] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Default model name
            if (existingModels.length > 0) {
                setModelName(existingModels[0]);
                setIsCustomModel(false);
            } else {
                setIsCustomModel(true);
            }
            setCustomModelText('');
            setPriceToman('');
            setPriceText('');
            // Set current time
            setCapturedAt(formatMySQLDateTime(new Date()));
            setError(null);
        }
    }, [isOpen, existingModels]);

    // Format display and auto-generate words when Price Toman changes
    const handlePriceChange = (valStr: string) => {
        const engStr = toEnglishDigits(valStr);
        const cleanVal = engStr.replace(/[^0-9]/g, '');
        if (!cleanVal) {
            setPriceToman('');
            setPriceText('');
            return;
        }
        const val = parseInt(cleanVal, 10);
        setPriceToman(val);
        const words = convertToPersianWords(val);
        setPriceText(words);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const selectedModel = isCustomModel ? customModelText.trim() : modelName;
        if (!selectedModel) {
            setError('لطفاً نام یا مدل خودرو را وارد کنید.');
            return;
        }

        if (!priceToman || priceToman <= 0) {
            setError('لطفاً قیمت معتبر وارد کنید.');
            return;
        }

        if (!capturedAt.trim()) {
            setError('لطفاً تاریخ و زمان را وارد کنید.');
            return;
        }

        setSubmitting(true);
        try {
            await onSubmit({
                source_name: 'custom',
                model_name: selectedModel,
                price_rial: priceToman * 10, // Toman to Rial (Toman * 10 = Rial)
                price_text: priceText || `${priceToman.toLocaleString('fa-IR')} تومان`,
                captured_at: capturedAt
            });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'ناموفق در ثبت فایل قیمت گذاری');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[60] p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                        <Plus className="w-5 h-5 text-sky-500" />
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">ثبت دستی قیمت خودرو</h3>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <CloseIcon className="text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleFormSubmit} className="flex-1 p-6 space-y-5 overflow-y-auto">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-300 text-sm">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Model Selection */}
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-sm font-bold text-slate-600 dark:text-slate-300">مدل خودرو</label>
                            {existingModels.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setIsCustomModel(!isCustomModel)}
                                    className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold"
                                >
                                    {isCustomModel ? 'انتخاب از لیست مدل‌های موجود' : 'تعریف خودروی جدید (وارد کردن تایپی)'}
                                </button>
                            )}
                        </div>

                        {isCustomModel ? (
                            <input
                                type="text"
                                value={customModelText}
                                onChange={e => setCustomModelText(e.target.value)}
                                placeholder="مثلاً: جک اس ۵ جدید"
                                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 dark:text-white text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 transition-all outline-none"
                                required
                            />
                        ) : (
                            <select
                                value={modelName}
                                onChange={e => setModelName(e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 dark:text-white text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 transition-all outline-none"
                            >
                                {existingModels.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Price Input (Toman) */}
                    <div>
                        <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-1.5">قیمت (تومان)</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={priceToman === '' ? '' : priceToman.toLocaleString('fa-IR')}
                                onChange={e => handlePriceChange(e.target.value)}
                                placeholder="مثلاً: ۶۲۰,۰۰۰,۰۰۰"
                                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 dark:text-white font-mono text-left focus:bg-white focus:ring-2 focus:ring-sky-500 text-lg transition-all outline-none"
                                required
                                dir="ltr"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">تومان</span>
                        </div>
                        {priceToman !== '' && priceToman > 0 && (
                            <p className="mt-2 text-xs text-sky-600 dark:text-sky-400 font-bold bg-sky-50 dark:bg-sky-950/20 px-3 py-2 rounded-lg leading-relaxed border border-sky-100 dark:border-sky-900/30">
                                {priceText}
                            </p>
                        )}
                        <p className="mt-1 text-[10px] text-slate-400">قیمت به صورت اتوماتیک در دیتابیس به ریال تبدیل می‌شود.</p>
                    </div>

                    {/* Price Text Input (Dynamic text payload field) */}
                    <div>
                        <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-1.5">متن نمایشی قیمت</label>
                        <input
                            type="text"
                            value={priceText}
                            onChange={e => setPriceText(e.target.value)}
                            placeholder="۶۲۰ میلیون تومان"
                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 dark:text-white text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 transition-all outline-none"
                            required
                        />
                    </div>

                    {/* Datetime (Captured At) */}
                    <div>
                        <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                            <Clock className="w-4 h-4 text-slate-400" />
                            تاریخ و زمان ثبت قیمت گذاری
                        </label>
                        <input
                            type="text"
                            value={capturedAt}
                            onChange={e => setCapturedAt(e.target.value)}
                            placeholder="YYYY-MM-DD HH:MM:SS"
                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 dark:text-white font-mono text-left text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 transition-all outline-none"
                            required
                            dir="ltr"
                        />
                    </div>
                </form>

                <div className="p-6 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
                    >
                        انصراف
                    </button>
                    <button
                        type="button"
                        onClick={handleFormSubmit}
                        disabled={submitting}
                        className="px-6 py-2.5 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 shadow-lg shadow-sky-100 dark:shadow-none transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {submitting ? 'در حال ثبت...' : 'ثبت قطعی قیمت'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddCustomPriceModal;
